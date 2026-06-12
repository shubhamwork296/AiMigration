namespace Q3.ModernizationEngine.Core.Abstractions;

public interface IModernizationProgressReporter
{
    void Stage(string stage, string message);
    void Detail(string message);
    void Warning(string message);
}
