from migration_agent.adapters.base import BaseAdapter
from migration_agent.adapters.dotnet import DotnetAdapter

ADAPTERS: list[BaseAdapter] = [DotnetAdapter()]


def find_adapter(runtime: str, project_path):
    for adapter in ADAPTERS:
        if adapter.runtime == runtime and adapter.detect(project_path):
            return adapter
    raise ValueError(f"No adapter found for runtime '{runtime}' at {project_path}")

