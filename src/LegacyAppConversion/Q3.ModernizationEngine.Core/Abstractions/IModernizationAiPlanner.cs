using Q3.ModernizationEngine.Shared.Models;

namespace Q3.ModernizationEngine.Core.Abstractions;

public interface IModernizationAiPlanner
{
    Task<ModuleMigrationPlan?> TryPlanAsync(
        ModernizationRequest request,
        MigrationUnit unit,
        TargetArchitectureProfile architecture,
        WorkspacePlacement placement,
        CancellationToken cancellationToken = default);
}
