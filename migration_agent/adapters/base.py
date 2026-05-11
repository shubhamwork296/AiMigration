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

    def collect_project_files(self, project_path: Path) -> dict[str, str]:
        """Collect structural files useful for analysis."""
        return {}

    def expand_migration_hops(self, from_version: str, to_version: str) -> list[dict[str, Any]]:
        """Return sequential migration hops when this adapter requires them."""
        return []

    def execute_migration_hop(
        self,
        project_path: Path,
        hop: dict[str, Any],
        rules: dict[str, Any],
        optional_migrations_enabled: bool = False,
        auto_remediate_dependencies: bool = False,
        on_dependency_compatibility_issue: str = "auto-remediate-and-continue",
        allow_angular_force_update: bool = False,
        allow_prerelease_dependency_versions: bool = False,
        max_dependency_remediation_retries_per_hop: int = 1,
        continue_after_successful_remediation: bool = True,
        dependency_check_timeout_seconds: int = 300,
        skip_preflight_dependency_compatibility: bool = False,
        preflight_remediation_mode: str = "suggest",
        allow_legacy_peer_deps_fallback: bool = True,
    ) -> dict[str, Any]:
        """Execute one adapter-native migration hop."""
        raise NotImplementedError(f"{self.runtime} does not support adapter-native migration hops.")
