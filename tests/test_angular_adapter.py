import asyncio
import json
import shutil
import uuid
from pathlib import Path

import pytest

from migration_agent.adapters.angular import ANGULAR_STRUCTURAL_FILES, AngularAdapter
from migration_agent.adapters.package_classifier import package_by_name
from migration_agent.cli.args import MigrationConfig, RuntimeSpec
from migration_agent.ai.provider import AiConfig
from migration_agent.core.agent import _print_failure_summary, run_adapter_hop_migration
from migration_agent.core.progress import ProgressReporter
from migration_agent.core.reporter import generate_adapter_hop_report


@pytest.fixture
def workspace_tmp():
    root = Path("tests") / ".tmp-angular" / uuid.uuid4().hex
    root.mkdir(parents=True, exist_ok=True)
    try:
        yield root
    finally:
        shutil.rmtree(root, ignore_errors=True)


def write_json(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def angular_package(core: str = "14.2.0", cli: str = "14.2.0", scripts: dict | None = None) -> dict:
    return {
        "dependencies": {
            "@angular/core": core,
            "rxjs": "^7.5.0",
        },
        "devDependencies": {
            "@angular/cli": cli,
            "typescript": "~4.8.4",
        },
        "scripts": scripts or {"build": "ng build"},
    }


def angular_package_with_spinner() -> dict:
    data = angular_package()
    data["dependencies"]["ngx-spinner"] = "^11.0.0"
    return data


def angular_package_with_flex_layout() -> dict:
    data = angular_package()
    data["dependencies"]["@angular/flex-layout"] = "^14.0.0-beta.40"
    return data


def fake_npm_metadata(command, cwd=None, **kwargs):
    if command == ["npm", "view", "@angular/core@15", "version", "--json"]:
        return {"returncode": 0, "stdout": json.dumps("15.2.10"), "stderr": "", "resolvedCommand": command}
    if command == ["npm", "view", "@angular/core@16", "version", "--json"]:
        return {"returncode": 0, "stdout": json.dumps("16.2.12"), "stderr": "", "resolvedCommand": command}
    if command == ["npm", "view", "@angular/core@17", "version", "--json"]:
        return {"returncode": 0, "stdout": json.dumps("17.3.12"), "stderr": "", "resolvedCommand": command}
    if command == ["npm", "view", "@angular/core@18", "version", "--json"]:
        return {"returncode": 0, "stdout": json.dumps("18.2.13"), "stderr": "", "resolvedCommand": command}
    if command[:3] == ["npm", "view", "ngx-spinner@^11.0.0"] and command[3:] == ["peerDependencies", "--json"]:
        return {
            "returncode": 0,
            "stdout": json.dumps({"@angular/common": "^11.0.0", "@angular/core": "^11.0.0"}),
            "stderr": "",
            "resolvedCommand": command,
        }
    if command == ["npm", "view", "ngx-spinner@15", "version", "--json"]:
        return {"returncode": 0, "stdout": json.dumps("15.0.0"), "stderr": "", "resolvedCommand": command}
    if command == ["npm", "view", "ngx-spinner@16", "version", "--json"]:
        return {"returncode": 0, "stdout": json.dumps("16.0.0"), "stderr": "", "resolvedCommand": command}
    if command == ["npm", "view", "ngx-spinner@17", "version", "--json"]:
        return {"returncode": 0, "stdout": json.dumps("17.0.0"), "stderr": "", "resolvedCommand": command}
    if command == ["npm", "view", "ngx-spinner@18", "version", "--json"]:
        return {"returncode": 0, "stdout": json.dumps("18.0.0"), "stderr": "", "resolvedCommand": command}
    if command == ["npm", "view", "ngx-spinner", "version", "--json"]:
        return {"returncode": 0, "stdout": json.dumps("18.0.0"), "stderr": "", "resolvedCommand": command}
    if command == ["npm", "view", "ngx-spinner", "versions", "--json"]:
        return {"returncode": 0, "stdout": json.dumps(["11.0.0", "14.0.0", "15.0.0", "16.0.0", "17.0.0", "18.0.0"]), "stderr": "", "resolvedCommand": command}
    if command[:3] == ["npm", "view", "ngx-spinner@18.0.0"] and command[3:] == ["peerDependencies", "--json"]:
        return {"returncode": 0, "stdout": json.dumps({"@angular/core": "^18.0.0"}), "stderr": "", "resolvedCommand": command}
    if command[:3] == ["npm", "view", "ngx-spinner@17.0.0"] and command[3:] == ["peerDependencies", "--json"]:
        return {"returncode": 0, "stdout": json.dumps({"@angular/core": "^17.0.0"}), "stderr": "", "resolvedCommand": command}
    if command[:3] == ["npm", "view", "ngx-spinner@16.0.0"] and command[3:] == ["peerDependencies", "--json"]:
        return {"returncode": 0, "stdout": json.dumps({"@angular/core": "^16.0.0"}), "stderr": "", "resolvedCommand": command}
    if command[:3] == ["npm", "view", "ngx-spinner@15.0.0"] and command[3:] == ["peerDependencies", "--json"]:
        return {"returncode": 0, "stdout": json.dumps({"@angular/core": "^15.0.0"}), "stderr": "", "resolvedCommand": command}
    if command == ["npm", "view", "@angular/flex-layout@15", "version", "--json"]:
        return {"returncode": 1, "stdout": "", "stderr": "No match found for version 15", "resolvedCommand": command}
    if command[:3] == ["npm", "view", "@angular/flex-layout@^14.0.0-beta.40"] and command[3:] == ["peerDependencies", "--json"]:
        return {"returncode": 0, "stdout": json.dumps({"@angular/core": "^14.0.0"}), "stderr": "", "resolvedCommand": command}
    if command == ["npm", "view", "@angular/flex-layout", "version", "--json"]:
        return {"returncode": 0, "stdout": json.dumps("15.0.0-beta.42"), "stderr": "", "resolvedCommand": command}
    if command[:3] == ["npm", "view", "@angular/flex-layout@15.0.0-beta.42"] and command[3:] == ["peerDependencies", "--json"]:
        return {"returncode": 0, "stdout": json.dumps({"@angular/core": "^15.0.0"}), "stderr": "", "resolvedCommand": command}
    if len(command) >= 5 and command[:2] == ["npm", "view"] and command[-2:] == ["peerDependencies", "--json"]:
        return {"returncode": 0, "stdout": "{}", "stderr": "", "resolvedCommand": command}
    if command[:2] in (["npm", "install"], ["npm", "run"]):
        return {"returncode": 0, "stdout": "ok", "stderr": "", "resolvedCommand": command}
    if command[:2] == ["npx", "--yes"]:
        return {"returncode": 0, "stdout": "updated", "stderr": "", "resolvedCommand": command}
    return {"returncode": 0, "stdout": "{}", "stderr": "", "resolvedCommand": command}


def test_angular_project_detection_from_package_json(workspace_tmp):
    write_json(workspace_tmp / "package.json", angular_package())

    assert AngularAdapter().detect(workspace_tmp)


def test_angular_adapter_rejects_non_angular_package_json(workspace_tmp):
    write_json(workspace_tmp / "package.json", {"dependencies": {"react": "18.2.0"}})

    assert not AngularAdapter().detect(workspace_tmp)


def test_package_manager_detection_for_npm_yarn_pnpm(workspace_tmp):
    adapter = AngularAdapter()
    write_json(workspace_tmp / "package.json", angular_package())

    (workspace_tmp / "package-lock.json").write_text("{}", encoding="utf-8")
    assert adapter.detect_package_manager(workspace_tmp) == ("npm", "package-lock.json")
    (workspace_tmp / "package-lock.json").unlink()

    (workspace_tmp / "yarn.lock").write_text("", encoding="utf-8")
    assert adapter.detect_package_manager(workspace_tmp) == ("yarn", "yarn.lock")
    (workspace_tmp / "yarn.lock").unlink()

    (workspace_tmp / "pnpm-lock.yaml").write_text("", encoding="utf-8")
    assert adapter.detect_package_manager(workspace_tmp) == ("pnpm", "pnpm-lock.yaml")


def test_angular_14_to_18_expands_into_four_hops():
    hops = AngularAdapter().expand_migration_hops("14", "18")

    assert [(hop["fromVersion"], hop["toVersion"]) for hop in hops] == [
        (14, 15),
        (15, 16),
        (16, 17),
        (17, 18),
    ]


def test_each_hop_uses_angular_cli_update_command():
    adapter = AngularAdapter()

    assert adapter.angular_update_command(15) == [
        "npx",
        "--yes",
        "@angular/cli@15",
        "update",
        "@angular/core@15",
        "@angular/cli@15",
        "--allow-dirty",
        "--force",
    ]
    assert adapter.angular_update_command(18) == [
        "npx",
        "--yes",
        "@angular/cli@18",
        "update",
        "@angular/core@18",
        "@angular/cli@18",
        "--allow-dirty",
        "--force",
    ]


def test_angular_migration_commands_use_version_pinned_npx():
    adapter = AngularAdapter()

    for target in (15, 16, 17, 18):
        command = adapter.angular_update_command(target)
        assert command[:4] == ["npx", "--yes", f"@angular/cli@{target}", "update"]
        assert f"@angular/core@{target}" in command
        assert f"@angular/cli@{target}" in command


def test_angular_migration_commands_do_not_use_global_ng_or_global_npm():
    adapter = AngularAdapter()
    commands = [adapter.angular_update_command(target) for target in (15, 16, 17, 18)]

    assert not any(command[:2] == ["ng", "update"] for command in commands)
    assert not any(command[:2] == ["npm", "install"] and "-g" in command for command in commands)


def test_bad_rule_command_is_replaced_with_version_pinned_npx():
    adapter = AngularAdapter()

    assert adapter._safe_angular_migration_command(["ng", "update", "@angular/core@15"], 15) == [
        "npx",
        "--yes",
        "@angular/cli@15",
        "update",
        "@angular/core@15",
        "@angular/cli@15",
        "--allow-dirty",
        "--force",
    ]
    assert adapter._safe_angular_migration_command(["npm", "install", "-g", "@angular/cli"], 15) == [
        "npx",
        "--yes",
        "@angular/cli@15",
        "update",
        "@angular/core@15",
        "@angular/cli@15",
        "--allow-dirty",
        "--force",
    ]
    assert adapter._safe_angular_migration_command(["npm", "update", "--global", "@angular/cli"], 15) == [
        "npx",
        "--yes",
        "@angular/cli@15",
        "update",
        "@angular/core@15",
        "@angular/cli@15",
        "--allow-dirty",
        "--force",
    ]


def test_no_direct_14_to_18_package_edit_plan_is_produced():
    adapter = AngularAdapter()

    assert adapter.expand_migration_hops("14", "18")
    assert not adapter.upgrade_package(Path("missing"), {"name": "@angular/core", "toVersion": "18.0.0"})


def test_angular_structural_files_are_collected_by_adapter(workspace_tmp):
    write_json(workspace_tmp / "package.json", angular_package())
    for file_name in ANGULAR_STRUCTURAL_FILES - {"package.json"}:
        (workspace_tmp / file_name).write_text("{}", encoding="utf-8")

    collected = AngularAdapter().collect_project_files(workspace_tmp)

    assert set(collected) == ANGULAR_STRUCTURAL_FILES


def test_missing_test_script_is_reported_as_skipped_not_failed(workspace_tmp):
    write_json(workspace_tmp / "package.json", angular_package(scripts={"build": "ng build"}))
    (workspace_tmp / "package-lock.json").write_text("{}", encoding="utf-8")

    manifest = AngularAdapter().parse_manifest(workspace_tmp)
    validations = AngularAdapter().validation_commands(manifest)

    assert validations[1] == {"description": "test", "skip": True, "reason": "package.json has no test script"}


def test_optional_angular_18_application_builder_migration_not_applied_by_default(workspace_tmp):
    write_json(workspace_tmp / "package.json", angular_package(core="17.3.0", cli="17.3.0"))
    write_json(
        workspace_tmp / "angular.json",
        {
            "projects": {
                "app": {
                    "architect": {
                        "build": {"builder": "@angular-devkit/build-angular:browser"}
                    }
                }
            }
        },
    )

    optional = AngularAdapter().optional_migrations(workspace_tmp, 18, enabled=False)

    assert optional[0]["available"]
    assert not optional[0]["applied"]


def test_optional_angular_18_application_builder_migration_uses_pinned_npx(workspace_tmp):
    write_json(workspace_tmp / "package.json", angular_package(core="17.3.0", cli="17.3.0"))
    write_json(
        workspace_tmp / "angular.json",
        {
            "projects": {
                "app": {
                    "architect": {
                        "build": {"builder": "@angular-devkit/build-angular:browser"}
                    }
                }
            }
        },
    )

    optional = AngularAdapter().optional_migrations(workspace_tmp, 18, enabled=True)

    assert optional[0]["command"] == [
        "npx",
        "--yes",
        "@angular/cli@18",
        "update",
        "@angular/cli",
        "--name",
        "use-application-builder",
    ]
    assert optional[0]["command"][:2] != ["ng", "update"]


def test_safe_angular_command_adds_yes_to_rule_npx_command():
    adapter = AngularAdapter()

    assert adapter._safe_angular_migration_command(
        ["npx", "@angular/cli@15", "update", "@angular/core@15", "@angular/cli@15"],
        15,
    ) == ["npx", "--yes", "@angular/cli@15", "update", "@angular/core@15", "@angular/cli@15", "--allow-dirty", "--force"]


def test_angular_preflight_reads_package_json_dependencies(workspace_tmp, monkeypatch):
    write_json(workspace_tmp / "package.json", angular_package_with_spinner())
    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake_npm_metadata)

    result = AngularAdapter().analyze_peer_dependency_compatibility(workspace_tmp, 15)

    checked = {item["name"] for item in result["checked"]}
    assert "@angular/core" in checked
    assert "@angular/cli" in checked
    assert "ngx-spinner" in checked


def test_ngx_package_is_included_in_peer_dependency_analysis(workspace_tmp, monkeypatch):
    write_json(workspace_tmp / "package.json", angular_package_with_spinner())
    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake_npm_metadata)

    result = AngularAdapter().analyze_peer_dependency_compatibility(workspace_tmp, 15)

    assert any(item["name"] == "ngx-spinner" for item in result["checked"])


def test_incompatible_peer_dependency_is_detected_before_execution(workspace_tmp, monkeypatch):
    write_json(workspace_tmp / "package.json", angular_package_with_spinner())
    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake_npm_metadata)

    result = AngularAdapter().analyze_peer_dependency_compatibility(workspace_tmp, 15)

    assert result["status"] == "advisory-warnings"
    assert result["blockers"][0]["package"] == "ngx-spinner"
    assert result["blockers"][0]["peer"] == "@angular/common"
    assert result["blockers"][0]["requiredRange"] == "^11.0.0"


def test_ngx_spinner_requiring_angular_11_does_not_block_angular_14_to_15(workspace_tmp, monkeypatch):
    write_json(workspace_tmp / "package.json", angular_package_with_spinner())
    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake_npm_metadata)
    monkeypatch.setattr("migration_agent.adapters.angular._node_version", lambda project_path: (16, 13, 0))

    result = AngularAdapter().execute_migration_hop(
        workspace_tmp,
        {"fromVersion": 14, "toVersion": 15},
        {"migrationCommand": ["npx", "--yes", "@angular/cli@15", "update", "@angular/core@15", "@angular/cli@15"]},
    )

    assert result["status"] == "done"
    assert result["dependencyCompatibilityRemediations"] == []
    assert result["preflightDependencyAnalysis"]["blockers"][0]["package"] == "ngx-spinner"
    assert any("Migration continued" in warning for warning in result["preflightDependencyAnalysis"]["warnings"])


def test_report_includes_preflight_dependency_blocker(workspace_tmp, monkeypatch):
    write_json(workspace_tmp / "package.json", angular_package_with_spinner())
    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake_npm_metadata)
    result = AngularAdapter().execute_migration_hop(
        workspace_tmp,
        {"fromVersion": 14, "toVersion": 15},
        {"migrationCommand": ["npx", "--yes", "@angular/cli@15", "update", "@angular/core@15", "@angular/cli@15"]},
        on_dependency_compatibility_issue="stop-hop",
    )

    report = generate_adapter_hop_report(
        {"to": "angular15", "manifest": AngularAdapter().parse_manifest(workspace_tmp)},
        [{"fromVersion": 14, "toVersion": 15}],
        [result],
        {"passed": False, "failedHop": "14 -> 15", "errors": "blocked"},
    )

    assert "## Preflight Dependency Compatibility Analysis" in report
    assert "Package: ngx-spinner" in report
    assert "Incompatible peer: @angular/common" in report
    assert "## Warnings" in report
    assert "Migration continued; validate after install/build." in report


def test_angular_cli_command_is_executed_when_preflight_warnings_exist_and_policy_is_stop_hop(workspace_tmp, monkeypatch):
    write_json(workspace_tmp / "package.json", angular_package_with_spinner())
    calls = []

    def fake(command, cwd=None, **kwargs):
        calls.append(command)
        return fake_npm_metadata(command, cwd, **kwargs)

    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake)

    AngularAdapter().execute_migration_hop(
        workspace_tmp,
        {"fromVersion": 14, "toVersion": 15},
        {"migrationCommand": ["npx", "--yes", "@angular/cli@15", "update", "@angular/core@15", "@angular/cli@15"]},
        on_dependency_compatibility_issue="stop-hop",
    )

    assert any(command[:2] == ["npx", "--yes"] for command in calls)


def test_third_party_angular_peer_warning_is_advisory_without_preflight_upgrade(workspace_tmp, monkeypatch):
    write_json(workspace_tmp / "package.json", angular_package_with_spinner())
    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake_npm_metadata)

    result = AngularAdapter().analyze_peer_dependency_compatibility(workspace_tmp, 15)

    assert result["blockers"][0]["package"] == "ngx-spinner"
    assert result["blockers"][0]["blocking"] is False
    assert result["blockers"][0]["suggestedVersion"] is None
    assert result["blockers"][0]["suggestedCommand"] is None


def test_preflight_does_not_scan_angular_framework_patch_versions(workspace_tmp, monkeypatch):
    package = angular_package_with_spinner()
    package["dependencies"]["@angular/forms"] = "14.2.0"
    write_json(workspace_tmp / "package.json", package)
    calls = []

    def fake(command, cwd=None, **kwargs):
        calls.append(command)
        return fake_npm_metadata(command, cwd, **kwargs)

    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake)

    AngularAdapter().analyze_peer_dependency_compatibility(workspace_tmp, 15)

    assert not any(command[:3] == ["npm", "view", "@angular/forms@16.2.12"] for command in calls)
    assert not any(command[:3] == ["npm", "view", "@angular/forms@16.2.11"] for command in calls)
    assert not any(command == ["npm", "view", "ngx-spinner@15", "version", "--json"] for command in calls)


def test_only_one_target_angular_version_is_resolved_per_hop(workspace_tmp, monkeypatch):
    package = angular_package()
    package["dependencies"]["@angular/forms"] = "14.2.0"
    package["dependencies"]["@angular/router"] = "14.2.0"
    write_json(workspace_tmp / "package.json", package)
    calls = []

    def fake(command, cwd=None, **kwargs):
        calls.append(command)
        return fake_npm_metadata(command, cwd, **kwargs)

    adapter = AngularAdapter()
    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake)

    adapter.analyze_peer_dependency_compatibility(workspace_tmp, 15)

    assert calls.count(["npm", "view", "@angular/core@15", "version", "--json"]) == 1


def test_npm_view_results_are_cached(workspace_tmp, monkeypatch):
    write_json(workspace_tmp / "package.json", angular_package_with_spinner())
    calls = []

    def fake(command, cwd=None, **kwargs):
        calls.append(command)
        return fake_npm_metadata(command, cwd, **kwargs)

    adapter = AngularAdapter()
    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake)

    adapter.analyze_peer_dependency_compatibility(workspace_tmp, 15)
    adapter.analyze_peer_dependency_compatibility(workspace_tmp, 15)

    assert calls.count(["npm", "view", "@angular/core@15", "version", "--json"]) == 1
    assert calls.count(["npm", "view", "ngx-spinner@^11.0.0", "peerDependencies", "--json"]) == 1


def test_angular_scoped_package_is_not_treated_as_manual_third_party_blocker(workspace_tmp, monkeypatch):
    write_json(workspace_tmp / "package.json", angular_package_with_flex_layout())
    calls = []

    def fake(command, cwd=None, **kwargs):
        calls.append(command)
        return fake_npm_metadata(command, cwd, **kwargs)

    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake)
    monkeypatch.setattr("migration_agent.adapters.angular._node_version", lambda project_path: (16, 13, 0))

    result = AngularAdapter().execute_migration_hop(
        workspace_tmp,
        {"fromVersion": 14, "toVersion": 15},
        {"migrationCommand": ["npx", "--yes", "@angular/cli@15", "update", "@angular/core@15", "@angular/cli@15"]},
    )

    assert result["status"] == "done"
    assert ["npm", "view", "@angular/flex-layout@15", "version", "--json"] not in calls
    assert not any(blocker["package"] == "@angular/flex-layout" for blocker in result["preflightDependencyAnalysis"]["blockers"])


def test_angular_scoped_package_is_classified_as_framework_package(workspace_tmp, monkeypatch):
    write_json(workspace_tmp / "package.json", angular_package_with_flex_layout())
    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake_npm_metadata)

    result = AngularAdapter().analyze_peer_dependency_compatibility(workspace_tmp, 15)

    package = package_by_name(result["packageClassification"])["@angular/flex-layout"]
    assert package["role"] == "framework-extension"
    assert package["recommendedAction"] == "upgrade-with-framework-target"
    assert not any(blocker["package"] == "@angular/flex-layout" for blocker in result["blockers"])


def test_package_major_lookup_is_only_used_for_official_angular_framework_packages(workspace_tmp, monkeypatch):
    package = angular_package_with_flex_layout()
    package["dependencies"]["@ng-bootstrap/ng-bootstrap"] = "^13.0.0"
    package["dependencies"]["ngx-cookie-service"] = "^14.0.0"
    write_json(workspace_tmp / "package.json", package)
    calls = []

    def fake(command, cwd=None, **kwargs):
        calls.append(command)
        return fake_npm_metadata(command, cwd, **kwargs)

    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake)

    AngularAdapter().analyze_peer_dependency_compatibility(workspace_tmp, 15)

    assert ["npm", "view", "@angular/core@15", "version", "--json"] in calls
    assert not any(command == ["npm", "view", "@angular/flex-layout@15", "version", "--json"] for command in calls)
    assert not any(command == ["npm", "view", "@ng-bootstrap/ng-bootstrap@15", "version", "--json"] for command in calls)
    assert not any(command == ["npm", "view", "ngx-cookie-service@15", "version", "--json"] for command in calls)


def test_third_party_package_e404_is_logged_as_warning(workspace_tmp, monkeypatch):
    package = angular_package()
    package["dependencies"]["ngx-missing"] = "^1.0.0"
    write_json(workspace_tmp / "package.json", package)

    def fake(command, cwd=None, **kwargs):
        if command[:3] in (["npm", "view", "ngx-missing@^1.0.0"], ["npm", "view", "ngx-missing"]):
            return {"returncode": 1, "stdout": "", "stderr": "E404 not found", "resolvedCommand": command}
        return fake_npm_metadata(command, cwd, **kwargs)

    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake)

    result = AngularAdapter().analyze_peer_dependency_compatibility(workspace_tmp, 15)

    assert result["status"] == "advisory-warnings"
    assert result["blockers"] == []
    assert any("ngx-missing compatibility metadata unavailable" in warning for warning in result["warnings"])


def test_dependency_check_timeout_continues_advisory_phase(workspace_tmp, monkeypatch):
    write_json(workspace_tmp / "package.json", angular_package_with_spinner())
    times = iter([0, 301])
    monkeypatch.setattr("migration_agent.adapters.angular.time.monotonic", lambda: next(times))
    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake_npm_metadata)

    result = AngularAdapter().analyze_peer_dependency_compatibility(workspace_tmp, 15, timeout_seconds=300)

    assert result["status"] == "timed-out"
    assert "Continuing because this phase is advisory" in result["warnings"][0]


def test_skip_preflight_dependency_compatibility_bypasses_check(workspace_tmp, monkeypatch):
    write_json(workspace_tmp / "package.json", angular_package_with_spinner())
    adapter = AngularAdapter()

    def fail(*args, **kwargs):
        raise AssertionError("preflight should be skipped")

    monkeypatch.setattr(adapter, "analyze_peer_dependency_compatibility", fail)
    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake_npm_metadata)
    monkeypatch.setattr("migration_agent.adapters.angular._node_version", lambda project_path: (16, 13, 0))

    result = adapter.execute_migration_hop(
        workspace_tmp,
        {"fromVersion": 14, "toVersion": 15},
        {"migrationCommand": ["npx", "--yes", "@angular/cli@15", "update", "@angular/core@15", "@angular/cli@15"]},
        skip_preflight_dependency_compatibility=True,
    )

    assert result["status"] == "done"
    assert result["preflightDependencyAnalysis"]["status"] == "skipped"


def test_unknown_package_compatibility_does_not_stop_migration(workspace_tmp, monkeypatch):
    package = angular_package()
    package["dependencies"]["ngx-unknown"] = "^1.0.0"
    write_json(workspace_tmp / "package.json", package)

    def fake(command, cwd=None, **kwargs):
        if command[:3] == ["npm", "view", "ngx-unknown@^1.0.0"]:
            return {"returncode": 1, "stdout": "", "stderr": "not found", "resolvedCommand": command}
        return fake_npm_metadata(command, cwd, **kwargs)

    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake)
    monkeypatch.setattr("migration_agent.adapters.angular._node_version", lambda project_path: (16, 13, 0))

    result = AngularAdapter().execute_migration_hop(
        workspace_tmp,
        {"fromVersion": 14, "toVersion": 15},
        {"migrationCommand": ["npx", "--yes", "@angular/cli@15", "update", "@angular/core@15", "@angular/cli@15"]},
    )

    assert result["status"] == "done"


def test_dependency_compatibility_issue_is_not_vulnerability(workspace_tmp, monkeypatch):
    write_json(workspace_tmp / "package.json", angular_package_with_spinner())
    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake_npm_metadata)

    result = AngularAdapter().analyze_peer_dependency_compatibility(workspace_tmp, 15)

    assert result["blockers"][0]["issueType"] == "Dependency Compatibility Issue"
    assert "vulnerability" not in json.dumps(result["blockers"]).lower()


def test_build_validation_runs_after_dependency_remediation(workspace_tmp, monkeypatch):
    write_json(workspace_tmp / "package.json", angular_package_with_spinner())
    calls = []

    def fake(command, cwd=None, **kwargs):
        calls.append(command)
        return fake_npm_metadata(command, cwd, **kwargs)

    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake)
    monkeypatch.setattr("migration_agent.adapters.angular._node_version", lambda project_path: (16, 13, 0))

    AngularAdapter().execute_migration_hop(
        workspace_tmp,
        {"fromVersion": 14, "toVersion": 15},
        {"migrationCommand": ["npx", "--yes", "@angular/cli@15", "update", "@angular/core@15", "@angular/cli@15"]},
    )

    assert ["npm", "run", "build"] in calls


def test_angular_cli_update_retries_after_successful_cli_peer_remediation(workspace_tmp, monkeypatch):
    write_json(workspace_tmp / "package.json", angular_package())
    calls = []
    angular_failures = 0

    def fake(command, cwd=None, **kwargs):
        nonlocal angular_failures
        calls.append(command)
        if command[:2] == ["npx", "--yes"] and angular_failures == 0:
            angular_failures += 1
            return {
                "returncode": 1,
                "stdout": "",
                "stderr": 'Package "ngx-spinner" has an incompatible peer dependency to "@angular/core" (requires "^11.0.0", would install "15.2.10").',
                "resolvedCommand": command,
            }
        return fake_npm_metadata(command, cwd, **kwargs)

    package = angular_package()
    package["dependencies"]["ngx-spinner"] = "^11.0.0"
    write_json(workspace_tmp / "package.json", package)
    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake)
    monkeypatch.setattr("migration_agent.adapters.angular._node_version", lambda project_path: (16, 13, 0))
    monkeypatch.setattr(AngularAdapter, "analyze_peer_dependency_compatibility", lambda self, project_path, target_major, **kwargs: {"targetAngularMajor": target_major, "status": "passed", "checked": [], "blockers": []})

    result = AngularAdapter().execute_migration_hop(
        workspace_tmp,
        {"fromVersion": 14, "toVersion": 15},
        {"migrationCommand": ["npx", "--yes", "@angular/cli@15", "update", "@angular/core@15", "@angular/cli@15"]},
    )

    angular_commands = [command for command in calls if command[:2] == ["npx", "--yes"]]
    assert result["status"] == "done"
    assert len(angular_commands) == 2
    assert result["retriedAngularUpdate"]


def test_auto_remediate_dependencies_false_does_not_modify_package_json(workspace_tmp, monkeypatch):
    write_json(workspace_tmp / "package.json", angular_package_with_spinner())
    original = (workspace_tmp / "package.json").read_text(encoding="utf-8")
    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake_npm_metadata)

    AngularAdapter().execute_migration_hop(
        workspace_tmp,
        {"fromVersion": 14, "toVersion": 15},
        {"migrationCommand": ["npx", "--yes", "@angular/cli@15", "update", "@angular/core@15", "@angular/cli@15"]},
        auto_remediate_dependencies=False,
        on_dependency_compatibility_issue="stop-hop",
    )

    assert (workspace_tmp / "package.json").read_text(encoding="utf-8") == original


def test_preflight_remediation_mode_off_does_not_mutate_package_json(workspace_tmp, monkeypatch):
    write_json(workspace_tmp / "package.json", angular_package_with_spinner())
    original = (workspace_tmp / "package.json").read_text(encoding="utf-8")
    calls = []

    def fake(command, cwd=None, **kwargs):
        calls.append(command)
        return fake_npm_metadata(command, cwd, **kwargs)

    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake)
    monkeypatch.setattr("migration_agent.adapters.angular._node_version", lambda project_path: (16, 13, 0))

    result = AngularAdapter().execute_migration_hop(
        workspace_tmp,
        {"fromVersion": 14, "toVersion": 15},
        {"migrationCommand": ["npx", "--yes", "@angular/cli@15", "update", "@angular/core@15", "@angular/cli@15"]},
        preflight_remediation_mode="off",
    )

    assert (workspace_tmp / "package.json").read_text(encoding="utf-8") == original
    assert ["npm", "install"] in calls
    assert result["preflightDependencyAnalysis"]["blockers"][0]["suggestedVersion"] is None


def test_preflight_remediation_mode_suggest_records_advisory_warning_and_continues(workspace_tmp, monkeypatch):
    write_json(workspace_tmp / "package.json", angular_package_with_spinner())
    original = (workspace_tmp / "package.json").read_text(encoding="utf-8")
    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake_npm_metadata)
    monkeypatch.setattr("migration_agent.adapters.angular._node_version", lambda project_path: (16, 13, 0))

    result = AngularAdapter().execute_migration_hop(
        workspace_tmp,
        {"fromVersion": 14, "toVersion": 15},
        {"migrationCommand": ["npx", "--yes", "@angular/cli@15", "update", "@angular/core@15", "@angular/cli@15"]},
        preflight_remediation_mode="suggest",
    )

    assert result["status"] == "done"
    assert (workspace_tmp / "package.json").read_text(encoding="utf-8") == original
    assert result["preflightDependencyAnalysis"]["blockers"][0]["suggestedVersion"] is None
    assert result["dependencyCompatibilityRemediations"] == []


def test_failed_preflight_third_party_remediation_does_not_block_or_run(workspace_tmp, monkeypatch):
    write_json(workspace_tmp / "package.json", angular_package_with_spinner())
    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake_npm_metadata)
    monkeypatch.setattr("migration_agent.adapters.angular._node_version", lambda project_path: (16, 13, 0))

    def fail_if_called(*args, **kwargs):
        raise AssertionError("preflight remediation must not run")

    monkeypatch.setattr(AngularAdapter, "_apply_preflight_remediations", fail_if_called)

    result = AngularAdapter().execute_migration_hop(
        workspace_tmp,
        {"fromVersion": 14, "toVersion": 15},
        {"migrationCommand": ["npx", "--yes", "@angular/cli@15", "update", "@angular/core@15", "@angular/cli@15"]},
        auto_remediate_dependencies=True,
    )

    assert result["status"] == "done"
    assert result["dependencyCompatibilityRemediations"] == []


def test_actual_npm_install_failure_can_trigger_targeted_remediation(workspace_tmp, monkeypatch):
    package = angular_package()
    package["dependencies"]["ngx-spinner"] = "^11.0.0"
    write_json(workspace_tmp / "package.json", package)
    calls = []
    failed_install_once = False

    def fake(command, cwd=None, **kwargs):
        nonlocal failed_install_once
        calls.append(command)
        if command == ["npm", "install"] and not failed_install_once:
            failed_install_once = True
            return {
                "returncode": 1,
                "stdout": "",
                "stderr": 'Package "ngx-spinner" has an incompatible peer dependency to "@angular/core" (requires "^11.0.0", would install "15.2.10").',
                "resolvedCommand": command,
            }
        return fake_npm_metadata(command, cwd, **kwargs)

    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake)
    monkeypatch.setattr("migration_agent.adapters.angular._node_version", lambda project_path: (16, 13, 0))
    monkeypatch.setattr(AngularAdapter, "analyze_peer_dependency_compatibility", lambda self, project_path, target_major, **kwargs: {"targetAngularMajor": target_major, "status": "passed", "checked": [], "blockers": [], "warnings": []})

    result = AngularAdapter().execute_migration_hop(
        workspace_tmp,
        {"fromVersion": 14, "toVersion": 15},
        {"migrationCommand": ["npx", "--yes", "@angular/cli@15", "update", "@angular/core@15", "@angular/cli@15"]},
    )

    assert result["status"] == "done"
    assert ["npm", "install", "ngx-spinner@15.0.0"] in calls
    assert result["dependencyCompatibilityRemediations"][0]["package"] == "ngx-spinner"


def test_legacy_peer_deps_mode_is_reused_for_later_ai_remediation_install(workspace_tmp, monkeypatch, capsys):
    package = angular_package_with_flex_layout()
    package["dependencies"]["moment-timezone"] = "^0.5.33"
    write_json(workspace_tmp / "package.json", package)
    calls = []
    build_failures = 0

    def fake(command, cwd=None, **kwargs):
        nonlocal build_failures
        calls.append(command)
        if command == ["npm", "install"]:
            return {
                "returncode": 1,
                "stdout": "",
                "stderr": "npm ERR! ERESOLVE unable to resolve dependency tree\nnpm ERR! peer dependency @angular/flex-layout",
                "resolvedCommand": command,
            }
        if command == ["npm", "install", "--legacy-peer-deps"]:
            return {"returncode": 0, "stdout": "installed with legacy peer deps", "stderr": "", "resolvedCommand": command}
        if command == ["npm", "run", "build"] and build_failures == 0:
            build_failures += 1
            return {
                "returncode": 1,
                "stdout": "",
                "stderr": "Property 'tz' does not exist on type 'Moment'",
                "resolvedCommand": command,
            }
        if command == ["npm", "install", "moment-timezone@^0.5.43", "--legacy-peer-deps"]:
            return {
                "returncode": 1,
                "stdout": "",
                "stderr": "npm ERR! ERESOLVE unable to resolve dependency tree\nnpm ERR! peer dependency @angular/flex-layout",
                "resolvedCommand": command,
            }
        return fake_npm_metadata(command, cwd, **kwargs)

    def fake_ai(ai_config, system, user):
        assert "Property 'tz' does not exist on type 'Moment'" in user
        return {
            "rootCause": "Property 'tz' does not exist on type 'Moment'",
            "packageUpdates": [{"name": "moment-timezone", "version": "^0.5.43", "reason": "moment timezone typings"}],
            "businessLogicChanged": False,
            "rollbackSafety": "package-only",
        }

    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake)
    monkeypatch.setattr("migration_agent.adapters.angular.ask_ai_sync", fake_ai)
    monkeypatch.setattr("migration_agent.adapters.angular._node_version", lambda project_path: (16, 13, 0))
    monkeypatch.setattr(
        AngularAdapter,
        "analyze_peer_dependency_compatibility",
        lambda self, project_path, target_major, **kwargs: {
            "targetAngularMajor": target_major,
            "status": "passed",
            "checked": [],
            "blockers": [],
            "warnings": [],
        },
    )

    result = AngularAdapter().execute_migration_hop(
        workspace_tmp,
        {"fromVersion": 14, "toVersion": 15},
        {"migrationCommand": ["npx", "--yes", "@angular/cli@15", "update", "@angular/core@15", "@angular/cli@15"]},
        progress=ProgressReporter(),
        ai_config=AiConfig(use_ai=True),
    )

    captured = capsys.readouterr().out
    assert result["status"] == "failed"
    assert result["failureStage"] == "build validation"
    assert "Property 'tz' does not exist on type 'Moment'" in result["validation"]["errors"]
    assert result["preflightDependencyAnalysis"]["legacyPeerDepsMode"] is True
    assert ["npm", "install"] in calls
    assert ["npm", "install", "--legacy-peer-deps"] in calls
    assert ["npm", "install", "moment-timezone@^0.5.43", "--legacy-peer-deps"] in calls
    assert ["npm", "install", "moment-timezone@^0.5.43"] not in calls
    assert not result["dependencyCompatibilityIssues"]
    assert "[Angular 14 -> 15] Legacy peer deps mode enabled for subsequent npm install commands." in captured


def test_migration_stops_if_remediation_build_validation_fails(workspace_tmp, monkeypatch):
    write_json(workspace_tmp / "package.json", angular_package_with_spinner())

    def fake(command, cwd=None, **kwargs):
        if command == ["npm", "run", "build"]:
            return {"returncode": 1, "stdout": "", "stderr": "build failed", "resolvedCommand": command}
        return fake_npm_metadata(command, cwd, **kwargs)

    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake)
    monkeypatch.setattr("migration_agent.adapters.angular._node_version", lambda project_path: (16, 13, 0))

    result = AngularAdapter().execute_migration_hop(
        workspace_tmp,
        {"fromVersion": 14, "toVersion": 15},
        {"migrationCommand": ["npx", "--yes", "@angular/cli@15", "update", "@angular/core@15", "@angular/cli@15"]},
    )

    assert result["status"] == "failed"
    assert result["failureStage"] == "build validation"


def test_report_includes_dependency_compatibility_remediations(workspace_tmp, monkeypatch):
    write_json(workspace_tmp / "package.json", angular_package_with_spinner())
    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake_npm_metadata)
    monkeypatch.setattr("migration_agent.adapters.angular._node_version", lambda project_path: (16, 13, 0))
    result = AngularAdapter().execute_migration_hop(
        workspace_tmp,
        {"fromVersion": 14, "toVersion": 15},
        {"migrationCommand": ["npx", "--yes", "@angular/cli@15", "update", "@angular/core@15", "@angular/cli@15"]},
    )

    report = generate_adapter_hop_report(
        {"to": "angular15", "manifest": AngularAdapter().parse_manifest(workspace_tmp)},
        [{"fromVersion": 14, "toVersion": 15}],
        [result],
        {"passed": True},
    )

    assert "## Dependency Compatibility Remediations" in report
    assert "Package: ngx-spinner" in report
    assert "## Warnings" in report
    assert "Status: remediated" not in report


def test_full_angular_14_to_18_chain_continues_after_successful_dependency_remediation(workspace_tmp, monkeypatch):
    write_json(workspace_tmp / "package.json", angular_package_with_spinner())
    output = workspace_tmp / "out"
    calls = []

    def fake(command, cwd=None, **kwargs):
        calls.append(command)
        return fake_npm_metadata(command, cwd, **kwargs)

    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake)
    monkeypatch.setattr("migration_agent.adapters.angular._node_version", lambda project_path: (20, 11, 1))
    monkeypatch.setattr(AngularAdapter, "check_compatibility", lambda self, project_path, target_major: [])
    config = MigrationConfig(
        project_path=workspace_tmp,
        from_spec=RuntimeSpec("angular", "14"),
        to_spec=RuntimeSpec("angular", "18"),
        output_path=output,
        dry_run=False,
        auto_approve=True,
        max_retries=0,
        ai=AiConfig(),
        optional_migrations=False,
    )

    asyncio.run(run_adapter_hop_migration(config, AngularAdapter(), AngularAdapter().expand_migration_hops("14", "18")))

    report = (output / "migration-report.md").read_text(encoding="utf-8")
    assert "- [done] Angular 14 -> 15" in report
    assert "- [done] Angular 15 -> 16" in report
    assert "- [done] Angular 16 -> 17" in report
    assert "- [done] Angular 17 -> 18" in report
    assert any(command == ["npx", "--yes", "@angular/cli@18", "update", "@angular/core@18", "@angular/cli@18", "--allow-dirty", "--force"] for command in calls)


def test_force_is_used_for_angular_cli_update(workspace_tmp, monkeypatch):
    write_json(workspace_tmp / "package.json", angular_package())
    calls = []

    def fake(command, cwd=None, **kwargs):
        calls.append(command)
        return fake_npm_metadata(command, cwd, **kwargs)

    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake)
    monkeypatch.setattr("migration_agent.adapters.angular._node_version", lambda project_path: (16, 13, 0))

    AngularAdapter().execute_migration_hop(
        workspace_tmp,
        {"fromVersion": 14, "toVersion": 15},
        {"migrationCommand": ["npx", "--yes", "@angular/cli@15", "update", "@angular/core@15", "@angular/cli@15"]},
    )

    angular_commands = [command for command in calls if command[:2] == ["npx", "--yes"]]
    assert angular_commands
    assert "--force" in angular_commands[0]


def test_execution_stops_after_failed_hop(workspace_tmp, monkeypatch):
    write_json(workspace_tmp / "package.json", angular_package())
    output = workspace_tmp / "out"
    adapter = AngularAdapter()
    calls = []

    def fake_execute(project_path, hop, rules, optional_migrations_enabled=False, **kwargs):
        calls.append((hop["fromVersion"], hop["toVersion"]))
        return {
            "hop": hop,
            "status": "failed",
            "commands": [{"command": ["npx"], "returncode": 1, "stdout": "", "stderr": "failed"}],
            "files": [],
            "validation": {"passed": False, "errors": "failed"},
            "optionalMigrations": [],
        }

    monkeypatch.setattr(adapter, "execute_migration_hop", fake_execute)
    config = MigrationConfig(
        project_path=workspace_tmp,
        from_spec=RuntimeSpec("angular", "14"),
        to_spec=RuntimeSpec("angular", "18"),
        output_path=output,
        dry_run=False,
        auto_approve=True,
        max_retries=0,
        ai=AiConfig(),
        optional_migrations=False,
    )

    asyncio.run(run_adapter_hop_migration(config, adapter, adapter.expand_migration_hops("14", "18")))

    assert calls == [(14, 15)]
    report = (output / "migration-report.md").read_text(encoding="utf-8")
    assert "Failed hop: 14 -> 15" in report
    assert "Global Angular CLI was not modified." in report
    assert "Angular CLI was invoked through version-pinned npx." in report


def test_analysis_stage_progress_message_is_printed(workspace_tmp, capsys):
    write_json(workspace_tmp / "package.json", angular_package())
    output = workspace_tmp / "out"
    config = MigrationConfig(
        project_path=workspace_tmp,
        from_spec=RuntimeSpec("angular", "14"),
        to_spec=RuntimeSpec("angular", "18"),
        output_path=output,
        dry_run=True,
        auto_approve=True,
        max_retries=0,
        ai=AiConfig(),
        optional_migrations=False,
    )

    asyncio.run(run_adapter_hop_migration(config, AngularAdapter(), AngularAdapter().expand_migration_hops("14", "18")))

    captured = capsys.readouterr().out
    assert "[Analysis] Detecting project runtime..." in captured
    assert "[Analysis] Planned hops: 14 -> 15, 15 -> 16, 16 -> 17, 17 -> 18." in captured


def test_typescript_incompatibility_plans_framework_critical_update_and_continues(workspace_tmp, monkeypatch, capsys):
    package = angular_package(core="14.2.0", cli="14.2.0")
    package["devDependencies"]["typescript"] = "~4.7.0"
    write_json(workspace_tmp / "package.json", package)
    calls = []

    def fake(command, cwd=None, **kwargs):
        calls.append(command)
        return fake_npm_metadata(command, cwd, **kwargs)

    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake)
    monkeypatch.setattr("migration_agent.adapters.angular._node_version", lambda project_path: (16, 13, 0))

    result = AngularAdapter().execute_migration_hop(
        workspace_tmp,
        {"fromVersion": 14, "toVersion": 15},
        {"migrationCommand": ["npx", "--yes", "@angular/cli@15", "update", "@angular/core@15", "@angular/cli@15"]},
        progress=ProgressReporter(),
        log_path=workspace_tmp / "run.log",
    )

    captured = capsys.readouterr().out
    updated = json.loads((workspace_tmp / "package.json").read_text(encoding="utf-8"))

    assert result["status"] == "done"
    assert updated["devDependencies"]["typescript"] == "~4.9.5"
    assert any(item["package"] == "typescript" and item["toVersion"] == "~4.9.5" for item in result["dependencyCompatibilityRemediations"])
    assert result["commands"]
    report = generate_adapter_hop_report(
        {"from": "angular14", "to": "angular15", "manifest": {}, "analysisMode": "adapter", "planningMode": "adapter-sequential"},
        [{"fromVersion": 14, "toVersion": 15}],
        [result],
        {"passed": True, "output": "ok"},
    )
    assert "## Commands Executed\n\n- None" not in report
    assert ["npx", "--yes", "@angular/cli@15", "update", "@angular/core@15", "@angular/cli@15", "--allow-dirty", "--force"] in calls
    assert ["npm", "install"] in calls
    assert "[Angular 14 -> 15] TypeScript ~4.7.0 is incompatible with Angular 15." in captured
    assert "[Angular 14 -> 15] Planned framework-critical update: typescript -> ~4.9.5" in captured
    assert "[Angular 14 -> 15] Continuing migration." in captured
    assert "manual action required" not in json.dumps(result).lower()


def test_preflight_blocker_message_is_printed_for_node(workspace_tmp, monkeypatch, capsys):
    write_json(workspace_tmp / "package.json", angular_package(core="17.3.0", cli="17.3.0"))
    monkeypatch.setattr("migration_agent.adapters.angular._run_command", fake_npm_metadata)
    monkeypatch.setattr("migration_agent.adapters.angular._node_version", lambda project_path: (16, 13, 0))

    result = AngularAdapter().execute_migration_hop(
        workspace_tmp,
        {"fromVersion": 17, "toVersion": 18},
        {"migrationCommand": ["npx", "--yes", "@angular/cli@18", "update", "@angular/core@18", "@angular/cli@18"]},
        progress=ProgressReporter(),
        log_path=workspace_tmp / "run.log",
    )

    captured = capsys.readouterr().out
    assert result["status"] == "failed"
    assert "[Angular 17 -> 18] Checking dependency compatibility..." in captured
    assert "Found incompatible runtime: Node requires ^18.19.1 || ^20.11.1 || ^22.0.0, target is Angular 18." in captured
    assert "[Angular 17 -> 18] Execution blocked before running Angular CLI." in captured


def test_preflight_failure_summary_does_not_claim_angular_cli_update(capsys, workspace_tmp):
    result = {
        "hop": {"fromVersion": 17, "toVersion": 18},
        "failureStage": "preflight dependency compatibility check",
        "failureReason": "typescript version cannot be resolved",
    }

    _print_failure_summary(ProgressReporter(), result, workspace_tmp / "run.log")

    captured = capsys.readouterr().out
    assert "Failed during preflight dependency compatibility check." in captured
    assert "Failed during Angular CLI update." not in captured


def test_quiet_mode_suppresses_non_error_progress_but_prints_final_report(workspace_tmp, capsys):
    write_json(workspace_tmp / "package.json", angular_package())
    output = workspace_tmp / "out"
    config = MigrationConfig(
        project_path=workspace_tmp,
        from_spec=RuntimeSpec("angular", "14"),
        to_spec=RuntimeSpec("angular", "18"),
        output_path=output,
        dry_run=True,
        auto_approve=True,
        max_retries=0,
        ai=AiConfig(),
        optional_migrations=False,
        verbosity="quiet",
    )

    asyncio.run(run_adapter_hop_migration(config, AngularAdapter(), AngularAdapter().expand_migration_hops("14", "18")))

    captured = capsys.readouterr().out
    assert "[Analysis]" not in captured
    assert "[Report] Migration report written to:" in captured
