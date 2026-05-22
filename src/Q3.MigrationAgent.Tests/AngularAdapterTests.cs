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
    public void ManualReview_Install_Strategy_Cannot_Block_First_Install_After_PackageJson_Changed()
    {
        var decision = new InstallStrategyDecision { PackageManager = "npm", Mode = "manualReview", Confidence = 0.95, Risk = "medium", Flags = new InstallStrategyFlags { NoAudit = true, NoFund = true, PreferOffline = true } };
        var context = InstallContext(packageJsonChanged: true);

        var validation = AngularAdapter.ValidateInstallDecision(decision, context, Config(TestWorkspace.Create()));

        Assert.False(validation.Valid);
        Assert.Equal(["npm", "install", "--no-audit", "--no-fund", "--prefer-offline"], AngularAdapter.BuildInstallCommand(decision));
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
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(14, 15, "Angular 14 to 15"), new JsonObject(), Config(root) with { Ai = new AiConfig { UseAi = true, Provider = "codex" }, MaxRetries = 1 }, null, null);

        Assert.Equal("done", result["status"]!.ToString());
        Assert.Equal(1, ai.SystemPrompts.Count(p => p.Contains("Recommend safe package target versions")));
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
        Assert.Equal(["npm", "install", "--no-audit", "--no-fund", "--prefer-offline"], install["command"]!.AsArray().Select(x => x!.ToString()));
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

        Assert.Equal("^15.2.10", deps["@angular/core"]!.ToString());
        Assert.Equal("^15.2.10", deps["@angular/cli"]!.ToString());
        Assert.Equal("~4.9.5", devDeps["typescript"]!.ToString());
        Assert.Equal("^4.17.0", deps["lodash"]!.ToString());
        Assert.Contains(result["packagesManualReview"]!.AsArray().OfType<JsonObject>(), p => p.StringValue("name") == "mystery-business");
        Assert.True(result.BoolValue("packageCategorisationCompleted"));
        Assert.True(ai.Calls >= 3);
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
            InstallDecision("normalInstall", "npm install --no-audit --no-fund --prefer-offline", "safe first install"));
        var runner = new RecordingRunner(command => command[0] == "npm" && command[1] == "view" ? new CommandResult { ReturnCode = 0, Stdout = """["14.3.0"]""" } : new CommandResult { ReturnCode = 0 });
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(13, 14, "Angular 13 to 14"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "13"), To = new RuntimeSpec("angular", "14"), Ai = new AiConfig { UseAi = true, Provider = "codex" } }, null, null);
        var packageJsonText = await File.ReadAllTextAsync(Path.Combine(root, "package.json"));
        var packageJson = JsonNode.Parse(packageJsonText)!.AsObject();
        var deps = packageJson["dependencies"]!.AsObject();
        var devDeps = packageJson["devDependencies"]!.AsObject();

        Assert.Equal("done", result.StringValue("status"));
        Assert.Equal("^14.2.13", devDeps["@angular-devkit/build-angular"]!.ToString());
        Assert.Equal("^14.0.0", deps["@angular-slider/ngx-slider"]!.ToString());
        Assert.DoesNotContain("^14.3.0", packageJsonText);
        Assert.Equal(1, ai.SystemPrompts.Count(p => p.Contains("Recommend safe package target versions")));
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
        Assert.Equal("^14.3.0", deps["@angular/core"]!.ToString());
        Assert.Equal("^14.3.0", deps["@angular/common"]!.ToString());
        Assert.Equal("^14.3.0", deps["@angular/compiler"]!.ToString());
        Assert.Equal("^14.3.0", devDeps["@angular/cli"]!.ToString());
        Assert.Equal("^14.3.0", devDeps["@angular/compiler-cli"]!.ToString());
        Assert.Equal("^14.2.13", devDeps["@angular-devkit/build-angular"]!.ToString());
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
        Assert.Equal("verified", resolvedTs.StringValue("npmValidationResult"));
        Assert.Equal("~4.8.4", resolvedTs.StringValue("finalAcceptedVersion"));
        Assert.Contains(result["angularCriticalDependencyAlignmentAccepted"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "typescript");
        Assert.DoesNotContain(result["rejectedAiPackageSuggestions"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("name", r.StringValue("packageName")) == "typescript");
        Assert.DoesNotContain(result["aiPackageVersionRecommendationsRejected"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "typescript");
        Assert.DoesNotContain(result["packagesManualReview"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("name") == "typescript" || r.StringValue("name") == "ngx-bootstrap");
        Assert.Contains(result["thirdPartyPackageDecisions"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("name") == "ngx-bootstrap");
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "typescript@~4.8.4", "version", "--json"]));
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["npm", "install", "--no-audit", "--no-fund", "--prefer-offline"]));
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["npm", "run", "build"]));
        Assert.DoesNotContain(result["commands"]!.AsArray().OfType<JsonObject>(), c => string.IsNullOrWhiteSpace(string.Join(" ", c["command"]?.AsArray()?.Select(x => x?.ToString()) ?? [])));
        Assert.False(result.BoolValue("manualActionRequired"));
    }

    [Fact]
    public async Task Install_First_Mode_Skips_Npm_View_For_High_Confidence_Ai_Recommendations()
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
        Assert.DoesNotContain(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "@angular/core@^14.2.13", "version", "--json"]));
        Assert.DoesNotContain(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "@angular-devkit/build-angular@^14.2.13", "version", "--json"]));
        Assert.DoesNotContain(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "ngx-bootstrap@^9.0.0", "version", "--json"]));
        Assert.DoesNotContain(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "@angular/core@14", "version", "--json"]));
        Assert.DoesNotContain(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "@angular-devkit/build-angular@14", "version", "--json"]));
        Assert.DoesNotContain(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "ngx-bootstrap@14", "version", "--json"]));
        Assert.Contains(result["packageTargetValidation"]!["resolved"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "ngx-bootstrap" && r.StringValue("npmVerificationResult") == "skipped");
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
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "@angular/core@^14.2.13", "version", "--json"]));
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "@angular-devkit/build-angular@^14.2.13", "version", "--json"]));
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
            if (command[0] == "npm" && command[1] == "view" && command[2] == "@angular/core@^14.2.13")
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
        Assert.Equal(1, runner.Calls.Count(c => c.Command.SequenceEqual(["npm", "view", "@angular/core@^14.2.13", "version", "--json"])));
        Assert.DoesNotContain(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "@angular/core@14", "version", "--json"]));
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
        Assert.Equal("^14.0.0", devDeps["@angular-devkit/build-angular"]!.ToString());
        Assert.Equal("^14.0.0", buildAngularUpdate.StringValue("originalSuggestedVersion"));
        Assert.Equal("^14.0.0", buildAngularUpdate.StringValue("finalAcceptedVersion"));
        Assert.DoesNotContain(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "@angular/core@14", "version", "--json"]));
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
                if (spec is "@angular/cdk@^15.2.10" or "@angular/material@^15.2.10") return new CommandResult { ReturnCode = 1, Stderr = "E404 No match found for version" };
                if (spec is "@angular/cdk@~15.2.9" or "@angular/material@~15.2.9") return new CommandResult { ReturnCode = 0, Stdout = """["15.2.9"]""" };
                if (spec is "@angular/cli@~15.2.10" or "@angular-devkit/build-angular@~15.2.10") return new CommandResult { ReturnCode = 0, Stdout = """["15.2.11"]""" };
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
        Assert.Equal("~15.2.10", deps["@angular/core"]!.ToString());
        Assert.Equal("~15.2.9", deps["@angular/cdk"]!.ToString());
        Assert.Equal("~15.2.9", deps["@angular/material"]!.ToString());
        Assert.Equal("^4.0.0", deps["angular-user-idle"]!.ToString());
        Assert.Equal("^10.0.0", deps["ngx-bootstrap"]!.ToString());
        Assert.Equal("~15.2.11", devDeps["@angular/cli"]!.ToString());
        Assert.Equal("~15.2.11", devDeps["@angular-devkit/build-angular"]!.ToString());
        Assert.Contains(resolved, r => r.StringValue("packageName") == "@angular/cdk" && r.StringValue("originalSuggestedVersion") == "^15.2.10" && r.StringValue("aiReRecommendedVersion") == "~15.2.9" && r.StringValue("finalAcceptedVersion") == "~15.2.9");
        Assert.Contains(resolved, r => r.StringValue("packageName") == "@angular/material" && r.StringValue("originalSuggestedVersion") == "^15.2.10" && r.StringValue("aiReRecommendedVersion") == "~15.2.9" && r.StringValue("finalAcceptedVersion") == "~15.2.9");
        Assert.Contains(resolved, r => r.StringValue("packageName") == "angular-user-idle" && r.StringValue("originalSuggestedVersion") == "^4.0.0" && r.StringValue("npmValidationResult") == "verified" && r.StringValue("finalAcceptedVersion") == "^4.0.0");
        Assert.Contains(resolved, r => r.StringValue("packageName") == "ngx-bootstrap" && r.StringValue("originalSuggestedVersion") == "^10.0.0" && r.StringValue("npmValidationResult") == "verified" && r.StringValue("finalAcceptedVersion") == "^10.0.0");
        Assert.DoesNotContain(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "@angular/cdk@15", "version", "--json"]));
        Assert.DoesNotContain(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "@angular/material@15", "version", "--json"]));
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "angular-user-idle@^4.0.0", "version", "--json"]));
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "ngx-bootstrap@^10.0.0", "version", "--json"]));
        Assert.DoesNotContain(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "angular-user-idle@15", "version", "--json"]));
        Assert.DoesNotContain(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "ngx-bootstrap@15", "version", "--json"]));
        var report = new MarkdownReportWriter().GenerateAdapterHopReport(new JsonObject { ["manifest"] = new JsonObject(), ["to"] = "angular15" }, [new MigrationHop(14, 15, "Angular 14 to 15")], [result], new ValidationResult { Passed = true });
        Assert.Contains("@angular/cdk", report);
        Assert.Contains("aiRecommended=^15.2.10", report);
        Assert.Contains("finalSelected=~15.2.9", report);
        Assert.Contains("aiOverriddenByNpm=True", report);
        Assert.Contains("angular-user-idle", report);
        Assert.Contains("finalSelected=^4.0.0", report);
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
            InstallDecision("normalInstall", "npm install --no-audit --no-fund --prefer-offline", "first install"),
            VersionRecommendations(VersionRecommendation("@angular/cdk", "^15.2.10", "~15.2.9", "CDK has a published Angular 15-compatible patch.")),
            InstallDecision("normalInstall", "npm install --no-audit --no-fund --prefer-offline", "retry after package version correction"));
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
        Assert.DoesNotContain(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "@angular/cdk@^15.2.10", "version", "--json"]));
        Assert.Contains(runner.Calls, c => c.Command.SequenceEqual(["npm", "view", "@angular/cdk@~15.2.9", "version", "--json"]));
        Assert.Equal(2, ai.SystemPrompts.Count(p => p.Contains("Recommend safe package target versions")));
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
        Assert.Equal("~16.2.11", deps["@angular/cdk"]!.ToString());
        Assert.Equal("~16.2.11", deps["@angular/material"]!.ToString());
        Assert.Equal("~16.2.12", devDeps["@angular/cli"]!.ToString());
        Assert.Equal("~16.2.12", devDeps["@angular-devkit/build-angular"]!.ToString());
        Assert.Equal("~16.2.12", devDeps["@angular/compiler-cli"]!.ToString());
        Assert.Equal("~5.1.6", devDeps["typescript"]!.ToString());
        foreach (var name in new[] { "@angular/material", "@angular/cdk", "@angular/cli", "@angular-devkit/build-angular", "@angular/compiler-cli", "typescript" })
        {
            var expected = name is "@angular/material" or "@angular/cdk" ? "~16.2.11" : name == "typescript" ? "~5.1.6" : "~16.2.12";
            Assert.Contains(resolved, r => r.StringValue("packageName") == name && r.StringValue("npmValidationResult") == "verified" && r.StringValue("finalAcceptedVersion") == expected);
        }
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
        Assert.Contains("@angular-devkit/build-angular@^14.0.0", result.StringValue("failureReason"));
        Assert.Equal(before, after);
        Assert.DoesNotContain(runner.Calls, c => c.Command.Take(2).SequenceEqual(["npm", "install"]));
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
                if (command[2] == "@angular-devkit/build-angular@^14.3.0") return new CommandResult { ReturnCode = 1, Stderr = "No matching version found" };
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
    [InlineData("^14.3.0", "^14.3.0")]
    [InlineData("~14.3.0", "~14.3.0")]
    [InlineData("14.3.0", "14.3.0")]
    [InlineData("14.x", "^14.0.0")]
    [InlineData("14.*", "^14.0.0")]
    [InlineData("^14", "^14")]
    [InlineData("~14", "~14")]
    [InlineData(">=14 <15", ">=14 <15")]
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
        Assert.Equal("^14.3.0", packageJson["dependencies"]!["@angular/core"]!.ToString());
    }

    [Fact]
    public async Task Safe_Ai_Config_Update_Is_Applied_Before_Npm_Install()
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
                var tsconfig = File.ReadAllText(Path.Combine(root, "tsconfig.json"));
                return new CommandResult { ReturnCode = tsconfig.Contains("\"target\":\"ES2022\"") ? 0 : 1, Stderr = "config was not updated before install" };
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
        Assert.Contains("[accepted]", report);
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
            InstallDecision("normalInstall", "npm install --no-audit --no-fund --prefer-offline", "first"),
            InstallDecision("retrySameCommand", "npm install --no-audit --no-fund --prefer-offline", "network retry", failure: "transientNetworkFailure", retry: true));
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
        var ai = new SequenceAi(PackagePlan(), VersionRecommendations(), EmptyConfigPlan(), InstallDecision("normalInstall", "npm install --no-audit --no-fund --prefer-offline", "safe first install"));
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
            InstallDecision("normalInstall", "npm install --no-audit --no-fund --prefer-offline", "safe first install"),
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
            InstallDecision("normalInstall", "npm install --no-audit --no-fund --prefer-offline", "safe first install"),
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
            ["summary"] = "Angular compiler errors identify obsolete NgModule metadata plus Angular 16 incompatible third-party Angular libraries.",
            ["confidence"] = 0.91,
            ["risk"] = "medium",
            ["requiresManualCorrection"] = false,
            ["failureCategory"] = "dependency",
            ["businessLogicChanged"] = false,
            ["changes"] = new JsonArray(new JsonObject
            {
                ["file"] = "package.json",
                ["type"] = "package_update",
                ["failureCategory"] = "dependency",
                ["packageName"] = "ng6-toastr-notifications, ngx-slick-carousel, ngx-pinch-zoom, angular-user-idle",
                ["reason"] = "Validation-proven Angular compiler errors show these installed Angular libraries are incompatible with Angular 16; update or replace packages without editing node_modules.",
                ["before"] = "\"ng6-toastr-notifications\": \"^1.0.4\"",
                ["after"] = "\"ngx-toastr\": \"^17.0.2\""
            }),
            ["commandsToRunAfter"] = new JsonArray(),
            ["reportNotes"] = new JsonArray("ng6-toastr-notifications should be replaced with an Angular 16 compatible toastr package; module wiring must remain equivalent.")
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
            InstallDecision("normalInstall", "npm install --no-audit --no-fund --prefer-offline", "safe install"),
            aiRemediation);
        var buildRuns = 0;
        var runner = new RecordingRunner(command =>
        {
            if (command[0] == "npm" && command[1] == "view") return new CommandResult { ReturnCode = 0, Stdout = """["16.2.12","5.1.6","17.0.2","4.0.0"]""" };
            if (command.Take(2).SequenceEqual(["npm", "install"])) return new CommandResult { ReturnCode = 0 };
            if (command.SequenceEqual(["npm", "run", "build"]))
            {
                buildRuns++;
                return buildRuns < 3 ? new CommandResult { ReturnCode = 1, Stderr = Angular16FailureSample } : new CommandResult { ReturnCode = 0 };
            }
            return new CommandResult { ReturnCode = 0 };
        });
        var adapter = new AngularAdapter(runner, ai: ai, promptLoader: new PromptLoader());

        var result = await adapter.ExecuteMigrationHopAsync(root, new MigrationHop(15, 16, "Angular 15 to 16"), new JsonObject(), Config(root) with { From = new RuntimeSpec("angular", "15"), To = new RuntimeSpec("angular", "16"), Ai = new AiConfig { UseAi = true, Provider = "codex" }, MaxAiRemediationRetries = 2 }, null, null);
        var report = new MarkdownReportWriter().GenerateAdapterHopReport(new JsonObject { ["manifest"] = new JsonObject(), ["to"] = "angular16" }, [new MigrationHop(15, 16, "Angular 15 to 16")], [result], new ValidationResult { Passed = true });

        Assert.True(result.StringValue("status") == "done", result.ToJsonString(JsonHelpers.SerializerOptions));
        Assert.DoesNotContain("entryComponents", await File.ReadAllTextAsync(Path.Combine(root, "src", "app", "app.module.ts")));
        Assert.Contains("ngx-toastr", await File.ReadAllTextAsync(Path.Combine(root, "package.json")));
        Assert.Contains(result["aiRemediationChanges"]!.AsArray().OfType<JsonObject>(), c => c.StringValue("failureCategory") == "obsolete_angular_metadata");
        Assert.Contains(result["aiRemediationChanges"]!.AsArray().OfType<JsonObject>(), c => c.StringValue("type") == "package_update");
        Assert.Empty(result["manualCorrectionRequests"]!.AsArray());
        Assert.Contains(runner.Calls, c => c.Command.Take(2).SequenceEqual(["npm", "install"]));
        Assert.Contains("## AI Remediation Root Cause Analysis", report);
        Assert.Contains("ng6-toastr-notifications", report);
        Assert.Contains("ngx-slick-carousel", report);
        Assert.Contains("cascading local module error", report);
        Assert.Contains("@NgModule present=True", report);
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

    private static async Task<string> Angular13Workspace()
    {
        var root = TestWorkspace.Create();
        await File.WriteAllTextAsync(Path.Combine(root, "package.json"), """
{
  "scripts": {"build":"ng build"},
  "dependencies": {
    "@angular/core": "~13.1.0",
    "@angular/common": "~13.1.0",
    "@angular/compiler": "~13.1.0"
  },
  "devDependencies": {
    "@angular/cli": "~13.1.2",
    "@angular/compiler-cli": "~13.1.0",
    "@angular-devkit/build-angular": "^13.3.10",
    "typescript": "~4.5.2"
  }
}
""");
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

    private static JsonObject EmptyConfigPlan() => new()
    {
        ["changes"] = new JsonArray(),
        ["manualRecommendations"] = new JsonArray()
    };

    private static JsonObject EmptyCriticalAlignment(int sourceMajor, int targetMajor) => new()
    {
        ["sourceAngularMajor"] = sourceMajor,
        ["targetAngularMajor"] = targetMajor,
        ["recommendations"] = new JsonArray(),
        ["warnings"] = new JsonArray()
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
        public List<string> SystemPrompts { get; } = [];
        public Task<JsonObject?> AskAsync(AiConfig config, string system, string user, CancellationToken cancellationToken = default)
        {
            SystemPrompts.Add(system);
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
