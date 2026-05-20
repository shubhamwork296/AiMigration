using Q3.MigrationAgent.AI.Abstractions;
using Q3.MigrationAgent.AI.Providers;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Shared.Config;
using Q3.MigrationAgent.Shared.DTO;

namespace Q3.MigrationAgent.Tests;

public sealed class AiProviderResolverTests
{
    [Fact]
    public async Task Codex_Mode_Does_Not_Check_Claude()
    {
        var runner = new FakeCommandRunner(command =>
            IsLocate(command, "codex") ? Success(CodexLocationOutput()) :
            IsVersion(command, "codex") ? Success("codex 1.2.3") :
            IsNpmView(command) ? Success("\"1.2.3\"") :
            Failure());
        var resolver = Resolver(runner);

        var resolved = await resolver.ResolveAsync(new AiConfig { UseAi = true, AiCli = "codex" }, cwd: null, progress: null, logPath: null);

        Assert.True(resolved.UseAi);
        Assert.Equal("codex", resolved.Provider);
        Assert.DoesNotContain(runner.Calls, command => IsLocate(command, "claude"));
        Assert.DoesNotContain(runner.Calls, command => IsVersion(command, "claude"));
    }

    [Fact]
    public async Task Claude_Mode_Does_Not_Check_Codex()
    {
        var runner = new FakeCommandRunner(command =>
            IsLocate(command, "claude") ? Success(ClaudeLocationOutput()) :
            IsVersion(command, "claude") ? Success("claude 1.2.3") :
            IsNpmView(command) ? Success("\"1.2.3\"") :
            Failure());
        var resolver = Resolver(runner);

        var resolved = await resolver.ResolveAsync(new AiConfig { UseAi = true, AiCli = "claude" }, cwd: null, progress: null, logPath: null);

        Assert.True(resolved.UseAi);
        Assert.Equal("claude", resolved.Provider);
        Assert.DoesNotContain(runner.Calls, command => IsLocate(command, "codex"));
        Assert.DoesNotContain(runner.Calls, command => IsVersion(command, "codex"));
    }

    [Fact]
    public async Task Codex_Mode_Selects_Codex_When_Codex_Exists()
    {
        var runner = new FakeCommandRunner(command =>
            IsLocate(command, "codex") ? Success(CodexLocationOutput()) :
            IsVersion(command, "codex") ? Success("codex 1.2.3") :
            IsNpmView(command) ? Success("\"1.2.3\"") :
            Failure());
        var resolver = Resolver(runner);

        var resolved = await resolver.ResolveAsync(new AiConfig { UseAi = true, AiCli = "codex" }, cwd: null, progress: null, logPath: null);

        Assert.Equal("codex", resolved.Provider);
        Assert.Equal("1.2.3", resolved.CliVersion);
    }

    [Fact]
    public async Task Codex_Remains_Available_When_Latest_Version_Check_Times_Out()
    {
        var runner = new FakeCommandRunner(command =>
            IsLocate(command, "codex") ? Success(CodexLocationOutput()) :
            IsVersion(command, "codex") ? Success("codex 1.2.3") :
            IsNpmView(command) ? new CommandResult { ReturnCode = 124, Stderr = "Command timed out.", TimeoutKind = "total-timeout" } :
            Failure());
        var resolver = Resolver(runner);

        var resolved = await resolver.ResolveAsync(new AiConfig { UseAi = true, AiCli = "codex" }, cwd: null, progress: null, logPath: null);

        Assert.True(resolved.UseAi);
        Assert.Equal("codex", resolved.Provider);
        Assert.Contains(resolved.CliWarnings, warning => warning.Contains("lookup failed"));
    }

    [Fact]
    public async Task Auto_Mode_Selects_Codex_And_Does_Not_Check_Claude_When_Codex_Exists()
    {
        var runner = new FakeCommandRunner(command =>
            IsLocate(command, "codex") ? Success(CodexLocationOutput()) :
            IsVersion(command, "codex") ? Success("codex 1.2.3") :
            IsNpmView(command) ? Success("\"1.2.3\"") :
            Failure());
        var resolver = Resolver(runner);

        var resolved = await resolver.ResolveAsync(new AiConfig { UseAi = true, AiCli = "auto" }, cwd: null, progress: null, logPath: null);

        Assert.True(resolved.UseAi);
        Assert.Equal("codex", resolved.Provider);
        Assert.DoesNotContain(runner.Calls, command => IsLocate(command, "claude"));
        Assert.DoesNotContain(runner.Calls, command => IsVersion(command, "claude"));
    }

    [Fact]
    public async Task Auto_Mode_Does_Not_Check_Claude_Version_When_Claude_Locate_Fails()
    {
        var runner = new FakeCommandRunner(command =>
            IsLocate(command, "codex") ? Failure() :
            IsLocate(command, "claude") ? Failure() :
            Failure());
        var resolver = Resolver(runner);

        var resolved = await resolver.ResolveAsync(new AiConfig { UseAi = true, AiCli = "auto" }, cwd: null, progress: null, logPath: null);

        Assert.False(resolved.UseAi);
        Assert.Null(resolved.Provider);
        Assert.Contains(runner.Calls, command => IsLocate(command, "claude"));
        Assert.DoesNotContain(runner.Calls, command => IsVersion(command, "claude"));
    }

    [Fact]
    public async Task None_Mode_Does_Not_Run_Cli_Detection()
    {
        var runner = new FakeCommandRunner(_ => Failure());
        var resolver = Resolver(runner);

        var resolved = await resolver.ResolveAsync(new AiConfig { UseAi = true, AiCli = "none" }, cwd: null, progress: null, logPath: null);

        Assert.False(resolved.UseAi);
        Assert.Null(resolved.Provider);
        Assert.Empty(runner.Calls);
    }

    [Fact]
    public async Task Windows_Codex_Detection_Prefers_Cmd_Shim()
    {
        if (!OperatingSystem.IsWindows()) return;

        var runner = new FakeCommandRunner(command =>
            IsLocate(command, "codex") ? Success("C:\\Users\\test\\AppData\\Roaming\\npm\\codex\r\nC:\\Users\\test\\AppData\\Roaming\\npm\\codex.cmd\r\n") :
            IsVersion(command, "codex") ? Success("codex 1.2.3") :
            IsNpmView(command) ? Success("\"1.2.3\"") :
            Failure());
        var resolver = Resolver(runner);

        var resolved = await resolver.ResolveAsync(new AiConfig { UseAi = true, AiCli = "codex" }, cwd: null, progress: null, logPath: null);

        Assert.NotNull(resolved.CliCommand);
        Assert.Equal("C:\\Users\\test\\AppData\\Roaming\\npm\\codex.cmd", resolved.CliCommand![0]);
    }

    private static AiProviderResolver Resolver(ICommandRunner runner) => new(runner, Array.Empty<IAiProvider>());

    private static bool IsLocate(IReadOnlyList<string> command, string name) =>
        command.Count >= 2 && command[1].Equals(name, StringComparison.OrdinalIgnoreCase) && (command[0] == "where" || command[0] == "which");

    private static bool IsVersion(IReadOnlyList<string> command, string name) =>
        command.Count >= 2 && command[1] == "--version" && command[0].Contains(name, StringComparison.OrdinalIgnoreCase);

    private static bool IsNpmView(IReadOnlyList<string> command) =>
        command.Count >= 4 && command[0] == "npm" && command[1] == "view";

    private static string CodexLocationOutput() => OperatingSystem.IsWindows()
        ? "C:\\Users\\test\\AppData\\Roaming\\npm\\codex\r\nC:\\Users\\test\\AppData\\Roaming\\npm\\codex.cmd\r\n"
        : "/usr/local/bin/codex\n";

    private static string ClaudeLocationOutput() => OperatingSystem.IsWindows()
        ? "C:\\Users\\test\\AppData\\Roaming\\npm\\claude.cmd\r\n"
        : "/usr/local/bin/claude\n";

    private static CommandResult Success(string stdout) => new() { ReturnCode = 0, Stdout = stdout };

    private static CommandResult Failure() => new() { ReturnCode = 1, Stderr = "not found" };

    private sealed class FakeCommandRunner(Func<IReadOnlyList<string>, CommandResult> handler) : ICommandRunner
    {
        public List<IReadOnlyList<string>> Calls { get; } = [];

        public Task<CommandResult> RunAsync(
            IReadOnlyList<string> command,
            string? workingDirectory = null,
            string? input = null,
            int? timeoutSeconds = null,
            IProgressReporter? progress = null,
            string? stage = null,
            string? description = null,
            string? logPath = null,
            double heartbeatIntervalSeconds = 120,
            int? idleTimeoutSeconds = null,
            CancellationToken cancellationToken = default)
        {
            Calls.Add(command.ToArray());
            return Task.FromResult(handler(command));
        }
    }
}
