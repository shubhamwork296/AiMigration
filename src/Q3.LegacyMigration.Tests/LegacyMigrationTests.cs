using Q3.LegacyMigration.Commands;
using Q3.LegacyMigration.Config;
using Q3.LegacyMigration.WebForms;

namespace Q3.LegacyMigration.Tests;

public sealed class LegacyMigrationTests
{
    [Fact]
    public async Task ConfigLoader_Accepts_Only_Legacy_WebForms_To_Blazor_Ssr()
    {
        var root = TestWorkspace.Create();
        var source = Path.Combine(root, "legacy");
        var template = Path.Combine(root, "template");
        var context = Path.Combine(root, "MIGRATION_CONTEXT.md");
        Directory.CreateDirectory(source);
        Directory.CreateDirectory(template);
        await File.WriteAllTextAsync(context, "# Context");
        var configPath = Path.Combine(root, "legacy-migrate.config.json");
        await File.WriteAllTextAsync(configPath, $$"""
{
  "projectPath": "{{source.Replace("\\", "\\\\")}}",
  "from": { "runtime": "legacy-webforms", "version": "4.8" },
  "to": { "runtime": "blazor-ssr", "version": "8" },
  "targetArchitecturePath": "{{template.Replace("\\", "\\\\")}}",
  "migrationContextPath": "{{context.Replace("\\", "\\\\")}}",
  "outputPath": "{{Path.Combine(root, "output").Replace("\\", "\\\\")}}",
  "useAi": true,
  "aiCli": "codex",
  "aiCliCommand": ["codex", "exec", "--skip-git-repo-check"],
  "aiTimeoutSeconds": 123
}
""");

        var config = await new LegacyMigrationConfigLoader().LoadAsync(configPath);

        Assert.Equal("legacy-webforms", config.From.Runtime);
        Assert.Equal("blazor-ssr", config.To.Runtime);
        Assert.Equal(template, config.TargetArchitecturePath);
        Assert.Equal(context, config.MigrationContextPath);
        Assert.True(config.UseAi);
        Assert.Equal("codex", config.AiCli);
        Assert.Equal(["codex", "exec", "--skip-git-repo-check"], config.AiCliCommand);
        Assert.Equal(123, config.AiTimeoutSeconds);
    }

    [Fact]
    public async Task ConfigLoader_Rejects_Framework_Upgrade_Runtimes()
    {
        var root = TestWorkspace.Create();
        Directory.CreateDirectory(Path.Combine(root, "source"));
        Directory.CreateDirectory(Path.Combine(root, "template"));
        var configPath = Path.Combine(root, "legacy-migrate.config.json");
        await File.WriteAllTextAsync(configPath, $$"""
{
  "projectPath": "source",
  "from": { "runtime": "dotnet", "version": "6" },
  "to": { "runtime": "dotnet", "version": "8" },
  "targetArchitecturePath": "template",
  "outputPath": "output"
}
""");

        await Assert.ThrowsAsync<InvalidOperationException>(() => new LegacyMigrationConfigLoader().LoadAsync(configPath));
    }

    [Fact]
    public void Analyzer_Reads_WebForms_Artifacts_And_Detects_Legacy_Features()
    {
        var source = CreateLegacyWebFormsApp();

        var analysis = new WebFormsProjectAnalyzer().Analyze(source);

        Assert.True(analysis.UsesSqlDataSource);
        Assert.True(analysis.UsesSessionState);
        Assert.True(analysis.UsesDirectAdoNet);
        Assert.True(analysis.HasClientsWorkflow);
        Assert.True(analysis.HasPositionsWorkflow);
        Assert.Equal("HiringConnectionString", analysis.PrimaryConnectionStringName);
        Assert.Contains("ClientsList.aspx", analysis.WebFormsFiles);
        Assert.Contains("Site.Master", analysis.MasterPages);
    }

    [Fact]
    public async Task Adapter_Copies_Target_Architecture_And_Generates_Blazor_App_Without_Using_Old_Agent()
    {
        var root = TestWorkspace.Create();
        var source = CreateLegacyWebFormsApp(Path.Combine(root, "legacy"));
        var template = CreateBlazorTemplate(Path.Combine(root, "template"));
        var contextPath = Path.Combine(root, "MIGRATION_CONTEXT.md");
        await File.WriteAllTextAsync(contextPath, "Replace Session IDs with route parameters.");
        var output = Path.Combine(root, "output");
        var runner = new RecordingCommandRunner();
        var config = new LegacyMigrationConfig
        {
            ProjectPath = source,
            From = new RuntimeSpec("legacy-webforms", "4.8"),
            To = new RuntimeSpec("blazor-ssr", "8"),
            TargetArchitecturePath = template,
            MigrationContextPath = contextPath,
            OutputPath = output
        };

        var result = await new LegacyWebFormsToBlazorAdapter().MigrateAsync(config, runner);

        Assert.True(result.Success);
        Assert.True(File.Exists(Path.Combine(output, "src", "IRM.SPA", "Components", "Pages", "Clients", "ClientsList.razor")));
        Assert.True(File.Exists(Path.Combine(output, "src", "IRM.SPA", "Data", "SqlHiringRepository.cs")));
        Assert.Contains("ConnectionStrings", await File.ReadAllTextAsync(Path.Combine(output, "src", "IRM.SPA", "appsettings.json")));
        Assert.Equal(["dotnet restore", "dotnet build"], runner.Commands.Select(c => string.Join(" ", c.Take(2))).ToArray());
        Assert.DoesNotContain(result.GeneratedFiles, f => f.Contains("Q3.MigrationAgent", StringComparison.OrdinalIgnoreCase));
        Assert.Contains("Replace Session IDs with route parameters.", await File.ReadAllTextAsync(result.ReportPath));
        Assert.True(File.Exists(Path.Combine(source, "ClientsList.aspx")));
    }

    [Fact]
    public async Task Adapter_Escapes_Migration_Context_For_Razor_Summary_Page()
    {
        var root = TestWorkspace.Create();
        var source = CreateLegacyWebFormsApp(Path.Combine(root, "legacy"));
        var template = CreateBlazorTemplate(Path.Combine(root, "template"));
        var contextPath = Path.Combine(root, "MIGRATION_CONTEXT.md");
        await File.WriteAllTextAsync(contextPath, "SELECT Id, Name FROM Clients WHERE Id = @Id AND Name = @Name\n<authentication mode=\"None\"/>");
        var output = Path.Combine(root, "output");
        var config = new LegacyMigrationConfig
        {
            ProjectPath = source,
            From = new RuntimeSpec("legacy-webforms", "4.8"),
            To = new RuntimeSpec("blazor-ssr", "8"),
            TargetArchitecturePath = template,
            MigrationContextPath = contextPath,
            OutputPath = output
        };

        await new LegacyWebFormsToBlazorAdapter().MigrateAsync(config, new RecordingCommandRunner());

        var summary = await File.ReadAllTextAsync(Path.Combine(output, "src", "IRM.SPA", "Components", "Pages", "LegacyMigrationSummary.razor"));
        Assert.Contains("@@Id", summary);
        Assert.Contains("@@Name", summary);
        Assert.Contains("&lt;authentication mode=&quot;None&quot;/&gt;", summary);
    }

    [Fact]
    public async Task Adapter_Uses_Ai_When_Configured_And_Does_Not_Run_Deterministic_Generator()
    {
        var root = TestWorkspace.Create();
        var source = CreateLegacyWebFormsApp(Path.Combine(root, "legacy"));
        var template = CreateBlazorTemplate(Path.Combine(root, "template"));
        var output = Path.Combine(root, "output");
        var runner = new RecordingCommandRunner();
        var config = new LegacyMigrationConfig
        {
            ProjectPath = source,
            From = new RuntimeSpec("legacy-webforms", "4.8"),
            To = new RuntimeSpec("blazor-ssr", "8"),
            TargetArchitecturePath = template,
            OutputPath = output,
            UseAi = true,
            AiCli = "codex",
            AiTimeoutSeconds = 123
        };

        var result = await new LegacyWebFormsToBlazorAdapter().MigrateAsync(config, runner);

        Assert.True(result.Success);
        Assert.Equal("codex exec --skip-git-repo-check", string.Join(" ", runner.Commands[0]));
        Assert.Contains("Preserve the source application's user-visible UI", runner.Inputs[0]);
        Assert.Contains(source, runner.Inputs[0]);
        Assert.Contains(output, runner.Inputs[0]);
        Assert.False(File.Exists(Path.Combine(output, "src", "IRM.SPA", "Components", "Pages", "Clients", "ClientsList.razor")));
        Assert.Equal(["codex migration", "dotnet restore", "dotnet build"], result.ValidationCommands);
    }

    [Fact]
    public async Task Adapter_Falls_Back_To_Deterministic_Generator_When_Ai_Cli_Is_Missing()
    {
        var root = TestWorkspace.Create();
        var source = CreateLegacyWebFormsApp(Path.Combine(root, "legacy"));
        var template = CreateBlazorTemplate(Path.Combine(root, "template"));
        var output = Path.Combine(root, "output");
        var runner = new RecordingCommandRunner();
        runner.Results.Enqueue(new CommandResult(127, "Command not found: codex"));
        var config = new LegacyMigrationConfig
        {
            ProjectPath = source,
            From = new RuntimeSpec("legacy-webforms", "4.8"),
            To = new RuntimeSpec("blazor-ssr", "8"),
            TargetArchitecturePath = template,
            OutputPath = output,
            UseAi = true,
            AiCli = "codex"
        };

        var result = await new LegacyWebFormsToBlazorAdapter().MigrateAsync(config, runner);

        Assert.True(result.Success);
        Assert.True(File.Exists(Path.Combine(output, "src", "IRM.SPA", "Components", "Pages", "Clients", "ClientsList.razor")));
        Assert.Equal(["codex exec", "dotnet restore", "dotnet build"], runner.Commands.Select(c => string.Join(" ", c.Take(2))).ToArray());
        Assert.Contains("AI migration exit=127", result.ValidationOutput);
        Assert.Contains("Command not found: codex", await File.ReadAllTextAsync(result.ReportPath));
    }

    private static string CreateLegacyWebFormsApp(string? root = null)
    {
        root ??= TestWorkspace.Create();
        Directory.CreateDirectory(root);
        File.WriteAllText(Path.Combine(root, "HiringTrackingSite.csproj"), "<Project><Reference Include=\"System.Web\" /></Project>");
        File.WriteAllText(Path.Combine(root, "Site.Master"), "<%@ Master Language=\"C#\" %><nav>Clients Positions</nav>");
        File.WriteAllText(Path.Combine(root, "ClientsList.aspx"), "<asp:SqlDataSource ID=\"ClientsDataSource\" runat=\"server\" SelectCommand=\"SELECT * FROM Clients\" />");
        File.WriteAllText(Path.Combine(root, "ClientsList.aspx.cs"), "Session[\"ClientId\"] = id; using var c = new SqlConnection();");
        File.WriteAllText(Path.Combine(root, "PositionsList.aspx"), "Positions Clients");
        File.WriteAllText(Path.Combine(root, "ClientDetails.aspx.designer.cs"), "partial class ClientDetails {}");
        File.WriteAllText(Path.Combine(root, "Web.config"), """
<configuration>
  <connectionStrings>
    <add name="HiringConnectionString" connectionString="Data Source=(LocalDB)\MSSQLLocalDB;AttachDbFilename=|DataDirectory|\HiringDb.mdf;Integrated Security=True" />
  </connectionStrings>
</configuration>
""");
        File.WriteAllText(Path.Combine(root, "packages.config"), "<packages />");
        return root;
    }

    private static string CreateBlazorTemplate(string root)
    {
        var app = Path.Combine(root, "src", "IRM.SPA");
        Directory.CreateDirectory(Path.Combine(app, "DI"));
        Directory.CreateDirectory(Path.Combine(app, "Components", "Layout"));
        Directory.CreateDirectory(Path.Combine(app, "Components", "Pages"));
        File.WriteAllText(Path.Combine(app, "IRM.SPA.csproj"), """
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>
</Project>
""");
        File.WriteAllText(Path.Combine(app, "DI", "DependancyInjector.cs"), """
using IRM.SPA.Config;
using IRM.SPA.Services;

namespace IRM.SPA.DI;

public static class DependancyInjector
{
    public static void RegisterServices(IServiceCollection services, ConfigurationOptions config)
    {
        RegisterModelValidators(services);
    }

    private static void RegisterModelValidators(IServiceCollection services)
    {
    }
}
""");
        File.WriteAllText(Path.Combine(app, "Components", "Layout", "NavMenu.razor"), """
<nav class="flex-column">
    <div class="nav-item px-3">
        <NavLink class="nav-link" href="">Home</NavLink>
    </div>
    </nav>
""");
        File.WriteAllText(Path.Combine(app, "Components", "Pages", "Home.razor"), "@page \"/\"\n<h1>Hello</h1>");
        File.WriteAllText(Path.Combine(app, "appsettings.json"), "{\"AllowedHosts\":\"*\"}");
        return root;
    }
}
