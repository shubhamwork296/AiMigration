from __future__ import annotations

from pathlib import Path
from typing import Any

from migration_agent.adapters.base import BaseAdapter


def validate(output_path: Path, adapter: BaseAdapter) -> dict[str, Any]:
    build_result = adapter.run_build(output_path)
    if not build_result["success"]:
        return {
            "passed": False,
            "errors": build_result["output"],
            "suggestion": "Review build output and add explicit transform rules for any required source changes.",
        }
    return {"passed": True, "output": build_result["output"]}

