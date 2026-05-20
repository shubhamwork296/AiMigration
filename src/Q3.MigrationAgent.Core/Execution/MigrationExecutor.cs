using System.Text;
using System.Text.Json.Nodes;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Shared.Common;
using Q3.MigrationAgent.Shared.DTO;

namespace Q3.MigrationAgent.Core.Execution;

public sealed class MigrationExecutor
{
    public async Task<IReadOnlyList<ChangeResult>> ExecuteChangesAsync(
        IReadOnlyList<JsonObject> plan,
        string projectPath,
        string outputPath,
        IMigrationAdapter adapter,
        CancellationToken cancellationToken = default)
    {
        CopyProject(projectPath, outputPath);
        var results = new List<ChangeResult>();
        foreach (var change in plan)
        {
            results.Add(await ExecuteSingleChangeAsync(change, outputPath, adapter, cancellationToken));
        }
        return results;
    }

    public async Task<ChangeResult> ExecuteSingleChangeAsync(JsonObject change, string outputPath, IMigrationAdapter adapter, CancellationToken cancellationToken = default)
    {
        try
        {
            IReadOnlyList<string> touched = [];
            var type = change.StringValue("type");
            if (type is "framework" or "runtime")
            {
                touched = ReplaceInFiles(outputPath, change.StringValue("file"), change.StringValue("find"), change.StringValue("replace"));
            }
            else if (type is "dependency" or "package")
            {
                touched = await adapter.UpgradePackageAsync(outputPath, change, cancellationToken);
            }
            return new ChangeResult { Change = change, Status = touched.Count > 0 ? "done" : "skipped", Files = touched.Select(p => Path.GetRelativePath(outputPath, p)).ToArray() };
        }
        catch (Exception ex)
        {
            return new ChangeResult { Change = change, Status = "failed", Error = ex.Message };
        }
    }

    public static void CopyProject(string source, string destination)
    {
        if (Directory.Exists(destination)) Directory.Delete(destination, recursive: true);
        CopyDirectory(source, destination);
    }

    public static void CopyDirectory(string source, string destination)
    {
        Directory.CreateDirectory(destination);
        foreach (var directory in Directory.EnumerateDirectories(source))
        {
            if (CopyIgnore.ShouldIgnore(directory)) continue;
            CopyDirectory(directory, Path.Combine(destination, Path.GetFileName(directory)));
        }
        foreach (var file in Directory.EnumerateFiles(source))
        {
            if (CopyIgnore.ShouldIgnore(file)) continue;
            File.Copy(file, Path.Combine(destination, Path.GetFileName(file)), overwrite: true);
        }
    }

    public static IReadOnlyList<string> ReplaceInFiles(string root, string pattern, string find, string replace)
    {
        var touched = new List<string>();
        foreach (var file in Glob(root, pattern))
        {
            string original;
            try { original = File.ReadAllText(file, Encoding.UTF8); }
            catch (DecoderFallbackException) { continue; }
            var updated = original.Replace(find, replace, StringComparison.Ordinal);
            if (updated != original)
            {
                File.WriteAllText(file, updated, Encoding.UTF8);
                touched.Add(file);
            }
        }
        return touched;
    }

    private static IEnumerable<string> Glob(string root, string pattern)
    {
        if (pattern.StartsWith("**/", StringComparison.Ordinal))
        {
            var suffix = pattern[3..];
            return Directory.EnumerateFiles(root, "*", SearchOption.AllDirectories)
                .Where(path => Matches(Path.GetFileName(path), suffix));
        }
        return Directory.EnumerateFiles(root, pattern, SearchOption.TopDirectoryOnly);
    }

    private static bool Matches(string name, string pattern) =>
        pattern.StartsWith("*.", StringComparison.Ordinal)
            ? name.EndsWith(pattern[1..], StringComparison.OrdinalIgnoreCase)
            : string.Equals(name, pattern, StringComparison.OrdinalIgnoreCase);
}

