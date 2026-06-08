using Q3.MigrationAgent.AI.Providers;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Core.Logging;
using Q3.MigrationAgent.Shared.Config;

namespace Q3.MigrationAgent.AI.Claude;

public sealed class ClaudeCliProvider(ICommandRunner commandRunner, IPromptLoader promptLoader, AiUsageTracker? usageTracker = null) : CliAiProviderBase(commandRunner, promptLoader, usageTracker)
{
    public override string Name => "claude";
    protected override IReadOnlyList<string> DefaultCommand(AiConfig config) => ["claude", "-p"];
}
