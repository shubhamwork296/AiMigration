using Q3.ModernizationEngine.Shared.Models;

namespace Q3.ModernizationEngine.Core.Abstractions;

public interface IModuleContentGenerator
{
    Task<ModuleExecutionResult> GenerateAsync(
        ModernizationRequest request,
        ModuleMigrationPlan plan,
        WorkspacePlacement placement,
        IModernizationProgressReporter progress,
        CancellationToken cancellationToken = default);
}
