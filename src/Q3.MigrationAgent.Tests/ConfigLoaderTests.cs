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
        Assert.EndsWith("output", config.OutputPath, StringComparison.OrdinalIgnoreCase);
    }
}

