using Q3.ModernizationEngine.Core.Abstractions;

namespace Q3.ModernizationEngine.Core.Progress;

public sealed class ConsoleModernizationProgressReporter : IModernizationProgressReporter
{
    public void Stage(string stage, string message) => Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] [{stage}] {message}");

    public void Detail(string message) => Console.WriteLine($"  -> {message}");

    public void Warning(string message) => Console.WriteLine($"  !! {message}");
}
