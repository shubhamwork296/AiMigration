using Q3.LegacyMigration.Commands;

namespace Q3.LegacyMigration.Tests;

internal sealed class RecordingCommandRunner : ICommandRunner
{
    public List<IReadOnlyList<string>> Commands { get; } = [];
    public List<string?> Inputs { get; } = [];
    public Queue<CommandResult> Results { get; } = [];

    public Task<CommandResult> RunAsync(IReadOnlyList<string> command, string workingDirectory, int timeoutSeconds, CancellationToken cancellationToken = default, string? input = null)
    {
        Commands.Add(command.ToArray());
        Inputs.Add(input);
        return Task.FromResult(Results.Count > 0 ? Results.Dequeue() : new CommandResult(0, "ok"));
    }
}
