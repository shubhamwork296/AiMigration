using Q3.MigrationAgent.Core.Abstractions;

namespace Q3.MigrationAgent.AI.Prompts;

public sealed class PromptLoader : IPromptLoader
{
    private const string PromptExtension = ".prompt.txt";

    public string Load(string promptPath)
    {
        var normalized = NormalizePromptPath(promptPath);
        var file = CandidateFiles(normalized).FirstOrDefault(File.Exists);
        if (file is null) throw new FileNotFoundException($"Prompt file not found: {normalized}");

        return RemoveSingleTerminalLineEnding(File.ReadAllText(file));
    }

    private static string NormalizePromptPath(string promptPath)
    {
        var normalized = promptPath.Replace('\\', '/').TrimStart('/');
        return normalized.EndsWith(PromptExtension, StringComparison.OrdinalIgnoreCase)
            ? normalized
            : $"{normalized}{PromptExtension}";
    }

    private static IEnumerable<string> CandidateFiles(string normalizedPromptPath)
    {
        var roots = new List<string> { AppContext.BaseDirectory, Directory.GetCurrentDirectory() };
        roots.AddRange(ParentDirectories(AppContext.BaseDirectory));
        roots.AddRange(ParentDirectories(Directory.GetCurrentDirectory()));

        foreach (var root in roots.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            yield return Path.Combine(root, "Prompts", normalizedPromptPath);
            yield return Path.Combine(root, "src", "Q3.MigrationAgent.AI", "Prompts", normalizedPromptPath);
            yield return Path.Combine(root, "Q3.MigrationAgent.AI", "Prompts", normalizedPromptPath);
        }
    }

    private static IEnumerable<string> ParentDirectories(string start)
    {
        var current = new DirectoryInfo(start);
        while (current.Parent is not null)
        {
            current = current.Parent;
            yield return current.FullName;
        }
    }

    private static string RemoveSingleTerminalLineEnding(string text) =>
        text.EndsWith("\r\n", StringComparison.Ordinal) ? text[..^2] :
        text.EndsWith('\n') ? text[..^1] :
        text;
}
