from __future__ import annotations

import os
import queue
import shutil
import subprocess
import threading
import time
from pathlib import Path
from typing import Any

from migration_agent.core.progress import ProgressReporter
from migration_agent.core.run_log import append_log


WINDOWS_COMMAND_EXTENSIONS = (".cmd", ".exe", ".bat")


def resolve_command(command: list[str], *, is_windows: bool | None = None, path: str | None = None) -> list[str]:
    if not command:
        return command

    resolved = resolve_executable(command[0], is_windows=is_windows, path=path)
    if resolved is None:
        return list(command)
    return [resolved, *command[1:]]


def resolve_executable(name: str, *, is_windows: bool | None = None, path: str | None = None) -> str | None:
    is_windows = os.name == "nt" if is_windows is None else is_windows
    if not is_windows:
        return shutil.which(name, path=path)

    candidates = _windows_executable_candidates(name)
    for candidate in candidates:
        resolved = shutil.which(candidate, path=path)
        if resolved:
            return resolved
    return None


def run_command(
    command: list[str],
    cwd: Path | None = None,
    *,
    input: str | None = None,
    timeout: int | None = None,
    progress: ProgressReporter | None = None,
    stage: str | None = None,
    description: str | None = None,
    log_path: Path | None = None,
    heartbeat_interval: float = 120.0,
) -> dict[str, Any]:
    resolved_command = resolve_command(command)
    command_text = " ".join(command)
    resolved_text = " ".join(resolved_command)
    append_log(log_path, f"$ {command_text}\nresolved: {resolved_text}\ncwd: {cwd or Path.cwd()}")
    started = time.monotonic()
    if progress and stage and description:
        progress.stage(stage, f"Starting {description}...")

    try:
        completed = _run_process(
            resolved_command,
            cwd=cwd,
            input=input,
            timeout=timeout,
            progress=progress,
            stage=stage,
            description=description,
            log_path=log_path,
            heartbeat_interval=heartbeat_interval,
        )
    except FileNotFoundError as exc:
        elapsed = time.monotonic() - started
        append_log(log_path, f"ERROR: {exc}\nelapsed: {_format_elapsed(elapsed)}")
        if progress and stage and description:
            progress.error(stage, f"{description} failed. Full log: {log_path}")
        return {"returncode": 127, "stdout": "", "stderr": str(exc), "resolvedCommand": resolved_command, "durationSeconds": elapsed}
    except subprocess.TimeoutExpired as exc:
        elapsed = time.monotonic() - started
        stdout = exc.stdout or ""
        stderr = exc.stderr or str(exc)
        append_log(log_path, f"TIMEOUT\nelapsed: {_format_elapsed(elapsed)}\n{stdout}\n{stderr}")
        if progress and stage and description:
            progress.error(stage, f"{description} failed. Full log: {log_path}")
        return {
            "returncode": 124,
            "stdout": stdout,
            "stderr": stderr,
            "resolvedCommand": resolved_command,
            "durationSeconds": elapsed,
        }
    elapsed = time.monotonic() - started
    append_log(log_path, f"exit code: {completed.returncode}\nelapsed: {_format_elapsed(elapsed)}\n{completed.stdout}{completed.stderr}")
    if progress and stage and description:
        if completed.returncode == 0:
            progress.stage(stage, f"{description} completed successfully.")
        else:
            progress.error(stage, f"{description} failed. Full log: {log_path}")
    return {
        "returncode": completed.returncode,
        "stdout": completed.stdout,
        "stderr": completed.stderr,
        "resolvedCommand": resolved_command,
        "durationSeconds": elapsed,
    }


def _run_process(
    command: list[str],
    *,
    cwd: Path | None,
    input: str | None,
    timeout: int | None,
    progress: ProgressReporter | None,
    stage: str | None,
    description: str | None,
    log_path: Path | None,
    heartbeat_interval: float,
) -> subprocess.CompletedProcess[str]:
    process = subprocess.Popen(
        command,
        cwd=cwd,
        stdin=subprocess.PIPE if input is not None else None,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    if input is not None and process.stdin is not None:
        process.stdin.write(input)
        process.stdin.close()

    output_queue: queue.Queue[tuple[str, str]] = queue.Queue()
    stdout_parts: list[str] = []
    stderr_parts: list[str] = []
    threads = [
        threading.Thread(target=_read_stream, args=(process.stdout, "stdout", output_queue), daemon=True),
        threading.Thread(target=_read_stream, args=(process.stderr, "stderr", output_queue), daemon=True),
    ]
    for thread in threads:
        thread.start()

    start = time.monotonic()
    last_heartbeat = start
    timed_out = False
    while process.poll() is None:
        _drain_output(output_queue, stdout_parts, stderr_parts, progress, log_path)
        now = time.monotonic()
        if timeout is not None and now - start > timeout:
            timed_out = True
            process.kill()
            break
        if progress and stage and description and heartbeat_interval > 0 and now - last_heartbeat >= heartbeat_interval:
            progress.stage(stage, f"Still running {description}... elapsed {_format_elapsed(now - start)}")
            last_heartbeat = now
        time.sleep(0.1)

    for thread in threads:
        thread.join(timeout=1)
    _drain_output(output_queue, stdout_parts, stderr_parts, progress, log_path)
    returncode = process.wait()
    if timed_out:
        raise subprocess.TimeoutExpired(command, timeout, "".join(stdout_parts), "".join(stderr_parts))
    return subprocess.CompletedProcess(command, returncode, "".join(stdout_parts), "".join(stderr_parts))


def _read_stream(stream: Any, name: str, output_queue: queue.Queue[tuple[str, str]]) -> None:
    if stream is None:
        return
    for line in iter(stream.readline, ""):
        output_queue.put((name, line))
    stream.close()


def _drain_output(
    output_queue: queue.Queue[tuple[str, str]],
    stdout_parts: list[str],
    stderr_parts: list[str],
    progress: ProgressReporter | None,
    log_path: Path | None,
) -> None:
    while True:
        try:
            stream_name, line = output_queue.get_nowait()
        except queue.Empty:
            break
        if stream_name == "stdout":
            stdout_parts.append(line)
        else:
            stderr_parts.append(line)
        append_log(log_path, line.rstrip("\n"))
        if progress and progress.verbose:
            print(line, end="")


def _format_elapsed(seconds: float) -> str:
    minutes = int(seconds // 60)
    if minutes:
        return f"{minutes}m"
    return f"{int(seconds)}s"


def _windows_executable_candidates(name: str) -> list[str]:
    suffix = Path(name).suffix.lower()
    if suffix in WINDOWS_COMMAND_EXTENSIONS:
        return [name]

    # Prefer Windows command shims over extensionless npm shims because
    # CreateProcess cannot execute shell scripts such as nodejs\npx directly.
    return [*(f"{name}{extension}" for extension in WINDOWS_COMMAND_EXTENSIONS), name]
