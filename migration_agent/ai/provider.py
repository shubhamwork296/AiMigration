from __future__ import annotations

import json
import os
import re
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from migration_agent.core.commands import run_command
from migration_agent.core.progress import ProgressReporter


SUPPORTED_PROVIDERS = {"codex", "claude"}
SUPPORTED_MODES = {"auto", "cli"}


@dataclass(frozen=True)
class AiConfig:
    use_ai: bool = False
    provider: str | None = None
    mode: str = "cli"
    cli_command: list[str] | None = None
    ai_cli: str = "auto"
    cli_version: str | None = None
    latest_version: str | None = None
    cli_warnings: tuple[str, ...] = ()


CLI_PACKAGES = {
    "codex": "@openai/codex",
    "claude": "@anthropic-ai/claude-code",
}

CLI_INSTALL_COMMANDS = {
    "codex": "npm install -g @openai/codex@{version}",
    "claude": "npm install -g @anthropic-ai/claude-code@{version}",
}


def _find_cli_executable(name: str) -> str | None:
    if os.name == "nt":
        cmd_path = shutil.which(f"{name}.cmd")
        if cmd_path:
            return cmd_path

    # Try PATH first
    path = shutil.which(name)
    if path:
        return path

    # Windows npm fallback for codex
    if name == "codex":
        npm_path = os.path.expandvars(r"%APPDATA%\npm\codex.cmd")
        if os.path.exists(npm_path):
            return npm_path

    return None


def resolve_ai_cli(
    config: AiConfig,
    *,
    cwd: Path | None = None,
    progress: ProgressReporter | None = None,
    log_path: Path | None = None,
    timeout: int = 30,
) -> AiConfig:
    requested = (config.ai_cli or "auto").lower()
    if requested == "none":
        _ai_cli_log(progress, "AI CLI disabled by configuration.")
        return AiConfig(
            use_ai=False,
            provider=None,
            mode=config.mode,
            cli_command=None,
            ai_cli="none",
        )
    _ai_cli_log(progress, "Detecting AI CLI...")
    candidates = {
        "codex": _detect_cli("codex", cwd=cwd, log_path=log_path, timeout=timeout),
        "claude": _detect_cli("claude", cwd=cwd, log_path=log_path, timeout=timeout),
    }
    for name, result in candidates.items():
        if result["available"]:
            _ai_cli_log(progress, f"Found {_display_name(name)} CLI: {result['version'] or 'unknown'}")

    selected = _select_cli(requested, candidates)
    if selected is None:
        if requested in {"codex", "claude"}:
            _ai_cli_log(progress, f"Requested {_display_name(requested)} CLI was not found. Continuing with deterministic fallback.")
        else:
            _ai_cli_log(progress, "No supported AI CLI found. Continuing with deterministic fallback.")
        return AiConfig(use_ai=False, provider=None, mode=config.mode, cli_command=None, ai_cli=requested)

    latest, warnings = _latest_cli_version(selected, cwd=cwd, log_path=log_path, timeout=timeout)
    installed = candidates[selected].get("version")
    if latest and installed and _semver_lt(installed, latest):
        command = CLI_INSTALL_COMMANDS[selected].format(version=latest)
        warning = f"{_display_name(selected)} CLI {installed} is older than latest {latest}. Suggested command: {command}"
        warnings.append(warning)
        _ai_cli_log(progress, warning)
    for warning in warnings:
        if "Suggested command" not in warning:
            _ai_cli_log(progress, warning)
    _ai_cli_log(progress, f"Selected AI CLI: {selected}")
    selected_command = config.cli_command or _cli_command_for(selected, candidates[selected].get("path"))
    return AiConfig(
        use_ai=True,
        provider=selected,
        mode=config.mode,
        cli_command=selected_command,
        ai_cli=requested,
        cli_version=installed,
        latest_version=latest,
        cli_warnings=tuple(warnings),
    )


async def ask_ai(config: AiConfig, system: str, user: str) -> dict[str, Any] | None:
    if not config.use_ai:
        return None

    provider = (config.provider or "").lower()
    if not provider:
        return None

    if provider not in SUPPORTED_PROVIDERS:
        raise ValueError(f"Unsupported AI provider: {config.provider}")

    if provider == "codex":
        return await _ask_codex(config, system, user)

    if provider == "claude":
        return _ask_cli(config, system, user)

    return None


def ask_ai_sync(config: AiConfig, system: str, user: str) -> dict[str, Any] | None:
    if not config.use_ai:
        return None

    provider = (config.provider or "").lower()
    if not provider:
        return None

    if provider not in SUPPORTED_PROVIDERS:
        raise ValueError(f"Unsupported AI provider: {config.provider}")

    if provider in {"codex", "claude"}:
        return _ask_cli(config, system, user)

    return None


async def _ask_codex(config: AiConfig, system: str, user: str) -> dict[str, Any] | None:
    if config.mode in {"auto", "cli"}:
        return _ask_cli(config, system, user)

    return None


def _ask_cli(config: AiConfig, system: str, user: str) -> dict[str, Any] | None:
    command = config.cli_command or _default_cli_command(config)

    prompt = _build_cli_prompt(system, user)

    completed = run_command([*command, "-"], input=prompt, timeout=300)
    if completed["returncode"] == 127:
        raise RuntimeError(
            f"{config.provider} CLI was not found. Install it or set aiCliCommand to the CLI executable."
        )

    output = "\n".join(part for part in [completed["stdout"], completed["stderr"]] if part).strip()

    if completed["returncode"] != 0:
        raise RuntimeError(f"{config.provider} CLI failed: {output[:1000]}")

    return _parse_json_object(output, str(config.provider))


def _default_cli_command(config: AiConfig) -> list[str]:
    if config.provider == "codex":
        codex_path = _find_cli_executable("codex")
        if not codex_path:
            raise RuntimeError(
                "codex CLI was not found. Install it or set aiCliCommand to the CLI executable."
            )
        return [codex_path, "exec", "--skip-git-repo-check"]

    if config.provider == "claude":
        claude_path = _find_cli_executable("claude")
        if not claude_path:
            raise RuntimeError("claude CLI was not found.")
        return [claude_path, "-p"]

    raise ValueError(f"Unsupported AI provider: {config.provider}")


def _detect_cli(name: str, *, cwd: Path | None, log_path: Path | None, timeout: int) -> dict[str, Any]:
    locator = "where" if os.name == "nt" else "which"
    located = run_command([locator, name], cwd, timeout=timeout, log_path=log_path)
    path = _first_output_line(located) if located["returncode"] == 0 else None
    version_result = run_command([name, "--version"], cwd, timeout=timeout, log_path=log_path)
    version = _parse_cli_version(version_result.get("stdout", "") + "\n" + version_result.get("stderr", ""))
    return {
        "available": version_result["returncode"] == 0,
        "path": path,
        "version": version,
        "whereReturnCode": located["returncode"],
        "versionReturnCode": version_result["returncode"],
    }


def _latest_cli_version(name: str, *, cwd: Path | None, log_path: Path | None, timeout: int) -> tuple[str | None, list[str]]:
    package_name = CLI_PACKAGES[name]
    result = run_command(["npm", "view", package_name, "version", "--json"], cwd, timeout=timeout, log_path=log_path)
    if result["returncode"] != 0:
        return None, [f"Latest {_display_name(name)} CLI version lookup failed. Continuing with installed CLI."]
    parsed = _parse_npm_json(result.get("stdout", ""))
    if isinstance(parsed, str) and _parse_cli_version(parsed):
        return _parse_cli_version(parsed), []
    return None, [f"Latest {_display_name(name)} CLI version could not be parsed. Continuing with installed CLI."]


def _select_cli(requested: str, candidates: dict[str, dict[str, Any]]) -> str | None:
    if requested in {"codex", "claude"}:
        return requested if candidates[requested]["available"] else None
    if requested == "auto":
        if candidates["codex"]["available"]:
            return "codex"
        if candidates["claude"]["available"]:
            return "claude"
    return None


def _cli_command_for(name: str, path: str | None) -> list[str]:
    executable = path or name
    if name == "codex":
        return [executable, "exec", "--skip-git-repo-check"]
    return [executable, "-p"]


def _parse_cli_version(text: str) -> str | None:
    match = re.search(r"(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)", text)
    return match.group(1) if match else None


def _parse_npm_json(output: str) -> Any:
    try:
        return json.loads(output.strip())
    except json.JSONDecodeError:
        return None


def _semver_lt(left: str, right: str) -> bool:
    left_parts = _semver_parts(left)
    right_parts = _semver_parts(right)
    return left_parts is not None and right_parts is not None and left_parts < right_parts


def _semver_parts(version: str) -> tuple[int, int, int] | None:
    parsed = _parse_cli_version(version)
    if not parsed:
        return None
    major, minor, patch = parsed.split(".")[:3]
    patch = re.split(r"[-+]", patch)[0]
    return int(major), int(minor), int(patch)


def _first_output_line(result: dict[str, Any]) -> str | None:
    output = "\n".join(part for part in [result.get("stdout", ""), result.get("stderr", "")] if part)
    for line in output.splitlines():
        line = line.strip()
        if line:
            return line
    return None


def _display_name(name: str) -> str:
    return "Codex" if name == "codex" else "Claude"


def _ai_cli_log(progress: ProgressReporter | None, message: str) -> None:
    if progress:
        progress.stage("AI CLI", message)


def _build_cli_prompt(system: str, user: str) -> str:
    return "\n\n".join(
        [
            system,
            "Return ONLY valid JSON. Do not include markdown or explanations.",
            user,
        ]
    )


def _parse_json_object(text: str, provider: str) -> dict[str, Any]:
    stripped = text.strip()

    if not stripped:
        raise ValueError(f"{provider} returned empty output")

    # Remove common fenced markdown wrapping
    if stripped.startswith("```"):
        stripped = stripped.strip("`")
        stripped = stripped.removeprefix("json").strip()

    decoder = json.JSONDecoder()

    # Try parsing from every possible JSON object/array start
    for i, ch in enumerate(stripped):
        if ch not in "{[":
            continue

        try:
            parsed, _ = decoder.raw_decode(stripped[i:])
            if isinstance(parsed, dict):
                return parsed
            if isinstance(parsed, list):
                return {"items": parsed}
        except json.JSONDecodeError:
            continue

    # Debug output so you can see what Codex actually returned
    debug_path = "codex_raw_output.txt"
    with open(debug_path, "w", encoding="utf-8") as f:
        f.write(text)

    raise ValueError(
        f"{provider} did not return a valid JSON object. Raw output saved to {debug_path}"
    )
