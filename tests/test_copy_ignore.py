import shutil
import uuid
from pathlib import Path

from migration_agent.core.executor import copy_project
from migration_agent.core.rollback import create_snapshot


def test_project_copy_and_snapshot_skip_generated_artifacts():
    root = Path("tests") / ".tmp-copy-ignore" / uuid.uuid4().hex
    project = root / "project"
    output = root / "output"
    project.mkdir(parents=True)
    try:
        for file_name in ("package.json", "package-lock.json", "angular.json", "tsconfig.json"):
            (project / file_name).write_text("{}", encoding="utf-8")
        for folder in ("node_modules", ".angular/cache", "dist", "build", "coverage", ".cache", ".nx", "tmp", "temp"):
            path = project / folder
            path.mkdir(parents=True)
            (path / "artifact.txt").write_text("generated", encoding="utf-8")
        (project / "migration.log").write_text("log", encoding="utf-8")

        copy_project(project, output)
        snapshot = create_snapshot(project, output)

        for copied in (output, snapshot):
            assert (copied / "package.json").exists()
            assert (copied / "package-lock.json").exists()
            assert (copied / "angular.json").exists()
            assert (copied / "tsconfig.json").exists()
            assert not (copied / "node_modules").exists()
            assert not (copied / ".angular").exists()
            assert not (copied / "dist").exists()
            assert not (copied / "build").exists()
            assert not (copied / "coverage").exists()
            assert not (copied / ".cache").exists()
            assert not (copied / ".nx").exists()
            assert not (copied / "tmp").exists()
            assert not (copied / "temp").exists()
            assert not (copied / "migration.log").exists()
    finally:
        shutil.rmtree(root, ignore_errors=True)
