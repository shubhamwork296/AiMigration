from __future__ import annotations

import json
import re
import time
from pathlib import Path
from typing import Any

from migration_agent.adapters.package_classifier import FRAMEWORK_ALIGNED_ROLES, FRAMEWORK_COUPLED_ROLES
from migration_agent.adapters.package_classifier import ClassificationSafety
from migration_agent.adapters.package_classifier import classify_packages
from migration_agent.adapters.package_classifier import package_by_name
from migration_agent.adapters.package_classifier import validate_package_classification
from migration_agent.ai.provider import AiConfig, ask_ai_sync
from migration_agent.adapters.base import BaseAdapter
from migration_agent.core.commands import run_command
from migration_agent.core.progress import ProgressReporter


ANGULAR_STRUCTURAL_FILES = {
    "package.json",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "angular.json",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.spec.json",
    "karma.conf.js",
    "jest.config.js",
    "eslint.config.js",
    ".eslintrc.json",
    "browserslist",
    ".nvmrc",
    ".node-version",
}

ANGULAR_COMPATIBILITY: dict[int, dict[str, Any]] = {
    15: {
        "node": [(14, 20, 0), (16, 13, 0), (18, 10, 0)],
        "typescript": {"min": (4, 8, 2), "max": (5, 0, 0)},
        "rxjs": [(6, 5, 3), (7, 4, 0)],
    },
    16: {
        "node": [(16, 14, 0), (18, 10, 0)],
        "typescript": {"min": (4, 9, 3), "max": (5, 2, 0)},
        "rxjs": [(6, 5, 3), (7, 4, 0)],
    },
    17: {
        "node": [(18, 13, 0), (20, 9, 0)],
        "typescript": {"min": (5, 2, 0), "max": (5, 5, 0)},
        "rxjs": [(6, 5, 3), (7, 4, 0)],
    },
    18: {
        "node": [(18, 19, 1), (20, 11, 1), (22, 0, 0)],
        "typescript": {"min": (5, 4, 0), "max": (5, 6, 0)},
        "rxjs": [(6, 5, 3), (7, 4, 0)],
    },
}

ANGULAR_FRAMEWORK_SCOPE = "@angular/"

FRAMEWORK_CRITICAL_PACKAGE_TARGETS: dict[int, dict[str, str]] = {
    15: {"typescript": "~4.9.5"},
    16: {"typescript": "~5.1.6"},
    17: {"typescript": "~5.4.5"},
    18: {"typescript": "~5.5.4"},
}


class AngularAdapter(BaseAdapter):
    runtime = "angular"

    def __init__(self) -> None:
        self._npm_view_cache: dict[tuple[str, str, str], dict[str, Any]] = {}
        self._angular_target_version_cache: dict[int, str | None] = {}
        self._last_package_classification: dict[str, Any] | None = None

    def detect(self, project_path: Path) -> bool:
        package_json = project_path / "package.json"
        if not package_json.exists():
            return False
        data = _read_json(package_json)
        dependencies = _all_dependencies(data)
        return "@angular/core" in dependencies or "@angular/cli" in dependencies

    def parse_manifest(self, project_path: Path) -> dict[str, Any]:
        package_json = project_path / "package.json"
        data = _read_json(package_json)
        dependencies = _all_dependencies(data)
        package_manager, lockfile = self.detect_package_manager(project_path)
        angular_json_path = project_path / "angular.json"

        return {
            "runtime": self.runtime,
            "angularVersion": _major_version(dependencies.get("@angular/core")),
            "angularCoreVersion": dependencies.get("@angular/core"),
            "angularCliVersion": dependencies.get("@angular/cli"),
            "packageManager": package_manager,
            "lockfile": lockfile,
            "scripts": data.get("scripts", {}),
            "hasAngularJson": angular_json_path.exists(),
            "hasTsconfig": (project_path / "tsconfig.json").exists(),
            "builder": self.detect_builder(project_path),
            "dependencies": [
                {
                    "name": name,
                    "version": version,
                    "manager": package_manager,
                    "ecosystem": "angular",
                    "sourceFile": "package.json",
                }
                for name, version in sorted(dependencies.items())
            ],
            "projects": [
                {
                    "path": "package.json",
                    "packages": [
                        {
                            "name": name,
                            "version": version,
                            "manager": package_manager,
                            "ecosystem": "angular",
                            "sourceFile": "package.json",
                        }
                        for name, version in sorted(dependencies.items())
                    ],
                }
            ],
        }

    def upgrade_package(self, project_path: Path, change: dict[str, Any]) -> list[Path]:
        package_json = project_path / "package.json"
        data = _read_json(package_json)
        touched = False
        for section in ("dependencies", "devDependencies", "optionalDependencies"):
            dependencies = data.get(section, {})
            if change["name"] in dependencies:
                dependencies[change["name"]] = change["toVersion"]
                touched = True
        if not touched:
            return []
        package_json.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
        return [package_json]

    def run_build(self, project_path: Path) -> dict[str, Any]:
        manifest = self.parse_manifest(project_path)
        validations = self.validation_commands(manifest)
        outputs = []
        success = True
        for validation in validations:
            if validation.get("skip"):
                outputs.append(f"SKIPPED: {validation['description']} ({validation['reason']})")
                continue
            result = _run_command(validation["command"], project_path)
            outputs.append(_format_command_output(validation["command"], result))
            if result["returncode"] != 0:
                success = False
                break
        return {"success": success, "output": "\n\n".join(outputs)}

    def collect_project_files(self, project_path: Path) -> dict[str, str]:
        collected: dict[str, str] = {}
        for file_name in sorted(ANGULAR_STRUCTURAL_FILES):
            file_path = project_path / file_name
            if not file_path.exists() or not file_path.is_file():
                continue
            try:
                text = file_path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            collected[file_name] = text[:20_000]
        return collected

    def expand_migration_hops(self, from_version: str, to_version: str) -> list[dict[str, Any]]:
        start = _major_from_spec(from_version)
        end = _major_from_spec(to_version)
        if start is None or end is None:
            return []
        if end <= start:
            return []
        return [
            {
                "type": "angular-hop",
                "fromVersion": current,
                "toVersion": current + 1,
                "description": f"Angular {current} to {current + 1}",
            }
            for current in range(start, end)
        ]

    def execute_migration_hop(
        self,
        project_path: Path,
        hop: dict[str, Any],
        rules: dict[str, Any],
        optional_migrations_enabled: bool = False,
        progress: ProgressReporter | None = None,
        log_path: Path | None = None,
        auto_remediate_dependencies: bool = False,
        on_dependency_compatibility_issue: str = "auto-remediate-and-continue",
        allow_angular_force_update: bool = False,
        allow_prerelease_dependency_versions: bool = False,
        max_dependency_remediation_retries_per_hop: int = 1,
        continue_after_successful_remediation: bool = True,
        dependency_check_timeout_seconds: int = 300,
        skip_preflight_dependency_compatibility: bool = False,
        preflight_remediation_mode: str = "suggest",
        allow_legacy_peer_deps_fallback: bool = True,
        ai_config: AiConfig | None = None,
        command_timeout_seconds: int = 600,
    ) -> dict[str, Any]:
        target = int(hop["toVersion"])
        stage = _hop_stage(hop)
        manifest_before = self.parse_manifest(project_path)
        package_manager = manifest_before["packageManager"]
        before_files = _structural_file_contents(project_path)
        if progress:
            progress.stage(stage, "Starting...")
            progress.stage(stage, "Checking dependency compatibility...")
        if skip_preflight_dependency_compatibility:
            preflight = {
                "targetAngularMajor": target,
                "status": "skipped",
                "checked": [],
                "blockers": [],
                "warnings": ["Preflight dependency compatibility check skipped by configuration."],
            }
        else:
            preflight = self.analyze_peer_dependency_compatibility(
                project_path,
                target,
                package_manager=package_manager,
                log_path=log_path,
                allow_prerelease=allow_prerelease_dependency_versions,
                timeout_seconds=dependency_check_timeout_seconds,
                progress=progress,
                stage=stage,
                remediation_mode=preflight_remediation_mode,
                ai_config=ai_config,
            )
        peer_blockers = preflight["blockers"]
        should_auto_remediate = auto_remediate_dependencies or on_dependency_compatibility_issue == "auto-remediate-and-continue"
        if peer_blockers and progress:
            for blocker in _unique_blockers_by_package(peer_blockers):
                progress.stage(
                    stage,
                    f"Found old peer dependency: {blocker['package']} requires Angular {blocker['requiredRange']}.",
                )
                progress.stage(stage, f"Warning: {blocker['package']} may need upgrade after Angular update.")
            progress.stage(stage, "Continuing because preflight compatibility checks are advisory.")

        command_results = []
        remediations: list[dict[str, Any]] = []

        planned_framework_updates = self._plan_framework_critical_updates(project_path, target, compatibility=None)
        if planned_framework_updates["updates"]:
            for update in planned_framework_updates["updates"]:
                display_name = "TypeScript" if update["package"] == "typescript" else update["package"]
                if progress:
                    progress.stage(
                        stage,
                        f"{display_name} {update['fromVersion']} is incompatible with Angular {target}.",
                    )
                    progress.stage(
                        stage,
                        f"Planned framework-critical update: {update['package']} -> {update['toVersion']}",
                    )
            remediations.extend(planned_framework_updates["updates"])
            preflight.setdefault("remediations", []).extend(planned_framework_updates["updates"])
            preflight.setdefault("frameworkCriticalUpdates", []).extend(planned_framework_updates["updates"])
            if progress:
                progress.stage(stage, "Continuing migration.")

        compatibility = self.check_compatibility(project_path, target)
        blocking_issues = [issue for issue in compatibility if issue["blocking"]]
        if blocking_issues:
            for issue in blocking_issues:
                if progress:
                    progress.stage(stage, _format_blocker_progress(issue, target))
            if progress:
                progress.stage(stage, "Execution blocked before running Angular CLI.")
            blocker = blocking_issues[0]
            return {
                "hop": hop,
                "status": "failed",
                "commands": [],
                "files": [],
                "compatibility": compatibility,
                "preflightDependencyAnalysis": preflight,
                "validation": {"passed": False, "errors": _format_compatibility_errors(blocking_issues)},
                "failureReason": _format_compatibility_errors(blocking_issues),
                "failureStage": "preflight dependency compatibility check",
                "failurePackage": blocker.get("name"),
                "optionalMigrations": self.optional_migrations(project_path, target, optional_migrations_enabled),
            }

        commands = [self._safe_angular_migration_command(rules.get("migrationCommand"), target)]
        if allow_angular_force_update and "--force" not in commands[0]:
            commands[0].append("--force")
            preflight["forceUpdateUsed"] = True
        for package_plan in preflight.get("packageClassification", {}).get("packages", []):
            if (
                package_plan.get("role") in FRAMEWORK_COUPLED_ROLES
                and package_plan.get("recommendedAction") == "upgrade-with-target-major"
                and str(package_plan.get("name", "")).startswith(ANGULAR_FRAMEWORK_SCOPE)
            ):
                commands.append(self.angular_package_update_command(str(package_plan["name"]), target))
        commands.append(self.install_command(package_manager))
        optional_migrations = self.optional_migrations(project_path, target, optional_migrations_enabled)
        if optional_migrations_enabled:
            commands.extend(step["command"] for step in optional_migrations if step.get("available"))

        success = True
        retried_angular_update = False
        failure_stage = "Angular CLI update"
        legacy_peer_deps_mode = False
        for command in commands:
            command_to_run = _apply_legacy_peer_deps_mode(command, legacy_peer_deps_mode)
            policy = self.angular_cli_invocation_policy(command_to_run)
            result = _run_command(
                command_to_run,
                project_path,
                progress=progress,
                stage=stage,
                description=_command_description(command_to_run),
                log_path=log_path,
                timeout_seconds=command_timeout_seconds,
            )
            command_results.append({"command": command_to_run, "angularCliPolicy": policy, **result})
            if result["returncode"] != 0:
                failure_stage = _failure_stage_for_command(command_to_run)
                skip_peer_root_cause = legacy_peer_deps_mode and _is_dependency_install_command(command_to_run) and _is_peer_dependency_conflict(result)
                cli_blockers = [] if skip_peer_root_cause else self._blockers_from_angular_cli_output(
                    result,
                    target,
                    project_path,
                    package_manager,
                    log_path,
                    allow_prerelease_dependency_versions,
                )
                if _is_angular_update_command(command_to_run) and cli_blockers and should_auto_remediate and max_dependency_remediation_retries_per_hop > 0:
                    preflight["blockers"].extend(cli_blockers)
                    fallback = self._remediate_cli_peer_failure(
                        project_path,
                        cli_blockers,
                        package_manager,
                        progress,
                        stage,
                        log_path,
                        before_files,
                        target,
                        optional_migrations_enabled,
                        command_timeout_seconds,
                        legacy_peer_deps_mode,
                    )
                    command_results.extend(fallback["commands"])
                    remediations.extend(fallback["remediations"])
                    preflight["remediations"] = remediations
                    if not fallback["success"]:
                        return _failed_hop_result(
                            hop,
                            command_results,
                            _changed_structural_files(project_path, before_files),
                            compatibility,
                            preflight,
                            self.optional_migrations(project_path, target, optional_migrations_enabled),
                            fallback["reason"],
                            fallback["package"],
                        )
                    if progress:
                        progress.stage(stage, "Dependency remediation passed. Retrying Angular CLI update...")
                    retry = _run_command(
                        command_to_run,
                        project_path,
                        progress=progress,
                        stage=stage,
                        description=_command_description(command_to_run),
                        log_path=log_path,
                        timeout_seconds=command_timeout_seconds,
                    )
                    command_results.append({"command": command_to_run, "angularCliPolicy": policy, **retry, "retry": True})
                    retried_angular_update = True
                    if retry["returncode"] == 0:
                        continue
                    success = False
                    break
                if _is_dependency_install_command(command_to_run) and max_dependency_remediation_retries_per_hop > 0:
                    if cli_blockers and should_auto_remediate:
                        preflight["blockers"].extend(cli_blockers)
                        fallback = self._remediate_cli_peer_failure(
                            project_path,
                            cli_blockers,
                            package_manager,
                            progress,
                            stage,
                            log_path,
                            before_files,
                            target,
                            optional_migrations_enabled,
                            command_timeout_seconds,
                            legacy_peer_deps_mode,
                        )
                        command_results.extend(fallback["commands"])
                        remediations.extend(fallback["remediations"])
                        preflight["remediations"] = remediations
                        if not fallback["success"]:
                            failed = _failed_hop_result(
                                hop,
                                command_results,
                                _changed_structural_files(project_path, before_files),
                                compatibility,
                                preflight,
                                self.optional_migrations(project_path, target, optional_migrations_enabled),
                                fallback["reason"],
                                fallback["package"],
                            )
                            failed["failureStage"] = "npm install"
                            return failed
                        if progress:
                            progress.stage(stage, "Dependency remediation passed. Retrying npm install...")
                        retry = _run_command(
                            command_to_run,
                            project_path,
                            progress=progress,
                            stage=stage,
                            description=_command_description(command_to_run),
                            log_path=log_path,
                            timeout_seconds=command_timeout_seconds,
                        )
                        command_results.append({"command": command_to_run, "angularCliPolicy": policy, **retry, "retry": True})
                        if retry["returncode"] == 0:
                            continue
                    if not legacy_peer_deps_mode and allow_legacy_peer_deps_fallback and _is_peer_dependency_conflict(result):
                        legacy_command = _legacy_peer_deps_command(command_to_run)
                        if progress:
                            progress.stage(stage, "Retrying npm install with --legacy-peer-deps after peer dependency conflict.")
                        retry = _run_command(
                            legacy_command,
                            project_path,
                            progress=progress,
                            stage=stage,
                            description="dependency install with legacy peer deps",
                            log_path=log_path,
                            timeout_seconds=command_timeout_seconds,
                        )
                        command_results.append({"command": legacy_command, "angularCliPolicy": self.angular_cli_invocation_policy(legacy_command), **retry, "retry": True})
                        if retry["returncode"] == 0:
                            preflight["legacyPeerDepsFallbackUsed"] = True
                            preflight["legacyPeerDepsMode"] = True
                            legacy_peer_deps_mode = True
                            if progress:
                                progress.stage(stage, "Legacy peer deps mode enabled for subsequent npm install commands.")
                            continue
                    ai_fallback = self._remediate_with_ai_after_failure(
                        project_path,
                        result,
                        failure_stage,
                        target,
                        package_manager,
                        ai_config,
                        progress,
                        stage,
                        log_path,
                        command_timeout_seconds,
                        legacy_peer_deps_mode,
                    )
                    if ai_fallback["attempted"]:
                        command_results.extend(ai_fallback["commands"])
                        remediations.extend(ai_fallback["remediations"])
                        preflight["remediations"] = remediations
                        if ai_fallback["success"]:
                            continue
                if failure_stage == "Angular CLI update" and max_dependency_remediation_retries_per_hop > 0:
                    ai_fallback = self._remediate_with_ai_after_failure(
                        project_path,
                        result,
                        failure_stage,
                        target,
                        package_manager,
                        ai_config,
                        progress,
                        stage,
                        log_path,
                        command_timeout_seconds,
                        legacy_peer_deps_mode,
                    )
                    if ai_fallback["attempted"]:
                        command_results.extend(ai_fallback["commands"])
                        remediations.extend(ai_fallback["remediations"])
                        preflight["remediations"] = remediations
                        if ai_fallback["success"]:
                            continue
                success = False
                break

        validation = {
            "passed": False,
            "errors": "\n\n".join(_format_command_output(item["command"], item) for item in command_results),
        }
        if success:
            validation = self._run_validations(project_path, progress=progress, stage=stage, log_path=log_path, timeout_seconds=command_timeout_seconds)
            success = bool(validation["passed"])
            if not success:
                failure_stage = "build validation"
                ai_fallback = self._remediate_with_ai_after_failure(
                    project_path,
                    {"stdout": "", "stderr": validation.get("errors", ""), "returncode": 1},
                    failure_stage,
                    target,
                    package_manager,
                    ai_config,
                    progress,
                    stage,
                    log_path,
                    command_timeout_seconds,
                    legacy_peer_deps_mode,
                )
                if ai_fallback["attempted"]:
                    command_results.extend(ai_fallback["commands"])
                    remediations.extend(ai_fallback["remediations"])
                    preflight["remediations"] = remediations
                    if ai_fallback["success"]:
                        validation = self._run_validations(project_path, progress=progress, stage=stage, log_path=log_path, timeout_seconds=command_timeout_seconds)
                        success = bool(validation["passed"])
        if success and progress:
            progress.stage(stage, "Completed successfully.")

        return {
            "hop": hop,
            "status": "done" if success else "failed",
            "commands": command_results,
            "files": _changed_structural_files(project_path, before_files),
            "compatibility": compatibility,
            "preflightDependencyAnalysis": preflight,
            "dependencyCompatibilityIssues": preflight.get("blockers", []),
            "dependencyCompatibilityRemediations": remediations,
            "retriedAngularUpdate": retried_angular_update,
            "validation": validation,
            "optionalMigrations": optional_migrations,
            **({} if success else {"failureStage": failure_stage, "failureReason": f"{failure_stage} failed"}),
        }

    def _plan_framework_critical_updates(
        self,
        project_path: Path,
        target_major: int,
        compatibility: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        compatibility = compatibility if compatibility is not None else self.check_compatibility(project_path, target_major)
        targets = FRAMEWORK_CRITICAL_PACKAGE_TARGETS.get(target_major, {})
        if not targets:
            return {"updates": [], "unresolved": []}

        package_json = project_path / "package.json"
        data = _read_json(package_json)
        updates: list[dict[str, Any]] = []
        unresolved: list[dict[str, Any]] = []
        touched = False

        incompatible = {
            issue["name"]: issue
            for issue in compatibility
            if issue.get("name") in targets
        }
        for package_name, issue in incompatible.items():
            target_version = targets.get(package_name)
            if not target_version or not _compatible_framework_critical_version(package_name, target_version, target_major):
                unresolved.append(issue)
                continue
            section = _dependency_section_for(data, package_name)
            if section is None:
                unresolved.append(issue)
                continue
            dependencies = data.get(section, {})
            from_version = dependencies.get(package_name)
            dependencies[package_name] = target_version
            updates.append(
                {
                    "hop": None,
                    "package": package_name,
                    "fromVersion": from_version,
                    "toVersion": target_version,
                    "issue": issue.get("message"),
                    "targetAngularVersion": f"{target_major}.x",
                    "status": "planned",
                    "validation": "not run",
                    "type": "framework-critical",
                }
            )
            touched = True

        if touched:
            package_json.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
        return {"updates": updates, "unresolved": unresolved}

    def analyze_peer_dependency_compatibility(
        self,
        project_path: Path,
        target_major: int,
        *,
        package_manager: str | None = None,
        log_path: Path | None = None,
        allow_prerelease: bool = False,
        timeout_seconds: int = 300,
        progress: ProgressReporter | None = None,
        stage: str | None = None,
        remediation_mode: str = "suggest",
        ai_config: AiConfig | None = None,
    ) -> dict[str, Any]:
        started = time.monotonic()
        package_json = _read_json(project_path / "package.json")
        package_manager = package_manager or self.detect_package_manager(project_path)[0]
        candidates = _dependency_sections(package_json)
        direct_names = {candidate["name"] for candidate in candidates}
        blockers: list[dict[str, Any]] = []
        checked: list[dict[str, Any]] = []
        warnings: list[str] = []
        target_version = self._resolve_angular_target_version(target_major, project_path, log_path)
        if progress and stage and target_version:
            progress.stage(stage, f"Resolved Angular target version: {_major_minor_x(target_version)}")

        npm_metadata: dict[str, Any] = {}
        for index, candidate in enumerate(candidates, start=1):
            if timeout_seconds and time.monotonic() - started >= timeout_seconds:
                warning = (
                    f"Dependency compatibility check timed out after {timeout_seconds} seconds. "
                    "Continuing because this phase is advisory."
                )
                warnings.append(warning)
                if progress and stage:
                    progress.stage(stage, warning)
                return {
                    "targetAngularMajor": target_major,
                    "targetAngularVersion": target_version,
                    "status": "timed-out",
                    "checked": checked,
                    "blockers": blockers,
                    "warnings": warnings,
                    "packageClassification": {"packages": [], "blockers": [], "warnings": warnings, "suggestedUpgrades": []},
                }
            if progress and stage:
                progress.stage(stage, f"Checking direct dependency {index}/{len(candidates)}: {candidate['name']}")
            metadata = self._npm_peer_dependencies(candidate["name"], candidate["version"], project_path, log_path)
            if metadata is None:
                warning = (
                    f"{candidate['name']} compatibility metadata unavailable. "
                    "Migration continued; validate after install/build."
                )
                warnings.append(warning)
                checked.append({**candidate, "status": "metadata-unavailable", "advisory": True})
                npm_metadata[candidate["name"]] = {"peerDependencies": None, "metadataUnavailable": True}
                continue
            checked.append({**candidate, "status": "checked"})
            npm_metadata[candidate["name"]] = {"peerDependencies": metadata}
            if not _framework_peer_dependencies(metadata):
                checked[-1]["status"] = "no-angular-peer-dependencies"
        if progress and stage:
            progress.stage(stage, "Classifying direct dependencies with AI-assisted strategy...")
        dependencies = [item for item in candidates if item.get("section") == "dependencies"]
        dev_dependencies = [item for item in candidates if item.get("section") != "dependencies"]
        raw_classification = classify_packages(
            ai_config=ai_config,
            runtime=self.runtime,
            current_version=_major_version(_all_dependencies(package_json).get("@angular/core")),
            target_version=target_major,
            dependencies=dependencies,
            dev_dependencies=dev_dependencies,
            npm_metadata=npm_metadata,
        )
        classification = validate_package_classification(
            raw_classification,
            direct_package_names=direct_names,
            safety=ClassificationSafety(preflight_remediation_mode=remediation_mode),
        )
        warnings.extend(classification.get("warnings", []))
        roles = package_by_name(classification)
        self._last_package_classification = classification

        for candidate in candidates:
            package_plan = roles.get(candidate["name"], {})
            role = package_plan.get("role", "unknown")
            action = package_plan.get("recommendedAction", "defer-until-failure")
            checked_item = next((item for item in checked if item["name"] == candidate["name"]), None)
            if checked_item is not None:
                checked_item["role"] = role
                checked_item["recommendedAction"] = action
            if role in FRAMEWORK_ALIGNED_ROLES:
                if checked_item is not None:
                    checked_item["status"] = "framework-package"
                    checked_item["targetVersion"] = target_version
                continue
            metadata = (npm_metadata.get(candidate["name"], {}).get("peerDependencies") or {})
            for peer_name, required_range in sorted(_framework_peer_dependencies(metadata).items()):
                if _range_accepts_major(str(required_range), target_major):
                    continue
                suggestion = None
                if remediation_mode == "suggest" and action == "suggest-compatible-upgrade":
                    suggestion = self._suggest_compatible_version(
                        candidate["name"],
                        target_major,
                        project_path,
                        log_path,
                        package_manager,
                        allow_prerelease=allow_prerelease,
                        warnings=warnings,
                        allow_target_major_lookup=role in FRAMEWORK_COUPLED_ROLES,
                    )
                warning = (
                    f"{candidate['name']} peer dependency targets Angular {required_range}. "
                    "Migration continued; validate after install/build."
                )
                warnings.append(warning)
                blockers.append(
                    {
                        "issueType": "Dependency Compatibility Issue",
                        "package": candidate["name"],
                        "section": candidate["section"],
                        "currentVersionRange": candidate["version"],
                        "peer": peer_name,
                        "requiredRange": str(required_range),
                        "targetAngularVersion": f"{target_major}.x",
                        "status": "incompatible",
                        "severity": "advisory",
                        "role": role,
                        "recommendedAction": action,
                        "blocking": False,
                        "suggestedVersion": suggestion,
                        "suggestedCommand": " ".join(self.package_add_command(package_manager, candidate["name"], suggestion)) if suggestion else None,
                        "suggestedAction": (
                            f"consider upgrading {candidate['name']} to a version compatible with Angular {target_major} after a real failure"
                            if suggestion
                            else f"defer {candidate['name']} until install/build produces a real failure"
                        ),
                    }
                )
        elapsed = time.monotonic() - started
        status = "advisory-warnings" if blockers or warnings else "passed"
        if progress and stage:
            progress.stage(
                "Timing",
                f"{stage} dependency compatibility check completed in {elapsed:.1f} seconds with "
                f"{'warnings' if blockers or warnings else 'no warnings'}",
            )
        return {
            "targetAngularMajor": target_major,
            "targetAngularVersion": target_version,
            "status": status,
            "checked": checked,
            "blockers": blockers,
            "warnings": warnings,
            "packageClassification": classification,
        }

    def _npm_peer_dependencies(
        self,
        package_name: str,
        version_range: str,
        project_path: Path,
        log_path: Path | None,
    ) -> dict[str, Any] | None:
        result = self._npm_view(package_name, _package_spec(package_name, version_range), "peerDependencies", project_path, log_path)
        if result["returncode"] == 0:
            parsed = _parse_npm_json(result.get("stdout", ""))
            if isinstance(parsed, dict):
                return parsed
        return None

    def _suggest_compatible_version(
        self,
        package_name: str,
        target_major: int,
        project_path: Path,
        log_path: Path | None,
        package_manager: str,
        *,
        allow_prerelease: bool = False,
        warnings: list[str] | None = None,
        allow_target_major_lookup: bool = False,
    ) -> str | None:
        for version in self._compatible_version_candidates(
            package_name,
            target_major,
            project_path,
            log_path,
            allow_prerelease=allow_prerelease,
            warnings=warnings,
            allow_target_major_lookup=allow_target_major_lookup,
        ):
            peer_result = self._npm_view(package_name, _package_spec(package_name, version), "peerDependencies", project_path, log_path)
            if peer_result["returncode"] != 0:
                continue
            peers = _parse_npm_json(peer_result.get("stdout", ""))
            if not isinstance(peers, dict):
                continue
            angular_peers = _framework_peer_dependencies(peers)
            if angular_peers and all(_range_accepts_major(str(value), target_major) for value in angular_peers.values()):
                return version
            if not angular_peers and _major_version(version) == target_major:
                return version
        return None

    def _compatible_version_candidates(
        self,
        package_name: str,
        target_major: int,
        project_path: Path,
        log_path: Path | None,
        *,
        allow_prerelease: bool = False,
        warnings: list[str] | None = None,
        allow_target_major_lookup: bool = False,
    ) -> list[str]:
        if package_name.startswith(ANGULAR_FRAMEWORK_SCOPE):
            return self._framework_version_candidates(package_name, target_major, project_path, log_path)

        if allow_target_major_lookup:
            result = self._npm_view(package_name, f"{package_name}@{target_major}", "version", project_path, log_path)
            parsed = _parse_npm_json(result.get("stdout", "")) if result["returncode"] == 0 else None
            version = str(parsed) if isinstance(parsed, str) else None
            if version and _major_version(version) == target_major:
                return [version]
            if warnings is not None:
                warnings.append(
                    f"{package_name}@{target_major} metadata unavailable or incompatible. "
                    "Migration continued; validate after install/build."
                )

        latest_result = self._npm_view(package_name, package_name, "version", project_path, log_path)
        if latest_result["returncode"] != 0:
            if warnings is not None:
                warnings.append(
                    f"{package_name} version metadata unavailable from npm. "
                    "Migration continued; validate after install/build."
                )
            return []

        parsed = _parse_npm_json(latest_result.get("stdout", ""))
        latest = str(parsed) if isinstance(parsed, str) else None
        if latest and _major_version(latest) == target_major:
            if "-" not in latest or allow_prerelease:
                if "-" in latest and warnings is not None:
                    warnings.append(_prerelease_candidate_warning(package_name, target_major, latest))
                return [latest]
        if latest and "-" in latest and _major_version(latest) == target_major and warnings is not None:
            warnings.append(_prerelease_candidate_warning(package_name, target_major, latest))
        return []

    def _framework_version_candidates(
        self,
        package_name: str,
        target_major: int,
        project_path: Path,
        log_path: Path | None,
    ) -> list[str]:
        candidates: list[str] = []
        for spec in (f"{package_name}@{target_major}", package_name):
            result = self._npm_view(package_name, spec, "version", project_path, log_path)
            if result["returncode"] != 0:
                continue
            parsed = _parse_npm_json(result.get("stdout", ""))
            version = str(parsed) if isinstance(parsed, str) else None
            if version:
                candidates.append(version)
        return candidates

    def _apply_preflight_remediations(
        self,
        project_path: Path,
        blockers: list[dict[str, Any]],
        package_manager: str,
    ) -> dict[str, Any]:
        package_json = project_path / "package.json"
        data = _read_json(package_json)
        unresolved = []
        remediations = []
        touched = False
        by_package = {blocker["package"]: blocker for blocker in blockers}
        for package_name, blocker in by_package.items():
            version = blocker.get("suggestedVersion")
            if not version:
                unresolved.append(blocker)
                continue
            section = blocker.get("section")
            dependencies = data.get(section, {}) if isinstance(section, str) else {}
            if package_name not in dependencies:
                unresolved.append(blocker)
                continue
            dependencies[package_name] = version
            command = self.package_add_command(package_manager, package_name, version)
            remediations.append(
                {
                    "hop": None,
                    "package": package_name,
                    "fromVersion": blocker.get("currentVersionRange"),
                    "toVersion": version,
                    "issue": f"old peer dependency required {blocker.get('peer')} {blocker.get('requiredRange')}",
                    "targetAngularVersion": blocker.get("targetAngularVersion"),
                    "command": command,
                    "status": "planned",
                    "validation": "not run",
                }
            )
            touched = True
        if touched:
            package_json.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
        return {"files": ["package.json"] if touched else [], "unresolved": unresolved, "remediations": remediations}

    def package_add_command(self, package_manager: str, package_name: str, version: str) -> list[str]:
        spec = f"{package_name}@{version}"
        if package_manager == "yarn":
            return ["yarn", "add", spec]
        if package_manager == "pnpm":
            return ["pnpm", "add", spec]
        return ["npm", "install", spec]

    def _blockers_from_angular_cli_output(
        self,
        result: dict[str, Any],
        target_major: int,
        project_path: Path,
        package_manager: str,
        log_path: Path | None,
        allow_prerelease: bool,
    ) -> list[dict[str, Any]]:
        output = "\n".join(part for part in [result.get("stdout", ""), result.get("stderr", "")] if part)
        blockers = []
        pattern = re.compile(
            r'Package "([^"]+)" has an incompatible peer dependency to "([^"]+)" '
            r'\(requires "([^"]+)", would install "([^"]+)"\)',
            flags=re.IGNORECASE,
        )
        for package_name, peer, required, would_install in pattern.findall(output):
            if not str(peer).startswith(ANGULAR_FRAMEWORK_SCOPE):
                continue
            suggestion = self._suggest_compatible_version(
                package_name,
                target_major,
                project_path,
                log_path,
                package_manager,
                allow_prerelease=allow_prerelease,
                allow_target_major_lookup=True,
            )
            blockers.append(
                {
                    "issueType": "Dependency Compatibility Issue",
                    "package": package_name,
                    "section": _find_dependency_section(project_path, package_name),
                    "currentVersionRange": _find_dependency_version(project_path, package_name),
                    "peer": peer,
                    "requiredRange": required,
                    "wouldInstall": would_install,
                    "targetAngularVersion": f"{target_major}.x",
                    "status": "incompatible",
                    "severity": "auto-remediable" if suggestion else "manual-action-required",
                    "suggestedVersion": suggestion,
                    "suggestedCommand": " ".join(self.package_add_command(package_manager, package_name, suggestion)) if suggestion else None,
                    "suggestedAction": (
                        f"upgrade {package_name} to a version compatible with Angular {target_major}"
                        if suggestion
                        else f"manually review {package_name} for Angular {target_major} compatibility"
                    ),
                }
            )
        return blockers

    def _npm_view(
        self,
        package_name: str,
        version_or_range: str,
        metadata_field: str,
        project_path: Path,
        log_path: Path | None,
    ) -> dict[str, Any]:
        cache_key = (package_name, version_or_range, metadata_field)
        if cache_key not in self._npm_view_cache:
            self._npm_view_cache[cache_key] = _run_command(
                ["npm", "view", version_or_range, metadata_field, "--json"],
                project_path,
                log_path=log_path,
            )
        return self._npm_view_cache[cache_key]

    def _resolve_angular_target_version(self, target_major: int, project_path: Path, log_path: Path | None) -> str | None:
        if target_major not in self._angular_target_version_cache:
            result = self._npm_view("@angular/core", f"@angular/core@{target_major}", "version", project_path, log_path)
            parsed = _parse_npm_json(result.get("stdout", "")) if result["returncode"] == 0 else None
            self._angular_target_version_cache[target_major] = str(parsed) if isinstance(parsed, str) else None
        return self._angular_target_version_cache[target_major]

    def _remediate_cli_peer_failure(
        self,
        project_path: Path,
        blockers: list[dict[str, Any]],
        package_manager: str,
        progress: ProgressReporter | None,
        stage: str,
        log_path: Path | None,
        before_files: dict[str, str],
        target_major: int,
        optional_migrations_enabled: bool,
        command_timeout_seconds: int = 600,
        legacy_peer_deps_mode: bool = False,
    ) -> dict[str, Any]:
        remediated = self._apply_preflight_remediations(project_path, blockers, package_manager)
        command_results = []
        remediations = []
        if remediated["unresolved"]:
            return {
                "success": False,
                "commands": command_results,
                "remediations": remediations,
                "reason": "no compatible dependency version found",
                "package": remediated["unresolved"][0].get("package"),
            }
        for remediation in remediated["remediations"]:
            command = _apply_legacy_peer_deps_mode(remediation["command"], legacy_peer_deps_mode)
            remediation["command"] = command
            if progress:
                progress.stage(stage, f"Upgrading {remediation['package']} to compatible version...")
            result = _run_command(
                command,
                project_path,
                progress=progress,
                stage=stage,
                description=f"{remediation['package']} compatibility upgrade",
                log_path=log_path,
                timeout_seconds=command_timeout_seconds,
            )
            command_results.append({"command": command, "angularCliPolicy": self.angular_cli_invocation_policy(command), **result})
            remediation["status"] = "installed" if result["returncode"] == 0 else "failed"
            remediations.append(remediation)
            if result["returncode"] != 0:
                return {
                    "success": False,
                    "commands": command_results,
                    "remediations": remediations,
                    "reason": "dependency compatibility remediation failed",
                    "package": remediation["package"],
                }
        install_command = _apply_legacy_peer_deps_mode(self.install_command(package_manager), legacy_peer_deps_mode)
        install_result = _run_command(install_command, project_path, progress=progress, stage=stage, description="dependency install", log_path=log_path, timeout_seconds=command_timeout_seconds)
        command_results.append({"command": install_command, "angularCliPolicy": self.angular_cli_invocation_policy(install_command), **install_result})
        if install_result["returncode"] != 0:
            return {
                "success": False,
                "commands": command_results,
                "remediations": remediations,
                "reason": "dependency install failed after remediation",
                "package": remediations[0]["package"] if remediations else None,
            }
        if progress:
            progress.stage(stage, "Running build validation after dependency remediation...")
        validation = self._run_validations(project_path, progress=progress, stage=stage, log_path=log_path, timeout_seconds=command_timeout_seconds)
        for remediation in remediations:
            remediation["validation"] = "passed" if validation["passed"] else "failed"
            remediation["status"] = "remediated" if validation["passed"] else "failed"
        if not validation["passed"]:
            return {
                "success": False,
                "commands": command_results,
                "remediations": remediations,
                "reason": "build/test validation failed after dependency remediation",
                "package": remediations[0]["package"] if remediations else None,
            }
        return {"success": True, "commands": command_results, "remediations": remediations}

    def _remediate_with_ai_after_failure(
        self,
        project_path: Path,
        failure: dict[str, Any],
        failure_stage: str,
        target_major: int,
        package_manager: str,
        ai_config: AiConfig | None,
        progress: ProgressReporter | None,
        stage: str,
        log_path: Path | None,
        command_timeout_seconds: int,
        legacy_peer_deps_mode: bool = False,
    ) -> dict[str, Any]:
        if not ai_config or not ai_config.use_ai:
            return {"attempted": False, "success": False, "commands": [], "remediations": []}
        if progress:
            progress.stage(stage, f"Asking AI for targeted remediation after {failure_stage} failure...")
        manifest = self.parse_manifest(project_path)
        output = "\n".join(part for part in [failure.get("stdout", ""), failure.get("stderr", "")] if part)[-12000:]
        system = """You propose minimal remediation after a real framework migration failure.
Return strict JSON only with:
{
  "rootCause": "...",
  "affectedPackages": ["direct-package-name"],
  "affectedFiles": ["package.json"],
  "packageUpdates": [{"name": "direct-package-name", "version": "x.y.z", "reason": "..."}],
  "businessLogicChanged": false,
  "rollbackSafety": "...",
  "validationCommand": ["npm", "run", "build"]
}
Rules:
- Use only direct dependencies from package.json.
- Prefer package.json/package manager remediation.
- Do not change business logic.
- Do not request unbounded version scans.
- Do not upgrade unrelated packages to latest without evidence."""
        user = json.dumps(
            {
                "runtime": self.runtime,
                "targetAngularMajor": target_major,
                "failureStage": failure_stage,
                "errorOutput": output,
                "manifest": manifest,
                "packageClassification": self._last_package_classification or {},
            },
            indent=2,
        )
        try:
            plan = ask_ai_sync(ai_config, system, user) or {}
        except Exception as exc:
            if progress:
                progress.stage(stage, f"AI remediation unavailable: {exc}")
            return {"attempted": False, "success": False, "commands": [], "remediations": []}
        direct_versions = {item["name"]: item["version"] for item in manifest.get("dependencies", [])}
        updates = _safe_ai_package_updates(plan, direct_versions)
        if not updates:
            return {"attempted": False, "success": False, "commands": [], "remediations": []}
        command_results = []
        remediations = []
        for update in updates:
            command = _apply_legacy_peer_deps_mode(self.package_add_command(package_manager, update["name"], update["version"]), legacy_peer_deps_mode)
            if progress:
                progress.stage(stage, f"Applying AI remediation for {update['name']}...")
            result = _run_command(
                command,
                project_path,
                progress=progress,
                stage=stage,
                description=f"{update['name']} AI remediation",
                log_path=log_path,
                timeout_seconds=command_timeout_seconds,
            )
            command_results.append({"command": command, "angularCliPolicy": self.angular_cli_invocation_policy(command), **result})
            remediation = {
                "hop": None,
                "package": update["name"],
                "fromVersion": direct_versions.get(update["name"]),
                "toVersion": update["version"],
                "issue": plan.get("rootCause") or update.get("reason"),
                "targetAngularVersion": f"{target_major}.x",
                "command": command,
                "validation": "not run",
                "status": "installed" if result["returncode"] == 0 else "failed",
                "source": "ai-after-failure",
                "rollbackSafety": plan.get("rollbackSafety"),
            }
            remediations.append(remediation)
            if result["returncode"] != 0:
                return {"attempted": True, "success": False, "commands": command_results, "remediations": remediations}
        install_command = _apply_legacy_peer_deps_mode(self.install_command(package_manager), legacy_peer_deps_mode)
        install_result = _run_command(
            install_command,
            project_path,
            progress=progress,
            stage=stage,
            description="dependency install",
            log_path=log_path,
            timeout_seconds=command_timeout_seconds,
        )
        command_results.append({"command": install_command, "angularCliPolicy": self.angular_cli_invocation_policy(install_command), **install_result})
        if install_result["returncode"] != 0:
            return {"attempted": True, "success": False, "commands": command_results, "remediations": remediations}
        validation = self._run_validations(project_path, progress=progress, stage=stage, log_path=log_path, timeout_seconds=command_timeout_seconds)
        for remediation in remediations:
            remediation["validation"] = "passed" if validation["passed"] else "failed"
            remediation["status"] = "remediated" if validation["passed"] else "failed"
        return {"attempted": True, "success": bool(validation["passed"]), "commands": command_results, "remediations": remediations}

    def angular_update_command(self, target_major: int) -> list[str]:
        return [
            "npx",
            "--yes",
            f"@angular/cli@{target_major}",
            "update",
            f"@angular/core@{target_major}",
            f"@angular/cli@{target_major}",
            "--allow-dirty",
            "--force",
        ]

    def angular_package_update_command(self, package_name: str, target_major: int) -> list[str]:
        return [
            "npx",
            "--yes",
            f"@angular/cli@{target_major}",
            "update",
            f"{package_name}@{target_major}",
            "--allow-dirty",
            "--force",
        ]

    def angular_cli_invocation_policy(self, command: list[str]) -> dict[str, str]:
        uses_pinned_npx = (
            len(command) >= 3
            and command[0] == "npx"
            and command[1] == "--yes"
            and command[2].startswith("@angular/cli@")
        )
        return {
            "commandSource": "npx" if uses_pinned_npx else command[0],
            "angularCliSource": "version-pinned npx package" if uses_pinned_npx else "not applicable",
            "globalAngularCli": "not used" if uses_pinned_npx else "not applicable",
            "globalInstallUpdate": "not performed",
        }

    def _safe_angular_migration_command(self, command: list[str] | None, target_major: int) -> list[str]:
        if not command:
            return self.angular_update_command(target_major)
        if _is_global_angular_command(command) or _is_global_npm_install_update(command):
            return self.angular_update_command(target_major)
        safe = _ensure_npx_yes(command)
        if _is_angular_update_command(safe):
            if "--allow-dirty" not in safe:
                safe.append("--allow-dirty")
            if "--force" not in safe:
                safe.append("--force")
        return safe

    def detect_package_manager(self, project_path: Path) -> tuple[str, str | None]:
        if (project_path / "package-lock.json").exists():
            return ("npm", "package-lock.json")
        if (project_path / "yarn.lock").exists():
            return ("yarn", "yarn.lock")
        if (project_path / "pnpm-lock.yaml").exists():
            return ("pnpm", "pnpm-lock.yaml")
        return ("npm", None)

    def install_command(self, package_manager: str) -> list[str]:
        if package_manager == "yarn":
            return ["yarn", "install"]
        if package_manager == "pnpm":
            return ["pnpm", "install"]
        return ["npm", "install"]

    def validation_commands(self, manifest: dict[str, Any]) -> list[dict[str, Any]]:
        package_manager = manifest["packageManager"]
        scripts = manifest.get("scripts", {})
        commands: list[dict[str, Any]] = []
        if "build" in scripts:
            commands.append(
                {
                    "description": "build",
                    "command": _script_command(package_manager, "build", test=False),
                }
            )
        else:
            commands.append({"description": "build", "skip": True, "reason": "package.json has no build script"})

        if "test" in scripts:
            commands.append(
                {
                    "description": "test",
                    "command": _script_command(package_manager, "test", test=True),
                }
            )
        else:
            commands.append({"description": "test", "skip": True, "reason": "package.json has no test script"})
        return commands

    def detect_builder(self, project_path: Path) -> dict[str, Any]:
        angular_json = project_path / "angular.json"
        if not angular_json.exists():
            return {"available": False, "usesOldBrowserBuilder": False, "usesApplicationBuilder": False, "builders": []}
        data = _read_json(angular_json)
        builders: list[str] = []
        for project in data.get("projects", {}).values():
            if not isinstance(project, dict):
                continue
            targets = project.get("architect") or project.get("targets") or {}
            for target in targets.values():
                if isinstance(target, dict) and isinstance(target.get("builder"), str):
                    builders.append(target["builder"])
        return {
            "available": True,
            "usesOldBrowserBuilder": any(builder.endswith(":browser") for builder in builders),
            "usesApplicationBuilder": any(builder.endswith(":application") for builder in builders),
            "builders": sorted(set(builders)),
        }

    def optional_migrations(
        self,
        project_path: Path,
        target_major: int,
        enabled: bool,
    ) -> list[dict[str, Any]]:
        builder = self.detect_builder(project_path)
        available = target_major >= 18 and builder.get("usesOldBrowserBuilder", False)
        return [
            {
                "name": "use-application-builder",
                "available": available,
                "applied": bool(enabled and available),
                "command": ["npx", "--yes", "@angular/cli@18", "update", "@angular/cli", "--name", "use-application-builder"],
                "reason": "Angular 18 application builder migration is optional.",
            }
        ]

    def check_compatibility(self, project_path: Path, target_major: int) -> list[dict[str, Any]]:
        manifest = self.parse_manifest(project_path)
        dependencies = {dependency["name"]: dependency["version"] for dependency in manifest["dependencies"]}
        rules = ANGULAR_COMPATIBILITY.get(target_major, {})
        issues: list[dict[str, Any]] = []

        node_version = _node_version(project_path)
        if node_version and rules:
            compatible = _node_satisfies(node_version, rules["node"])
            if not compatible:
                issues.append(
                    {
                        "name": "node",
                        "version": ".".join(str(part) for part in node_version),
                        "required": _node_requirement_text(rules["node"]),
                        "blocking": True,
                        "message": f"Node {'.'.join(str(part) for part in node_version)} is not compatible with Angular {target_major}.",
                    }
                )
        elif rules:
            issues.append(
                {
                    "name": "node",
                    "version": "unknown",
                    "required": _node_requirement_text(rules["node"]),
                    "blocking": False,
                    "message": "Node version could not be detected with node --version.",
                }
            )

        for package_name, rule_name in (("typescript", "typescript"), ("rxjs", "rxjs")):
            current = dependencies.get(package_name)
            if not current or not rules:
                continue
            version = _version_tuple(current)
            if not version:
                continue
            if package_name == "typescript":
                required = rules[rule_name]
                compatible = version >= required["min"] and version < required["max"]
                required_text = f">={_version_text(required['min'])} <{_version_text(required['max'])}"
            else:
                compatible = _rxjs_satisfies(version, rules[rule_name])
                required_text = "^6.5.3 || ^7.4.0"
            if not compatible:
                issues.append(
                    {
                        "name": package_name,
                        "version": current,
                        "required": required_text,
                        "blocking": package_name == "typescript",
                        "message": f"{package_name} {current} is not compatible with Angular {target_major}.",
                    }
                )
        return issues

    def _run_validations(
        self,
        project_path: Path,
        *,
        progress: ProgressReporter | None = None,
        stage: str | None = None,
        log_path: Path | None = None,
        timeout_seconds: int | None = None,
    ) -> dict[str, Any]:
        manifest = self.parse_manifest(project_path)
        validations = self.validation_commands(manifest)
        outputs = []
        skipped = []
        for validation in validations:
            if validation.get("skip"):
                skipped.append(validation)
                outputs.append(f"SKIPPED: {validation['description']} ({validation['reason']})")
                continue
            result = _run_command(
                validation["command"],
                project_path,
                progress=progress,
                stage=stage,
                description=f"{validation['description']} validation",
                log_path=log_path,
                timeout_seconds=timeout_seconds,
            )
            outputs.append(_format_command_output(validation["command"], result))
            if result["returncode"] != 0:
                return {
                    "passed": False,
                    "errors": "\n\n".join(outputs),
                    "skipped": skipped,
                }
        return {"passed": True, "output": "\n\n".join(outputs), "skipped": skipped}


def _read_json(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, FileNotFoundError):
        return {}


def _all_dependencies(data: dict[str, Any]) -> dict[str, str]:
    dependencies: dict[str, str] = {}
    for section in ("dependencies", "devDependencies", "optionalDependencies"):
        values = data.get(section, {})
        if isinstance(values, dict):
            dependencies.update({str(name): str(version) for name, version in values.items()})
    return dependencies


def _dependency_sections(data: dict[str, Any]) -> list[dict[str, str]]:
    dependencies: list[dict[str, str]] = []
    for section in ("dependencies", "devDependencies", "optionalDependencies"):
        values = data.get(section, {})
        if not isinstance(values, dict):
            continue
        for name, version in sorted(values.items()):
            dependencies.append({"name": str(name), "version": str(version), "section": section})
    return dependencies


def _dependency_section_for(data: dict[str, Any], package_name: str) -> str | None:
    for section in ("dependencies", "devDependencies", "optionalDependencies"):
        values = data.get(section, {})
        if isinstance(values, dict) and package_name in values:
            return section
    return None


def _angular_peer_analysis_candidates(data: dict[str, Any]) -> list[dict[str, str]]:
    return _dependency_sections(data)


def _is_angular_peer_candidate(name: str) -> bool:
    return name.startswith(ANGULAR_FRAMEWORK_SCOPE)


def _major_version(version: str | None) -> int | None:
    parsed = _version_tuple(version)
    return parsed[0] if parsed else None


def _major_from_spec(version: str) -> int | None:
    match = re.search(r"\d+", str(version))
    return int(match.group(0)) if match else None


def _version_tuple(version: str | None) -> tuple[int, ...] | None:
    if not version:
        return None
    match = re.search(r"(\d+)(?:\.(\d+))?(?:\.(\d+))?", version)
    if not match:
        return None
    return tuple(int(part) for part in match.groups(default="0"))


def _node_version(project_path: Path) -> tuple[int, int, int] | None:
    completed = run_command(["node", "--version"], project_path)
    if completed["returncode"] != 0:
        return None
    return _version_tuple(completed["stdout"].strip())


def _node_satisfies(version: tuple[int, int, int], minimums: list[tuple[int, int, int]]) -> bool:
    return any(version[0] == minimum[0] and version >= minimum for minimum in minimums)


def _rxjs_satisfies(version: tuple[int, ...], minimums: list[tuple[int, int, int]]) -> bool:
    return any(version[0] == minimum[0] and version >= minimum for minimum in minimums)


def _compatible_framework_critical_version(package_name: str, version_range: str, target_major: int) -> bool:
    rules = ANGULAR_COMPATIBILITY.get(target_major, {})
    version = _version_tuple(version_range)
    if not version or not rules:
        return False
    if package_name == "typescript":
        required = rules["typescript"]
        return version >= required["min"] and version < required["max"]
    if package_name == "rxjs":
        return _rxjs_satisfies(version, rules["rxjs"])
    return True


def _node_requirement_text(minimums: list[tuple[int, int, int]]) -> str:
    return " || ".join(f"^{_version_text(minimum)}" for minimum in minimums)


def _version_text(version: tuple[int, ...]) -> str:
    return ".".join(str(part) for part in version)


def _prerelease_candidate_warning(package_name: str, target_major: int, version: str) -> str:
    return (
        f"{package_name} latest Angular {target_major} candidate is prerelease {version}. "
        "Migration will continue and validate after install/build."
    )


def _major_minor_x(version: str) -> str:
    parsed = _version_tuple(version)
    if not parsed or len(parsed) < 2:
        return version
    return f"{parsed[0]}.{parsed[1]}.x"


def _script_command(package_manager: str, script: str, test: bool) -> list[str]:
    if package_manager == "yarn":
        return ["yarn", script, "--watch=false"] if test else ["yarn", script]
    if package_manager == "pnpm":
        return ["pnpm", script, "--", "--watch=false"] if test else ["pnpm", "run", script]
    return ["npm", "test", "--", "--watch=false"] if test else ["npm", "run", script]


def _run_command(
    command: list[str],
    cwd: Path,
    *,
    progress: ProgressReporter | None = None,
    stage: str | None = None,
    description: str | None = None,
    log_path: Path | None = None,
    timeout_seconds: int | None = None,
) -> dict[str, Any]:
    return run_command(command, cwd, progress=progress, stage=stage, description=description, log_path=log_path, timeout=timeout_seconds)


def _format_command_output(command: list[str], result: dict[str, Any]) -> str:
    output = "\n".join(part for part in [result.get("stdout", ""), result.get("stderr", "")] if part)
    return f"$ {' '.join(command)}\nexit code: {result['returncode']}\n{output}"


def _format_compatibility_errors(issues: list[dict[str, Any]]) -> str:
    return "\n".join(f"{issue['message']} Required: {issue['required']}" for issue in issues)


def _format_preflight_errors(blockers: list[dict[str, Any]]) -> str:
    return "\n".join(
        (
            f"{blocker['package']} has incompatible peer dependency {blocker['peer']} "
            f"requiring {blocker['requiredRange']} for target Angular {blocker['targetAngularVersion']}."
        )
        for blocker in blockers
    )


def _failed_hop_result(
    hop: dict[str, Any],
    command_results: list[dict[str, Any]],
    files: list[str],
    compatibility: list[dict[str, Any]],
    preflight: dict[str, Any],
    optional_migrations: list[dict[str, Any]],
    reason: str,
    package_name: str | None,
) -> dict[str, Any]:
    blockers = preflight.get("blockers", [])
    return {
        "hop": hop,
        "status": "failed",
        "commands": command_results,
        "files": files,
        "compatibility": compatibility,
        "preflightDependencyAnalysis": preflight,
        "dependencyCompatibilityIssues": blockers,
        "dependencyCompatibilityRemediations": preflight.get("remediations", []),
        "validation": {"passed": False, "errors": _format_preflight_errors(blockers) or reason},
        "failureReason": reason,
        "failurePackage": package_name,
        "optionalMigrations": optional_migrations,
    }


def _format_blocker_progress(issue: dict[str, Any], target_major: int) -> str:
    name = issue.get("name", "unknown")
    required = issue.get("required", "unknown")
    if name == "node":
        return f"Found incompatible runtime: Node requires {required}, target is Angular {target_major}."
    return f"Found incompatible package: {name} requires {required}, target is Angular {target_major}."


def _hop_stage(hop: dict[str, Any]) -> str:
    return f"Angular {hop['fromVersion']} -> {hop['toVersion']}"


def _command_description(command: list[str]) -> str:
    if len(command) >= 4 and command[:2] == ["npx", "--yes"] and command[3] == "update":
        if "--name" in command and "use-application-builder" in command:
            return "Angular application builder migration"
        return "Angular CLI update"
    if command[:2] in (["npm", "install"], ["yarn", "install"], ["pnpm", "install"]):
        return "dependency install"
    return "command"


def _failure_stage_for_command(command: list[str]) -> str:
    if _is_angular_update_command(command):
        return "Angular CLI update"
    if _is_dependency_install_command(command):
        return "npm install"
    if command[:3] == ["npm", "run", "build"] or command[:2] in (["yarn", "build"], ["pnpm", "run"]):
        return "build validation"
    return "command execution"


def _is_angular_update_command(command: list[str]) -> bool:
    return len(command) >= 4 and command[:2] == ["npx", "--yes"] and command[3] == "update"


def _is_dependency_install_command(command: list[str]) -> bool:
    return command[:2] in (["npm", "install"], ["yarn", "install"], ["pnpm", "install"])


def _is_peer_dependency_conflict(result: dict[str, Any]) -> bool:
    output = "\n".join(part for part in [result.get("stdout", ""), result.get("stderr", "")] if part).lower()
    return "peer dependency" in output or "eresolve" in output


def _legacy_peer_deps_command(command: list[str]) -> list[str]:
    if command[:2] == ["npm", "install"] and "--legacy-peer-deps" not in command:
        return [*command, "--legacy-peer-deps"]
    return command


def _apply_legacy_peer_deps_mode(command: list[str], enabled: bool) -> list[str]:
    if not enabled:
        return command
    return _legacy_peer_deps_command(command)


def _unique_blockers_by_package(blockers: list[dict[str, Any]]) -> list[dict[str, Any]]:
    unique = {}
    for blocker in blockers:
        unique.setdefault(blocker.get("package"), blocker)
    return list(unique.values())


def _ensure_npx_yes(command: list[str]) -> list[str]:
    if len(command) >= 2 and command[0] == "npx" and command[1] != "--yes":
        return ["npx", "--yes", *command[1:]]
    return command


def _parse_npm_json(output: str) -> Any:
    text = output.strip()
    if not text:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


def _package_spec(package_name: str, version_range: str) -> str:
    clean_range = str(version_range).strip()
    if not clean_range or clean_range == "*":
        return package_name
    return f"{package_name}@{clean_range}"


def _framework_peer_dependencies(peers: dict[str, Any]) -> dict[str, Any]:
    return {name: value for name, value in peers.items() if str(name).startswith(ANGULAR_FRAMEWORK_SCOPE)}


def _safe_ai_package_updates(plan: dict[str, Any], direct_versions: dict[str, str]) -> list[dict[str, str]]:
    if plan.get("businessLogicChanged") is True:
        return []
    updates = []
    for item in plan.get("packageUpdates", []):
        if not isinstance(item, dict):
            continue
        name = str(item.get("name", "")).strip()
        version = str(item.get("version", "")).strip()
        if name not in direct_versions or not version:
            continue
        if version in {"latest", "*"}:
            continue
        updates.append({"name": name, "version": version, "reason": str(item.get("reason") or "")})
    return updates


def _find_dependency_section(project_path: Path, package_name: str) -> str | None:
    data = _read_json(project_path / "package.json")
    for dependency in _dependency_sections(data):
        if dependency["name"] == package_name:
            return dependency["section"]
    return None


def _find_dependency_version(project_path: Path, package_name: str) -> str | None:
    data = _read_json(project_path / "package.json")
    for dependency in _dependency_sections(data):
        if dependency["name"] == package_name:
            return dependency["version"]
    return None


def _range_accepts_major(range_text: str, target_major: int) -> bool:
    text = range_text.strip()
    if not text or text == "*":
        return True
    return any(_range_part_accepts_major(part.strip(), target_major) for part in text.split("||"))


def _range_part_accepts_major(part: str, target_major: int) -> bool:
    constraints = [constraint for constraint in part.replace(",", " ").split() if constraint]
    if not constraints:
        return True
    target = (target_major, 0, 0)
    for constraint in constraints:
        parsed = _parse_constraint(constraint)
        if parsed is None:
            continue
        operator, version = parsed
        if operator == "^":
            upper = (version[0] + 1, 0, 0) if version[0] > 0 else (0, version[1] + 1, 0)
            if not (target >= version and target < upper):
                return False
        elif operator == "~":
            upper = (version[0], version[1] + 1, 0)
            if not (target >= version and target < upper):
                return False
        elif operator == ">=" and not target >= version:
            return False
        elif operator == ">" and not target > version:
            return False
        elif operator == "<=" and not target <= version:
            return False
        elif operator == "<" and not target < version:
            return False
        elif operator == "=" and not target[0] == version[0]:
            return False
    return True


def _parse_constraint(constraint: str) -> tuple[str, tuple[int, int, int]] | None:
    match = re.match(r"(\^|~|>=|<=|>|<|=)?\s*v?(\d+)(?:\.(\d+|x|\*))?(?:\.(\d+|x|\*))?", constraint)
    if not match:
        return None
    operator = match.group(1) or "="
    parts = []
    for value in match.groups()[1:]:
        if value in {None, "x", "*"}:
            parts.append(0)
        else:
            parts.append(int(value))
    return operator, (parts[0], parts[1], parts[2])


def _structural_file_contents(project_path: Path) -> dict[str, str]:
    contents: dict[str, str] = {}
    for file_name in ANGULAR_STRUCTURAL_FILES:
        file_path = project_path / file_name
        if not file_path.exists() or not file_path.is_file():
            continue
        try:
            contents[file_name] = file_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            contents[file_name] = "<binary>"
    return contents


def _changed_structural_files(project_path: Path, before: dict[str, str]) -> list[str]:
    after = _structural_file_contents(project_path)
    return sorted(file_name for file_name in set(before) | set(after) if before.get(file_name) != after.get(file_name))


def _is_global_angular_command(command: list[str]) -> bool:
    return len(command) >= 2 and command[0] == "ng" and command[1] == "update"


def _is_global_npm_install_update(command: list[str]) -> bool:
    return (
        len(command) >= 4
        and command[0] == "npm"
        and command[1] in {"install", "update"}
        and any(flag in command for flag in ("-g", "--global"))
    )
