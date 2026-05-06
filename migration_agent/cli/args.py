from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from migration_agent.ai.provider import AiConfig, SUPPORTED_MODES, SUPPORTED_PROVIDERS


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


def load_config() -> MigrationConfig:
    parser = argparse.ArgumentParser(description="Run an AI-assisted project migration.")
    parser.add_argument("--config", default="migrate.config.json", help="Path to migration config JSON.")
    args = parser.parse_args()

    config_path = Path(args.config).resolve()
    if not config_path.exists():
        raise FileNotFoundError(f"Config file not found: {config_path}")

    raw = json.loads(config_path.read_text(encoding="utf-8"))
    config = _parse_config(raw, config_path.parent)
    _validate_config(config)
    return config


def _parse_config(raw: dict[str, Any], base_dir: Path) -> MigrationConfig:
    return MigrationConfig(
        project_path=_resolve_path(raw["projectPath"], base_dir),
        from_spec=RuntimeSpec(**raw["from"]),
        to_spec=RuntimeSpec(**raw["to"]),
        output_path=_resolve_path(raw.get("outputPath", "./output"), base_dir),
        dry_run=bool(raw.get("dryRun", False)),
        auto_approve=bool(raw.get("autoApprove", False)),
        max_retries=int(raw.get("maxRetries", 1)),
        ai=_parse_ai_config(raw),
    )


def _parse_ai_config(raw: dict[str, Any]) -> AiConfig:
    ai_section = raw.get("ai", {})
    if not isinstance(ai_section, dict):
        raise ValueError("ai must be a JSON object when provided.")

    use_ai = bool(raw.get("useAi", ai_section.get("useAi", False)))
    provider = raw.get("aiProvider", ai_section.get("provider"))
    if use_ai and not provider:
        provider = _ask_ai_provider()

    mode = str(raw.get("aiMode", ai_section.get("mode", "cli"))).lower()
    cli_command = raw.get("aiCliCommand", ai_section.get("cliCommand"))
    if isinstance(cli_command, str):
        cli_command = [part for part in cli_command.split(" ") if part]

    return AiConfig(
        use_ai=use_ai,
        provider=str(provider).lower() if provider else None,
        mode=mode,
        cli_command=cli_command,
    )


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
    if config.ai.use_ai:
        if config.ai.provider not in SUPPORTED_PROVIDERS:
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
