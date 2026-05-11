from pathlib import Path

from migration_agent.ai.provider import AiConfig
from migration_agent.ai.provider import _parse_cli_version
from migration_agent.ai.provider import resolve_ai_cli


def command_result(command, returncode=0, stdout="", stderr=""):
    return {"command": command, "returncode": returncode, "stdout": stdout, "stderr": stderr, "resolvedCommand": command}


def test_detects_codex(monkeypatch):
    def fake(command, cwd=None, **kwargs):
        if command == ["where", "codex"] or command == ["which", "codex"]:
            return command_result(command, stdout="C:\\npm\\codex.cmd\n")
        if command == ["codex", "--version"]:
            return command_result(command, stdout="codex 0.129.0\n")
        if command == ["npm", "view", "@openai/codex", "version", "--json"]:
            return command_result(command, stdout='"0.129.0"')
        return command_result(command, returncode=1)

    monkeypatch.setattr("migration_agent.ai.provider.run_command", fake)

    selected = resolve_ai_cli(AiConfig(ai_cli="codex", use_ai=True), cwd=Path("."))

    assert selected.use_ai is True
    assert selected.provider == "codex"
    assert selected.cli_version == "0.129.0"


def test_detects_claude(monkeypatch):
    def fake(command, cwd=None, **kwargs):
        if command == ["claude", "--version"]:
            return command_result(command, stdout="Claude Code 1.2.3\n")
        if command == ["npm", "view", "@anthropic-ai/claude-code", "version", "--json"]:
            return command_result(command, stdout='"1.2.3"')
        return command_result(command, returncode=1)

    monkeypatch.setattr("migration_agent.ai.provider.run_command", fake)

    selected = resolve_ai_cli(AiConfig(ai_cli="claude", use_ai=True), cwd=Path("."))

    assert selected.use_ai is True
    assert selected.provider == "claude"
    assert selected.cli_version == "1.2.3"


def test_auto_prefers_codex(monkeypatch):
    def fake(command, cwd=None, **kwargs):
        if command == ["codex", "--version"]:
            return command_result(command, stdout="0.129.0")
        if command == ["claude", "--version"]:
            return command_result(command, stdout="claude-code 1.2.3")
        if command == ["npm", "view", "@openai/codex", "version", "--json"]:
            return command_result(command, stdout='"0.129.0"')
        return command_result(command, returncode=1)

    monkeypatch.setattr("migration_agent.ai.provider.run_command", fake)

    selected = resolve_ai_cli(AiConfig(ai_cli="auto", use_ai=True), cwd=Path("."))

    assert selected.provider == "codex"


def test_ai_cli_claude_selects_claude(monkeypatch):
    def fake(command, cwd=None, **kwargs):
        if command == ["codex", "--version"]:
            return command_result(command, stdout="0.129.0")
        if command == ["claude", "--version"]:
            return command_result(command, stdout="1.2.3")
        if command == ["npm", "view", "@anthropic-ai/claude-code", "version", "--json"]:
            return command_result(command, stdout='"1.2.3"')
        return command_result(command, returncode=1)

    monkeypatch.setattr("migration_agent.ai.provider.run_command", fake)

    selected = resolve_ai_cli(AiConfig(ai_cli="claude", use_ai=True), cwd=Path("."))

    assert selected.provider == "claude"


def test_ai_cli_none_disables_ai(monkeypatch):
    def fail(*args, **kwargs):
        raise AssertionError("no CLI commands should run")

    monkeypatch.setattr("migration_agent.ai.provider.run_command", fail)

    selected = resolve_ai_cli(AiConfig(ai_cli="none", use_ai=True), cwd=Path("."))

    assert selected.use_ai is False
    assert selected.provider is None


def test_old_cli_version_only_warns(monkeypatch):
    def fake(command, cwd=None, **kwargs):
        if command == ["codex", "--version"]:
            return command_result(command, stdout="codex 0.100.0")
        if command == ["npm", "view", "@openai/codex", "version", "--json"]:
            return command_result(command, stdout='"0.129.0"')
        return command_result(command, returncode=1)

    monkeypatch.setattr("migration_agent.ai.provider.run_command", fake)

    selected = resolve_ai_cli(AiConfig(ai_cli="codex", use_ai=True), cwd=Path("."))

    assert selected.provider == "codex"
    assert any("npm install -g @openai/codex@0.129.0" in warning for warning in selected.cli_warnings)


def test_latest_lookup_failure_does_not_fail(monkeypatch):
    def fake(command, cwd=None, **kwargs):
        if command == ["codex", "--version"]:
            return command_result(command, stdout="codex 0.129.0")
        if command == ["npm", "view", "@openai/codex", "version", "--json"]:
            return command_result(command, returncode=1, stderr="network error")
        return command_result(command, returncode=1)

    monkeypatch.setattr("migration_agent.ai.provider.run_command", fake)

    selected = resolve_ai_cli(AiConfig(ai_cli="codex", use_ai=True), cwd=Path("."))

    assert selected.provider == "codex"
    assert selected.latest_version is None
    assert selected.cli_warnings


def test_no_cli_found_continues_fallback(monkeypatch):
    monkeypatch.setattr("migration_agent.ai.provider.run_command", lambda command, cwd=None, **kwargs: command_result(command, returncode=1))

    selected = resolve_ai_cli(AiConfig(ai_cli="auto", use_ai=True), cwd=Path("."))

    assert selected.use_ai is False
    assert selected.provider is None


def test_version_parser_accepts_expected_formats():
    assert _parse_cli_version("codex 0.129.0") == "0.129.0"
    assert _parse_cli_version("0.129.0") == "0.129.0"
    assert _parse_cli_version("claude-code 1.2.3") == "1.2.3"
    assert _parse_cli_version("Claude Code 1.2.3") == "1.2.3"
