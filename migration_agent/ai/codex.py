from __future__ import annotations

from typing import Any
from migration_agent.ai.provider import AiConfig, ask_ai


async def ask_codex(system: str, user: str) -> dict[str, Any] | None:
    return await ask_ai(
        AiConfig(
            use_ai=True,
            provider="codex",
            mode="cli",
        ),
        system,
        user,
    )
