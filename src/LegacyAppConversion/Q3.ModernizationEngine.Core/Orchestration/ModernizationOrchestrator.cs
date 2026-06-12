using System.Text.Json;
using Q3.ModernizationEngine.Core.Abstractions;
using Q3.ModernizationEngine.Core.Planning;
using Q3.ModernizationEngine.Shared.Models;
using Q3.ModernizationEngine.Core.Workspace;

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
    private readonly ReferenceArchitectureBootstrapper _bootstrapper = new();

    public async Task<ModernizationRunResult> RunAsync(ModernizationRequest request, CancellationToken cancellationToken = default)
    {
        progress.Stage("Intake", $"Starting modernization for source: {request.SourcePath}");
        progress.Detail($"Target mode: {request.TargetMode}");
        progress.Detail($"Execution phase: {request.ExecutionPhase}");
        progress.Detail($"AI enabled: {request.Ai.UseAi} ({request.Ai.Provider})");
        progress.Detail($"Module selection: {(!string.IsNullOrWhiteSpace(request.ModuleSelection) ? request.ModuleSelection : "all discovered modules")}");

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

        if (request.ListModulesOnly)
        {
            progress.Stage("Selection", "Module listing requested; skipping generation phases.");
            var listedMetaPath = Path.Combine(request.OutputPath, "_meta");
            Directory.CreateDirectory(listedMetaPath);
            var listedGraphPath = Path.Combine(listedMetaPath, "legacy-graph.json");
            var listedStatusPath = Path.Combine(listedMetaPath, "migration-status.json");
            var listedReportPath = Path.Combine(listedMetaPath, "modernization-report.md");
            var listedGraph = GraphifyProjectionBuilder.Build(inventory, plan);
            await File.WriteAllTextAsync(listedGraphPath, JsonSerializer.Serialize(listedGraph, JsonOptions()), cancellationToken);
            await File.WriteAllTextAsync(listedStatusPath, JsonSerializer.Serialize(BuildStatus(request, plan, []), JsonOptions()), cancellationToken);
            await File.WriteAllTextAsync(listedReportPath, BuildReport(request, inventory, plan, new TargetArchitectureProfile
            {
                RootPath = request.TargetArchitecturePath,
                KnownFolders = [],
                TrackRoots = new Dictionary<string, string>(),
                PlacementHints = new Dictionary<string, string>(),
                Notes = ["Module listing only. Architecture analysis and execution were skipped."]
            }, [], [], []), cancellationToken);

            return new ModernizationRunResult
            {
                WorkspacePath = request.OutputPath,
                ReportPath = listedReportPath,
                TotalUnits = plan.Units.Count,
                ManualReviewCount = plan.ManualReviewItems.Count,
                GraphPath = listedGraphPath,
                StatusPath = listedStatusPath,
                TargetArchitectureReportPath = string.Empty,
                WorkspacePlanPath = string.Empty,
                ModulePlansPath = string.Empty,
                ExecutionResultsPath = string.Empty
            };
        }

        var selectedPlan = FilterPlan(plan, request, progress);
        progress.Stage("Selection", $"Modules selected for this run: {selectedPlan.Units.Count}");
        foreach (var selectedUnit in selectedPlan.Units)
        {
            progress.Detail($"Selected {selectedUnit.Name} [{selectedUnit.Id}] path={selectedUnit.ModulePath}");
        }

        progress.Stage("Architecture", "Analyzing target architecture folders...");
        var architecture = await targetArchitectureAnalyzer.AnalyzeAsync(request, cancellationToken);
        progress.Detail($"Known target folders: {architecture.KnownFolders.Count}");

        var workspacePath = request.OutputPath;
        var metaPath = Path.Combine(request.OutputPath, "_meta");
        var inventoryPath = Path.Combine(metaPath, "inventory.json");
        var unitsPath = Path.Combine(metaPath, "migration-units.json");
        var reportPath = Path.Combine(metaPath, "modernization-report.md");
        var guardRailsPath = Path.Combine(metaPath, "guardrails.txt");
        var architecturePath = Path.Combine(metaPath, "target-architecture.json");
        var workspacePlanPath = Path.Combine(metaPath, "workspace-plan.json");
        var modulePlansPath = Path.Combine(metaPath, "module-plans.json");
        var executionResultsPath = Path.Combine(metaPath, "execution-results.json");
        var graphPath = Path.Combine(metaPath, "legacy-graph.json");
        var statusPath = Path.Combine(metaPath, "migration-status.json");
        var docsPath = Path.Combine(request.OutputPath, "_meta", "docs");

        Directory.CreateDirectory(metaPath);
        Directory.CreateDirectory(docsPath);
        await _bootstrapper.BootstrapAsync(
            request.TargetArchitecturePath,
            workspacePath,
            NormalizeSolutionName(request.SourcePath),
            progress,
            cancellationToken);
        progress.Stage("Workspace", "Creating segregated workspace plan...");
        var placements = await workspacePlanner.BuildWorkspaceAsync(request, selectedPlan, architecture, workspacePath, cancellationToken);
        progress.Detail($"Workspace placements: {placements.Count}");

        progress.Stage("ModulePlanning", "Creating module migration plans...");
        var modulePlans = await modulePlanGenerator.BuildPlansAsync(request, selectedPlan, architecture, placements, cancellationToken);
        progress.Detail($"Module plans: {modulePlans.Count}");
        foreach (var modulePlan in modulePlans)
        {
            progress.Detail($"Plan ready for {modulePlan.UnitName}: planner={modulePlan.PlannerMode}; outputs={string.Join(", ", modulePlan.SuggestedOutputs.DefaultIfEmpty("none"))}");
        }

        progress.Stage("Execution", "Generating module artifacts...");
        var executionResults = await moduleExecutor.ExecuteAsync(request, modulePlans, placements, cancellationToken);
        progress.Detail($"Execution results: {executionResults.Count}");
        var graph = GraphifyProjectionBuilder.Build(inventory, selectedPlan);
        await File.WriteAllTextAsync(inventoryPath, JsonSerializer.Serialize(inventory, JsonOptions()), cancellationToken);
        await File.WriteAllTextAsync(unitsPath, JsonSerializer.Serialize(selectedPlan, JsonOptions()), cancellationToken);
        await File.WriteAllTextAsync(architecturePath, JsonSerializer.Serialize(architecture, JsonOptions()), cancellationToken);
        await File.WriteAllTextAsync(workspacePlanPath, JsonSerializer.Serialize(placements, JsonOptions()), cancellationToken);
        await File.WriteAllTextAsync(modulePlansPath, JsonSerializer.Serialize(modulePlans, JsonOptions()), cancellationToken);
        await File.WriteAllTextAsync(executionResultsPath, JsonSerializer.Serialize(executionResults, JsonOptions()), cancellationToken);
        await File.WriteAllTextAsync(graphPath, JsonSerializer.Serialize(graph, JsonOptions()), cancellationToken);
        await File.WriteAllTextAsync(statusPath, JsonSerializer.Serialize(BuildStatus(request, selectedPlan, executionResults), JsonOptions()), cancellationToken);
        await WriteModuleBriefsAsync(docsPath, placements, modulePlans, cancellationToken);
        await WriteModuleCardsAsync(docsPath, selectedPlan, modulePlans, cancellationToken);
        await File.WriteAllTextAsync(reportPath, BuildReport(request, inventory, selectedPlan, architecture, placements, modulePlans, executionResults), cancellationToken);
        await File.WriteAllTextAsync(guardRailsPath, string.Join(Environment.NewLine, selectedPlan.GuardRails), cancellationToken);

        progress.Stage("Output", "Modernization artifacts written.");
        progress.Detail($"Inventory: {inventoryPath}");
        progress.Detail($"Units: {unitsPath}");
        progress.Detail($"Architecture: {architecturePath}");
        progress.Detail($"Workspace plan: {workspacePlanPath}");
        progress.Detail($"Module plans: {modulePlansPath}");
        progress.Detail($"Execution results: {executionResultsPath}");
        progress.Detail($"Graph: {graphPath}");
        progress.Detail($"Status: {statusPath}");
        progress.Detail($"Report: {reportPath}");

        return new ModernizationRunResult
        {
            WorkspacePath = workspacePath,
            ReportPath = reportPath,
            TotalUnits = selectedPlan.Units.Count,
            ManualReviewCount = selectedPlan.ManualReviewItems.Count,
            GraphPath = graphPath,
            StatusPath = statusPath,
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

        lines.AddRange(["", "## Graph Summary"]);
        lines.Add($"- Modules: {plan.Units.Count}");
        lines.Add($"- Entry-point modules: {plan.Units.Count(u => u.EntryPoints.Count > 0)}");
        lines.Add($"- Dependency links: {plan.Units.Sum(u => u.DependsOn.Count)}");

        lines.AddRange(["", "## Manual Review"]);
        lines.AddRange(plan.ManualReviewItems.Count == 0 ? ["- None"] : plan.ManualReviewItems.Select(i => $"- {i}"));

        lines.Add("");
        return string.Join(Environment.NewLine, lines);
    }

    private static async Task WriteModuleBriefsAsync(
        string docsPath,
        IReadOnlyList<WorkspacePlacement> placements,
        IReadOnlyList<ModuleMigrationPlan> modulePlans,
        CancellationToken cancellationToken)
    {
        var briefsPath = Path.Combine(docsPath, "module-briefs");
        Directory.CreateDirectory(briefsPath);
        var byUnit = modulePlans.ToDictionary(p => p.UnitId, StringComparer.OrdinalIgnoreCase);
        foreach (var placement in placements)
        {
            if (!byUnit.TryGetValue(placement.UnitId, out var plan)) continue;
            var path = Path.Combine(briefsPath, $"module-plan-{SanitizeForDoc(plan.ModulePath)}.md");
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

    private static async Task WriteModuleCardsAsync(
        string docsPath,
        ExecutionPlan plan,
        IReadOnlyList<ModuleMigrationPlan> modulePlans,
        CancellationToken cancellationToken)
    {
        var modulesPath = Path.Combine(docsPath, "modules");
        Directory.CreateDirectory(modulesPath);
        var planMap = modulePlans.ToDictionary(p => p.UnitId, StringComparer.OrdinalIgnoreCase);
        var indexLines = new List<string> { "# Module Cards", "" };

        for (var index = 0; index < plan.Units.Count; index++)
        {
            var unit = plan.Units[index];
            if (!planMap.TryGetValue(unit.Id, out var modulePlan))
            {
                continue;
            }

            var fileName = $"mod_{index + 1:000}-{SanitizeForDoc(unit.ModulePath)}.md";
            var filePath = Path.Combine(modulesPath, fileName);
            indexLines.Add($"- [{unit.Name}](modules/{fileName})");

            var lines = new List<string>
            {
                $"# {unit.Name}",
                "",
                $"Status: {unit.Status}",
                $"Track: {unit.Track}",
                $"Module Path: {unit.ModulePath}",
                $"Risk Score: {unit.RiskScore}",
                $"Manual Review Required: {unit.RequiresManualReview}",
                "",
                "## Flow",
                $"- Entry points: {string.Join(", ", unit.EntryPoints.DefaultIfEmpty("n/a"))}",
                $"- Exit points: {string.Join(", ", unit.ExitPoints.DefaultIfEmpty("n/a"))}",
                $"- Depends on: {string.Join(", ", unit.DependsOn.DefaultIfEmpty("none"))}",
                "",
                "## Files",
            };
            lines.AddRange(unit.Files.Select(file => $"- {file}"));
            lines.AddRange(["", "## Planned Steps"]);
            lines.AddRange(modulePlan.Steps.Select(step => $"- {step}"));
            lines.AddRange(["", "## Suggested Outputs"]);
            lines.AddRange(modulePlan.SuggestedOutputs.Select(output => $"- {output}"));
            lines.AddRange(["", "## Manual Review"]);
            lines.AddRange(modulePlan.ManualReviewReasons.Count == 0 ? ["- None"] : modulePlan.ManualReviewReasons.Select(reason => $"- {reason}"));
            lines.Add("");

            await File.WriteAllTextAsync(filePath, string.Join(Environment.NewLine, lines), cancellationToken);
        }

        await File.WriteAllTextAsync(Path.Combine(docsPath, "module-index.md"), string.Join(Environment.NewLine, indexLines), cancellationToken);
    }

    private static object BuildStatus(
        ModernizationRequest request,
        ExecutionPlan plan,
        IReadOnlyList<ModuleExecutionResult> executionResults)
    {
        var succeeded = executionResults.Count(result => result.GeneratedArtifacts.Count > 0);
        var blocked = executionResults.Count(result => result.Warnings.Count > 0);
        return new
        {
            project_name = Path.GetFileName(request.SourcePath.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar)),
            migration_started = DateTime.UtcNow,
            migration_completed = (DateTime?)null,
            phases = new
            {
                phase1_document = new { status = "generated", human_approved = false },
                phase2_plan = new { status = "generated", human_approved = false },
                phase3_scaffold = new { status = "generated", human_approved = false },
                phase4_convert = new
                {
                    status = "in-progress",
                    modules_total = plan.Units.Count,
                    modules_succeeded = succeeded,
                    modules_skipped = 0,
                    modules_blocked = blocked
                }
            },
            modules = plan.Units.Select(unit => new
            {
                id = unit.Id,
                name = unit.Name,
                track = unit.Track,
                module_path = unit.ModulePath,
                entry_points = unit.EntryPoints,
                depends_on = unit.DependsOn,
                requires_manual_review = unit.RequiresManualReview
            }).ToArray()
        };
    }

    private static string SanitizeForDoc(string value) =>
        value.Replace('/', '-').Replace('\\', '-').Replace(' ', '-');

    private static ExecutionPlan FilterPlan(ExecutionPlan plan, ModernizationRequest request, IModernizationProgressReporter progress)
    {
        if (string.IsNullOrWhiteSpace(request.ModuleSelection))
        {
            progress.Detail("No specific module selector provided; continuing with all planned modules.");
            return plan;
        }

        var selectedUnits = plan.Units
            .Where(unit =>
                string.Equals(unit.Id, request.ModuleSelection, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(unit.ModulePath, request.ModuleSelection, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(unit.Name, request.ModuleSelection, StringComparison.OrdinalIgnoreCase))
            .ToArray();

        if (selectedUnits.Length == 0)
        {
            throw new InvalidOperationException($"Module selector '{request.ModuleSelection}' did not match any discovered module id, module path, or module name.");
        }

        var selectedIds = selectedUnits.Select(unit => unit.Id).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var selectedWithDependencies = ExpandDependencies(plan.Units, selectedIds, request);
        var filtered = plan.Units.Where(unit => selectedWithDependencies.Contains(unit.Id)).ToArray();

        progress.Detail($"Module selector matched {selectedUnits.Length} module(s); expanded to {filtered.Length} module(s) including dependencies.");
        return new ExecutionPlan
        {
            Units = filtered,
            OrderedUnitIds = filtered.Select(unit => unit.Id).ToArray(),
            ManualReviewItems = plan.ManualReviewItems.Where(item => filtered.Any(unit => item.Contains(unit.Name, StringComparison.OrdinalIgnoreCase))).ToArray(),
            GuardRails = plan.GuardRails
        };
    }

    private static HashSet<string> ExpandDependencies(IReadOnlyList<MigrationUnit> units, HashSet<string> selectedIds, ModernizationRequest request)
    {
        var unitMap = units.ToDictionary(unit => unit.Id, StringComparer.OrdinalIgnoreCase);
        var all = new HashSet<string>(selectedIds, StringComparer.OrdinalIgnoreCase);
        var queue = new Queue<string>(selectedIds);

        while (queue.Count > 0)
        {
            var current = queue.Dequeue();
            if (!unitMap.TryGetValue(current, out var unit))
            {
                continue;
            }

            foreach (var dependency in unit.DependsOn)
            {
                if (IsApiPhase(request) &&
                    unitMap.TryGetValue(dependency, out var dependencyUnit) &&
                    dependencyUnit.Track == "Blazor")
                {
                    continue;
                }

                if (all.Add(dependency))
                {
                    queue.Enqueue(dependency);
                }
            }
        }

        return all;
    }

    private static JsonSerializerOptions JsonOptions() => new() { WriteIndented = true };

    private static bool IsApiPhase(ModernizationRequest request) =>
        request.ExecutionPhase.Equals("api", StringComparison.OrdinalIgnoreCase) ||
        request.TargetMode is "api-only" or "api-phase";

    private static string NormalizeSolutionName(string sourcePath)
    {
        var name = Path.GetFileName(sourcePath.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar));
        foreach (var invalid in Path.GetInvalidFileNameChars())
        {
            name = name.Replace(invalid, '_');
        }

        return string.IsNullOrWhiteSpace(name) ? "ModernizedApplication" : name;
    }
}
