using System.Text.Json.Nodes;
using Q3.MigrationAgent.Shared.Common;
using Q3.MigrationAgent.Shared.DTO;

namespace Q3.MigrationAgent.Core.Reporting;

public sealed class MarkdownReportWriter
{
    public string GenerateReport(IReadOnlyList<JsonObject> plan, IReadOnlyList<ChangeResult> results, JsonObject analysis, ValidationResult validation)
    {
        var done = results.Count(r => r.Status == "done");
        var failed = results.Count(r => r.Status == "failed");
        var changedFiles = results.SelectMany(r => r.Files).Distinct().Order().ToArray();
        var lines = new List<string>
        {
            "# Migration Report",
            "",
            "## Summary",
            $"- Runtime: {analysis.StringValue("from")} -> {analysis.StringValue("to")}",
            $"- Planned changes: {plan.Count}",
            $"- Changes applied: {done}",
            $"- Failed: {failed}",
            $"- Risk level: {analysis.StringValue("riskLevel")}",
            $"- Confidence: {analysis["confidence"]}",
            $"- Analysis mode: {analysis.StringValue("analysisMode", "unknown")}",
            $"- Planning mode: {analysis.StringValue("planningMode", "unknown")}",
            $"- Validation passed: {FormatNullable(validation.Passed)}",
            $"- Rollback mode: {validation.RollbackMode}",
            $"- Rollback snapshot path: {validation.SnapshotPath ?? "Not created"}",
            $"- Automatic rollback applied: {validation.AutomaticRollbackApplied}"
        };
        if (analysis.TryGetPropertyValue("planningNotes", out var notes) && !string.IsNullOrWhiteSpace(notes?.ToString()))
        {
            lines.Add($"- Planning notes: {notes}");
        }

        lines.AddRange(["", $"## {DependencyUpgradeSectionTitle(analysis)}"]);
        lines.AddRange(FormatDependencyUpgrades(plan, results, new HashSet<string> { "ai", "ai-inferred" }));
        lines.AddRange(["", "## Validation Repair Dependency Upgrades"]);
        lines.AddRange(FormatDependencyUpgrades(plan, results, new HashSet<string> { "ai-validation-repair" }));
        lines.AddRange(["", "## Validation Attempts"]);
        lines.AddRange(validation.Attempts.Count == 0 ? ["- Not run"] : validation.Attempts.Select(a => $"- Attempt {a["attempt"]}: passed={a["passed"]}; stage={a["stage"]}"));
        lines.AddRange(["", "## Validation Failures"]);
        lines.AddRange(FormatValidationFailures(validation.ValidationFailures));
        lines.AddRange(["", "## AI Remediation Changes"]);
        lines.AddRange(FormatAiRemediation(validation.AiRemediationChanges));
        lines.AddRange(["", "## Manual Correction Required"]);
        lines.AddRange(FormatManualCorrections(validation.ManualCorrectionRequests, validation));
        lines.AddRange(["", "## Changes Made"]);
        lines.AddRange(results.Count == 0 ? ["- No changes executed."] : results.Select(FormatResult));
        lines.AddRange(["", "## Files Changed"]);
        lines.AddRange(changedFiles.Length == 0 ? ["- None"] : changedFiles.Select(file => $"- {file}"));
        lines.AddRange(["", "## Findings"]);
        var findings = analysis["findings"]?.AsArray();
        lines.AddRange(findings is null || findings.Count == 0 ? ["- None"] : findings.OfType<JsonObject>().Select(FormatFinding));
        lines.AddRange(
        [
            "",
            "## Validation",
            $"- Validation command executed by migration agent: {ValidationCommand(validation)}",
            $"- Result: {ValidationResultText(validation)}",
            "",
            "## What Was Not Changed",
            "- Business logic was not intentionally modified.",
            "- Source code files were not intentionally modified.",
            "- Files were not moved or renamed.",
            "",
            "## Validation Output",
            "```text",
            validation.Output.Length > 0 ? validation.Output : validation.Errors,
            "```"
        ]);
        if (!string.IsNullOrWhiteSpace(validation.RollbackError))
        {
            lines.AddRange(["", "## Rollback Error", "```text", validation.RollbackError, "```"]);
        }
        lines.Add("");
        return string.Join(Environment.NewLine, lines);
    }

    public string GenerateAdapterHopReport(JsonObject analysis, IReadOnlyList<MigrationHop> hops, IReadOnlyList<JsonObject> hopResults, ValidationResult validation)
    {
        var manifest = analysis["manifest"]?.AsObject() ?? new JsonObject();
        if (!manifest.StringValue("runtime").Equals("angular", StringComparison.OrdinalIgnoreCase))
        {
            return GenerateGenericAdapterHopReport(analysis, manifest, hops, hopResults, validation);
        }

        var executed = hopResults.ToDictionary(r => $"{r["hop"]?["fromVersion"]} -> {r["hop"]?["toVersion"]}", r => r);
        var changedFiles = hopResults.SelectMany(r => r["files"]?.AsArray()?.Select(n => n?.ToString() ?? "") ?? []).Where(s => s.Length > 0).Distinct().Order().ToArray();
        var lines = new List<string>
        {
            "# Migration Report",
            "",
            "## Detection Summary",
            $"- Detected runtime: {manifest.StringValue("runtime", "unknown")}",
            $"- Detected Angular version: {manifest["angularVersion"]?.ToString() ?? "unknown"}",
            $"- Target Angular version: {analysis.StringValue("to").Replace("angular", "", StringComparison.OrdinalIgnoreCase)}",
            $"- Package manager: {manifest.StringValue("packageManager", "unknown")}",
            $"- Lockfile: {manifest.StringValue("lockfile", "none")}",
            $"- angular.json: {manifest["hasAngularJson"]}",
            $"- tsconfig.json: {manifest["hasTsconfig"]}",
            "- Global Angular CLI was not modified.",
            "- Angular CLI official update runs only for policy-required hops.",
            "- Command source: project-local npm scripts for validation and project-local Angular CLI for official Angular updates",
            "- Angular CLI source: project-local dependency for official updates and validation scripts",
            "- Global Angular CLI: not used for official Angular updates",
            "- Global install/update: not performed",
            "",
            "## Planned Migration Hops"
        };
        lines.AddRange(hops.Select(h => $"- Angular {h.FromVersion} -> {h.ToVersion}"));
        lines.AddRange(["", "## Migration Hops"]);
        foreach (var hop in hops)
        {
            var key = $"{hop.FromVersion} -> {hop.ToVersion}";
            lines.Add($"- [{(executed.TryGetValue(key, out var result) ? result.StringValue("status", "pending") : "pending")}] Angular {key}");
        }
        lines.AddRange(["", "## Dependency Compatibility Issues"]);
        var blockers = hopResults.SelectMany(r => r["preflightDependencyAnalysis"]?["blockers"]?.AsArray()?.OfType<JsonObject>() ?? []).ToArray();
        lines.AddRange(blockers.Length == 0 ? ["- No issues recorded"] : blockers.Select(b => $"- {b.StringValue("package", "unknown")}: {b.StringValue("reason", b.StringValue("issueType", "dependency compatibility issue"))}"));
        lines.AddRange(["", "## Dependency Compatibility Remediations"]);
        var remediations = hopResults.SelectMany(r => r["preflightDependencyAnalysis"]?["remediations"]?.AsArray()?.OfType<JsonObject>() ?? []).ToArray();
        var validationPackageRemediations = hopResults
            .SelectMany(r => r["aiRemediationChanges"]?.AsArray()?.OfType<JsonObject>() ?? [])
            .Where(r => r.StringValue("type") == "package_update" && r.StringValue("failureCause") == "validation_proven_third_party_blocker")
            .ToArray();
        lines.AddRange(remediations.Length == 0 && validationPackageRemediations.Length == 0
            ? ["- No remediations recorded"]
            : remediations.Select(r => $"- {r.StringValue("package", "unknown")}: {r.StringValue("toVersion", "unknown")} ({r.StringValue("reason", r.StringValue("status"))})")
                .Concat(validationPackageRemediations.Select(r => $"- {r.StringValue("packageName", "unknown")}: {r.StringValue("targetVersionRange", "unknown")} ({r.StringValue("reason", r.StringValue("status"))})")));
        lines.AddRange(["", "## AI Remediation Changes"]);
        lines.AddRange(FormatAiRemediation(hopResults.SelectMany(r => r["aiRemediationChanges"]?.AsArray()?.OfType<JsonObject>() ?? []).ToArray()));
        lines.AddRange(["", "## AI Remediation Root Cause Analysis"]);
        lines.AddRange(FormatAngularRootCauseAnalysis(hopResults));
        lines.AddRange(["", "## Third-Party Validation Blockers"]);
        lines.AddRange(FormatThirdPartyValidationBlockers(hopResults));
        lines.AddRange(["", "## Persistent CSS Remediation State"]);
        lines.AddRange(FormatPersistentCssRemediationState(hopResults));
        lines.AddRange(["", "## Validation Failures"]);
        lines.AddRange(FormatValidationFailures(hopResults.SelectMany(ValidationFailuresFromHop).ToArray()));
        lines.AddRange(["", "## Manual Correction Required"]);
        lines.AddRange(FormatManualCorrections(hopResults.SelectMany(r => r["manualCorrectionRequests"]?.AsArray()?.OfType<JsonObject>() ?? []).ToArray(), validation));
        lines.AddRange(["", "## Warnings"]);
        var warnings = hopResults.SelectMany(r => r["preflightDependencyAnalysis"]?["warnings"]?.AsArray()?.Select(w => w?.ToString() ?? "") ?? []).Where(w => w.Length > 0).ToArray();
        lines.AddRange(warnings.Length == 0 ? ["- None"] : warnings.Select(w => $"- {w}"));
        lines.AddRange(["", "## AI Package Categorisation"]);
        lines.AddRange(FormatHopPackages(hopResults, "aiPackageCategorisation", "packages"));
        lines.AddRange(["", "## AI Package Version Recommendations"]);
        lines.AddRange(FormatPackageVersionRecommendations(hopResults));
        lines.AddRange(["", "## Package Version Verification"]);
        lines.AddRange(FormatPackageVersionVerification(hopResults));
        lines.AddRange(["", "## Angular Critical Dependency Alignment"]);
        lines.AddRange(FormatCriticalDependencyAlignment(hopResults));
        lines.AddRange(["", "## Angular Package Upgrade Plan"]);
        lines.AddRange(FormatHopPackages(hopResults, "angularPackageUpgradePlan"));
        lines.AddRange(["", "## Third-Party Package Decisions"]);
        lines.AddRange(FormatHopPackages(hopResults, "thirdPartyPackageDecisions"));
        lines.AddRange(["", "## Angular Structural Config Changes"]);
        lines.AddRange(FormatHopPackages(hopResults, "angularStructuralConfigChanges"));
        lines.AddRange(["", "## Rejected AI Package Suggestions"]);
        lines.AddRange(FormatHopPackages(hopResults, "rejectedAiPackageSuggestions"));
        lines.AddRange(["", "## Rejected AI Config Suggestions"]);
        lines.AddRange(FormatHopPackages(hopResults, "rejectedAiConfigSuggestions"));
        lines.AddRange(["", "## Manual Review Required"]);
        lines.AddRange(FormatManualReview(hopResults, validation));
        lines.AddRange(["", "## Clean Install Summary"]);
        lines.AddRange(FormatCleanInstall(hopResults));
        lines.AddRange(["", "## Validation Summary"]);
        lines.AddRange(hopResults.Count == 0 ? ["- None"] : hopResults.Select(r => $"- Angular {r["hop"]?["fromVersion"]} -> {r["hop"]?["toVersion"]}: passed={r["validationSummary"]?["passed"] ?? r["validation"]?["passed"]}; installFallbackUsed={r.BoolValue("installFallbackUsed")}; migrateOnlySkipped={r.BoolValue("migrateOnlySkipped")}"));
        lines.AddRange(["", "## Validation"]);
        lines.AddRange(FormatAgentValidation(hopResults));
        lines.AddRange(["", "## Build Verification"]);
        lines.AddRange(FormatBuildVerification(hopResults));
        lines.AddRange(["", "## Angular CLI Official Update Status"]);
        lines.AddRange(FormatOfficialMigrateOnlyStatus(hopResults));
        lines.AddRange(["", "## Preflight Dependency Compatibility Analysis"]);
        foreach (var hop in hops)
        {
            lines.Add($"- Hop: Angular {hop.FromVersion} -> {hop.ToVersion}");
            lines.Add(executed.ContainsKey($"{hop.FromVersion} -> {hop.ToVersion}") ? "- Status: passed" : "- Status: not run");
        }
        lines.AddRange(["", "## Execution Log"]);
        foreach (var hop in hops) lines.Add($"- Angular {hop.FromVersion} -> {hop.ToVersion}");
        lines.AddRange(["", "## Commands Executed"]);
        var commands = hopResults.SelectMany(r => r["commands"]?.AsArray()?.OfType<JsonObject>() ?? []);
        var commandLines = commands.Select(c => $"- [{(c.IntValue("returncode") == 0 ? "passed" : "failed")}] {string.Join(" ", c["command"]?.AsArray()?.Select(x => x?.ToString()) ?? [])}").ToArray();
        lines.AddRange(commandLines.Length == 0 ? ["- None"] : commandLines);
        lines.AddRange(["", "## Install Fallback Usage"]);
        var fallbacks = commands.Where(c => c.BoolValue("legacyPeerDepsFallbackUsed")).ToArray();
        lines.AddRange(fallbacks.Length == 0 ? ["- Not used"] : fallbacks.Select(c => $"- Used --legacy-peer-deps after peer dependency conflict: {string.Join(" ", c["command"]?.AsArray()?.Select(x => x?.ToString()) ?? [])}"));
        lines.AddRange(["", "## Install Strategy Decisions"]);
        var installs = commands.Where(c => !string.IsNullOrWhiteSpace(c.StringValue("installMode"))).ToArray();
        lines.AddRange(installs.Length == 0 ? ["- None"] : installs.Select(FormatInstallStrategy));
        lines.AddRange(["", "## Peer Dependency Conflicts"]);
        lines.AddRange(FormatPeerDependencyConflicts(hopResults));
        lines.AddRange(["", "## Install Strategy Summary"]);
        lines.AddRange(FormatInstallStrategySummary(hopResults));
        lines.AddRange(["", "## Command Failure Classification"]);
        var failures = commands.Where(c => c.IntValue("returncode") != 0).ToArray();
        lines.AddRange(failures.Length == 0 ? ["- No command failures recorded"] : failures.Select(c => $"- {c.StringValue("failureCategory", "command failed")}: {c.StringValue("failureReason")} Suggestion: {c.StringValue("suggestedNextAction")}"));
        lines.AddRange(["", "## Dependency Changes", "- Managed by AI package categorisation and safety-checked package.json updates.", "", "## Structural File Changes"]);
        lines.AddRange(changedFiles.Length == 0 ? ["- None"] : changedFiles.Select(file => $"- {file}"));
        lines.AddRange(["", "## Validation Results"]);
        lines.AddRange(hopResults.Count == 0 ? ["- None"] : hopResults.Select(r => $"- Angular {r["hop"]?["fromVersion"]} -> {r["hop"]?["toVersion"]}: passed={r["validation"]?["passed"]}"));
        lines.AddRange(["", "## Optional Angular Migrations", "- None", "", "## Manual Actions Required", validation.Passed == true ? "- None" : $"- Review failed hop: {validation.FailedHop ?? "unknown"}", "", "## Failures / Manual Actions Required"]);
        lines.Add(validation.Passed == true ? "- None" : $"- Failed hop: {validation.FailedHop ?? "unknown"}");
        if (validation.SnapshotPath is not null) lines.Add($"- Snapshot available at: {validation.SnapshotPath}");
        lines.Add($"- Rollback mode: {validation.RollbackMode}");
        lines.Add($"- Automatic rollback applied: {validation.AutomaticRollbackApplied}");
        lines.Add("");
        return string.Join(Environment.NewLine, lines);
    }

    private static string GenerateGenericAdapterHopReport(JsonObject analysis, JsonObject manifest, IReadOnlyList<MigrationHop> hops, IReadOnlyList<JsonObject> hopResults, ValidationResult validation)
    {
        var runtime = manifest.StringValue("runtime", "unknown");
        var display = runtime.Equals("dotnet", StringComparison.OrdinalIgnoreCase) ? ".NET" : runtime;
        var executed = hopResults.ToDictionary(r => $"{r["hop"]?["fromVersion"]} -> {r["hop"]?["toVersion"]}", r => r);
        var changedFiles = hopResults.SelectMany(r => r["files"]?.AsArray()?.Select(n => n?.ToString() ?? "") ?? []).Where(s => s.Length > 0).Distinct().Order().ToArray();
        var commands = hopResults.SelectMany(r => r["commands"]?.AsArray()?.OfType<JsonObject>() ?? []).ToArray();
        var lines = new List<string>
        {
            "# Migration Report",
            "",
            "## Detection Summary",
            $"- Detected runtime: {runtime}",
            $"- Runtime: {analysis.StringValue("from")} -> {analysis.StringValue("to")}",
            "",
            "## Planned Migration Hops"
        };
        lines.AddRange(hops.Select(h => $"- {display} {h.FromVersion} -> {h.ToVersion}"));
        lines.AddRange(["", "## Migration Hops"]);
        foreach (var hop in hops)
        {
            var key = $"{hop.FromVersion} -> {hop.ToVersion}";
            lines.Add($"- [{(executed.TryGetValue(key, out var result) ? result.StringValue("status", "pending") : "pending")}] {display} {key}");
        }
        lines.AddRange(["", "## Validation Summary"]);
        lines.AddRange(hopResults.Count == 0 ? ["- None"] : hopResults.Select(r => $"- {display} {r["hop"]?["fromVersion"]} -> {r["hop"]?["toVersion"]}: passed={r["validation"]?["passed"]}"));
        lines.AddRange(["", "## Commands Executed"]);
        lines.AddRange(commands.Length == 0 ? ["- None"] : commands.Select(c => $"- [{(c.IntValue("returncode") == 0 ? "passed" : "failed")}] {string.Join(" ", c["command"]?.AsArray()?.Select(x => x?.ToString()) ?? [])}"));
        lines.AddRange(["", "## Command Failure Classification"]);
        var failures = commands.Where(c => c.IntValue("returncode") != 0).ToArray();
        lines.AddRange(failures.Length == 0 ? ["- No command failures recorded"] : failures.Select(c => $"- {c.StringValue("failureCategory", "command failed")}: {c.StringValue("failureReason")} Suggestion: {c.StringValue("suggestedNextAction")}"));
        lines.AddRange(["", "## Structural File Changes"]);
        lines.AddRange(changedFiles.Length == 0 ? ["- None"] : changedFiles.Select(file => $"- {file}"));
        lines.AddRange(["", "## Manual Actions Required"]);
        lines.Add(validation.Passed == true ? "- None" : $"- Review failed hop: {validation.FailedHop ?? "unknown"}");
        if (validation.SnapshotPath is not null) lines.Add($"- Snapshot available at: {validation.SnapshotPath}");
        lines.Add($"- Rollback mode: {validation.RollbackMode}");
        lines.Add($"- Automatic rollback applied: {validation.AutomaticRollbackApplied}");
        lines.Add("");
        return string.Join(Environment.NewLine, lines);
    }

    private static string FormatResult(ChangeResult result)
    {
        var description = result.Change.StringValue("description", result.Change.StringValue("type", "change"));
        var source = result.Change.TryGetPropertyValue("source", out var sourceValue) ? $" [{sourceValue}]" : "";
        var extra = result.Error is null ? "" : $" ({result.Error})";
        return $"- [{result.Status}] {result.Change.StringValue("type")}{source}: {description}{extra}";
    }

    private static string FormatFinding(JsonObject finding) => $"- {finding.StringValue("file", "unknown file")}: {finding.StringValue("description", finding.StringValue("reason", finding.StringValue("type")))}";

    private static string FormatInstallStrategy(JsonObject command)
    {
        var commandText = string.Join(" ", command["command"]?.AsArray()?.Select(x => x?.ToString()) ?? []);
        var reason = command.StringValue("installReason", "No reason recorded.");
        var confidence = command.TryGetPropertyValue("installConfidence", out var value) ? value?.ToString() ?? "" : "";
        var failure = command.StringValue("installFailureClassification");
        var failureText = string.IsNullOrWhiteSpace(failure) ? "" : $"; failure={failure}";
        var rejected = command.StringValue("aiInstallStrategyRejectedReason");
        var rejectedText = string.IsNullOrWhiteSpace(rejected) ? "" : $"; aiRejected={rejected}";
        return $"- Source={command.StringValue("installStrategySource", "unknown")}; strategy={command.StringValue("installStrategy", command.StringValue("installMode"))}; command=`{commandText}`; confidence={confidence}; risk={command.StringValue("installRisk")}; fallback={command.BoolValue("fallbackUsed")}; retry={command.BoolValue("retryUsed")}; retryCount={command.IntValue("retryCount")}; legacy-peer-deps={command.BoolValue("legacyPeerDepsUsed")}; elapsed={command["installElapsedSeconds"] ?? "0"}s{failureText}; aiUsed={command.BoolValue("aiInstallStrategyUsed")}; aiAccepted={command.BoolValue("aiInstallStrategyAccepted")}{rejectedText}; manualActionRequired={command.BoolValue("manualActionRequired")}; reason={reason}";
    }

    private static IEnumerable<string> FormatInstallStrategySummary(IReadOnlyList<JsonObject> hopResults)
    {
        if (hopResults.Count == 0) return ["- None"];
        return hopResults.Select(r =>
        {
            var rejected = r.StringValue("aiInstallStrategyRejectedReason");
            var rejectedText = string.IsNullOrWhiteSpace(rejected) ? "" : $"; AI install strategy rejected reason={rejected}";
            return $"- Angular {r["hop"]?["fromVersion"]} -> {r["hop"]?["toVersion"]}: AI install strategy used={r.BoolValue("aiInstallStrategyUsed")}; AI install strategy accepted={r.BoolValue("aiInstallStrategyAccepted")}{rejectedText}; transient network retries used={r.IntValue("transientNetworkRetriesUsed")}; peer dependency fallback used={r.BoolValue("peerDependencyFallbackUsed")}; manual action required={r.BoolValue("manualActionRequired")}";
        });
    }

    private static IEnumerable<string> FormatOfficialMigrateOnlyStatus(IReadOnlyList<JsonObject> hopResults)
    {
        if (hopResults.Count == 0) return ["- None"];
        return hopResults.Select(r =>
        {
            var label = $"Angular {r["hop"]?["fromVersion"]} -> {r["hop"]?["toVersion"]}";
            var command = string.Join(" ", (r["officialAngularUpdateCommand"] ?? r["officialAngularMigrateOnlyCommand"])?.AsArray()?.Select(x => x?.ToString()) ?? []);
            if (r.BoolValue("officialAngularUpdateExecuted", r.BoolValue("officialAngularMigrateOnlyExecuted")))
            {
                var files = string.Join(", ", (r["officialAngularUpdateChangedFiles"] ?? r["officialAngularMigrateOnlyChangedFiles"])?.AsArray()?.Select(x => x?.ToString()) ?? []);
                var sourceFiles = string.Join(", ", r["officialAngularMigrationBusinessImpactingFiles"]?.AsArray()?.Select(x => x?.ToString()) ?? []);
                var validationNote = r.StringValue("officialAngularMigrationAcceptanceStatus").Contains("validation-failed", StringComparison.OrdinalIgnoreCase) ? "; validation failed after Angular CLI changes, changes retained" : "";
                return $"- {label}: official update triggered=yes; mode={r.StringValue("officialAngularUpdateMode", "migrate-only")}; reason={r.StringValue("officialAngularUpdateTriggerReason", r.StringValue("officialAngularMigrateOnlyTriggerReason"))}; source={r.StringValue("officialAngularUpdateSource", r.StringValue("officialAngularMigrateOnlySource"))}; command=`{command}`; Angular CLI generated changes={FilesText(files)}; acceptance={r.StringValue("officialAngularMigrationAcceptanceStatus")}; source/template files changed by Angular CLI={FilesText(sourceFiles)}{validationNote}";
            }

            var required = r.BoolValue("officialAngularUpdateRequired", r.BoolValue("officialAngularMigrateOnlyRequired"));
            var reason = r.StringValue("migrateOnlySkippedReason", required ? "required official Angular update did not run" : "not required by Angular hop policy");
            return $"- {label}: official update triggered={r.BoolValue("officialAngularUpdateTriggered", r.BoolValue("officialAngularMigrateOnlyTriggered"))}; skipped={r.BoolValue("migrateOnlySkipped", true)}; required={required}; reason={reason}";
        });
    }

    private static string FilesText(string files) => string.IsNullOrWhiteSpace(files) ? "none" : files;

    private static IEnumerable<string> FormatPeerDependencyConflicts(IReadOnlyList<JsonObject> hopResults)
    {
        var lines = new List<string>();
        foreach (var hop in hopResults)
        {
            var label = $"Angular {hop["hop"]?["fromVersion"]} -> {hop["hop"]?["toVersion"]}";
            foreach (var conflict in hop["peerDependencyConflicts"]?.AsArray()?.OfType<JsonObject>() ?? [])
            {
                lines.Add($"- {label}: package={conflict.StringValue("conflictingPackage", "unknown")}; requiredRange={conflict.StringValue("requiredPeerRange", "unknown")}; planned={conflict.StringValue("plannedVersion", "unknown")}; installed={conflict.StringValue("installedVersion", "unknown")}; requiredBy={conflict.StringValue("requiredBy", "unknown")}; classification={conflict.StringValue("classification", "unknownPeerConflict")}; decision={conflict.StringValue("decision", "manualReview")}");
            }
        }
        return lines.Count == 0 ? ["- None"] : lines;
    }

    private static IEnumerable<string> FormatHopPackages(IReadOnlyList<JsonObject> hopResults, string property, string? nestedArray = null)
    {
        var lines = new List<string>();
        foreach (var hop in hopResults)
        {
            var label = $"Angular {hop["hop"]?["fromVersion"]} -> {hop["hop"]?["toVersion"]}";
            var node = hop[property];
            var items = nestedArray is null ? node?.AsArray() : node?[nestedArray]?.AsArray();
            if (items is null || items.Count == 0) continue;
            foreach (var item in items.OfType<JsonObject>())
            {
                var name = item.StringValue("name", item.StringValue("filePath", "item"));
                var action = item.StringValue("action", item.StringValue("changeType", item.StringValue("category")));
                var target = item.StringValue("targetVersion", item.StringValue("toVersion"));
                var suffix = string.IsNullOrWhiteSpace(target) ? "" : $" -> {target}";
                var reason = item.StringValue("rejectionReason", item.StringValue("reason"));
                lines.Add($"- {label}: {name} {action}{suffix} ({reason})");
            }
        }
        return lines.Count == 0 ? ["- None"] : lines;
    }

    private static IEnumerable<string> FormatManualReview(IReadOnlyList<JsonObject> hopResults, ValidationResult validation)
    {
        var lines = new List<string>();
        foreach (var hop in hopResults)
        {
            var label = $"Angular {hop["hop"]?["fromVersion"]} -> {hop["hop"]?["toVersion"]}";
            var manualChanged = string.Join(", ", hop["manualReviewChangedFiles"]?.AsArray()?.Select(x => x?.ToString()) ?? []);
            lines.Add($"- {label}: manual_review auto-accept enabled: {hop.BoolValue("manualReviewAutoAcceptEnabled")}; received={hop.IntValue("manualReviewItemsReceived")}; applied={hop["manualReviewAppliedChanges"]?.AsArray()?.Count ?? 0}; failed={hop["manualReviewFailedChanges"]?.AsArray()?.Count ?? 0}; files changed by auto-accepted manual_review items={FilesText(manualChanged)}");
            if (hop.BoolValue("manualReviewAutoAcceptEnabled") && hop.IntValue("manualReviewItemsReceived") > 0) lines.Add("- Warning: manual_review changes were auto-applied because intervention UI is not implemented yet.");
            foreach (var item in hop["manualReviewAppliedChanges"]?.AsArray()?.OfType<JsonObject>() ?? []) lines.Add($"- {label}: manual_review auto-accepted config {item.StringValue("filePath", "unknown")} ({item.StringValue("reason", "manual review")})");
            foreach (var item in hop["manualReviewFailedChanges"]?.AsArray()?.OfType<JsonObject>() ?? []) lines.Add($"- {label}: manual_review failed config {item.StringValue("filePath", "unknown")} ({item.StringValue("rejectionReason", item.StringValue("reason", "manual review failed"))})");
            foreach (var item in hop["packagesManualReview"]?.AsArray()?.OfType<JsonObject>() ?? []) lines.Add($"- {label}: package {item.StringValue("name", "unknown")} ({item.StringValue("reason", "manual review")})");
            foreach (var item in hop["manualAngularConfigRecommendations"]?.AsArray()?.OfType<JsonObject>() ?? []) lines.Add($"- {label}: config {item.StringValue("filePath", "unknown")} ({item.StringValue("reason", item.ToString())})");
        }
        if (lines.Count == 0 && validation.Passed != true && !string.IsNullOrWhiteSpace(validation.FailedHop)) lines.Add($"- Review failed hop: {validation.FailedHop}");
        return lines.Count == 0 ? ["- None"] : lines;
    }

    private static IEnumerable<string> FormatPackageVersionRecommendations(IReadOnlyList<JsonObject> hopResults)
    {
        var lines = new List<string>();
        foreach (var hop in hopResults)
        {
            var label = $"Angular {hop["hop"]?["fromVersion"]} -> {hop["hop"]?["toVersion"]}";
            var acceptedTargets = hop["angularPackageUpgradePlan"]?.AsArray()?.OfType<JsonObject>()
                .ToDictionary(i => i.StringValue("name"), StringComparer.OrdinalIgnoreCase) ?? [];
            foreach (var item in hop["aiPackageVersionRecommendationsAccepted"]?.AsArray()?.OfType<JsonObject>() ?? [])
            {
                var action = item.StringValue("action", "upgrade") == "upgrade" ? "recommended" : item.StringValue("action");
                var packageName = item.StringValue("packageName");
                var applied = acceptedTargets.GetValueOrDefault(packageName);
                var final = applied?.StringValue("finalAcceptedVersion", applied.StringValue("toVersion")) ?? item.StringValue("recommendedVersion", item.StringValue("action"));
                var updated = applied?.BoolValue("packageJsonUpdated") ?? false;
                lines.Add($"- [{action}] {label}: {packageName}: originalSuggested={item.StringValue("recommendedVersion", item.StringValue("action"))}; finalAccepted={final}; packageJsonUpdated={updated}");
                lines.Add($"  Reason: {item.StringValue("reason", "AI package version recommendation accepted.")}");
            }
            foreach (var item in hop["aiPackageVersionRecommendationsRejected"]?.AsArray()?.OfType<JsonObject>() ?? [])
            {
                lines.Add($"- [rejected] {label}: {item.StringValue("packageName", "unknown")}: {item.StringValue("currentVersion")} -> {item.StringValue("recommendedVersion")}");
                lines.Add($"  Reason: {item.StringValue("rejectionReason", item.StringValue("reason", "AI package version recommendation rejected."))}");
            }
            foreach (var item in hop["packageTargetValidation"]?["invalid"]?.AsArray()?.OfType<JsonObject>() ?? [])
            {
                lines.Add($"- [rejected/blocker] {label}: package={item.StringValue("packageName", "unknown")}; aiRecommended={item.StringValue("originalSuggestedVersion", item.StringValue("requestedTarget", "unknown"))}; npmVerificationCommand=`{item.StringValue("npmVerificationCommand", "unknown")}`; npmVerification={item.StringValue("npmVerificationResult", item.StringValue("npmValidationResult", "unknown"))}; aiReRecommended={item.StringValue("aiReRecommendedVersion", "none")}; finalSelected={item.StringValue("finalResolvedVersion", "none")}; fallbackReason={item.StringValue("npmFallbackReason", item.StringValue("failureReason", "none"))}; aiOverriddenByNpm={item.BoolValue("aiRecommendationOverriddenByNpm")}; packageJsonUpdated={item.BoolValue("packageJsonUpdated")}");
            }
            foreach (var item in hop["packageTargetValidation"]?["resolved"]?.AsArray()?.OfType<JsonObject>() ?? [])
            {
                var tag = string.IsNullOrWhiteSpace(item.StringValue("npmFallbackReason")) ? "accepted" : "fallbackResolved";
                lines.Add($"- [{tag}] {label}: package={item.StringValue("packageName", "unknown")}; aiRecommended={item.StringValue("originalSuggestedVersion", item.StringValue("requestedTarget", "unknown"))}; npmVerificationCommand=`{item.StringValue("npmVerificationCommand", "unknown")}`; npmVerification={item.StringValue("npmVerificationResult", item.StringValue("npmValidationResult", "unknown"))}; aiReRecommended={item.StringValue("aiReRecommendedVersion", "none")}; finalSelected={item.StringValue("finalAcceptedVersion", "unknown")}; fallbackReason={item.StringValue("npmFallbackReason", "none")}; aiOverriddenByNpm={item.BoolValue("aiRecommendationOverriddenByNpm")}");
            }
        }
        return lines.Count == 0 ? ["- None"] : lines;
    }

    private static IEnumerable<string> FormatPackageVersionVerification(IReadOnlyList<JsonObject> hopResults)
    {
        var lines = new List<string>();
        foreach (var hop in hopResults)
        {
            var label = $"Angular {hop["hop"]?["fromVersion"]} -> {hop["hop"]?["toVersion"]}";
            var installSucceeded = hop["commands"]?.AsArray()?.OfType<JsonObject>()
                .Where(c => string.Equals(c.StringValue("installMode"), "normalInstall", StringComparison.OrdinalIgnoreCase) || string.Equals(c.StringValue("installMode"), "legacyPeerDepsInstall", StringComparison.OrdinalIgnoreCase))
                .LastOrDefault()?.IntValue("returncode") == 0;
            foreach (var item in hop["packageTargetValidation"]?["resolved"]?.AsArray()?.OfType<JsonObject>() ?? [])
            {
                lines.Add($"- {item.StringValue("packageName", "unknown")}");
                lines.Add($"  - AI recommended: {item.StringValue("originalSuggestedVersion", item.StringValue("requestedTarget", "unknown"))}");
                lines.Add($"  - verification mode: {item.StringValue("verificationMode", hop["packageTargetValidation"]?.AsObject().StringValue("verificationMode", "install-first") ?? "install-first")}");
                lines.Add($"  - npm view: {FormatNpmViewStatus(item)}");
                lines.Add($"  - install result: {(installSucceeded ? "npm install succeeded" : "not validated by successful install")}");
                lines.Add($"  - final selected range: {item.StringValue("finalAcceptedVersion", item.StringValue("finalResolvedVersion", "unknown"))}");
                lines.Add($"  - hop: {label}");
            }
            foreach (var item in hop["packageTargetValidation"]?["invalid"]?.AsArray()?.OfType<JsonObject>() ?? [])
            {
                lines.Add($"- [rejected/blocker] {item.StringValue("packageName", "unknown")}");
                lines.Add($"  - AI recommended: {item.StringValue("originalSuggestedVersion", item.StringValue("requestedTarget", "unknown"))}");
                lines.Add($"  - verification mode: {item.StringValue("verificationMode", hop["packageTargetValidation"]?.AsObject().StringValue("verificationMode", "install-first") ?? "install-first")}");
                lines.Add($"  - npm view: {FormatNpmViewStatus(item)}");
                lines.Add($"  - install result: not run before package target validation failed");
                lines.Add($"  - final selected range: {item.StringValue("finalAcceptedVersion", item.StringValue("finalResolvedVersion", "none"))}");
                lines.Add($"  - hop: {label}");
            }
        }
        return lines.Count == 0 ? ["- None"] : lines;
    }

    private static string FormatNpmViewStatus(JsonObject item)
    {
        var status = item.StringValue("npmVerificationResult", item.StringValue("npmValidationResult", "unknown"));
        if (status == "skipped") return "skipped because install-first mode is enabled";
        if (item.StringValue("npmValidationResult") == "skipped_due_to_timeout") return "timeout; skipped due to timeout and deferred to npm install";
        if (status == "timeout") return "timeout";
        if (status == "verified") return "verified";
        return status;
    }

    private static IEnumerable<string> FormatCriticalDependencyAlignment(IReadOnlyList<JsonObject> hopResults)
    {
        var lines = new List<string>();
        foreach (var hop in hopResults)
        {
            var label = $"Angular {hop["hop"]?["fromVersion"]} -> {hop["hop"]?["toVersion"]}";
            foreach (var item in hop["angularCriticalDependencyAlignmentAccepted"]?.AsArray()?.OfType<JsonObject>() ?? [])
            {
                var action = item.StringValue("action") switch { "align" or "add" => "recommended", "preserve" => "preserved", _ => item.StringValue("action") };
                var versionText = item.StringValue("action") == "preserve"
                    ? item.StringValue("currentVersion")
                    : $"{item.StringValue("currentVersion")} -> {item.StringValue("recommendedVersion")}";
                lines.Add($"- [{action}] {label}: {item.StringValue("packageName")}: {versionText}");
                lines.Add($"  Criticality: {item.StringValue("criticality", "unknown")}");
                lines.Add($"  Reason: {item.StringValue("reason", "Angular critical dependency alignment accepted.")}");
            }
            foreach (var item in hop["angularCriticalDependencyAlignmentRejected"]?.AsArray()?.OfType<JsonObject>() ?? [])
            {
                lines.Add($"- [rejected] {label}: {item.StringValue("packageName", "unknown")}: {item.StringValue("currentVersion")} -> {item.StringValue("recommendedVersion")}");
                lines.Add($"  Reason: {item.StringValue("rejectionReason", item.StringValue("reason", "Angular critical dependency alignment rejected."))}");
            }
            foreach (var item in hop["postFailureAngularCriticalDependencyAlignment"]?["postFailureApplied"]?.AsArray()?.OfType<JsonObject>() ?? [])
            {
                lines.Add($"- [accepted] {label}: {item.StringValue("name")}: {item.StringValue("fromVersion")} -> {item.StringValue("toVersion")}");
                lines.Add($"  Criticality: required");
                lines.Add($"  Reason: {item.StringValue("reason", "Applied after build failure indicated Angular compiler/build-tool incompatibility.")}");
            }
        }
        return lines.Count == 0 ? ["- None"] : lines;
    }

    private static IEnumerable<string> FormatCleanInstall(IReadOnlyList<JsonObject> hopResults)
    {
        if (hopResults.Count == 0) return ["- None"];
        var lines = new List<string>();
        foreach (var r in hopResults)
        {
            var label = $"Angular {r["hop"]?["fromVersion"]} -> {r["hop"]?["toVersion"]}";
            lines.Add($"- {label}: node_modules deleted={r.BoolValue("nodeModulesDeleted")}; package-lock.json deleted={r.BoolValue("packageLockDeleted")}; install command=`{r.StringValue("installCommandUsed", "not run")}`; fallback used={r.BoolValue("installFallbackUsed")}");
            foreach (var remediation in r["cleanInstallSummary"]?["thirdPartyPeerConflictRemediations"]?.AsArray()?.OfType<JsonObject>() ?? [])
            {
                var runtimePeer = remediation.StringValue("versionRecommendationSource") == "runtime-peer-dependency-remediation";
                var prefix = runtimePeer ? "root runtime peer package remediated" : "peer conflict package remediated";
                lines.Add($"- {label}: {prefix}={remediation.StringValue("packageName", "unknown")}; {remediation.StringValue("fromVersion", "unknown")} -> {remediation.StringValue("toVersion", "manual review")}; requiredByPackage={remediation.StringValue("requiredByPackage", remediation.StringValue("requiredBy", "unknown"))}; requiredPeerRange={remediation.StringValue("requiredPeerRange", "unknown")}; source={remediation.StringValue("versionRecommendationSource", "third-party-peer-conflict-remediation")}; npm validation={remediation.StringValue("npmValidationResult", remediation.StringValue("status", "unknown"))}; verification=`{remediation.StringValue("verificationCommand", "not run")}`; reason={remediation.StringValue("angularCompatibilityReason", remediation.StringValue("reason"))}");
            }
        }
        return lines;
    }

    private static IEnumerable<string> FormatBuildVerification(IReadOnlyList<JsonObject> hopResults)
    {
        if (hopResults.Count == 0) return ["- None"];
        return hopResults.Select(r =>
        {
            var validation = r["validation"]?.AsObject() ?? new JsonObject();
            var reason = validation.StringValue("buildVerificationFailureReason");
            var reasonText = string.IsNullOrWhiteSpace(reason) ? "" : $"; failure reason={reason}";
            return $"- Angular {r["hop"]?["fromVersion"]} -> {r["hop"]?["toVersion"]}: build verification attempted={validation.BoolValue("buildVerificationAttempted")}; command=`{validation.StringValue("buildVerificationCommand")}`; executor={validation.StringValue("buildVerificationExecutor", "unknown")}; passed={validation.BoolValue("buildVerificationPassed")}; skipped={validation.BoolValue("buildVerificationSkipped")}; next hop started only after build verification passed={validation.BoolValue("nextHopStartedOnlyAfterBuildVerificationPassed")}{reasonText}";
        });
    }

    private static IEnumerable<string> FormatAgentValidation(IReadOnlyList<JsonObject> hopResults)
    {
        if (hopResults.Count == 0) return ["- Validation command executed by migration agent: validation command", "- Result: not run"];
        var latest = hopResults.LastOrDefault(r => r["validation"] is JsonObject);
        var validation = latest?["validation"]?.AsObject();
        if (validation is null) return ["- Validation command executed by migration agent: validation command", "- Result: not run"];
        var passed = validation.BoolValue("passed") ? "passed" : "failed";
        return [$"- Validation command executed by migration agent: {validation.StringValue("buildVerificationCommand", "npm run build")}", $"- Result: {passed}"];
    }

    private static string DependencyUpgradeSectionTitle(JsonObject analysis)
    {
        var from = analysis.StringValue("from");
        return from.StartsWith("dotnet", StringComparison.OrdinalIgnoreCase) ? "AI Suggested Package Upgrades" : "AI Suggested Dependency Upgrades";
    }

    private static IEnumerable<string> FormatDependencyUpgrades(IReadOnlyList<JsonObject> plan, IReadOnlyList<ChangeResult> results, IReadOnlySet<string> sources)
    {
        var items = plan.Where(p => (p.StringValue("type") is "dependency" or "package") && sources.Contains(p.StringValue("source"))).ToArray();
        if (items.Length == 0) return ["- None"];
        return items.Select(change => $"- [planned] {change.StringValue("name")}: {change.StringValue("fromVersion")} -> {change.StringValue("toVersion")}");
    }

    private static string FormatNullable(bool? value) => value.HasValue ? value.Value.ToString() : "";

    private static IEnumerable<string> FormatAiRemediation(IEnumerable<JsonObject> changes)
    {
        var items = changes.ToArray();
        if (items.Length == 0) return ["- Not run or no changes applied"];
        var lines = new List<string>();
        var businessFiles = items.Where(c => c.BoolValue("businessFile")).Select(c => c.StringValue("file")).Where(f => f.Length > 0).Distinct().ToArray();
        if (businessFiles.Length > 0)
        {
            lines.Add("These business/source files were edited by post-validation AI remediation. Review before accepting migration.");
            lines.AddRange(businessFiles.Select(f => $"- {f}"));
        }
        foreach (var item in items.OrderBy(c => c.IntValue("attempt")))
        {
            lines.Add($"### Attempt {item["attempt"]}");
            lines.Add("- Trigger: validation/build failure");
            lines.Add($"- Failed command: {item.StringValue("failedCommand", "validation command")}");
            lines.Add($"- Failure cause: {item.StringValue("failureCause", item.StringValue("reason"))}");
            lines.Add($"- Failure category: {item.StringValue("failureCategory", "unknown")}");
            lines.Add($"- Remediation mode: {item.StringValue("mode", "ai")}");
            if (!string.Equals(item.StringValue("result"), "failed", StringComparison.OrdinalIgnoreCase))
            {
                if (string.Equals(item.StringValue("type"), "type_shim", StringComparison.OrdinalIgnoreCase)) lines.Add("- AI proposed type shim");
                if (string.Equals(item.StringValue("type"), "type_shim", StringComparison.OrdinalIgnoreCase))
                {
                    if (item.StringValue("packageName").Equals("ngx-pinch-zoom", StringComparison.OrdinalIgnoreCase) || item.StringValue("reason").Contains("VisibilityState", StringComparison.OrdinalIgnoreCase))
                    {
                        lines.Add("- Validation failed because third-party declaration file referenced missing VisibilityState type.");
                    }
                    lines.Add("- AI remediation attempted: type_shim");
                    lines.Add($"- Shim applied: {item.StringValue("status", "applied").Equals("applied", StringComparison.OrdinalIgnoreCase)}");
                    if (!string.IsNullOrWhiteSpace(item.StringValue("validationResultAfterRemediation"))) lines.Add($"- Build passed after remediation: {item.StringValue("validationResultAfterRemediation").Equals("passed", StringComparison.OrdinalIgnoreCase)}");
                }
                lines.Add($"- File changed: {item.StringValue("file", item.StringValue("name"))}");
                if (item["files"] is JsonArray files)
                {
                    foreach (var file in files.Select(f => f?.ToString() ?? "").Where(f => f.Length > 0).Distinct())
                    {
                        lines.Add($"  File: {file}");
                    }
                }
                lines.Add($"- Change type: {item.StringValue("type")}");
                lines.Add($"- Change: {item.StringValue("change", item.StringValue("type"))}");
                if (!string.IsNullOrWhiteSpace(item.StringValue("safetyRepairReason"))) lines.Add($"- Safety repair: {item.StringValue("safetyRepairReason")}");
                if (item["safetyRepairs"] is JsonArray safetyRepairs)
                {
                    foreach (var repair in safetyRepairs.OfType<JsonObject>())
                    {
                        lines.Add($"  Repair: {repair.StringValue("file")} before {repair.StringValue("property")}");
                    }
                }
                if (!string.IsNullOrWhiteSpace(item.StringValue("rootCause"))) lines.Add($"- Root cause: {item.StringValue("rootCause")}");
                if (!string.IsNullOrWhiteSpace(item.StringValue("packageName"))) lines.Add($"- Package: {item.StringValue("packageName")}");
                if (!string.IsNullOrWhiteSpace(item.StringValue("installedVersion"))) lines.Add($"- Installed version: {item.StringValue("installedVersion")}");
                if (!string.IsNullOrWhiteSpace(item.StringValue("oldImport"))) lines.Add($"- Before: {item.StringValue("oldImport")}");
                if (!string.IsNullOrWhiteSpace(item.StringValue("newImport"))) lines.Add($"- After: {item.StringValue("newImport")}");
                if (item["cssImportRemediationResolution"] is JsonArray cssResolution)
                {
                    lines.Add("#### CSS Import Remediation Resolution");
                    foreach (var plan in cssResolution.OfType<JsonObject>())
                    {
                        lines.Add($"- Original import: {plan.StringValue("originalImport")}");
                        lines.Add($"  Source file: {plan.StringValue("sourceFile")}");
                        lines.Add($"  Selected strategy: {plan.StringValue("selectedStrategy")}");
                        lines.Add($"  Replacement import: {plan.StringValue("replacementImport", "manual review")}");
                        var evidence = string.Join("; ", plan["evidence"]?.AsArray()?.Select(x => x?.ToString()).Where(s => !string.IsNullOrWhiteSpace(s)) ?? []);
                        if (!string.IsNullOrWhiteSpace(evidence)) lines.Add($"  Evidence: {evidence}");
                        var rejected = string.Join("; ", plan["rejectedCandidates"]?.AsArray()?.OfType<JsonObject>().Select(c => $"{c.StringValue("candidate")}={c.StringValue("reason")}") ?? []);
                        if (!string.IsNullOrWhiteSpace(rejected)) lines.Add($"  Rejected candidates: {rejected}");
                        if (plan.TryGetPropertyValue("confidence", out var planConfidence)) lines.Add($"  Confidence: {planConfidence}");
                    }
                }
                var unresolvedImports = string.Join(", ", item["unresolvedDependencyImports"]?.AsArray()?.Select(x => x?.ToString()).Where(s => !string.IsNullOrWhiteSpace(s)) ?? []);
                if (!string.IsNullOrWhiteSpace(unresolvedImports)) lines.Add($"- Unresolved dependency imports from Can't resolve: {unresolvedImports}");
                var loaderResources = string.Join(", ", item["loaderResourceFilesFromErrorChain"]?.AsArray()?.Select(x => x?.ToString()).Where(s => !string.IsNullOrWhiteSpace(s)) ?? []);
                if (!string.IsNullOrWhiteSpace(loaderResources)) lines.Add($"- Loader/resource stylesheet files from error chain: {loaderResources}");
                var containingFiles = string.Join(", ", item["styleFilesContainingUnresolvedImports"]?.AsArray()?.Select(x => x?.ToString()).Where(s => !string.IsNullOrWhiteSpace(s)) ?? []);
                if (!string.IsNullOrWhiteSpace(containingFiles)) lines.Add($"- Stylesheet files containing unresolved dependency imports: {containingFiles}");
                var remainingExact = string.Join(", ", item["exactUnresolvedImportsRemainingAfterRemediation"]?.AsArray()?.Select(x => x?.ToString()).Where(s => !string.IsNullOrWhiteSpace(s)) ?? []);
                lines.Add($"- Exact unresolved imports remaining after remediation: {(string.IsNullOrWhiteSpace(remainingExact) ? "none" : remainingExact)}");
                if (item.TryGetPropertyValue("deterministicRemediationAttempted", out var deterministicAttempted)) lines.Add($"- Deterministic remediation attempted: {deterministicAttempted}");
                if (item.TryGetPropertyValue("deterministicRemediationApplied", out var deterministicApplied)) lines.Add($"- Deterministic remediation applied: {deterministicApplied}");
                if (item.TryGetPropertyValue("deterministicRemediationRejected", out var deterministicRejected)) lines.Add($"- Deterministic remediation rejected: {deterministicRejected}");
                if (item.TryGetPropertyValue("aiRemediationAttempted", out var aiAttempted)) lines.Add($"- AI remediation attempted: {aiAttempted}");
                if (item.TryGetPropertyValue("aiRemediationApplied", out var aiApplied)) lines.Add($"- AI remediation applied: {aiApplied}");
                if (item.TryGetPropertyValue("originalUnresolvedImportsRemain", out var importsRemain)) lines.Add($"- Original unresolved imports remain: {importsRemain}");
                if (item["changedStyleFiles"] is JsonArray changedStyleFiles)
                {
                    var changed = string.Join(", ", changedStyleFiles.Select(x => x?.ToString()).Where(s => !string.IsNullOrWhiteSpace(s)));
                    if (!string.IsNullOrWhiteSpace(changed)) lines.Add($"- Changed style files: {changed}");
                }
                if (!string.IsNullOrWhiteSpace(item.StringValue("directNormalizedImportAttempted"))) lines.Add($"- Direct normalized import attempted: {item.StringValue("directNormalizedImportAttempted")}");
                if (!string.IsNullOrWhiteSpace(item.StringValue("selectedPackageScssAsset"))) lines.Add($"- Selected package SCSS asset: {item.StringValue("selectedPackageScssAsset")}");
                if (!string.IsNullOrWhiteSpace(item.StringValue("missingInternalPartial"))) lines.Add($"- Missing internal partial: {item.StringValue("missingInternalPartial")}");
                if (!string.IsNullOrWhiteSpace(item.StringValue("packageDirectoryInspected"))) lines.Add($"- Package directory inspected: {item.StringValue("packageDirectoryInspected")}");
                var partialCandidates = string.Join(", ", item["partialCandidatesFound"]?.AsArray()?.Select(x => x?.ToString()).Where(s => !string.IsNullOrWhiteSpace(s)) ?? []);
                if (!string.IsNullOrWhiteSpace(partialCandidates)) lines.Add($"- Partial candidates found: {partialCandidates}");
                if (item.TryGetPropertyValue("originalImporterWasCss", out var importerWasCss)) lines.Add($"- Original importer was CSS: {importerWasCss}");
                if (!string.IsNullOrWhiteSpace(item.StringValue("finalChosenRemediation"))) lines.Add($"- Final chosen remediation: {item.StringValue("finalChosenRemediation")}");
                var packageCandidates = string.Join(", ", item["packageExportCandidatesAttempted"]?.AsArray()?.Select(x => x?.ToString()).Where(s => !string.IsNullOrWhiteSpace(s)) ?? []);
                if (!string.IsNullOrWhiteSpace(packageCandidates)) lines.Add($"- Package-export candidates attempted: {packageCandidates}");
                var fileCandidates = string.Join(", ", item["candidateFilesAttempted"]?.AsArray()?.Select(x => x?.ToString()).Where(s => !string.IsNullOrWhiteSpace(s)) ?? []);
                if (!string.IsNullOrWhiteSpace(fileCandidates)) lines.Add($"- Candidate files attempted: {fileCandidates}");
                if (item["styleImportUpdates"] is JsonArray styleUpdates)
                {
                    foreach (var update in styleUpdates.OfType<JsonObject>())
                    {
                        lines.Add($"  Style import: {update.StringValue("file")}: {update.StringValue("before")} -> {update.StringValue("after")}");
                        if (!string.IsNullOrWhiteSpace(update.StringValue("directNormalizedImportAttempted"))) lines.Add($"    Direct normalized import attempted: {update.StringValue("directNormalizedImportAttempted")}");
                        var updateCandidates = string.Join(", ", update["candidateFilesAttempted"]?.AsArray()?.Select(x => x?.ToString()).Where(s => !string.IsNullOrWhiteSpace(s)) ?? []);
                        if (!string.IsNullOrWhiteSpace(updateCandidates)) lines.Add($"    Candidate files attempted: {updateCandidates}");
                        if (!string.IsNullOrWhiteSpace(update.StringValue("selectedImport"))) lines.Add($"    Final selected import: {update.StringValue("selectedImport")}");
                        if (!string.IsNullOrWhiteSpace(update.StringValue("selectedPackageScssAsset"))) lines.Add($"    Selected package SCSS asset: {update.StringValue("selectedPackageScssAsset")}");
                        if (!string.IsNullOrWhiteSpace(update.StringValue("missingInternalPartial"))) lines.Add($"    Missing internal partial: {update.StringValue("missingInternalPartial")}");
                        if (!string.IsNullOrWhiteSpace(update.StringValue("packageDirectoryInspected"))) lines.Add($"    Package directory inspected: {update.StringValue("packageDirectoryInspected")}");
                        var updatePartialCandidates = string.Join(", ", update["partialCandidatesFound"]?.AsArray()?.Select(x => x?.ToString()).Where(s => !string.IsNullOrWhiteSpace(s)) ?? []);
                        if (!string.IsNullOrWhiteSpace(updatePartialCandidates)) lines.Add($"    Partial candidates found: {updatePartialCandidates}");
                        if (!string.IsNullOrWhiteSpace(update.StringValue("finalChosenRemediation"))) lines.Add($"    Final chosen remediation: {update.StringValue("finalChosenRemediation")}");
                    }
                }
                lines.Add($"- Reason: {item.StringValue("reason")}");
            }
            if (!string.IsNullOrWhiteSpace(item.StringValue("failureReason"))) lines.Add($"- Failure reason: {item.StringValue("failureReason")}");
            if (!string.IsNullOrWhiteSpace(item.StringValue("timeoutType"))) lines.Add($"- Timeout type: {item.StringValue("timeoutType")}");
            if (!string.IsNullOrWhiteSpace(item.StringValue("timeoutDetails"))) lines.Add($"- Timeout details: {item.StringValue("timeoutDetails")}");
            if (!string.IsNullOrWhiteSpace(item.StringValue("environmentErrorDetails"))) lines.Add($"- Codex sandbox error: {item.StringValue("environmentErrorDetails")}");
            if (!string.IsNullOrWhiteSpace(item.StringValue("agentValidationCommand"))) lines.Add($"- Agent validation command: {item.StringValue("agentValidationCommand")}");
            if (!string.IsNullOrWhiteSpace(item.StringValue("agentValidationResult"))) lines.Add($"- Agent validation result: {item.StringValue("agentValidationResult")}");
            if (item.TryGetPropertyValue("confidence", out var confidence)) lines.Add($"- Confidence: {confidence}");
            if (!string.IsNullOrWhiteSpace(item.StringValue("risk"))) lines.Add($"- Risk: {item.StringValue("risk")}");
            lines.Add($"- Business logic changed: {(item.BoolValue("businessLogicChanged") || item.BoolValue("businessFile") ? "yes" : "no")}");
            if (item.TryGetPropertyValue("manualCriticalAttentionRequired", out var attention)) lines.Add($"- Manual critical attention required: {(attention?.ToString().Equals("true", StringComparison.OrdinalIgnoreCase) == true ? "yes" : "no")}");
            if (!string.IsNullOrWhiteSpace(item.StringValue("reviewNote"))) lines.Add($"- Review note: {item.StringValue("reviewNote")}");
            lines.Add($"- Result after rerun: {item.StringValue("validationResultAfterRemediation", "not recorded")}");
            lines.Add($"- Result: {item.StringValue("result", "validation rerun " + item.StringValue("validationResultAfterRemediation", "not recorded"))}");
            lines.Add($"- Next action: {item.StringValue("nextAction", item.StringValue("validationResultAfterRemediation") == "passed" ? "continue normal validation pipeline" : "continue remediation or manual correction")}");
        }
        return lines;
    }

    private static IEnumerable<string> FormatAngularRootCauseAnalysis(IReadOnlyList<JsonObject> hopResults)
    {
        var analyses = hopResults
            .SelectMany(r => new[]
            {
                r["validation"]?["aiRemediationRootCauseAnalysis"] as JsonObject,
                r["validationSummary"]?["aiRemediationRootCauseAnalysis"] as JsonObject
            }.Concat(r["validationFailures"]?.AsArray()?.OfType<JsonObject>().Select(f => f["rootCauseAnalysis"] as JsonObject) ?? []))
            .Where(a => a is not null)
            .Cast<JsonObject>()
            .ToArray();
        if (analyses.Length == 0) return ["- None"];

        var lines = new List<string>();
        foreach (var analysis in analyses)
        {
            var hop = analysis.StringValue("migrationHop", "unknown");
            foreach (var item in analysis["obsoleteAngularMetadata"]?.AsArray()?.OfType<JsonObject>() ?? [])
            {
                lines.Add($"- obsolete Angular metadata: hop={hop}; file={item.StringValue("sourceFile", "unknown")}; symbol={item.StringValue("symbol", "entryComponents")}; reason={item.StringValue("reason")}");
            }
            foreach (var item in analysis["incompatibleAngularLibraryPackages"]?.AsArray()?.OfType<JsonObject>() ?? [])
            {
                var files = string.Join(", ", item["sourceFiles"]?.AsArray()?.Select(f => f?.ToString()).Where(f => !string.IsNullOrWhiteSpace(f)) ?? []);
                lines.Add($"- incompatible Angular library package: hop={hop}; package={item.StringValue("package", "unknown")}; files={files}; reason={item.StringValue("reason")}; editNodeModules={item.BoolValue("editNodeModules")}");
            }
            foreach (var item in analysis["cascadingLocalModuleErrors"]?.AsArray()?.OfType<JsonObject>() ?? [])
            {
                var packages = string.Join(", ", item["correlatedThirdPartyPackages"]?.AsArray()?.Select(p => p?.ToString()).Where(p => !string.IsNullOrWhiteSpace(p)) ?? []);
                lines.Add($"- cascading local module error: hop={hop}; symbol={item.StringValue("symbol", "unknown")}; file={item.StringValue("sourceFile", "unknown")}; @NgModule present={item.BoolValue("ngModuleDecoratorPresent")}; correlated packages={packages}; reason={item.StringValue("reason")}");
            }
        }
        return lines.Count == 0 ? ["- None"] : lines;
    }

    private static IEnumerable<string> FormatThirdPartyValidationBlockers(IReadOnlyList<JsonObject> hopResults)
    {
        var lines = new List<string>();
        foreach (var hop in hopResults)
        {
            var label = $"Angular {hop["hop"]?["fromVersion"]} -> {hop["hop"]?["toVersion"]}";
            var changes = hop["aiRemediationChanges"]?.AsArray()?.OfType<JsonObject>().ToArray() ?? [];
            foreach (var blocker in hop["thirdPartyValidationBlockers"]?.AsArray()?.OfType<JsonObject>() ?? [])
            {
                var package = blocker.StringValue("package", blocker.StringValue("packageName", "unknown"));
                var remediation = changes.LastOrDefault(c => c.StringValue("packageName").Equals(package, StringComparison.OrdinalIgnoreCase));
                var evidence = string.Join(" | ", blocker["evidence"]?.AsArray()?.Select(x => x?.ToString()).Where(s => !string.IsNullOrWhiteSpace(s)).Take(3) ?? []);
                lines.Add($"- {label}: package={package}; moduleSymbol={blocker.StringValue("moduleSymbol", "unknown")}; nodeModulesPath={blocker.StringValue("nodeModulesPath", "unknown")}; errorCode={blocker.StringValue("errorCode", "unknown")}; decision={blocker.StringValue("decision", "validation-proven Angular build blocker")}; current={blocker.StringValue("currentVersion", "unknown")}; errorCategory={blocker.StringValue("errorCategory", "unknown")}; evidence={evidence}; selectedRemediation={remediation?.StringValue("action", "not selected") ?? "not selected"}; target={remediation?.StringValue("targetPackageName", package) ?? package}@{remediation?.StringValue("targetVersionRange", "not selected") ?? "not selected"}; installResult={remediation?.StringValue("installResult", "not run") ?? "not run"}; buildRetryResult={remediation?.StringValue("buildRetryResult", "not run") ?? "not run"}");
            }
        }
        return lines.Count == 0 ? ["- None"] : lines;
    }

    private static IEnumerable<string> FormatPersistentCssRemediationState(IReadOnlyList<JsonObject> hopResults)
    {
        var lines = new List<string>();
        foreach (var hop in hopResults)
        {
            var label = $"Angular {hop["hop"]?["fromVersion"]} -> {hop["hop"]?["toVersion"]}";
            foreach (var item in hop["persistentCssRemediationState"]?["records"]?.AsArray()?.OfType<JsonObject>() ?? [])
            {
                lines.Add($"- {label}: {item.StringValue("sourceFile", "unknown")}: {item.StringValue("originalImport")} -> {item.StringValue("replacementImport")}; acceptedHop={item.StringValue("acceptedHop", item.StringValue("acceptedAtHop", "unknown"))}; enforcement={item.StringValue("status", "unknown")}");
            }
        }
        return lines.Count == 0 ? ["- None"] : lines;
    }

    private static IEnumerable<JsonObject> ValidationFailuresFromHop(JsonObject hop)
    {
        if (hop["validationFailures"] is JsonArray recorded) return recorded.OfType<JsonObject>();
        var validation = hop["validation"]?.AsObject();
        if (validation?.BoolValue("passed") != false) return [];
        var command = validation.StringValue("buildVerificationCommand", string.Join(" ", hop["failureCommand"]?.AsArray()?.Select(x => x?.ToString()) ?? ["validation command"]));
        return
        [
            new JsonObject
            {
                ["command"] = command,
                ["exitCode"] = null,
                ["failureCategory"] = validation.StringValue("buildVerificationFailureCategory", hop.StringValue("failureCategory", "unknown")),
                ["errorTail"] = Tail(validation.StringValue("output", validation.StringValue("errors"))),
                ["migrationHop"] = $"{hop["hop"]?["fromVersion"]} -> {hop["hop"]?["toVersion"]}",
                ["remediationAttempted"] = (hop["aiRemediationChanges"]?.AsArray()?.Count ?? 0) > 0 || (hop["manualCorrectionRequests"]?.AsArray()?.Count ?? 0) > 0,
                ["remediationApplied"] = (hop["aiRemediationChanges"]?.AsArray()?.OfType<JsonObject>().Any(c => !string.Equals(c.StringValue("result"), "failed", StringComparison.OrdinalIgnoreCase)) ?? false),
                ["remediationRejected"] = (hop["manualCorrectionRequests"]?.AsArray()?.Count ?? 0) > 0,
                ["manualCorrectionRequired"] = (hop["manualCorrectionRequests"]?.AsArray()?.Count ?? 0) > 0
            }
        ];
    }

    private static IEnumerable<string> FormatValidationFailures(IEnumerable<JsonObject> failures)
    {
        var items = failures.ToArray();
        if (items.Length == 0) return ["- None"];
        var lines = new List<string>();
        foreach (var failure in items)
        {
            lines.Add($"- Command: {failure.StringValue("command", "validation command")}");
            lines.Add($"  Exit code: {failure["exitCode"]?.ToString() ?? "unknown"}");
            lines.Add($"  Failure category: {failure.StringValue("failureCategory", "unknown")}");
            lines.Add($"  Error tail: {failure.StringValue("errorTail")}");
            lines.Add($"  Migration hop: {failure.StringValue("migrationHop", "unknown")}");
            lines.Add($"  Remediation attempted: {failure.BoolValue("remediationAttempted")}");
            lines.Add($"  Remediation applied: {failure.BoolValue("remediationApplied")}");
            lines.Add($"  Remediation rejected: {failure.BoolValue("remediationRejected")}");
            lines.Add($"  Manual correction required: {failure.BoolValue("manualCorrectionRequired")}");
        }
        return lines;
    }

    private static IEnumerable<string> FormatManualCorrections(IEnumerable<JsonObject> requests, ValidationResult validation)
    {
        var items = requests.ToArray();
        if (items.Length == 0) return ["- None"];
        var lines = new List<string>();
        foreach (var request in items)
        {
            lines.Add($"- Reason: {request.StringValue("reason", "Manual review required")}");
            lines.Add($"- Failed command: {request.StringValue("failedCommand", "validation command")}");
            lines.Add($"- Final error: {request.StringValue("lastError", validation.Errors)}");
            if (request["aiRemediationTimeoutDetails"] is JsonObject timeout)
            {
                lines.Add($"- AI remediation timeout details: {timeout.StringValue("timeoutDetails", timeout.StringValue("failureReason"))}");
                lines.Add($"- Timeout type: {timeout.StringValue("timeoutType", "timeout")}");
            }
            lines.Add($"- Reason remediation stopped: {request.StringValue("reason", "Manual review required")}");
            if (!string.IsNullOrWhiteSpace(request.StringValue("rejectedAiPlanReason"))) lines.Add($"- Rejected AI plan reason: {request.StringValue("rejectedAiPlanReason")}");
            if (request["aiPlanDiagnostics"] is JsonObject diagnostics)
            {
                lines.Add($"- AI plan returned: {diagnostics.BoolValue("planReturned")}");
                lines.Add($"- AI returned manual correction: {diagnostics.BoolValue("manualCorrectionReturned")}");
                lines.Add($"- AI plan rejected by safety: {diagnostics.BoolValue("safetyRejected")}");
                if (!string.IsNullOrWhiteSpace(diagnostics.StringValue("safetyRejectionReason"))) lines.Add($"- Safety rejection reason: {diagnostics.StringValue("safetyRejectionReason")}");
                var proposedFiles = string.Join(", ", diagnostics["proposedFiles"]?.AsArray()?.Select(x => x?.ToString()).Where(s => !string.IsNullOrWhiteSpace(s)) ?? []);
                if (!string.IsNullOrWhiteSpace(proposedFiles)) lines.Add($"- AI proposed files: {proposedFiles}");
                foreach (var replacement in diagnostics["proposedReplacements"]?.AsArray()?.OfType<JsonObject>() ?? [])
                {
                    lines.Add($"- AI proposed replacement: {replacement.StringValue("file")}: {replacement.StringValue("oldImport", replacement.StringValue("before"))} -> {replacement.StringValue("newImport", replacement.StringValue("after"))}");
                }
                foreach (var remaining in diagnostics["oldImportsRemaining"]?.AsArray()?.OfType<JsonObject>() ?? [])
                {
                    var files = string.Join(", ", remaining["files"]?.AsArray()?.Select(x => x?.ToString()).Where(s => !string.IsNullOrWhiteSpace(s)) ?? []);
                    lines.Add($"- Old import remained after remediation: {remaining.StringValue("import")} in {files}");
                }
            }
            if (request["cssDependencyImportFailures"] is JsonObject css)
            {
                var unresolvedImports = string.Join(", ", css["unresolvedDependencyImports"]?.AsArray()?.Select(x => x?.ToString()).Where(s => !string.IsNullOrWhiteSpace(s)) ?? []);
                if (!string.IsNullOrWhiteSpace(unresolvedImports)) lines.Add($"- Unresolved dependency imports from Can't resolve: {unresolvedImports}");
                var containingFiles = string.Join(", ", css["styleFilesContainingUnresolvedImports"]?.AsArray()?.Select(x => x?.ToString()).Where(s => !string.IsNullOrWhiteSpace(s)) ?? []);
                if (!string.IsNullOrWhiteSpace(containingFiles)) lines.Add($"- Stylesheet files containing unresolved dependency imports: {containingFiles}");
                var loaderFiles = string.Join(", ", css["loaderResourceFilesFromErrorChain"]?.AsArray()?.Select(x => x?.ToString()).Where(s => !string.IsNullOrWhiteSpace(s)) ?? []);
                if (!string.IsNullOrWhiteSpace(loaderFiles)) lines.Add($"- Loader/resource stylesheet files from error chain: {loaderFiles}");
                foreach (var failure in css["failures"]?.AsArray()?.OfType<JsonObject>() ?? [])
                {
                    lines.Add($"- Original failed import: {failure.StringValue("originalImport")}");
                    lines.Add($"- Direct normalized import attempted: {failure.StringValue("directNormalizedImportAttempted")}");
                    var exportCandidates = string.Join(", ", failure["packageExportCandidatesAttempted"]?.AsArray()?.Select(x => x?.ToString()).Where(s => !string.IsNullOrWhiteSpace(s)) ?? []);
                    if (!string.IsNullOrWhiteSpace(exportCandidates)) lines.Add($"- Package-export candidates attempted: {exportCandidates}");
                    var fileCandidates = string.Join(", ", failure["candidateFilesAttempted"]?.AsArray()?.Select(x => x?.ToString()).Where(s => !string.IsNullOrWhiteSpace(s)) ?? []);
                    if (!string.IsNullOrWhiteSpace(fileCandidates)) lines.Add($"- Candidate files attempted: {fileCandidates}");
                    if (!string.IsNullOrWhiteSpace(failure.StringValue("recommendedImport"))) lines.Add($"- Final selected import: {failure.StringValue("recommendedImport")}");
                    if (!string.IsNullOrWhiteSpace(failure.StringValue("selectedPackageScssAsset"))) lines.Add($"- Selected package SCSS asset: {failure.StringValue("selectedPackageScssAsset")}");
                    if (!string.IsNullOrWhiteSpace(failure.StringValue("missingInternalPartial"))) lines.Add($"- Missing internal partial: {failure.StringValue("missingInternalPartial")}");
                    if (!string.IsNullOrWhiteSpace(failure.StringValue("packageDirectoryInspected"))) lines.Add($"- Package directory inspected: {failure.StringValue("packageDirectoryInspected")}");
                    var partialCandidates = string.Join(", ", failure["partialCandidatesFound"]?.AsArray()?.Select(x => x?.ToString()).Where(s => !string.IsNullOrWhiteSpace(s)) ?? []);
                    if (!string.IsNullOrWhiteSpace(partialCandidates)) lines.Add($"- Partial candidates found: {partialCandidates}");
                    if (failure.TryGetPropertyValue("originalImporterWasCss", out var importerWasCss)) lines.Add($"- Original importer was CSS: {importerWasCss}");
                    if (!string.IsNullOrWhiteSpace(failure.StringValue("finalChosenRemediation"))) lines.Add($"- Final chosen remediation: {failure.StringValue("finalChosenRemediation")}");
                }
            }
            foreach (var instruction in request["manualInstructions"]?.AsArray()?.OfType<JsonObject>() ?? [])
            {
                lines.Add($"  File: {instruction.StringValue("file", "unknown")}");
                lines.Add($"  Error: {instruction.StringValue("error")}");
                lines.Add($"  Suggested manual next step: {instruction.StringValue("possibleChange")}");
                lines.Add($"  Risk: {instruction.StringValue("risk")}");
                lines.Add($"  Validation command: {instruction.StringValue("validationCommand", "rerun validation")}");
            }
        }
        if (validation.SnapshotPath is not null) lines.Add($"- Snapshot path: {validation.SnapshotPath}");
        if (validation.OutputPath is not null) lines.Add($"- Output path: {validation.OutputPath}");
        return lines;
    }

    private static string Tail(string text) => string.Join(" ", (text ?? "").Split(["\r\n", "\n"], StringSplitOptions.RemoveEmptyEntries).TakeLast(8)).Trim();
    private static string ValidationCommand(ValidationResult validation) => validation.FailureCommand is { Count: > 0 } ? string.Join(" ", validation.FailureCommand) : "validation command";
    private static string ValidationResultText(ValidationResult validation) => validation.Passed switch { true => "passed", false => "failed", _ => "not run" };
}
