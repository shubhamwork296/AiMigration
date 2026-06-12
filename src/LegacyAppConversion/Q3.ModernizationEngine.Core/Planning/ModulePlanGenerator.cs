using Q3.ModernizationEngine.Core.Abstractions;
using Q3.ModernizationEngine.Shared.Models;

namespace Q3.ModernizationEngine.Core.Planning;

public sealed class ModulePlanGenerator(IModernizationAiPlanner aiPlanner) : IModulePlanGenerator
{
    public async Task<IReadOnlyList<ModuleMigrationPlan>> BuildPlansAsync(
        ModernizationRequest request,
        ExecutionPlan executionPlan,
        TargetArchitectureProfile architecture,
        IReadOnlyList<WorkspacePlacement> placements,
        CancellationToken cancellationToken = default)
    {
        var placementMap = placements.ToDictionary(p => p.UnitId, StringComparer.OrdinalIgnoreCase);
        var plans = new List<ModuleMigrationPlan>();

        foreach (var unit in executionPlan.Units)
        {
            var placement = placementMap[unit.Id];
            var aiPlan = await aiPlanner.TryPlanAsync(request, unit, architecture, placement, cancellationToken);
            plans.Add(aiPlan ?? DeterministicModernizationAiPlanner.BuildDeterministicPlan(request, unit, placement));
        }

        return plans;
    }
}
