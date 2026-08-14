using Q3.MigrationAgent.Business.Services;

namespace Q3.MigrationAgent.Tests;

public sealed class ConfigLoaderTests
{
    [Fact]
    public async Task Minimal_Config_Uses_Defaults_And_Legacy_Fields()
    {
        var root = TestWorkspace.Create();
        Directory.CreateDirectory(Path.Combine(root, "project"));
        var configPath = Path.Combine(root, "migrate.config.json");
        await File.WriteAllTextAsync(configPath, """{"projectPath":"project","runtime":"angular","currentVersion":"14","targetVersion":"18"}""");

        var config = await new ConfigLoader().LoadAsync(configPath);

        Assert.False(config.DryRun);
        Assert.False(config.AutoApprove);
        Assert.Equal(1, config.MaxRetries);
        Assert.Equal("auto", config.Ai.AiCli);
        Assert.Equal(300, config.Ai.TimeoutSeconds);
        Assert.Equal(120, config.Ai.IdleTimeoutSeconds);
        Assert.EndsWith("output", config.OutputPath, StringComparison.OrdinalIgnoreCase);
        Assert.Equal("install-first", config.PackageVersionVerificationMode);
        Assert.Equal(0, config.NpmLookupRetries);
        Assert.Equal(20, config.NpmLookupIdleTimeoutSeconds);
        Assert.Equal(45, config.NpmLookupTimeoutSeconds);
    }

    [Fact]
    public async Task Ai_Timeouts_Can_Be_Configured()
    {
        var root = TestWorkspace.Create();
        Directory.CreateDirectory(Path.Combine(root, "project"));
        var configPath = Path.Combine(root, "migrate.config.json");
        await File.WriteAllTextAsync(configPath, """
            {
              "projectPath": "project",
              "runtime": "angular",
              "currentVersion": "14",
              "targetVersion": "18",
              "aiTimeoutSeconds": 900,
              "aiIdleTimeoutSeconds": 240
            }
            """);

        var config = await new ConfigLoader().LoadAsync(configPath);

        Assert.Equal(900, config.Ai.TimeoutSeconds);
        Assert.Equal(240, config.Ai.IdleTimeoutSeconds);
    }
}
