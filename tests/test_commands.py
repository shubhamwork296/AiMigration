import shutil
import sys
import uuid
from pathlib import Path

import pytest

from migration_agent.adapters.dotnet import DotnetAdapter
from migration_agent.core.commands import resolve_command, run_command
from migration_agent.core.progress import ProgressReporter


@pytest.fixture
def workspace_tmp():
    root = Path("tests") / ".tmp-commands" / uuid.uuid4().hex
    root.mkdir(parents=True, exist_ok=True)
    try:
        yield root
    finally:
        shutil.rmtree(root, ignore_errors=True)


def _make_executable(path: Path) -> None:
    path.write_text("", encoding="utf-8")
    path.chmod(path.stat().st_mode | 0o111)


def test_windows_command_resolver_prefers_npx_cmd_when_present(workspace_tmp):
    _make_executable(workspace_tmp / "npx")
    _make_executable(workspace_tmp / "npx.cmd")

    command = resolve_command(["npx", "@angular/cli@15"], is_windows=True, path=str(workspace_tmp))

    assert command == [str(workspace_tmp / "npx.cmd"), "@angular/cli@15"]


def test_windows_command_resolver_prefers_npm_cmd_when_present(workspace_tmp):
    _make_executable(workspace_tmp / "npm")
    _make_executable(workspace_tmp / "npm.cmd")

    command = resolve_command(["npm", "install"], is_windows=True, path=str(workspace_tmp))

    assert command == [str(workspace_tmp / "npm.cmd"), "install"]


def test_non_windows_command_resolver_uses_normal_path_resolution(monkeypatch):
    calls = []

    def fake_which(name, path=None):
        calls.append((name, path))
        return "/usr/bin/dotnet" if name == "dotnet" else None

    monkeypatch.setattr("migration_agent.core.commands.shutil.which", fake_which)

    command = resolve_command(["dotnet", "build"], is_windows=False, path="/usr/bin")

    assert command == ["/usr/bin/dotnet", "build"]
    assert calls == [("dotnet", "/usr/bin")]


def test_dotnet_build_command_execution_still_uses_dotnet(monkeypatch, workspace_tmp):
    calls = []

    def fake_run_command(command, cwd=None, **kwargs):
        calls.append((command, cwd))
        return {"returncode": 0, "stdout": "ok", "stderr": "", "resolvedCommand": command}

    monkeypatch.setattr("migration_agent.adapters.dotnet.run_command", fake_run_command)

    result = DotnetAdapter().run_build(workspace_tmp)

    assert result == {"success": True, "output": "ok"}
    assert calls == [
        (["dotnet", "build", str(workspace_tmp), "--disable-build-servers"], workspace_tmp),
        (["dotnet", "build-server", "shutdown"], workspace_tmp),
    ]


def test_command_output_is_not_streamed_by_default(workspace_tmp, capsys):
    log_path = workspace_tmp / "run.log"

    result = run_command(
        [sys.executable, "-c", "print('hidden-output')"],
        workspace_tmp,
        progress=ProgressReporter(),
        stage="Angular 14 -> 15",
        description="Angular CLI update",
        log_path=log_path,
    )

    captured = capsys.readouterr().out
    assert result["returncode"] == 0
    assert "hidden-output" not in captured
    assert "hidden-output" in log_path.read_text(encoding="utf-8")


def test_heartbeat_is_printed_for_long_running_commands(workspace_tmp, capsys):
    result = run_command(
        [sys.executable, "-c", "import time; time.sleep(0.25); print('done')"],
        workspace_tmp,
        progress=ProgressReporter(),
        stage="Angular 14 -> 15",
        description="Angular CLI update",
        log_path=workspace_tmp / "run.log",
        heartbeat_interval=0.01,
    )

    captured = capsys.readouterr().out
    assert result["returncode"] == 0
    assert "[Angular 14 -> 15] Still running Angular CLI update..." in captured


def test_verbose_mode_streams_output(workspace_tmp, capsys):
    result = run_command(
        [sys.executable, "-c", "print('visible-output')"],
        workspace_tmp,
        progress=ProgressReporter("verbose"),
        stage="Angular 14 -> 15",
        description="Angular CLI update",
        log_path=workspace_tmp / "run.log",
    )

    captured = capsys.readouterr().out
    assert result["returncode"] == 0
    assert "visible-output" in captured
