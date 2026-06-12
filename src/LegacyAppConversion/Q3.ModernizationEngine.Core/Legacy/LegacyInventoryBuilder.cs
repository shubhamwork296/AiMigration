using System.Text.RegularExpressions;
using Q3.ModernizationEngine.Core.Abstractions;
using Q3.ModernizationEngine.Shared.Models;

namespace Q3.ModernizationEngine.Core.Legacy;

public sealed class LegacyInventoryBuilder : ILegacyInventoryBuilder
{
    private static readonly string[] ArtifactExtensions = [".aspx", ".ascx", ".master", ".cs", ".config"];
    private static readonly string[] IgnoreFolders = ["bin", "obj", ".git", ".vs", "packages", "node_modules"];

    public Task<IReadOnlyList<DiscoveredArtifact>> DiscoverAsync(ModernizationRequest request, CancellationToken cancellationToken = default)
    {
        ValidateRequest(request);

        var source = request.SourcePath;
        var artifacts = DiscoverArtifacts(source);
        var byId = artifacts.ToDictionary(a => a.Id, StringComparer.OrdinalIgnoreCase);

        foreach (var artifact in artifacts)
        {
            foreach (var dependency in artifact.DependsOn)
            {
                if (byId.TryGetValue(dependency, out var target))
                {
                    target.ReferencedByInternal.Add(artifact.Id);
                }
            }
        }

        var finalized = artifacts
            .Select(a => a.ToArtifact())
            .OrderBy(a => a.Type)
            .ThenBy(a => a.Name, StringComparer.OrdinalIgnoreCase)
            .ToArray();

        return Task.FromResult<IReadOnlyList<DiscoveredArtifact>>(finalized);
    }

    private static void ValidateRequest(ModernizationRequest request)
    {
        if (!Directory.Exists(request.SourcePath))
        {
            throw new DirectoryNotFoundException($"Legacy source path was not found: {request.SourcePath}");
        }

        var source = Path.GetFullPath(request.SourcePath).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        var output = Path.GetFullPath(request.OutputPath).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);

        if (string.Equals(source, output, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Output path must be different from source path.");
        }
    }

    private static List<ArtifactBuilder> DiscoverArtifacts(string source)
    {
        var artifacts = new List<ArtifactBuilder>();
        var allFiles = EnumerateCandidateFiles(source).ToArray();
        var codeBehindSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var page in allFiles.Where(f => HasExtension(f, ".aspx")))
        {
            artifacts.Add(BuildMarkupArtifact(source, page, "webforms-page", codeBehindSet));
        }

        foreach (var control in allFiles.Where(f => HasExtension(f, ".ascx")))
        {
            artifacts.Add(BuildMarkupArtifact(source, control, "webforms-control", codeBehindSet));
        }

        foreach (var master in allFiles.Where(f => HasExtension(f, ".master")))
        {
            artifacts.Add(BuildMarkupArtifact(source, master, "webforms-master-page", codeBehindSet));
        }

        foreach (var codeFile in allFiles.Where(f => HasExtension(f, ".cs")))
        {
            var relative = NormalizeRelative(source, codeFile);
            if (codeBehindSet.Contains(relative)) continue;
            artifacts.Add(BuildCodeArtifact(source, codeFile));
        }

        foreach (var configFile in allFiles.Where(f => HasExtension(f, ".config")))
        {
            artifacts.Add(BuildConfigArtifact(source, configFile));
        }

        return artifacts;
    }

    private static ArtifactBuilder BuildMarkupArtifact(string source, string file, string type, HashSet<string> codeBehindSet)
    {
        var relative = NormalizeRelative(source, file);
        var content = ReadText(file);
        var files = new List<string> { relative };
        var signals = DetectSignals(content, type);
        var dependsOn = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        var codeBehindPath = file + ".cs";
        if (File.Exists(codeBehindPath))
        {
            var relativeCodeBehind = NormalizeRelative(source, codeBehindPath);
            files.Add(relativeCodeBehind);
            codeBehindSet.Add(relativeCodeBehind);
            dependsOn.Add(ArtifactId(relativeCodeBehind));
            signals.Add("code-behind");
        }

        foreach (Match match in Regex.Matches(content, @"MasterPageFile\s*=\s*[""'](?<path>[^""']+)[""']", RegexOptions.IgnoreCase))
        {
            var target = NormalizeVirtualDependency(match.Groups["path"].Value);
            if (!string.IsNullOrWhiteSpace(target))
            {
                dependsOn.Add(ArtifactId(target));
                signals.Add("master-page-link");
            }
        }

        foreach (Match match in Regex.Matches(content, @"Src\s*=\s*[""'](?<path>[^""']+\.ascx)[""']", RegexOptions.IgnoreCase))
        {
            var target = NormalizeVirtualDependency(match.Groups["path"].Value);
            if (!string.IsNullOrWhiteSpace(target))
            {
                dependsOn.Add(ArtifactId(target));
                signals.Add("user-control-link");
            }
        }

        return FinalizeArtifact(relative, Path.GetFileNameWithoutExtension(relative), type, files, dependsOn, signals,
            "Read-only discovery of Web Forms markup and directly linked files.");
    }

    private static ArtifactBuilder BuildCodeArtifact(string source, string file)
    {
        var relative = NormalizeRelative(source, file);
        var content = ReadText(file);
        var signals = DetectSignals(content, "supporting-code");
        var dependsOn = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (Match match in Regex.Matches(content, @"(?<!\w)(?<name>[A-Z][A-Za-z0-9_]+)\s*\(", RegexOptions.Multiline))
        {
            var symbol = match.Groups["name"].Value;
            if (IgnoredSymbols.Contains(symbol, StringComparer.OrdinalIgnoreCase)) continue;
            signals.Add($"symbol:{symbol}");
        }

        return FinalizeArtifact(relative, Path.GetFileNameWithoutExtension(relative), "supporting-code", [relative], dependsOn, signals,
            "Supporting C# file discovered for future dependency graph enrichment.");
    }

    private static ArtifactBuilder BuildConfigArtifact(string source, string file)
    {
        var relative = NormalizeRelative(source, file);
        var content = ReadText(file);
        var signals = DetectSignals(content, "config");
        return FinalizeArtifact(relative, Path.GetFileNameWithoutExtension(relative), "config", [relative], [], signals,
            "Configuration file discovered. Keep migration manual until config mapping is defined.");
    }

    private static ArtifactBuilder FinalizeArtifact(
        string relativePath,
        string name,
        string type,
        IReadOnlyList<string> files,
        IEnumerable<string> dependsOn,
        HashSet<string> signals,
        string notes)
    {
        var normalizedSignals = signals.Order(StringComparer.OrdinalIgnoreCase).ToArray();
        var risk = ComputeRisk(type, normalizedSignals);
        return new ArtifactBuilder
        {
            Id = ArtifactId(relativePath),
            Name = name,
            Type = type,
            Files = files.Distinct(StringComparer.OrdinalIgnoreCase).ToArray(),
            DependsOn = dependsOn.Where(d => !string.IsNullOrWhiteSpace(d)).Distinct(StringComparer.OrdinalIgnoreCase).ToArray(),
            Signals = normalizedSignals,
            RiskScore = risk,
            RequiresManualReview = risk >= 6 || normalizedSignals.Contains("session-state", StringComparer.OrdinalIgnoreCase) || normalizedSignals.Contains("viewstate", StringComparer.OrdinalIgnoreCase),
            Notes = notes
        };
    }

    private static IEnumerable<string> EnumerateCandidateFiles(string source) =>
        Directory.EnumerateFiles(source, "*.*", SearchOption.AllDirectories)
            .Where(path => ArtifactExtensions.Contains(Path.GetExtension(path), StringComparer.OrdinalIgnoreCase))
            .Where(path => !PathSegments(path).Any(segment => IgnoreFolders.Contains(segment, StringComparer.OrdinalIgnoreCase)));

    private static IEnumerable<string> PathSegments(string path) =>
        path.Split([Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar], StringSplitOptions.RemoveEmptyEntries);

    private static bool HasExtension(string path, string extension) =>
        string.Equals(Path.GetExtension(path), extension, StringComparison.OrdinalIgnoreCase);

    private static string ReadText(string path) => File.ReadAllText(path);

    private static string NormalizeRelative(string root, string path) =>
        Path.GetRelativePath(root, path).Replace(Path.DirectorySeparatorChar, '/');

    private static string NormalizeVirtualDependency(string virtualPath)
    {
        var cleaned = virtualPath.Trim().Replace('\\', '/');
        if (cleaned.StartsWith("~/", StringComparison.Ordinal)) cleaned = cleaned[2..];
        if (cleaned.StartsWith("/", StringComparison.Ordinal)) cleaned = cleaned[1..];
        return cleaned;
    }

    private static string ArtifactId(string path) =>
        path.Replace(Path.DirectorySeparatorChar, '_').Replace(Path.AltDirectorySeparatorChar, '_').Replace('/', '_').Replace('.', '_');

    private static HashSet<string> DetectSignals(string content, string artifactType)
    {
        var signals = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { artifactType };

        if (content.Contains("Session[", StringComparison.OrdinalIgnoreCase) || content.Contains(".Session", StringComparison.OrdinalIgnoreCase))
            signals.Add("session-state");
        if (content.Contains("ViewState", StringComparison.OrdinalIgnoreCase))
            signals.Add("viewstate");
        if (content.Contains("Response.Redirect", StringComparison.OrdinalIgnoreCase))
            signals.Add("navigation-flow");
        if (content.Contains("Server.Transfer", StringComparison.OrdinalIgnoreCase))
            signals.Add("server-transfer");
        if (content.Contains("HttpContext", StringComparison.OrdinalIgnoreCase) || content.Contains("System.Web", StringComparison.OrdinalIgnoreCase))
            signals.Add("system-web");
        if (content.Contains("GridView", StringComparison.OrdinalIgnoreCase) || content.Contains("Repeater", StringComparison.OrdinalIgnoreCase))
            signals.Add("server-control");
        if (content.Contains("UpdatePanel", StringComparison.OrdinalIgnoreCase))
            signals.Add("partial-postback");
        if (content.Contains("FormsAuthentication", StringComparison.OrdinalIgnoreCase))
            signals.Add("forms-auth");
        if (content.Contains("ConfigurationManager", StringComparison.OrdinalIgnoreCase) || content.Contains("<appSettings", StringComparison.OrdinalIgnoreCase))
            signals.Add("config-dependency");
        if (content.Contains("SqlConnection", StringComparison.OrdinalIgnoreCase) || content.Contains("SqlCommand", StringComparison.OrdinalIgnoreCase))
            signals.Add("direct-sql");
        if (content.Contains("OnClick=", StringComparison.OrdinalIgnoreCase) || content.Contains("AutoEventWireup", StringComparison.OrdinalIgnoreCase))
            signals.Add("event-driven-ui");

        return signals;
    }

    private static int ComputeRisk(string type, IReadOnlyList<string> signals)
    {
        var risk = type switch
        {
            "webforms-page" => 4,
            "webforms-control" => 3,
            "webforms-master-page" => 5,
            "config" => 5,
            _ => 2
        };

        if (signals.Contains("session-state", StringComparer.OrdinalIgnoreCase)) risk += 2;
        if (signals.Contains("viewstate", StringComparer.OrdinalIgnoreCase)) risk += 2;
        if (signals.Contains("system-web", StringComparer.OrdinalIgnoreCase)) risk += 2;
        if (signals.Contains("server-control", StringComparer.OrdinalIgnoreCase)) risk += 1;
        if (signals.Contains("partial-postback", StringComparer.OrdinalIgnoreCase)) risk += 1;
        if (signals.Contains("forms-auth", StringComparer.OrdinalIgnoreCase)) risk += 1;
        if (signals.Contains("direct-sql", StringComparer.OrdinalIgnoreCase)) risk += 1;
        return Math.Min(risk, 10);
    }

    private static readonly string[] IgnoredSymbols =
    [
        "if", "for", "foreach", "while", "switch", "return", "nameof", "typeof", "catch", "lock", "using"
    ];

    private sealed class ArtifactBuilder
    {
        public required string Id { get; init; }
        public required string Name { get; init; }
        public required string Type { get; init; }
        public required IReadOnlyList<string> Files { get; init; }
        public required IReadOnlyList<string> DependsOn { get; init; }
        public required IReadOnlyList<string> Signals { get; init; }
        public required int RiskScore { get; init; }
        public required bool RequiresManualReview { get; init; }
        public required string Notes { get; init; }
        public HashSet<string> ReferencedByInternal { get; } = new(StringComparer.OrdinalIgnoreCase);

        public DiscoveredArtifact ToArtifact() => new()
        {
            Id = Id,
            Name = Name,
            Type = Type,
            Files = Files,
            DependsOn = DependsOn,
            ReferencedBy = ReferencedByInternal.Order(StringComparer.OrdinalIgnoreCase).ToArray(),
            Signals = Signals,
            RiskScore = RiskScore,
            RequiresManualReview = RequiresManualReview,
            Notes = Notes
        };
    }
}
