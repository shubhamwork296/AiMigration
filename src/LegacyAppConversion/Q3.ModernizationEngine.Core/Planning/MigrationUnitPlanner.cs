using Q3.ModernizationEngine.Core.Abstractions;
using Q3.ModernizationEngine.Shared.Models;

namespace Q3.ModernizationEngine.Core.Planning;

public sealed class MigrationUnitPlanner : IMigrationUnitPlanner
{
    private static readonly IReadOnlyList<string> DefaultGuardRails =
    [
        "Read legacy files only. Never modify the source application in place.",
        "Write all generated outputs only under the provided modernization output path.",
        "Create modules from connected business features, not from individual files whenever possible.",
        "Keep shared business/infrastructure layers separate from Blazor UI feature modules.",
        "Use dependency order for module execution and stop for manual review when risky legacy patterns are detected.",
        "Do not assume direct ASPX-to-Blazor conversion is safe without validating state, auth, config, and SQL boundaries."
    ];

    private static readonly HashSet<string> SharedBusinessRoots =
    [
        "app_code", "businesslayer", "abstractlayer", "databaseleyer", "db"
    ];

    public Task<ExecutionPlan> BuildPlanAsync(
        ModernizationRequest request,
        IReadOnlyList<DiscoveredArtifact> artifacts,
        CancellationToken cancellationToken = default)
    {
        var artifactMap = artifacts.ToDictionary(a => a.Id, StringComparer.OrdinalIgnoreCase);
        var grouped = artifacts
            .GroupBy(BuildModuleKey, StringComparer.OrdinalIgnoreCase)
            .Select(group => BuildUnit(group.Key, group.ToArray(), artifactMap))
            .ToArray();

        var unitMap = grouped.ToDictionary(u => u.Id, StringComparer.OrdinalIgnoreCase);
        var normalized = grouped
            .Select(unit => unit with
            {
                DependsOn = unit.DependsOn
                    .Where(unitMap.ContainsKey)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToArray()
            })
            .ToArray();

        var ordered = TopologicalOrder(normalized);
        var manualReview = ordered
            .Where(u => u.RequiresManualReview)
            .Select(BuildManualReviewMessage)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        return Task.FromResult(new ExecutionPlan
        {
            Units = ordered,
            OrderedUnitIds = ordered.Select(u => u.Id).ToArray(),
            ManualReviewItems = manualReview,
            GuardRails = DefaultGuardRails
        });
    }

    private static MigrationUnit BuildUnit(
        string moduleKey,
        IReadOnlyList<DiscoveredArtifact> artifacts,
        IReadOnlyDictionary<string, DiscoveredArtifact> artifactMap)
    {
        var allFiles = artifacts.SelectMany(a => a.Files).Distinct(StringComparer.OrdinalIgnoreCase).Order(StringComparer.OrdinalIgnoreCase).ToArray();
        var allSignals = artifacts.SelectMany(a => a.Signals).Distinct(StringComparer.OrdinalIgnoreCase).Order(StringComparer.OrdinalIgnoreCase).ToArray();
        var uiArtifacts = artifacts.Where(a => a.Type is "webforms-page" or "webforms-control" or "webforms-master-page").ToArray();
        var hasUi = uiArtifacts.Length > 0;
        var track = hasUi ? "Blazor" : "BusinessLogic";
        var targetArea = InferTargetArea(track, artifacts, moduleKey);
        var artifactIds = artifacts.Select(a => a.Id).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
        var artifactIdSet = artifactIds.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var entryPoints = DetermineEntryPoints(artifacts, artifactIdSet, artifactMap);
        var exitPoints = DetermineExitPoints(artifacts);
        var dependsOn = artifacts
            .SelectMany(a => a.DependsOn)
            .Where(d => !artifactIdSet.Contains(d) && artifactMap.ContainsKey(d))
            .Select(BuildModuleKeyFromArtifactId(artifactMap))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Where(k => !string.Equals(k, moduleKey, StringComparison.OrdinalIgnoreCase))
            .Select(ModuleId)
            .ToArray();

        var riskScore = artifacts.Max(a => a.RiskScore);
        var requiresManualReview = artifacts.Any(a => a.RequiresManualReview);
        var name = BuildModuleName(moduleKey, hasUi);

        return new MigrationUnit
        {
            Id = ModuleId(moduleKey),
            Name = name,
            ModulePath = BuildModulePath(moduleKey),
            Track = track,
            Category = hasUi ? "feature-module" : "shared-module",
            Files = allFiles,
            ArtifactIds = artifactIds,
            DependsOn = dependsOn,
            EntryPoints = entryPoints,
            ExitPoints = exitPoints,
            Signals = allSignals,
            TargetArea = targetArea,
            Status = "pending",
            RiskScore = riskScore,
            RequiresManualReview = requiresManualReview
        };
    }

    private static Func<string, string> BuildModuleKeyFromArtifactId(IReadOnlyDictionary<string, DiscoveredArtifact> artifactMap) =>
        artifactId =>
        {
            var artifact = artifactMap[artifactId];
            return BuildModuleKey(artifact);
        };

    private static string[] DetermineEntryPoints(
        IReadOnlyList<DiscoveredArtifact> artifacts,
        HashSet<string> artifactIds,
        IReadOnlyDictionary<string, DiscoveredArtifact> artifactMap)
    {
        var entries = artifacts
            .Where(a => a.Type == "webforms-page")
            .Where(a => !a.ReferencedBy.Any(referencedBy => artifactIds.Contains(referencedBy)))
            .Select(a => a.Name)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (entries.Length > 0)
        {
            return entries;
        }

        return artifacts
            .Where(a => !a.ReferencedBy.Any(referencedBy => artifactIds.Contains(referencedBy)) || a.ReferencedBy.Count == 0)
            .Select(a => a.Name)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(5)
            .ToArray();
    }

    private static string[] DetermineExitPoints(IReadOnlyList<DiscoveredArtifact> artifacts) =>
        artifacts
            .Where(a =>
                a.Signals.Contains("navigation-flow", StringComparer.OrdinalIgnoreCase) ||
                a.Signals.Contains("server-transfer", StringComparer.OrdinalIgnoreCase) ||
                a.Signals.Contains("forms-auth", StringComparer.OrdinalIgnoreCase) ||
                a.Signals.Contains("direct-sql", StringComparer.OrdinalIgnoreCase))
            .Select(a => a.Name)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(8)
            .ToArray();

    private static IReadOnlyList<MigrationUnit> TopologicalOrder(IReadOnlyList<MigrationUnit> units)
    {
        var unitMap = units.ToDictionary(u => u.Id, StringComparer.OrdinalIgnoreCase);
        var remaining = units.ToDictionary(
            u => u.Id,
            u => new HashSet<string>(u.DependsOn.Where(unitMap.ContainsKey), StringComparer.OrdinalIgnoreCase),
            StringComparer.OrdinalIgnoreCase);
        var ready = new Queue<MigrationUnit>(units.Where(u => remaining[u.Id].Count == 0).OrderBy(u => u.Name, StringComparer.OrdinalIgnoreCase));
        var ordered = new List<MigrationUnit>();

        while (ready.Count > 0)
        {
            var current = ready.Dequeue();
            ordered.Add(current);

            foreach (var candidate in units.Where(u => remaining[u.Id].Remove(current.Id) && remaining[u.Id].Count == 0))
            {
                if (!ordered.Contains(candidate))
                {
                    ready.Enqueue(candidate);
                }
            }
        }

        foreach (var unresolved in units.Where(u => ordered.All(o => !string.Equals(o.Id, u.Id, StringComparison.OrdinalIgnoreCase))))
        {
            ordered.Add(unresolved);
        }

        return ordered;
    }

    private static string BuildManualReviewMessage(MigrationUnit unit)
    {
        var riskySignals = unit.Signals
            .Where(signal => signal is "session-state" or "viewstate" or "system-web" or "forms-auth" or "config-dependency" or "partial-postback" or "direct-sql")
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        var signalText = riskySignals.Length == 0 ? "general legacy complexity" : string.Join(", ", riskySignals);
        return $"Review module {unit.Name} before automatic migration. Risk={unit.RiskScore}; signals={signalText}; entryPoints={string.Join(", ", unit.EntryPoints)}.";
    }

    private static string InferTargetArea(string track, IReadOnlyList<DiscoveredArtifact> artifacts, string moduleKey)
    {
        if (track == "BusinessLogic")
        {
            return moduleKey.StartsWith("shared/", StringComparison.OrdinalIgnoreCase)
                ? "Application/Shared"
                : "Application/Services";
        }

        if (artifacts.Any(a => a.Type == "webforms-master-page"))
        {
            return "UI/Layout";
        }

        if (artifacts.Any(a => a.Type == "webforms-control"))
        {
            return "UI/Components";
        }

        return "UI/Pages";
    }

    private static string BuildModuleKey(DiscoveredArtifact artifact)
    {
        var firstFile = artifact.Files.FirstOrDefault() ?? artifact.Name;
        var normalized = firstFile.Replace('\\', '/');
        var segments = normalized.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (segments.Length == 0)
        {
            return "root";
        }

        if (segments.Length == 1)
        {
            return artifact.Type switch
            {
                "webforms-master-page" => "root/layout",
                "webforms-control" => "root/components",
                "webforms-page" => "root/pages",
                "config" => "shared/configuration",
                _ => "shared/root"
            };
        }

        var first = segments[0].ToLowerInvariant();
        if (SharedBusinessRoots.Contains(first))
        {
            return $"shared/{segments[0]}";
        }

        if (artifact.Type == "config")
        {
            return "shared/configuration";
        }

        return segments[0];
    }

    private static string ModuleId(string moduleKey) =>
        $"module_{moduleKey.Replace('/', '_').Replace('-', '_').Replace(' ', '_')}";

    private static string BuildModuleName(string moduleKey, bool hasUi)
    {
        var normalized = moduleKey.Replace("shared/", "", StringComparison.OrdinalIgnoreCase);
        var parts = normalized.Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var label = parts.Length == 0 ? "Root" : string.Join(" ", parts.Select(ToTitleToken));
        return hasUi ? $"{label} Feature" : $"{label} Shared Logic";
    }

    private static string BuildModulePath(string moduleKey)
    {
        var normalized = moduleKey.Replace("shared/", "", StringComparison.OrdinalIgnoreCase);
        return string.Join("/", normalized.Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).Select(ToPathToken));
    }

    private static string ToTitleToken(string value) =>
        string.IsNullOrWhiteSpace(value) ? value : char.ToUpperInvariant(value[0]) + value[1..];

    private static string ToPathToken(string value)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var cleaned = new string(value.Select(ch => invalid.Contains(ch) ? '_' : ch).ToArray());
        return string.IsNullOrWhiteSpace(cleaned) ? "Module" : cleaned;
    }
}
