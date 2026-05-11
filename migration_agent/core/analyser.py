from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from migration_agent.adapters.base import BaseAdapter
from migration_agent.ai.provider import ask_ai
from migration_agent.cli.args import MigrationConfig

MAX_FILE_CHARS = 20_000


async def analyse_project(
    project_path: Path,
    config: MigrationConfig,
    rules: dict[str, Any],
    manifest: dict[str, Any],
    adapter: BaseAdapter | None = None,
) -> dict[str, Any]:
    files = adapter.collect_project_files(project_path) if adapter else collect_project_files(project_path, config.from_spec.runtime)
    ai_analysis = await ask_ai(
        config.ai,
        system=_build_structural_prompt(),
        user=json.dumps(
            {
                "migration": {
                    "runtime": config.from_spec.runtime,
                    "from": config.from_spec.version,
                    "to": config.to_spec.version,
                },
                "rules": rules,
                "manifest": manifest,
                "projectFiles": files,
                "requiredResponseShape": {
                    "findings": [],
                    "riskLevel": "low|medium|high",
                    "confidence": "0-100",
                },
            },
            indent=2,
        ),
    )
    if ai_analysis is not None:
        ai_analysis.setdefault("analysisMode", config.ai.provider or "ai")
        ai_analysis.setdefault("manifest", manifest)
        return _normalize_analysis(ai_analysis, config)

    return _rule_based_analysis(project_path, config, rules, manifest, files)


def _build_structural_prompt() -> str:
    return """
You are a senior software migration engineer working across multiple programming languages (e.g., .NET, Java, Python, Node.js).

Your responsibility is to generate a SAFE migration analysis that ONLY modifies the OUTER STRUCTURE of a project.

STRICT RULES (NON-NEGOTIABLE):

1. You MUST NOT modify business logic.
2. You MUST NOT suggest any changes inside source code files such as:
   - .cs, .java, .py, .js, .ts, .cpp, .go
3. You MUST NOT suggest:
   - API replacements
   - method changes
   - class refactoring
   - logic updates

4. You are ONLY allowed to suggest STRUCTURAL changes, including:
   - runtime/framework upgrades
   - dependency/package version upgrades
   - project configuration updates
   - build configuration changes

5. All changes must be:
   - minimal
   - safe
   - backward-compatible when possible

6. If a required migration step involves modifying code, you MUST IGNORE it.

7. If you are unsure, return findings as an empty list.

Return only valid JSON using the requested response shape. Do not include explanations, comments, markdown, or text outside JSON.
""".strip()


def collect_project_files(project_path: Path, runtime: str) -> dict[str, str]:
    if runtime != "dotnet":
        return {}

    patterns = [
        "*.sln",
        "*.csproj",
        "Directory.Build.props",
        "Directory.Build.targets",
        "global.json",
        "NuGet.config",
        "appsettings*.json",
    ]
    collected: dict[str, str] = {}
    for pattern in patterns:
        for file_path in sorted(project_path.rglob(pattern)):
            if any(part in {"bin", "obj", ".git"} for part in file_path.parts):
                continue
            try:
                text = file_path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            collected[str(file_path.relative_to(project_path))] = text[:MAX_FILE_CHARS]
    return collected


def _rule_based_analysis(
    project_path: Path,
    config: MigrationConfig,
    rules: dict[str, Any],
    manifest: dict[str, Any],
    files: dict[str, str],
) -> dict[str, Any]:
    findings: list[dict[str, Any]] = []

    target_rule = rules.get("targetFrameworkChange")
    for project in manifest.get("projects", []):
        if target_rule and target_rule["from"] in project.get("targetFrameworks", []):
            findings.append(
                {
                    "type": "targetFramework",
                    "file": project["path"],
                    "old": target_rule["from"],
                    "new": target_rule["to"],
                    "description": f"Update {project['path']} target framework.",
                }
            )

    risk = "low"
    return _normalize_analysis(
        {
            "from": f"{config.from_spec.runtime}{config.from_spec.version}",
            "to": f"{config.to_spec.runtime}{config.to_spec.version}",
            "findings": findings,
            "manifest": manifest,
            "riskLevel": risk,
            "confidence": 80,
            "analysisMode": "rule-based",
        },
        config,
    )


def _normalize_analysis(analysis: dict[str, Any], config: MigrationConfig) -> dict[str, Any]:
    analysis.setdefault("from", f"{config.from_spec.runtime}{config.from_spec.version}")
    analysis.setdefault("to", f"{config.to_spec.runtime}{config.to_spec.version}")
    analysis.setdefault("findings", [])
    analysis.setdefault("riskLevel", "medium")
    analysis.setdefault("confidence", 50)
    return analysis
