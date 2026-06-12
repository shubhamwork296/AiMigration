using Q3.ModernizationEngine.Core.Execution;
using Q3.ModernizationEngine.Core.Legacy;
using Q3.ModernizationEngine.Core.Orchestration;
using Q3.ModernizationEngine.Core.Planning;
using Q3.ModernizationEngine.Core.Progress;
using Q3.ModernizationEngine.Core.Target;
using Q3.ModernizationEngine.Core.Workspace;
using Q3.ModernizationEngine.Shared.Models;

static string? Option(string[] args, string name)
{
    for (var i = 0; i < args.Length; i++)
    {
        if (args[i] == name && i + 1 < args.Length) return args[i + 1];
    }

    return null;
}

var sourcePath = Option(args, "--source");
var outputPath = Option(args, "--output");
var architecturePath = Option(args, "--architecture");
var targetMode = Option(args, "--target-mode");
var aiProvider = Option(args, "--ai-provider");
var moduleSelection = Option(args, "--module");
var executionPhase = Option(args, "--phase");
var listModulesOnly = args.Contains("--list-modules", StringComparer.OrdinalIgnoreCase);
var useAi = args.Contains("--use-ai", StringComparer.OrdinalIgnoreCase);

if (string.IsNullOrWhiteSpace(sourcePath) || string.IsNullOrWhiteSpace(outputPath) || string.IsNullOrWhiteSpace(architecturePath))
{
    Console.WriteLine("Usage: --source <legacy-app-path> --output <modernization-output-path> --architecture <target-architecture-path> [--target-mode blazor-only|api-only|blazor-and-api] [--phase full|api|ui] [--module <module-id|module-path|module-name>] [--list-modules] [--use-ai] [--ai-provider codex|claude]");
    return 1;
}

var normalizedPhase = NormalizePhase(executionPhase);
var effectiveTargetMode = ResolveTargetMode(targetMode, normalizedPhase);

var request = new ModernizationRequest
{
    SourcePath = Path.GetFullPath(sourcePath),
    OutputPath = Path.GetFullPath(outputPath),
    TargetArchitecturePath = Path.GetFullPath(architecturePath),
    TargetMode = effectiveTargetMode,
    ModuleSelection = moduleSelection ?? "",
    ExecutionPhase = normalizedPhase,
    ListModulesOnly = listModulesOnly,
    Ai = new ModernizationAiOptions
    {
        UseAi = useAi,
        Provider = useAi ? (string.IsNullOrWhiteSpace(aiProvider) ? "codex" : aiProvider) : "deterministic",
        AiCli = useAi ? (string.IsNullOrWhiteSpace(aiProvider) ? "codex" : aiProvider) : "none"
    }
};

var progress = new ConsoleModernizationProgressReporter();

var orchestrator = new ModernizationOrchestrator(
    new LegacyInventoryBuilder(),
    new MigrationUnitPlanner(),
    new TargetArchitectureAnalyzer(),
    new WorkspacePlanner(),
    new ModulePlanGenerator(new ProviderBackedModernizationAiPlanner()),
    new ModuleExecutor(new ProviderBackedModuleContentGenerator(), progress),
    progress);
var result = await orchestrator.RunAsync(request);

Console.WriteLine($"Workspace path: {result.WorkspacePath}");
Console.WriteLine($"Report path: {result.ReportPath}");
Console.WriteLine($"Graph path: {result.GraphPath}");
Console.WriteLine($"Status path: {result.StatusPath}");
Console.WriteLine($"Target architecture report: {result.TargetArchitectureReportPath}");
Console.WriteLine($"Workspace plan: {result.WorkspacePlanPath}");
Console.WriteLine($"Module plans: {result.ModulePlansPath}");
Console.WriteLine($"Execution results: {result.ExecutionResultsPath}");
Console.WriteLine($"Discovered units: {result.TotalUnits}");
Console.WriteLine($"Manual review items: {result.ManualReviewCount}");
return 0;

static string NormalizePhase(string? phase) =>
    string.IsNullOrWhiteSpace(phase) ? "full" : phase.Trim().ToLowerInvariant() switch
    {
        "api" => "api",
        "ui" => "ui",
        "full" => "full",
        _ => throw new InvalidOperationException("Invalid phase. Use full, api, or ui.")
    };

static string ResolveTargetMode(string? targetMode, string normalizedPhase)
{
    var baseMode = string.IsNullOrWhiteSpace(targetMode) ? "blazor-and-api" : targetMode.Trim().ToLowerInvariant();
    return normalizedPhase switch
    {
        "api" => "api-phase",
        "ui" => "ui-only",
        _ => baseMode
    };
}
