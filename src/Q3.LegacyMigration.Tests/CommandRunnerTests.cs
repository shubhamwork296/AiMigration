using Q3.LegacyMigration.Commands;

namespace Q3.LegacyMigration.Tests;

public sealed class CommandRunnerTests
{
    [Fact]
    public async Task Windows_Path_Ps1_Shims_Are_Resolved_And_Executed()
    {
        if (!OperatingSystem.IsWindows()) return;

        var root = TestWorkspace.Create();
        var bin = Path.Combine(root, "bin");
        Directory.CreateDirectory(bin);
        var shim = Path.Combine(bin, "codex.ps1");
        await File.WriteAllTextAsync(shim, "Write-Output \"legacy-codex $($args -join ' ')\"");
        var originalPath = Environment.GetEnvironmentVariable("PATH");
        Environment.SetEnvironmentVariable("PATH", bin + Path.PathSeparator + originalPath);

        try
        {
            var resolved = CommandRunner.ResolveCommand(["codex", "exec"], root);
            var result = await new CommandRunner().RunAsync(["codex", "exec"], root, 30);

            Assert.Equal("powershell.exe", resolved[0]);
            Assert.Contains(shim, resolved);
            Assert.Equal(0, result.ExitCode);
            Assert.Contains("legacy-codex exec", result.Output);
        }
        finally
        {
            Environment.SetEnvironmentVariable("PATH", originalPath);
        }
    }
}
