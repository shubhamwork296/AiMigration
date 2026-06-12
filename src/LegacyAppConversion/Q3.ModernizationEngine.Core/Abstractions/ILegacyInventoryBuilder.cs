using Q3.ModernizationEngine.Shared.Models;

namespace Q3.ModernizationEngine.Core.Abstractions;

public interface ILegacyInventoryBuilder
{
    Task<IReadOnlyList<DiscoveredArtifact>> DiscoverAsync(ModernizationRequest request, CancellationToken cancellationToken = default);
}
