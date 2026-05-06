from __future__ import annotations

import json
from typing import Any

from migration_agent.ai.provider import AiConfig, ask_ai


def build_change_plan(analysis: dict[str, Any], rules: dict[str, Any]) -> list[dict[str, Any]]:
    plan: list[dict[str, Any]] = []
    structural_files = _structural_files(analysis)

    target_rule = rules.get("targetFrameworkChange")
    if target_rule:
        framework_files = [file for file in structural_files if file.endswith(".csproj")]
        if not framework_files:
            framework_files = ["**/*.csproj"]
        plan.append(
            {
                "type": "framework",
                "priority": 1,
                "file": framework_files[0] if len(framework_files) == 1 else "**/*.csproj",
                "find": target_rule["from"],
                "replace": target_rule["to"],
                "description": f"Update target framework {target_rule['from']} to {target_rule['to']}.",
            }
        )

    manifest_packages = _manifest_packages(analysis)
    for package in rules.get("packageChanges", []):
        if manifest_packages and package["name"] not in manifest_packages:
            continue
        plan.append(
            {
                "type": "package",
                "priority": 2,
                "description": f"Upgrade {package['name']} to {package['toVersion']}.",
                **package,
            }
        )

    return sorted(plan, key=lambda item: item["priority"])


async def build_migration_plan(
    analysis: dict[str, Any],
    rules: dict[str, Any],
    ai_config: AiConfig | None = None,
) -> list[dict[str, Any]]:
    deterministic_plan = build_change_plan(analysis, rules)
    ai_plan = await ask_ai(
        ai_config or AiConfig(),
        system=_build_planning_prompt(),
        user=json.dumps(
            {
                "rules": rules,
                "analysis": analysis,
                "deterministicPlan": deterministic_plan,
                "requiredResponseShape": {
                    "plan": [],
                    "planningSummary": "short summary of why these structural changes are needed",
                },
            },
            indent=2,
        ),
    )
    if ai_plan is None:
        analysis["planningMode"] = "rule-based"
        return deterministic_plan

    validated_ai_plan = _validate_ai_plan(ai_plan.get("plan", []), analysis, rules)
    if not validated_ai_plan:
        analysis["planningMode"] = "rule-based"
        analysis["planningNotes"] = "AI planner returned no executable structural changes; used deterministic plan."
        return deterministic_plan

    analysis["planningMode"] = (ai_config.provider if ai_config else "ai") or "ai"
    analysis["planningNotes"] = ai_plan.get("planningSummary", "")
    return _merge_plans(validated_ai_plan, deterministic_plan)


def _build_planning_prompt() -> str:
    return """
You are a senior software migration planner.

Create a SAFE executable migration plan from the supplied rules, manifest, and analysis.

STRICT RULES:
1. Return only valid JSON using the requested response shape.
2. Plan only structural changes that match the supplied migration rules.
3. Allowed executable change types are:
   - framework
   - package
4. Do not plan source-code edits or business-logic edits.
5. Do not plan changes to .cs, .java, .py, .js, .ts, .cpp, or .go files.
6. Prefer the smallest plan that upgrades the project structure successfully.
7. If unsure, return an empty plan.

For framework changes, use:
{"type":"framework","priority":1,"file":"path or **/*.csproj","find":"old framework","replace":"new framework","description":"..."}

For package changes, use:
{"type":"package","priority":2,"name":"package name","fromVersion":"old version/range","toVersion":"new version","action":"upgrade","description":"..."}

Do not include markdown, comments, or text outside JSON.
""".strip()


def _validate_ai_plan(plan: Any, analysis: dict[str, Any], rules: dict[str, Any]) -> list[dict[str, Any]]:
    if not isinstance(plan, list):
        return []

    validated: list[dict[str, Any]] = []
    for item in plan:
        if not isinstance(item, dict):
            continue
        if item.get("type") == "framework":
            framework = _validate_framework_change(item, analysis, rules)
            if framework:
                validated.append(framework)
        elif item.get("type") == "package":
            package = _validate_package_change(item, analysis, rules)
            if package:
                validated.append(package)

    return sorted(validated, key=lambda item: item["priority"])


def _validate_framework_change(
    item: dict[str, Any],
    analysis: dict[str, Any],
    rules: dict[str, Any],
) -> dict[str, Any] | None:
    target_rule = rules.get("targetFrameworkChange")
    if not target_rule:
        return None
    if item.get("find") != target_rule.get("from") or item.get("replace") != target_rule.get("to"):
        return None

    file_name = item.get("file")
    allowed_files = set(_structural_files(analysis))
    if file_name != "**/*.csproj" and file_name not in allowed_files:
        return None
    if isinstance(file_name, str) and _is_source_code_file(file_name):
        return None

    return {
        "type": "framework",
        "priority": 1,
        "file": file_name,
        "find": target_rule["from"],
        "replace": target_rule["to"],
        "description": item.get(
            "description",
            f"Update target framework {target_rule['from']} to {target_rule['to']}.",
        ),
    }


def _validate_package_change(
    item: dict[str, Any],
    analysis: dict[str, Any],
    rules: dict[str, Any],
) -> dict[str, Any] | None:
    rule_by_name = {package["name"]: package for package in rules.get("packageChanges", [])}
    package_name = item.get("name")
    package_rule = rule_by_name.get(package_name)
    if not package_rule:
        return None

    manifest_packages = _manifest_packages(analysis)
    if manifest_packages and package_name not in manifest_packages:
        return None

    return {
        "type": "package",
        "priority": 2,
        "description": item.get("description", f"Upgrade {package_name} to {package_rule['toVersion']}."),
        **package_rule,
    }


def _merge_plans(preferred: list[dict[str, Any]], fallback: list[dict[str, Any]]) -> list[dict[str, Any]]:
    merged: list[dict[str, Any]] = []
    seen: set[tuple[Any, ...]] = set()
    for item in [*preferred, *fallback]:
        key = _plan_key(item)
        if key in seen:
            continue
        seen.add(key)
        merged.append(item)
    return sorted(merged, key=lambda item: item["priority"])


def _plan_key(item: dict[str, Any]) -> tuple[Any, ...]:
    if item.get("type") == "package":
        return ("package", item.get("name"), item.get("toVersion"))
    if item.get("type") == "framework":
        return ("framework", item.get("file"), item.get("find"), item.get("replace"))
    return (item.get("type"), item.get("description"))


def _structural_files(analysis: dict[str, Any]) -> list[str]:
    manifest = analysis.get("manifest", {})
    return [
        project["path"]
        for project in manifest.get("projects", [])
        if isinstance(project.get("path"), str) and _is_structural_file(project["path"])
    ]


def _manifest_packages(analysis: dict[str, Any]) -> set[str]:
    manifest = analysis.get("manifest", {})
    packages: set[str] = set()
    for project in manifest.get("projects", []):
        for package in project.get("packages", []):
            name = package.get("name")
            if name:
                packages.add(name)
    return packages


def _is_structural_file(file_name: str) -> bool:
    return file_name.endswith(
        (
            ".csproj",
            ".sln",
            "pom.xml",
            "build.gradle",
            "build.gradle.kts",
            "package.json",
            "pyproject.toml",
            "requirements.txt",
        )
    )


def _is_source_code_file(file_name: str) -> bool:
    return file_name.endswith((".cs", ".java", ".py", ".js", ".ts", ".cpp", ".go"))
