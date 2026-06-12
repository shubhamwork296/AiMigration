using Q3.ModernizationEngine.Shared.Models;

namespace Q3.ModernizationEngine.Core.Abstractions;

public interface IWorkspacePlanner
{
    Task<IReadOnlyList<WorkspacePlacement>> BuildWorkspaceAsync(
        ModernizationRequest request,
        ExecutionPlan plan,
        TargetArchitectureProfile architecture,
        string workspacePath,
        CancellationToken cancellationToken = default);
}
