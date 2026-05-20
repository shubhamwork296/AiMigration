using Q3.MigrationAgent.AI.Providers;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Shared.Config;

namespace Q3.MigrationAgent.AI.Codex;

public sealed class CodexCliProvider(ICommandRunner commandRunner) : CliAiProviderBase(commandRunner)
{
    public override string Name => "codex";
    protected override IReadOnlyList<string> DefaultCommand(AiConfig config) => ["codex", "exec", "--skip-git-repo-check"];
}

