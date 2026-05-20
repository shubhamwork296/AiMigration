namespace Q3.MigrationAgent.Core.Execution;

public static class CopyIgnore
{
    public static readonly string[] Patterns =
    [
        "bin", "obj", ".git", ".vs", "node_modules", ".angular", "dist", "build",
        "coverage", ".cache", ".nx", "tmp", "temp", "*.log"
    ];

    public static bool ShouldIgnore(string path)
    {
        var name = Path.GetFileName(path);
        return Patterns.Any(pattern => Matches(name, pattern));
    }

    private static bool Matches(string name, string pattern)
    {
        if (pattern == "*.log") return name.EndsWith(".log", StringComparison.OrdinalIgnoreCase);
        return string.Equals(name, pattern, StringComparison.OrdinalIgnoreCase);
    }
}

