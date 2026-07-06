using Q3.LegacyMigration.Commands;
using Q3.LegacyMigration.Config;
using Q3.LegacyMigration.WebForms;

static string? Option(string[] args, string name)
{
    for (var i = 0; i < args.Length; i++)
    {
        if (string.Equals(args[i], name, StringComparison.OrdinalIgnoreCase) && i + 1 < args.Length) return args[i + 1];
    }
    return null;
}

try
{
    var configPath = Option(args, "--config") ?? "legacy-migrate.config.json";
    var config = await new LegacyMigrationConfigLoader().LoadAsync(configPath);
    var result = await new LegacyWebFormsToBlazorAdapter().MigrateAsync(config, new CommandRunner());
    Console.WriteLine($"Output path: {result.OutputPath}");
    Console.WriteLine($"Report path: {result.ReportPath}");
    Console.WriteLine($"Validation: {(result.Success ? "passed" : "failed")}");
    return result.Success ? 0 : 1;
}
catch (OperationCanceledException)
{
    Console.Error.WriteLine("Legacy migration cancelled.");
    return 130;
}
catch (Exception ex)
{
    Console.Error.WriteLine($"Legacy migration failed: {ex.Message}");
    return 1;
}
