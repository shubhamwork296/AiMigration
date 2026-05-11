from __future__ import annotations

from datetime import datetime
from pathlib import Path


def create_run_log_path(output_path: Path) -> Path:
    output_path.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    return output_path / f"migration-run-{timestamp}.log"


def append_log(log_path: Path | None, text: str) -> None:
    if log_path is None:
        return
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with log_path.open("a", encoding="utf-8") as handle:
        handle.write(text)
        if not text.endswith("\n"):
            handle.write("\n")
