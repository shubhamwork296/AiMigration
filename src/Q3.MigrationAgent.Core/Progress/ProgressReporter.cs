using Q3.MigrationAgent.Core.Abstractions;

namespace Q3.MigrationAgent.Core.Progress;

public sealed class ProgressReporter(string verbosity = "default") : IProgressReporter
{
    public bool Verbose => string.Equals(verbosity, "verbose", StringComparison.OrdinalIgnoreCase);
    public bool Quiet => string.Equals(verbosity, "quiet", StringComparison.OrdinalIgnoreCase);

    public void Stage(string stage, string message)
    {
        if (!Quiet) ConsoleFormatter.WriteLine(LabelFor(stage, message), $"[{stage}] {message}");
    }

    public void Error(string stage, string message) => ConsoleFormatter.WriteLine(ConsoleLabel.Error, $"[{stage}] {message}");

    public void Detail(string message)
    {
        if (!Quiet) ConsoleFormatter.WriteLine(ConsoleLabel.Info, message);
    }

    public void FinalReport(string reportPath) => ConsoleFormatter.WriteLine(ConsoleLabel.Report, $"[Report] Migration report written to: {reportPath}");

    public void LogFile(string logPath)
    {
        if (!Quiet) ConsoleFormatter.WriteLine(ConsoleLabel.Info, $"Log file: {logPath}");
    }

    private static ConsoleLabel LabelFor(string stage, string message)
    {
        if (stage.Contains("AI", StringComparison.OrdinalIgnoreCase) ||
            message.Contains("AI ", StringComparison.OrdinalIgnoreCase) ||
            message.Contains("AI-", StringComparison.OrdinalIgnoreCase))
        {
            return ConsoleLabel.Ai;
        }

        if (message.Contains("warning", StringComparison.OrdinalIgnoreCase))
        {
            return ConsoleLabel.Warn;
        }

        if (message.Contains("completed successfully", StringComparison.OrdinalIgnoreCase) ||
            message.Contains(" passed", StringComparison.OrdinalIgnoreCase))
        {
            return ConsoleLabel.Success;
        }

        if (message.StartsWith("Starting ", StringComparison.OrdinalIgnoreCase) ||
            message.StartsWith("Running ", StringComparison.OrdinalIgnoreCase) ||
            message.Contains(" still running", StringComparison.OrdinalIgnoreCase))
        {
            return ConsoleLabel.Running;
        }

        return ConsoleLabel.Step;
    }
}
