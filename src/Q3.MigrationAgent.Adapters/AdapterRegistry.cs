using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Core.Orchestration;

namespace Q3.MigrationAgent.Adapters;

public sealed class AdapterRegistry(IEnumerable<IMigrationAdapter> adapters) : IAdapterRegistry
{
    private readonly IReadOnlyList<IMigrationAdapter> _adapters = adapters.ToArray();

    public async Task<IMigrationAdapter> FindAdapterAsync(string runtime, string projectPath, CancellationToken cancellationToken = default)
    {
        var adapter = _adapters.FirstOrDefault(a => string.Equals(a.RuntimeName, runtime, StringComparison.OrdinalIgnoreCase))
            ?? throw new InvalidOperationException($"No adapter registered for runtime '{runtime}'");
        if (!await adapter.DetectAsync(projectPath, cancellationToken))
        {
            throw new InvalidOperationException($"Configured runtime '{runtime}' does not appear to match project at {projectPath}.");
        }
        return adapter;
    }
}
