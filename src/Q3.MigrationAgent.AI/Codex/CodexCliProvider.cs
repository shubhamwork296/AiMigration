using Q3.MigrationAgent.AI.Providers;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Core.Logging;
using Q3.MigrationAgent.Shared.Config;

namespace Q3.MigrationAgent.AI.Codex;

public sealed class CodexCliProvider(ICommandRunner commandRunner, IPromptLoader promptLoader, AiUsageTracker? usageTracker = null) : CliAiProviderBase(commandRunner, promptLoader, usageTracker)
{
    public override string Name => "codex";
    protected override IReadOnlyList<string> DefaultCommand(AiConfig config) => ["codex", "exec", "--json", "--skip-git-repo-check"];

    protected override IReadOnlyList<string> PrepareCommand(IReadOnlyList<string> command)
    {
        if (!command.Any(arg => string.Equals(arg, "exec", StringComparison.OrdinalIgnoreCase)) ||
            command.Any(arg => string.Equals(arg, "--json", StringComparison.OrdinalIgnoreCase)))
        {
            return command;
        }

        var prepared = command.ToList();
        var execIndex = prepared.FindIndex(arg => string.Equals(arg, "exec", StringComparison.OrdinalIgnoreCase));
        prepared.Insert(execIndex + 1, "--json");
        return prepared;
    }
}
