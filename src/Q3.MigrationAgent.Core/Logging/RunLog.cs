namespace Q3.MigrationAgent.Core.Logging;

public sealed class RunLog
{
    private readonly object _sync = new();
    public string CreateRunLogPath(string outputPath)
    {
        Directory.CreateDirectory(outputPath);
        var timestamp = DateTime.Now.ToString("yyyyMMdd-HHmmss");
        return Path.Combine(outputPath, $"migration-run-{timestamp}.log");
    }

    public void Append(string? logPath, string text)
    {
        if (string.IsNullOrWhiteSpace(logPath)) return;

        var content = text.EndsWith(Environment.NewLine, StringComparison.Ordinal)
            ? text
            : text + Environment.NewLine;

        lock (_sync)
        {
            Directory.CreateDirectory(Path.GetDirectoryName(logPath)!);

            using var stream = new FileStream(
                logPath,
                FileMode.Append,
                FileAccess.Write,
                FileShare.ReadWrite);

            using var writer = new StreamWriter(stream);
            writer.Write(content);
        }
    }
}