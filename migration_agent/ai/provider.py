from __future__ import annotations

import json
import os
import subprocess
import shutil
from dataclasses import dataclass
from typing import Any


SUPPORTED_PROVIDERS = {"codex", "claude"}
SUPPORTED_MODES = {"auto", "cli"}


@dataclass(frozen=True)
class AiConfig:
    use_ai: bool = False
    provider: str | None = None
    mode: str = "cli"
    cli_command: list[str] | None = None


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


async def ask_ai(config: AiConfig, system: str, user: str) -> dict[str, Any] | None:
    if not config.use_ai:
        return None

    provider = (config.provider or "").lower()

    if provider not in SUPPORTED_PROVIDERS:
        raise ValueError(f"Unsupported AI provider: {config.provider}")

    if provider == "codex":
        return await _ask_codex(config, system, user)

    if provider == "claude":
        return _ask_cli(config, system, user)

    return None


async def _ask_codex(config: AiConfig, system: str, user: str) -> dict[str, Any] | None:
    if config.mode in {"auto", "cli"}:
        return _ask_cli(config, system, user)

    return None


def _ask_cli(config: AiConfig, system: str, user: str) -> dict[str, Any] | None:
    command = config.cli_command or _default_cli_command(config)

    prompt = _build_cli_prompt(system, user)

    try:
        completed = subprocess.run(
            [*command, "-"],
            input=prompt,
            capture_output=True,
            text=True,
            check=False,
            timeout=300,
        )
    except FileNotFoundError as exc:
        raise RuntimeError(
            f"{config.provider} CLI was not found. Install it or set aiCliCommand to the CLI executable."
        ) from exc

    output = "\n".join(part for part in [completed.stdout, completed.stderr] if part).strip()

    if completed.returncode != 0:
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
