using Q3.ModernizationEngine.Shared.Models;

namespace Q3.ModernizationEngine.Core.Abstractions;

public interface IModulePlanGenerator
{
    Task<IReadOnlyList<ModuleMigrationPlan>> BuildPlansAsync(
        ModernizationRequest request,
        ExecutionPlan executionPlan,
        TargetArchitectureProfile architecture,
        IReadOnlyList<WorkspacePlacement> placements,
        CancellationToken cancellationToken = default);
}
