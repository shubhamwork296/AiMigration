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
    public void ParseJsonObject_Pure_Json_Response_Parses()
    {
        var parsed = AiProviderResolver.ParseJsonObject(ValidRemediationJson(), "codex");

        Assert.Equal("replace deprecated flag", parsed["summary"]?.ToString());
    }

    [Fact]
    public void ParseJsonObject_Parses_Json_With_Trailing_Cli_Text()
    {
        var parsed = AiProviderResolver.ParseJsonObject($$"""
            {{ValidRemediationJson()}}

            OpenAI Codex v0.133.0
            --------
            workdir: D:\Projects\AI\AiMigration
            model: gpt-5-codex
            user
            Return strict JSON only.
            """, "codex");

        Assert.Equal("replace deprecated flag", parsed["summary"]?.ToString());
    }

    [Fact]
    public void ParseJsonObject_Parses_Json_With_Leading_Cli_Text()
    {
        var parsed = AiProviderResolver.ParseJsonObject($$"""
            OpenAI Codex v0.133.0
            --------
            workdir: D:\Projects\AI\AiMigration
            model: gpt-5-codex

            {{ValidRemediationJson()}}
            """, "codex");

        Assert.Equal("replace deprecated flag", parsed["summary"]?.ToString());
    }

    [Fact]
    public void ParseJsonObject_Parses_Json_With_Echoed_Prompt_Before_And_After()
    {
        var parsed = AiProviderResolver.ParseJsonObject("""
            user
            Return strict JSON only.
            {"requiredResponseShape":{"summary":"Short explanation","changes":[]}}

            """ + ValidRemediationJson() + """
            user
            Return strict JSON only.
            {"runtime":"angular","rules":["Return only JSON."]}
            """, "codex");

        Assert.Equal("replace deprecated flag", parsed["summary"]?.ToString());
    }

    [Fact]
    public void ParseJsonObject_Rejects_Fenced_Json_With_Trailing_Cli_Text()
    {
        var ex = Assert.Throws<InvalidOperationException>(() => AiProviderResolver.ParseJsonObject("""
            ```json
            [
              { "file": "package.json", "change": "script" }
            ]
            ```
            Done.
            """, "codex"));

        Assert.Contains("no-parseable-json-object", ex.Message);
    }

    [Fact]
    public void ParseJsonObject_Ignores_Braces_Inside_Json_Strings()
    {
        var parsed = AiProviderResolver.ParseJsonObject("""
            {
              "summary": "replace {placeholder} and escaped \"quote\"",
              "confidence": 0.91,
              "risk": "low",
              "requiresManualCorrection": false,
              "failureCategory": "script",
              "businessLogicChanged": false,
              "changes": [
                {
                  "file": "package.json",
                  "type": "script_update",
                  "reason": "replace {deprecated} flag",
                  "before": "ng build --prod",
                  "after": "ng build --configuration production"
                }
              ],
              "commandsToRunAfter": []
            }
            """, "codex");

        Assert.Equal("replace {placeholder} and escaped \"quote\"", parsed["summary"]?.ToString());
    }

    [Fact]
    public void ParseJsonObject_Rejects_Truncated_Json()
    {
        var ex = Assert.Throws<InvalidOperationException>(() => AiProviderResolver.ParseJsonObject("""
            {
              "summary": "replace deprecated flag",
              "confidence": 0.91,
              "risk": "low",
              "requiresManualCorrection": false,
              "failureCategory": "script",
              "changes": [
            """, "codex"));

        Assert.Contains("truncated-json", ex.Message);
    }

    [Fact]
    public void ParseJsonObject_Rejects_Wrong_Schema_Json()
    {
        var ex = Assert.Throws<InvalidOperationException>(() => AiProviderResolver.ParseJsonObject("""
            {"hello":"world"}
            """, "codex"));

        Assert.Contains("schema-validation-failed", ex.Message);
        Assert.Contains("Expected top-level fields", ex.Message);
        Assert.Contains("Actual top-level fields", ex.Message);
        Assert.Contains("Missing fields", ex.Message);
        Assert.Contains("Unexpected fields", ex.Message);
        Assert.Contains("Failed field path", ex.Message);
    }

    [Fact]
    public void ParseJsonObject_Accepts_ThirdParty_PackageUpdates_Schema()
    {
        var parsed = AiProviderResolver.ParseJsonObject("""
            {
              "packageUpdates": [
                {
                  "package": "ngx-spinner",
                  "currentVersion": "^11.0.2",
                  "version": "^16.0.2",
                  "reason": "Validation proved this package blocks the Angular hop.",
                  "errorCategory": "third_party_angular_library_incompatibility",
                  "expectedCodeImpact": "none"
                }
              ],
              "manualReview": []
            }
            """, "codex");

        Assert.Single(parsed["packageUpdates"]!.AsArray());
    }

    [Fact]
    public void ParseJsonObject_Rejects_ThirdParty_PackageUpdates_Missing_With_Clear_Message()
    {
        var ex = Assert.Throws<InvalidOperationException>(() => AiProviderResolver.ParseJsonObject("""
            {"manualReview":[]}
            """, "codex"));

        Assert.Contains("schema-validation-failed", ex.Message);
        Assert.Contains("packageUpdates", ex.Message);
        Assert.Contains("Failed field path: $.packageUpdates", ex.Message);
    }

    [Fact]
    public void ParseJsonObject_Accepts_Legacy_ThirdParty_Remediations_For_Defensive_Fallback()
    {
        var parsed = AiProviderResolver.ParseJsonObject("""
            {
              "remediations": [
                {
                  "packageName": "ngx-spinner",
                  "currentVersion": "^11.0.2",
                  "detectedErrorCategory": "third_party_angular_library_incompatibility",
                  "targetVersionRange": "^16.0.2"
                }
              ]
            }
            """, "codex");

        Assert.Single(parsed["remediations"]!.AsArray());
    }

    [Fact]
    public void ParseJsonObject_Chooses_First_Schema_Valid_Object()
    {
        var parsed = AiProviderResolver.ParseJsonObject($$"""
            {"hello":"world"}
            {{ValidRemediationJson()}}
            """, "codex");

        Assert.Equal("replace deprecated flag", parsed["summary"]?.ToString());
    }

    [Fact]
    public void ParseCodexResponse_Does_Not_Parse_Jsonl_Stream_As_Remediation_Schema()
    {
        var ex = Assert.Throws<InvalidOperationException>(() => AiProviderResolver.ParseJsonObject("""
            {"type":"turn.started"}
            {"type":"turn.completed","message":{"role":"assistant","content":"not json"}}
            """, "codex"));

        Assert.Contains("schema-validation-failed", ex.Message);
    }

    [Fact]
    public void ParseCodexResponse_Extracts_Agent_Message_Text_From_Jsonl()
    {
        var stdout = "{\"type\":\"thread.started\",\"thread_id\":\"thread_123\"}\n" +
                     "{\"type\":\"turn.started\"}\n" +
                     "{\"type\":\"item.completed\",\"item\":{\"type\":\"agent_message\",\"text\":" + JsonString(ValidMigrationAnalysisJson()) + "}}\n";

        var parsed = AiProviderResolver.ParseCodexResponse(stdout, "", ["codex", "exec", "--json"], "codex");

        Assert.Equal("ok", parsed["summary"]?.ToString());
        Assert.Equal(80, parsed["confidence"]?.GetValue<int>());
        Assert.Empty(parsed["packageUpdates"]!.AsArray());
    }

    [Fact]
    public void ParseCodexResponse_Extracts_Install_Strategy_From_Jsonl()
    {
        var stdout = "{\"type\":\"thread.started\",\"thread_id\":\"thread_123\"}\n" +
                     "{\"type\":\"turn.started\"}\n" +
                     "{\"type\":\"item.completed\",\"item\":{\"type\":\"agent_message\",\"text\":" + JsonString(ValidInstallStrategyJson()) + "}}\n" +
                     "{\"type\":\"turn.completed\",\"usage\":{\"input_tokens\":10,\"output_tokens\":3}}\n";

        var parsed = AiProviderResolver.ParseCodexResponse(stdout, "", ["codex", "exec", "--json"], "codex");

        Assert.Equal("manualReview", parsed["strategy"]?.ToString());
        Assert.Equal("packageVersionNotFound", parsed["failureClassification"]?.ToString());
    }

    [Fact]
    public void ParseJsonObject_Accepts_Structural_Config_Schema()
    {
        var parsed = AiProviderResolver.ParseJsonObject("""
            {
              "targetAngularHop": "14->15",
              "changes": [],
              "manualRecommendations": [],
              "safetyDecision": {
                "canApplyAutomatically": true,
                "requiresManualReview": false,
                "reason": "No safe structural Angular config changes required."
              }
            }
            """, "codex");

        Assert.Equal("14->15", parsed["targetAngularHop"]?.ToString());
    }

    [Fact]
    public void CodexUsageParser_Uses_Latest_Jsonl_Usage_Event()
    {
        var stdout = """
            {"type":"turn.started","model":"gpt-5-codex","usage":{"input_tokens":10,"cached_input_tokens":2,"output_tokens":3,"reasoning_tokens":1,"total_tokens":13}}
            {"type":"turn.completed","model":"gpt-5-codex","usage":{"input_tokens":40,"input_tokens_details":{"cached_tokens":8},"output_tokens":12,"output_tokens_details":{"reasoning_tokens":5},"total_tokens":52}}
            """;

        var usage = CodexUsageParser.Parse(stdout, "");

        Assert.NotNull(usage);
        Assert.True(usage!.Available);
        Assert.Equal("gpt-5-codex", usage.Model);
        Assert.Equal(40, usage.InputTokens);
        Assert.Equal(8, usage.CachedInputTokens);
        Assert.Equal(12, usage.OutputTokens);
        Assert.Equal(5, usage.ReasoningTokens);
        Assert.Equal(52, usage.TotalTokens);
    }

    [Fact]
    public async Task Codex_Provider_Parses_Stdout_Json_When_Stderr_Has_Cli_Diagnostics()
    {
        var runner = new FakeCommandRunner(command => new CommandResult
        {
            ReturnCode = 0,
            Stdout = ValidRemediationJson(),
            Stderr = "OpenAI Codex v0.133.0\r\nworkdir: D:\\Projects\\AI\\AiMigration\r\n"
        });
        var provider = new CodexCliProvider(runner, new PromptLoader());

        var parsed = await provider.AskAsync(new AiConfig { UseAi = true, CliCommand = ["codex", "exec"] }, "system", "user");

        Assert.Equal("replace deprecated flag", parsed?["summary"]?.ToString());
    }

    [Fact]
    public async Task Codex_Provider_Rejects_Nonzero_Cli_Output_With_Logs()
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

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            provider.AskAsync(new AiConfig { UseAi = true, CliCommand = ["codex", "exec"] }, "system", "user"));

        Assert.Contains("CLI failed", ex.Message);
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

    private static string ValidRemediationJson() => """
        {
          "summary": "replace deprecated flag",
          "confidence": 0.91,
          "risk": "low",
          "requiresManualCorrection": false,
          "failureCategory": "script",
          "businessLogicChanged": false,
          "changes": [
            {
              "file": "package.json",
              "type": "script_update",
              "reason": "Angular CLI no longer supports --prod",
              "before": "ng build --prod",
              "after": "ng build --configuration production"
            }
          ],
          "commandsToRunAfter": [],
          "reportNotes": []
        }
        """;

    private static string ValidMigrationAnalysisJson() => """
        {
          "summary": "ok",
          "confidence": 80,
          "risk": "low",
          "packageUpdates": [],
          "manualReview": [],
          "changes": [],
          "recommendations": []
        }
        """;

    private static string ValidInstallStrategyJson() => """
        {
          "strategy": "manualReview",
          "command": "",
          "reason": "The previous install failed with ETARGET/no matching version found.",
          "confidence": 0.98,
          "risk": "high",
          "isRetry": false,
          "isFallback": false,
          "maxRetries": 0,
          "failureClassification": "packageVersionNotFound"
        }
        """;

    private static string JsonString(string value) => JsonValue.Create(value)!.ToJsonString();

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
