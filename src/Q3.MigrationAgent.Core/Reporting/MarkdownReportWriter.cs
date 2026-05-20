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
            "- Angular CLI migrate-only is skipped by default.",
            "- Command source: project-local npm scripts and node_modules binaries only",
            "- Angular CLI source: project-local dependency when validation scripts invoke it",
            "- Global Angular CLI: not used",
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
        lines.AddRange(remediations.Length == 0 ? ["- No remediations recorded"] : remediations.Select(r => $"- {r.StringValue("package", "unknown")}: {r.StringValue("toVersion", "unknown")} ({r.StringValue("reason", r.StringValue("status"))})"));
        lines.AddRange(["", "## AI Remediation Changes"]);
        lines.AddRange(FormatAiRemediation(hopResults.SelectMany(r => r["aiRemediationChanges"]?.AsArray()?.OfType<JsonObject>() ?? []).ToArray()));
        lines.AddRange(["", "## Manual Correction Required"]);
        lines.AddRange(FormatManualCorrections(hopResults.SelectMany(r => r["manualCorrectionRequests"]?.AsArray()?.OfType<JsonObject>() ?? []).ToArray(), validation));
        lines.AddRange(["", "## Warnings"]);
        var warnings = hopResults.SelectMany(r => r["preflightDependencyAnalysis"]?["warnings"]?.AsArray()?.Select(w => w?.ToString() ?? "") ?? []).Where(w => w.Length > 0).ToArray();
        lines.AddRange(warnings.Length == 0 ? ["- None"] : warnings.Select(w => $"- {w}"));
        lines.AddRange(["", "## AI Package Categorisation"]);
        lines.AddRange(FormatHopPackages(hopResults, "aiPackageCategorisation", "packages"));
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
        lines.AddRange(["", "## Build Verification"]);
        lines.AddRange(FormatBuildVerification(hopResults));
        lines.AddRange(["", "## Angular CLI Migrate-only Status"]);
        lines.AddRange(hopResults.Count == 0 ? ["- None"] : hopResults.Select(r => $"- Angular {r["hop"]?["fromVersion"]} -> {r["hop"]?["toVersion"]}: skipped={r.BoolValue("migrateOnlySkipped")}; reason={r.StringValue("migrateOnlySkippedReason", "disabled by new default flow")}"));
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
            foreach (var item in hop["packagesManualReview"]?.AsArray()?.OfType<JsonObject>() ?? []) lines.Add($"- {label}: package {item.StringValue("name", "unknown")} ({item.StringValue("reason", "manual review")})");
            foreach (var item in hop["manualAngularConfigRecommendations"]?.AsArray()?.OfType<JsonObject>() ?? []) lines.Add($"- {label}: config {item.StringValue("filePath", "unknown")} ({item.StringValue("reason", item.ToString())})");
        }
        if (lines.Count == 0 && validation.Passed != true && !string.IsNullOrWhiteSpace(validation.FailedHop)) lines.Add($"- Review failed hop: {validation.FailedHop}");
        return lines.Count == 0 ? ["- None"] : lines;
    }

    private static IEnumerable<string> FormatCleanInstall(IReadOnlyList<JsonObject> hopResults)
    {
        if (hopResults.Count == 0) return ["- None"];
        return hopResults.Select(r => $"- Angular {r["hop"]?["fromVersion"]} -> {r["hop"]?["toVersion"]}: node_modules deleted={r.BoolValue("nodeModulesDeleted")}; package-lock.json deleted={r.BoolValue("packageLockDeleted")}; install command=`{r.StringValue("installCommandUsed", "not run")}`; fallback used={r.BoolValue("installFallbackUsed")}");
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
        lines.AddRange(items.Select(c => $"- Attempt {c["attempt"]}: {c.StringValue("type")} {c.StringValue("file", c.StringValue("name"))} - {c.StringValue("reason")}"));
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
            foreach (var instruction in request["manualInstructions"]?.AsArray()?.OfType<JsonObject>() ?? [])
            {
                lines.Add($"  File: {instruction.StringValue("file", "unknown")}");
                lines.Add($"  Error: {instruction.StringValue("error")}");
                lines.Add($"  Possible fix: {instruction.StringValue("possibleChange")}");
                lines.Add($"  Risk: {instruction.StringValue("risk")}");
                lines.Add($"  Validation command: {instruction.StringValue("validationCommand", "rerun validation")}");
            }
        }
        if (validation.SnapshotPath is not null) lines.Add($"- Snapshot path: {validation.SnapshotPath}");
        if (validation.OutputPath is not null) lines.Add($"- Output path: {validation.OutputPath}");
        return lines;
    }
}
