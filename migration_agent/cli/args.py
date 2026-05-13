from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from migration_agent.ai.provider import AiConfig, SUPPORTED_MODES, SUPPORTED_PROVIDERS
from migration_agent.core.progress import VERBOSITY_DEFAULT, VERBOSITY_QUIET, VERBOSITY_VERBOSE


@dataclass(frozen=True)
class RuntimeSpec:
    runtime: str
    version: str


@dataclass(frozen=True)
class MigrationConfig:
    project_path: Path
    from_spec: RuntimeSpec
    to_spec: RuntimeSpec
    output_path: Path
    dry_run: bool
    auto_approve: bool
    max_retries: int
    ai: AiConfig
    optional_migrations: bool = False
    verbosity: str = VERBOSITY_DEFAULT
    auto_remediate_dependencies: bool = False
    on_dependency_compatibility_issue: str = "auto-remediate-and-continue"
    allow_angular_force_update: bool = False
    allow_prerelease_dependency_versions: bool = False
    max_dependency_remediation_retries_per_hop: int = 1
    continue_after_successful_remediation: bool = True
    dependency_check_timeout_seconds: int = 300
    skip_preflight_dependency_compatibility: bool = False
    preflight_remediation_mode: str = "suggest"
    allow_legacy_peer_deps_fallback: bool = True
    command_timeout_seconds: int = 600
    show_timing_summary: bool = True
    max_ai_remediation_retries: int = 3
    rollback_mode: str = "manual"
    allow_business_logic_changes: bool = False
    prefer_ng_update: bool = True
    avoid_full_version_scans: bool = True
    direct_dependencies_only_preflight: bool = True


def load_config() -> MigrationConfig:
    parser = argparse.ArgumentParser(description="Run an AI-assisted project migration.")
    parser.add_argument("--config", default="migrate.config.json", help="Path to migration config JSON.")
    verbosity = parser.add_mutually_exclusive_group()
    verbosity.add_argument("--verbose", action="store_true", help="Stream command output live.")
    verbosity.add_argument("--quiet", action="store_true", help="Only print report path and errors.")
    args = parser.parse_args()

    config_path = Path(args.config).resolve()
    if not config_path.exists():
        raise FileNotFoundError(f"Config file not found: {config_path}")

    raw = json.loads(config_path.read_text(encoding="utf-8"))
    config = _parse_config(raw, config_path.parent, _verbosity_from_args(args, raw))
    _validate_config(config)
    return config


def _parse_config(raw: dict[str, Any], base_dir: Path, verbosity: str | None = None) -> MigrationConfig:
    return MigrationConfig(
        project_path=_resolve_path(raw["projectPath"], base_dir),
        from_spec=_parse_runtime_spec(raw, "from"),
        to_spec=_parse_to_spec(raw),
        output_path=_resolve_path(raw.get("outputPath", "./output"), base_dir),
        dry_run=bool(raw.get("dryRun", False)),
        auto_approve=bool(raw.get("autoApprove", False)),
        max_retries=int(raw.get("maxRetries", 1)),
        ai=_parse_ai_config(raw),
        optional_migrations=bool(raw.get("optionalMigrations", False)),
        verbosity=verbosity or _parse_verbosity(raw),
        auto_remediate_dependencies=bool(raw.get("autoRemediateDependencies", False)),
        on_dependency_compatibility_issue=str(
            raw.get("onDependencyCompatibilityIssue", "auto-remediate-and-continue")
        ),
        allow_angular_force_update=bool(raw.get("allowAngularForceUpdate", False)),
        allow_prerelease_dependency_versions=bool(raw.get("allowPrereleaseDependencyVersions", False)),
        max_dependency_remediation_retries_per_hop=int(raw.get("maxDependencyRemediationRetriesPerHop", 1)),
        continue_after_successful_remediation=bool(raw.get("continueAfterSuccessfulRemediation", True)),
        dependency_check_timeout_seconds=int(raw.get("dependencyCheckTimeoutSeconds", 300)),
        skip_preflight_dependency_compatibility=bool(raw.get("skipPreflightDependencyCompatibility", False)),
        preflight_remediation_mode=str(raw.get("preflightRemediationMode", "suggest")),
        allow_legacy_peer_deps_fallback=bool(raw.get("allowLegacyPeerDepsFallback", True)),
        command_timeout_seconds=int(raw.get("commandTimeoutSeconds", 600)),
        show_timing_summary=bool(raw.get("showTimingSummary", True)),
        max_ai_remediation_retries=int(raw.get("maxAiRemediationRetries", 3)),
        rollback_mode=str(raw.get("rollbackMode", "manual")),
        allow_business_logic_changes=bool(raw.get("allowBusinessLogicChanges", False)),
        prefer_ng_update=bool(raw.get("preferNgUpdate", True)),
        avoid_full_version_scans=bool(raw.get("avoidFullVersionScans", True)),
        direct_dependencies_only_preflight=bool(raw.get("directDependenciesOnlyPreflight", True)),
    )


def _parse_runtime_spec(raw: dict[str, Any], key: str) -> RuntimeSpec:
    value = raw.get(key)
    if isinstance(value, dict):
        return RuntimeSpec(**value)
    if key == "from":
        return RuntimeSpec(str(raw.get("runtime", "angular")), str(raw.get("currentVersion", "")))
    raise KeyError(key)


def _parse_to_spec(raw: dict[str, Any]) -> RuntimeSpec:
    value = raw.get("to")
    if isinstance(value, dict):
        return RuntimeSpec(**value)
    if raw.get("targetVersion") is not None:
        from_runtime = raw.get("from", {}).get("runtime") if isinstance(raw.get("from"), dict) else None
        runtime = raw.get("runtime") or from_runtime or "angular"
        return RuntimeSpec(str(runtime), str(raw["targetVersion"]))
    raise KeyError("to")


def _parse_ai_config(raw: dict[str, Any]) -> AiConfig:
    ai_section = raw.get("ai", {})
    if not isinstance(ai_section, dict):
        raise ValueError("ai must be a JSON object when provided.")

    ai_cli = str(raw.get("aiCli", ai_section.get("aiCli", "auto"))).lower()
    use_ai = bool(raw.get("useAi", ai_section.get("useAi", ai_cli != "none")))
    provider = raw.get("aiProvider", ai_section.get("provider"))

    mode = str(raw.get("aiMode", ai_section.get("mode", "cli"))).lower()
    cli_command = raw.get("aiCliCommand", ai_section.get("cliCommand"))
    if isinstance(cli_command, str):
        cli_command = [part for part in cli_command.split(" ") if part]

    return AiConfig(
        use_ai=use_ai,
        provider=str(provider).lower() if provider else None,
        mode=mode,
        cli_command=cli_command,
        ai_cli=ai_cli,
    )


def _verbosity_from_args(args: argparse.Namespace, raw: dict[str, Any]) -> str:
    if args.verbose:
        return VERBOSITY_VERBOSE
    if args.quiet:
        return VERBOSITY_QUIET
    return _parse_verbosity(raw)


def _parse_verbosity(raw: dict[str, Any]) -> str:
    if raw.get("verbose"):
        return VERBOSITY_VERBOSE
    if raw.get("quiet"):
        return VERBOSITY_QUIET
    value = str(raw.get("verbosity", VERBOSITY_DEFAULT)).lower()
    if value in {VERBOSITY_DEFAULT, VERBOSITY_VERBOSE, VERBOSITY_QUIET}:
        return value
    raise ValueError("verbosity must be one of: default, verbose, quiet.")


def _resolve_path(value: str, base_dir: Path) -> Path:
    path = Path(value)
    return path.resolve() if path.is_absolute() else (base_dir / path).resolve()


def _validate_config(config: MigrationConfig) -> None:
    if not config.project_path.exists():
        raise FileNotFoundError(f"Project path does not exist: {config.project_path}")
    if not config.project_path.is_dir():
        raise NotADirectoryError(f"Project path must be a directory: {config.project_path}")
    if config.project_path == config.output_path:
        raise ValueError("outputPath must be different from projectPath.")
    if config.from_spec.runtime != config.to_spec.runtime:
        raise ValueError("Cross-runtime migrations are not supported by this starter.")
    if config.max_retries < 0:
        raise ValueError("maxRetries must be zero or greater.")
    if config.on_dependency_compatibility_issue not in {"auto-remediate-and-continue", "stop-hop"}:
        raise ValueError("onDependencyCompatibilityIssue must be one of: auto-remediate-and-continue, stop-hop.")
    if config.max_dependency_remediation_retries_per_hop < 0:
        raise ValueError("maxDependencyRemediationRetriesPerHop must be zero or greater.")
    if config.dependency_check_timeout_seconds < 0:
        raise ValueError("dependencyCheckTimeoutSeconds must be zero or greater.")
    if config.preflight_remediation_mode not in {"off", "suggest", "apply"}:
        raise ValueError("preflightRemediationMode must be one of: off, suggest, apply.")
    if config.max_ai_remediation_retries < 0:
        raise ValueError("maxAiRemediationRetries must be zero or greater.")
    if config.rollback_mode not in {"manual", "auto"}:
        raise ValueError("rollbackMode must be one of: manual, auto.")
    if config.ai.ai_cli not in {"auto", "codex", "claude", "none"}:
        raise ValueError("aiCli must be one of: auto, codex, claude, none.")
    if config.ai.use_ai:
        if config.ai.provider is not None and config.ai.provider not in SUPPORTED_PROVIDERS:
            raise ValueError(f"aiProvider must be one of: {', '.join(sorted(SUPPORTED_PROVIDERS))}.")
        if config.ai.mode not in SUPPORTED_MODES:
            raise ValueError(f"aiMode must be one of: {', '.join(sorted(SUPPORTED_MODES))}.")
        if config.ai.cli_command is not None and not all(isinstance(part, str) for part in config.ai.cli_command):
            raise ValueError("aiCliCommand must be a string or array of strings.")


def _ask_ai_provider() -> str:
    while True:
        answer = input("Which AI provider do you want to use? [codex/claude] ").strip().lower()
        if answer in SUPPORTED_PROVIDERS:
            return answer
        print("Please choose codex or claude.")
