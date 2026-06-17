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
    private static readonly string[] NormalNpmInstallCommand = ["npm", "install", "--ignore-scripts", "--no-audit", "--no-fund"];
    private static readonly string[] LegacyPeerDepsNpmInstallCommand = ["npm", "install", "--ignore-scripts", "--legacy-peer-deps", "--no-audit", "--no-fund"];
    private static readonly HashSet<string> AllowedNpmInstallCommands =
    [
        string.Join(" ", NormalNpmInstallCommand),
        string.Join(" ", LegacyPeerDepsNpmInstallCommand)
    ];
    private static readonly HashSet<string> AngularRuntimeSupportPackages = ["zone.js", "rxjs", "tslib"];
    private static readonly HashSet<string> AngularCoupledRuntimePackages = ["zone.js", "rxjs", "tslib", "typescript"];
    private static readonly HashSet<string> AngularFrameworkPackages = new(AngularCriticalDependencyPolicy.SynchronizedAngularPackages, StringComparer.OrdinalIgnoreCase);
    private static readonly HashSet<string> AngularToolingPackages = ["@angular/cli", "@angular-devkit/build-angular", "@angular/compiler-cli", "@ngtools/webpack"];
    private static readonly HashSet<string> AngularComponentPackages = ["@angular/cdk", "@angular/material", "@angular/material-moment-adapter"];
    private static readonly HashSet<string> AngularAiPackageCategories = ["angular_framework_package", "angular_tooling_package", "angular_runtime_support_package", "typescript_runtime_or_compiler_package", "angular_ui_or_extension_package", "third_party_runtime_package", "third_party_build_or_test_tooling", "business_or_unknown_package"];
    private static readonly HashSet<string> AngularAiPackageActions = ["upgrade", "preserve", "remove", "manual_review"];
    private static readonly HashSet<string> AngularAiConfigFiles = ["angular.json", "tsconfig.json", "tsconfig.app.json", "tsconfig.spec.json", "package.json"];
    private static readonly HashSet<string> AngularAiConfigChangeTypes = ["update_builder", "update_option", "remove_deprecated_option", "update_tsconfig", "manual_review"];
    private static readonly IReadOnlyDictionary<(int From, int To), OfficialAngularUpdatePolicy> OfficialAngularUpdatePolicies = new Dictionary<(int From, int To), OfficialAngularUpdatePolicy>
    {
        [(18, 19)] = new(false, true, ["@angular/cli", "@angular/core"])
    };
    private enum MigrationChangeClassification { ConfigurationMigration, FrameworkMigration, BusinessImpactingMigration }
    private const double MinimumInstallDecisionConfidence = 0.70;
    private const double MinimumAiPackageConfidence = 0.80;
    private const double MinimumAiConfigConfidence = 0.80;
    private const int AngularCliMinimumTimeoutSeconds = 600;
    private const int AngularCliMinimumIdleTimeoutSeconds = 60;
    private const int MaxParallelNpmViewChecks = 4;
    private readonly Dictionary<(string Package, string Field, string Range), JsonObject> _npmViewCache = [];
    private readonly object _npmViewCacheLock = new();
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
        var cssState = EnforcePersistentCssRemediationState(projectPath, hop);
        if (cssState.BoolValue("failed"))
        {
            var failed = FailedHopResult(hop, new JsonArray(), ChangedStructuralFiles(projectPath, beforeFiles), new JsonObject { ["targetAngularMajor"] = target, ["blockers"] = new JsonArray(), ["warnings"] = new JsonArray() }, cssState.StringValue("reason"), "css-remediation-state");
            failed["persistentCssRemediationState"] = cssState;
            return failed;
        }
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

        var configPlan = await PlanAngularStructuralConfigChangesAsync(projectPath, hop, config, progress, stage, cancellationToken);
        var cleanInstall = CleanInstallInputs(projectPath, DetectPackageManager(projectPath).Manager, progress, stage);
        if (cleanInstall.BoolValue("manualActionRequired"))
        {
            var failure = new FailureInfo("clean install cleanup failed", stage, [], cleanInstall.StringValue("reason", "node_modules or package-lock.json could not be deleted safely."), cleanInstall.StringValue("suggestedAction", "Close processes locking node_modules and rerun migration."), false, true);
            var failed = ClassifiedFailedHopResult(hop, commands, ChangedStructuralFiles(projectPath, beforeFiles), preflight, failure, new JsonArray());
            AddAngularAiHopDetails(failed, packageUpdate, configPlan, cleanInstall, [], new JsonObject { ["passed"] = false, ["errors"] = failure.Reason });
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
            AddAngularAiHopDetails(failed, packageUpdate, configPlan, cleanInstall, installAttempts, new JsonObject { ["passed"] = false, ["errors"] = failure.Reason });
            AddOfficialAngularUpdateDetails(failed, OfficialAngularUpdateSkipped(hop, "dependency install failed before official Angular update could run.", OfficialAngularUpdatePolicies.ContainsKey((hop.FromVersion, hop.ToVersion))));
            return failed;
        }

        var officialAngularUpdate = await RunOfficialAngularUpdateIfRequiredAsync(projectPath, hop, config, configPlan, rules, progress, stage, logPath, cancellationToken);
        foreach (var command in officialAngularUpdate["commands"]?.AsArray()?.OfType<JsonObject>() ?? []) commands.Add(command.DeepClone());
        if (officialAngularUpdate.BoolValue("executed") && officialAngularUpdate.BoolValue("packageFilesChanged"))
        {
            var postUpdateInstall = await RunPostOfficialAngularUpdateInstallAsync(projectPath, config, progress, stage, logPath, cancellationToken);
            commands.Add(CommandObject(postUpdateInstall.Command, postUpdateInstall.Result));
            if (postUpdateInstall.Result.ReturnCode != 0)
            {
                var failure = ClassifyFailure(postUpdateInstall.Command, postUpdateInstall.Result, target);
                var failed = ClassifiedFailedHopResult(hop, commands, ChangedStructuralFiles(projectPath, beforeFiles), preflight, failure, new JsonArray());
                AddAngularAiHopDetails(failed, packageUpdate, configPlan, cleanInstall, installAttempts, new JsonObject { ["passed"] = false, ["errors"] = failure.Reason });
                AddOfficialAngularUpdateDetails(failed, officialAngularUpdate);
                return failed;
            }
        }
        if (officialAngularUpdate.BoolValue("required") && !officialAngularUpdate.BoolValue("executed"))
        {
            var reason = officialAngularUpdate.StringValue("failureReason", officialAngularUpdate.StringValue("skippedReason", "Official Angular update could not run."));
            var command = officialAngularUpdate["command"]?.AsArray()?.Select(x => x?.ToString() ?? "").Where(s => s.Length > 0).ToArray() ?? [];
            var failure = new FailureInfo("official Angular update failed", "Angular CLI update", command, reason, officialAngularUpdate.StringValue("suggestedNextAction", "Review the Angular CLI update output and rerun migration."), false, true);
            var failed = ClassifiedFailedHopResult(hop, commands, ChangedStructuralFiles(projectPath, beforeFiles), preflight, failure, new JsonArray());
            AddAngularAiHopDetails(failed, packageUpdate, configPlan, cleanInstall, installAttempts, new JsonObject { ["passed"] = false, ["errors"] = reason });
            AddOfficialAngularUpdateDetails(failed, officialAngularUpdate);
            return failed;
        }

        var configUpdate = ApplyAngularStructuralConfigPlan(projectPath, configPlan, config);
        if (configUpdate["manualReviewFailedChanges"] is JsonArray failedManual && failedManual.Count > 0)
        {
            var reason = "One or more auto-accepted manual_review changes failed to apply cleanly.";
            var failure = new FailureInfo("manual review auto-accept failed", stage, [], reason, "Review failed manual_review patches in the migration report.", false, true);
            var failed = ClassifiedFailedHopResult(hop, commands, ChangedStructuralFiles(projectPath, beforeFiles), preflight, failure, new JsonArray());
            AddAngularAiHopDetails(failed, packageUpdate, configUpdate, cleanInstall, installAttempts, new JsonObject { ["passed"] = false, ["errors"] = reason });
            AddOfficialAngularUpdateDetails(failed, officialAngularUpdate);
            return failed;
        }

        var success = true;
        var validation = await RunValidationsAsync(projectPath, hop, config.CommandTimeoutSeconds, config.CommandIdleTimeoutSeconds, progress, stage, logPath, config.MaxAiRemediationRetries > 0, cancellationToken);
        if (validation["buildVerificationCommandResult"] is JsonObject buildCommandResult) commands.Add(buildCommandResult.DeepClone());
        var aiRemediationChanges = new JsonArray();
        var manualCorrectionRequests = new JsonArray();
        var validationFailures = new JsonArray();
        var thirdPartyValidationBlockers = new JsonArray();
        var failedPackagePlans = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (!validation.BoolValue("passed")) validationFailures.Add(ValidationFailureObject(validation, hop, false));
        if (!validation.BoolValue("passed") && !officialAngularUpdate.BoolValue("executed") && IsLikelyMissingAngularOfficialMigrationFailure(validation))
        {
            officialAngularUpdate = await RunOfficialAngularUpdateIfRequiredAsync(projectPath, hop, config, configPlan, rules, progress, stage, logPath, cancellationToken, forceReason: "validation failure indicates missing official Angular migration");
            foreach (var command in officialAngularUpdate["commands"]?.AsArray()?.OfType<JsonObject>() ?? []) commands.Add(command.DeepClone());
            if (officialAngularUpdate.BoolValue("executed") && officialAngularUpdate.BoolValue("packageFilesChanged"))
            {
                var postUpdateInstall = await RunPostOfficialAngularUpdateInstallAsync(projectPath, config, progress, stage, logPath, cancellationToken);
                commands.Add(CommandObject(postUpdateInstall.Command, postUpdateInstall.Result));
                if (postUpdateInstall.Result.ReturnCode != 0)
                {
                    var failure = ClassifyFailure(postUpdateInstall.Command, postUpdateInstall.Result, target);
                    var failed = ClassifiedFailedHopResult(hop, commands, ChangedStructuralFiles(projectPath, beforeFiles), preflight, failure, new JsonArray());
                    AddAngularAiHopDetails(failed, packageUpdate, configUpdate, cleanInstall, installAttempts, new JsonObject { ["passed"] = false, ["errors"] = failure.Reason });
                    AddOfficialAngularUpdateDetails(failed, officialAngularUpdate);
                    return failed;
                }
            }
            if (officialAngularUpdate.BoolValue("required") && !officialAngularUpdate.BoolValue("executed"))
            {
                var reason = officialAngularUpdate.StringValue("failureReason", officialAngularUpdate.StringValue("skippedReason", "Official Angular update could not run."));
                var command = officialAngularUpdate["command"]?.AsArray()?.Select(x => x?.ToString() ?? "").Where(s => s.Length > 0).ToArray() ?? [];
                var failure = new FailureInfo("official Angular update failed", "Angular CLI update", command, reason, officialAngularUpdate.StringValue("suggestedNextAction", "Review the Angular CLI update output and rerun migration."), false, true);
                var failed = ClassifiedFailedHopResult(hop, commands, ChangedStructuralFiles(projectPath, beforeFiles), preflight, failure, new JsonArray());
                AddAngularAiHopDetails(failed, packageUpdate, configUpdate, cleanInstall, installAttempts, new JsonObject { ["passed"] = false, ["errors"] = reason });
                AddOfficialAngularUpdateDetails(failed, officialAngularUpdate);
                return failed;
            }
            validation = await RunValidationsAsync(projectPath, hop, config.CommandTimeoutSeconds, config.CommandIdleTimeoutSeconds, progress, stage, logPath, config.MaxAiRemediationRetries > 0, cancellationToken);
            if (validation["buildVerificationCommandResult"] is JsonObject postMigrateBuildCommandResult) commands.Add(postMigrateBuildCommandResult.DeepClone());
            if (!validation.BoolValue("passed")) validationFailures.Add(ValidationFailureObject(validation, hop, false));
        }
        if (!validation.BoolValue("passed") && config.MaxAiRemediationRetries > 0)
        {
            for (var attempt = 1; attempt <= config.MaxAiRemediationRetries && !validation.BoolValue("passed"); attempt++)
            {
                var validationResult = ValidationResultFromAngularValidation(validation, hop);
                foreach (var existing in aiRemediationChanges.OfType<JsonObject>()) validationResult.AiRemediationChanges.Add(existing.DeepClone().AsObject());
                RemediationAttempt remediation;
                var deterministic = await AiRemediationPlanner.TryApplyDeterministicRemediationAsync(projectPath, validationResult, attempt, config.MaxAiRemediationRetries, config.SourceCompatibilityRemediation, cancellationToken);
                if (deterministic is not null)
                {
                    remediation = RemediationAttempt.AppliedResult([deterministic]);
                    progress?.Stage(stage, "Applied deterministic validation remediation. Re-running build verification.");
                }
                else if (DetectThirdPartyValidationBlockers(projectPath, validation, hop).Count > 0)
                {
                    var blockers = DetectThirdPartyValidationBlockers(projectPath, validation, hop);
                    foreach (var blocker in blockers) AddUniqueJsonObject(thirdPartyValidationBlockers, blocker, "package");
                    progress?.Stage(stage, $"Selecting validation-driven package remediation for third-party blockers: {string.Join(", ", blockers.Select(b => b.StringValue("package")))}.");
                    remediation = await TryRemediateValidationProvenThirdPartyPackagesAsync(projectPath, hop, config, validation, blockers, attempt, failedPackagePlans, progress, stage, logPath, cancellationToken);
                    if (!remediation.Attempted && config.Ai.UseAi && ai is not null && promptLoader is not null)
                    {
                        remediation = await new AiRemediationPlanner(ai, promptLoader).TryRemediateAsync(config, projectPath, this, validationResult, attempt, cancellationToken);
                    }
                    progress?.Stage(stage, AiRemediationResultSummary(remediation));
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
                    var useLegacyPeerDeps = IsValidationProvenThirdPartyPackageRemediation(remediation.Changes);
                    var installDecision = DeterministicDecision(useLegacyPeerDeps ? "legacyPeerDepsInstall" : "normalInstall", "Package remediation changed package.json; reinstall dependencies before rerunning Angular validation.", useLegacyPeerDeps ? "medium" : "low", useLegacyPeerDeps, false, "validationPackageRemediation");
                    var installCommand = useLegacyPeerDeps ? LegacyPeerDepsNpmInstallCommand : NormalNpmInstallCommand;
                    var installAttempt = await RunInstallAttemptAsync(projectPath, installCommand, installDecision, "validation-remediation", useLegacyPeerDeps, false, 0, remediation.Changes.Any(c => string.Equals(c.StringValue("mode"), "ai", StringComparison.OrdinalIgnoreCase)), true, "", false, config, progress, stage, logPath, cancellationToken);
                    commands.Add(InstallCommandObject(installAttempt));
                    if (installAttempt.Result.ReturnCode != 0 && IsPeerDependencyConflict(installAttempt.Result) && config.AllowLegacyPeerDepsFallback)
                    {
                        progress?.Stage(stage, "npm install reported ERESOLVE after validation remediation. Retrying once with --legacy-peer-deps.");
                        var fallbackDecision = DeterministicDecision("legacyPeerDepsInstall", "Package remediation install hit ERESOLVE; legacy peer deps is allowed only as fallback.", "medium", true, true, "peerDependencyConflict");
                        installAttempt = await RunInstallAttemptAsync(projectPath, LegacyPeerDepsNpmInstallCommand, fallbackDecision, "validation-remediation-peer-fallback", true, true, 1, remediation.Changes.Any(c => string.Equals(c.StringValue("mode"), "ai", StringComparison.OrdinalIgnoreCase)), true, "", false, config, progress, stage, logPath, cancellationToken);
                        commands.Add(InstallCommandObject(installAttempt));
                    }
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
                    var verificationChanges = aiRemediationChanges.OfType<JsonObject>().Where(c => c.IntValue("attempt") == attempt).ToArray();
                    var verification = await VerifyValidationRemediationInstalledPackagesAsync(projectPath, verificationChanges, commands, config, progress, stage, logPath, cancellationToken);
                    if (!verification.BoolValue("satisfied"))
                    {
                        validation = new JsonObject
                        {
                            ["passed"] = false,
                            ["output"] = verification.ToJsonString(JsonHelpers.SerializerOptions),
                            ["errors"] = "Installed package versions did not satisfy validation remediation target ranges.",
                            ["buildVerificationAttempted"] = false,
                            ["buildVerificationCommand"] = "package install verification",
                            ["buildVerificationExecutor"] = "npm-install-verification",
                            ["buildVerificationPassed"] = false,
                            ["buildVerificationSkipped"] = true,
                            ["buildVerificationFailureReason"] = "Installed package versions did not satisfy validation remediation target ranges.",
                            ["buildVerificationFailureCategory"] = "dependency",
                            ["nextHopStartedOnlyAfterBuildVerificationPassed"] = false
                        };
                        validationFailures.Add(ValidationFailureObject(validation, hop, true, remediationApplied: true));
                        break;
                    }
                    foreach (var change in aiRemediationChanges.OfType<JsonObject>().Where(c => c.IntValue("attempt") == attempt && c.StringValue("installResult") == "pending"))
                    {
                        change["installResult"] = "passed";
                    }
                }

                var preferLocalAngularCliBuild = IsValidationProvenThirdPartyPackageRemediation(remediation.Changes);
                validation = await RunValidationsAsync(projectPath, hop, config.CommandTimeoutSeconds, config.CommandIdleTimeoutSeconds, progress, stage, logPath, attempt < config.MaxAiRemediationRetries, cancellationToken, preferLocalAngularCliBuild);
                var rerunPassed = validation.BoolValue("passed");
                foreach (var change in aiRemediationChanges.OfType<JsonObject>().Where(c => c.IntValue("attempt") == attempt))
                {
                    change["validationResultAfterRemediation"] = rerunPassed ? "passed" : "failed";
                    change["validationErrorTail"] = rerunPassed ? "" : Tail(validation.StringValue("output", validation.StringValue("errors")));
                    if (change.StringValue("buildRetryResult") == "pending") change["buildRetryResult"] = rerunPassed ? "passed" : "failed";
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
        ApplyOfficialMigrationAcceptance(officialAngularUpdate, validation);
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
            ["thirdPartyValidationBlockers"] = thirdPartyValidationBlockers,
            ["persistentCssRemediationState"] = cssState,
            ["optionalMigrations"] = new JsonArray(),
            ["aiRemediationChanges"] = aiRemediationChanges,
            ["manualCorrectionRequests"] = manualCorrectionRequests,
            ["migrateOnlySkipped"] = true,
            ["migrateOnlySkippedReason"] = "disabled by new default flow"
        };
        if (postFailureCriticalAlignment is not null) result["postFailureAngularCriticalDependencyAlignment"] = postFailureCriticalAlignment.DeepClone();
        AddAngularAiHopDetails(result, packageUpdate, configUpdate, cleanInstall, installAttempts, validation);
        AddOfficialAngularUpdateDetails(result, officialAngularUpdate);
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
        [AngularMigrateOnlyCommand("@angular/core", sourceMajor, targetMajor, cliVersion)];

    public IReadOnlyList<string> AngularMigrateOnlyCommand(string packageName, int sourceMajor, int targetMajor, string? cliVersion = null)
    {
        return ["ng", "update", packageName, "--migrate-only", "--from", sourceMajor.ToString(), "--to", targetMajor.ToString()];
    }

    public IReadOnlyList<IReadOnlyList<string>> OfficialAngularMigrateOnlyCommands(int sourceMajor, int targetMajor, IReadOnlyList<string>? packages = null)
    {
        var migrationPackages = packages is { Count: > 0 } ? packages : ["@angular/cli", "@angular/core"];
        return OfficialAngularMigrateOnlyCommands(sourceMajor, targetMajor, migrationPackages, LocalAngularCliPath(Environment.CurrentDirectory));
    }

    public IReadOnlyList<string> OfficialAngularMigrateOnlyCommand(int sourceMajor, int targetMajor, IReadOnlyList<string> packages) =>
        OfficialAngularMigrateOnlyCommand(sourceMajor, targetMajor, packages, "ng");

    private static IReadOnlyList<string> OfficialAngularMigrateOnlyCommand(int sourceMajor, int targetMajor, IReadOnlyList<string> packages, string ngExecutable) =>
        ["NG_DISABLE_VERSION_CHECK=1", "npx", "-p", $"@angular/cli@{targetMajor}", "ng", "update", .. packages, "--migrate-only", "--from", sourceMajor.ToString(), "--to", targetMajor.ToString(), "--allow-dirty"];

    private static IReadOnlyList<IReadOnlyList<string>> OfficialAngularMigrateOnlyCommands(int sourceMajor, int targetMajor, IReadOnlyList<string> packages, string ngExecutable) =>
        packages.Select(packageName => OfficialAngularMigrateOnlyCommand(sourceMajor, targetMajor, [packageName], ngExecutable)).ToArray();

    public IReadOnlyList<string> OfficialAngularUpdateCommand(int targetMajor, string? ngExecutable = null) =>
        BuildOfficialAngularUpdateCommand(targetMajor, ngExecutable ?? "ng");

    private static IReadOnlyList<string> BuildOfficialAngularUpdateCommand(int targetMajor, string ngExecutable) =>
        [ngExecutable, "update", $"@angular/cli@{targetMajor}", $"@angular/core@{targetMajor}"];

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
            if (deps.ContainsKey("typescript")) deps["typescript"] = TypeScriptVersionForAngular(target);
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
        var targetAngularVersion = await ResolveAngularTargetVersionAsync(hop.ToVersion, projectPath, logPath, cancellationToken) ?? $"{hop.ToVersion}.0.0";
        progress?.Stage(stage, $"[Package Resolution] Selected Angular framework version: {targetAngularVersion}");
        var targetVersionByPackage = DefaultAngularTargetVersions(entries, hop.ToVersion, targetAngularVersion);
        var classification = await GetAngularAiPackageClassificationAsync(data, entries, hop, targetVersionByPackage, config, cancellationToken);
        var versionRecommendations = await GetAngularPackageVersionRecommendationsAsync(data, classification, targetVersionByPackage, hop, config, progress, stage, cancellationToken);
        var criticalAlignment = await GetAngularCriticalDependencyAlignmentAsync(projectPath, data, classification, versionRecommendations, hop, config, progress, stage, cancellationToken: cancellationToken);
        var acceptedVersionRecommendations = PackageRecommendationMap(versionRecommendations["accepted"]?.AsArray());
        var acceptedCriticalAlignments = PackageRecommendationMap(criticalAlignment["accepted"]?.AsArray());
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
            var targetVersion = NormalizedTargetVersion(name, originalTargetVersion, targetVersionByPackage.GetValueOrDefault(name), category, hop.ToVersion, acceptedVersionRecommendations.ContainsKey(name));
            targetVersion = ForceAngularOwnedExactTarget(name, targetVersion, targetVersionByPackage.GetValueOrDefault(name));
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
                var requiresVersionVerification =
                    acceptedCriticalAlignments.TryGetValue(name, out var criticalVerification) && criticalVerification.BoolValue("requiresVersionVerification") ||
                    acceptedVersionRecommendations.TryGetValue(name, out var versionVerification) && versionVerification.BoolValue("requiresVersionVerification") ||
                    item.BoolValue("requiresVersionVerification");
                pendingUpdates.Add(new PendingPackageUpdate(name, section, current.Version, originalTargetVersion, targetVersion, category, item.StringValue("reason"), source, confidence, requiresVersionVerification));
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
                pendingUpdates.Add(new PendingPackageUpdate(name, section, "", item.StringValue("recommendedVersion"), item.StringValue("recommendedVersion"), DefaultPackageCategory(name), item.StringValue("reason"), "ai-critical-dependency-alignment", DoubleValue(item, "confidence", 0), item.BoolValue("requiresVersionVerification")));
            }
        }

        var validation = await ValidateAndResolvePackageTargetsAsync(pendingUpdates, hop, data, config, projectPath, logPath, cancellationToken);
        foreach (var item in validation["discarded"]?.AsArray()?.OfType<JsonObject>() ?? [])
        {
            if (!preserved.OfType<JsonObject>().Any(p => p.StringValue("name").Equals(item.StringValue("packageName"), StringComparison.OrdinalIgnoreCase)))
            {
                preserved.Add(new JsonObject { ["name"] = item.StringValue("packageName"), ["version"] = item.StringValue("fromVersion"), ["section"] = item.StringValue("section"), ["reason"] = item.StringValue("warning") });
            }
            progress?.Stage(stage, $"[Package Resolution] Warning: {item.StringValue("warning")}");
        }
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

        var synchronization = ValidateSynchronizedAngularPackageVersions(data);
        if (!synchronization.BoolValue("valid"))
        {
            progress?.Stage(stage, $"[Package Resolution] Rejected mixed-version Angular-owned recommendation: {synchronization.StringValue("reason")}");
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
                ["angularOwnedVersionSynchronization"] = synchronization,
                ["aiPackageVersionRecommendations"] = versionRecommendations.DeepClone(),
                ["aiPackageVersionRecommendationsAccepted"] = versionRecommendations["accepted"]?.DeepClone() ?? new JsonArray(),
                ["aiPackageVersionRecommendationsRejected"] = FilterOutPackages(versionRecommendations["rejected"]?.AsArray(), acceptedCriticalNames),
                ["angularCriticalDependencyAlignment"] = criticalAlignment.DeepClone(),
                ["angularCriticalDependencyAlignmentAccepted"] = criticalAlignment["accepted"]?.DeepClone() ?? new JsonArray(),
                ["angularCriticalDependencyAlignmentRejected"] = FilterOutPackages(criticalAlignment["rejected"]?.AsArray(), acceptedCriticalNames),
                ["package"] = "@angular/core",
                ["reason"] = synchronization.StringValue("reason")
            };
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
        if (alignment.BoolValue("fallbackUsed"))
        {
            var reason = alignment["warnings"]?.AsArray()?.Select(w => w?.ToString()).FirstOrDefault(w => !string.IsNullOrWhiteSpace(w)) ?? "unknown";
            progress?.Stage(stage, $"Angular critical dependency alignment fallback used. Reason={reason}");
        }
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
            if (AngularCriticalDependencyPolicy.RequiresSynchronizedAngularVersion(entry.Name)) result[entry.Name] = targetAngularVersion;
            else if (AngularCriticalDependencyPolicy.IndependentAngularPackages.Contains(entry.Name)) result[entry.Name] = targetMajor.ToString();
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
        if (!AngularCriticalDependencyPolicy.IsAngularOwnedPackage(name) && category is "angular_ui_or_extension_package" or "third_party_runtime_package" or "third_party_build_or_test_tooling" or "business_or_unknown_package" && action == "upgrade" && !item.BoolValue("validationDriven")) return (false, "Third-party Angular-coupled package upgrades require validationDriven=true after an install/build/test failure.");
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

    private static string? NormalizedTargetVersion(string name, string aiTarget, string? defaultTarget, string category, int targetMajor, bool fromAcceptedVersionRecommendation = false)
    {
        var value = NpmVersionRange.Normalize(string.IsNullOrWhiteSpace(aiTarget) || aiTarget == "null" ? defaultTarget : aiTarget);
        if (string.IsNullOrWhiteSpace(value) || !NpmVersionRange.IsSafe(value)) return null;
        if (AngularCriticalDependencyPolicy.RequiresSynchronizedAngularVersion(name))
        {
            if (NpmVersionRange.Major(value) != targetMajor) return fromAcceptedVersionRecommendation ? null : NpmVersionRange.Normalize(defaultTarget);
            return value;
        }
        if (AngularCriticalDependencyPolicy.IndependentAngularPackages.Contains(name))
        {
            return NpmVersionRange.Normalize(defaultTarget) ?? targetMajor.ToString();
        }
        if (category is "angular_framework_package" or "angular_tooling_package" && NpmVersionRange.Major(value) != targetMajor) return fromAcceptedVersionRecommendation ? null : NpmVersionRange.Normalize(defaultTarget);
        if (category == "typescript_runtime_or_compiler_package" && !IsTypeScriptCompatibleWithAngular(value, targetMajor)) return NpmVersionRange.Normalize(defaultTarget);
        return value;
    }

    private static string? ForceAngularOwnedExactTarget(string name, string? targetVersion, string? defaultTarget)
    {
        if (!AngularCriticalDependencyPolicy.IsAngularOwnedPackage(name)) return targetVersion;
        if (AngularCriticalDependencyPolicy.RequiresSynchronizedAngularVersion(name) && IsExactVersion(defaultTarget)) return defaultTarget;
        if (AngularCriticalDependencyPolicy.IndependentAngularPackages.Contains(name))
        {
            var major = NpmVersionRange.Major(defaultTarget) ?? NpmVersionRange.Major(targetVersion);
            return major is null ? targetVersion : major.Value.ToString();
        }
        if (IsExactVersion(targetVersion)) return targetVersion;
        if (IsExactVersion(defaultTarget)) return defaultTarget;
        return targetVersion;
    }

    private async Task<JsonObject> ValidateAndResolvePackageTargetsAsync(IReadOnlyList<PendingPackageUpdate> updates, MigrationHop hop, JsonObject packageJson, MigrationConfig config, string projectPath, string? logPath, CancellationToken cancellationToken)
    {
        var resolved = new JsonArray();
        var invalid = new JsonArray();
        var discarded = new JsonArray();
        var warnings = new JsonArray();
        var mode = NormalizePackageVersionVerificationMode(config.PackageVersionVerificationMode);
        var upfrontSkipped = 0;
        var upfrontResolutions = await ResolveSelectedPackageTargetsAsync(updates, hop, mode, config, projectPath, logPath, cancellationToken);
        foreach (var update in updates)
        {
            if (update.FromVersion.Equals(update.NormalizedTargetVersion, StringComparison.OrdinalIgnoreCase))
            {
                var noOp = new JsonObject
                {
                    ["packageName"] = update.Name,
                    ["fromVersion"] = update.FromVersion,
                    ["section"] = update.Section,
                    ["category"] = update.Category,
                    ["role"] = AngularPackageRole(update.Name, update.Category),
                    ["requestedTarget"] = update.NormalizedTargetVersion,
                    ["originalSuggestedVersion"] = string.IsNullOrWhiteSpace(update.OriginalSuggestedVersion) ? update.NormalizedTargetVersion : update.OriginalSuggestedVersion,
                    ["source"] = update.Source,
                    ["reason"] = update.Reason,
                    ["aiConfidence"] = update.Confidence,
                    ["verificationMode"] = mode,
                    ["npmValidationResult"] = "skipped_no_op",
                    ["finalResolvedVersion"] = update.FromVersion,
                    ["finalAcceptedVersion"] = update.FromVersion,
                    ["packageJsonUpdated"] = false,
                    ["discardedNoOpRecommendation"] = true,
                    ["warning"] = $"Discarded no-op package target {update.Name}@{update.NormalizedTargetVersion}; current version already matches."
                };
                warnings.Add(noOp.StringValue("warning"));
                discarded.Add(noOp);
                continue;
            }

            var role = AngularPackageRole(update.Name, update.Category);
            var shouldVerify = ShouldVerifyPackageTargetUpfront(update, role, hop.ToVersion, mode);
            if (!shouldVerify && (string.IsNullOrWhiteSpace(update.NormalizedTargetVersion) || !NpmVersionRange.IsSafe(update.NormalizedTargetVersion)))
            {
                shouldVerify = true;
            }

            var resolution = shouldVerify
                ? upfrontResolutions.GetValueOrDefault(update)
                : SkippedInstallFirstResolution(update.NormalizedTargetVersion);
            resolution ??= await ResolveNpmPackageTargetAsync(update.Name, hop.ToVersion, update.NormalizedTargetVersion, role, config, projectPath, logPath, cancellationToken);
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
            var canDiscardInvalidTarget = CanDiscardInvalidPackageTarget(update);
            if (!canDiscardInvalidTarget && resolution.ValidationResult == "E404" && ai is not null && promptLoader is not null)
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
                if (canDiscardInvalidTarget)
                {
                    var warning = $"Discarded invalid non-critical package target {update.Name}@{update.NormalizedTargetVersion}; preserving existing version {update.FromVersion}.";
                    item["warning"] = warning;
                    item["finalAcceptedVersion"] = update.FromVersion;
                    item["discardedInvalidRecommendation"] = true;
                    warnings.Add(warning);
                    discarded.Add(item);
                }
                else
                {
                    invalid.Add(item);
                }
            }
            else
            {
                resolved.Add(item);
            }
        }

        return new JsonObject { ["resolved"] = resolved, ["invalid"] = invalid, ["discarded"] = discarded, ["warnings"] = warnings, ["verificationMode"] = mode, ["upfrontNpmViewSkippedCount"] = upfrontSkipped };
    }

    private async Task<Dictionary<PendingPackageUpdate, NpmPackageTargetResolution>> ResolveSelectedPackageTargetsAsync(IReadOnlyList<PendingPackageUpdate> updates, MigrationHop hop, string mode, MigrationConfig config, string projectPath, string? logPath, CancellationToken cancellationToken)
    {
        var selected = updates
            .Where(update =>
            {
                var role = AngularPackageRole(update.Name, update.Category);
                var shouldVerify = ShouldVerifyPackageTargetUpfront(update, role, hop.ToVersion, mode);
                if (!shouldVerify && (string.IsNullOrWhiteSpace(update.NormalizedTargetVersion) || !NpmVersionRange.IsSafe(update.NormalizedTargetVersion))) shouldVerify = true;
                return shouldVerify;
            })
            .ToArray();
        if (selected.Length == 0) return [];

        using var throttle = new SemaphoreSlim(MaxParallelNpmViewChecks);
        var tasks = selected.Select(async update =>
        {
            await throttle.WaitAsync(cancellationToken);
            try
            {
                var role = AngularPackageRole(update.Name, update.Category);
                var resolution = await ResolveNpmPackageTargetAsync(update.Name, hop.ToVersion, update.NormalizedTargetVersion, role, config, projectPath, logPath, cancellationToken);
                return (Update: update, Resolution: resolution);
            }
            finally
            {
                throttle.Release();
            }
        }).ToArray();

        var results = await Task.WhenAll(tasks);
        return results.ToDictionary(r => r.Update, r => r.Resolution);
    }

    private static bool CanDiscardInvalidPackageTarget(PendingPackageUpdate update) =>
        !AngularCriticalDependencyPolicy.IsCriticalPackage(update.Name);

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
            var discoveryCommand = $"npm view {packageName}@{targetMajor} version --json";
            var discoveryResult = await NpmViewWithRetryAsync($"{packageName}@{targetMajor}", "version", "--json", Math.Max(0, config.NpmLookupRetries), config.NpmLookupTimeoutSeconds, config.NpmLookupIdleTimeoutSeconds, projectPath, logPath, cancellationToken);
            var discoveryVersion = SelectLatestStableMajorVersion(discoveryResult.Value, targetMajor);
            if (!string.IsNullOrWhiteSpace(discoveryVersion))
            {
                var resolvedDiscoveryTarget = ShouldMaterializeResolvedRange(discoveryVersion) ? discoveryVersion : discoveryVersion;
                return new NpmPackageTargetResolution(resolvedDiscoveryTarget, "verified", "verified", discoveryCommand, $"Requested {packageName}@{proposedRange} was unavailable. npm returned E404. Resolved via package@{targetMajor} discovery.", proposedResult.Error, discoveryResult.AttemptCount, proposedRange, "", "", false, "E404");
            }

            return new NpmPackageTargetResolution(null, "E404", "E404", discoveryCommand, $"Requested {packageName}@{proposedRange} was unavailable. npm returned E404. package@{targetMajor} discovery was also unavailable.", proposedResult.Error, proposedResult.AttemptCount, proposedRange, "", "", false, "");
        }

        return new NpmPackageTargetResolution(null, "inconclusive", "inconclusive", command, $"npm verification returned no stable version for {packageName}@{proposedRange}; broad discovery was not attempted.", proposedResult.Error, proposedResult.AttemptCount, proposedRange, "", "", false, "");
    }

    private static string NormalizePackageVersionVerificationMode(string mode) =>
        mode is "strict-npm-view" or "install-first" or "off" ? mode : "install-first";

    private static NpmPackageTargetResolution SkippedInstallFirstResolution(string proposedRange) =>
        new(proposedRange, "skipped", "skipped", "", "Skipped upfront npm view verification because install-first mode is enabled; npm install will validate this range.", "", 0, proposedRange, "", "", false, "skipped");

    private static bool ShouldVerifyPackageTargetUpfront(PendingPackageUpdate update, string role, int targetMajor, string mode)
    {
        if (mode == "off") return false;
        if (update.RequiresVersionVerification) return true;
        if (AngularCriticalDependencyPolicy.IsCriticalPackage(update.Name) && IsAngularOwnedPackageName(update.Name)) return true;
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

    private static JsonObject ValidateSynchronizedAngularPackageVersions(JsonObject packageJson)
    {
        var entries = DependencyEntries(packageJson)
            .Where(d => AngularCriticalDependencyPolicy.RequiresSynchronizedAngularVersion(d.Name))
            .Select(d => new JsonObject { ["packageName"] = d.Name, ["version"] = d.Version, ["section"] = d.Section, ["exactVersion"] = ExactVersionText(d.Version) })
            .ToArray();
        var invalidRanges = entries.Where(e => string.IsNullOrWhiteSpace(e.StringValue("exactVersion"))).ToArray();
        var versions = entries
            .Select(e => e.StringValue("exactVersion"))
            .Where(v => !string.IsNullOrWhiteSpace(v))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
        var valid = invalidRanges.Length == 0 && versions.Length <= 1;
        var reason = valid
            ? ""
            : invalidRanges.Length > 0
                ? $"Angular-owned framework packages must use exact synchronized versions, not ranges: {string.Join(", ", invalidRanges.Select(e => $"{e.StringValue("packageName")}={e.StringValue("version")}"))}."
                : $"Angular-owned framework packages must use one synchronized patch version, but package.json contains: {string.Join(", ", entries.Select(e => $"{e.StringValue("packageName")}={e.StringValue("version")}"))}.";
        return new JsonObject
        {
            ["valid"] = valid,
            ["selectedAngularFrameworkVersion"] = versions.Length == 1 ? versions[0] : "",
            ["reason"] = reason,
            ["packages"] = new JsonArray(entries.Select(e => (JsonNode?)e.DeepClone()).ToArray())
        };
    }

    private static string AngularOwnedPackageVersionSummary(JsonObject packageJson) =>
        string.Join(", ", DependencyEntries(packageJson)
            .Where(d => AngularCriticalDependencyPolicy.IsAngularOwnedPackage(d.Name))
            .OrderBy(d => d.Name, StringComparer.OrdinalIgnoreCase)
            .Select(d => $"{d.Name}={d.Version}"));

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
        var packageJsonPath = Path.Combine(projectPath, "package.json");
        var data = ReadJson(packageJsonPath);
        var updated = false;
        foreach (var conflict in PeerConflictItems(attempt.PeerDependencyConflict).Where(c => c.StringValue("classification") == "angularRuntimeMismatch" && c.StringValue("decision") == "revisePackagePlan"))
        {
            var package = conflict.StringValue("conflictingPackage");
            var requiredRange = conflict.StringValue("requiredPeerRange");
            if (!AngularCoupledRuntimePackages.Contains(package) || string.IsNullOrWhiteSpace(requiredRange)) continue;

            var compatibleVersion = CompatibleRuntimeVersionFromPeerRange(package, requiredRange, targetMajor);
            if (string.IsNullOrWhiteSpace(compatibleVersion)) continue;

            foreach (var section in new[] { "dependencies", "devDependencies", "optionalDependencies" })
            {
                if (data[section] is JsonObject deps && deps.ContainsKey(package) && deps[package]?.ToString() != compatibleVersion)
                {
                    deps[package] = compatibleVersion;
                    updated = true;
                }
            }
            conflict["decision"] = "revisePackagePlan";
            conflict["revisedVersion"] = compatibleVersion;
            progress?.Stage(stage, $"Revised Angular runtime support package {package} to {compatibleVersion} after peer dependency conflict.");
        }
        if (!updated) return false;

        File.WriteAllText(packageJsonPath, data.ToJsonString(JsonHelpers.SerializerOptions) + Environment.NewLine);
        var lockPath = Path.Combine(projectPath, "package-lock.json");
        if (File.Exists(lockPath)) File.Delete(lockPath);
        return true;
    }

    private async Task<JsonObject> PlanAngularStructuralConfigChangesAsync(string projectPath, MigrationHop hop, MigrationConfig config, IProgressReporter? progress, string stage, CancellationToken cancellationToken)
    {
        progress?.Stage(stage, config.Ai.UseAi ? "Planning safe Angular structural config updates with AI..." : "Skipping AI structural config planning.");
        var before = AngularAiConfigFiles.Where(f => File.Exists(Path.Combine(projectPath, f))).ToDictionary(f => f, f => File.ReadAllText(Path.Combine(projectPath, f)));
        var changes = new JsonArray();
        var manual = new JsonArray();
        var unavailable = new JsonArray();
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
                foreach (var change in plan?["changes"]?.AsArray()?.OfType<JsonObject>() ?? []) changes.Add(change.DeepClone());
                foreach (var recommendation in plan?["manualRecommendations"]?.AsArray() ?? []) manual.Add(recommendation?.DeepClone());
            }
            catch
            {
                unavailable.Add(new JsonObject { ["reason"] = "AI config plan was unavailable or invalid." });
            }
        }

        return new JsonObject
        {
            ["changes"] = changes,
            ["rejectedAiConfigSuggestions"] = unavailable,
            ["manualAngularConfigRecommendations"] = manual,
            ["angularJsonChanged"] = false,
            ["tsconfigChanged"] = false
        };
    }

    private static JsonObject ApplyAngularStructuralConfigPlan(string projectPath, JsonObject plan, MigrationConfig config)
    {
        var before = AngularAiConfigFiles.Where(f => File.Exists(Path.Combine(projectPath, f))).ToDictionary(f => f, f => File.ReadAllText(Path.Combine(projectPath, f)));
        var accepted = new JsonArray();
        var rejected = new JsonArray(plan["rejectedAiConfigSuggestions"]?.AsArray()?.Select(x => x?.DeepClone()).ToArray() ?? []);
        var manual = plan["manualAngularConfigRecommendations"]?.DeepClone() as JsonArray ?? new JsonArray();
        var manualApplied = new JsonArray();
        var manualFailed = new JsonArray();
        var manualChangedFiles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var aiChangedFiles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var change in plan["changes"]?.AsArray()?.OfType<JsonObject>() ?? [])
        {
            var isManualReview = string.Equals(change.StringValue("changeType"), "manual_review", StringComparison.OrdinalIgnoreCase);
            var validation = ValidateAngularConfigSuggestion(projectPath, change, config.ManualReviewAutoAccept);
            if (!validation.Valid)
            {
                var rejectedChange = RejectedConfigSuggestion(change, validation.Reason);
                rejected.Add(rejectedChange);
                if (isManualReview) manualFailed.Add(rejectedChange.DeepClone());
                else manual.Add(new JsonObject { ["filePath"] = change.StringValue("filePath"), ["reason"] = validation.Reason });
                continue;
            }
            if (ApplySnippetPatch(projectPath, change))
            {
                var clone = change.DeepClone().AsObject();
                if (isManualReview)
                {
                    clone["autoAccepted"] = true;
                    manualApplied.Add(clone.DeepClone());
                    manualChangedFiles.Add(NormalizeRelativePath(clone.StringValue("filePath")));
                }
                else
                {
                    accepted.Add(clone.DeepClone());
                    aiChangedFiles.Add(NormalizeRelativePath(clone.StringValue("filePath")));
                }
            }
            else
            {
                var rejectedChange = RejectedConfigSuggestion(change, "Patch before snippet was not found exactly once.");
                rejected.Add(rejectedChange);
                if (isManualReview) manualFailed.Add(rejectedChange.DeepClone());
                else manual.Add(new JsonObject { ["filePath"] = change.StringValue("filePath"), ["reason"] = "Patch requires manual review because the before snippet did not match." });
            }
        }

        var after = AngularAiConfigFiles.Where(f => File.Exists(Path.Combine(projectPath, f))).ToDictionary(f => f, f => File.ReadAllText(Path.Combine(projectPath, f)));
        return new JsonObject
        {
            ["changes"] = accepted,
            ["rejectedAiConfigSuggestions"] = rejected,
            ["manualAngularConfigRecommendations"] = manual,
            ["manualReviewAutoAcceptEnabled"] = config.ManualReviewAutoAccept,
            ["manualReviewItemsReceived"] = (plan["changes"]?.AsArray()?.OfType<JsonObject>().Count(c => string.Equals(c.StringValue("changeType"), "manual_review", StringComparison.OrdinalIgnoreCase)) ?? 0) + manual.Count,
            ["manualReviewAppliedChanges"] = manualApplied,
            ["manualReviewFailedChanges"] = manualFailed,
            ["manualReviewChangedFiles"] = new JsonArray(manualChangedFiles.Order().Select(f => (JsonNode?)JsonValue.Create(f)).ToArray()),
            ["aiStructuralChangedFiles"] = new JsonArray(aiChangedFiles.Order().Select(f => (JsonNode?)JsonValue.Create(f)).ToArray()),
            ["angularJsonChanged"] = before.GetValueOrDefault("angular.json") != after.GetValueOrDefault("angular.json"),
            ["tsconfigChanged"] = new[] { "tsconfig.json", "tsconfig.app.json", "tsconfig.spec.json" }.Any(f => before.GetValueOrDefault(f) != after.GetValueOrDefault(f))
        };
    }

    private static (bool Valid, string Reason) ValidateAngularConfigSuggestion(string projectPath, JsonObject change, bool allowManualReviewAutoAccept = false)
    {
        var file = NormalizeRelativePath(change.StringValue("filePath"));
        var type = change.StringValue("changeType");
        var risk = change.StringValue("risk", "medium");
        var patch = change["patch"]?.AsObject();
        var before = patch?.StringValue("before") ?? "";
        var after = patch?.StringValue("after") ?? "";
        if (!AngularAiConfigFiles.Contains(file)) return (false, "AI config plan may only touch Angular structural config files.");
        if (!AngularAiConfigChangeTypes.Contains(type)) return (false, "AI config change type is not allowlisted.");
        if (type == "manual_review" && !allowManualReviewAutoAccept) return (false, "Manual review suggestions are not applied automatically.");
        if (type != "manual_review" && risk != "low") return (false, "Only low-risk config changes are applied automatically.");
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
        JsonObject? cached;
        lock (_npmViewCacheLock)
        {
            _npmViewCache.TryGetValue(key, out cached);
        }
        if (cached is not null)
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
            lock (_npmViewCacheLock)
            {
                _npmViewCache[key] = new JsonObject { ["value"] = parsed, ["status"] = status, ["error"] = error, ["attemptCount"] = 1 };
            }
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

    private async Task<JsonObject> RunValidationsAsync(string projectPath, MigrationHop hop, int? timeoutSeconds, int? idleTimeoutSeconds, IProgressReporter? progress, string stage, string? logPath, bool remediationAvailable, CancellationToken cancellationToken, bool preferLocalAngularCliBuild = false)
    {
        var manifest = await ParseManifestAsync(projectPath, cancellationToken);
        var build = await RunBuildVerificationCommandAsync(projectPath, manifest, progress, stage, logPath, timeoutSeconds, idleTimeoutSeconds, cancellationToken, preferLocalAngularCliBuild);
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
        validation["thirdPartyValidationBlockers"] = new JsonArray(DetectThirdPartyValidationBlockers(projectPath, validation, hop).Select(b => (JsonNode?)b.DeepClone()).ToArray());
        return validation;
    }

    private static JsonObject EnforcePersistentCssRemediationState(string projectPath, MigrationHop hop)
    {
        var statePath = Path.Combine(projectPath, ".migration-agent", "css-remediation-state.json");
        var statuses = new JsonArray();
        if (!File.Exists(statePath)) return new JsonObject { ["attempted"] = false, ["records"] = statuses };
        JsonArray records;
        try
        {
            records = JsonNode.Parse(File.ReadAllText(statePath))?.AsArray() ?? new JsonArray();
        }
        catch (Exception ex)
        {
            return new JsonObject { ["attempted"] = true, ["failed"] = true, ["reason"] = $"Persistent CSS remediation state could not be read: {ex.Message}", ["records"] = statuses };
        }

        foreach (var record in records.OfType<JsonObject>())
        {
            var sourceFile = NormalizeRelativePath(record.StringValue("sourceFile"));
            var originalImport = record.StringValue("originalImport");
            var replacementImport = record.StringValue("replacementImport");
            var full = Path.GetFullPath(Path.Combine(projectPath, sourceFile.Replace('/', Path.DirectorySeparatorChar)));
            var status = new JsonObject
            {
                ["sourceFile"] = sourceFile,
                ["originalImport"] = originalImport,
                ["replacementImport"] = replacementImport,
                ["acceptedHop"] = record.StringValue("acceptedAtHop"),
                ["enforcedAtHop"] = $"{hop.FromVersion} -> {hop.ToVersion}"
            };
            if (!IsUnderRoot(full, projectPath) || !File.Exists(full))
            {
                status["status"] = "failed";
                status["reason"] = "recorded source file was deleted or moved";
                statuses.Add(status);
                return new JsonObject { ["attempted"] = true, ["failed"] = true, ["reason"] = $"Recorded CSS remediation source file was deleted or moved: {sourceFile}", ["records"] = statuses };
            }

            var text = File.ReadAllText(full);
            var changed = false;
            if (ContainsImport(text, originalImport))
            {
                text = ReplaceCssImport(text, originalImport, replacementImport);
                changed = true;
            }
            var forbidden = ForbiddenNgSelectCssImports(sourceFile, text).ToArray();
            if (forbidden.Length > 0)
            {
                status["status"] = "failed";
                status["reason"] = $"forbidden ng-select import present: {string.Join(", ", forbidden)}";
                statuses.Add(status);
                return new JsonObject { ["attempted"] = true, ["failed"] = true, ["reason"] = $"Forbidden ng-select CSS import present in {sourceFile}: {string.Join(", ", forbidden)}", ["records"] = statuses };
            }
            if (changed) File.WriteAllText(full, text);
            status["status"] = changed ? "reapplied" : "already_enforced";
            statuses.Add(status);
        }

        return new JsonObject { ["attempted"] = true, ["failed"] = false, ["records"] = statuses };
    }

    private static bool ContainsImport(string text, string import) =>
        Regex.Matches(text, @"@import\s+(?:url\()?['""](?<import>[^'"")]+)['""]", RegexOptions.IgnoreCase)
            .Any(m => m.Groups["import"].Value.Equals(import, StringComparison.OrdinalIgnoreCase));

    private static string ReplaceCssImport(string text, string before, string after) =>
        Regex.Replace(text, @"@import\s+(?:url\()?['""](?<import>[^'"")]+)['""]\)?\s*;", match =>
            match.Groups["import"].Value.Equals(before, StringComparison.OrdinalIgnoreCase)
                ? match.Value.Replace(match.Groups["import"].Value, after, StringComparison.Ordinal)
                : match.Value,
            RegexOptions.IgnoreCase);

    private static IEnumerable<string> ForbiddenNgSelectCssImports(string sourceFile, string text)
    {
        var imports = Regex.Matches(text, @"@import\s+(?:url\()?['""](?<import>[^'"")]+)['""]", RegexOptions.IgnoreCase)
            .Select(m => m.Groups["import"].Value)
            .ToArray();
        foreach (var import in imports)
        {
            if (import is "~@ng-select/ng-select/themes/material.theme.css" or "~@ng-select/ng-select/themes/default.theme.css") yield return import;
            if (sourceFile.EndsWith(".css", StringComparison.OrdinalIgnoreCase) &&
                (import is "@ng-select/ng-select/scss/material.theme" or "@ng-select/ng-select/scss/default.theme")) yield return import;
        }
    }

    private async Task<RemediationAttempt> TryRemediateValidationProvenThirdPartyPackagesAsync(string projectPath, MigrationHop hop, MigrationConfig config, JsonObject validation, IReadOnlyList<JsonObject> blockers, int attempt, HashSet<string> failedPackagePlans, IProgressReporter? progress, string stage, string? logPath, CancellationToken cancellationToken)
    {
        var packageJsonPath = Path.Combine(projectPath, "package.json");
        var changes = new List<JsonObject>();
        var shimRejectedReason = "";
        if (TryApplyVisibilityStateTypeShim(projectPath, validation, blockers, attempt, out var shimChange, out shimRejectedReason))
        {
            changes.Add(shimChange);
            return RemediationAttempt.AppliedResult(changes);
        }

        var deterministicChanges = await TryApplyDeterministicThirdPartyPackageRemediationAsync(projectPath, hop, config, validation, blockers, attempt, failedPackagePlans, logPath, cancellationToken);
        if (deterministicChanges.Count > 0)
        {
            changes.AddRange(deterministicChanges);
        }

        var blockersRequiringAi = blockers
            .Where(b => DeterministicThirdPartyCandidate(b, hop.ToVersion) is null)
            .Where(b => !changes.Any(c => c.StringValue("packageName").Equals(b.StringValue("package"), StringComparison.OrdinalIgnoreCase)))
            .ToArray();
        if (blockersRequiringAi.Length == 0)
        {
            if (changes.Any(c => c.StringValue("status") == "applied")) return RemediationAttempt.AppliedResult(changes);
            if (changes.Count > 0) return RemediationAttempt.Manual(new JsonObject
            {
                ["requiresHumanReview"] = true,
                ["reason"] = "No deterministic validation-driven third-party remediation could be safely applied.",
                ["failedCommand"] = validation.StringValue("buildVerificationCommand", "npm run build"),
                ["lastError"] = Tail(validation.StringValue("output", validation.StringValue("errors"))),
                ["rejectedChanges"] = new JsonArray(changes.Select(c => (JsonNode?)c.DeepClone()).ToArray())
            }, changes);
            return RemediationAttempt.NotAttempted();
        }

        if (!config.Ai.UseAi || ai is null || promptLoader is null)
        {
            if (!string.IsNullOrWhiteSpace(shimRejectedReason))
            {
                changes.Add(new JsonObject
                {
                    ["attempt"] = attempt,
                    ["mode"] = "deterministic",
                    ["status"] = "rejected",
                    ["failureCause"] = "validation_proven_third_party_blocker",
                    ["failureCategory"] = "type_declaration",
                    ["packageName"] = "ngx-pinch-zoom",
                    ["action"] = "shim_types_only",
                    ["rejectedReason"] = shimRejectedReason
                });
            }
            return changes.Count == 0 ? RemediationAttempt.NotAttempted() : RemediationAttempt.Manual(new JsonObject
            {
                ["requiresHumanReview"] = true,
                ["reason"] = "No deterministic validation-driven third-party remediation could be safely applied for unresolved blockers.",
                ["failedCommand"] = validation.StringValue("buildVerificationCommand", "npm run build"),
                ["lastError"] = Tail(validation.StringValue("output", validation.StringValue("errors"))),
                ["unresolvedPackages"] = new JsonArray(blockersRequiringAi.Select(b => (JsonNode?)JsonValue.Create(b.StringValue("package"))).ToArray()),
                ["rejectedChanges"] = new JsonArray(changes.Select(c => (JsonNode?)c.DeepClone()).ToArray())
            }, changes);
        }

        var packageJson = ReadJson(packageJsonPath);
        var blockerNamesForPayload = blockersRequiringAi.Select(b => b.StringValue("package")).Where(s => !string.IsNullOrWhiteSpace(s)).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var payload = new JsonObject
        {
            ["targetAngularMajor"] = hop.ToVersion,
            ["targetAngularHop"] = $"{hop.FromVersion}->{hop.ToVersion}",
            ["validationCommand"] = validation.StringValue("buildVerificationCommand", "npm run build"),
            ["validationProvenBlockers"] = new JsonArray(blockersRequiringAi.Select(b => (JsonNode?)b.DeepClone()).ToArray()),
            ["exactTypeScriptErrors"] = new JsonArray(ExtractTypeScriptErrorLines(validation.StringValue("output", validation.StringValue("errors"))).Select(e => (JsonNode?)JsonValue.Create(e)).ToArray()),
            ["packageJson"] = PackageJsonSubset(packageJson, blockerNamesForPayload),
            ["rules"] = new JsonArray(
                "Return remediation only for validationProvenBlockers; do not include unrelated third-party packages.",
                "For declaration-only TS2304 missing type errors in node_modules .d.ts files, prefer a project-owned declaration shim before package upgrades.",
                "For declaration-only TS2304 errors, a project-owned type shim is allowed only when no runtime/source behavior changes are required.",
                "For Angular library incompatibilities, package.json changes are allowed only for packages present in validationProvenBlockers.",
                "Do not treat SharedModule NG6002 as root cause while node_modules package errors are present; it is cascading unless it still fails after third-party blockers are resolved.",
                "Use manual_review only when neither same-package upgrade nor declaration-only shim is safe.",
                "Do not edit business logic or node_modules.",
                "Return strict JSON only."),
            ["requiredResponseShape"] = new JsonObject
            {
                ["packageUpdates"] = new JsonArray(new JsonObject
                {
                    ["package"] = "blocked package",
                    ["currentVersion"] = "current package.json version",
                    ["version"] = "bounded npm version/range",
                    ["reason"] = "evidence-tied reason",
                    ["errorCategory"] = "third_party_angular_library_incompatibility",
                    ["expectedCodeImpact"] = "none"
                }),
                ["manualReview"] = new JsonArray()
            }
        };

        JsonObject? plan;
        try
        {
            plan = await ai!.AskAsync(config.Ai, ThirdPartyPackageRemediationPrompt(), payload.ToJsonString(JsonHelpers.SerializerOptions), cancellationToken);
        }
        catch (Exception ex)
        {
            return RemediationAttempt.Manual(new JsonObject { ["reason"] = $"AI third-party package remediation unavailable: {ex.Message}", ["failedCommand"] = validation.StringValue("buildVerificationCommand", "npm run build"), ["lastError"] = Tail(validation.StringValue("output", validation.StringValue("errors"))) });
        }

        var blockerNames = blockerNamesForPayload;
        var packageJsonChanged = false;
        foreach (var item in ThirdPartyPackageUpdateItems(plan, changes, attempt))
        {
            var packageName = item.StringValue("package");
            if (!blockerNames.Contains(packageName))
            {
                changes.Add(RejectedThirdPartyChange(item, blockers, attempt, packageName, $"AI package remediation package '{packageName}' is not one of the validation-detected blockers."));
                continue;
            }
            var action = "upgrade";
            var targetPackage = packageName;
            var targetRange = item.StringValue("version");
            if (!item.StringValue("errorCategory").Equals("third_party_angular_library_incompatibility", StringComparison.Ordinal))
            {
                changes.Add(RejectedThirdPartyChange(item, blockers, attempt, packageName, "AI package remediation errorCategory must be third_party_angular_library_incompatibility."));
                continue;
            }
            if (!item.StringValue("expectedCodeImpact").Equals("none", StringComparison.Ordinal))
            {
                changes.Add(RejectedThirdPartyChange(item, blockers, attempt, packageName, "AI package remediation expectedCodeImpact must be none."));
                continue;
            }
            if (!IsBoundedThirdPartyVersion(targetRange))
            {
                changes.Add(RejectedThirdPartyChange(item, blockers, attempt, packageName, "AI package remediation version must be a bounded version/range and must not be latest, *, x, empty, or unbounded."));
                continue;
            }
            if (IsAngularOwnedPackageName(targetPackage) && !IsAngularOwnedPackageName(packageName))
            {
                changes.Add(RejectedThirdPartyChange(item, blockers, attempt, packageName, "AI package remediation cannot update Angular framework packages for a third-party blocker."));
                continue;
            }
            var signature = $"{packageName}|{action}|{targetPackage}|{targetRange}";
            if (!failedPackagePlans.Add(signature))
            {
                changes.Add(RejectedThirdPartyChange(item, blockers, attempt, packageName, "The same failed package remediation plan was already attempted."));
                continue;
            }

            var verified = await VerifyNpmPackageTargetWithCorrectionAsync(projectPath, hop, config, item, targetPackage, targetRange, logPath, cancellationToken);
            if (verified.FinalTarget is null)
            {
                changes.Add(ThirdPartyBlockerChange(item, blockers, attempt, "failed", verified, packageName, targetPackage, targetRange));
                continue;
            }

            if (!ApplyThirdPartyPackageJsonRemediation(packageJson, packageName, targetPackage, verified.FinalTarget, action, out var before, out var after))
            {
                changes.Add(RejectedThirdPartyChange(item, blockers, attempt, packageName, $"Package.json did not contain {packageName} in a supported dependency section."));
                continue;
            }
            packageJsonChanged = true;
            var change = ThirdPartyBlockerChange(item, blockers, attempt, "applied", verified, packageName, targetPackage, verified.FinalTarget);
            change["file"] = "package.json";
            change["type"] = "package_update";
            change["before"] = before;
            change["after"] = after;
            change["businessLogicChanged"] = false;
            change["businessFile"] = false;
            changes.Add(change);
        }
        if (packageJsonChanged)
        {
            File.WriteAllText(packageJsonPath, packageJson.ToJsonString(JsonHelpers.SerializerOptions) + Environment.NewLine);
        }

        var applied = changes.Any(c => c.StringValue("status") == "applied");
        if (!applied && !string.IsNullOrWhiteSpace(shimRejectedReason))
        {
            changes.Add(new JsonObject
            {
                ["attempt"] = attempt,
                ["mode"] = "deterministic",
                ["status"] = "rejected",
                ["failureCause"] = "validation_proven_third_party_blocker",
                ["failureCategory"] = "type_declaration",
                ["packageName"] = "ngx-pinch-zoom",
                ["action"] = "shim_types_only",
                ["rejectedReason"] = shimRejectedReason
            });
        }
        var unresolvedAfterAi = blockersRequiringAi
            .Where(b => !changes.Any(c =>
                c.StringValue("status") == "applied" &&
                c.StringValue("packageName").Equals(b.StringValue("package"), StringComparison.OrdinalIgnoreCase)))
            .Select(b => b.StringValue("package"))
            .Where(p => !string.IsNullOrWhiteSpace(p))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
        if (applied && unresolvedAfterAi.Length == 0) return RemediationAttempt.AppliedResult(changes);
        return RemediationAttempt.Manual(new JsonObject
        {
            ["requiresHumanReview"] = true,
            ["reason"] = "No validation-proven third-party remediation could be safely applied for unresolved blocker packages.",
            ["failedCommand"] = validation.StringValue("buildVerificationCommand", "npm run build"),
            ["lastError"] = Tail(validation.StringValue("output", validation.StringValue("errors"))),
            ["unresolvedPackages"] = new JsonArray(unresolvedAfterAi.Select(p => (JsonNode?)JsonValue.Create(p)).ToArray()),
            ["rejectedChanges"] = new JsonArray(changes.Select(c => (JsonNode?)c.DeepClone()).ToArray())
        }, changes);
    }

    private async Task<IReadOnlyList<JsonObject>> TryApplyDeterministicThirdPartyPackageRemediationAsync(string projectPath, MigrationHop hop, MigrationConfig config, JsonObject validation, IReadOnlyList<JsonObject> blockers, int attempt, HashSet<string> failedPackagePlans, string? logPath, CancellationToken cancellationToken)
    {
        var packageJsonPath = Path.Combine(projectPath, "package.json");
        var packageJson = ReadJson(packageJsonPath);
        var changes = new List<JsonObject>();
        var packageJsonChanged = false;

        foreach (var blocker in blockers.OrderBy(b => DeterministicThirdPartyRemediationPriority(b)))
        {
            var packageName = blocker.StringValue("package");
            var candidate = DeterministicThirdPartyCandidate(blocker, hop.ToVersion);
            if (candidate is null) continue;

            if (candidate.Value.Action == "compatibility_shim")
            {
                var shim = TryApplyRuntimeCompatibilityShim(projectPath, config, validation, blocker, attempt);
                changes.Add(shim);
                continue;
            }

            var signature = $"{packageName}|{candidate.Value.Action}|{candidate.Value.TargetPackage}|{candidate.Value.TargetRange}";
            if (!failedPackagePlans.Add(signature))
            {
                changes.Add(RejectedThirdPartyChange(DeterministicThirdPartyItem(blocker, candidate.Value), blockers, attempt, packageName, "The same failed package remediation plan was already attempted."));
                continue;
            }

            var item = DeterministicThirdPartyItem(blocker, candidate.Value);
            var verified = await VerifyNpmPackageTargetWithCorrectionAsync(projectPath, hop, config, item, candidate.Value.TargetPackage, candidate.Value.TargetRange, logPath, cancellationToken);
            if (verified.FinalTarget is null)
            {
                changes.Add(ThirdPartyBlockerChange(item, blockers, attempt, "failed", verified, packageName, candidate.Value.TargetPackage, candidate.Value.TargetRange));
                continue;
            }

            if (!ApplyThirdPartyPackageJsonRemediation(packageJson, packageName, candidate.Value.TargetPackage, verified.FinalTarget, candidate.Value.Action, out var before, out var after))
            {
                changes.Add(RejectedThirdPartyChange(item, blockers, attempt, packageName, $"Package.json did not contain {packageName} in a supported dependency section."));
                continue;
            }

            packageJsonChanged = true;
            var change = ThirdPartyBlockerChange(item, blockers, attempt, "applied", verified, packageName, candidate.Value.TargetPackage, candidate.Value.Action == "npm_alias_replacement" ? $"npm:{candidate.Value.TargetPackage}@{verified.FinalTarget}" : verified.FinalTarget);
            change["file"] = "package.json";
            change["type"] = "package_update";
            change["selectedRemediation"] = candidate.Value.Strategy;
            change["before"] = before;
            change["after"] = after;
            change["businessLogicChanged"] = false;
            change["businessFile"] = false;
            change["requiresVersionVerification"] = true;
            change["manualReviewRequired"] = candidate.Value.Action == "npm_alias_replacement";
            changes.Add(change);
        }

        if (packageJsonChanged)
        {
            File.WriteAllText(packageJsonPath, packageJson.ToJsonString(JsonHelpers.SerializerOptions) + Environment.NewLine);
        }

        return changes;
    }

    private static int DeterministicThirdPartyRemediationPriority(JsonObject blocker) =>
        blocker.StringValue("package").Equals("ng6-toastr-notifications", StringComparison.OrdinalIgnoreCase) ? 100 : 0;

    private static ThirdPartyRemediationCandidate? DeterministicThirdPartyCandidate(JsonObject blocker, int targetMajor)
    {
        if (targetMajor != 16) return null;
        var packageName = blocker.StringValue("package");
        var category = blocker.StringValue("errorCategory");
        if (packageName.Equals("ngx-pinch-zoom", StringComparison.OrdinalIgnoreCase) &&
            category.Equals("third_party_declaration_type_missing", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return packageName switch
        {
            "ngx-bootstrap" => new("same_package_upgrade", "upgrade", "ngx-bootstrap", "^11.0.2", "Validation proved the installed ngx-bootstrap package uses Angular metadata APIs removed before Angular 16."),
            "ngx-color-picker" => new("same_package_upgrade", "upgrade", "ngx-color-picker", "^16.0.0", "Validation proved the installed ngx-color-picker package imports Angular APIs removed in Angular 16."),
            "ngx-slick-carousel" => new("same_package_upgrade", "upgrade", "ngx-slick-carousel", "15.0.0", "Validation proved the installed ngx-slick-carousel package is not Ivy-compatible for this Angular hop."),
            "ngx-pagination" => new("same_package_upgrade", "upgrade", "ngx-pagination", "^6.0.3", "Validation proved the installed ngx-pagination package is not Ivy-compatible for this Angular hop."),
            "angular-user-idle" => new("same_package_upgrade", "upgrade", "angular-user-idle", "^4.0.0", "Validation proved the installed angular-user-idle package is not Ivy-compatible for this Angular hop."),
            "ngx-pinch-zoom" => new("npm_alias_replacement", "npm_alias_replacement", "@mtnair/ngx-pinch-zoom", "2.5.12", "Validation proved ngx-pinch-zoom module metadata is incompatible; the verified alias preserves the original package name through npm aliasing."),
            "ng6-toastr-notifications" => new("compatibility_shim", "compatibility_shim", "ng6-toastr-notifications", "", "Validation proved ng6-toastr-notifications imports obsolete Angular runtime APIs and no deterministic same-package Angular 16 target is known."),
            _ => null
        };
    }

    private static JsonObject DeterministicThirdPartyItem(JsonObject blocker, ThirdPartyRemediationCandidate candidate) => new()
    {
        ["packageName"] = blocker.StringValue("package"),
        ["currentVersion"] = blocker.StringValue("currentVersion"),
        ["detectedErrorCategory"] = blocker.StringValue("errorCategory"),
        ["action"] = candidate.Action,
        ["targetPackageName"] = candidate.TargetPackage,
        ["targetVersionRange"] = candidate.TargetRange,
        ["reason"] = candidate.Reason,
        ["expectedCodeImpact"] = candidate.Action == "npm_alias_replacement" ? "package alias" : "none",
        ["requiresSourceChanges"] = false,
        ["sourceChangeScope"] = "package_json_only",
        ["confidence"] = 1.0,
        ["validationCommand"] = blocker.StringValue("validationCommand", "npm run build")
    };

    private static JsonObject TryApplyRuntimeCompatibilityShim(string projectPath, MigrationConfig config, JsonObject validation, JsonObject blocker, int attempt)
    {
        if (!config.SourceCompatibilityRemediation)
        {
            return new JsonObject
            {
                ["attempt"] = attempt,
                ["mode"] = "deterministic",
                ["status"] = "rejected",
                ["failureCategory"] = "third_party_angular_incompatibility",
                ["failureCause"] = "validation_proven_third_party_blocker",
                ["packageName"] = blocker.StringValue("package"),
                ["currentVersion"] = blocker.StringValue("currentVersion"),
                ["selectedRemediation"] = "compatibility_shim",
                ["action"] = "compatibility_shim",
                ["reason"] = "Runtime compatibility shim is blocked because sourceCompatibilityRemediation=false.",
                ["rejectedReason"] = "Enable sourceCompatibilityRemediation to allow project-owned runtime import-surface shims.",
                ["manualReviewRequired"] = true,
                ["installResult"] = "not run",
                ["buildRetryResult"] = "not run",
                ["evidence"] = blocker["evidence"]?.DeepClone()
            };
        }

        var shimFile = "src/app/compat/ng6-toastr-notifications.ts";
        var full = Path.Combine(projectPath, shimFile.Replace('/', Path.DirectorySeparatorChar));
        Directory.CreateDirectory(Path.GetDirectoryName(full)!);
        var before = File.Exists(full) ? File.ReadAllText(full) : "";
        var after = Ng6ToastrCompatibilityShimSource();
        File.WriteAllText(full, after);
        var tsconfigChanged = EnsureTsconfigPathAlias(projectPath, "ng6-toastr-notifications", ["src/app/compat/ng6-toastr-notifications"]);

        return new JsonObject
        {
            ["attempt"] = attempt,
            ["mode"] = "deterministic",
            ["status"] = "applied",
            ["file"] = shimFile,
            ["type"] = "compatibility_shim",
            ["failureCategory"] = "third_party_angular_incompatibility",
            ["failureCause"] = "validation_proven_third_party_blocker",
            ["packageName"] = blocker.StringValue("package"),
            ["currentVersion"] = blocker.StringValue("currentVersion"),
            ["selectedRemediation"] = "compatibility_shim",
            ["action"] = "compatibility_shim",
            ["reason"] = "Added a project-owned import-surface compatibility shim for an abandoned Angular package after validation proved the package blocks Angular 16.",
            ["before"] = before,
            ["after"] = after,
            ["businessLogicChanged"] = false,
            ["businessFile"] = false,
            ["sourceCodeImpact"] = true,
            ["validationDriven"] = true,
            ["runtimeCodeChanged"] = true,
            ["manualReviewRequired"] = true,
            ["sourceCompatibilityCodeAdded"] = true,
            ["tsconfigPathAliasAdded"] = tsconfigChanged,
            ["installResult"] = "not required",
            ["buildRetryResult"] = "pending",
            ["validationCommand"] = validation.StringValue("buildVerificationCommand", "npm run build"),
            ["evidence"] = blocker["evidence"]?.DeepClone(),
            ["reviewNote"] = "Compatibility shim preserves ToastrModule and ToastrManager import names used by the app; manual review is required because runtime notification behavior is represented by source compatibility code."
        };
    }

    private static string Ng6ToastrCompatibilityShimSource() => """
import { Injectable, ModuleWithProviders, NgModule } from '@angular/core';

export interface ToastrOptions {
  position?: string;
  showCloseButton?: boolean;
  animate?: string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class ToastrManager {
  successToastr(message: string, title?: string, options?: ToastrOptions): void {
    this.log('success', message, title, options);
  }

  errorToastr(message: string, title?: string, options?: ToastrOptions): void {
    this.log('error', message, title, options);
  }

  warningToastr(message: string, title?: string, options?: ToastrOptions): void {
    this.log('warn', message, title, options);
  }

  infoToastr(message: string, title?: string, options?: ToastrOptions): void {
    this.log('info', message, title, options);
  }

  private log(level: 'success' | 'error' | 'warn' | 'info', message: string, title?: string, options?: ToastrOptions): void {
    const text = title ? `${title}: ${message}` : message;
    const log = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    log(text, options ?? {});
  }
}

@NgModule({})
export class ToastrModule {
  static forRoot(): ModuleWithProviders<ToastrModule> {
    return {
      ngModule: ToastrModule,
      providers: [ToastrManager]
    };
  }
}
""";

    private static bool EnsureTsconfigPathAlias(string projectPath, string importName, string[] targets)
    {
        var path = Path.Combine(projectPath, "tsconfig.json");
        if (!File.Exists(path)) return false;
        JsonObject config;
        try
        {
            config = JsonNode.Parse(File.ReadAllText(path), documentOptions: new JsonDocumentOptions { CommentHandling = JsonCommentHandling.Skip, AllowTrailingCommas = true })?.AsObject() ?? new JsonObject();
        }
        catch
        {
            return false;
        }

        var compilerOptions = config["compilerOptions"] as JsonObject;
        if (compilerOptions is null)
        {
            compilerOptions = new JsonObject();
            config["compilerOptions"] = compilerOptions;
        }
        var paths = compilerOptions["paths"] as JsonObject;
        if (paths is null)
        {
            paths = new JsonObject();
            compilerOptions["paths"] = paths;
        }
        var desired = new JsonArray(targets.Select(t => (JsonNode?)JsonValue.Create(t)).ToArray());
        if (paths[importName] is JsonArray existing && existing.Select(v => v?.ToString() ?? "").SequenceEqual(targets, StringComparer.OrdinalIgnoreCase)) return false;
        paths[importName] = desired;
        File.WriteAllText(path, config.ToJsonString(JsonHelpers.SerializerOptions) + Environment.NewLine);
        return true;
    }

    private async Task<NpmPackageTargetResolution> VerifyNpmPackageTargetWithCorrectionAsync(string projectPath, MigrationHop hop, MigrationConfig config, JsonObject item, string targetPackage, string targetRange, string? logPath, CancellationToken cancellationToken)
    {
        var role = "third-party";
        var initial = await ResolveNpmPackageTargetAsync(targetPackage, hop.ToVersion, targetRange, role, config, projectPath, logPath, cancellationToken);
        if (initial.FinalTarget is not null || initial.ValidationResult is not "E404" and not "invalidRangeSyntax") return initial;
        try
        {
            var payload = new JsonObject
            {
                ["targetAngularMajor"] = hop.ToVersion,
                ["failedPackageRemediation"] = item.DeepClone(),
                ["npmVerificationFailure"] = new JsonObject { ["packageName"] = targetPackage, ["targetVersionRange"] = targetRange, ["npmError"] = initial.NpmError },
                ["requiredResponseShape"] = new JsonObject { ["targetPackageName"] = targetPackage, ["targetVersionRange"] = "single corrected version/range" }
            };
            var corrected = await ai!.AskAsync(config.Ai, ThirdPartyPackageRemediationPrompt(), payload.ToJsonString(JsonHelpers.SerializerOptions), cancellationToken);
            if (corrected is null) return initial;
            var correctedPackage = corrected.StringValue("targetPackageName", targetPackage);
            var correctedRange = corrected.StringValue("targetVersionRange");
            if (string.IsNullOrWhiteSpace(correctedRange)) return initial;
            var second = await ResolveNpmPackageTargetAsync(correctedPackage, hop.ToVersion, correctedRange, role, config, projectPath, logPath, cancellationToken);
            return second.FinalTarget is null ? initial : second with { AiReRecommendedVersion = correctedRange, AiReRecommendationUsed = true, InitialVerificationResult = initial.ValidationResult };
        }
        catch
        {
            return initial;
        }
    }

    private static bool ApplyThirdPartyPackageJsonRemediation(JsonObject packageJson, string packageName, string targetPackage, string targetVersion, string action, out string before, out string after)
    {
        before = "";
        after = "";
        var section = DependencySection(packageJson, packageName) ?? "dependencies";
        if (packageJson[section] is not JsonObject deps) return false;
        var current = deps[packageName]?.ToString() ?? "";
        before = $"\"{packageName}\": \"{current}\"";
        if (action == "npm_alias_replacement" && !packageName.Equals(targetPackage, StringComparison.OrdinalIgnoreCase))
        {
            deps[packageName] = $"npm:{targetPackage}@{targetVersion}";
            after = $"\"{packageName}\": \"npm:{targetPackage}@{targetVersion}\"";
            return true;
        }
        if (action == "replace" && !packageName.Equals(targetPackage, StringComparison.OrdinalIgnoreCase))
        {
            deps.Remove(packageName);
            deps[targetPackage] = targetVersion;
            after = $"\"{targetPackage}\": \"{targetVersion}\"";
            return true;
        }
        if (action == "remove_if_unused")
        {
            deps.Remove(packageName);
            after = "";
            return true;
        }
        if (!deps.ContainsKey(packageName)) return false;
        deps[packageName] = targetVersion;
        after = $"\"{packageName}\": \"{targetVersion}\"";
        return true;
    }

    private static JsonObject PackageJsonSubset(JsonObject packageJson, IReadOnlySet<string> packageNames)
    {
        var subset = new JsonObject();
        foreach (var section in new[] { "dependencies", "devDependencies", "optionalDependencies" })
        {
            if (packageJson[section] is not JsonObject deps) continue;
            var filtered = new JsonObject();
            foreach (var packageName in packageNames)
            {
                if (deps.TryGetPropertyValue(packageName, out var version)) filtered[packageName] = version?.DeepClone();
            }
            if (filtered.Count > 0) subset[section] = filtered;
        }
        return subset;
    }

    private static IEnumerable<JsonObject> PlanItems(JsonObject? plan) => plan is null ? [] : plan["packageRemediations"]?.AsArray()?.OfType<JsonObject>() ?? [];

    private static IEnumerable<JsonObject> ThirdPartyPackageUpdateItems(JsonObject? plan, List<JsonObject> changes, int attempt)
    {
        if (plan?["packageUpdates"] is JsonArray updates)
        {
            return updates.OfType<JsonObject>().Select(NormalizeThirdPartyPackageUpdate).ToArray();
        }

        if (plan?["remediations"] is JsonArray remediations)
        {
            var normalized = remediations.OfType<JsonObject>().Select(NormalizeLegacyThirdPartyRemediation).ToArray();
            if (normalized.Length > 0)
            {
                changes.Add(new JsonObject
                {
                    ["attempt"] = attempt,
                    ["mode"] = "ai",
                    ["status"] = "warning",
                    ["schemaWarning"] = "AI returned legacy remediations schema; normalized defensive fallback fields to packageUpdates schema."
                });
            }
            return normalized;
        }

        return PlanItems(plan).Select(NormalizeLegacyThirdPartyRemediation).ToArray();
    }

    private static JsonObject NormalizeThirdPartyPackageUpdate(JsonObject item) => new()
    {
        ["package"] = item.StringValue("package"),
        ["currentVersion"] = item.StringValue("currentVersion"),
        ["version"] = item.StringValue("version"),
        ["reason"] = item.StringValue("reason"),
        ["errorCategory"] = item.StringValue("errorCategory"),
        ["expectedCodeImpact"] = item.StringValue("expectedCodeImpact")
    };

    private static JsonObject NormalizeLegacyThirdPartyRemediation(JsonObject item) => new()
    {
        ["package"] = item.StringValue("packageName", item.StringValue("targetPackageName")),
        ["currentVersion"] = item.StringValue("currentVersion"),
        ["version"] = item.StringValue("version", item.StringValue("targetVersionRange")),
        ["reason"] = item.StringValue("reason"),
        ["errorCategory"] = item.StringValue("errorCategory", item.StringValue("detectedErrorCategory", "third_party_angular_library_incompatibility")),
        ["expectedCodeImpact"] = item.StringValue("expectedCodeImpact", "none")
    };

    private static bool IsBoundedThirdPartyVersion(string version)
    {
        var trimmed = version.Trim();
        if (trimmed is "" or "*" || trimmed.Equals("latest", StringComparison.OrdinalIgnoreCase)) return false;
        if (Regex.IsMatch(trimmed, @"(^|[.\s])(?:x|X|\*)($|[.\s])")) return false;
        return Regex.IsMatch(trimmed, @"^[~^]?\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$");
    }

    private static JsonObject ThirdPartyBlockerChange(JsonObject item, IReadOnlyList<JsonObject> blockers, int attempt, string status, NpmPackageTargetResolution verified, string packageName, string targetPackage, string selectedTarget)
    {
        var blocker = blockers.FirstOrDefault(b => b.StringValue("package").Equals(packageName, StringComparison.OrdinalIgnoreCase));
        return new JsonObject
        {
            ["attempt"] = attempt,
            ["mode"] = "ai",
            ["status"] = status,
            ["failureCategory"] = blocker?.StringValue("errorCategory", "third_party_angular_library_incompatibility") ?? "third_party_angular_library_incompatibility",
            ["failureCause"] = "validation_proven_third_party_blocker",
            ["packageName"] = packageName,
            ["currentVersion"] = item.StringValue("currentVersion", blocker?.StringValue("currentVersion") ?? ""),
            ["detectedErrorCategory"] = item.StringValue("errorCategory", item.StringValue("detectedErrorCategory", "third_party_angular_library_incompatibility")),
            ["action"] = item.StringValue("action", "upgrade"),
            ["targetPackageName"] = targetPackage,
            ["targetVersionRange"] = selectedTarget,
            ["reason"] = item.StringValue("reason"),
            ["expectedCodeImpact"] = item.StringValue("expectedCodeImpact"),
            ["requiresSourceChanges"] = item.BoolValue("requiresSourceChanges"),
            ["sourceChangeScope"] = item.StringValue("sourceChangeScope"),
            ["confidence"] = item["confidence"]?.DeepClone() ?? 0,
            ["validationCommand"] = item.StringValue("validationCommand", "npm run build"),
            ["evidence"] = blocker?["evidence"]?.DeepClone(),
            ["npmVerificationCommand"] = verified.VerificationCommand,
            ["npmVerificationResult"] = verified.VerificationResult,
            ["rejectedReason"] = status == "applied" ? "" : verified.FallbackReason,
            ["finalSelected"] = verified.FinalTarget ?? "",
            ["installResult"] = "pending",
            ["buildRetryResult"] = "pending"
        };
    }

    private static JsonObject RejectedThirdPartyChange(JsonObject item, IReadOnlyList<JsonObject> blockers, int attempt, string packageName, string reason)
    {
        var blocker = blockers.FirstOrDefault(b => b.StringValue("package").Equals(packageName, StringComparison.OrdinalIgnoreCase));
        return new JsonObject
        {
            ["attempt"] = attempt,
            ["mode"] = "ai",
            ["status"] = "rejected",
            ["failureCategory"] = blocker?.StringValue("errorCategory", item.StringValue("errorCategory", item.StringValue("detectedErrorCategory", "third_party_angular_library_incompatibility"))) ?? item.StringValue("errorCategory", item.StringValue("detectedErrorCategory", "third_party_angular_library_incompatibility")),
            ["failureCause"] = "validation_proven_third_party_blocker",
            ["packageName"] = packageName,
            ["currentVersion"] = item.StringValue("currentVersion", blocker?.StringValue("currentVersion") ?? ""),
            ["detectedErrorCategory"] = item.StringValue("errorCategory", item.StringValue("detectedErrorCategory", blocker?.StringValue("errorCategory", "") ?? "")),
            ["action"] = item.StringValue("action", "upgrade"),
            ["targetPackageName"] = item.StringValue("targetPackageName", item.StringValue("package", packageName)),
            ["targetVersionRange"] = item.StringValue("version", item.StringValue("targetVersionRange")),
            ["reason"] = item.StringValue("reason"),
            ["rejectedReason"] = reason,
            ["validationCommand"] = item.StringValue("validationCommand", "npm run build"),
            ["evidence"] = blocker?["evidence"]?.DeepClone(),
            ["installResult"] = "not run",
            ["buildRetryResult"] = "not run"
        };
    }

    private static bool TryApplyVisibilityStateTypeShim(string projectPath, JsonObject validation, IReadOnlyList<JsonObject> blockers, int attempt, out JsonObject change, out string rejectedReason)
    {
        change = new JsonObject();
        rejectedReason = "";
        var output = validation.StringValue("output", validation.StringValue("errors"));
        var blocker = blockers.FirstOrDefault(b =>
            b.StringValue("package").Equals("ngx-pinch-zoom", StringComparison.OrdinalIgnoreCase) &&
            b.StringValue("errorCategory").Equals("third_party_declaration_type_missing", StringComparison.OrdinalIgnoreCase));
        if (blocker is null) return false;

        var files = VisibilityStateDiagnosticFiles(output);
        if (files.Count == 0)
        {
            rejectedReason = "No exact TS2304 Cannot find name 'VisibilityState' diagnostic was found.";
            return false;
        }
        if (files.Any(f => !f.StartsWith("node_modules/ngx-pinch-zoom/", StringComparison.OrdinalIgnoreCase) || !f.EndsWith(".d.ts", StringComparison.OrdinalIgnoreCase)))
        {
            rejectedReason = "VisibilityState diagnostic was not isolated to ngx-pinch-zoom declaration files.";
            return false;
        }
        if (ProjectVisibilityStateDiagnosticsExist(output))
        {
            rejectedReason = "VisibilityState diagnostic also appears in project business code.";
            return false;
        }

        var shimFile = SelectVisibilityStateShimFile(projectPath);
        if (shimFile is null)
        {
            rejectedReason = "No writable tsconfig.app.json or tsconfig.json was found for including a project-owned VisibilityState .d.ts shim.";
            return false;
        }

        var full = Path.Combine(projectPath, shimFile.Replace('/', Path.DirectorySeparatorChar));
        Directory.CreateDirectory(Path.GetDirectoryName(full)!);
        var declaration = "type VisibilityState = \"visible\" | \"hidden\" | \"collapse\" | \"inherit\" | \"initial\" | \"unset\";";
        var before = File.Exists(full) ? File.ReadAllText(full) : "";
        if (!before.Contains("type VisibilityState", StringComparison.Ordinal))
        {
            var prefix = string.IsNullOrWhiteSpace(before) ? "" : before.TrimEnd() + Environment.NewLine + Environment.NewLine;
            File.WriteAllText(full, prefix + declaration + Environment.NewLine);
        }
        EnsureVisibilityStateShimIncluded(projectPath, shimFile);

        change = new JsonObject
        {
            ["attempt"] = attempt,
            ["mode"] = "deterministic",
            ["status"] = "applied",
            ["file"] = shimFile,
            ["type"] = "type_shim",
            ["failureCategory"] = "type_declaration",
            ["failureCause"] = "validation_proven_third_party_blocker",
            ["packageName"] = "ngx-pinch-zoom",
            ["currentVersion"] = blocker.StringValue("currentVersion"),
            ["action"] = "shim_types_only",
            ["reason"] = "Adds a project-owned ambient type used only by ngx-pinch-zoom declaration files.",
            ["before"] = before,
            ["after"] = File.ReadAllText(full),
            ["businessLogicChanged"] = false,
            ["businessFile"] = false,
            ["sourceCodeImpact"] = false,
            ["validationDriven"] = true,
            ["manualReviewRequired"] = false,
            ["runtimeCodeChanged"] = false,
            ["validationCommand"] = validation.StringValue("buildVerificationCommand", "npm run build"),
            ["evidence"] = blocker["evidence"]?.DeepClone(),
            ["installResult"] = "not required",
            ["buildRetryResult"] = "pending"
        };
        return true;
    }

    private static IReadOnlyList<string> VisibilityStateDiagnosticFiles(string output) =>
        Regex.Matches(output, @"(?:Error:\s*)?(?<file>[^:\r\n]+):\d+:\d+\s+-\s+error\s+TS2304:\s+Cannot find name 'VisibilityState'", RegexOptions.IgnoreCase)
            .Select(m => NormalizeRelativePath(m.Groups["file"].Value.Trim()))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

    private static bool ProjectVisibilityStateDiagnosticsExist(string output) =>
        VisibilityStateDiagnosticFiles(output).Any(f => !f.StartsWith("node_modules/", StringComparison.OrdinalIgnoreCase));

    private static IReadOnlyList<string> ExtractTypeScriptErrorLines(string output) =>
        output.Split(["\r\n", "\n"], StringSplitOptions.RemoveEmptyEntries)
            .Where(line => line.Contains("error TS", StringComparison.OrdinalIgnoreCase))
            .Select(line => line.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(20)
            .ToArray();

    private static string? SelectVisibilityStateShimFile(string projectPath)
    {
        var candidates = new[] { "src/types/third-party-compat.d.ts", "types/third-party-compat.d.ts" };
        foreach (var existing in candidates.Where(c => File.Exists(Path.Combine(projectPath, c.Replace('/', Path.DirectorySeparatorChar)))))
        {
            if (TsConfigIncludesFile(projectPath, existing)) return existing;
        }
        if (TsConfigIncludesFile(projectPath, candidates[0])) return candidates[0];
        if (TsConfigIncludesFile(projectPath, candidates[1])) return candidates[1];
        return new[] { "tsconfig.app.json", "tsconfig.json" }.Any(config => File.Exists(Path.Combine(projectPath, config)))
            ? candidates[0]
            : null;
    }

    private static bool TsConfigIncludesFile(string projectPath, string relativeFile)
    {
        foreach (var configFile in new[] { "tsconfig.app.json", "tsconfig.json" })
        {
            var path = Path.Combine(projectPath, configFile);
            if (!File.Exists(path)) continue;
            try
            {
                var config = ReadJson(path);
                var normalized = NormalizeRelativePath(relativeFile);
                if (config["files"] is JsonArray files && files.Select(f => NormalizeRelativePath(f?.ToString() ?? "")).Any(f => f.Equals(normalized, StringComparison.OrdinalIgnoreCase))) return true;
                if (config["include"] is JsonArray include)
                {
                    var entries = include.Select(i => NormalizeRelativePath(i?.ToString() ?? "")).ToArray();
                    if (entries.Any(i => i.Equals("src/**/*.d.ts", StringComparison.OrdinalIgnoreCase))) return normalized.StartsWith("src/", StringComparison.OrdinalIgnoreCase);
                    if (entries.Any(i => i.Equals("types/**/*.d.ts", StringComparison.OrdinalIgnoreCase))) return normalized.StartsWith("types/", StringComparison.OrdinalIgnoreCase);
                    if (entries.Any(i => i.Equals(normalized, StringComparison.OrdinalIgnoreCase))) return true;
                    if (entries.Any(i => i.Equals("src/types/**/*.d.ts", StringComparison.OrdinalIgnoreCase))) return normalized.StartsWith("src/types/", StringComparison.OrdinalIgnoreCase);
                }
            }
            catch
            {
                // Ignore unreadable tsconfig here; the caller reports that no safe include was found.
            }
        }
        return false;
    }

    private static void EnsureVisibilityStateShimIncluded(string projectPath, string relativeFile)
    {
        if (TsConfigIncludesFile(projectPath, relativeFile)) return;
        foreach (var configFile in new[] { "tsconfig.app.json", "tsconfig.json" })
        {
            var path = Path.Combine(projectPath, configFile);
            if (!File.Exists(path)) continue;
            JsonObject? config;
            try
            {
                config = ReadJson(path);
            }
            catch
            {
                continue;
            }
            var include = config["include"] as JsonArray;
            if (include is null)
            {
                include = new JsonArray();
                config["include"] = include;
            }
            var entries = include.Select(i => NormalizeRelativePath(i?.ToString() ?? "")).ToArray();
            var requiredInclude = NormalizeRelativePath(relativeFile).StartsWith("types/", StringComparison.OrdinalIgnoreCase) ? "types/**/*.d.ts" : "src/**/*.d.ts";
            if (!entries.Any(i => i.Equals(requiredInclude, StringComparison.OrdinalIgnoreCase)))
            {
                include.Add(requiredInclude);
                File.WriteAllText(path, config.ToJsonString(JsonHelpers.SerializerOptions) + Environment.NewLine);
            }
            return;
        }
    }

    private static string NormalizeThirdPartyAction(string action) => action switch
    {
        "upgrade_same_package" => "upgrade",
        "npm_alias_replacement" or "upgrade" or "replace" or "remove_if_unused" or "shim_types_only" or "manual_review" => action,
        "manualReview" => "manual_review",
        _ => "manual_review"
    };

    private static string ThirdPartyPackageRemediationPrompt() => """
Return strict JSON only. You are selecting package remediation for Angular validation-proven third-party blockers.
Schema: {"packageUpdates":[{"package":"","currentVersion":"","version":"","reason":"","errorCategory":"third_party_angular_library_incompatibility","expectedCodeImpact":"none"}],"manualReview":[]}
Only include packages listed in validationProvenBlockers. For each Angular library incompatibility, upgrade the same package only. version must be a bounded npm version/range, not latest, *, x, empty, or unbounded. expectedCodeImpact must be none. Do not edit business logic. Do not edit source files. Do not edit node_modules. Do not propose unrelated dependencies. Do not use remediations, packageName, targetPackageName, or targetVersionRange.
""";

    private IReadOnlyList<JsonObject> ValidationCommands(JsonObject manifest)
    {
        var manager = manifest.StringValue("packageManager", "npm");
        var scripts = manifest["scripts"]?.AsObject() ?? new JsonObject();
        var commands = new List<JsonObject>();
        if (scripts.ContainsKey("test")) commands.Add(new JsonObject { ["description"] = "test validation", ["command"] = new JsonArray(ScriptCommand(manager, "test").Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()) });
        else commands.Add(new JsonObject { ["description"] = "test validation", ["skip"] = true, ["reason"] = "No test script found." });
        return commands;
    }

    private async Task<BuildVerificationResult> RunBuildVerificationCommandAsync(string projectPath, JsonObject manifest, IProgressReporter? progress, string? stage, string? logPath, int? timeoutSeconds, int? idleTimeoutSeconds, CancellationToken cancellationToken, bool preferLocalAngularCliBuild = false)
    {
        progress?.Stage(stage ?? "Validation", "Running build verification before next Angular hop.");
        var command = ResolveBuildVerificationCommand(projectPath, manifest, preferLocalAngularCliBuild);
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

    private static BuildVerificationCommand? ResolveBuildVerificationCommand(string projectPath, JsonObject manifest, bool preferLocalAngularCliBuild = false)
    {
        var scripts = manifest["scripts"]?.AsObject() ?? new JsonObject();
        var localCli = LocalAngularCliBuildCommand(projectPath);
        if (preferLocalAngularCliBuild && localCli is not null) return localCli;
        if (scripts.ContainsKey("build")) return new BuildVerificationCommand(["npm", "run", "build"], "npm-script");
        return localCli;
    }

    private static BuildVerificationCommand? LocalAngularCliBuildCommand(string projectPath)
    {
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
    private static Dictionary<string, string> AllDependencies(JsonObject data)
    {
        var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var section in new[] { "dependencies", "devDependencies", "optionalDependencies" })
        {
            foreach (var item in data[section]?.AsObject() ?? [])
            {
                result[item.Key] = item.Value?.ToString() ?? "";
            }
        }
        return result;
    }
    private static int? MajorVersion(string? version) => Regex.Match(version ?? "", @"\d+") is { Success: true } m ? int.Parse(m.Value) : null;
    private static int? MajorFromSpec(string version) => Regex.Match(version, @"\d+") is { Success: true } m ? int.Parse(m.Value) : null;
    private static int[]? VersionTuple(string? version) => Regex.Match(version ?? "", @"(\d+)(?:\.(\d+))?(?:\.(\d+))?") is { Success: true } m ? m.Groups.Values.Skip(1).Where(g => g.Success).Select(g => int.Parse(g.Value)).ToArray() : null;
    private static bool IsExactVersion(string? version) => Regex.IsMatch(version?.Trim() ?? "", @"^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$");
    private static string ExactVersionText(string? version) => Regex.Match(version?.Trim() ?? "", @"^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$") is { Success: true } m ? m.Value : "";
    private static int Compare(int[] left, int[] right) { for (var i = 0; i < Math.Max(left.Length, right.Length); i++) { var l = i < left.Length ? left[i] : 0; var r = i < right.Length ? right[i] : 0; if (l != r) return l.CompareTo(r); } return 0; }
    private static bool IsAngularPackageJsonUpdateCandidate(string name) => name.StartsWith("@angular/", StringComparison.OrdinalIgnoreCase) || name is "@angular-devkit/build-angular";
    private static string NormalizeRelativePath(string path) => path.Replace('\\', '/').TrimStart('/').Replace("../", "", StringComparison.Ordinal);
    private static bool IsUnderRoot(string path, string root)
    {
        var full = Path.GetFullPath(path).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        var rootFull = Path.GetFullPath(root).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        return full.Equals(rootFull, StringComparison.OrdinalIgnoreCase) || full.StartsWith(rootFull + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase);
    }
    private static string TypeScriptVersionForAngular(int targetMajor) => AngularCriticalDependencyPolicy.TypeScriptVersionForAngular(targetMajor);
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
            19 => Compare(tuple, [5, 5, 0]) >= 0 && Compare(tuple, [5, 9, 0]) < 0,
            20 => Compare(tuple, [5, 8, 0]) >= 0 && Compare(tuple, [6, 0, 0]) < 0,
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

    private async Task<JsonObject> VerifyValidationRemediationInstalledPackagesAsync(string projectPath, IEnumerable<JsonObject> changes, JsonArray commands, MigrationConfig config, IProgressReporter? progress, string stage, string? logPath, CancellationToken cancellationToken)
    {
        var records = new JsonArray();
        var allSatisfied = true;
        foreach (var change in ValidationRemediationPackageUpdates(changes))
        {
            var packageName = change.StringValue("packageName");
            var targetRange = change.StringValue("targetVersionRange");
            var record = InstalledPackageVerificationRecord(projectPath, change, packageName, targetRange);
            records.Add(record);
            if (record.BoolValue("verificationSkipped")) continue;
            if (record.BoolValue("satisfiesTargetRange")) continue;

            var packageSatisfied = false;
            progress?.Stage(stage, $"Installed {packageName}@{record.StringValue("installedVersion", "missing")} does not satisfy {targetRange}; running targeted npm install.");
            change["targetedInstallNeeded"] = true;
            var targeted = await RunValidationRemediationTargetedInstallAsync(projectPath, packageName, targetRange, config, progress, stage, logPath, cancellationToken);
            commands.Add(InstallCommandObject(targeted));
            record["targetedInstallNeeded"] = true;
            record["targetedInstallCommand"] = new JsonArray(targeted.Command.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray());
            record["targetedInstallSucceeded"] = targeted.Result.ReturnCode == 0;

            var afterTargeted = InstalledPackageVerificationRecord(projectPath, change, packageName, targetRange);
            record["installedVersionAfterTargetedInstall"] = afterTargeted.StringValue("installedVersion");
            record["satisfiesAfterTargetedInstall"] = afterTargeted.BoolValue("satisfiesTargetRange");
            if (targeted.Result.ReturnCode == 0 && afterTargeted.BoolValue("satisfiesTargetRange"))
            {
                packageSatisfied = true;
                ApplyPackageVerificationToChange(change, record, afterTargeted);
                allSatisfied = allSatisfied && packageSatisfied;
                continue;
            }

            var refreshed = RefreshPackageLockAndInstalledPackage(projectPath, packageName);
            record["packageLockRefreshed"] = refreshed.BoolValue("packageLockRefreshed");
            record["packageNodeModulesRemoved"] = refreshed.BoolValue("packageNodeModulesRemoved");
            change["packageLockRefreshed"] = refreshed.BoolValue("packageLockRefreshed");
            var reinstall = await RunValidationRemediationPlainInstallAsync(projectPath, config, progress, stage, logPath, cancellationToken);
            commands.Add(InstallCommandObject(reinstall));
            record["reinstallAfterLockRefreshCommand"] = new JsonArray(reinstall.Command.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray());
            record["reinstallAfterLockRefreshSucceeded"] = reinstall.Result.ReturnCode == 0;

            var afterRefresh = InstalledPackageVerificationRecord(projectPath, change, packageName, targetRange);
            record["installedVersionAfterLockRefresh"] = afterRefresh.StringValue("installedVersion");
            record["satisfiesAfterLockRefresh"] = afterRefresh.BoolValue("satisfiesTargetRange");
            ApplyPackageVerificationToChange(change, record, afterRefresh);
            packageSatisfied = reinstall.Result.ReturnCode == 0 && afterRefresh.BoolValue("satisfiesTargetRange");
            allSatisfied = allSatisfied && packageSatisfied;
        }

        return new JsonObject { ["satisfied"] = allSatisfied, ["packages"] = records };
    }

    private static IEnumerable<JsonObject> ValidationRemediationPackageUpdates(IEnumerable<JsonObject> changes) =>
        changes.Where(c =>
            c.StringValue("status") == "applied" &&
            string.Equals(Path.GetFileName(c.StringValue("file")), "package.json", StringComparison.OrdinalIgnoreCase) &&
            c.StringValue("type") == "package_update" &&
            !string.IsNullOrWhiteSpace(c.StringValue("packageName")) &&
            !string.IsNullOrWhiteSpace(c.StringValue("targetVersionRange")));

    private JsonObject InstalledPackageVerificationRecord(string projectPath, JsonObject change, string packageName, string targetRange)
    {
        var packageJsonValue = PackageJsonDependencyValue(projectPath, packageName);
        var installedVersion = InstalledPackageVersion(projectPath, packageName);
        var comparisonRange = ComparableNpmTargetRange(targetRange);
        var hasInstalledPackage = Directory.Exists(NodeModulesPackagePath(projectPath, packageName));
        var hasPackageLock = File.Exists(Path.Combine(projectPath, "package-lock.json"));
        var verificationSkipped = !hasInstalledPackage && !hasPackageLock;
        var satisfied = verificationSkipped || !string.IsNullOrWhiteSpace(installedVersion) && NpmVersionRange.Satisfies(installedVersion, comparisonRange);
        var record = new JsonObject
        {
            ["packageName"] = packageName,
            ["targetRange"] = targetRange,
            ["packageJsonValueAfterUpdate"] = packageJsonValue,
            ["installedVersion"] = installedVersion,
            ["satisfiesTargetRange"] = satisfied,
            ["verificationSkipped"] = verificationSkipped,
            ["verificationSkipReason"] = verificationSkipped ? "No local package-lock.json or node_modules package entry exists to verify in the current workspace." : "",
            ["targetedInstallNeeded"] = false,
            ["packageLockRefreshed"] = false
        };
        ApplyPackageVerificationToChange(change, record, record);
        return record;
    }

    private static void ApplyPackageVerificationToChange(JsonObject change, JsonObject record, JsonObject latest)
    {
        change["packageJsonValueAfterUpdate"] = record.StringValue("packageJsonValueAfterUpdate");
        change["installedVersionAfterNpmInstall"] = latest.StringValue("installedVersion");
        change["installedVersionSatisfiesTargetRange"] = latest.BoolValue("satisfiesTargetRange");
        change["targetedInstallNeeded"] = record.BoolValue("targetedInstallNeeded");
        change["packageLockRefreshed"] = record.BoolValue("packageLockRefreshed");
    }

    private async Task<InstallAttemptResult> RunValidationRemediationTargetedInstallAsync(string projectPath, string packageName, string targetRange, MigrationConfig config, IProgressReporter? progress, string stage, string? logPath, CancellationToken cancellationToken)
    {
        var command = new[] { "npm", "install", $"{packageName}@{targetRange}", "--legacy-peer-deps", "--no-audit", "--no-fund" };
        var decision = DeterministicDecision("legacyPeerDepsInstall", $"Targeted validation remediation install for {packageName}@{targetRange}.", "medium", true, true, "validationPackageVersionMismatch", string.Join(" ", command));
        decision = decision with { Flags = decision.Flags with { PreferOffline = false } };
        return await RunInstallAttemptAsync(projectPath, command, decision, "validation-remediation-targeted-install", true, true, 1, false, false, "", false, config, progress, stage, logPath, cancellationToken);
    }

    private async Task<InstallAttemptResult> RunValidationRemediationPlainInstallAsync(string projectPath, MigrationConfig config, IProgressReporter? progress, string stage, string? logPath, CancellationToken cancellationToken)
    {
        var command = new[] { "npm", "install", "--legacy-peer-deps", "--no-audit", "--no-fund" };
        var decision = DeterministicDecision("legacyPeerDepsInstall", "Reinstall after refreshing stale validation remediation lock/package entry.", "medium", true, true, "validationPackageVersionMismatch", string.Join(" ", command));
        decision = decision with { Flags = decision.Flags with { PreferOffline = false } };
        return await RunInstallAttemptAsync(projectPath, command, decision, "validation-remediation-lock-refresh-install", true, true, 2, false, false, "", false, config, progress, stage, logPath, cancellationToken);
    }

    private static JsonObject RefreshPackageLockAndInstalledPackage(string projectPath, string packageName)
    {
        var result = new JsonObject { ["packageLockRefreshed"] = false, ["packageNodeModulesRemoved"] = false };
        var lockPath = Path.Combine(projectPath, "package-lock.json");
        if (File.Exists(lockPath))
        {
            File.Delete(lockPath);
            result["packageLockRefreshed"] = true;
        }

        var packagePath = NodeModulesPackagePath(projectPath, packageName);
        if (Directory.Exists(packagePath) && IsUnderRoot(packagePath, Path.Combine(projectPath, "node_modules")))
        {
            Directory.Delete(packagePath, recursive: true);
            result["packageNodeModulesRemoved"] = true;
        }

        return result;
    }

    private static string PackageJsonDependencyValue(string projectPath, string packageName)
    {
        var path = Path.Combine(projectPath, "package.json");
        if (!File.Exists(path)) return "";
        var data = ReadJson(path);
        return AllDependencies(data).GetValueOrDefault(packageName, "");
    }

    private static string InstalledPackageVersion(string projectPath, string packageName)
    {
        var path = Path.Combine(NodeModulesPackagePath(projectPath, packageName), "package.json");
        if (!File.Exists(path)) return "";
        try { return ReadJson(path).StringValue("version"); }
        catch { return ""; }
    }

    private static string NodeModulesPackagePath(string projectPath, string packageName) =>
        Path.Combine([projectPath, "node_modules", .. packageName.Split('/', StringSplitOptions.RemoveEmptyEntries)]);

    private static string ComparableNpmTargetRange(string targetRange)
    {
        var alias = Regex.Match(targetRange, @"^npm:(?:@[^/\s]+/)?[^@\s]+@(?<range>.+)$", RegexOptions.IgnoreCase);
        return alias.Success ? alias.Groups["range"].Value : targetRange;
    }

    private static bool RemediationRequiresNpmInstall(IEnumerable<JsonObject> changes) =>
        changes.Any(c =>
            string.Equals(Path.GetFileName(c.StringValue("file")), "package.json", StringComparison.OrdinalIgnoreCase) &&
            c.StringValue("type") is "package_update" or "package" or "dependency");

    private static bool IsValidationProvenThirdPartyPackageRemediation(IEnumerable<JsonObject> changes) =>
        changes.Any(c =>
            string.Equals(Path.GetFileName(c.StringValue("file")), "package.json", StringComparison.OrdinalIgnoreCase) &&
            c.StringValue("type") == "package_update" &&
            c.StringValue("failureCause") == "validation_proven_third_party_blocker");

    private static JsonObject BuildAngularValidationRootCauseAnalysis(string projectPath, JsonObject validation, MigrationHop hop)
    {
        var output = validation.StringValue("output", validation.StringValue("errors"));
        var obsolete = new JsonArray();
        var incompatible = new JsonArray();
        var cascading = new JsonArray();
        if (string.IsNullOrWhiteSpace(output))
        {
            return RootCauseAnalysisObject(hop, new JsonObject(), obsolete, incompatible, cascading);
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

        return RootCauseAnalysisObject(hop, BuildStructuredFailureFacts(output, incompatible, cascading), obsolete, incompatible, cascading);
    }

    private static JsonObject RootCauseAnalysisObject(MigrationHop hop, JsonObject facts, JsonArray obsolete, JsonArray incompatible, JsonArray cascading) => new()
    {
        ["migrationHop"] = $"{hop.FromVersion} -> {hop.ToVersion}",
        ["failureCategory"] = facts.StringValue("failureCategory"),
        ["rootPackage"] = facts.StringValue("rootPackage"),
        ["rootFile"] = facts.StringValue("rootFile"),
        ["rootSymbol"] = facts.StringValue("rootSymbol"),
        ["exactErrorCode"] = facts.StringValue("exactErrorCode"),
        ["suggestedRemediationType"] = facts.StringValue("suggestedRemediationType"),
        ["cascadingAppErrors"] = facts["cascadingAppErrors"]?.DeepClone() ?? new JsonArray(),
        ["obsoleteAngularMetadata"] = obsolete,
        ["incompatibleAngularLibraryPackages"] = incompatible,
        ["cascadingLocalModuleErrors"] = cascading,
        ["genericCompatibilityAdviceSuppressed"] = obsolete.Count > 0 || incompatible.Count > 0 || cascading.Count > 0
    };

    private static JsonObject BuildStructuredFailureFacts(string output, JsonArray incompatible, JsonArray cascading)
    {
        var ts2304 = Regex.Matches(output, @"(?<file>node_modules[\\/][^\r\n:]+?\.d\.ts):\d+:\d+\s+-\s+error\s+(?<code>TS2304):\s+Cannot find name '(?<symbol>[A-Za-z_$][\w$]*)'", RegexOptions.IgnoreCase)
            .OfType<Match>()
            .Select(m => new { File = NormalizeRelativePath(m.Groups["file"].Value), Code = m.Groups["code"].Value, Symbol = m.Groups["symbol"].Value })
            .FirstOrDefault();
        if (ts2304 is not null)
        {
            return new JsonObject
            {
                ["failureCategory"] = "type_declaration",
                ["rootPackage"] = PackageNameFromNodeModuleFile(ts2304.File),
                ["rootFile"] = ts2304.File,
                ["rootSymbol"] = ts2304.Symbol,
                ["exactErrorCode"] = ts2304.Code,
                ["suggestedRemediationType"] = "type_shim",
                ["cascadingAppErrors"] = CascadingAppErrors(cascading)
            };
        }

        var ivyPackage = Regex.Match(output, @"library\s+\((?<pkg>@?[\w.-]+(?:/[\w.-]+)?)\).*?not compatible with Angular Ivy", RegexOptions.IgnoreCase | RegexOptions.Singleline);
        var ng6002NodeModule = Regex.Match(output, @"(?<file>node_modules[\\/][^\r\n:]+?\.d\.ts):\d+:\d+[\s\S]{0,400}?error\s+(?<code>NG6002):\s+'?(?<symbol>\w+Module)'?\s+does not appear to be an NgModule class", RegexOptions.IgnoreCase);
        if (ivyPackage.Success || ng6002NodeModule.Success)
        {
            var rootFile = ng6002NodeModule.Success ? NormalizeRelativePath(ng6002NodeModule.Groups["file"].Value) : "";
            var rootPackage = ivyPackage.Success ? ivyPackage.Groups["pkg"].Value : PackageNameFromNodeModuleFile(rootFile);
            return new JsonObject
            {
                ["failureCategory"] = "third_party_angular_incompatibility",
                ["rootPackage"] = rootPackage,
                ["rootFile"] = rootFile,
                ["rootSymbol"] = ng6002NodeModule.Success ? ng6002NodeModule.Groups["symbol"].Value : "",
                ["exactErrorCode"] = ng6002NodeModule.Success ? ng6002NodeModule.Groups["code"].Value : "NG6002",
                ["suggestedRemediationType"] = "package_update",
                ["cascadingAppErrors"] = CascadingAppErrors(cascading)
            };
        }

        var firstPackage = incompatible.OfType<JsonObject>().FirstOrDefault();
        return new JsonObject
        {
            ["failureCategory"] = firstPackage is null ? "" : "third_party_angular_incompatibility",
            ["rootPackage"] = firstPackage?.StringValue("package") ?? "",
            ["rootFile"] = firstPackage?["sourceFiles"]?.AsArray().FirstOrDefault()?.ToString() ?? "",
            ["rootSymbol"] = "",
            ["exactErrorCode"] = "",
            ["suggestedRemediationType"] = firstPackage is null ? "" : "package_update",
            ["cascadingAppErrors"] = CascadingAppErrors(cascading)
        };
    }

    private static JsonArray CascadingAppErrors(JsonArray cascading) =>
        new(cascading.OfType<JsonObject>().Select(c => (JsonNode?)new JsonObject
        {
            ["symbol"] = c.StringValue("symbol"),
            ["sourceFile"] = c.StringValue("sourceFile"),
            ["reason"] = c.StringValue("reason")
        }).ToArray());

    public static IReadOnlyList<JsonObject> DetectThirdPartyValidationBlockersForTesting(string projectPath, string output, MigrationHop hop) =>
        DetectThirdPartyValidationBlockers(projectPath, new JsonObject { ["output"] = output, ["errors"] = output, ["buildVerificationCommand"] = "npm run build" }, hop);

    private static IReadOnlyList<JsonObject> DetectThirdPartyValidationBlockers(string projectPath, JsonObject validation, MigrationHop hop)
    {
        var output = validation.StringValue("output", validation.StringValue("errors"));
        if (string.IsNullOrWhiteSpace(output)) return [];
        var packageJson = File.Exists(Path.Combine(projectPath, "package.json")) ? ReadJson(Path.Combine(projectPath, "package.json")) : new JsonObject();
        var result = new Dictionary<string, JsonObject>(StringComparer.OrdinalIgnoreCase);

        foreach (var file in ExtractNodeModuleFiles(output))
        {
            var packageName = PackageNameFromNodeModuleFile(file);
            if (string.IsNullOrWhiteSpace(packageName)) continue;
            if (string.IsNullOrWhiteSpace(PackageVersion(packageJson, packageName))) continue;
            var evidence = EvidenceLinesForPackage(output, packageName);
            if (!EvidenceIsThirdPartyAngularLibraryIncompatibility(evidence)) continue;
            result[packageName] = ThirdPartyBlockerObject(packageJson, packageName, hop, evidence, validation.StringValue("buildVerificationCommand", "npm run build"), file, Ng600xCodeForNodeModuleFile(output, file), ModuleSymbolForPackageEvidence(evidence));
        }

        foreach (var match in Regex.Matches(output, @"library\s+\((?<pkg>@?[\w.-]+(?:/[\w.-]+)?)\)\s+which\s+declares\s+(?<symbol>\w+Module)\s+is\s+not\s+compatible\s+with\s+Angular\s+Ivy", RegexOptions.IgnoreCase).OfType<Match>())
        {
            var packageName = match.Groups["pkg"].Value;
            if (string.IsNullOrWhiteSpace(PackageVersion(packageJson, packageName))) continue;
            var evidence = EvidenceLinesForPackage(output, packageName);
            result[packageName] = ThirdPartyBlockerObject(packageJson, packageName, hop, evidence, validation.StringValue("buildVerificationCommand", "npm run build"), ExtractNodeModuleFilesForPackage(output, packageName).FirstOrDefault() ?? "", Ng600xCodeForPackage(output, packageName), match.Groups["symbol"].Value);
        }

        foreach (var match in Regex.Matches(output, @"(?<symbol>\w+Module)\s+does not appear to be an NgModule class", RegexOptions.IgnoreCase).OfType<Match>())
        {
            var symbol = match.Groups["symbol"].Value;
            if (!TryMapThirdPartyModuleSymbol(output, symbol, out var packageName)) continue;
            if (string.IsNullOrWhiteSpace(PackageVersion(packageJson, packageName))) continue;
            var evidence = EvidenceLinesForPackage(output, packageName).Concat([match.Value]).Distinct().ToArray();
            result[packageName] = ThirdPartyBlockerObject(packageJson, packageName, hop, evidence, validation.StringValue("buildVerificationCommand", "npm run build"), ExtractNodeModuleFilesForPackage(output, packageName).FirstOrDefault() ?? "", Ng600xCodeForPackage(output, packageName), symbol);
        }

        return result.Values.OrderBy(v => v.StringValue("package"), StringComparer.OrdinalIgnoreCase).ToArray();
    }

    private static JsonObject ThirdPartyBlockerObject(JsonObject packageJson, string packageName, MigrationHop hop, IReadOnlyList<string> evidence, string validationCommand, string nodeModulesPath = "", string errorCode = "", string moduleSymbol = "")
    {
        var errorCategory = ThirdPartyErrorCategory(packageName, evidence);
        return new JsonObject
        {
            ["package"] = packageName,
            ["packageName"] = packageName,
            ["rootPackage"] = packageName,
            ["currentVersion"] = PackageVersion(packageJson, packageName),
            ["hop"] = $"{hop.FromVersion} -> {hop.ToVersion}",
            ["moduleSymbol"] = moduleSymbol,
            ["nodeModulesPath"] = nodeModulesPath,
            ["errorCode"] = errorCode,
            ["failureCategory"] = "third_party_angular_incompatibility",
            ["errorCategory"] = errorCategory,
            ["detectedErrorCategory"] = errorCategory,
            ["classification"] = "validation_proven_third_party_blocker",
            ["decision"] = "validation-proven Angular build blocker",
            ["validationCommand"] = validationCommand,
            ["evidence"] = new JsonArray(evidence.Take(8).Select(e => (JsonNode?)JsonValue.Create(e)).ToArray()),
            ["preservePolicy"] = "do_not_preserve_after_validation_proof"
        };
    }

    private static string ThirdPartyErrorCategory(string packageName, IReadOnlyList<string> evidence)
    {
        var text = string.Join("\n", evidence);
        return packageName.Equals("ngx-pinch-zoom", StringComparison.OrdinalIgnoreCase) &&
               text.Contains("TS2304", StringComparison.OrdinalIgnoreCase) &&
               text.Contains("Cannot find name 'VisibilityState'", StringComparison.OrdinalIgnoreCase) &&
               evidence.Any(e => NormalizeRelativePath(e).Contains("node_modules/ngx-pinch-zoom/", StringComparison.OrdinalIgnoreCase) && e.Contains(".d.ts", StringComparison.OrdinalIgnoreCase))
            ? "third_party_declaration_type_missing"
            : "third_party_angular_library_incompatibility";
    }

    private static bool EvidenceIsThirdPartyAngularLibraryIncompatibility(IReadOnlyList<string> evidence)
    {
        var text = string.Join("\n", evidence);
        if (ContainsIvyMetadataApi(text)) return true;
        return text.Contains("ɵɵDirectiveDefWithMeta", StringComparison.OrdinalIgnoreCase) ||
               text.Contains("ɵɵNgModuleDefWithMeta", StringComparison.OrdinalIgnoreCase) ||
               text.Contains("ɵɵFactoryDef", StringComparison.OrdinalIgnoreCase) ||
               text.Contains("ModuleWithProviders", StringComparison.OrdinalIgnoreCase) ||
               text.Contains("does not appear to be an NgModule class", StringComparison.OrdinalIgnoreCase) ||
               text.Contains("not compatible with Angular Ivy", StringComparison.OrdinalIgnoreCase) ||
               text.Contains("ReflectiveInjector", StringComparison.OrdinalIgnoreCase) ||
               text.Contains("VisibilityState", StringComparison.OrdinalIgnoreCase);
    }

    private static bool ContainsIvyMetadataApi(string text) =>
        text.Contains("\u0275\u0275DirectiveDefWithMeta", StringComparison.OrdinalIgnoreCase) ||
        text.Contains("\u0275\u0275NgModuleDefWithMeta", StringComparison.OrdinalIgnoreCase) ||
        text.Contains("\u0275\u0275FactoryDef", StringComparison.OrdinalIgnoreCase) ||
        text.Contains("ɵɵDirectiveDefWithMeta", StringComparison.OrdinalIgnoreCase) ||
        text.Contains("ɵɵNgModuleDefWithMeta", StringComparison.OrdinalIgnoreCase) ||
        text.Contains("ɵɵFactoryDef", StringComparison.OrdinalIgnoreCase) ||
        text.Contains("ÉµÉµDirectiveDefWithMeta", StringComparison.OrdinalIgnoreCase) ||
        text.Contains("ÉµÉµNgModuleDefWithMeta", StringComparison.OrdinalIgnoreCase) ||
        text.Contains("ÉµÉµFactoryDef", StringComparison.OrdinalIgnoreCase);

    private static IReadOnlyList<string> ExtractNodeModuleFiles(string output) =>
        Regex.Matches(output, @"node_modules[\\/][^\s:'""]+?(?:\.d\.ts|\.ts|\.mjs|\.js)", RegexOptions.IgnoreCase)
            .Select(m => NormalizeRelativePath(m.Value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

    private static string PackageNameFromNodeModuleFile(string file)
    {
        var parts = NormalizeRelativePath(file).Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length < 2 || !parts[0].Equals("node_modules", StringComparison.OrdinalIgnoreCase)) return "";
        if (parts[1].StartsWith("@", StringComparison.Ordinal) && parts.Length >= 3) return $"{parts[1]}/{parts[2]}";
        return parts[1];
    }

    private static IReadOnlyList<string> EvidenceLinesForPackage(string output, string packageName) =>
        output.Split(["\r\n", "\n"], StringSplitOptions.RemoveEmptyEntries)
            .Where(line => line.Contains(packageName, StringComparison.OrdinalIgnoreCase) ||
                           PreviousLineMentionsPackage(output, line, packageName) ||
                           (packageName.Equals("ngx-bootstrap", StringComparison.OrdinalIgnoreCase) && line.Contains("ɵɵ", StringComparison.OrdinalIgnoreCase)) ||
                           (packageName.Equals("ngx-pinch-zoom", StringComparison.OrdinalIgnoreCase) && line.Contains("VisibilityState", StringComparison.OrdinalIgnoreCase)))
            .Select(line => line.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(12)
            .ToArray();

    private static bool PreviousLineMentionsPackage(string output, string line, string packageName)
    {
        var index = output.IndexOf(line, StringComparison.Ordinal);
        if (index <= 0) return false;
        var prefix = output[..index].Split(["\r\n", "\n"], StringSplitOptions.RemoveEmptyEntries).TakeLast(2);
        return prefix.Any(p => p.Contains(packageName, StringComparison.OrdinalIgnoreCase));
    }

    private static bool TryMapThirdPartyModuleSymbol(string output, string symbol, out string packageName)
    {
        packageName = symbol switch
        {
            "SlickCarouselModule" => "ngx-slick-carousel",
            "PinchZoomModule" => "ngx-pinch-zoom",
            "UserIdleModule" => "angular-user-idle",
            _ => ""
        };
        if (!string.IsNullOrWhiteSpace(packageName)) return true;
        var pattern = $@"library\s+\((?<pkg>@?[\w.-]+(?:/[\w.-]+)?)\)\s+which\s+declares\s+{Regex.Escape(symbol)}";
        var match = Regex.Match(output, pattern, RegexOptions.IgnoreCase);
        if (!match.Success) return false;
        packageName = match.Groups["pkg"].Value;
        return true;
    }

    private static string PackageVersion(JsonObject packageJson, string packageName)
    {
        foreach (var section in new[] { "dependencies", "devDependencies", "optionalDependencies" })
        {
            if (packageJson[section] is JsonObject deps && deps.TryGetPropertyValue(packageName, out var version)) return version?.ToString() ?? "";
        }
        return "";
    }

    private static void AddUniqueJsonObject(JsonArray target, JsonObject item, string key)
    {
        var value = item.StringValue(key);
        if (target.OfType<JsonObject>().Any(existing => existing.StringValue(key).Equals(value, StringComparison.OrdinalIgnoreCase))) return;
        target.Add(item.DeepClone());
    }

    private static bool IsPackageUsedInProject(string projectPath, string packageName)
    {
        if (!Directory.Exists(projectPath)) return false;
        return Directory.EnumerateFiles(projectPath, "*.*", SearchOption.AllDirectories)
            .Where(path => !NormalizeRelativePath(Path.GetRelativePath(projectPath, path)).Split('/').Any(p => p is "node_modules" or ".git" or "dist" or "build" or ".angular"))
            .Where(path => path.EndsWith(".ts", StringComparison.OrdinalIgnoreCase) || path.EndsWith(".js", StringComparison.OrdinalIgnoreCase) || path.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
            .Take(5000)
            .Any(path => File.ReadAllText(path).Contains(packageName, StringComparison.OrdinalIgnoreCase));
    }

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

    private static string Ng600xCodeForPackage(string output, string packageName)
    {
        foreach (var file in ExtractNodeModuleFilesForPackage(output, packageName))
        {
            var code = Ng600xCodeForNodeModuleFile(output, file);
            if (!string.IsNullOrWhiteSpace(code)) return code;
        }
        var evidence = EvidenceLinesForPackage(output, packageName);
        return Regex.Match(string.Join("\n", evidence), @"\b(?<code>NG600[23])\b", RegexOptions.IgnoreCase) is { Success: true } match ? match.Groups["code"].Value.ToUpperInvariant() : "";
    }

    private static string Ng600xCodeForNodeModuleFile(string output, string file)
    {
        var lines = output.Split(["\r\n", "\n"], StringSplitOptions.None);
        for (var i = 0; i < lines.Length; i++)
        {
            if (!NormalizeRelativePath(lines[i]).Contains(file, StringComparison.OrdinalIgnoreCase)) continue;
            for (var j = i; j >= Math.Max(0, i - 6); j--)
            {
                var match = Regex.Match(lines[j], @"\b(?<code>NG600[23])\b", RegexOptions.IgnoreCase);
                if (match.Success) return match.Groups["code"].Value.ToUpperInvariant();
            }
            for (var j = i + 1; j < Math.Min(lines.Length, i + 6); j++)
            {
                var match = Regex.Match(lines[j], @"\b(?<code>NG600[23])\b", RegexOptions.IgnoreCase);
                if (match.Success) return match.Groups["code"].Value.ToUpperInvariant();
            }
        }
        return "";
    }

    private static string ModuleSymbolForPackageEvidence(IReadOnlyList<string> evidence)
    {
        var text = string.Join("\n", evidence);
        var declared = Regex.Match(text, @"declares\s+(?<symbol>\w+Module)", RegexOptions.IgnoreCase);
        if (declared.Success) return declared.Groups["symbol"].Value;
        var ngModuleClass = Regex.Match(text, @"['""]?(?<symbol>\w+Module)['""]?\s+does not appear to be an NgModule", RegexOptions.IgnoreCase);
        return ngModuleClass.Success ? ngModuleClass.Groups["symbol"].Value : "";
    }

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
        if (IsNgxPinchZoomVisibilityStateDeclarationFailure(text)) return "type_declaration";
        if (IsBuildOptimizerMinificationFailure(text)) return "build_optimizer_minification_failure";
        if (Regex.IsMatch(text, @"node_modules[\\/].*TS2304", RegexOptions.IgnoreCase)) return "type_declaration";
        if (Regex.IsMatch(text, @"\b(TS|CS|NG)\d+\b|compiler", RegexOptions.IgnoreCase)) return "compiler";
        return string.IsNullOrWhiteSpace(fallback) ? "unknown" : fallback;
    }

    private static bool IsNgxPinchZoomVisibilityStateDeclarationFailure(string text)
    {
        var files = VisibilityStateDiagnosticFiles(text);
        return files.Count > 0 && files.All(f => f.StartsWith("node_modules/ngx-pinch-zoom/", StringComparison.OrdinalIgnoreCase) && f.EndsWith(".d.ts", StringComparison.OrdinalIgnoreCase));
    }

    private static bool IsBuildOptimizerMinificationFailure(string text) =>
        text.Contains("Optimization error", StringComparison.OrdinalIgnoreCase) ||
        text.Contains("Unexpected token: punc", StringComparison.OrdinalIgnoreCase) ||
        text.Contains("css-optimizer-plugin", StringComparison.OrdinalIgnoreCase) ||
        text.Contains("esbuild", StringComparison.OrdinalIgnoreCase) && text.Contains("Unexpected token", StringComparison.OrdinalIgnoreCase);

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
    private static Dictionary<string, string> MigrationFileContents(string projectPath)
    {
        var excluded = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "node_modules", ".git", "dist", "build", ".angular", "coverage", "out" };
        return Directory.EnumerateFiles(projectPath, "*", SearchOption.AllDirectories)
            .Select(path => NormalizeRelativePath(Path.GetRelativePath(projectPath, path)))
            .Where(path => !path.Split('/').Any(excluded.Contains))
            .Where(IsOfficialMigrationTrackedFile)
            .ToDictionary(path => path, path => File.ReadAllText(Path.Combine(projectPath, path.Replace('/', Path.DirectorySeparatorChar))), StringComparer.OrdinalIgnoreCase);
    }
    private static IReadOnlyList<string> ChangedMigrationFiles(string projectPath, Dictionary<string, string> before)
    {
        var after = MigrationFileContents(projectPath);
        return before.Keys.Concat(after.Keys).Distinct(StringComparer.OrdinalIgnoreCase).Where(k => !before.TryGetValue(k, out var b) || !after.TryGetValue(k, out var a) || a != b).Order(StringComparer.OrdinalIgnoreCase).ToArray();
    }
    private static bool IsOfficialMigrationTrackedFile(string path)
    {
        var name = Path.GetFileName(path);
        return IsPackageOrConfigFile(path) ||
               path.EndsWith(".ts", StringComparison.OrdinalIgnoreCase) ||
               path.EndsWith(".html", StringComparison.OrdinalIgnoreCase) ||
               name.EndsWith(".config.js", StringComparison.OrdinalIgnoreCase) ||
               name.EndsWith(".config.cjs", StringComparison.OrdinalIgnoreCase) ||
               name.EndsWith(".config.mjs", StringComparison.OrdinalIgnoreCase);
    }
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

        var packageJson = ReadJson(Path.Combine(projectPath, "package.json"));
        progress?.Stage(stage, $"[Package Resolution] Angular-owned package versions before install: {AngularOwnedPackageVersionSummary(packageJson)}");
        var synchronization = ValidateSynchronizedAngularPackageVersions(packageJson);
        if (!synchronization.BoolValue("valid"))
        {
            progress?.Stage(stage, $"[Package Resolution] Failing before npm install: {synchronization.StringValue("reason")}");
            var decision = DeterministicDecision("normalInstall", "Blocked before npm install because Angular-owned framework package versions are not synchronized.", "high", false, false, "angularOwnedVersionMismatch");
            return
            [
                new InstallAttemptResult
                {
                    Decision = decision,
                    Command = NormalNpmInstallCommand,
                    Result = new CommandResult
                    {
                        ReturnCode = 1,
                        Stderr = synchronization.StringValue("reason"),
                        FailureCategory = "angularOwnedVersionMismatch",
                        FailureReason = synchronization.StringValue("reason"),
                        SuggestedNextAction = "Set Angular framework, component, compiler, compiler-cli, and language-service packages to one exact patch version before running npm install."
                    },
                    StrategySource = "pre-install-angular-owned-version-validation",
                    ManualActionRequired = true,
                    FailureClassification = new InstallFailureClassification("angularOwnedVersionMismatch", synchronization.StringValue("reason"), "Set Angular-owned framework packages to one exact synchronized version.")
                }
            ];
        }

        if (!config.Ai.UseAi || ai is null)
        {
            return await RunDeterministicCleanInstallAsync(projectPath, manifest, config, cleanInstall, progress, stage, logPath, cancellationToken);
        }

        var attempts = new List<InstallAttemptResult>();
        InstallAttemptResult? previous = null;
        var retryCounts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var peerPatchSignatures = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
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
            if (classification == "peerDependencyConflict" && HasRepeatedPeerPatchSignature(projectPath, hop.ToVersion, installAttempt, peerPatchSignatures, cleanInstall))
            {
                progress?.Stage(stage, "Dependency install reported the same peer dependency patch signature again; stopping retries for manual review.");
                return attempts;
            }
            if (classification == "packageVersionNotFound" && await TryRemediatePackageVersionNotFoundAsync(projectPath, hop, config, installAttempt, progress, stage, logPath, cancellationToken))
            {
                previous = null;
                continue;
            }
            if (classification == "peerDependencyConflict" && await TryRemediateThirdPartyPeerConflictAsync(projectPath, hop, config, installAttempt, cleanInstall, progress, stage, logPath, cancellationToken))
            {
                previous = null;
                packageJsonChanged = true;
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
        var update = new PendingPackageUpdate(packageName, section, packageJson[section]?[packageName]?.ToString() ?? "", requestedRange, requestedRange, DefaultPackageCategory(packageName), "npm install reported the selected version as unavailable.", "install-e404-remediation", 1.0, true);
        var resolution = new NpmPackageTargetResolution(null, "E404", "E404", $"npm install {packageName}@{requestedRange}", "npm install reported E404/ETARGET for this package.", installAttempt.Result.Stderr, 1, requestedRange, "", "", false, "E404");
        var alternative = await RequestAiPackageVersionAlternativeAsync(update, hop, packageJson, resolution, config, cancellationToken);
        var alternativeRange = alternative?.StringValue("recommendedVersion") ?? "";
        if (string.IsNullOrWhiteSpace(alternativeRange) || !NpmVersionRange.IsSafe(alternativeRange)) return false;

        var role = AngularPackageRole(packageName, DefaultPackageCategory(packageName));
        var verify = await ResolveNpmPackageTargetAsync(packageName, hop.ToVersion, alternativeRange, role, config, projectPath, logPath, cancellationToken);
        if (verify.ValidationResult == "E404" || verify.ValidationResult == "invalidRangeSyntax") return false;

        var finalRange = verify.FinalTarget ?? alternativeRange;
        if (packageJson[section] is not JsonObject deps) return false;
        if (AngularCriticalDependencyPolicy.RequiresSynchronizedAngularVersion(packageName))
        {
            var synchronization = ValidateSynchronizedAngularPackageVersions(packageJson);
            var selectedFrameworkVersion = synchronization.StringValue("selectedAngularFrameworkVersion");
            if (!IsExactVersion(finalRange) || !string.IsNullOrWhiteSpace(selectedFrameworkVersion) && !finalRange.Equals(selectedFrameworkVersion, StringComparison.OrdinalIgnoreCase))
            {
                progress?.Stage(stage, $"[Package Resolution] Rejected mixed-version recommendation for {packageName}: {finalRange} does not match selected Angular framework version {selectedFrameworkVersion}.");
                return false;
            }
        }
        deps[packageName] = finalRange;
        File.WriteAllText(path, packageJson.ToJsonString(JsonHelpers.SerializerOptions) + Environment.NewLine);
        progress?.Stage(stage, $"[Package Resolution] Patched {packageName} to {finalRange} after npm install version-not-found failure.");
        return true;
    }

    private async Task<bool> TryRemediateThirdPartyPeerConflictAsync(string projectPath, MigrationHop hop, MigrationConfig config, InstallAttemptResult installAttempt, JsonObject cleanInstall, IProgressReporter? progress, string stage, string? logPath, CancellationToken cancellationToken)
    {
        var path = Path.Combine(projectPath, "package.json");
        if (!File.Exists(path)) return false;
        var packageJson = ReadJson(path);
        var remediations = cleanInstall["thirdPartyPeerConflictRemediations"] as JsonArray ?? new JsonArray();
        if (cleanInstall["thirdPartyPeerConflictRemediations"] is null) cleanInstall["thirdPartyPeerConflictRemediations"] = remediations;
        var changed = false;

        foreach (var conflict in PeerConflictItems(installAttempt.PeerDependencyConflict).Where(c => c.StringValue("classification") == "thirdPartyPeerConflict"))
        {
            var requiredByPackage = conflict.StringValue("requiredByPackage");
            var requiredRange = conflict.StringValue("requiredPeerRange");
            if (!LooksAngularCoupledThirdParty(requiredByPackage)) continue;
            if (!conflict.StringValue("conflictingPackage").StartsWith("@angular/", StringComparison.OrdinalIgnoreCase)) continue;

            var section = DependencySection(packageJson, requiredByPackage);
            if (section is null || packageJson[section] is not JsonObject deps || !deps.ContainsKey(requiredByPackage)) continue;

            var currentRange = deps[requiredByPackage]?.ToString() ?? "";
            var targetRange = ThirdPartyPeerConflictTargetRange(conflict, hop.ToVersion);
            if (string.IsNullOrWhiteSpace(targetRange)) continue;

            progress?.Stage(stage, $"[Package Resolution] npm install reported Angular peer conflict from {requiredByPackage}; verifying {requiredByPackage}@{targetRange}.");
            var verified = await ResolveNpmPackageTargetAsync(requiredByPackage, hop.ToVersion, targetRange, "third-party", config, projectPath, logPath, cancellationToken);
            if (verified.FinalTarget is null || currentRange.Equals(verified.FinalTarget, StringComparison.OrdinalIgnoreCase)) continue;

            deps[requiredByPackage] = verified.FinalTarget;
            changed = true;
            remediations.Add(new JsonObject
            {
                ["packageName"] = requiredByPackage,
                ["fromVersion"] = currentRange,
                ["toVersion"] = verified.FinalTarget,
                ["section"] = section,
                ["conflictingPackage"] = conflict.StringValue("conflictingPackage"),
                ["requiredPeerRange"] = requiredRange,
                ["requiredBy"] = conflict.StringValue("requiredBy"),
                ["verificationCommand"] = verified.VerificationCommand,
                ["reason"] = "npm reported an Angular peer dependency conflict from an Angular-coupled third-party package; upgraded the package before using legacy peer deps."
            });
            progress?.Stage(stage, $"[Package Resolution] Patched {requiredByPackage} from {currentRange} to {verified.FinalTarget} after Angular peer conflict.");
        }

        if (!changed) return false;
        File.WriteAllText(path, packageJson.ToJsonString(JsonHelpers.SerializerOptions) + Environment.NewLine);
        var lockPath = Path.Combine(projectPath, "package-lock.json");
        if (File.Exists(lockPath)) File.Delete(lockPath);
        return true;
    }

    private static string ThirdPartyPeerConflictTargetRange(JsonObject conflict, int targetAngularMajor)
    {
        if (targetAngularMajor <= 0) targetAngularMajor = NpmVersionRange.Major(conflict.StringValue("plannedVersion")) ?? 0;
        var currentMajor = NpmVersionRange.Major(conflict.StringValue("requiredByVersion"));
        var requiredAngularMajor = NpmVersionRange.Major(conflict.StringValue("requiredPeerRange"));
        if (currentMajor is > 0 && requiredAngularMajor is > 0 && targetAngularMajor > 0)
        {
            var candidateMajor = currentMajor.Value + targetAngularMajor - requiredAngularMajor.Value;
            if (candidateMajor > currentMajor.Value) return $"^{candidateMajor}.0.0";
        }

        return targetAngularMajor > 0 ? $"^{targetAngularMajor}.0.0" : "";
    }

    private static int RetryCountFor(IReadOnlyList<string> command, Dictionary<string, int> retryCounts) => command.Count == 0 ? 0 : retryCounts.GetValueOrDefault(string.Join(" ", command));

    private static int IncrementRetryCountIfNeeded(string command, Dictionary<string, int> retryCounts, bool isRetry)
    {
        if (!isRetry) return retryCounts.GetValueOrDefault(command);
        var next = retryCounts.GetValueOrDefault(command) + 1;
        retryCounts[command] = next;
        return next;
    }

    private async Task<IReadOnlyList<InstallAttemptResult>> RunDeterministicCleanInstallAsync(string projectPath, JsonObject manifest, MigrationConfig config, JsonObject cleanInstall, IProgressReporter? progress, string stage, string? logPath, CancellationToken cancellationToken)
    {
        var attempts = new List<InstallAttemptResult>();
        var normal = DeterministicDecision("normalInstall", "Default clean npm install after package/config updates.", "low", false, false, "none");
        var first = await RunInstallAttemptAsync(projectPath, NormalNpmInstallCommand, normal, "deterministic-clean-install", false, false, 0, false, false, "", false, config, progress, stage, logPath, cancellationToken);
        attempts.Add(first);
        if (first.Result.ReturnCode == 0 || first.FailureClassification?.Category != "peerDependencyConflict")
        {
            return attempts;
        }

        if (await TryRemediateThirdPartyPeerConflictAsync(projectPath, new MigrationHop(0, 0, ""), config, first, cleanInstall, progress, stage, logPath, cancellationToken))
        {
            var retry = DeterministicDecision("normalInstall", "Re-running npm install after remediating an Angular-coupled third-party peer dependency conflict.", "low", true, false, "peerDependencyConflict");
            attempts.Add(await RunInstallAttemptAsync(projectPath, NormalNpmInstallCommand, retry, "deterministic-third-party-peer-remediation", false, true, 1, false, false, "", false, config, progress, stage, logPath, cancellationToken));
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
        if (IsNpmInstall(command) && File.Exists(Path.Combine(projectPath, "package.json")))
        {
            var packageJson = ReadJson(Path.Combine(projectPath, "package.json"));
            progress?.Stage(stage, $"[Package Resolution] Angular-owned package versions before install: {AngularOwnedPackageVersionSummary(packageJson)}");
            var synchronization = ValidateSynchronizedAngularPackageVersions(packageJson);
            if (!synchronization.BoolValue("valid"))
            {
                var reason = synchronization.StringValue("reason");
                progress?.Stage(stage, $"[Package Resolution] Failing before npm install: {reason}");
                return new InstallAttemptResult
                {
                    Decision = decision,
                    Command = command,
                    Result = new CommandResult
                    {
                        ReturnCode = 1,
                        Stderr = reason,
                        FailureCategory = "angularOwnedVersionMismatch",
                        FailureReason = reason,
                        SuggestedNextAction = "Set Angular framework, component, compiler, compiler-cli, and language-service packages to one exact patch version before running npm install."
                    },
                    StrategySource = source,
                    FallbackUsed = fallback,
                    RetryUsed = retry,
                    RetryCount = retryCount,
                    AiStrategyUsed = aiUsed,
                    AiStrategyAccepted = aiAccepted,
                    AiStrategyRejectedReason = rejectedReason,
                    ManualActionRequired = true,
                    FailureClassification = new InstallFailureClassification("angularOwnedVersionMismatch", reason, "Set Angular-owned framework packages to one exact synchronized version.")
                };
            }
        }

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
        result["manualReviewAutoAcceptEnabled"] = configUpdate.BoolValue("manualReviewAutoAcceptEnabled");
        result["manualReviewItemsReceived"] = configUpdate.IntValue("manualReviewItemsReceived");
        result["manualReviewAppliedChanges"] = configUpdate["manualReviewAppliedChanges"]?.DeepClone() ?? new JsonArray();
        result["manualReviewFailedChanges"] = configUpdate["manualReviewFailedChanges"]?.DeepClone() ?? new JsonArray();
        result["manualReviewChangedFiles"] = configUpdate["manualReviewChangedFiles"]?.DeepClone() ?? new JsonArray();
        result["aiStructuralChangedFiles"] = configUpdate["aiStructuralChangedFiles"]?.DeepClone() ?? new JsonArray();
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
        if (strategy == "legacyPeerDepsInstall" && IsFrameworkCriticalMismatchOutput(context.StringValue("previousInstallFailureOutput"))) return (false, "legacy-peer-deps must not hide a framework-critical dependency mismatch.");
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
        var matches = Regex.Matches(output, @"peer\s+(@?[\w./-]+)@""([^""]+)""\s+from\s+(@?[\w./-]+)@([^\s]+)", RegexOptions.IgnoreCase);
        if (matches.Count == 0) return new JsonObject { ["classification"] = "unknownPeerConflict", ["decision"] = "manualReview", ["conflicts"] = new JsonArray() };

        var data = File.Exists(Path.Combine(projectPath, "package.json")) ? ReadJson(Path.Combine(projectPath, "package.json")) : new JsonObject();
        var conflicts = new JsonArray(matches.Select(match => (JsonNode?)BuildPeerDependencyConflict(output, data, match)).ToArray());
        var primary = conflicts.OfType<JsonObject>().FirstOrDefault(c => c.StringValue("classification") != "unknownPeerConflict") ?? conflicts.OfType<JsonObject>().First();
        var resultObject = primary.DeepClone().AsObject();
        resultObject["conflicts"] = conflicts;
        return resultObject;
    }

    private static JsonObject BuildPeerDependencyConflict(string output, JsonObject packageJson, Match peer)
    {
        var package = peer.Groups[1].Value;
        var requiredRange = peer.Groups[2].Value;
        var requiredBy = peer.Groups[3].Value;
        var requiredByVersion = peer.Groups[4].Value.TrimEnd(',', ')');
        var plannedVersion = AllDependencies(packageJson).GetValueOrDefault(package, "");
        var installed = Regex.Match(output, $@"Found:\s+{Regex.Escape(package)}@([^\s]+)", RegexOptions.IgnoreCase);
        var currentInstalledVersion = installed.Success ? installed.Groups[1].Value.TrimEnd(',', ')') : "";
        var angularRuntimeMismatch = requiredBy.StartsWith("@angular/", StringComparison.OrdinalIgnoreCase) && AngularCoupledRuntimePackages.Contains(package);
        var classification = angularRuntimeMismatch ? "angularRuntimeMismatch" : LooksAngularCoupledThirdParty(requiredBy) || LooksAngularCoupledThirdParty(package) ? "thirdPartyPeerConflict" : "unknownPeerConflict";
        var decision = classification switch
        {
            "angularRuntimeMismatch" => "revisePackagePlan",
            "thirdPartyPeerConflict" => "revisePackagePlan",
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

    private static IEnumerable<JsonObject> PeerConflictItems(JsonObject? conflict)
    {
        if (conflict is null) yield break;
        if (conflict["conflicts"] is JsonArray conflicts)
        {
            foreach (var item in conflicts.OfType<JsonObject>()) yield return item;
            yield break;
        }
        yield return conflict;
    }

    private static bool HasRepeatedPeerPatchSignature(string projectPath, int targetMajor, InstallAttemptResult attempt, HashSet<string> seen, JsonObject cleanInstall)
    {
        var repeated = new JsonArray();
        foreach (var signature in PeerPatchSignatures(projectPath, targetMajor, attempt))
        {
            var parts = signature.Split('|');
            if (parts.Length == 3 && parts[1].Equals(parts[2], StringComparison.OrdinalIgnoreCase))
            {
                repeated.Add(signature);
                continue;
            }
            if (!seen.Add(signature)) repeated.Add(signature);
        }
        if (repeated.Count == 0) return false;
        cleanInstall["repeatedPeerConflictSignatures"] = repeated;
        cleanInstall["manualActionRequired"] = true;
        cleanInstall["reason"] = "The peer dependency package/currentVersion/targetVersion remediation signature repeated or was a no-op; automatic install retries stopped.";
        return true;
    }

    private static IEnumerable<string> PeerPatchSignatures(string projectPath, int targetMajor, InstallAttemptResult attempt)
    {
        var packageJson = File.Exists(Path.Combine(projectPath, "package.json")) ? ReadJson(Path.Combine(projectPath, "package.json")) : new JsonObject();
        foreach (var conflict in PeerConflictItems(attempt.PeerDependencyConflict))
        {
            var classification = conflict.StringValue("classification");
            if (classification == "angularRuntimeMismatch")
            {
                var package = conflict.StringValue("conflictingPackage");
                var target = CompatibleRuntimeVersionFromPeerRange(package, conflict.StringValue("requiredPeerRange"), targetMajor);
                if (!string.IsNullOrWhiteSpace(target)) yield return $"{package}|{AllDependencies(packageJson).GetValueOrDefault(package, "")}|{target}";
            }
            else if (classification == "thirdPartyPeerConflict")
            {
                var package = conflict.StringValue("requiredByPackage");
                var target = ThirdPartyPeerConflictTargetRange(conflict, targetMajor);
                if (!string.IsNullOrWhiteSpace(target)) yield return $"{package}|{AllDependencies(packageJson).GetValueOrDefault(package, "")}|{target}";
            }
        }
    }

    private static bool IsAngularRuntimeMismatchOutput(string output)
    {
        var peer = Regex.Match(output, @"peer\s+(@?[\w./-]+)@""([^""]+)""\s+from\s+(@?[\w./-]+)@([^\s]+)", RegexOptions.IgnoreCase);
        return peer.Success &&
               AngularCoupledRuntimePackages.Contains(peer.Groups[1].Value) &&
               peer.Groups[3].Value.StartsWith("@angular/", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsFrameworkCriticalMismatchOutput(string output)
    {
        if (IsAngularRuntimeMismatchOutput(output)) return true;
        foreach (Match peer in Regex.Matches(output, @"peer\s+(@?[\w./-]+)@""([^""]+)""\s+from\s+(@?[\w./-]+)@([^\s]+)", RegexOptions.IgnoreCase))
        {
            var package = peer.Groups[1].Value;
            var requiredBy = peer.Groups[3].Value;
            if (AngularCriticalDependencyPolicy.IsCriticalPackage(package) || AngularCriticalDependencyPolicy.IsCriticalPackage(requiredBy)) return true;
            if (package.StartsWith("@angular/", StringComparison.OrdinalIgnoreCase) || requiredBy.StartsWith("@angular/", StringComparison.OrdinalIgnoreCase)) return true;
            if (package.StartsWith("@angular-devkit/", StringComparison.OrdinalIgnoreCase) || requiredBy.StartsWith("@angular-devkit/", StringComparison.OrdinalIgnoreCase)) return true;
        }
        return false;
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

    private async Task<JsonObject> RunOfficialAngularUpdateIfRequiredAsync(string projectPath, MigrationHop hop, MigrationConfig config, JsonObject configPlan, JsonObject analysis, IProgressReporter? progress, string stage, string? logPath, CancellationToken cancellationToken, string? forceReason = null)
    {
        var trigger = DetermineOfficialAngularUpdateTrigger(projectPath, hop, configPlan, analysis, forceReason);
        if (!trigger.Required)
        {
            progress?.Stage(stage, $"Skipping official Angular update: {trigger.Reason}");
            return OfficialAngularUpdateSkipped(hop, trigger.Reason);
        }

        var cli = trigger.FullUpdate ? ValidateLocalAngularCli(projectPath, hop.ToVersion) : (Valid: true, NgPath: "npx", Reason: "");
        if (trigger.FullUpdate && !cli.Valid)
        {
            return new JsonObject
            {
                ["required"] = true,
                ["attempted"] = true,
                ["executed"] = false,
                ["skipped"] = false,
                ["triggered"] = true,
                ["triggerReason"] = trigger.Reason,
                ["failureReason"] = cli.Reason,
                ["failureCategory"] = "local-angular-cli-invalid",
                ["suggestedNextAction"] = "Run npm install successfully and verify local @angular/cli matches the target Angular major.",
                ["source"] = "local node_modules",
                ["mode"] = trigger.FullUpdate ? "full-update" : "migrate-only",
                ["command"] = new JsonArray(),
                ["commands"] = new JsonArray(),
                ["filesChangedByAngularCli"] = new JsonArray()
            };
        }

        var updateCommands = trigger.FullUpdate
            ? new[] { BuildOfficialAngularUpdateCommand(hop.ToVersion, cli.NgPath) }
            : OfficialAngularMigrateOnlyCommands(hop.FromVersion, hop.ToVersion, trigger.Packages, cli.NgPath);
        var commands = new JsonArray();
        var angularCliTimeoutSeconds = AngularCliTimeoutSeconds(config.CommandTimeoutSeconds);
        var angularCliIdleTimeoutSeconds = AngularCliIdleTimeoutSeconds(config.CommandIdleTimeoutSeconds);
        var beforeFiles = MigrationFileContents(projectPath);

        IReadOnlyList<string> lastCommand = [];
        foreach (var command in updateCommands)
        {
            lastCommand = command;
            var description = trigger.FullUpdate ? "Angular official update" : "Angular migrate-only";
            progress?.Stage(stage, $"Running official Angular update: {string.Join(" ", command)}");
            var result = await commandRunner.RunAsync(command, projectPath, timeoutSeconds: angularCliTimeoutSeconds, progress: progress, stage: stage, description: description, logPath: logPath, heartbeatIntervalSeconds: 45, idleTimeoutSeconds: angularCliIdleTimeoutSeconds, cancellationToken: cancellationToken);
            commands.Add(CommandObject(command, result));
            if (result.ReturnCode != 0)
            {
                var failure = ClassifyFailure(command, result, hop.ToVersion);
                var timedOut = IsTimeoutResult(result);
                var cliSource = trigger.FullUpdate ? "local node_modules" : $"npx @angular/cli@{hop.ToVersion}";
                return new JsonObject
                {
                    ["required"] = true,
                    ["attempted"] = true,
                    ["executed"] = false,
                    ["skipped"] = false,
                    ["triggered"] = true,
                    ["triggerReason"] = trigger.Reason,
                    ["failureReason"] = timedOut ? $"Angular CLI command timed out while running from {cliSource}." : failure.Reason,
                    ["failureCategory"] = timedOut ? "timeout" : failure.Category,
                    ["suggestedNextAction"] = timedOut ? $"Inspect the migration log and rerun migration after Angular CLI responds from {cliSource}." : failure.SuggestedNextAction,
                    ["source"] = cliSource,
                    ["mode"] = trigger.FullUpdate ? "full-update" : "migrate-only",
                    ["command"] = new JsonArray(command.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
                    ["commands"] = commands,
                    ["filesChangedByAngularCli"] = new JsonArray(ChangedMigrationFiles(projectPath, beforeFiles).Select(s => (JsonNode?)JsonValue.Create(s)).ToArray())
                };
            }
        }

        var changedFiles = ChangedMigrationFiles(projectPath, beforeFiles);
        var packageFilesChanged = changedFiles.Any(IsPackageInstallInputFile);
        return new JsonObject
        {
            ["required"] = true,
            ["attempted"] = true,
            ["executed"] = true,
            ["skipped"] = false,
            ["triggered"] = true,
            ["triggerReason"] = trigger.Reason,
            ["skippedReason"] = "",
            ["source"] = trigger.FullUpdate ? "local node_modules" : $"npx @angular/cli@{hop.ToVersion}",
            ["mode"] = trigger.FullUpdate ? "full-update" : "migrate-only",
            ["message"] = trigger.FullUpdate
                ? $"Official Angular full update executed for Angular {hop.FromVersion} -> {hop.ToVersion} using local Angular CLI."
                : $"Official Angular migrate-only executed for Angular {hop.FromVersion} -> {hop.ToVersion} using npx-pinned Angular CLI {hop.ToVersion}.",
            ["command"] = new JsonArray(lastCommand.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
            ["commands"] = commands,
            ["filesChangedByAngularCli"] = new JsonArray(changedFiles.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
            ["packageFilesChanged"] = packageFilesChanged,
            ["changeClassifications"] = ClassifyOfficialMigrationChanges(projectPath, beforeFiles, changedFiles),
            ["businessImpactingFiles"] = new JsonArray(changedFiles.Where(f => ClassifyOfficialMigrationFile(projectPath, beforeFiles, f) == MigrationChangeClassification.BusinessImpactingMigration).Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
            ["configurationMigrationFiles"] = new JsonArray(changedFiles.Where(f => ClassifyOfficialMigrationFile(projectPath, beforeFiles, f) == MigrationChangeClassification.ConfigurationMigration).Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
            ["frameworkMigrationFiles"] = new JsonArray(changedFiles.Where(f => ClassifyOfficialMigrationFile(projectPath, beforeFiles, f) == MigrationChangeClassification.FrameworkMigration).Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
            ["hasBusinessImpactingChanges"] = changedFiles.Any(f => ClassifyOfficialMigrationFile(projectPath, beforeFiles, f) == MigrationChangeClassification.BusinessImpactingMigration),
            ["acceptanceStatus"] = "pending-validation"
        };
    }

    private async Task<(IReadOnlyList<string> Command, CommandResult Result)> RunPostOfficialAngularUpdateInstallAsync(string projectPath, MigrationConfig config, IProgressReporter? progress, string stage, string? logPath, CancellationToken cancellationToken)
    {
        progress?.Stage(stage, "Running npm install after official Angular update changed package files.");
        var result = await commandRunner.RunAsync(NormalNpmInstallCommand, projectPath, timeoutSeconds: config.CommandTimeoutSeconds, progress: progress, stage: stage, description: "post-Angular-update npm install", logPath: logPath, idleTimeoutSeconds: config.CommandIdleTimeoutSeconds, cancellationToken: cancellationToken);
        return (NormalNpmInstallCommand, result);
    }

    private static int AngularCliTimeoutSeconds(int? configuredTimeoutSeconds) =>
        Math.Max(configuredTimeoutSeconds.GetValueOrDefault(), AngularCliMinimumTimeoutSeconds);

    private static int AngularCliIdleTimeoutSeconds(int? configuredIdleTimeoutSeconds) =>
        Math.Max(configuredIdleTimeoutSeconds.GetValueOrDefault(), AngularCliMinimumIdleTimeoutSeconds);

    private static bool IsTimeoutResult(CommandResult result) =>
        result.TimeoutKind is not null ||
        string.Equals(result.FailureCategory, "timeout", StringComparison.OrdinalIgnoreCase) ||
        result.FailureCategory?.Contains("timeout", StringComparison.OrdinalIgnoreCase) == true;

    private static (bool Required, bool FullUpdate, string Reason, IReadOnlyList<string> Packages) DetermineOfficialAngularUpdateTrigger(string projectPath, MigrationHop hop, JsonObject configPlan, JsonObject analysis, string? forceReason)
    {
        var hasPolicy = OfficialAngularUpdatePolicies.TryGetValue((hop.FromVersion, hop.ToVersion), out var policy);
        IReadOnlyList<string> packages = hasPolicy ? policy!.Packages : ["@angular/core", "@angular/cli"];
        var fullUpdate = hasPolicy && policy!.UseFullUpdate;
        if (fullUpdate) return (true, true, "adapter policy requires full official Angular update for this hop.", packages);
        if (!string.IsNullOrWhiteSpace(forceReason)) return (true, false, forceReason, packages);
        if (HasAngularOfficialMigrationMetadata(projectPath, hop.FromVersion, hop.ToVersion)) return (true, false, "Angular CLI metadata contains applicable migration for this source-to-target range.", packages);
        if (hasPolicy && policy!.RequiresOfficialMigrateOnly) return (true, false, "adapter policy requires official Angular migrate-only for this hop.", packages);
        if (HasFrameworkSourceMigrationEvidence(configPlan, analysis)) return (true, false, "source/framework migration detected by analysis.", packages);
        if (HasPackageOrConfigOnlyMigrationEvidence(configPlan, analysis)) return (false, false, "skipped because package/config-only migration", packages);
        return (false, false, "skipped because no official Angular migration evidence found", packages);
    }

    private static bool HasAngularOfficialMigrationMetadata(string projectPath, int sourceMajor, int targetMajor)
    {
        var cliPackageJson = Path.Combine(projectPath, "node_modules", "@angular", "cli", "package.json");
        if (!File.Exists(cliPackageJson)) return false;
        try
        {
            var package = ReadJson(cliPackageJson);
            var migrationPath = package["ng-update"]?["migrations"]?.ToString();
            if (string.IsNullOrWhiteSpace(migrationPath)) return false;
            var full = Path.GetFullPath(Path.Combine(Path.GetDirectoryName(cliPackageJson)!, migrationPath.Replace('/', Path.DirectorySeparatorChar)));
            if (!File.Exists(full)) return false;
            var migrations = ReadJson(full)["migrations"]?.AsObject();
            if (migrations is null) return false;
            foreach (var migration in migrations.Select(kvp => kvp.Value).OfType<JsonObject>())
            {
                var version = VersionTuple(migration.StringValue("version"));
                if (version is not null && version[0] > sourceMajor && version[0] <= targetMajor) return true;
            }
        }
        catch
        {
            return false;
        }
        return false;
    }

    private static bool HasFrameworkSourceMigrationEvidence(JsonObject configPlan, JsonObject analysis)
    {
        return EnumerateMigrationEvidence(configPlan, analysis).Any(IsFrameworkSourceMigrationEvidence);
    }

    private static bool HasPackageOrConfigOnlyMigrationEvidence(JsonObject configPlan, JsonObject analysis)
    {
        var evidence = EnumerateMigrationEvidence(configPlan, analysis).ToArray();
        return evidence.Length == 0 || evidence.All(IsPackageOrConfigOnlyEvidence);
    }

    private static IEnumerable<JsonObject> EnumerateMigrationEvidence(params JsonObject[] roots)
    {
        foreach (var root in roots)
        {
            foreach (var item in EnumerateMigrationEvidence((JsonNode)root)) yield return item;
        }
    }

    private static IEnumerable<JsonObject> EnumerateMigrationEvidence(JsonNode? node)
    {
        if (node is JsonObject obj)
        {
            if (LooksLikeMigrationEvidenceObject(obj)) yield return obj;
            foreach (var child in obj.Select(kvp => kvp.Value))
            {
                foreach (var item in EnumerateMigrationEvidence(child)) yield return item;
            }
        }
        else if (node is JsonArray array)
        {
            foreach (var child in array)
            {
                foreach (var item in EnumerateMigrationEvidence(child)) yield return item;
            }
        }
    }

    private static bool LooksLikeMigrationEvidenceObject(JsonObject obj) =>
        obj.ContainsKey("filePath") ||
        obj.ContainsKey("file") ||
        obj.ContainsKey("path") ||
        obj.ContainsKey("sourceFile") ||
        obj.ContainsKey("changeType") ||
        obj.ContainsKey("category") ||
        obj.ContainsKey("reason") ||
        obj.ContainsKey("migrationType") ||
        obj.ContainsKey("requiresSourceMigration") ||
        obj.ContainsKey("requiresTemplateMigration") ||
        obj.ContainsKey("frameworkLevelMigration");

    private static bool IsFrameworkSourceMigrationEvidence(JsonObject item)
    {
        if (item.BoolValue("requiresSourceMigration") ||
            item.BoolValue("requiresTemplateMigration") ||
            item.BoolValue("frameworkLevelMigration") ||
            item.BoolValue("requiresOfficialAngularMigration"))
        {
            return true;
        }

        var file = EvidenceFile(item);
        var text = EvidenceText(item);
        if (IsPackageOrConfigFile(file) && !ContainsFrameworkSourceKeyword(text)) return false;
        if (IsSourceOrTemplateFile(file) && ContainsFrameworkSourceKeyword(text)) return true;
        if (IsAngularFrameworkFile(file) && ContainsFrameworkSourceKeyword(text)) return true;
        return ContainsFrameworkSourceKeyword(text) && !ContainsPackageConfigOnlyKeyword(text);
    }

    private static bool IsPackageOrConfigOnlyEvidence(JsonObject item)
    {
        var file = EvidenceFile(item);
        var text = EvidenceText(item);
        if (IsFrameworkSourceMigrationEvidence(item)) return false;
        return string.IsNullOrWhiteSpace(file) ||
               IsPackageOrConfigFile(file) ||
               ContainsPackageConfigOnlyKeyword(text);
    }

    private static string EvidenceFile(JsonObject item) =>
        NormalizeRelativePath(item.StringValue("filePath", item.StringValue("file", item.StringValue("path", item.StringValue("sourceFile")))));

    private static string EvidenceText(JsonObject item) =>
        string.Join(" ", item.Select(kvp => kvp.Value is JsonValue ? kvp.Value?.ToString() : "").Where(s => !string.IsNullOrWhiteSpace(s)));

    private static bool ContainsFrameworkSourceKeyword(string text) =>
        Regex.IsMatch(text ?? "", @"source|typescript|template|html|standalone|component|routing|route|bootstrap|provider|workspace migration|builder migration|framework api|breaking change|official angular migration|angular schematic", RegexOptions.IgnoreCase);

    private static bool ContainsPackageConfigOnlyKeyword(string text) =>
        Regex.IsMatch(text ?? "", @"package\.json|dependency|dependencies|peer dependency|npm install|package-lock|angular\.json|tsconfig|config|configuration", RegexOptions.IgnoreCase);

    private static bool IsPackageOrConfigFile(string file)
    {
        if (string.IsNullOrWhiteSpace(file)) return false;
        var name = Path.GetFileName(file);
        return name is "package.json" or "package-lock.json" or "angular.json" or ".browserslistrc" or ".eslintrc.json" or "eslint.config.js" or "eslint.config.cjs" or "eslint.config.mjs" or ".prettierrc" or "prettier.config.js" ||
               name.StartsWith("tsconfig", StringComparison.OrdinalIgnoreCase) && name.EndsWith(".json", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsPackageInstallInputFile(string file)
    {
        var name = Path.GetFileName(NormalizeRelativePath(file));
        return name is "package.json" or "package-lock.json" or "npm-shrinkwrap.json";
    }

    private static bool IsSourceOrTemplateFile(string file) =>
        file.EndsWith(".ts", StringComparison.OrdinalIgnoreCase) || file.EndsWith(".html", StringComparison.OrdinalIgnoreCase);

    private static bool IsAngularFrameworkFile(string file)
    {
        var name = Path.GetFileName(file);
        return name is "main.ts" or "polyfills.ts" or "app.module.ts" or "app.config.ts" or "app.routes.ts" or "test.ts" or "setup-jest.ts" ||
               file.Contains("routing", StringComparison.OrdinalIgnoreCase) ||
               file.Contains("bootstrap", StringComparison.OrdinalIgnoreCase);
    }

    private static JsonArray ClassifyOfficialMigrationChanges(string projectPath, Dictionary<string, string> before, IReadOnlyList<string> files)
    {
        var result = new JsonArray();
        foreach (var file in files.Order(StringComparer.OrdinalIgnoreCase))
        {
            var classification = ClassifyOfficialMigrationFile(projectPath, before, file);
            result.Add(new JsonObject
            {
                ["file"] = file,
                ["classification"] = classification.ToString(),
                ["accepted"] = false,
                ["validationRequired"] = classification == MigrationChangeClassification.BusinessImpactingMigration
            });
        }
        return result;
    }

    private static JsonArray ClassifyOfficialMigrationChanges(IReadOnlyList<string> files)
    {
        var result = new JsonArray();
        foreach (var file in files.Order(StringComparer.OrdinalIgnoreCase))
        {
            var classification = ClassifyOfficialMigrationFile(file);
            result.Add(new JsonObject
            {
                ["file"] = file,
                ["classification"] = classification.ToString(),
                ["accepted"] = false,
                ["validationRequired"] = classification == MigrationChangeClassification.BusinessImpactingMigration
            });
        }
        return result;
    }

    private static MigrationChangeClassification ClassifyOfficialMigrationFile(string projectPath, Dictionary<string, string> before, string file)
    {
        var baseline = ClassifyOfficialMigrationFile(file);
        if (baseline != MigrationChangeClassification.BusinessImpactingMigration) return baseline;
        if (IsStandaloneCompatibilityMigration(projectPath, before, file)) return MigrationChangeClassification.FrameworkMigration;
        return baseline;
    }

    private static MigrationChangeClassification ClassifyOfficialMigrationFile(string file)
    {
        file = NormalizeRelativePath(file);
        if (IsPackageOrConfigFile(file) || file.EndsWith(".browserslistrc", StringComparison.OrdinalIgnoreCase)) return MigrationChangeClassification.ConfigurationMigration;
        if (IsAngularFrameworkFile(file) ||
            file.Contains(".routes.", StringComparison.OrdinalIgnoreCase) ||
            file.Contains(".routing.", StringComparison.OrdinalIgnoreCase) ||
            file.Contains("/environments/", StringComparison.OrdinalIgnoreCase) ||
            file.EndsWith(".spec.ts", StringComparison.OrdinalIgnoreCase))
        {
            return MigrationChangeClassification.FrameworkMigration;
        }
        if (file.EndsWith(".ts", StringComparison.OrdinalIgnoreCase) || file.EndsWith(".html", StringComparison.OrdinalIgnoreCase)) return MigrationChangeClassification.BusinessImpactingMigration;
        return MigrationChangeClassification.ConfigurationMigration;
    }

    private static bool IsStandaloneCompatibilityMigration(string projectPath, Dictionary<string, string> before, string file)
    {
        file = NormalizeRelativePath(file);
        if (!file.EndsWith(".ts", StringComparison.OrdinalIgnoreCase)) return false;
        var fullPath = Path.Combine(projectPath, file.Replace('/', Path.DirectorySeparatorChar));
        if (!File.Exists(fullPath)) return false;
        if (!before.TryGetValue(file, out var oldText)) oldText = "";
        var newText = File.ReadAllText(fullPath);
        if (!newText.Contains("standalone", StringComparison.OrdinalIgnoreCase)) return false;
        var oldHasStandaloneFalse = Regex.IsMatch(oldText, @"standalone\s*:\s*false", RegexOptions.IgnoreCase);
        var newHasStandaloneFalse = Regex.IsMatch(newText, @"standalone\s*:\s*false", RegexOptions.IgnoreCase);
        if (newHasStandaloneFalse && !oldHasStandaloneFalse) return true;
        return Regex.IsMatch(newText, @"@(Component|Directive|Pipe)\s*\(", RegexOptions.IgnoreCase) &&
               Regex.IsMatch(newText, @"standalone\s*:\s*false", RegexOptions.IgnoreCase);
    }

    private static void ApplyOfficialMigrationAcceptance(JsonObject officialMigrateOnly, JsonObject validation)
    {
        if (!officialMigrateOnly.BoolValue("executed")) return;
        var validationPassed = validation.BoolValue("passed");
        var classifications = officialMigrateOnly["changeClassifications"]?.AsArray()?.OfType<JsonObject>().ToArray() ?? [];
        var hasBusiness = classifications.Any(c => string.Equals(c.StringValue("classification"), nameof(MigrationChangeClassification.BusinessImpactingMigration), StringComparison.Ordinal));
        foreach (var item in classifications)
        {
            item["accepted"] = true;
            item["highRisk"] = false;
            item["validationRequired"] = true;
            item["validationPassed"] = validationPassed;
        }
        officialMigrateOnly["businessImpactingAccepted"] = hasBusiness;
        officialMigrateOnly["businessImpactingHighRisk"] = false;
        officialMigrateOnly["accepted"] = true;
        officialMigrateOnly["highRisk"] = false;
        officialMigrateOnly["validationPassed"] = validationPassed;
        officialMigrateOnly["acceptanceStatus"] = validationPassed ? "accepted-after-validation" : "accepted-command-succeeded-validation-failed";
    }

    private static (bool Valid, string NgPath, string Reason) ValidateLocalAngularCli(string projectPath, int targetMajor)
    {
        var nodeModules = Path.Combine(projectPath, "node_modules");
        if (!Directory.Exists(nodeModules)) return (false, "", "node_modules does not exist after install.");
        var ng = LocalAngularCliPath(projectPath);
        if (!File.Exists(ng)) return (false, ng, $"Local Angular CLI executable was not found: {ng}");
        var cliPackageJson = Path.Combine(nodeModules, "@angular", "cli", "package.json");
        if (!File.Exists(cliPackageJson)) return (false, ng, "node_modules/@angular/cli/package.json does not exist.");
        var version = VersionTuple(ReadJson(cliPackageJson).StringValue("version"));
        if (version is null || version[0] != targetMajor) return (false, ng, $"Installed local @angular/cli major does not match target Angular major {targetMajor}.");
        return (true, ng, "");
    }

    private static string LocalAngularCliPath(string projectPath) =>
        Path.Combine(projectPath, "node_modules", ".bin", OperatingSystem.IsWindows() ? "ng.cmd" : "ng");

    private static bool IsLikelyMissingAngularOfficialMigrationFailure(JsonObject validation)
    {
        var text = $"{validation.StringValue("output")} {validation.StringValue("errors")} {validation.StringValue("buildVerificationFailureReason")}";
        return text.Contains("standalone", StringComparison.OrdinalIgnoreCase) ||
               text.Contains("application builder", StringComparison.OrdinalIgnoreCase) ||
               text.Contains("run ng update", StringComparison.OrdinalIgnoreCase) ||
               text.Contains("requires an Angular migration", StringComparison.OrdinalIgnoreCase) ||
               text.Contains("@angular/core: cannot find migration", StringComparison.OrdinalIgnoreCase);
    }

    private static JsonObject OfficialAngularUpdateSkipped(MigrationHop hop, string reason, bool required = false) => new()
    {
        ["required"] = required,
        ["attempted"] = false,
        ["executed"] = false,
        ["triggered"] = false,
        ["triggerReason"] = reason,
        ["skipped"] = true,
        ["skippedReason"] = reason,
        ["source"] = "not required",
        ["mode"] = "not-run",
        ["command"] = new JsonArray(),
        ["commands"] = new JsonArray(),
        ["filesChangedByAngularCli"] = new JsonArray(),
        ["changeClassifications"] = new JsonArray(),
        ["businessImpactingFiles"] = new JsonArray(),
        ["configurationMigrationFiles"] = new JsonArray(),
        ["frameworkMigrationFiles"] = new JsonArray(),
        ["hasBusinessImpactingChanges"] = false,
        ["businessImpactingAccepted"] = false,
        ["businessImpactingHighRisk"] = false,
        ["acceptanceStatus"] = "not-run",
        ["message"] = $"Official Angular update skipped for Angular {hop.FromVersion} -> {hop.ToVersion}: {reason}."
    };

    private static void AddOfficialAngularUpdateDetails(JsonObject result, JsonObject officialAngularUpdate)
    {
        result["officialAngularUpdate"] = officialAngularUpdate.DeepClone();
        result["officialAngularUpdateRequired"] = officialAngularUpdate.BoolValue("required");
        result["officialAngularUpdateExecuted"] = officialAngularUpdate.BoolValue("executed");
        result["officialAngularUpdateMode"] = officialAngularUpdate.StringValue("mode");
        result["officialAngularUpdateSource"] = officialAngularUpdate.StringValue("source");
        result["officialAngularUpdateCommand"] = officialAngularUpdate["command"]?.DeepClone() ?? new JsonArray();
        result["officialAngularUpdateTriggered"] = officialAngularUpdate.BoolValue("triggered");
        result["officialAngularUpdateTriggerReason"] = officialAngularUpdate.StringValue("triggerReason", officialAngularUpdate.StringValue("skippedReason"));
        result["officialAngularUpdateChangedFiles"] = officialAngularUpdate["filesChangedByAngularCli"]?.DeepClone() ?? new JsonArray();
        result["officialAngularUpdatePackageFilesChanged"] = officialAngularUpdate.BoolValue("packageFilesChanged");
        result["officialAngularMigrateOnly"] = officialAngularUpdate.DeepClone();
        result["officialAngularMigrateOnlyRequired"] = officialAngularUpdate.BoolValue("required");
        result["officialAngularMigrateOnlyExecuted"] = officialAngularUpdate.BoolValue("executed");
        result["officialAngularMigrateOnlySource"] = officialAngularUpdate.StringValue("source");
        result["officialAngularMigrateOnlyCommand"] = officialAngularUpdate["command"]?.DeepClone() ?? new JsonArray();
        result["officialAngularMigrateOnlyTriggered"] = officialAngularUpdate.BoolValue("triggered");
        result["officialAngularMigrateOnlyTriggerReason"] = officialAngularUpdate.StringValue("triggerReason", officialAngularUpdate.StringValue("skippedReason"));
        result["officialAngularMigrateOnlyChangedFiles"] = officialAngularUpdate["filesChangedByAngularCli"]?.DeepClone() ?? new JsonArray();
        result["officialAngularMigrationChangeClassifications"] = officialAngularUpdate["changeClassifications"]?.DeepClone() ?? new JsonArray();
        result["officialAngularMigrationConfigurationFiles"] = officialAngularUpdate["configurationMigrationFiles"]?.DeepClone() ?? new JsonArray();
        result["officialAngularMigrationFrameworkFiles"] = officialAngularUpdate["frameworkMigrationFiles"]?.DeepClone() ?? new JsonArray();
        result["officialAngularMigrationBusinessImpactingFiles"] = officialAngularUpdate["businessImpactingFiles"]?.DeepClone() ?? new JsonArray();
        result["officialAngularMigrationHasBusinessImpactingChanges"] = officialAngularUpdate.BoolValue("hasBusinessImpactingChanges");
        result["officialAngularMigrationBusinessImpactingAccepted"] = officialAngularUpdate.BoolValue("businessImpactingAccepted");
        result["officialAngularMigrationBusinessImpactingHighRisk"] = officialAngularUpdate.BoolValue("businessImpactingHighRisk");
        result["officialAngularMigrationAcceptanceStatus"] = officialAngularUpdate.StringValue("acceptanceStatus");
        result["migrateOnlySkipped"] = officialAngularUpdate.BoolValue("skipped", !officialAngularUpdate.BoolValue("executed"));
        result["migrateOnlySkippedReason"] = officialAngularUpdate.StringValue("skippedReason");
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
            ["angularCliPolicy"] = new JsonObject
            {
                ["commandSource"] = command.FirstOrDefault() == "npx" ? "npx" : command.FirstOrDefault() ?? "unknown",
                ["angularCliSource"] = command.FirstOrDefault() == "ng" ? "PATH" : command.FirstOrDefault()?.Contains("node_modules", StringComparison.OrdinalIgnoreCase) == true ? "project-local node_modules" : command.Contains("-p") ? "version-pinned npx package" : "not applicable",
                ["globalAngularCli"] = command.FirstOrDefault() == "ng" ? "used from PATH" : "not used",
                ["globalInstallUpdate"] = "not performed"
            }
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
        ? LegacyPeerDepsNpmInstallCommand
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

    private static Dictionary<string, JsonObject> PackageRecommendationMap(JsonArray? recommendations)
    {
        var result = new Dictionary<string, JsonObject>(StringComparer.OrdinalIgnoreCase);
        foreach (var recommendation in recommendations?.OfType<JsonObject>() ?? [])
        {
            var name = recommendation.StringValue("packageName");
            if (!string.IsNullOrWhiteSpace(name)) result[name] = recommendation;
        }
        return result;
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

    private sealed record PendingPackageUpdate(string Name, string Section, string FromVersion, string OriginalSuggestedVersion, string NormalizedTargetVersion, string Category, string Reason, string Source, double Confidence, bool RequiresVersionVerification = false);
    private sealed record NpmViewResult(JsonNode? Value, string Status, string Error, int AttemptCount);
    private sealed record OfficialAngularUpdatePolicy(bool UseFullUpdate, bool RequiresOfficialMigrateOnly, IReadOnlyList<string> Packages);
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
    private readonly record struct ThirdPartyRemediationCandidate(string Strategy, string Action, string TargetPackage, string TargetRange, string Reason);
    private sealed record FailureInfo(string Category, string Stage, IReadOnlyList<string> Command, string Reason, string SuggestedNextAction, bool CanContinue, bool ManualCorrectionRequired);
    private static JsonObject FailedHopResult(MigrationHop hop, JsonArray commands, IReadOnlyList<string> files, JsonObject preflight, string reason, string package) => new() { ["hop"] = HopObject(hop), ["status"] = "failed", ["commands"] = commands, ["files"] = new JsonArray(files.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()), ["preflightDependencyAnalysis"] = preflight, ["validation"] = new JsonObject { ["passed"] = false, ["errors"] = reason }, ["failureReason"] = reason, ["failurePackage"] = package, ["optionalMigrations"] = new JsonArray() };
    private static string CommandDescription(IReadOnlyList<string> command) => command.Take(2).SequenceEqual(["npm", "install"]) || command.Take(2).SequenceEqual(["yarn", "install"]) || command.Take(2).SequenceEqual(["pnpm", "install"]) ? "dependency install" : command.Contains("--migrate-only") ? "Angular migrate-only" : command.Contains("update") && command.Any(p => p.StartsWith("@angular/cli@", StringComparison.OrdinalIgnoreCase)) ? "Angular official update" : "command";
    private static string FormatCommandOutput(IReadOnlyList<string> command, CommandResult result) => $"$ {string.Join(" ", command)}\nexit code: {result.ReturnCode}\n{result.Stdout}{result.Stderr}";
}
