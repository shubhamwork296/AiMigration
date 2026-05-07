from __future__ import annotations

import json
from importlib.resources import files

from migration_agent.adapters import find_adapter
from migration_agent.cli.args import MigrationConfig
from migration_agent.core.analyser import analyse_project
from migration_agent.core.executor import execute_changes
from migration_agent.core.executor import execute_single_change
from migration_agent.core.planner import build_migration_plan
from migration_agent.core.planner import repair_package_downgrades_from_validation
from migration_agent.core.reporter import generate_report
from migration_agent.core.rollback import create_snapshot, restore_snapshot
from migration_agent.core.validator import validate


async def run_migration(config: MigrationConfig) -> None:
    adapter = find_adapter(config.from_spec.runtime, config.project_path)
    rules = load_rules(config.from_spec.runtime, config.from_spec.version, config.to_spec.version)

    manifest = adapter.parse_manifest(config.project_path)
    analysis = await analyse_project(config.project_path, config, rules, manifest)
    plan = await build_migration_plan(analysis, rules, config.ai)

    print(f"Detected adapter: {adapter.runtime}")
    print(f"AI enabled: {config.ai.use_ai}")
    if config.ai.use_ai:
        print(f"AI provider: {config.ai.provider}")
        print(f"AI mode: {config.ai.mode}")
    print(f"Analysis mode: {analysis.get('analysisMode', 'unknown')}")
    print(f"Planning mode: {analysis.get('planningMode', 'unknown')}")
    print(f"Planned changes: {len(plan)}")
    _print_plan(plan)

    if config.dry_run:
        config.output_path.mkdir(parents=True, exist_ok=True)
        report = generate_report(plan, [], analysis, validation={"passed": None, "output": "Dry run only."})
        (config.output_path / "migration-report.md").write_text(report, encoding="utf-8")
        print(f"Dry run complete. Report written to {config.output_path / 'migration-report.md'}")
        return

    if not config.auto_approve and not _confirm("Apply these changes to a copy of the project?"):
        print("Migration cancelled before execution.")
        return

    snapshot = create_snapshot(config.project_path, config.output_path)
    results = execute_changes(plan, config.project_path, config.output_path, adapter)

    validation = validate(config.output_path, adapter)
    attempts = 0
    while not validation["passed"] and attempts < config.max_retries:
        attempts += 1
        repairs = await repair_package_downgrades_from_validation(validation, analysis, plan, rules, config.ai)
        if not repairs:
            print(f"Validation failed after attempt {attempts}. No safe package downgrade repairs were found.")
            break

        print(f"Validation failed after attempt {attempts}. Applying {len(repairs)} package downgrade repair(s).")
        plan.extend(repairs)
        for repair in repairs:
            results.append(execute_single_change(repair, config.output_path, adapter))
        validation = validate(config.output_path, adapter)

    if not validation["passed"]:
        print("Build failed. Restoring output from snapshot.")
        try:
            restore_snapshot(snapshot, config.output_path)
        except Exception as exc:
            validation["rollbackError"] = str(exc)
            print(f"Rollback failed: {exc}")

    report = generate_report(plan, results, analysis, validation)
    report_path = config.output_path / "migration-report.md"
    report_path.write_text(report, encoding="utf-8")
    print(f"Migration report written to {report_path}")


def load_rules(runtime: str, from_version: str, to_version: str) -> dict:
    rule_name = f"{from_version}-to-{to_version}.json"
    rule_path = files("migration_agent").joinpath("rules", runtime, rule_name)
    if not rule_path.is_file():
        raise FileNotFoundError(f"No rules found for {runtime} {from_version} to {to_version}")
    return json.loads(rule_path.read_text(encoding="utf-8"))


def _print_plan(plan: list[dict]) -> None:
    for index, change in enumerate(plan, start=1):
        description = change.get("description") or change.get("name") or change.get("type")
        print(f"  {index}. [{change['type']}] {description}")


def _confirm(prompt: str) -> bool:
    answer = input(f"{prompt} [y/N] ").strip().lower()
    return answer in {"y", "yes"}
