namespace Q3.MigrationAgent.Core.Logging;

public sealed class RunLog
{
    public string CreateRunLogPath(string outputPath)
    {
        Directory.CreateDirectory(outputPath);
        var timestamp = DateTime.Now.ToString("yyyyMMdd-HHmmss");
        return Path.Combine(outputPath, $"migration-run-{timestamp}.log");
    }

    public void Append(string? logPath, string text)
    {
        if (string.IsNullOrWhiteSpace(logPath)) return;
        Directory.CreateDirectory(Path.GetDirectoryName(logPath)!);
        File.AppendAllText(logPath, text.EndsWith(Environment.NewLine, StringComparison.Ordinal) ? text : text + Environment.NewLine);
    }
}

