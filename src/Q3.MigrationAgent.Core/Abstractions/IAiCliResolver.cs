using Q3.MigrationAgent.Shared.Config;

namespace Q3.MigrationAgent.Core.Abstractions;

public interface IAiCliResolver : IAiService
{
    Task<AiConfig> ResolveAsync(AiConfig config, string? cwd, IProgressReporter? progress, string? logPath, CancellationToken cancellationToken = default);
}

