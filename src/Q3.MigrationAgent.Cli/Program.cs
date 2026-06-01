using Q3.MigrationAgent.Business.DI;
using Q3.MigrationAgent.Core.Progress;

static string? Option(string[] args, string name)
{
    for (var i = 0; i < args.Length; i++)
    {
        if (args[i] == name && i + 1 < args.Length) return args[i + 1];
    }
    return null;
}

static string[] NormalizeArgs(string[] args) => args.Length > 0 && string.Equals(args[0], "migrate", StringComparison.OrdinalIgnoreCase) ? args[1..] : args;

try
{
    var normalized = NormalizeArgs(args);
    var configPath = Option(normalized, "--config") ?? "migrate.config.json";
    var verbosity = normalized.Contains("--verbose") ? "verbose" : normalized.Contains("--quiet") ? "quiet" : null;
    var services = MigrationAgentServices.Create();
    var config = await services.ConfigLoader.LoadAsync(configPath, verbosity);
    ConsoleFormatter.WriteLine(ConsoleLabel.Info, $"Output path: {config.OutputPath}");
    var result = await services.Orchestrator.RunMigrationAsync(config);
    ConsoleFormatter.WriteLine(ConsoleLabel.Report, $"Log path: {result.LogPath}");
    ConsoleFormatter.WriteLine(ConsoleLabel.Report, $"Report path: {result.ReportPath}");
    ConsoleFormatter.WriteLine(result.ValidationPassed == false ? ConsoleLabel.Error : ConsoleLabel.Success, $"Validation status: {result.ValidationPassed}");
    return result.Success ? 0 : 1;
}
catch (OperationCanceledException)
{
    ConsoleFormatter.WriteLine(ConsoleLabel.Warn, "Migration cancelled.");
    return 130;
}
catch (Exception ex)
{
    ConsoleFormatter.WriteErrorLine(ConsoleLabel.Error, $"Migration failed: {ex.Message}");
    return 1;
}
