from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any


class BaseAdapter(ABC):
    runtime: str

    @abstractmethod
    def detect(self, project_path: Path) -> bool:
        """Return true when this adapter can handle the project."""

    @abstractmethod
    def parse_manifest(self, project_path: Path) -> dict[str, Any]:
        """Read project manifests and return structured data."""

    @abstractmethod
    def upgrade_package(self, project_path: Path, change: dict[str, Any]) -> list[Path]:
        """Apply a package upgrade and return touched files."""

    @abstractmethod
    def run_build(self, project_path: Path) -> dict[str, Any]:
        """Run the platform build command and return success/output."""

