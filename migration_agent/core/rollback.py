from __future__ import annotations

import shutil
import time
from pathlib import Path


def create_snapshot(project_path: Path, output_path: Path) -> Path:
    rollback_root = output_path.parent / "rollback"
    rollback_root.mkdir(parents=True, exist_ok=True)
    snapshot_path = rollback_root / str(int(time.time()))
    if snapshot_path.exists():
        shutil.rmtree(snapshot_path)
    shutil.copytree(project_path, snapshot_path, ignore=shutil.ignore_patterns("bin", "obj", ".git", ".vs"))
    return snapshot_path


def restore_snapshot(snapshot_path: Path, target_path: Path) -> None:
    if target_path.exists():
        _remove_tree_with_retry(target_path)
    _copy_tree_with_retry(snapshot_path, target_path)


def _remove_tree_with_retry(path: Path, attempts: int = 5) -> None:
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            shutil.rmtree(path)
            return
        except OSError as exc:
            last_error = exc
            time.sleep(0.5 * (attempt + 1))
    if last_error is not None:
        raise last_error


def _copy_tree_with_retry(source: Path, destination: Path, attempts: int = 5) -> None:
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            shutil.copytree(source, destination)
            return
        except OSError as exc:
            last_error = exc
            if destination.exists():
                _remove_tree_with_retry(destination)
            time.sleep(0.5 * (attempt + 1))
    if last_error is not None:
        raise last_error
