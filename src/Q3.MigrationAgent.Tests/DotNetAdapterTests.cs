using Q3.MigrationAgent.Adapters.DotNet;
using Q3.MigrationAgent.Core.Commands;

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
</Project>
""";
        var updated = DotNetAdapter.ReplacePackageVersion(content, "A", "2.0.0");

        Assert.Contains("Version=\"2.0.0\"", updated);
        Assert.Contains("<Version>2.0.0</Version>", updated);
    }
}

