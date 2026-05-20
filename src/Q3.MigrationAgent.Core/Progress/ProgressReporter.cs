using Q3.MigrationAgent.Core.Abstractions;

namespace Q3.MigrationAgent.Core.Progress;

public sealed class ProgressReporter(string verbosity = "default") : IProgressReporter
{
    public bool Verbose => string.Equals(verbosity, "verbose", StringComparison.OrdinalIgnoreCase);
    public bool Quiet => string.Equals(verbosity, "quiet", StringComparison.OrdinalIgnoreCase);

    public void Stage(string stage, string message)
    {
        if (!Quiet) Console.WriteLine($"[{stage}] {message}");
    }

    public void Error(string stage, string message) => Console.WriteLine($"[{stage}] {message}");

    public void Detail(string message)
    {
        if (!Quiet) Console.WriteLine(message);
    }

    public void FinalReport(string reportPath) => Console.WriteLine($"[Report] Migration report written to: {reportPath}");

    public void LogFile(string logPath)
    {
        if (!Quiet) Console.WriteLine($"Log file: {logPath}");
    }
}

