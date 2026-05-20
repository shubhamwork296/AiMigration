using Q3.MigrationAgent.Shared.Config;

namespace Q3.MigrationAgent.Business.Abstractions;

public interface IConfigLoader
{
    Task<MigrationConfig> LoadAsync(string configPath, string? verbosityOverride = null, CancellationToken cancellationToken = default);
}

