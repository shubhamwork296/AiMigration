namespace Q3.MigrationAgent.Core.Progress;

public enum ConsoleLabel
{
    Ai,
    Info,
    Step,
    Running,
    Success,
    Warn,
    Error,
    Report
}

public static class ConsoleFormatter
{
    public static void WriteLine(ConsoleLabel label, string message) =>
        WriteLine(Console.Out, label, message);

    public static void WriteErrorLine(ConsoleLabel label, string message) =>
        WriteLine(Console.Error, label, message);

    private static void WriteLine(TextWriter writer, ConsoleLabel label, string message)
    {
        if (!TryGetColor(out var previous))
        {
            writer.WriteLine($"{FormatLabel(label)} {message}");
            return;
        }

        try
        {
            TrySetColor(ColorFor(label, message));
            writer.WriteLine($"{FormatLabel(label)} {message}");
        }
        finally
        {
            TrySetColor(previous);
        }
    }

    private static string FormatLabel(ConsoleLabel label) => label switch
    {
        ConsoleLabel.Ai => "[AI]",
        ConsoleLabel.Info => "[INFO]",
        ConsoleLabel.Step => "[STEP]",
        ConsoleLabel.Running => "[RUNNING]",
        ConsoleLabel.Success => "[SUCCESS]",
        ConsoleLabel.Warn => "[WARN]",
        ConsoleLabel.Error => "[ERROR]",
        ConsoleLabel.Report => "[REPORT]",
        _ => "[INFO]"
    };

    private static ConsoleColor ColorFor(ConsoleLabel label, string message)
    {
        if (label == ConsoleLabel.Error ||
            message.Contains("failed", StringComparison.OrdinalIgnoreCase) ||
            message.Contains("error", StringComparison.OrdinalIgnoreCase) ||
            message.Contains("blocked", StringComparison.OrdinalIgnoreCase) ||
            message.Contains("exception", StringComparison.OrdinalIgnoreCase))
        {
            return ConsoleColor.Red;
        }

        if (label is ConsoleLabel.Success or ConsoleLabel.Report ||
            message.Contains("completed successfully", StringComparison.OrdinalIgnoreCase) ||
            message.Contains(" passed", StringComparison.OrdinalIgnoreCase) ||
            message.Contains("Validation status: True", StringComparison.OrdinalIgnoreCase))
        {
            return ConsoleColor.Green;
        }

        return ConsoleColor.Yellow;
    }

    private static bool TryGetColor(out ConsoleColor color)
    {
        try
        {
            color = Console.ForegroundColor;
            return true;
        }
        catch
        {
            color = default;
            return false;
        }
    }

    private static void TrySetColor(ConsoleColor color)
    {
        try
        {
            Console.ForegroundColor = color;
        }
        catch
        {
        }
    }
}
