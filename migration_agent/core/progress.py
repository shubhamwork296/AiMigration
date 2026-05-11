from __future__ import annotations

from pathlib import Path


VERBOSITY_DEFAULT = "default"
VERBOSITY_VERBOSE = "verbose"
VERBOSITY_QUIET = "quiet"


class ProgressReporter:
    def __init__(self, verbosity: str = VERBOSITY_DEFAULT) -> None:
        self.verbosity = verbosity

    @property
    def verbose(self) -> bool:
        return self.verbosity == VERBOSITY_VERBOSE

    @property
    def quiet(self) -> bool:
        return self.verbosity == VERBOSITY_QUIET

    def stage(self, stage: str, message: str) -> None:
        if not self.quiet:
            print(f"[{stage}] {message}")

    def error(self, stage: str, message: str) -> None:
        print(f"[{stage}] {message}")

    def detail(self, message: str) -> None:
        if not self.quiet:
            print(message)

    def final_report(self, report_path: Path) -> None:
        print(f"[Report] Migration report written to: {report_path}")

    def log_file(self, log_path: Path) -> None:
        if not self.quiet:
            print(f"Log file: {log_path}")
