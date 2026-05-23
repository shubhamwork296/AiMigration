using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Core.Execution;
using Q3.MigrationAgent.Shared.Common;
using Q3.MigrationAgent.Shared.Config;
using Q3.MigrationAgent.Shared.DTO;

namespace Q3.MigrationAgent.Core.Remediation;

public sealed class AiRemediationPlanner(IAiService ai, IPromptLoader? promptLoader = null)
{
    private const double MinimumConfidence = 0.75;
    private static readonly HashSet<string> SafeStructuralNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "Directory.Build.props", "Directory.Build.targets", "Directory.Packages.props", "global.json", "NuGet.config",
        "package.json", "angular.json", "tsconfig.json", "browserslist", ".browserslistrc", ".npmrc",
        "pom.xml", "build.gradle", "build.gradle.kts", "settings.gradle", "gradle.properties",
        "pyproject.toml", "requirements.txt", "setup.cfg", "go.mod", "go.sum", "Gemfile", "Gemfile.lock"
    };
    private static readonly HashSet<string> AllowedChangeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "script_update", "package_update", "config_update", "type_shim", "source_update", "style_import_update", "test_config_update", "dependency", "package"
    };
    private static readonly string[] ManifestFileNames = ["package.json", "package-lock.json", "yarn.lock", "pnpm-lock.yaml", ".csproj", ".sln", "pom.xml", "build.gradle", "build.gradle.kts", "pyproject.toml", "requirements.txt", "go.mod", "go.sum", "Gemfile", "Gemfile.lock"];

    public async Task<RemediationAttempt> TryRemediateAsync(
        MigrationConfig config,
        string outputPath,
        IMigrationAdapter adapter,
        ValidationResult validation,
        int attempt,
        CancellationToken cancellationToken = default)
    {
        var deterministic = await TryApplyDeterministicRemediationAsync(outputPath, validation, attempt, config.MaxAiRemediationRetries, config.SourceCompatibilityRemediation, cancellationToken);
        if (deterministic is not null) return RemediationAttempt.AppliedResult([deterministic]);

        if (!config.Ai.UseAi)
        {
            var reason = IsCssDependencyImportFailure(validation.Output + "\n" + validation.Errors)
                ? "No confirmed direct tilde removal or verified equivalent package asset path was found for the unresolved CSS dependency import, and AI remediation is disabled."
                : "AI remediation is disabled and no deterministic safe remediation matched the validation failure.";
            return RemediationAttempt.Manual(ManualRequest(new JsonObject(), validation, outputPath, reason));
        }

        var manifest = await adapter.ParseManifestAsync(outputPath, cancellationToken);
        var reducedContext = HasPreviousAiTimeout(validation);
        var prompt = reducedContext
            ? BuildReducedPrompt(config, outputPath, adapter, validation, attempt, manifest)
            : await BuildFullPromptAsync(config, outputPath, adapter, validation, attempt, manifest, cancellationToken);
        JsonObject? plan;
        try
        {
            plan = await ai.AskAsync(config.Ai, LoadPrompt("remediation/validation-remediation"), prompt.ToJsonString(JsonHelpers.SerializerOptions), cancellationToken);
        }
        catch (Exception ex) when (IsAiTimeoutException(ex))
        {
            var timeoutType = ExtractTimeoutType(ex);
            var failedAttempt = AiTimeoutChange(validation, attempt, config.MaxAiRemediationRetries, timeoutType, reducedContext, ex);
            if (attempt >= config.MaxAiRemediationRetries)
            {
                return RemediationAttempt.Manual(ManualRequest(new JsonObject(), validation, outputPath, "Codex CLI timed out during remediation planning and maxAiRemediationRetries is exhausted.", failedAttempt), [failedAttempt]);
            }
            return RemediationAttempt.Failed([failedAttempt]);
        }
        catch (Exception ex) when (IsCodexSandboxValidationError(ex.Message))
        {
            var failedAttempt = AiEnvironmentErrorChange(validation, attempt, config.MaxAiRemediationRetries, reducedContext, ex.Message);
            return RemediationAttempt.Failed([failedAttempt]);
        }
        if (plan is null) return RemediationAttempt.Manual(ManualRequest(new JsonObject(), validation, outputPath, "AI did not return a remediation plan."));
        NormalizePlanPaths(plan, outputPath);
        var safety = ValidatePlan(plan, validation, outputPath);
        if (!safety.Safe)
        {
            var rejected = RejectedChanges(plan, validation, safety.Reason);
            return RemediationAttempt.Manual(ManualRequest(plan, validation, outputPath, safety.Reason, attemptedChanges: rejected), rejected);
        }

        var changes = new List<JsonObject>();
        var anyApplied = false;
        foreach (var change in plan["changes"]?.AsArray()?.OfType<JsonObject>() ?? [])
        {
            var applied = await ApplyChangeAsync(plan, change, outputPath, adapter, attempt, config.MaxAiRemediationRetries, validation, cancellationToken);
            if (applied is not null)
            {
                anyApplied = true;
                changes.Add(applied);
            }
            else
            {
                changes.Add(RejectedChange(plan, validation, change, "Change could not be applied because the target file, exact before text, or safety constraints did not match the current workspace."));
            }
        }

        var unresolvedImportsRemain = OriginalCssImportsStillPresent(outputPath, validation, changes);
        if (unresolvedImportsRemain.Count > 0)
        {
            return RemediationAttempt.Manual(ManualRequest(plan, validation, outputPath, "Style import remediation incomplete; original unresolved imports remain in project style files.", null, changes, unresolvedImportsRemain), changes);
        }

        return !anyApplied
            ? RemediationAttempt.Manual(ManualRequest(plan, validation, outputPath, "AI returned changes, but none could be safely applied.", attemptedChanges: changes), changes)
            : RemediationAttempt.AppliedResult(changes);
    }

    private static async Task<JsonObject> BuildFullPromptAsync(MigrationConfig config, string outputPath, IMigrationAdapter adapter, ValidationResult validation, int attempt, JsonObject manifest, CancellationToken cancellationToken)
    {
        var projectFiles = await adapter.CollectProjectFilesAsync(outputPath, cancellationToken);
        var prompt = BasePrompt(config, adapter, validation, attempt, manifest);
        prompt["stdoutStderr"] = validation.Output.Length > 0 ? validation.Output : validation.Errors;
        prompt["logTail"] = LogTail(validation.Output.Length > 0 ? validation.Output : validation.Errors);
        prompt["manifestFilesInvolved"] = new JsonArray(FindManifestFiles(outputPath).Select(f => (JsonNode?)JsonValue.Create(f)).ToArray());
        prompt["lockfilesPresent"] = new JsonArray(FindLockfiles(outputPath).Select(f => (JsonNode?)JsonValue.Create(f)).ToArray());
        prompt["projectFiles"] = JsonSerializer.SerializeToNode(projectFiles, JsonHelpers.SerializerOptions);
        prompt["cssDependencyImportFailures"] = BuildCssDependencyImportContext(outputPath, validation, manifest);
        prompt["contextMode"] = "full";
        return prompt;
    }

    private static JsonObject BuildReducedPrompt(MigrationConfig config, string outputPath, IMigrationAdapter adapter, ValidationResult validation, int attempt, JsonObject manifest)
    {
        var validationText = validation.Output.Length > 0 ? validation.Output : validation.Errors;
        var artifact = ExtractRelevantArtifact(validationText);
        var prompt = BasePrompt(config, adapter, validation, attempt, ReducedManifest(manifest, artifact));
        prompt["contextMode"] = "reduced-after-ai-timeout";
        prompt["validationOutputTail"] = LineTail(validationText, 160);
        prompt["relevantArtifact"] = artifact;
        prompt["relevantManifestExcerpts"] = RelevantManifestExcerpts(outputPath, manifest, artifact);
        prompt["cssDependencyImportFailures"] = BuildCssDependencyImportContext(outputPath, validation, manifest);
        prompt["strictJsonOnly"] = true;
        return prompt;
    }

    private static JsonObject BasePrompt(MigrationConfig config, IMigrationAdapter adapter, ValidationResult validation, int attempt, JsonObject manifest) => new()
    {
        ["runtime"] = adapter.RuntimeName,
        ["currentRuntime"] = adapter.RuntimeName,
        ["migrationHop"] = validation.FailedHop,
        ["failedCommand"] = FailedCommand(validation),
        ["exitCode"] = ExtractExitCode(validation),
        ["manifest"] = manifest.DeepClone(),
        ["alreadyAppliedMigrationChanges"] = new JsonArray(validation.AiRemediationChanges.Select(c => (JsonNode?)c.DeepClone()).ToArray()),
        ["attempt"] = attempt,
        ["maxAttempts"] = config.MaxAiRemediationRetries,
        ["rules"] = new JsonArray(
            "Fix only the cause shown in the validation/build failure.",
            "Prefer structural/config/package/script fixes over source-code edits.",
            "Angular Unknown argument: prod should update package.json scripts from ng build --prod to ng build --configuration production.",
            "Angular Ivy/Angular 16+ no longer uses entryComponents; remove only the entryComponents metadata property when the compiler points at NgModule metadata.",
            "For ModuleWithProviders<T> requires 1 type argument in node_modules, do not edit node_modules. Treat the owning package as incompatible with the target Angular version and propose a package upgrade or replacement.",
            "For NG6002/NG6003 in node_modules, do not edit node_modules. Propose only package.json changes and minimal Angular module import/wiring changes needed for an equivalent Angular module setup.",
            "For NG6002 on a local module that already has @NgModule, classify it as cascading from earlier incompatible imported Angular libraries instead of claiming @NgModule is missing.",
            "Use legacy-peer-deps only as install fallback, not as the only remediation if package version alignment is clearly needed.",
            ".NET fixes should prefer csproj/package/framework/config changes.",
            "Never make broad refactors, change business rules, or edit files unrelated to the failure.",
            "Source edits are allowed only when the validation output points to the exact file and symbol.",
            "For CSS/SCSS package import failures, extract only unresolved imports from Can't resolve '<path>' diagnostics.",
            "For css_dependency_import or dependency_asset_import_resolution failures, first try direct tilde removal when that exact normalized target is confirmed resolvable.",
            "For css_dependency_import or dependency_asset_import_resolution failures, if direct tilde removal is not resolvable, an import may be changed to a verified equivalent installed package style asset when it keeps the same npm package and same theme/asset basename.",
            "For css_dependency_import or dependency_asset_import_resolution failures, do not move imports between files, add imports to styles.scss, add sibling package assets, change package versions, or edit TypeScript.",
            "For css_dependency_import or dependency_asset_import_resolution failures, changes are limited to style_import_update entries in .css, .scss, .sass, or .less files.",
            "For css_dependency_import or dependency_asset_import_resolution failures, do not change TypeScript files, package versions, dependencies, dependency removals, Angular modules, or business logic.",
            "For css_dependency_import or dependency_asset_import_resolution failures, reject AI plans unless the replacement is confirmed direct tilde removal or a package-verified equivalent style asset path.",
            "For css_dependency_import or dependency_asset_import_resolution failures, include the original unresolved import, direct normalized import attempted, whether it was confirmed, selected package asset path, and changed style files in reportNotes or change metadata when available.",
            "After install/build/test validation proves a third-party package blocks the hop, package_update is allowed for that proven blocker package.",
            "Project-owned .d.ts compatibility shims are allowed for third-party declaration failures when no runtime behavior changes.",
            "tsconfig/angular.json/package config updates are allowed when minimal and tied to the validation failure.",
            "Angular module import/export wiring is allowed only for compiler-proven package visibility errors and must not change business behavior.",
            "Do not execute commands.",
            "Do not inspect the filesystem.",
            "Do not run build/test/install.",
            "Return only JSON.",
            "The migration agent will apply changes and run commands."),
        ["requiredResponseShape"] = new JsonObject
        {
            ["summary"] = "Short explanation of detected failure cause",
            ["confidence"] = 0.0,
            ["risk"] = "low|medium|high",
            ["requiresManualCorrection"] = false,
            ["manualCorrectionReason"] = null,
            ["failureCategory"] = "script|dependency|type_declaration|css_dependency_import|dependency_asset_import_resolution|third_party_angular_incompatibility|compiler|config|test|unknown",
            ["businessLogicChanged"] = false,
            ["changes"] = new JsonArray(new JsonObject
            {
                ["file"] = "package.json",
                ["type"] = "script_update|package_update|config_update|type_shim|source_update|style_import_update|test_config_update",
                ["reason"] = "exact reason tied to validation failure",
                ["packageName"] = "package name for package remediations",
                ["oldImport"] = "old Angular module import when replacement wiring is needed",
                ["newImport"] = "new Angular module import when replacement wiring is needed",
                ["before"] = "exact text to replace",
                ["after"] = "replacement text"
            }),
            ["commandsToRunAfter"] = new JsonArray(),
            ["reportNotes"] = new JsonArray()
        }
    };

    private static (bool Safe, string Reason) ValidatePlan(JsonObject plan, ValidationResult validation, string outputPath)
    {
        if (plan["summary"] is null || plan["confidence"] is null || plan["risk"] is null || plan["changes"] is not JsonArray changes) return (false, "AI remediation JSON is invalid or incomplete.");
        if (plan.BoolValue("requiresManualCorrection") || plan.BoolValue("requiresHumanReview")) return (false, "AI requested manual correction.");
        if (string.Equals(plan.StringValue("risk"), "high", StringComparison.OrdinalIgnoreCase)) return (false, "AI remediation risk is high.");
        if (plan.BoolValue("businessLogicChanged")) return (false, "AI remediation changes business logic, which requires manual correction.");
        if (ConfidenceValue(plan["confidence"]) < MinimumConfidence) return (false, "AI remediation confidence is below the safe threshold.");
        if (changes.Count == 0) return (false, "AI remediation plan contains no changes.");
        if (!CommandsArePlanOnly(plan["commandsToRunAfter"] as JsonArray)) return (false, "AI remediation must not request command execution; the migration agent owns validation.");
        var cssFailure = IsCssDependencyImportFailure(validation.Output + "\n" + validation.Errors);
        var cssPlan = cssFailure ||
                      string.Equals(plan.StringValue("failureCategory"), "css_dependency_import", StringComparison.OrdinalIgnoreCase) ||
                      string.Equals(plan.StringValue("failureCategory"), "dependency_asset_import_resolution", StringComparison.OrdinalIgnoreCase);
        foreach (var change in changes.OfType<JsonObject>())
        {
            var file = change.StringValue("file");
            var type = change.StringValue("type");
            if (string.IsNullOrWhiteSpace(file) || string.IsNullOrWhiteSpace(type) || string.IsNullOrWhiteSpace(change.StringValue("reason"))) return (false, "AI remediation change is incomplete.");
            if (!AllowedChangeTypes.Contains(type)) return (false, $"AI remediation change type {type} is not allowed.");
            if (cssPlan && !string.Equals(type, "style_import_update", StringComparison.OrdinalIgnoreCase)) return (false, "CSS dependency import remediation may only rewrite style asset imports.");
            if (cssPlan && !IsStyleFile(file)) return (false, $"CSS dependency import remediation cannot edit non-style file {file}.");
            if (TouchesBlockedPath(file)) return (false, $"AI remediation change touches blocked path {file}.");
            if (change.BoolValue("delete") || string.Equals(type, "delete", StringComparison.OrdinalIgnoreCase)) return (false, "AI remediation cannot delete files.");
            if (string.Equals(type, "source_update", StringComparison.OrdinalIgnoreCase) && HasThirdPartyAngularRootCause(validation) && !IsEntryComponentsSourceUpdate(change, validation)) return (false, $"Source file {file} cannot be edited while a node_modules Angular package is the validation root cause.");
            if (string.Equals(type, "source_update", StringComparison.OrdinalIgnoreCase) && !ValidationMentionsFile(validation, file)) return (false, $"Source file {file} is not directly tied to the validation failure.");
            if (string.Equals(type, "source_update", StringComparison.OrdinalIgnoreCase) && !ValidationOutputHasCompilerEvidence(validation, file)) return (false, $"Source file {file} lacks exact compiler/build evidence in the validation failure.");
            if (string.Equals(type, "script_update", StringComparison.OrdinalIgnoreCase) && !IsSafeScriptUpdate(change, validation)) return (false, $"Script update in {file} is not tied to a deprecated CLI flag validation failure.");
            if (string.Equals(type, "package_update", StringComparison.OrdinalIgnoreCase) && !change.BoolValue("requiresVersionVerification")) return (false, $"Package update in {file} must require npm version verification before applying.");
            if (string.Equals(type, "package_update", StringComparison.OrdinalIgnoreCase) && !IsValidationProvenPackageUpdate(change, validation)) return (false, $"Package update in {file} is not limited to a validation-proven blocker package.");
            if (string.Equals(type, "config_update", StringComparison.OrdinalIgnoreCase) && !IsSafeConfigUpdate(file, change, validation)) return (false, $"Config update in {file} is not minimal or directly tied to the validation failure.");
            if (string.Equals(type, "style_import_update", StringComparison.OrdinalIgnoreCase))
            {
                var styleSafety = ValidateStyleImportUpdate(change, validation, outputPath);
                if (!styleSafety.Safe) return styleSafety;
            }
            if (string.Equals(type, "source_update", StringComparison.OrdinalIgnoreCase) && change.StringValue("after").Length > change.StringValue("before").Length + 2000) return (false, $"Source update for {file} is too large for automatic remediation.");
            if (string.Equals(type, "type_shim", StringComparison.OrdinalIgnoreCase) && !IsSafeTypeShim(file)) return (false, $"Type shim {file} is not a safe project-level declaration file.");
            if (string.Equals(type, "type_shim", StringComparison.OrdinalIgnoreCase) && !IsSafeTypeShimMetadata(plan, change)) return (false, $"Type shim {file} is missing required validation-driven no-runtime-impact safety metadata.");
            if (string.Equals(type, "type_shim", StringComparison.OrdinalIgnoreCase) && !IsDeclarationOnlyTypeShim(change.StringValue("after"))) return (false, $"Type shim {file} must contain declarations only.");
            if (string.Equals(type, "type_shim", StringComparison.OrdinalIgnoreCase) && !CanEnsureTypeShimIncluded(outputPath, file)) return (false, $"Type shim {file} is not included by tsconfig and no safe tsconfig include update is possible.");
            if (!string.Equals(type, "source_update", StringComparison.OrdinalIgnoreCase) && !string.Equals(type, "style_import_update", StringComparison.OrdinalIgnoreCase) && !string.Equals(type, "type_shim", StringComparison.OrdinalIgnoreCase) && !IsSafeManifest(file)) return (false, $"File {file} is not a safe remediation target.");
            if (!string.Equals(type, "type_shim", StringComparison.OrdinalIgnoreCase) && (string.IsNullOrEmpty(change.StringValue("before")) || change["after"] is null)) return (false, $"Change for {file} must include exact before and after text.");
            if (IsBroadPackageUpdate(change, validation)) return (false, $"Package update in {file} is broad or unrelated to the failure.");
        }
        return (true, "");
    }

    public static (bool Safe, string Reason) ValidatePlanForTesting(JsonObject plan, ValidationResult validation, string outputPath) => ValidatePlan(plan, validation, outputPath);

    private static async Task<JsonObject?> ApplyChangeAsync(JsonObject plan, JsonObject change, string outputPath, IMigrationAdapter adapter, int attempt, int maxAttempts, ValidationResult validation, CancellationToken cancellationToken)
    {
        var type = change.StringValue("type");
        if (type is "dependency" or "package")
        {
            var files = await adapter.UpgradePackageAsync(outputPath, change, cancellationToken);
            return WithPlanMetadata(new JsonObject { ["attempt"] = attempt, ["maxAttempts"] = maxAttempts, ["type"] = type, ["file"] = change.StringValue("sourceFile"), ["name"] = change.StringValue("name"), ["reason"] = change.StringValue("reason"), ["files"] = JsonSerializer.SerializeToNode(files.Select(f => Path.GetRelativePath(outputPath, f)).ToArray()) }, plan, validation);
        }

        var file = NormalizeRelativePath(change.StringValue("file"));
        if (!IsSafeManifest(file) && !IsSafeTypeShim(file) && !(IsSourceFile(file) && ValidationMentionsFile(validation, file)) && !(string.Equals(type, "style_import_update", StringComparison.OrdinalIgnoreCase) && IsStyleFile(file) && ValidationMentionsFile(validation, file))) return null;
        var full = Path.GetFullPath(Path.Combine(outputPath, file));
        if (!IsUnderRoot(full, outputPath)) return null;
        var exists = File.Exists(full);
        if (!exists && !string.Equals(type, "type_shim", StringComparison.OrdinalIgnoreCase)) return null;
        var before = exists ? await File.ReadAllTextAsync(full, cancellationToken) : "";
        var find = change.StringValue("before", change.StringValue("find"));
        var replace = change.StringValue("after", change.StringValue("replace"));
        if (!string.Equals(type, "type_shim", StringComparison.OrdinalIgnoreCase) &&
            exists &&
            (string.IsNullOrEmpty(find) || before.Contains(find, StringComparison.Ordinal) is false))
        {
            return null;
        }
        JsonArray? styleFilesChanged = null;
        var originalImport = ExtractImportSpecifier(find);
        var replacementImport = ExtractImportSpecifier(replace);
        if (string.Equals(type, "style_import_update", StringComparison.OrdinalIgnoreCase))
        {
            var beforePackage = ParsePackageImport(originalImport);
            var safeApplication = await ApplyStyleImportWithFileTypeSafetyAsync(outputPath, originalImport, replacementImport, beforePackage?.PackageName ?? "", beforePackage?.Subpath ?? "", cancellationToken);
            if (!safeApplication.Safe) return null;
            styleFilesChanged = safeApplication.ChangedFiles;
            replacementImport = safeApplication.SelectedImport;
            if (styleFilesChanged.Count == 0 || StyleImportStillPresent(outputPath, originalImport)) return null;
            RecordCssRemediationState(outputPath, styleFilesChanged.Select(f => f?.ToString() ?? "").Where(f => !string.IsNullOrWhiteSpace(f)), originalImport, replacementImport, beforePackage?.PackageName ?? change.StringValue("packageName"), safeApplication.Reason, validation.FailedHop ?? "", true);
        }
        else if (string.Equals(type, "type_shim", StringComparison.OrdinalIgnoreCase))
        {
            Directory.CreateDirectory(Path.GetDirectoryName(full)!);
            var after = MergeTypeShimContent(before, replace);
            await File.WriteAllTextAsync(full, after, cancellationToken);
            await EnsureTypeShimIncludedAsync(outputPath, file, cancellationToken);
        }
        else
        {
            Directory.CreateDirectory(Path.GetDirectoryName(full)!);
            await File.WriteAllTextAsync(full, exists ? before.Replace(find, replace, StringComparison.Ordinal) : replace, cancellationToken);
        }
        return WithPlanMetadata(new JsonObject
        {
            ["attempt"] = attempt,
            ["maxAttempts"] = maxAttempts,
            ["type"] = type,
            ["status"] = "applied",
            ["file"] = file,
            ["reason"] = change.StringValue("reason"),
            ["change"] = exists ? $"replaced `{find}` with `{replace}`" : "added project-level compatibility shim",
            ["mode"] = "ai",
            ["failedCommand"] = FailedCommand(validation),
            ["failureCause"] = plan.StringValue("summary", planSummaryFallback(validation)),
            ["businessFile"] = string.Equals(type, "type_shim", StringComparison.OrdinalIgnoreCase) || string.Equals(type, "style_import_update", StringComparison.OrdinalIgnoreCase) ? false : IsSourceFile(file),
            ["sourceCodeImpact"] = string.Equals(type, "type_shim", StringComparison.OrdinalIgnoreCase) || string.Equals(type, "style_import_update", StringComparison.OrdinalIgnoreCase) ? false : IsSourceFile(file),
            ["validationDriven"] = true,
            ["manualReviewRequired"] = false,
            ["functionalImpact"] = change.StringValue("functionalImpact", string.Equals(type, "type_shim", StringComparison.OrdinalIgnoreCase) || string.Equals(type, "style_import_update", StringComparison.OrdinalIgnoreCase) || !IsSourceFile(file) ? "none" : "compiler-targeted"),
            ["packageName"] = change.StringValue("packageName"),
            ["installedVersion"] = change.StringValue("installedVersion"),
            ["oldImport"] = originalImport,
            ["newImport"] = replacementImport,
            ["originalUnresolvedImport"] = originalImport,
            ["selectedImport"] = replacementImport,
            ["changedStyleFiles"] = styleFilesChanged,
            ["originalUnresolvedImportsRemain"] = string.Equals(type, "style_import_update", StringComparison.OrdinalIgnoreCase) && StyleImportStillPresent(outputPath, originalImport),
            ["deterministicRemediationAttempted"] = string.Equals(type, "style_import_update", StringComparison.OrdinalIgnoreCase) && IsCssDependencyImportFailure(validation.Output + "\n" + validation.Errors),
            ["deterministicRemediationApplied"] = false,
            ["deterministicFailureReason"] = string.Equals(type, "style_import_update", StringComparison.OrdinalIgnoreCase) && IsCssDependencyImportFailure(validation.Output + "\n" + validation.Errors) ? "CSS dependency import remediation could not find a safe installed package file candidate after deterministic resolution." : "",
            ["rootCause"] = change.StringValue("rootCause", plan.StringValue("summary")),
            ["reviewNote"] = change.StringValue("reviewNote")
        }, plan, validation);
    }

    private static string MergeTypeShimContent(string before, string declaration)
    {
        var after = declaration.Trim();
        if (string.IsNullOrWhiteSpace(after)) return before;
        var typeName = TypeAliasName(after);
        if (!string.IsNullOrWhiteSpace(typeName) &&
            Regex.IsMatch(before, $@"\btype\s+{Regex.Escape(typeName)}\b"))
        {
            return before;
        }

        var prefix = string.IsNullOrWhiteSpace(before) ? "" : before.TrimEnd() + Environment.NewLine + Environment.NewLine;
        return prefix + after + Environment.NewLine;
    }

    private static string TypeAliasName(string declaration)
    {
        var match = Regex.Match(declaration, @"\btype\s+(?<name>[A-Za-z_$][\w$]*)\b");
        return match.Success ? match.Groups["name"].Value : "";
    }

    private static async Task EnsureTypeShimIncludedAsync(string outputPath, string relativeFile, CancellationToken cancellationToken)
    {
        var normalized = NormalizeRelativePath(relativeFile);
        if (!normalized.StartsWith("src/", StringComparison.OrdinalIgnoreCase) && !normalized.StartsWith("types/", StringComparison.OrdinalIgnoreCase)) return;
        if (TsConfigIncludesDeclarationFile(outputPath, normalized)) return;

        foreach (var configFile in new[] { "tsconfig.app.json", "tsconfig.json" })
        {
            var path = Path.Combine(outputPath, configFile);
            if (!File.Exists(path)) continue;
            JsonObject? config;
            try
            {
                config = JsonNode.Parse(await File.ReadAllTextAsync(path, cancellationToken))?.AsObject();
            }
            catch
            {
                continue;
            }
            if (config is null) continue;
            var include = config["include"] as JsonArray;
            if (include is null)
            {
                include = new JsonArray();
                config["include"] = include;
            }
            var requiredInclude = normalized.StartsWith("types/", StringComparison.OrdinalIgnoreCase) ? "types/**/*.d.ts" : "src/**/*.d.ts";
            if (!include.Select(i => NormalizeRelativePath(i?.ToString() ?? "")).Any(i => i.Equals(requiredInclude, StringComparison.OrdinalIgnoreCase)))
            {
                include.Add(requiredInclude);
                await File.WriteAllTextAsync(path, config.ToJsonString(JsonHelpers.SerializerOptions) + Environment.NewLine, cancellationToken);
            }
            return;
        }
    }

    private static bool TsConfigIncludesDeclarationFile(string outputPath, string relativeFile)
    {
        foreach (var configFile in new[] { "tsconfig.app.json", "tsconfig.json" })
        {
            var path = Path.Combine(outputPath, configFile);
            if (!File.Exists(path)) continue;
            try
            {
                var config = JsonNode.Parse(File.ReadAllText(path))?.AsObject();
                if (config?["files"] is JsonArray files &&
                    files.Select(f => NormalizeRelativePath(f?.ToString() ?? "")).Any(f => f.Equals(relativeFile, StringComparison.OrdinalIgnoreCase)))
                {
                    return true;
                }
                if (config?["include"] is JsonArray include)
                {
                    var entries = include.Select(i => NormalizeRelativePath(i?.ToString() ?? "")).ToArray();
                    if (entries.Any(i => i.Equals("src/**/*.d.ts", StringComparison.OrdinalIgnoreCase))) return true;
                    if (entries.Any(i => i.Equals("types/**/*.d.ts", StringComparison.OrdinalIgnoreCase)) && relativeFile.StartsWith("types/", StringComparison.OrdinalIgnoreCase)) return true;
                    if (entries.Any(i => i.Equals(relativeFile, StringComparison.OrdinalIgnoreCase))) return true;
                    if (relativeFile.StartsWith("src/types/", StringComparison.OrdinalIgnoreCase) &&
                        entries.Any(i => i.Equals("src/types/**/*.d.ts", StringComparison.OrdinalIgnoreCase)))
                    {
                        return true;
                    }
                }
            }
            catch
            {
                // Ignore unreadable tsconfig files; the caller can still apply the shim itself safely.
            }
        }
        return false;
    }

    public static async Task<JsonObject?> TryApplyDeterministicRemediationAsync(string outputPath, ValidationResult validation, int attempt, int maxAttempts, bool sourceCompatibilityRemediation = false, CancellationToken cancellationToken = default)
    {
        var cssImportRemediation = await TryApplyCssPackageImportRemediationAsync(outputPath, validation, attempt, maxAttempts, cancellationToken);
        if (cssImportRemediation is not null) return cssImportRemediation;

        var failureText = $"{validation.Output}\n{validation.Errors}";
        var entryComponentsRemediation = sourceCompatibilityRemediation
            ? await TryRemoveEntryComponentsAsync(outputPath, validation, failureText, attempt, maxAttempts, cancellationToken)
            : null;
        if (entryComponentsRemediation is not null) return entryComponentsRemediation;

        if (!failureText.Contains("Unknown argument: prod", StringComparison.OrdinalIgnoreCase)) return null;
        var packageJsonPath = Path.Combine(outputPath, "package.json");
        if (!File.Exists(packageJsonPath)) return null;
        var packageJson = JsonNode.Parse(await File.ReadAllTextAsync(packageJsonPath, cancellationToken))?.AsObject();
        if (packageJson?["scripts"] is not JsonObject scripts) return null;
        var changed = false;
        var changedScripts = new JsonArray();
        foreach (var item in scripts.ToArray())
        {
            var value = item.Value?.ToString() ?? "";
            var updated = Regex.Replace(value, @"(?<!\S)--prod(?!\S)", "--configuration production");
            if (updated == value) continue;
            scripts[item.Key] = updated;
            changed = true;
            changedScripts.Add(item.Key);
        }
        if (!changed) return null;
        await File.WriteAllTextAsync(packageJsonPath, packageJson!.ToJsonString(JsonHelpers.SerializerOptions) + Environment.NewLine, cancellationToken);
        return new JsonObject
        {
            ["attempt"] = attempt,
            ["maxAttempts"] = maxAttempts,
            ["type"] = "script_update",
            ["file"] = "package.json",
            ["reason"] = "Angular CLI no longer accepts the deprecated --prod build flag.",
            ["change"] = "replaced --prod with --configuration production in package.json scripts",
            ["mode"] = "deterministic",
            ["failedCommand"] = FailedCommand(validation),
            ["failureCause"] = "Angular CLI rejected deprecated --prod flag",
            ["failureCategory"] = "script",
            ["confidence"] = 1.0,
            ["risk"] = "low",
            ["businessLogicChanged"] = false,
            ["scripts"] = changedScripts,
            ["businessFile"] = false
        };
    }

    private static async Task<JsonObject?> TryRemoveEntryComponentsAsync(string outputPath, ValidationResult validation, string failureText, int attempt, int maxAttempts, CancellationToken cancellationToken)
    {
        if (!failureText.Contains("entryComponents", StringComparison.OrdinalIgnoreCase) ||
            !failureText.Contains("NgModule", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var files = Regex.Matches(failureText, @"(?<file>(?:\.\/)?src[\\/][^\s:]+?\.ts)", RegexOptions.IgnoreCase)
            .Select(m => NormalizeRelativePath(m.Groups["file"].Value.TrimStart('.', '/', '\\')))
            .Where(f => ValidationMentionsFile(validation, f))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
        foreach (var file in files)
        {
            var full = Path.GetFullPath(Path.Combine(outputPath, file));
            if (!IsUnderRoot(full, outputPath) || !File.Exists(full)) continue;
            var before = await File.ReadAllTextAsync(full, cancellationToken);
            if (!before.Contains("@NgModule", StringComparison.Ordinal) || !before.Contains("entryComponents", StringComparison.Ordinal)) continue;

            var after = Regex.Replace(before, @"\s*,?\s*entryComponents\s*:\s*\[[^\]]*\]\s*,?", match =>
            {
                var value = match.Value;
                return value.TrimStart().StartsWith(",", StringComparison.Ordinal) ? "" : Environment.NewLine;
            }, RegexOptions.Singleline);
            after = Regex.Replace(after, @",\s*(\r?\n\s*})", "$1");
            if (after == before) continue;

            await File.WriteAllTextAsync(full, after, cancellationToken);
            return new JsonObject
            {
                ["attempt"] = attempt,
                ["maxAttempts"] = maxAttempts,
                ["type"] = "source_update",
                ["file"] = file,
                ["reason"] = "Angular Ivy/Angular 16 no longer supports entryComponents in NgModule metadata.",
                ["change"] = "removed entryComponents from NgModule metadata",
                ["mode"] = "deterministic",
                ["failedCommand"] = FailedCommand(validation),
                ["failureCause"] = "Obsolete Angular NgModule metadata property entryComponents",
                ["failureCategory"] = "obsolete_angular_metadata",
                ["confidence"] = 1.0,
                ["risk"] = "low",
                ["businessLogicChanged"] = false,
                ["businessFile"] = true,
                ["rootCause"] = "entryComponents is obsolete under Ivy and invalid in Angular 16 NgModule metadata",
                ["reviewNote"] = "Only Angular metadata was changed; component/service business logic was not modified."
            };
        }

        return null;
    }

    private static async Task<JsonObject?> TryApplyCssPackageImportRemediationAsync(string outputPath, ValidationResult validation, int attempt, int maxAttempts, CancellationToken cancellationToken)
    {
        if (!IsCssDependencyImportFailure(validation.Output + "\n" + validation.Errors)) return null;
        var context = BuildCssDependencyImportContext(outputPath, validation, new JsonObject());
        var failures = context["failures"]?.AsArray()?.OfType<JsonObject>().ToArray() ?? [];
        if (failures.Length == 0) return null;

        var applied = new JsonArray();
        var attemptedCandidates = new JsonArray();
        var appliedImports = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var failure in failures)
        {
            if (string.IsNullOrWhiteSpace(failure.StringValue("file")) ||
                string.IsNullOrWhiteSpace(failure.StringValue("originalImport")) ||
                failure["remediationPlan"] is not JsonObject plan ||
                string.Equals(plan.StringValue("selectedStrategy"), "manual_review", StringComparison.OrdinalIgnoreCase) ||
                string.IsNullOrWhiteSpace(plan.StringValue("replacementImport")))
            {
                return null;
            }
        }

        foreach (var failure in failures)
        {
            var file = failure.StringValue("file");
            var originalImport = failure.StringValue("originalImport");
            var plan = failure["remediationPlan"]!.AsObject();
            var replacementImport = plan.StringValue("replacementImport");
            attemptedCandidates.Add(plan.DeepClone());
            if (string.Equals(originalImport, replacementImport, StringComparison.Ordinal)) return null;
            if (!appliedImports.Add($"{file}\n{originalImport}")) continue;

            var full = Path.GetFullPath(Path.Combine(outputPath, file));
            if (!IsUnderRoot(full, outputPath) || !File.Exists(full) || !IsStyleFile(file) || !ValidationMentionsFile(validation, file)) return null;
            if (!PatchExactStyleImportInFile(full, originalImport, replacementImport, out var afterContent)) return null;
            await File.WriteAllTextAsync(full, afterContent, cancellationToken);
            var changedFiles = new JsonArray(file);
            if (FileContainsImport(outputPath, file, originalImport)) return null;
            RecordCssRemediationState(outputPath, [file], originalImport, replacementImport, failure.StringValue("packageName"), plan.StringValue("selectedStrategy"), validation.FailedHop ?? "", true);

            applied.Add(new JsonObject
            {
                ["file"] = file,
                ["changedFiles"] = changedFiles.DeepClone(),
                ["before"] = originalImport,
                ["after"] = replacementImport,
                ["directNormalizedImportAttempted"] = failure.StringValue("directNormalizedImportAttempted"),
                ["directNormalizedTargetConfirmed"] = failure.BoolValue("directNormalizedTargetConfirmed"),
                ["directNormalizedTargetConfirmationReason"] = failure.StringValue("directNormalizedTargetConfirmationReason"),
                ["selectedStrategy"] = plan.StringValue("selectedStrategy"),
                ["selectedImport"] = replacementImport,
                ["replacementImport"] = replacementImport,
                ["evidence"] = plan["evidence"]?.DeepClone(),
                ["rejectedCandidates"] = plan["rejectedCandidates"]?.DeepClone(),
                ["finalChosenRemediation"] = plan.StringValue("selectedStrategy")
            });
        }

        var first = failures[0];
        return new JsonObject
        {
            ["attempt"] = attempt,
            ["maxAttempts"] = maxAttempts,
            ["type"] = "style_import_update",
            ["mode"] = "deterministic",
            ["failedCommand"] = FailedCommand(validation),
            ["failureCause"] = "A package style import no longer resolves under the current Angular/Webpack style pipeline, and a same-package style asset replacement was confirmed.",
            ["failureCategory"] = "css_dependency_import",
            ["packageName"] = first.StringValue("packageName"),
            ["installedVersion"] = first.StringValue("installedVersion"),
            ["unresolvedDependencyImports"] = context["unresolvedDependencyImports"]?.DeepClone(),
            ["loaderResourceFilesFromErrorChain"] = context["loaderResourceFilesFromErrorChain"]?.DeepClone(),
            ["styleFilesContainingUnresolvedImports"] = context["styleFilesContainingUnresolvedImports"]?.DeepClone(),
            ["file"] = string.Join(", ", failures.Select(f => f.StringValue("file")).Distinct(StringComparer.OrdinalIgnoreCase)),
            ["files"] = new JsonArray(failures.Select(f => (JsonNode?)JsonValue.Create(f.StringValue("file"))).DistinctBy(n => n?.ToString(), StringComparer.OrdinalIgnoreCase).ToArray()),
            ["oldImport"] = string.Join(", ", failures.Select(f => f.StringValue("originalImport")).Distinct(StringComparer.OrdinalIgnoreCase)),
            ["newImport"] = string.Join(", ", applied.OfType<JsonObject>().Select(f => f.StringValue("after")).Distinct(StringComparer.OrdinalIgnoreCase)),
            ["directNormalizedImportAttempted"] = string.Join(", ", failures.Select(f => f.StringValue("directNormalizedImportAttempted")).Where(s => s.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase)),
            ["directNormalizedTargetConfirmed"] = failures.All(f => f.BoolValue("directNormalizedTargetConfirmed")),
            ["directNormalizedTargetConfirmationReason"] = string.Join("; ", failures.Select(f => f.StringValue("directNormalizedTargetConfirmationReason")).Where(s => s.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase)),
            ["candidateResolution"] = attemptedCandidates,
            ["change"] = "updated unresolved package style imports using deterministic import resolution",
            ["reason"] = "Angular/Webpack could not resolve the package style import; the replacement is selected by package exports and filesystem evidence.",
            ["rootCause"] = "package style import no longer resolves under the current Angular/Webpack style pipeline",
            ["reviewNote"] = "Only package style import statements were changed; no TypeScript, HTML, package versions, selectors, or CSS declarations were modified.",
            ["confidence"] = 0.98,
            ["risk"] = "low",
            ["businessLogicChanged"] = false,
            ["businessFile"] = false,
            ["manualCriticalAttentionRequired"] = false,
            ["styleImportUpdates"] = applied,
            ["exactUnresolvedImportsRemainingAfterRemediation"] = new JsonArray(),
            ["deterministicRemediationAttempted"] = true,
            ["deterministicRemediationApplied"] = true,
            ["deterministicRemediationRejected"] = false,
            ["aiRemediationAttempted"] = false,
            ["aiRemediationApplied"] = false,
            ["cssImportRemediationResolution"] = attemptedCandidates.DeepClone(),
            ["reportNotes"] = new JsonArray("Applied deterministic CSS import remediation resolution.")
        };
    }

    public static bool IsCssDependencyImportFailure(string text) =>
        Regex.IsMatch(text, @"Can't resolve\s+['""]~?@?[\w.-]+(?:/[\w.-]+)?(?:/[^'""]+)?['""]", RegexOptions.IgnoreCase) ||
        IsDependencyScssPartialResolution(text) ||
        Regex.IsMatch(text, @"(?:Package path|Package subpath|\./[^""']+)\s+.*(?:not exported|not defined by\s+""exports"")", RegexOptions.IgnoreCase) ||
        text.Contains("is not exported under the condition \"style\"", StringComparison.OrdinalIgnoreCase);

    private static bool IsDependencyScssPartialResolution(string text) =>
        Regex.IsMatch(text, @"Can't resolve\s+['""][^'"".\\/][^'""]*['""]\s+in\s+['""][^'""]*node_modules[\\/](?:@[\w.-]+[\\/][\w.-]+|[\w.-]+)[\\/][^'""]*(?:scss|sass)['""]", RegexOptions.IgnoreCase) &&
        Regex.IsMatch(text, @"node_modules[\\/](?:@[\w.-]+[\\/][\w.-]+|[\w.-]+)[\\/][^\s:'""!]*?(?:scss|sass)[\\/][^\s:'""!]+?\.s[ac]ss", RegexOptions.IgnoreCase);

    private static JsonObject BuildCssDependencyImportContext(string outputPath, ValidationResult validation, JsonObject manifest)
    {
        var text = validation.Output + "\n" + validation.Errors;
        var failures = new JsonArray();
        if (!IsCssDependencyImportFailure(text)) return new JsonObject { ["detected"] = false, ["failures"] = failures };

        var packageJson = ReadJsonObject(Path.Combine(outputPath, "package.json"));
        var unresolvedImports = ExtractUnresolvedDependencyImportsFromCantResolve(text)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
        var loaderResourceFiles = ExtractStyleFilesFromValidation(text)
            .Where(file => File.Exists(Path.Combine(outputPath, file)))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
        var styleFiles = unresolvedImports.Length > 0 && loaderResourceFiles.Length == 0
            ? EnumerateProjectStyleFiles(outputPath)
                .Where(file => unresolvedImports.Any(import => FileContainsImport(outputPath, file, import)))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray()
            : loaderResourceFiles.Where(file => unresolvedImports.Length == 0 || unresolvedImports.Any(import => FileContainsImport(outputPath, file, import))).ToArray();

        foreach (var file in styleFiles)
        {
            var full = Path.Combine(outputPath, file);
            var content = File.ReadAllText(full);
            foreach (var import in ExtractPackageImports(content))
            {
                var package = ParsePackageImport(import);
                if (package is null) continue;
                if (unresolvedImports.Length > 0)
                {
                    if (!unresolvedImports.Any(unresolved => ImportSpecifiersMatch(unresolved, import))) continue;
                }
                else if (!IsExportViolation(text) && !CssFailureMentionsImport(text, import, package.Value.PackageName, package.Value.Subpath)) continue;

                var packageMetadata = ReadPackageMetadata(outputPath, package.Value.PackageName);
                var remediationPlan = ResolveCssImportRemediationPlan(file, import, outputPath, text);
                var directConfirmed = string.Equals(remediationPlan.SelectedStrategy, "direct_package_import", StringComparison.Ordinal);
                failures.Add(new JsonObject
                {
                    ["file"] = file,
                    ["originalImport"] = import,
                    ["packageName"] = package.Value.PackageName,
                    ["packageSubpath"] = package.Value.Subpath,
                    ["installedVersion"] = packageMetadata.Version,
                    ["packageJsonDependencyVersion"] = PackageVersion(packageJson, package.Value.PackageName),
                    ["packageExports"] = packageMetadata.Exports?.DeepClone(),
                    ["exportedStyleEntryPoints"] = new JsonArray(packageMetadata.StyleExportKeys.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
                    ["installedPackageStyleAssets"] = new JsonArray(FindInstalledStyleAssets(outputPath, package.Value.PackageName).Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
                    ["sourceFileType"] = SourceFileType(file),
                    ["requestedExtension"] = Path.GetExtension(package.Value.Subpath),
                    ["directNormalizedImportAttempted"] = remediationPlan.DirectNormalizedImport,
                    ["directNormalizedTargetConfirmed"] = directConfirmed,
                    ["directNormalizedTargetConfirmationReason"] = directConfirmed
                        ? string.Join("; ", remediationPlan.Evidence)
                        : string.IsNullOrWhiteSpace(remediationPlan.DirectNormalizedImport)
                            ? "unresolved import does not start with ~, so no direct tilde removal is available"
                            : "direct normalized target was not confirmed by package exports",
                    ["nearbyImportsFromSamePackage"] = new JsonArray(ExtractPackageImports(content).Where(i => ParsePackageImport(i)?.PackageName == package.Value.PackageName).Distinct(StringComparer.OrdinalIgnoreCase).Select(i => (JsonNode?)JsonValue.Create(i)).ToArray()),
                    ["angularRelatedOrUiThemePackage"] = IsAngularRelatedOrUiThemePackage(package.Value.PackageName),
                    ["recommendedImport"] = remediationPlan.ReplacementImport,
                    ["remediationType"] = remediationPlan.SelectedStrategy,
                    ["candidateResolution"] = remediationPlan.ToJson(),
                    ["remediationPlan"] = remediationPlan.ToJson(),
                    ["deterministicRemediationAttempted"] = true,
                    ["deterministicRemediationApplied"] = !string.IsNullOrWhiteSpace(remediationPlan.ReplacementImport) && !string.Equals(import, remediationPlan.ReplacementImport, StringComparison.Ordinal),
                    ["deterministicFailureReason"] = remediationPlan.SelectedStrategy != "manual_review" ? "" : "No deterministic CSS import remediation candidate was valid.",
                    ["rejectedPackageUpgradeSignal"] = FindRejectedPackageSignal(validation, package.Value.PackageName, manifest)
                });
            }
        }

        if (failures.Count == 0 && IsExportViolation(text))
        {
            foreach (var fallback in BuildExportViolationCssFailures(outputPath, text, styleFiles, packageJson, validation, manifest))
            {
                failures.Add(fallback);
            }
            if (failures.Count == 0)
            {
                foreach (var match in Regex.Matches(text, @"\./(?<subpath>[^'""]+?)['""]?\s+is\s+not\s+exported.*?node_modules[\\/](?<package>@[\w.-]+[\\/][\w.-]+|[\w.-]+)", RegexOptions.IgnoreCase | RegexOptions.Singleline).OfType<Match>())
                {
                    var packageName = match.Groups["package"].Value.Replace('\\', '/');
                    var subpath = match.Groups["subpath"].Value.Replace('\\', '/');
                    var import = $"{packageName}/{subpath}";
                    foreach (var file in styleFiles.Where(f => FileContainsImport(outputPath, f, import)))
                    {
                        failures.Add(BuildCssFailureObject(outputPath, file, import, packageName, subpath, packageJson, validation, manifest, text));
                    }
                }
            }
        }

        return new JsonObject
        {
            ["detected"] = failures.Count > 0,
            ["failureCategory"] = failures.Count > 0 ? "css_dependency_import" : null,
            ["parentFailureCategory"] = null,
            ["unresolvedDependencyImports"] = new JsonArray(unresolvedImports.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
            ["styleFilesContainingUnresolvedImports"] = new JsonArray(styleFiles.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
            ["loaderResourceFilesFromErrorChain"] = new JsonArray(loaderResourceFiles.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
            ["rules"] = new JsonArray(
                "Extract only imports quoted by Can't resolve diagnostics.",
                "Try direct tilde removal when the unresolved import starts with ~.",
                "Apply direct tilde removal only when the same path without ~ is confirmed by package files or exports.",
                "If direct tilde removal is not resolvable, allow a same-package verified style asset path with the same theme/asset basename.",
                "No direct tilde removal or verified equivalent package asset path was found means manual review is required.",
                "For .css source files, package SCSS imports are forbidden unless the source file is converted to .scss and angular.json is updated; prefer existing compiled CSS package assets whenever they exist.",
                "Do not move imports to styles.scss, add sibling assets, change package versions, edit TypeScript, edit CSS declarations/selectors, or edit node_modules."),
            ["failures"] = failures
        };
    }

    private static IEnumerable<JsonObject> BuildExportViolationCssFailures(string outputPath, string text, IReadOnlyList<string> styleFiles, JsonObject? packageJson, ValidationResult validation, JsonObject manifest)
    {
        var exportFailures = Regex.Matches(text, @"\./(?<subpath>[^'""]+?)['""]?\s+is\s+not\s+exported.*?package\s+(?:(?:[^\r\n]*?node_modules[\\/](?<package>@[\w.-]+[\\/][\w.-]+|[\w.-]+))|(?<package>@[\w.-]+[\\/][\w.-]+|[\w.-]+))", RegexOptions.IgnoreCase | RegexOptions.Singleline)
            .Select(m => (PackageName: m.Groups["package"].Value.Replace('\\', '/'), Subpath: m.Groups["subpath"].Value.Replace('\\', '/')))
            .ToArray();
        foreach (var file in styleFiles)
        {
            var full = Path.Combine(outputPath, file.Replace('/', Path.DirectorySeparatorChar));
            if (!File.Exists(full)) continue;
            var imports = Regex.Matches(File.ReadAllText(full), @"@import\s+(?:url\()?['""](?<import>[^'"")]+)['""]", RegexOptions.IgnoreCase)
                .Select(m => m.Groups["import"].Value.Trim())
                .ToArray();
            foreach (var import in imports)
            {
                var package = ParsePackageImport(import);
                if (package is null) continue;
                if (exportFailures.Length > 0 && !text.Contains(package.Value.PackageName, StringComparison.OrdinalIgnoreCase) && !exportFailures.Any(f =>
                    string.Equals(f.PackageName, package.Value.PackageName, StringComparison.OrdinalIgnoreCase) &&
                    string.Equals(ThemeAssetIntent(f.Subpath), ThemeAssetIntent(package.Value.Subpath), StringComparison.OrdinalIgnoreCase)))
                {
                    continue;
                }

                yield return BuildCssFailureObject(outputPath, file, import, package.Value.PackageName, package.Value.Subpath, packageJson, validation, manifest, text);
            }
        }
    }

    private static JsonObject BuildCssFailureObject(string outputPath, string file, string import, string packageName, string packageSubpath, JsonObject? packageJson, ValidationResult validation, JsonObject manifest, string text)
    {
        var packageMetadata = ReadPackageMetadata(outputPath, packageName);
        var remediationPlan = ResolveCssImportRemediationPlan(file, import, outputPath, text);
        var directConfirmed = string.Equals(remediationPlan.SelectedStrategy, "direct_package_import", StringComparison.Ordinal);
        var content = File.ReadAllText(Path.Combine(outputPath, file.Replace('/', Path.DirectorySeparatorChar)));
        return new JsonObject
        {
            ["file"] = file,
            ["originalImport"] = import,
            ["packageName"] = packageName,
            ["packageSubpath"] = packageSubpath,
            ["installedVersion"] = packageMetadata.Version,
            ["packageJsonDependencyVersion"] = PackageVersion(packageJson, packageName),
            ["packageExports"] = packageMetadata.Exports?.DeepClone(),
            ["exportedStyleEntryPoints"] = new JsonArray(packageMetadata.StyleExportKeys.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
            ["installedPackageStyleAssets"] = new JsonArray(FindInstalledStyleAssets(outputPath, packageName).Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
            ["sourceFileType"] = SourceFileType(file),
            ["requestedExtension"] = Path.GetExtension(packageSubpath),
            ["directNormalizedImportAttempted"] = remediationPlan.DirectNormalizedImport,
            ["directNormalizedTargetConfirmed"] = directConfirmed,
            ["directNormalizedTargetConfirmationReason"] = directConfirmed ? string.Join("; ", remediationPlan.Evidence) : "direct normalized target was not confirmed by package exports",
            ["nearbyImportsFromSamePackage"] = new JsonArray(ExtractPackageImports(content).Where(i => ParsePackageImport(i)?.PackageName == packageName).Distinct(StringComparer.OrdinalIgnoreCase).Select(i => (JsonNode?)JsonValue.Create(i)).ToArray()),
            ["angularRelatedOrUiThemePackage"] = IsAngularRelatedOrUiThemePackage(packageName),
            ["recommendedImport"] = remediationPlan.ReplacementImport,
            ["remediationType"] = remediationPlan.SelectedStrategy,
            ["candidateResolution"] = remediationPlan.ToJson(),
            ["remediationPlan"] = remediationPlan.ToJson(),
            ["deterministicRemediationAttempted"] = true,
            ["deterministicRemediationApplied"] = !string.IsNullOrWhiteSpace(remediationPlan.ReplacementImport) && !string.Equals(import, remediationPlan.ReplacementImport, StringComparison.Ordinal),
            ["deterministicFailureReason"] = remediationPlan.SelectedStrategy != "manual_review" ? "" : "No deterministic CSS import remediation candidate was valid.",
            ["rejectedPackageUpgradeSignal"] = FindRejectedPackageSignal(validation, packageName, manifest)
        };
    }

    public static JsonObject BuildCssDependencyImportContextForTesting(string outputPath, ValidationResult validation) =>
        BuildCssDependencyImportContext(outputPath, validation, new JsonObject());

    private static (bool Safe, string Reason) ValidateStyleImportUpdate(JsonObject change, ValidationResult validation, string outputPath)
    {
        var file = NormalizeRelativePath(change.StringValue("file"));
        var before = ExtractImportSpecifier(change.StringValue("before"));
        var after = ExtractImportSpecifier(change.StringValue("after"));
        if (!IsStyleFile(file)) return (false, $"Style import update target {file} is not a CSS/SCSS/SASS file.");
        if (!ValidationMentionsFile(validation, file)) return (false, $"Style file {file} is not directly tied to the validation failure.");
        if (string.IsNullOrWhiteSpace(before) || string.IsNullOrWhiteSpace(after)) return (false, $"Style import update for {file} must contain package import before/after values.");
        var beforeImport = ParsePackageImport(before);
        var afterImport = ParsePackageImport(after);
        if (beforeImport is null || afterImport is null) return (false, "Style import update must modify a package import, not a local application import.");
        if (IsCssFile(file) && IsPackageScssImport(afterImport.Value.Subpath))
        {
            return (false, "Style import update cannot import package SCSS from a .css source file unless the file is converted to .scss and angular.json is updated.");
        }
        var originalUnresolvedImports = ExtractUnresolvedDependencyImportsFromCantResolve(validation.Output + "\n" + validation.Errors);
        if (originalUnresolvedImports.Count > 0 && !originalUnresolvedImports.Any(import => ImportSpecifiersMatch(import, before)))
        {
            return (false, "Style import update must target an original unresolved dependency import from the validation failure.");
        }
        if (!string.Equals(beforeImport.Value.PackageName, afterImport.Value.PackageName, StringComparison.OrdinalIgnoreCase)) return (false, "Style import update cannot switch packages.");
        if (!StyleImportReplacementIsSafe(outputPath, before, after, beforeImport.Value.PackageName, beforeImport.Value.Subpath, afterImport.Value.Subpath, validation.Output + "\n" + validation.Errors))
        {
            return (false, "CSS dependency import remediation must use confirmed direct tilde removal or a verified equivalent package asset path for this category.");
        }
        if (!StyleImportReplacementConfirmed(outputPath, beforeImport.Value.PackageName, afterImport.Value.Subpath, validation.Output + "\n" + validation.Errors)) return (false, $"Replacement style import {after} is not confirmed by package exports or package files.");
        return (true, "");
    }

    private static bool StyleImportReplacementIsSafe(string outputPath, string before, string after, string packageName, string beforeSubpath, string afterSubpath, string validationText)
    {
        if (before.StartsWith("~", StringComparison.Ordinal) && string.Equals(before[1..], after, StringComparison.Ordinal)) return true;
        if (!StyleImportReplacementConfirmed(outputPath, packageName, afterSubpath, validationText)) return false;
        return string.Equals(ThemeAssetIntent(beforeSubpath), ThemeAssetIntent(afterSubpath), StringComparison.OrdinalIgnoreCase);
    }

    private static bool StyleImportReplacementConfirmed(string outputPath, string packageName, string replacementSubpath, string validationText)
    {
        var metadata = ReadPackageMetadata(outputPath, packageName);
        var normalized = "./" + replacementSubpath.TrimStart('/');
        if (metadata.StyleExportKeys.Contains(normalized, StringComparer.OrdinalIgnoreCase)) return true;
        if (PackageFileExists(outputPath, packageName, replacementSubpath)) return true;
        return false;
    }

    private static JsonObject ManualRequest(JsonObject plan, ValidationResult validation, string outputPath, string reason, JsonObject? timeoutDetails = null, IReadOnlyList<JsonObject>? attemptedChanges = null, JsonArray? oldImportsRemaining = null)
    {
        var instructions = plan["manualInstructions"]?.DeepClone() as JsonArray ?? new JsonArray();
        var cssContext = IsCssDependencyImportFailure(validation.Output + "\n" + validation.Errors)
            ? BuildCssDependencyImportContext(outputPath, validation, new JsonObject())
            : null;
        if (instructions.Count == 0)
        {
            instructions.Add(new JsonObject { ["file"] = "unknown", ["line"] = null, ["error"] = validation.Errors.Length > 0 ? validation.Errors : validation.Output, ["possibleChange"] = SuggestedManualFix(validation), ["risk"] = reason, ["validationCommand"] = FailedCommand(validation) });
        }
        return new JsonObject
        {
            ["requiresHumanReview"] = true,
            ["reason"] = reason,
            ["rejectedAiPlanReason"] = reason,
            ["failedCommand"] = FailedCommand(validation),
            ["lastError"] = LogTail(validation.Errors.Length > 0 ? validation.Errors : validation.Output),
            ["aiRemediationTimeoutDetails"] = timeoutDetails?.DeepClone(),
            ["aiPlanDiagnostics"] = BuildPlanDiagnostics(plan, reason, attemptedChanges, oldImportsRemaining),
            ["cssDependencyImportFailures"] = cssContext,
            ["manualInstructions"] = instructions
        };
    }

    private static JsonObject BuildPlanDiagnostics(JsonObject plan, string rejectionReason, IReadOnlyList<JsonObject>? attemptedChanges, JsonArray? oldImportsRemaining) => new()
    {
        ["planReturned"] = plan.Count > 0,
        ["manualCorrectionReturned"] = plan.BoolValue("requiresManualCorrection") || plan.BoolValue("requiresHumanReview"),
        ["safetyRejected"] = !string.IsNullOrWhiteSpace(rejectionReason),
        ["safetyRejectionReason"] = rejectionReason,
        ["failureCategory"] = plan.StringValue("failureCategory"),
        ["proposedFiles"] = new JsonArray((plan["changes"]?.AsArray()?.OfType<JsonObject>().Select(c => (JsonNode?)JsonValue.Create(c.StringValue("file"))).Where(n => !string.IsNullOrWhiteSpace(n?.ToString())) ?? []).ToArray()),
        ["proposedReplacements"] = new JsonArray((plan["changes"]?.AsArray()?.OfType<JsonObject>().Select(c => (JsonNode?)new JsonObject
        {
            ["file"] = c.StringValue("file"),
            ["type"] = c.StringValue("type"),
            ["before"] = c.StringValue("before"),
            ["after"] = c.StringValue("after"),
            ["oldImport"] = ExtractImportSpecifier(c.StringValue("before")),
            ["newImport"] = ExtractImportSpecifier(c.StringValue("after"))
        }) ?? []).ToArray()),
        ["attemptedAppliedChanges"] = new JsonArray((attemptedChanges?.Select(c => (JsonNode?)c.DeepClone()) ?? []).ToArray()),
        ["oldImportsRemaining"] = oldImportsRemaining?.DeepClone() ?? new JsonArray()
    };

    private static bool IsSafeManifest(string file)
    {
        var name = Path.GetFileName(file.Replace('\\', '/'));
        return SafeStructuralNames.Contains(name) || name.EndsWith(".csproj", StringComparison.OrdinalIgnoreCase) || name.EndsWith(".sln", StringComparison.OrdinalIgnoreCase) || name.StartsWith("tsconfig.", StringComparison.OrdinalIgnoreCase);
    }
    private static bool IsSafeTypeShim(string file)
    {
        var normalized = NormalizeRelativePath(file);
        return normalized.EndsWith(".d.ts", StringComparison.OrdinalIgnoreCase) &&
               (normalized.StartsWith("src/types/", StringComparison.OrdinalIgnoreCase) || normalized.StartsWith("types/", StringComparison.OrdinalIgnoreCase));
    }

    private static bool IsSafeTypeShimMetadata(JsonObject plan, JsonObject change) =>
        change.BoolValue("validationDriven") &&
        !plan.BoolValue("businessLogicChanged") &&
        !change.BoolValue("businessLogicChanged") &&
        !change.BoolValue("sourceCodeImpact") &&
        !change.BoolValue("runtimeCodeChanged");

    private static bool IsDeclarationOnlyTypeShim(string content)
    {
        if (string.IsNullOrWhiteSpace(content)) return false;
        var text = Regex.Replace(content, @"/\*.*?\*/|//[^\r\n]*", "", RegexOptions.Singleline).Trim();
        if (text.Contains("=", StringComparison.Ordinal) &&
            !Regex.IsMatch(text, @"\btype\s+[A-Za-z_$][\w$]*\s*=", RegexOptions.IgnoreCase))
        {
            return false;
        }
        if (Regex.IsMatch(text, @"\b(function|class|const|let|var)\b", RegexOptions.IgnoreCase) &&
            !Regex.IsMatch(text, @"\bdeclare\s+(function|class|const|let|var)\b", RegexOptions.IgnoreCase))
        {
            return false;
        }
        if (Regex.IsMatch(text, @"\b(import|export)\s+[^;]*from\s+['""]", RegexOptions.IgnoreCase)) return false;
        return Regex.IsMatch(text, @"^\s*(?:declare\s+)?(?:global\s*\{|type\s+[A-Za-z_$][\w$]*\s*=|interface\s+[A-Za-z_$][\w$]*|namespace\s+[A-Za-z_$][\w$]*|module\s+['""][^'""]+['""]|[A-Za-z_$][\w$]*\s*:)", RegexOptions.IgnoreCase);
    }

    private static bool CanEnsureTypeShimIncluded(string outputPath, string relativeFile)
    {
        var normalized = NormalizeRelativePath(relativeFile);
        if (TsConfigIncludesDeclarationFile(outputPath, normalized)) return true;
        foreach (var configFile in new[] { "tsconfig.app.json", "tsconfig.json" })
        {
            var path = Path.Combine(outputPath, configFile);
            if (!File.Exists(path)) continue;
            try
            {
                return JsonNode.Parse(File.ReadAllText(path)) is JsonObject;
            }
            catch
            {
                continue;
            }
        }
        return false;
    }

    private static bool IsSourceFile(string file) => file.Replace('\\', '/').Contains("/src/", StringComparison.OrdinalIgnoreCase) || file.StartsWith("src/", StringComparison.OrdinalIgnoreCase) || new[] { ".cs", ".ts", ".js", ".java", ".py", ".go" }.Any(ext => file.EndsWith(ext, StringComparison.OrdinalIgnoreCase));
    private static bool ValidationMentionsFile(ValidationResult validation, string file) => (validation.Output + "\n" + validation.Errors).Contains(file.Replace('\\', '/'), StringComparison.OrdinalIgnoreCase) || (validation.Output + "\n" + validation.Errors).Contains(file.Replace('/', Path.DirectorySeparatorChar), StringComparison.OrdinalIgnoreCase);
    private static bool ValidationOutputHasCompilerEvidence(ValidationResult validation, string file)
    {
        var text = validation.Output + "\n" + validation.Errors;
        return ValidationMentionsFile(validation, file) && Regex.IsMatch(text, @"\b(error|TS\d+|CS\d+|NG\d+|compiler)\b", RegexOptions.IgnoreCase);
    }

    private static bool TouchesBlockedPath(string file)
    {
        var normalized = NormalizeRelativePath(file);
        if (normalized.StartsWith(".env", StringComparison.OrdinalIgnoreCase) || normalized.Contains("secret", StringComparison.OrdinalIgnoreCase) || normalized.Contains("credential", StringComparison.OrdinalIgnoreCase)) return true;
        return normalized.Split('/', StringSplitOptions.RemoveEmptyEntries).Any(p => p is "node_modules" or "bin" or "obj" or "dist" or ".angular" or ".git");
    }

    private static bool IsBroadPackageUpdate(JsonObject change, ValidationResult validation)
    {
        if (!string.Equals(change.StringValue("type"), "package_update", StringComparison.OrdinalIgnoreCase)) return false;
        var file = change.StringValue("file");
        if (!string.Equals(Path.GetFileName(file), "package.json", StringComparison.OrdinalIgnoreCase) && !file.EndsWith(".csproj", StringComparison.OrdinalIgnoreCase)) return false;
        var before = change.StringValue("before");
        var after = change.StringValue("after");
        if (before.Count(c => c == '\n') > 8 || after.Count(c => c == '\n') > 8) return true;
        var reason = change.StringValue("reason");
        return reason.Length == 0 || string.Equals(change.StringValue("failureCategory"), "dependency", StringComparison.OrdinalIgnoreCase) is false && before.Count(c => c == '\n') > 2 && after.Count(c => c == '\n') > 2;
    }

    private static bool IsSafeScriptUpdate(JsonObject change, ValidationResult validation)
    {
        if (!string.Equals(Path.GetFileName(change.StringValue("file")), "package.json", StringComparison.OrdinalIgnoreCase)) return false;
        var text = validation.Output + "\n" + validation.Errors;
        var before = change.StringValue("before");
        var after = change.StringValue("after");
        return text.Contains("Unknown argument: prod", StringComparison.OrdinalIgnoreCase) &&
               before.Contains("--prod", StringComparison.Ordinal) &&
               after.Contains("--configuration production", StringComparison.Ordinal);
    }

    private static bool IsSafeConfigUpdate(string file, JsonObject change, ValidationResult validation)
    {
        if (!IsSafeManifest(file)) return false;
        var name = Path.GetFileName(file.Replace('\\', '/'));
        var text = validation.Output + "\n" + validation.Errors;
        if (name.StartsWith("tsconfig", StringComparison.OrdinalIgnoreCase) &&
            (text.Contains(".d.ts", StringComparison.OrdinalIgnoreCase) ||
             text.Contains("Cannot find name", StringComparison.OrdinalIgnoreCase) ||
             text.Contains("TS2304", StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }
        if (name.Equals("angular.json", StringComparison.OrdinalIgnoreCase) &&
            (IsCssDependencyImportFailure(text) ||
             text.Contains("Unknown argument", StringComparison.OrdinalIgnoreCase) ||
             text.Contains("deprecated", StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }
        return text.Contains(name, StringComparison.OrdinalIgnoreCase) ||
               change.StringValue("reason").Contains("validation", StringComparison.OrdinalIgnoreCase) ||
               change.StringValue("reason").Contains("compiler", StringComparison.OrdinalIgnoreCase) ||
               change.StringValue("reason").Contains("build", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsValidationProvenPackageUpdate(JsonObject change, ValidationResult validation)
    {
        var file = Path.GetFileName(change.StringValue("file"));
        if (!string.Equals(file, "package.json", StringComparison.OrdinalIgnoreCase) &&
            !file.EndsWith(".csproj", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var packageNames = ProvenSourcePackageNamesFromPackageUpdate(change).ToArray();
        if (packageNames.Length == 0) return false;
        var text = validation.Output + "\n" + validation.Errors;
        var provenPackages = ExtractValidationMentionedPackages(text).ToHashSet(StringComparer.OrdinalIgnoreCase);
        return packageNames.Any(packageName => provenPackages.Contains(packageName) || text.Contains(packageName, StringComparison.OrdinalIgnoreCase));
    }

    private static bool HasThirdPartyAngularRootCause(ValidationResult validation)
    {
        var text = validation.Output + "\n" + validation.Errors;
        return Regex.IsMatch(text, @"node_modules[\\/].*\.d\.ts", RegexOptions.IgnoreCase) &&
               (text.Contains("does not appear to be an NgModule class", StringComparison.OrdinalIgnoreCase) ||
                text.Contains("not compatible with Angular Ivy", StringComparison.OrdinalIgnoreCase) ||
                text.Contains("ModuleWithProviders", StringComparison.OrdinalIgnoreCase) ||
                text.Contains("ɵɵNgModuleDefWithMeta", StringComparison.OrdinalIgnoreCase) ||
                text.Contains("ɵɵDirectiveDefWithMeta", StringComparison.OrdinalIgnoreCase));
    }

    private static bool IsEntryComponentsSourceUpdate(JsonObject change, ValidationResult validation)
    {
        var text = validation.Output + "\n" + validation.Errors;
        return text.Contains("entryComponents", StringComparison.OrdinalIgnoreCase) &&
               change.StringValue("before").Contains("entryComponents", StringComparison.OrdinalIgnoreCase) &&
               !change.StringValue("after").Contains("entryComponents", StringComparison.OrdinalIgnoreCase);
    }

    private static IEnumerable<string> ProvenSourcePackageNamesFromPackageUpdate(JsonObject change)
    {
        foreach (var value in new[] { change.StringValue("packageName"), change.StringValue("name") })
        {
            foreach (var packageName in value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                if (!string.IsNullOrWhiteSpace(packageName)) yield return packageName;
            }
        }
        foreach (var text in new[] { change.StringValue("before") })
        {
            foreach (Match match in Regex.Matches(text, "\"(?<name>(?:@[^/\"\\s]+/)?[^@\"\\s:]+)\"\\s*:", RegexOptions.IgnoreCase))
            {
                var name = match.Groups["name"].Value;
                if (!string.IsNullOrWhiteSpace(name) && !name.StartsWith("http", StringComparison.OrdinalIgnoreCase)) yield return name;
            }
        }
    }

    private static IEnumerable<string> ExtractValidationMentionedPackages(string text)
    {
        foreach (Match match in Regex.Matches(text, @"node_modules[\\/](?<pkg>@[^\\/:\s]+[\\/][^\\/:\s]+|[^\\/:\s]+)", RegexOptions.IgnoreCase))
        {
            yield return match.Groups["pkg"].Value.Replace('\\', '/');
        }
        foreach (Match match in Regex.Matches(text, @"(?:from|package|dependency)\s+(?<pkg>@?[\w.-]+(?:/[\w.-]+)?)", RegexOptions.IgnoreCase))
        {
            yield return match.Groups["pkg"].Value;
        }
    }

    private static IReadOnlyList<JsonObject> RejectedChanges(JsonObject plan, ValidationResult validation, string reason) =>
        (plan["changes"]?.AsArray()?.OfType<JsonObject>().Select(change => RejectedChange(plan, validation, change, reason)).ToArray() ?? []);

    private static JsonObject RejectedChange(JsonObject plan, ValidationResult validation, JsonObject change, string reason) => WithPlanMetadata(new JsonObject
    {
        ["attempt"] = null,
        ["type"] = change.StringValue("type"),
        ["status"] = "rejected",
        ["file"] = change.StringValue("file"),
        ["reason"] = change.StringValue("reason"),
        ["rejectedReason"] = reason,
        ["businessLogicChanged"] = plan.BoolValue("businessLogicChanged"),
        ["businessFile"] = IsSourceFile(change.StringValue("file")),
        ["failedCommand"] = FailedCommand(validation)
    }, plan, validation);

    private static bool CommandsArePlanOnly(JsonArray? commands)
    {
        if (commands is null || commands.Count == 0) return true;
        return commands.Select(c => c?.ToString() ?? "").All(string.IsNullOrWhiteSpace);
    }

    private static JsonObject WithPlanMetadata(JsonObject applied, JsonObject plan, ValidationResult validation)
    {
        applied["failedCommand"] = FailedCommand(validation);
        applied["failureCause"] = plan.StringValue("summary", applied.StringValue("failureCause"));
        applied["failureCategory"] = plan.StringValue("failureCategory", applied.StringValue("failureCategory", "unknown"));
        applied["confidence"] = ConfidenceValue(plan["confidence"]);
        applied["risk"] = plan.StringValue("risk", "medium");
        applied["businessLogicChanged"] = plan.BoolValue("businessLogicChanged");
        applied["reportNotes"] = plan["reportNotes"]?.DeepClone() ?? new JsonArray();
        return applied;
    }

    private static IReadOnlyList<string> FindManifestFiles(string root) =>
        ManifestFileNames.SelectMany(name => name.StartsWith('.') ? Directory.EnumerateFiles(root, "*" + name, SearchOption.AllDirectories) : Directory.EnumerateFiles(root, name, SearchOption.AllDirectories))
            .Where(path => !TouchesBlockedPath(Path.GetRelativePath(root, path)))
            .Select(path => NormalizeRelativePath(Path.GetRelativePath(root, path)))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Order(StringComparer.OrdinalIgnoreCase)
            .Take(50)
            .ToArray();

    private static IReadOnlyList<string> FindLockfiles(string root) =>
        FindManifestFiles(root).Where(f => Path.GetFileName(f) is "package-lock.json" or "yarn.lock" or "pnpm-lock.yaml" or "go.sum" or "Gemfile.lock").ToArray();

    private static double ConfidenceValue(JsonNode? node)
    {
        if (node is null) return 0;
        if (double.TryParse(node.ToString(), out var value)) return value > 1 ? value / 100 : value;
        return 0;
    }

    private static string FailedCommand(ValidationResult validation) => validation.FailureCommand is { Count: > 0 } ? string.Join(" ", validation.FailureCommand) : ExtractCommand(validation);
    private static string ExtractCommand(ValidationResult validation) => Regex.Match(validation.Output + "\n" + validation.Errors, @"^\$ (?<cmd>.+)$", RegexOptions.Multiline) is { Success: true } m ? m.Groups["cmd"].Value.Trim() : "validation command";
    private static int? ExtractExitCode(ValidationResult validation) => Regex.Match(validation.Output + "\n" + validation.Errors, @"exit code:\s*(?<code>-?\d+)", RegexOptions.IgnoreCase) is { Success: true } m ? int.Parse(m.Groups["code"].Value) : null;
    private static string LogTail(string text) => string.Join(Environment.NewLine, (text ?? "").Split(["\r\n", "\n"], StringSplitOptions.None).TakeLast(80));
    private static string LineTail(string text, int maxLines) => string.Join(Environment.NewLine, (text ?? "").Split(["\r\n", "\n"], StringSplitOptions.None).TakeLast(maxLines));
    private static string NormalizeRelativePath(string path) => path.Replace('\\', '/').TrimStart('/').Replace("../", "", StringComparison.Ordinal);
    private static bool IsUnderRoot(string fullPath, string root) => fullPath.StartsWith(Path.GetFullPath(root).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar) + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase);
    private static string planSummaryFallback(ValidationResult validation) => string.IsNullOrWhiteSpace(validation.Errors) ? LogTail(validation.Output) : validation.Errors;

    private static void NormalizePlanPaths(JsonObject plan, string outputPath)
    {
        foreach (var change in plan["changes"]?.AsArray()?.OfType<JsonObject>() ?? [])
        {
            NormalizeChangePath(change, "file", outputPath);
            NormalizeChangePath(change, "sourceFile", outputPath);
        }
    }

    private static void NormalizeChangePath(JsonObject change, string propertyName, string outputPath)
    {
        var value = change.StringValue(propertyName);
        if (string.IsNullOrWhiteSpace(value)) return;
        change[propertyName] = NormalizeAiPlanPath(value, outputPath);
    }

    private static string NormalizeAiPlanPath(string path, string outputPath)
    {
        var cleaned = path.Trim().Trim('"', '\'').Replace('\\', '/');
        var outputFull = Path.GetFullPath(outputPath).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        if (Path.IsPathFullyQualified(cleaned))
        {
            var full = Path.GetFullPath(cleaned);
            if (IsUnderRoot(full, outputFull)) return NormalizeRelativePath(Path.GetRelativePath(outputFull, full));
            return NormalizeRelativePath(cleaned);
        }

        var outputFullNormalized = outputFull.Replace('\\', '/');
        if (cleaned.StartsWith(outputFullNormalized + "/", StringComparison.OrdinalIgnoreCase))
        {
            return NormalizeRelativePath(cleaned[(outputFullNormalized.Length + 1)..]);
        }

        var normalized = NormalizeRelativePath(cleaned);
        var outputDirectoryName = Path.GetFileName(outputFull);
        return !string.IsNullOrWhiteSpace(outputDirectoryName) && normalized.StartsWith(outputDirectoryName + "/", StringComparison.OrdinalIgnoreCase)
            ? normalized[(outputDirectoryName.Length + 1)..]
            : normalized;
    }

    private static bool HasPreviousAiTimeout(ValidationResult validation) =>
        validation.AiRemediationChanges.Any(c => string.Equals(c.StringValue("failureCategory"), "ai_timeout", StringComparison.OrdinalIgnoreCase));

    private static bool IsAiTimeoutException(Exception ex) =>
        ex is TimeoutException ||
        ex.Message.Contains("idle-timeout", StringComparison.OrdinalIgnoreCase) ||
        ex.Message.Contains("total-timeout", StringComparison.OrdinalIgnoreCase) ||
        ex.Message.Contains("timed out", StringComparison.OrdinalIgnoreCase) ||
        ex.Message.Contains("Command timed out", StringComparison.OrdinalIgnoreCase);

    public static bool IsCodexSandboxValidationError(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return false;
        return text.Contains("spawn EPERM", StringComparison.OrdinalIgnoreCase) ||
               text.Contains("EPERM: operation not permitted", StringComparison.OrdinalIgnoreCase) ||
               text.Contains("sandbox", StringComparison.OrdinalIgnoreCase) ||
               text.Contains("failed to write debug log", StringComparison.OrdinalIgnoreCase) ||
               Regex.IsMatch(text, @"lstat\s+'?C:\\Users", RegexOptions.IgnoreCase) ||
               (text.Contains("esbuild-wasm", StringComparison.OrdinalIgnoreCase) && text.Contains("spawn", StringComparison.OrdinalIgnoreCase));
    }

    private static string ExtractTimeoutType(Exception ex)
    {
        var match = Regex.Match(ex.Message, @"(?<type>idle-timeout|total-timeout)", RegexOptions.IgnoreCase);
        return match.Success ? match.Groups["type"].Value.ToLowerInvariant() : "timeout";
    }

    private static JsonObject AiTimeoutChange(ValidationResult validation, int attempt, int maxAttempts, string timeoutType, bool reducedContext, Exception ex) => new()
    {
        ["attempt"] = attempt,
        ["maxAttempts"] = maxAttempts,
        ["type"] = "ai_timeout",
        ["mode"] = "ai",
        ["failedCommand"] = FailedCommand(validation),
        ["failureCause"] = "Codex CLI timed out during remediation planning",
        ["failureCategory"] = "ai_timeout",
        ["failureReason"] = "Codex CLI timed out during remediation planning",
        ["timeoutType"] = timeoutType,
        ["timeoutDetails"] = ex.Message,
        ["businessLogicChanged"] = false,
        ["businessFile"] = false,
        ["result"] = "failed",
        ["validationResultAfterRemediation"] = "not rerun",
        ["reducedContextUsed"] = reducedContext,
        ["nextAction"] = attempt < maxAttempts ? "retry" : "manual correction"
    };

    private static JsonObject AiEnvironmentErrorChange(ValidationResult validation, int attempt, int maxAttempts, bool reducedContext, string details) => new()
    {
        ["attempt"] = attempt,
        ["maxAttempts"] = maxAttempts,
        ["type"] = "ai_environment_error",
        ["mode"] = "ai",
        ["failedCommand"] = FailedCommand(validation),
        ["failureCause"] = "Codex sandbox validation error during remediation planning",
        ["failureCategory"] = "environment_error",
        ["failureReason"] = "Codex attempted or reported command execution in its sandbox; this output is not validation truth.",
        ["environmentErrorDetails"] = LogTail(details),
        ["businessLogicChanged"] = false,
        ["businessFile"] = false,
        ["result"] = "inconclusive",
        ["validationResultAfterRemediation"] = "inconclusive",
        ["reducedContextUsed"] = reducedContext,
        ["agentValidationRerunRequired"] = true,
        ["nextAction"] = attempt < maxAttempts ? "rerun validation with migration agent and retry with reduced context" : "rerun validation with migration agent"
    };

    private static JsonObject ReducedManifest(JsonObject manifest, JsonObject artifact)
    {
        var reduced = new JsonObject();
        foreach (var key in new[] { "runtime", "angularVersion", "angularCoreVersion", "angularCliVersion", "packageManager", "scripts", "builder" })
        {
            if (manifest[key] is not null) reduced[key] = manifest[key]!.DeepClone();
        }

        var packageName = artifact.StringValue("packageName");
        if (!string.IsNullOrWhiteSpace(packageName) && manifest["dependencies"] is JsonArray dependencies)
        {
            reduced["dependencies"] = new JsonArray(dependencies.OfType<JsonObject>()
                .Where(d => string.Equals(d.StringValue("name"), packageName, StringComparison.OrdinalIgnoreCase) || d.StringValue("name").Contains("angular", StringComparison.OrdinalIgnoreCase) || d.StringValue("name") is "typescript" or "rxjs" or "zone.js")
                .Take(30)
                .Select(d => (JsonNode?)d.DeepClone())
                .ToArray());
        }
        return reduced;
    }

    private static JsonObject RelevantManifestExcerpts(string outputPath, JsonObject manifest, JsonObject artifact)
    {
        var excerpts = new JsonObject { ["manifest"] = ReducedManifest(manifest, artifact) };
        var packageJson = Path.Combine(outputPath, "package.json");
        if (File.Exists(packageJson))
        {
            try
            {
                var package = JsonNode.Parse(File.ReadAllText(packageJson))?.AsObject();
                excerpts["packageJson"] = new JsonObject
                {
                    ["scripts"] = package?["scripts"]?.DeepClone(),
                    ["dependencies"] = FilterPackageSection(package?["dependencies"] as JsonObject, artifact.StringValue("packageName")),
                    ["devDependencies"] = FilterPackageSection(package?["devDependencies"] as JsonObject, artifact.StringValue("packageName"))
                };
            }
            catch
            {
                excerpts["packageJson"] = "unreadable";
            }
        }
        return excerpts;
    }

    private static JsonObject FilterPackageSection(JsonObject? section, string packageName)
    {
        var filtered = new JsonObject();
        if (section is null) return filtered;
        foreach (var item in section)
        {
            if (string.IsNullOrWhiteSpace(packageName) && filtered.Count >= 20) break;
            if (string.IsNullOrWhiteSpace(packageName) || string.Equals(item.Key, packageName, StringComparison.OrdinalIgnoreCase) || item.Key.Contains("angular", StringComparison.OrdinalIgnoreCase) || item.Key is "typescript" or "rxjs" or "zone.js")
            {
                filtered[item.Key] = item.Value?.DeepClone();
            }
        }
        return filtered;
    }

    private static JsonObject ExtractRelevantArtifact(string text)
    {
        var fileMatch = Regex.Match(text, @"(?<file>(?:src|app|projects|node_modules)[\\/][^\s:]+?\.(?:ts|js|json|d\.ts|scss|css|html))", RegexOptions.IgnoreCase);
        var packageMatch = Regex.Match(text, @"(?:from|package|module|Cannot find module)\s+'?(?<pkg>@?[\w.-]+(?:/[\w.-]+)?)'?", RegexOptions.IgnoreCase);
        return new JsonObject
        {
            ["filePath"] = fileMatch.Success ? NormalizeRelativePath(fileMatch.Groups["file"].Value) : "",
            ["packageName"] = packageMatch.Success ? packageMatch.Groups["pkg"].Value.Trim('\'', '"') : ""
        };
    }

    private static IReadOnlyList<string> ExtractStyleFilesFromValidation(string text)
    {
        var files = Regex.Matches(text, @"(?<file>(?:\.\/)?src[\\/][^\s:]+?\.(?:css|scss|sass|less))", RegexOptions.IgnoreCase)
            .Select(m => NormalizeRelativePath(m.Groups["file"].Value.TrimStart('.', '/', '\\')))
            .ToList();
        files.AddRange(Regex.Matches(text, @"(?<file>[A-Z]:[\\/][^\r\n:]+?\.(?:css|scss|sass|less))", RegexOptions.IgnoreCase)
            .Select(m => NormalizeRelativePath(string.Join('/', m.Groups["file"].Value.Replace('\\', '/').Split('/').SkipWhile(p => !string.Equals(p, "src", StringComparison.OrdinalIgnoreCase))))));
        return files.Where(IsStyleFile).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
    }

    public static IReadOnlyList<string> ExtractUnresolvedDependencyImportsForTesting(string text) =>
        ExtractUnresolvedDependencyImportsFromCantResolve(text);

    private static IReadOnlyList<string> ExtractUnresolvedDependencyImportsFromCantResolve(string text) =>
        Regex.Matches(text, @"(?:Module\s+not\s+found:\s*)?Error:\s+Can't\s+resolve\s+['""](?<import>[^'""]+)['""]", RegexOptions.IgnoreCase)
            .Select(m => m.Groups["import"].Value.Trim())
            .Where(IsDependencyImportSpecifier)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

    private static bool IsDependencyImportSpecifier(string import)
    {
        var value = import.Trim().Trim('"', '\'').Replace('\\', '/');
        if (value.Length == 0 || value.StartsWith(".", StringComparison.Ordinal) || value.StartsWith("/", StringComparison.Ordinal)) return false;
        if (LooksLikeLocalStylesheetImport(value)) return false;
        if (!value.StartsWith("~", StringComparison.Ordinal) && !value.Contains('/', StringComparison.Ordinal)) return false;
        var packageImport = ParsePackageImport(value);
        return packageImport is not null && (!string.IsNullOrWhiteSpace(packageImport.Value.Subpath) || !value.Contains('/', StringComparison.Ordinal));
    }

    private static bool LooksLikeLocalStylesheetImport(string import)
    {
        var value = import.StartsWith("~", StringComparison.Ordinal) ? import[1..] : import;
        return value.StartsWith("src/", StringComparison.OrdinalIgnoreCase) ||
               value.StartsWith("assets/", StringComparison.OrdinalIgnoreCase) ||
               value.StartsWith("app/", StringComparison.OrdinalIgnoreCase) ||
               value.StartsWith("projects/", StringComparison.OrdinalIgnoreCase) ||
               value.StartsWith("node_modules/", StringComparison.OrdinalIgnoreCase);
    }

    private static IReadOnlyList<string> ExtractPackageImports(string content) =>
        Regex.Matches(content, @"@import\s+(?:url\()?['""](?<import>[^'"")]+)['""]", RegexOptions.IgnoreCase)
            .Select(m => m.Groups["import"].Value.Trim())
            .Where(i => ParsePackageImport(i) is not null)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

    private static (string PackageName, string Subpath)? ParsePackageImport(string import)
    {
        var value = import.Trim().Trim('"', '\'');
        if (value.StartsWith("~", StringComparison.Ordinal)) value = value[1..];
        if (value.StartsWith(".", StringComparison.Ordinal) || value.StartsWith("/", StringComparison.Ordinal)) return null;
        var parts = value.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 0) return null;
        var packageName = parts[0].StartsWith("@", StringComparison.Ordinal) && parts.Length >= 2 ? $"{parts[0]}/{parts[1]}" : parts[0];
        var skip = packageName.StartsWith("@", StringComparison.Ordinal) ? 2 : 1;
        var subpath = string.Join('/', parts.Skip(skip));
        return (packageName, subpath);
    }

    private static bool CssFailureMentionsImport(string text, string import, string packageName, string subpath)
    {
        var withoutTilde = import.StartsWith("~", StringComparison.Ordinal) ? import[1..] : import;
        var normalizedSubpath = subpath.TrimStart('/');
        var noExtension = RemoveStyleExtension(normalizedSubpath);
        return text.Contains(import, StringComparison.OrdinalIgnoreCase) ||
               text.Contains(withoutTilde, StringComparison.OrdinalIgnoreCase) ||
               text.Contains(packageName, StringComparison.OrdinalIgnoreCase) && (text.Contains(normalizedSubpath, StringComparison.OrdinalIgnoreCase) || text.Contains(noExtension, StringComparison.OrdinalIgnoreCase) || IsExportViolation(text));
    }

    private static bool ImportSpecifiersMatch(string left, string right)
    {
        var a = left.Trim().Trim('"', '\'');
        var b = right.Trim().Trim('"', '\'');
        if (string.Equals(a, b, StringComparison.OrdinalIgnoreCase)) return true;
        if (a.StartsWith("~", StringComparison.Ordinal) && string.Equals(a[1..], b, StringComparison.OrdinalIgnoreCase)) return true;
        if (b.StartsWith("~", StringComparison.Ordinal) && string.Equals(b[1..], a, StringComparison.OrdinalIgnoreCase)) return true;
        return false;
    }

    public static JsonObject ResolveCssImportRemediation(string sourceFile, string failedImport, string projectRoot)
    {
        return ResolveCssImportRemediationPlan(sourceFile, failedImport, projectRoot, "").ToJson();
    }

    private static CssImportRemediationPlan ResolveCssImportRemediationPlan(string sourceFile, string failedImport, string projectRoot, string validationText)
    {
        var source = NormalizeRelativePath(sourceFile);
        var parsed = ParsePackageImport(failedImport);
        var rejected = new List<JsonObject>();
        var evidence = new List<string>();
        if (parsed is null)
        {
            rejected.Add(RejectedCandidate("parse_import", "not_a_package_import"));
            return CssImportRemediationPlan.Manual(source, failedImport, "", "", "", SourceFileType(source), evidence, rejected);
        }

        var packageName = parsed.Value.PackageName;
        var requestedSubpath = parsed.Value.Subpath;
        var sourceFileType = SourceFileType(source);
        var requestedExtension = Path.GetExtension(requestedSubpath);
        var metadata = ReadPackageMetadata(projectRoot, packageName);
        var direct = failedImport.StartsWith("~", StringComparison.Ordinal) ? failedImport[1..] : "";
        if (!string.IsNullOrWhiteSpace(direct))
        {
            var directExport = PackageImportAllowedByExports(metadata, requestedSubpath);
            var blockedByExports = metadata.Exports is not null && !directExport;
            if (blockedByExports)
            {
                rejected.Add(RejectedCandidate("direct_package_import", "package_exports_block_subpath", new JsonObject { ["subpath"] = "./" + requestedSubpath.TrimStart('/') }));
            }
            else if (directExport || PackageFileExistsExact(projectRoot, packageName, requestedSubpath))
            {
                evidence.Add(directExport ? "package exports allows requested subpath" : "package has no blocking exports and requested package file exists");
                return new CssImportRemediationPlan(source, failedImport, packageName, requestedSubpath, requestedExtension, sourceFileType, "direct_package_import", direct, evidence, rejected, 0.95, direct);
            }
            else
            {
                rejected.Add(RejectedCandidate("direct_package_import", "package_file_not_found_and_no_export_evidence"));
            }
        }
        else
        {
            rejected.Add(RejectedCandidate("direct_package_import", "original_import_has_no_tilde"));
        }

        if (sourceFileType == "css" && IsPackageScssImport(requestedSubpath))
        {
            rejected.Add(RejectedCandidate("package_scss_import", "scss_import_from_css_forbidden"));
        }

        var cssTargets = CssAssetCandidateSubpaths(requestedSubpath).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
        if (sourceFileType is "css" or "scss" or "sass")
        {
            var selectedCss = cssTargets.FirstOrDefault(target => target.EndsWith(".css", StringComparison.OrdinalIgnoreCase) && PackageFileExistsExact(projectRoot, packageName, target));
            if (!string.IsNullOrWhiteSpace(selectedCss))
            {
                var relative = RelativeNodeModulesImport(projectRoot, source, packageName, selectedCss);
                evidence.Add($"physical CSS file exists: node_modules/{packageName}/{selectedCss}");
                evidence.Add("relative path computed from source stylesheet directory");
                return new CssImportRemediationPlan(source, failedImport, packageName, requestedSubpath, requestedExtension, sourceFileType, "relative_node_modules_css_import", relative, evidence, rejected, 0.98, direct);
            }

            rejected.Add(RejectedCandidate("relative_node_modules_css_import", "compiled_css_asset_not_found", new JsonObject { ["attemptedSubpaths"] = new JsonArray(cssTargets.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()) }));
        }
        else
        {
            rejected.Add(RejectedCandidate("relative_node_modules_css_import", "source_file_type_not_supported"));
        }

        if (sourceFileType == "css")
        {
            if (!rejected.Any(c => c.StringValue("reason") == "scss_import_from_css_forbidden"))
            {
                rejected.Add(RejectedCandidate("package_scss_import", "scss_import_from_css_forbidden"));
            }
        }
        else if (sourceFileType is "scss" or "sass")
        {
            var scssTargets = ScssAssetCandidateSubpaths(requestedSubpath).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
            var selectedScss = scssTargets.FirstOrDefault(target => PackageFileExistsExact(projectRoot, packageName, target) && PackageScssLocalPartialsExist(projectRoot, packageName, target));
            if (!string.IsNullOrWhiteSpace(selectedScss))
            {
                var importSubpath = RemoveStyleExtension(selectedScss);
                evidence.Add($"package SCSS file exists: node_modules/{packageName}/{selectedScss}");
                evidence.Add("required local Sass partials were found");
                return new CssImportRemediationPlan(source, failedImport, packageName, requestedSubpath, requestedExtension, sourceFileType, "package_scss_import", $"{packageName}/{importSubpath}", evidence, rejected, 0.88, direct);
            }

            rejected.Add(RejectedCandidate("package_scss_import", "valid_package_scss_target_not_found_or_partials_missing", new JsonObject { ["attemptedSubpaths"] = new JsonArray(scssTargets.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()) }));
        }

        rejected.Add(RejectedCandidate("global_stylesheet_css_to_scss_conversion", "not_attempted_without_explicit_global_stylesheet_conversion_evidence"));
        return CssImportRemediationPlan.Manual(source, failedImport, packageName, requestedSubpath, requestedExtension, sourceFileType, evidence, rejected, direct);
    }

    private static JsonObject RejectedCandidate(string candidate, string reason, JsonObject? details = null)
    {
        var result = new JsonObject { ["candidate"] = candidate, ["reason"] = reason };
        if (details is not null) result["details"] = details;
        return result;
    }

    private static string SourceFileType(string sourceFile) => Path.GetExtension(sourceFile).TrimStart('.').ToLowerInvariant();

    private static IEnumerable<string> CssAssetCandidateSubpaths(string requestedSubpath)
    {
        var normalized = requestedSubpath.Replace('\\', '/').TrimStart('/');
        if (normalized.EndsWith(".css", StringComparison.OrdinalIgnoreCase)) yield return normalized;
        var basename = Path.GetFileName(RemoveStyleExtension(normalized.Replace('/', Path.DirectorySeparatorChar)));
        if (!string.IsNullOrWhiteSpace(basename)) yield return $"themes/{basename}.css";
    }

    private static IEnumerable<string> ScssAssetCandidateSubpaths(string requestedSubpath)
    {
        var normalized = requestedSubpath.Replace('\\', '/').TrimStart('/');
        if (normalized.EndsWith(".scss", StringComparison.OrdinalIgnoreCase)) yield return normalized;
        if (normalized.StartsWith("scss/", StringComparison.OrdinalIgnoreCase)) yield return normalized.EndsWith(".scss", StringComparison.OrdinalIgnoreCase) ? normalized : normalized + ".scss";
        var basename = Path.GetFileName(RemoveStyleExtension(normalized.Replace('/', Path.DirectorySeparatorChar)));
        if (!string.IsNullOrWhiteSpace(basename)) yield return $"scss/{basename}.scss";
    }

    private static string RelativeNodeModulesImport(string projectRoot, string sourceFile, string packageName, string targetSubpath)
    {
        var sourceFull = Path.GetFullPath(Path.Combine(projectRoot, sourceFile.Replace('/', Path.DirectorySeparatorChar)));
        var sourceDir = Path.GetDirectoryName(sourceFull) ?? projectRoot;
        var targetFull = Path.GetFullPath(Path.Combine(PackageRoot(projectRoot, packageName), targetSubpath.Replace('/', Path.DirectorySeparatorChar)));
        return Path.GetRelativePath(sourceDir, targetFull).Replace('\\', '/');
    }

    private static bool PackageFileExistsExact(string outputPath, string packageName, string subpath)
    {
        var root = PackageRoot(outputPath, packageName);
        if (!Directory.Exists(root)) return false;
        var full = Path.GetFullPath(Path.Combine(root, subpath.Replace('/', Path.DirectorySeparatorChar).TrimStart(Path.DirectorySeparatorChar)));
        return IsUnderRoot(full, root) && File.Exists(full);
    }

    private static bool PackageImportAllowedByExports(PackageMetadata metadata, string requestedSubpath)
    {
        if (metadata.Exports is null) return false;
        var key = "./" + requestedSubpath.TrimStart('/').Replace('\\', '/');
        return metadata.Exports.TryGetPropertyValue(key, out var node) && ExportAllowsStyleImport(node);
    }

    private static bool ExportAllowsStyleImport(JsonNode? node)
    {
        if (node is null) return false;
        if (node is JsonValue value) return !string.IsNullOrWhiteSpace(value.ToString());
        if (node is JsonObject obj)
        {
            foreach (var condition in new[] { "style", "import", "default", "browser" })
            {
                if (obj.TryGetPropertyValue(condition, out var conditionNode) && ExportAllowsStyleImport(conditionNode)) return true;
            }
        }
        return false;
    }

    private static bool PackageScssLocalPartialsExist(string outputPath, string packageName, string scssSubpath)
    {
        var root = PackageRoot(outputPath, packageName);
        var full = Path.GetFullPath(Path.Combine(root, scssSubpath.Replace('/', Path.DirectorySeparatorChar)));
        if (!IsUnderRoot(full, root) || !File.Exists(full)) return false;
        var dir = Path.GetDirectoryName(full) ?? root;
        var content = File.ReadAllText(full);
        foreach (Match match in Regex.Matches(content, @"@(import|use)\s+['""](?<path>[^'""]+)['""]", RegexOptions.IgnoreCase))
        {
            var import = match.Groups["path"].Value;
            if (import.StartsWith(".", StringComparison.Ordinal) || (!import.Contains("/", StringComparison.Ordinal) && !import.Contains("\\", StringComparison.Ordinal)))
            {
                if (!SassPartialExists(dir, import)) return false;
            }
        }
        return true;
    }

    private static bool SassPartialExists(string directory, string import)
    {
        var normalized = import.Replace('/', Path.DirectorySeparatorChar);
        var dir = Path.GetDirectoryName(normalized);
        var name = Path.GetFileName(normalized);
        var baseDir = string.IsNullOrWhiteSpace(dir) ? directory : Path.GetFullPath(Path.Combine(directory, dir));
        var baseName = RemoveStyleExtension(name);
        return new[]
        {
            Path.Combine(baseDir, baseName + ".scss"),
            Path.Combine(baseDir, "_" + baseName + ".scss"),
            Path.Combine(baseDir, baseName + ".sass"),
            Path.Combine(baseDir, "_" + baseName + ".sass")
        }.Any(File.Exists);
    }

    private static StyleImportResolution ResolveStyleImportReplacement(string outputPath, string import, string packageName, string subpath, PackageMetadata metadata, string validationText)
    {
        var direct = import.StartsWith("~", StringComparison.Ordinal) ? import[1..] : "";
        var exportCandidates = new List<string>();
        var fileCandidates = new List<string>();

        if (!string.IsNullOrWhiteSpace(direct))
        {
            var currentExportKey = "./" + subpath.TrimStart('/');
            if (metadata.StyleExportKeys.Contains(currentExportKey, StringComparer.OrdinalIgnoreCase))
            {
                exportCandidates.Add(currentExportKey);
                return new StyleImportResolution(direct, exportCandidates, fileCandidates, direct, "confirmed by installed package export");
            }

            if (PackageFileExists(outputPath, packageName, subpath))
            {
                fileCandidates.Add(subpath);
                return new StyleImportResolution(direct, exportCandidates, fileCandidates, direct, "confirmed by installed package file");
            }
        }

        var intent = ThemeAssetIntent(subpath);
        if (string.IsNullOrWhiteSpace(intent))
        {
            return new StyleImportResolution(direct, exportCandidates, fileCandidates, null, "direct normalized target was not confirmed and no theme asset intent could be derived");
        }

        foreach (var asset in FindInstalledStyleAssets(outputPath, packageName).OrderBy(StyleAssetCandidateRank).ThenBy(s => s, StringComparer.OrdinalIgnoreCase))
        {
            if (!string.Equals(ThemeAssetIntent(asset), intent, StringComparison.OrdinalIgnoreCase)) continue;
            fileCandidates.Add(asset);
            var candidateImport = $"{packageName}/{PackageStyleImportSubpath(asset)}";
            if (string.Equals(candidateImport, import, StringComparison.OrdinalIgnoreCase)) continue;
            return new StyleImportResolution(direct, exportCandidates, fileCandidates, candidateImport, "confirmed by equivalent installed package file");
        }

        foreach (var exportKey in metadata.StyleExportKeys.OrderBy(StyleAssetCandidateRank).ThenBy(s => s, StringComparer.OrdinalIgnoreCase))
        {
            var candidateSubpath = exportKey.TrimStart('.', '/');
            if (!string.Equals(ThemeAssetIntent(candidateSubpath), intent, StringComparison.OrdinalIgnoreCase)) continue;
            exportCandidates.Add(exportKey);
            var candidateImport = $"{packageName}/{PackageStyleImportSubpath(candidateSubpath)}";
            if (string.Equals(candidateImport, import, StringComparison.OrdinalIgnoreCase)) continue;
            return new StyleImportResolution(direct, exportCandidates, fileCandidates, candidateImport, "confirmed by equivalent installed package export");
        }

        return new StyleImportResolution(direct, exportCandidates, fileCandidates, null, "direct normalized target and equivalent package style assets were not confirmed by installed package files or exports");
    }

    private static bool PackageFileExists(string outputPath, string packageName, string subpath)
    {
        var root = PackageRoot(outputPath, packageName);
        if (!Directory.Exists(root)) return false;
        var normalized = subpath.TrimStart('/', '.').Replace('/', Path.DirectorySeparatorChar);
        var candidates = new[] { normalized, normalized + ".scss", normalized + ".css", normalized + ".sass", normalized + ".less" };
        return candidates.Any(candidate =>
        {
            var full = Path.GetFullPath(Path.Combine(root, candidate));
            return IsUnderRoot(full, root) && File.Exists(full);
        });
    }

    private static string PackageRoot(string outputPath, string packageName) =>
        Path.Combine(outputPath, "node_modules", Path.Combine(packageName.Split('/')));

    private static PackageMetadata ReadPackageMetadata(string outputPath, string packageName)
    {
        var packageJsonPath = Path.Combine(outputPath, "node_modules", Path.Combine(packageName.Split('/')), "package.json");
        var packageJson = ReadJsonObject(packageJsonPath);
        var exports = packageJson?["exports"]?.AsObject();
        return new PackageMetadata(
            packageJson?.StringValue("version") ?? "",
            exports,
            exports is null ? [] : ExtractStyleExportKeys(exports).ToArray());
    }

    private static IReadOnlyList<string> FindInstalledStyleAssets(string outputPath, string packageName)
    {
        var root = PackageRoot(outputPath, packageName);
        if (!Directory.Exists(root)) return [];
        return Directory.EnumerateFiles(root, "*.*", SearchOption.AllDirectories)
            .Select(path => NormalizeRelativePath(Path.GetRelativePath(root, path)))
            .Where(IsStyleFile)
            .Order(StringComparer.OrdinalIgnoreCase)
            .Take(200)
            .ToArray();
    }

    private static IEnumerable<string> ExtractStyleExportKeys(JsonObject exports)
    {
        foreach (var item in exports)
        {
            if (!item.Key.StartsWith("./", StringComparison.Ordinal)) continue;
            if (ExportHasStyleTarget(item.Value) || Regex.IsMatch(item.Key, @"\.(?:css|scss|sass|less)$|/(?:scss|themes?)/|\.theme$", RegexOptions.IgnoreCase))
            {
                yield return item.Key;
            }
        }
    }

    private static bool ExportHasStyleTarget(JsonNode? node)
    {
        if (node is null) return false;
        if (node is JsonValue value) return Regex.IsMatch(value.ToString(), @"\.(?:css|scss|sass|less)$", RegexOptions.IgnoreCase);
        if (node is JsonObject obj)
        {
            if (obj.ContainsKey("style")) return true;
            return obj.Any(kv => ExportHasStyleTarget(kv.Value));
        }
        return false;
    }

    private static JsonObject? ReadJsonObject(string path)
    {
        try
        {
            return File.Exists(path) ? JsonNode.Parse(File.ReadAllText(path))?.AsObject() : null;
        }
        catch
        {
            return null;
        }
    }

    private static string PackageVersion(JsonObject? packageJson, string packageName)
    {
        foreach (var section in new[] { "dependencies", "devDependencies", "optionalDependencies" })
        {
            if (packageJson?[section] is JsonObject dependencies && dependencies.TryGetPropertyValue(packageName, out var version)) return version?.ToString() ?? "";
        }
        return "";
    }

    private static JsonNode? FindRejectedPackageSignal(ValidationResult validation, string packageName, JsonObject manifest)
    {
        foreach (var change in validation.AiRemediationChanges)
        {
            if (string.Equals(change.StringValue("packageName", change.StringValue("name")), packageName, StringComparison.OrdinalIgnoreCase) &&
                change.StringValue("status", change.StringValue("action")).Contains("reject", StringComparison.OrdinalIgnoreCase))
            {
                return change.DeepClone();
            }
        }
        return null;
    }

    private static bool IsAngularRelatedOrUiThemePackage(string packageName) =>
        packageName.Contains("angular", StringComparison.OrdinalIgnoreCase) ||
        packageName.Contains("ng-", StringComparison.OrdinalIgnoreCase) ||
        packageName.Contains("ngx", StringComparison.OrdinalIgnoreCase) ||
        packageName.Contains("select", StringComparison.OrdinalIgnoreCase) ||
        packageName.Contains("theme", StringComparison.OrdinalIgnoreCase);

    private static bool IsExportViolation(string text) =>
        text.Contains("not exported", StringComparison.OrdinalIgnoreCase) ||
        text.Contains("not defined by \"exports\"", StringComparison.OrdinalIgnoreCase) ||
        text.Contains("exports field", StringComparison.OrdinalIgnoreCase);

    private static bool IsStyleFile(string file) =>
        file.EndsWith(".css", StringComparison.OrdinalIgnoreCase) ||
        file.EndsWith(".scss", StringComparison.OrdinalIgnoreCase) ||
        file.EndsWith(".sass", StringComparison.OrdinalIgnoreCase) ||
        file.EndsWith(".less", StringComparison.OrdinalIgnoreCase);

    private static bool IsCssFile(string file) =>
        file.EndsWith(".css", StringComparison.OrdinalIgnoreCase);

    private static bool IsPackageScssImport(string subpath)
    {
        var normalized = subpath.Replace('\\', '/').TrimStart('/');
        return normalized.EndsWith(".scss", StringComparison.OrdinalIgnoreCase) ||
               normalized.Contains("/scss/", StringComparison.OrdinalIgnoreCase) ||
               normalized.StartsWith("scss/", StringComparison.OrdinalIgnoreCase);
    }

    private static string ExtractImportSpecifier(string text)
    {
        var value = text.Trim();
        var match = Regex.Match(value, @"@import\s+(?:url\()?['""](?<import>[^'"")]+)['""]", RegexOptions.IgnoreCase);
        return match.Success ? match.Groups["import"].Value : value.Trim('"', '\'').TrimEnd(';');
    }

    private static string ReplaceImportSpecifier(string content, string before, string after) =>
        Regex.Replace(content, @"@import\s+(?:url\()?['""](?<import>[^'"")]+)['""]\)?\s*;", match =>
        {
            var import = match.Groups["import"].Value;
            if (!ImportSpecifiersMatch(import, before)) return match.Value;
            return match.Value.Replace(import, after, StringComparison.Ordinal);
        }, RegexOptions.IgnoreCase);

    private static bool PatchExactStyleImportInFile(string fullPath, string beforeImport, string afterImport, out string afterContent)
    {
        var content = File.ReadAllText(fullPath);
        var replaced = false;
        afterContent = Regex.Replace(content, @"@import\s+(?:url\()?['""](?<import>[^'"")]+)['""]\)?\s*;", match =>
        {
            if (replaced) return match.Value;
            var import = match.Groups["import"].Value;
            if (!ImportSpecifiersMatch(import, beforeImport)) return match.Value;
            replaced = true;
            return match.Value.Replace(import, afterImport, StringComparison.Ordinal);
        }, RegexOptions.IgnoreCase);
        return replaced && !string.Equals(content, afterContent, StringComparison.Ordinal);
    }

    private static async Task<StyleImportApplication> ApplyStyleImportWithFileTypeSafetyAsync(string outputPath, string beforeImport, string afterImport, string packageName, string requestedSubpath, CancellationToken cancellationToken)
    {
        var containingFiles = EnumerateProjectStyleFiles(outputPath)
            .Where(file =>
            {
                var full = Path.Combine(outputPath, file.Replace('/', Path.DirectorySeparatorChar));
                return ExtractPackageImports(File.ReadAllText(full)).Any(import => ImportSpecifiersMatch(import, beforeImport));
            })
            .ToArray();
        if (containingFiles.Length == 0) return new StyleImportApplication(false, new JsonArray(), afterImport, "exact failed import was not found in project style files");

        var afterPackage = ParsePackageImport(afterImport);
        if (afterPackage is null) return new StyleImportApplication(false, new JsonArray(), afterImport, "replacement import is not a dependency package import");
        if (!string.Equals(packageName, afterPackage.Value.PackageName, StringComparison.OrdinalIgnoreCase)) return new StyleImportApplication(false, new JsonArray(), afterImport, "replacement import changes npm package");
        if (containingFiles.Any(IsCssFile) && IsPackageScssImport(afterPackage.Value.Subpath))
        {
            return new StyleImportApplication(false, new JsonArray(), afterImport, "replacement imports package SCSS from a .css source file");
        }
        if (!StyleImportReplacementIsSafe(outputPath, beforeImport, afterImport, packageName, requestedSubpath, afterPackage.Value.Subpath, ""))
        {
            return new StyleImportApplication(false, new JsonArray(), afterImport, "replacement import is neither direct tilde removal nor a verified equivalent package asset path");
        }

        var changed = await ApplyStyleImportProjectWideAsync(outputPath, beforeImport, afterImport, cancellationToken);
        var remediationType = beforeImport.StartsWith("~", StringComparison.Ordinal) && string.Equals(beforeImport[1..], afterImport, StringComparison.Ordinal)
            ? "project-wide exact direct tilde removal"
            : "project-wide verified equivalent package style import";
        return new StyleImportApplication(true, changed, afterImport, remediationType);
    }

    private static async Task<JsonArray> ApplyStyleImportProjectWideAsync(string outputPath, string beforeImport, string afterImport, CancellationToken cancellationToken)
    {
        var changed = new JsonArray();
        foreach (var file in EnumerateProjectStyleFiles(outputPath))
        {
            var full = Path.Combine(outputPath, file.Replace('/', Path.DirectorySeparatorChar));
            var before = await File.ReadAllTextAsync(full, cancellationToken);
            var after = ReplaceImportSpecifier(before, beforeImport, afterImport);
            if (after == before) continue;
            await File.WriteAllTextAsync(full, after, cancellationToken);
            changed.Add(file);
        }
        return changed;
    }

    private static bool StyleImportStillPresent(string outputPath, string import)
    {
        foreach (var file in EnumerateProjectStyleFiles(outputPath))
        {
            var full = Path.Combine(outputPath, file.Replace('/', Path.DirectorySeparatorChar));
            var content = File.ReadAllText(full);
            if (content.Contains(import, StringComparison.Ordinal)) return true;
        }
        return false;
    }

    private static bool FileContainsImport(string outputPath, string file, string import)
    {
        var full = Path.Combine(outputPath, file.Replace('/', Path.DirectorySeparatorChar));
        if (!File.Exists(full)) return false;
        return Regex.Matches(File.ReadAllText(full), @"@import\s+(?:url\()?['""](?<import>[^'"")]+)['""]", RegexOptions.IgnoreCase)
            .Any(m => string.Equals(m.Groups["import"].Value, import, StringComparison.Ordinal));
    }

    private static JsonArray OriginalCssImportsStillPresent(string outputPath, ValidationResult validation, IReadOnlyList<JsonObject> changes)
    {
        var remaining = new JsonArray();
        var validationText = validation.Output + "\n" + validation.Errors;
        if (!IsCssDependencyImportFailure(validationText)) return remaining;

        var imports = ExtractUnresolvedDependencyImportsFromCantResolve(validationText)
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        foreach (var import in imports)
        {
            var files = StyleFilesContainingImport(outputPath, import);
            if (files.Count == 0) continue;
            remaining.Add(new JsonObject
            {
                ["import"] = import,
                ["files"] = files
            });
        }

        return remaining;
    }

    private static JsonArray StyleFilesContainingImport(string outputPath, string import)
    {
        var files = new JsonArray();
        foreach (var file in EnumerateProjectStyleFiles(outputPath))
        {
            var full = Path.Combine(outputPath, file.Replace('/', Path.DirectorySeparatorChar));
            var content = File.ReadAllText(full);
            if (content.Contains(import, StringComparison.Ordinal)) files.Add(file);
        }
        return files;
    }

    private static void RecordCssRemediationState(string outputPath, IEnumerable<string> sourceFiles, string originalImport, string replacementImport, string packageName, string selectedStrategy, string acceptedAtHop, bool validationPassedAfterApply)
    {
        var stateDir = Path.Combine(outputPath, ".migration-agent");
        Directory.CreateDirectory(stateDir);
        var path = Path.Combine(stateDir, "css-remediation-state.json");
        JsonArray records;
        try
        {
            records = File.Exists(path) ? JsonNode.Parse(File.ReadAllText(path))?.AsArray() ?? new JsonArray() : new JsonArray();
        }
        catch
        {
            records = new JsonArray();
        }

        foreach (var sourceFile in sourceFiles.Select(NormalizeRelativePath).Distinct(StringComparer.OrdinalIgnoreCase))
        {
            var existing = records.OfType<JsonObject>().FirstOrDefault(r =>
                r.StringValue("sourceFile").Equals(sourceFile, StringComparison.OrdinalIgnoreCase) &&
                r.StringValue("originalImport").Equals(originalImport, StringComparison.OrdinalIgnoreCase));
            var targetPhysicalFile = TargetPhysicalFile(outputPath, sourceFile, replacementImport);
            var record = existing ?? new JsonObject();
            record["sourceFile"] = sourceFile;
            record["originalImport"] = originalImport;
            record["replacementImport"] = replacementImport;
            record["selectedStrategy"] = selectedStrategy;
            record["packageName"] = packageName;
            record["targetPhysicalFile"] = targetPhysicalFile;
            record["acceptedAtHop"] = acceptedAtHop;
            record["validationPassedAfterApply"] = validationPassedAfterApply;
            if (existing is null) records.Add(record);
        }

        File.WriteAllText(path, records.ToJsonString(JsonHelpers.SerializerOptions) + Environment.NewLine);
    }

    private static string TargetPhysicalFile(string outputPath, string sourceFile, string replacementImport)
    {
        var parsed = ParsePackageImport(replacementImport);
        if (parsed is not null)
        {
            var subpath = parsed.Value.Subpath;
            var full = Path.Combine(outputPath, "node_modules", Path.Combine(parsed.Value.PackageName.Split('/')), subpath.Replace('/', Path.DirectorySeparatorChar));
            return NormalizeRelativePath(Path.GetRelativePath(outputPath, full));
        }
        if (replacementImport.StartsWith(".", StringComparison.Ordinal))
        {
            var sourceFull = Path.Combine(outputPath, sourceFile.Replace('/', Path.DirectorySeparatorChar));
            var full = Path.GetFullPath(Path.Combine(Path.GetDirectoryName(sourceFull) ?? outputPath, replacementImport.Replace('/', Path.DirectorySeparatorChar)));
            return IsUnderRoot(full, outputPath) ? NormalizeRelativePath(Path.GetRelativePath(outputPath, full)) : "";
        }
        return "";
    }

    private static IReadOnlyList<string> EnumerateProjectStyleFiles(string outputPath)
    {
        if (!Directory.Exists(outputPath)) return [];
        return Directory.EnumerateFiles(outputPath, "*.*", SearchOption.AllDirectories)
            .Select(path => NormalizeRelativePath(Path.GetRelativePath(outputPath, path)))
            .Where(file => IsStyleFile(file) && !TouchesBlockedPath(file))
            .Order(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private static string RemoveStyleExtension(string value) =>
        Regex.Replace(value, @"\.(?:css|scss|sass|less)$", "", RegexOptions.IgnoreCase);

    private static string PackageStyleImportSubpath(string value) =>
        value.EndsWith(".css", StringComparison.OrdinalIgnoreCase) ? value : RemoveStyleExtension(value);

    private static string ThemeAssetIntent(string value)
    {
        var normalized = RemoveStyleExtension(value.Replace('\\', '/')).TrimEnd('/');
        var fileName = normalized.Split('/', StringSplitOptions.RemoveEmptyEntries).LastOrDefault() ?? "";
        return fileName;
    }

    private static int StyleAssetCandidateRank(string value)
    {
        var normalized = value.Replace('\\', '/');
        if (normalized.EndsWith(".css", StringComparison.OrdinalIgnoreCase) &&
            (normalized.Contains("/themes/", StringComparison.OrdinalIgnoreCase) || normalized.StartsWith("themes/", StringComparison.OrdinalIgnoreCase) || normalized.StartsWith("./themes/", StringComparison.OrdinalIgnoreCase))) return 0;
        if (normalized.EndsWith(".css", StringComparison.OrdinalIgnoreCase)) return 1;
        if (normalized.Contains("/themes/", StringComparison.OrdinalIgnoreCase) || normalized.StartsWith("themes/", StringComparison.OrdinalIgnoreCase) || normalized.StartsWith("./themes/", StringComparison.OrdinalIgnoreCase)) return 2;
        if (normalized.Contains("/scss/", StringComparison.OrdinalIgnoreCase) || normalized.StartsWith("scss/", StringComparison.OrdinalIgnoreCase) || normalized.StartsWith("./scss/", StringComparison.OrdinalIgnoreCase)) return 3;
        if (normalized.EndsWith(".scss", StringComparison.OrdinalIgnoreCase)) return 4;
        return 5;
    }

    private sealed record PackageMetadata(string Version, JsonObject? Exports, IReadOnlyList<string> StyleExportKeys);
    private sealed record StyleImportApplication(bool Safe, JsonArray ChangedFiles, string SelectedImport, string Reason);
    private sealed record CssImportRemediationPlan(
        string SourceFile,
        string OriginalImport,
        string PackageName,
        string RequestedSubpath,
        string RequestedExtension,
        string SourceFileType,
        string SelectedStrategy,
        string? ReplacementImport,
        IReadOnlyList<string> Evidence,
        IReadOnlyList<JsonObject> RejectedCandidates,
        double Confidence,
        string DirectNormalizedImport)
    {
        public static CssImportRemediationPlan Manual(
            string sourceFile,
            string originalImport,
            string packageName,
            string requestedSubpath,
            string requestedExtension,
            string sourceFileType,
            IReadOnlyList<string> evidence,
            IReadOnlyList<JsonObject> rejectedCandidates,
            string directNormalizedImport = "") =>
            new(sourceFile, originalImport, packageName, requestedSubpath, requestedExtension, sourceFileType, "manual_review", null, evidence, rejectedCandidates, 0.0, directNormalizedImport);

        public JsonObject ToJson() => new()
        {
            ["sourceFile"] = SourceFile,
            ["originalImport"] = OriginalImport,
            ["packageName"] = PackageName,
            ["requestedSubpath"] = RequestedSubpath,
            ["requestedExtension"] = RequestedExtension,
            ["sourceFileType"] = SourceFileType,
            ["selectedStrategy"] = SelectedStrategy,
            ["replacementImport"] = ReplacementImport,
            ["directNormalizedImportAttempted"] = DirectNormalizedImport,
            ["evidence"] = new JsonArray(Evidence.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
            ["rejectedCandidates"] = new JsonArray(RejectedCandidates.Select(c => (JsonNode?)c.DeepClone()).ToArray()),
            ["confidence"] = Confidence
        };
    }
    private sealed record StyleImportResolution(string DirectNormalizedImport, IReadOnlyList<string> ExportCandidates, IReadOnlyList<string> FileCandidates, string? SelectedImport, string ConfirmationReason)
    {
        public JsonObject ToJson() => new()
        {
            ["directNormalizedImportAttempted"] = DirectNormalizedImport,
            ["directNormalizedTargetConfirmed"] = !string.IsNullOrWhiteSpace(SelectedImport) && string.Equals(DirectNormalizedImport, SelectedImport, StringComparison.Ordinal),
            ["directNormalizedTargetConfirmationReason"] = ConfirmationReason,
            ["packageExportCandidatesAttempted"] = new JsonArray(ExportCandidates.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
            ["candidateFilesAttempted"] = new JsonArray(FileCandidates.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
            ["selectedImport"] = SelectedImport
        };
    }

    private static string SuggestedManualFix(ValidationResult validation)
    {
        var text = validation.Output + "\n" + validation.Errors;
        if (text.Contains("Unknown argument: prod", StringComparison.OrdinalIgnoreCase)) return "Update the build script to replace --prod with --configuration production, then rerun the failed validation command.";
        if (IsCssDependencyImportFailure(text)) return "Inspect the installed package exports and update only the failing CSS/SCSS package import to a valid exported style entry point, or upgrade the package if that is the safer compatible fix.";
        if (text.Contains("typescript", StringComparison.OrdinalIgnoreCase)) return "Check Angular, @angular/compiler-cli, @angular-devkit/build-angular, and TypeScript version compatibility for the current hop, then rerun the failed validation command.";
        return "Review the failing validation output and apply the smallest safe manifest, config, script, or compiler-targeted source fix before rerunning the failed validation command.";
    }

    private string LoadPrompt(string promptPath) => promptLoader?.Load(promptPath) ?? throw new InvalidOperationException("Prompt loader is required when AI remediation is enabled.");
}

public sealed record RemediationAttempt(bool Attempted, bool Applied, IReadOnlyList<JsonObject> Changes, JsonObject? ManualCorrection)
{
    public static RemediationAttempt NotAttempted() => new(false, false, [], null);
    public static RemediationAttempt AppliedResult(IReadOnlyList<JsonObject> changes) => new(true, true, changes, null);
    public static RemediationAttempt Failed(IReadOnlyList<JsonObject> changes) => new(true, false, changes, null);
    public static RemediationAttempt Manual(JsonObject request, IReadOnlyList<JsonObject>? changes = null) => new(true, false, changes ?? [], request);
}
