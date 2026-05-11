from __future__ import annotations

import json
import re
from copy import deepcopy
from typing import Any

from migration_agent.ai.provider import AiConfig, ask_ai

DEPENDENCY_EVIDENCE = {
    "manifest",
    "dependency-family",
    "validation",
    "target-framework",
    "target-runtime",
    "restore-error",
    "build-error",
    "NU1605",
}
AI_PACKAGE_EVIDENCE = DEPENDENCY_EVIDENCE

FILE_ROLES = {"project_manifest","dependency_manifest","build_manifest","solution_manifest","lock_file","source_code","test_code",
    "configuration","documentation","generated_file","business_logic","unknown"}

STRUCTURAL_FILE_ROLES = {"project_manifest","dependency_manifest","build_manifest","solution_manifest","lock_file",}

BLOCKED_FILE_ROLES = {"source_code", "business_logic", "configuration", "generated_file", "unknown"}

CHANGE_TYPES = {"framework","runtime","dependency","package","build_setting","project_reference","script","regenerate_lock_file",

}
DISCOVERY_FILE_ROLE_FALLBACKS = {
    ".csproj": ("project_manifest", ["framework", "runtime", "dependency", "package", "build_setting", "project_reference"]),
    ".sln": ("solution_manifest", ["project_reference", "build_setting"]),
    "pom.xml": ("project_manifest", ["framework", "runtime", "dependency", "package", "build_setting"]),
    "build.gradle": ("build_manifest", ["framework", "runtime", "dependency", "package", "build_setting", "script"]),
    "build.gradle.kts": ("build_manifest", ["framework", "runtime", "dependency", "package", "build_setting", "script"]),
    "package.json": ("dependency_manifest", ["runtime", "dependency", "package", "script"]),
    "package-lock.json": ("lock_file", ["regenerate_lock_file"]),
    "pnpm-lock.yaml": ("lock_file", ["regenerate_lock_file"]),
    "yarn.lock": ("lock_file", ["regenerate_lock_file"]),
    "pyproject.toml": ("dependency_manifest", ["runtime", "dependency", "package", "build_setting"]),
    "requirements.txt": ("dependency_manifest", ["dependency", "package"]),
    "go.mod": ("dependency_manifest", ["runtime", "dependency", "package"]),
    "go.sum": ("lock_file", ["regenerate_lock_file"]),
    "Gemfile": ("dependency_manifest", ["runtime", "dependency", "package"]),
    "Gemfile.lock": ("lock_file", ["regenerate_lock_file"]),
}


def build_change_plan(analysis: dict[str, Any], rules: dict[str, Any]) -> list[dict[str, Any]]:
    rules = normalize_dependency_rules(rules)
    plan: list[dict[str, Any]] = []
    _ensure_structure_classification(analysis)
    structural_files = _structural_files(analysis)

    target_rule = rules.get("targetFrameworkChange")
    if target_rule:
        framework_files = [
            file for file in structural_files if _is_allowed_structural_target(file, analysis, "framework")
        ]
        for file_name in framework_files:
            plan.append(
                {
                    "type": "framework",
                    "priority": 1,
                    "source": "rule",
                    "file": file_name,
                    "find": target_rule["from"],
                    "replace": target_rule["to"],
                    "description": f"Update target framework {target_rule['from']} to {target_rule['to']}.",
                }
            )

    manifest_dependencies = _manifest_dependency_versions(analysis)
    for dependency in rules.get("dependencyChanges", []):
        dependency_name = dependency.get("name")
        if manifest_dependencies and dependency_name not in manifest_dependencies:
            continue
        manifest_dependency = manifest_dependencies.get(dependency_name, {})
        source_file = dependency.get("sourceFile") or manifest_dependency.get("sourceFile")
        if source_file and not _is_allowed_structural_target(source_file, analysis, "dependency"):
            continue
        plan.append(
            {
                "type": "dependency",
                "priority": 2,
                **dependency,
                "sourceFile": source_file,
                "manager": dependency.get("manager") or manifest_dependency.get("manager", "unknown"),
                "ecosystem": dependency.get("ecosystem") or manifest_dependency.get("ecosystem", "unknown"),
                "source": "rule",
                "description": f"Upgrade {dependency_name} to {dependency['toVersion']}.",
            }
        )

    return _sort_plan(plan)


async def build_migration_plan(
    analysis: dict[str, Any],
    rules: dict[str, Any],
    ai_config: AiConfig | None = None,
) -> list[dict[str, Any]]:
    normalized_rules = normalize_dependency_rules(rules)
    structure = await classify_project_structure_with_ai(analysis, normalized_rules, ai_config)
    _store_structure_classification(analysis, structure)
    deterministic_plan = build_change_plan(analysis, normalized_rules)
    ai_plan = await ask_ai(
        ai_config or AiConfig(),
        system=_build_planning_prompt(),
        user=json.dumps(
            {
                "rules": normalized_rules,
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

    validated_ai_plan = _validate_ai_plan(ai_plan.get("plan", []), analysis, normalized_rules)
    if not validated_ai_plan:
        analysis["planningMode"] = "rule-based"
        analysis["planningNotes"] = "AI planner returned no executable structural changes; used deterministic plan."
        return deterministic_plan

    analysis["planningMode"] = (ai_config.provider if ai_config else "ai") or "ai"
    analysis["planningNotes"] = ai_plan.get("planningSummary", "")
    current_plan = _merge_plans(validated_ai_plan, deterministic_plan)
    inferred = await infer_related_dependency_upgrades_with_ai(analysis, normalized_rules, current_plan, None, ai_config)
    return _merge_plans(current_plan, inferred)


def normalize_dependency_rules(rules: dict[str, Any]) -> dict[str, Any]:
    normalized = deepcopy(rules)
    if "dependencyChanges" not in normalized and "packageChanges" in normalized:
        normalized["dependencyChanges"] = [
            _normalize_dependency_change_input(item, source="rule")
            for item in normalized.get("packageChanges", [])
            if isinstance(item, dict)
        ]
    elif "dependencyChanges" in normalized:
        normalized["dependencyChanges"] = [
            _normalize_dependency_change_input(item, source="rule")
            for item in normalized.get("dependencyChanges", [])
            if isinstance(item, dict)
        ]
    return normalized


def _normalize_dependency_change_input(item: dict[str, Any], source: str | None = None) -> dict[str, Any]:
    normalized = dict(item)
    if normalized.get("type") == "package" or "type" not in normalized:
        normalized["type"] = "dependency"
    if source and "source" not in normalized:
        normalized["source"] = source
    normalized.setdefault("action", "upgrade")
    normalized.setdefault("manager", "unknown")
    normalized.setdefault("ecosystem", "unknown")
    return normalized


async def classify_project_structure_with_ai(
    analysis: dict[str, Any],
    rules: dict[str, Any],
    ai_config: AiConfig | None = None,
) -> dict[str, Any]:
    fallback = _fallback_structure_classification(analysis)
    ai_result = await ask_ai(
        ai_config or AiConfig(),
        system=_build_structure_classification_prompt(),
        user=json.dumps(
            {
                "discoveredFiles": sorted(_discovered_files(analysis)),
                "manifest": analysis.get("manifest", {}),
                "dependencyData": {
                    "manifestDependencies": _manifest_dependencies(analysis),
                    "manifestPackages": _manifest_package_versions(analysis),
                },
                "targetFrameworkChange": rules.get("targetFrameworkChange"),
                "targetRuntimeChange": rules.get("targetRuntimeChange"),
                "analysis": analysis,
                "rules": rules,
                "fallbackClassification": fallback,
                "requiredResponseShape": {
                    "ecosystems": [
                        {
                            "name": "dotnet | maven | gradle | npm | python | go | ruby | unknown",
                            "languages": [
                                "csharp | java | javascript | typescript | python | go | ruby | unknown"
                            ],
                            "packageManager": "nuget | maven | gradle | npm | yarn | pnpm | pip | poetry | go | bundler | unknown",
                            "confidence": 0.0,
                            "files": [
                                {
                                    "path": "file path",
                                    "role": "project_manifest | dependency_manifest | build_manifest | solution_manifest | lock_file | source_code | test_code | configuration | documentation | generated_file | business_logic | unknown",
                                    "allowedChangeTypes": [
                                        "framework",
                                        "runtime",
                                        "dependency",
                                        "package",
                                        "build_setting",
                                        "project_reference",
                                        "script",
                                        "regenerate_lock_file",
                                    ],
                                    "reason": "short reason",
                                    "confidence": 0.0,
                                }
                            ],
                        }
                    ],
                    "summary": "short summary",
                },
            },
            indent=2,
        ),
    )
    if ai_result is None:
        return fallback
    return _normalize_structure_classification(ai_result, fallback)


def _build_structure_classification_prompt() -> str:
    return """
You are a language-independent project structure classifier.

Classify files by structural role for a safe migration agent. AI can suggest roles, but a deterministic validator will decide what may be changed.

STRICT RULES:
1. Return only valid JSON using the requested response shape.
2. Do not include markdown, comments, or text outside JSON.
3. Mark source files, controllers, services, DTOs, entities, method bodies, domain logic, and application logic as source_code or business_logic.
4. Mark app/runtime settings files as configuration unless they are standard build or dependency manifests.
5. Only assign executable change types that are appropriate for the file role.
6. If unsure about a file, use role unknown with no allowedChangeTypes.
""".strip()


def _build_planning_prompt() -> str:
    return """
You are a senior software migration planner.

Create a SAFE executable migration plan from the supplied rules, manifest, and analysis.

STRICT RULES:
1. Return only valid JSON using the requested response shape.
2. Plan only structural project-file changes.
3. Allowed executable change types are:
   - framework
   - runtime
   - dependency
   - package only for backward compatibility
4. Do not plan source-code edits or business-logic edits.
5. Do not plan changes to source-code files in any language.
6. Do not plan changes to controllers, services, DTOs, entities, method bodies, or domain/business logic.
7. Framework changes must match targetFrameworkChange exactly and target classified project/build manifests.
8. Runtime changes must match targetRuntimeChange exactly and target classified project/build/dependency manifests.
9. Dependency changes may include:
   - dependencies explicitly listed in dependencyChanges
   - already-installed dependencies that are needed for target-framework or dependency compatibility
   - already-installed dependencies needed to resolve restore/build dependency conflicts
10. Do not add new dependencies unless dependencyChanges explicitly requires them.
11. Do not remove dependencies unless dependencyChanges explicitly requires it.
12. Do not downgrade dependencies.
13. Do not modify configuration unless explicit future rules allow it.
14. Prefer the smallest plan that upgrades the project structure successfully.
15. If unsure, return an empty plan.

For framework changes, use:
{"type":"framework","priority":1,"file":"classified manifest path","find":"old framework","replace":"new framework","description":"..."}

For runtime changes, use:
{"type":"runtime","priority":1,"file":"classified manifest path","find":"old runtime","replace":"new runtime","description":"..."}

For dependency changes, use:
{"type":"dependency","priority":2,"name":"dependency name","fromVersion":"old version/range","toVersion":"new version","action":"upgrade","manager":"nuget|maven|gradle|npm|yarn|pnpm|pip|poetry|go|bundler|unknown","ecosystem":"dotnet|java|node|python|go|ruby|unknown","sourceFile":"classified manifest path","description":"...","reason":"...","evidence":"manifest|dependency-family|validation|target-framework|target-runtime|restore-error|build-error|NU1605"}

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
        elif item.get("type") == "runtime":
            runtime = _validate_runtime_change(item, analysis, rules)
            if runtime:
                validated.append(runtime)
        elif item.get("type") in {"dependency", "package"}:
            dependency = _validate_dependency_change(item, analysis, rules)
            if dependency:
                validated.append(dependency)

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
    if not isinstance(file_name, str) or not file_name.strip():
        return None
    if not _is_allowed_structural_target(file_name, analysis, "framework"):
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


def _validate_runtime_change(
    item: dict[str, Any],
    analysis: dict[str, Any],
    rules: dict[str, Any],
) -> dict[str, Any] | None:
    target_rule = rules.get("targetRuntimeChange")
    if not target_rule:
        return None
    if item.get("find") != target_rule.get("from") or item.get("replace") != target_rule.get("to"):
        return None

    file_name = item.get("file")
    if not isinstance(file_name, str) or not file_name.strip():
        return None
    if not _is_allowed_structural_target(file_name, analysis, "runtime"):
        return None

    return {
        "type": "runtime",
        "priority": 1,
        "source": "ai",
        "file": file_name,
        "find": target_rule["from"],
        "replace": target_rule["to"],
        "description": item.get(
            "description",
            f"Update target runtime {target_rule['from']} to {target_rule['to']}.",
        ),
    }


def _validate_dependency_change(
    item: dict[str, Any],
    analysis: dict[str, Any],
    rules: dict[str, Any],
) -> dict[str, Any] | None:
    normalized_item = _normalize_dependency_change_input(item)
    rule_by_name = {dependency["name"]: dependency for dependency in rules.get("dependencyChanges", [])}
    dependency_name = normalized_item.get("name")
    if not isinstance(dependency_name, str) or not dependency_name.strip():
        return None

    dependency_rule = rule_by_name.get(dependency_name)
    manifest_dependencies = _manifest_dependency_versions(analysis)

    if dependency_rule:
        if manifest_dependencies and dependency_name not in manifest_dependencies:
            return None
        manifest_dependency = manifest_dependencies.get(dependency_name, {})
        source_file = dependency_rule.get("sourceFile") or normalized_item.get("sourceFile") or manifest_dependency.get("sourceFile")
        if source_file and not _is_allowed_structural_target(source_file, analysis, "dependency"):
            return None

        return {
            "type": "dependency",
            "priority": 2,
            **dependency_rule,
            "sourceFile": source_file,
            "manager": dependency_rule.get("manager") or manifest_dependency.get("manager", "unknown"),
            "ecosystem": dependency_rule.get("ecosystem") or manifest_dependency.get("ecosystem", "unknown"),
            "source": "ai",
            "description": normalized_item.get("description", f"Upgrade {dependency_name} to {dependency_rule['toVersion']}."),
        }

    return _validate_ai_inferred_dependency_change(
        normalized_item,
        manifest_dependencies,
        analysis,
        current_plan=[],
        validation_output=None,
        source="ai",
    )


def _validate_ai_inferred_dependency_change(
    item: dict[str, Any],
    manifest_dependencies: dict[str, dict[str, Any]],
    analysis: dict[str, Any],
    current_plan: list[dict[str, Any]],
    validation_output: str | None,
    source: str,
) -> dict[str, Any] | None:
    dependency_name = item.get("name")
    if not isinstance(dependency_name, str) or dependency_name not in manifest_dependencies:
        return None
    if item.get("action") != "upgrade":
        return None

    to_version = item.get("toVersion")
    if not _is_safe_target_version(to_version):
        return None

    manifest_dependency = manifest_dependencies[dependency_name]
    if manifest_dependency.get("scope", "direct") != "direct" and not _allows_transitive_dependency_changes(analysis):
        return None
    from_version = str(manifest_dependency.get("version", ""))
    if from_version and _is_obvious_downgrade_or_noop(from_version, to_version):
        if not _validation_requires_version(dependency_name, to_version, validation_output):
            return None
    source_file = item.get("sourceFile") or manifest_dependency.get("sourceFile")
    if not isinstance(source_file, str) or not _is_allowed_structural_target(source_file, analysis, "dependency"):
        return None
    if not _has_dependency_upgrade_evidence(item, dependency_name, analysis, current_plan, validation_output):
        return None

    return {
        "type": "dependency",
        "priority": 2,
        "name": dependency_name,
        "fromVersion": from_version,
        "toVersion": to_version,
        "action": "upgrade",
        "manager": item.get("manager") or manifest_dependency.get("manager", "unknown"),
        "ecosystem": item.get("ecosystem") or manifest_dependency.get("ecosystem", "unknown"),
        "sourceFile": source_file,
        "source": source,
        "reason": item.get("reason", item.get("description", "")),
        "evidence": item.get("evidence"),
        "description": item.get(
            "description",
            f"Upgrade {dependency_name} for compatibility with the target framework.",
        ),
    }


def _validate_package_change(
    item: dict[str, Any],
    analysis: dict[str, Any],
    rules: dict[str, Any],
) -> dict[str, Any] | None:
    return _validate_dependency_change(item, analysis, normalize_dependency_rules(rules))


def _validate_ai_inferred_package_change(
    item: dict[str, Any],
    package_name: str,
    manifest_versions: dict[str, str],
    analysis: dict[str, Any],
    current_plan: list[dict[str, Any]],
    validation_output: str | None,
    source: str,
) -> dict[str, Any] | None:
    manifest_dependencies = {
        name: {
            "name": name,
            "version": version,
            "manager": "nuget",
            "ecosystem": "dotnet",
            "sourceFile": _first_dependency_source_file(analysis, name),
            "scope": "direct",
            "metadata": {},
        }
        for name, version in manifest_versions.items()
    }
    normalized = _normalize_dependency_change_input({**item, "name": package_name})
    return _validate_ai_inferred_dependency_change(
        normalized,
        manifest_dependencies,
        analysis,
        current_plan,
        validation_output,
        source,
    )


async def infer_related_dependency_upgrades_with_ai(
    analysis: dict[str, Any],
    rules: dict[str, Any],
    current_plan: list[dict[str, Any]],
    validation_output: str | None,
    ai_config: AiConfig | None = None,
) -> list[dict[str, Any]]:
    rules = normalize_dependency_rules(rules)
    manifest_dependencies = _manifest_dependency_versions(analysis)
    ai_result = await ask_ai(
        ai_config or AiConfig(),
        system=_build_dependency_inference_prompt(),
        user=json.dumps(
            {
                "manifestDependencies": _manifest_dependencies(analysis),
                "classifiedProjectStructure": analysis.get("structureClassification"),
                "targetFrameworkChange": rules.get("targetFrameworkChange"),
                "targetRuntimeChange": rules.get("targetRuntimeChange"),
                "currentPlan": current_plan,
                "validationOutput": validation_output,
                "dependencyConflicts": _parse_dependency_conflicts(validation_output or "", _primary_ecosystem(analysis)),
                "requiredResponseShape": {
                    "dependencyUpgrades": [
                        {
                            "type": "dependency",
                            "name": "dependency name already present in manifestDependencies",
                            "fromVersion": "current version",
                            "toVersion": "safe target version",
                            "action": "upgrade",
                            "manager": "nuget | maven | gradle | npm | yarn | pnpm | pip | poetry | go | bundler | unknown",
                            "ecosystem": "dotnet | java | node | python | go | ruby | unknown",
                            "sourceFile": "manifest file path",
                            "reason": "short reason",
                            "evidence": "manifest | dependency-family | validation | target-framework | target-runtime | restore-error | build-error | NU1605",
                        }
                    ],
                    "packageUpgrades": "backward-compatible alias accepted; prefer dependencyUpgrades",
                    "summary": "short summary",
                },
            },
            indent=2,
        ),
    )
    if ai_result is None:
        return []

    source = "ai-validation-repair" if validation_output else "ai-inferred"
    inferred: list[dict[str, Any]] = []
    existing_keys = {_plan_key(item) for item in current_plan}
    for item in _dependency_upgrades_from_ai_result(ai_result):
        if not isinstance(item, dict):
            continue
        dependency_name = item.get("name")
        if not isinstance(dependency_name, str) or not dependency_name.strip():
            continue
        change = _validate_ai_inferred_dependency_change(
            _normalize_dependency_change_input(item),
            manifest_dependencies,
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


async def infer_related_package_upgrades_with_ai(
    analysis: dict[str, Any],
    rules: dict[str, Any],
    current_plan: list[dict[str, Any]],
    validation_output: str | None,
    ai_config: AiConfig | None = None,
) -> list[dict[str, Any]]:
    return await infer_related_dependency_upgrades_with_ai(analysis, rules, current_plan, validation_output, ai_config)


def _dependency_upgrades_from_ai_result(ai_result: dict[str, Any]) -> list[Any]:
    if isinstance(ai_result.get("dependencyUpgrades"), list):
        return ai_result["dependencyUpgrades"]
    if isinstance(ai_result.get("packageUpgrades"), list):
        return ai_result["packageUpgrades"]
    return []


def _build_dependency_inference_prompt() -> str:
    return """
You are a dependency compatibility planner for a structural migration.

Infer only dependency upgrades that are necessary for target-framework compatibility, dependency alignment, or restore/build conflict repair.

STRICT RULES:
1. Return only valid JSON using the requested response shape.
2. Only suggest dependencies already present in manifestDependencies.
3. Do not add dependencies.
4. Do not remove dependencies.
5. Do not downgrade dependencies.
6. Do not suggest source-code, controller, service, DTO, entity, method-body, or business-logic changes.
7. Dependency upgrades must use concrete versions, not wildcards.
8. Evidence must be one of: manifest, dependency-family, validation, target-framework, target-runtime, restore-error, build-error, NU1605.
9. If validation output includes dependency conflicts, prefer only upgrades directly required by that output.
10. If unsure, return an empty dependencyUpgrades list.

Return no markdown, comments, or text outside JSON.
""".strip()


def _build_package_inference_prompt() -> str:
    return _build_dependency_inference_prompt()


async def repair_dependency_conflicts_from_validation(
    validation: dict[str, Any],
    analysis: dict[str, Any],
    plan: list[dict[str, Any]],
    rules: dict[str, Any],
    ai_config: AiConfig | None = None,
) -> list[dict[str, Any]]:
    rules = normalize_dependency_rules(rules)
    output = validation.get("errors") or validation.get("output") or ""
    conflicts = _parse_dependency_conflicts(output, _primary_ecosystem(analysis))
    if not conflicts:
        return []
    return await infer_related_dependency_upgrades_with_ai(analysis, rules, plan, output, ai_config)


async def repair_package_downgrades_from_validation(
    validation: dict[str, Any],
    analysis: dict[str, Any],
    plan: list[dict[str, Any]],
    rules: dict[str, Any],
    ai_config: AiConfig | None = None,
) -> list[dict[str, Any]]:
    return await repair_dependency_conflicts_from_validation(validation, analysis, plan, rules, ai_config)


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


def _parse_dependency_conflicts(output: str, ecosystem: str | None = None) -> list[dict[str, Any]]:
    if not output:
        return []
    conflicts: list[dict[str, Any]] = []
    if ecosystem in {None, "dotnet", "unknown"} or "NU1605" in output:
        for downgrade in _parse_nu1605_downgrades(output):
            conflicts.append(
                {
                    "type": "dependency-downgrade",
                    "ecosystem": "dotnet",
                    "manager": "nuget",
                    **downgrade,
                    "evidence": "NU1605",
                }
            )
    return conflicts


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
    if item.get("type") in {"dependency", "package"}:
        return ("dependency", item.get("name"), item.get("toVersion"), item.get("sourceFile"))
    if item.get("type") == "framework":
        return ("framework", item.get("file"), item.get("find"), item.get("replace"))
    if item.get("type") == "runtime":
        return ("runtime", item.get("file"), item.get("find"), item.get("replace"))
    return (item.get("type"), item.get("description"))


def _structural_files(analysis: dict[str, Any]) -> list[str]:
    _ensure_structure_classification(analysis)
    classified = _classified_files(analysis)
    if classified:
        return [
            path
            for path, file_info in classified.items()
            if file_info.get("role") in STRUCTURAL_FILE_ROLES
            and file_info.get("role") not in BLOCKED_FILE_ROLES
        ]

    manifest = analysis.get("manifest", {})
    return [
        project["path"]
        for project in manifest.get("projects", [])
        if isinstance(project.get("path"), str) and _is_structural_file(project["path"])
    ]


def _manifest_dependencies(analysis: dict[str, Any]) -> list[dict[str, Any]]:
    dependencies: list[dict[str, Any]] = []
    manifest = analysis.get("manifest", {})
    manifest_runtime = manifest.get("runtime")
    default_ecosystem, default_manager = _ecosystem_manager_from_runtime(manifest_runtime)
    for project in manifest.get("projects", []):
        source_file = project.get("path", "")
        for package in project.get("packages", []):
            name = package.get("name")
            if not name:
                continue
            dependencies.append(
                {
                    "name": name,
                    "version": str(package.get("version") or package.get("Version") or package.get("fromVersion") or ""),
                    "manager": package.get("manager") or default_manager,
                    "ecosystem": package.get("ecosystem") or default_ecosystem,
                    "sourceFile": package.get("sourceFile") or source_file,
                    "scope": package.get("scope", "direct"),
                    "metadata": package.get("metadata", {}),
                }
            )

    for dependency in manifest.get("dependencies", []):
        normalized = _normalize_manifest_dependency(dependency)
        if normalized:
            dependencies.append(normalized)

    for ecosystem in analysis.get("ecosystems", []):
        if not isinstance(ecosystem, dict):
            continue
        ecosystem_name = ecosystem.get("name", "unknown")
        manager = ecosystem.get("packageManager", "unknown")
        for dependency in ecosystem.get("dependencies", []):
            normalized = _normalize_manifest_dependency(
                dependency,
                default_ecosystem=ecosystem_name,
                default_manager=manager,
            )
            if normalized:
                dependencies.append(normalized)
    return dependencies


def _manifest_dependency_versions(analysis: dict[str, Any]) -> dict[str, dict[str, Any]]:
    dependencies: dict[str, dict[str, Any]] = {}
    for dependency in _manifest_dependencies(analysis):
        dependencies[dependency["name"]] = dependency
    return dependencies


def _manifest_packages(analysis: dict[str, Any]) -> set[str]:
    return set(_manifest_package_versions(analysis))


def _manifest_package_versions(analysis: dict[str, Any]) -> dict[str, str]:
    return {
        name: str(dependency.get("version", ""))
        for name, dependency in _manifest_dependency_versions(analysis).items()
    }


def _normalize_manifest_dependency(
    dependency: Any,
    default_ecosystem: str = "unknown",
    default_manager: str = "unknown",
) -> dict[str, Any] | None:
    if not isinstance(dependency, dict):
        return None
    name = dependency.get("name")
    if not isinstance(name, str) or not name.strip():
        return None
    return {
        "name": name,
        "version": str(dependency.get("version") or dependency.get("Version") or dependency.get("fromVersion") or ""),
        "manager": dependency.get("manager") or default_manager,
        "ecosystem": dependency.get("ecosystem") or default_ecosystem,
        "sourceFile": dependency.get("sourceFile", ""),
        "scope": dependency.get("scope", "direct"),
        "metadata": dependency.get("metadata", {}),
    }


def _ecosystem_manager_from_runtime(runtime: Any) -> tuple[str, str]:
    if runtime == "dotnet":
        return ("dotnet", "nuget")
    return ("unknown", "unknown")


def _first_dependency_source_file(analysis: dict[str, Any], dependency_name: str) -> str:
    dependency = _manifest_dependency_versions(analysis).get(dependency_name)
    return str(dependency.get("sourceFile", "")) if dependency else ""


def _has_dependency_upgrade_evidence(
    item: dict[str, Any],
    dependency_name: str,
    analysis: dict[str, Any],
    current_plan: list[dict[str, Any]],
    validation_output: str | None,
) -> bool:
    reason = item.get("reason") or item.get("description")
    evidence = item.get("evidence")
    if not isinstance(reason, str) or not reason.strip():
        return False
    if evidence not in DEPENDENCY_EVIDENCE:
        return False

    if evidence == "NU1605":
        return dependency_name in {downgrade["name"] for downgrade in _parse_nu1605_downgrades(validation_output or "")}
    if evidence in {"validation", "restore-error", "build-error"}:
        return bool(validation_output and dependency_name in validation_output)
    if validation_output and dependency_name in validation_output:
        return True
    if evidence == "dependency-family":
        return _has_dependency_plan_context(current_plan)
    if evidence in {"manifest", "target-framework", "target-runtime"}:
        return _aligns_with_framework_major_version(item.get("fromVersion"), item.get("toVersion"), analysis)
    return False


def _has_package_upgrade_evidence(
    item: dict[str, Any],
    package_name: str,
    analysis: dict[str, Any],
    current_plan: list[dict[str, Any]],
    validation_output: str | None,
) -> bool:
    return _has_dependency_upgrade_evidence(item, package_name, analysis, current_plan, validation_output)


def _has_dependency_plan_context(current_plan: list[dict[str, Any]]) -> bool:
    return any(item.get("type") in {"dependency", "package"} for item in current_plan)


def _has_package_plan_context(current_plan: list[dict[str, Any]]) -> bool:
    return _has_dependency_plan_context(current_plan)


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


def _validation_requires_version(dependency_name: str, to_version: str, validation_output: str | None) -> bool:
    if not validation_output:
        return False
    return dependency_name in validation_output and to_version in validation_output


def _allows_transitive_dependency_changes(analysis: dict[str, Any]) -> bool:
    return bool(analysis.get("allowTransitiveDependencyChanges"))


def _primary_ecosystem(analysis: dict[str, Any]) -> str:
    structure = analysis.get("structureClassification", {})
    for ecosystem in structure.get("ecosystems", []):
        name = ecosystem.get("name") if isinstance(ecosystem, dict) else None
        if isinstance(name, str) and name:
            return name
    manifest_runtime = analysis.get("manifest", {}).get("runtime")
    if isinstance(manifest_runtime, str) and manifest_runtime:
        return _ecosystem_manager_from_runtime(manifest_runtime)[0]
    return "unknown"


def _version_prefix(version: str) -> tuple[int, ...] | None:
    match = re.match(r"^\s*(\d+(?:\.\d+)*)", version)
    if not match:
        return None
    return tuple(int(part) for part in match.group(1).split("."))


def _sort_plan(plan: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(plan, key=lambda item: (item["priority"], item.get("type", ""), item.get("name", "")))


def _is_structural_file(file_name: str) -> bool:
    return _fallback_role_for_path(file_name) is not None


def _is_allowed_structural_target(
    file_name: str,
    analysis: dict[str, Any],
    change_type: str,
) -> bool:
    if not isinstance(file_name, str) or not file_name.strip():
        return False
    if change_type not in CHANGE_TYPES:
        return False

    _ensure_structure_classification(analysis)

    if _is_glob_pattern(file_name):
        matches = _classified_files_matching(file_name, analysis)
        return bool(matches) and all(_is_allowed_structural_target(match, analysis, change_type) for match in matches)

    classified = _classified_files(analysis)
    file_info = classified.get(file_name)
    if not file_info:
        return False

    role = file_info.get("role")
    if role not in STRUCTURAL_FILE_ROLES or role in BLOCKED_FILE_ROLES:
        return False
    if role == "lock_file" and change_type != "regenerate_lock_file":
        return False
    return change_type in set(file_info.get("allowedChangeTypes", []))


def _ensure_structure_classification(analysis: dict[str, Any]) -> None:
    if analysis.get("classifiedFiles"):
        return
    if analysis.get("structureClassification"):
        _store_structure_classification(analysis, analysis["structureClassification"])
        return
    _store_structure_classification(analysis, _fallback_structure_classification(analysis))


def _store_structure_classification(analysis: dict[str, Any], structure: dict[str, Any]) -> None:
    normalized = _normalize_structure_classification(structure, _fallback_structure_classification(analysis))
    analysis["structureClassification"] = normalized
    analysis["classifiedFiles"] = _flatten_classified_files(normalized)


def _normalize_structure_classification(
    structure: Any,
    fallback: dict[str, Any],
) -> dict[str, Any]:
    if not isinstance(structure, dict):
        return fallback

    ecosystems = []
    for ecosystem in structure.get("ecosystems", []):
        if not isinstance(ecosystem, dict):
            continue
        files = []
        for file_info in ecosystem.get("files", []):
            normalized_file = _normalize_classified_file(file_info)
            if normalized_file:
                files.append(normalized_file)
        ecosystems.append(
            {
                "name": ecosystem.get("name", "unknown"),
                "languages": ecosystem.get("languages", ["unknown"]),
                "packageManager": ecosystem.get("packageManager", "unknown"),
                "confidence": ecosystem.get("confidence", 0.0),
                "files": files,
            }
        )

    merged = {
        "ecosystems": ecosystems,
        "summary": structure.get("summary", fallback.get("summary", "")),
    }
    merged_files = _flatten_classified_files(fallback)
    merged_files.update(_flatten_classified_files(merged))
    merged["ecosystems"] = _ecosystems_with_files(merged, merged_files)
    return merged


def _normalize_classified_file(file_info: Any) -> dict[str, Any] | None:
    if not isinstance(file_info, dict):
        return None
    path = file_info.get("path")
    if not isinstance(path, str) or not path.strip():
        return None
    role = file_info.get("role")
    if role not in FILE_ROLES:
        role = "unknown"
    allowed = [
        change_type
        for change_type in file_info.get("allowedChangeTypes", [])
        if change_type in CHANGE_TYPES
    ]
    if role in BLOCKED_FILE_ROLES or role not in STRUCTURAL_FILE_ROLES:
        allowed = []
    if role == "lock_file":
        allowed = [change_type for change_type in allowed if change_type == "regenerate_lock_file"]
    return {
        "path": path,
        "role": role,
        "allowedChangeTypes": allowed,
        "reason": file_info.get("reason", ""),
        "confidence": file_info.get("confidence", 0.0),
    }


def _fallback_structure_classification(analysis: dict[str, Any]) -> dict[str, Any]:
    files = []
    for path in sorted(_discovered_files(analysis)):
        fallback = _fallback_role_for_path(path)
        if not fallback:
            continue
        role, allowed = fallback
        files.append(
            {
                "path": path,
                "role": role,
                "allowedChangeTypes": allowed,
                "reason": "Matched deterministic manifest discovery fallback.",
                "confidence": 0.6,
            }
        )
    return {
        "ecosystems": [
            {
                "name": _fallback_ecosystem_name(files),
                "languages": ["unknown"],
                "packageManager": "unknown",
                "confidence": 0.5 if files else 0.0,
                "files": files,
            }
        ],
        "summary": "Deterministic structural discovery fallback.",
    }


def _fallback_role_for_path(path: str) -> tuple[str, list[str]] | None:
    file_name = path.replace("\\", "/").rsplit("/", 1)[-1]
    if file_name in DISCOVERY_FILE_ROLE_FALLBACKS:
        return DISCOVERY_FILE_ROLE_FALLBACKS[file_name]
    suffix = next((suffix for suffix in (".csproj", ".sln") if file_name.endswith(suffix)), None)
    if suffix:
        return DISCOVERY_FILE_ROLE_FALLBACKS[suffix]
    return None


def _discovered_files(analysis: dict[str, Any]) -> set[str]:
    files: set[str] = set()
    manifest = analysis.get("manifest", {})
    for project in manifest.get("projects", []):
        path = project.get("path")
        if isinstance(path, str) and path.strip():
            files.add(path)
    for file_name in analysis.get("projectFiles", {}):
        if isinstance(file_name, str) and file_name.strip():
            files.add(file_name)
    for finding in analysis.get("findings", []):
        file_name = finding.get("file") if isinstance(finding, dict) else None
        if isinstance(file_name, str) and file_name.strip():
            files.add(file_name)
    for ecosystem in analysis.get("ecosystems", []):
        if not isinstance(ecosystem, dict):
            continue
        for file_info in ecosystem.get("files", []):
            path = file_info.get("path") if isinstance(file_info, dict) else None
            if isinstance(path, str) and path.strip():
                files.add(path)
        for dependency in ecosystem.get("dependencies", []):
            source_file = dependency.get("sourceFile") if isinstance(dependency, dict) else None
            if isinstance(source_file, str) and source_file.strip():
                files.add(source_file)
    return files


def _classified_files(analysis: dict[str, Any]) -> dict[str, dict[str, Any]]:
    classified = analysis.get("classifiedFiles")
    return classified if isinstance(classified, dict) else {}


def _flatten_classified_files(structure: dict[str, Any]) -> dict[str, dict[str, Any]]:
    classified: dict[str, dict[str, Any]] = {}
    for ecosystem in structure.get("ecosystems", []):
        if not isinstance(ecosystem, dict):
            continue
        for file_info in ecosystem.get("files", []):
            normalized_file = _normalize_classified_file(file_info)
            if normalized_file:
                classified[normalized_file["path"]] = normalized_file
    return classified


def _ecosystems_with_files(
    structure: dict[str, Any],
    classified_files: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    ecosystems = structure.get("ecosystems") or [{"name": "unknown", "languages": ["unknown"], "packageManager": "unknown"}]
    first = dict(ecosystems[0])
    first["files"] = list(classified_files.values())
    return [first]


def _classified_files_matching(pattern: str, analysis: dict[str, Any]) -> list[str]:
    if pattern == "**/*":
        return list(_classified_files(analysis))
    if pattern.startswith("**/"):
        suffix_pattern = pattern[3:]
        return [path for path in _classified_files(analysis) if _fnmatch_name(path, suffix_pattern)]
    return [path for path in _classified_files(analysis) if _fnmatch_name(path, pattern)]


def _is_glob_pattern(file_name: str) -> bool:
    return any(char in file_name for char in "*?[")


def _fnmatch_name(path: str, pattern: str) -> bool:
    import fnmatch

    return fnmatch.fnmatch(path.replace("\\", "/").rsplit("/", 1)[-1], pattern) or fnmatch.fnmatch(
        path.replace("\\", "/"), pattern
    )


def _fallback_ecosystem_name(files: list[dict[str, Any]]) -> str:
    names = {file_info["path"].replace("\\", "/").rsplit("/", 1)[-1] for file_info in files}
    if any(name.endswith(".csproj") or name.endswith(".sln") for name in names):
        return "dotnet"
    if "pom.xml" in names:
        return "maven"
    if {"build.gradle", "build.gradle.kts"} & names:
        return "gradle"
    if {"package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock"} & names:
        return "npm"
    if {"pyproject.toml", "requirements.txt"} & names:
        return "python"
    if {"go.mod", "go.sum"} & names:
        return "go"
    if {"Gemfile", "Gemfile.lock"} & names:
        return "ruby"
    return "unknown"
