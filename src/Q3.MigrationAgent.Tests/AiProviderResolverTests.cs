using Q3.MigrationAgent.AI.Abstractions;
using Q3.MigrationAgent.AI.Codex;
using Q3.MigrationAgent.AI.Prompts;
using Q3.MigrationAgent.AI.Providers;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Shared.Config;
using Q3.MigrationAgent.Shared.DTO;
using System.Text.Json.Nodes;

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

    [Fact]
    public void ParseJsonObject_Accepts_Json_With_Trailing_Cli_Text()
    {
        var parsed = AiProviderResolver.ParseJsonObject("""
            I can fix this.
            {
              "summary": "replace deprecated flag",
              "changes": [
                {
                  "file": "package.json",
                  "before": "ng build --prod",
                  "after": "ng build --configuration production"
                }
              ]
            }

            Verified locally.
            """, "codex");

        Assert.Equal("replace deprecated flag", parsed["summary"]?.ToString());
        Assert.Equal("package.json", parsed["changes"]?.AsArray()[0]?["file"]?.ToString());
    }

    [Fact]
    public void ParseJsonObject_Accepts_Fenced_Json_With_Trailing_Cli_Text()
    {
        var parsed = AiProviderResolver.ParseJsonObject("""
            ```json
            [
              { "file": "package.json", "change": "script" }
            ]
            ```
            Done.
            """, "codex");

        Assert.Equal("package.json", parsed["items"]?.AsArray()[0]?["file"]?.ToString());
    }

    [Fact]
    public void ParseJsonObject_Ignores_Braces_Inside_Json_Strings()
    {
        var parsed = AiProviderResolver.ParseJsonObject("""
            {"summary":"replace {placeholder} and escaped \"quote\"","changes":[]}
            extra
            """, "codex");

        Assert.Equal("replace {placeholder} and escaped \"quote\"", parsed["summary"]?.ToString());
    }

    [Fact]
    public void ParseJsonObject_Extracts_First_Valid_Json_Object_And_Ignores_Command_Logs()
    {
        var parsed = AiProviderResolver.ParseJsonObject("""
            OpenAI Codex v0.125.0
            $ npm run build
            An unhandled exception occurred: spawn EPERM
            ```diff
            +not json
            ```
            {
              "summary": "add third-party type shim",
              "confidence": 0.91,
              "risk": "low",
              "requiresManualCorrection": false,
              "failureCategory": "type_declaration",
              "businessLogicChanged": false,
              "changes": [
                {
                  "file": "src/ngx-pinch-zoom-compat.d.ts",
                  "type": "type_shim",
                  "reason": "VisibilityState is missing",
                  "before": null,
                  "after": "declare type VisibilityState = 'hidden' | 'visible';\n"
                }
              ],
              "commandsToRunAfter": []
            }
            tokens used: 999
            """, "codex");

        Assert.Equal("add third-party type shim", parsed["summary"]?.ToString());
        Assert.Equal("src/ngx-pinch-zoom-compat.d.ts", parsed["changes"]?.AsArray()[0]?["file"]?.ToString());
    }

    [Fact]
    public async Task Codex_Provider_Parses_Json_Even_When_Cli_Returns_Nonzero_With_Logs()
    {
        var runner = new FakeCommandRunner(command => new CommandResult
        {
            ReturnCode = 1,
            Stdout = """
                $ npm run build
                spawn EPERM
                {"summary":"plan only","confidence":0.9,"risk":"low","requiresManualCorrection":false,"changes":[]}
                """
        });
        var provider = new CodexCliProvider(runner, new PromptLoader());

        var parsed = await provider.AskAsync(new AiConfig { UseAi = true, CliCommand = ["codex", "exec"] }, "system", "user");

        Assert.Equal("plan only", parsed?["summary"]?.ToString());
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
