using Q3.MigrationAgent.Adapters.Angular;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Core.Analysis;
using Q3.MigrationAgent.Core.Commands;
using Q3.MigrationAgent.Core.Execution;
using Q3.MigrationAgent.Core.Logging;
using Q3.MigrationAgent.Core.Orchestration;
using Q3.MigrationAgent.Core.Planning;
using Q3.MigrationAgent.Core.Reporting;
using Q3.MigrationAgent.Core.Remediation;
using Q3.MigrationAgent.Core.Rollback;
using Q3.MigrationAgent.Core.Validation;
using Q3.MigrationAgent.Shared.Common;
using Q3.MigrationAgent.Shared.Config;
using Q3.MigrationAgent.Shared.DTO;
using System.Text.Json.Nodes;

namespace Q3.MigrationAgent.Tests;

public sealed class AngularAdapterTests
{
    [Fact]
    public async Task Detects_Angular_Project_From_PackageJson()
    {
        var root = TestWorkspace.Create();
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """{"dependencies":{"@angular/core":"14.2.0"}}""");
        var adapter = new AngularAdapter(new CommandRunner());

        Assert.True(await adapter.DetectAsync(root));
    }

    [Fact]
    public void Expands_Angular_14_To_18_Into_Four_Hops()
    {
        var adapter = new AngularAdapter(new CommandRunner());

        var hops = adapter.ExpandMigrationHops("14", "18");

        Assert.Equal(["14 -> 15", "15 -> 16", "16 -> 17", "17 -> 18"], hops.Select(h => $"{h.FromVersion} -> {h.ToVersion}"));
    }

    [Fact]
    public void Migrate_Only_Command_Uses_Version_Pinned_Npx()
    {
        var adapter = new AngularAdapter(new CommandRunner());

        var command = adapter.AngularMigrateOnlyCommand("@angular/core", 14, 15, "15.2.10");

        Assert.Equal(["npx", "--yes", "-p", "@angular/cli@15.2.10", "ng", "update", "@angular/core", "--migrate-only", "--from", "14", "--to", "15"], command);
    }

    [Fact]
    public void Ai_Normal_Install_Converts_To_Safe_Npm_Command()
    {
        var decision = new InstallStrategyDecision
        {
            PackageManager = "npm",
            Mode = "normal",
            Confidence = 0.95,
            Flags = new InstallStrategyFlags { NoAudit = true, NoFund = true, PreferOffline = true }
        };

        Assert.Equal(["npm", "install", "--no-audit", "--no-fund", "--prefer-offline"], AngularAdapter.BuildInstallCommand(decision));
    }

    [Fact]
    public void Legacy_Peer_Deps_Is_Allowed_Only_When_Config_Allows_Or_Peer_Conflict_Exists()
    {
        var decision = new InstallStrategyDecision { Mode = "legacyPeerDeps", Confidence = 0.9, Flags = new InstallStrategyFlags { NoAudit = true, NoFund = true, PreferOffline = true, LegacyPeerDeps = true } };
        var context = InstallContext();
        var config = Config(TestWorkspace.Create()) with { AllowLegacyPeerDepsFallback = false };

        Assert.False(AngularAdapter.ValidateInstallDecision(decision, context, config).Valid);
        Assert.True(AngularAdapter.ValidateInstallDecision(decision, context, config, new InstallFailureClassification("peerDependencyConflict", "", "")).Valid);
    }

    [Fact]
    public void Dangerous_Free_Form_Ai_Command_Is_Rejected()
    {
        var decision = new InstallStrategyDecision { Mode = "", Confidence = 0.95 };

        Assert.False(AngularAdapter.ValidateInstallDecision(decision, InstallContext(), Config(TestWorkspace.Create())).Valid);
    }

    [Fact]
    public void Low_Confidence_Ai_Decision_Is_Rejected_For_Fallback()
    {
        var decision = new InstallStrategyDecision { Mode = "normal", Confidence = 0.4, Flags = new InstallStrategyFlags { NoAudit = true, NoFund = true, PreferOffline = true } };

        Assert.False(AngularAdapter.ValidateInstallDecision(decision, InstallContext(), Config(TestWorkspace.Create())).Valid);
    }

    [Fact]
    public void Npm_Ci_Is_Rejected_When_PackageJson_Changed()
    {
        var decision = new InstallStrategyDecision { Mode = "npmCi", Confidence = 0.95, Flags = new InstallStrategyFlags { NoAudit = true, NoFund = true, PreferOffline = true } };
        var context = InstallContext(hasPackageLock: true, packageJsonChanged: true);

        Assert.False(AngularAdapter.ValidateInstallDecision(decision, context, Config(TestWorkspace.Create())).Valid);
    }

    [Fact]
    public void Skip_Install_Is_Rejected_When_NodeModules_Missing()
    {
        var decision = new InstallStrategyDecision { Mode = "skipInstall", Confidence = 0.95, Flags = new InstallStrategyFlags { NoAudit = true, NoFund = true, PreferOffline = true } };
        var context = InstallContext(nodeModulesExists: false);

        Assert.False(AngularAdapter.ValidateInstallDecision(decision, context, Config(TestWorkspace.Create())).Valid);
    }

    [Fact]
    public void Optional_Dependency_Output_Is_Ignored_When_Exit_Code_Is_Zero()
    {
        var classification = AngularAdapter.ClassifyInstallFailure(["npm", "install"], new CommandResult { ReturnCode = 0, Stderr = "failed optional dependency fsevents" });

        Assert.Equal("none", classification.Category);
    }

    [Fact]
    public async Task Peer_Conflict_Failure_Triggers_Ai_Retry_Decision()
    {
        var root = await AngularWorkspace();
        var ai = new SequenceAi(
            PackagePlan(),
            EmptyConfigPlan(),
            InstallDecision("normalInstall", "npm install --no-audit --no-fund --prefer-offline", "first"),
            InstallDecision("legacyPeerDepsInstall", "npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline", "peer conflict retry", failure: "peerDependencyConflict", fallback: true, retry: true));
        var firstInstall = true;
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["15.0.0","15.2.10"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"]) && firstInstall)
            {
                firstInstall = false;
                return new CommandResult { ReturnCode = 1, Stderr = "ERESOLVE peer dependency" };
            }
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner, ai: ai);

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" }, MaxRetries = 1 }, null, null);

        Assert.Equal("done", result["status"]!.ToString());
        Assert.Equal(4, ai.Calls);
        Assert.Contains(runner.Calls, c => c.Command.Contains("--legacy-peer-deps"));
    }

    [Fact]
    public async Task Fallback_Retry_Uses_Legacy_Peer_Deps_When_Allowed()
    {
        var root = await AngularWorkspace();
        var firstInstall = true;
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["15.0.0","15.2.10"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"]) && firstInstall)
            {
                firstInstall = false;
                return new CommandResult { ReturnCode = 1, Stderr = "ERESOLVE peer dependency" };
            }
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner);

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { MaxRetries = 1 }, null, null);

        Assert.Equal("done", result["status"]!.ToString());
        Assert.Contains(runner.Calls, c => c.Command.Contains("--legacy-peer-deps"));
    }

    [Fact]
    public async Task Invalid_Ai_Json_Falls_Back_Deterministically()
    {
        var root = await AngularWorkspace();
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["15.0.0","15.2.10"]""" };
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner, ai: new SequenceAi(new JsonObject { ["command"] = "npm audit fix" }));

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, null, null);
        var install = result["commands"]!.AsArray().OfType<JsonObject>().First(c => c.StringValue("installMode").Length > 0);

        Assert.Equal("deterministic-safety-fallback", install.StringValue("installStrategySource"));
        Assert.Equal("normalInstall", install.StringValue("installMode"));
        Assert.Equal(["npm", "install", "--no-audit", "--no-fund", "--prefer-offline"], install["command"]!.AsArray().Select(x => x!.ToString()));
    }

    [Fact]
    public async Task Ai_Package_Categorisation_Upgrades_Framework_Tooling_And_Typescript_But_Preserves_Third_Party()
    {
        var root = await AngularWorkspace(extraDependencies: @",""lodash"":""^4.17.0"",""mystery-business"":""1.0.0""");
        var ai = new SequenceAi(PackagePlan(), EmptyConfigPlan());
        var runner = new RecordingRunner(command => command[0] == "npm" && command[1] == "view"
            ? new CommandResult { ReturnCode = 0, Stdout = """["15.0.0","15.2.10"]""" }
            : new CommandResult { ReturnCode = 0 });
        var adapter = new AngularAdapter(runner, ai: ai);

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, null, null);
        var packageJson = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(root, "package.json")))!.AsObject();
        var deps = packageJson["dependencies"]!.AsObject();
        var devDeps = packageJson["devDependencies"]!.AsObject();

        Assert.Equal("^15.2.10", deps["@angular/core"]!.ToString());
        Assert.Equal("^15.2.10", deps["@angular/cli"]!.ToString());
        Assert.Equal("~4.9.5", devDeps["typescript"]!.ToString());
        Assert.Equal("^4.17.0", deps["lodash"]!.ToString());
        Assert.Contains(result["packagesManualReview"]!.AsArray().OfType<JsonObject>(), p => p.StringValue("name") == "mystery-business");
        Assert.True(result.BoolValue("packageCategorisationCompleted"));
        Assert.True(ai.Calls >= 2);
    }

    [Fact]
    public async Task Safe_Ai_Config_Update_Is_Applied_Before_Npm_Install()
    {
        var root = await AngularWorkspace();
        await File.WriteAllTextAsync(Path.Combine(root, "tsconfig.json"), """{"compilerOptions":{"target":"ES2020","paths":{"@app/*":["src/app/*"]}}}""");
        var ai = new SequenceAi(PackagePlan(), new JsonObject
        {
            ["changes"] = new JsonArray(new JsonObject
            {
                ["filePath"] = "tsconfig.json",
                ["changeType"] = "update_tsconfig",
                ["targetAngularHop"] = "14->15",
                ["reason"] = "safe target update",
                ["confidence"] = 0.95,
                ["risk"] = "low",
                ["patch"] = new JsonObject { ["before"] = "\"target\":\"ES2020\"", ["after"] = "\"target\":\"ES2022\"" }
            }),
            ["manualRecommendations"] = new JsonArray()
        });
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["15.2.10"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"]))
            {
                var tsconfig = File.ReadAllText(Path.Combine(root, "tsconfig.json"));
                return new CommandResult { ReturnCode = tsconfig.Contains("\"target\":\"ES2022\"") ? 0 : 1, Stderr = "config was not updated before install" };
            }
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner, ai: ai);

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, null, null);

        Assert.Equal("done", result.StringValue("status"));
        Assert.True(result.BoolValue("tsconfigChanged"));
        Assert.Contains("\"@app/*\"", await File.ReadAllTextAsync(Path.Combine(root, "tsconfig.json")));
    }

    [Fact]
    public async Task Clean_Install_Deletes_NodeModules_And_PackageLock_And_Does_Not_Run_Npx_Or_Global_Cli()
    {
        var root = await AngularWorkspace();
        Directory.CreateDirectory(Path.Combine(root, "node_modules", "leftover"));
        await File.WriteAllTextAsync(Path.Combine(root, "node_modules", "leftover", "x.txt"), "x");
        await File.WriteAllTextAsync(Path.Combine(root, "package-lock.json"), "{}");
        var runner = new RecordingRunner(command => command[0] == "npm" && command[1] == "view"
            ? new CommandResult { ReturnCode = 0, Stdout = """["15.2.10"]""" }
            : new CommandResult { ReturnCode = 0 });
        var adapter = new AngularAdapter(runner);

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root), null, null);

        Assert.True(result.BoolValue("nodeModulesDeleted"));
        Assert.True(result.BoolValue("packageLockDeleted"));
        Assert.False(Directory.Exists(Path.Combine(root, "node_modules")));
        Assert.False(File.Exists(Path.Combine(root, "package-lock.json")));
        Assert.DoesNotContain(runner.Calls, c => c.Command.Contains("npx") || c.Command.Contains("-g") || c.Command.Contains("--migrate-only"));
    }

    [Fact]
    public void Report_Includes_Install_Strategy_Metadata()
    {
        var writer = new MarkdownReportWriter();
        var hop = new MigrationHop(14, 15, "Angular 14 to 15");
        var result = new JsonObject
        {
            ["hop"] = new JsonObject { ["fromVersion"] = 14, ["toVersion"] = 15 },
            ["status"] = "done",
            ["files"] = new JsonArray(),
            ["commands"] = new JsonArray(new JsonObject
            {
                ["command"] = new JsonArray("npm", "install", "--no-audit", "--no-fund", "--prefer-offline"),
                ["returncode"] = 0,
                ["installStrategySource"] = "AI",
                ["installMode"] = "normal",
                ["installReason"] = "lockfile compatible",
                ["installConfidence"] = 0.92,
                ["fallbackUsed"] = false,
                ["retryUsed"] = false,
                ["legacyPeerDepsUsed"] = false,
                ["installElapsedSeconds"] = 12.0
            }),
            ["preflightDependencyAnalysis"] = new JsonObject { ["warnings"] = new JsonArray(), ["blockers"] = new JsonArray(), ["remediations"] = new JsonArray() },
            ["validation"] = new JsonObject { ["passed"] = true }
        };

        var report = writer.GenerateAdapterHopReport(new JsonObject { ["manifest"] = new JsonObject(), ["to"] = "angular15" }, [hop], [result], new ValidationResult { Passed = true });

        Assert.Contains("## Install Strategy Decisions", report);
        Assert.Contains("Source=AI; strategy=normal", report);
        Assert.Contains("lockfile compatible", report);
    }

    [Fact]
    public void Install_Failure_Classifier_Uses_Required_Categories()
    {
        Assert.Equal("peerDependencyConflict", AngularAdapter.ClassifyInstallFailure(["npm", "install"], new CommandResult { ReturnCode = 1, Stderr = "ERESOLVE unable to resolve dependency tree" }).Category);
        Assert.Equal("transientNetworkFailure", AngularAdapter.ClassifyInstallFailure(["npm", "install"], new CommandResult { ReturnCode = 1, Stderr = "ECONNRESET failed while downloading tarball" }).Category);
        Assert.Equal("registryAuthFailure", AngularAdapter.ClassifyInstallFailure(["npm", "install"], new CommandResult { ReturnCode = 1, Stderr = "E401 401 Unauthorized npm login" }).Category);
        Assert.Equal("packageVersionNotFound", AngularAdapter.ClassifyInstallFailure(["npm", "install"], new CommandResult { ReturnCode = 1, Stderr = "ETARGET No matching version found" }).Category);
        Assert.Equal("unknownFailure", AngularAdapter.ClassifyInstallFailure(["npm", "install"], new CommandResult { ReturnCode = 1, Stderr = "postinstall failed" }).Category);
    }

    [Fact]
    public void Install_Command_Guardrails_Reject_Unsafe_Ai_Commands()
    {
        var context = InstallContext();
        var config = Config(TestWorkspace.Create());

        Assert.False(AngularAdapter.ValidateInstallDecision(new InstallStrategyDecision { Strategy = "forceInstall", Mode = "forceInstall", Command = "npm install --force", Confidence = 0.95, Risk = "low" }, context, config).Valid);
        Assert.False(AngularAdapter.ValidateInstallDecision(new InstallStrategyDecision { Strategy = "normalInstall", Mode = "normalInstall", Command = "npm install -g @angular/cli", Confidence = 0.95, Risk = "low" }, context, config).Valid);
        Assert.False(AngularAdapter.ValidateInstallDecision(new InstallStrategyDecision { Strategy = "normalInstall", Mode = "normalInstall", Command = "npx ng update", Confidence = 0.95, Risk = "low" }, context, config).Valid);
        Assert.False(AngularAdapter.ValidateInstallDecision(new InstallStrategyDecision { Strategy = "normalInstall", Mode = "normalInstall", Command = "npm audit fix", Confidence = 0.95, Risk = "low" }, context, config).Valid);
    }

    [Fact]
    public async Task Ai_Normal_Install_Network_Failure_Retries_Same_Normal_Command()
    {
        var root = await AngularWorkspace();
        var ai = new SequenceAi(PackagePlan(), EmptyConfigPlan(),
            InstallDecision("normalInstall", "npm install --no-audit --no-fund --prefer-offline", "first"),
            InstallDecision("retrySameCommand", "npm install --no-audit --no-fund --prefer-offline", "network retry", failure: "transientNetworkFailure", retry: true));
        var normalFailures = 0;
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["15.2.10"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"]) && normalFailures++ == 0) return new CommandResult { ReturnCode = 1, Stderr = "ECONNRESET request failed" };
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner, ai: ai);

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, null, null);

        Assert.Equal("done", result.StringValue("status"));
        Assert.DoesNotContain(runner.Calls, c => c.Command.Contains("--legacy-peer-deps"));
        Assert.True(result.IntValue("transientNetworkRetriesUsed") >= 1);
    }

    [Fact]
    public async Task Ai_Legacy_Peer_Deps_Network_Failure_Retries_Same_Legacy_Command()
    {
        var root = await AngularWorkspace();
        var ai = new SequenceAi(PackagePlan(), EmptyConfigPlan(),
            InstallDecision("normalInstall", "npm install --no-audit --no-fund --prefer-offline", "first"),
            InstallDecision("legacyPeerDepsInstall", "npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline", "peer fallback", failure: "peerDependencyConflict", retry: true, fallback: true),
            InstallDecision("retrySameCommand", "npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline", "network retry", failure: "transientNetworkFailure", retry: true));
        var runnerLegacyFailures = 0;
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["15.2.10"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"]) && !command.Contains("--legacy-peer-deps")) return new CommandResult { ReturnCode = 1, Stderr = "ERESOLVE peer dependency conflict" };
            if (command.Contains("--legacy-peer-deps") && runnerLegacyFailures++ == 0) return new CommandResult { ReturnCode = 1, Stderr = "ECONNRESET typescript-5.1.6.tgz" };
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner, ai: ai);

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, null, null);

        Assert.Equal("done", result.StringValue("status"));
        Assert.True(runner.Calls.Count(c => c.Command.Contains("--legacy-peer-deps")) >= 2);
        Assert.True(result.BoolValue("peerDependencyFallbackUsed"));
    }

    [Fact]
    public async Task Package_Version_Not_Found_And_Registry_Auth_Become_Manual_Review()
    {
        var versionResult = await FailedInstallWithAi("ETARGET No matching version found", "packageVersionNotFound");
        var authResult = await FailedInstallWithAi("E403 403 Forbidden authentication required npm login", "registryAuthFailure");

        Assert.True(versionResult.BoolValue("manualActionRequired"));
        Assert.True(authResult.BoolValue("manualActionRequired"));
        Assert.Equal("failed", versionResult.StringValue("status"));
        Assert.Equal("failed", authResult.StringValue("status"));
    }

    [Fact]
    public async Task Report_Includes_Ai_Install_Strategy_Decision_Fields()
    {
        var root = await AngularWorkspace();
        var ai = new SequenceAi(PackagePlan(), EmptyConfigPlan(), InstallDecision("normalInstall", "npm install --no-audit --no-fund --prefer-offline", "safe first install"));
        var runner = new RecordingRunner(command => command[0] == "npm" && command[1] == "view" ? new CommandResult { ReturnCode = 0, Stdout = """["15.2.10"]""" } : new CommandResult { ReturnCode = 0 });
        var adapter = new AngularAdapter(runner, ai: ai);

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, null, null);

        Assert.True(result.BoolValue("aiInstallStrategyUsed"));
        Assert.True(result.BoolValue("aiInstallStrategyAccepted"));
        var install = result["commands"]!.AsArray().OfType<JsonObject>().First(c => c.StringValue("installMode").Length > 0);
        Assert.Equal("ai-install-strategy", install.StringValue("installStrategySource"));
        Assert.Equal("low", install.StringValue("installRisk"));
    }

    [Fact]
    public async Task Build_Script_Is_Executed_After_Successful_Install()
    {
        var root = await AngularWorkspace();
        var runner = new RecordingRunner(command => command[0] == "npm" && command[1] == "view"
            ? new CommandResult { ReturnCode = 0, Stdout = """["15.2.10"]""" }
            : new CommandResult { ReturnCode = 0 });
        var adapter = new AngularAdapter(runner);

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root), null, null);

        var installIndex = runner.Calls.FindIndex(c => c.Command.Take(2).SequenceEqual(["npm", "install"]));
        var buildIndex = runner.Calls.FindIndex(c => c.Command.SequenceEqual(["npm", "run", "build"]));
        Assert.True(installIndex >= 0);
        Assert.True(buildIndex > installIndex);
        Assert.Equal("done", result.StringValue("status"));
        Assert.True(result["validation"]!.AsObject().BoolValue("buildVerificationAttempted"));
        Assert.Equal("npm-script", result["validation"]!.AsObject().StringValue("buildVerificationExecutor"));
    }

    [Fact]
    public async Task Local_Angular_Cli_Build_Is_Used_When_Build_Script_Is_Missing()
    {
        var root = await AngularWorkspace(hasBuildScript: false);
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["15.2.10"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"])) CreateLocalAngularCli(root);
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner);

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root), null, null);
        var validation = result["validation"]!.AsObject();

        Assert.Equal("done", result.StringValue("status"));
        Assert.Equal("local-angular-cli", validation.StringValue("buildVerificationExecutor"));
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual([LocalNgCommand(), "build"]));
    }

    [Fact]
    public async Task Missing_Build_Script_And_Local_Cli_Fails_Validation()
    {
        var root = await AngularWorkspace(hasBuildScript: false);
        var runner = new RecordingRunner(command => command[0] == "npm" && command[1] == "view"
            ? new CommandResult { ReturnCode = 0, Stdout = """["15.2.10"]""" }
            : new CommandResult { ReturnCode = 0 });
        var adapter = new AngularAdapter(runner);

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root), null, null);
        var validation = result["validation"]!.AsObject();

        Assert.Equal("failed", result.StringValue("status"));
        Assert.False(validation.BoolValue("passed", true));
        Assert.False(validation.BoolValue("buildVerificationAttempted"));
        Assert.Equal("unavailable", validation.StringValue("buildVerificationExecutor"));
        Assert.Contains("no build script or local Angular CLI", validation.StringValue("buildVerificationFailureReason"));
    }

    [Fact]
    public async Task Failed_Build_Stops_Hop_And_Is_Reported()
    {
        var root = await AngularWorkspace();
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["15.2.10"]""" };
            if (command.SequenceEqual(["npm", "run", "build"])) return new CommandResult { ReturnCode = 1, Stderr = "build failed" };
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner);

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root), null, null);

        Assert.Equal("failed", result.StringValue("status"));
        Assert.Equal("buildFailed", result["validation"]!.AsObject().StringValue("buildVerificationFailureCategory"));
    }

    [Fact]
    public async Task Timed_Out_Build_Stops_Hop()
    {
        var root = await AngularWorkspace();
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["15.2.10"]""" };
            if (command.SequenceEqual(["npm", "run", "build"])) return new CommandResult { ReturnCode = 124, TimeoutKind = "total-timeout", Stderr = "timeout" };
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner);

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root), null, null);

        Assert.Equal("failed", result.StringValue("status"));
        Assert.Equal("buildTimeout", result["validation"]!.AsObject().StringValue("buildVerificationFailureCategory"));
    }

    [Fact]
    public async Task Next_Hop_Does_Not_Start_When_Build_Verification_Fails()
    {
        var root = await AngularWorkspace();
        var output = Path.Combine(TestWorkspace.Create(), "out");
        var adapter = new FailingFirstHopAdapter();
        var ai = new NoopAiResolver();
        var orchestrator = new MigrationOrchestrator(
            new FakeRegistry(adapter),
            new FakeRuleLoader(),
            new ProjectAnalyzer(ai),
            new MigrationPlanner(ai),
            new MigrationExecutor(),
            new MigrationValidator(),
            new AiRemediationPlanner(ai),
            new RollbackService(),
            new MarkdownReportWriter(),
            new RunLog(),
            ai);

        var result = await orchestrator.RunMigrationAsync(Config(root) with { OutputPath = output, To = new RuntimeSpec("angular", "16") });

        Assert.False(result.Success);
        Assert.Equal(["14 -> 15"], adapter.ExecutedHops);
    }

    [Fact]
    public async Task Build_Verification_Never_Uses_Global_Ng_Or_Npx()
    {
        var root = await AngularWorkspace();
        var runner = new RecordingRunner(command => command[0] == "npm" && command[1] == "view"
            ? new CommandResult { ReturnCode = 0, Stdout = """["15.2.10"]""" }
            : new CommandResult { ReturnCode = 0 });
        var adapter = new AngularAdapter(runner);

        await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root), null, null);

        Assert.DoesNotContain(runner.Calls, c => c.Command.SequenceEqual(["ng", "build"]));
        Assert.DoesNotContain(runner.Calls, c => c.Command.SequenceEqual(["npx", "ng", "build"]));
    }

    [Fact]
    public async Task Report_Includes_Build_Verification_Command_And_Result()
    {
        var root = await AngularWorkspace();
        var runner = new RecordingRunner(command => command[0] == "npm" && command[1] == "view"
            ? new CommandResult { ReturnCode = 0, Stdout = """["15.2.10"]""" }
            : new CommandResult { ReturnCode = 0 });
        var adapter = new AngularAdapter(runner);
        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root), null, null);

        var report = new MarkdownReportWriter().GenerateAdapterHopReport(new JsonObject { ["manifest"] = new JsonObject(), ["to"] = "angular15" }, [new MigrationHop(14, 15, "Angular 14 to 15")], [result], new ValidationResult { Passed = true });

        Assert.Contains("## Build Verification", report);
        Assert.Contains("command=`npm run build`", report);
        Assert.Contains("passed=True", report);
    }

    [Fact]
    public async Task Validation_Is_Not_Passed_When_Build_Verification_Did_Not_Run()
    {
        var root = await AngularWorkspace(hasBuildScript: false);
        var runner = new RecordingRunner(command => command[0] == "npm" && command[1] == "view"
            ? new CommandResult { ReturnCode = 0, Stdout = """["15.2.10"]""" }
            : new CommandResult { ReturnCode = 0 });
        var adapter = new AngularAdapter(runner);

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root), null, null);
        var validation = result["validation"]!.AsObject();

        Assert.False(validation.BoolValue("buildVerificationAttempted"));
        Assert.False(validation.BoolValue("passed", true));
    }

    private static JsonObject InstallContext(bool hasPackageLock = false, bool packageJsonChanged = false, bool nodeModulesExists = true) => new()
    {
        ["packageManager"] = "npm",
        ["hasPackageLock"] = hasPackageLock,
        ["packageJsonChanged"] = packageJsonChanged,
        ["nodeModulesExists"] = nodeModulesExists,
        ["isRetry"] = false,
        ["peerDependencyPreflight"] = new JsonObject { ["warnings"] = new JsonArray(), ["blockers"] = new JsonArray() }
    };

    private static JsonObject Flags(bool legacy = false) => new()
    {
        ["noAudit"] = true,
        ["noFund"] = true,
        ["preferOffline"] = true,
        ["verbose"] = false,
        ["legacyPeerDeps"] = legacy,
        ["force"] = false
    };

    private static JsonObject InstallDecision(string strategy, string command, string reason, double confidence = 0.95, string risk = "low", string failure = "none", bool retry = false, bool fallback = false) => new()
    {
        ["strategy"] = strategy,
        ["command"] = command,
        ["reason"] = reason,
        ["confidence"] = confidence,
        ["risk"] = risk,
        ["isRetry"] = retry,
        ["isFallback"] = fallback,
        ["maxRetries"] = failure == "transientNetworkFailure" ? 2 : 0,
        ["failureClassification"] = failure
    };

    private static async Task<string> AngularWorkspace(string extraDependencies = "", bool hasBuildScript = true)
    {
        var root = TestWorkspace.Create();
        var scripts = hasBuildScript ? @"""scripts"": {""build"":""ng build""}," : @"""scripts"": {},";
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """
{
  SCRIPTS
  "dependencies": {"@angular/core":"14.2.0","@angular/cli":"14.2.0","rxjs":"7.5.0","zone.js":"0.11.8"EXTRA_DEPENDENCIES},
  "devDependencies": {"typescript":"~4.8.4"}
}
""".Replace("SCRIPTS", scripts).Replace("EXTRA_DEPENDENCIES", extraDependencies));
        await File.WriteAllTextAsync(Path.Combine(root, "angular.json"), "{}");
        return root;
    }

    private static void CreateLocalAngularCli(string root)
    {
        Directory.CreateDirectory(Path.Combine(root, "node_modules", "@angular", "cli"));
        Directory.CreateDirectory(Path.Combine(root, "node_modules", ".bin"));
        File.WriteAllText(Path.Combine(root, "node_modules", "@angular", "cli", "package.json"), """{"name":"@angular/cli"}""");
        File.WriteAllText(Path.Combine(root, LocalNgCommand()), "");
    }

    private static string LocalNgCommand() => OperatingSystem.IsWindows() ? Path.Combine("node_modules", ".bin", "ng.cmd") : "node_modules/.bin/ng";

    private static async Task<JsonObject> FailedInstallWithAi(string stderr, string classification)
    {
        var root = await AngularWorkspace();
        var ai = new SequenceAi(PackagePlan(), EmptyConfigPlan(),
            InstallDecision("normalInstall", "npm install --no-audit --no-fund --prefer-offline", "first"),
            InstallDecision("manualReview", "", "manual review", failure: classification));
        var failed = false;
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["15.2.10"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"]) && !failed)
            {
                failed = true;
                return new CommandResult { ReturnCode = 1, Stderr = stderr };
            }
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner, ai: ai);
        return await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, null, null);
    }

    private static JsonObject PackagePlan() => new()
    {
        ["packages"] = new JsonArray(
            PackageDecision("@angular/core", "14.2.0", "dependencies", "angular_framework_package", "^15.2.10", "upgrade"),
            PackageDecision("@angular/cli", "14.2.0", "dependencies", "angular_tooling_package", "^15.2.10", "upgrade"),
            PackageDecision("rxjs", "7.5.0", "dependencies", "third_party_runtime_package", null, "preserve"),
            PackageDecision("zone.js", "0.11.8", "dependencies", "third_party_runtime_package", null, "preserve"),
            PackageDecision("lodash", "^4.17.0", "dependencies", "third_party_runtime_package", null, "preserve"),
            PackageDecision("mystery-business", "1.0.0", "dependencies", "business_or_unknown_package", null, "manual_review"),
            PackageDecision("typescript", "~4.8.4", "devDependencies", "typescript_runtime_or_compiler_package", "~4.9.5", "upgrade")),
        ["notes"] = new JsonArray()
    };

    private static JsonObject PackageDecision(string name, string current, string section, string category, string? target, string action) => new()
    {
        ["name"] = name,
        ["currentVersion"] = current,
        ["section"] = section,
        ["category"] = category,
        ["targetVersion"] = target,
        ["action"] = action,
        ["reason"] = "test decision",
        ["confidence"] = 0.95,
        ["risk"] = "low"
    };

    private static JsonObject EmptyConfigPlan() => new()
    {
        ["changes"] = new JsonArray(),
        ["manualRecommendations"] = new JsonArray()
    };

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

    private sealed class SequenceAi(params JsonObject[] responses) : IAiService
    {
        public int Calls { get; private set; }
        public Task<JsonObject?> AskAsync(AiConfig config, string system, string user, CancellationToken cancellationToken = default) => Task.FromResult<JsonObject?>(responses[Math.Min(Calls++, responses.Length - 1)]);
    }

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

    private sealed class FakeRegistry(IMigrationAdapter adapter) : IAdapterRegistry
    {
        public Task<IMigrationAdapter> FindAdapterAsync(string runtime, string projectPath, CancellationToken cancellationToken = default) => Task.FromResult(adapter);
    }

    private sealed class FakeRuleLoader : IRuleLoader
    {
        public Task<JsonObject> LoadRulesAsync(string runtime, string fromVersion, string toVersion, CancellationToken cancellationToken = default) => Task.FromResult(new JsonObject());
    }

    private sealed class NoopAiResolver : IAiCliResolver
    {
        public Task<JsonObject?> AskAsync(AiConfig config, string system, string user, CancellationToken cancellationToken = default) => Task.FromResult<JsonObject?>(null);
        public Task<AiConfig> ResolveAsync(AiConfig config, string? cwd, IProgressReporter? progress, string? logPath, CancellationToken cancellationToken = default) => Task.FromResult(config);
    }

    private sealed class FailingFirstHopAdapter : IMigrationAdapter
    {
        public string RuntimeName => "angular";
        public List<string> ExecutedHops { get; } = [];

        public Task<bool> DetectAsync(string projectPath, CancellationToken cancellationToken = default) => Task.FromResult(true);
        public Task<IReadOnlyDictionary<string, string>> CollectProjectFilesAsync(string projectPath, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyDictionary<string, string>>(new Dictionary<string, string>());
        public IReadOnlyList<MigrationHop> ExpandMigrationHops(string fromVersion, string toVersion) => [new MigrationHop(14, 15, "Angular 14 to 15"), new MigrationHop(15, 16, "Angular 15 to 16")];
        public Task<BuildResult> RunBuildAsync(string projectPath, int? timeoutSeconds = null, int? idleTimeoutSeconds = null, CancellationToken cancellationToken = default) => Task.FromResult(new BuildResult(false, "not used"));
        public Task<IReadOnlyList<string>> UpgradePackageAsync(string projectPath, JsonObject change, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<string>>([]);
        public Task<JsonObject> ParseManifestAsync(string projectPath, CancellationToken cancellationToken = default) => Task.FromResult(new JsonObject { ["runtime"] = "angular", ["angularVersion"] = "14", ["packageManager"] = "npm" });

        public Task<JsonObject> ExecuteMigrationHopAsync(string projectPath, MigrationHop hop, JsonObject rules, MigrationConfig config, IProgressReporter? progress, string? logPath, CancellationToken cancellationToken = default)
        {
            ExecutedHops.Add($"{hop.FromVersion} -> {hop.ToVersion}");
            return Task.FromResult(new JsonObject
            {
                ["hop"] = new JsonObject { ["fromVersion"] = hop.FromVersion, ["toVersion"] = hop.ToVersion },
                ["status"] = "failed",
                ["commands"] = new JsonArray(),
                ["files"] = new JsonArray(),
                ["preflightDependencyAnalysis"] = new JsonObject { ["warnings"] = new JsonArray(), ["blockers"] = new JsonArray() },
                ["validation"] = new JsonObject
                {
                    ["passed"] = false,
                    ["errors"] = "Build verification command returned a non-zero exit code.",
                    ["buildVerificationAttempted"] = true,
                    ["buildVerificationCommand"] = "npm run build",
                    ["buildVerificationExecutor"] = "npm-script",
                    ["buildVerificationPassed"] = false,
                    ["buildVerificationSkipped"] = false,
                    ["nextHopStartedOnlyAfterBuildVerificationPassed"] = false
                }
            });
        }
    }
}
