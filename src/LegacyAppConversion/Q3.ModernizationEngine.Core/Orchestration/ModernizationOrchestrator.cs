using System.Text.Json;
using Q3.ModernizationEngine.Core.Abstractions;
using Q3.ModernizationEngine.Shared.Models;

namespace Q3.ModernizationEngine.Core.Orchestration;

public sealed class ModernizationOrchestrator(
    ILegacyInventoryBuilder inventoryBuilder,
    IMigrationUnitPlanner unitPlanner,
    ITargetArchitectureAnalyzer targetArchitectureAnalyzer,
    IWorkspacePlanner workspacePlanner,
    IModulePlanGenerator modulePlanGenerator,
    IModuleExecutor moduleExecutor,
    IModernizationProgressReporter progress)
{
    public async Task<ModernizationRunResult> RunAsync(ModernizationRequest request, CancellationToken cancellationToken = default)
    {
        progress.Stage("Intake", $"Starting modernization for source: {request.SourcePath}");
        progress.Detail($"Target mode: {request.TargetMode}");
        progress.Detail($"AI enabled: {request.Ai.UseAi} ({request.Ai.Provider})");

        Directory.CreateDirectory(request.OutputPath);
        progress.Stage("Intake", $"Output root prepared: {request.OutputPath}");

        progress.Stage("Discovery", "Scanning legacy application artifacts...");
        var inventory = await inventoryBuilder.DiscoverAsync(request, cancellationToken);
        progress.Detail($"Discovered artifacts: {inventory.Count}");

        progress.Stage("Planning", "Building dependency-aware migration units...");
        var plan = await unitPlanner.BuildPlanAsync(request, inventory, cancellationToken);
        progress.Detail($"Planned units: {plan.Units.Count}");
        progress.Detail($"Manual review items: {plan.ManualReviewItems.Count}");
        foreach (var unit in plan.Units.Take(12))
        {
            progress.Detail($"Module {unit.Name}: track={unit.Track}; path={unit.ModulePath}; entry={string.Join(", ", unit.EntryPoints.DefaultIfEmpty("n/a"))}; dependsOn={string.Join(", ", unit.DependsOn.DefaultIfEmpty("none"))}");
        }

        progress.Stage("Architecture", "Analyzing target architecture folders...");
        var architecture = await targetArchitectureAnalyzer.AnalyzeAsync(request, cancellationToken);
        progress.Detail($"Known target folders: {architecture.KnownFolders.Count}");

        var workspacePath = Path.Combine(request.OutputPath, "workspace");
        var inventoryPath = Path.Combine(request.OutputPath, "inventory.json");
        var unitsPath = Path.Combine(request.OutputPath, "migration-units.json");
        var reportPath = Path.Combine(request.OutputPath, "modernization-report.md");
        var guardRailsPath = Path.Combine(request.OutputPath, "guardrails.txt");
        var architecturePath = Path.Combine(request.OutputPath, "target-architecture.json");
        var workspacePlanPath = Path.Combine(request.OutputPath, "workspace-plan.json");
        var modulePlansPath = Path.Combine(request.OutputPath, "module-plans.json");
        var executionResultsPath = Path.Combine(request.OutputPath, "execution-results.json");

        Directory.CreateDirectory(workspacePath);
        progress.Stage("Workspace", "Creating segregated workspace plan...");
        var placements = await workspacePlanner.BuildWorkspaceAsync(request, plan, architecture, workspacePath, cancellationToken);
        progress.Detail($"Workspace placements: {placements.Count}");

        progress.Stage("ModulePlanning", "Creating module migration plans...");
        var modulePlans = await modulePlanGenerator.BuildPlansAsync(request, plan, architecture, placements, cancellationToken);
        progress.Detail($"Module plans: {modulePlans.Count}");

        progress.Stage("Execution", "Generating module artifacts...");
        var executionResults = await moduleExecutor.ExecuteAsync(request, modulePlans, placements, cancellationToken);
        progress.Detail($"Execution results: {executionResults.Count}");
        await File.WriteAllTextAsync(inventoryPath, JsonSerializer.Serialize(inventory, JsonOptions()), cancellationToken);
        await File.WriteAllTextAsync(unitsPath, JsonSerializer.Serialize(plan, JsonOptions()), cancellationToken);
        await File.WriteAllTextAsync(architecturePath, JsonSerializer.Serialize(architecture, JsonOptions()), cancellationToken);
        await File.WriteAllTextAsync(workspacePlanPath, JsonSerializer.Serialize(placements, JsonOptions()), cancellationToken);
        await File.WriteAllTextAsync(modulePlansPath, JsonSerializer.Serialize(modulePlans, JsonOptions()), cancellationToken);
        await File.WriteAllTextAsync(executionResultsPath, JsonSerializer.Serialize(executionResults, JsonOptions()), cancellationToken);
        await WriteModuleBriefsAsync(placements, modulePlans, cancellationToken);
        await File.WriteAllTextAsync(reportPath, BuildReport(request, inventory, plan, architecture, placements, modulePlans, executionResults), cancellationToken);
        await File.WriteAllTextAsync(guardRailsPath, string.Join(Environment.NewLine, plan.GuardRails), cancellationToken);

        progress.Stage("Output", "Modernization artifacts written.");
        progress.Detail($"Inventory: {inventoryPath}");
        progress.Detail($"Units: {unitsPath}");
        progress.Detail($"Architecture: {architecturePath}");
        progress.Detail($"Workspace plan: {workspacePlanPath}");
        progress.Detail($"Module plans: {modulePlansPath}");
        progress.Detail($"Execution results: {executionResultsPath}");
        progress.Detail($"Report: {reportPath}");

        return new ModernizationRunResult
        {
            WorkspacePath = workspacePath,
            ReportPath = reportPath,
            TotalUnits = plan.Units.Count,
            ManualReviewCount = plan.ManualReviewItems.Count,
            TargetArchitectureReportPath = architecturePath,
            WorkspacePlanPath = workspacePlanPath,
            ModulePlansPath = modulePlansPath,
            ExecutionResultsPath = executionResultsPath
        };
    }

    private static string BuildReport(
        ModernizationRequest request,
        IReadOnlyList<DiscoveredArtifact> inventory,
        ExecutionPlan plan,
        TargetArchitectureProfile architecture,
        IReadOnlyList<WorkspacePlacement> placements,
        IReadOnlyList<ModuleMigrationPlan> modulePlans,
        IReadOnlyList<ModuleExecutionResult> executionResults)
    {
        var lines = new List<string>
        {
            "# Modernization Report",
            "",
            $"Source: {request.SourcePath}",
            $"Target architecture: {request.TargetArchitecturePath}",
            $"Target UI/runtime: {request.TargetUiType} on {request.TargetRuntime} {request.TargetVersion}",
            "",
            "## Discovered Artifacts",
        };

        lines.AddRange(inventory.Count == 0
            ? ["- No ASPX/ASCX artifacts discovered."]
            : inventory.Select(a => $"- [{a.Type}] {a.Name}: {string.Join(", ", a.Files)}; risk={a.RiskScore}; review={a.RequiresManualReview}"));

        lines.AddRange(["", "## Migration Units"]);
        lines.AddRange(plan.Units.Select(u => $"- {u.Name} -> track={u.Track}; modulePath={u.ModulePath}; area={u.TargetArea}; entry={string.Join(", ", u.EntryPoints.DefaultIfEmpty("n/a"))}; dependsOn={string.Join(", ", u.DependsOn.DefaultIfEmpty("none"))}; risk={u.RiskScore}; manualReview={u.RequiresManualReview}"));

        lines.AddRange(["", "## Target Architecture"]);
        lines.Add($"- Root: {architecture.RootPath}");
        lines.AddRange(["- Track roots:"]);
        lines.AddRange(architecture.TrackRoots.Select(t => $"  {t.Key} => {t.Value}"));
        lines.AddRange(architecture.PlacementHints.Select(h => $"- {h.Key} => {h.Value}"));
        if (architecture.Notes.Count > 0)
        {
            lines.AddRange(architecture.Notes.Select(note => $"- Note: {note}"));
        }

        lines.AddRange(["", "## Workspace Plan"]);
        lines.AddRange(placements.Select(p => $"- {p.UnitName} -> track={p.Track}; modulePath={p.ModulePath}; folder={p.WorkspaceFolder}; review={p.RequiresManualReview}"));

        lines.AddRange(["", "## Module Plans"]);
        lines.AddRange(modulePlans.Select(p => $"- {p.UnitName} -> planner={p.PlannerMode}; targetMode={p.TargetMode}; entry={string.Join(", ", p.EntryPoints.DefaultIfEmpty("n/a"))}; dependsOn={string.Join(", ", p.DependsOnUnits.DefaultIfEmpty("none"))}; outputs={string.Join(", ", p.SuggestedOutputs)}"));

        lines.AddRange(["", "## Execution Results"]);
        lines.AddRange(executionResults.Select(r => $"- {r.UnitName} -> executor={r.ExecutorMode}; generated={r.GeneratedArtifacts.Count}; warnings={r.Warnings.Count}"));

        lines.AddRange(["", "## Guard Rails"]);
        lines.AddRange(plan.GuardRails.Select(g => $"- {g}"));

        lines.AddRange(["", "## Manual Review"]);
        lines.AddRange(plan.ManualReviewItems.Count == 0 ? ["- None"] : plan.ManualReviewItems.Select(i => $"- {i}"));

        lines.Add("");
        return string.Join(Environment.NewLine, lines);
    }

    private static async Task WriteModuleBriefsAsync(
        IReadOnlyList<WorkspacePlacement> placements,
        IReadOnlyList<ModuleMigrationPlan> modulePlans,
        CancellationToken cancellationToken)
    {
        var byUnit = modulePlans.ToDictionary(p => p.UnitId, StringComparer.OrdinalIgnoreCase);
        foreach (var placement in placements)
        {
            if (!byUnit.TryGetValue(placement.UnitId, out var plan)) continue;
            var path = Path.Combine(placement.WorkspaceFolder, "module-plan.md");
            var lines = new List<string>
            {
                $"# {plan.UnitName}",
                "",
                $"- Module path: {plan.ModulePath}",
                $"- Track: {plan.Track}",
                $"- Target mode: {plan.TargetMode}",
                $"- Planner: {plan.PlannerMode}",
                $"- Workspace folder: {placement.WorkspaceFolder}",
                "",
                "## Flow",
                $"- Entry points: {string.Join(", ", plan.EntryPoints.DefaultIfEmpty("n/a"))}",
                $"- Exit points: {string.Join(", ", plan.ExitPoints.DefaultIfEmpty("n/a"))}",
                $"- Depends on: {string.Join(", ", plan.DependsOnUnits.DefaultIfEmpty("none"))}",
                "",
                "## Summary",
                plan.Summary,
                "",
                "## Suggested Outputs"
            };
            lines.AddRange(plan.SuggestedOutputs.Count == 0 ? ["- None"] : plan.SuggestedOutputs.Select(o => $"- {o}"));
            lines.AddRange(["", "## Steps"]);
            lines.AddRange(plan.Steps.Count == 0 ? ["- None"] : plan.Steps.Select(s => $"- {s}"));
            lines.AddRange(["", "## SQL"]);
            lines.AddRange(plan.SqlArtifacts.Count == 0 ? ["- None"] : plan.SqlArtifacts.Select(s => $"- {s}"));
            lines.AddRange(["", "## Manual Review"]);
            lines.AddRange(plan.ManualReviewReasons.Count == 0 ? ["- None"] : plan.ManualReviewReasons.Select(r => $"- {r}"));
            lines.Add("");
            await File.WriteAllTextAsync(path, string.Join(Environment.NewLine, lines), cancellationToken);
        }
    }

    private static JsonSerializerOptions JsonOptions() => new() { WriteIndented = true };
}
