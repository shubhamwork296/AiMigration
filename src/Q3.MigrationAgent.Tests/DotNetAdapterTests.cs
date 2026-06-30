using Q3.MigrationAgent.Adapters.DotNet;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Core.Commands;
using Q3.MigrationAgent.Core.Planning;
using Q3.MigrationAgent.Shared.Common;
using Q3.MigrationAgent.Shared.Config;
using Q3.MigrationAgent.Shared.DTO;
using System.Text.Json.Nodes;

namespace Q3.MigrationAgent.Tests;

public sealed class DotNetAdapterTests
{
    [Fact]
    public async Task Parses_TargetFramework_And_PackageReferences()
    {
        var root = TestWorkspace.Create();
        await File.WriteAllTextAsync(Path.Combine(root, "Sample.csproj"), """
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup><TargetFramework>net6.0</TargetFramework></PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="6.0.0" />
    <PackageReference Include="Nested"><Version>1.2.3</Version></PackageReference>
  </ItemGroup>
</Project>
""");
        var adapter = new DotNetAdapter(new CommandRunner());

        var manifest = await adapter.ParseManifestAsync(root);

        Assert.Equal("dotnet", manifest["runtime"]!.ToString());
        Assert.Contains("net6.0", manifest["projects"]![0]!["targetFrameworks"]!.AsArray().Select(x => x!.ToString()));
    }

    [Fact]
    public void Replaces_Attribute_And_Nested_Package_Versions()
    {
        var content = """
<Project>
  <PackageReference Include="A" Version="1.0.0" />
  <PackageReference Include="A"><Version>1.0.0</Version></PackageReference>
  <PackageVersion Include="A" Version="1.0.0" />
</Project>
""";
        var updated = DotNetAdapter.ReplacePackageVersion(content, "A", "2.0.0");

        Assert.Contains("Version=\"2.0.0\"", updated);
        Assert.Contains("<Version>2.0.0</Version>", updated);
        Assert.Contains("<PackageVersion Include=\"A\" Version=\"2.0.0\"", updated);
    }

    [Fact]
    public void Expands_DotNet_6_To_8_Into_Major_Hops()
    {
        var adapter = new DotNetAdapter(new CommandRunner());

        var hops = adapter.ExpandMigrationHops("6", "8");

        Assert.Equal(["6 -> 7", "7 -> 8"], hops.Select(h => $"{h.FromVersion} -> {h.ToVersion}"));
        Assert.All(hops, h => Assert.Equal("dotnet-hop", h.Type));
    }

    [Fact]
    public async Task Generated_DotNet_Rules_Are_Used_When_Exact_Hop_File_Is_Missing()
    {
        var loader = new JsonRuleLoader(Path.Combine(TestWorkspace.Create(), "rules"));

        var rules = await loader.LoadRulesAsync("dotnet", "6", "7");

        Assert.Equal("generated-dotnet-hop-policy", rules.StringValue("source"));
        Assert.Equal("net6.0", rules["targetFrameworkChange"]!["from"]!.ToString());
        Assert.Equal("net7.0", rules["targetFrameworkChange"]!["to"]!.ToString());
        Assert.NotEmpty(rules["packageFamilyPolicies"]!.AsArray());
    }

    [Fact]
    public async Task DotNet_Hop_Aligns_TargetFramework_And_Framework_Owned_Packages()
    {
        var root = TestWorkspace.Create();
        await File.WriteAllTextAsync(Path.Combine(root, "Sample.csproj"), """
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup><TargetFramework>net6.0</TargetFramework></PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="6.0.12" />
    <PackageReference Include="Microsoft.Extensions.Http"><Version>6.0.0</Version></PackageReference>
    <PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
  </ItemGroup>
</Project>
""");
        await File.WriteAllTextAsync(Path.Combine(root, "Directory.Packages.props"), """
<Project>
  <ItemGroup>
    <PackageVersion Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="6.0.12" />
  </ItemGroup>
</Project>
""");
        var adapter = new DotNetAdapter(new RecordingRunner());
        var rules = new JsonObject
        {
            ["targetFrameworkChange"] = new JsonObject { ["from"] = "net6.0", ["to"] = "net7.0" }
        };

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(6, 7, ".NET 6 to 7") { Type = "dotnet-hop" }, rules, Config(root), null, null);
        var updated = await File.ReadAllTextAsync(Path.Combine(root, "Sample.csproj"));

        Assert.Equal("done", result.StringValue("status"));
        Assert.Contains("<TargetFramework>net7.0</TargetFramework>", updated);
        Assert.Contains("Microsoft.EntityFrameworkCore\" Version=\"7.0.0\"", updated);
        Assert.Contains("<Version>7.0.0</Version>", updated);
        Assert.Contains("Newtonsoft.Json\" Version=\"13.0.3\"", updated);
        Assert.Contains("Microsoft.AspNetCore.Authentication.JwtBearer\" Version=\"7.0.0\"", await File.ReadAllTextAsync(Path.Combine(root, "Directory.Packages.props")));
    }

    private static MigrationConfig Config(string root) => new()
    {
        ProjectPath = root,
        OutputPath = Path.Combine(root, "out"),
        From = new RuntimeSpec("dotnet", "6"),
        To = new RuntimeSpec("dotnet", "7"),
        AutoApprove = true
    };

    private sealed class RecordingRunner : ICommandRunner
    {
        public Task<CommandResult> RunAsync(IReadOnlyList<string> command, string? workingDirectory = null, string? input = null, int? timeoutSeconds = null, IProgressReporter? progress = null, string? stage = null, string? description = null, string? logPath = null, double heartbeatIntervalSeconds = 120, int? idleTimeoutSeconds = null, CancellationToken cancellationToken = default) =>
            Task.FromResult(new CommandResult { ReturnCode = 0, Stdout = "build passed" });
    }
}
