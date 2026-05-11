from __future__ import annotations

import json
from dataclasses import replace
from importlib.resources import files

from migration_agent.adapters import find_adapter
from migration_agent.ai.provider import resolve_ai_cli
from migration_agent.cli.args import MigrationConfig
from migration_agent.core.analyser import analyse_project
from migration_agent.core.executor import copy_project
from migration_agent.core.executor import execute_changes
from migration_agent.core.executor import execute_single_change
from migration_agent.core.planner import build_migration_plan
from migration_agent.core.planner import repair_dependency_conflicts_from_validation
from migration_agent.core.progress import ProgressReporter
from migration_agent.core.reporter import generate_adapter_hop_report, generate_report
from migration_agent.core.run_log import append_log, create_run_log_path
from migration_agent.core.rollback import create_snapshot, restore_snapshot
from migration_agent.core.timing import TimingRecorder
from migration_agent.core.validator import validate


async def run_migration(config: MigrationConfig) -> None:
    progress = ProgressReporter(config.verbosity)
    log_path = create_run_log_path(config.output_path)
    progress.log_file(log_path)
    append_log(log_path, "Migration run started.")
    if _should_resolve_ai_cli(config):
        config = _config_with_ai(config, resolve_ai_cli(config.ai, cwd=config.project_path, progress=progress, log_path=log_path))

    progress.stage("Analysis", "Selecting project runtime...")
    adapter = find_adapter(config.from_spec.runtime, config.project_path)
    progress.stage("Analysis", f"Using selected {adapter.runtime} adapter.")
    if not config.from_spec.version:
        manifest = adapter.parse_manifest(config.project_path)
        detected_version = manifest.get("angularVersion") or manifest.get("version")
        if detected_version:
            config = _config_with_from_version(config, str(detected_version))
    progress.stage("Analysis", "Planning migration hops...")
    hops = adapter.expand_migration_hops(config.from_spec.version, config.to_spec.version)
    if hops:
        progress.stage("Analysis", f"Planned hops: {_format_hops(hops)}.")
        await run_adapter_hop_migration(config, adapter, hops, progress=progress, log_path=log_path, analysis_announced=True)
        return
    progress.stage("Analysis", "No adapter-native migration hops required.")

    rules = load_rules(config.from_spec.runtime, config.from_spec.version, config.to_spec.version)

    manifest = adapter.parse_manifest(config.project_path)
    progress.stage("Analysis", "Analyzing project files...")
    analysis = await analyse_project(config.project_path, config, rules, manifest, adapter)
    progress.stage("Analysis", "Planning changes...")
    plan = await build_migration_plan(analysis, rules, config.ai)

    progress.stage("Analysis", f"Planned changes: {len(plan)}.")
    progress.detail(f"Detected adapter: {adapter.runtime}")
    progress.detail(f"AI enabled: {config.ai.use_ai}")
    if config.ai.use_ai:
        progress.detail(f"AI provider: {config.ai.provider}")
        progress.detail(f"AI mode: {config.ai.mode}")
    progress.detail(f"Analysis mode: {analysis.get('analysisMode', 'unknown')}")
    progress.detail(f"Planning mode: {analysis.get('planningMode', 'unknown')}")
    _print_plan(plan, progress)

    if config.dry_run:
        config.output_path.mkdir(parents=True, exist_ok=True)
        report = generate_report(plan, [], analysis, validation={"passed": None, "output": "Dry run only."})
        report_path = config.output_path / "migration-report.md"
        report_path.write_text(report, encoding="utf-8")
        progress.final_report(report_path)
        return

    if not config.auto_approve and not _confirm("Apply these changes to a copy of the project?"):
        progress.error("Execution", "Migration cancelled before execution.")
        return

    progress.stage("Execution", "Copying project...")
    snapshot = create_snapshot(config.project_path, config.output_path)
    results = execute_changes(plan, config.project_path, config.output_path, adapter)

    progress.stage("Validation", "Running validation...")
    validation = validate(config.output_path, adapter)
    attempts = 0
    while not validation["passed"] and attempts < config.max_retries:
        attempts += 1
        repairs = await repair_dependency_conflicts_from_validation(validation, analysis, plan, rules, config.ai)
        if not repairs:
            progress.error("Validation", f"Validation failed after attempt {attempts}. No safe dependency conflict repairs were found.")
            break

        progress.stage("Validation", f"Validation failed after attempt {attempts}. Applying {len(repairs)} dependency conflict repair(s).")
        plan.extend(repairs)
        for repair in repairs:
            results.append(execute_single_change(repair, config.output_path, adapter))
        validation = validate(config.output_path, adapter)

    if not validation["passed"]:
        progress.error("Validation", "Build failed. Restoring output from snapshot.")
        try:
            restore_snapshot(snapshot, config.output_path)
        except Exception as exc:
            validation["rollbackError"] = str(exc)
            progress.error("Validation", f"Rollback failed: {exc}")

    report = generate_report(plan, results, analysis, validation)
    report_path = config.output_path / "migration-report.md"
    report_path.write_text(report, encoding="utf-8")
    progress.final_report(report_path)


async def run_adapter_hop_migration(
    config: MigrationConfig,
    adapter,
    hops: list[dict],
    *,
    progress: ProgressReporter | None = None,
    log_path=None,
    analysis_announced: bool = False,
) -> None:
    progress = progress or ProgressReporter(config.verbosity)
    timing = TimingRecorder()
    if log_path is None:
        log_path = create_run_log_path(config.output_path)
        progress.log_file(log_path)
    if _should_resolve_ai_cli(config):
        config = _config_with_ai(config, resolve_ai_cli(config.ai, cwd=config.project_path, progress=progress, log_path=log_path))

    with timing.measure("runtime detection"):
        manifest = adapter.parse_manifest(config.project_path)
    if not analysis_announced:
        progress.stage("Analysis", "Detecting project runtime...")
    progress.stage("Analysis", f"Detected Angular {manifest.get('angularVersion', 'unknown')} project using {manifest.get('packageManager', 'unknown')}.")
    analysis = {
        "from": f"{config.from_spec.runtime}{config.from_spec.version}",
        "to": f"{config.to_spec.runtime}{config.to_spec.version}",
        "manifest": manifest,
        "riskLevel": "medium",
        "confidence": 80,
        "analysisMode": "adapter",
        "planningMode": "adapter-sequential",
    }
    with timing.measure("migration planning"):
        rules_by_hop = {
            (hop["fromVersion"], hop["toVersion"]): load_rules(
                config.from_spec.runtime,
                str(hop["fromVersion"]),
                str(hop["toVersion"]),
            )
            for hop in hops
        }

    if not analysis_announced:
        progress.stage("Analysis", "Planning migration hops...")
        progress.stage("Analysis", f"Planned hops: {_format_hops(hops)}.")
    progress.stage("Analysis", "Running preflight dependency compatibility checks...")

    if config.dry_run:
        config.output_path.mkdir(parents=True, exist_ok=True)
        report = generate_adapter_hop_report(
            analysis,
            hops,
            [],
            {"passed": None, "output": "Dry run only."},
        )
        report_path = config.output_path / "migration-report.md"
        report_path.write_text(report, encoding="utf-8")
        _write_timing_summary(config, progress, timing)
        progress.final_report(report_path)
        return

    if not config.auto_approve and not _confirm("Apply these migration hops to a copy of the project?"):
        progress.error("Execution", "Migration cancelled before execution.")
        return

    progress.stage("Execution", "Copying project...")
    with timing.measure("project copy"):
        copy_project(config.project_path, config.output_path)
    hop_results = []
    validation = {"passed": True, "output": "All migration hops passed."}

    for hop in hops:
        snapshot = create_snapshot(config.output_path, config.output_path)
        rules = rules_by_hop[(hop["fromVersion"], hop["toVersion"])]
        with timing.measure(f"Angular hop {hop['fromVersion']} -> {hop['toVersion']}"):
            result = adapter.execute_migration_hop(
                config.output_path,
                hop,
                rules,
                optional_migrations_enabled=config.optional_migrations,
                progress=progress,
                log_path=log_path,
                auto_remediate_dependencies=config.auto_remediate_dependencies,
                on_dependency_compatibility_issue=config.on_dependency_compatibility_issue,
                allow_angular_force_update=config.allow_angular_force_update,
                allow_prerelease_dependency_versions=config.allow_prerelease_dependency_versions,
                max_dependency_remediation_retries_per_hop=config.max_dependency_remediation_retries_per_hop,
                continue_after_successful_remediation=config.continue_after_successful_remediation,
                dependency_check_timeout_seconds=config.dependency_check_timeout_seconds,
                skip_preflight_dependency_compatibility=config.skip_preflight_dependency_compatibility,
                preflight_remediation_mode=config.preflight_remediation_mode,
                allow_legacy_peer_deps_fallback=config.allow_legacy_peer_deps_fallback,
                ai_config=config.ai,
                command_timeout_seconds=config.command_timeout_seconds,
            )
        result["snapshotPath"] = str(snapshot)
        hop_results.append(result)

        if result["status"] != "done":
            validation = {
                "passed": False,
                "failedHop": f"{hop['fromVersion']} -> {hop['toVersion']}",
                "errors": result.get("validation", {}).get("errors", "Migration hop failed."),
            }
            if not result.get("commands"):
                progress.stage("Analysis", f"Found dependency blockers for Angular {hop['fromVersion']} -> {hop['toVersion']}.")
            _print_failure_summary(progress, result, log_path)
            progress.stage(
                _hop_stage(hop),
                "Execution skipped. See migration report for suggested fixes."
                if not result.get("commands")
                else "Migration failed. Restoring output from snapshot.",
            )
            if result.get("commands") or result.get("files"):
                try:
                    with timing.measure("rollback"):
                        restore_snapshot(snapshot, config.output_path)
                except Exception as exc:
                    validation["rollbackError"] = str(exc)
                    progress.error(_hop_stage(hop), f"Rollback failed: {exc}")
            break

    with timing.measure("report generation"):
        report = generate_adapter_hop_report(analysis, hops, hop_results, validation)
    report_path = config.output_path / "migration-report.md"
    report_path.write_text(report, encoding="utf-8")
    _write_timing_summary(config, progress, timing)
    progress.final_report(report_path)


def load_rules(runtime: str, from_version: str, to_version: str) -> dict:
    rule_name = f"{from_version}-to-{to_version}.json"
    rule_path = files("migration_agent").joinpath("rules", runtime, rule_name)
    if not rule_path.is_file():
        raise FileNotFoundError(f"No rules found for {runtime} {from_version} to {to_version}")
    return json.loads(rule_path.read_text(encoding="utf-8"))


def _print_plan(plan: list[dict], progress: ProgressReporter) -> None:
    for index, change in enumerate(plan, start=1):
        description = change.get("description") or change.get("name") or change.get("type")
        progress.detail(f"  {index}. [{change['type']}] {description}")


def _confirm(prompt: str) -> bool:
    answer = input(f"{prompt} [y/N] ").strip().lower()
    return answer in {"y", "yes"}


def _format_hops(hops: list[dict]) -> str:
    return ", ".join(f"{hop['fromVersion']} -> {hop['toVersion']}" for hop in hops)


def _config_with_from_version(config: MigrationConfig, version: str) -> MigrationConfig:
    return replace(config, from_spec=replace(config.from_spec, version=version))


def _config_with_ai(config: MigrationConfig, ai_config) -> MigrationConfig:
    return replace(config, ai=ai_config)


def _should_resolve_ai_cli(config: MigrationConfig) -> bool:
    return config.ai.provider is None and (config.ai.use_ai or config.ai.ai_cli == "none")


def _write_timing_summary(config: MigrationConfig, progress: ProgressReporter, timing: TimingRecorder) -> None:
    json_path, md_path = timing.write(config.output_path)
    if config.show_timing_summary:
        progress.stage("Timing", f"Timing summary written to {json_path} and {md_path}.")


def _hop_stage(hop: dict) -> str:
    return f"Angular {hop['fromVersion']} -> {hop['toVersion']}"


def _print_failure_summary(progress: ProgressReporter, result: dict, log_path) -> None:
    hop = result["hop"]
    stage = _hop_stage(hop)
    progress.error(stage, f"Failed during {result.get('failureStage', 'Angular CLI update')}.")
    reason = result.get("failureReason") or "migration command failed"
    print(f"Reason: {reason}.")
    if result.get("failurePackage"):
        print(f"Package: {result['failurePackage']}")
    print(f"Full log: {log_path}")
