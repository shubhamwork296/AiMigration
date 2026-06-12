using Q3.ModernizationEngine.Shared.Models;

namespace Q3.ModernizationEngine.Core.Abstractions;

public interface IModuleExecutor
{
    Task<IReadOnlyList<ModuleExecutionResult>> ExecuteAsync(
        ModernizationRequest request,
        IReadOnlyList<ModuleMigrationPlan> modulePlans,
        IReadOnlyList<WorkspacePlacement> placements,
        CancellationToken cancellationToken = default);
}
