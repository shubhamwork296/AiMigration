using Q3.MigrationAgent.Core.Commands;

namespace Q3.MigrationAgent.Tests;

public sealed class CommandRunnerTests
{
    [Fact]
    public void Windows_Resolver_Prefers_Cmd_Shims()
    {
        var resolved = CommandRunner.ResolveCommand(["npx"]);
        Assert.NotEmpty(resolved);
    }

    [Fact]
    public async Task Windows_Relative_Cmd_Is_Resolved_Absolute_And_Executed_Through_Cmd()
    {
        if (!OperatingSystem.IsWindows()) return;

        var root = Path.Combine(Path.GetTempPath(), "q3-command-runner-" + Guid.NewGuid().ToString("N"));
        var bin = Path.Combine(root, "node_modules", ".bin");
        Directory.CreateDirectory(bin);
        var shim = Path.Combine(bin, "ng.cmd");
        File.WriteAllText(shim, "@echo off\r\necho local-ng %1\r\n");

        try
        {
            var result = await new CommandRunner().RunAsync([Path.Combine("node_modules", ".bin", "ng.cmd"), "build"], workingDirectory: root);

            Assert.True(result.ReturnCode == 0, $"stdout: {result.Stdout}; stderr: {result.Stderr}; resolved: {string.Join(" ", result.ResolvedCommand)}");
            Assert.Contains("local-ng build", result.Stdout);
            Assert.Equal("cmd.exe", result.ResolvedCommand[0]);
            Assert.Equal("/d", result.ResolvedCommand[1]);
            Assert.Equal("/s", result.ResolvedCommand[2]);
            Assert.Equal("/c", result.ResolvedCommand[3]);
            Assert.Equal($@"""""{shim}"" build""", result.ResolvedCommand[4]);
        }
        finally
        {
            Directory.Delete(root, recursive: true);
        }
    }
}
