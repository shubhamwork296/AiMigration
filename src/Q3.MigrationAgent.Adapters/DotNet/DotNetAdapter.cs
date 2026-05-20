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

    public IReadOnlyList<MigrationHop> ExpandMigrationHops(string fromVersion, string toVersion) => [];

    public Task<JsonObject> ExecuteMigrationHopAsync(string projectPath, MigrationHop hop, JsonObject rules, MigrationConfig config, IProgressReporter? progress, string? logPath, CancellationToken cancellationToken = default)
    {
        throw new NotSupportedException("dotnet does not support adapter-native migration hops.");
    }

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
            $@"(<PackageReference\b[^>]*(?:Include|Update)=[""']{include}[""'][^>]*\bVersion=)[""'][^""']+[""']",
            match => $"{match.Groups[1].Value}\"{targetVersion}\"",
            RegexOptions.IgnoreCase);
        return Regex.Replace(
            content,
            $@"(<PackageReference\b[^>]*(?:Include|Update)=[""']{include}[""'][^>]*>\s*<Version>)[^<]+(</Version>)",
            match => $"{match.Groups[1].Value}{targetVersion}{match.Groups[2].Value}",
            RegexOptions.IgnoreCase | RegexOptions.Singleline);
    }
}
