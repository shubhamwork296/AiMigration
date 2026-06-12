using Q3.ModernizationEngine.Core.Abstractions;
using Q3.ModernizationEngine.Shared.Models;

namespace Q3.ModernizationEngine.Core.Execution;

public sealed class ModuleExecutor(IModuleContentGenerator generator, IModernizationProgressReporter progress) : IModuleExecutor
{
    public async Task<IReadOnlyList<ModuleExecutionResult>> ExecuteAsync(
        ModernizationRequest request,
        IReadOnlyList<ModuleMigrationPlan> modulePlans,
        IReadOnlyList<WorkspacePlacement> placements,
        CancellationToken cancellationToken = default)
    {
        var placementMap = placements.ToDictionary(p => p.UnitId, StringComparer.OrdinalIgnoreCase);
        var results = new List<ModuleExecutionResult>();

        foreach (var plan in modulePlans)
        {
            if (!placementMap.TryGetValue(plan.UnitId, out var placement))
            {
                continue;
            }

            progress.Stage("Execution", $"Processing module: {plan.UnitName}");
            progress.Detail($"Track={plan.Track}; targetMode={plan.TargetMode}; workspace={placement.WorkspaceFolder}");
            var result = await generator.GenerateAsync(request, plan, placement, progress, cancellationToken);
            progress.Detail($"Executor mode: {result.ExecutorMode}");
            foreach (var artifact in result.GeneratedArtifacts)
            {
                progress.Detail($"Generated {artifact.Kind}: {artifact.RelativePath}");
            }
            foreach (var warning in result.Warnings)
            {
                progress.Warning($"{plan.UnitName}: {warning}");
            }

            results.Add(result);
        }

        return results;
    }
}
