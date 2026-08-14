using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using System.Xml;
using System.Xml.Linq;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Shared.Common;
using Q3.MigrationAgent.Shared.Config;
using Q3.MigrationAgent.Shared.DTO;

namespace Q3.MigrationAgent.Adapters.DotNet;

public sealed class DotNetAdapter(ICommandRunner commandRunner) : IMigrationAdapter
{
    private static readonly string[] StructuralPatterns = ["*.sln", "*.csproj", "Directory.Build.props", "Directory.Build.targets", "Directory.Packages.props", "global.json", "NuGet.config"];
    private static readonly string[] FrameworkOwnedPackagePrefixes =
    [
        "Microsoft.AspNetCore.",
        "Microsoft.EntityFrameworkCore",
        "Microsoft.Extensions."
    ];
    public string RuntimeName => "dotnet";

    public Task<bool> DetectAsync(string projectPath, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(Directory.EnumerateFiles(projectPath, "*.csproj", SearchOption.AllDirectories).Any() || Directory.EnumerateFiles(projectPath, "*.sln", SearchOption.AllDirectories).Any());
    }

    public Task<JsonObject> ParseManifestAsync(string projectPath, CancellationToken cancellationToken = default)
    {
        var projects = new JsonArray();
        foreach (var csproj in Directory.EnumerateFiles(projectPath, "*.csproj", SearchOption.AllDirectories).Order())
        {
            projects.Add(ParseCsproj(csproj, projectPath));
        }
        return Task.FromResult(new JsonObject { ["runtime"] = RuntimeName, ["projects"] = projects });
    }

    public Task<IReadOnlyList<string>> UpgradePackageAsync(string projectPath, JsonObject change, CancellationToken cancellationToken = default)
    {
        var touched = new List<string>();
        var packageName = change.StringValue("name");
        var targetVersion = NormalizeTargetVersion(change.StringValue("toVersion"));
        foreach (var csproj in Directory.EnumerateFiles(projectPath, "*.csproj", SearchOption.AllDirectories))
        {
            var original = File.ReadAllText(csproj);
            var updated = ReplacePackageVersion(original, packageName, targetVersion);
            if (updated != original)
            {
                File.WriteAllText(csproj, updated);
                touched.Add(csproj);
            }
        }
        return Task.FromResult<IReadOnlyList<string>>(touched);
    }

    public async Task<BuildResult> RunBuildAsync(string projectPath, int? timeoutSeconds = null, int? idleTimeoutSeconds = null, CancellationToken cancellationToken = default)
    {
        var result = await commandRunner.RunAsync(["dotnet", "build", projectPath, "--disable-build-servers"], projectPath, timeoutSeconds: timeoutSeconds, idleTimeoutSeconds: idleTimeoutSeconds, cancellationToken: cancellationToken);
        if (result.ReturnCode == 127)
        {
            return new BuildResult(false, "dotnet CLI was not found. Install the .NET SDK to run validation.");
        }
        await commandRunner.RunAsync(["dotnet", "build-server", "shutdown"], projectPath, timeoutSeconds: 30, cancellationToken: cancellationToken);
        return new BuildResult(result.ReturnCode == 0, string.Join("\n", new[] { result.Stdout, result.Stderr }.Where(s => !string.IsNullOrWhiteSpace(s))));
    }

    public Task<IReadOnlyDictionary<string, string>> CollectProjectFilesAsync(string projectPath, CancellationToken cancellationToken = default)
    {
        var collected = new Dictionary<string, string>();
        foreach (var pattern in StructuralPatterns)
        {
            foreach (var file in Directory.EnumerateFiles(projectPath, pattern, SearchOption.AllDirectories).Order())
            {
                var parts = file.Split(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
                if (parts.Any(p => p is "bin" or "obj" or ".git")) continue;
                try
                {
                    collected[Path.GetRelativePath(projectPath, file)] = File.ReadAllText(file)[..Math.Min(20_000, (int)new FileInfo(file).Length)];
                }
                catch { }
            }
        }
        return Task.FromResult<IReadOnlyDictionary<string, string>>(collected);
    }

    public IReadOnlyList<MigrationHop> ExpandMigrationHops(string fromVersion, string toVersion)
    {
        var start = MajorFromSpec(fromVersion);
        var end = MajorFromSpec(toVersion);
        if (start is null || end is null || end <= start) return [];
        return Enumerable.Range(start.Value, end.Value - start.Value)
            .Select(v => new MigrationHop(v, v + 1, $".NET {v} to {v + 1}") { Type = "dotnet-hop" })
            .ToArray();
    }

    public async Task<JsonObject> ExecuteMigrationHopAsync(string projectPath, MigrationHop hop, JsonObject rules, MigrationConfig config, IProgressReporter? progress, string? logPath, CancellationToken cancellationToken = default)
    {
        var stage = $".NET {hop.FromVersion} -> {hop.ToVersion}";
        progress?.Stage(stage, "Applying framework and Microsoft package-family alignment...");
        var beforeFiles = StructuralFileContents(projectPath);
        var commands = new JsonArray();

        var changed = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var file in ApplyTargetFrameworkHop(projectPath, hop, rules)) changed.Add(file);
        foreach (var file in ApplyPackageAlignmentHop(projectPath, hop, rules)) changed.Add(file);

        progress?.Stage(stage, "Running dotnet build validation...");
        var build = await RunBuildAsync(projectPath, config.CommandTimeoutSeconds, config.CommandIdleTimeoutSeconds, cancellationToken);
        commands.Add(new JsonObject
        {
            ["command"] = new JsonArray("dotnet", "build"),
            ["returncode"] = build.Success ? 0 : 1,
            ["stdout"] = build.Success ? build.Output : "",
            ["stderr"] = build.Success ? "" : build.Output,
            ["failureCategory"] = build.Success ? null : "build",
            ["failureReason"] = build.Success ? null : "dotnet build failed after applying this migration hop.",
            ["suggestedNextAction"] = build.Success ? null : "Review the build output and apply targeted compatibility fixes before continuing."
        });

        var files = ChangedStructuralFiles(projectPath, beforeFiles).Concat(changed.Select(f => Path.GetRelativePath(projectPath, f))).Distinct(StringComparer.OrdinalIgnoreCase).Order().ToArray();
        return new JsonObject
        {
            ["hop"] = new JsonObject { ["fromVersion"] = hop.FromVersion, ["toVersion"] = hop.ToVersion, ["runtime"] = RuntimeName },
            ["status"] = build.Success ? "done" : "failed",
            ["commands"] = commands,
            ["files"] = new JsonArray(files.Select(f => (JsonNode?)JsonValue.Create(NormalizeRelativePath(f))).ToArray()),
            ["preflightDependencyAnalysis"] = new JsonObject { ["warnings"] = new JsonArray(), ["blockers"] = new JsonArray() },
            ["validation"] = new JsonObject
            {
                ["passed"] = build.Success,
                ["errors"] = build.Success ? "" : build.Output,
                ["output"] = build.Output,
                ["buildVerificationAttempted"] = true,
                ["buildVerificationCommand"] = "dotnet build",
                ["buildVerificationExecutor"] = "dotnet",
                ["buildVerificationPassed"] = build.Success,
                ["buildVerificationSkipped"] = false,
                ["nextHopStartedOnlyAfterBuildVerificationPassed"] = build.Success
            },
            ["dotnetFrameworkAlignment"] = new JsonObject
            {
                ["fromTargetFramework"] = $"net{hop.FromVersion}.0",
                ["toTargetFramework"] = $"net{hop.ToVersion}.0",
                ["packageFamilyPolicy"] = "Microsoft.AspNetCore.*, Microsoft.EntityFrameworkCore*, and Microsoft.Extensions.* direct references with the source major are aligned to the target major."
            }
        };
    }

    private static IReadOnlyList<string> ApplyTargetFrameworkHop(string projectPath, MigrationHop hop, JsonObject rules)
    {
        var from = rules["targetFrameworkChange"]?.AsObject().StringValue("from", $"net{hop.FromVersion}.0") ?? $"net{hop.FromVersion}.0";
        var to = rules["targetFrameworkChange"]?.AsObject().StringValue("to", $"net{hop.ToVersion}.0") ?? $"net{hop.ToVersion}.0";
        var touched = new List<string>();
        foreach (var file in DotNetManifestFiles(projectPath))
        {
            var original = File.ReadAllText(file);
            var updated = original.Replace(from, to, StringComparison.Ordinal);
            if (updated == original) continue;
            File.WriteAllText(file, updated);
            touched.Add(file);
        }
        return touched;
    }

    private static IReadOnlyList<string> ApplyPackageAlignmentHop(string projectPath, MigrationHop hop, JsonObject rules)
    {
        var packageTargets = RulePackageTargets(rules, hop).ToDictionary(kvp => kvp.Name, kvp => kvp.TargetVersion, StringComparer.OrdinalIgnoreCase);
        var touched = new List<string>();
        foreach (var file in DotNetManifestFiles(projectPath))
        {
            var original = File.ReadAllText(file);
            var updated = original;
            foreach (var package in PackageVersionReferences(original))
            {
                if (packageTargets.TryGetValue(package.Name, out var ruleTarget))
                {
                    updated = ReplacePackageVersion(updated, package.Name, NormalizeTargetVersion(ruleTarget));
                    continue;
                }

                if (IsFrameworkOwnedPackage(package.Name) && MajorFromSpec(package.Version) == hop.FromVersion)
                {
                    updated = ReplacePackageVersion(updated, package.Name, $"{hop.ToVersion}.0.0");
                }
            }
            if (updated == original) continue;
            File.WriteAllText(file, updated);
            touched.Add(file);
        }
        return touched;
    }

    private static IEnumerable<(string Name, string TargetVersion)> RulePackageTargets(JsonObject rules, MigrationHop hop)
    {
        foreach (var dependency in (rules["dependencyChanges"] ?? rules["packageChanges"])?.AsArray()?.OfType<JsonObject>() ?? [])
        {
            var name = dependency.StringValue("name");
            if (string.IsNullOrWhiteSpace(name)) continue;
            var fromMajor = MajorFromSpec(dependency.StringValue("fromVersion"));
            if (fromMajor is not null && fromMajor != hop.FromVersion) continue;
            var target = dependency.StringValue("toVersion");
            if (!string.IsNullOrWhiteSpace(target)) yield return (name, target);
        }
    }

    private static IEnumerable<(string Name, string Version)> PackageVersionReferences(string content)
    {
        foreach (Match match in Regex.Matches(content, @"<(?:PackageReference|PackageVersion)\b(?<attrs>[^>]*)/?>", RegexOptions.IgnoreCase | RegexOptions.Singleline))
        {
            var attrs = match.Groups["attrs"].Value;
            var name = AttributeValue(attrs, "Include") ?? AttributeValue(attrs, "Update");
            var version = AttributeValue(attrs, "Version");
            if (!string.IsNullOrWhiteSpace(name) && !string.IsNullOrWhiteSpace(version)) yield return (name, version);
        }
        foreach (Match match in Regex.Matches(content, @"<(?:PackageReference|PackageVersion)\b(?<attrs>[^>]*)>\s*<Version>(?<version>[^<]+)</Version>", RegexOptions.IgnoreCase | RegexOptions.Singleline))
        {
            var attrs = match.Groups["attrs"].Value;
            var name = AttributeValue(attrs, "Include") ?? AttributeValue(attrs, "Update");
            var version = match.Groups["version"].Value;
            if (!string.IsNullOrWhiteSpace(name) && !string.IsNullOrWhiteSpace(version)) yield return (name, version);
        }
    }

    private static string? AttributeValue(string attrs, string name)
    {
        var match = Regex.Match(attrs, $@"\b{Regex.Escape(name)}=[""'](?<value>[^""']+)[""']", RegexOptions.IgnoreCase);
        return match.Success ? match.Groups["value"].Value : null;
    }

    private static bool IsFrameworkOwnedPackage(string name) => FrameworkOwnedPackagePrefixes.Any(prefix => name.StartsWith(prefix, StringComparison.OrdinalIgnoreCase));

    private static IEnumerable<string> DotNetManifestFiles(string projectPath) =>
        Directory.EnumerateFiles(projectPath, "*.csproj", SearchOption.AllDirectories)
            .Concat(new[] { "Directory.Build.props", "Directory.Build.targets", "Directory.Packages.props" }.Select(file => Path.Combine(projectPath, file)).Where(File.Exists));

    private static Dictionary<string, string> StructuralFileContents(string projectPath)
    {
        var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var file in DotNetManifestFiles(projectPath).Concat(Directory.EnumerateFiles(projectPath, "*.sln", SearchOption.AllDirectories)))
        {
            var relative = NormalizeRelativePath(Path.GetRelativePath(projectPath, file));
            result[relative] = File.ReadAllText(file);
        }
        return result;
    }

    private static IReadOnlyList<string> ChangedStructuralFiles(string projectPath, IReadOnlyDictionary<string, string> before)
    {
        var changed = new List<string>();
        foreach (var file in DotNetManifestFiles(projectPath).Concat(Directory.EnumerateFiles(projectPath, "*.sln", SearchOption.AllDirectories)))
        {
            var relative = NormalizeRelativePath(Path.GetRelativePath(projectPath, file));
            if (!before.TryGetValue(relative, out var original) || File.ReadAllText(file) != original) changed.Add(relative);
        }
        return changed;
    }

    private static int? MajorFromSpec(string value) => Regex.Match(value ?? "", @"(\d+)") is { Success: true } m ? int.Parse(m.Groups[1].Value) : null;
    private static string NormalizeRelativePath(string path) => path.Replace('\\', '/');

    private static JsonObject ParseCsproj(string csproj, string root)
    {
        var text = File.ReadAllText(csproj);
        try
        {
            var doc = XDocument.Parse(text, LoadOptions.PreserveWhitespace);
            var frameworks = new JsonArray();
            var packages = new JsonArray();
            foreach (var element in doc.Descendants())
            {
                var name = element.Name.LocalName;
                if (name is "TargetFramework" or "TargetFrameworks" && !string.IsNullOrWhiteSpace(element.Value))
                {
                    foreach (var item in element.Value.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)) frameworks.Add(item);
                }
                if (name == "PackageReference")
                {
                    var packageName = element.Attribute("Include")?.Value ?? element.Attribute("Update")?.Value;
                    var version = element.Attribute("Version")?.Value ?? element.Elements().FirstOrDefault(e => e.Name.LocalName == "Version")?.Value;
                    packages.Add(new JsonObject { ["name"] = packageName, ["version"] = version });
                }
            }
            return new JsonObject { ["path"] = Path.GetRelativePath(root, csproj), ["targetFrameworks"] = frameworks, ["packages"] = packages };
        }
        catch (XmlException)
        {
            return new JsonObject { ["path"] = Path.GetRelativePath(root, csproj), ["parseError"] = true, ["raw"] = text };
        }
    }

    private static string NormalizeTargetVersion(string version) => version.EndsWith(".*", StringComparison.Ordinal) ? version[..^2] + ".0" : version;

    public static string ReplacePackageVersion(string content, string packageName, string targetVersion)
    {
        var include = Regex.Escape(packageName);
        content = Regex.Replace(
            content,
            $@"(<(?:PackageReference|PackageVersion)\b[^>]*(?:Include|Update)=[""']{include}[""'][^>]*\bVersion=)[""'][^""']+[""']",
            match => $"{match.Groups[1].Value}\"{targetVersion}\"",
            RegexOptions.IgnoreCase);
        return Regex.Replace(
            content,
            $@"(<(?:PackageReference|PackageVersion)\b[^>]*(?:Include|Update)=[""']{include}[""'][^>]*>\s*<Version>)[^<]+(</Version>)",
            match => $"{match.Groups[1].Value}{targetVersion}{match.Groups[2].Value}",
            RegexOptions.IgnoreCase | RegexOptions.Singleline);
    }
}
