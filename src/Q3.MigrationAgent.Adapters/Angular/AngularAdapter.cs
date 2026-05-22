using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Q3.MigrationAgent.Adapters.PackageClassification;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Core.Remediation;
using Q3.MigrationAgent.Shared.Common;
using Q3.MigrationAgent.Shared.Config;
using Q3.MigrationAgent.Shared.DTO;

namespace Q3.MigrationAgent.Adapters.Angular;

public sealed class AngularAdapter(ICommandRunner commandRunner, PackageClassifier? packageClassifier = null, IAiService? ai = null, IPromptLoader? promptLoader = null, AngularPackageVersionRecommendationPlanner? versionRecommendationPlanner = null, AngularCriticalDependencyAlignmentPlanner? criticalDependencyAlignmentPlanner = null) : IMigrationAdapter
{
    private static readonly string[] StructuralFiles = ["package.json", "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "angular.json", "tsconfig.json", "tsconfig.app.json", "tsconfig.spec.json", "karma.conf.js", "jest.config.js", "eslint.config.js", ".eslintrc.json", "browserslist", ".nvmrc", ".node-version"];
    private static readonly HashSet<string> AllowedInstallModes = ["normalInstall", "legacyPeerDepsInstall", "retrySameCommand", "manualReview", "forceInstall", "normal", "legacyPeerDeps"];
    private static readonly string[] NormalNpmInstallCommand = ["npm", "install", "--no-audit", "--no-fund", "--prefer-offline"];
    private static readonly string[] LegacyPeerDepsNpmInstallCommand = ["npm", "install", "--legacy-peer-deps", "--no-audit", "--no-fund", "--prefer-offline"];
    private static readonly HashSet<string> AllowedNpmInstallCommands =
    [
        string.Join(" ", NormalNpmInstallCommand),
        string.Join(" ", LegacyPeerDepsNpmInstallCommand)
    ];
    private static readonly HashSet<string> AngularRuntimeSupportPackages = ["zone.js", "rxjs", "tslib"];
    private static readonly HashSet<string> AngularCoupledRuntimePackages = ["zone.js", "rxjs", "tslib", "typescript"];
    private static readonly HashSet<string> AngularFrameworkPackages = ["@angular/core", "@angular/common", "@angular/compiler", "@angular/forms", "@angular/router", "@angular/platform-browser", "@angular/platform-browser-dynamic", "@angular/animations"];
    private static readonly HashSet<string> AngularToolingPackages = ["@angular/cli", "@angular-devkit/build-angular", "@angular/compiler-cli", "@ngtools/webpack"];
    private static readonly HashSet<string> AngularComponentPackages = ["@angular/cdk", "@angular/material"];
    private static readonly HashSet<string> AngularAiPackageCategories = ["angular_framework_package", "angular_tooling_package", "angular_runtime_support_package", "typescript_runtime_or_compiler_package", "angular_ui_or_extension_package", "third_party_runtime_package", "third_party_build_or_test_tooling", "business_or_unknown_package"];
    private static readonly HashSet<string> AngularAiPackageActions = ["upgrade", "preserve", "remove", "manual_review"];
    private static readonly HashSet<string> AngularAiConfigFiles = ["angular.json", "tsconfig.json", "tsconfig.app.json", "tsconfig.spec.json", "package.json"];
    private static readonly HashSet<string> AngularAiConfigChangeTypes = ["update_builder", "update_option", "remove_deprecated_option", "update_tsconfig", "manual_review"];
    private const double MinimumInstallDecisionConfidence = 0.70;
    private const double MinimumAiPackageConfidence = 0.80;
    private const double MinimumAiConfigConfidence = 0.80;
    private readonly Dictionary<(string Package, string Field, string Range), JsonObject> _npmViewCache = [];
    public string RuntimeName => "angular";

    public Task<bool> DetectAsync(string projectPath, CancellationToken cancellationToken = default)
    {
        var path = Path.Combine(projectPath, "package.json");
        if (!File.Exists(path)) return Task.FromResult(false);
        var data = ReadJson(path);
        var deps = AllDependencies(data);
        return Task.FromResult(deps.ContainsKey("@angular/core") || deps.ContainsKey("@angular/cli"));
    }

    public Task<JsonObject> ParseManifestAsync(string projectPath, CancellationToken cancellationToken = default)
    {
        var packageJson = Path.Combine(projectPath, "package.json");
        var data = ReadJson(packageJson);
        var dependencies = AllDependencies(data);
        var (manager, lockfile) = DetectPackageManager(projectPath);
        var dependencyList = new JsonArray(dependencies.OrderBy(k => k.Key).Select(kvp => new JsonObject { ["name"] = kvp.Key, ["version"] = kvp.Value, ["manager"] = manager, ["ecosystem"] = "angular", ["sourceFile"] = "package.json" }).ToArray<JsonNode?>());
        var manifest = new JsonObject
        {
            ["runtime"] = RuntimeName,
            ["angularVersion"] = MajorVersion(dependencies.GetValueOrDefault("@angular/core")),
            ["angularCoreVersion"] = dependencies.GetValueOrDefault("@angular/core"),
            ["angularCliVersion"] = dependencies.GetValueOrDefault("@angular/cli"),
            ["packageManager"] = manager,
            ["lockfile"] = lockfile,
            ["scripts"] = data["scripts"]?.DeepClone() ?? new JsonObject(),
            ["hasAngularJson"] = File.Exists(Path.Combine(projectPath, "angular.json")),
            ["hasTsconfig"] = File.Exists(Path.Combine(projectPath, "tsconfig.json")),
            ["builder"] = DetectBuilder(projectPath),
            ["dependencies"] = dependencyList.DeepClone(),
            ["projects"] = new JsonArray(new JsonObject { ["path"] = "package.json", ["packages"] = dependencyList })
        };
        return Task.FromResult(manifest);
    }

    public Task<IReadOnlyList<string>> UpgradePackageAsync(string projectPath, JsonObject change, CancellationToken cancellationToken = default)
    {
        var path = Path.Combine(projectPath, "package.json");
        var data = ReadJson(path);
        var touched = false;
        foreach (var section in new[] { "dependencies", "devDependencies", "optionalDependencies" })
        {
            if (data[section] is not JsonObject deps) continue;
            if (deps.ContainsKey(change.StringValue("name")))
            {
                deps[change.StringValue("name")] = change.StringValue("toVersion");
                touched = true;
            }
        }
        if (!touched) return Task.FromResult<IReadOnlyList<string>>([]);
        File.WriteAllText(path, data.ToJsonString(JsonHelpers.SerializerOptions) + Environment.NewLine);
        return Task.FromResult<IReadOnlyList<string>>([path]);
    }

    public async Task<BuildResult> RunBuildAsync(string projectPath, int? timeoutSeconds = null, int? idleTimeoutSeconds = null, CancellationToken cancellationToken = default)
    {
        var manifest = await ParseManifestAsync(projectPath, cancellationToken);
        var outputs = new List<string>();
        var build = await RunBuildVerificationCommandAsync(projectPath, manifest, null, null, null, timeoutSeconds, idleTimeoutSeconds, cancellationToken);
        outputs.Add(build.Output);
        if (!build.Passed)
        {
            return new BuildResult(false, string.Join("\n\n", outputs.Where(s => !string.IsNullOrWhiteSpace(s))));
        }

        var success = true;
        foreach (var validation in ValidationCommands(manifest))
        {
            if (validation.BoolValue("skip"))
            {
                outputs.Add($"SKIPPED: {validation.StringValue("description")} ({validation.StringValue("reason")})");
                continue;
            }
            var command = validation["command"]!.AsArray().Select(x => x!.ToString()).ToArray();
            var result = await commandRunner.RunAsync(command, projectPath, timeoutSeconds: timeoutSeconds, idleTimeoutSeconds: idleTimeoutSeconds, cancellationToken: cancellationToken);
            outputs.Add(FormatCommandOutput(command, result));
            if (result.ReturnCode != 0)
            {
                success = false;
                break;
            }
        }
        return new BuildResult(success, string.Join("\n\n", outputs));
    }

    public Task<IReadOnlyDictionary<string, string>> CollectProjectFilesAsync(string projectPath, CancellationToken cancellationToken = default)
    {
        var result = new Dictionary<string, string>();
        foreach (var file in StructuralFiles.Order())
        {
            var path = Path.Combine(projectPath, file);
            if (File.Exists(path))
            {
                var text = File.ReadAllText(path);
                result[file] = text[..Math.Min(20_000, text.Length)];
            }
        }
        return Task.FromResult<IReadOnlyDictionary<string, string>>(result);
    }

    public IReadOnlyList<MigrationHop> ExpandMigrationHops(string fromVersion, string toVersion)
    {
        var start = MajorFromSpec(fromVersion);
        var end = MajorFromSpec(toVersion);
        if (start is null || end is null || end <= start) return [];
        return Enumerable.Range(start.Value, end.Value - start.Value).Select(v => new MigrationHop(v, v + 1, $"Angular {v} to {v + 1}")).ToArray();
    }

    public async Task<JsonObject> ExecuteMigrationHopAsync(string projectPath, MigrationHop hop, JsonObject rules, MigrationConfig config, IProgressReporter? progress, string? logPath, CancellationToken cancellationToken = default)
    {
        var target = hop.ToVersion;
        var stage = $"Angular {hop.FromVersion} -> {hop.ToVersion}";
        var beforeFiles = StructuralFileContents(projectPath);
        progress?.Stage(stage, "Starting...");
        progress?.Stage(stage, config.SkipPreflightDependencyCompatibility ? "Skipping dependency compatibility checks..." : "Checking dependency compatibility...");
        var preflight = config.SkipPreflightDependencyCompatibility
            ? new JsonObject { ["targetAngularMajor"] = target, ["status"] = "skipped", ["checked"] = new JsonArray(), ["blockers"] = new JsonArray(), ["warnings"] = new JsonArray("Preflight dependency compatibility check skipped by configuration.") }
            : await AnalyzePeerDependencyCompatibilityAsync(projectPath, target, config, progress, stage, logPath, cancellationToken);

        var commands = new JsonArray();
        var packageUpdate = await ApplyAiDrivenPackageJsonUpdateAsync(projectPath, hop, config, progress, stage, logPath, cancellationToken);
        if (packageUpdate["success"]?.GetValue<bool>() != true)
        {
            var failed = FailedHopResult(hop, commands, ChangedStructuralFiles(projectPath, beforeFiles), preflight, packageUpdate.StringValue("reason"), packageUpdate.StringValue("package"));
            AddAngularAiHopDetails(failed, packageUpdate, new JsonObject(), new JsonObject(), [], new JsonObject { ["passed"] = false, ["errors"] = packageUpdate.StringValue("reason") });
            return failed;
        }

        var configUpdate = await ApplyAiStructuralConfigPlanAsync(projectPath, hop, config, progress, stage, cancellationToken);
        var cleanInstall = CleanInstallInputs(projectPath, DetectPackageManager(projectPath).Manager, progress, stage);
        if (cleanInstall.BoolValue("manualActionRequired"))
        {
            var failure = new FailureInfo("clean install cleanup failed", stage, [], cleanInstall.StringValue("reason", "node_modules or package-lock.json could not be deleted safely."), cleanInstall.StringValue("suggestedAction", "Close processes locking node_modules and rerun migration."), false, true);
            var failed = ClassifiedFailedHopResult(hop, commands, ChangedStructuralFiles(projectPath, beforeFiles), preflight, failure, new JsonArray());
            AddAngularAiHopDetails(failed, packageUpdate, configUpdate, cleanInstall, [], new JsonObject { ["passed"] = false, ["errors"] = failure.Reason });
            return failed;
        }
        var manifest = await ParseManifestAsync(projectPath, cancellationToken);
        var packageJsonChanged = ChangedStructuralFiles(projectPath, beforeFiles).Contains("package.json");
        var installAttempts = await RunCleanInstallAsync(projectPath, hop, manifest, preflight, config, packageJsonChanged, cleanInstall, progress, stage, logPath, cancellationToken);
        foreach (var attempt in installAttempts) commands.Add(InstallCommandObject(attempt));
        var install = installAttempts.Last();
        if (install.Result.ReturnCode != 0)
        {
            var failure = ClassifyFailure(install.Command, install.Result, target);
            var failed = ClassifiedFailedHopResult(hop, commands, ChangedStructuralFiles(projectPath, beforeFiles), preflight, failure, new JsonArray());
            AddAngularAiHopDetails(failed, packageUpdate, configUpdate, cleanInstall, installAttempts, new JsonObject { ["passed"] = false, ["errors"] = failure.Reason });
            return failed;
        }

        var success = true;
        var validation = await RunValidationsAsync(projectPath, hop, config.CommandTimeoutSeconds, config.CommandIdleTimeoutSeconds, progress, stage, logPath, config.MaxAiRemediationRetries > 0, cancellationToken);
        if (validation["buildVerificationCommandResult"] is JsonObject buildCommandResult) commands.Add(buildCommandResult.DeepClone());
        var aiRemediationChanges = new JsonArray();
        var manualCorrectionRequests = new JsonArray();
        var validationFailures = new JsonArray();
        if (!validation.BoolValue("passed")) validationFailures.Add(ValidationFailureObject(validation, hop, false));
        if (!validation.BoolValue("passed") && config.MaxAiRemediationRetries > 0)
        {
            for (var attempt = 1; attempt <= config.MaxAiRemediationRetries && !validation.BoolValue("passed"); attempt++)
            {
                var validationResult = ValidationResultFromAngularValidation(validation, hop);
                foreach (var existing in aiRemediationChanges.OfType<JsonObject>()) validationResult.AiRemediationChanges.Add(existing.DeepClone().AsObject());
                RemediationAttempt remediation;
                var deterministic = await AiRemediationPlanner.TryApplyDeterministicRemediationAsync(projectPath, validationResult, attempt, config.MaxAiRemediationRetries, cancellationToken);
                if (deterministic is not null)
                {
                    remediation = RemediationAttempt.AppliedResult([deterministic]);
                    progress?.Stage(stage, "Applied deterministic validation remediation. Re-running build verification.");
                }
                else if (config.Ai.UseAi && ai is not null && promptLoader is not null)
                {
                    progress?.Stage(stage, $"Requesting AI validation remediation attempt {attempt}.");
                    remediation = await new AiRemediationPlanner(ai, promptLoader).TryRemediateAsync(config, projectPath, this, validationResult, attempt, cancellationToken);
                    progress?.Stage(stage, AiRemediationResultSummary(remediation));
                }
                else
                {
                    manualCorrectionRequests.Add(ManualCorrectionObject(validation, "AI remediation disabled or maxAiRemediationRetries is 0"));
                    break;
                }

                foreach (var change in remediation.Changes) aiRemediationChanges.Add(change.DeepClone());
                MarkLatestValidationFailureRemediation(validationFailures, remediation.Attempted, remediation.Applied, remediation.ManualCorrection is not null);
                if (remediation.ManualCorrection is not null)
                {
                    progress?.Stage(stage, $"AI validation remediation stopped: {remediation.ManualCorrection.StringValue("reason", "manual correction required")}");
                    manualCorrectionRequests.Add(remediation.ManualCorrection.DeepClone());
                    MarkLatestValidationFailureManualCorrection(validationFailures);
                    break;
                }
                if (!remediation.Applied)
                {
                    if (remediation.Changes.Any(IsAiEnvironmentError))
                    {
                        progress?.Stage(stage, $"Codex sandbox validation output was ignored. Re-running build verification with the migration agent.");
                        validation = await RunValidationsAsync(projectPath, hop, config.CommandTimeoutSeconds, config.CommandIdleTimeoutSeconds, progress, stage, logPath, attempt < config.MaxAiRemediationRetries, cancellationToken);
                        if (validation["buildVerificationCommandResult"] is JsonObject sandboxRerunCommandResult) commands.Add(sandboxRerunCommandResult.DeepClone());
                        foreach (var change in aiRemediationChanges.OfType<JsonObject>().Where(c => c.IntValue("attempt") == attempt))
                        {
                            change["agentValidationCommand"] = validation.StringValue("buildVerificationCommand", "npm run build");
                            change["agentValidationResult"] = validation.BoolValue("passed") ? "passed" : "failed";
                            change["validationResultAfterRemediation"] = "inconclusive";
                            change["validationErrorTail"] = validation.BoolValue("passed") ? "" : Tail(validation.StringValue("output", validation.StringValue("errors")));
                        }
                        if (!validation.BoolValue("passed")) validationFailures.Add(ValidationFailureObject(validation, hop, true, remediationApplied: false));
                        if (attempt < config.MaxAiRemediationRetries) continue;
                    }
                    if (remediation.Changes.Any(IsAiTimeoutFailure) && attempt < config.MaxAiRemediationRetries)
                    {
                        progress?.Stage(stage, $"AI validation remediation attempt {attempt} timed out. Retrying with reduced context.");
                        continue;
                    }
                    break;
                }

                if (RemediationRequiresNpmInstall(remediation.Changes))
                {
                    progress?.Stage(stage, "AI remediation changed Angular package dependencies. Running npm install before validation rerun.");
                    var installDecision = DeterministicDecision("normalInstall", "Package remediation changed package.json; reinstall dependencies before rerunning Angular validation.", "low", false, false, "validationPackageRemediation");
                    var installAttempt = await RunInstallAttemptAsync(projectPath, NormalNpmInstallCommand, installDecision, "validation-remediation", false, false, 0, remediation.Changes.Any(c => string.Equals(c.StringValue("mode"), "ai", StringComparison.OrdinalIgnoreCase)), true, "", false, config, progress, stage, logPath, cancellationToken);
                    commands.Add(InstallCommandObject(installAttempt));
                    if (installAttempt.Result.ReturnCode != 0)
                    {
                        validation = new JsonObject
                        {
                            ["passed"] = false,
                            ["output"] = FormatCommandOutput(installAttempt.Command, installAttempt.Result),
                            ["errors"] = "npm install failed after validation remediation changed package.json.",
                            ["buildVerificationAttempted"] = true,
                            ["buildVerificationCommand"] = string.Join(" ", installAttempt.Command),
                            ["buildVerificationExecutor"] = "npm-install",
                            ["buildVerificationPassed"] = false,
                            ["buildVerificationSkipped"] = false,
                            ["buildVerificationFailureReason"] = "npm install failed after validation remediation changed package.json.",
                            ["buildVerificationFailureCategory"] = installAttempt.FailureClassification?.Category ?? "dependency",
                            ["nextHopStartedOnlyAfterBuildVerificationPassed"] = false
                        };
                        validationFailures.Add(ValidationFailureObject(validation, hop, true, remediationApplied: true));
                        break;
                    }
                }

                validation = await RunValidationsAsync(projectPath, hop, config.CommandTimeoutSeconds, config.CommandIdleTimeoutSeconds, progress, stage, logPath, attempt < config.MaxAiRemediationRetries, cancellationToken);
                var rerunPassed = validation.BoolValue("passed");
                foreach (var change in aiRemediationChanges.OfType<JsonObject>().Where(c => c.IntValue("attempt") == attempt))
                {
                    change["validationResultAfterRemediation"] = rerunPassed ? "passed" : "failed";
                    change["validationErrorTail"] = rerunPassed ? "" : Tail(validation.StringValue("output", validation.StringValue("errors")));
                }
                if (validation["buildVerificationCommandResult"] is JsonObject remediationBuildCommandResult) commands.Add(remediationBuildCommandResult.DeepClone());
                if (!rerunPassed) validationFailures.Add(ValidationFailureObject(validation, hop, true, remediationApplied: remediation.Applied));
            }
        }
        JsonObject? postFailureCriticalAlignment = null;
        if (!validation.BoolValue("passed") && IsCriticalDependencyBuildFailure(validation))
        {
            postFailureCriticalAlignment = await RemediateCriticalDependencyBuildFailureAsync(projectPath, hop, config, packageUpdate, validation, commands, cleanInstall, progress, stage, logPath, cancellationToken);
            if (postFailureCriticalAlignment.BoolValue("remediationApplied"))
            {
                validation = await RunValidationsAsync(projectPath, hop, config.CommandTimeoutSeconds, config.CommandIdleTimeoutSeconds, progress, stage, logPath, false, cancellationToken);
                if (validation["buildVerificationCommandResult"] is JsonObject retryBuildCommandResult) commands.Add(retryBuildCommandResult.DeepClone());
            }
        }
        if (!validation.BoolValue("passed") && config.MaxAiRemediationRetries == 0 && manualCorrectionRequests.Count == 0)
        {
            manualCorrectionRequests.Add(ManualCorrectionObject(validation, "AI remediation disabled or maxAiRemediationRetries is 0"));
        }
        if (!validation.BoolValue("passed") && config.MaxAiRemediationRetries > 0 && !config.Ai.UseAi && aiRemediationChanges.Count == 0 && manualCorrectionRequests.Count == 0)
        {
            manualCorrectionRequests.Add(ManualCorrectionObject(validation, "AI remediation is disabled and no deterministic safe remediation matched the validation failure."));
        }
        if (!validation.BoolValue("passed") && config.MaxAiRemediationRetries > 0 && manualCorrectionRequests.Count == 0)
        {
            manualCorrectionRequests.Add(ManualCorrectionObject(validation, "Validation remediation stopped after maxAiRemediationRetries was exhausted."));
        }
        if (!validation.BoolValue("passed")) progress?.Error(stage, "Stopping migration.");
        if (!validation.BoolValue("passed")) success = false;
        var result = new JsonObject
        {
            ["hop"] = HopObject(hop),
            ["status"] = success ? "done" : "failed",
            ["commands"] = commands,
            ["files"] = new JsonArray(ChangedStructuralFiles(projectPath, beforeFiles).Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
            ["preflightDependencyAnalysis"] = preflight,
            ["validation"] = validation,
            ["validationFailures"] = validationFailures,
            ["optionalMigrations"] = new JsonArray(),
            ["aiRemediationChanges"] = aiRemediationChanges,
            ["manualCorrectionRequests"] = manualCorrectionRequests,
            ["migrateOnlySkipped"] = true,
            ["migrateOnlySkippedReason"] = "disabled by new default flow"
        };
        if (postFailureCriticalAlignment is not null) result["postFailureAngularCriticalDependencyAlignment"] = postFailureCriticalAlignment.DeepClone();
        AddAngularAiHopDetails(result, packageUpdate, configUpdate, cleanInstall, installAttempts, validation);
        return result;
    }

    public (string Manager, string? Lockfile) DetectPackageManager(string projectPath)
    {
        if (File.Exists(Path.Combine(projectPath, "pnpm-lock.yaml"))) return ("pnpm", "pnpm-lock.yaml");
        if (File.Exists(Path.Combine(projectPath, "yarn.lock"))) return ("yarn", "yarn.lock");
        if (File.Exists(Path.Combine(projectPath, "package-lock.json"))) return ("npm", "package-lock.json");
        return ("npm", null);
    }

    public IReadOnlyList<string> InstallCommand(string manager) => manager switch
    {
        "yarn" => ["yarn", "install"],
        "pnpm" => ["pnpm", "install"],
        _ => ["npm", "install"]
    };

    public IReadOnlyList<IReadOnlyList<string>> AngularMigrateOnlyCommands(int sourceMajor, int targetMajor, string? cliVersion = null) =>
        new[] { "@angular/core", "@angular/cli" }.Select(pkg => AngularMigrateOnlyCommand(pkg, sourceMajor, targetMajor, cliVersion)).ToArray();

    public IReadOnlyList<string> AngularMigrateOnlyCommand(string packageName, int sourceMajor, int targetMajor, string? cliVersion = null)
    {
        var version = cliVersion ?? $"{targetMajor}";
        return ["npx", "--yes", "-p", $"@angular/cli@{version}", "ng", "update", packageName, "--migrate-only", "--from", sourceMajor.ToString(), "--to", targetMajor.ToString()];
    }

    public IReadOnlyList<string> SafeAngularMigrationCommand(IReadOnlyList<string> command, int targetMajor)
    {
        if (command.Count >= 2 && command[0] == "npx" && command[1] != "--yes")
        {
            return ["npx", "--yes", .. command.Skip(1)];
        }
        return command;
    }

    public JsonObject DetectBuilder(string projectPath)
    {
        var angularJson = Path.Combine(projectPath, "angular.json");
        if (!File.Exists(angularJson)) return new JsonObject { ["name"] = "unknown" };
        var text = File.ReadAllText(angularJson);
        var builder = Regex.Match(text, @"""builder""\s*:\s*""([^""]+)""");
        return new JsonObject { ["name"] = builder.Success ? builder.Groups[1].Value : "unknown" };
    }

    public JsonArray OptionalMigrations(string projectPath, int targetMajor, bool enabled)
    {
        if (targetMajor != 18) return new JsonArray();
        return new JsonArray(new JsonObject { ["name"] = "use-application-builder", ["available"] = true, ["applied"] = enabled, ["reason"] = "Optional Angular 18 application builder migration.", ["command"] = new JsonArray("npx", "--yes", "-p", "@angular/cli@18", "ng", "update", "@angular/cli", "--name", "use-application-builder") });
    }

    public JsonArray CheckCompatibility(string projectPath, int targetMajor)
    {
        var issues = new JsonArray();
        var packageJson = ReadJson(Path.Combine(projectPath, "package.json"));
        var deps = AllDependencies(packageJson);
        var ts = VersionTuple(deps.GetValueOrDefault("typescript"));
        var rxjs = VersionTuple(deps.GetValueOrDefault("rxjs"));
        if (targetMajor == 18 && ts is not null && (Compare(ts, [5, 4, 0]) < 0 || Compare(ts, [5, 6, 0]) >= 0))
        {
            issues.Add(new JsonObject { ["name"] = "typescript", ["blocking"] = true, ["message"] = "TypeScript version is incompatible with Angular 18." });
        }
        if (rxjs is not null && rxjs[0] < 6)
        {
            issues.Add(new JsonObject { ["name"] = "rxjs", ["blocking"] = true, ["message"] = "RxJS version is incompatible with Angular target." });
        }
        return issues;
    }

    private async Task<JsonObject> ApplyAngularPackageJsonUpdateAsync(string projectPath, int target, IProgressReporter? progress, string stage, string? logPath, int timeout, CancellationToken cancellationToken)
    {
        var path = Path.Combine(projectPath, "package.json");
        var data = ReadJson(path);
        var version = await ResolveAngularTargetVersionAsync(target, projectPath, logPath, cancellationToken) ?? $"{target}.0.0";
        foreach (var section in new[] { "dependencies", "devDependencies" })
        {
            if (data[section] is not JsonObject deps) continue;
            foreach (var name in deps.Select(kvp => kvp.Key).Where(IsAngularPackageJsonUpdateCandidate).ToArray())
            {
                deps[name] = $"^{version}";
            }
            if (deps.ContainsKey("typescript")) deps["typescript"] = target switch { 15 => "~4.9.5", 16 => "~5.1.6", 17 => "~5.4.5", 18 => "~5.5.4", _ => deps["typescript"] };
        }
        File.WriteAllText(path, data.ToJsonString(JsonHelpers.SerializerOptions) + Environment.NewLine);
        return new JsonObject { ["success"] = true, ["commands"] = new JsonArray(), ["package"] = "@angular/core", ["reason"] = "" };
    }

    private async Task<JsonObject> ApplyAiDrivenPackageJsonUpdateAsync(string projectPath, MigrationHop hop, MigrationConfig config, IProgressReporter? progress, string stage, string? logPath, CancellationToken cancellationToken)
    {
        progress?.Stage(stage, config.Ai.UseAi ? "Classifying Angular packages with AI..." : "Classifying Angular packages deterministically...");
        var path = Path.Combine(projectPath, "package.json");
        var data = ReadJson(path);
        var entries = DependencyEntries(data).Where(d => d.Section is "dependencies" or "devDependencies").ToArray();
        var targetAngularVersion = $"{hop.ToVersion}.0.0";
        var targetVersionByPackage = DefaultAngularTargetVersions(entries, hop.ToVersion, targetAngularVersion);
        var classification = await GetAngularAiPackageClassificationAsync(data, entries, hop, targetVersionByPackage, config, cancellationToken);
        var versionRecommendations = await GetAngularPackageVersionRecommendationsAsync(data, classification, targetVersionByPackage, hop, config, progress, stage, cancellationToken);
        var criticalAlignment = await GetAngularCriticalDependencyAlignmentAsync(projectPath, data, classification, versionRecommendations, hop, config, progress, stage, cancellationToken: cancellationToken);
        var acceptedVersionRecommendations = versionRecommendations["accepted"]?.AsArray()?.OfType<JsonObject>().ToDictionary(r => r.StringValue("packageName"), StringComparer.OrdinalIgnoreCase) ?? [];
        var acceptedCriticalAlignments = criticalAlignment["accepted"]?.AsArray()?.OfType<JsonObject>().ToDictionary(r => r.StringValue("packageName"), StringComparer.OrdinalIgnoreCase) ?? [];
        var accepted = new JsonArray();
        var rejected = new JsonArray();
        var preserved = new JsonArray();
        var manual = new JsonArray();
        var thirdParty = new JsonArray();
        var applied = new JsonArray();
        var pendingUpdates = new List<PendingPackageUpdate>();

        foreach (var item in classification["packages"]?.AsArray()?.OfType<JsonObject>() ?? [])
        {
            var decision = ValidateAngularPackageDecision(item, entries, targetVersionByPackage, hop.ToVersion);
            var acceptedCriticalForItem = acceptedCriticalAlignments.TryGetValue(item.StringValue("name"), out var prevalidatedCriticalRecommendation);
            if (!decision.Accepted && !acceptedCriticalForItem)
            {
                rejected.Add(RejectedPackageSuggestion(item, decision.Reason));
                var rejectedName = item.StringValue("name");
                var existing = entries.FirstOrDefault(e => e.Name.Equals(rejectedName, StringComparison.OrdinalIgnoreCase));
                if (!string.IsNullOrWhiteSpace(rejectedName))
                {
                    manual.Add(new JsonObject { ["name"] = rejectedName, ["reason"] = decision.Reason, ["risk"] = item.StringValue("risk", "medium") });
                    if (existing.Name is not null) preserved.Add(new JsonObject { ["name"] = rejectedName, ["version"] = existing.Version, ["section"] = existing.Section });
                }
                continue;
            }

            var section = item.StringValue("section");
            var name = item.StringValue("name");
            var action = item.StringValue("action");
            var category = item.StringValue("category");
            var current = entries.First(e => e.Name.Equals(name, StringComparison.OrdinalIgnoreCase) && e.Section == section);
            if (acceptedCriticalAlignments.TryGetValue(name, out var criticalRecommendation))
            {
                action = criticalRecommendation.StringValue("action", action) switch { "align" or "add" => "upgrade", "manualReview" => "manual_review", var other => other };
                if (action == "upgrade")
                {
                    item["targetVersion"] = criticalRecommendation.StringValue("recommendedVersion");
                    item["reason"] = criticalRecommendation.StringValue("reason", item.StringValue("reason"));
                }
            }
            if (!acceptedCriticalAlignments.ContainsKey(name) && acceptedVersionRecommendations.TryGetValue(name, out var recommendation))
            {
                action = recommendation.StringValue("action", action);
                if (action == "manualReview") action = "manual_review";
                if (action == "upgrade")
                {
                    item["targetVersion"] = recommendation.StringValue("recommendedVersion");
                    item["reason"] = recommendation.StringValue("reason", item.StringValue("reason"));
                }
            }
            if (action == "manual_review")
            {
                manual.Add(item.DeepClone());
                preserved.Add(new JsonObject { ["name"] = name, ["version"] = current.Version, ["section"] = section });
                accepted.Add(item.DeepClone());
                continue;
            }
            if (action == "preserve")
            {
                if (category == "angular_runtime_support_package" && targetVersionByPackage.TryGetValue(name, out var compatibleRuntimeVersion))
                {
                    pendingUpdates.Add(new PendingPackageUpdate(name, section, current.Version, compatibleRuntimeVersion, compatibleRuntimeVersion, category, $"Angular {hop.ToVersion} requires a compatible runtime support package version.", "deterministic-runtime-support", 1.0));
                    var revised = item.DeepClone().AsObject();
                    revised["action"] = "upgrade";
                    revised["targetVersion"] = compatibleRuntimeVersion;
                    accepted.Add(revised);
                    continue;
                }
                preserved.Add(new JsonObject { ["name"] = name, ["version"] = current.Version, ["section"] = section });
                accepted.Add(item.DeepClone());
                if (category is "angular_ui_or_extension_package" or "third_party_runtime_package" or "third_party_build_or_test_tooling" or "business_or_unknown_package") thirdParty.Add(item.DeepClone());
                continue;
            }
            if (action != "upgrade")
            {
                rejected.Add(RejectedPackageSuggestion(item, "Only upgrade, preserve, and manual_review are allowed automatically."));
                preserved.Add(new JsonObject { ["name"] = name, ["version"] = current.Version, ["section"] = section });
                continue;
            }

            var originalTargetVersion = SuggestedTargetVersion(item);
            var targetVersion = NormalizedTargetVersion(originalTargetVersion, targetVersionByPackage.GetValueOrDefault(name), category, hop.ToVersion, acceptedVersionRecommendations.ContainsKey(name));
            if (targetVersion is null)
            {
                rejected.Add(RejectedPackageSuggestion(item, InvalidTargetVersionReason(name, originalTargetVersion, targetVersion, "NormalizeTargetVersion")));
                preserved.Add(new JsonObject { ["name"] = name, ["version"] = current.Version, ["section"] = section });
                continue;
            }
            if (data[section] is JsonObject deps && deps.ContainsKey(name))
            {
                var source = acceptedCriticalAlignments.ContainsKey(name) ? "ai-critical-dependency-alignment" : acceptedVersionRecommendations.ContainsKey(name) ? "ai-package-version-recommendation" : "classification-or-fallback";
                var confidence = acceptedCriticalAlignments.TryGetValue(name, out var criticalConfidence) ? DoubleValue(criticalConfidence, "confidence", 0) : acceptedVersionRecommendations.TryGetValue(name, out var versionConfidence) ? DoubleValue(versionConfidence, "confidence", 0) : DoubleValue(item, "confidence", 0);
                pendingUpdates.Add(new PendingPackageUpdate(name, section, current.Version, originalTargetVersion, targetVersion, category, item.StringValue("reason"), source, confidence));
            }
            accepted.Add(item.DeepClone());
            if (category is "angular_ui_or_extension_package" or "third_party_runtime_package" or "third_party_build_or_test_tooling") thirdParty.Add(item.DeepClone());
        }

        var acceptedCriticalNames = acceptedCriticalAlignments.Keys.ToHashSet(StringComparer.OrdinalIgnoreCase);
        foreach (var item in versionRecommendations["manualReview"]?.AsArray()?.OfType<JsonObject>() ?? [])
        {
            var itemName = item.StringValue("name");
            if (!acceptedCriticalNames.Contains(itemName) && !manual.OfType<JsonObject>().Any(m => m.StringValue("name").Equals(itemName, StringComparison.OrdinalIgnoreCase)))
            {
                manual.Add(item.DeepClone());
            }
        }
        foreach (var item in criticalAlignment["manualReview"]?.AsArray()?.OfType<JsonObject>() ?? [])
        {
            var itemName = item.StringValue("name");
            if (!acceptedCriticalNames.Contains(itemName) && !manual.OfType<JsonObject>().Any(m => m.StringValue("name").Equals(itemName, StringComparison.OrdinalIgnoreCase)))
            {
                manual.Add(item.DeepClone());
            }
        }
        foreach (var item in acceptedCriticalAlignments.Values.Where(r => r.StringValue("action") == "add"))
        {
            var name = item.StringValue("packageName");
            var section = item.StringValue("dependencySection");
            if (data[section] is JsonObject deps && !deps.ContainsKey(name))
            {
                pendingUpdates.Add(new PendingPackageUpdate(name, section, "", item.StringValue("recommendedVersion"), item.StringValue("recommendedVersion"), DefaultPackageCategory(name), item.StringValue("reason"), "ai-critical-dependency-alignment", DoubleValue(item, "confidence", 0)));
            }
        }

        var validation = await ValidateAndResolvePackageTargetsAsync(pendingUpdates, hop, data, config, projectPath, logPath, cancellationToken);
        if (validation.IntValue("upfrontNpmViewSkippedCount") > 0)
        {
            progress?.Stage(stage, $"[Package Resolution] install-first mode enabled; skipping upfront npm view verification for {validation.IntValue("upfrontNpmViewSkippedCount")} AI-recommended packages.");
            progress?.Stage(stage, "[Package Resolution] npm install will validate selected versions.");
            progress?.Stage(stage, "[Package Resolution] npm view will be used only if install reports E404/ETARGET.");
        }
        if (validation["invalid"] is JsonArray invalid && invalid.Count > 0)
        {
            return new JsonObject
            {
                ["success"] = false,
                ["packageCategorisationCompleted"] = classification["packages"] is JsonArray,
                ["aiPackageCategorisation"] = classification.DeepClone(),
                ["packageUpgradesApplied"] = applied,
                ["packagesPreserved"] = preserved,
                ["packagesManualReview"] = manual,
                ["thirdPartyPackageDecisions"] = thirdParty,
                ["rejectedAiPackageSuggestions"] = rejected,
                ["packageTargetValidation"] = validation,
                ["aiPackageVersionRecommendations"] = versionRecommendations.DeepClone(),
                ["aiPackageVersionRecommendationsAccepted"] = versionRecommendations["accepted"]?.DeepClone() ?? new JsonArray(),
                ["aiPackageVersionRecommendationsRejected"] = FilterOutPackages(versionRecommendations["rejected"]?.AsArray(), acceptedCriticalNames),
                ["angularCriticalDependencyAlignment"] = criticalAlignment.DeepClone(),
                ["angularCriticalDependencyAlignmentAccepted"] = criticalAlignment["accepted"]?.DeepClone() ?? new JsonArray(),
                ["angularCriticalDependencyAlignmentRejected"] = FilterOutPackages(criticalAlignment["rejected"]?.AsArray(), acceptedCriticalNames),
                ["package"] = invalid.OfType<JsonObject>().FirstOrDefault()?.StringValue("packageName", "@angular/core") ?? "@angular/core",
                ["reason"] = $"Package target validation failed before package.json write: {invalid.OfType<JsonObject>().FirstOrDefault()?.StringValue("packageName", "unknown")}@{invalid.OfType<JsonObject>().FirstOrDefault()?.StringValue("requestedTarget", "unknown")}"
            };
        }

        foreach (var resolved in validation["resolved"]?.AsArray()?.OfType<JsonObject>() ?? [])
        {
            var name = resolved.StringValue("packageName");
            var section = resolved.StringValue("section");
            if (data[section] is not JsonObject deps) continue;
            deps[name] = resolved.StringValue("finalAcceptedVersion");
            applied.Add(new JsonObject
            {
                ["name"] = name,
                ["fromVersion"] = resolved.StringValue("fromVersion"),
                ["toVersion"] = resolved.StringValue("finalAcceptedVersion"),
                ["originalSuggestedVersion"] = resolved.StringValue("originalSuggestedVersion"),
                ["finalAcceptedVersion"] = resolved.StringValue("finalAcceptedVersion"),
                ["packageJsonUpdated"] = true,
                ["section"] = section,
                ["category"] = resolved.StringValue("category"),
                ["role"] = resolved.StringValue("role"),
                ["reason"] = resolved.StringValue("reason"),
                ["versionRecommendationSource"] = resolved.StringValue("source"),
                ["npmValidationResult"] = resolved.StringValue("npmValidationResult"),
                ["npmFallbackReason"] = resolved.StringValue("npmFallbackReason"),
                ["npmRequestedTarget"] = resolved.StringValue("requestedTarget")
            });
        }

        File.WriteAllText(path, data.ToJsonString(JsonHelpers.SerializerOptions) + Environment.NewLine);
        return new JsonObject
        {
            ["success"] = true,
            ["packageCategorisationCompleted"] = classification["packages"] is JsonArray,
            ["aiPackageCategorisation"] = classification.DeepClone(),
            ["packageUpgradesApplied"] = applied,
            ["packagesPreserved"] = preserved,
            ["packagesManualReview"] = manual,
            ["thirdPartyPackageDecisions"] = thirdParty,
            ["rejectedAiPackageSuggestions"] = rejected,
            ["packageTargetValidation"] = validation,
            ["aiPackageVersionRecommendations"] = versionRecommendations.DeepClone(),
            ["aiPackageVersionRecommendationsAccepted"] = versionRecommendations["accepted"]?.DeepClone() ?? new JsonArray(),
            ["aiPackageVersionRecommendationsRejected"] = FilterOutPackages(versionRecommendations["rejected"]?.AsArray(), acceptedCriticalNames),
            ["angularCriticalDependencyAlignment"] = criticalAlignment.DeepClone(),
            ["angularCriticalDependencyAlignmentAccepted"] = criticalAlignment["accepted"]?.DeepClone() ?? new JsonArray(),
            ["angularCriticalDependencyAlignmentRejected"] = FilterOutPackages(criticalAlignment["rejected"]?.AsArray(), acceptedCriticalNames),
            ["package"] = "@angular/core",
            ["reason"] = ""
        };
    }

    private async Task<JsonObject> GetAngularPackageVersionRecommendationsAsync(JsonObject packageJson, JsonObject classification, IReadOnlyDictionary<string, string> defaultTargets, MigrationHop hop, MigrationConfig config, IProgressReporter? progress, string stage, CancellationToken cancellationToken)
    {
        if (!config.Ai.UseAi || ai is null || promptLoader is null)
        {
            return new JsonObject { ["attempted"] = false, ["fallbackUsed"] = true, ["accepted"] = new JsonArray(), ["rejected"] = new JsonArray(), ["manualReview"] = new JsonArray(), ["warnings"] = new JsonArray("AI package version recommendation skipped.") };
        }

        var packages = classification["packages"]?.AsArray()?.OfType<JsonObject>().ToArray() ?? [];
        progress?.Stage(stage, $"Requesting AI package version recommendations for {packages.Length} Angular migration packages...");
        var planner = versionRecommendationPlanner ?? new AngularPackageVersionRecommendationPlanner(ai, promptLoader);
        var recommendations = await planner.RecommendAsync(config.Ai, hop, packageJson, packages, defaultTargets, cancellationToken: cancellationToken);
        foreach (var item in recommendations["accepted"]?.AsArray()?.OfType<JsonObject>() ?? [])
        {
            progress?.Stage(stage, $"Accepted AI package version recommendation: {item.StringValue("packageName")} -> {item.StringValue("recommendedVersion", item.StringValue("action"))}");
        }
        foreach (var item in recommendations["rejected"]?.AsArray()?.OfType<JsonObject>() ?? [])
        {
            progress?.Stage(stage, $"Rejected AI package version recommendation: {item.StringValue("packageName", "unknown")} ({item.StringValue("rejectionReason")})");
        }
        return recommendations;
    }

    private async Task<JsonObject> GetAngularCriticalDependencyAlignmentAsync(string projectPath, JsonObject packageJson, JsonObject classification, JsonObject packageVersionRecommendations, MigrationHop hop, MigrationConfig config, IProgressReporter? progress, string stage, JsonObject? installFailureContext = null, JsonObject? buildFailureContext = null, JsonObject? npmLsProblemContext = null, CancellationToken cancellationToken = default)
    {
        if (!config.Ai.UseAi || ai is null || promptLoader is null)
        {
            return new JsonObject { ["attempted"] = false, ["fallbackUsed"] = true, ["accepted"] = new JsonArray(), ["rejected"] = new JsonArray(), ["manualReview"] = KnownCriticalDependencyManualReviewItems(packageJson, hop.ToVersion), ["warnings"] = new JsonArray("AI critical dependency alignment skipped.") };
        }

        var criticalPackages = DependencyEntries(packageJson).Where(d => AngularCriticalDependencyAlignmentPlanner.IsFrameworkCritical(d.Name)).Select(d => d.Name).Distinct(StringComparer.OrdinalIgnoreCase).Order().ToArray();
        progress?.Stage(stage, $"AI critical dependency alignment attempted for {criticalPackages.Length} framework-critical packages: {string.Join(", ", criticalPackages)}");
        var planner = criticalDependencyAlignmentPlanner ?? new AngularCriticalDependencyAlignmentPlanner(ai, promptLoader);
        var alignment = await planner.RecommendAsync(config.Ai, hop, packageJson, classification, packageVersionRecommendations, installFailureContext, buildFailureContext, npmLsProblemContext, LocalAngularPackageMetadata(projectPath), cancellationToken);
        foreach (var item in alignment["accepted"]?.AsArray()?.OfType<JsonObject>() ?? [])
        {
            progress?.Stage(stage, $"Accepted Angular critical dependency alignment: {item.StringValue("packageName")} -> {item.StringValue("recommendedVersion", item.StringValue("action"))}");
        }
        foreach (var item in alignment["rejected"]?.AsArray()?.OfType<JsonObject>() ?? [])
        {
            progress?.Stage(stage, $"Rejected Angular critical dependency alignment: {item.StringValue("packageName", "unknown")} ({item.StringValue("rejectionReason")})");
        }
        if (alignment.BoolValue("fallbackUsed")) progress?.Stage(stage, "Angular critical dependency alignment fallback used.");
        return alignment;
    }

    private async Task<JsonObject> RemediateCriticalDependencyBuildFailureAsync(string projectPath, MigrationHop hop, MigrationConfig config, JsonObject packageUpdate, JsonObject validation, JsonArray commands, JsonObject cleanInstall, IProgressReporter? progress, string stage, string? logPath, CancellationToken cancellationToken)
    {
        progress?.Stage(stage, "Build failure indicates Angular compiler/build-tool dependency incompatibility; requesting critical dependency alignment.");
        var npmLs = await commandRunner.RunAsync(["npm", "ls", "typescript"], projectPath, timeoutSeconds: 60, idleTimeoutSeconds: 20, progress: progress, stage: stage, description: "npm ls typescript", logPath: logPath, cancellationToken: cancellationToken);
        commands.Add(CommandObject(["npm", "ls", "typescript"], npmLs));
        var packageJsonPath = Path.Combine(projectPath, "package.json");
        var data = ReadJson(packageJsonPath);
        var alignment = await GetAngularCriticalDependencyAlignmentAsync(projectPath, data, packageUpdate["aiPackageCategorisation"]?.AsObject() ?? new JsonObject(), packageUpdate["aiPackageVersionRecommendations"]?.AsObject() ?? new JsonObject(), hop, config, progress, stage,
            buildFailureContext: new JsonObject { ["failureText"] = validation.StringValue("output"), ["failureReason"] = validation.StringValue("buildVerificationFailureReason"), ["failureCategory"] = validation.StringValue("buildVerificationFailureCategory") },
            npmLsProblemContext: new JsonObject { ["command"] = "npm ls typescript", ["returncode"] = npmLs.ReturnCode, ["stdout"] = npmLs.Stdout, ["stderr"] = npmLs.Stderr },
            cancellationToken: cancellationToken);

        var applied = ApplyCriticalDependencyAlignment(packageJsonPath, alignment);
        alignment["remediationApplied"] = applied.Count > 0;
        alignment["postFailureApplied"] = applied;
        if (applied.Count == 0) return alignment;

        var installDecision = DeterministicDecision("legacyPeerDepsInstall", "Reinstalling after Angular critical dependency alignment corrected a compiler/build-tool incompatibility.", "medium", true, true, "angularCriticalDependencyMismatch");
        var install = await RunInstallAttemptAsync(projectPath, LegacyPeerDepsNpmInstallCommand, installDecision, "angular-critical-dependency-alignment-remediation", true, true, 1, false, false, "", false, config, progress, stage, logPath, cancellationToken);
        commands.Add(InstallCommandObject(install));
        cleanInstall["installCommandUsed"] = string.Join(" ", install.Command);
        return alignment;
    }

    private static JsonArray ApplyCriticalDependencyAlignment(string packageJsonPath, JsonObject alignment)
    {
        var applied = new JsonArray();
        var data = ReadJson(packageJsonPath);
        foreach (var item in alignment["accepted"]?.AsArray()?.OfType<JsonObject>() ?? [])
        {
            var action = item.StringValue("action");
            if (action is not ("align" or "add")) continue;
            var section = item.StringValue("dependencySection");
            if (data[section] is not JsonObject deps) continue;
            var name = item.StringValue("packageName");
            var toVersion = item.StringValue("recommendedVersion");
            var fromVersion = deps.ContainsKey(name) ? deps[name]?.ToString() ?? "" : "";
            if (action == "align" && !deps.ContainsKey(name)) continue;
            if (fromVersion == toVersion) continue;
            deps[name] = toVersion;
            applied.Add(new JsonObject { ["name"] = name, ["fromVersion"] = fromVersion, ["toVersion"] = toVersion, ["section"] = section, ["reason"] = item.StringValue("reason"), ["status"] = "accepted" });
        }
        if (applied.Count > 0) File.WriteAllText(packageJsonPath, data.ToJsonString(JsonHelpers.SerializerOptions) + Environment.NewLine);
        return applied;
    }

    private async Task<JsonObject> GetAngularAiPackageClassificationAsync(JsonObject packageJson, IReadOnlyList<(string Name, string Version, string Section)> entries, MigrationHop hop, IReadOnlyDictionary<string, string> defaultTargets, MigrationConfig config, CancellationToken cancellationToken)
    {
        var payload = new JsonObject
        {
            ["targetAngularHop"] = $"{hop.FromVersion}->{hop.ToVersion}",
            ["dependencies"] = packageJson["dependencies"]?.DeepClone() ?? new JsonObject(),
            ["devDependencies"] = packageJson["devDependencies"]?.DeepClone() ?? new JsonObject(),
            ["defaultAngularCompatibleTargets"] = new JsonObject(defaultTargets.Select(kvp => KeyValuePair.Create<string, JsonNode?>(kvp.Key, JsonValue.Create(kvp.Value))))
        };
        if (config.Ai.UseAi && ai is not null)
        {
            try
            {
                var result = await ai.AskAsync(config.Ai, LoadPrompt("angular/angular-package-classification"), payload.ToJsonString(JsonHelpers.SerializerOptions), cancellationToken);
                if (result?["packages"] is JsonArray) return EnsureEveryPackageHasDecision(result, entries, defaultTargets, hop.ToVersion);
            }
            catch
            {
                // Invalid or unavailable AI classification falls back to conservative local classification.
            }
        }
        return BuildFallbackAngularPackageClassification(entries, defaultTargets, hop.ToVersion);
    }

    private static JsonObject EnsureEveryPackageHasDecision(JsonObject result, IReadOnlyList<(string Name, string Version, string Section)> entries, IReadOnlyDictionary<string, string> defaultTargets, int targetMajor)
    {
        var packages = result["packages"]!.AsArray();
        var seen = packages.OfType<JsonObject>().Select(p => $"{p.StringValue("section")}::{p.StringValue("name")}").ToHashSet(StringComparer.OrdinalIgnoreCase);
        foreach (var entry in entries)
        {
            if (seen.Contains($"{entry.Section}::{entry.Name}")) continue;
            packages.Add(FallbackPackageDecision(entry, defaultTargets, targetMajor));
        }
        result["notes"] ??= new JsonArray();
        return result;
    }

    private static JsonObject BuildFallbackAngularPackageClassification(IReadOnlyList<(string Name, string Version, string Section)> entries, IReadOnlyDictionary<string, string> defaultTargets, int targetMajor) => new()
    {
        ["packages"] = new JsonArray(entries.Select(e => (JsonNode?)FallbackPackageDecision(e, defaultTargets, targetMajor)).ToArray()),
        ["notes"] = new JsonArray("AI package categorisation unavailable; used conservative fallback.")
    };

    private static JsonObject FallbackPackageDecision((string Name, string Version, string Section) entry, IReadOnlyDictionary<string, string> defaultTargets, int targetMajor)
    {
        var category = DefaultPackageCategory(entry.Name);
        var target = defaultTargets.GetValueOrDefault(entry.Name);
        var upgrade = target is not null && category is ("angular_framework_package" or "angular_tooling_package" or "angular_runtime_support_package" or "typescript_runtime_or_compiler_package");
        return new JsonObject
        {
            ["name"] = entry.Name,
            ["currentVersion"] = entry.Version,
            ["section"] = entry.Section,
            ["category"] = category,
            ["targetVersion"] = upgrade ? target : null,
            ["action"] = upgrade ? "upgrade" : category == "business_or_unknown_package" ? "manual_review" : "preserve",
            ["reason"] = upgrade ? $"Package should align with Angular {targetMajor}." : "Preserved unless Angular compatibility requires a change.",
            ["confidence"] = upgrade ? 1.0 : 0.85,
            ["risk"] = "low"
        };
    }

    private static Dictionary<string, string> DefaultAngularTargetVersions(IReadOnlyList<(string Name, string Version, string Section)> entries, int targetMajor, string targetAngularVersion)
    {
        var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var entry in entries)
        {
            var category = DefaultPackageCategory(entry.Name);
            if (category is "angular_framework_package" or "angular_tooling_package") result[entry.Name] = $"^{targetAngularVersion}";
            if (category == "typescript_runtime_or_compiler_package" && entry.Name == "typescript") result[entry.Name] = TypeScriptVersionForAngular(targetMajor);
            if (entry.Name == "rxjs" && targetMajor >= 15 && VersionTuple(entry.Version) is { } rx && rx[0] < 7) result[entry.Name] = "~7.5.0";
            if (entry.Name == "zone.js" && targetMajor >= 16 && VersionTuple(entry.Version) is { } zone && zone[0] == 0 && zone.Length > 1 && zone[1] < 13) result[entry.Name] = "~0.13.0";
        }
        return result;
    }

    private static (bool Accepted, string Reason) ValidateAngularPackageDecision(JsonObject item, IReadOnlyList<(string Name, string Version, string Section)> entries, IReadOnlyDictionary<string, string> defaultTargets, int targetMajor)
    {
        var name = item.StringValue("name");
        var section = item.StringValue("section");
        var category = item.StringValue("category");
        var action = item.StringValue("action");
        var risk = item.StringValue("risk", "medium");
        var target = SuggestedTargetVersion(item);
        if (!entries.Any(e => e.Name.Equals(name, StringComparison.OrdinalIgnoreCase) && e.Section == section)) return (false, "Package is not a direct dependency in the declared section.");
        if (!AngularAiPackageCategories.Contains(category)) return (false, "Package category is not allowlisted.");
        if (!AngularAiPackageActions.Contains(action)) return (false, "Package action is not allowlisted.");
        var criticalAlignmentTarget = action == "upgrade" && AngularCriticalDependencyPolicy.IsSafeCriticalAlignment(name, string.IsNullOrWhiteSpace(target) ? defaultTargets.GetValueOrDefault(name) ?? "" : target, targetMajor);
        if (risk == "high" && !criticalAlignmentTarget) return (false, "High-risk package suggestion rejected.");
        if (DoubleValue(item, "confidence", 0) < MinimumAiPackageConfidence && !(IsThirdPartyAngularPackageCategory(category) && action == "preserve")) return (false, "Package suggestion confidence is below the high-confidence threshold.");
        if (action == "remove") return (false, "Package removals are not automatic in Angular hop migration.");
        if (target.Contains("||") || target.Contains(" or ", StringComparison.OrdinalIgnoreCase) || target.Contains(",")) return (false, "Multiple target versions were suggested; one stable compatible version is required.");
        if (action == "upgrade" && !string.IsNullOrWhiteSpace(target) && !NpmVersionRange.IsSafe(target)) return (false, InvalidTargetVersionReason(name, target, null, "ValidatePackageDecision"));
        if (action == "upgrade" && string.IsNullOrWhiteSpace(target) && !defaultTargets.ContainsKey(name)) return (false, "Upgrade action requires one target version.");
        if (category is "third_party_runtime_package" or "third_party_build_or_test_tooling" or "business_or_unknown_package" && action == "upgrade" && !defaultTargets.ContainsKey(name)) return (false, "Third-party upgrades are accepted only when Angular compatibility requires them.");
        return (true, "");
    }

    private static JsonObject RejectedPackageSuggestion(JsonObject item, string reason)
    {
        var clone = item.DeepClone().AsObject();
        clone["rejectionReason"] = reason;
        return clone;
    }

    private static JsonArray FilterOutPackages(JsonArray? items, IReadOnlySet<string> packageNames)
    {
        if (items is null || packageNames.Count == 0) return items?.DeepClone().AsArray() ?? new JsonArray();
        return new JsonArray(items
            .OfType<JsonObject>()
            .Where(item => !packageNames.Contains(item.StringValue("packageName", item.StringValue("name"))))
            .Select(item => (JsonNode?)item.DeepClone())
            .ToArray());
    }

    private static bool IsThirdPartyAngularPackageCategory(string category) =>
        category is "angular_ui_or_extension_package" or "third_party_runtime_package" or "third_party_build_or_test_tooling" or "business_or_unknown_package";

    private static string? NormalizedTargetVersion(string aiTarget, string? defaultTarget, string category, int targetMajor, bool fromAcceptedVersionRecommendation = false)
    {
        var value = NpmVersionRange.Normalize(string.IsNullOrWhiteSpace(aiTarget) || aiTarget == "null" ? defaultTarget : aiTarget);
        if (string.IsNullOrWhiteSpace(value) || !NpmVersionRange.IsSafe(value)) return null;
        if (category is "angular_framework_package" or "angular_tooling_package" && NpmVersionRange.Major(value) != targetMajor) return fromAcceptedVersionRecommendation ? null : NpmVersionRange.Normalize(defaultTarget);
        if (category == "typescript_runtime_or_compiler_package" && !IsTypeScriptCompatibleWithAngular(value, targetMajor)) return NpmVersionRange.Normalize(defaultTarget);
        return value;
    }

    private async Task<JsonObject> ValidateAndResolvePackageTargetsAsync(IReadOnlyList<PendingPackageUpdate> updates, MigrationHop hop, JsonObject packageJson, MigrationConfig config, string projectPath, string? logPath, CancellationToken cancellationToken)
    {
        var resolved = new JsonArray();
        var invalid = new JsonArray();
        var mode = NormalizePackageVersionVerificationMode(config.PackageVersionVerificationMode);
        var upfrontSkipped = 0;
        foreach (var update in updates)
        {
            var role = AngularPackageRole(update.Name, update.Category);
            var shouldVerify = ShouldVerifyPackageTargetUpfront(update, role, hop.ToVersion, mode);
            if (!shouldVerify && string.IsNullOrWhiteSpace(update.NormalizedTargetVersion) || !NpmVersionRange.IsSafe(update.NormalizedTargetVersion))
            {
                shouldVerify = true;
            }

            var resolution = shouldVerify
                ? await ResolveNpmPackageTargetAsync(update.Name, hop.ToVersion, update.NormalizedTargetVersion, role, config, projectPath, logPath, cancellationToken)
                : SkippedInstallFirstResolution(update.NormalizedTargetVersion);
            if (mode == "install-first" && resolution.FinalTarget is null && resolution.ValidationResult is "timeout" or "inconclusive")
            {
                resolution = resolution with
                {
                    FinalTarget = update.NormalizedTargetVersion,
                    ValidationResult = "skipped_due_to_timeout",
                    FallbackReason = $"{resolution.FallbackReason} Proceeding because install-first mode uses npm install as the source of truth."
                };
            }
            if (!shouldVerify) upfrontSkipped++;
            JsonObject? alternative = null;
            if (resolution.ValidationResult == "E404" && update.Source == "ai-package-version-recommendation" && ai is not null && promptLoader is not null)
            {
                alternative = await RequestAiPackageVersionAlternativeAsync(update, hop, packageJson, resolution, config, cancellationToken);
                if (alternative is not null)
                {
                    var alternativeRange = alternative.StringValue("recommendedVersion");
                    var alternativeResolution = await ResolveNpmPackageTargetAsync(update.Name, hop.ToVersion, alternativeRange, role, config, projectPath, logPath, cancellationToken);
                    resolution = alternativeResolution with
                    {
                        AiReRecommendedVersion = alternativeRange,
                        AiReRecommendationReason = alternative.StringValue("reason"),
                        AiReRecommendationUsed = alternativeResolution.FinalTarget is not null,
                        InitialRecommendedVersion = update.NormalizedTargetVersion,
                        InitialVerificationResult = "E404"
                    };
                }
            }
            var item = new JsonObject
            {
                ["packageName"] = update.Name,
                ["fromVersion"] = update.FromVersion,
                ["section"] = update.Section,
                ["category"] = update.Category,
                ["role"] = role,
                ["requestedTarget"] = update.NormalizedTargetVersion,
                ["originalSuggestedVersion"] = string.IsNullOrWhiteSpace(update.OriginalSuggestedVersion) ? update.NormalizedTargetVersion : update.OriginalSuggestedVersion,
                ["source"] = update.Source,
                ["reason"] = update.Reason,
                ["aiConfidence"] = update.Confidence,
                ["verificationMode"] = mode,
                ["npmValidationResult"] = resolution.ValidationResult,
                ["npmFallbackReason"] = resolution.FallbackReason,
                ["npmVerificationCommand"] = resolution.VerificationCommand,
                ["npmVerificationResult"] = resolution.VerificationResult,
                ["npmVerificationError"] = resolution.NpmError,
                ["npmVerificationAttemptCount"] = resolution.AttemptCount,
                ["aiRecommendedVersion"] = resolution.InitialRecommendedVersion,
                ["aiReRecommendedVersion"] = resolution.AiReRecommendedVersion,
                ["aiReRecommendationReason"] = resolution.AiReRecommendationReason,
                ["aiReRecommendationUsed"] = resolution.AiReRecommendationUsed,
                ["initialNpmVerificationResult"] = resolution.InitialVerificationResult,
                ["finalResolvedVersion"] = resolution.FinalTarget,
                ["finalAcceptedVersion"] = resolution.FinalTarget,
                ["aiRecommendationOverriddenByNpm"] = resolution.FinalTarget is not null && !resolution.FinalTarget.Equals(update.NormalizedTargetVersion, StringComparison.OrdinalIgnoreCase),
                ["packageJsonUpdated"] = resolution.FinalTarget is not null
            };

            if (resolution.FinalTarget is null)
            {
                item["packageJsonUpdated"] = false;
                item["failureReason"] = resolution.ValidationResult is "timeout" or "inconclusive"
                    ? $"Npm verification was {resolution.ValidationResult} for {update.Name}@{update.NormalizedTargetVersion}; no broad version discovery was attempted."
                    : $"Could not verify a published npm version for {update.Name}@{update.NormalizedTargetVersion} in target major {hop.ToVersion}.";
                invalid.Add(item);
            }
            else
            {
                resolved.Add(item);
            }
        }

        return new JsonObject { ["resolved"] = resolved, ["invalid"] = invalid, ["verificationMode"] = mode, ["upfrontNpmViewSkippedCount"] = upfrontSkipped };
    }

    private async Task<JsonObject?> RequestAiPackageVersionAlternativeAsync(PendingPackageUpdate update, MigrationHop hop, JsonObject packageJson, NpmPackageTargetResolution resolution, MigrationConfig config, CancellationToken cancellationToken)
    {
        var planner = versionRecommendationPlanner ?? new AngularPackageVersionRecommendationPlanner(ai!, promptLoader!);
        return await planner.RecommendAlternativeAsync(config.Ai, hop, packageJson, new JsonObject
        {
            ["packageName"] = update.Name,
            ["currentVersion"] = update.FromVersion,
            ["recommendedVersion"] = update.NormalizedTargetVersion,
            ["action"] = "upgrade",
            ["confidence"] = 90,
            ["risk"] = "low",
            ["reason"] = update.Reason,
            ["installImpact"] = "required",
            ["buildImpact"] = "required",
            ["manualReviewRequired"] = false
        }, resolution.NpmError, cancellationToken);
    }

    private async Task<NpmPackageTargetResolution> ResolveNpmPackageTargetAsync(string packageName, int targetMajor, string proposedRange, string role, MigrationConfig config, string projectPath, string? logPath, CancellationToken cancellationToken)
    {
        var command = $"npm view {packageName}@{proposedRange} version --json";
        if (string.IsNullOrWhiteSpace(proposedRange) || !NpmVersionRange.IsSafe(proposedRange))
        {
            return new NpmPackageTargetResolution(null, "invalidRangeSyntax", "invalidRangeSyntax", command, "Requested target is not a safe bounded npm semver range.", "", 0, proposedRange, "", "", false, "");
        }

        var angularOwned = IsAngularOwnedPackageName(packageName);
        var expectedMajor = role == "support" || !angularOwned ? NpmVersionRange.Major(proposedRange) ?? targetMajor : targetMajor;
        var proposedResult = await NpmViewWithRetryAsync($"{packageName}@{proposedRange}", "version", "--json", Math.Max(0, config.NpmLookupRetries), config.NpmLookupTimeoutSeconds, config.NpmLookupIdleTimeoutSeconds, projectPath, logPath, cancellationToken);
        var proposedVersion = SelectLatestStableMajorVersion(proposedResult.Value, expectedMajor);
        if (!string.IsNullOrWhiteSpace(proposedVersion))
        {
            var resolvedProposedTarget = ShouldMaterializeResolvedRange(proposedRange)
                ? $"{RangePrefix(proposedRange)}{proposedVersion}"
                : proposedRange;
            return new NpmPackageTargetResolution(resolvedProposedTarget, "verified", "verified", command, "", "", proposedResult.AttemptCount, proposedRange, "", "", false, "");
        }

        if (role == "support" && proposedResult.Status == "verified")
        {
            return new NpmPackageTargetResolution(proposedRange, "verified", "verified", command, "", "", proposedResult.AttemptCount, proposedRange, "", "", false, "");
        }

        if (proposedResult.Status == "timeout")
        {
            return new NpmPackageTargetResolution(null, "timeout", "timeout", command, $"npm verification timed out for {packageName}@{proposedRange}; broad discovery was not attempted.", proposedResult.Error, proposedResult.AttemptCount, proposedRange, "", "", false, "");
        }

        if (proposedResult.Status == "inconclusive")
        {
            return new NpmPackageTargetResolution(null, "inconclusive", "inconclusive", command, $"npm verification was inconclusive for {packageName}@{proposedRange}; broad discovery was not attempted.", proposedResult.Error, proposedResult.AttemptCount, proposedRange, "", "", false, "");
        }

        if (proposedResult.Status == "notFound")
        {
            return new NpmPackageTargetResolution(null, "E404", "E404", command, $"Requested {packageName}@{proposedRange} was unavailable. npm returned E404. No package@{targetMajor} discovery was attempted.", proposedResult.Error, proposedResult.AttemptCount, proposedRange, "", "", false, "");
        }

        return new NpmPackageTargetResolution(null, "inconclusive", "inconclusive", command, $"npm verification returned no stable version for {packageName}@{proposedRange}; broad discovery was not attempted.", proposedResult.Error, proposedResult.AttemptCount, proposedRange, "", "", false, "");
    }

    private static string NormalizePackageVersionVerificationMode(string mode) =>
        mode is "strict-npm-view" or "install-first" or "off" ? mode : "install-first";

    private static NpmPackageTargetResolution SkippedInstallFirstResolution(string proposedRange) =>
        new(proposedRange, "skipped", "skipped", "", "Skipped upfront npm view verification because install-first mode is enabled; npm install will validate this range.", "", 0, proposedRange, "", "", false, "skipped");

    private static bool ShouldVerifyPackageTargetUpfront(PendingPackageUpdate update, string role, int targetMajor, string mode)
    {
        if (mode == "strict-npm-view") return true;
        if (mode == "off") return false;
        var confidence = NormalizeAiConfidence(update.Confidence);
        if (confidence > 0 && confidence < MinimumAiPackageConfidence) return true;
        if (update.Source != "ai-package-version-recommendation") return true;
        return IsSuspiciousAngularExactPatch(update.Name, update.NormalizedTargetVersion, role, targetMajor);
    }

    private static bool IsSuspiciousAngularExactPatch(string packageName, string range, string role, int targetMajor)
    {
        if (!IsAngularOwnedPackageName(packageName)) return false;
        var trimmed = range.Trim();
        if (trimmed.StartsWith('^') || trimmed.StartsWith('~')) return false;
        var version = VersionTuple(trimmed);
        return version is { Length: >= 3 } && version[0] == targetMajor && version[2] > 0 && role is "framework" or "tooling" or "component";
    }

    private static double NormalizeAiConfidence(double confidence) => confidence is > 1 ? confidence / 100 : confidence;

    private static string RangePrefix(string range) => range.TrimStart().StartsWith('~') ? "~" : range.TrimStart().StartsWith('^') ? "^" : "";

    private static string FallbackRangePrefix(string range, string role) => role == "component" ? "~" : RangePrefix(range);

    private static bool ShouldMaterializeResolvedRange(string range) =>
        range.TrimStart().StartsWith('~') && VersionTuple(range) is { Length: >= 3 };

    private static string AngularPackageRole(string name, string category)
    {
        if (AngularFrameworkPackages.Contains(name)) return "framework";
        if (AngularToolingPackages.Contains(name)) return "tooling";
        if (AngularComponentPackages.Contains(name)) return "component";
        if (category is "angular_runtime_support_package" or "typescript_runtime_or_compiler_package" || name is "typescript" or "rxjs" or "zone.js") return "support";
        if (category == "angular_tooling_package" && IsAngularOwnedPackageName(name)) return "tooling";
        if (category == "angular_ui_or_extension_package" && IsAngularOwnedPackageName(name)) return "component";
        if (category == "angular_framework_package" && IsAngularOwnedPackageName(name)) return "framework";
        return "third-party";
    }

    private static bool IsAngularOwnedPackageName(string name) => AngularCriticalDependencyPolicy.IsAngularOwnedPackage(name);

    private static string SuggestedTargetVersion(JsonObject item) =>
        item.StringValue("targetVersion", item.StringValue("toVersion", item.StringValue("recommendedVersion")));

    private static string InvalidTargetVersionReason(string name, string original, string? normalized, string stage) =>
        $"Upgrade target version was missing or invalid. Package: {name}; Original target version: {(string.IsNullOrWhiteSpace(original) ? "<empty>" : original)}; Normalized target version: {(string.IsNullOrWhiteSpace(normalized) ? "null" : normalized)}; Failure stage: {stage}; Reason: value is not a supported safe npm semver range.";

    private async Task<string?> ResolveAngularTargetVersionAsync(int target, string projectPath, string? logPath, CancellationToken cancellationToken)
    {
        var result = await NpmViewAsync($"@angular/core@{target}", "version", "--json", projectPath, logPath, cancellationToken);
        return SelectLatestStableMajorVersion(result, target);
    }

    private async Task<string?> ResolveAngularCliTargetVersionAsync(int target, string projectPath, string? logPath, IProgressReporter? progress, string stage, int timeout, CancellationToken cancellationToken)
    {
        var result = await NpmViewAsync($"@angular/cli@{target}", "version", "--json", projectPath, logPath, cancellationToken);
        return SelectLatestStableMajorVersion(result, target) ?? $"{target}.0.0";
    }

    private static bool TryReviseAngularRuntimeMismatch(string projectPath, int? targetMajor, InstallAttemptResult attempt, IProgressReporter? progress, string stage)
    {
        var conflict = attempt.PeerDependencyConflict;
        if (conflict is null || conflict.StringValue("classification") != "angularRuntimeMismatch" || conflict.StringValue("decision") != "revisePackagePlan") return false;
        var package = conflict.StringValue("conflictingPackage");
        var requiredRange = conflict.StringValue("requiredPeerRange");
        if (!AngularCoupledRuntimePackages.Contains(package) || string.IsNullOrWhiteSpace(requiredRange)) return false;

        var compatibleVersion = CompatibleRuntimeVersionFromPeerRange(package, requiredRange, targetMajor);
        if (string.IsNullOrWhiteSpace(compatibleVersion)) return false;

        var packageJsonPath = Path.Combine(projectPath, "package.json");
        var data = ReadJson(packageJsonPath);
        var updated = false;
        foreach (var section in new[] { "dependencies", "devDependencies", "optionalDependencies" })
        {
            if (data[section] is JsonObject deps && deps.ContainsKey(package))
            {
                deps[package] = compatibleVersion;
                updated = true;
            }
        }
        if (!updated) return false;

        File.WriteAllText(packageJsonPath, data.ToJsonString(JsonHelpers.SerializerOptions) + Environment.NewLine);
        var lockPath = Path.Combine(projectPath, "package-lock.json");
        if (File.Exists(lockPath)) File.Delete(lockPath);
        conflict["decision"] = "revisePackagePlan";
        conflict["revisedVersion"] = compatibleVersion;
        progress?.Stage(stage, $"Revised Angular runtime support package {package} to {compatibleVersion} after peer dependency conflict.");
        return true;
    }

    private async Task<JsonObject> ApplyAiStructuralConfigPlanAsync(string projectPath, MigrationHop hop, MigrationConfig config, IProgressReporter? progress, string stage, CancellationToken cancellationToken)
    {
        progress?.Stage(stage, config.Ai.UseAi ? "Planning safe Angular structural config updates with AI..." : "Skipping AI structural config planning.");
        var before = AngularAiConfigFiles.Where(f => File.Exists(Path.Combine(projectPath, f))).ToDictionary(f => f, f => File.ReadAllText(Path.Combine(projectPath, f)));
        var accepted = new JsonArray();
        var rejected = new JsonArray();
        var manual = new JsonArray();
        if (config.Ai.UseAi && ai is not null)
        {
            var payload = new JsonObject
            {
                ["targetAngularHop"] = $"{hop.FromVersion}->{hop.ToVersion}",
                ["files"] = new JsonObject(before.Select(kvp => KeyValuePair.Create<string, JsonNode?>(kvp.Key, JsonValue.Create(TrimForPrompt(kvp.Value, 20_000)))))
            };
            try
            {
                var plan = await ai.AskAsync(config.Ai, LoadPrompt("angular/angular-structural-config"), payload.ToJsonString(JsonHelpers.SerializerOptions), cancellationToken);
                foreach (var change in plan?["changes"]?.AsArray()?.OfType<JsonObject>() ?? [])
                {
                    var validation = ValidateAngularConfigSuggestion(projectPath, change);
                    if (!validation.Valid)
                    {
                        rejected.Add(RejectedConfigSuggestion(change, validation.Reason));
                        manual.Add(new JsonObject { ["filePath"] = change.StringValue("filePath"), ["reason"] = validation.Reason });
                        continue;
                    }
                    if (ApplySnippetPatch(projectPath, change))
                    {
                        accepted.Add(change.DeepClone());
                    }
                    else
                    {
                        rejected.Add(RejectedConfigSuggestion(change, "Patch before snippet was not found exactly once."));
                        manual.Add(new JsonObject { ["filePath"] = change.StringValue("filePath"), ["reason"] = "Patch requires manual review because the before snippet did not match." });
                    }
                }
                foreach (var recommendation in plan?["manualRecommendations"]?.AsArray() ?? []) manual.Add(recommendation?.DeepClone());
            }
            catch
            {
                rejected.Add(new JsonObject { ["reason"] = "AI config plan was unavailable or invalid." });
            }
        }

        var after = AngularAiConfigFiles.Where(f => File.Exists(Path.Combine(projectPath, f))).ToDictionary(f => f, f => File.ReadAllText(Path.Combine(projectPath, f)));
        return new JsonObject
        {
            ["changes"] = accepted,
            ["rejectedAiConfigSuggestions"] = rejected,
            ["manualAngularConfigRecommendations"] = manual,
            ["angularJsonChanged"] = before.GetValueOrDefault("angular.json") != after.GetValueOrDefault("angular.json"),
            ["tsconfigChanged"] = new[] { "tsconfig.json", "tsconfig.app.json", "tsconfig.spec.json" }.Any(f => before.GetValueOrDefault(f) != after.GetValueOrDefault(f))
        };
    }

    private static (bool Valid, string Reason) ValidateAngularConfigSuggestion(string projectPath, JsonObject change)
    {
        var file = NormalizeRelativePath(change.StringValue("filePath"));
        var type = change.StringValue("changeType");
        var risk = change.StringValue("risk", "medium");
        var patch = change["patch"]?.AsObject();
        var before = patch?.StringValue("before") ?? "";
        var after = patch?.StringValue("after") ?? "";
        if (!AngularAiConfigFiles.Contains(file)) return (false, "AI config plan may only touch Angular structural config files.");
        if (!AngularAiConfigChangeTypes.Contains(type)) return (false, "AI config change type is not allowlisted.");
        if (type == "manual_review") return (false, "Manual review suggestions are not applied automatically.");
        if (risk != "low") return (false, "Only low-risk config changes are applied automatically.");
        if (DoubleValue(change, "confidence", 0) < MinimumAiConfigConfidence) return (false, "Config suggestion confidence is below the high-confidence threshold.");
        if (string.IsNullOrWhiteSpace(before)) return (false, "Patch before snippet is required.");
        if (after.Contains("src/app", StringComparison.OrdinalIgnoreCase) || before.Contains("src/app", StringComparison.OrdinalIgnoreCase)) return (false, "AI config plan must not touch business source paths.");
        if (file == "package.json") return (false, "package.json config-plan changes are reported but not applied in the config phase.");
        if (!File.Exists(Path.Combine(projectPath, file))) return (false, "Target config file does not exist.");
        return (true, "");
    }

    private static bool ApplySnippetPatch(string projectPath, JsonObject change)
    {
        var file = NormalizeRelativePath(change.StringValue("filePath"));
        var path = Path.Combine(projectPath, file);
        var patch = change["patch"]!.AsObject();
        var before = patch.StringValue("before");
        var after = patch.StringValue("after");
        var text = File.ReadAllText(path);
        var first = text.IndexOf(before, StringComparison.Ordinal);
        if (first < 0 || text.IndexOf(before, first + before.Length, StringComparison.Ordinal) >= 0) return false;
        File.WriteAllText(path, text[..first] + after + text[(first + before.Length)..]);
        return true;
    }

    private static JsonObject RejectedConfigSuggestion(JsonObject change, string reason)
    {
        var clone = change.DeepClone().AsObject();
        clone["rejectionReason"] = reason;
        return clone;
    }

    private JsonObject CleanInstallInputs(string projectPath, string manager, IProgressReporter? progress, string stage)
    {
        var deleted = new JsonArray();
        var missing = new JsonArray();
        var locked = new JsonArray();
        var nodeModules = Path.Combine(projectPath, "node_modules");
        var nodeDeleted = false;
        var lockDeleted = false;
        if (Directory.Exists(nodeModules))
        {
            var delete = TryDeleteDirectoryRobustly(nodeModules);
            if (!delete.Deleted)
            {
                foreach (var path in delete.LockedPaths) locked.Add(path);
                return new JsonObject
                {
                    ["nodeModulesDeleted"] = false,
                    ["packageLockDeleted"] = false,
                    ["deleted"] = deleted,
                    ["missing"] = missing,
                    ["lockedPaths"] = locked,
                    ["manualActionRequired"] = true,
                    ["reason"] = delete.Error,
                    ["suggestedAction"] = "Close processes locking node_modules, delete it manually if necessary, then rerun the migration."
                };
            }
            nodeDeleted = true;
            deleted.Add("node_modules");
            progress?.Stage(stage, "Deleted node_modules before clean install.");
        }
        else
        {
            missing.Add("node_modules");
        }
        if (manager == "npm")
        {
            var packageLock = Path.Combine(projectPath, "package-lock.json");
            if (File.Exists(packageLock))
            {
                File.SetAttributes(packageLock, FileAttributes.Normal);
                File.Delete(packageLock);
                lockDeleted = true;
                deleted.Add("package-lock.json");
                progress?.Stage(stage, "Deleted package-lock.json before clean npm install.");
            }
            else
            {
                missing.Add("package-lock.json");
            }
        }
        return new JsonObject { ["nodeModulesDeleted"] = nodeDeleted, ["packageLockDeleted"] = lockDeleted, ["deleted"] = deleted, ["missing"] = missing, ["lockedPaths"] = locked, ["manualActionRequired"] = false };
    }

    private static (bool Deleted, string Error, IReadOnlyList<string> LockedPaths) TryDeleteDirectoryRobustly(string path)
    {
        var locked = new List<string>();
        for (var attempt = 1; attempt <= 3; attempt++)
        {
            try
            {
                ClearReadonlyAttributes(path);
                Directory.Delete(path, recursive: true);
                return (true, "", locked);
            }
            catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
            {
                locked = FindRemainingPaths(path).Take(25).ToList();
                if (attempt == 3) return (false, ex.Message, locked);
                Thread.Sleep(250 * attempt);
            }
        }
        return (!Directory.Exists(path), Directory.Exists(path) ? "Directory could not be deleted." : "", locked);
    }

    private static void ClearReadonlyAttributes(string path)
    {
        if (!Directory.Exists(path)) return;
        foreach (var file in Directory.EnumerateFiles(path, "*", SearchOption.AllDirectories))
        {
            try { File.SetAttributes(file, FileAttributes.Normal); } catch { }
        }
        foreach (var dir in Directory.EnumerateDirectories(path, "*", SearchOption.AllDirectories))
        {
            try { File.SetAttributes(dir, FileAttributes.Directory); } catch { }
        }
    }

    private static IEnumerable<string> FindRemainingPaths(string path)
    {
        if (!Directory.Exists(path)) return [];
        try { return Directory.EnumerateFileSystemEntries(path, "*", SearchOption.AllDirectories).Prepend(path).ToArray(); }
        catch { return [path]; }
    }

    private async Task<JsonObject> AnalyzePeerDependencyCompatibilityAsync(string projectPath, int target, MigrationConfig config, IProgressReporter? progress, string stage, string? logPath, CancellationToken cancellationToken)
    {
        var data = ReadJson(Path.Combine(projectPath, "package.json"));
        var direct = DependencyEntries(data).ToArray();
        var warnings = new JsonArray();
        var blockers = new JsonArray();
        var remediations = new JsonArray();
        var checkedItems = new JsonArray();

        var classifier = packageClassifier;
        if (classifier is not null)
        {
            var deps = direct.Where(d => d.Section == "dependencies").Select(d => new JsonObject { ["name"] = d.Name, ["version"] = d.Version, ["section"] = d.Section }).ToArray();
            var devDeps = direct.Where(d => d.Section != "dependencies").Select(d => new JsonObject { ["name"] = d.Name, ["version"] = d.Version, ["section"] = d.Section }).ToArray();
            var classification = await classifier.ClassifyPackagesAsync(config.Ai, "angular", MajorFromSpec(config.From.Version), target, deps, devDeps, new JsonObject(), cancellationToken: cancellationToken);
            var validated = classifier.ValidatePackageClassification(classification, direct.Select(d => d.Name).ToHashSet(StringComparer.OrdinalIgnoreCase), new ClassificationSafety(config.PreflightRemediationMode, config.AllowBusinessLogicChanges, config.DirectDependenciesOnlyPreflight, config.AvoidFullVersionScans));
            foreach (var warning in validated["warnings"]?.AsArray() ?? []) warnings.Add(warning?.DeepClone());
            foreach (var blocker in validated["blockers"]?.AsArray() ?? []) blockers.Add(blocker?.DeepClone());
            foreach (var upgrade in validated["suggestedUpgrades"]?.AsArray() ?? []) remediations.Add(upgrade?.DeepClone());
        }

        foreach (var dependency in direct)
        {
            var role = AngularDependencyRole(dependency.Name);
            checkedItems.Add(new JsonObject { ["package"] = dependency.Name, ["version"] = dependency.Version, ["role"] = role });
            if (dependency.Name.StartsWith("@angular/", StringComparison.OrdinalIgnoreCase) || dependency.Name == "@angular-devkit/build-angular")
            {
                remediations.Add(new JsonObject { ["package"] = dependency.Name, ["toVersion"] = $"^{target}.0.0", ["status"] = "planned", ["reason"] = "Angular-owned package aligns with the target hop." });
                continue;
            }
            if (dependency.Name == "typescript")
            {
                remediations.Add(new JsonObject { ["package"] = "typescript", ["toVersion"] = TypeScriptVersionForAngular(target), ["status"] = "planned", ["reason"] = "TypeScript is framework-critical for Angular." });
                continue;
            }
            if (dependency.Name == "rxjs" && VersionTuple(dependency.Version) is { } rx && rx[0] < 6)
            {
                blockers.Add(new JsonObject { ["package"] = dependency.Name, ["issueType"] = "strong-build-breaking-risk", ["severity"] = "blocker", ["reason"] = "RxJS versions below 6 are incompatible with supported Angular migration targets.", ["suggestedAction"] = "Upgrade RxJS before migration." });
                continue;
            }
            if (LooksAngularCoupledThirdParty(dependency.Name))
            {
                warnings.Add($"Package {dependency.Name} may declare Angular peer dependencies. Treating as advisory; install/build validation will decide whether remediation is required.");
            }
        }

        var status = blockers.Count > 0 && config.PreflightRemediationMode == "off" ? "blocked" : "passed";
        if (status == "passed" && blockers.Count > 0)
        {
            warnings.Add("Strong preflight blockers were recorded, but preflight is advisory in the current remediation mode.");
        }
        return new JsonObject { ["targetAngularMajor"] = target, ["status"] = status, ["checked"] = checkedItems, ["blockers"] = status == "blocked" ? blockers : new JsonArray(), ["warnings"] = warnings, ["remediations"] = remediations };
    }

    private async Task<JsonNode?> NpmViewAsync(string package, string field, string range, string projectPath, string? logPath, CancellationToken cancellationToken)
    {
        var result = await NpmViewOnceAsync(package, field, range, 300, 60, projectPath, logPath, cancellationToken);
        return result.Value?.DeepClone();
    }

    private async Task<NpmViewResult> NpmViewWithRetryAsync(string package, string field, string range, int retries, int timeoutSeconds, int idleTimeoutSeconds, string projectPath, string? logPath, CancellationToken cancellationToken)
    {
        var attempts = 0;
        NpmViewResult result;
        do
        {
            attempts++;
            result = await NpmViewOnceAsync(package, field, range, timeoutSeconds, idleTimeoutSeconds, projectPath, logPath, cancellationToken);
        }
        while (result.Status == "timeout" && attempts <= retries);

        return result with { AttemptCount = attempts };
    }

    private async Task<NpmViewResult> NpmViewOnceAsync(string package, string field, string range, int timeoutSeconds, int idleTimeoutSeconds, string projectPath, string? logPath, CancellationToken cancellationToken)
    {
        var key = (package, field, range);
        if (_npmViewCache.TryGetValue(key, out var cached))
        {
            return new NpmViewResult(
                cached["value"]?.DeepClone(),
                cached.StringValue("status", cached["value"] is null ? "inconclusive" : "verified"),
                cached.StringValue("error"),
                cached.IntValue("attemptCount", 1));
        }

        var result = await commandRunner.RunAsync(["npm", "view", package, field, range], projectPath, timeoutSeconds: timeoutSeconds, idleTimeoutSeconds: idleTimeoutSeconds, logPath: logPath, cancellationToken: cancellationToken);
        JsonNode? parsed = null;
        var status = "inconclusive";
        var error = FirstNonEmptyLine(result.Stderr, result.Stdout, result.FailureReason ?? "");
        if (result.ReturnCode == 0)
        {
            try { parsed = JsonNode.Parse(result.Stdout); } catch { parsed = null; }
            status = parsed is null ? "inconclusive" : "verified";
        }
        else if (result.TimeoutKind is not null || result.FailureCategory == "timeout")
        {
            status = "timeout";
        }
        else if (IsNpmNotFound(result))
        {
            status = "notFound";
        }
        if (status != "timeout")
        {
            _npmViewCache[key] = new JsonObject { ["value"] = parsed, ["status"] = status, ["error"] = error, ["attemptCount"] = 1 };
        }
        return new NpmViewResult(parsed?.DeepClone(), status, error, 1);
    }

    private static bool IsNpmNotFound(CommandResult result)
    {
        var output = $"{result.Stdout}\n{result.Stderr}\n{result.FailureReason}".ToLowerInvariant();
        return output.Contains("e404") ||
               output.Contains("no match found for version") ||
               output.Contains("no matching version found") ||
               output.Contains("notarget") ||
               output.Contains("version not found");
    }

    private async Task<JsonObject> RunValidationsAsync(string projectPath, MigrationHop hop, int? timeoutSeconds, int? idleTimeoutSeconds, IProgressReporter? progress, string stage, string? logPath, bool remediationAvailable, CancellationToken cancellationToken)
    {
        var manifest = await ParseManifestAsync(projectPath, cancellationToken);
        var build = await RunBuildVerificationCommandAsync(projectPath, manifest, progress, stage, logPath, timeoutSeconds, idleTimeoutSeconds, cancellationToken);
        if (build.Passed)
        {
            progress?.Stage(stage, $"Build verification passed for Angular {hop.FromVersion} -> {hop.ToVersion}.");
        }
        else if (build.Executor == "unavailable")
        {
            progress?.Error(stage, "Build verification failed: no package.json build script and no local Angular CLI found.");
        }
        else
        {
            var nextAction = remediationAvailable ? "Attempting validation remediation." : "Validation remediation is not available for this build failure.";
            progress?.Error(stage, $"Build verification failed for Angular {hop.FromVersion} -> {hop.ToVersion}. {nextAction}");
        }

        var validation = new JsonObject
        {
            ["passed"] = build.Passed,
            ["output"] = build.Output,
            ["errors"] = build.Passed ? "" : build.FailureReason,
            ["skipped"] = new JsonArray(),
            ["buildVerificationAttempted"] = build.Attempted,
            ["buildVerificationCommand"] = build.CommandText,
            ["buildVerificationExecutor"] = build.Executor,
            ["buildVerificationPassed"] = build.Passed,
            ["buildVerificationSkipped"] = false,
            ["buildVerificationFailureReason"] = build.FailureReason,
            ["buildVerificationFailureCategory"] = build.FailureCategory,
            ["nextHopStartedOnlyAfterBuildVerificationPassed"] = build.Passed
        };
        validation["aiRemediationRootCauseAnalysis"] = BuildAngularValidationRootCauseAnalysis(projectPath, validation, hop);
        if (build.CommandResult is not null) validation["buildVerificationCommandResult"] = build.CommandResult.DeepClone();
        return validation;
    }

    private IReadOnlyList<JsonObject> ValidationCommands(JsonObject manifest)
    {
        var manager = manifest.StringValue("packageManager", "npm");
        var scripts = manifest["scripts"]?.AsObject() ?? new JsonObject();
        var commands = new List<JsonObject>();
        if (scripts.ContainsKey("test")) commands.Add(new JsonObject { ["description"] = "test validation", ["command"] = new JsonArray(ScriptCommand(manager, "test").Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()) });
        else commands.Add(new JsonObject { ["description"] = "test validation", ["skip"] = true, ["reason"] = "No test script found." });
        return commands;
    }

    private async Task<BuildVerificationResult> RunBuildVerificationCommandAsync(string projectPath, JsonObject manifest, IProgressReporter? progress, string? stage, string? logPath, int? timeoutSeconds, int? idleTimeoutSeconds, CancellationToken cancellationToken)
    {
        progress?.Stage(stage ?? "Validation", "Running build verification before next Angular hop.");
        var command = ResolveBuildVerificationCommand(projectPath, manifest);
        if (command is null)
        {
            const string unavailableReason = "Build verification could not run because no build script or local Angular CLI was available.";
            return new BuildVerificationResult(false, false, "", "unavailable", unavailableReason, "buildVerificationUnavailable", unavailableReason, null);
        }

        var commandText = string.Join(" ", command.Command);
        progress?.Stage(stage ?? "Validation", $"Build verification command: {commandText}");
        var result = await commandRunner.RunAsync(command.Command, projectPath, timeoutSeconds: timeoutSeconds, idleTimeoutSeconds: idleTimeoutSeconds, progress: progress, stage: stage, description: "build verification", logPath: logPath, cancellationToken: cancellationToken);
        var output = FormatCommandOutput(command.Command, result);
        if (result.ReturnCode == 0)
        {
            var passedCommand = CommandObject(command.Command, result);
            passedCommand["buildVerification"] = true;
            return new BuildVerificationResult(true, true, commandText, command.Executor, "", "", output, passedCommand);
        }

        var category = result.TimeoutKind is not null ? "buildTimeout" : "buildFailed";
        var reason = result.TimeoutKind is not null
            ? "Build verification timed out."
            : "Build verification command returned a non-zero exit code.";
        var failedCommand = CommandObject(command.Command, result);
        failedCommand["failureCategory"] = category;
        failedCommand["failureReason"] = reason;
        failedCommand["suggestedNextAction"] = result.TimeoutKind is not null
            ? "Increase the build timeout or inspect the migration log for a stalled build."
            : "Fix the build errors before continuing to the next Angular hop.";
        failedCommand["buildVerification"] = true;
        return new BuildVerificationResult(true, false, commandText, command.Executor, reason, category, output, failedCommand);
    }

    private static BuildVerificationCommand? ResolveBuildVerificationCommand(string projectPath, JsonObject manifest)
    {
        var scripts = manifest["scripts"]?.AsObject() ?? new JsonObject();
        if (scripts.ContainsKey("build")) return new BuildVerificationCommand(["npm", "run", "build"], "npm-script");

        var nodeModules = Path.Combine(projectPath, "node_modules");
        var cliPackage = Path.Combine(nodeModules, "@angular", "cli", "package.json");
        var ngRelative = OperatingSystem.IsWindows() ? Path.Combine("node_modules", ".bin", "ng.cmd") : "node_modules/.bin/ng";
        var ngExecutable = Path.Combine(projectPath, ngRelative);
        if (Directory.Exists(nodeModules) && File.Exists(cliPackage) && File.Exists(ngExecutable))
        {
            return new BuildVerificationCommand([ngRelative, "build"], "local-angular-cli");
        }

        return null;
    }

    private static IReadOnlyList<string> ScriptCommand(string manager, string script) => manager switch { "yarn" => ["yarn", script], "pnpm" => ["pnpm", "run", script], _ => ["npm", "run", script] };
    private sealed record BuildVerificationCommand(IReadOnlyList<string> Command, string Executor);
    private sealed record BuildVerificationResult(bool Attempted, bool Passed, string CommandText, string Executor, string FailureReason, string FailureCategory, string Output, JsonObject? CommandResult);
    private static JsonObject ReadJson(string path) => JsonNode.Parse(File.ReadAllText(path))?.AsObject() ?? new JsonObject();
    private static Dictionary<string, string> AllDependencies(JsonObject data) => new[] { "dependencies", "devDependencies", "optionalDependencies" }.SelectMany(s => data[s]?.AsObject() ?? []).ToDictionary(k => k.Key, v => v.Value?.ToString() ?? "", StringComparer.OrdinalIgnoreCase);
    private static int? MajorVersion(string? version) => Regex.Match(version ?? "", @"\d+") is { Success: true } m ? int.Parse(m.Value) : null;
    private static int? MajorFromSpec(string version) => Regex.Match(version, @"\d+") is { Success: true } m ? int.Parse(m.Value) : null;
    private static int[]? VersionTuple(string? version) => Regex.Match(version ?? "", @"(\d+)(?:\.(\d+))?(?:\.(\d+))?") is { Success: true } m ? m.Groups.Values.Skip(1).Where(g => g.Success).Select(g => int.Parse(g.Value)).ToArray() : null;
    private static int Compare(int[] left, int[] right) { for (var i = 0; i < Math.Max(left.Length, right.Length); i++) { var l = i < left.Length ? left[i] : 0; var r = i < right.Length ? right[i] : 0; if (l != r) return l.CompareTo(r); } return 0; }
    private static bool IsAngularPackageJsonUpdateCandidate(string name) => name.StartsWith("@angular/", StringComparison.OrdinalIgnoreCase) || name is "@angular-devkit/build-angular";
    private static string NormalizeRelativePath(string path) => path.Replace('\\', '/').TrimStart('/').Replace("../", "", StringComparison.Ordinal);
    private static string TypeScriptVersionForAngular(int targetMajor) => targetMajor switch { 13 => "~4.5.5", 14 => "~4.8.4", 15 => "~4.9.5", 16 => "~5.1.6", 17 => "~5.4.5", 18 => "~5.5.4", _ => "~5.5.4" };
    private static bool IsTypeScriptCompatibleWithAngular(string version, int targetMajor)
    {
        var tuple = VersionTuple(version);
        if (tuple is null) return false;
        return targetMajor switch
        {
            13 => Compare(tuple, [4, 4, 0]) >= 0 && Compare(tuple, [4, 6, 0]) < 0,
            14 => Compare(tuple, [4, 6, 0]) >= 0 && Compare(tuple, [4, 9, 0]) < 0,
            15 => Compare(tuple, [4, 8, 2]) >= 0 && Compare(tuple, [5, 0, 0]) < 0,
            16 => Compare(tuple, [4, 9, 3]) >= 0 && Compare(tuple, [5, 2, 0]) < 0,
            17 => Compare(tuple, [5, 2, 0]) >= 0 && Compare(tuple, [5, 5, 0]) < 0,
            18 => Compare(tuple, [5, 4, 0]) >= 0 && Compare(tuple, [5, 6, 0]) < 0,
            _ => true
        };
    }
    private static bool IsCriticalDependencyBuildFailure(JsonObject validation)
    {
        var text = $"{validation.StringValue("output")}\n{validation.StringValue("errors")}".ToLowerInvariant();
        return text.Contains("ts23.createnull is not a function") ||
               text.Contains("typescript") && text.Contains("invalid") ||
               text.Contains("compiler-cli") && text.Contains("typescript") ||
               text.Contains("angular compiler") && text.Contains("typescript");
    }

    private static ValidationResult ValidationResultFromAngularValidation(JsonObject validation, MigrationHop hop)
    {
        var command = validation.StringValue("buildVerificationCommand", "npm run build")
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        return new ValidationResult
        {
            Passed = validation.BoolValue("passed"),
            Output = validation.StringValue("output"),
            Errors = validation.StringValue("errors"),
            FailedHop = $"{hop.FromVersion} -> {hop.ToVersion}",
            FailureCommand = command.Length == 0 ? ["npm", "run", "build"] : command
        };
    }

    private static JsonObject ValidationFailureObject(JsonObject validation, MigrationHop hop, bool remediationAttempted, bool remediationApplied = false, bool remediationRejected = false, bool manualCorrectionRequired = false)
    {
        var output = validation.StringValue("output", validation.StringValue("errors"));
        return new JsonObject
        {
            ["command"] = validation.StringValue("buildVerificationCommand", "npm run build"),
            ["exitCode"] = ExtractExitCode(output),
            ["failureCategory"] = ClassifyValidationFailure(output, validation.StringValue("buildVerificationFailureCategory")),
            ["errorTail"] = Tail(output),
            ["migrationHop"] = $"{hop.FromVersion} -> {hop.ToVersion}",
            ["runtime"] = "angular",
            ["remediationAttempted"] = remediationAttempted,
            ["remediationApplied"] = remediationApplied,
            ["remediationRejected"] = remediationRejected,
            ["manualCorrectionRequired"] = manualCorrectionRequired,
            ["rootCauseAnalysis"] = validation["aiRemediationRootCauseAnalysis"]?.DeepClone()
        };
    }

    private static void MarkLatestValidationFailureRemediation(JsonArray validationFailures, bool attempted, bool applied, bool rejected)
    {
        var latest = validationFailures.OfType<JsonObject>().LastOrDefault();
        if (latest is null) return;
        latest["remediationAttempted"] = latest.BoolValue("remediationAttempted") || attempted;
        latest["remediationApplied"] = latest.BoolValue("remediationApplied") || applied;
        latest["remediationRejected"] = latest.BoolValue("remediationRejected") || rejected;
    }

    private static void MarkLatestValidationFailureManualCorrection(JsonArray validationFailures)
    {
        var latest = validationFailures.OfType<JsonObject>().LastOrDefault();
        if (latest is null) return;
        latest["manualCorrectionRequired"] = true;
    }

    private static string AiRemediationResultSummary(RemediationAttempt remediation)
    {
        var proposedFiles = remediation.ManualCorrection?["aiPlanDiagnostics"]?["proposedFiles"]?.AsArray()?.Select(f => f?.ToString()).Where(s => !string.IsNullOrWhiteSpace(s)).Distinct().ToArray() ?? [];
        var fileText = proposedFiles.Length == 0 ? "" : $" Proposed files: {string.Join(", ", proposedFiles)}.";
        var reason = remediation.ManualCorrection?.StringValue("reason");
        var reasonText = string.IsNullOrWhiteSpace(reason) ? "" : $" Reason: {reason}.";
        return $"AI validation remediation result: attempted={remediation.Attempted}; applied={remediation.Applied}; changes={remediation.Changes.Count}; manualCorrection={remediation.ManualCorrection is not null}.{reasonText}{fileText}";
    }

    private static bool RemediationRequiresNpmInstall(IEnumerable<JsonObject> changes) =>
        changes.Any(c =>
            string.Equals(Path.GetFileName(c.StringValue("file")), "package.json", StringComparison.OrdinalIgnoreCase) &&
            c.StringValue("type") is "package_update" or "package" or "dependency");

    private static JsonObject BuildAngularValidationRootCauseAnalysis(string projectPath, JsonObject validation, MigrationHop hop)
    {
        var output = validation.StringValue("output", validation.StringValue("errors"));
        var obsolete = new JsonArray();
        var incompatible = new JsonArray();
        var cascading = new JsonArray();
        if (string.IsNullOrWhiteSpace(output))
        {
            return RootCauseAnalysisObject(hop, obsolete, incompatible, cascading);
        }

        foreach (var file in ExtractProjectSourceFiles(output))
        {
            if (output.Contains("entryComponents", StringComparison.OrdinalIgnoreCase) &&
                (output.Contains(file.Replace('/', Path.DirectorySeparatorChar), StringComparison.OrdinalIgnoreCase) ||
                 output.Contains(file, StringComparison.OrdinalIgnoreCase)))
            {
                obsolete.Add(new JsonObject
                {
                    ["category"] = "obsolete Angular metadata",
                    ["sourceFile"] = file,
                    ["symbol"] = "entryComponents",
                    ["reason"] = "entryComponents is obsolete under Ivy and invalid in Angular 16 NgModule metadata.",
                    ["safeRemediation"] = "remove entryComponents metadata only"
                });
            }
        }

        foreach (var packageName in ExtractNodeModulePackages(output))
        {
            var kind = output.Contains("ModuleWithProviders", StringComparison.OrdinalIgnoreCase)
                ? "Angular-library-incompatible"
                : "third-party Angular library Ivy/partial-compilation incompatibility";
            incompatible.Add(new JsonObject
            {
                ["category"] = "incompatible Angular library package",
                ["package"] = packageName,
                ["targetAngularMajor"] = hop.ToVersion,
                ["sourceFiles"] = new JsonArray(ExtractNodeModuleFilesForPackage(output, packageName).Select(f => (JsonNode?)JsonValue.Create(f)).ToArray()),
                ["reason"] = kind,
                ["allowedRemediation"] = "package.json update or equivalent Angular module import wiring only",
                ["editNodeModules"] = false
            });
        }

        foreach (var local in ExtractLocalNg600xModules(output))
        {
            var moduleFile = ResolveLocalModuleFile(projectPath, local.Symbol, output);
            var hasNgModule = !string.IsNullOrWhiteSpace(moduleFile) && File.Exists(Path.Combine(projectPath, moduleFile)) && File.ReadAllText(Path.Combine(projectPath, moduleFile)).Contains("@NgModule", StringComparison.Ordinal);
            cascading.Add(new JsonObject
            {
                ["category"] = "cascading local module error",
                ["symbol"] = local.Symbol,
                ["sourceFile"] = moduleFile,
                ["ngModuleDecoratorPresent"] = hasNgModule,
                ["reason"] = hasNgModule && incompatible.Count > 0
                    ? "Local module has @NgModule; NG6002 is likely cascading from incompatible third-party Angular modules imported earlier."
                    : "Local module needs structural NgModule inspection.",
                ["correlatedThirdPartyPackages"] = new JsonArray(incompatible.OfType<JsonObject>().Select(i => (JsonNode?)JsonValue.Create(i.StringValue("package"))).DistinctBy(n => n?.ToString(), StringComparer.OrdinalIgnoreCase).ToArray())
            });
        }

        return RootCauseAnalysisObject(hop, obsolete, incompatible, cascading);
    }

    private static JsonObject RootCauseAnalysisObject(MigrationHop hop, JsonArray obsolete, JsonArray incompatible, JsonArray cascading) => new()
    {
        ["migrationHop"] = $"{hop.FromVersion} -> {hop.ToVersion}",
        ["obsoleteAngularMetadata"] = obsolete,
        ["incompatibleAngularLibraryPackages"] = incompatible,
        ["cascadingLocalModuleErrors"] = cascading,
        ["genericCompatibilityAdviceSuppressed"] = obsolete.Count > 0 || incompatible.Count > 0 || cascading.Count > 0
    };

    private static IReadOnlyList<string> ExtractProjectSourceFiles(string output) =>
        Regex.Matches(output, @"(?<file>(?:\.\/)?src[\\/][^\s:]+?\.ts)", RegexOptions.IgnoreCase)
            .Select(m => NormalizeRelativePath(m.Groups["file"].Value.TrimStart('.', '/', '\\')))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

    private static IReadOnlyList<string> ExtractNodeModulePackages(string output) =>
        Regex.Matches(output, @"node_modules[\\/](?<pkg>@[^\\/]+[\\/][^\\/]+|[^\\/:\s]+)", RegexOptions.IgnoreCase)
            .Select(m => m.Groups["pkg"].Value.Replace('\\', '/'))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

    private static IReadOnlyList<string> ExtractNodeModuleFilesForPackage(string output, string packageName) =>
        Regex.Matches(output, @"(?<file>node_modules[\\/][^\s:]+?\.(?:d\.ts|ts|mjs|js))", RegexOptions.IgnoreCase)
            .Select(m => NormalizeRelativePath(m.Groups["file"].Value))
            .Where(f => f.StartsWith($"node_modules/{packageName}/", StringComparison.OrdinalIgnoreCase))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

    private static IReadOnlyList<(string Symbol, string File)> ExtractLocalNg600xModules(string output)
    {
        var results = new List<(string Symbol, string File)>();
        foreach (var match in Regex.Matches(output, @"(?<symbol>\w+Module)\s+does not appear to be an NgModule class", RegexOptions.IgnoreCase).OfType<Match>())
        {
            var symbol = match.Groups["symbol"].Value;
            var prefix = output[..match.Index];
            var file = ExtractProjectSourceFiles(prefix).LastOrDefault() ?? "";
            if (!KnownThirdPartyModuleSymbol(symbol)) results.Add((symbol, file));
        }
        return results.Distinct().ToArray();
    }

    private static bool KnownThirdPartyModuleSymbol(string symbol) =>
        symbol is "SlickCarouselModule" or "PinchZoomModule" or "UserIdleModule";

    private static string ResolveLocalModuleFile(string projectPath, string symbol, string outputFile)
    {
        if (!string.IsNullOrWhiteSpace(outputFile) && File.Exists(Path.Combine(projectPath, outputFile))) return outputFile;
        var src = Path.Combine(projectPath, "src");
        if (!Directory.Exists(src)) return "";
        var expected = Regex.Replace(symbol, "Module$", "", RegexOptions.IgnoreCase);
        expected = Regex.Replace(expected, "([a-z0-9])([A-Z])", "$1-$2").ToLowerInvariant() + ".module.ts";
        return Directory.EnumerateFiles(src, "*.module.ts", SearchOption.AllDirectories)
            .Select(path => NormalizeRelativePath(Path.GetRelativePath(projectPath, path)))
            .FirstOrDefault(path => path.EndsWith(expected, StringComparison.OrdinalIgnoreCase) || File.ReadAllText(Path.Combine(projectPath, path)).Contains($"class {symbol}", StringComparison.Ordinal)) ?? "";
    }

    private static JsonObject ManualCorrectionObject(JsonObject validation, string reason) => new()
    {
        ["reason"] = reason,
        ["failedCommand"] = validation.StringValue("buildVerificationCommand", "npm run build"),
        ["lastError"] = Tail(validation.StringValue("output", validation.StringValue("errors"))),
        ["manualInstructions"] = new JsonArray(new JsonObject
        {
            ["file"] = "package.json",
            ["error"] = Tail(validation.StringValue("output", validation.StringValue("errors"))),
            ["possibleChange"] = "Review the failing validation output and apply the smallest package/config/script fix.",
            ["risk"] = "manual correction required",
            ["validationCommand"] = validation.StringValue("buildVerificationCommand", "npm run build")
        })
    };

    private static bool IsAiTimeoutFailure(JsonObject change) =>
        string.Equals(change.StringValue("failureCategory"), "ai_timeout", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(change.StringValue("type"), "ai_timeout", StringComparison.OrdinalIgnoreCase);

    private static bool IsAiEnvironmentError(JsonObject change) =>
        string.Equals(change.StringValue("failureCategory"), "environment_error", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(change.StringValue("type"), "ai_environment_error", StringComparison.OrdinalIgnoreCase);

    private static int? ExtractExitCode(string text) => Regex.Match(text, @"exit code:\s*(?<code>-?\d+)", RegexOptions.IgnoreCase) is { Success: true } m ? int.Parse(m.Groups["code"].Value) : null;
    private static string ClassifyValidationFailure(string text, string fallback)
    {
        if (AiRemediationPlanner.IsCodexSandboxValidationError(text)) return "environment_error";
        if (text.Contains("Unknown argument: prod", StringComparison.OrdinalIgnoreCase)) return "script";
        if (text.Contains("ERESOLVE", StringComparison.OrdinalIgnoreCase) || text.Contains("peer dependency", StringComparison.OrdinalIgnoreCase)) return "dependency";
        if (AiRemediationPlanner.IsCssDependencyImportFailure(text)) return "css_dependency_import";
        if (Regex.IsMatch(text, @"node_modules[\\/].*TS2304", RegexOptions.IgnoreCase)) return "type_declaration";
        if (Regex.IsMatch(text, @"\b(TS|CS|NG)\d+\b|compiler", RegexOptions.IgnoreCase)) return "compiler";
        return string.IsNullOrWhiteSpace(fallback) ? "unknown" : fallback;
    }

    private static string Tail(string text) => string.Join(" ", (text ?? "").Split(["\r\n", "\n"], StringSplitOptions.RemoveEmptyEntries).TakeLast(12)).Trim();

    private static string DefaultPackageCategory(string name)
    {
        if (name.StartsWith("@angular/", StringComparison.OrdinalIgnoreCase) && name is not "@angular/cli" and not "@angular/compiler-cli" and not "@angular/language-service") return "angular_framework_package";
        if (name is "@angular/cli" or "@angular-devkit/build-angular" or "@angular/compiler-cli" or "@angular/language-service" || name.StartsWith("@angular-eslint/", StringComparison.OrdinalIgnoreCase)) return "angular_tooling_package";
        if (name is "typescript" or "ts-node") return "typescript_runtime_or_compiler_package";
        if (AngularRuntimeSupportPackages.Contains(name)) return "angular_runtime_support_package";
        return "business_or_unknown_package";
    }
    private static JsonArray KnownCriticalDependencyManualReviewItems(JsonObject packageJson, int targetMajor)
    {
        var manual = new JsonArray();
        var deps = AllDependencies(packageJson);
        if (deps.TryGetValue("typescript", out var ts) && !IsTypeScriptCompatibleWithAngular(ts, targetMajor))
        {
            manual.Add(new JsonObject { ["name"] = "typescript", ["reason"] = $"TypeScript {ts} is incompatible with Angular {targetMajor}; align this framework-critical dependency before build.", ["risk"] = "high" });
        }
        return manual;
    }

    private static JsonObject LocalAngularPackageMetadata(string projectPath)
    {
        var metadata = new JsonObject();
        foreach (var package in new[] { "@angular/compiler-cli", "@angular-devkit/build-angular", "@ngtools/webpack", "@angular/cli", "@angular/core" })
        {
            var path = Path.Combine([projectPath, "node_modules", .. package.Split('/') , "package.json"]);
            if (!File.Exists(path)) continue;
            try
            {
                var data = ReadJson(path);
                metadata[package] = new JsonObject
                {
                    ["version"] = data.StringValue("version"),
                    ["peerDependencies"] = data["peerDependencies"]?.DeepClone() ?? new JsonObject(),
                    ["dependencies"] = data["dependencies"]?.DeepClone() ?? new JsonObject()
                };
            }
            catch
            {
                metadata[package] = new JsonObject { ["readError"] = true };
            }
        }
        return metadata;
    }
    private static string? SelectLatestStableMajorVersion(JsonNode? parsed, int target) { var versions = parsed is JsonArray arr ? arr.Select(x => x?.ToString() ?? "") : [parsed?.ToString() ?? ""]; return versions.Where(v => !v.Contains('-') && MajorVersion(v) == target).OrderBy(VersionTuple, Comparer<int[]?>.Create((a, b) => a is null ? -1 : b is null ? 1 : Compare(a, b))).LastOrDefault(); }
    private static Dictionary<string, string> StructuralFileContents(string projectPath) => StructuralFiles.Where(f => File.Exists(Path.Combine(projectPath, f))).ToDictionary(f => f, f => File.ReadAllText(Path.Combine(projectPath, f)));
    private static IReadOnlyList<string> ChangedStructuralFiles(string projectPath, Dictionary<string, string> before) { var after = StructuralFileContents(projectPath); return before.Keys.Concat(after.Keys).Distinct().Where(k => !before.TryGetValue(k, out var b) || !after.TryGetValue(k, out var a) || a != b).Order().ToArray(); }
    private static JsonObject HopObject(MigrationHop hop) => new() { ["type"] = hop.Type, ["fromVersion"] = hop.FromVersion, ["toVersion"] = hop.ToVersion, ["description"] = hop.Description };
    private async Task<IReadOnlyList<InstallAttemptResult>> RunInstallWithStrategyAsync(string projectPath, MigrationHop hop, JsonObject manifest, JsonObject preflight, MigrationConfig config, bool packageJsonChanged, IProgressReporter? progress, string stage, string? logPath, CancellationToken cancellationToken)
    {
        var attempts = new List<InstallAttemptResult>();
        InstallAttemptResult? last = null;
        var maxAttempts = Math.Max(1, config.MaxRetries + 1);
        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            var context = await BuildInstallStrategyContextAsync(projectPath, hop, manifest, preflight, config, packageJsonChanged, attempt, last, new JsonObject(), logPath, cancellationToken);
            var (decision, source, fallbackUsed, aiUsed, aiAccepted, rejectedReason, manualAction) = await DecideInstallStrategyAsync(context, config, last, cancellationToken);
            var command = BuildInstallCommand(decision, last?.Command);
            if (command.Count == 0)
            {
                var skipped = new InstallAttemptResult
                {
                    Decision = decision,
                    Command = command,
                    Result = new CommandResult { ReturnCode = 0, Stdout = "Dependency install skipped by validated install strategy." },
                    StrategySource = source,
                    FallbackUsed = fallbackUsed || attempt > 1,
                    RetryUsed = attempt > 1,
                    AiStrategyUsed = aiUsed,
                    AiStrategyAccepted = aiAccepted,
                    AiStrategyRejectedReason = rejectedReason,
                    ManualActionRequired = manualAction
                };
                attempts.Add(skipped);
                return attempts;
            }

            progress?.Stage(stage, $"Selected dependency install strategy: {decision.Mode} ({source}).");
            var result = await commandRunner.RunAsync(command, projectPath, timeoutSeconds: config.CommandTimeoutSeconds, progress: progress, stage: stage, description: string.Join(" ", command.Take(2)), logPath: logPath, heartbeatIntervalSeconds: 45, idleTimeoutSeconds: config.CommandIdleTimeoutSeconds, cancellationToken: cancellationToken);
            var classification = result.ReturnCode == 0 ? null : ClassifyInstallFailure(command, result);
            last = new InstallAttemptResult
            {
                Decision = decision,
                Command = command,
                Result = result,
                StrategySource = source,
                FallbackUsed = fallbackUsed || attempt > 1,
                RetryUsed = attempt > 1,
                RetryCount = attempt > 1 ? attempt - 1 : 0,
                LegacyPeerDepsUsed = command.Contains("--legacy-peer-deps"),
                AiStrategyUsed = aiUsed,
                AiStrategyAccepted = aiAccepted,
                AiStrategyRejectedReason = rejectedReason,
                ManualActionRequired = manualAction,
                FailureClassification = classification
            };
            attempts.Add(last);

            if (result.ReturnCode == 0 || attempt >= maxAttempts)
            {
                return attempts;
            }

            progress?.Stage(stage, $"Dependency install failed ({classification?.Category ?? "unknown"}). Retrying with a validated install strategy.");
        }

        return attempts;
    }

    private async Task<IReadOnlyList<InstallAttemptResult>> RunCleanInstallAsync(string projectPath, MigrationHop hop, JsonObject manifest, JsonObject preflight, MigrationConfig config, bool packageJsonChanged, JsonObject cleanInstall, IProgressReporter? progress, string stage, string? logPath, CancellationToken cancellationToken)
    {
        var manager = manifest.StringValue("packageManager", "npm");
        if (manager != "npm")
        {
            var deterministic = new InstallStrategyDecision { PackageManager = manager, Strategy = "normalInstall", Mode = "normalInstall", Command = string.Join(" ", InstallCommand(manager)), Reason = "Default clean install for detected package manager.", Confidence = 1, Risk = "low" };
            return [await RunInstallAttemptAsync(projectPath, InstallCommand(manager), deterministic, "deterministic-clean-install", false, false, 0, false, false, "", false, config, progress, stage, logPath, cancellationToken)];
        }

        if (!config.Ai.UseAi || ai is null)
        {
            return await RunDeterministicCleanInstallAsync(projectPath, manifest, config, progress, stage, logPath, cancellationToken);
        }

        var attempts = new List<InstallAttemptResult>();
        InstallAttemptResult? previous = null;
        var retryCounts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        while (true)
        {
            var attemptNumber = attempts.Count + 1;
            var context = await BuildInstallStrategyContextAsync(projectPath, hop, manifest, preflight, config, packageJsonChanged, attemptNumber, previous, cleanInstall, logPath, cancellationToken);
            var (decision, source, fallbackUsed, aiUsed, aiAccepted, rejectedReason, manualAction) = await DecideInstallStrategyAsync(context, config, previous, cancellationToken);
            var command = BuildInstallCommand(decision, previous?.Command);
            if (manualAction || command.Count == 0)
            {
                attempts.Add(new InstallAttemptResult
                {
                    Decision = decision,
                    Command = command,
                    Result = new CommandResult { ReturnCode = 1, Stderr = decision.Reason, FailureCategory = "manualReview", FailureReason = decision.Reason, SuggestedNextAction = decision.Reason },
                    StrategySource = source,
                    FallbackUsed = fallbackUsed,
                    RetryUsed = decision.Strategy == "retrySameCommand" || decision.IsRetry,
                    RetryCount = RetryCountFor(command, retryCounts),
                    AiStrategyUsed = aiUsed,
                    AiStrategyAccepted = aiAccepted,
                    AiStrategyRejectedReason = rejectedReason,
                    ManualActionRequired = true,
                    FailureClassification = new InstallFailureClassification(decision.FailureClassification == "none" ? "unknownFailure" : decision.FailureClassification, decision.Reason, "Manual review required before dependency install can continue.")
                });
                return attempts;
            }

            var commandText = string.Join(" ", command);
            var retryCount = IncrementRetryCountIfNeeded(commandText, retryCounts, decision.Strategy == "retrySameCommand" || decision.IsRetry);
            var installAttempt = await RunInstallAttemptAsync(projectPath, command, decision, source, fallbackUsed, decision.Strategy == "retrySameCommand" || decision.IsRetry || attemptNumber > 1, retryCount, aiUsed, aiAccepted, rejectedReason, false, config, progress, stage, logPath, cancellationToken);
            attempts.Add(installAttempt);
            previous = installAttempt;

            if (installAttempt.Result.ReturnCode == 0) return attempts;

            var classification = installAttempt.FailureClassification?.Category ?? "unknownFailure";
            if (classification == "packageVersionNotFound" && await TryRemediatePackageVersionNotFoundAsync(projectPath, hop, config, installAttempt, progress, stage, logPath, cancellationToken))
            {
                previous = null;
                continue;
            }
            if (classification == "peerDependencyConflict" && TryReviseAngularRuntimeMismatch(projectPath, hop.ToVersion, installAttempt, progress, stage))
            {
                previous = null;
                continue;
            }
            if (classification == "peerDependencyConflict" && installAttempt.LegacyPeerDepsUsed) return attempts;
            if (classification == "transientNetworkFailure" && retryCounts.GetValueOrDefault(commandText) >= 2) return attempts;
            if (attempts.Count >= 4) return attempts;
            progress?.Stage(stage, $"Dependency install failed ({classification}). Asking for next validated install strategy.");
        }
    }

    private async Task<bool> TryRemediatePackageVersionNotFoundAsync(string projectPath, MigrationHop hop, MigrationConfig config, InstallAttemptResult installAttempt, IProgressReporter? progress, string stage, string? logPath, CancellationToken cancellationToken)
    {
        if (ai is null || promptLoader is null || !config.Ai.UseAi) return false;
        if (!TryExtractPackageVersionNotFound(installAttempt.Result, out var packageName, out var requestedRange)) return false;

        var path = Path.Combine(projectPath, "package.json");
        if (!File.Exists(path)) return false;
        var packageJson = ReadJson(path);
        var section = DependencySection(packageJson, packageName);
        if (section is null) return false;

        progress?.Stage(stage, $"[Package Resolution] npm install reported {packageName}@{requestedRange} as unavailable; requesting a targeted AI replacement.");
        var update = new PendingPackageUpdate(packageName, section, packageJson[section]?[packageName]?.ToString() ?? "", requestedRange, requestedRange, DefaultPackageCategory(packageName), "npm install reported the selected version as unavailable.", "install-e404-remediation", 1.0);
        var resolution = new NpmPackageTargetResolution(null, "E404", "E404", $"npm install {packageName}@{requestedRange}", "npm install reported E404/ETARGET for this package.", installAttempt.Result.Stderr, 1, requestedRange, "", "", false, "E404");
        var alternative = await RequestAiPackageVersionAlternativeAsync(update, hop, packageJson, resolution, config, cancellationToken);
        var alternativeRange = alternative?.StringValue("recommendedVersion") ?? "";
        if (string.IsNullOrWhiteSpace(alternativeRange) || !NpmVersionRange.IsSafe(alternativeRange)) return false;

        var role = AngularPackageRole(packageName, DefaultPackageCategory(packageName));
        var verify = await ResolveNpmPackageTargetAsync(packageName, hop.ToVersion, alternativeRange, role, config, projectPath, logPath, cancellationToken);
        if (verify.ValidationResult == "E404" || verify.ValidationResult == "invalidRangeSyntax") return false;

        var finalRange = verify.FinalTarget ?? alternativeRange;
        if (packageJson[section] is not JsonObject deps) return false;
        deps[packageName] = finalRange;
        File.WriteAllText(path, packageJson.ToJsonString(JsonHelpers.SerializerOptions) + Environment.NewLine);
        progress?.Stage(stage, $"[Package Resolution] Patched {packageName} to {finalRange} after npm install version-not-found failure.");
        return true;
    }

    private static int RetryCountFor(IReadOnlyList<string> command, Dictionary<string, int> retryCounts) => command.Count == 0 ? 0 : retryCounts.GetValueOrDefault(string.Join(" ", command));

    private static int IncrementRetryCountIfNeeded(string command, Dictionary<string, int> retryCounts, bool isRetry)
    {
        if (!isRetry) return retryCounts.GetValueOrDefault(command);
        var next = retryCounts.GetValueOrDefault(command) + 1;
        retryCounts[command] = next;
        return next;
    }

    private async Task<IReadOnlyList<InstallAttemptResult>> RunDeterministicCleanInstallAsync(string projectPath, JsonObject manifest, MigrationConfig config, IProgressReporter? progress, string stage, string? logPath, CancellationToken cancellationToken)
    {
        var attempts = new List<InstallAttemptResult>();
        var normal = DeterministicDecision("normalInstall", "Default clean npm install after package/config updates.", "low", false, false, "none");
        var first = await RunInstallAttemptAsync(projectPath, NormalNpmInstallCommand, normal, "deterministic-clean-install", false, false, 0, false, false, "", false, config, progress, stage, logPath, cancellationToken);
        attempts.Add(first);
        if (first.Result.ReturnCode == 0 || first.FailureClassification?.Category != "peerDependencyConflict")
        {
            return attempts;
        }

        if (TryReviseAngularRuntimeMismatch(projectPath, null, first, progress, stage))
        {
            var retry = DeterministicDecision("normalInstall", "Re-running npm install after revising Angular runtime support package versions.", "low", true, false, "peerDependencyConflict");
            attempts.Add(await RunInstallAttemptAsync(projectPath, NormalNpmInstallCommand, retry, "deterministic-angular-runtime-plan-revision", false, true, 1, false, false, "", false, config, progress, stage, logPath, cancellationToken));
            return attempts;
        }

        if (!config.AllowLegacyPeerDepsFallback) return attempts;

        var legacy = DeterministicDecision("legacyPeerDepsInstall", "Retry clean npm install only because npm reported a peer dependency conflict.", "medium", true, true, "peerDependencyConflict");
        attempts.Add(await RunInstallAttemptAsync(projectPath, LegacyPeerDepsNpmInstallCommand, legacy, "deterministic-peer-conflict-fallback", true, true, 1, false, false, "", false, config, progress, stage, logPath, cancellationToken));
        return attempts;
    }

    private async Task<InstallAttemptResult> RunInstallAttemptAsync(string projectPath, IReadOnlyList<string> command, InstallStrategyDecision decision, string source, bool fallback, bool retry, int retryCount, bool aiUsed, bool aiAccepted, string rejectedReason, bool manualActionRequired, MigrationConfig config, IProgressReporter? progress, string stage, string? logPath, CancellationToken cancellationToken)
    {
        progress?.Stage(stage, $"Running dependency install: {string.Join(" ", command)}");
        var result = await commandRunner.RunAsync(command, projectPath, timeoutSeconds: config.CommandTimeoutSeconds, progress: progress, stage: stage, description: string.Join(" ", command.Take(2)), logPath: logPath, heartbeatIntervalSeconds: 45, idleTimeoutSeconds: config.CommandIdleTimeoutSeconds, cancellationToken: cancellationToken);
        return new InstallAttemptResult
        {
            Decision = decision,
            Command = command,
            Result = result,
            StrategySource = source,
            FallbackUsed = fallback,
            RetryUsed = retry,
            RetryCount = retryCount,
            LegacyPeerDepsUsed = command.Contains("--legacy-peer-deps"),
            AiStrategyUsed = aiUsed,
            AiStrategyAccepted = aiAccepted,
            AiStrategyRejectedReason = rejectedReason,
            ManualActionRequired = manualActionRequired,
            FailureClassification = result.ReturnCode == 0 ? null : ClassifyInstallFailure(command, result),
            PeerDependencyConflict = result.ReturnCode == 0 ? null : ParsePeerDependencyConflict(projectPath, result)
        };
    }

    private static void AddAngularAiHopDetails(JsonObject result, JsonObject packageUpdate, JsonObject configUpdate, JsonObject cleanInstall, IReadOnlyList<InstallAttemptResult> installAttempts, JsonObject validation)
    {
        result["packageCategorisationCompleted"] = packageUpdate.BoolValue("packageCategorisationCompleted");
        result["aiPackageCategorisation"] = packageUpdate["aiPackageCategorisation"]?.DeepClone() ?? new JsonObject();
        result["angularPackageUpgradePlan"] = packageUpdate["packageUpgradesApplied"]?.DeepClone() ?? new JsonArray();
        result["packageUpgradesApplied"] = packageUpdate["packageUpgradesApplied"]?.DeepClone() ?? new JsonArray();
        result["packagesPreserved"] = packageUpdate["packagesPreserved"]?.DeepClone() ?? new JsonArray();
        result["packagesManualReview"] = packageUpdate["packagesManualReview"]?.DeepClone() ?? new JsonArray();
        result["thirdPartyPackageDecisions"] = packageUpdate["thirdPartyPackageDecisions"]?.DeepClone() ?? new JsonArray();
        result["rejectedAiPackageSuggestions"] = packageUpdate["rejectedAiPackageSuggestions"]?.DeepClone() ?? new JsonArray();
        result["packageTargetValidation"] = packageUpdate["packageTargetValidation"]?.DeepClone() ?? new JsonObject();
        result["aiPackageVersionRecommendations"] = packageUpdate["aiPackageVersionRecommendations"]?.DeepClone() ?? new JsonObject();
        result["aiPackageVersionRecommendationsAccepted"] = packageUpdate["aiPackageVersionRecommendationsAccepted"]?.DeepClone() ?? new JsonArray();
        result["aiPackageVersionRecommendationsRejected"] = packageUpdate["aiPackageVersionRecommendationsRejected"]?.DeepClone() ?? new JsonArray();
        result["angularCriticalDependencyAlignment"] = packageUpdate["angularCriticalDependencyAlignment"]?.DeepClone() ?? new JsonObject();
        result["angularCriticalDependencyAlignmentAccepted"] = packageUpdate["angularCriticalDependencyAlignmentAccepted"]?.DeepClone() ?? new JsonArray();
        result["angularCriticalDependencyAlignmentRejected"] = packageUpdate["angularCriticalDependencyAlignmentRejected"]?.DeepClone() ?? new JsonArray();
        result["angularStructuralConfigChanges"] = configUpdate["changes"]?.DeepClone() ?? new JsonArray();
        result["rejectedAiConfigSuggestions"] = configUpdate["rejectedAiConfigSuggestions"]?.DeepClone() ?? new JsonArray();
        result["manualAngularConfigRecommendations"] = configUpdate["manualAngularConfigRecommendations"]?.DeepClone() ?? new JsonArray();
        result["angularJsonChanged"] = configUpdate.BoolValue("angularJsonChanged");
        result["tsconfigChanged"] = configUpdate.BoolValue("tsconfigChanged");
        result["cleanInstallSummary"] = cleanInstall.DeepClone();
        result["nodeModulesDeleted"] = cleanInstall.BoolValue("nodeModulesDeleted");
        result["packageLockDeleted"] = cleanInstall.BoolValue("packageLockDeleted");
        result["installCommandUsed"] = installAttempts.Count == 0 ? "" : string.Join(" ", installAttempts.Last().Command);
        result["installFallbackUsed"] = installAttempts.Any(a => a.LegacyPeerDepsUsed);
        result["aiInstallStrategyUsed"] = installAttempts.Any(a => a.AiStrategyUsed);
        result["aiInstallStrategyAccepted"] = installAttempts.Any(a => a.AiStrategyAccepted);
        result["aiInstallStrategyRejectedReason"] = installAttempts.LastOrDefault(a => !string.IsNullOrWhiteSpace(a.AiStrategyRejectedReason))?.AiStrategyRejectedReason ?? "";
        result["transientNetworkRetriesUsed"] = installAttempts.Count(a => a.FailureClassification?.Category == "transientNetworkFailure" || (a.RetryUsed && a.Decision.FailureClassification == "transientNetworkFailure"));
        result["peerDependencyFallbackUsed"] = installAttempts.Any(a => a.LegacyPeerDepsUsed);
        result["peerDependencyConflicts"] = new JsonArray(installAttempts.Select(a => a.PeerDependencyConflict).Where(c => c is not null).Select(c => c!.DeepClone()).ToArray());
        result["manualActionRequired"] = cleanInstall.BoolValue("manualActionRequired") || installAttempts.Any(a => a.ManualActionRequired);
        result["migrateOnlySkipped"] = true;
        result["migrateOnlySkippedReason"] = "disabled by new default flow";
        result["validationSummary"] = validation.DeepClone();
    }

    private async Task<CommandResult> RunAngularCommandAsync(IReadOnlyList<string> command, string projectPath, MigrationConfig config, IProgressReporter? progress, string stage, string? logPath, CancellationToken cancellationToken) =>
        await commandRunner.RunAsync(command, projectPath, timeoutSeconds: config.CommandTimeoutSeconds, progress: progress, stage: stage, description: CommandDescription(command), logPath: logPath, idleTimeoutSeconds: config.CommandIdleTimeoutSeconds, cancellationToken: cancellationToken);

    private async Task<(InstallStrategyDecision Decision, string Source, bool FallbackUsed, bool AiUsed, bool AiAccepted, string RejectedReason, bool ManualActionRequired)> DecideInstallStrategyAsync(JsonObject context, MigrationConfig config, InstallAttemptResult? previous, CancellationToken cancellationToken)
    {
        var previousFailure = previous?.FailureClassification;
        if (config.Ai.UseAi && ai is not null)
        {
            string rejectedReason = "";
            try
            {
                var recommended = await ai.AskAsync(config.Ai, LoadPrompt("angular/angular-install-strategy"), context.ToJsonString(JsonHelpers.SerializerOptions), cancellationToken);
                var parsed = ParseInstallStrategyDecision(recommended);
                if (parsed is not null)
                {
                    var validation = ValidateInstallDecision(parsed, context, config, previousFailure, previous?.Command);
                    if (validation.Valid)
                    {
                        return (parsed, "ai-install-strategy", parsed.IsFallback, true, true, "", parsed.Strategy is "manualReview" or "forceInstall");
                    }
                    rejectedReason = validation.Reason;
                }
                else
                {
                    rejectedReason = "AI install strategy response was missing or invalid.";
                }
            }
            catch (Exception ex)
            {
                rejectedReason = ex.Message;
                // Invalid or unavailable AI output intentionally falls through to deterministic strategy.
            }
            var fallback = DeterministicInstallDecision(context, config, previousFailure, previous?.Command);
            return (fallback, "deterministic-safety-fallback", true, true, false, rejectedReason, fallback.Strategy is "manualReview" or "forceInstall");
        }

        var deterministic = DeterministicInstallDecision(context, config, previousFailure, previous?.Command);
        return (deterministic, "deterministic-safety-fallback", true, false, false, "", deterministic.Strategy is "manualReview" or "forceInstall");
    }

    public static IReadOnlyList<string> BuildInstallCommand(InstallStrategyDecision decision, IReadOnlyList<string>? previousCommand = null)
    {
        if (decision.PackageManager != "npm") return [];
        var strategy = NormalizeInstallStrategy(decision);
        if (strategy == "manualReview" || strategy == "forceInstall") return previousCommand?.ToArray() ?? NormalNpmInstallCommand;
        if (strategy == "retrySameCommand" && previousCommand is not null) return previousCommand.ToArray();
        if (!string.IsNullOrWhiteSpace(decision.Command) && AllowedNpmInstallCommands.Contains(NormalizeCommandText(decision.Command))) return SplitCommand(decision.Command);
        return strategy == "legacyPeerDepsInstall" ? LegacyPeerDepsNpmInstallCommand : NormalNpmInstallCommand;
    }

    public static (bool Valid, string Reason) ValidateInstallDecision(InstallStrategyDecision decision, JsonObject context, MigrationConfig config, InstallFailureClassification? previousFailure = null, IReadOnlyList<string>? previousCommand = null)
    {
        var detectedManager = context.StringValue("packageManager", "npm");
        var peerConflict = previousFailure?.Category == "peerDependencyConflict" || HasPreflightPeerConcern(context);
        var transientNetwork = previousFailure?.Category == "transientNetworkFailure";
        var strategy = NormalizeInstallStrategy(decision);
        var command = BuildInstallCommand(decision, previousCommand);
        var commandText = string.Join(" ", command);

        if (decision.PackageManager != detectedManager) return (false, "Package manager does not match detected package manager.");
        if (decision.PackageManager != "npm") return (false, "Only npm install strategies are supported by the Angular adapter guardrails.");
        if (!AllowedInstallModes.Contains(strategy)) return (false, "Install strategy is not allowlisted.");
        if (decision.Risk.Equals("high", StringComparison.OrdinalIgnoreCase)) return (false, "High-risk install decisions are rejected.");
        if (decision.Confidence < MinimumInstallDecisionConfidence) return (false, "Install decision confidence is below threshold.");
        if (decision.Flags.Force || strategy == "forceInstall" || decision.Command.Contains("--force", StringComparison.OrdinalIgnoreCase)) return (false, "Force install is manual review only and is not executed automatically.");
        if (ContainsForbiddenInstallCommand(decision.Command)) return (false, "AI install strategy attempted a forbidden npm/ng command.");
        if (strategy == "manualReview" && context.BoolValue("packageJsonChanged") && previousFailure is null) return (false, "Manual review cannot block the first clean install after Angular package.json alignment.");
        if (strategy == "manualReview") return (true, "");
        if (command.Count == 0 || !AllowedNpmInstallCommands.Contains(commandText)) return (false, "Install command is not in the npm command allowlist.");
        if (strategy == "retrySameCommand" && previousCommand is null) return (false, "retrySameCommand requires a previous command.");
        if (strategy == "retrySameCommand" && !transientNetwork) return (false, "retrySameCommand is allowed only after transient network failures.");
        if (strategy == "retrySameCommand" && previousCommand is not null && !command.SequenceEqual(previousCommand)) return (false, "retrySameCommand must repeat the exact previous command.");
        if (transientNetwork && previousCommand is not null && !command.SequenceEqual(previousCommand)) return (false, "Transient network failures must not change install command or package versions.");
        if (strategy == "legacyPeerDepsInstall" && IsAngularRuntimeMismatchOutput(context.StringValue("previousInstallFailureOutput"))) return (false, "legacy-peer-deps must not hide a direct Angular runtime support package mismatch.");
        if (strategy == "legacyPeerDepsInstall" && !peerConflict && decision.Confidence < 0.9) return (false, "legacy-peer-deps requires a peer conflict or high-confidence Angular compatibility reasoning.");
        if (strategy == "legacyPeerDepsInstall" && !config.AllowLegacyPeerDepsFallback && !peerConflict) return (false, "legacy-peer-deps requires configuration allowance or a peer conflict.");
        return (true, "");
    }

    public static InstallFailureClassification ClassifyInstallFailure(IReadOnlyList<string> command, CommandResult result)
    {
        if (result.ReturnCode == 0) return new("none", "Install completed successfully.", "");
        var output = $"{result.Stdout}\n{result.Stderr}".ToLowerInvariant();
        if (result.TimeoutKind is not null) return new("transientNetworkFailure", result.FailureReason ?? "Install timed out.", "Retry the same install command if the registry/network is otherwise healthy.");
        if (IsPeerDependencyConflict(result)) return new("peerDependencyConflict", "npm reported a peer dependency conflict.", "Retry with a validated legacyPeerDeps strategy or remediate the conflicting package.");
        if (ContainsAny(output, "e401", "e403", "401 unauthorized", "403 forbidden", "authentication required", "npm login")) return new("registryAuthFailure", "npm registry authentication or authorization failed.", "Check npm auth, private registry, proxy, or npm login state.");
        if (ContainsAny(output, "etarget", "e404", "no matching version found", "notarget", "version not found")) return new("packageVersionNotFound", "npm could not resolve a package version.", "Ask AI to re-check the package upgrade plan for the failed package before retrying.");
        if (ContainsAny(output, "econnreset", "etimedout", "econnrefused", "enotfound", "socket hang up", "network timeout", "request failed", "failed while downloading tarball", "npm error network", "eai_again", "fetch failed")) return new("transientNetworkFailure", "npm reported a transient registry/network failure.", "Retry the exact same install command without changing package versions.");
        return new("unknownFailure", "npm install returned a non-zero exit code.", "Inspect stdout/stderr in the migration log.");
    }

    private static bool ContainsAny(string text, params string[] needles) => needles.Any(n => text.Contains(n, StringComparison.OrdinalIgnoreCase));

    private static JsonObject? ParsePeerDependencyConflict(string projectPath, CommandResult result)
    {
        if (!IsPeerDependencyConflict(result)) return null;
        var output = $"{result.Stdout}\n{result.Stderr}";
        var peer = Regex.Match(output, @"peer\s+(@?[\w./-]+)@""([^""]+)""\s+from\s+(@?[\w./-]+)@([^\s]+)", RegexOptions.IgnoreCase);
        if (!peer.Success) return new JsonObject { ["classification"] = "unknownPeerConflict", ["decision"] = "manualReview" };

        var package = peer.Groups[1].Value;
        var requiredRange = peer.Groups[2].Value;
        var requiredBy = peer.Groups[3].Value;
        var requiredByVersion = peer.Groups[4].Value.TrimEnd(',', ')');
        var data = File.Exists(Path.Combine(projectPath, "package.json")) ? ReadJson(Path.Combine(projectPath, "package.json")) : new JsonObject();
        var plannedVersion = AllDependencies(data).GetValueOrDefault(package, "");
        var installed = Regex.Match(output, $@"Found:\s+{Regex.Escape(package)}@([^\s]+)", RegexOptions.IgnoreCase);
        var currentInstalledVersion = installed.Success ? installed.Groups[1].Value.TrimEnd(',', ')') : "";
        var angularRuntimeMismatch = requiredBy.StartsWith("@angular/", StringComparison.OrdinalIgnoreCase) && AngularCoupledRuntimePackages.Contains(package);
        var classification = angularRuntimeMismatch ? "angularRuntimeMismatch" : LooksAngularCoupledThirdParty(requiredBy) || LooksAngularCoupledThirdParty(package) ? "thirdPartyPeerConflict" : "unknownPeerConflict";
        var decision = classification switch
        {
            "angularRuntimeMismatch" => "revisePackagePlan",
            "thirdPartyPeerConflict" => "legacyPeerDepsFallback",
            _ => "manualReview"
        };
        return new JsonObject
        {
            ["conflictingPackage"] = package,
            ["requiredPeerRange"] = requiredRange,
            ["plannedVersion"] = plannedVersion,
            ["installedVersion"] = currentInstalledVersion,
            ["requiredBy"] = $"{requiredBy}@{requiredByVersion}",
            ["requiredByPackage"] = requiredBy,
            ["requiredByVersion"] = requiredByVersion,
            ["classification"] = classification,
            ["decision"] = decision
        };
    }

    private static bool IsAngularRuntimeMismatchOutput(string output)
    {
        var peer = Regex.Match(output, @"peer\s+(@?[\w./-]+)@""([^""]+)""\s+from\s+(@?[\w./-]+)@([^\s]+)", RegexOptions.IgnoreCase);
        return peer.Success &&
               AngularCoupledRuntimePackages.Contains(peer.Groups[1].Value) &&
               peer.Groups[3].Value.StartsWith("@angular/", StringComparison.OrdinalIgnoreCase);
    }

    private static string? CompatibleRuntimeVersionFromPeerRange(string package, string requiredRange, int? targetMajor)
    {
        if (package == "typescript" && targetMajor is not null) return TypeScriptVersionForAngular(targetMajor.Value);
        var alternatives = requiredRange.Split("||", StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        var chosen = alternatives.LastOrDefault(v => !v.Contains('<') && !v.Contains('>')) ?? alternatives.LastOrDefault();
        if (string.IsNullOrWhiteSpace(chosen)) return null;
        var exact = Regex.Match(chosen, @"[~^]?\d+(?:\.\d+){0,2}");
        return exact.Success ? exact.Value : null;
    }

    private async Task<JsonObject> BuildInstallStrategyContextAsync(string projectPath, MigrationHop hop, JsonObject manifest, JsonObject preflight, MigrationConfig config, bool packageJsonChanged, int attempt, InstallAttemptResult? previous, JsonObject cleanInstall, string? logPath, CancellationToken cancellationToken)
    {
        var packageJson = ReadJson(Path.Combine(projectPath, "package.json"));
        var lockPath = Path.Combine(projectPath, "package-lock.json");
        return new JsonObject
        {
            ["currentAngularVersion"] = hop.FromVersion,
            ["targetAngularVersion"] = hop.ToVersion,
            ["packageManager"] = manifest.StringValue("packageManager", "npm"),
            ["dependencies"] = packageJson["dependencies"]?.DeepClone() ?? new JsonObject(),
            ["devDependencies"] = packageJson["devDependencies"]?.DeepClone() ?? new JsonObject(),
            ["lockfile"] = manifest.StringValue("lockfile", ""),
            ["hasPackageLock"] = File.Exists(lockPath),
            ["packageLockVersion"] = PackageLockVersion(lockPath),
            ["nodeModulesExists"] = Directory.Exists(Path.Combine(projectPath, "node_modules")),
            ["packageJsonChanged"] = packageJsonChanged,
            ["previousInstallFailureOutput"] = previous is null ? "" : TrimForPrompt($"{previous.Result.Stdout}\n{previous.Result.Stderr}", 12_000),
            ["previousAttemptedCommand"] = previous is null ? new JsonArray() : new JsonArray(previous.Command.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
            ["previousFailureClassification"] = previous?.FailureClassification?.Category ?? "",
            ["npmErrorClassification"] = previous?.FailureClassification?.Category ?? "none",
            ["peerDependencyPreflight"] = preflight.DeepClone(),
            ["nodeModulesDeleted"] = cleanInstall.BoolValue("nodeModulesDeleted"),
            ["packageLockDeleted"] = cleanInstall.BoolValue("packageLockDeleted"),
            ["cleanDeleteCompleted"] = !cleanInstall.BoolValue("manualActionRequired"),
            ["installAttemptKind"] = attempt == 1 ? "firstInstallAttempt" : previous?.LegacyPeerDepsUsed == true ? "retryOrFallbackAfterLegacyPeerDepsInstall" : "retryOrFallbackAfterNormalInstall",
            ["config"] = new JsonObject
            {
                ["useAi"] = config.Ai.UseAi,
                ["aiCli"] = config.Ai.AiCli,
                ["commandTimeoutSeconds"] = config.CommandTimeoutSeconds,
                ["dependencyCheckTimeoutSeconds"] = config.DependencyCheckTimeoutSeconds,
                ["allowLegacyPeerDepsFallback"] = config.AllowLegacyPeerDepsFallback,
                ["autoRemediateDependencies"] = config.AutoRemediateDependencies,
                ["preflightRemediationMode"] = config.PreflightRemediationMode,
                ["skipPreflightDependencyCompatibility"] = config.SkipPreflightDependencyCompatibility
            },
            ["isFirstAttempt"] = attempt == 1,
            ["isRetry"] = attempt > 1,
            ["attempt"] = attempt,
            ["npmVersion"] = await ToolVersionAsync("npm", projectPath, logPath, cancellationToken),
            ["nodeVersion"] = await ToolVersionAsync("node", projectPath, logPath, cancellationToken)
        };
    }

    private static InstallStrategyDecision? ParseInstallStrategyDecision(JsonObject? obj)
    {
        if (obj is null) return null;
        var flags = obj["flags"]?.AsObject();
        var strategy = obj.StringValue("strategy", obj.StringValue("mode", ""));
        var command = obj.StringValue("command");
        return new InstallStrategyDecision
        {
            PackageManager = obj.StringValue("packageManager", "npm"),
            Strategy = NormalizeInstallStrategy(strategy),
            Mode = NormalizeInstallStrategy(strategy),
            Command = command,
            Reason = obj.StringValue("reason"),
            Risk = obj.StringValue("risk", "medium"),
            Confidence = DoubleValue(obj, "confidence", 0),
            IsRetry = obj.BoolValue("isRetry"),
            IsFallback = obj.BoolValue("isFallback"),
            MaxRetries = obj.IntValue("maxRetries"),
            FailureClassification = obj.StringValue("failureClassification", "none"),
            Flags = new InstallStrategyFlags
            {
                NoAudit = flags?.BoolValue("noAudit", !command.Contains("--audit", StringComparison.OrdinalIgnoreCase)) ?? true,
                NoFund = flags?.BoolValue("noFund", !command.Contains("--fund", StringComparison.OrdinalIgnoreCase)) ?? true,
                PreferOffline = flags?.BoolValue("preferOffline", command.Contains("--prefer-offline", StringComparison.OrdinalIgnoreCase)) ?? true,
                Verbose = flags?.BoolValue("verbose") ?? false,
                LegacyPeerDeps = flags?.BoolValue("legacyPeerDeps") ?? command.Contains("--legacy-peer-deps", StringComparison.OrdinalIgnoreCase),
                Force = flags?.BoolValue("force") ?? command.Contains("--force", StringComparison.OrdinalIgnoreCase)
            }
        };
    }

    private static InstallStrategyDecision DeterministicInstallDecision(JsonObject context, MigrationConfig config, InstallFailureClassification? previousFailure, IReadOnlyList<string>? previousCommand)
    {
        return previousFailure?.Category switch
        {
            "peerDependencyConflict" when config.AllowLegacyPeerDepsFallback => DeterministicDecision("legacyPeerDepsInstall", "Previous npm install failed with a peer dependency conflict and legacy peer deps fallback is enabled.", "medium", true, true, "peerDependencyConflict"),
            "transientNetworkFailure" when previousCommand is not null => DeterministicDecision("retrySameCommand", "Transient registry/network failure; retrying the exact same install command.", "low", true, false, "transientNetworkFailure", string.Join(" ", previousCommand)),
            "registryAuthFailure" => DeterministicDecision("manualReview", "Registry authentication failed. Check npm auth, private registry, or proxy settings.", "medium", false, false, "registryAuthFailure"),
            "packageVersionNotFound" => DeterministicDecision("manualReview", "Package version was not found. Re-check the package upgrade plan before retrying install.", "medium", false, false, "packageVersionNotFound"),
            "unknownFailure" => DeterministicDecision("manualReview", "npm install failed with an unknown error. Manual review is required.", "medium", false, false, "unknownFailure"),
            _ => DeterministicDecision("normalInstall", "Default deterministic npm install strategy.", "low", false, false, "none")
        };
    }

    private static InstallStrategyDecision DeterministicDecision(string strategy, string reason, string risk, bool isRetry, bool isFallback, string failureClassification, string? command = null) => new()
    {
        PackageManager = "npm",
        Strategy = strategy,
        Mode = strategy,
        Command = command ?? (strategy == "legacyPeerDepsInstall" ? string.Join(" ", LegacyPeerDepsNpmInstallCommand) : string.Join(" ", NormalNpmInstallCommand)),
        Reason = reason,
        Confidence = 1,
        Risk = risk,
        IsRetry = isRetry,
        IsFallback = isFallback,
        MaxRetries = failureClassification == "transientNetworkFailure" ? 2 : 0,
        FailureClassification = failureClassification,
        Flags = new InstallStrategyFlags { LegacyPeerDeps = strategy == "legacyPeerDepsInstall" || command?.Contains("--legacy-peer-deps", StringComparison.OrdinalIgnoreCase) == true, NoAudit = true, NoFund = true, PreferOffline = true }
    };

    private async Task<string> ToolVersionAsync(string executable, string projectPath, string? logPath, CancellationToken cancellationToken)
    {
        try
        {
            var result = await commandRunner.RunAsync([executable, "--version"], projectPath, timeoutSeconds: 10, idleTimeoutSeconds: 5, logPath: logPath, cancellationToken: cancellationToken);
            return result.ReturnCode == 0 ? FirstNonEmptyLine(result.Stdout, result.Stderr) : "";
        }
        catch
        {
            return "";
        }
    }

    private static JsonObject InstallCommandObject(InstallAttemptResult attempt)
    {
        var commandObject = CommandObject(attempt.Command, attempt.Result, attempt.FallbackUsed);
        commandObject["installStrategySource"] = attempt.StrategySource;
        commandObject["installStrategy"] = attempt.Decision.Strategy;
        commandObject["installMode"] = attempt.Decision.Mode;
        commandObject["installReason"] = attempt.Decision.Reason;
        commandObject["installConfidence"] = attempt.Decision.Confidence;
        commandObject["installRisk"] = attempt.Decision.Risk;
        commandObject["fallbackUsed"] = attempt.FallbackUsed;
        commandObject["retryUsed"] = attempt.RetryUsed;
        commandObject["retryCount"] = attempt.RetryCount;
        commandObject["legacyPeerDepsUsed"] = attempt.LegacyPeerDepsUsed;
        commandObject["installElapsedSeconds"] = attempt.Result.DurationSeconds;
        commandObject["installFailureClassification"] = attempt.FailureClassification?.Category;
        commandObject["peerDependencyConflict"] = attempt.PeerDependencyConflict?.DeepClone();
        commandObject["aiInstallStrategyUsed"] = attempt.AiStrategyUsed;
        commandObject["aiInstallStrategyAccepted"] = attempt.AiStrategyAccepted;
        commandObject["aiInstallStrategyRejectedReason"] = attempt.AiStrategyRejectedReason;
        commandObject["manualActionRequired"] = attempt.ManualActionRequired;
        return commandObject;
    }

    private static bool HasPreflightPeerConcern(JsonObject context)
    {
        var warnings = context["peerDependencyPreflight"]?["warnings"]?.AsArray()?.Select(x => x?.ToString() ?? "") ?? [];
        var blockers = context["peerDependencyPreflight"]?["blockers"]?.AsArray()?.Select(x => x?.ToString() ?? "") ?? [];
        return warnings.Concat(blockers).Any(s => s.Contains("peer", StringComparison.OrdinalIgnoreCase));
    }

    private static string NormalizeInstallStrategy(InstallStrategyDecision decision) => NormalizeInstallStrategy(string.IsNullOrWhiteSpace(decision.Strategy) ? decision.Mode : decision.Strategy);

    private static string NormalizeInstallStrategy(string strategy) => strategy switch
    {
        "normal" or "cleanInstall" => "normalInstall",
        "legacyPeerDeps" => "legacyPeerDepsInstall",
        "" => "",
        _ => strategy
    };

    private static string NormalizeCommandText(string command) => string.Join(" ", SplitCommand(command));

    private static IReadOnlyList<string> SplitCommand(string command) => command.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    private static bool ContainsForbiddenInstallCommand(string command)
    {
        if (string.IsNullOrWhiteSpace(command)) return false;
        var normalized = NormalizeCommandText(command).ToLowerInvariant();
        return normalized.Contains(" install -g ", StringComparison.Ordinal) ||
               normalized.EndsWith(" install -g", StringComparison.Ordinal) ||
               normalized.Contains(" uninstall -g", StringComparison.Ordinal) ||
               normalized.StartsWith("npm update", StringComparison.Ordinal) ||
               normalized.StartsWith("npm audit fix", StringComparison.Ordinal) ||
               normalized.StartsWith("ng update", StringComparison.Ordinal) ||
               normalized.StartsWith("npx ng update", StringComparison.Ordinal) ||
               normalized.Contains(" migrate-only", StringComparison.Ordinal);
    }

    private static bool ShouldUseVerboseInstall(MigrationConfig config, int attempt, InstallAttemptResult? previous) =>
        string.Equals(config.Verbosity, "verbose", StringComparison.OrdinalIgnoreCase) || attempt > 1 || previous?.FailureClassification?.Category is "timeout" or "idleTimeout";

    private static int? PackageLockVersion(string path)
    {
        if (!File.Exists(path)) return null;
        try { return ReadJson(path).IntValue("lockfileVersion"); }
        catch { return null; }
    }

    private static double DoubleValue(JsonObject obj, string name, double defaultValue)
    {
        if (!obj.TryGetPropertyValue(name, out var value) || value is null) return defaultValue;
        return value.GetValueKind() == JsonValueKind.Number && value.AsValue().TryGetValue<double>(out var number) ? number : double.TryParse(value.ToString(), out number) ? number : defaultValue;
    }

    private static string TrimForPrompt(string text, int max) => text.Length <= max ? text : text[^max..];
    private static string FirstNonEmptyLine(params string[] values) => values.SelectMany(v => v.Split('\n')).Select(v => v.Trim()).FirstOrDefault(v => v.Length > 0) ?? "";

    private string LoadPrompt(string promptPath) => promptLoader?.Load(promptPath) ?? throw new InvalidOperationException("Prompt loader is required when AI Angular migration is enabled.");

    private static JsonObject CommandObject(IReadOnlyList<string> command, CommandResult result, bool legacyPeerDepsFallbackUsed = false)
    {
        var classified = ClassifyFailure(command, result, null);
        return new JsonObject
        {
            ["command"] = new JsonArray(command.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
            ["returncode"] = result.ReturnCode,
            ["stdout"] = result.Stdout,
            ["stderr"] = result.Stderr,
            ["timeoutKind"] = result.TimeoutKind,
            ["failureCategory"] = result.ReturnCode == 0 ? null : classified.Category,
            ["failureReason"] = result.ReturnCode == 0 ? null : classified.Reason,
            ["suggestedNextAction"] = result.ReturnCode == 0 ? null : classified.SuggestedNextAction,
            ["legacyPeerDepsFallbackUsed"] = legacyPeerDepsFallbackUsed,
            ["angularCliPolicy"] = new JsonObject { ["commandSource"] = command.FirstOrDefault() == "npx" ? "npx" : command.FirstOrDefault() ?? "unknown", ["angularCliSource"] = command.Contains("-p") ? "version-pinned npx package" : "not applicable", ["globalAngularCli"] = "not used", ["globalInstallUpdate"] = "not performed" }
        };
    }

    private static JsonObject ClassifiedFailedHopResult(MigrationHop hop, JsonArray commands, IReadOnlyList<string> files, JsonObject preflight, FailureInfo failure, JsonArray optionalMigrations) => new()
    {
        ["hop"] = HopObject(hop),
        ["status"] = "failed",
        ["commands"] = commands,
        ["files"] = new JsonArray(files.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
        ["preflightDependencyAnalysis"] = preflight,
        ["validation"] = new JsonObject { ["passed"] = false, ["errors"] = failure.Reason },
        ["failureCategory"] = failure.Category,
        ["failureReason"] = failure.Reason,
        ["failureStage"] = failure.Stage,
        ["failureCommand"] = new JsonArray(failure.Command.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
        ["suggestedNextAction"] = failure.SuggestedNextAction,
        ["manualCorrectionRequired"] = failure.ManualCorrectionRequired,
        ["canContinue"] = failure.CanContinue,
        ["optionalMigrations"] = optionalMigrations
    };

    private static FailureInfo ClassifyFailure(IReadOnlyList<string> command, CommandResult result, int? targetMajor)
    {
        var output = $"{result.Stdout}\n{result.Stderr}";
        var lower = output.ToLowerInvariant();
        if (IsNpmInstall(command))
        {
            var install = ClassifyInstallFailure(command, result);
            return install.Category switch
            {
                "peerDependencyConflict" => new("npm peer dependency conflict", "npm install", command, install.Reason, install.SuggestedNextAction, false, true),
                "transientNetworkFailure" => new("npm transient registry/network failure", "npm install", command, install.Reason, install.SuggestedNextAction, true, false),
                "registryAuthFailure" => new("npm registry authentication failure", "npm install", command, install.Reason, install.SuggestedNextAction, false, true),
                "packageVersionNotFound" => new("npm package version not found", "dependency resolution", command, install.Reason, install.SuggestedNextAction, false, true),
                "unknownFailure" => new("npm unknown install failure", "npm install", command, install.Reason, install.SuggestedNextAction, false, true),
                _ => new("command failed", CommandDescription(command), command, install.Reason, install.SuggestedNextAction, false, true)
            };
        }
        if (result.TimeoutKind is not null) return new("timeout", result.TimeoutKind, command, result.FailureReason ?? "Command timed out.", "Review the command log and increase timeout settings if the command is expected to take longer.", false, true);
        if (IsPeerDependencyConflict(result)) return new("npm peer dependency conflict", "npm install", command, "npm reported a peer dependency conflict.", "Review peer dependency warnings. If configured, rerun with --legacy-peer-deps or update the conflicting package.", false, true);
        if (lower.Contains("notarget") || lower.Contains("no matching version found") || lower.Contains("version not found")) return new("npm version not found", "dependency resolution", command, "npm could not resolve one of the requested package versions.", "Check configured target versions and npm registry access.", false, true);
        if (lower.Contains("package specifier has no effect when using migrate-only option")) return new("invalid migrate-only specifier", "Angular CLI update", command, "Angular CLI rejected a versioned package specifier with --migrate-only.", "Use an unversioned package name with --migrate-only.", false, true);
        if (command.FirstOrDefault() == "npx" && lower.Contains("unknown command")) return new("malformed npx invocation", "Angular CLI invocation", command, "Angular CLI command shape was rejected.", "Use npx --yes -p @angular/cli@<version> ng update <package> --migrate-only.", false, true);
        if (targetMajor is not null && lower.Contains("installing a temporary angular cli versioned"))
        {
            var match = Regex.Match(output, @"Installing a temporary Angular CLI versioned\s+(\d+)", RegexOptions.IgnoreCase);
            if (match.Success && int.Parse(match.Groups[1].Value) > targetMajor.Value)
            {
                return new("Angular CLI temporary version escape", "Angular CLI update", command, $"Angular CLI attempted to use temporary CLI major {match.Groups[1].Value} while target hop is {targetMajor}.", "Continue to validation only if package update and install succeeded; otherwise pin the CLI package explicitly.", true, false);
            }
        }
        if (lower.Contains("unsupported") && lower.Contains("angular")) return new("unsupported Angular target", "Angular CLI update", command, "Angular CLI reported an unsupported Angular target.", "Check the target version and migration rules.", false, true);
        return new("command failed", CommandDescription(command), command, "Command returned a non-zero exit code.", "Inspect stdout/stderr in the migration log.", false, true);
    }

    private static bool IsNpmInstall(IReadOnlyList<string> command) => command.Count >= 2 && command[0] == "npm" && command[1] == "install";
    private static bool IsPeerDependencyConflict(CommandResult result)
    {
        var output = $"{result.Stdout}\n{result.Stderr}".ToLowerInvariant();
        return output.Contains("eresolve") || output.Contains("peer dependency") || output.Contains("could not resolve dependency");
    }

    private static IReadOnlyList<string> LegacyPeerDepsCommand(IReadOnlyList<string> command) => IsNpmInstall(command)
        ? ["npm", "install", "--legacy-peer-deps", "--no-audit", "--no-fund", "--prefer-offline"]
        : command;

    private static IEnumerable<(string Name, string Version, string Section)> DependencyEntries(JsonObject data)
    {
        foreach (var section in new[] { "dependencies", "devDependencies", "optionalDependencies" })
        {
            foreach (var item in data[section]?.AsObject() ?? [])
            {
                yield return (item.Key, item.Value?.ToString() ?? "", section);
            }
        }
    }

    private static string? DependencySection(JsonObject data, string packageName)
    {
        foreach (var section in new[] { "dependencies", "devDependencies", "optionalDependencies" })
        {
            if (data[section] is JsonObject deps && deps.ContainsKey(packageName)) return section;
        }
        return null;
    }

    private static bool TryExtractPackageVersionNotFound(CommandResult result, out string packageName, out string requestedRange)
    {
        var output = $"{result.Stdout}\n{result.Stderr}";
        foreach (var pattern in new[]
        {
            @"No matching version found for\s+((?:@[^/\s]+/)?[^@\s]+)@([^\s.][^\s]*)",
            @"notarget\s+No matching version found for\s+((?:@[^/\s]+/)?[^@\s]+)@([^\s.][^\s]*)",
            @"(?:ETARGET|E404).*?\s((?:@[^/\s]+/)?[^@\s]+)@([~^]?\d+[^\s]*)"
        })
        {
            var match = Regex.Match(output, pattern, RegexOptions.IgnoreCase);
            if (!match.Success) continue;
            packageName = match.Groups[1].Value.Trim().TrimEnd('.', ',', ')');
            requestedRange = match.Groups[2].Value.Trim().TrimEnd('.', ',', ')');
            return !string.IsNullOrWhiteSpace(packageName) && !string.IsNullOrWhiteSpace(requestedRange);
        }

        packageName = "";
        requestedRange = "";
        return false;
    }

    private static string AngularDependencyRole(string name)
    {
        if (name.StartsWith("@angular/", StringComparison.OrdinalIgnoreCase)) return "framework-owned";
        if (name == "@angular-devkit/build-angular") return "framework-tooling";
        if (name == "typescript") return "framework-critical";
        if (LooksAngularCoupledThirdParty(name)) return "third-party-angular-library";
        return "unrelated-third-party";
    }

    private static bool LooksAngularCoupledThirdParty(string name) => name.Contains("angular", StringComparison.OrdinalIgnoreCase) || name.StartsWith("ngx-", StringComparison.OrdinalIgnoreCase) || name.StartsWith("@ng-", StringComparison.OrdinalIgnoreCase);

    private sealed record PendingPackageUpdate(string Name, string Section, string FromVersion, string OriginalSuggestedVersion, string NormalizedTargetVersion, string Category, string Reason, string Source, double Confidence);
    private sealed record NpmViewResult(JsonNode? Value, string Status, string Error, int AttemptCount);
    private sealed record NpmPackageTargetResolution(
        string? FinalTarget,
        string ValidationResult,
        string VerificationResult,
        string VerificationCommand,
        string FallbackReason,
        string NpmError,
        int AttemptCount,
        string InitialRecommendedVersion,
        string AiReRecommendedVersion,
        string AiReRecommendationReason,
        bool AiReRecommendationUsed,
        string InitialVerificationResult);
    private sealed record FailureInfo(string Category, string Stage, IReadOnlyList<string> Command, string Reason, string SuggestedNextAction, bool CanContinue, bool ManualCorrectionRequired);
    private static JsonObject FailedHopResult(MigrationHop hop, JsonArray commands, IReadOnlyList<string> files, JsonObject preflight, string reason, string package) => new() { ["hop"] = HopObject(hop), ["status"] = "failed", ["commands"] = commands, ["files"] = new JsonArray(files.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()), ["preflightDependencyAnalysis"] = preflight, ["validation"] = new JsonObject { ["passed"] = false, ["errors"] = reason }, ["failureReason"] = reason, ["failurePackage"] = package, ["optionalMigrations"] = new JsonArray() };
    private static string CommandDescription(IReadOnlyList<string> command) => command.Take(2).SequenceEqual(["npm", "install"]) || command.Take(2).SequenceEqual(["yarn", "install"]) || command.Take(2).SequenceEqual(["pnpm", "install"]) ? "dependency install" : command.Contains("--migrate-only") ? "Angular migrate-only" : "command";
    private static string FormatCommandOutput(IReadOnlyList<string> command, CommandResult result) => $"$ {string.Join(" ", command)}\nexit code: {result.ReturnCode}\n{result.Stdout}{result.Stderr}";
}
