using Q3.MigrationAgent.Shared.DTO;

namespace Q3.MigrationAgent.Core.Abstractions;

public interface ICommandRunner
{
    Task<CommandResult> RunAsync(
        IReadOnlyList<string> command,
        string? workingDirectory = null,
        string? input = null,
        int? timeoutSeconds = null,
        IProgressReporter? progress = null,
        string? stage = null,
        string? description = null,
        string? logPath = null,
        double heartbeatIntervalSeconds = 120,
        int? idleTimeoutSeconds = null,
        CancellationToken cancellationToken = default);
}
