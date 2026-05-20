using System.Text.Json.Nodes;
using Q3.MigrationAgent.Adapters.Angular;
using Q3.MigrationAgent.Adapters.DotNet;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Core.Commands;
using Q3.MigrationAgent.Core.Remediation;
using Q3.MigrationAgent.Shared.Common;
using Q3.MigrationAgent.Shared.Config;
using Q3.MigrationAgent.Shared.DTO;

namespace Q3.MigrationAgent.Tests;

public sealed class MigrationSafetyTests
{
    [Fact]
    public async Task DotNet_Build_Receives_Configured_Timeout()
    {
        var root = TestWorkspace.Create();
        var runner = new RecordingRunner(_ => new CommandResult { ReturnCode = 0 });
        var adapter = new DotNetAdapter(runner);

        await adapter.RunBuildAsync(root, timeoutSeconds: 123, idleTimeoutSeconds: 45);

        Assert.Contains(runner.Calls, c => c.Command.Take(2).SequenceEqual(["dotnet", "build"]) && c.TimeoutSeconds == 123 && c.IdleTimeoutSeconds == 45);
    }

    [Fact]
    public async Task Angular_Validation_Receives_Configured_Timeout()
    {
        var root = TestWorkspace.Create();
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """{"scripts":{"build":"ng build","test":"ng test"},"dependencies":{"@angular/core":"14.2.0"}}""");
        var runner = new RecordingRunner(_ => new CommandResult { ReturnCode = 0 });
        var adapter = new AngularAdapter(runner);

        await adapter.RunBuildAsync(root, timeoutSeconds: 222, idleTimeoutSeconds: 33);

        Assert.All(runner.Calls, c => Assert.Equal(222, c.TimeoutSeconds));
        Assert.All(runner.Calls, c => Assert.Equal(33, c.IdleTimeoutSeconds));
    }

    [Fact]
    public async Task CommandRunner_Idle_Timeout_Kills_Hanging_Command()
    {
        var runner = new CommandRunner();

        var result = await runner.RunAsync(["cmd", "/c", "ping -n 6 127.0.0.1 > NUL"], timeoutSeconds: 30, idleTimeoutSeconds: 1);

        Assert.Equal(124, result.ReturnCode);
        Assert.Equal("idle-timeout", result.TimeoutKind);
    }

    [Fact]
    public async Task Angular_Normal_Install_Success_Does_Not_Use_Legacy_Peer_Deps()
    {
        var root = await AngularWorkspace();
        var runner = AngularRunner(command => new CommandResult { ReturnCode = 0, Stdout = command[0] == "npm" && command[1] == "view" ? AngularVersions(command) : "" });
        var adapter = new AngularAdapter(runner);

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root), null, null);

        Assert.Equal("done", result["status"]!.ToString());
        Assert.DoesNotContain(runner.Calls, c => c.Command.Contains("--legacy-peer-deps"));
    }

    [Fact]
    public async Task Angular_Peer_Conflict_Retries_With_Legacy_Peer_Deps_And_Continues()
    {
        var root = await AngularWorkspace();
        var normalInstallFailed = false;
        var runner = AngularRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = AngularVersions(command) };
            if (command.Take(2).SequenceEqual(["npm", "install"]) && !command.Contains("--legacy-peer-deps") && !normalInstallFailed)
            {
                normalInstallFailed = true;
                return new CommandResult { ReturnCode = 1, Stderr = "ERESOLVE could not resolve dependency peer dependency" };
            }
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner);

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root), null, null);

        Assert.Equal("done", result["status"]!.ToString());
        Assert.Contains(runner.Calls, c => c.Command.Contains("--legacy-peer-deps"));
        Assert.Contains(result["commands"]!.AsArray().OfType<JsonObject>(), c => c["legacyPeerDepsFallbackUsed"]!.GetValue<bool>());
    }

    [Fact]
    public async Task Angular_Runtime_Package_Plan_Upgrades_Zone_For_Angular_16()
    {
        var root = await AngularWorkspace();
        var packageJson = Path.Combine(root, "package.json");
        var runner = AngularRunner(command => new CommandResult { ReturnCode = 0, Stdout = command[0] == "npm" && command[1] == "view" ? """["16.2.12"]""" : "" });
        var adapter = new AngularAdapter(runner);

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(15, 16, "Angular 15 to 16"), new JsonObject(), Config(root), null, null);

        Assert.Equal("done", result["status"]!.ToString());
        Assert.DoesNotContain(runner.Calls, c => c.Command.Contains("--legacy-peer-deps"));
        Assert.Contains("\"zone.js\": \"~0.13.0\"", await File.ReadAllTextAsync(packageJson));
    }

    [Fact]
    public async Task Angular_Runtime_Peer_Conflict_Revises_Package_Plan_Instead_Of_Legacy_Peer_Deps()
    {
        var root = await AngularWorkspace(extraDependency: ",\n    \"tslib\": \"1.14.1\"");
        var packageJson = Path.Combine(root, "package.json");
        var lockFile = Path.Combine(root, "package-lock.json");
        await File.WriteAllTextAsync(lockFile, "{}");
        var runner = AngularRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["16.2.12"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"]) && File.ReadAllText(packageJson).Contains("\"tslib\": \"1.14.1\""))
            {
                return new CommandResult
                {
                    ReturnCode = 1,
                    Stderr = """
Found: tslib@1.14.1
tslib@"1.14.1" from the root project

Could not resolve dependency:
peer tslib@"^2.3.0" from @angular/core@16.2.12
"""
                };
            }
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner);

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(15, 16, "Angular 15 to 16"), new JsonObject(), Config(root), null, null);

        Assert.Equal("done", result["status"]!.ToString());
        Assert.DoesNotContain(runner.Calls, c => c.Command.Contains("--legacy-peer-deps"));
        Assert.Contains("\"tslib\": \"^2.3.0\"", await File.ReadAllTextAsync(packageJson));
        Assert.False(File.Exists(lockFile));
        var conflict = Assert.Single(result["peerDependencyConflicts"]!.AsArray().OfType<JsonObject>());
        Assert.Equal("tslib", conflict["conflictingPackage"]!.ToString());
        Assert.Equal("^2.3.0", conflict["requiredPeerRange"]!.ToString());
        Assert.Equal("angularRuntimeMismatch", conflict["classification"]!.ToString());
        Assert.Equal("revisePackagePlan", conflict["decision"]!.ToString());
    }

    [Fact]
    public async Task Angular_Legacy_Peer_Deps_Fallback_Failure_Reports_Category()
    {
        var root = await AngularWorkspace();
        var runner = AngularRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = AngularVersions(command) };
            if (command.Take(2).SequenceEqual(["npm", "install"])) return new CommandResult { ReturnCode = 1, Stderr = "ERESOLVE peer dependency" };
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner);

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root), null, null);

        Assert.Equal("failed", result["status"]!.ToString());
        Assert.Equal("npm peer dependency conflict", result["failureCategory"]!.ToString());
    }

    [Fact]
    public async Task Angular_Preflight_Disabled_Records_Skipped()
    {
        var root = await AngularWorkspace();
        var runner = AngularRunner(command => new CommandResult { ReturnCode = 0, Stdout = command[0] == "npm" && command[1] == "view" ? AngularVersions(command) : "" });
        var adapter = new AngularAdapter(runner);
        var config = Config(root) with { SkipPreflightDependencyCompatibility = true };

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), config, null, null);

        Assert.Equal("skipped", result["preflightDependencyAnalysis"]!["status"]!.ToString());
    }

    [Fact]
    public async Task Angular_Third_Party_Ngx_Peer_Risk_Is_Advisory()
    {
        var root = await AngularWorkspace(extraDependency: ",\n    \"ngx-spinner-style\": \"1.0.0\"");
        var runner = AngularRunner(command => new CommandResult { ReturnCode = 0, Stdout = command[0] == "npm" && command[1] == "view" ? AngularVersions(command) : "" });
        var adapter = new AngularAdapter(runner);

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root), null, null);
        var warnings = result["preflightDependencyAnalysis"]!["warnings"]!.AsArray().Select(x => x!.ToString());

        Assert.Contains(warnings, w => w.Contains("ngx-spinner-style"));
        Assert.Empty(result["preflightDependencyAnalysis"]!["blockers"]!.AsArray());
    }

    [Fact]
    public async Task Angular_Default_Flow_Does_Not_Run_Migrate_Only()
    {
        var root = await AngularWorkspace();
        var runner = AngularRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = AngularVersions(command) };
            if (command.Contains("--migrate-only")) return new CommandResult { ReturnCode = 1, Stderr = "Package specifier has no effect when using migrate-only option" };
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner);

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root), null, null);

        Assert.Equal("done", result["status"]!.ToString());
        Assert.True(result.BoolValue("migrateOnlySkipped"));
    }

    [Fact]
    public async Task Unsafe_Remediation_Is_Rejected_With_Manual_Correction()
    {
        var ai = new StubAi(new JsonObject { ["canAutoFix"] = false, ["confidence"] = "low" });
        var planner = new AiRemediationPlanner(ai);

        var result = await planner.TryRemediateAsync(Config(TestWorkspace.Create()) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, TestWorkspace.Create(), new StubAdapter(), new ValidationResult { Passed = false, Errors = "build failed" }, 1);

        Assert.True(result.Attempted);
        Assert.NotNull(result.ManualCorrection);
    }

    private static async Task<string> AngularWorkspace(string extraDependency = "")
    {
        var root = TestWorkspace.Create();
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), $$"""
{
  "scripts": {"build":"ng build"},
  "dependencies": {
    "@angular/core": "14.2.0",
    "@angular/cli": "14.2.0",
    "rxjs": "7.5.0",
    "zone.js": "~0.11.4"{{extraDependency}}
  },
  "devDependencies": {"typescript": "~4.8.4"}
}
""");
        await File.WriteAllTextAsync(Path.Combine(root, "angular.json"), "{}");
        return root;
    }

    private static MigrationConfig Config(string root) => new()
    {
        ProjectPath = root,
        OutputPath = Path.Combine(root, "out"),
        From = new RuntimeSpec("angular", "14"),
        To = new RuntimeSpec("angular", "15"),
        AutoApprove = true,
        CommandTimeoutSeconds = 99,
        AllowLegacyPeerDepsFallback = true
    };

    private static RecordingRunner AngularRunner(Func<IReadOnlyList<string>, CommandResult> handler) => new(handler);

    private static string AngularVersions(IReadOnlyList<string> command) => command.Contains("@angular/cli") || command.Contains("@angular/core")
        ? """["15.0.0","15.2.10"]"""
        : "\"15.2.10\"";

    private sealed class RecordingRunner(Func<IReadOnlyList<string>, CommandResult> handler) : ICommandRunner
    {
        public List<Call> Calls { get; } = [];

        public Task<CommandResult> RunAsync(IReadOnlyList<string> command, string? workingDirectory = null, string? input = null, int? timeoutSeconds = null, IProgressReporter? progress = null, string? stage = null, string? description = null, string? logPath = null, double heartbeatIntervalSeconds = 120, int? idleTimeoutSeconds = null, CancellationToken cancellationToken = default)
        {
            Calls.Add(new Call(command.ToArray(), timeoutSeconds, idleTimeoutSeconds));
            return Task.FromResult(handler(command));
        }
    }

    private sealed record Call(IReadOnlyList<string> Command, int? TimeoutSeconds, int? IdleTimeoutSeconds);

    private sealed class StubAi(JsonObject response) : IAiService
    {
        public Task<JsonObject?> AskAsync(AiConfig config, string system, string user, CancellationToken cancellationToken = default) => Task.FromResult<JsonObject?>(response);
    }

    private sealed class StubAdapter : IMigrationAdapter
    {
        public string RuntimeName => "stub";
        public Task<bool> DetectAsync(string projectPath, CancellationToken cancellationToken = default) => Task.FromResult(true);
        public Task<JsonObject> ParseManifestAsync(string projectPath, CancellationToken cancellationToken = default) => Task.FromResult(new JsonObject());
        public Task<IReadOnlyList<string>> UpgradePackageAsync(string projectPath, JsonObject change, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<string>>([]);
        public Task<BuildResult> RunBuildAsync(string projectPath, int? timeoutSeconds = null, int? idleTimeoutSeconds = null, CancellationToken cancellationToken = default) => Task.FromResult(new BuildResult(false, "failed"));
        public Task<IReadOnlyDictionary<string, string>> CollectProjectFilesAsync(string projectPath, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyDictionary<string, string>>(new Dictionary<string, string>());
        public IReadOnlyList<MigrationHop> ExpandMigrationHops(string fromVersion, string toVersion) => [];
        public Task<JsonObject> ExecuteMigrationHopAsync(string projectPath, MigrationHop hop, JsonObject rules, MigrationConfig config, IProgressReporter? progress, string? logPath, CancellationToken cancellationToken = default) => Task.FromResult(new JsonObject());
    }
}
