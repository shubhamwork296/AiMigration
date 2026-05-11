from pathlib import Path
import shutil
import uuid

from migration_agent.cli.args import _parse_config


def test_minimal_config_uses_internal_defaults():
    root = Path("tests") / ".tmp-config" / uuid.uuid4().hex
    project = root / "project"
    project.mkdir(parents=True)
    try:
        config = _parse_config(
            {
                "projectPath": str(project),
                "targetVersion": "18",
                "skipPreflightDependencyCompatibility": False,
                "preflightRemediationMode": "suggest",
                "commandTimeoutSeconds": 600,
                "showTimingSummary": True,
                "aiCli": "auto",
            },
            Path.cwd(),
        )
    finally:
        shutil.rmtree(root, ignore_errors=True)

    assert config.from_spec.runtime == "angular"
    assert config.from_spec.version == ""
    assert config.to_spec == type(config.to_spec)("angular", "18")
    assert config.dependency_check_timeout_seconds == 300
    assert config.allow_legacy_peer_deps_fallback is True
    assert config.command_timeout_seconds == 600
    assert config.allow_business_logic_changes is False
    assert config.prefer_ng_update is True
    assert config.avoid_full_version_scans is True
    assert config.direct_dependencies_only_preflight is True
    assert config.ai.ai_cli == "auto"
