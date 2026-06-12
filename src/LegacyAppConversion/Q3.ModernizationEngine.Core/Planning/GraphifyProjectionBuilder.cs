using Q3.ModernizationEngine.Shared.Models;

namespace Q3.ModernizationEngine.Core.Planning;

internal static class GraphifyProjectionBuilder
{
    public static LegacyGraph Build(
        IReadOnlyList<DiscoveredArtifact> inventory,
        ExecutionPlan plan)
    {
        var nodes = new List<GraphNode>();
        var edges = new List<GraphEdge>();

        nodes.AddRange(inventory.Select(artifact => new GraphNode
        {
            Id = artifact.Id,
            Label = artifact.Name,
            Kind = artifact.Type,
            Tags = artifact.Signals
        }));

        nodes.AddRange(plan.Units.Select(unit => new GraphNode
        {
            Id = unit.Id,
            Label = unit.Name,
            Kind = $"module:{unit.Track}",
            Tags = unit.Signals
        }));

        foreach (var artifact in inventory)
        {
            foreach (var dependency in artifact.DependsOn.Distinct(StringComparer.OrdinalIgnoreCase))
            {
                edges.Add(new GraphEdge
                {
                    From = artifact.Id,
                    To = dependency,
                    Kind = "artifact-depends-on"
                });
            }
        }

        foreach (var unit in plan.Units)
        {
            foreach (var artifactId in unit.ArtifactIds.Distinct(StringComparer.OrdinalIgnoreCase))
            {
                edges.Add(new GraphEdge
                {
                    From = artifactId,
                    To = unit.Id,
                    Kind = "artifact-in-module"
                });
            }

            foreach (var dependency in unit.DependsOn.Distinct(StringComparer.OrdinalIgnoreCase))
            {
                edges.Add(new GraphEdge
                {
                    From = unit.Id,
                    To = dependency,
                    Kind = "module-depends-on"
                });
            }
        }

        return new LegacyGraph
        {
            Nodes = nodes.OrderBy(n => n.Kind, StringComparer.OrdinalIgnoreCase).ThenBy(n => n.Label, StringComparer.OrdinalIgnoreCase).ToArray(),
            Edges = edges
                .DistinctBy(edge => $"{edge.From}|{edge.To}|{edge.Kind}", StringComparer.OrdinalIgnoreCase)
                .OrderBy(edge => edge.Kind, StringComparer.OrdinalIgnoreCase)
                .ThenBy(edge => edge.From, StringComparer.OrdinalIgnoreCase)
                .ThenBy(edge => edge.To, StringComparer.OrdinalIgnoreCase)
                .ToArray()
        };
    }
}
