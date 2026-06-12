using Q3.ModernizationEngine.Shared.Models;

namespace Q3.ModernizationEngine.Core.Abstractions;

public interface ITargetArchitectureAnalyzer
{
    Task<TargetArchitectureProfile> AnalyzeAsync(ModernizationRequest request, CancellationToken cancellationToken = default);
}
