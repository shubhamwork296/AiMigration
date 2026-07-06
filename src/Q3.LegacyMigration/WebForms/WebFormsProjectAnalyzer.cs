using System.Text.RegularExpressions;

namespace Q3.LegacyMigration.WebForms;

public sealed class WebFormsProjectAnalyzer
{
    public WebFormsAnalysis Analyze(string projectPath)
    {
        var files = Directory.EnumerateFiles(projectPath, "*", SearchOption.AllDirectories)
            .Where(path => !path.Split(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar).Any(part => part is "bin" or "obj" or ".git" or ".vs"))
            .ToArray();
        var relevant = files.Where(IsRelevantWebFormsFile).Order().ToArray();
        var text = string.Join(Environment.NewLine, relevant.Select(ReadSafe));
        var webConfig = files.FirstOrDefault(f => string.Equals(Path.GetFileName(f), "Web.config", StringComparison.OrdinalIgnoreCase));
        var connection = webConfig is null ? (null, null) : FindConnectionString(File.ReadAllText(webConfig));
        var csproj = files.FirstOrDefault(f => f.EndsWith(".csproj", StringComparison.OrdinalIgnoreCase));

        return new WebFormsAnalysis
        {
            ApplicationName = csproj is null ? "LegacyWebFormsApplication" : Path.GetFileNameWithoutExtension(csproj),
            UsesSqlDataSource = text.Contains("SqlDataSource", StringComparison.OrdinalIgnoreCase),
            UsesSessionState = text.Contains("Session[", StringComparison.OrdinalIgnoreCase),
            UsesDirectAdoNet = text.Contains("SqlConnection", StringComparison.OrdinalIgnoreCase),
            HasClientsWorkflow = text.Contains("Clients", StringComparison.OrdinalIgnoreCase),
            HasPositionsWorkflow = text.Contains("Positions", StringComparison.OrdinalIgnoreCase),
            PrimaryConnectionStringName = connection.Item1,
            PrimaryConnectionString = connection.Item2,
            WebFormsFiles = relevant.Select(f => Normalize(projectPath, f)).ToArray(),
            MasterPages = relevant.Where(f => f.EndsWith(".master", StringComparison.OrdinalIgnoreCase)).Select(f => Normalize(projectPath, f)).ToArray()
        };
    }

    private static bool IsRelevantWebFormsFile(string path)
    {
        var file = Path.GetFileName(path);
        return path.EndsWith(".aspx", StringComparison.OrdinalIgnoreCase) ||
               path.EndsWith(".aspx.cs", StringComparison.OrdinalIgnoreCase) ||
               path.EndsWith(".designer.cs", StringComparison.OrdinalIgnoreCase) ||
               path.EndsWith(".master", StringComparison.OrdinalIgnoreCase) ||
               path.EndsWith(".master.cs", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(file, "Web.config", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(file, "packages.config", StringComparison.OrdinalIgnoreCase);
    }

    private static (string?, string?) FindConnectionString(string webConfig)
    {
        var matches = Regex.Matches(webConfig, "<add\\s+[^>]*name=\"(?<name>[^\"]+)\"[^>]*connectionString=\"(?<connection>[^\"]+)\"", RegexOptions.IgnoreCase);
        foreach (Match match in matches)
        {
            var name = match.Groups["name"].Value;
            if (name.Contains("Hiring", StringComparison.OrdinalIgnoreCase)) return (name, match.Groups["connection"].Value);
        }
        var first = matches.Cast<Match>().FirstOrDefault();
        return first is null ? (null, null) : (first.Groups["name"].Value, first.Groups["connection"].Value);
    }

    private static string ReadSafe(string path)
    {
        try { return File.ReadAllText(path); }
        catch { return ""; }
    }

    private static string Normalize(string root, string path) => Path.GetRelativePath(root, path).Replace('\\', '/');
}
