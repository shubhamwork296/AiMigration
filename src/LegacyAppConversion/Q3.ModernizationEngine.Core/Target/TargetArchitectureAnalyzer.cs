using Q3.ModernizationEngine.Core.Abstractions;
using Q3.ModernizationEngine.Shared.Models;

namespace Q3.ModernizationEngine.Core.Target;

public sealed class TargetArchitectureAnalyzer : ITargetArchitectureAnalyzer
{
    public Task<TargetArchitectureProfile> AnalyzeAsync(ModernizationRequest request, CancellationToken cancellationToken = default)
    {
        if (!Directory.Exists(request.TargetArchitecturePath))
        {
            throw new DirectoryNotFoundException($"Target architecture path was not found: {request.TargetArchitecturePath}");
        }

        var root = Path.GetFullPath(request.TargetArchitecturePath);
        var folders = Directory.EnumerateDirectories(root, "*", SearchOption.AllDirectories)
            .Select(path => Path.GetRelativePath(root, path).Replace(Path.DirectorySeparatorChar, '/'))
            .Order(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        var trackRoots = BuildTrackRoots(folders);
        var placementHints = BuildPlacementHints(folders);
        var notes = BuildNotes(folders, trackRoots, placementHints);

        return Task.FromResult(new TargetArchitectureProfile
        {
            RootPath = root,
            KnownFolders = folders,
            TrackRoots = trackRoots,
            PlacementHints = placementHints,
            Notes = notes
        });
    }

    private static IReadOnlyDictionary<string, string> BuildTrackRoots(IReadOnlyList<string> folders)
    {
        var roots = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["Blazor"] = MatchFolder(folders, ["blazor", "ui", "presentation", "web"]) ?? "Blazor",
            ["BusinessLogic"] = MatchFolder(folders, ["business", "application", "core", "services", "domain"]) ?? "BusinessLogic"
        };

        return roots;
    }

    private static IReadOnlyDictionary<string, string> BuildPlacementHints(IReadOnlyList<string> folders)
    {
        var hints = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["UI/Pages"] = MatchFolder(folders, ["pages", "features", "ui/pages"]) ?? "UI/Pages",
            ["UI/Components"] = MatchFolder(folders, ["components", "shared/components", "ui/components"]) ?? "UI/Components",
            ["UI/Layout"] = MatchFolder(folders, ["layout", "shared/layout", "ui/layout"]) ?? "UI/Layout",
            ["Infrastructure/Configuration"] = MatchFolder(folders, ["configuration", "infrastructure/configuration", "config"]) ?? "Infrastructure/Configuration",
            ["Application/SupportingCode"] = MatchFolder(folders, ["application", "services", "core", "shared"]) ?? "Application/SupportingCode"
        };

        return hints;
    }

    private static IReadOnlyList<string> BuildNotes(
        IReadOnlyList<string> folders,
        IReadOnlyDictionary<string, string> trackRoots,
        IReadOnlyDictionary<string, string> placementHints)
    {
        var notes = new List<string>();
        if (folders.Count == 0)
        {
            notes.Add("Target architecture folder is empty. Workspace folders will be scaffolded from default placement hints.");
        }

        foreach (var track in trackRoots)
        {
            if (!folders.Contains(track.Value, StringComparer.OrdinalIgnoreCase))
            {
                notes.Add($"No exact target root found for {track.Key}; planned workspace path will be scaffolded as {track.Value}.");
            }
        }

        foreach (var hint in placementHints)
        {
            if (!folders.Contains(hint.Value, StringComparer.OrdinalIgnoreCase))
            {
                notes.Add($"No exact target folder found for {hint.Key}; planned workspace path will be scaffolded as {hint.Value}.");
            }
        }

        return notes;
    }

    private static string? MatchFolder(IReadOnlyList<string> folders, IReadOnlyList<string> patterns) =>
        folders.FirstOrDefault(folder => patterns.Any(pattern => folder.Contains(pattern, StringComparison.OrdinalIgnoreCase)));
}
