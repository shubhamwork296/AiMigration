using Q3.ModernizationEngine.Core.Abstractions;
using Q3.ModernizationEngine.Shared.Models;

namespace Q3.ModernizationEngine.Core.Workspace;

public sealed class WorkspacePlanner : IWorkspacePlanner
{
    public Task<IReadOnlyList<WorkspacePlacement>> BuildWorkspaceAsync(
        ModernizationRequest request,
        ExecutionPlan plan,
        TargetArchitectureProfile architecture,
        string workspacePath,
        CancellationToken cancellationToken = default)
    {
        var root = Path.GetFullPath(workspacePath);
        var outputRoot = Path.GetFullPath(request.OutputPath);
        EnsureWithinOutput(root, outputRoot);

        var placements = new List<WorkspacePlacement>();
        foreach (var unit in plan.Units)
        {
            var (trackRoot, relativeArea, moduleFolderSuffix) = ResolvePlacement(request, architecture, unit);
            var unitFolder = Path.Combine(
                root,
                trackRoot.Replace('/', Path.DirectorySeparatorChar),
                relativeArea.Replace('/', Path.DirectorySeparatorChar),
                moduleFolderSuffix.Replace('/', Path.DirectorySeparatorChar));
            EnsureWithinOutput(unitFolder, outputRoot);

            var notes = new List<string>
            {
                $"Track: {unit.Track}",
                $"Source category: {unit.Category}",
                $"Signals: {string.Join(", ", unit.Signals)}",
                $"Resolved workspace root: {trackRoot}",
                $"Resolved relative area: {relativeArea}"
            };

            if (unit.RequiresManualReview)
            {
                notes.Add("Manual review required before automated code generation.");
            }

            placements.Add(new WorkspacePlacement
            {
                UnitId = unit.Id,
                UnitName = unit.Name,
                ModulePath = unit.ModulePath,
                Track = unit.Track,
                TargetArea = relativeArea,
                WorkspaceFolder = unitFolder,
                RequiresManualReview = unit.RequiresManualReview,
                Notes = notes
            });
        }

        return Task.FromResult<IReadOnlyList<WorkspacePlacement>>(placements);
    }

    private static void EnsureWithinOutput(string path, string outputRoot)
    {
        var fullPath = Path.GetFullPath(path).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        var fullOutput = Path.GetFullPath(outputRoot).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        if (!fullPath.StartsWith(fullOutput, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException($"Workspace write target escaped the output root: {fullPath}");
        }
    }

    private static string Sanitize(string name)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var cleaned = new string(name.Select(ch => invalid.Contains(ch) ? '_' : ch).ToArray());
        return string.IsNullOrWhiteSpace(cleaned) ? "UnnamedUnit" : cleaned;
    }

    private static (string TrackRoot, string RelativeArea, string ModuleFolderSuffix) ResolvePlacement(
        ModernizationRequest request,
        TargetArchitectureProfile architecture,
        MigrationUnit unit)
    {
        if (IsApiPhase(request))
        {
            var apiRoot = architecture.TrackRoots.TryGetValue("Api", out var configuredApiRoot)
                ? configuredApiRoot
                : "Api";
            return (apiRoot, string.Empty, string.Empty);
        }

        var trackRoot = architecture.TrackRoots.TryGetValue(unit.Track, out var configuredTrackRoot)
            ? configuredTrackRoot
            : unit.Track;
        var mappedArea = architecture.PlacementHints.TryGetValue(unit.TargetArea, out var hint)
            ? hint
            : unit.TargetArea;
        var relativeArea = NormalizeRelativeArea(trackRoot, mappedArea);
        var relativeModulePath = unit.ModulePath;
        return (trackRoot, relativeArea, relativeModulePath);
    }

    private static bool IsApiPhase(ModernizationRequest request) =>
        request.ExecutionPhase.Equals("api", StringComparison.OrdinalIgnoreCase) ||
        request.TargetMode is "api-only" or "api-phase";

    private static string NormalizeRelativeArea(string trackRoot, string mappedArea)
    {
        var normalizedTrack = trackRoot.Replace('\\', '/').Trim('/');
        var normalizedArea = mappedArea.Replace('\\', '/').Trim('/');
        if (normalizedArea.StartsWith(normalizedTrack + "/", StringComparison.OrdinalIgnoreCase))
        {
            return normalizedArea[(normalizedTrack.Length + 1)..];
        }

        if (string.Equals(normalizedArea, normalizedTrack, StringComparison.OrdinalIgnoreCase))
        {
            return string.Empty;
        }

        return normalizedArea;
    }
}
