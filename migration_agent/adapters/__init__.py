from migration_agent.adapters.base import BaseAdapter
from migration_agent.adapters.angular import AngularAdapter
from migration_agent.adapters.dotnet import DotnetAdapter

ADAPTERS: list[BaseAdapter] = [DotnetAdapter(), AngularAdapter()]


def find_adapter(runtime: str, project_path=None):
    for adapter in ADAPTERS:
        if adapter.runtime == runtime:
            return adapter
    raise ValueError(f"No adapter registered for runtime '{runtime}'")
