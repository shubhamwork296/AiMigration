using Q3.MigrationAgent.Adapters;
using Q3.MigrationAgent.Adapters.Angular;
using Q3.MigrationAgent.Adapters.DotNet;
using Q3.MigrationAgent.Adapters.PackageClassification;
using Q3.MigrationAgent.AI.Abstractions;
using Q3.MigrationAgent.AI.Claude;
using Q3.MigrationAgent.AI.Codex;
using Q3.MigrationAgent.AI.Providers;
using Q3.MigrationAgent.Business.Abstractions;
using Q3.MigrationAgent.Business.Services;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Core.Analysis;
using Q3.MigrationAgent.Core.Commands;
using Q3.MigrationAgent.Core.Execution;
using Q3.MigrationAgent.Core.Logging;
using Q3.MigrationAgent.Core.Orchestration;
using Q3.MigrationAgent.Core.Planning;
using Q3.MigrationAgent.Core.Reporting;
using Q3.MigrationAgent.Core.Remediation;
using Q3.MigrationAgent.Core.Rollback;
using Q3.MigrationAgent.Core.Validation;

namespace Q3.MigrationAgent.Business.DI;

public sealed class MigrationAgentServices
{
    public required IConfigLoader ConfigLoader { get; init; }
    public required MigrationOrchestrator Orchestrator { get; init; }

    public static MigrationAgentServices Create(string? rulesRoot = null)
    {
        rulesRoot ??= LocateRulesRoot();
        var runLog = new RunLog();
        ICommandRunner commandRunner = new CommandRunner(runLog);
        var providers = new IAiProvider[] { new CodexCliProvider(commandRunner), new ClaudeCliProvider(commandRunner) };
        var aiResolver = new AiProviderResolver(commandRunner, providers);
        var dotnet = new DotNetAdapter(commandRunner);
        var analyzer = new ProjectAnalyzer(aiResolver);
        var planner = new MigrationPlanner(aiResolver);
        var angular = new AngularAdapter(commandRunner, new PackageClassifier(aiResolver), aiResolver);
        var registry = new AdapterRegistry([dotnet, angular]);
        var orchestrator = new MigrationOrchestrator(
            registry,
            new JsonRuleLoader(rulesRoot),
            analyzer,
            planner,
            new MigrationExecutor(),
            new MigrationValidator(),
            new AiRemediationPlanner(aiResolver),
            new RollbackService(),
            new MarkdownReportWriter(),
            runLog,
            aiResolver);
        return new MigrationAgentServices { ConfigLoader = new ConfigLoader(), Orchestrator = orchestrator };
    }

    private static string LocateRulesRoot()
    {
        var current = AppContext.BaseDirectory;
        var candidates = new[]
        {
            Path.Combine(current, "Rules"),
            Path.Combine(current, "rules"),
            Path.GetFullPath(Path.Combine(current, "..", "..", "..", "..", "Q3.MigrationAgent.Rules")),
            Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "src", "Q3.MigrationAgent.Rules")),
        };
        var found = candidates.FirstOrDefault(Directory.Exists);
        if (found is null) throw new DirectoryNotFoundException("Rules directory could not be located.");
        return found;
    }
}
