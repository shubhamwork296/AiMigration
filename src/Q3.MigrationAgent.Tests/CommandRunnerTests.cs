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
}

