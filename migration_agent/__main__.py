from __future__ import annotations

import asyncio
import sys

from migration_agent.cli.args import load_config
from migration_agent.core.agent import run_migration


def main() -> int:
    try:
        config = load_config()
        asyncio.run(run_migration(config))
        return 0
    except KeyboardInterrupt:
        print("Migration cancelled.")
        return 130
    except Exception as exc:
        print(f"Migration failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

