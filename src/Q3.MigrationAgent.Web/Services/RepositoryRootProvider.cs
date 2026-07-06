namespace Q3.MigrationAgent.Web.Services;

public sealed class RepositoryRootProvider
{
    public RepositoryRootProvider(IHostEnvironment environment)
    {
        RootPath = FindRepositoryRoot(environment.ContentRootPath);
    }

    public string RootPath { get; }

    public string ConfigPath => Path.Combine(RootPath, "migrate.config.json");

    public string LegacyConfigPath => Path.Combine(RootPath, "legacy-migrate.config.json");

    private static string FindRepositoryRoot(string startPath)
    {
        var current = new DirectoryInfo(startPath);
        while (current is not null)
        {
            var configPath = Path.Combine(current.FullName, "migrate.config.json");
            var cliProjectPath = Path.Combine(current.FullName, "src", "Q3.MigrationAgent.Cli", "Q3.MigrationAgent.Cli.csproj");
            if (File.Exists(configPath) && File.Exists(cliProjectPath))
            {
                return current.FullName;
            }

            current = current.Parent;
        }

        throw new DirectoryNotFoundException(
            $"Could not locate repository root from '{startPath}'. Expected migrate.config.json and src/Q3.MigrationAgent.Cli.");
    }
}
