from __future__ import annotations

import json
import re
from typing import Any

from migration_agent.ai.provider import AiConfig, ask_ai

AI_PACKAGE_EVIDENCE = {"manifest", "dependency-family", "NU1605", "target-framework"}


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
                "source": "rule",
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
                **package,
                "source": "rule",
                "description": f"Upgrade {package['name']} to {package['toVersion']}.",
            }
        )

    return _sort_plan(plan)


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
    current_plan = _merge_plans(validated_ai_plan, deterministic_plan)
    inferred = await infer_related_package_upgrades_with_ai(analysis, rules, current_plan, None, ai_config)
    return _merge_plans(current_plan, inferred)


def _build_planning_prompt() -> str:
    return """
You are a senior software migration planner.

Create a SAFE executable migration plan from the supplied rules, manifest, and analysis.

STRICT RULES:
1. Return only valid JSON using the requested response shape.
2. Plan only structural project-file changes.
3. Allowed executable change types are:
   - framework
   - package
4. Do not plan source-code edits or business-logic edits.
5. Do not plan changes to .cs, .java, .py, .js, .ts, .cpp, or .go files.
6. Do not plan changes to controllers, services, DTOs, entities, method bodies, or domain/business logic.
7. Framework changes must match targetFrameworkChange exactly.
8. Package changes may include:
   - packages explicitly listed in packageChanges
   - already-installed packages that are needed for target-framework or dependency compatibility
   - already-installed packages needed to resolve restore/build dependency downgrade conflicts
9. Do not add new packages unless packageChanges explicitly requires them.
10. Do not remove packages unless packageChanges explicitly requires it.
11. Do not downgrade packages.
12. Prefer the smallest plan that upgrades the project structure successfully.
13. If unsure, return an empty plan.

For framework changes, use:
{"type":"framework","priority":1,"file":"path or **/*.csproj","find":"old framework","replace":"new framework","description":"..."}

For package changes, use:
{"type":"package","priority":2,"name":"package name","fromVersion":"old version/range","toVersion":"new version","action":"upgrade","description":"...","reason":"...","evidence":"manifest|dependency-family|NU1605|target-framework"}

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

    return _sort_plan(validated)


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
        "source": "ai",
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
    if not isinstance(package_name, str) or not package_name.strip():
        return None

    package_rule = rule_by_name.get(package_name)
    manifest_versions = _manifest_package_versions(analysis)

    if package_rule:
        manifest_packages = set(manifest_versions)
        if manifest_packages and package_name not in manifest_packages:
            return None

        return {
            "type": "package",
            "priority": 2,
            **package_rule,
            "source": "ai",
            "description": item.get("description", f"Upgrade {package_name} to {package_rule['toVersion']}."),
        }

    return _validate_ai_inferred_package_change(
        item,
        package_name,
        manifest_versions,
        analysis,
        current_plan=[],
        validation_output=None,
        source="ai",
    )


def _validate_ai_inferred_package_change(
    item: dict[str, Any],
    package_name: str,
    manifest_versions: dict[str, str],
    analysis: dict[str, Any],
    current_plan: list[dict[str, Any]],
    validation_output: str | None,
    source: str,
) -> dict[str, Any] | None:
    if package_name not in manifest_versions:
        return None
    if item.get("action") != "upgrade":
        return None

    to_version = item.get("toVersion")
    if not _is_safe_target_version(to_version):
        return None

    from_version = manifest_versions.get(package_name, "")
    if from_version and _is_obvious_downgrade_or_noop(from_version, to_version):
        return None
    if not _has_package_upgrade_evidence(item, package_name, analysis, current_plan, validation_output):
        return None

    return {
        "type": "package",
        "priority": 2,
        "name": package_name,
        "fromVersion": from_version,
        "toVersion": to_version,
        "action": "upgrade",
        "source": source,
        "reason": item.get("reason", item.get("description", "")),
        "evidence": item.get("evidence"),
        "description": item.get(
            "description",
            f"Upgrade {package_name} for compatibility with the target framework.",
        ),
    }


async def infer_related_package_upgrades_with_ai(
    analysis: dict[str, Any],
    rules: dict[str, Any],
    current_plan: list[dict[str, Any]],
    validation_output: str | None,
    ai_config: AiConfig | None = None,
) -> list[dict[str, Any]]:
    ai_result = await ask_ai(
        ai_config or AiConfig(),
        system=_build_package_inference_prompt(),
        user=json.dumps(
            {
                "manifestPackages": _manifest_package_versions(analysis),
                "targetFrameworkChange": rules.get("targetFrameworkChange"),
                "currentPlan": current_plan,
                "validationOutput": validation_output,
                "nu1605Downgrades": _parse_nu1605_downgrades(validation_output or ""),
                "requiredResponseShape": {
                    "packageUpgrades": [
                        {
                            "type": "package",
                            "name": "package name already present in manifest",
                            "fromVersion": "current version",
                            "toVersion": "safe target version",
                            "action": "upgrade",
                            "reason": "short reason",
                            "evidence": "manifest | dependency-family | NU1605 | target-framework",
                        }
                    ],
                    "summary": "short summary",
                },
            },
            indent=2,
        ),
    )
    if ai_result is None:
        return []

    manifest_versions = _manifest_package_versions(analysis)
    source = "ai-validation-repair" if validation_output else "ai-inferred"
    inferred: list[dict[str, Any]] = []
    existing_keys = {_plan_key(item) for item in current_plan}
    for item in ai_result.get("packageUpgrades", []):
        if not isinstance(item, dict):
            continue
        package_name = item.get("name")
        if not isinstance(package_name, str) or not package_name.strip():
            continue
        change = _validate_ai_inferred_package_change(
            item,
            package_name,
            manifest_versions,
            analysis,
            current_plan,
            validation_output,
            source,
        )
        if not change:
            continue
        key = _plan_key(change)
        if key in existing_keys:
            continue
        existing_keys.add(key)
        inferred.append(change)

    return _sort_plan(inferred)


def _build_package_inference_prompt() -> str:
    return """
You are a package compatibility planner for a structural migration.

Infer only package upgrades that are necessary for target-framework compatibility, dependency alignment, or restore/build downgrade repair.

STRICT RULES:
1. Return only valid JSON using the requested response shape.
2. Only suggest packages already present in manifestPackages.
3. Do not add packages.
4. Do not remove packages.
5. Do not downgrade packages.
6. Do not suggest source-code, controller, service, DTO, entity, method-body, or business-logic changes.
7. Package upgrades must use concrete versions, not wildcards.
8. Evidence must be one of: manifest, dependency-family, NU1605, target-framework.
9. If validation output includes NU1605, prefer only upgrades directly required by that output.
10. If unsure, return an empty packageUpgrades list.

Return no markdown, comments, or text outside JSON.
""".strip()


async def repair_package_downgrades_from_validation(
    validation: dict[str, Any],
    analysis: dict[str, Any],
    plan: list[dict[str, Any]],
    rules: dict[str, Any],
    ai_config: AiConfig | None = None,
) -> list[dict[str, Any]]:
    output = validation.get("errors") or validation.get("output") or ""
    downgrades = _parse_nu1605_downgrades(output)
    if not downgrades:
        return []
    return await infer_related_package_upgrades_with_ai(analysis, rules, plan, output, ai_config)


def _parse_nu1605_downgrades(output: str) -> list[dict[str, str]]:
    downgrades: list[dict[str, str]] = []
    pattern = re.compile(
        r"NU1605:.*?Detected package downgrade:\s+"
        r"(?P<name>[A-Za-z0-9_.-]+)\s+from\s+"
        r"(?P<required>[0-9A-Za-z][0-9A-Za-z.+-]*)\s+to\s+"
        r"(?P<current>[0-9A-Za-z][0-9A-Za-z.+-]*)",
        flags=re.IGNORECASE | re.DOTALL,
    )
    for match in pattern.finditer(output):
        downgrades.append(
            {
                "name": match.group("name"),
                "requiredVersion": _clean_version_token(match.group("required")),
                "currentVersion": _clean_version_token(match.group("current")),
            }
        )
    return downgrades


def _clean_version_token(version: str) -> str:
    return version.rstrip(".,;:)")


def _merge_plans(preferred: list[dict[str, Any]], fallback: list[dict[str, Any]]) -> list[dict[str, Any]]:
    merged: list[dict[str, Any]] = []
    seen: set[tuple[Any, ...]] = set()
    for item in [*preferred, *fallback]:
        key = _plan_key(item)
        if key in seen:
            continue
        seen.add(key)
        merged.append(item)
    return _sort_plan(merged)


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
    return set(_manifest_package_versions(analysis))


def _manifest_package_versions(analysis: dict[str, Any]) -> dict[str, str]:
    manifest = analysis.get("manifest", {})
    packages: dict[str, str] = {}
    for project in manifest.get("projects", []):
        for package in project.get("packages", []):
            name = package.get("name")
            if not name:
                continue
            version = package.get("version") or package.get("Version") or package.get("fromVersion") or ""
            packages[name] = str(version)
    return packages


def _has_package_upgrade_evidence(
    item: dict[str, Any],
    package_name: str,
    analysis: dict[str, Any],
    current_plan: list[dict[str, Any]],
    validation_output: str | None,
) -> bool:
    reason = item.get("reason") or item.get("description")
    evidence = item.get("evidence")
    if not isinstance(reason, str) or not reason.strip():
        return False
    if evidence not in AI_PACKAGE_EVIDENCE:
        return False

    if evidence == "NU1605":
        return package_name in {downgrade["name"] for downgrade in _parse_nu1605_downgrades(validation_output or "")}
    if validation_output and package_name in validation_output:
        return True
    if evidence == "dependency-family":
        return _has_package_plan_context(current_plan)
    if evidence in {"manifest", "target-framework"}:
        return _aligns_with_framework_major_version(item.get("fromVersion"), item.get("toVersion"), analysis)
    return False


def _has_package_plan_context(current_plan: list[dict[str, Any]]) -> bool:
    return any(item.get("type") == "package" for item in current_plan)


def _aligns_with_framework_major_version(from_version: Any, to_version: Any, analysis: dict[str, Any]) -> bool:
    current = _version_prefix(str(from_version or ""))
    target = _version_prefix(str(to_version or ""))
    from_framework = _framework_major_version(str(analysis.get("from", "")))
    to_framework = _framework_major_version(str(analysis.get("to", "")))
    if not current or not target or from_framework is None or to_framework is None:
        return False
    return current[0] == from_framework and target[0] == to_framework


def _framework_major_version(value: str) -> int | None:
    match = re.search(r"(\d+)(?:\.\d+)?", value)
    return int(match.group(1)) if match else None


def _is_safe_target_version(version: Any) -> bool:
    if not isinstance(version, str):
        return False
    if not version.strip() or version != version.strip():
        return False
    if "*" in version:
        return False
    return bool(re.fullmatch(r"[0-9A-Za-z][0-9A-Za-z.+-]*", version))


def _is_obvious_downgrade_or_noop(from_version: str, to_version: str) -> bool:
    current = _version_prefix(from_version)
    target = _version_prefix(to_version)
    if current is None or target is None:
        return True
    return target <= current


def _version_prefix(version: str) -> tuple[int, ...] | None:
    match = re.match(r"^\s*(\d+(?:\.\d+)*)", version)
    if not match:
        return None
    return tuple(int(part) for part in match.group(1).split("."))


def _sort_plan(plan: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(plan, key=lambda item: (item["priority"], item.get("type", ""), item.get("name", "")))


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
