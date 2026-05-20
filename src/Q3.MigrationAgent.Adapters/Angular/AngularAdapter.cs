using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Q3.MigrationAgent.Adapters.PackageClassification;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Shared.Common;
using Q3.MigrationAgent.Shared.Config;
using Q3.MigrationAgent.Shared.DTO;

namespace Q3.MigrationAgent.Adapters.Angular;

public sealed class AngularAdapter(ICommandRunner commandRunner, PackageClassifier? packageClassifier = null, IAiService? ai = null) : IMigrationAdapter
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
            return FailedHopResult(hop, commands, ChangedStructuralFiles(projectPath, beforeFiles), preflight, packageUpdate.StringValue("reason"), packageUpdate.StringValue("package"));
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
        var validation = await RunValidationsAsync(projectPath, hop, config.CommandTimeoutSeconds, config.CommandIdleTimeoutSeconds, progress, stage, logPath, cancellationToken);
        if (validation["buildVerificationCommandResult"] is JsonObject buildCommandResult) commands.Add(buildCommandResult.DeepClone());
        if (!validation.BoolValue("passed")) success = false;
        var result = new JsonObject
        {
            ["hop"] = HopObject(hop),
            ["status"] = success ? "done" : "failed",
            ["commands"] = commands,
            ["files"] = new JsonArray(ChangedStructuralFiles(projectPath, beforeFiles).Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
            ["preflightDependencyAnalysis"] = preflight,
            ["validation"] = validation,
            ["optionalMigrations"] = new JsonArray(),
            ["aiRemediationChanges"] = new JsonArray(),
            ["manualCorrectionRequests"] = new JsonArray(),
            ["migrateOnlySkipped"] = true,
            ["migrateOnlySkippedReason"] = "disabled by new default flow"
        };
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
        var targetAngularVersion = await ResolveAngularTargetVersionAsync(hop.ToVersion, projectPath, logPath, cancellationToken) ?? $"{hop.ToVersion}.0.0";
        var targetVersionByPackage = DefaultAngularTargetVersions(entries, hop.ToVersion, targetAngularVersion);
        var classification = await GetAngularAiPackageClassificationAsync(data, entries, hop, targetVersionByPackage, config, cancellationToken);
        var accepted = new JsonArray();
        var rejected = new JsonArray();
        var preserved = new JsonArray();
        var manual = new JsonArray();
        var thirdParty = new JsonArray();
        var applied = new JsonArray();

        foreach (var item in classification["packages"]?.AsArray()?.OfType<JsonObject>() ?? [])
        {
            var decision = ValidateAngularPackageDecision(item, entries, targetVersionByPackage);
            if (!decision.Accepted)
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
                    if (data[section] is JsonObject runtimeDeps && runtimeDeps.ContainsKey(name))
                    {
                        runtimeDeps[name] = compatibleRuntimeVersion;
                        applied.Add(new JsonObject { ["name"] = name, ["fromVersion"] = current.Version, ["toVersion"] = compatibleRuntimeVersion, ["section"] = section, ["category"] = category, ["reason"] = $"Angular {hop.ToVersion} requires a compatible runtime support package version." });
                    }
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

            var targetVersion = NormalizedTargetVersion(item.StringValue("targetVersion"), targetVersionByPackage.GetValueOrDefault(name), category, hop.ToVersion);
            if (targetVersion is null)
            {
                rejected.Add(RejectedPackageSuggestion(item, "Upgrade target version was missing or invalid."));
                preserved.Add(new JsonObject { ["name"] = name, ["version"] = current.Version, ["section"] = section });
                continue;
            }
            if (data[section] is JsonObject deps && deps.ContainsKey(name))
            {
                deps[name] = targetVersion;
                applied.Add(new JsonObject { ["name"] = name, ["fromVersion"] = current.Version, ["toVersion"] = targetVersion, ["section"] = section, ["category"] = category, ["reason"] = item.StringValue("reason") });
            }
            accepted.Add(item.DeepClone());
            if (category is "angular_ui_or_extension_package" or "third_party_runtime_package" or "third_party_build_or_test_tooling") thirdParty.Add(item.DeepClone());
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
            ["package"] = "@angular/core",
            ["reason"] = ""
        };
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
                var result = await ai.AskAsync(config.Ai, AngularPackageClassificationPrompt, payload.ToJsonString(JsonHelpers.SerializerOptions), cancellationToken);
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

    private static (bool Accepted, string Reason) ValidateAngularPackageDecision(JsonObject item, IReadOnlyList<(string Name, string Version, string Section)> entries, IReadOnlyDictionary<string, string> defaultTargets)
    {
        var name = item.StringValue("name");
        var section = item.StringValue("section");
        var category = item.StringValue("category");
        var action = item.StringValue("action");
        var risk = item.StringValue("risk", "medium");
        var target = item.StringValue("targetVersion");
        if (!entries.Any(e => e.Name.Equals(name, StringComparison.OrdinalIgnoreCase) && e.Section == section)) return (false, "Package is not a direct dependency in the declared section.");
        if (!AngularAiPackageCategories.Contains(category)) return (false, "Package category is not allowlisted.");
        if (!AngularAiPackageActions.Contains(action)) return (false, "Package action is not allowlisted.");
        if (risk == "high") return (false, "High-risk package suggestion rejected.");
        if (DoubleValue(item, "confidence", 0) < MinimumAiPackageConfidence) return (false, "Package suggestion confidence is below the high-confidence threshold.");
        if (action == "remove") return (false, "Package removals are not automatic in Angular hop migration.");
        if (target.Contains("||") || target.Contains(" or ", StringComparison.OrdinalIgnoreCase) || target.Contains(",")) return (false, "Multiple target versions were suggested; one stable compatible version is required.");
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

    private static string? NormalizedTargetVersion(string aiTarget, string? defaultTarget, string category, int targetMajor)
    {
        var value = string.IsNullOrWhiteSpace(aiTarget) || aiTarget == "null" ? defaultTarget : aiTarget;
        if (string.IsNullOrWhiteSpace(value)) return null;
        if (category is "angular_framework_package" or "angular_tooling_package" && MajorVersion(value) != targetMajor) return defaultTarget;
        if (category == "typescript_runtime_or_compiler_package" && !IsTypeScriptCompatibleWithAngular(value, targetMajor)) return defaultTarget;
        return value;
    }

    private async Task<string?> ResolveAngularTargetVersionAsync(int target, string projectPath, string? logPath, CancellationToken cancellationToken)
    {
        var result = await NpmViewAsync("@angular/core", "versions", "--json", projectPath, logPath, cancellationToken);
        return SelectLatestStableMajorVersion(result, target);
    }

    private async Task<string?> ResolveAngularCliTargetVersionAsync(int target, string projectPath, string? logPath, IProgressReporter? progress, string stage, int timeout, CancellationToken cancellationToken)
    {
        var result = await NpmViewAsync("@angular/cli", "versions", "--json", projectPath, logPath, cancellationToken);
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
                var plan = await ai.AskAsync(config.Ai, AngularConfigPlanPrompt, payload.ToJsonString(JsonHelpers.SerializerOptions), cancellationToken);
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
                remediations.Add(new JsonObject { ["package"] = "typescript", ["toVersion"] = target switch { 15 => "~4.9.5", 16 => "~5.1.6", 17 => "~5.4.5", 18 => "~5.5.4", _ => dependency.Version }, ["status"] = "planned", ["reason"] = "TypeScript is framework-critical for Angular." });
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
        var key = (package, field, range);
        if (_npmViewCache.TryGetValue(key, out var cached)) return cached["value"]?.DeepClone();
        var result = await commandRunner.RunAsync(["npm", "view", package, field, range], projectPath, timeoutSeconds: 300, idleTimeoutSeconds: 60, logPath: logPath, cancellationToken: cancellationToken);
        JsonNode? parsed = null;
        if (result.ReturnCode == 0)
        {
            try { parsed = JsonNode.Parse(result.Stdout); } catch { parsed = null; }
        }
        _npmViewCache[key] = new JsonObject { ["value"] = parsed };
        return parsed?.DeepClone();
    }

    private async Task<JsonObject> RunValidationsAsync(string projectPath, MigrationHop hop, int? timeoutSeconds, int? idleTimeoutSeconds, IProgressReporter? progress, string stage, string? logPath, CancellationToken cancellationToken)
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
            progress?.Error(stage, $"Build verification failed for Angular {hop.FromVersion} -> {hop.ToVersion}. Stopping migration.");
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
    private static string TypeScriptVersionForAngular(int targetMajor) => targetMajor switch { 15 => "~4.9.5", 16 => "~5.1.6", 17 => "~5.4.5", 18 => "~5.5.4", _ => "~5.5.4" };
    private static bool IsTypeScriptCompatibleWithAngular(string version, int targetMajor)
    {
        var tuple = VersionTuple(version);
        if (tuple is null) return false;
        return targetMajor switch
        {
            15 => Compare(tuple, [4, 8, 2]) >= 0 && Compare(tuple, [5, 0, 0]) < 0,
            16 => Compare(tuple, [4, 9, 3]) >= 0 && Compare(tuple, [5, 2, 0]) < 0,
            17 => Compare(tuple, [5, 2, 0]) >= 0 && Compare(tuple, [5, 5, 0]) < 0,
            18 => Compare(tuple, [5, 4, 0]) >= 0 && Compare(tuple, [5, 6, 0]) < 0,
            _ => true
        };
    }
    private static string DefaultPackageCategory(string name)
    {
        if (name.StartsWith("@angular/", StringComparison.OrdinalIgnoreCase) && name is not "@angular/cli" and not "@angular/compiler-cli" and not "@angular/language-service") return "angular_framework_package";
        if (name is "@angular/cli" or "@angular-devkit/build-angular" or "@angular/compiler-cli" or "@angular/language-service" || name.StartsWith("@angular-eslint/", StringComparison.OrdinalIgnoreCase)) return "angular_tooling_package";
        if (name is "typescript" or "ts-node") return "typescript_runtime_or_compiler_package";
        if (AngularRuntimeSupportPackages.Contains(name)) return "angular_runtime_support_package";
        return "business_or_unknown_package";
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
                var recommended = await ai.AskAsync(config.Ai, InstallStrategyPrompt, context.ToJsonString(JsonHelpers.SerializerOptions), cancellationToken);
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
        if (strategy == "manualReview" || strategy == "forceInstall") return [];
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
        if (ContainsAny(output, "etarget", "no matching version found", "notarget", "version not found")) return new("packageVersionNotFound", "npm could not resolve a package version.", "Ask AI to re-check the package upgrade plan for the failed package before retrying.");
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
        Command = command ?? (strategy == "legacyPeerDepsInstall" ? string.Join(" ", LegacyPeerDepsNpmInstallCommand) : strategy == "manualReview" ? "" : string.Join(" ", NormalNpmInstallCommand)),
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

    private const string InstallStrategyPrompt = """
Return strict JSON only for a safe Angular npm install strategy.
Schema: {"strategy":"normalInstall | legacyPeerDepsInstall | retrySameCommand | manualReview | forceInstall","command":"npm install ...","reason":"short reason","confidence":0.0,"risk":"low | medium | high","isRetry":true,"isFallback":true,"maxRetries":0,"failureClassification":"none | peerDependencyConflict | transientNetworkFailure | registryAuthFailure | packageVersionNotFound | unknownFailure"}
Allowed commands are exactly:
npm install --no-audit --no-fund --prefer-offline
npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline
Choose normalInstall before the first attempt unless there is a clear reason not to.
After peerDependencyConflict, choose legacyPeerDepsInstall only for third-party peer range conflicts. If Angular framework packages require zone.js, rxjs, tslib, or typescript ranges, choose manualReview so the package plan can be revised instead of hiding the mismatch.
After transientNetworkFailure, choose retrySameCommand with the exact previous command and do not change package versions.
For registryAuthFailure, packageVersionNotFound, unknownFailure, or forceInstall, choose manualReview unless a safe single package-plan correction is explicitly justified outside install execution.
Never choose npm --force, npm update, npm audit fix, global npm commands, ng update, npx ng update, or migrate-only commands.
""";

    private const string AngularPackageClassificationPrompt = """
Return strict JSON only. Classify every direct Angular package.json dependency and devDependency for this Angular major-version hop.
Use this schema: {"packages":[{"name":"package-name","currentVersion":"current-version","section":"dependencies | devDependencies","category":"angular_framework_package | angular_tooling_package | angular_runtime_support_package | typescript_runtime_or_compiler_package | angular_ui_or_extension_package | third_party_runtime_package | third_party_build_or_test_tooling | business_or_unknown_package","targetVersion":"version-or-null","action":"upgrade | preserve | remove | manual_review","reason":"short reason","confidence":0.0,"risk":"low | medium | high"}],"notes":[]}
Rules: choose one stable compatible targetVersion only; align Angular framework packages to the target major; review Angular-coupled runtime packages zone.js, rxjs, tslib, and typescript whenever Angular core/framework packages are upgraded; upgrade Angular tooling, runtime support packages, and TypeScript only to Angular-compatible versions; preserve unrelated third-party packages; mark uncertain packages manual_review. Do not use latest blindly.
""";

    private const string AngularConfigPlanPrompt = """
Return strict JSON only. Propose only safe structural Angular config updates after package.json has been upgraded.
Allowed files: angular.json, tsconfig.json, tsconfig.app.json, tsconfig.spec.json, package.json.
Do not touch src/app, components, services, models, business code, API usage, or application logic.
Use this schema: {"changes":[{"filePath":"angular.json","changeType":"update_builder | update_option | remove_deprecated_option | update_tsconfig | manual_review","targetAngularHop":"14->15","reason":"short reason","confidence":0.0,"risk":"low | medium | high","patch":{"before":"exact existing value or snippet","after":"new value or snippet"}}],"manualRecommendations":[]}
Only suggest exact snippet replacements. Preserve project names, custom architect targets, sourceRoot, root, assets, styles, scripts, budgets, fileReplacements, outputPath, index, main/browser, unknown angular.json options, tsconfig paths, aliases, include, exclude, files, and references unless a safe structural migration requires a precise low-risk change.
""";

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

    private static string AngularDependencyRole(string name)
    {
        if (name.StartsWith("@angular/", StringComparison.OrdinalIgnoreCase)) return "framework-owned";
        if (name == "@angular-devkit/build-angular") return "framework-tooling";
        if (name == "typescript") return "framework-critical";
        if (LooksAngularCoupledThirdParty(name)) return "third-party-angular-library";
        return "unrelated-third-party";
    }

    private static bool LooksAngularCoupledThirdParty(string name) => name.Contains("angular", StringComparison.OrdinalIgnoreCase) || name.StartsWith("ngx-", StringComparison.OrdinalIgnoreCase) || name.StartsWith("@ng-", StringComparison.OrdinalIgnoreCase);

    private sealed record FailureInfo(string Category, string Stage, IReadOnlyList<string> Command, string Reason, string SuggestedNextAction, bool CanContinue, bool ManualCorrectionRequired);
    private static JsonObject FailedHopResult(MigrationHop hop, JsonArray commands, IReadOnlyList<string> files, JsonObject preflight, string reason, string package) => new() { ["hop"] = HopObject(hop), ["status"] = "failed", ["commands"] = commands, ["files"] = new JsonArray(files.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()), ["preflightDependencyAnalysis"] = preflight, ["validation"] = new JsonObject { ["passed"] = false, ["errors"] = reason }, ["failureReason"] = reason, ["failurePackage"] = package, ["optionalMigrations"] = new JsonArray() };
    private static string CommandDescription(IReadOnlyList<string> command) => command.Take(2).SequenceEqual(["npm", "install"]) || command.Take(2).SequenceEqual(["yarn", "install"]) || command.Take(2).SequenceEqual(["pnpm", "install"]) ? "dependency install" : command.Contains("--migrate-only") ? "Angular migrate-only" : "command";
    private static string FormatCommandOutput(IReadOnlyList<string> command, CommandResult result) => $"$ {string.Join(" ", command)}\nexit code: {result.ReturnCode}\n{result.Stdout}{result.Stderr}";
}
