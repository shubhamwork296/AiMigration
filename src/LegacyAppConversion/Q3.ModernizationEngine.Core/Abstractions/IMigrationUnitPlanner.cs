using Q3.ModernizationEngine.Shared.Models;

namespace Q3.ModernizationEngine.Core.Abstractions;

public interface IMigrationUnitPlanner
{
    Task<ExecutionPlan> BuildPlanAsync(
        ModernizationRequest request,
        IReadOnlyList<DiscoveredArtifact> artifacts,
        CancellationToken cancellationToken = default);
}
