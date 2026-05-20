namespace Q3.MigrationAgent.Core.Abstractions;

public interface IProgressReporter
{
    bool Verbose { get; }
    bool Quiet { get; }
    void Stage(string stage, string message);
    void Error(string stage, string message);
    void Detail(string message);
    void FinalReport(string reportPath);
    void LogFile(string logPath);
}

