from __future__ import annotations

import fnmatch
import shutil
from pathlib import Path
from typing import Any

from migration_agent.adapters.base import BaseAdapter
from migration_agent.core.copy_ignore import migration_copy_ignore


def execute_changes(
    plan: list[dict[str, Any]],
    project_path: Path,
    output_path: Path,
    adapter: BaseAdapter,
) -> list[dict[str, Any]]:
    copy_project(project_path, output_path)
    results: list[dict[str, Any]] = []

    for change in plan:
        results.append(execute_single_change(change, output_path, adapter))

    return results


def execute_single_change(change: dict[str, Any], output_path: Path, adapter: BaseAdapter) -> dict[str, Any]:
    try:
        touched: list[Path] = []
        if change["type"] in {"framework", "runtime"}:
            touched = replace_in_files(output_path, change["file"], change["find"], change["replace"])
        elif change["type"] in {"dependency", "package"}:
            touched = adapter.upgrade_package(output_path, change)

        return {
            "change": change,
            "status": "done" if touched else "skipped",
            "files": [str(path.relative_to(output_path)) for path in touched],
        }
    except Exception as exc:
        return {"change": change, "status": "failed", "error": str(exc), "files": []}


def copy_project(source: Path, destination: Path) -> None:
    if destination.exists():
        shutil.rmtree(destination)
    shutil.copytree(source, destination, ignore=migration_copy_ignore())


def replace_in_files(root: Path, pattern: str, find: str, replace: str) -> list[Path]:
    touched: list[Path] = []
    for file_path in _glob_pattern(root, pattern):
        try:
            original = file_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        updated = original.replace(find, replace)
        if updated != original:
            file_path.write_text(updated, encoding="utf-8")
            touched.append(file_path)
    return touched


def _glob_pattern(root: Path, pattern: str) -> list[Path]:
    if pattern.startswith("**/"):
        suffix_pattern = pattern[3:]
        return [path for path in root.rglob("*") if path.is_file() and fnmatch.fnmatch(path.name, suffix_pattern)]
    return [path for path in root.glob(pattern) if path.is_file()]
