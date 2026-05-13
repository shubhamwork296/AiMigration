from __future__ import annotations

import shutil
from collections.abc import Callable


COPY_IGNORE_PATTERNS = (
    "bin",
    "obj",
    ".git",
    ".vs",
    "node_modules",
    ".angular",
    "dist",
    "build",
    "coverage",
    ".cache",
    ".nx",
    "tmp",
    "temp",
    "*.log",
)


def migration_copy_ignore() -> Callable[[str, list[str]], set[str]]:
    return shutil.ignore_patterns(*COPY_IGNORE_PATTERNS)
