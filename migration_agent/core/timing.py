from __future__ import annotations

import json
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator


class TimingRecorder:
    def __init__(self) -> None:
        self._items: list[dict[str, Any]] = []

    @contextmanager
    def measure(self, name: str) -> Iterator[None]:
        started = time.monotonic()
        try:
            yield
        finally:
            self.add(name, time.monotonic() - started)

    def add(self, name: str, seconds: float, *, status: str = "completed") -> None:
        self._items.append({"name": name, "seconds": round(seconds, 3), "status": status})

    def write(self, output_path: Path) -> tuple[Path, Path]:
        output_path.mkdir(parents=True, exist_ok=True)
        json_path = output_path / "migration-timing-summary.json"
        md_path = output_path / "migration-timing-summary.md"
        total = round(sum(item["seconds"] for item in self._items), 3)
        json_path.write_text(json.dumps({"totalSeconds": total, "timings": self._items}, indent=2) + "\n", encoding="utf-8")
        md_path.write_text(
            "\n".join(
                [
                    "# Migration Timing Summary",
                    "",
                    f"- Total seconds: {total}",
                    "",
                    "| Stage | Seconds | Status |",
                    "| --- | ---: | --- |",
                    *(f"| {item['name']} | {item['seconds']} | {item['status']} |" for item in self._items),
                    "",
                ]
            ),
            encoding="utf-8",
        )
        return json_path, md_path
