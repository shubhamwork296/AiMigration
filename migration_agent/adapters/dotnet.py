from __future__ import annotations

import re
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

from migration_agent.adapters.base import BaseAdapter
from migration_agent.core.commands import run_command


class DotnetAdapter(BaseAdapter):
    runtime = "dotnet"
    structural_patterns = [
        "*.sln",
        "*.csproj",
        "Directory.Build.props",
        "Directory.Build.targets",
        "global.json",
        "NuGet.config",
        "appsettings*.json",
    ]

    def detect(self, project_path: Path) -> bool:
        return any(project_path.rglob("*.csproj")) or any(project_path.rglob("*.sln"))

    def parse_manifest(self, project_path: Path) -> dict[str, Any]:
        projects = []
        for csproj in sorted(project_path.rglob("*.csproj")):
            projects.append(self._parse_csproj(csproj, project_path))
        return {"runtime": self.runtime, "projects": projects}

    def upgrade_package(self, project_path: Path, change: dict[str, Any]) -> list[Path]:
        touched: list[Path] = []
        package_name = change["name"]
        target_version = _normalize_target_version(change["toVersion"])

        for csproj in project_path.rglob("*.csproj"):
            original = csproj.read_text(encoding="utf-8")
            updated = _replace_package_version(original, package_name, target_version)
            if updated != original:
                csproj.write_text(updated, encoding="utf-8")
                touched.append(csproj)
        return touched

    def run_build(self, project_path: Path) -> dict[str, Any]:
        completed = run_command(["dotnet", "build", str(project_path), "--disable-build-servers"], project_path)
        if completed["returncode"] == 127:
            return {
                "success": False,
                "output": "dotnet CLI was not found. Install the .NET SDK to run validation.",
            }

        _shutdown_build_server(project_path)

        output = "\n".join(part for part in [completed["stdout"], completed["stderr"]] if part)
        return {"success": completed["returncode"] == 0, "output": output}

    def collect_project_files(self, project_path: Path) -> dict[str, str]:
        collected: dict[str, str] = {}
        for pattern in self.structural_patterns:
            for file_path in sorted(project_path.rglob(pattern)):
                if any(part in {"bin", "obj", ".git"} for part in file_path.parts):
                    continue
                try:
                    text = file_path.read_text(encoding="utf-8")
                except UnicodeDecodeError:
                    continue
                collected[str(file_path.relative_to(project_path))] = text[:20_000]
        return collected

    def _parse_csproj(self, csproj: Path, root: Path) -> dict[str, Any]:
        text = csproj.read_text(encoding="utf-8")
        try:
            xml_root = ET.fromstring(text)
        except ET.ParseError:
            return {"path": str(csproj.relative_to(root)), "parseError": True, "raw": text}

        target_frameworks = []
        packages = []
        for element in xml_root.iter():
            tag = _strip_namespace(element.tag)
            if tag in {"TargetFramework", "TargetFrameworks"} and element.text:
                target_frameworks.extend(part.strip() for part in element.text.split(";") if part.strip())
            if tag == "PackageReference":
                package = {"name": element.attrib.get("Include") or element.attrib.get("Update")}
                version = element.attrib.get("Version")
                if version is None:
                    version_node = next((child for child in element if _strip_namespace(child.tag) == "Version"), None)
                    version = version_node.text if version_node is not None else None
                package["version"] = version
                packages.append(package)

        return {
            "path": str(csproj.relative_to(root)),
            "targetFrameworks": target_frameworks,
            "packages": packages,
        }


def _strip_namespace(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def _normalize_target_version(version: str) -> str:
    return version.replace(".*", ".0") if version.endswith(".*") else version


def _replace_package_version(content: str, package_name: str, target_version: str) -> str:
    include_pattern = re.escape(package_name)

    attr_pattern = re.compile(
        rf'(<PackageReference\b[^>]*(?:Include|Update)=["\']{include_pattern}["\'][^>]*\bVersion=)["\'][^"\']+["\']',
        flags=re.IGNORECASE,
    )
    content = attr_pattern.sub(rf'\1"{target_version}"', content)

    element_pattern = re.compile(
        rf'(<PackageReference\b[^>]*(?:Include|Update)=["\']{include_pattern}["\'][^>]*>\s*<Version>)[^<]+(</Version>)',
        flags=re.IGNORECASE | re.DOTALL,
    )
    return element_pattern.sub(rf'\g<1>{target_version}\2', content)


def _shutdown_build_server(project_path: Path) -> None:
    run_command(["dotnet", "build-server", "shutdown"], project_path)
