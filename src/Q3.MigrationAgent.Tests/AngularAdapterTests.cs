using Q3.MigrationAgent.AI.Prompts;
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
    public void Migrate_Only_Command_Uses_Ng_From_Path()
    {
        var adapter = new AngularAdapter(new CommandRunner());

        var command = adapter.AngularMigrateOnlyCommand("@angular/core", 14, 15, "15.2.10");

        Assert.Equal(["ng", "update", "@angular/core", "--migrate-only", "--from", "14", "--to", "15"], command);
    }

    [Fact]
    public void Official_Angular_Update_Command_Uses_Version_Pinned_Target_Packages()
    {
        var adapter = new AngularAdapter(new CommandRunner());

        var command = adapter.OfficialAngularUpdateCommand(19);

        Assert.Equal(["ng", "update", "@angular/cli@19", "@angular/core@19"], command);
    }

    [Fact]
    public void Official_Angular_Migrate_Only_Command_Uses_Npx_Pinned_Cli_With_Version_Check_Disabled()
    {
        var adapter = new AngularAdapter(new CommandRunner());

        var command = adapter.OfficialAngularMigrateOnlyCommand(18, 19, ["@angular/core"]);

        Assert.Equal(["NG_DISABLE_VERSION_CHECK=1", "npx", "-p", "@angular/cli@19", "ng", "update", "@angular/core", "--migrate-only", "--from", "18", "--to", "19", "--allow-dirty"], command);
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

        Assert.Equal(["npm", "install", "--ignore-scripts", "--no-audit", "--no-fund"], AngularAdapter.BuildInstallCommand(decision));
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
    public void ManualReview_Install_Strategy_Cannot_Block_First_Install_After_PackageJson_Changed()
    {
        var decision = new InstallStrategyDecision { PackageManager = "npm", Mode = "manualReview", Confidence = 0.95, Risk = "medium", Flags = new InstallStrategyFlags { NoAudit = true, NoFund = true, PreferOffline = true } };
        var context = InstallContext(packageJsonChanged: true);

        var validation = AngularAdapter.ValidateInstallDecision(decision, context, Config(TestWorkspace.Create()));

        Assert.False(validation.Valid);
        Assert.Equal(["npm", "install", "--ignore-scripts", "--no-audit", "--no-fund"], AngularAdapter.BuildInstallCommand(decision));
    }

    [Fact]
    public void LegacyPeerDeps_Is_Rejected_For_Framework_Critical_Mismatch()
    {
        var decision = new InstallStrategyDecision
        {
            PackageManager = "npm",
            Mode = "legacyPeerDepsInstall",
            Command = "npm install --ignore-scripts --legacy-peer-deps --no-audit --no-fund",
            Confidence = 0.95,
            Risk = "medium",
            Flags = new InstallStrategyFlags { NoAudit = true, NoFund = true, PreferOffline = true, LegacyPeerDeps = true }
        };
        var context = InstallContext();
        context["previousInstallFailureOutput"] = """npm ERR! peer typescript@">=5.2 <5.5" from @angular/compiler-cli@17.3.0""";

        var validation = AngularAdapter.ValidateInstallDecision(decision, context, Config(TestWorkspace.Create()), new InstallFailureClassification("peerDependencyConflict", "", ""));

        Assert.False(validation.Valid);
        Assert.Contains("framework-critical", validation.Reason);
    }

    [Fact]
    public async Task Third_Party_Angular_Peer_Conflict_Upgrades_Blocking_Package_Before_Legacy_Peer_Deps()
    {
        var root = await Angular18Workspace(extraDependencies: @",""@ng-bootstrap/ng-bootstrap"":""^17.0.0"",""bootstrap"":""^5.3.2""");
        var ai = new SequenceAi(
            PackagePlan19(),
            VersionRecommendations19(),
            EmptyCriticalAlignment(18, 19),
            EmptyConfigPlan(),
            InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "safe install"),
            InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "retry after third-party peer remediation"));
        var installRuns = 0;
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view" && command[2] == "@ng-bootstrap/ng-bootstrap@^18.0.0") return new CommandResult { ReturnCode = 0, Stdout = """["18.0.0","18.0.4"]""" };
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["19.2.25","5.5.4","0.15.1"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"]))
            {
                installRuns++;
                if (installRuns == 1)
                {
                    return new CommandResult
                    {
                        ReturnCode = 1,
                        Stderr = """
npm ERR! ERESOLVE unable to resolve dependency tree
npm ERR! Found: @angular/common@19.2.25
npm ERR! peer @angular/common@"^18.0.0" from @ng-bootstrap/ng-bootstrap@17.0.1
"""
                    };
                }
                CreateLocalAngularCli(root, 19);
                return new CommandResult { ReturnCode = 0 };
            }
            if (command.SequenceEqual(["npm", "run", "build"])) return new CommandResult { ReturnCode = 0 };
            return new CommandResult { ReturnCode = 0 };
        });

        var result = await new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader()).ExecuteMigrationHopAsync(root, new MigrationHop(18, 19, "Angular 18 to 19"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "18"), To = new RuntimeSpec("angular", "19"), Ai = new AiConfig { UseAi = true, Provider = "codex" } }, null, null);
        var deps = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(root, "package.json")))!["dependencies"]!.AsObject();

        Assert.Equal("done", result.StringValue("status"));
        Assert.Equal("^18.0.0", deps["@ng-bootstrap/ng-bootstrap"]!.ToString());
        Assert.Equal("^5.3.2", deps["bootstrap"]!.ToString());
        Assert.False(result.BoolValue("installFallbackUsed"));
        Assert.DoesNotContain(runner.Calls, c => c.Command.Contains("--legacy-peer-deps"));
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "@ng-bootstrap/ng-bootstrap@^18.0.0", "version", "--json"]));
        Assert.Contains(result["cleanInstallSummary"]!["thirdPartyPeerConflictRemediations"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "@ng-bootstrap/ng-bootstrap" && r.StringValue("toVersion") == "^18.0.0");
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
            new JsonObject { ["targetAngularMajor"] = 13, ["recommendations"] = new JsonArray(), ["warnings"] = new JsonArray() },
            EmptyConfigPlan(),
            InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "first"),
            InstallDecision("legacyPeerDepsInstall", "npm install --ignore-scripts --legacy-peer-deps --no-audit --no-fund", "peer conflict retry", failure: "peerDependencyConflict", fallback: true, retry: true));
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
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" }, MaxRetries = 1 }, null, null);

        Assert.Equal("done", result["status"]!.ToString());
        Assert.Equal(1, ai.SystemPrompts.Count(IsPackageVersionPrompt));
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
        var adapter = new AngularAdapter(runner, ai: new SequenceAi(new JsonObject { ["command"] = "npm audit fix" }), promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, null, null);
        var install = result["commands"]!.AsArray().OfType<JsonObject>().First(c => c.StringValue("installMode").Length > 0);

        Assert.Equal("deterministic-safety-fallback", install.StringValue("installStrategySource"));
        Assert.Equal("normalInstall", install.StringValue("installMode"));
        Assert.Equal(["npm", "install", "--ignore-scripts", "--no-audit", "--no-fund"], install["command"]!.AsArray().Select(x => x!.ToString()));
    }

    [Fact]
    public async Task Ai_Package_Categorisation_Upgrades_Framework_Tooling_And_Typescript_But_Preserves_Third_Party()
    {
        var root = await AngularWorkspace(extraDependencies: @",""lodash"":""^4.17.0"",""mystery-business"":""1.0.0""");
        var ai = new SequenceAi(PackagePlan(), VersionRecommendations(), EmptyConfigPlan());
        var runner = new RecordingRunner(command => command[0] == "npm" && command[1] == "view"
            ? new CommandResult { ReturnCode = 0, Stdout = """["15.0.0","15.2.10"]""" }
            : new CommandResult { ReturnCode = 0 });
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, null, null);
        var packageJson = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(root, "package.json")))!.AsObject();
        var deps = packageJson["dependencies"]!.AsObject();
        var devDeps = packageJson["devDependencies"]!.AsObject();

        Assert.Equal("15.2.10", deps["@angular/core"]!.ToString());
        Assert.Equal("15.2.10", deps["@angular/cli"]!.ToString());
        Assert.Equal("~4.9.5", devDeps["typescript"]!.ToString());
        Assert.Equal("^4.17.0", deps["lodash"]!.ToString());
        Assert.Contains(result["packagesManualReview"]!.AsArray().OfType<JsonObject>(), p => p.StringValue("name") == "mystery-business");
        Assert.True(result.BoolValue("packageCategorisationCompleted"));
        Assert.True(ai.Calls >= 3);
    }

    [Fact]
    public async Task Angular_13_To_14_Preserves_NgxPinchZoom_Before_Validation()
    {
        var root = await Angular13Workspace(extraDependencies: @",""ngx-pinch-zoom"":""^2.5.6""");
        var ai = new SequenceAi(new JsonObject
        {
            ["packages"] = new JsonArray(
                PackageDecision("@angular/core", "~13.1.0", "dependencies", "angular_framework_package", "^14.2.13", "upgrade"),
                PackageDecision("@angular/common", "~13.1.0", "dependencies", "angular_framework_package", "^14.2.13", "upgrade"),
                PackageDecision("@angular/compiler", "~13.1.0", "dependencies", "angular_framework_package", "^14.2.13", "upgrade"),
                PackageDecision("@angular/cli", "~13.1.2", "devDependencies", "angular_tooling_package", "^14.2.13", "upgrade"),
                PackageDecision("@angular/compiler-cli", "~13.1.0", "devDependencies", "angular_tooling_package", "^14.2.13", "upgrade"),
                PackageDecision("@angular-devkit/build-angular", "^13.3.10", "devDependencies", "angular_tooling_package", "^14.2.13", "upgrade"),
                PackageDecision("typescript", "~4.5.2", "devDependencies", "typescript_runtime_or_compiler_package", "~4.8.4", "upgrade"),
                PackageDecision("ngx-pinch-zoom", "^2.5.6", "dependencies", "angular_ui_or_extension_package", null, "preserve")),
            ["notes"] = new JsonArray()
        }, VersionRecommendations(
                VersionRecommendation("@angular/core", "~13.1.0", "^14.2.13", "Angular framework package aligned."),
                VersionRecommendation("@angular/common", "~13.1.0", "^14.2.13", "Angular framework package aligned."),
                VersionRecommendation("@angular/compiler", "~13.1.0", "^14.2.13", "Angular framework package aligned."),
                VersionRecommendation("@angular/cli", "~13.1.2", "^14.2.13", "Angular CLI aligned."),
                VersionRecommendation("@angular/compiler-cli", "~13.1.0", "^14.2.13", "Angular compiler aligned."),
                VersionRecommendation("@angular-devkit/build-angular", "^13.3.10", "^14.2.13", "Angular DevKit aligned."),
                VersionRecommendation("typescript", "~4.5.2", "~4.8.4", "TypeScript aligned.")),
            EmptyCriticalAlignment(13, 14),
            EmptyConfigPlan(),
            InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "safe install"));
        var runner = new RecordingRunner(command => command[0] == "npm" && command[1] == "view" ? new CommandResult { ReturnCode = 0, Stdout = """["14.2.13","4.8.4"]""" } : new CommandResult { ReturnCode = 0 });

        var result = await new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader()).ExecuteMigrationHopAsync(root, new MigrationHop(13, 14, "Angular 13 to 14"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "13"), To = new RuntimeSpec("angular", "14"), Ai = new AiConfig { UseAi = true, Provider = "codex" } }, null, null);
        var deps = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(root, "package.json")))!["dependencies"]!.AsObject();

        Assert.Equal("done", result.StringValue("status"));
        Assert.Equal("^2.5.6", deps["ngx-pinch-zoom"]!.ToString());
        Assert.Contains(result["packagesPreserved"]!.AsArray().OfType<JsonObject>(), p => p.StringValue("name") == "ngx-pinch-zoom");
        Assert.Empty(result["thirdPartyValidationBlockers"]!.AsArray());
    }

    [Fact]
    public async Task Ai_Package_Version_Recommendations_Replace_Invalid_Angular_14_Targets()
    {
        var root = TestWorkspace.Create();
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """
{
  "scripts": {"build":"ng build"},
  "dependencies": {
    "@angular/core": "^13.3.0",
    "@angular-slider/ngx-slider": "^13.0.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^13.1.0"
  }
}
""");
        await File.WriteAllTextAsync(Path.Combine(root, "angular.json"), "{}");
        var ai = new SequenceAi(new JsonObject
        {
            ["packages"] = new JsonArray(
                PackageDecision("@angular/core", "^13.3.0", "dependencies", "angular_framework_package", "^14.3.0", "upgrade"),
                PackageDecision("@angular-slider/ngx-slider", "^13.0.0", "dependencies", "angular_ui_or_extension_package", null, "preserve"),
                PackageDecision("@angular-devkit/build-angular", "^13.1.0", "devDependencies", "angular_tooling_package", "^14.3.0", "upgrade")),
            ["notes"] = new JsonArray()
        }, VersionRecommendations(
            VersionRecommendation("@angular/core", "^13.3.0", "^14.2.13", "Angular framework package aligned with published Angular 14.2 stable line."),
            VersionRecommendation("@angular-devkit/build-angular", "^13.1.0", "^14.2.13", "Angular DevKit build tooling aligned with published Angular 14.2 stable line."),
            VersionRecommendation("@angular-slider/ngx-slider", "^13.0.0", "^14.0.0", "Smallest compatible Angular 14 major for this Angular UI package.")),
            EmptyConfigPlan(),
            InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "safe first install"));
        var runner = new RecordingRunner(command => command[0] == "npm" && command[1] == "view" ? new CommandResult { ReturnCode = 0, Stdout = """["14.3.0"]""" } : new CommandResult { ReturnCode = 0 });
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(13, 14, "Angular 13 to 14"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "13"), To = new RuntimeSpec("angular", "14"), Ai = new AiConfig { UseAi = true, Provider = "codex" } }, null, null);
        var packageJsonText = await File.ReadAllTextAsync(Path.Combine(root, "package.json"));
        var packageJson = JsonNode.Parse(packageJsonText)!.AsObject();
        var deps = packageJson["dependencies"]!.AsObject();
        var devDeps = packageJson["devDependencies"]!.AsObject();

        Assert.Equal("done", result.StringValue("status"));
        Assert.Equal("14.3.0", devDeps["@angular-devkit/build-angular"]!.ToString());
        Assert.Equal("^13.0.0", deps["@angular-slider/ngx-slider"]!.ToString());
        Assert.DoesNotContain("^14.3.0", packageJsonText);
        Assert.Equal(1, ai.SystemPrompts.Count(IsPackageVersionPrompt));
        Assert.Contains(result["aiPackageVersionRecommendationsAccepted"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "@angular-devkit/build-angular");
    }

    [Fact]
    public async Task AngularPackageSuggestions_WithCaretSemverTargets_AreNotRejected()
    {
        var root = await Angular13Workspace();
        var ai = new SequenceAi(new JsonObject
        {
            ["packages"] = new JsonArray(
                PackageDecision("@angular/core", "~13.1.0", "dependencies", "angular_framework_package", "^14.3.0", "upgrade"),
                PackageDecision("@angular/common", "~13.1.0", "dependencies", "angular_framework_package", "^14.3.0", "upgrade"),
                PackageDecision("@angular/compiler", "~13.1.0", "dependencies", "angular_framework_package", "^14.3.0", "upgrade"),
                PackageDecision("@angular/cli", "~13.1.2", "devDependencies", "angular_tooling_package", "^14.3.0", "upgrade"),
                PackageDecision("@angular/compiler-cli", "~13.1.0", "devDependencies", "angular_tooling_package", "^14.3.0", "upgrade"),
                PackageDecision("@angular-devkit/build-angular", "^13.3.10", "devDependencies", "angular_tooling_package", "^14.2.13", "upgrade"),
                PackageDecision("typescript", "~4.5.2", "devDependencies", "typescript_runtime_or_compiler_package", "~4.8.4", "upgrade")),
            ["notes"] = new JsonArray()
        }, EmptyVersionRecommendations(14), EmptyCriticalAlignment(13, 14), EmptyConfigPlan());
        var adapter = new AngularAdapter(SuccessfulAngularRunner("14.3.0"), ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(13, 14, "Angular 13 to 14"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "13"), To = new RuntimeSpec("angular", "14"), Ai = new AiConfig { UseAi = true, Provider = "codex" } }, null, null);
        var packageJson = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(root, "package.json")))!.AsObject();
        var deps = packageJson["dependencies"]!.AsObject();
        var devDeps = packageJson["devDependencies"]!.AsObject();
        var rejected = result["rejectedAiPackageSuggestions"]!.AsArray().OfType<JsonObject>().Select(r => r.StringValue("rejectionReason")).ToArray();

        Assert.True(result.StringValue("status") == "done", result.ToJsonString(JsonHelpers.SerializerOptions));
        Assert.Equal("14.3.0", deps["@angular/core"]!.ToString());
        Assert.Equal("14.3.0", deps["@angular/common"]!.ToString());
        Assert.Equal("14.3.0", deps["@angular/compiler"]!.ToString());
        Assert.Equal("14.3.0", devDeps["@angular/cli"]!.ToString());
        Assert.Equal("14.3.0", devDeps["@angular/compiler-cli"]!.ToString());
        Assert.Equal("14.3.0", devDeps["@angular-devkit/build-angular"]!.ToString());
        Assert.Equal("~4.8.4", devDeps["typescript"]!.ToString());
        Assert.DoesNotContain(rejected, reason => reason.Contains("Upgrade target version was missing or invalid"));
    }

    [Fact]
    public async Task Angular13To14_CriticalTypeScriptAlignment_Is_Final_And_Proceeds_To_Install()
    {
        var root = await Angular13Workspace();
        var tsDecision = PackageDecision("typescript", "~4.5.2", "devDependencies", "typescript_runtime_or_compiler_package", "~4.8.4", "upgrade");
        tsDecision["risk"] = "high";
        var lowConfidenceThirdParty = PackageDecision("ngx-bootstrap", "^7.1.0", "dependencies", "angular_ui_or_extension_package", null, "preserve");
        lowConfidenceThirdParty["confidence"] = 0.35;
        var packagePath = Path.Combine(root, "package.json");
        var packageJson = JsonNode.Parse(await File.ReadAllTextAsync(packagePath))!.AsObject();
        packageJson["dependencies"]!.AsObject()["ngx-bootstrap"] = "^7.1.0";
        await File.WriteAllTextAsync(packagePath, packageJson.ToJsonString(JsonHelpers.SerializerOptions) + Environment.NewLine);
        var ai = new SequenceAi(new JsonObject
        {
            ["packages"] = new JsonArray(
                PackageDecision("@angular/core", "~13.1.0", "dependencies", "angular_framework_package", "~14.3.0", "upgrade"),
                PackageDecision("@angular/common", "~13.1.0", "dependencies", "angular_framework_package", "~14.3.0", "upgrade"),
                PackageDecision("@angular/compiler", "~13.1.0", "dependencies", "angular_framework_package", "~14.3.0", "upgrade"),
                lowConfidenceThirdParty,
                PackageDecision("@angular/cli", "~13.1.2", "devDependencies", "angular_tooling_package", "~14.2.13", "upgrade"),
                PackageDecision("@angular/compiler-cli", "~13.1.0", "devDependencies", "angular_tooling_package", "~14.3.0", "upgrade"),
                PackageDecision("@angular-devkit/build-angular", "^13.3.10", "devDependencies", "angular_tooling_package", "~14.2.13", "upgrade"),
                tsDecision),
            ["notes"] = new JsonArray()
        }, VersionRecommendations(
            VersionRecommendation("typescript", "~4.5.2", "~5.5.4", "Bad late TypeScript recommendation.", risk: "high")),
            CriticalAlignment(CriticalRecommendation("typescript", "~4.5.2", "~4.8.4", "Angular 14 compiler-cli supports TypeScript >=4.6 <4.9.")),
            EmptyConfigPlan(),
            InstallDecision("manualReview", "", "TypeScript requires manual review.", confidence: 0.95, risk: "medium"));
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view")
            {
                if (command[2].StartsWith("typescript@", StringComparison.OrdinalIgnoreCase)) return new CommandResult { ReturnCode = 0, Stdout = """["4.8.4"]""" };
                if (command[2].StartsWith("@angular/cli@", StringComparison.OrdinalIgnoreCase) || command[2].StartsWith("@angular-devkit/build-angular@", StringComparison.OrdinalIgnoreCase)) return new CommandResult { ReturnCode = 0, Stdout = """["14.2.13"]""" };
                return new CommandResult { ReturnCode = 0, Stdout = """["14.3.0"]""" };
            }
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(13, 14, "Angular 13 to 14"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "13"), To = new RuntimeSpec("angular", "14"), Ai = new AiConfig { UseAi = true, Provider = "codex" }, PackageVersionVerificationMode = "strict-npm-view" }, null, null);
        var updatedPackageJson = JsonNode.Parse(await File.ReadAllTextAsync(packagePath))!.AsObject();
        var resolvedTs = result["packageTargetValidation"]!["resolved"]!.AsArray().OfType<JsonObject>().First(r => r.StringValue("packageName") == "typescript");

        Assert.Equal("done", result.StringValue("status"));
        Assert.Equal("~4.8.4", updatedPackageJson["devDependencies"]!["typescript"]!.ToString());
        Assert.Equal("skipped", resolvedTs.StringValue("npmValidationResult"));
        Assert.Equal("~4.8.4", resolvedTs.StringValue("finalAcceptedVersion"));
        Assert.Contains(result["angularCriticalDependencyAlignmentAccepted"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "typescript");
        Assert.DoesNotContain(result["rejectedAiPackageSuggestions"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("name", r.StringValue("packageName")) == "typescript");
        Assert.DoesNotContain(result["aiPackageVersionRecommendationsRejected"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "typescript");
        Assert.DoesNotContain(result["packagesManualReview"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("name") == "typescript" || r.StringValue("name") == "ngx-bootstrap");
        Assert.Contains(result["thirdPartyPackageDecisions"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("name") == "ngx-bootstrap");
        Assert.DoesNotContain(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "typescript@~4.8.4", "version", "--json"]));
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["npm", "install", "--ignore-scripts", "--no-audit", "--no-fund"]));
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["npm", "run", "build"]));
        Assert.DoesNotContain(result["commands"]!.AsArray().OfType<JsonObject>(), c => string.IsNullOrWhiteSpace(string.Join(" ", c["command"]?.AsArray()?.Select(x => x?.ToString()) ?? [])));
        Assert.False(result.BoolValue("manualActionRequired"));
    }

    [Fact]
    public async Task Critical_Dependency_NoOp_Target_Is_Discarded_Without_Package_Patch()
    {
        var root = await Angular13Workspace();
        var packagePath = Path.Combine(root, "package.json");
        var packageJson = JsonNode.Parse(await File.ReadAllTextAsync(packagePath))!.AsObject();
        packageJson["devDependencies"]!.AsObject()["typescript"] = "~4.8.4";
        await File.WriteAllTextAsync(packagePath, packageJson.ToJsonString(JsonHelpers.SerializerOptions) + Environment.NewLine);
        var ai = new SequenceAi(new JsonObject
        {
            ["packages"] = new JsonArray(
                PackageDecision("@angular/core", "~13.1.0", "dependencies", "angular_framework_package", "^14.2.13", "upgrade"),
                PackageDecision("@angular/common", "~13.1.0", "dependencies", "angular_framework_package", "^14.2.13", "upgrade"),
                PackageDecision("@angular/compiler", "~13.1.0", "dependencies", "angular_framework_package", "^14.2.13", "upgrade"),
                PackageDecision("@angular/cli", "~13.1.2", "devDependencies", "angular_tooling_package", "^14.2.13", "upgrade"),
                PackageDecision("@angular/compiler-cli", "~13.1.0", "devDependencies", "angular_tooling_package", "^14.2.13", "upgrade"),
                PackageDecision("@angular-devkit/build-angular", "^13.3.10", "devDependencies", "angular_tooling_package", "^14.2.13", "upgrade"),
                PackageDecision("typescript", "~4.5.2", "devDependencies", "typescript_runtime_or_compiler_package", "~4.8.4", "upgrade")),
            ["notes"] = new JsonArray()
        }, EmptyVersionRecommendations(14),
            CriticalAlignment(CriticalRecommendation("typescript", "~4.8.4", "~4.8.4", "Angular compiler-cli peer is already satisfied.")),
            EmptyConfigPlan(),
            InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "safe install"));
        var runner = new RecordingRunner(command => command[0] == "npm" && command[1] == "view" ? new CommandResult { ReturnCode = 0, Stdout = """["14.2.13"]""" } : new CommandResult { ReturnCode = 0 });

        var result = await new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader())
            .ExecuteMigrationHopAsync(root, new MigrationHop(13, 14, "Angular 13 to 14"), new JsonObject(), Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, null, null);
        var devDeps = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(root, "package.json")))!["devDependencies"]!.AsObject();

        Assert.Equal("~4.8.4", devDeps["typescript"]!.ToString());
        Assert.DoesNotContain(result["packageUpgradesApplied"]!.AsArray().OfType<JsonObject>(), p => p.StringValue("name") == "typescript");
        Assert.Contains(result["packageTargetValidation"]!["discarded"]!.AsArray().OfType<JsonObject>(), p => p.StringValue("packageName") == "typescript" && p.BoolValue("discardedNoOpRecommendation"));
    }

    [Fact]
    public async Task Peer_Conflict_Runtime_Mismatch_Patches_Actual_Peer_Package_Not_Requesting_Package()
    {
        var root = await Angular19Workspace();
        var ai = new SequenceAi(PackagePlan20(preserveTypeScript: true), EmptyVersionRecommendations(20), EmptyCriticalAlignment(19, 20), EmptyConfigPlan(), InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "safe install"));
        var firstInstall = true;
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["20.0.0","5.8.3"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"]) && firstInstall)
            {
                firstInstall = false;
                return new CommandResult
                {
                    ReturnCode = 1,
                    Stderr = """
npm ERR! ERESOLVE unable to resolve dependency tree
npm ERR! peer typescript@">=5.8 <6.0" from @angular/compiler-cli@20.0.0
"""
                };
            }
            return new CommandResult { ReturnCode = 0 };
        });

        var result = await new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader())
            .ExecuteMigrationHopAsync(root, new MigrationHop(19, 20, "Angular 19 to 20"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "19"), To = new RuntimeSpec("angular", "20"), Ai = new AiConfig { UseAi = true, Provider = "codex" } }, null, null);
        var devDeps = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(root, "package.json")))!["devDependencies"]!.AsObject();

        Assert.Equal("done", result.StringValue("status"));
        Assert.Equal("~5.8.3", devDeps["typescript"]!.ToString());
        Assert.Equal("20.0.0", devDeps["@angular/compiler-cli"]!.ToString());
        Assert.Contains(result["peerDependencyConflicts"]!.AsArray().OfType<JsonObject>(), c => c.StringValue("conflictingPackage") == "typescript" && c.StringValue("requiredByPackage") == "@angular/compiler-cli");
        Assert.DoesNotContain(runner.Calls, c => c.Command.Contains("--legacy-peer-deps"));
    }

    [Fact]
    public async Task Peer_Conflict_Remediation_Patches_All_Conflicts_Before_Retry()
    {
        var root = await Angular18Workspace(extraDependencies: @",""@ng-bootstrap/ng-bootstrap"":""^17.0.0"",""ngx-bootstrap"":""^6.0.0""");
        var ai = new SequenceAi(PackagePlan19(), VersionRecommendations19(), EmptyCriticalAlignment(18, 19), EmptyConfigPlan(), InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "safe install"));
        var firstInstall = true;
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view" && command[2] == "@ng-bootstrap/ng-bootstrap@^18.0.0") return new CommandResult { ReturnCode = 0, Stdout = """["18.0.4"]""" };
            if (command[0] == "npm" && command[1] == "view" && command[2] == "ngx-bootstrap@^11.0.0") return new CommandResult { ReturnCode = 0, Stdout = """["11.0.2"]""" };
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["19.0.0","5.5.4","0.15.1"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"]) && firstInstall)
            {
                firstInstall = false;
                return new CommandResult
                {
                    ReturnCode = 1,
                    Stderr = """
npm ERR! ERESOLVE unable to resolve dependency tree
npm ERR! peer @angular/common@"^18.0.0" from @ng-bootstrap/ng-bootstrap@17.0.1
npm ERR! peer @angular/core@"^14.0.0" from ngx-bootstrap@6.2.0
"""
                };
            }
            return new CommandResult { ReturnCode = 0 };
        });

        var result = await new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader())
            .ExecuteMigrationHopAsync(root, new MigrationHop(18, 19, "Angular 18 to 19"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "18"), To = new RuntimeSpec("angular", "19"), Ai = new AiConfig { UseAi = true, Provider = "codex" } }, null, null);
        var deps = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(root, "package.json")))!["dependencies"]!.AsObject();
        var remediations = result["cleanInstallSummary"]!["thirdPartyPeerConflictRemediations"]!.AsArray().OfType<JsonObject>().ToArray();

        Assert.Equal("done", result.StringValue("status"));
        Assert.Equal("^18.0.0", deps["@ng-bootstrap/ng-bootstrap"]!.ToString());
        Assert.Equal("^11.0.0", deps["ngx-bootstrap"]!.ToString());
        Assert.Equal(2, remediations.Length);
        Assert.Equal(2, runner.Calls.Count(c => c.Command.Take(2).SequenceEqual(["npm", "install"])));
        Assert.DoesNotContain(runner.Calls, c => c.Command.Contains("--legacy-peer-deps"));
    }

    [Fact]
    public async Task Preinstall_Validation_Fails_Fast_For_Mixed_Angular_Framework_Patches()
    {
        var root = TestWorkspace.Create();
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """
{
  "scripts": {"build":"ng build"},
  "dependencies": {"@angular/core":"20.1.8","@angular/common":"20.1.8","@angular/compiler":"20.3.25","rxjs":"7.8.1","zone.js":"0.15.0"},
  "devDependencies": {"@angular/compiler-cli":"20.1.8","typescript":"~5.8.3"}
}
""");
        await File.WriteAllTextAsync(Path.Combine(root, "angular.json"), "{}");
        var ai = new SequenceAi(new JsonObject
            {
                ["packages"] = new JsonArray(
                    PackageDecision("@angular/core", "20.1.8", "dependencies", "angular_framework_package", null, "preserve"),
                    PackageDecision("@angular/common", "20.1.8", "dependencies", "angular_framework_package", null, "preserve"),
                    PackageDecision("@angular/compiler", "20.3.25", "dependencies", "angular_framework_package", null, "preserve"),
                    PackageDecision("@angular/compiler-cli", "20.1.8", "devDependencies", "angular_tooling_package", null, "preserve"),
                    PackageDecision("typescript", "~5.8.3", "devDependencies", "typescript_runtime_or_compiler_package", null, "preserve")),
                ["notes"] = new JsonArray()
            },
            EmptyVersionRecommendations(21),
            EmptyCriticalAlignment(20, 21));
        var runner = new RecordingRunner(_ => new CommandResult { ReturnCode = 0 });
        var progress = new RecordingProgress();

        var result = await new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader())
            .ExecuteMigrationHopAsync(root, new MigrationHop(20, 21, "Angular 20 to 21"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "20"), To = new RuntimeSpec("angular", "21"), Ai = new AiConfig { UseAi = true, Provider = "codex" } }, progress, null);

        Assert.Equal("failed", result.StringValue("status"));
        Assert.Contains("one synchronized patch version", result.StringValue("failureReason", result.StringValue("reason")));
        Assert.DoesNotContain(runner.Calls, c => c.Command.Take(2).SequenceEqual(["npm", "install"]));
        Assert.Contains(progress.Messages, m => m.Contains("Rejected mixed-version Angular-owned recommendation"));
    }

    [Fact]
    public async Task Repeated_NoOp_Peer_Remediation_Signature_Stops_Retry_Loop()
    {
        var root = await Angular19Workspace();
        var ai = new SequenceAi(PackagePlan20(preserveTypeScript: true), EmptyVersionRecommendations(20), EmptyCriticalAlignment(19, 20), EmptyConfigPlan(),
            InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "safe install"),
            InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "retry", retry: true));
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["20.0.0","5.8.3"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"]))
            {
                return new CommandResult
                {
                    ReturnCode = 1,
                    Stderr = """
npm ERR! ERESOLVE unable to resolve dependency tree
npm ERR! peer typescript@">=5.8 <6.0" from @angular/compiler-cli@20.0.0
"""
                };
            }
            return new CommandResult { ReturnCode = 0 };
        });

        var result = await new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader())
            .ExecuteMigrationHopAsync(root, new MigrationHop(19, 20, "Angular 19 to 20"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "19"), To = new RuntimeSpec("angular", "20"), Ai = new AiConfig { UseAi = true, Provider = "codex" }, MaxRetries = 3 }, null, null);
        var devDeps = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(root, "package.json")))!["devDependencies"]!.AsObject();

        Assert.Equal("failed", result.StringValue("status"));
        Assert.Equal("~5.8.3", devDeps["typescript"]!.ToString());
        Assert.Equal(2, runner.Calls.Count(c => c.Command.Take(2).SequenceEqual(["npm", "install"])));
        Assert.True(result.BoolValue("manualActionRequired"));
        Assert.DoesNotContain(runner.Calls, c => c.Command.Contains("--legacy-peer-deps"));
    }

    [Fact]
    public async Task Install_First_Mode_Uses_Npm_View_Only_For_Angular_Owned_Critical_Recommendations()
    {
        var root = await Angular13Workspace();
        var packagePath = Path.Combine(root, "package.json");
        var packageJson = JsonNode.Parse(await File.ReadAllTextAsync(packagePath))!.AsObject();
        packageJson["dependencies"]!.AsObject()["ngx-bootstrap"] = "^7.1.0";
        await File.WriteAllTextAsync(packagePath, packageJson.ToJsonString(JsonHelpers.SerializerOptions) + Environment.NewLine);
        var ai = new SequenceAi(new JsonObject
        {
            ["packages"] = new JsonArray(
                PackageDecision("@angular/core", "~13.1.0", "dependencies", "angular_framework_package", "^14.3.0", "upgrade"),
                PackageDecision("@angular/common", "~13.1.0", "dependencies", "angular_framework_package", "^14.3.0", "upgrade"),
                PackageDecision("@angular/compiler", "~13.1.0", "dependencies", "angular_framework_package", "^14.3.0", "upgrade"),
                PackageDecision("ngx-bootstrap", "^7.1.0", "dependencies", "angular_ui_or_extension_package", "^9.0.0", "upgrade"),
                PackageDecision("@angular/cli", "~13.1.2", "devDependencies", "angular_tooling_package", "^14.3.0", "upgrade"),
                PackageDecision("@angular/compiler-cli", "~13.1.0", "devDependencies", "angular_tooling_package", "^14.3.0", "upgrade"),
                PackageDecision("@angular-devkit/build-angular", "^13.3.10", "devDependencies", "angular_tooling_package", "^14.2.13", "upgrade"),
                PackageDecision("typescript", "~4.5.2", "devDependencies", "typescript_runtime_or_compiler_package", "~4.8.4", "upgrade")),
            ["notes"] = new JsonArray()
        }, VersionRecommendations(
            VersionRecommendation("@angular/core", "~13.1.0", "^14.2.13", "AI selected Angular core 14 range."),
            VersionRecommendation("@angular-devkit/build-angular", "^13.3.10", "^14.2.13", "AI selected Angular DevKit 14 range."),
            VersionRecommendation("ngx-bootstrap", "^7.1.0", "^9.0.0", "AI selected package-specific Angular compatible range.")),
            EmptyCriticalAlignment(13, 14), EmptyConfigPlan());
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view")
            {
                if (command[2] == "ngx-bootstrap@^9.0.0") return new CommandResult { ReturnCode = 0, Stdout = """["9.0.0"]""" };
                if (command[2].StartsWith("typescript@", StringComparison.OrdinalIgnoreCase)) return new CommandResult { ReturnCode = 0, Stdout = """["4.8.4"]""" };
                return new CommandResult { ReturnCode = 0, Stdout = """["14.2.13"]""" };
            }
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(13, 14, "Angular 13 to 14"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "13"), To = new RuntimeSpec("angular", "14"), Ai = new AiConfig { UseAi = true, Provider = "codex" } }, null, null);

        Assert.Equal("done", result.StringValue("status"));
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "@angular/core@14.2.13", "version", "--json"]));
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "@angular-devkit/build-angular@14.2.13", "version", "--json"]));
        Assert.DoesNotContain(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "ngx-bootstrap@^9.0.0", "version", "--json"]));
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "@angular/core@14", "version", "--json"]));
        Assert.DoesNotContain(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "@angular-devkit/build-angular@14", "version", "--json"]));
        Assert.DoesNotContain(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "ngx-bootstrap@14", "version", "--json"]));
        Assert.Equal("^7.1.0", JsonNode.Parse(await File.ReadAllTextAsync(packagePath))!["dependencies"]!["ngx-bootstrap"]!.ToString());
        Assert.DoesNotContain(result["packageTargetValidation"]!["resolved"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "ngx-bootstrap");
        Assert.Contains(result["packagesPreserved"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("name") == "ngx-bootstrap");
    }

    [Fact]
    public async Task Strict_Npm_View_Mode_Verifies_Every_Recommendation()
    {
        var root = await Angular13Workspace();
        var ai = new SequenceAi(new JsonObject
        {
            ["packages"] = new JsonArray(
                PackageDecision("@angular/core", "~13.1.0", "dependencies", "angular_framework_package", "^14.3.0", "upgrade"),
                PackageDecision("@angular-devkit/build-angular", "^13.3.10", "devDependencies", "angular_tooling_package", "^14.2.13", "upgrade")),
            ["notes"] = new JsonArray()
        }, VersionRecommendations(
            VersionRecommendation("@angular/core", "~13.1.0", "^14.2.13", "AI selected Angular core 14 range."),
            VersionRecommendation("@angular-devkit/build-angular", "^13.3.10", "^14.2.13", "AI selected Angular DevKit 14 range.")),
            EmptyCriticalAlignment(13, 14), EmptyConfigPlan());
        var runner = new RecordingRunner(command => command[0] == "npm" && command[1] == "view"
            ? new CommandResult { ReturnCode = 0, Stdout = command[2].StartsWith("typescript@", StringComparison.OrdinalIgnoreCase) ? """["4.8.4"]""" : """["14.2.13"]""" }
            : new CommandResult { ReturnCode = 0 });
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(13, 14, "Angular 13 to 14"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "13"), To = new RuntimeSpec("angular", "14"), Ai = new AiConfig { UseAi = true, Provider = "codex" }, PackageVersionVerificationMode = "strict-npm-view" }, null, null);

        Assert.Equal("done", result.StringValue("status"));
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "@angular/core@14.2.13", "version", "--json"]));
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "@angular-devkit/build-angular@14.2.13", "version", "--json"]));
    }

    [Fact]
    public async Task Npm_View_Timeout_Does_Not_Block_Install_First_Mode()
    {
        var root = await Angular13Workspace();
        var ai = new SequenceAi(new JsonObject
        {
            ["packages"] = new JsonArray(
                PackageDecision("@angular/core", "~13.1.0", "dependencies", "angular_framework_package", "^14.2.13", "upgrade"),
                PackageDecision("@angular/common", "~13.1.0", "dependencies", "angular_framework_package", "^14.2.13", "upgrade"),
                PackageDecision("@angular/compiler", "~13.1.0", "dependencies", "angular_framework_package", "^14.2.13", "upgrade"),
                PackageDecision("@angular/cli", "~13.1.2", "devDependencies", "angular_tooling_package", "^14.2.13", "upgrade"),
                PackageDecision("@angular/compiler-cli", "~13.1.0", "devDependencies", "angular_tooling_package", "^14.2.13", "upgrade"),
                PackageDecision("@angular-devkit/build-angular", "^13.3.10", "devDependencies", "angular_tooling_package", "^14.2.13", "upgrade"),
                PackageDecision("typescript", "~4.5.2", "devDependencies", "typescript_runtime_or_compiler_package", "~4.8.4", "upgrade")),
            ["notes"] = new JsonArray()
        }, VersionRecommendations(
            VersionRecommendation("@angular/core", "~13.1.0", "^14.2.13", "AI selected Angular core 14 range.", confidence: 70)),
            EmptyCriticalAlignment(13, 14), EmptyConfigPlan());
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view" && command[2] == "@angular/core@14.2.13")
            {
                return new CommandResult { ReturnCode = 1, TimeoutKind = "timeout", FailureCategory = "timeout", FailureReason = "Command timed out." };
            }
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["14.2.13"]""" };
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(13, 14, "Angular 13 to 14"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "13"), To = new RuntimeSpec("angular", "14"), Ai = new AiConfig { UseAi = true, Provider = "codex" }, NpmLookupRetries = 0 }, null, null);
        var resolved = result["packageTargetValidation"]!["resolved"]!.AsArray().OfType<JsonObject>().First(i => i.StringValue("packageName") == "@angular/core");

        Assert.Equal("done", result.StringValue("status"));
        Assert.Equal("timeout", resolved.StringValue("npmVerificationResult"));
        Assert.Equal("skipped_due_to_timeout", resolved.StringValue("npmValidationResult"));
        Assert.Equal(1, runner.Calls.Count(c => c.Command.SequenceEqual(["npm", "view", "@angular/core@14.2.13", "version", "--json"])));
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "@angular/core@14", "version", "--json"]));
    }

    [Fact]
    public async Task Deterministic_Default_Target_Is_Verified_Without_Broad_Major_Discovery()
    {
        var root = await Angular13Workspace();
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view")
            {
                var spec = command[2];
                if (spec == "@angular-devkit/build-angular@^14.0.0") return new CommandResult { ReturnCode = 0, Stdout = """["14.2.13"]""" };
                if (spec.StartsWith("typescript@", StringComparison.OrdinalIgnoreCase)) return new CommandResult { ReturnCode = 0, Stdout = """["4.8.4"]""" };
                return new CommandResult { ReturnCode = 0, Stdout = """["14.3.0"]""" };
            }
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner);

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(13, 14, "Angular 13 to 14"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "13"), To = new RuntimeSpec("angular", "14") }, null, null);
        var packageJson = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(root, "package.json")))!.AsObject();
        var devDeps = packageJson["devDependencies"]!.AsObject();
        var buildAngularUpdate = result["angularPackageUpgradePlan"]!.AsArray().OfType<JsonObject>().First(p => p.StringValue("name") == "@angular-devkit/build-angular");

        Assert.Equal("done", result.StringValue("status"));
        Assert.Equal("14.3.0", devDeps["@angular-devkit/build-angular"]!.ToString());
        Assert.Equal("14.3.0", buildAngularUpdate.StringValue("finalAcceptedVersion"));
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "@angular/core@14", "version", "--json"]));
        Assert.DoesNotContain(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "@angular-devkit/build-angular@14", "version", "--json"]));
        Assert.True(buildAngularUpdate.BoolValue("packageJsonUpdated"));
    }

    [Fact]
    public async Task Ai_Wrong_Angular_Companion_Recommendation_Reasks_Ai_And_Verifies_Alternative()
    {
        var root = TestWorkspace.Create();
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """
{
  "scripts": {"build":"ng build"},
  "dependencies": {
    "@angular/core": "~14.2.0",
    "@angular/common": "~14.2.0",
    "@angular/compiler": "~14.2.0",
    "@angular/forms": "~14.2.0",
    "@angular/router": "~14.2.0",
    "@angular/platform-browser": "~14.2.0",
    "@angular/platform-browser-dynamic": "~14.2.0",
    "@angular/cdk": "~14.2.7",
    "@angular/material": "~14.2.7",
    "angular-user-idle": "^2.2.6",
    "ngx-bootstrap": "^7.1.0"
  },
  "devDependencies": {
    "@angular/cli": "~14.2.0",
    "@angular/compiler-cli": "~14.2.0",
    "@angular-devkit/build-angular": "~14.2.0",
    "typescript": "~4.8.4"
  }
}
""");
        await File.WriteAllTextAsync(Path.Combine(root, "angular.json"), "{}");
        var angularPackages = new[]
        {
            "@angular/core", "@angular/common", "@angular/compiler", "@angular/forms", "@angular/router",
            "@angular/platform-browser", "@angular/platform-browser-dynamic", "@angular/cdk", "@angular/material",
            "@angular/cli", "@angular/compiler-cli", "@angular-devkit/build-angular"
        };
        var ai = new SequenceAi(new JsonObject
        {
            ["packages"] = new JsonArray(angularPackages.Select(name => (JsonNode?)PackageDecision(
                name,
                name is "@angular/cdk" or "@angular/material" ? "~14.2.7" : "~14.2.0",
                name is "@angular/cli" or "@angular/compiler-cli" or "@angular-devkit/build-angular" ? "devDependencies" : "dependencies",
                name is "@angular/cli" or "@angular/compiler-cli" or "@angular-devkit/build-angular" ? "angular_tooling_package" : name is "@angular/cdk" or "@angular/material" ? "angular_ui_or_extension_package" : "angular_framework_package",
                "~15.2.10",
                "upgrade"))
                .Append(PackageDecision("angular-user-idle", "^2.2.6", "dependencies", "angular_ui_or_extension_package", "^4.0.0", "upgrade"))
                .Append(PackageDecision("ngx-bootstrap", "^7.1.0", "dependencies", "angular_ui_or_extension_package", "^10.0.0", "upgrade"))
                .Append(PackageDecision("typescript", "~4.8.4", "devDependencies", "typescript_runtime_or_compiler_package", "~4.9.5", "upgrade")).ToArray()),
            ["notes"] = new JsonArray()
        }, new JsonObject
        {
            ["targetAngularMajor"] = 15,
            ["recommendations"] = new JsonArray(
                VersionRecommendation("@angular/cdk", "~14.2.7", "^15.2.10", "AI requested unavailable Angular CDK patch."),
                VersionRecommendation("@angular/material", "~14.2.7", "^15.2.10", "AI requested unavailable Angular Material patch."),
                VersionRecommendation("angular-user-idle", "^2.2.6", "^4.0.0", "AI selected package-specific Angular 15 compatible version."),
                VersionRecommendation("ngx-bootstrap", "^7.1.0", "^10.0.0", "AI selected package-specific Angular 15 compatible version.")),
            ["warnings"] = new JsonArray()
        }, EmptyCriticalAlignment(14, 15), VersionRecommendations(
            VersionRecommendation("@angular/cdk", "~14.2.7", "~15.2.9", "Angular CDK latest compatible Angular 15 line differs from core patch.")),
            VersionRecommendations(
            VersionRecommendation("@angular/material", "~14.2.7", "~15.2.9", "Angular Material latest compatible Angular 15 line differs from core patch.")),
            EmptyConfigPlan());
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view")
            {
                var spec = command[2];
                if (spec is "@angular/cdk@^15.2.10" or "@angular/material@^15.2.10" or "@angular/cli@^15.2.10" or "@angular-devkit/build-angular@^15.2.10") return new CommandResult { ReturnCode = 1, Stderr = "E404 No match found for version" };
                if (spec is "@angular/cdk@15") return new CommandResult { ReturnCode = 0, Stdout = """["15.2.11"]""" };
                if (spec is "@angular/material@15") return new CommandResult { ReturnCode = 0, Stdout = """["15.2.12"]""" };
                if (spec is "@angular/cli@15") return new CommandResult { ReturnCode = 0, Stdout = """["15.2.13"]""" };
                if (spec is "@angular-devkit/build-angular@15") return new CommandResult { ReturnCode = 0, Stdout = """["15.2.14"]""" };
                if (spec == "angular-user-idle@^4.0.0") return new CommandResult { ReturnCode = 0, Stdout = """["4.0.0"]""" };
                if (spec == "ngx-bootstrap@^10.0.0") return new CommandResult { ReturnCode = 0, Stdout = """["10.3.0"]""" };
                if (spec.StartsWith("typescript@", StringComparison.OrdinalIgnoreCase)) return new CommandResult { ReturnCode = 0, Stdout = """["4.9.5"]""" };
                return new CommandResult { ReturnCode = 0, Stdout = """["15.2.10"]""" };
            }
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "14"), To = new RuntimeSpec("angular", "15"), Ai = new AiConfig { UseAi = true, Provider = "codex" }, PackageVersionVerificationMode = "strict-npm-view" }, null, null);
        var packageJson = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(root, "package.json")))!.AsObject();
        var deps = packageJson["dependencies"]!.AsObject();
        var devDeps = packageJson["devDependencies"]!.AsObject();
        var resolved = result["packageTargetValidation"]!["resolved"]!.AsArray().OfType<JsonObject>().ToArray();

        Assert.Equal("done", result.StringValue("status"));
        Assert.Equal("15.2.10", deps["@angular/core"]!.ToString());
        Assert.Equal("15.2.11", deps["@angular/cdk"]!.ToString());
        Assert.Equal("15.2.12", deps["@angular/material"]!.ToString());
        Assert.Equal("^2.2.6", deps["angular-user-idle"]!.ToString());
        Assert.Equal("^7.1.0", deps["ngx-bootstrap"]!.ToString());
        Assert.Equal("15.2.13", devDeps["@angular/cli"]!.ToString());
        Assert.Equal("15.2.14", devDeps["@angular-devkit/build-angular"]!.ToString());
        Assert.Contains(resolved, r => r.StringValue("packageName") == "@angular/cdk" && r.StringValue("finalAcceptedVersion") == "15.2.11");
        Assert.Contains(resolved, r => r.StringValue("packageName") == "@angular/material" && r.StringValue("finalAcceptedVersion") == "15.2.12");
        Assert.DoesNotContain(resolved, r => r.StringValue("packageName") == "angular-user-idle");
        Assert.DoesNotContain(resolved, r => r.StringValue("packageName") == "ngx-bootstrap");
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "@angular/cdk@15", "version", "--json"]));
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "@angular/material@15", "version", "--json"]));
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "@angular/cli@15", "version", "--json"]));
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "@angular-devkit/build-angular@15", "version", "--json"]));
        Assert.DoesNotContain(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "angular-user-idle@^4.0.0", "version", "--json"]));
        Assert.DoesNotContain(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "ngx-bootstrap@^10.0.0", "version", "--json"]));
        Assert.DoesNotContain(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "angular-user-idle@15", "version", "--json"]));
        Assert.DoesNotContain(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "ngx-bootstrap@15", "version", "--json"]));
        var report = new MarkdownReportWriter().GenerateAdapterHopReport(new JsonObject { ["manifest"] = new JsonObject(), ["to"] = "angular15" }, [new MigrationHop(14, 15, "Angular 14 to 15")], [result], new ValidationResult { Passed = true });
        Assert.Contains("@angular/cdk", report);
        Assert.Contains("aiRecommended=^15.2.10", report);
        Assert.Contains("finalSelected=15.2.11", report);
        Assert.Contains("finalSelected=15.2.12", report);
        Assert.Contains("finalSelected=15.2.13", report);
        Assert.Contains("finalSelected=15.2.14", report);
        Assert.Contains("angular-user-idle", report);
        Assert.DoesNotContain("finalSelected=^4.0.0", report);
    }

    [Fact]
    public async Task Npm_Install_E404_Triggers_Targeted_Ai_ReRecommendation_For_Failing_Package()
    {
        var root = TestWorkspace.Create();
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """
{
  "scripts": {"build":"ng build"},
  "dependencies": {
    "@angular/core": "~14.2.0",
    "@angular/cdk": "~14.2.7"
  },
  "devDependencies": {
    "@angular/cli": "~14.2.0",
    "@angular/compiler-cli": "~14.2.0",
    "@angular-devkit/build-angular": "~14.2.0",
    "typescript": "~4.8.4"
  }
}
""");
        await File.WriteAllTextAsync(Path.Combine(root, "angular.json"), "{}");
        var ai = new SequenceAi(new JsonObject
        {
            ["packages"] = new JsonArray(
                PackageDecision("@angular/core", "~14.2.0", "dependencies", "angular_framework_package", "^15.2.10", "upgrade"),
                PackageDecision("@angular/cdk", "~14.2.7", "dependencies", "angular_ui_or_extension_package", "^15.2.10", "upgrade"),
                PackageDecision("@angular/cli", "~14.2.0", "devDependencies", "angular_tooling_package", "^15.2.10", "upgrade"),
                PackageDecision("@angular/compiler-cli", "~14.2.0", "devDependencies", "angular_tooling_package", "^15.2.10", "upgrade"),
                PackageDecision("@angular-devkit/build-angular", "~14.2.0", "devDependencies", "angular_tooling_package", "^15.2.10", "upgrade"),
                PackageDecision("typescript", "~4.8.4", "devDependencies", "typescript_runtime_or_compiler_package", "~4.9.5", "upgrade")),
            ["notes"] = new JsonArray()
        }, VersionRecommendations(
            VersionRecommendation("@angular/cdk", "~14.2.7", "^15.2.10", "AI selected an unavailable CDK range.")),
            EmptyCriticalAlignment(14, 15),
            EmptyConfigPlan(),
            InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "first install"),
            VersionRecommendations(VersionRecommendation("@angular/cdk", "^15.2.10", "~15.2.9", "CDK has a published Angular 15-compatible patch.")),
            InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "retry after package version correction"));
        var firstInstall = true;
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view")
            {
                if (command[2] == "@angular/cdk@~15.2.9") return new CommandResult { ReturnCode = 0, Stdout = """["15.2.9"]""" };
                if (command[2].StartsWith("typescript@", StringComparison.OrdinalIgnoreCase)) return new CommandResult { ReturnCode = 0, Stdout = """["4.9.5"]""" };
                return new CommandResult { ReturnCode = 0, Stdout = """["15.2.10"]""" };
            }
            if (command.Take(2).SequenceEqual(["npm", "install"]) && firstInstall)
            {
                firstInstall = false;
                return new CommandResult { ReturnCode = 1, Stderr = "npm ERR! code ETARGET\nnpm ERR! notarget No matching version found for @angular/cdk@^15.2.10." };
            }
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "14"), To = new RuntimeSpec("angular", "15"), Ai = new AiConfig { UseAi = true, Provider = "codex" } }, null, null);
        var packageJson = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(root, "package.json")))!.AsObject();

        Assert.Equal("done", result.StringValue("status"));
        Assert.Equal("~15.2.9", packageJson["dependencies"]!["@angular/cdk"]!.ToString());
    }

    [Fact]
    public async Task Angular_15_To_16_Npm_Verified_FinalSelected_Versions_Are_Not_Overwritten()
    {
        var root = TestWorkspace.Create();
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """
{
  "scripts": {"build":"ng build"},
  "dependencies": {
    "@angular/core": "~15.2.10",
    "@angular/common": "~15.2.10",
    "@angular/compiler": "~15.2.10",
    "@angular/cdk": "~15.2.9",
    "@angular/material": "~15.2.9"
  },
  "devDependencies": {
    "@angular/cli": "~15.2.10",
    "@angular/compiler-cli": "~15.2.10",
    "@angular-devkit/build-angular": "~15.2.10",
    "typescript": "~4.9.5"
  }
}
""");
        await File.WriteAllTextAsync(Path.Combine(root, "angular.json"), "{}");
        var packages = new[]
        {
            ("@angular/core", "dependencies", "angular_framework_package", "~16.2.12"),
            ("@angular/common", "dependencies", "angular_framework_package", "~16.2.12"),
            ("@angular/compiler", "dependencies", "angular_framework_package", "~16.2.12"),
            ("@angular/cdk", "dependencies", "angular_ui_or_extension_package", "~16.2.11"),
            ("@angular/material", "dependencies", "angular_ui_or_extension_package", "~16.2.11"),
            ("@angular/cli", "devDependencies", "angular_tooling_package", "~16.2.12"),
            ("@angular/compiler-cli", "devDependencies", "angular_tooling_package", "~16.2.12"),
            ("@angular-devkit/build-angular", "devDependencies", "angular_tooling_package", "~16.2.12"),
            ("typescript", "devDependencies", "typescript_runtime_or_compiler_package", "~5.1.6")
        };
        var ai = new SequenceAi(new JsonObject
        {
            ["packages"] = new JsonArray(packages.Select(p => (JsonNode?)PackageDecision(p.Item1, p.Item1 == "typescript" ? "~4.9.5" : p.Item1 is "@angular/cdk" or "@angular/material" ? "~15.2.9" : "~15.2.10", p.Item2, p.Item3, p.Item4, "upgrade")).ToArray()),
            ["notes"] = new JsonArray()
        }, new JsonObject
        {
            ["targetAngularMajor"] = 16,
            ["recommendations"] = new JsonArray(packages.Select(p => (JsonNode?)VersionRecommendation(p.Item1, "", p.Item4, "AI selected package-specific Angular 16 compatible version.")).ToArray()),
            ["warnings"] = new JsonArray()
        }, EmptyCriticalAlignment(15, 16), EmptyConfigPlan());
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view")
            {
                var spec = command[2];
                if (spec is "@angular/cdk@~16.2.11" or "@angular/material@~16.2.11") return new CommandResult { ReturnCode = 0, Stdout = """["16.2.11"]""" };
                if (spec == "typescript@~5.1.6") return new CommandResult { ReturnCode = 0, Stdout = """["5.1.6"]""" };
                return new CommandResult { ReturnCode = 0, Stdout = """["16.2.12"]""" };
            }
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(15, 16, "Angular 15 to 16"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "15"), To = new RuntimeSpec("angular", "16"), Ai = new AiConfig { UseAi = true, Provider = "codex" }, PackageVersionVerificationMode = "strict-npm-view" }, null, null);
        var packageJson = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(root, "package.json")))!.AsObject();
        var deps = packageJson["dependencies"]!.AsObject();
        var devDeps = packageJson["devDependencies"]!.AsObject();
        var resolved = result["packageTargetValidation"]!["resolved"]!.AsArray().OfType<JsonObject>().ToArray();

        Assert.Equal("done", result.StringValue("status"));
        Assert.Equal("16.2.12", deps["@angular/cdk"]!.ToString());
        Assert.Equal("16.2.12", deps["@angular/material"]!.ToString());
        Assert.Equal("16.2.12", devDeps["@angular/cli"]!.ToString());
        Assert.Equal("16.2.12", devDeps["@angular-devkit/build-angular"]!.ToString());
        Assert.Equal("16.2.12", devDeps["@angular/compiler-cli"]!.ToString());
        Assert.Equal("~5.1.6", devDeps["typescript"]!.ToString());
        foreach (var name in new[] { "@angular/material", "@angular/cdk", "@angular/cli", "@angular-devkit/build-angular", "@angular/compiler-cli" })
        {
            var expected = "16.2.12";
            Assert.Contains(resolved, r => r.StringValue("packageName") == name && r.StringValue("npmValidationResult") == "verified" && r.StringValue("finalAcceptedVersion") == expected);
        }
        Assert.Contains(resolved, r => r.StringValue("packageName") == "typescript" && r.StringValue("npmValidationResult") == "skipped" && r.StringValue("finalAcceptedVersion") == "~5.1.6");
    }

    [Fact]
    public async Task Unresolved_Npm_Target_Blocks_Hop_And_Does_Not_Write_PackageJson()
    {
        var root = await Angular13Workspace();
        var before = await File.ReadAllTextAsync(Path.Combine(root, "package.json"));
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view")
            {
                if (command[2].StartsWith("@angular-devkit/build-angular@", StringComparison.OrdinalIgnoreCase)) return new CommandResult { ReturnCode = 1, Stderr = "No matching version found" };
                if (command[2].StartsWith("typescript@", StringComparison.OrdinalIgnoreCase)) return new CommandResult { ReturnCode = 0, Stdout = """["4.8.4"]""" };
                return new CommandResult { ReturnCode = 0, Stdout = """["14.3.0"]""" };
            }
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner);

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(13, 14, "Angular 13 to 14"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "13"), To = new RuntimeSpec("angular", "14") }, null, null);
        var after = await File.ReadAllTextAsync(Path.Combine(root, "package.json"));

        Assert.Equal("failed", result.StringValue("status"));
        Assert.Contains("@angular-devkit/build-angular@14.3.0", result.StringValue("failureReason"));
        Assert.Equal(before, after);
        Assert.DoesNotContain(runner.Calls, c => c.Command.Take(2).SequenceEqual(["npm", "install"]));
    }

    [Fact]
    public async Task NonCritical_AngularAdjacent_Target_Skips_Upfront_Npm_View_And_Is_Left_To_Graph_Validation()
    {
        var root = TestWorkspace.Create();
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """
{
  "scripts": {"build":"ng build"},
  "dependencies": {
    "@angular/core": "~14.2.0",
    "@angular/common": "~14.2.0",
    "@angular/compiler": "~14.2.0",
    "@angular/flex-layout": "^14.0.0-beta.41"
  },
  "devDependencies": {
    "@angular/cli": "~14.2.0",
    "@angular/compiler-cli": "~14.2.0",
    "@angular-devkit/build-angular": "~14.2.0",
    "typescript": "~4.8.4"
  }
}
""");
        await File.WriteAllTextAsync(Path.Combine(root, "angular.json"), "{}");
        var ai = new SequenceAi(new JsonObject
        {
            ["packages"] = new JsonArray(
                PackageDecision("@angular/core", "~14.2.0", "dependencies", "angular_framework_package", "^15.0.0", "upgrade"),
                PackageDecision("@angular/common", "~14.2.0", "dependencies", "angular_framework_package", "^15.0.0", "upgrade"),
                PackageDecision("@angular/compiler", "~14.2.0", "dependencies", "angular_framework_package", "^15.0.0", "upgrade"),
                PackageDecision("@angular/flex-layout", "^14.0.0-beta.41", "dependencies", "angular_ui_or_extension_package", "^15.0.0", "upgrade"),
                PackageDecision("@angular/cli", "~14.2.0", "devDependencies", "angular_tooling_package", "^15.0.0", "upgrade"),
                PackageDecision("@angular/compiler-cli", "~14.2.0", "devDependencies", "angular_tooling_package", "^15.0.0", "upgrade"),
                PackageDecision("@angular-devkit/build-angular", "~14.2.0", "devDependencies", "angular_tooling_package", "^15.0.0", "upgrade"),
                PackageDecision("typescript", "~4.8.4", "devDependencies", "typescript_runtime_or_compiler_package", "~4.9.5", "upgrade")),
            ["notes"] = new JsonArray()
        }, VersionRecommendations(
            VersionRecommendation("@angular/flex-layout", "^14.0.0-beta.41", "^15.0.0", "AI selected an unavailable Angular-adjacent package target.")),
            EmptyCriticalAlignment(14, 15),
            EmptyConfigPlan());
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view")
            {
                if (command[2] == "@angular/flex-layout@^15.0.0") return new CommandResult { ReturnCode = 1, Stderr = "npm ERR! code E404" };
                if (command[2].StartsWith("typescript@", StringComparison.OrdinalIgnoreCase)) return new CommandResult { ReturnCode = 0, Stdout = """["4.9.5"]""" };
                return new CommandResult { ReturnCode = 0, Stdout = """["15.0.0"]""" };
            }
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "14"), To = new RuntimeSpec("angular", "15"), Ai = new AiConfig { UseAi = true, Provider = "codex" }, PackageVersionVerificationMode = "strict-npm-view" }, null, null);
        var packageJson = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(root, "package.json")))!.AsObject();
        var validation = result["packageTargetValidation"]!.AsObject();

        Assert.Equal("done", result.StringValue("status"));
        Assert.Equal("15.0.0", packageJson["dependencies"]!["@angular/flex-layout"]!.ToString());
        Assert.DoesNotContain(validation["discarded"]!.AsArray().OfType<JsonObject>(), i => i.StringValue("packageName") == "@angular/flex-layout");
        Assert.Empty(result["packageTargetValidation"]!["invalid"]!.AsArray());
        Assert.DoesNotContain(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "@angular/flex-layout@^15.0.0", "version", "--json"]));
        Assert.DoesNotContain(result["packagesPreserved"]!.AsArray().OfType<JsonObject>(), p => p.StringValue("name") == "@angular/flex-layout" && p.StringValue("version") == "^14.0.0-beta.41");
        Assert.Contains(runner.Calls, c => c.Command.Take(2).SequenceEqual(["npm", "install"]));
        Assert.Equal(1, ai.SystemPrompts.Count(IsPackageVersionPrompt));
    }

    [Fact]
    public async Task Peer_Conflict_Can_Fallback_But_PackageVersionNotFound_Targets_Do_Not_Install()
    {
        var peerRoot = await Angular13Workspace();
        var firstInstall = true;
        var peerRunner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view")
            {
                if (command[2] == "@angular/core@14") return new CommandResult { ReturnCode = 0, Stdout = """["14.3.0"]""" };
                if (command[2] == "@angular-devkit/build-angular@14") return new CommandResult { ReturnCode = 0, Stdout = """["14.2.13"]""" };
                if (command[2].StartsWith("typescript@", StringComparison.OrdinalIgnoreCase)) return new CommandResult { ReturnCode = 0, Stdout = """["4.8.4"]""" };
                return new CommandResult { ReturnCode = 0, Stdout = """["14.3.0"]""" };
            }
            if (command.Take(2).SequenceEqual(["npm", "install"]) && !command.Contains("--legacy-peer-deps") && firstInstall)
            {
                firstInstall = false;
                return new CommandResult { ReturnCode = 1, Stderr = "ERESOLVE peer dependency conflict" };
            }
            return new CommandResult { ReturnCode = 0 };
        });

        var peerResult = await new AngularAdapter(peerRunner).ExecuteMigrationHopAsync(peerRoot, new MigrationHop(13, 14, "Angular 13 to 14"), new JsonObject(), Config(peerRoot) with { From = new RuntimeSpec("angular", "13"), To = new RuntimeSpec("angular", "14"), MaxRetries = 1 }, null, null);

        var blockedRoot = await Angular13Workspace();
        var blockedRunner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view")
            {
                if (command[2] == "@angular/core@14") return new CommandResult { ReturnCode = 0, Stdout = """["14.3.0"]""" };
                if (command[2].StartsWith("@angular-devkit/build-angular@", StringComparison.OrdinalIgnoreCase)) return new CommandResult { ReturnCode = 1, Stderr = "No matching version found" };
                if (command[2].StartsWith("typescript@", StringComparison.OrdinalIgnoreCase)) return new CommandResult { ReturnCode = 0, Stdout = """["4.8.4"]""" };
                return new CommandResult { ReturnCode = 0, Stdout = """["14.3.0"]""" };
            }
            return new CommandResult { ReturnCode = 0 };
        });

        var blockedResult = await new AngularAdapter(blockedRunner).ExecuteMigrationHopAsync(blockedRoot, new MigrationHop(13, 14, "Angular 13 to 14"), new JsonObject(), Config(blockedRoot) with { From = new RuntimeSpec("angular", "13"), To = new RuntimeSpec("angular", "14"), MaxRetries = 1 }, null, null);

        Assert.Equal("done", peerResult.StringValue("status"));
        Assert.Contains(peerRunner.Calls, c => c.Command.Contains("--legacy-peer-deps"));
        Assert.Equal("failed", blockedResult.StringValue("status"));
        Assert.DoesNotContain(blockedRunner.Calls, c => c.Command.Take(2).SequenceEqual(["npm", "install"]));
    }

    [Theory]
    [InlineData("^14.3.0", "14.3.0")]
    [InlineData("~14.3.0", "14.3.0")]
    [InlineData("14.3.0", "14.3.0")]
    [InlineData("14.x", "14.3.0")]
    [InlineData("14.*", "14.3.0")]
    [InlineData("^14", "14.3.0")]
    [InlineData("~14", "14.3.0")]
    [InlineData(">=14 <15", "14.3.0")]
    public async Task Angular_Npm_Semver_Target_Forms_Are_Accepted(string targetVersion, string expectedVersion)
    {
        var root = TestWorkspace.Create();
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """
{
  "scripts": {"build":"ng build"},
  "dependencies": {"@angular/core":"~13.1.0"},
  "devDependencies": {}
}
""");
        await File.WriteAllTextAsync(Path.Combine(root, "angular.json"), "{}");
        var ai = new SequenceAi(new JsonObject
        {
            ["packages"] = new JsonArray(PackageDecision("@angular/core", "~13.1.0", "dependencies", "angular_framework_package", targetVersion, "upgrade")),
            ["notes"] = new JsonArray()
        }, EmptyVersionRecommendations(14), EmptyCriticalAlignment(13, 14), EmptyConfigPlan());
        var adapter = new AngularAdapter(SuccessfulAngularRunner("14.3.0"), ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(13, 14, "Angular 13 to 14"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "13"), To = new RuntimeSpec("angular", "14"), Ai = new AiConfig { UseAi = true, Provider = "codex" } }, null, null);
        var packageJson = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(root, "package.json")))!.AsObject();

        Assert.Equal("done", result.StringValue("status"));
        Assert.Equal(expectedVersion, packageJson["dependencies"]!["@angular/core"]!.ToString());
        Assert.DoesNotContain(result["rejectedAiPackageSuggestions"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("name") == "@angular/core");
    }

    [Fact]
    public async Task Package_Suggestion_ToVersion_Field_Is_Preserved_And_Applied()
    {
        var root = TestWorkspace.Create();
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """
{
  "scripts": {"build":"ng build"},
  "dependencies": {"@angular/core":"~13.1.0"},
  "devDependencies": {}
}
""");
        await File.WriteAllTextAsync(Path.Combine(root, "angular.json"), "{}");
        var ai = new SequenceAi(new JsonObject
        {
            ["packages"] = new JsonArray(new JsonObject
            {
                ["name"] = "@angular/core",
                ["currentVersion"] = "~13.1.0",
                ["section"] = "dependencies",
                ["category"] = "angular_framework_package",
                ["toVersion"] = "^14.3.0",
                ["action"] = "upgrade",
                ["reason"] = "test decision",
                ["confidence"] = 0.95,
                ["risk"] = "low"
            }),
            ["notes"] = new JsonArray()
        }, EmptyVersionRecommendations(14), EmptyCriticalAlignment(13, 14), EmptyConfigPlan());
        var adapter = new AngularAdapter(SuccessfulAngularRunner("14.3.0"), ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(13, 14, "Angular 13 to 14"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "13"), To = new RuntimeSpec("angular", "14"), Ai = new AiConfig { UseAi = true, Provider = "codex" } }, null, null);
        var packageJson = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(root, "package.json")))!.AsObject();

        Assert.Equal("done", result.StringValue("status"));
        Assert.Equal("14.3.0", packageJson["dependencies"]!["@angular/core"]!.ToString());
    }

    [Fact]
    public async Task Safe_Ai_Config_Update_Is_Applied_Before_Validation()
    {
        var root = await AngularWorkspace();
        await File.WriteAllTextAsync(Path.Combine(root, "tsconfig.json"), """{"compilerOptions":{"target":"ES2020","paths":{"@app/*":["src/app/*"]}}}""");
        var ai = new SequenceAi(PackagePlan(), VersionRecommendations(), new JsonObject
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
                return new CommandResult { ReturnCode = 0 };
            }
            if (command.SequenceEqual(["npm", "run", "build"]))
            {
                var tsconfig = File.ReadAllText(Path.Combine(root, "tsconfig.json"));
                return new CommandResult { ReturnCode = tsconfig.Contains("\"target\":\"ES2022\"") ? 0 : 1, Stderr = "config was not updated before validation" };
            }
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

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
    public async Task Angular_18_To_19_Package_Only_Migration_Runs_Full_Official_Update()
    {
        var root = await Angular18Workspace();
        var ai = new SequenceAi(PackagePlan19(), VersionRecommendations19(), EmptyCriticalAlignment(18, 19), EmptyConfigPlan(), InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "safe install"));
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["19.2.22"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"])) CreateLocalAngularCli(root, 19);
            return new CommandResult { ReturnCode = 0, Stdout = "ok" };
        });
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(18, 19, "Angular 18 to 19"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "18"), To = new RuntimeSpec("angular", "19"), Ai = new AiConfig { UseAi = true, Provider = "codex" } }, null, null);

        var installIndex = runner.Calls.FindIndex(c => c.Command.Take(2).SequenceEqual(["npm", "install"]));
        var buildIndex = runner.Calls.FindIndex(c => c.Command.SequenceEqual(["npm", "run", "build"]));

        Assert.Equal("done", result.StringValue("status"));
        Assert.True(result.BoolValue("officialAngularUpdateRequired"));
        Assert.True(result.BoolValue("officialAngularUpdateExecuted"));
        Assert.Equal("migrate-only", result.StringValue("officialAngularUpdateMode"));
        Assert.False(result.BoolValue("migrateOnlySkipped"));
        Assert.True(installIndex >= 0);
        Assert.True(buildIndex > runner.Calls.FindIndex(c => c.Command.Contains("@angular/cli@19")));
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["NG_DISABLE_VERSION_CHECK=1", "npx", "-p", "@angular/cli@19", "ng", "update", "@angular/cli", "--migrate-only", "--from", "18", "--to", "19", "--allow-dirty"]));
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["NG_DISABLE_VERSION_CHECK=1", "npx", "-p", "@angular/cli@19", "ng", "update", "@angular/core", "--migrate-only", "--from", "18", "--to", "19", "--allow-dirty"]));
    }

    [Fact]
    public async Task Official_Migration_Metadata_Triggers_Local_Migrate_Only_After_Install()
    {
        var root = await AngularWorkspace();
        var ai = new SequenceAi(PackagePlan(), VersionRecommendations(), EmptyConfigPlan(), InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "safe install"));
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["15.2.10"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"])) CreateLocalAngularCli(root, 15, withMigrationMetadata: true);
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, null, null);

        var installIndex = runner.Calls.FindIndex(c => c.Command.Take(2).SequenceEqual(["npm", "install"]));
        var migrateIndex = runner.Calls.FindIndex(c => c.Command.Contains("--migrate-only"));
        Assert.Equal("done", result.StringValue("status"));
        Assert.True(result.BoolValue("officialAngularMigrateOnlyExecuted"));
        Assert.True(migrateIndex > installIndex);
    }

    [Fact]
    public async Task Source_Ts_Framework_Migration_Triggers_Migrate_Only()
    {
        var root = await AngularWorkspace();
        Directory.CreateDirectory(Path.Combine(root, "src"));
        await File.WriteAllTextAsync(Path.Combine(root, "src", "main.ts"), "bootstrap();");
        var ai = new SequenceAi(PackagePlan(), VersionRecommendations(), SourceFrameworkMigrationPlan("src/main.ts", "TypeScript source migration required for Angular framework API breaking change."), InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "safe install"));
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["15.2.10"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"])) CreateLocalAngularCli(root, 15);
            if (command.Contains("--migrate-only")) File.WriteAllText(Path.Combine(root, "src", "main.ts"), "bootstrapApplication();");
            return new CommandResult { ReturnCode = 0 };
        });

        var result = await new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader()).ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, null, null);

        Assert.Equal("done", result.StringValue("status"));
        Assert.True(result.BoolValue("officialAngularMigrateOnlyExecuted"));
        Assert.Equal("source/framework migration detected by analysis.", result.StringValue("officialAngularMigrateOnlyTriggerReason"));
        Assert.Contains("src/main.ts", result["officialAngularMigrationFrameworkFiles"]!.AsArray().Select(x => x?.ToString()));
    }

    [Fact]
    public async Task Template_Migration_Triggers_Migrate_Only()
    {
        var root = await AngularWorkspace();
        Directory.CreateDirectory(Path.Combine(root, "src", "app"));
        await File.WriteAllTextAsync(Path.Combine(root, "src", "app", "app.component.html"), "<div></div>");
        var ai = new SequenceAi(PackagePlan(), VersionRecommendations(), SourceFrameworkMigrationPlan("src/app/app.component.html", "Angular template migration required."), InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "safe install"));
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["15.2.10"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"])) CreateLocalAngularCli(root, 15);
            if (command.Contains("--migrate-only")) File.WriteAllText(Path.Combine(root, "src", "app", "app.component.html"), "<section></section>");
            return new CommandResult { ReturnCode = 0 };
        });

        var result = await new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader()).ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, null, null);

        Assert.Equal("done", result.StringValue("status"));
        Assert.True(result.BoolValue("officialAngularMigrateOnlyExecuted"));
        Assert.Contains("src/app/app.component.html", result["officialAngularMigrationBusinessImpactingFiles"]!.AsArray().Select(x => x?.ToString()));
        Assert.True(result.BoolValue("officialAngularMigrationBusinessImpactingAccepted"));
    }

    [Fact]
    public async Task Business_Impacting_Migrate_Only_Changes_Remain_Accepted_When_Validation_Fails()
    {
        var root = await AngularWorkspace();
        Directory.CreateDirectory(Path.Combine(root, "src", "app", "booking"));
        await File.WriteAllTextAsync(Path.Combine(root, "src", "app", "booking", "booking.component.ts"), "export class BookingComponent { price = 1; }");
        var ai = new SequenceAi(PackagePlan(), VersionRecommendations(), SourceFrameworkMigrationPlan("src/app/booking/booking.component.ts", "TypeScript source migration required for Angular framework API breaking change."), InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "safe install"));
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["15.2.10"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"])) CreateLocalAngularCli(root, 15);
            if (command.Contains("--migrate-only")) File.WriteAllText(Path.Combine(root, "src", "app", "booking", "booking.component.ts"), "export class BookingComponent { price = 2; }");
            if (command.SequenceEqual(["npm", "run", "build"])) return new CommandResult { ReturnCode = 1, Stderr = "build failed after Angular migration" };
            return new CommandResult { ReturnCode = 0 };
        });

        var result = await new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader()).ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" }, MaxAiRemediationRetries = 0 }, null, null);

        Assert.Equal("failed", result.StringValue("status"));
        Assert.Contains("src/app/booking/booking.component.ts", result["officialAngularMigrationBusinessImpactingFiles"]!.AsArray().Select(x => x?.ToString()));
        Assert.True(result.BoolValue("officialAngularMigrationBusinessImpactingAccepted"));
        Assert.False(result.BoolValue("officialAngularMigrationBusinessImpactingHighRisk"));
        Assert.Equal("accepted-command-succeeded-validation-failed", result.StringValue("officialAngularMigrationAcceptanceStatus"));
    }

    [Fact]
    public async Task Manual_Review_Config_Only_Change_Does_Not_Trigger_Migrate_Only_And_Is_Auto_Applied()
    {
        var root = await AngularWorkspace();
        await File.WriteAllTextAsync(Path.Combine(root, "tsconfig.json"), """{"compilerOptions":{"target":"ES2020"}}""");
        var ai = new SequenceAi(PackagePlan(), VersionRecommendations(), new JsonObject
        {
            ["changes"] = new JsonArray(new JsonObject
            {
                ["filePath"] = "tsconfig.json",
                ["changeType"] = "manual_review",
                ["targetAngularHop"] = "14->15",
                ["reason"] = "manual framework migration config change",
                ["confidence"] = 0.95,
                ["risk"] = "medium",
                ["patch"] = new JsonObject { ["before"] = "\"target\":\"ES2020\"", ["after"] = "\"target\":\"ES2022\"" }
            }),
            ["manualRecommendations"] = new JsonArray()
        }, InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "safe install"));
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["15.2.10"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"])) CreateLocalAngularCli(root, 15);
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" }, ManualReviewAutoAccept = true }, null, null);

        Assert.Equal("done", result.StringValue("status"));
        Assert.False(result.BoolValue("officialAngularMigrateOnlyExecuted"));
        Assert.True(result.BoolValue("migrateOnlySkipped"));
        Assert.Equal("skipped because package/config-only migration", result.StringValue("migrateOnlySkippedReason"));
        Assert.True(result.BoolValue("manualReviewAutoAcceptEnabled"));
        Assert.Equal(1, result.IntValue("manualReviewItemsReceived"));
        Assert.Single(result["manualReviewAppliedChanges"]!.AsArray());
        Assert.Contains("\"target\":\"ES2022\"", await File.ReadAllTextAsync(Path.Combine(root, "tsconfig.json")));
    }

    [Fact]
    public async Task Failed_Manual_Review_Patch_Is_Reported()
    {
        var root = await AngularWorkspace();
        await File.WriteAllTextAsync(Path.Combine(root, "tsconfig.json"), """{"compilerOptions":{"target":"ES2020"}}""");
        var ai = new SequenceAi(PackagePlan(), VersionRecommendations(), new JsonObject
        {
            ["changes"] = new JsonArray(new JsonObject
            {
                ["filePath"] = "tsconfig.json",
                ["changeType"] = "manual_review",
                ["targetAngularHop"] = "14->15",
                ["reason"] = "manual framework migration config change",
                ["confidence"] = 0.95,
                ["risk"] = "medium",
                ["patch"] = new JsonObject { ["before"] = "\"target\":\"ES2017\"", ["after"] = "\"target\":\"ES2022\"" }
            }),
            ["manualRecommendations"] = new JsonArray()
        }, InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "safe install"));
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["15.2.10"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"])) CreateLocalAngularCli(root, 15);
            return new CommandResult { ReturnCode = 0 };
        });

        var result = await new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader()).ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" }, ManualReviewAutoAccept = true }, null, null);

        Assert.Equal("failed", result.StringValue("status"));
        Assert.Single(result["manualReviewFailedChanges"]!.AsArray());
        Assert.Contains("failed to apply", result.StringValue("failureReason"));
    }

    [Fact]
    public async Task Validation_Failure_Can_Trigger_Migrate_Only_And_Rerun_Validation()
    {
        var root = await AngularWorkspace();
        var buildRuns = 0;
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["15.2.10"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"])) CreateLocalAngularCli(root, 15);
            if (command.SequenceEqual(["npm", "run", "build"]))
            {
                buildRuns++;
                return buildRuns == 1
                    ? new CommandResult { ReturnCode = 1, Stderr = "Build failed; run ng update to apply required Angular migration changes." }
                    : new CommandResult { ReturnCode = 0 };
            }
            return new CommandResult { ReturnCode = 0 };
        });

        var result = await new AngularAdapter(runner).ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { MaxAiRemediationRetries = 0 }, null, null);

        Assert.Equal("done", result.StringValue("status"));
        Assert.True(result.BoolValue("officialAngularMigrateOnlyExecuted"));
        Assert.Equal(2, buildRuns);
        Assert.True(runner.Calls.FindIndex(c => c.Command.Contains("--migrate-only")) > runner.Calls.FindIndex(c => c.Command.SequenceEqual(["npm", "run", "build"])));
    }

    [Fact]
    public async Task Angular_18_To_19_Official_Update_Uses_Long_Timeouts_Only_For_Npx_Cli()
    {
        var root = await Angular18Workspace();
        var ai = new SequenceAi(PackagePlan19(), VersionRecommendations19(), EmptyCriticalAlignment(18, 19), EmptyConfigPlan(), InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "safe install"));
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["19.2.22"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"])) CreateLocalAngularCli(root, 19, withMigrationMetadata: true);
            return new CommandResult { ReturnCode = 0, Stdout = "ok" };
        });
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

        await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(18, 19, "Angular 18 to 19"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "18"), To = new RuntimeSpec("angular", "19"), Ai = new AiConfig { UseAi = true, Provider = "codex" }, CommandTimeoutSeconds = 99, CommandIdleTimeoutSeconds = 6 }, null, null);

        var ngUpdates = runner.Calls.Where(c => c.Command.Contains("@angular/cli@19") && c.Command.Contains("--migrate-only")).ToArray();
        var install = runner.Calls.First(c => c.Command.Take(2).SequenceEqual(["npm", "install"]));
        var build = runner.Calls.First(c => c.Command.SequenceEqual(["npm", "run", "build"]));

        Assert.Equal(2, ngUpdates.Length);
        Assert.All(ngUpdates, ngUpdate =>
        {
            Assert.Equal(600, ngUpdate.TimeoutSeconds);
            Assert.Equal(60, ngUpdate.IdleTimeoutSeconds);
        });
        Assert.Equal(99, install.TimeoutSeconds);
        Assert.Equal(6, install.IdleTimeoutSeconds);
        Assert.Equal(99, build.TimeoutSeconds);
        Assert.Equal(6, build.IdleTimeoutSeconds);
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["NG_DISABLE_VERSION_CHECK=1", "npx", "-p", "@angular/cli@19", "ng", "update", "@angular/cli", "--migrate-only", "--from", "18", "--to", "19", "--allow-dirty"]));
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["NG_DISABLE_VERSION_CHECK=1", "npx", "-p", "@angular/cli@19", "ng", "update", "@angular/core", "--migrate-only", "--from", "18", "--to", "19", "--allow-dirty"]));
    }

    [Fact]
    public async Task Angular_18_To_19_Official_Update_Standalone_False_Source_Changes_Are_Framework_Migrations()
    {
        var root = await Angular18Workspace();
        var component = Path.Combine(root, "src", "app", "booking", "booking.component.ts");
        Directory.CreateDirectory(Path.GetDirectoryName(component)!);
        await File.WriteAllTextAsync(component, """
import { Component } from '@angular/core';
@Component({ selector: 'app-booking', template: '' })
export class BookingComponent {}
""");
        var ai = new SequenceAi(PackagePlan19(), VersionRecommendations19(), EmptyCriticalAlignment(18, 19), EmptyConfigPlan(), InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "safe install"));
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["19.2.22"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"])) CreateLocalAngularCli(root, 19);
            if (command.Contains("@angular/cli@19"))
            {
                File.WriteAllText(component, """
import { Component } from '@angular/core';
@Component({ selector: 'app-booking', standalone: false, template: '' })
export class BookingComponent {}
""");
            }
            return new CommandResult { ReturnCode = 0, Stdout = "ok" };
        });

        var result = await new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader()).ExecuteMigrationHopAsync(root, new MigrationHop(18, 19, "Angular 18 to 19"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "18"), To = new RuntimeSpec("angular", "19"), Ai = new AiConfig { UseAi = true, Provider = "codex" } }, null, null);

        Assert.Equal("done", result.StringValue("status"));
        Assert.Contains("src/app/booking/booking.component.ts", result["officialAngularMigrationFrameworkFiles"]!.AsArray().Select(x => x?.ToString()));
        Assert.DoesNotContain("src/app/booking/booking.component.ts", result["officialAngularMigrationBusinessImpactingFiles"]!.AsArray().Select(x => x?.ToString()));
        Assert.Equal("accepted-after-validation", result.StringValue("officialAngularMigrationAcceptanceStatus"));
    }

    [Fact]
    public async Task Angular_18_To_19_Official_Update_Reruns_Npm_Install_Before_Validation_When_Package_Files_Change()
    {
        var root = await Angular18Workspace();
        var ai = new SequenceAi(PackagePlan19(), VersionRecommendations19(), EmptyCriticalAlignment(18, 19), EmptyConfigPlan(), InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "safe install"));
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["19.2.22"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"])) CreateLocalAngularCli(root, 19);
            if (command.Contains("@angular/cli@19")) File.WriteAllText(Path.Combine(root, "package-lock.json"), "{\"lockfileVersion\":3}");
            return new CommandResult { ReturnCode = 0, Stdout = "ok" };
        });

        var result = await new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader()).ExecuteMigrationHopAsync(root, new MigrationHop(18, 19, "Angular 18 to 19"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "18"), To = new RuntimeSpec("angular", "19"), Ai = new AiConfig { UseAi = true, Provider = "codex" } }, null, null);

        var updateIndex = runner.Calls.FindIndex(c => c.Command.Contains("@angular/cli@19"));
        var installIndexes = runner.Calls.Select((c, i) => (c, i)).Where(x => x.c.Command.Take(2).SequenceEqual(["npm", "install"])).Select(x => x.i).ToArray();
        var buildIndex = runner.Calls.FindIndex(c => c.Command.SequenceEqual(["npm", "run", "build"]));

        Assert.Equal("done", result.StringValue("status"));
        Assert.True(result.BoolValue("officialAngularUpdatePackageFilesChanged"));
        Assert.True(installIndexes.Length >= 2);
        Assert.True(installIndexes.Last() > updateIndex);
        Assert.True(buildIndex > installIndexes.Last());
    }

    [Fact]
    public async Task Metadata_Triggered_Migrate_Only_Stops_With_Clear_Message_When_Official_Update_From_Path_Times_Out()
    {
        var root = await Angular18Workspace();
        var ai = new SequenceAi(PackagePlan19(), VersionRecommendations19(), EmptyCriticalAlignment(18, 19), EmptyConfigPlan(), InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "safe install"));
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["19.2.22"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"])) CreateLocalAngularCli(root, 19, withMigrationMetadata: true);
            if (command.Contains("@angular/cli@19")) return new CommandResult { ReturnCode = 124, Stderr = "Command timed out (idle-timeout).", TimeoutKind = "idle-timeout", FailureCategory = "idle-timeout" };
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(18, 19, "Angular 18 to 19"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "18"), To = new RuntimeSpec("angular", "19"), Ai = new AiConfig { UseAi = true, Provider = "codex" }, MaxAiRemediationRetries = 1 }, null, null);

        Assert.Equal("failed", result.StringValue("status"));
        Assert.Equal("Angular CLI command timed out while running from npx @angular/cli@19.", result.StringValue("failureReason"));
        Assert.False(result.BoolValue("officialAngularUpdateExecuted"));
        Assert.Contains(runner.Calls, c => c.Command.Contains("@angular/cli@19") && c.Command.Contains("--migrate-only"));
        Assert.DoesNotContain(runner.Calls, c => c.Command.SequenceEqual(["npm", "run", "build"]));
    }

    [Fact]
    public async Task Metadata_Triggered_Migrate_Only_Stops_With_Clear_Message_When_Official_Migrate_Only_Times_Out()
    {
        var root = await Angular18Workspace();
        var ai = new SequenceAi(PackagePlan19(), VersionRecommendations19(), EmptyCriticalAlignment(18, 19), EmptyConfigPlan(), InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "safe install"));
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["19.2.22"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"])) CreateLocalAngularCli(root, 19, withMigrationMetadata: true);
            if (command.Contains("@angular/cli@19")) return new CommandResult { ReturnCode = 124, Stderr = "Command timed out (total-timeout).", TimeoutKind = "total-timeout", FailureCategory = "total-timeout" };
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(18, 19, "Angular 18 to 19"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "18"), To = new RuntimeSpec("angular", "19"), Ai = new AiConfig { UseAi = true, Provider = "codex" }, MaxAiRemediationRetries = 1 }, null, null);

        Assert.Equal("failed", result.StringValue("status"));
        Assert.Equal("Angular CLI command timed out while running from npx @angular/cli@19.", result.StringValue("failureReason"));
        Assert.False(result.BoolValue("officialAngularUpdateExecuted"));
        Assert.Contains(runner.Calls, c => c.Command.Contains("@angular/cli@19") && c.Command.Contains("--migrate-only"));
        Assert.DoesNotContain(runner.Calls, c => c.Command.SequenceEqual(["npm", "run", "build"]));
    }

    [Fact]
    public async Task Source_Framework_Migration_Uses_Npx_When_Local_Ng_Is_Missing()
    {
        var root = await Angular18Workspace();
        var ai = new SequenceAi(PackagePlan19(), VersionRecommendations19(), EmptyCriticalAlignment(18, 19), SourceFrameworkMigrationPlan("src/main.ts", "TypeScript source migration required for Angular framework API breaking change."), InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "safe install"));
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["19.2.22"]""" };
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(18, 19, "Angular 18 to 19"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "18"), To = new RuntimeSpec("angular", "19"), Ai = new AiConfig { UseAi = true, Provider = "codex" } }, null, null);

        Assert.Equal("done", result.StringValue("status"));
        Assert.True(result.BoolValue("officialAngularMigrateOnlyRequired"));
        Assert.True(result.BoolValue("officialAngularMigrateOnlyExecuted"));
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["NG_DISABLE_VERSION_CHECK=1", "npx", "-p", "@angular/cli@19", "ng", "update", "@angular/cli", "--migrate-only", "--from", "18", "--to", "19", "--allow-dirty"]));
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["NG_DISABLE_VERSION_CHECK=1", "npx", "-p", "@angular/cli@19", "ng", "update", "@angular/core", "--migrate-only", "--from", "18", "--to", "19", "--allow-dirty"]));
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["npm", "run", "build"]));
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
                ["command"] = new JsonArray("npm", "install", "--ignore-scripts", "--no-audit", "--no-fund"),
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
            ["validation"] = new JsonObject { ["passed"] = true },
            ["officialAngularMigrateOnlyExecuted"] = true,
            ["officialAngularMigrateOnlyTriggered"] = true,
            ["officialAngularMigrateOnlyTriggerReason"] = "manual_review changes",
            ["officialAngularMigrateOnlySource"] = "local node_modules",
            ["officialAngularMigrateOnlyCommand"] = new JsonArray("node_modules/.bin/ng", "update", "@angular/core", "@angular/cli", "--migrate-only", "--from", "14", "--to", "15"),
            ["officialAngularMigrateOnlyChangedFiles"] = new JsonArray("angular.json"),
            ["manualReviewAutoAcceptEnabled"] = true,
            ["manualReviewItemsReceived"] = 1,
            ["manualReviewAppliedChanges"] = new JsonArray(new JsonObject { ["filePath"] = "tsconfig.json", ["reason"] = "manual" }),
            ["manualReviewFailedChanges"] = new JsonArray(),
            ["manualReviewChangedFiles"] = new JsonArray("tsconfig.json")
        };

        var report = writer.GenerateAdapterHopReport(new JsonObject { ["manifest"] = new JsonObject(), ["to"] = "angular15" }, [hop], [result], new ValidationResult { Passed = true });

        Assert.Contains("## Install Strategy Decisions", report);
        Assert.Contains("Source=AI; strategy=normal", report);
        Assert.Contains("lockfile compatible", report);
        Assert.Contains("official update triggered=yes", report);
        Assert.Contains("manual_review auto-accept enabled: True", report);
        Assert.Contains("manual_review changes were auto-applied because intervention UI is not implemented yet.", report);
    }

    [Fact]
    public void Report_Includes_Accepted_And_Rejected_Package_Version_Recommendations()
    {
        var writer = new MarkdownReportWriter();
        var result = new JsonObject
        {
            ["hop"] = new JsonObject { ["fromVersion"] = 13, ["toVersion"] = 14 },
            ["status"] = "done",
            ["files"] = new JsonArray(),
            ["commands"] = new JsonArray(),
            ["preflightDependencyAnalysis"] = new JsonObject { ["warnings"] = new JsonArray(), ["blockers"] = new JsonArray(), ["remediations"] = new JsonArray() },
            ["validation"] = new JsonObject { ["passed"] = true },
            ["validationSummary"] = new JsonObject { ["passed"] = true },
            ["aiPackageVersionRecommendationsAccepted"] = new JsonArray(VersionRecommendation("@angular-devkit/build-angular", "^13.1.0", "^14.2.13", "Angular DevKit build tooling aligned with Angular 14 stable line.")),
            ["aiPackageVersionRecommendationsRejected"] = new JsonArray(new JsonObject
            {
                ["packageName"] = "@angular/core",
                ["currentVersion"] = "^13.3.0",
                ["recommendedVersion"] = "^14.3.0",
                ["rejectionReason"] = "Recommended version looks invented."
            }),
            ["packageTargetValidation"] = new JsonObject
            {
                ["verificationMode"] = "install-first",
                ["resolved"] = new JsonArray(new JsonObject
                {
                    ["packageName"] = "@angular-devkit/build-angular",
                    ["originalSuggestedVersion"] = "^14.2.13",
                    ["requestedTarget"] = "^14.2.13",
                    ["verificationMode"] = "install-first",
                    ["npmVerificationResult"] = "skipped",
                    ["npmValidationResult"] = "skipped",
                    ["finalAcceptedVersion"] = "^14.2.13"
                }),
                ["invalid"] = new JsonArray()
            }
        };

        var report = writer.GenerateAdapterHopReport(new JsonObject { ["manifest"] = new JsonObject(), ["to"] = "angular14" }, [new MigrationHop(13, 14, "Angular 13 to 14")], [result], new ValidationResult { Passed = true });

        Assert.Contains("## AI Package Version Recommendations", report);
        Assert.Contains("[recommended]", report);
        Assert.Contains("@angular-devkit/build-angular", report);
        Assert.Contains("[rejected]", report);
        Assert.Contains("^14.3.0", report);
        Assert.Contains("## Package Version Verification", report);
        Assert.Contains("npm view: skipped because install-first mode is enabled", report);
    }

    [Fact]
    public void Report_Includes_Angular_Critical_Dependency_Alignment()
    {
        var result = new JsonObject
        {
            ["hop"] = new JsonObject { ["fromVersion"] = 13, ["toVersion"] = 13 },
            ["status"] = "done",
            ["files"] = new JsonArray(),
            ["commands"] = new JsonArray(),
            ["preflightDependencyAnalysis"] = new JsonObject { ["warnings"] = new JsonArray(), ["blockers"] = new JsonArray(), ["remediations"] = new JsonArray() },
            ["validation"] = new JsonObject { ["passed"] = true },
            ["angularCriticalDependencyAlignmentAccepted"] = new JsonArray(CriticalRecommendation("typescript", "^5.5.4", "~4.5.5", "Angular 13 compiler-cli requires TypeScript <4.6.")),
            ["angularCriticalDependencyAlignmentRejected"] = new JsonArray()
        };

        var report = new MarkdownReportWriter().GenerateAdapterHopReport(new JsonObject { ["manifest"] = new JsonObject(), ["to"] = "angular13" }, [new MigrationHop(13, 13, "Angular 13 alignment")], [result], new ValidationResult { Passed = true });

        Assert.Contains("## Angular Critical Dependency Alignment", report);
        Assert.Contains("typescript: ^5.5.4 -> ~4.5.5", report);
        Assert.Contains("Criticality: required", report);
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
        var ai = new SequenceAi(PackagePlan(), VersionRecommendations(), EmptyConfigPlan(),
            InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "first"),
            InstallDecision("retrySameCommand", "npm install --ignore-scripts --no-audit --no-fund", "network retry", failure: "transientNetworkFailure", retry: true));
        var normalFailures = 0;
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["15.2.10"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"]) && normalFailures++ == 0) return new CommandResult { ReturnCode = 1, Stderr = "ECONNRESET request failed" };
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" } }, null, null);

        Assert.Equal("done", result.StringValue("status"));
        Assert.DoesNotContain(runner.Calls, c => c.Command.Contains("--legacy-peer-deps"));
        Assert.True(result.IntValue("transientNetworkRetriesUsed") >= 1);
    }

    [Fact]
    public async Task Ai_Legacy_Peer_Deps_Network_Failure_Retries_Same_Legacy_Command()
    {
        var root = await AngularWorkspace();
        var ai = new SequenceAi(PackagePlan(), VersionRecommendations(), EmptyConfigPlan(),
            InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "first"),
            InstallDecision("legacyPeerDepsInstall", "npm install --ignore-scripts --legacy-peer-deps --no-audit --no-fund", "peer fallback", failure: "peerDependencyConflict", retry: true, fallback: true),
            InstallDecision("retrySameCommand", "npm install --ignore-scripts --legacy-peer-deps --no-audit --no-fund", "network retry", failure: "transientNetworkFailure", retry: true));
        var runnerLegacyFailures = 0;
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["15.2.10"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"]) && !command.Contains("--legacy-peer-deps")) return new CommandResult { ReturnCode = 1, Stderr = "ERESOLVE peer dependency conflict" };
            if (command.Contains("--legacy-peer-deps") && runnerLegacyFailures++ == 0) return new CommandResult { ReturnCode = 1, Stderr = "ECONNRESET typescript-5.1.6.tgz" };
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

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
        var ai = new SequenceAi(PackagePlan(), VersionRecommendations(), EmptyConfigPlan(), InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "safe first install"));
        var runner = new RecordingRunner(command => command[0] == "npm" && command[1] == "view" ? new CommandResult { ReturnCode = 0, Stdout = """["15.2.10"]""" } : new CommandResult { ReturnCode = 0 });
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

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
    public async Task Build_Failure_Ts23_CreateNull_Triggers_TypeScript_Critical_Remediation()
    {
        var root = TestWorkspace.Create();
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """
{
  "scripts": {"build":"ng build"},
  "dependencies": {"@angular/core":"13.1.3"},
  "devDependencies": {"@angular/compiler-cli":"13.1.3","@angular-devkit/build-angular":"13.3.11","typescript":"^5.5.4"}
}
""");
        await File.WriteAllTextAsync(Path.Combine(root, "angular.json"), "{}");
        var buildAttempts = 0;
        var ai = new SequenceAi(
            new JsonObject
            {
                ["packages"] = new JsonArray(
                    PackageDecision("@angular/core", "13.1.3", "dependencies", "angular_framework_package", null, "preserve"),
                    PackageDecision("@angular/compiler-cli", "13.1.3", "devDependencies", "angular_tooling_package", null, "preserve"),
                    PackageDecision("@angular-devkit/build-angular", "13.3.11", "devDependencies", "angular_tooling_package", null, "preserve"),
                    PackageDecision("typescript", "^5.5.4", "devDependencies", "typescript_runtime_or_compiler_package", null, "preserve")),
                ["notes"] = new JsonArray()
            },
            new JsonObject { ["targetAngularMajor"] = 13, ["recommendations"] = new JsonArray(), ["warnings"] = new JsonArray() },
            new JsonObject { ["sourceAngularMajor"] = 13, ["targetAngularMajor"] = 13, ["recommendations"] = new JsonArray(), ["warnings"] = new JsonArray() },
            EmptyConfigPlan(),
            InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "safe first install"),
            CriticalAlignment(CriticalRecommendation("typescript", "^5.5.4", "~4.5.5", "Angular 13 compiler-cli requires TypeScript >=4.4 <4.6. TypeScript 5.5 caused ts23.createNull is not a function.")));
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = "\"13.4.0\"" };
            if (command.SequenceEqual(["npm", "ls", "typescript"])) return new CommandResult { ReturnCode = 1, Stderr = "typescript@5.5.4 invalid: >=4.4.2 <4.6 from @angular/compiler-cli@13.1.3" };
            if (command.SequenceEqual(["npm", "run", "build"]) && buildAttempts++ == 0) return new CommandResult { ReturnCode = 1, Stderr = "ts23.createNull is not a function" };
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(13, 13, "Angular 13 alignment"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "13"), To = new RuntimeSpec("angular", "13"), Ai = new AiConfig { UseAi = true, Provider = "codex" } }, null, null);
        var packageJson = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(root, "package.json")))!.AsObject();

        Assert.Equal("done", result.StringValue("status"));
        Assert.Equal("~4.5.5", packageJson["devDependencies"]!["typescript"]!.ToString());
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["npm", "ls", "typescript"]));
        Assert.Contains(runner.Calls, c => c.Command.Contains("--legacy-peer-deps"));
    }

    [Fact]
    public async Task Ai_Css_Dependency_Import_Direct_Tilde_Removal_Passes_Safety_When_Confirmed()
    {
        var root = await CssImportWorkspace();
        Directory.CreateDirectory(Path.Combine(root, "src"));
        await File.WriteAllTextAsync(Path.Combine(root, "src", "styles.scss"), "@import \"~@ng-select/ng-select/themes/material.theme.css\";\n");
        Directory.CreateDirectory(Path.Combine(root, "node_modules", "@ng-select", "ng-select", "themes"));
        await File.WriteAllTextAsync(Path.Combine(root, "node_modules", "@ng-select", "ng-select", "themes", "material.theme.css"), "");
        await File.WriteAllTextAsync(Path.Combine(root, "node_modules", "@ng-select", "ng-select", "package.json"), """{"name":"@ng-select/ng-select","version":"8.3.0"}""");
        var plan = CssImportPlan("src/styles.scss", "~@ng-select/ng-select/themes/material.theme.css", "@ng-select/ng-select/themes/material.theme.css");
        var validation = CssValidation("src/styles.scss", "~@ng-select/ng-select/themes/material.theme.css");

        var safety = AiRemediationPlanner.ValidatePlanForTesting(plan, validation, root);

        Assert.True(safety.Safe, safety.Reason);
    }

    [Fact]
    public async Task Ai_Css_Dependency_Import_Verified_Equivalent_Scss_Into_Css_Is_Rejected()
    {
        var root = await CssImportWorkspace();
        var plan = CssImportPlan("src/assets/css/style.css", "~@ng-select/ng-select/themes/material.theme.css", "@ng-select/ng-select/scss/material.theme");
        var validation = CssValidation("src/assets/css/style.css", "~@ng-select/ng-select/themes/material.theme.css");

        var safety = AiRemediationPlanner.ValidatePlanForTesting(plan, validation, root);

        Assert.False(safety.Safe);
        Assert.Contains("cannot import package SCSS from a .css source file", safety.Reason);
    }

    [Fact]
    public async Task Ai_Css_Dependency_Import_Changing_TypeScript_Is_Rejected()
    {
        var root = await CssImportWorkspace();
        var plan = CssImportPlan("src/app/app.component.ts", "~@ng-select/ng-select/themes/material.theme.css", "@ng-select/ng-select/scss/material.theme", "source_update");
        var validation = CssValidation("src/assets/css/style.css", "~@ng-select/ng-select/themes/material.theme.css");

        var safety = AiRemediationPlanner.ValidatePlanForTesting(plan, validation, root);

        Assert.False(safety.Safe);
        Assert.Contains("style asset imports", safety.Reason);
    }

    [Fact]
    public async Task Ai_Css_Dependency_Import_Changing_Package_Versions_Is_Rejected()
    {
        var root = await CssImportWorkspace();
        var plan = CssImportPlan("package.json", "\"@ng-select/ng-select\":\"^8.3.0\"", "\"@ng-select/ng-select\":\"^9.0.0\"", "package_update");
        var validation = CssValidation("src/assets/css/style.css", "~@ng-select/ng-select/themes/material.theme.css");

        var safety = AiRemediationPlanner.ValidatePlanForTesting(plan, validation, root);

        Assert.False(safety.Safe);
        Assert.Contains("style asset imports", safety.Reason);
    }

    [Fact]
    public async Task Css_Dependency_Import_Remediation_Removes_Only_Tilde_In_Containing_Style_Files()
    {
        var root = await CssImportWorkspace(includeSecondStyleFile: true);
        await File.WriteAllTextAsync(Path.Combine(root, "angular.json"), """{"projects":{"app":{"architect":{"build":{"options":{"styles":["src/styles.scss"]}}}}}}""");
        await File.WriteAllTextAsync(Path.Combine(root, "src", "styles.scss"), "@use '@angular/material' as mat;\n.app{display:block}\n");
        Directory.CreateDirectory(Path.Combine(root, "node_modules", "@ng-select", "ng-select", "themes"));
        await File.WriteAllTextAsync(Path.Combine(root, "node_modules", "@ng-select", "ng-select", "themes", "material.theme.css"), "");
        await File.WriteAllTextAsync(Path.Combine(root, "node_modules", "@ng-select", "ng-select", "package.json"), """{"name":"@ng-select/ng-select","version":"8.3.0"}""");
        var validation = CssValidation("src/assets/css/style.css", "~@ng-select/ng-select/themes/material.theme.css");

        var change = await AiRemediationPlanner.TryApplyDeterministicRemediationAsync(root, validation, 1, 1);

        Assert.NotNull(change);
        Assert.DoesNotContain("~@ng-select/ng-select/themes/material.theme.css", await File.ReadAllTextAsync(Path.Combine(root, "src", "assets", "css", "style.css")));
        Assert.Contains("~@ng-select/ng-select/themes/material.theme.css", await File.ReadAllTextAsync(Path.Combine(root, "src", "assets", "front", "css", "front-style.css")));
        Assert.Contains("@ng-select/ng-select/themes/material.theme.css", await File.ReadAllTextAsync(Path.Combine(root, "src", "assets", "css", "style.css")));
        Assert.Contains("~@ng-select/ng-select/themes/material.theme.css", await File.ReadAllTextAsync(Path.Combine(root, "src", "assets", "front", "css", "front-style.css")));
        Assert.DoesNotContain("@ng-select/ng-select/scss/material.theme", await File.ReadAllTextAsync(Path.Combine(root, "src", "assets", "front", "css", "front-style.css")));
        var globalScss = await File.ReadAllTextAsync(Path.Combine(root, "src", "styles.scss"));
        Assert.DoesNotContain("@ng-select/ng-select/scss/material.theme", globalScss);
    }

    [Fact]
    public async Task Ai_Css_Dependency_Import_Does_Not_Rerun_Build_When_Plan_Is_Rejected()
    {
        var root = await CssImportWorkspace(createNgSelectPackage: false);
        var ai = new SequenceAi(PackagePlan(), VersionRecommendations(), EmptyConfigPlan(),
            InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "safe first install"),
            CssImportPlan("src/assets/css/style.css", "~@ng-select/ng-select/themes/material.theme.css", "@ng-select/ng-select/scss/material.theme"));
        var buildRuns = 0;
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["15.2.10"]""" };
            if (command.SequenceEqual(["npm", "run", "build"]))
            {
                buildRuns++;
                return new CommandResult { ReturnCode = 1, Stderr = CssBuildError("src/assets/css/style.css", "~@ng-select/ng-select/themes/material.theme.css") };
            }
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" }, MaxAiRemediationRetries = 1 }, null, null);
        var report = new MarkdownReportWriter().GenerateAdapterHopReport(new JsonObject { ["manifest"] = new JsonObject(), ["to"] = "angular15" }, [new MigrationHop(14, 15, "Angular 14 to 15")], [result], new ValidationResult { Passed = false });

        Assert.Equal(1, buildRuns);
        Assert.Equal("failed", result.StringValue("status"));
        Assert.Contains("cannot import package SCSS from a .css source file", report);
        Assert.Contains("AI plan returned: True", report);
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
            new ProjectAnalyzer(ai, new PromptLoader()),
            new MigrationPlanner(ai, new PromptLoader()),
            new MigrationExecutor(),
            new MigrationValidator(),
            new AiRemediationPlanner(ai, new PromptLoader()),
            new RollbackService(),
            new MarkdownReportWriter(),
            new RunLog(),
            ai,
            new AiUsageTracker());

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

    [Fact]
    public async Task Angular_15_To_16_Compiler_Errors_Get_Targeted_Remediation_Before_Manual_Correction()
    {
        var root = TestWorkspace.Create();
        var packageJson = """
{
  "scripts": {"build":"ng build"},
  "dependencies": {
    "@angular/core": "^15.2.10",
    "@angular/common": "^15.2.10",
    "@angular/compiler": "^15.2.10",
    "@angular/cli": "^15.2.10",
    "ng6-toastr-notifications": "^1.0.4",
    "ngx-slick-carousel": "^0.6.0",
    "ngx-pinch-zoom": "^2.6.2",
    "angular-user-idle": "^2.2.7"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^15.2.10",
    "@angular/compiler-cli": "^15.2.10",
    "typescript": "~4.9.5"
  }
}
""";
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), packageJson);
        await File.WriteAllTextAsync(Path.Combine(root, "angular.json"), "{}");
        Directory.CreateDirectory(Path.Combine(root, "src", "app", "shared"));
        await File.WriteAllTextAsync(Path.Combine(root, "src", "app", "app.module.ts"), """
import { NgModule } from '@angular/core';
@NgModule({
  imports: [],
  declarations: [],
  entryComponents : [ConfirmationDialogComponent]
})
export class AppModule {}
""");
        await File.WriteAllTextAsync(Path.Combine(root, "src", "app", "shared", "shared.module.ts"), """
import { NgModule } from '@angular/core';
import { SlickCarouselModule } from 'ngx-slick-carousel';
@NgModule({
  imports: [SlickCarouselModule],
  exports: [SlickCarouselModule]
})
export class SharedModule {}
""");

        var aiPackagePlan = new JsonObject
        {
            ["packages"] = new JsonArray(
                PackageDecision("@angular/core", "^15.2.10", "dependencies", "angular_framework_package", "^16.2.12", "upgrade"),
                PackageDecision("@angular/common", "^15.2.10", "dependencies", "angular_framework_package", "^16.2.12", "upgrade"),
                PackageDecision("@angular/compiler", "^15.2.10", "dependencies", "angular_framework_package", "^16.2.12", "upgrade"),
                PackageDecision("@angular/cli", "^15.2.10", "dependencies", "angular_tooling_package", "^16.2.12", "upgrade"),
                PackageDecision("@angular-devkit/build-angular", "^15.2.10", "devDependencies", "angular_tooling_package", "^16.2.12", "upgrade"),
                PackageDecision("@angular/compiler-cli", "^15.2.10", "devDependencies", "angular_tooling_package", "^16.2.12", "upgrade"),
                PackageDecision("typescript", "~4.9.5", "devDependencies", "typescript_runtime_or_compiler_package", "~5.1.6", "upgrade")),
            ["notes"] = new JsonArray()
        };
        var aiRemediation = new JsonObject
        {
            ["remediations"] = new JsonArray(
                ThirdPartyRemediation("ng6-toastr-notifications", "^1.0.4", "^1.0.5"),
                ThirdPartyRemediation("ngx-slick-carousel", "^0.6.0", "^0.7.0"),
                ThirdPartyRemediation("ngx-pinch-zoom", "^2.6.2", "^2.7.0"),
                ThirdPartyRemediation("angular-user-idle", "^2.2.7", "^4.0.0"))
        };
        var ai = new SequenceAi(
            aiPackagePlan,
            VersionRecommendations(
                VersionRecommendation("@angular/core", "^15.2.10", "^16.2.12", "Angular framework package aligned to Angular 16."),
                VersionRecommendation("@angular-devkit/build-angular", "^15.2.10", "^16.2.12", "Angular DevKit build tooling aligned to Angular 16."),
                VersionRecommendation("@angular/compiler-cli", "^15.2.10", "^16.2.12", "Angular compiler CLI aligned to Angular 16."),
                VersionRecommendation("typescript", "~4.9.5", "~5.1.6", "TypeScript compatible with Angular 16.")),
            EmptyCriticalAlignment(15, 16),
            EmptyConfigPlan(),
            InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "safe install"),
            aiRemediation);
        var buildRuns = 0;
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view")
            {
                var spec = command[2];
                if (spec.StartsWith("ngx-slick-carousel@", StringComparison.Ordinal)) return new CommandResult { ReturnCode = 0, Stdout = """["15.0.0"]""" };
                if (spec.StartsWith("angular-user-idle@", StringComparison.Ordinal)) return new CommandResult { ReturnCode = 0, Stdout = """["4.0.0"]""" };
                if (spec.StartsWith("@mtnair/ngx-pinch-zoom@", StringComparison.Ordinal)) return new CommandResult { ReturnCode = 0, Stdout = """["2.5.12"]""" };
                return new CommandResult { ReturnCode = 0, Stdout = """["16.2.12","5.1.6","17.0.2"]""" };
            }
            if (command.Take(2).SequenceEqual(["npm", "install"])) return new CommandResult { ReturnCode = 0 };
            if (command.SequenceEqual(["npm", "run", "build"]))
            {
                buildRuns++;
                return buildRuns < 3 ? new CommandResult { ReturnCode = 1, Stderr = Angular16FailureSample } : new CommandResult { ReturnCode = 0 };
            }
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(15, 16, "Angular 15 to 16"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "15"), To = new RuntimeSpec("angular", "16"), Ai = new AiConfig { UseAi = true, Provider = "codex" }, MaxAiRemediationRetries = 2, SourceCompatibilityRemediation = true }, null, null);
        var report = new MarkdownReportWriter().GenerateAdapterHopReport(new JsonObject { ["manifest"] = new JsonObject(), ["to"] = "angular16" }, [new MigrationHop(15, 16, "Angular 15 to 16")], [result], new ValidationResult { Passed = true });

        Assert.True(result.StringValue("status") == "done", result.ToJsonString(JsonHelpers.SerializerOptions));
        Assert.DoesNotContain("entryComponents", await File.ReadAllTextAsync(Path.Combine(root, "src", "app", "app.module.ts")));
        Assert.Contains("\"angular-user-idle\": \"^4.0.0\"", await File.ReadAllTextAsync(Path.Combine(root, "package.json")));
        Assert.DoesNotContain("ngx-toastr", await File.ReadAllTextAsync(Path.Combine(root, "package.json")));
        Assert.Contains(result["aiRemediationChanges"]!.AsArray().OfType<JsonObject>(), c => c.StringValue("failureCategory") == "obsolete_angular_metadata");
        Assert.Contains(result["aiRemediationChanges"]!.AsArray().OfType<JsonObject>(), c => c.StringValue("type") == "package_update");
        Assert.Contains(result["aiRemediationChanges"]!.AsArray().OfType<JsonObject>(), c => c.StringValue("type") == "compatibility_shim" && c.BoolValue("manualReviewRequired"));
        Assert.Empty(result["manualCorrectionRequests"]!.AsArray());
        Assert.Contains(runner.Calls, c => c.Command.Take(2).SequenceEqual(["npm", "install"]));
        Assert.Contains("## AI Remediation Root Cause Analysis", report);
        Assert.Contains("ng6-toastr-notifications", report);
        Assert.Contains("ngx-slick-carousel", report);
        Assert.Contains("cascading local module error", report);
        Assert.Contains("@NgModule present=True", report);
    }

    [Theory]
    [InlineData(
        "  imports: [CommonModule],\n  entryComponents: [SomeComponent],\n  schemas: [CUSTOM_ELEMENTS_SCHEMA]\n",
        "  imports: [CommonModule],\n  schemas: [CUSTOM_ELEMENTS_SCHEMA]\n")]
    [InlineData(
        "  declarations: [SomeComponent],\n  entryComponents: [DialogComponent],\n  imports: [CommonModule]\n",
        "  declarations: [SomeComponent],\n  imports: [CommonModule]\n")]
    [InlineData(
        "  imports: [CommonModule],\n  entryComponents: [SomeComponent]\n",
        "  imports: [CommonModule]\n")]
    [InlineData(
        "  entryComponents: [SomeComponent],\n  schemas: [CUSTOM_ELEMENTS_SCHEMA]\n",
        "  schemas: [CUSTOM_ELEMENTS_SCHEMA]\n")]
    [InlineData(
        "  entryComponents: [SomeComponent]\n",
        "")]
    public async Task EntryComponents_Removal_Preserves_NgModule_Metadata_Commas(string metadataBefore, string metadataAfter)
    {
        var root = TestWorkspace.Create();
        var moduleFile = Path.Combine(root, "src", "app", "app.module.ts");
        Directory.CreateDirectory(Path.GetDirectoryName(moduleFile)!);
        var before = "import { NgModule } from '@angular/core';\n@NgModule({\n" + metadataBefore + "})\nexport class AppModule {}\n";
        var expected = "import { NgModule } from '@angular/core';\n@NgModule({\n" + metadataAfter + "})\nexport class AppModule {}\n";
        await File.WriteAllTextAsync(moduleFile, before);
        var validation = new ValidationResult
        {
            Passed = false,
            Output = "Error: src/app/app.module.ts:3:3 - error TS2345: Object literal may only specify known properties, and 'entryComponents' does not exist in type 'NgModule'."
        };

        var change = await AiRemediationPlanner.TryApplyDeterministicRemediationAsync(root, validation, 1, 3, sourceCompatibilityRemediation: true);
        var after = await File.ReadAllTextAsync(moduleFile);

        Assert.NotNull(change);
        Assert.Equal(expected, after);
        Assert.DoesNotContain("entryComponents", after);
        Assert.DoesNotContain("]\nschemas:", after);
        Assert.DoesNotContain("]\nproviders:", after);
        Assert.DoesNotContain("]\ndeclarations:", after);
        Assert.DoesNotContain("]\nimports:", after);
        Assert.DoesNotContain("]\nexports:", after);
        Assert.DoesNotContain("]\nbootstrap:", after);
    }

    [Fact]
    public async Task EntryComponents_Cleanup_Does_Not_Block_NgxPagination_Package_Remediation()
    {
        var root = await AngularWorkspace(extraDependencies: @",""ngx-pagination"":""^5.1.1""");
        Directory.CreateDirectory(Path.Combine(root, "src", "app"));
        await File.WriteAllTextAsync(Path.Combine(root, "src", "app", "app.module.ts"), """
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
@NgModule({
  imports: [],
  entryComponents: [SomeComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {}
""");
        var buildRuns = 0;
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view")
            {
                if (command[2].StartsWith("ngx-pagination@", StringComparison.Ordinal)) return new CommandResult { ReturnCode = 0, Stdout = """["6.0.3"]""" };
                return new CommandResult { ReturnCode = 0, Stdout = """["16.2.12","5.1.6"]""" };
            }
            if (command.Take(2).SequenceEqual(["npm", "install"])) return new CommandResult { ReturnCode = 0 };
            if (command.SequenceEqual(["npm", "run", "build"]))
            {
                buildRuns++;
                return buildRuns switch
                {
                    1 => new CommandResult { ReturnCode = 1, Stderr = "Error: src/app/app.module.ts:4:3 - error TS2345: Object literal may only specify known properties, and 'entryComponents' does not exist in type 'NgModule'." },
                    2 => new CommandResult { ReturnCode = 1, Stderr = "Error: node_modules/ngx-pagination/dist/ngx-pagination.module.d.ts:6:22 - error NG6002: NgxPaginationModule does not appear to be an NgModule class. This likely means that the library (ngx-pagination) which declares NgxPaginationModule is not compatible with Angular Ivy." },
                    _ => new CommandResult { ReturnCode = 0 }
                };
            }
            return new CommandResult { ReturnCode = 0 };
        });

        var result = await new AngularAdapter(runner).ExecuteMigrationHopAsync(root, new MigrationHop(15, 16, "Angular 15 to 16"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "15"), To = new RuntimeSpec("angular", "16"), MaxAiRemediationRetries = 3, SourceCompatibilityRemediation = true }, null, null);
        var packageJson = await File.ReadAllTextAsync(Path.Combine(root, "package.json"));
        var appModule = await File.ReadAllTextAsync(Path.Combine(root, "src", "app", "app.module.ts"));

        Assert.Equal("done", result.StringValue("status"));
        Assert.Contains("\"ngx-pagination\": \"^6.0.3\"", packageJson);
        Assert.Contains("imports: [],\n  schemas:", appModule.Replace("\r\n", "\n"));
        Assert.DoesNotContain("entryComponents", appModule);
        Assert.Contains(result["aiRemediationChanges"]!.AsArray().OfType<JsonObject>(), c => c.StringValue("failureCategory") == "obsolete_angular_metadata");
        Assert.Contains(result["aiRemediationChanges"]!.AsArray().OfType<JsonObject>(), c => c.StringValue("packageName") == "ngx-pagination" && c.StringValue("selectedRemediation") == "same_package_upgrade");
        Assert.Contains(runner.Calls, c => c.Command.Take(2).SequenceEqual(["npm", "install"]) && c.Command.Contains("--legacy-peer-deps"));
    }

    [Fact]
    public void Angular_15_To_16_Third_Party_Blocker_Parser_Classifies_NodeModules_Errors_And_SharedModule_As_Cascading()
    {
        var root = TestWorkspace.Create();
        Directory.CreateDirectory(Path.Combine(root, "src", "app", "shared"));
        File.WriteAllText(Path.Combine(root, "package.json"), """
{
  "dependencies": {
    "ngx-bootstrap": "^6.0.0",
    "ng6-toastr-notifications": "^1.0.4",
    "ngx-slick-carousel": "^0.6.0",
    "ngx-pinch-zoom": "^2.6.2",
    "angular-user-idle": "^2.2.7",
    "ngx-color-picker": "^9.1.0"
  }
}
""");
        File.WriteAllText(Path.Combine(root, "src", "app", "shared", "shared.module.ts"), "import { NgModule } from '@angular/core';\n@NgModule({})\nexport class SharedModule {}\n");
        var output = Angular16FailureSample + """

Error: node_modules/ngx-bootstrap/dropdown/dropdown.directive.d.ts:2:10 - error TS2305: Module '"@angular/core"' has no exported member 'ɵɵDirectiveDefWithMeta'.
Error: node_modules/ngx-bootstrap/dropdown/dropdown.module.d.ts:2:10 - error TS2305: Module '"@angular/core"' has no exported member 'ɵɵNgModuleDefWithMeta'.
Error: node_modules/ngx-pinch-zoom/lib/model/visibility-state.d.ts:1:20 - error TS2304: Cannot find name 'VisibilityState'.
Error: node_modules/ngx-color-picker/lib/color-picker.service.d.ts:1:10 - error TS2305: Module '"@angular/core"' has no exported member 'ReflectiveInjector'.
""";

        var blockers = AngularAdapter.DetectThirdPartyValidationBlockersForTesting(root, output, new MigrationHop(15, 16, "Angular 15 to 16"));
        var names = blockers.Select(b => b.StringValue("package")).ToArray();

        Assert.Contains("ngx-bootstrap", names);
        Assert.Contains("ng6-toastr-notifications", names);
        Assert.Contains("ngx-slick-carousel", names);
        Assert.Contains("ngx-pinch-zoom", names);
        Assert.Contains("angular-user-idle", names);
        Assert.Contains("ngx-color-picker", names);
        Assert.DoesNotContain("SharedModule", names);
        Assert.Contains(blockers, b => b.StringValue("package") == "ngx-pinch-zoom" && b.StringValue("errorCategory") == "third_party_declaration_type_missing");
        Assert.All(blockers.Where(b => b.StringValue("package") != "ngx-pinch-zoom"), b => Assert.Equal("third_party_angular_library_incompatibility", b.StringValue("errorCategory")));
    }

    [Theory]
    [InlineData("ngx-bootstrap", "^6.0.0", "Error: node_modules/ngx-bootstrap/dropdown/dropdown.directive.d.ts:2:10 - error TS2305: Module '\"@angular/core\"' has no exported member 'ɵɵDirectiveDefWithMeta'.")]
    [InlineData("ng6-toastr-notifications", "^1.0.4", "Error: node_modules/ng6-toastr-notifications/lib/toastr.module.d.ts:3:23 - error TS2314: Generic type 'ModuleWithProviders<T>' requires 1 type argument(s).")]
    [InlineData("ngx-slick-carousel", "^0.6.0", "Error: node_modules/ngx-slick-carousel/slick/slick.module.d.ts:1:22 - error NG6002: SlickCarouselModule does not appear to be an NgModule class.")]
    [InlineData("angular-user-idle", "^2.2.7", "Error: node_modules/angular-user-idle/lib/angular-user-idle.module.d.ts:1:22 - error NG6002: UserIdleModule does not appear to be an NgModule class.")]
    [InlineData("ngx-color-picker", "^9.1.0", "Error: node_modules/ngx-color-picker/lib/color-picker.service.d.ts:1:10 - error TS2305: Module '\"@angular/core\"' has no exported member 'ReflectiveInjector'.")]
    public void Angular_15_To_16_Known_Third_Party_Blockers_Are_Classified_As_Angular_Library_Incompatibility(string packageName, string version, string error)
    {
        var root = TestWorkspace.Create();
        File.WriteAllText(Path.Combine(root, "package.json"), "{\"dependencies\":{\"" + packageName + "\":\"" + version + "\"}}");

        var blockers = AngularAdapter.DetectThirdPartyValidationBlockersForTesting(root, "$ npm run build\nexit code: 1\n" + error, new MigrationHop(15, 16, "Angular 15 to 16"));

        var blocker = Assert.Single(blockers);
        Assert.Equal(packageName, blocker.StringValue("package"));
        Assert.Equal("validation_proven_third_party_blocker", blocker.StringValue("classification"));
        Assert.Equal("third_party_angular_library_incompatibility", blocker.StringValue("errorCategory"));
    }

    [Fact]
    public void Ng600x_NodeModules_Errors_Classify_Unknown_ThirdParty_Packages_As_Validation_Blockers()
    {
        var root = TestWorkspace.Create();
        File.WriteAllText(Path.Combine(root, "package.json"), """
{"dependencies":{"@ng-idle/keepalive":"^11.0.3","ngx-spinner":"^11.0.2","ngx-order-pipe":"^2.2.0"}}
""");
        var output = """
Error: src/app/app.module.ts:148:5 - error NG6002: 'NgIdleKeepaliveModule' does not appear to be an NgModule class.
node_modules/@ng-idle/keepalive/lib/module.d.ts:1:22
This likely means that the library (@ng-idle/keepalive) which declares NgIdleKeepaliveModule is not compatible with Angular Ivy.
Error: src/app/app.module.ts:149:5 - error NG6002: 'NgxSpinnerModule' does not appear to be an NgModule class.
node_modules/ngx-spinner/lib/ngx-spinner.module.d.ts:1:22
This likely means that the library (ngx-spinner) which declares NgxSpinnerModule is not compatible with Angular Ivy.
Error: src/app/app.module.ts:150:5 - error NG6003: 'OrderModule' does not appear to be an NgModule, Component, Directive, or Pipe class.
node_modules/ngx-order-pipe/src/app/order-pipe/ngx-order.module.d.ts:1:22
This likely means that the library (ngx-order-pipe) which declares OrderModule is not compatible with Angular Ivy.
""";

        var blockers = AngularAdapter.DetectThirdPartyValidationBlockersForTesting(root, output, new MigrationHop(15, 16, "Angular 15 to 16"));

        Assert.Equal(["@ng-idle/keepalive", "ngx-order-pipe", "ngx-spinner"], blockers.Select(b => b.StringValue("package")).Order(StringComparer.OrdinalIgnoreCase).ToArray());
        Assert.Contains(blockers, b => b.StringValue("package") == "@ng-idle/keepalive" && b.StringValue("nodeModulesPath") == "node_modules/@ng-idle/keepalive/lib/module.d.ts" && b.StringValue("moduleSymbol") == "NgIdleKeepaliveModule" && b.StringValue("errorCode") == "NG6002");
        Assert.Contains(blockers, b => b.StringValue("package") == "ngx-spinner" && b.StringValue("nodeModulesPath") == "node_modules/ngx-spinner/lib/ngx-spinner.module.d.ts" && b.StringValue("moduleSymbol") == "NgxSpinnerModule" && b.StringValue("errorCode") == "NG6002");
        Assert.Contains(blockers, b => b.StringValue("package") == "ngx-order-pipe" && b.StringValue("nodeModulesPath") == "node_modules/ngx-order-pipe/src/app/order-pipe/ngx-order.module.d.ts" && b.StringValue("moduleSymbol") == "OrderModule" && b.StringValue("errorCode") == "NG6003");
        Assert.All(blockers, b => Assert.Equal("validation-proven Angular build blocker", b.StringValue("decision")));
    }

    [Fact]
    public void SharedModule_Is_Cascading_Not_ThirdParty_Blocker_When_NodeModules_Errors_Exist()
    {
        var root = TestWorkspace.Create();
        File.WriteAllText(Path.Combine(root, "package.json"), """{"dependencies":{"ngx-slick-carousel":"^0.6.0"}}""");
        var output = """
$ npm run build
exit code: 1
Error: node_modules/ngx-slick-carousel/slick/slick.module.d.ts:1:22 - error NG6002: SlickCarouselModule does not appear to be an NgModule class.
Error: src/app/app.module.ts:36:5 - error NG6002: SharedModule does not appear to be an NgModule class.
""";

        var blockers = AngularAdapter.DetectThirdPartyValidationBlockersForTesting(root, output, new MigrationHop(15, 16, "Angular 15 to 16"));

        Assert.Contains(blockers, b => b.StringValue("package") == "ngx-slick-carousel");
        Assert.DoesNotContain(blockers, b => b.StringValue("package").Contains("SharedModule", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void NgxPinchZoom_VisibilityState_Build_Error_Is_Classified_As_ThirdPartyDeclarationTypeMissing()
    {
        var root = TestWorkspace.Create();
        File.WriteAllText(Path.Combine(root, "package.json"), """{"dependencies":{"ngx-pinch-zoom":"^2.5.6"}}""");

        var blockers = AngularAdapter.DetectThirdPartyValidationBlockersForTesting(root, NgxPinchZoomVisibilityStateError(), new MigrationHop(13, 14, "Angular 13 to 14"));

        var blocker = Assert.Single(blockers);
        Assert.Equal("ngx-pinch-zoom", blocker.StringValue("package"));
        Assert.Equal("third_party_declaration_type_missing", blocker.StringValue("errorCategory"));
    }

    [Fact]
    public async Task Validation_Proven_Third_Party_Blocker_Is_Upgraded_With_Npm_Verified_Target()
    {
        var root = await AngularWorkspace(extraDependencies: @",""ngx-slick-carousel"":""^0.6.0""");
        var ai = new SequenceAi(
            new JsonObject
            {
                ["packages"] = new JsonArray(
                    PackageDecision("@angular/core", "14.2.0", "dependencies", "angular_framework_package", "^16.2.12", "upgrade"),
                    PackageDecision("@angular/cli", "14.2.0", "dependencies", "angular_tooling_package", "^16.2.12", "upgrade"),
                    PackageDecision("typescript", "~4.8.4", "devDependencies", "typescript_runtime_or_compiler_package", "~5.1.6", "upgrade"),
                    PackageDecision("ngx-slick-carousel", "^0.6.0", "dependencies", "angular_ui_or_extension_package", null, "preserve")),
                ["notes"] = new JsonArray()
            },
            VersionRecommendations(
                VersionRecommendation("@angular/core", "14.2.0", "^16.2.12", "Angular framework package aligned."),
                VersionRecommendation("@angular/cli", "14.2.0", "^16.2.12", "Angular CLI aligned."),
                VersionRecommendation("typescript", "~4.8.4", "~5.1.6", "TypeScript aligned.")),
            EmptyCriticalAlignment(15, 16),
            EmptyConfigPlan(),
            InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "safe install"),
            new JsonObject
            {
                ["remediations"] = new JsonArray(new JsonObject
                {
                    ["packageName"] = "ngx-slick-carousel",
                    ["currentVersion"] = "^0.6.0",
                    ["detectedErrorCategory"] = "third_party_angular_library_incompatibility",
                    ["action"] = "upgrade",
                    ["targetPackageName"] = "ngx-slick-carousel",
                    ["targetVersionRange"] = "^0.7.0",
                    ["reason"] = "Validation proved the installed package is not Angular Ivy compatible.",
                    ["expectedCodeImpact"] = "none",
                    ["requiresSourceChanges"] = false,
                    ["sourceChangeScope"] = "package_json_only",
                    ["confidence"] = 0.91,
                    ["validationCommand"] = "npm run build"
                })
            });
        var buildRuns = 0;
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = command[2].StartsWith("ngx-slick-carousel@", StringComparison.Ordinal) ? """["15.0.0"]""" : """["16.2.12","5.1.6"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"])) return new CommandResult { ReturnCode = 0 };
            if (command.SequenceEqual(["npm", "run", "build"])) return ++buildRuns == 1 ? new CommandResult { ReturnCode = 1, Stderr = "Error: node_modules/ngx-slick-carousel/slick/slick.module.d.ts:1:22 - error NG6002: SlickCarouselModule does not appear to be an NgModule class." } : new CommandResult { ReturnCode = 0 };
            return new CommandResult { ReturnCode = 0 };
        });

        var result = await new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader()).ExecuteMigrationHopAsync(root, new MigrationHop(15, 16, "Angular 15 to 16"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "15"), To = new RuntimeSpec("angular", "16"), Ai = new AiConfig { UseAi = true, Provider = "codex" }, MaxAiRemediationRetries = 1 }, null, null);
        var deps = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(root, "package.json")))!["dependencies"]!.AsObject();

        Assert.Equal("done", result.StringValue("status"));
        Assert.Equal("15.0.0", deps["ngx-slick-carousel"]!.ToString());
        Assert.Contains(result["thirdPartyValidationBlockers"]!.AsArray().OfType<JsonObject>(), b => b.StringValue("package") == "ngx-slick-carousel");
        Assert.Contains(result["aiRemediationChanges"]!.AsArray().OfType<JsonObject>(), c => c.StringValue("failureCause") == "validation_proven_third_party_blocker" && c.StringValue("finalSelected") == "15.0.0");
    }

    [Fact]
    public async Task Third_Party_Remediation_Request_Includes_Only_Validation_Proven_Blockers()
    {
        var root = await AngularWorkspace(extraDependencies: @",""ngx-bootstrap"":""^6.0.0"",""ngx-slick-carousel"":""^0.6.0"",""lodash"":""^4.17.0""");
        var ai = new SequenceAi(
            new JsonObject
            {
                ["packages"] = new JsonArray(
                    PackageDecision("@angular/core", "14.2.0", "dependencies", "angular_framework_package", "^16.2.12", "upgrade"),
                    PackageDecision("@angular/cli", "14.2.0", "dependencies", "angular_tooling_package", "^16.2.12", "upgrade"),
                    PackageDecision("typescript", "~4.8.4", "devDependencies", "typescript_runtime_or_compiler_package", "~5.1.6", "upgrade"),
                    PackageDecision("ngx-bootstrap", "^6.0.0", "dependencies", "angular_ui_or_extension_package", null, "preserve"),
                    PackageDecision("ngx-slick-carousel", "^0.6.0", "dependencies", "angular_ui_or_extension_package", null, "preserve"),
                    PackageDecision("lodash", "^4.17.0", "dependencies", "third_party_runtime_package", null, "preserve")),
                ["notes"] = new JsonArray()
            },
            VersionRecommendations(
                VersionRecommendation("@angular/core", "14.2.0", "^16.2.12", "Angular framework package aligned."),
                VersionRecommendation("@angular/cli", "14.2.0", "^16.2.12", "Angular CLI aligned."),
                VersionRecommendation("typescript", "~4.8.4", "~5.1.6", "TypeScript aligned.")),
            EmptyCriticalAlignment(15, 16),
            EmptyConfigPlan(),
            InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "safe install"),
            new JsonObject { ["remediations"] = new JsonArray() });
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["16.2.12","5.1.6"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"])) return new CommandResult { ReturnCode = 0 };
            if (command.SequenceEqual(["npm", "run", "build"])) return new CommandResult { ReturnCode = 1, Stderr = "Error: node_modules/ngx-bootstrap/dropdown/dropdown.directive.d.ts:2:10 - error TS2305: Module '\"@angular/core\"' has no exported member 'ɵɵDirectiveDefWithMeta'." };
            return new CommandResult { ReturnCode = 0 };
        });

        await new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader()).ExecuteMigrationHopAsync(root, new MigrationHop(15, 16, "Angular 15 to 16"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "15"), To = new RuntimeSpec("angular", "16"), Ai = new AiConfig { UseAi = true, Provider = "codex" }, MaxAiRemediationRetries = 1 }, null, null);
        Assert.DoesNotContain(ai.SystemPrompts, p => p.Contains("validation-proven third-party blockers", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "ngx-bootstrap@^11.0.2", "version", "--json"]));
    }

    [Fact]
    public async Task Validation_Driven_Remediation_Asks_Ai_For_All_Ng600x_NodeModules_Blockers_In_One_Pass()
    {
        var root = await AngularWorkspace(extraDependencies: @",""@ng-idle/keepalive"":""^11.0.3"",""ngx-spinner"":""^11.0.2"",""ngx-order-pipe"":""^2.2.0""");
        CreateLocalAngularCli(root);
        var ai = new SequenceAi(
            new JsonObject
            {
                ["packages"] = new JsonArray(
                    PackageDecision("@angular/core", "14.2.0", "dependencies", "angular_framework_package", "^16.2.12", "upgrade"),
                    PackageDecision("@angular/cli", "14.2.0", "dependencies", "angular_tooling_package", "^16.2.12", "upgrade"),
                    PackageDecision("typescript", "~4.8.4", "devDependencies", "typescript_runtime_or_compiler_package", "~5.1.6", "upgrade"),
                    PackageDecision("@ng-idle/keepalive", "^11.0.3", "dependencies", "business_or_unknown_package", null, "manual_review"),
                    PackageDecision("ngx-spinner", "^11.0.2", "dependencies", "business_or_unknown_package", null, "manual_review"),
                    PackageDecision("ngx-order-pipe", "^2.2.0", "dependencies", "business_or_unknown_package", null, "manual_review")),
                ["notes"] = new JsonArray()
            },
            VersionRecommendations(
                VersionRecommendation("@angular/core", "14.2.0", "^16.2.12", "Angular framework package aligned."),
                VersionRecommendation("@angular/cli", "14.2.0", "^16.2.12", "Angular CLI aligned."),
                VersionRecommendation("typescript", "~4.8.4", "~5.1.6", "TypeScript aligned.")),
            EmptyCriticalAlignment(15, 16),
            EmptyConfigPlan(),
            InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "safe install"),
            new JsonObject
            {
                ["packageUpdates"] = new JsonArray(
                    ThirdPartyPackageUpdate("@ng-idle/keepalive", "^11.0.3", "^16.0.0"),
                    ThirdPartyPackageUpdate("ngx-spinner", "^11.0.2", "^16.0.2"),
                    ThirdPartyPackageUpdate("ngx-order-pipe", "^2.2.0", "^3.0.0")),
                ["manualReview"] = new JsonArray()
            });
        var buildRuns = 0;
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view")
            {
                if (command[2].StartsWith("@ng-idle/keepalive@", StringComparison.Ordinal)) return new CommandResult { ReturnCode = 0, Stdout = """["16.0.0"]""" };
                if (command[2].StartsWith("ngx-spinner@", StringComparison.Ordinal)) return new CommandResult { ReturnCode = 0, Stdout = """["16.0.2"]""" };
                if (command[2].StartsWith("ngx-order-pipe@", StringComparison.Ordinal)) return new CommandResult { ReturnCode = 0, Stdout = """["3.0.0"]""" };
                return new CommandResult { ReturnCode = 0, Stdout = """["16.2.12","5.1.6"]""" };
            }
            if (command.Take(2).SequenceEqual(["npm", "install"]))
            {
                CreateLocalAngularCli(root);
                return new CommandResult { ReturnCode = 0 };
            }
            if (command.SequenceEqual(["npm", "run", "build"])) return ++buildRuns == 1 ? new CommandResult { ReturnCode = 1, Stderr = Ng600xThirdPartyFailureSample() } : new CommandResult { ReturnCode = 0 };
            if (command.SequenceEqual([LocalNgCommand(), "build"])) return ++buildRuns == 2 ? new CommandResult { ReturnCode = 0 } : new CommandResult { ReturnCode = 1, Stderr = Ng600xThirdPartyFailureSample() };
            return new CommandResult { ReturnCode = 0 };
        });

        var result = await new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader()).ExecuteMigrationHopAsync(root, new MigrationHop(15, 16, "Angular 15 to 16"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "15"), To = new RuntimeSpec("angular", "16"), Ai = new AiConfig { UseAi = true, Provider = "codex" }, MaxAiRemediationRetries = 1 }, null, null);
        var deps = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(root, "package.json")))!["dependencies"]!.AsObject();
        var remediationPayload = ai.Users.Last(u => u.Contains("validationProvenBlockers", StringComparison.Ordinal));

        Assert.Equal("done", result.StringValue("status"));
        Assert.Equal("^16.0.0", deps["@ng-idle/keepalive"]!.ToString());
        Assert.Equal("^16.0.2", deps["ngx-spinner"]!.ToString());
        Assert.Equal("^3.0.0", deps["ngx-order-pipe"]!.ToString());
        Assert.Contains("@ng-idle/keepalive", remediationPayload);
        Assert.Contains("ngx-spinner", remediationPayload);
        Assert.Contains("ngx-order-pipe", remediationPayload);
        Assert.Contains("\"packageUpdates\"", remediationPayload);
        Assert.DoesNotContain("\"remediations\"", remediationPayload);
        Assert.DoesNotContain("\"targetVersionRange\"", remediationPayload);
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["npm", "install", "--ignore-scripts", "--legacy-peer-deps", "--no-audit", "--no-fund"]));
        Assert.Equal(1, runner.Calls.Count(c => c.Command.SequenceEqual(["npm", "run", "build"])));
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual([LocalNgCommand(), "build"]));
    }

    [Fact]
    public async Task Third_Party_Remediation_Legacy_TargetVersionRange_Is_Normalized_With_Warning()
    {
        var root = await AngularWorkspace(extraDependencies: @",""@ng-idle/keepalive"":""^11.0.3""");
        var ai = Angular15To16AiWithThirdPartyResponse(new JsonObject
        {
            ["remediations"] = new JsonArray(ThirdPartyRemediation("@ng-idle/keepalive", "^11.0.3", "^16.0.0"))
        });
        var buildRuns = 0;
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = command[2].StartsWith("@ng-idle/keepalive@", StringComparison.Ordinal) ? """["16.0.0"]""" : """["16.2.12","5.1.6"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"])) return new CommandResult { ReturnCode = 0 };
            if (command.SequenceEqual(["npm", "run", "build"])) return ++buildRuns == 1 ? new CommandResult { ReturnCode = 1, Stderr = "Error: node_modules/@ng-idle/keepalive/lib/module.d.ts:1:22 - error NG6002: NgIdleKeepaliveModule does not appear to be an NgModule class." } : new CommandResult { ReturnCode = 0 };
            return new CommandResult { ReturnCode = 0 };
        });

        var result = await new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader()).ExecuteMigrationHopAsync(root, new MigrationHop(15, 16, "Angular 15 to 16"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "15"), To = new RuntimeSpec("angular", "16"), Ai = new AiConfig { UseAi = true, Provider = "codex" }, MaxAiRemediationRetries = 1 }, null, null);

        Assert.Equal("done", result.StringValue("status"));
        Assert.Contains(result["aiRemediationChanges"]!.AsArray().OfType<JsonObject>(), c => c.StringValue("schemaWarning").Contains("legacy remediations schema", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Third_Party_Remediation_Rejects_Package_Not_In_Detected_Blockers()
    {
        var root = await AngularWorkspace(extraDependencies: @",""@ng-idle/keepalive"":""^11.0.3"",""lodash"":""^4.17.21""");
        var ai = Angular15To16AiWithThirdPartyResponse(new JsonObject
        {
            ["packageUpdates"] = new JsonArray(ThirdPartyPackageUpdate("lodash", "^4.17.21", "^4.17.22")),
            ["manualReview"] = new JsonArray()
        });
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["16.2.12","5.1.6"]""" };
            if (command.SequenceEqual(["npm", "run", "build"])) return new CommandResult { ReturnCode = 1, Stderr = "Error: node_modules/@ng-idle/keepalive/lib/module.d.ts:1:22 - error NG6002: NgIdleKeepaliveModule does not appear to be an NgModule class." };
            return new CommandResult { ReturnCode = 0 };
        });

        var result = await new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader()).ExecuteMigrationHopAsync(root, new MigrationHop(15, 16, "Angular 15 to 16"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "15"), To = new RuntimeSpec("angular", "16"), Ai = new AiConfig { UseAi = true, Provider = "codex" }, MaxAiRemediationRetries = 1 }, null, null);

        Assert.Equal("failed", result.StringValue("status"));
        Assert.Contains(result["aiRemediationChanges"]!.AsArray().OfType<JsonObject>(), c => c.StringValue("packageName") == "lodash" && c.StringValue("rejectedReason").Contains("validation-detected blockers", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Same_Failed_Third_Party_Package_Remediation_Plan_Is_Not_Retried()
    {
        var root = await AngularWorkspace(extraDependencies: @",""ngx-slick-carousel"":""^0.6.0""");
        var remediation = new JsonObject
        {
            ["remediations"] = new JsonArray(new JsonObject
            {
                ["packageName"] = "ngx-slick-carousel",
                ["currentVersion"] = "^0.6.0",
                ["detectedErrorCategory"] = "third_party_angular_library_incompatibility",
                ["action"] = "upgrade",
                ["targetPackageName"] = "ngx-slick-carousel",
                ["targetVersionRange"] = "^0.7.0",
                ["reason"] = "Validation proved the installed package is not Angular Ivy compatible.",
                ["expectedCodeImpact"] = "none",
                ["requiresSourceChanges"] = false,
                ["sourceChangeScope"] = "package_json_only",
                ["confidence"] = 0.91,
                ["validationCommand"] = "npm run build"
            })
        };
        var ai = new SequenceAi(
            new JsonObject
            {
                ["packages"] = new JsonArray(
                    PackageDecision("@angular/core", "14.2.0", "dependencies", "angular_framework_package", "^16.2.12", "upgrade"),
                    PackageDecision("@angular/cli", "14.2.0", "dependencies", "angular_tooling_package", "^16.2.12", "upgrade"),
                    PackageDecision("typescript", "~4.8.4", "devDependencies", "typescript_runtime_or_compiler_package", "~5.1.6", "upgrade"),
                    PackageDecision("ngx-slick-carousel", "^0.6.0", "dependencies", "angular_ui_or_extension_package", null, "preserve")),
                ["notes"] = new JsonArray()
            },
            VersionRecommendations(
                VersionRecommendation("@angular/core", "14.2.0", "^16.2.12", "Angular framework package aligned."),
                VersionRecommendation("@angular/cli", "14.2.0", "^16.2.12", "Angular CLI aligned."),
                VersionRecommendation("typescript", "~4.8.4", "~5.1.6", "TypeScript aligned.")),
            EmptyCriticalAlignment(15, 16),
            EmptyConfigPlan(),
            InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "safe install"),
            remediation,
            remediation.DeepClone().AsObject());
        var buildRuns = 0;
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = command[2].StartsWith("ngx-slick-carousel@", StringComparison.Ordinal) ? """["15.0.0"]""" : """["16.2.12","5.1.6"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"])) return new CommandResult { ReturnCode = 0 };
            if (command.SequenceEqual(["npm", "run", "build"]))
            {
                buildRuns++;
                return new CommandResult { ReturnCode = 1, Stderr = "Error: node_modules/ngx-slick-carousel/slick/slick.module.d.ts:1:22 - error NG6002: SlickCarouselModule does not appear to be an NgModule class." };
            }
            return new CommandResult { ReturnCode = 0 };
        });

        var result = await new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader()).ExecuteMigrationHopAsync(root, new MigrationHop(15, 16, "Angular 15 to 16"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "15"), To = new RuntimeSpec("angular", "16"), Ai = new AiConfig { UseAi = true, Provider = "codex" }, MaxAiRemediationRetries = 2 }, null, null);

        Assert.Equal("failed", result.StringValue("status"));
        Assert.Equal(1, runner.Calls.Count(c => c.Command.SequenceEqual(["npm", "view", "ngx-slick-carousel@15.0.0", "version", "--json"])));
        Assert.Contains(result["aiRemediationChanges"]!.AsArray().OfType<JsonObject>(), c => c.StringValue("status") == "rejected" && c.StringValue("rejectedReason").Contains("already attempted", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task NgxPinchZoom_Remediation_Uses_ProjectOwned_TypeShim_Before_Verified_Upgrade()
    {
        var root = await Angular13Workspace(extraDependencies: @",""ngx-pinch-zoom"":""^2.5.6""");
        await File.WriteAllTextAsync(Path.Combine(root, "tsconfig.app.json"), """{"include":["src/**/*.d.ts"]}""");
        var ai = Angular13To14AiWithNgxResponse(new JsonObject
        {
            ["remediations"] = new JsonArray(new JsonObject
            {
                ["packageName"] = "ngx-pinch-zoom",
                ["currentVersion"] = "^2.5.6",
                ["detectedErrorCategory"] = "third_party_declaration_type_missing",
                ["action"] = "upgrade",
                ["targetPackageName"] = "ngx-pinch-zoom",
                ["targetVersionRange"] = "^2.6.2",
                ["reason"] = "Same package has a compatible declaration fix.",
                ["expectedCodeImpact"] = "none",
                ["requiresSourceChanges"] = false,
                ["sourceChangeScope"] = "package_json_only",
                ["confidence"] = 0.92,
                ["validationCommand"] = "npm run build"
            })
        });
        var buildRuns = 0;
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = command[2].StartsWith("ngx-pinch-zoom@", StringComparison.Ordinal) ? """["2.6.2"]""" : """["14.2.13","4.8.4"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"])) return new CommandResult { ReturnCode = 0 };
            if (command.SequenceEqual(["npm", "run", "build"])) return ++buildRuns == 1 ? new CommandResult { ReturnCode = 1, Stderr = NgxPinchZoomVisibilityStateError() } : new CommandResult { ReturnCode = 0 };
            return new CommandResult { ReturnCode = 0 };
        });

        var result = await new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader()).ExecuteMigrationHopAsync(root, new MigrationHop(13, 14, "Angular 13 to 14"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "13"), To = new RuntimeSpec("angular", "14"), Ai = new AiConfig { UseAi = true, Provider = "codex" }, MaxAiRemediationRetries = 1 }, null, null);
        var deps = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(root, "package.json")))!["dependencies"]!.AsObject();

        Assert.Equal("done", result.StringValue("status"));
        Assert.Equal("^2.5.6", deps["ngx-pinch-zoom"]!.ToString());
        Assert.Equal(2, runner.Calls.Count(c => c.Command.SequenceEqual(["npm", "run", "build"])));
        Assert.DoesNotContain(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "ngx-pinch-zoom@^2.6.2", "version", "--json"]));
        Assert.DoesNotContain(ai.Users, u => u.Contains("\"validationProvenBlockers\"", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(result["aiRemediationChanges"]!.AsArray().OfType<JsonObject>(), c => c.StringValue("type") == "type_shim" && c.StringValue("failureCategory") == "type_declaration");
    }

    [Fact]
    public async Task NgxPinchZoom_VisibilityState_Uses_ProjectOwned_TypeShim_When_Upgrade_Unavailable()
    {
        var root = await Angular13Workspace(extraDependencies: @",""ngx-pinch-zoom"":""^2.5.6""");
        await File.WriteAllTextAsync(Path.Combine(root, "tsconfig.app.json"), """{"include":["src/**/*.d.ts"]}""");
        var ai = Angular13To14AiWithNgxResponse(new JsonObject
        {
            ["remediations"] = new JsonArray(new JsonObject
            {
                ["packageName"] = "ngx-pinch-zoom",
                ["currentVersion"] = "^2.5.6",
                ["detectedErrorCategory"] = "third_party_declaration_type_missing",
                ["action"] = "upgrade",
                ["targetPackageName"] = "ngx-pinch-zoom",
                ["targetVersionRange"] = "^9.9.9",
                ["reason"] = "Try same package first.",
                ["expectedCodeImpact"] = "none",
                ["requiresSourceChanges"] = false,
                ["sourceChangeScope"] = "package_json_only",
                ["confidence"] = 0.9,
                ["validationCommand"] = "npm run build"
            })
        });
        var buildRuns = 0;
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = command[2].StartsWith("ngx-pinch-zoom@", StringComparison.Ordinal) ? "[]" : """["14.2.13","4.8.4"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"])) return new CommandResult { ReturnCode = 0 };
            if (command.SequenceEqual(["npm", "run", "build"])) return ++buildRuns == 1 ? new CommandResult { ReturnCode = 1, Stderr = NgxPinchZoomVisibilityStateError() } : new CommandResult { ReturnCode = 0 };
            return new CommandResult { ReturnCode = 0 };
        });

        var result = await new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader()).ExecuteMigrationHopAsync(root, new MigrationHop(13, 14, "Angular 13 to 14"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "13"), To = new RuntimeSpec("angular", "14"), Ai = new AiConfig { UseAi = true, Provider = "codex" }, MaxAiRemediationRetries = 1 }, null, null);
        var shim = await File.ReadAllTextAsync(Path.Combine(root, "src", "types", "third-party-compat.d.ts"));

        Assert.Equal("done", result.StringValue("status"));
        Assert.Contains("type VisibilityState = \"visible\" | \"hidden\" | \"collapse\" | \"inherit\" | \"initial\" | \"unset\";", shim);
        Assert.Contains(result["aiRemediationChanges"]!.AsArray().OfType<JsonObject>(), c => c.StringValue("type") == "type_shim" && c.BoolValue("businessLogicChanged") == false);
        Assert.DoesNotContain(ai.Users, u => u.Contains("\"validationProvenBlockers\"", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task VisibilityState_Shim_Is_Not_Added_For_Project_Code_Error()
    {
        var root = await Angular13Workspace(extraDependencies: @",""ngx-pinch-zoom"":""^2.5.6""");
        await File.WriteAllTextAsync(Path.Combine(root, "tsconfig.app.json"), """{"include":["src/**/*.d.ts"]}""");
        var ai = Angular13To14AiWithNgxResponse(new JsonObject { ["remediations"] = new JsonArray() });
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["14.2.13","4.8.4"]""" };
            if (command.SequenceEqual(["npm", "run", "build"])) return new CommandResult { ReturnCode = 1, Stderr = "Error: src/app/app.component.ts:1:1 - error TS2304: Cannot find name 'VisibilityState'." };
            return new CommandResult { ReturnCode = 0 };
        });

        var result = await new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader()).ExecuteMigrationHopAsync(root, new MigrationHop(13, 14, "Angular 13 to 14"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "13"), To = new RuntimeSpec("angular", "14"), Ai = new AiConfig { UseAi = true, Provider = "codex" }, MaxAiRemediationRetries = 1 }, null, null);

        Assert.Equal("failed", result.StringValue("status"));
        Assert.False(File.Exists(Path.Combine(root, "src", "types", "third-party-compat.d.ts")));
    }

    [Fact]
    public async Task VisibilityState_Shim_Is_Not_Added_For_Unrelated_ThirdParty_Type_Error()
    {
        var root = await Angular13Workspace(extraDependencies: @",""ngx-pinch-zoom"":""^2.5.6""");
        await File.WriteAllTextAsync(Path.Combine(root, "tsconfig.app.json"), """{"include":["src/**/*.d.ts"]}""");
        var ai = Angular13To14AiWithNgxResponse(new JsonObject { ["remediations"] = new JsonArray() });
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["14.2.13","4.8.4"]""" };
            if (command.SequenceEqual(["npm", "run", "build"])) return new CommandResult { ReturnCode = 1, Stderr = "Error: node_modules/ngx-pinch-zoom/lib/pinch-zoom.component.d.ts:54:25 - error TS2304: Cannot find name 'OtherState'." };
            return new CommandResult { ReturnCode = 0 };
        });

        var result = await new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader()).ExecuteMigrationHopAsync(root, new MigrationHop(13, 14, "Angular 13 to 14"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "13"), To = new RuntimeSpec("angular", "14"), Ai = new AiConfig { UseAi = true, Provider = "codex" }, MaxAiRemediationRetries = 1 }, null, null);

        Assert.Equal("failed", result.StringValue("status"));
        Assert.False(File.Exists(Path.Combine(root, "src", "types", "third-party-compat.d.ts")));
    }

    [Fact]
    public async Task Optimization_Error_Is_Classified_Only_After_VisibilityState_Is_Resolved()
    {
        var root = await Angular13Workspace(extraDependencies: @",""ngx-pinch-zoom"":""^2.5.6""");
        await File.WriteAllTextAsync(Path.Combine(root, "tsconfig.app.json"), """{"include":["src/**/*.ts"]}""");
        var ai = Angular13To14AiWithNgxResponse(new JsonObject { ["remediations"] = new JsonArray() });
        var buildRuns = 0;
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["14.2.13","4.8.4"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"])) return new CommandResult { ReturnCode = 0 };
            if (command.SequenceEqual(["npm", "run", "build"]))
            {
                buildRuns++;
                return buildRuns == 1
                    ? new CommandResult { ReturnCode = 1, Stderr = NgxPinchZoomVisibilityStateError() + Environment.NewLine + OptimizerFailureSample() }
                    : new CommandResult { ReturnCode = 1, Stderr = OptimizerFailureSample() };
            }
            return new CommandResult { ReturnCode = 0 };
        });

        var result = await new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader()).ExecuteMigrationHopAsync(root, new MigrationHop(13, 14, "Angular 13 to 14"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "13"), To = new RuntimeSpec("angular", "14"), Ai = new AiConfig { UseAi = true, Provider = "codex" }, MaxAiRemediationRetries = 1 }, null, null);
        var failures = result["validationFailures"]!.AsArray().OfType<JsonObject>().Select(f => f.StringValue("failureCategory")).ToArray();

        Assert.Equal("failed", result.StringValue("status"));
        Assert.Contains("type_declaration", failures);
        Assert.Contains("build_optimizer_minification_failure", failures);
        Assert.Contains("src/**/*.d.ts", await File.ReadAllTextAsync(Path.Combine(root, "tsconfig.app.json")));
        Assert.Equal(2, runner.Calls.Count(c => c.Command.SequenceEqual(["npm", "run", "build"])));
    }

    [Fact]
    public async Task Css_Remediation_State_Is_Enforced_Before_Later_Hop()
    {
        var root = await CssImportWorkspace(createNgSelectPackage: true);
        Directory.CreateDirectory(Path.Combine(root, "node_modules", "@ng-select", "ng-select", "themes"));
        await File.WriteAllTextAsync(Path.Combine(root, "node_modules", "@ng-select", "ng-select", "themes", "material.theme.css"), ".ng-select { color: inherit; }");
        var validation = CssValidation("src/assets/css/style.css", "~@ng-select/ng-select/themes/material.theme.css");
        var change = await AiRemediationPlanner.TryApplyDeterministicRemediationAsync(root, validation, 1, 1);
        Assert.NotNull(change);
        await File.WriteAllTextAsync(Path.Combine(root, "src", "assets", "css", "style.css"), """@import "~@ng-select/ng-select/themes/material.theme.css";""");
        var runner = new RecordingRunner(command => command[0] == "npm" && command[1] == "view"
            ? new CommandResult { ReturnCode = 0, Stdout = """["16.2.12","5.1.6"]""" }
            : new CommandResult { ReturnCode = 0 });

        var result = await new AngularAdapter(runner).ExecuteMigrationHopAsync(root, new MigrationHop(15, 16, "Angular 15 to 16"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "15"), To = new RuntimeSpec("angular", "16") }, null, null);
        var css = await File.ReadAllTextAsync(Path.Combine(root, "src", "assets", "css", "style.css"));

        Assert.Equal("done", result.StringValue("status"));
        Assert.DoesNotContain("~@ng-select/ng-select/themes/material.theme.css", css);
        Assert.DoesNotContain("@ng-select/ng-select/scss/material.theme", css);
        Assert.Contains("reapplied", result["persistentCssRemediationState"]!["records"]!.AsArray().OfType<JsonObject>().Select(r => r.StringValue("status")));
    }

    [Fact]
    public async Task Ng6Toastr_Runtime_Compatibility_Shim_Is_Blocked_By_Default()
    {
        var root = await AngularWorkspace(extraDependencies: @",""ng6-toastr-notifications"":""^1.0.4""");
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["16.2.12","5.1.6"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"])) return new CommandResult { ReturnCode = 0 };
            if (command.SequenceEqual(["npm", "run", "build"])) return new CommandResult { ReturnCode = 1, Stderr = "Error: node_modules/ng6-toastr-notifications/fesm2015/ng6-toastr-notifications.js:293:39-65 - Error: export 'ReflectiveInjector' was not found in '@angular/core'." };
            return new CommandResult { ReturnCode = 0 };
        });

        var result = await new AngularAdapter(runner).ExecuteMigrationHopAsync(root, new MigrationHop(15, 16, "Angular 15 to 16"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "15"), To = new RuntimeSpec("angular", "16"), MaxAiRemediationRetries = 1 }, null, null);

        Assert.Equal("failed", result.StringValue("status"));
        Assert.False(File.Exists(Path.Combine(root, "src", "app", "compat", "ng6-toastr-notifications.ts")));
        Assert.Contains(result["aiRemediationChanges"]!.AsArray().OfType<JsonObject>(), c => c.StringValue("selectedRemediation") == "compatibility_shim" && c.StringValue("status") == "rejected");
    }

    [Fact]
    public async Task Ng6Toastr_Runtime_Compatibility_Shim_Is_Applied_When_Explicitly_Enabled()
    {
        var root = await AngularWorkspace(extraDependencies: @",""ng6-toastr-notifications"":""^1.0.4""");
        await File.WriteAllTextAsync(Path.Combine(root, "tsconfig.json"), """{"compilerOptions":{"baseUrl":"./","paths":{}}}""");
        var buildRuns = 0;
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["16.2.12","5.1.6"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"])) return new CommandResult { ReturnCode = 0 };
            if (command.SequenceEqual(["npm", "run", "build"])) return ++buildRuns == 1
                ? new CommandResult { ReturnCode = 1, Stderr = "Error: node_modules/ng6-toastr-notifications/fesm2015/ng6-toastr-notifications.js:293:39-65 - Error: export 'ReflectiveInjector' was not found in '@angular/core'." }
                : new CommandResult { ReturnCode = 0 };
            return new CommandResult { ReturnCode = 0 };
        });

        var result = await new AngularAdapter(runner).ExecuteMigrationHopAsync(root, new MigrationHop(15, 16, "Angular 15 to 16"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "15"), To = new RuntimeSpec("angular", "16"), MaxAiRemediationRetries = 1, SourceCompatibilityRemediation = true }, null, null);
        var tsconfig = await File.ReadAllTextAsync(Path.Combine(root, "tsconfig.json"));

        Assert.Equal("done", result.StringValue("status"));
        Assert.True(File.Exists(Path.Combine(root, "src", "app", "compat", "ng6-toastr-notifications.ts")));
        Assert.Contains("\"ng6-toastr-notifications\"", tsconfig);
        Assert.Contains(result["aiRemediationChanges"]!.AsArray().OfType<JsonObject>(), c => c.StringValue("type") == "compatibility_shim" && c.BoolValue("manualReviewRequired") && c.BoolValue("sourceCodeImpact"));
    }

    [Fact]
    public async Task NgxPinchZoom_Ivy_Failure_Uses_Verified_Npm_Alias()
    {
        var root = await AngularWorkspace(extraDependencies: @",""ngx-pinch-zoom"":""^2.6.2""");
        var buildRuns = 0;
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view")
            {
                if (command[2].StartsWith("@mtnair/ngx-pinch-zoom@", StringComparison.Ordinal)) return new CommandResult { ReturnCode = 0, Stdout = """["2.5.12"]""" };
                return new CommandResult { ReturnCode = 0, Stdout = """["16.2.12","5.1.6"]""" };
            }
            if (command.Take(2).SequenceEqual(["npm", "install"])) return new CommandResult { ReturnCode = 0 };
            if (command.SequenceEqual(["npm", "run", "build"])) return ++buildRuns == 1
                ? new CommandResult { ReturnCode = 1, Stderr = "Error: node_modules/ngx-pinch-zoom/lib/ngx-pinch-zoom.module.d.ts:1:22 - error NG6002: PinchZoomModule does not appear to be an NgModule class." }
                : new CommandResult { ReturnCode = 0 };
            return new CommandResult { ReturnCode = 0 };
        });

        var result = await new AngularAdapter(runner).ExecuteMigrationHopAsync(root, new MigrationHop(15, 16, "Angular 15 to 16"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "15"), To = new RuntimeSpec("angular", "16"), MaxAiRemediationRetries = 1 }, null, null);
        var deps = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(root, "package.json")))!.AsObject()["dependencies"]!.AsObject();

        Assert.Equal("done", result.StringValue("status"));
        Assert.Equal("npm:@mtnair/ngx-pinch-zoom@2.5.12", deps["ngx-pinch-zoom"]!.ToString());
        Assert.Contains(result["aiRemediationChanges"]!.AsArray().OfType<JsonObject>(), c => c.StringValue("selectedRemediation") == "npm_alias_replacement" && c.BoolValue("manualReviewRequired"));
    }

    [Theory]
    [InlineData("angular-user-idle", "^2.2.7", "^4.0.0", "Error: node_modules/angular-user-idle/lib/angular-user-idle.module.d.ts:1:22 - error NG6002: UserIdleModule does not appear to be an NgModule class.", """["4.0.0"]""")]
    [InlineData("ngx-color-picker", "^9.1.0", "^16.0.0", "Error: node_modules/ngx-color-picker/fesm2015/ngx-color-picker.js:1231:25-65 - Error: export 'ReflectiveInjector' was not found in '@angular/core'.", """["16.0.0"]""")]
    [InlineData("ngx-bootstrap", "^7.1.0", "^11.0.2", "Error: node_modules/ngx-bootstrap/modal/modal.module.d.ts:12:25 - error TS2694: Namespace '@angular/core' has no exported member 'ɵɵNgModuleDefWithMeta'.", """["11.0.2"]""")]
    [InlineData("ngx-pagination", "^5.1.1", "^6.0.3", "Error: src/app/shared/shared.module.ts:33:5 - error NG6002: 'NgxPaginationModule' does not appear to be an NgModule class. node_modules/ngx-pagination/dist/ngx-pagination.module.d.ts:6:22", """["6.0.3"]""")]
    public async Task Known_Angular16_Blockers_Select_Verified_Same_Package_Upgrade(string packageName, string fromVersion, string expectedVersion, string error, string packageVersions)
    {
        var root = await AngularWorkspace(extraDependencies: $@", ""{packageName}"": ""{fromVersion}""");
        var buildRuns = 0;
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view")
            {
                if (command[2].StartsWith(packageName + "@", StringComparison.Ordinal)) return new CommandResult { ReturnCode = 0, Stdout = packageVersions };
                return new CommandResult { ReturnCode = 0, Stdout = """["16.2.12","5.1.6"]""" };
            }
            if (command.Take(2).SequenceEqual(["npm", "install"])) return new CommandResult { ReturnCode = 0 };
            if (command.SequenceEqual(["npm", "run", "build"])) return ++buildRuns == 1 ? new CommandResult { ReturnCode = 1, Stderr = error } : new CommandResult { ReturnCode = 0 };
            return new CommandResult { ReturnCode = 0 };
        });

        var result = await new AngularAdapter(runner).ExecuteMigrationHopAsync(root, new MigrationHop(15, 16, "Angular 15 to 16"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "15"), To = new RuntimeSpec("angular", "16"), MaxAiRemediationRetries = 1 }, null, null);
        var deps = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(root, "package.json")))!.AsObject()["dependencies"]!.AsObject();

        Assert.Equal("done", result.StringValue("status"));
        Assert.Equal(expectedVersion, deps[packageName]!.ToString());
        Assert.Contains(result["aiRemediationChanges"]!.AsArray().OfType<JsonObject>(), c => c.StringValue("selectedRemediation") == "same_package_upgrade" && c.BoolValue("requiresVersionVerification"));
    }

    [Fact]
    public async Task Validation_Remediation_Verifies_Installed_Package_And_Targets_Stale_NgPackage_Before_Build_Rerun()
    {
        var root = await AngularWorkspace(extraDependencies: @", ""ngx-pagination"": ""^5.1.1""");
        var buildRuns = 0;
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view")
            {
                if (command[2].StartsWith("ngx-pagination@", StringComparison.Ordinal)) return new CommandResult { ReturnCode = 0, Stdout = """["6.0.3"]""" };
                return new CommandResult { ReturnCode = 0, Stdout = """["16.2.12","5.1.6"]""" };
            }
            if (command.SequenceEqual(["npm", "install", "ngx-pagination@^6.0.3", "--legacy-peer-deps", "--no-audit", "--no-fund"]))
            {
                Directory.CreateDirectory(Path.Combine(root, "node_modules", "ngx-pagination"));
                File.WriteAllText(Path.Combine(root, "node_modules", "ngx-pagination", "package.json"), """{"name":"ngx-pagination","version":"6.0.3"}""");
                return new CommandResult { ReturnCode = 0 };
            }
            if (command.Take(2).SequenceEqual(["npm", "install"]))
            {
                if (buildRuns > 0)
                {
                    File.WriteAllText(Path.Combine(root, "package-lock.json"), """
{"packages":{"":{"dependencies":{"ngx-pagination":"^5.1.1"}},"node_modules/ngx-pagination":{"version":"5.1.1"}}}
""");
                    Directory.CreateDirectory(Path.Combine(root, "node_modules", "ngx-pagination"));
                    File.WriteAllText(Path.Combine(root, "node_modules", "ngx-pagination", "package.json"), """{"name":"ngx-pagination","version":"5.1.1"}""");
                }
                return new CommandResult { ReturnCode = 0 };
            }
            if (command.SequenceEqual(["npm", "run", "build"])) return ++buildRuns == 1
                ? new CommandResult { ReturnCode = 1, Stderr = "Error: src/app/shared/shared.module.ts:33:5 - error NG6002: 'NgxPaginationModule' does not appear to be an NgModule class. node_modules/ngx-pagination/dist/ngx-pagination.module.d.ts:6:22" }
                : new CommandResult { ReturnCode = 0 };
            return new CommandResult { ReturnCode = 0 };
        });

        var result = await new AngularAdapter(runner).ExecuteMigrationHopAsync(root, new MigrationHop(15, 16, "Angular 15 to 16"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "15"), To = new RuntimeSpec("angular", "16"), MaxAiRemediationRetries = 1 }, null, null);
        var targetedIndex = runner.Calls.FindIndex(c => c.Command.SequenceEqual(["npm", "install", "ngx-pagination@^6.0.3", "--legacy-peer-deps", "--no-audit", "--no-fund"]));
        var secondBuildIndex = runner.Calls.FindIndex(targetedIndex + 1, c => c.Command.SequenceEqual(["npm", "run", "build"]));

        Assert.Equal("done", result.StringValue("status"));
        Assert.True(targetedIndex >= 0);
        Assert.True(secondBuildIndex > targetedIndex);
        Assert.DoesNotContain(runner.Calls[targetedIndex].Command, arg => arg == "--prefer-offline");
        Assert.Contains(result["aiRemediationChanges"]!.AsArray().OfType<JsonObject>(), c =>
            c.StringValue("packageName") == "ngx-pagination" &&
            c.StringValue("packageJsonValueAfterUpdate") == "^6.0.3" &&
            c.StringValue("installedVersionAfterNpmInstall") == "6.0.3" &&
            c.BoolValue("installedVersionSatisfiesTargetRange") &&
            c.BoolValue("targetedInstallNeeded") &&
            !c.BoolValue("packageLockRefreshed"));
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

    private const string Angular16FailureSample = """
$ npm run build
exit code: 1
Error: node_modules/ng6-toastr-notifications/lib/toastr.module.d.ts:3:23 - error TS2314: Generic type 'ModuleWithProviders<T>' requires 1 type argument(s).
3     static forRoot(): ModuleWithProviders;
                        ~~~~~~~~~~~~~~~~~~~
Error: src/app/app.module.ts:46:3 - error TS2345: Object literal may only specify known properties, and 'entryComponents' does not exist in type 'NgModule'.
46   entryComponents : [ConfirmationDialogComponent]
     ~~~~~~~~~~~~~~~
Error: src/app/app.module.ts:32:5 - error NG6002: 'SlickCarouselModule' does not appear to be an NgModule class.
This likely means that the library (ngx-slick-carousel) which declares SlickCarouselModule is not compatible with Angular Ivy.
Error: node_modules/ngx-slick-carousel/slick/slick.module.d.ts:1:22 - error NG6002: SlickCarouselModule does not appear to be an NgModule class.
Error: node_modules/ngx-pinch-zoom/lib/ngx-pinch-zoom.module.d.ts:1:22 - error NG6002: PinchZoomModule does not appear to be an NgModule class.
Error: node_modules/angular-user-idle/lib/angular-user-idle.module.d.ts:1:22 - error NG6002: UserIdleModule does not appear to be an NgModule class.
Error: src/app/app.module.ts:36:5 - error NG6002: SharedModule does not appear to be an NgModule class.
""";

    private static string Ng600xThirdPartyFailureSample() => """
$ npm run build
exit code: 1
Error: src/app/app.module.ts:148:5 - error NG6002: 'NgIdleKeepaliveModule' does not appear to be an NgModule class.
node_modules/@ng-idle/keepalive/lib/module.d.ts:1:22
This likely means that the library (@ng-idle/keepalive) which declares NgIdleKeepaliveModule is not compatible with Angular Ivy.
Error: src/app/app.module.ts:149:5 - error NG6002: 'NgxSpinnerModule' does not appear to be an NgModule class.
node_modules/ngx-spinner/lib/ngx-spinner.module.d.ts:1:22
This likely means that the library (ngx-spinner) which declares NgxSpinnerModule is not compatible with Angular Ivy.
Error: src/app/app.module.ts:150:5 - error NG6003: 'OrderModule' does not appear to be an NgModule, Component, Directive, or Pipe class.
node_modules/ngx-order-pipe/src/app/order-pipe/ngx-order.module.d.ts:1:22
This likely means that the library (ngx-order-pipe) which declares OrderModule is not compatible with Angular Ivy.
""";

    private static string NgxPinchZoomVisibilityStateError() => """
$ npm run build
exit code: 1
Error: node_modules/ngx-pinch-zoom/lib/pinch-zoom.component.d.ts:54:25 - error TS2304: Cannot find name 'VisibilityState'.
54     get hostOverflow(): VisibilityState;
                           ~~~~~~~~~~~~~~~
Error: node_modules/ngx-pinch-zoom/lib/pinch-zoom.component.d.ts:80:20 - error TS2304: Cannot find name 'VisibilityState'.
80         overflow?: VisibilityState;
                      ~~~~~~~~~~~~~~~
""";

    private static string OptimizerFailureSample() => """
Optimization error [main.123.js]: Unexpected token: punc ({)
    at D:\Projects\AI\AiMigration\Output\node_modules\esbuild-wasm\lib\main.js:1958:37
""";

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

    [Fact]
    public async Task Angular_Migration_Installs_Compatible_Node_Before_Npm_Commands()
    {
        var root = await AngularWorkspace();
        await File.WriteAllTextAsync(Path.Combine(root, ".nvmrc"), "20.19.0");
        var currentNodeVersion = "v18.19.0";
        var nodeInstallRan = false;

        var runner = new RecordingRunner(command =>
        {
            if (command.SequenceEqual(["node", "--version"]))
            {
                return new CommandResult { ReturnCode = 0, Stdout = currentNodeVersion };
            }

            if (command.SequenceEqual(["nvm", "--version"]))
            {
                return new CommandResult { ReturnCode = 0, Stdout = "1.0.0" };
            }

            if (command.Count >= 3 && command[0] == "cmd" && command[1] == "/c" && command[2].Contains("nvm install 20.19.0", StringComparison.OrdinalIgnoreCase))
            {
                nodeInstallRan = true;
                currentNodeVersion = "v20.19.0";
                return new CommandResult { ReturnCode = 0, Stdout = "installed" };
            }

            if (command.Count >= 2 && command[0] == "npm" && command[1] == "view")
            {
                return new CommandResult { ReturnCode = 0, Stdout = """["15.2.10"]""" };
            }

            if (command.SequenceEqual(["npm", "install", "--ignore-scripts", "--no-audit", "--no-fund"]))
            {
                return new CommandResult { ReturnCode = 0, Stdout = "npm install completed" };
            }

            if (command.SequenceEqual(["npm", "run", "build"]))
            {
                return new CommandResult { ReturnCode = 0, Stdout = "build ok" };
            }

            return new CommandResult { ReturnCode = 0 };
        });

        var result = await new AngularAdapter(runner).ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "14"), To = new RuntimeSpec("angular", "15"), MaxAiRemediationRetries = 0 }, null, null);
        var nodeVersionIndex = runner.Calls.FindIndex(c => c.Command.SequenceEqual(["node", "--version"]));
        var nodeInstallIndex = runner.Calls.FindIndex(c => c.Command.Count >= 3 && c.Command[0] == "cmd" && c.Command[1] == "/c" && c.Command[2].Contains("nvm install 20.19.0", StringComparison.OrdinalIgnoreCase));
        var npmInstallIndex = runner.Calls.FindIndex(c => c.Command.SequenceEqual(["npm", "install", "--ignore-scripts", "--no-audit", "--no-fund"]));

        Assert.True(nodeInstallRan);
        Assert.True(nodeVersionIndex >= 0);
        Assert.True(nodeInstallIndex > nodeVersionIndex);
        Assert.True(npmInstallIndex > nodeInstallIndex);
        Assert.Equal("done", result.StringValue("status"));
    }

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

    private static async Task<string> Angular18Workspace(string extraDependencies = "", bool hasBuildScript = true)
    {
        var root = TestWorkspace.Create();
        var scripts = hasBuildScript ? @"""scripts"": {""build"":""ng build""}," : @"""scripts"": {},";
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """
{
  SCRIPTS
  "dependencies": {"@angular/core":"18.2.13","@angular/common":"18.2.13","@angular/cli":"18.2.12","rxjs":"7.8.1","zone.js":"0.14.10"EXTRA_DEPENDENCIES},
  "devDependencies": {"typescript":"~5.5.2","@angular/compiler-cli":"18.2.13","@angular-devkit/build-angular":"18.2.12"}
}
""".Replace("SCRIPTS", scripts).Replace("EXTRA_DEPENDENCIES", extraDependencies));
        await File.WriteAllTextAsync(Path.Combine(root, "angular.json"), "{}");
        return root;
    }

    private static async Task<string> Angular19Workspace()
    {
        var root = TestWorkspace.Create();
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """
{
  "scripts": {"build":"ng build"},
  "dependencies": {"@angular/core":"19.2.0","@angular/common":"19.2.0","@angular/cli":"19.2.0","rxjs":"7.8.1","zone.js":"0.15.0"},
  "devDependencies": {"typescript":"~5.6.3","@angular/compiler-cli":"19.2.0","@angular-devkit/build-angular":"19.2.0"}
}
""");
        await File.WriteAllTextAsync(Path.Combine(root, "angular.json"), "{}");
        return root;
    }

    private static void CreateLocalAngularCli(string root, int major, bool withMigrationMetadata = false)
    {
        var bin = Path.Combine(root, "node_modules", ".bin");
        var cli = Path.Combine(root, "node_modules", "@angular", "cli");
        Directory.CreateDirectory(bin);
        Directory.CreateDirectory(cli);
        File.WriteAllText(Path.Combine(bin, OperatingSystem.IsWindows() ? "ng.cmd" : "ng"), "");
        File.WriteAllText(Path.Combine(cli, "package.json"), withMigrationMetadata
            ? "{\"name\":\"@angular/cli\",\"version\":\"" + major + ".0.0\",\"ng-update\":{\"migrations\":\"./migrations.json\"}}"
            : "{\"name\":\"@angular/cli\",\"version\":\"" + major + ".0.0\"}");
        if (withMigrationMetadata)
        {
            File.WriteAllText(Path.Combine(cli, "migrations.json"), "{\"migrations\":{\"sample\":{\"version\":\"" + major + ".0.0\",\"description\":\"test migration\",\"factory\":\"./sample\"}}}");
        }
    }

    private static async Task<string> Angular13Workspace(string extraDependencies = "")
    {
        var root = TestWorkspace.Create();
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """
{
  "scripts": {"build":"ng build"},
  "dependencies": {
    "@angular/core": "~13.1.0",
    "@angular/common": "~13.1.0",
    "@angular/compiler": "~13.1.0"EXTRA_DEPENDENCIES
  },
  "devDependencies": {
    "@angular/cli": "~13.1.2",
    "@angular/compiler-cli": "~13.1.0",
    "@angular-devkit/build-angular": "^13.3.10",
    "typescript": "~4.5.2"
  }
}
""".Replace("EXTRA_DEPENDENCIES", extraDependencies));
        await File.WriteAllTextAsync(Path.Combine(root, "angular.json"), "{}");
        return root;
    }

    private static async Task<string> CssImportWorkspace(bool includeSecondStyleFile = false, bool createNgSelectPackage = true)
    {
        var root = await AngularWorkspace(extraDependencies: @",""@ng-select/ng-select"":""^8.3.0""");
        Directory.CreateDirectory(Path.Combine(root, "src", "assets", "css"));
        Directory.CreateDirectory(Path.Combine(root, "src", "assets", "front", "css"));
        await File.WriteAllTextAsync(Path.Combine(root, "src", "assets", "css", "style.css"), """@import "~@ng-select/ng-select/themes/material.theme.css";""");
        if (includeSecondStyleFile)
        {
            await File.WriteAllTextAsync(Path.Combine(root, "src", "assets", "front", "css", "front-style.css"), """@import "~@ng-select/ng-select/themes/material.theme.css";""");
        }
        if (createNgSelectPackage) CreateNgSelectPackage(root);
        return root;
    }

    private static void CreateNgSelectPackage(string root)
    {
        var packageRoot = Path.Combine(root, "node_modules", "@ng-select", "ng-select");
        Directory.CreateDirectory(Path.Combine(packageRoot, "scss"));
        awaitFile(Path.Combine(packageRoot, "package.json"), """
{
  "name": "@ng-select/ng-select",
  "version": "8.3.0",
  "exports": {
    "./scss/default.theme": {"style": "./scss/default.theme.scss"},
    "./scss/material.theme": {"style": "./scss/material.theme.scss"}
  }
}
""");
        awaitFile(Path.Combine(packageRoot, "scss", "material.theme.scss"), ".ng-select { color: inherit; }");
        awaitFile(Path.Combine(packageRoot, "scss", "default.theme.scss"), ".ng-select { color: inherit; }");

        static void awaitFile(string path, string content) => File.WriteAllText(path, content);
    }

    private static ValidationResult CssValidation(string file, string import) => new()
    {
        Passed = false,
        Output = CssBuildError(file, import),
        Errors = CssBuildError(file, import),
        FailedHop = "14 -> 15",
        FailureCommand = ["npm", "run", "build"]
    };

    private static string CssBuildError(string file, string import) => $"""
$ npm run build
exit code: 1
./{file} - Error: Module build failed (from ./node_modules/css-loader/dist/cjs.js):
Error: Can't resolve '{import}' in 'D:\Projects\AI\AiMigration\Output\src\assets\css'
""";

    private static JsonObject CssImportPlan(string file, string beforeImport, string afterImport, string type = "style_import_update") => new()
    {
        ["summary"] = "CSS package import path is not resolvable after Angular/Webpack migration.",
        ["confidence"] = 0.93,
        ["risk"] = "low",
        ["requiresManualCorrection"] = false,
        ["failureCategory"] = "css_dependency_import",
        ["businessLogicChanged"] = false,
        ["changes"] = new JsonArray(new JsonObject
        {
            ["file"] = file,
            ["type"] = type,
            ["reason"] = "Replace unresolved package style import with a same-package installed style asset.",
            ["before"] = $"""@import "{beforeImport}";""",
            ["after"] = $"""@import "{afterImport}";"""
        }),
        ["commandsToRunAfter"] = new JsonArray(),
        ["reportNotes"] = new JsonArray()
    };

    private static RecordingRunner SuccessfulAngularRunner(string npmViewVersion) => new(command =>
    {
        if (command[0] != "npm" || command[1] != "view") return new CommandResult { ReturnCode = 0 };
        var packageSpec = command[2];
        if (packageSpec.StartsWith("typescript@", StringComparison.OrdinalIgnoreCase)) return new CommandResult { ReturnCode = 0, Stdout = """["4.8.4"]""" };
        if (packageSpec.StartsWith("rxjs@", StringComparison.OrdinalIgnoreCase)) return new CommandResult { ReturnCode = 0, Stdout = """["7.5.0"]""" };
        if (packageSpec.StartsWith("zone.js@", StringComparison.OrdinalIgnoreCase)) return new CommandResult { ReturnCode = 0, Stdout = """["0.13.0"]""" };
        return new CommandResult { ReturnCode = 0, Stdout = $"""["{npmViewVersion}"]""" };
    });

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
        var ai = new SequenceAi(PackagePlan(), VersionRecommendations(), EmptyConfigPlan(),
            InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "first"),
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
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());
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

    private static JsonObject PackagePlan19() => new()
    {
        ["packages"] = new JsonArray(
            PackageDecision("@angular/core", "18.2.13", "dependencies", "angular_framework_package", "^19.0.0", "upgrade"),
            PackageDecision("@angular/common", "18.2.13", "dependencies", "angular_framework_package", "^19.0.0", "upgrade"),
            PackageDecision("@angular/cli", "18.2.12", "dependencies", "angular_tooling_package", "^19.0.0", "upgrade"),
            PackageDecision("@angular/compiler-cli", "18.2.13", "devDependencies", "angular_tooling_package", "^19.0.0", "upgrade"),
            PackageDecision("@angular-devkit/build-angular", "18.2.12", "devDependencies", "angular_tooling_package", "^19.0.0", "upgrade"),
            PackageDecision("rxjs", "7.8.1", "dependencies", "third_party_runtime_package", null, "preserve"),
            PackageDecision("zone.js", "0.14.10", "dependencies", "angular_runtime_support_package", "~0.15.0", "upgrade"),
            PackageDecision("typescript", "~5.5.2", "devDependencies", "typescript_runtime_or_compiler_package", "~5.5.4", "upgrade")),
        ["notes"] = new JsonArray()
    };

    private static JsonObject PackagePlan20(bool preserveTypeScript = false) => new()
    {
        ["packages"] = new JsonArray(
            PackageDecision("@angular/core", "19.2.0", "dependencies", "angular_framework_package", "^20.0.0", "upgrade"),
            PackageDecision("@angular/common", "19.2.0", "dependencies", "angular_framework_package", "^20.0.0", "upgrade"),
            PackageDecision("@angular/cli", "19.2.0", "dependencies", "angular_tooling_package", "^20.0.0", "upgrade"),
            PackageDecision("@angular/compiler-cli", "19.2.0", "devDependencies", "angular_tooling_package", "^20.0.0", "upgrade"),
            PackageDecision("@angular-devkit/build-angular", "19.2.0", "devDependencies", "angular_tooling_package", "^20.0.0", "upgrade"),
            PackageDecision("rxjs", "7.8.1", "dependencies", "third_party_runtime_package", null, "preserve"),
            PackageDecision("zone.js", "0.15.0", "dependencies", "angular_runtime_support_package", "0.15.0", "preserve"),
            PackageDecision("typescript", "~5.6.3", "devDependencies", "typescript_runtime_or_compiler_package", preserveTypeScript ? null : "~5.8.3", preserveTypeScript ? "preserve" : "upgrade")),
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

    private static JsonObject VersionRecommendations(params JsonObject[] recommendations) => new()
    {
        ["targetAngularMajor"] = 15,
        ["recommendations"] = new JsonArray((recommendations.Length == 0
            ? new[]
            {
                VersionRecommendation("@angular/core", "14.2.0", "^15.2.10", "Angular framework package aligned to Angular 15."),
                VersionRecommendation("@angular/cli", "14.2.0", "^15.2.10", "Angular CLI package aligned to Angular 15."),
                VersionRecommendation("typescript", "~4.8.4", "~4.9.5", "TypeScript version compatible with Angular 15.")
            }
            : recommendations).Select(r => (JsonNode?)r).ToArray()),
        ["warnings"] = new JsonArray()
    };

    private static JsonObject VersionRecommendations19() => new()
    {
        ["targetAngularMajor"] = 19,
        ["recommendations"] = new JsonArray(
            VersionRecommendation("@angular/core", "18.2.13", "^19.0.0", "Angular framework package aligned to Angular 19."),
            VersionRecommendation("@angular/common", "18.2.13", "^19.0.0", "Angular framework package aligned to Angular 19."),
            VersionRecommendation("@angular/cli", "18.2.12", "^19.0.0", "Angular CLI package aligned to Angular 19."),
            VersionRecommendation("@angular/compiler-cli", "18.2.13", "^19.0.0", "Angular compiler package aligned to Angular 19."),
            VersionRecommendation("@angular-devkit/build-angular", "18.2.12", "^19.0.0", "Angular build package aligned to Angular 19."),
            VersionRecommendation("zone.js", "0.14.10", "~0.15.0", "Zone.js version compatible with Angular 19."),
            VersionRecommendation("typescript", "~5.5.2", "~5.5.4", "TypeScript version compatible with Angular 19.")),
        ["warnings"] = new JsonArray()
    };

    private static JsonObject VersionRecommendations20() => new()
    {
        ["targetAngularMajor"] = 20,
        ["recommendations"] = new JsonArray(
            VersionRecommendation("@angular/core", "19.2.0", "^20.0.0", "Angular framework package aligned to Angular 20."),
            VersionRecommendation("@angular/common", "19.2.0", "^20.0.0", "Angular framework package aligned to Angular 20."),
            VersionRecommendation("@angular/cli", "19.2.0", "^20.0.0", "Angular CLI package aligned to Angular 20."),
            VersionRecommendation("@angular/compiler-cli", "19.2.0", "^20.0.0", "Angular compiler package aligned to Angular 20."),
            VersionRecommendation("@angular-devkit/build-angular", "19.2.0", "^20.0.0", "Angular build package aligned to Angular 20."),
            VersionRecommendation("typescript", "~5.6.3", "~5.8.3", "TypeScript version compatible with Angular 20.")),
        ["warnings"] = new JsonArray()
    };

    private static bool IsPackageVersionPrompt(string prompt) =>
        prompt.Contains("package version recommendation", StringComparison.OrdinalIgnoreCase) &&
        prompt.Contains("safe package target versions", StringComparison.OrdinalIgnoreCase);

    private static JsonObject EmptyVersionRecommendations(int targetMajor) => new()
    {
        ["targetAngularMajor"] = targetMajor,
        ["recommendations"] = new JsonArray(),
        ["warnings"] = new JsonArray()
    };

    private static JsonObject VersionRecommendation(string name, string current, string? recommended, string reason, string action = "upgrade", double confidence = 90, string risk = "low", string installImpact = "required", string buildImpact = "required", bool manualReview = false) => new()
    {
        ["packageName"] = name,
        ["currentVersion"] = current,
        ["recommendedVersion"] = recommended,
        ["action"] = action,
        ["confidence"] = confidence,
        ["risk"] = risk,
        ["reason"] = reason,
        ["installImpact"] = installImpact,
        ["buildImpact"] = buildImpact,
        ["manualReviewRequired"] = manualReview
    };

    private static JsonObject ThirdPartyRemediation(string name, string current, string target) => new()
    {
        ["packageName"] = name,
        ["currentVersion"] = current,
        ["detectedErrorCategory"] = "third_party_angular_library_incompatibility",
        ["action"] = "upgrade",
        ["targetPackageName"] = name,
        ["targetVersionRange"] = target,
        ["reason"] = "Validation proved this direct third-party Angular package blocks the hop.",
        ["expectedCodeImpact"] = "none",
        ["requiresSourceChanges"] = false,
        ["sourceChangeScope"] = "package_json_only",
        ["confidence"] = 0.91,
        ["validationCommand"] = "npm run build"
    };

    private static JsonObject ThirdPartyPackageUpdate(string name, string current, string target) => new()
    {
        ["package"] = name,
        ["currentVersion"] = current,
        ["version"] = target,
        ["reason"] = "Validation proved this direct third-party Angular package blocks the hop.",
        ["errorCategory"] = "third_party_angular_library_incompatibility",
        ["expectedCodeImpact"] = "none"
    };

    private static SequenceAi Angular15To16AiWithThirdPartyResponse(JsonObject thirdPartyResponse) => new(
        new JsonObject
        {
            ["packages"] = new JsonArray(
                PackageDecision("@angular/core", "14.2.0", "dependencies", "angular_framework_package", "^16.2.12", "upgrade"),
                PackageDecision("@angular/cli", "14.2.0", "dependencies", "angular_tooling_package", "^16.2.12", "upgrade"),
                PackageDecision("typescript", "~4.8.4", "devDependencies", "typescript_runtime_or_compiler_package", "~5.1.6", "upgrade"),
                PackageDecision("ngx-slick-carousel", "^0.6.0", "dependencies", "angular_ui_or_extension_package", null, "preserve"),
                PackageDecision("@ng-idle/keepalive", "^11.0.3", "dependencies", "business_or_unknown_package", null, "manual_review"),
                PackageDecision("lodash", "^4.17.21", "dependencies", "third_party_runtime_package", null, "preserve")),
            ["notes"] = new JsonArray()
        },
        VersionRecommendations(
            VersionRecommendation("@angular/core", "14.2.0", "^16.2.12", "Angular framework package aligned."),
            VersionRecommendation("@angular/cli", "14.2.0", "^16.2.12", "Angular CLI aligned."),
            VersionRecommendation("typescript", "~4.8.4", "~5.1.6", "TypeScript aligned.")),
        EmptyCriticalAlignment(15, 16),
        EmptyConfigPlan(),
        InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "safe install"),
        thirdPartyResponse);

    private static JsonObject EmptyConfigPlan() => new()
    {
        ["changes"] = new JsonArray(),
        ["manualRecommendations"] = new JsonArray()
    };

    private static JsonObject SourceFrameworkMigrationPlan(string filePath, string reason) => new()
    {
        ["changes"] = new JsonArray(new JsonObject
        {
            ["filePath"] = filePath,
            ["changeType"] = "framework_migration",
            ["category"] = "angular_framework_source_migration",
            ["reason"] = reason,
            ["requiresSourceMigration"] = filePath.EndsWith(".ts", StringComparison.OrdinalIgnoreCase),
            ["requiresTemplateMigration"] = filePath.EndsWith(".html", StringComparison.OrdinalIgnoreCase),
            ["confidence"] = 0.95,
            ["risk"] = "medium"
        }),
        ["manualRecommendations"] = new JsonArray()
    };

    private static JsonObject EmptyCriticalAlignment(int sourceMajor, int targetMajor) => new()
    {
        ["sourceAngularMajor"] = sourceMajor,
        ["targetAngularMajor"] = targetMajor,
        ["recommendations"] = new JsonArray(),
        ["warnings"] = new JsonArray()
    };

    private static SequenceAi Angular13To14AiWithNgxResponse(JsonObject thirdPartyResponse) => new(
        new JsonObject
        {
            ["packages"] = new JsonArray(
                PackageDecision("@angular/core", "~13.1.0", "dependencies", "angular_framework_package", "^14.2.13", "upgrade"),
                PackageDecision("@angular/common", "~13.1.0", "dependencies", "angular_framework_package", "^14.2.13", "upgrade"),
                PackageDecision("@angular/compiler", "~13.1.0", "dependencies", "angular_framework_package", "^14.2.13", "upgrade"),
                PackageDecision("@angular/cli", "~13.1.2", "devDependencies", "angular_tooling_package", "^14.2.13", "upgrade"),
                PackageDecision("@angular/compiler-cli", "~13.1.0", "devDependencies", "angular_tooling_package", "^14.2.13", "upgrade"),
                PackageDecision("@angular-devkit/build-angular", "^13.3.10", "devDependencies", "angular_tooling_package", "^14.2.13", "upgrade"),
                PackageDecision("typescript", "~4.5.2", "devDependencies", "typescript_runtime_or_compiler_package", "~4.8.4", "upgrade"),
                PackageDecision("ngx-pinch-zoom", "^2.5.6", "dependencies", "angular_ui_or_extension_package", null, "preserve")),
            ["notes"] = new JsonArray()
        },
        VersionRecommendations(
            VersionRecommendation("@angular/core", "~13.1.0", "^14.2.13", "Angular framework package aligned."),
            VersionRecommendation("@angular/common", "~13.1.0", "^14.2.13", "Angular framework package aligned."),
            VersionRecommendation("@angular/compiler", "~13.1.0", "^14.2.13", "Angular framework package aligned."),
            VersionRecommendation("@angular/cli", "~13.1.2", "^14.2.13", "Angular CLI aligned."),
            VersionRecommendation("@angular/compiler-cli", "~13.1.0", "^14.2.13", "Angular compiler aligned."),
            VersionRecommendation("@angular-devkit/build-angular", "^13.3.10", "^14.2.13", "Angular DevKit aligned."),
            VersionRecommendation("typescript", "~4.5.2", "~4.8.4", "TypeScript aligned.")),
        EmptyCriticalAlignment(13, 14),
        EmptyConfigPlan(),
        InstallDecision("normalInstall", "npm install --ignore-scripts --no-audit --no-fund", "safe install"),
        thirdPartyResponse);

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
        public List<string> SystemPrompts { get; } = [];
        public List<string> Users { get; } = [];
        public Task<JsonObject?> AskAsync(AiConfig config, string system, string user, CancellationToken cancellationToken = default)
        {
            SystemPrompts.Add(system);
            Users.Add(user);
            if (system.Contains("framework-critical dependencies", StringComparison.OrdinalIgnoreCase) &&
                (Calls >= responses.Length || responses[Calls]?["sourceAngularMajor"] is null))
            {
                return Task.FromResult<JsonObject?>(CriticalAlignment());
            }
            return Task.FromResult<JsonObject?>(responses[Math.Min(Calls++, responses.Length - 1)]);
        }
    }

    private static JsonObject CriticalAlignment(params JsonObject[] recommendations) => new()
    {
        ["sourceAngularMajor"] = 14,
        ["targetAngularMajor"] = 15,
        ["recommendations"] = new JsonArray((recommendations.Length == 0
            ? new[] { CriticalRecommendation("typescript", "~4.8.4", "~4.9.5", "Angular 15 compiler compatibility requires TypeScript 4.8/4.9.") }
            : recommendations).Select(r => (JsonNode?)r).ToArray()),
        ["warnings"] = new JsonArray()
    };

    private static JsonObject CriticalRecommendation(string name, string current, string? recommended, string reason, string action = "align", double confidence = 95, string risk = "low", string section = "devDependencies", string criticality = "required") => new()
    {
        ["packageName"] = name,
        ["currentVersion"] = current,
        ["recommendedVersion"] = recommended,
        ["dependencySection"] = section,
        ["action"] = action,
        ["criticality"] = criticality,
        ["confidence"] = confidence,
        ["risk"] = risk,
        ["reason"] = reason,
        ["blocksInstall"] = false,
        ["blocksBuild"] = true,
        ["manualReviewRequired"] = false
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

    private sealed class RecordingProgress : IProgressReporter
    {
        public bool Verbose => true;
        public bool Quiet => false;
        public List<string> Messages { get; } = [];
        public void Stage(string stage, string message) => Messages.Add(message);
        public void Error(string stage, string message) => Messages.Add(message);
        public void Detail(string message) => Messages.Add(message);
        public void FinalReport(string reportPath) => Messages.Add(reportPath);
        public void LogFile(string logPath) => Messages.Add(logPath);
    }

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

