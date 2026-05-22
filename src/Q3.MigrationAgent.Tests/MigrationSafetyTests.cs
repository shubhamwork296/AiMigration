using System.Text.Json.Nodes;
using Q3.MigrationAgent.AI.Prompts;
using Q3.MigrationAgent.Adapters.Angular;
using Q3.MigrationAgent.Adapters.DotNet;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Core.Commands;
using Q3.MigrationAgent.Core.Reporting;
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
        var ai = new StubAi(new JsonObject { ["summary"] = "unsafe", ["confidence"] = 0.4, ["risk"] = "medium", ["requiresManualCorrection"] = false, ["changes"] = new JsonArray(new JsonObject { ["file"] = "package.json", ["type"] = "script_update", ["reason"] = "build failed", ["before"] = "x", ["after"] = "y" }) });
        var planner = new AiRemediationPlanner(ai, new PromptLoader());

        var result = await planner.TryRemediateAsync(Config(TestWorkspace.Create()) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, TestWorkspace.Create(), new StubAdapter(), new ValidationResult { Passed = false, Errors = "build failed" }, 1);

        Assert.True(result.Attempted);
        Assert.NotNull(result.ManualCorrection);
    }

    [Fact]
    public async Task Angular_Unknown_Prod_Argument_Updates_Build_Script_And_Reruns_Validation()
    {
        var root = await AngularWorkspace();
        var packageJson = Path.Combine(root, "package.json");
        var buildAttempts = 0;
        var runner = AngularRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = AngularVersions(command) };
            if (command.SequenceEqual(["npm", "run", "build"]) && buildAttempts++ == 0) return new CommandResult { ReturnCode = 1, Stderr = "Error: Unknown argument: prod" };
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner);
        var config = Config(root);

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), config, null, null);
        var report = new MarkdownReportWriter().GenerateAdapterHopReport(new JsonObject { ["manifest"] = new JsonObject(), ["to"] = "angular15" }, [new MigrationHop(14, 15, "Angular 14 to 15")], [result], new ValidationResult { Passed = true });

        Assert.Equal("done", result.StringValue("status"));
        Assert.Contains("ng build --configuration production", await File.ReadAllTextAsync(packageJson));
        Assert.Equal(2, runner.Calls.Count(c => c.Command.SequenceEqual(["npm", "run", "build"])));
        Assert.Contains("## AI Remediation Changes", report);
        Assert.Contains("Angular CLI rejected deprecated --prod flag", report);
        Assert.Contains("validation rerun passed", report);
    }

    [Fact]
    public async Task Max_Ai_Remediation_Retries_Zero_Disables_Validation_Remediation()
    {
        var root = await AngularWorkspace();
        var packageJson = Path.Combine(root, "package.json");
        var runner = AngularRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = AngularVersions(command) };
            if (command.SequenceEqual(["npm", "run", "build"])) return new CommandResult { ReturnCode = 1, Stderr = "Error: Unknown argument: prod" };
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner);

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { MaxAiRemediationRetries = 0 }, null, null);

        Assert.Equal("failed", result.StringValue("status"));
        Assert.Contains("ng build --prod", await File.ReadAllTextAsync(packageJson));
        Assert.Empty(result["aiRemediationChanges"]!.AsArray());
    }

    [Fact]
    public async Task Unsafe_Source_Code_Remediation_Is_Rejected_When_File_Is_Not_In_Error()
    {
        var root = TestWorkspace.Create();
        Directory.CreateDirectory(Path.Combine(root, "src", "app"));
        await File.WriteAllTextAsync(Path.Combine(root, "src", "app", "component.ts"), "const value = oldValue;\n");
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """{"scripts":{"build":"ng build"}}""");
        var ai = new StubAi(new JsonObject
        {
            ["summary"] = "source edit",
            ["confidence"] = 0.95,
            ["risk"] = "low",
            ["requiresManualCorrection"] = false,
            ["changes"] = new JsonArray(new JsonObject { ["file"] = "src/app/component.ts", ["type"] = "source_update", ["reason"] = "build failed", ["before"] = "oldValue", ["after"] = "newValue" })
        });
        var planner = new AiRemediationPlanner(ai, new PromptLoader());

        var result = await planner.TryRemediateAsync(Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, root, new StubAdapter(), new ValidationResult { Passed = false, Output = "Error: build failed in another file" }, 1);

        Assert.NotNull(result.ManualCorrection);
        Assert.Contains("oldValue", await File.ReadAllTextAsync(Path.Combine(root, "src", "app", "component.ts")));
    }

    [Fact]
    public async Task Source_Code_Remediation_Is_Allowed_When_Compiler_Error_Points_To_File()
    {
        var root = TestWorkspace.Create();
        Directory.CreateDirectory(Path.Combine(root, "src", "app"));
        var source = Path.Combine(root, "src", "app", "component.ts");
        await File.WriteAllTextAsync(source, "const value = oldValue;\n");
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """{"scripts":{"build":"ng build"}}""");
        var ai = new StubAi(new JsonObject
        {
            ["summary"] = "compiler error",
            ["confidence"] = 0.95,
            ["risk"] = "low",
            ["requiresManualCorrection"] = false,
            ["changes"] = new JsonArray(new JsonObject { ["file"] = "src/app/component.ts", ["type"] = "source_update", ["reason"] = "TS2304 oldValue", ["before"] = "oldValue", ["after"] = "newValue" })
        });
        var planner = new AiRemediationPlanner(ai, new PromptLoader());

        var result = await planner.TryRemediateAsync(Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, root, new StubAdapter(), new ValidationResult { Passed = false, Output = "src/app/component.ts:1:15 - error TS2304: Cannot find name 'oldValue'." }, 1);

        Assert.True(result.Applied, result.ManualCorrection?.ToJsonString());
        Assert.Contains("newValue", await File.ReadAllTextAsync(source));
        Assert.True(result.Changes.Single().BoolValue("businessFile"));
    }

    [Fact]
    public async Task High_Risk_Ai_Remediation_Is_Rejected()
    {
        var root = TestWorkspace.Create();
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """{"scripts":{"build":"ng build"}}""");
        var ai = new StubAi(new JsonObject
        {
            ["summary"] = "risky",
            ["confidence"] = 0.95,
            ["risk"] = "high",
            ["requiresManualCorrection"] = false,
            ["changes"] = new JsonArray(new JsonObject { ["file"] = "package.json", ["type"] = "script_update", ["reason"] = "build failed", ["before"] = "ng build", ["after"] = "ng build --configuration production" })
        });

        var result = await new AiRemediationPlanner(ai, new PromptLoader()).TryRemediateAsync(Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, root, new StubAdapter(), new ValidationResult { Passed = false, Output = "$ npm run build\nexit code: 1\nbuild failed" }, 1);

        Assert.NotNull(result.ManualCorrection);
        Assert.Contains("risk is high", result.ManualCorrection!.StringValue("reason"));
    }

    [Fact]
    public async Task Invalid_Json_Shape_Ai_Remediation_Is_Rejected()
    {
        var root = TestWorkspace.Create();
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """{"scripts":{"build":"ng build"}}""");
        var ai = new StubAi(new JsonObject { ["summary"] = "missing safety fields" });

        var result = await new AiRemediationPlanner(ai, new PromptLoader()).TryRemediateAsync(Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, root, new StubAdapter(), new ValidationResult { Passed = false, Output = "$ npm run build\nexit code: 1\nbuild failed" }, 1);

        Assert.NotNull(result.ManualCorrection);
        Assert.Contains("invalid or incomplete", result.ManualCorrection!.StringValue("reason"));
    }

    [Fact]
    public async Task Unsafe_Node_Modules_Edit_Is_Rejected()
    {
        var root = TestWorkspace.Create();
        Directory.CreateDirectory(Path.Combine(root, "node_modules", "pkg"));
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """{"scripts":{"build":"ng build"}}""");
        await File.WriteAllTextAsync(Path.Combine(root, "node_modules", "pkg", "index.d.ts"), "declare const x: Missing;\n");
        var ai = new StubAi(new JsonObject
        {
            ["summary"] = "node_modules edit",
            ["confidence"] = 0.95,
            ["risk"] = "low",
            ["requiresManualCorrection"] = false,
            ["changes"] = new JsonArray(new JsonObject { ["file"] = "node_modules/pkg/index.d.ts", ["type"] = "type_shim", ["reason"] = "TS2304 Missing", ["before"] = "Missing", ["after"] = "any" })
        });

        var result = await new AiRemediationPlanner(ai, new PromptLoader()).TryRemediateAsync(Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, root, new StubAdapter(), new ValidationResult { Passed = false, Output = "node_modules/pkg/index.d.ts:1:18 - error TS2304: Cannot find name 'Missing'." }, 1);

        Assert.NotNull(result.ManualCorrection);
        Assert.Contains("blocked path", result.ManualCorrection!.StringValue("reason"));
    }

    [Fact]
    public async Task Type_Shim_Plan_Is_Accepted_For_Node_Modules_TS2304()
    {
        var root = TestWorkspace.Create();
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """{"scripts":{"build":"ng build"}}""");
        var ai = new StubAi(new JsonObject
        {
            ["summary"] = "third-party declaration references missing global type",
            ["confidence"] = 0.86,
            ["risk"] = "low",
            ["requiresManualCorrection"] = false,
            ["failureCategory"] = "type_declaration",
            ["businessLogicChanged"] = false,
            ["changes"] = new JsonArray(new JsonObject { ["file"] = "src/types/pkg-compatibility.d.ts", ["type"] = "type_shim", ["reason"] = "node_modules/pkg/index.d.ts reports TS2304 for MissingGlobal", ["before"] = null, ["after"] = "declare type MissingGlobal = unknown;\n" })
        });

        var result = await new AiRemediationPlanner(ai, new PromptLoader()).TryRemediateAsync(Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, root, new StubAdapter(), new ValidationResult { Passed = false, Output = "node_modules/pkg/index.d.ts:1:18 - error TS2304: Cannot find name 'MissingGlobal'." }, 1);

        Assert.True(result.Applied, result.ManualCorrection?.ToJsonString());
        Assert.True(File.Exists(Path.Combine(root, "src", "types", "pkg-compatibility.d.ts")));
        Assert.False(result.Changes.Single().BoolValue("businessLogicChanged"));
    }

    [Fact]
    public async Task Angular_Ai_Type_Shim_Reruns_Build_With_Agent_Runner_And_Report_Uses_Agent_Result()
    {
        var root = await AngularWorkspace();
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """
{
  "scripts": {"build":"ng build"},
  "dependencies": {"@angular/core": "14.2.0", "@angular/cli": "14.2.0"},
  "devDependencies": {"typescript": "~4.8.4"}
}
""");
        var ai = new CapturingAi(new JsonObject
        {
            ["summary"] = "third-party declaration references missing global type",
            ["confidence"] = 0.91,
            ["risk"] = "low",
            ["requiresManualCorrection"] = false,
            ["failureCategory"] = "type_declaration",
            ["businessLogicChanged"] = false,
            ["changes"] = new JsonArray(new JsonObject { ["file"] = "src/ngx-pinch-zoom-compat.d.ts", ["type"] = "type_shim", ["reason"] = "node_modules/ngx-pinch-zoom reports TS2304 for VisibilityState", ["before"] = null, ["after"] = "declare type VisibilityState = \"hidden\" | \"visible\";\n" }),
            ["reportNotes"] = new JsonArray("Codex internal npm run build reported spawn EPERM and must be ignored")
        });
        var buildAttempts = 0;
        var runner = AngularRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = AngularVersions(command) };
            if (command.Take(2).SequenceEqual(["npm", "install"]))
            {
                WriteNgSelectPackageAsync(root).GetAwaiter().GetResult();
                return new CommandResult { ReturnCode = 0 };
            }
            if (command.SequenceEqual(["npm", "run", "build"]))
            {
                buildAttempts++;
                return buildAttempts == 1
                    ? new CommandResult { ReturnCode = 1, Stderr = "node_modules/ngx-pinch-zoom/lib/pinch-zoom.component.d.ts:54:25 - error TS2304: Cannot find name 'VisibilityState'." }
                    : new CommandResult { ReturnCode = 0, Stdout = "agent build passed" };
            }
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" }, MaxAiRemediationRetries = 1 }, null, null);
        var report = new MarkdownReportWriter().GenerateAdapterHopReport(new JsonObject { ["manifest"] = new JsonObject(), ["to"] = "angular15" }, [new MigrationHop(14, 15, "Angular 14 to 15")], [result], new ValidationResult { Passed = true });

        Assert.Equal("done", result.StringValue("status"));
        Assert.Equal(2, runner.Calls.Count(c => c.Command.SequenceEqual(["npm", "run", "build"])));
        Assert.True(File.Exists(Path.Combine(root, "src", "ngx-pinch-zoom-compat.d.ts")));
        Assert.Contains("- AI proposed type shim", report);
        Assert.Contains("- File changed: src/ngx-pinch-zoom-compat.d.ts", report);
        Assert.Contains("- Business logic changed: no", report);
        Assert.Contains("- Validation command executed by migration agent: npm run build", report);
        Assert.Contains("- Result: passed", report);
        Assert.DoesNotContain("Result: failed", report);
    }

    [Fact]
    public async Task Codex_Sandbox_Eperm_Is_Classified_As_Environment_Error_And_Agent_Validation_Is_Rerun()
    {
        var root = await AngularWorkspace();
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """
{
  "scripts": {"build":"ng build"},
  "dependencies": {"@angular/core": "14.2.0", "@angular/cli": "14.2.0"},
  "devDependencies": {"typescript": "~4.8.4"}
}
""");
        var buildAttempts = 0;
        var runner = AngularRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = AngularVersions(command) };
            if (command.SequenceEqual(["npm", "run", "build"]))
            {
                buildAttempts++;
                return buildAttempts == 1
                    ? new CommandResult { ReturnCode = 1, Stderr = "src/app/app.component.ts:1:1 - error TS9999: failed" }
                    : new CommandResult { ReturnCode = 0, Stdout = "agent rerun passed" };
            }
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner, ai: new SandboxErrorAi(), promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" }, MaxAiRemediationRetries = 1 }, null, null);

        Assert.Equal("done", result.StringValue("status"));
        Assert.Equal(2, runner.Calls.Count(c => c.Command.SequenceEqual(["npm", "run", "build"])));
        var change = Assert.Single(result["aiRemediationChanges"]!.AsArray().OfType<JsonObject>());
        Assert.Equal("environment_error", change.StringValue("failureCategory"));
        Assert.Equal("passed", change.StringValue("agentValidationResult"));
        Assert.Equal("inconclusive", change.StringValue("validationResultAfterRemediation"));
    }

    [Fact]
    public async Task Ai_Remediation_Rejects_Command_Execution_Requests()
    {
        var root = TestWorkspace.Create();
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """{"scripts":{"build":"ng build"}}""");
        var ai = new StubAi(new JsonObject
        {
            ["summary"] = "script fix",
            ["confidence"] = 0.95,
            ["risk"] = "low",
            ["requiresManualCorrection"] = false,
            ["failureCategory"] = "script",
            ["businessLogicChanged"] = false,
            ["changes"] = new JsonArray(new JsonObject { ["file"] = "package.json", ["type"] = "script_update", ["reason"] = "fix script", ["before"] = "ng build", ["after"] = "ng build --configuration production" }),
            ["commandsToRunAfter"] = new JsonArray("npm run build")
        });

        var result = await new AiRemediationPlanner(ai, new PromptLoader()).TryRemediateAsync(Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, root, new StubAdapter(), new ValidationResult { Passed = false, Output = "$ npm run build\nexit code: 1\nbuild failed" }, 1);

        Assert.NotNull(result.ManualCorrection);
        Assert.Contains("must not request command execution", result.ManualCorrection!.StringValue("reason"));
    }

    [Fact]
    public void Ai_Remediation_Prompt_Forbids_Command_Execution()
    {
        var prompt = new PromptLoader().Load("remediation/validation-remediation");

        Assert.Contains("Do not execute commands", prompt);
        Assert.Contains("The migration agent will apply changes and run commands", prompt);
        Assert.Contains("css_dependency_import", prompt);
        Assert.Contains("dependency_asset_import_resolution", prompt);
        Assert.Contains("style_import_update", prompt);
        Assert.Contains("css_dependency_import", prompt);
    }

    [Fact]
    public async Task Css_Import_With_Tilde_And_No_Exports_Removes_Only_Tilde()
    {
        var root = TestWorkspace.Create();
        Directory.CreateDirectory(Path.Combine(root, "src"));
        Directory.CreateDirectory(Path.Combine(root, "node_modules", "plain-theme"));
        await File.WriteAllTextAsync(Path.Combine(root, "src", "styles.css"), "@import \"~plain-theme/theme.css\";\n");
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """{"dependencies":{"plain-theme":"1.0.0"}}""");
        await File.WriteAllTextAsync(Path.Combine(root, "node_modules", "plain-theme", "package.json"), """{"name":"plain-theme","version":"1.0.0"}""");
        await File.WriteAllTextAsync(Path.Combine(root, "node_modules", "plain-theme", "theme.css"), "");

        var result = await AiRemediationPlanner.TryApplyDeterministicRemediationAsync(root, new ValidationResult { Output = "./src/styles.css - Error: Can't resolve '~plain-theme/theme.css' in 'src'" }, 1, 3);

        Assert.NotNull(result);
        Assert.Equal("css_dependency_import", result!.StringValue("failureCategory"));
        Assert.Equal("style_import_update", result.StringValue("type"));
        Assert.Contains("@import \"plain-theme/theme.css\"", await File.ReadAllTextAsync(Path.Combine(root, "src", "styles.css")));
    }

    [Fact]
    public async Task Css_Import_With_Tilde_And_Blocked_Exports_Uses_Relative_NodeModules_Css()
    {
        var root = TestWorkspace.Create();
        Directory.CreateDirectory(Path.Combine(root, "src"));
        await File.WriteAllTextAsync(Path.Combine(root, "src", "styles.css"), "@import \"~@ng-select/ng-select/themes/material.theme.css\";\n");
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """{"dependencies":{"@ng-select/ng-select":"^8.3.0"}}""");
        await WriteNgSelectPackageAsync(root);

        var result = await AiRemediationPlanner.TryApplyDeterministicRemediationAsync(root, new ValidationResult { Output = "./src/styles.css - Error: Can't resolve '~@ng-select/ng-select/themes/material.theme.css' in 'src'" }, 1, 3);

        Assert.NotNull(result);
        var styles = await File.ReadAllTextAsync(Path.Combine(root, "src", "styles.css"));
        Assert.DoesNotContain("@import \"~@ng-select/ng-select/themes/material.theme.css\"", styles);
        Assert.Contains("@import \"../node_modules/@ng-select/ng-select/themes/material.theme.css\"", styles);
        Assert.DoesNotContain("@ng-select/ng-select/scss/material.theme", styles);
        Assert.Equal("relative_node_modules_css_import", result!["styleImportUpdates"]!.AsArray().OfType<JsonObject>().Single().StringValue("selectedStrategy"));
    }

    [Fact]
    public async Task NgSelect_Default_Tilde_Theme_Uses_Existing_Package_Css_File()
    {
        var root = TestWorkspace.Create();
        Directory.CreateDirectory(Path.Combine(root, "src"));
        await File.WriteAllTextAsync(Path.Combine(root, "src", "styles.scss"), "@import '~@ng-select/ng-select/themes/default.theme.css';\n");
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """{"dependencies":{"@ng-select/ng-select":"^8.3.0"}}""");
        await WriteNgSelectPackageAsync(root);

        var result = await AiRemediationPlanner.TryApplyDeterministicRemediationAsync(root, new ValidationResult { Output = "./src/styles.scss - Error: Can't resolve '~@ng-select/ng-select/themes/default.theme.css' in 'src'" }, 1, 3);

        Assert.NotNull(result);
        var styles = await File.ReadAllTextAsync(Path.Combine(root, "src", "styles.scss"));
        Assert.DoesNotContain("@import '~@ng-select/ng-select/themes/default.theme.css'", styles);
        Assert.Contains("@import '../node_modules/@ng-select/ng-select/themes/default.theme.css'", styles);
        Assert.DoesNotContain("@ng-select/ng-select/scss/default.theme", styles);
    }

    [Fact]
    public async Task Css_Dependency_Import_Remediation_Patches_All_Failing_Files_In_One_Cycle()
    {
        var root = TestWorkspace.Create();
        Directory.CreateDirectory(Path.Combine(root, "src", "assets", "css"));
        Directory.CreateDirectory(Path.Combine(root, "src", "assets", "front", "css"));
        await File.WriteAllTextAsync(Path.Combine(root, "src", "assets", "css", "style.css"), "@import url(\"~@ng-select/ng-select/themes/material.theme.css\");\n.admin{display:block}\n");
        await File.WriteAllTextAsync(Path.Combine(root, "src", "assets", "front", "css", "front-style.css"), "@import '~@ng-select/ng-select/themes/default.theme.css';\n.front{display:block}\n");
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """{"dependencies":{"@ng-select/ng-select":"^8.3.0"}}""");
        await WriteNgSelectPackageAsync(root);
        var output = """
./src/assets/css/style.css - Error: Module build failed (from ./node_modules/css-loader/dist/cjs.js):
Error: Can't resolve '~@ng-select/ng-select/themes/material.theme.css' in 'src/assets/css'
./src/assets/front/css/front-style.css - Error: Module build failed (from ./node_modules/css-loader/dist/cjs.js):
Error: Can't resolve '~@ng-select/ng-select/themes/default.theme.css' in 'src/assets/front/css'
""";

        var result = await AiRemediationPlanner.TryApplyDeterministicRemediationAsync(root, new ValidationResult { Output = output, FailureCommand = ["npm", "run", "build"] }, 1, 3);

        Assert.NotNull(result);
        var admin = await File.ReadAllTextAsync(Path.Combine(root, "src", "assets", "css", "style.css"));
        var front = await File.ReadAllTextAsync(Path.Combine(root, "src", "assets", "front", "css", "front-style.css"));
        Assert.Contains("@import url(\"../../../node_modules/@ng-select/ng-select/themes/material.theme.css\");", admin);
        Assert.Contains("@import '../../../../node_modules/@ng-select/ng-select/themes/default.theme.css';", front);
        Assert.DoesNotContain("@ng-select/ng-select/scss/material.theme", admin);
        Assert.DoesNotContain("@ng-select/ng-select/scss/default.theme", front);
        Assert.Contains(".admin{display:block}", admin);
        Assert.Contains(".front{display:block}", front);
        Assert.Equal(2, result!["styleImportUpdates"]!.AsArray().Count);
    }

    [Fact]
    public async Task Css_Dependency_Import_Calls_Ai_After_Deterministic_Candidate_Resolution_Fails()
    {
        var root = TestWorkspace.Create();
        Directory.CreateDirectory(Path.Combine(root, "src"));
        var packagePath = Path.Combine(root, "node_modules", "@ng-select", "ng-select");
        Directory.CreateDirectory(packagePath);
        await File.WriteAllTextAsync(Path.Combine(root, "src", "styles.css"), "@import \"~@ng-select/ng-select/themes/missing.theme.css\";\n");
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """{"dependencies":{"@ng-select/ng-select":"^8.3.0"}}""");
        await File.WriteAllTextAsync(Path.Combine(packagePath, "package.json"), """{"name":"@ng-select/ng-select","version":"8.3.0","exports":{"./scss/default.theme":{"style":"./scss/default.theme.scss"}}}""");
        var ai = new CapturingAi(new JsonObject { ["summary"] = "manual", ["confidence"] = 0.0, ["risk"] = "high", ["requiresManualCorrection"] = true, ["failureCategory"] = "css_dependency_import", ["businessLogicChanged"] = false, ["changes"] = new JsonArray() });

        var result = await new AiRemediationPlanner(ai, new PromptLoader()).TryRemediateAsync(Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, root, new StubAdapter(), new ValidationResult { Passed = false, Output = "./src/styles.css - Error: Can't resolve '~@ng-select/ng-select/themes/missing.theme.css' in 'src'" }, 1);

        Assert.NotNull(result.ManualCorrection);
        Assert.Contains("\"cssDependencyImportFailures\"", ai.LastUser);
        Assert.Contains("No direct tilde removal or verified equivalent package asset path was found", ai.LastUser);
        var css = result.ManualCorrection!["cssDependencyImportFailures"]!.AsObject();
        var failure = Assert.Single(css["failures"]!.AsArray().OfType<JsonObject>());
        Assert.Equal("~@ng-select/ng-select/themes/missing.theme.css", failure.StringValue("originalImport"));
        Assert.Equal("@ng-select/ng-select/themes/missing.theme.css", failure.StringValue("directNormalizedImportAttempted"));
        Assert.Null(failure["recommendedImport"]);
    }

    [Fact]
    public async Task NgSelect_Theme_Css_Is_Not_Moved_To_Global_Scss()
    {
        var root = TestWorkspace.Create();
        Directory.CreateDirectory(Path.Combine(root, "src", "assets", "css"));
        Directory.CreateDirectory(Path.Combine(root, "src", "assets", "front", "css"));
        await File.WriteAllTextAsync(Path.Combine(root, "angular.json"), """{"projects":{"app":{"architect":{"build":{"options":{"styles":["src/styles.scss"]}}}}}}""");
        await File.WriteAllTextAsync(Path.Combine(root, "src", "styles.scss"), "@use '@angular/material' as mat;\n.app{display:block}\n");
        await File.WriteAllTextAsync(Path.Combine(root, "src", "assets", "css", "style.css"), "@import \"@ng-select/ng-select/themes/material.theme.css\";\n");
        await File.WriteAllTextAsync(Path.Combine(root, "src", "assets", "front", "css", "front-style.css"), "@import \"@ng-select/ng-select/themes/default.theme.css\";\n");
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """{"dependencies":{"@ng-select/ng-select":"^8.3.0"}}""");
        await WriteNgSelectPackageAsync(root);
        var output = """
./src/assets/css/style.css - Error: Module build failed
Error: "./themes/material.theme.css" is not exported under the condition "style" from package node_modules/@ng-select/ng-select
./src/assets/front/css/front-style.css - Error: Module build failed
Error: "./themes/default.theme.css" is not exported under the condition "style" from package node_modules/@ng-select/ng-select
""";

        var result = await AiRemediationPlanner.TryApplyDeterministicRemediationAsync(root, new ValidationResult { Output = output, FailureCommand = ["npm", "run", "build"] }, 1, 3);

        Assert.NotNull(result);
        Assert.Contains("../../../node_modules/@ng-select/ng-select/themes/material.theme.css", await File.ReadAllTextAsync(Path.Combine(root, "src", "assets", "css", "style.css")));
        Assert.Contains("../../../../node_modules/@ng-select/ng-select/themes/default.theme.css", await File.ReadAllTextAsync(Path.Combine(root, "src", "assets", "front", "css", "front-style.css")));
        var globalScss = await File.ReadAllTextAsync(Path.Combine(root, "src", "styles.scss"));
        Assert.DoesNotContain("@ng-select/ng-select/scss/material.theme", globalScss);
        Assert.DoesNotContain("@ng-select/ng-select/scss/default.theme", globalScss);
    }

    [Fact]
    public async Task Package_Scss_Partial_Failure_Does_Not_Move_Scss_Imports_To_Global_Scss()
    {
        var root = TestWorkspace.Create();
        Directory.CreateDirectory(Path.Combine(root, "src", "assets", "css"));
        Directory.CreateDirectory(Path.Combine(root, "src", "assets", "front", "css"));
        await File.WriteAllTextAsync(Path.Combine(root, "angular.json"), """
{
  "projects": {
    "app": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "src/styles.scss",
              { "input": "src/assets/css/style.css", "bundleName": "style", "inject": false },
              { "input": "src/assets/front/css/front-style.css", "bundleName": "front-style", "inject": false }
            ]
          }
        }
      }
    }
  }
}
""");
        await File.WriteAllTextAsync(Path.Combine(root, "src", "styles.scss"), ".app{display:block}\n");
        await File.WriteAllTextAsync(Path.Combine(root, "src", "assets", "css", "style.css"), "@import \"@ng-select/ng-select/scss/material.theme\";\n.admin{display:block}\n");
        await File.WriteAllTextAsync(Path.Combine(root, "src", "assets", "front", "css", "front-style.css"), "@import \"@ng-select/ng-select/scss/default.theme\";\n.front{display:block}\n");
        await WriteNgSelectPackageAsync(root);
        var packageScss = Path.Combine(root, "node_modules", "@ng-select", "ng-select", "scss");
        await File.WriteAllTextAsync(Path.Combine(packageScss, "_mixins.scss"), "@mixin x{}\n");
        var output = $"""
./node_modules/css-loader/dist/cjs.js!./node_modules/@ng-select/ng-select/scss/material.theme.scss - Error: Module build failed (from ./node_modules/css-loader/dist/cjs.js):
Error: Can't resolve 'mixins' in '{Path.Combine(root, "node_modules", "@ng-select", "ng-select", "scss")}'
./node_modules/css-loader/dist/cjs.js!./node_modules/@ng-select/ng-select/scss/default.theme.scss - Error: Module build failed (from ./node_modules/css-loader/dist/cjs.js):
Error: Can't resolve 'mixins' in '{Path.Combine(root, "node_modules", "@ng-select", "ng-select", "scss")}'
./src/assets/css/style.css?ngGlobalStyle - Error: HookWebpackError
./src/styles.scss?ngGlobalStyle - Error: HookWebpackError
""";

        var result = await AiRemediationPlanner.TryApplyDeterministicRemediationAsync(root, new ValidationResult { Output = output, FailureCommand = ["npm", "run", "build"] }, 2, 3);

        Assert.NotNull(result);
        var styles = await File.ReadAllTextAsync(Path.Combine(root, "src", "styles.scss"));
        Assert.DoesNotContain("@ng-select/ng-select/scss/material.theme", styles);
        Assert.DoesNotContain("@ng-select/ng-select/scss/default.theme", styles);
        Assert.Contains("@ng-select/ng-select/themes/material.theme.css", await File.ReadAllTextAsync(Path.Combine(root, "src", "assets", "css", "style.css")));
        Assert.Contains("@ng-select/ng-select/scss/default.theme", await File.ReadAllTextAsync(Path.Combine(root, "src", "assets", "front", "css", "front-style.css")));
        Assert.False(File.Exists(Path.Combine(packageScss, "mixins.scss")));
        Assert.True(File.Exists(Path.Combine(packageScss, "_mixins.scss")));
    }

    [Fact]
    public async Task Package_Scss_Partial_Failure_Without_Global_Scss_Returns_Manual_Correction()
    {
        var root = TestWorkspace.Create();
        Directory.CreateDirectory(Path.Combine(root, "src", "assets", "css"));
        await File.WriteAllTextAsync(Path.Combine(root, "angular.json"), """{"projects":{"app":{"architect":{"build":{"options":{"styles":["src/assets/css/style.css"]}}}}}}""");
        await File.WriteAllTextAsync(Path.Combine(root, "src", "assets", "css", "style.css"), "@import \"@ng-select/ng-select/scss/material.theme\";\n");
        await WriteNgSelectPackageAsync(root);
        var packageScss = Path.Combine(root, "node_modules", "@ng-select", "ng-select", "scss");
        await File.WriteAllTextAsync(Path.Combine(packageScss, "_mixins.scss"), "");
        var output = $"""
./node_modules/@ng-select/ng-select/scss/material.theme.scss - Error: Module build failed
Error: Can't resolve 'mixins' in '{Path.Combine(root, "node_modules", "@ng-select", "ng-select", "scss")}'
""";

        var result = await new AiRemediationPlanner(new StubAi(new JsonObject()), new PromptLoader()).TryRemediateAsync(Config(root) with { Ai = new AiConfig { UseAi = false, Provider = "codex" } }, root, new StubAdapter(), new ValidationResult { Passed = false, Output = output }, 1);

        Assert.NotNull(result.ManualCorrection);
        Assert.Contains("@ng-select/ng-select/scss/material.theme", await File.ReadAllTextAsync(Path.Combine(root, "src", "assets", "css", "style.css")));
        var css = result.ManualCorrection!["cssDependencyImportFailures"]!.AsObject();
        Assert.False(css.BoolValue("detected"));
        Assert.Empty(css["unresolvedDependencyImports"]!.AsArray());
    }

    [Fact]
    public async Task Css_CantResolve_Extraction_Uses_Only_Quoted_Unresolved_Dependency_Imports()
    {
        var root = TestWorkspace.Create();
        Directory.CreateDirectory(Path.Combine(root, "src", "assets", "css"));
        Directory.CreateDirectory(Path.Combine(root, "src", "assets", "front", "css"));
        await File.WriteAllTextAsync(Path.Combine(root, "src", "assets", "css", "style.css"), "@import \"~@ng-select/ng-select/themes/material.theme.css\";\n");
        await File.WriteAllTextAsync(Path.Combine(root, "src", "assets", "front", "css", "front-style.css"), "@import \"~@ng-select/ng-select/themes/default.theme.css\";\n");
        var output = """
./src/assets/css/style.css - Error: Module build failed (from ./node_modules/css-loader/dist/cjs.js):
Error: Can't resolve '~@ng-select/ng-select/themes/material.theme.css' in 'D:\Projects\AI\AiMigration\Output\src\assets\css'
./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[5].rules[0].oneOf[0].use[1]!./node_modules/postcss-loader/dist/cjs.js??ruleSet[1].rules[5].rules[0].oneOf[0].use[2]!./src/assets/front/css/front-style.css - Error: Module build failed (from ./node_modules/css-loader/dist/cjs.js):
Error: Can't resolve '~@ng-select/ng-select/themes/default.theme.css' in 'D:\Projects\AI\AiMigration\Output\src\assets\front\css'
""";

        var unresolved = AiRemediationPlanner.ExtractUnresolvedDependencyImportsForTesting(output);
        var context = AiRemediationPlanner.BuildCssDependencyImportContextForTesting(root, new ValidationResult { Output = output });

        Assert.Equal(["~@ng-select/ng-select/themes/material.theme.css", "~@ng-select/ng-select/themes/default.theme.css"], unresolved);
        Assert.DoesNotContain("./src/assets/css/style.css", unresolved);
        Assert.DoesNotContain("./src/assets/front/css/front-style.css", unresolved);
        Assert.DoesNotContain("assets/front/css/front-style.css", unresolved);
        Assert.Equal(2, context["unresolvedDependencyImports"]!.AsArray().Count);
        Assert.Contains("src/assets/css/style.css", context["loaderResourceFilesFromErrorChain"]!.AsArray().Select(x => x?.ToString()));
        Assert.Contains("src/assets/front/css/front-style.css", context["loaderResourceFilesFromErrorChain"]!.AsArray().Select(x => x?.ToString()));
    }

    [Fact]
    public async Task Css_Import_Resolver_Allows_Direct_Tilde_Removal_When_Exported()
    {
        var root = TestWorkspace.Create();
        Directory.CreateDirectory(Path.Combine(root, "node_modules", "some-package"));
        await File.WriteAllTextAsync(Path.Combine(root, "node_modules", "some-package", "file.css"), "");
        await File.WriteAllTextAsync(Path.Combine(root, "node_modules", "some-package", "package.json"), """{"name":"some-package","exports":{"./file.css":{"style":"./file.css"}}}""");

        var plan = AiRemediationPlanner.ResolveCssImportRemediation("src/styles.css", "~some-package/file.css", root);

        Assert.Equal("direct_package_import", plan.StringValue("selectedStrategy"));
        Assert.Equal("some-package/file.css", plan.StringValue("replacementImport"));
    }

    [Fact]
    public async Task Css_Import_Resolver_Uses_Relative_NodeModules_Css_When_Exports_Block_Subpath()
    {
        var root = TestWorkspace.Create();
        await WriteNgSelectPackageAsync(root);

        var admin = AiRemediationPlanner.ResolveCssImportRemediation("src/assets/css/style.css", "~@ng-select/ng-select/themes/material.theme.css", root);
        var front = AiRemediationPlanner.ResolveCssImportRemediation("src/assets/front/css/front-style.css", "~@ng-select/ng-select/themes/default.theme.css", root);

        Assert.Equal("relative_node_modules_css_import", admin.StringValue("selectedStrategy"));
        Assert.Equal("../../../node_modules/@ng-select/ng-select/themes/material.theme.css", admin.StringValue("replacementImport"));
        Assert.Equal("../../../../node_modules/@ng-select/ng-select/themes/default.theme.css", front.StringValue("replacementImport"));
        Assert.Contains(front["rejectedCandidates"]!.AsArray().OfType<JsonObject>(), c => c.StringValue("reason") == "package_exports_block_subpath");
    }

    [Fact]
    public async Task Css_Import_Resolver_Rejects_Package_Scss_From_Css_Source()
    {
        var root = TestWorkspace.Create();
        await WriteNgSelectPackageAsync(root);

        var plan = AiRemediationPlanner.ResolveCssImportRemediation("src/assets/css/style.css", "@ng-select/ng-select/scss/material.theme", root);

        Assert.Contains(plan["rejectedCandidates"]!.AsArray().OfType<JsonObject>(), c => c.StringValue("reason") == "scss_import_from_css_forbidden");
    }

    [Fact]
    public async Task AngularAdapter_Applies_Css_Dependency_Import_Deterministically_And_Reruns_Build()
    {
        var root = await AngularWorkspace();
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """
{
  "scripts": {"build":"ng build"},
  "dependencies": {"@angular/core": "14.2.0", "@angular/cli": "14.2.0", "plain-theme":"1.0.0"},
  "devDependencies": {"typescript": "~4.8.4"}
}
""");
        Directory.CreateDirectory(Path.Combine(root, "src"));
        await File.WriteAllTextAsync(Path.Combine(root, "src", "styles.css"), "@import \"~plain-theme/theme.css\";\n");
        WritePlainThemePackage(root);
        var buildAttempts = 0;
        var ai = new QueueAi(Plan("should not be used", "package.json", "ng build", "ng build --configuration production"));
        var runner = AngularRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = AngularVersions(command) };
            if (command.Take(2).SequenceEqual(["npm", "install"]))
            {
                WritePlainThemePackage(root);
                return new CommandResult { ReturnCode = 0 };
            }
            if (command.SequenceEqual(["npm", "run", "build"]))
            {
                buildAttempts++;
                return buildAttempts == 1
                    ? new CommandResult { ReturnCode = 1, Stderr = "./src/styles.css - Error: Module build failed (from ./node_modules/css-loader/dist/cjs.js): Error: Can't resolve '~plain-theme/theme.css' in 'src'" }
                    : new CommandResult { ReturnCode = 0 };
            }
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" }, MaxAiRemediationRetries = 3 }, null, null);

        Assert.Equal("done", result.StringValue("status"));
        Assert.Equal(2, buildAttempts);
        Assert.True(result["aiRemediationChanges"]!.AsArray().Count > 0, result.ToJsonString());
        Assert.True(result["aiRemediationChanges"]!.AsArray().OfType<JsonObject>().Any(c => c.StringValue("failureCategory") == "css_dependency_import" && c.StringValue("mode") == "deterministic"), result.ToJsonString());
        Assert.Equal(0, ai.Calls);
        Assert.Contains("@import \"plain-theme/theme.css\"", await File.ReadAllTextAsync(Path.Combine(root, "src", "styles.css")));
        var failure = Assert.Single(result["validationFailures"]!.AsArray().OfType<JsonObject>());
        Assert.True(failure.BoolValue("remediationAttempted"));
        Assert.True(failure.BoolValue("remediationApplied"));
        Assert.False(failure.BoolValue("manualCorrectionRequired"));
    }

    [Fact]
    public void Not_Exported_Under_Style_Is_Classified_As_Css_Dependency_Import()
    {
        var text = """./src/styles.css - Error: "./themes/material.theme.css" is not exported under the condition "style" from package node_modules/@ng-select/ng-select""";

        Assert.True(AiRemediationPlanner.IsCssDependencyImportFailure(text));
    }

    [Fact]
    public async Task Node_Modules_Package_Exports_Are_Included_In_Css_Manual_Context_When_No_Candidate_Matches()
    {
        var root = TestWorkspace.Create();
        Directory.CreateDirectory(Path.Combine(root, "src"));
        await File.WriteAllTextAsync(Path.Combine(root, "src", "styles.css"), "@import \"@ng-select/ng-select/themes/unknown.theme.css\";\n");
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """{"dependencies":{"@ng-select/ng-select":"^8.3.0"}}""");
        await WriteNgSelectPackageAsync(root);
        var ai = new CapturingAi(new JsonObject
        {
            ["summary"] = "manual",
            ["confidence"] = 0.0,
            ["risk"] = "high",
            ["requiresManualCorrection"] = true,
            ["failureCategory"] = "css_dependency_import",
            ["businessLogicChanged"] = false,
            ["changes"] = new JsonArray()
        });

        var result = await new AiRemediationPlanner(ai, new PromptLoader()).TryRemediateAsync(Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, root, new StubAdapter(), new ValidationResult { Passed = false, Output = """./src/styles.css - Error: Can't resolve '@ng-select/ng-select/themes/unknown.theme.css' in 'src'""" }, 1);

        Assert.NotNull(result.ManualCorrection);
        var context = result.ManualCorrection!["cssDependencyImportFailures"]!.ToJsonString();
        Assert.Contains("\"packageName\":\"@ng-select/ng-select\"", context);
        Assert.Contains("\"./scss/material.theme\"", context);
    }

    [Fact]
    public async Task Ai_Plan_Only_Removing_Tilde_Is_Rejected_When_Error_Says_Not_Exported()
    {
        var root = TestWorkspace.Create();
        Directory.CreateDirectory(Path.Combine(root, "src"));
        await File.WriteAllTextAsync(Path.Combine(root, "src", "styles.css"), "@import \"~@ng-select/ng-select/themes/material.theme.css\";\n");
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """{"dependencies":{"@ng-select/ng-select":"^8.3.0"}}""");
        var ngSelectPath = Path.Combine(root, "node_modules", "@ng-select", "ng-select");
        Directory.CreateDirectory(ngSelectPath);
        await File.WriteAllTextAsync(Path.Combine(ngSelectPath, "package.json"), """{"name":"@ng-select/ng-select","version":"8.3.0","exports":{"./scss/material.theme":{"style":"./scss/material.theme.scss"},"./scss/material.theme-alt":{"style":"./scss/material.theme-alt.scss"}}}""");
        var plan = new JsonObject
        {
            ["summary"] = "remove tilde only",
            ["confidence"] = 0.95,
            ["risk"] = "low",
            ["requiresManualCorrection"] = false,
            ["failureCategory"] = "css_dependency_import",
            ["businessLogicChanged"] = false,
            ["changes"] = new JsonArray(new JsonObject { ["file"] = "src/styles.css", ["type"] = "style_import_update", ["reason"] = "remove tilde", ["before"] = "~@ng-select/ng-select/themes/material.theme.css", ["after"] = "@ng-select/ng-select/themes/material.theme.css" })
        };

        var safety = AiRemediationPlanner.ValidatePlanForTesting(plan, new ValidationResult { Passed = false, Output = """./src/styles.css - Error: "./themes/material.theme.css" is not exported under the condition "style" from package node_modules/@ng-select/ng-select""" }, root);

        Assert.False(safety.Safe);
        Assert.Contains("not confirmed by package exports or package files", safety.Reason);
    }

    [Fact]
    public async Task Ai_Plan_Converting_Css_Import_To_Verified_Equivalent_Scss_Is_Accepted()
    {
        var root = TestWorkspace.Create();
        Directory.CreateDirectory(Path.Combine(root, "src"));
        await File.WriteAllTextAsync(Path.Combine(root, "src", "styles.scss"), "@import \"@ng-select/ng-select/themes/default.theme.css\";\n");
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """{"dependencies":{"@ng-select/ng-select":"^8.3.0"}}""");
        await WriteNgSelectPackageAsync(root);
        var ai = new StubAi(new JsonObject
        {
            ["summary"] = "package style import path is not exported",
            ["confidence"] = 0.95,
            ["risk"] = "low",
            ["requiresManualCorrection"] = false,
            ["failureCategory"] = "css_dependency_import",
            ["businessLogicChanged"] = false,
            ["changes"] = new JsonArray(new JsonObject { ["file"] = "src/styles.scss", ["type"] = "style_import_update", ["reason"] = "use exported style entry", ["before"] = "@ng-select/ng-select/themes/default.theme.css", ["after"] = "@ng-select/ng-select/scss/default.theme" })
        });

        var result = await new AiRemediationPlanner(ai, new PromptLoader()).TryRemediateAsync(Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, root, new StubAdapter(), new ValidationResult { Passed = false, Output = """./src/styles.scss - Error: "./themes/default.theme.css" is not exported under the condition "style" from package node_modules/@ng-select/ng-select""" }, 1);

        Assert.True(result.Applied, result.ManualCorrection?.ToJsonString());
        var styles = await File.ReadAllTextAsync(Path.Combine(root, "src", "styles.scss"));
        Assert.DoesNotContain("@import \"@ng-select/ng-select/themes/default.theme.css\"", styles);
        Assert.Contains("../node_modules/@ng-select/ng-select/themes/default.theme.css", styles);
        Assert.DoesNotContain("@ng-select/ng-select/scss/default.theme", styles);
    }

    [Fact]
    public async Task Ai_Plan_Importing_Package_Scss_From_Css_File_Is_Rejected()
    {
        var root = TestWorkspace.Create();
        Directory.CreateDirectory(Path.Combine(root, "src"));
        await File.WriteAllTextAsync(Path.Combine(root, "src", "styles.css"), "@import \"~@ng-select/ng-select/themes/material.theme.css\";\n");
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """{"dependencies":{"@ng-select/ng-select":"^8.3.0"}}""");
        await WriteNgSelectPackageAsync(root);
        var plan = new JsonObject
        {
            ["summary"] = "bad css to scss rewrite",
            ["confidence"] = 0.95,
            ["risk"] = "low",
            ["requiresManualCorrection"] = false,
            ["failureCategory"] = "css_dependency_import",
            ["businessLogicChanged"] = false,
            ["changes"] = new JsonArray(new JsonObject { ["file"] = "src/styles.css", ["type"] = "style_import_update", ["reason"] = "use exported style entry", ["before"] = "~@ng-select/ng-select/themes/material.theme.css", ["after"] = "@ng-select/ng-select/scss/material.theme" })
        };

        var safety = AiRemediationPlanner.ValidatePlanForTesting(plan, new ValidationResult { Passed = false, Output = """./src/styles.css - Error: Can't resolve '~@ng-select/ng-select/themes/material.theme.css' in 'src'""" }, root);

        Assert.False(safety.Safe);
        Assert.Contains("cannot import package SCSS from a .css source file", safety.Reason);
    }

    [Fact]
    public async Task Css_Ai_Remediation_Does_Not_Treat_Local_Stylesheet_Import_As_Unresolved_Dependency()
    {
        var root = TestWorkspace.Create();
        Directory.CreateDirectory(Path.Combine(root, "src", "assets", "front", "css"));
        await File.WriteAllTextAsync(Path.Combine(root, "src", "styles.scss"), """
@import "assets/front/css/front-style.css";
@import "~@ng-select/ng-select/themes/missing.theme.css";
""");
        await File.WriteAllTextAsync(Path.Combine(root, "src", "assets", "front", "css", "front-style.css"), ".front{display:block}\n");
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """{"dependencies":{"@ng-select/ng-select":"^8.3.0"}}""");
        await WriteNgSelectPackageAsync(root);
        var ai = new StubAi(new JsonObject
        {
            ["summary"] = "package style import path is not exported",
            ["confidence"] = 0.95,
            ["risk"] = "low",
            ["requiresManualCorrection"] = false,
            ["failureCategory"] = "css_dependency_import",
            ["businessLogicChanged"] = false,
            ["changes"] = new JsonArray(new JsonObject { ["file"] = "src/styles.scss", ["type"] = "style_import_update", ["reason"] = "use exported style entry", ["before"] = "~@ng-select/ng-select/themes/missing.theme.css", ["after"] = "@ng-select/ng-select/scss/default.theme" })
        });
        var output = """
./src/styles.scss - Error: Module build failed (from ./node_modules/css-loader/dist/cjs.js):
Error: Can't resolve '~@ng-select/ng-select/themes/missing.theme.css' in 'src'
./node_modules/css-loader/dist/cjs.js!./src/assets/front/css/front-style.css - Error: loader chain context
""";

        var result = await new AiRemediationPlanner(ai, new PromptLoader()).TryRemediateAsync(Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, root, new StubAdapter(), new ValidationResult { Passed = false, Output = output }, 1);

        Assert.NotNull(result.ManualCorrection);
        Assert.Contains("confirmed direct tilde removal or a verified equivalent package asset path", result.ManualCorrection!.StringValue("reason"));
        var styles = await File.ReadAllTextAsync(Path.Combine(root, "src", "styles.scss"));
        Assert.DoesNotContain("@ng-select/ng-select/scss/default.theme", styles);
        Assert.Contains("@import \"assets/front/css/front-style.css\";", styles);
        var unresolved = result.ManualCorrection!["cssDependencyImportFailures"]!["unresolvedDependencyImports"]!.AsArray().Select(x => x?.ToString()).ToArray();
        Assert.Contains("~@ng-select/ng-select/themes/missing.theme.css", unresolved);
        Assert.DoesNotContain("assets/front/css/front-style.css", unresolved);
    }

    [Fact]
    public async Task Unrelated_Style_Changes_Are_Rejected()
    {
        var root = TestWorkspace.Create();
        Directory.CreateDirectory(Path.Combine(root, "src"));
        await File.WriteAllTextAsync(Path.Combine(root, "src", "styles.css"), "@import \"@ng-select/ng-select/themes/default.theme.css\";\n.button{color:red}\n");
        var ngSelectPath = Path.Combine(root, "node_modules", "@ng-select", "ng-select");
        Directory.CreateDirectory(ngSelectPath);
        await File.WriteAllTextAsync(Path.Combine(ngSelectPath, "package.json"), """{"name":"@ng-select/ng-select","version":"8.3.0","exports":{"./scss/default.theme":{"style":"./scss/default.theme.scss"},"./scss/default.theme-alt":{"style":"./scss/default.theme-alt.scss"}}}""");
        var plan = new JsonObject
        {
            ["summary"] = "unrelated style edit",
            ["confidence"] = 0.95,
            ["risk"] = "low",
            ["requiresManualCorrection"] = false,
            ["failureCategory"] = "css_dependency_import",
            ["businessLogicChanged"] = false,
            ["changes"] = new JsonArray(new JsonObject { ["file"] = "src/styles.css", ["type"] = "style_import_update", ["reason"] = "change style", ["before"] = ".button{color:red}", ["after"] = ".button{color:blue}" })
        };

        var safety = AiRemediationPlanner.ValidatePlanForTesting(plan, new ValidationResult { Passed = false, Output = """./src/styles.css - Error: "./themes/default.theme.css" is not exported under the condition "style" from package node_modules/@ng-select/ng-select""" }, root);

        Assert.False(safety.Safe);
        Assert.Contains("package import", safety.Reason);
    }

    [Fact]
    public async Task Css_Dependency_Import_Deterministic_Failure_With_UseAi_False_Returns_ManualCorrection()
    {
        var root = TestWorkspace.Create();
        Directory.CreateDirectory(Path.Combine(root, "src"));
        await File.WriteAllTextAsync(Path.Combine(root, "src", "styles.css"), "@import \"~@ng-select/ng-select/themes/missing.theme.css\";\n");
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """{"dependencies":{"@ng-select/ng-select":"^8.3.0"}}""");
        await WriteNgSelectPackageAsync(root);
        var ai = new CapturingAi(new JsonObject());

        var result = await new AiRemediationPlanner(ai, new PromptLoader()).TryRemediateAsync(Config(root) with { Ai = new AiConfig { UseAi = false, Provider = "codex" } }, root, new StubAdapter(), new ValidationResult { Passed = false, Output = "./src/styles.css - Error: Can't resolve '~@ng-select/ng-select/themes/missing.theme.css' in 'src'" }, 1);

        Assert.NotNull(result.ManualCorrection);
        Assert.Equal("", ai.LastUser);
        Assert.Contains("No confirmed direct tilde removal or verified equivalent package asset path", result.ManualCorrection!.StringValue("reason"));
    }

    [Fact]
    public async Task Css_Ai_Style_Import_Update_Does_Not_Move_Imports_To_StylesScss()
    {
        var root = TestWorkspace.Create();
        Directory.CreateDirectory(Path.Combine(root, "src", "a"));
        Directory.CreateDirectory(Path.Combine(root, "src", "b"));
        await File.WriteAllTextAsync(Path.Combine(root, "angular.json"), """{"projects":{"app":{"architect":{"build":{"options":{"styles":["src/styles.scss"]}}}}}}""");
        await File.WriteAllTextAsync(Path.Combine(root, "src", "styles.scss"), "@use '@angular/material' as mat;\n");
        await File.WriteAllTextAsync(Path.Combine(root, "src", "a", "one.scss"), "@import \"@ng-select/ng-select/themes/missing.theme.css\";\n");
        await File.WriteAllTextAsync(Path.Combine(root, "src", "b", "two.css"), "@import \"~@ng-select/ng-select/themes/missing.theme.css\";\n");
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """{"dependencies":{"@ng-select/ng-select":"^8.3.0"}}""");
        await WriteNgSelectPackageAsync(root);
        var ai = new StubAi(new JsonObject
        {
            ["summary"] = "package style import path is not exported",
            ["confidence"] = 0.95,
            ["risk"] = "low",
            ["requiresManualCorrection"] = false,
            ["failureCategory"] = "css_dependency_import",
            ["businessLogicChanged"] = false,
            ["changes"] = new JsonArray(new JsonObject { ["file"] = "src/a/one.scss", ["type"] = "style_import_update", ["reason"] = "use exported style entry", ["before"] = "@ng-select/ng-select/themes/missing.theme.css", ["after"] = "@ng-select/ng-select/scss/default.theme" })
        });

        var result = await new AiRemediationPlanner(ai, new PromptLoader()).TryRemediateAsync(Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, root, new StubAdapter(), new ValidationResult { Passed = false, Output = """./src/a/one.scss - Error: Can't resolve '~@ng-select/ng-select/themes/missing.theme.css' in 'src/a'""" }, 1);

        Assert.NotNull(result.ManualCorrection);
        Assert.Contains("confirmed direct tilde removal or a verified equivalent package asset path", result.ManualCorrection!.StringValue("reason"));
        Assert.DoesNotContain("@ng-select/ng-select/scss/default.theme", await File.ReadAllTextAsync(Path.Combine(root, "src", "a", "one.scss")));
        Assert.DoesNotContain("@ng-select/ng-select/scss/default.theme", await File.ReadAllTextAsync(Path.Combine(root, "src", "b", "two.css")));
        var globalScss = await File.ReadAllTextAsync(Path.Combine(root, "src", "styles.scss"));
        Assert.DoesNotContain("@ng-select/ng-select/scss/default.theme", globalScss);
    }

    [Fact]
    public async Task Css_Ai_Plan_Changing_Typescript_Or_Package_Is_Rejected()
    {
        var root = TestWorkspace.Create();
        Directory.CreateDirectory(Path.Combine(root, "src"));
        await File.WriteAllTextAsync(Path.Combine(root, "src", "styles.css"), "@import \"~@ng-select/ng-select/themes/missing.theme.css\";\n");
        await File.WriteAllTextAsync(Path.Combine(root, "src", "app.component.ts"), "export class AppComponent {}\n");
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """{"dependencies":{"@ng-select/ng-select":"^8.3.0"}}""");
        await WriteNgSelectPackageAsync(root);

        var tsPlan = new StubAi(new JsonObject
        {
            ["summary"] = "unsafe source edit",
            ["confidence"] = 0.95,
            ["risk"] = "low",
            ["requiresManualCorrection"] = false,
            ["failureCategory"] = "css_dependency_import",
            ["businessLogicChanged"] = false,
            ["changes"] = new JsonArray(new JsonObject { ["file"] = "src/app.component.ts", ["type"] = "source_update", ["reason"] = "unsafe", ["before"] = "export class AppComponent {}", ["after"] = "export class AppComponent { fixed = true; }" })
        });
        var tsResult = await new AiRemediationPlanner(tsPlan, new PromptLoader()).TryRemediateAsync(Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, root, new StubAdapter(), new ValidationResult { Passed = false, Output = "./src/styles.css - Error: Can't resolve '~@ng-select/ng-select/themes/missing.theme.css' in 'src'" }, 1);

        var packagePlan = new StubAi(new JsonObject
        {
            ["summary"] = "unsafe package edit",
            ["confidence"] = 0.95,
            ["risk"] = "low",
            ["requiresManualCorrection"] = false,
            ["failureCategory"] = "css_dependency_import",
            ["businessLogicChanged"] = false,
            ["changes"] = new JsonArray(new JsonObject { ["file"] = "package.json", ["type"] = "package_update", ["reason"] = "unsafe", ["before"] = "\"@ng-select/ng-select\":\"^8.3.0\"", ["after"] = "\"@ng-select/ng-select\":\"^9.0.0\"" })
        });
        var packageResult = await new AiRemediationPlanner(packagePlan, new PromptLoader()).TryRemediateAsync(Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, root, new StubAdapter(), new ValidationResult { Passed = false, Output = "./src/styles.css - Error: Can't resolve '~@ng-select/ng-select/themes/missing.theme.css' in 'src'" }, 1);

        Assert.NotNull(tsResult.ManualCorrection);
        Assert.Contains("may only rewrite style asset imports", tsResult.ManualCorrection!.StringValue("reason"));
        Assert.NotNull(packageResult.ManualCorrection);
        Assert.Contains("may only rewrite style asset imports", packageResult.ManualCorrection!.StringValue("reason"));
    }

    [Fact]
    public async Task AngularAdapter_Css_Deterministic_Failure_Calls_Ai_And_Reports_Ai_Attempt()
    {
        var root = await AngularWorkspace("""
,
    "@ng-select/ng-select": "^8.3.0"
""");
        Directory.CreateDirectory(Path.Combine(root, "src"));
        await File.WriteAllTextAsync(Path.Combine(root, "src", "styles.scss"), "@import \"~@ng-select/ng-select/themes/missing.theme.css\";\n");
        await WriteNgSelectPackageAsync(root);
        var buildAttempts = 0;
        var ai = new QueueAi(new JsonObject
        {
            ["summary"] = "package style import path is not exported",
            ["confidence"] = 0.95,
            ["risk"] = "low",
            ["requiresManualCorrection"] = false,
            ["failureCategory"] = "css_dependency_import",
            ["businessLogicChanged"] = false,
            ["changes"] = new JsonArray(new JsonObject { ["file"] = "src/styles.scss", ["type"] = "style_import_update", ["reason"] = "use exported style entry", ["before"] = "~@ng-select/ng-select/themes/missing.theme.css", ["after"] = "@ng-select/ng-select/scss/default.theme" })
        });
        var runner = AngularRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = AngularVersions(command) };
            if (command.Take(2).SequenceEqual(["npm", "install"]))
            {
                WriteNgSelectPackageAsync(root).GetAwaiter().GetResult();
                return new CommandResult { ReturnCode = 0 };
            }
            if (command.SequenceEqual(["npm", "run", "build"]))
            {
                buildAttempts++;
                return buildAttempts == 1
                    ? new CommandResult { ReturnCode = 1, Stderr = "./src/styles.scss - Error: Module build failed (from ./node_modules/css-loader/dist/cjs.js): Error: Can't resolve '~@ng-select/ng-select/themes/missing.theme.css' in 'src'" }
                    : new CommandResult { ReturnCode = 0 };
            }
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" }, MaxAiRemediationRetries = 3 }, null, null);

        Assert.Equal("failed", result.StringValue("status"));
        Assert.Equal(1, ai.Calls);
        Assert.Empty(result["aiRemediationChanges"]!.AsArray());
        var failure = Assert.Single(result["validationFailures"]!.AsArray().OfType<JsonObject>());
        Assert.True(failure.BoolValue("remediationAttempted"));
        Assert.False(failure.BoolValue("remediationApplied"));
        Assert.True(failure.BoolValue("manualCorrectionRequired"));
        Assert.NotEmpty(result["manualCorrectionRequests"]!.AsArray());
    }

    [Fact]
    public void Report_Includes_Css_Dependency_Import_Root_Cause_And_Business_Logic_Flag()
    {
        var validation = new ValidationResult { Passed = false };
        validation.AiRemediationChanges.Add(new JsonObject
        {
            ["attempt"] = 1,
            ["failedCommand"] = "npm run build",
            ["failureCause"] = "Package style import path is not exported by the installed package under Angular/Webpack package exports rules.",
            ["failureCategory"] = "css_dependency_import",
            ["mode"] = "deterministic",
            ["file"] = "src/assets/css/style.css, src/assets/front/css/front-style.css",
            ["type"] = "style_import_update",
            ["change"] = "updated package style imports to exported package entry points",
            ["reason"] = "Use exported style entry points.",
            ["rootCause"] = "package style import path is not exported by installed package under Angular/Webpack package exports rules",
            ["packageName"] = "@ng-select/ng-select",
            ["installedVersion"] = "8.3.0",
            ["oldImport"] = "@ng-select/ng-select/themes/material.theme.css, @ng-select/ng-select/themes/default.theme.css",
            ["newImport"] = "@ng-select/ng-select/scss/material.theme, @ng-select/ng-select/scss/default.theme",
            ["businessLogicChanged"] = false,
            ["businessFile"] = false,
            ["manualCriticalAttentionRequired"] = false,
            ["reviewNote"] = "package compatibility should be reviewed during dependency cleanup",
            ["validationResultAfterRemediation"] = "passed"
        });

        var report = new MarkdownReportWriter().GenerateReport([], [], new JsonObject { ["from"] = "angular14", ["to"] = "angular15" }, validation);

        Assert.Contains("Failure category: css_dependency_import", report);
        Assert.Contains("Root cause: package style import path is not exported", report);
        Assert.Contains("Package: @ng-select/ng-select", report);
        Assert.Contains("Installed version: 8.3.0", report);
        Assert.Contains("Before: @ng-select/ng-select/themes/material.theme.css", report);
        Assert.Contains("After: @ng-select/ng-select/scss/material.theme", report);
        Assert.Contains("Business logic changed: no", report);
        Assert.Contains("Manual critical attention required: no", report);
        Assert.Contains("Review note: package compatibility should be reviewed during dependency cleanup", report);
    }

    [Fact]
    public async Task Ai_Remediation_Normalizes_Output_Root_Prefixed_File_Paths()
    {
        var root = TestWorkspace.Create();
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """{"scripts":{"build":"ng build"}}""");
        var ai = new StubAi(new JsonObject
        {
            ["summary"] = "third-party declaration references missing global type",
            ["confidence"] = 0.94,
            ["risk"] = "low",
            ["requiresManualCorrection"] = false,
            ["failureCategory"] = "type_declaration",
            ["businessLogicChanged"] = false,
            ["changes"] = new JsonArray(new JsonObject { ["file"] = $"{Path.GetFileName(root)}/src/ngx-pinch-zoom-compat.d.ts", ["type"] = "type_shim", ["reason"] = "node_modules/ngx-pinch-zoom reports TS2304 for VisibilityState", ["before"] = null, ["after"] = "declare type VisibilityState = \"hidden\" | \"visible\";\n" })
        });

        var result = await new AiRemediationPlanner(ai, new PromptLoader()).TryRemediateAsync(Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, root, new StubAdapter(), new ValidationResult { Passed = false, Output = "node_modules/ngx-pinch-zoom/lib/pinch-zoom.component.d.ts:1:18 - error TS2304: Cannot find name 'VisibilityState'." }, 1);

        Assert.True(result.Applied);
        Assert.Equal("src/ngx-pinch-zoom-compat.d.ts", result.Changes.Single().StringValue("file"));
        Assert.True(File.Exists(Path.Combine(root, "src", "ngx-pinch-zoom-compat.d.ts")));
        Assert.False(Directory.Exists(Path.Combine(root, Path.GetFileName(root))));
    }

    [Fact]
    public async Task Angular_Ai_Remediation_Retries_Are_Limited_And_Reported()
    {
        var root = await AngularWorkspace();
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """
{
  "scripts": {"build":"ng build"},
  "dependencies": {"@angular/core": "14.2.0", "@angular/cli": "14.2.0"},
  "devDependencies": {"typescript": "~4.8.4"}
}
""");
        var ai = new QueueAi(
            Plan("script one", "package.json", "ng build", "ng build --configuration production"),
            Plan("config two", "angular.json", "{}", "{\"version\":1}"));
        var runner = AngularRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = AngularVersions(command) };
            if (command.SequenceEqual(["npm", "run", "build"])) return new CommandResult { ReturnCode = 1, Stderr = "src/app/app.component.ts:1:1 - error TS9999: still failing" };
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" }, MaxAiRemediationRetries = 2 }, null, null);

        Assert.Equal("failed", result.StringValue("status"));
        Assert.Equal(2, ai.Calls);
        Assert.Equal(2, result["aiRemediationChanges"]!.AsArray().Count);
        Assert.True(result["validationFailures"]!.AsArray().Count >= 2);
    }

    [Fact]
    public async Task Ai_Remediation_Planner_Timeout_Is_Caught_And_Reported()
    {
        var root = TestWorkspace.Create();
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """{"scripts":{"build":"ng build"}}""");
        var planner = new AiRemediationPlanner(new TimeoutAi(), new PromptLoader());

        var result = await planner.TryRemediateAsync(Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" }, MaxAiRemediationRetries = 2 }, root, new StubAdapter(), new ValidationResult { Passed = false, Output = "$ npm run build\nexit code: 1\nsrc/app/app.component.ts:1:1 - error TS9999: failed", FailureCommand = ["npm", "run", "build"] }, 1);

        Assert.True(result.Attempted);
        Assert.False(result.Applied);
        Assert.Null(result.ManualCorrection);
        var change = Assert.Single(result.Changes);
        Assert.Equal("ai_timeout", change.StringValue("failureCategory"));
        Assert.Equal("idle-timeout", change.StringValue("timeoutType"));
    }

    [Fact]
    public async Task Ai_Remediation_Timeout_Exhaustion_Writes_Manual_Correction()
    {
        var root = TestWorkspace.Create();
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """{"scripts":{"build":"ng build"}}""");
        var planner = new AiRemediationPlanner(new TimeoutAi(), new PromptLoader());

        var result = await planner.TryRemediateAsync(Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" }, MaxAiRemediationRetries = 1 }, root, new StubAdapter(), new ValidationResult { Passed = false, Output = "$ npm run build\nexit code: 1\nfailed", FailureCommand = ["npm", "run", "build"] }, 1);

        Assert.NotNull(result.ManualCorrection);
        Assert.Contains("maxAiRemediationRetries", result.ManualCorrection!.StringValue("reason"));
        Assert.Single(result.Changes);

        var report = new MarkdownReportWriter().GenerateReport([], [], new JsonObject { ["from"] = "angular14", ["to"] = "angular15" }, new ValidationResult { Passed = false, ManualCorrectionRequests = [result.ManualCorrection!], AiRemediationChanges = result.Changes.ToList() });
        Assert.Contains("## AI Remediation Changes", report);
        Assert.Contains("Failure reason: Codex CLI timed out during remediation planning", report);
        Assert.Contains("Timeout type: idle-timeout", report);
        Assert.Contains("## Manual Correction Required", report);
        Assert.Contains("AI remediation timeout details", report);
    }

    [Fact]
    public async Task Reduced_Context_Retry_Is_Used_After_Ai_Timeout()
    {
        var root = TestWorkspace.Create();
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """{"scripts":{"build":"ng build"},"dependencies":{"@angular/core":"14.2.0","problem-package":"1.0.0"}}""");
        var ai = new CapturingAi(Plan("fix script", "package.json", "ng build", "ng build --configuration production"));
        var previousTimeout = new JsonObject { ["attempt"] = 1, ["failureCategory"] = "ai_timeout", ["type"] = "ai_timeout" };

        var result = await new AiRemediationPlanner(ai, new PromptLoader()).TryRemediateAsync(Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" }, MaxAiRemediationRetries = 2 }, root, new StubAdapter(), new ValidationResult { Passed = false, Output = "$ npm run build\nexit code: 1\nCannot find module 'problem-package'\n" + string.Join('\n', Enumerable.Range(1, 300).Select(i => $"line {i}")), FailureCommand = ["npm", "run", "build"], AiRemediationChanges = [previousTimeout] }, 2);

        Assert.True(result.Applied);
        Assert.Contains("\"contextMode\": \"reduced-after-ai-timeout\"", ai.LastUser);
        Assert.Contains("\"validationOutputTail\"", ai.LastUser);
        Assert.DoesNotContain("\"projectFiles\"", ai.LastUser);
        Assert.DoesNotContain("\"stdoutStderr\"", ai.LastUser);
    }

    [Fact]
    public async Task Angular_Ai_Remediation_Timeout_Retries_And_Stops_After_Remediation_Finishes()
    {
        var root = await AngularWorkspace();
        var buildAttempts = 0;
        var ai = new TimeoutThenPlanAi(Plan("safe retry", "package.json", "ng build --configuration production", "ng build --configuration production --verbose"));
        var runner = AngularRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = AngularVersions(command) };
            if (command.SequenceEqual(["npm", "run", "build"]))
            {
                buildAttempts++;
                return buildAttempts == 1
                    ? new CommandResult { ReturnCode = 1, Stderr = "Error: Unknown argument: prod" }
                    : new CommandResult { ReturnCode = 1, Stderr = "src/app/app.component.ts:1:1 - error TS9999: still failing" };
            }
            return new CommandResult { ReturnCode = 0 };
        });
        var progress = new RecordingProgress();
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" }, MaxAiRemediationRetries = 3 }, progress, null);

        Assert.Equal("failed", result.StringValue("status"));
        Assert.Equal(2, ai.Calls);
        Assert.Contains(result["aiRemediationChanges"]!.AsArray().OfType<JsonObject>(), c => c.StringValue("failureCategory") == "ai_timeout" && c.IntValue("attempt") == 2);
        Assert.Contains(ai.LastUser, s => s.Contains("\"contextMode\": \"reduced-after-ai-timeout\"", StringComparison.Ordinal));
        var stopIndex = progress.Messages.FindIndex(m => m.Contains("Stopping migration.", StringComparison.Ordinal));
        var requestIndex = progress.Messages.FindIndex(m => m.Contains("Requesting AI validation remediation attempt 2", StringComparison.Ordinal));
        Assert.True(requestIndex >= 0);
        Assert.True(stopIndex > requestIndex);
        Assert.DoesNotContain(progress.Messages.Take(requestIndex), m => m.Contains("Stopping migration.", StringComparison.Ordinal));
    }

    [Fact]
    public void Report_Contains_Validation_Failures_Ai_Remediation_And_Manual_Correction()
    {
        var validation = new ValidationResult { Passed = false, Errors = "final error", SnapshotPath = "snapshot" };
        validation.ValidationFailures.Add(new JsonObject { ["command"] = "npm run build", ["exitCode"] = 1, ["failureCategory"] = "script", ["errorTail"] = "Unknown argument: prod", ["migrationHop"] = "14 -> 15", ["remediationAttempted"] = true, ["remediationApplied"] = false, ["remediationRejected"] = true, ["manualCorrectionRequired"] = true });
        validation.AiRemediationChanges.Add(new JsonObject { ["attempt"] = 1, ["failedCommand"] = "npm run build", ["failureCause"] = "Angular CLI rejected deprecated --prod flag", ["failureCategory"] = "script", ["mode"] = "deterministic", ["file"] = "package.json", ["type"] = "script_update", ["reason"] = "Replace deprecated flag", ["confidence"] = 1.0, ["risk"] = "low", ["businessLogicChanged"] = false, ["validationResultAfterRemediation"] = "failed" });
        validation.ManualCorrectionRequests.Add(new JsonObject { ["reason"] = "AI remediation disabled or maxAiRemediationRetries is 0", ["failedCommand"] = "npm run build", ["lastError"] = "final error" });

        var report = new MarkdownReportWriter().GenerateReport([], [], new JsonObject { ["from"] = "angular14", ["to"] = "angular15" }, validation);

        Assert.Contains("## Validation Failures", report);
        Assert.Contains("## AI Remediation Changes", report);
        Assert.Contains("## Manual Correction Required", report);
        Assert.Contains("Business logic changed: no", report);
        Assert.Contains("Remediation attempted: True", report);
        Assert.Contains("Remediation applied: False", report);
        Assert.Contains("Remediation rejected: True", report);
        Assert.Contains("Manual correction required: True", report);
    }

    private static async Task<string> AngularWorkspace(string extraDependency = "")
    {
        var root = TestWorkspace.Create();
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), $$"""
{
  "scripts": {"build":"ng build --prod"},
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

    private static async Task WriteNgSelectPackageAsync(string root) =>
        await WritePackageAsync(root, "@ng-select/ng-select", """
{
  "name": "@ng-select/ng-select",
  "version": "8.3.0",
  "exports": {
    "./scss/default.theme": { "style": "./scss/default.theme.scss" },
    "./scss/material.theme": { "style": "./scss/material.theme.scss" },
    "./package.json": { "default": "./package.json" }
  }
}
""");

    private static async Task WritePackageAsync(string root, string packageName, string packageJson)
    {
        var packagePath = Path.Combine(new[] { root, "node_modules" }.Concat(packageName.Split('/')).ToArray());
        Directory.CreateDirectory(packagePath);
        await File.WriteAllTextAsync(Path.Combine(packagePath, "package.json"), packageJson);
        if (packageName == "@ng-select/ng-select")
        {
            Directory.CreateDirectory(Path.Combine(packagePath, "scss"));
            Directory.CreateDirectory(Path.Combine(packagePath, "themes"));
            await File.WriteAllTextAsync(Path.Combine(packagePath, "scss", "material.theme.scss"), "");
            await File.WriteAllTextAsync(Path.Combine(packagePath, "scss", "default.theme.scss"), "");
            await File.WriteAllTextAsync(Path.Combine(packagePath, "themes", "material.theme.css"), "");
            await File.WriteAllTextAsync(Path.Combine(packagePath, "themes", "default.theme.css"), "");
        }
    }

    private static void WritePlainThemePackage(string root)
    {
        var packagePath = Path.Combine(root, "node_modules", "plain-theme");
        Directory.CreateDirectory(packagePath);
        File.WriteAllText(Path.Combine(packagePath, "package.json"), """{"name":"plain-theme","version":"1.0.0"}""");
        File.WriteAllText(Path.Combine(packagePath, "theme.css"), "");
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

    private static JsonObject Plan(string summary, string file, string before, string after) => new()
    {
        ["summary"] = summary,
        ["confidence"] = 0.95,
        ["risk"] = "low",
        ["requiresManualCorrection"] = false,
        ["failureCategory"] = "config",
        ["businessLogicChanged"] = false,
        ["changes"] = new JsonArray(new JsonObject { ["file"] = file, ["type"] = file == "package.json" ? "script_update" : "config_update", ["reason"] = summary, ["before"] = before, ["after"] = after })
    };

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

    private sealed class QueueAi(params JsonObject[] responses) : IAiService
    {
        private readonly Queue<JsonObject> _responses = new(responses);
        public int Calls { get; private set; }
        public Task<JsonObject?> AskAsync(AiConfig config, string system, string user, CancellationToken cancellationToken = default)
        {
            if (!user.Contains("\"failedCommand\"", StringComparison.OrdinalIgnoreCase)) return Task.FromResult<JsonObject?>(null);
            Calls++;
            return Task.FromResult<JsonObject?>(_responses.Count == 0 ? null : _responses.Dequeue());
        }
    }

    private sealed class TimeoutAi : IAiService
    {
        public Task<JsonObject?> AskAsync(AiConfig config, string system, string user, CancellationToken cancellationToken = default) =>
            throw new TimeoutException("codex CLI timed out during remediation planning (idle-timeout): Command timed out (idle-timeout).");
    }

    private sealed class SandboxErrorAi : IAiService
    {
        public Task<JsonObject?> AskAsync(AiConfig config, string system, string user, CancellationToken cancellationToken = default) =>
            throw new InvalidOperationException("Codex CLI failed: npm run build\nAn unhandled exception occurred: spawn EPERM\nFatal error writing debug log file: EPERM: operation not permitted, lstat 'C:\\Users\\SHUBHA~1.YAD'\nnode_modules\\esbuild-wasm\\lib\\main.js");
    }

    private sealed class CapturingAi(JsonObject response) : IAiService
    {
        public string LastUser { get; private set; } = "";
        public Task<JsonObject?> AskAsync(AiConfig config, string system, string user, CancellationToken cancellationToken = default)
        {
            LastUser = user;
            return Task.FromResult<JsonObject?>(response);
        }
    }

    private sealed class TimeoutThenPlanAi(JsonObject response) : IAiService
    {
        public int Calls { get; private set; }
        public List<string> LastUser { get; } = [];
        public Task<JsonObject?> AskAsync(AiConfig config, string system, string user, CancellationToken cancellationToken = default)
        {
            if (!user.Contains("\"failedCommand\"", StringComparison.OrdinalIgnoreCase)) return Task.FromResult<JsonObject?>(null);
            Calls++;
            LastUser.Add(user);
            if (Calls == 1) throw new TimeoutException("codex CLI timed out during remediation planning (idle-timeout): Command timed out (idle-timeout).");
            return Task.FromResult<JsonObject?>(response);
        }
    }

    private sealed class RecordingProgress : IProgressReporter
    {
        public List<string> Messages { get; } = [];
        public bool Verbose => false;
        public bool Quiet => false;
        public void Stage(string stage, string message) => Messages.Add(message);
        public void Error(string stage, string message) => Messages.Add(message);
        public void Detail(string message) => Messages.Add(message);
        public void FinalReport(string reportPath) => Messages.Add(reportPath);
        public void LogFile(string logPath) => Messages.Add(logPath);
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
