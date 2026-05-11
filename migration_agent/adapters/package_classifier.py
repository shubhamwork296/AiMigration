from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

from migration_agent.ai.provider import AiConfig, ask_ai_sync


PACKAGE_ROLES = {
    "framework-core",
    "framework-cli",
    "framework-compiler",
    "framework-extension",
    "framework-coupled-ui",
    "framework-coupled-tooling",
    "third-party-framework-library",
    "third-party-angular-library",
    "runtime-critical",
    "build-tooling",
    "test-tooling",
    "unrelated-third-party",
    "unknown",
}

PACKAGE_ACTIONS = {
    "upgrade-with-framework-target",
    "upgrade-with-target-major",
    "suggest-compatible-upgrade",
    "keep-current",
    "warn-only",
    "defer-until-failure",
    "remove-only-if-unused-and-confirmed",
    "investigate-after-install-failure",
    "investigate-after-build-failure",
}

FRAMEWORK_ALIGNED_ROLES = {
    "framework-core",
    "framework-cli",
    "framework-compiler",
    "framework-extension",
}

FRAMEWORK_COUPLED_ROLES = {
    "framework-coupled-ui",
    "framework-coupled-tooling",
}

ANGULAR_OWNED_TOOLING = {
    "@angular-devkit/build-angular",
}

THIRD_PARTY_FRAMEWORK_ROLES = {
    "third-party-framework-library",
    "third-party-angular-library",
}


@dataclass(frozen=True)
class ClassificationSafety:
    preflight_remediation_mode: str = "suggest"
    allow_business_logic_changes: bool = False
    direct_dependencies_only_preflight: bool = True
    avoid_full_version_scans: bool = True


PACKAGE_CLASSIFIER_SYSTEM_PROMPT = """You are classifying dependencies for a framework migration.

Inputs:
- runtime/framework
- current version
- target version
- package.json direct dependencies
- npm peer dependency metadata
- npm latest metadata where available

Classify each dependency by semantic role, not by hardcoded name.

Choose one role:
- framework-core
- framework-cli
- framework-compiler
- framework-extension
- framework-coupled-ui
- framework-coupled-tooling
- third-party-framework-library
- runtime-critical
- build-tooling
- test-tooling
- unrelated-third-party
- unknown

Choose one action:
- upgrade-with-framework-target
- upgrade-with-target-major
- suggest-compatible-upgrade
- keep-current
- warn-only
- defer-until-failure
- investigate-after-install-failure
- investigate-after-build-failure

Rules:
- Do not mark unknown compatibility as blocker.
- Do not mark third-party peer dependency warning as blocker.
- Do not recommend latest unconstrained for framework-coupled packages.
- Prefer minimal changes.
- Preflight suggestions must not mutate third-party packages.
- Actual changes must be validated by install/build.

Return strict JSON only."""


def classify_packages(
    *,
    ai_config: AiConfig | None,
    runtime: str,
    current_version: int | None,
    target_version: int,
    dependencies: list[dict[str, Any]],
    dev_dependencies: list[dict[str, Any]],
    npm_metadata: dict[str, Any],
    previous_failures: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    payload = {
        "runtime": runtime,
        "currentVersion": current_version,
        "targetVersion": target_version,
        "dependencies": dependencies,
        "devDependencies": dev_dependencies,
        "npmMetadata": npm_metadata,
        "previousCommandFailures": previous_failures or [],
    }
    if ai_config and ai_config.use_ai:
        response = ask_ai_sync(ai_config, PACKAGE_CLASSIFIER_SYSTEM_PROMPT, json.dumps(payload, indent=2))
        if response is not None:
            return response
    return _fallback_classification(runtime, dependencies, dev_dependencies, npm_metadata)


def validate_package_classification(
    plan: dict[str, Any],
    *,
    direct_package_names: set[str],
    safety: ClassificationSafety | None = None,
) -> dict[str, Any]:
    safety = safety or ClassificationSafety()
    packages = []
    warnings = [str(warning) for warning in plan.get("warnings", []) if warning]
    blockers = []
    suggested_upgrades = []

    for item in plan.get("packages", []):
        if not isinstance(item, dict):
            warnings.append("Ignored invalid package classification entry.")
            continue
        name = str(item.get("name", "")).strip()
        if name not in direct_package_names:
            warnings.append(f"Ignored AI classification for non-direct dependency {name or '<unknown>'}.")
            continue
        role = _normal_role(item.get("role"))
        action = _normal_action(item.get("recommendedAction"))
        confidence = str(item.get("confidence") or "medium")
        blocking = bool(item.get("blocking", False))
        if role in THIRD_PARTY_FRAMEWORK_ROLES or role == "unknown":
            blocking = False
        if action == "remove-only-if-unused-and-confirmed":
            action = "warn-only"
            warnings.append(f"Ignored removal recommendation for {name}; removals require explicit confirmation.")
        if safety.preflight_remediation_mode != "apply" and role in THIRD_PARTY_FRAMEWORK_ROLES:
            if action not in {"warn-only", "defer-until-failure", "investigate-after-install-failure", "investigate-after-build-failure", "suggest-compatible-upgrade"}:
                action = "warn-only"
            blocking = False
        packages.append(
            {
                "name": name,
                "role": role,
                "recommendedAction": action,
                "reason": str(item.get("reason") or "No reason provided."),
                "confidence": confidence if confidence in {"low", "medium", "high"} else "medium",
                "blocking": blocking,
            }
        )
    for blocker in plan.get("blockers", []):
        if isinstance(blocker, dict) and blocker.get("package") in direct_package_names:
            package = next((item for item in packages if item["name"] == blocker.get("package")), None)
            if package and package["blocking"]:
                blockers.append(blocker)
            else:
                warnings.append(str(blocker.get("reason") or f"{blocker.get('package')} is advisory, not a blocker."))
    for upgrade in plan.get("suggestedUpgrades", []):
        if isinstance(upgrade, dict) and upgrade.get("package") in direct_package_names:
            suggested_upgrades.append(upgrade)
    return {"packages": packages, "blockers": blockers, "warnings": warnings, "suggestedUpgrades": suggested_upgrades}


def package_by_name(classification: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {item["name"]: item for item in classification.get("packages", []) if isinstance(item, dict) and item.get("name")}


def _fallback_classification(
    runtime: str,
    dependencies: list[dict[str, Any]],
    dev_dependencies: list[dict[str, Any]],
    npm_metadata: dict[str, Any],
) -> dict[str, Any]:
    packages = []
    for dependency in [*dependencies, *dev_dependencies]:
        name = dependency["name"]
        peers = npm_metadata.get(name, {}).get("peerDependencies") or {}
        role = _infer_role(runtime, name, dependency.get("section"), peers)
        packages.append(
            {
                "name": name,
                "role": role,
                "recommendedAction": _action_for_role(role),
                "reason": _reason_for_role(runtime, role, peers),
                "confidence": "medium" if role in {"unknown", "third-party-framework-library"} else "high",
                "blocking": False,
            }
        )
    return {"packages": packages, "blockers": [], "warnings": [], "suggestedUpgrades": []}


def _infer_role(runtime: str, name: str, section: str | None, peers: dict[str, Any]) -> str:
    framework_scope = f"@{runtime}/"
    if runtime == "angular" and name in ANGULAR_OWNED_TOOLING:
        return "framework-coupled-tooling"
    if name == f"@{runtime}/core":
        return "framework-core"
    if name == f"@{runtime}/cli":
        return "framework-cli"
    if "compiler" in name and name.startswith(framework_scope):
        return "framework-compiler"
    if name.startswith(framework_scope):
        return "framework-extension"
    if any(str(peer).startswith(framework_scope) for peer in peers):
        return "third-party-framework-library"
    if section == "devDependencies":
        lowered = name.lower()
        if any(token in lowered for token in ("test", "jest", "karma", "jasmine", "cypress", "playwright")):
            return "test-tooling"
        if any(token in lowered for token in ("typescript", "eslint", "webpack", "builder", "build")):
            return "build-tooling"
    if name in {"rxjs", "zone.js"}:
        return "runtime-critical"
    return "unrelated-third-party"


def _action_for_role(role: str) -> str:
    if role in FRAMEWORK_ALIGNED_ROLES:
        return "upgrade-with-framework-target"
    if role in FRAMEWORK_COUPLED_ROLES:
        return "upgrade-with-target-major"
    if role in THIRD_PARTY_FRAMEWORK_ROLES:
        return "warn-only"
    if role in {"build-tooling", "runtime-critical"}:
        return "suggest-compatible-upgrade"
    if role == "unknown":
        return "defer-until-failure"
    return "keep-current"


def _reason_for_role(runtime: str, role: str, peers: dict[str, Any]) -> str:
    if role in FRAMEWORK_ALIGNED_ROLES:
        return f"Package appears to be owned by the {runtime} framework and should align with the target framework version."
    if role in THIRD_PARTY_FRAMEWORK_ROLES:
        return "Package declares framework peer dependencies; treat compatibility risk as advisory until install/build fails."
    if peers:
        return "Package declares peer dependencies that may affect migration."
    return "No framework coupling evidence found in bounded metadata."


def _normal_role(value: Any) -> str:
    role = str(value or "unknown")
    if role == "third-party-angular-library":
        return "third-party-framework-library"
    return role if role in PACKAGE_ROLES else "unknown"


def _normal_action(value: Any) -> str:
    action = str(value or "defer-until-failure")
    return action if action in PACKAGE_ACTIONS else "defer-until-failure"
