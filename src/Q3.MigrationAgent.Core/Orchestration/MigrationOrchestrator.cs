using System.Text.Json.Nodes;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Core.Analysis;
using Q3.MigrationAgent.Core.Execution;
using Q3.MigrationAgent.Core.Logging;
using Q3.MigrationAgent.Core.Planning;
using Q3.MigrationAgent.Core.Progress;
using Q3.MigrationAgent.Core.Reporting;
using Q3.MigrationAgent.Core.Remediation;
using Q3.MigrationAgent.Core.Rollback;
using Q3.MigrationAgent.Core.Timing;
using Q3.MigrationAgent.Core.Validation;
using Q3.MigrationAgent.Shared.Common;
using Q3.MigrationAgent.Shared.Config;
using Q3.MigrationAgent.Shared.DTO;

namespace Q3.MigrationAgent.Core.Orchestration;

public interface IAdapterRegistry
{
    Task<IMigrationAdapter> FindAdapterAsync(string runtime, string projectPath, CancellationToken cancellationToken = default);
}

public sealed class MigrationOrchestrator(
    IAdapterRegistry adapterRegistry,
    IRuleLoader ruleLoader,
    ProjectAnalyzer analyzer,
    MigrationPlanner planner,
    MigrationExecutor executor,
    MigrationValidator validator,
    AiRemediationPlanner remediationPlanner,
    RollbackService rollback,
    MarkdownReportWriter reporter,
    RunLog runLog,
    IAiCliResolver aiResolver,
    AiUsageTracker aiUsage)
{
    public async Task<MigrationRunResult> RunMigrationAsync(MigrationConfig config, CancellationToken cancellationToken = default)
    {
        var progress = new ProgressReporter(config.Verbosity);
        var logPath = runLog.CreateRunLogPath(config.OutputPath);
        aiUsage.Start(logPath);
        try
        {
            progress.LogFile(logPath);
            runLog.Append(logPath, "Migration run started.");
            var warnings = new List<string>();

        var timing = new TimingRecorder();
        if (ShouldResolveAiCli(config))
        {
            using (timing.Measure("AI CLI resolution"))
            {
                config = config with { Ai = await aiResolver.ResolveAsync(config.Ai, config.ProjectPath, progress, logPath, cancellationToken) };
            }
            warnings.AddRange(config.Ai.CliWarnings);
        }

        progress.Stage("Analysis", "Selecting project runtime...");
        IMigrationAdapter adapter;
        using (timing.Measure("runtime detection"))
        {
            adapter = await adapterRegistry.FindAdapterAsync(config.From.Runtime, config.ProjectPath, cancellationToken);
        }
        progress.Stage("Analysis", $"Using selected {adapter.RuntimeName} adapter.");
        JsonObject manifestForVersion;
        using (timing.Measure("manifest parsing"))
        {
            manifestForVersion = await adapter.ParseManifestAsync(config.ProjectPath, cancellationToken);
        }
        if (string.IsNullOrWhiteSpace(config.From.Version))
        {
            var detected = manifestForVersion["angularVersion"]?.ToString() ?? manifestForVersion["version"]?.ToString();
            if (!string.IsNullOrWhiteSpace(detected)) config = config with { From = config.From with { Version = detected } };
        }

        progress.Stage("Analysis", "Planning migration hops...");
        var hops = adapter.ExpandMigrationHops(config.From.Version, config.To.Version);
        if (hops.Count > 0)
        {
            progress.Stage("Analysis", $"Planned hops: {string.Join(", ", hops.Select(h => $"{h.FromVersion} -> {h.ToVersion}"))}.");
            return await RunAdapterHopMigrationAsync(config, adapter, hops, progress, logPath, warnings, timing, cancellationToken);
        }

        progress.Stage("Analysis", "No adapter-native migration hops required.");
        JsonObject rules;
        using (timing.Measure("rule loading"))
        {
            rules = await ruleLoader.LoadRulesAsync(config.From.Runtime, config.From.Version, config.To.Version, cancellationToken);
        }
        var manifest = await adapter.ParseManifestAsync(config.ProjectPath, cancellationToken);
        progress.Stage("Analysis", "Analyzing project files...");
        JsonObject analysis;
        using (timing.Measure("analysis"))
        {
            analysis = await analyzer.AnalyzeProjectAsync(config.ProjectPath, config, rules, manifest, adapter, cancellationToken);
        }
        progress.Stage("Analysis", "Planning changes...");
        IReadOnlyList<JsonObject> plan;
        using (timing.Measure("planning"))
        {
            plan = await planner.BuildMigrationPlanAsync(analysis, rules, config.Ai, cancellationToken);
        }
        progress.Stage("Analysis", $"Planned changes: {plan.Count}.");
        progress.Detail($"Detected adapter: {adapter.RuntimeName}");
        progress.Detail($"AI enabled: {config.Ai.UseAi}");
        foreach (var item in plan.Select((change, i) => (change, i)))
        {
            progress.Detail($"  {item.i + 1}. [{item.change["type"]}] {item.change["description"] ?? item.change["name"] ?? item.change["type"]}");
        }

        if (config.DryRun)
        {
            Directory.CreateDirectory(config.OutputPath);
            var validation = new ValidationResult { Passed = null, Output = "Dry run only." };
            var report = reporter.GenerateReport(plan, [], analysis, validation);
            var reportPath = Path.Combine(config.OutputPath, "migration-report.md");
            await File.WriteAllTextAsync(reportPath, report, cancellationToken);
            progress.FinalReport(reportPath);
            if (config.ShowTimingSummary) timing.Write(config.OutputPath);
            return new MigrationRunResult { Success = true, ReportPath = reportPath, LogPath = logPath, ValidationPassed = null, Warnings = warnings };
        }

        if (!config.AutoApprove && !Confirm("Apply these changes to a copy of the project?"))
        {
            progress.Error("Execution", "Migration cancelled before execution.");
            return new MigrationRunResult { Success = false, LogPath = logPath, Warnings = warnings, Errors = ["Migration cancelled before execution."] };
        }

        progress.Stage("Execution", "Copying project...");
        string snapshot;
        using (timing.Measure("rollback snapshot"))
        {
            snapshot = rollback.CreateSnapshot(config.ProjectPath, config.OutputPath);
        }
        IReadOnlyList<ChangeResult> results;
        using (timing.Measure("project copy and change execution"))
        {
            results = await executor.ExecuteChangesAsync(plan, config.ProjectPath, config.OutputPath, adapter, cancellationToken);
        }
        progress.Stage("Validation", "Running validation...");
        ValidationResult validationResult;
        using (timing.Measure("validation"))
        {
            validationResult = await validator.ValidateAsync(config.OutputPath, adapter, config.CommandTimeoutSeconds, config.CommandIdleTimeoutSeconds, cancellationToken);
        }
        validationResult.RollbackMode = config.RollbackMode;
        validationResult.SnapshotPath = snapshot;
        validationResult.OutputPath = config.OutputPath;
        validationResult.Attempts.Add(new JsonObject { ["attempt"] = 0, ["passed"] = validationResult.Passed, ["stage"] = "initial validation" });
        if (validationResult.Passed == false) RecordValidationFailure(validationResult, adapter.RuntimeName, config.From.Version, 0, false);

        if (validationResult.Passed == false && config.MaxAiRemediationRetries > 0)
        {
            for (var attempt = 1; attempt <= config.MaxAiRemediationRetries && validationResult.Passed == false; attempt++)
            {
                using (timing.Measure($"remediation attempt {attempt}"))
                {
                    var remediation = await remediationPlanner.TryRemediateAsync(config, config.OutputPath, adapter, validationResult, attempt, cancellationToken);
                    if (!remediation.Attempted) break;
                    foreach (var change in remediation.Changes) validationResult.AiRemediationChanges.Add(change);
                    if (remediation.ManualCorrection is not null)
                    {
                        validationResult.ManualCorrectionRequests.Add(remediation.ManualCorrection);
                        break;
                    }
                    var previousAttempts = validationResult.Attempts.ToArray();
                    var previousRemediations = validationResult.AiRemediationChanges.ToArray();
                    var previousManual = validationResult.ManualCorrectionRequests.ToArray();
                    var failedCommand = validationResult.FailureCommand?.ToArray();
                    if (!remediation.Applied)
                    {
                        if (remediation.Changes.Any(IsAiEnvironmentError))
                        {
                            progress.Stage("Validation", "Codex sandbox validation output was ignored. Re-running validation with the migration agent.");
                            validationResult = await validator.ValidateAsync(config.OutputPath, adapter, config.CommandTimeoutSeconds, config.CommandIdleTimeoutSeconds, cancellationToken);
                            validationResult.RollbackMode = config.RollbackMode;
                            validationResult.SnapshotPath = snapshot;
                            validationResult.OutputPath = config.OutputPath;
                            validationResult.FailureCommand = failedCommand ?? validationResult.FailureCommand;
                            validationResult.Attempts.AddRange(previousAttempts);
                            validationResult.AiRemediationChanges.AddRange(previousRemediations);
                            validationResult.ManualCorrectionRequests.AddRange(previousManual);
                            validationResult.Attempts.Add(new JsonObject { ["attempt"] = attempt, ["passed"] = validationResult.Passed, ["stage"] = "agent validation after Codex sandbox output" });
                            if (validationResult.Passed == false) RecordValidationFailure(validationResult, adapter.RuntimeName, config.From.Version, attempt, true);
                            foreach (var change in validationResult.AiRemediationChanges.Where(c => c.IntValue("attempt") == attempt))
                            {
                                change["agentValidationCommand"] = validationResult.FailureCommand is { Count: > 0 } ? string.Join(" ", validationResult.FailureCommand) : "validation command";
                                change["agentValidationResult"] = validationResult.Passed == true ? "passed" : "failed";
                                change["validationResultAfterRemediation"] = "inconclusive";
                                change["validationErrorTail"] = validationResult.Passed == true ? "" : LogTail(validationResult.Errors.Length > 0 ? validationResult.Errors : validationResult.Output);
                            }
                            if (attempt < config.MaxAiRemediationRetries) continue;
                        }
                        if (remediation.Changes.Any(IsAiTimeoutFailure) && attempt < config.MaxAiRemediationRetries)
                        {
                            progress.Stage("Validation", $"AI remediation attempt {attempt} timed out. Retrying with reduced context.");
                            continue;
                        }
                        break;
                    }
                    validationResult = await validator.ValidateAsync(config.OutputPath, adapter, config.CommandTimeoutSeconds, config.CommandIdleTimeoutSeconds, cancellationToken);
                    validationResult.RollbackMode = config.RollbackMode;
                    validationResult.SnapshotPath = snapshot;
                    validationResult.OutputPath = config.OutputPath;
                    validationResult.FailureCommand = failedCommand ?? validationResult.FailureCommand;
                    validationResult.Attempts.AddRange(previousAttempts);
                    validationResult.AiRemediationChanges.AddRange(previousRemediations);
                    validationResult.ManualCorrectionRequests.AddRange(previousManual);
                    validationResult.Attempts.Add(new JsonObject { ["attempt"] = attempt, ["passed"] = validationResult.Passed, ["stage"] = "AI remediation validation" });
                    if (validationResult.Passed == false) RecordValidationFailure(validationResult, adapter.RuntimeName, config.From.Version, attempt, true);
                    foreach (var change in validationResult.AiRemediationChanges.Where(c => c.IntValue("attempt") == attempt))
                    {
                        change["validationResultAfterRemediation"] = validationResult.Passed == true ? "passed" : "failed";
                        change["validationErrorTail"] = validationResult.Passed == true ? "" : LogTail(validationResult.Errors.Length > 0 ? validationResult.Errors : validationResult.Output);
                    }
                }
            }
        }
        else if (validationResult.Passed == false)
        {
            validationResult.ManualCorrectionRequests.Add(new JsonObject
            {
                ["reason"] = "AI remediation disabled or maxAiRemediationRetries is 0",
                ["failedCommand"] = validationResult.FailureCommand is { Count: > 0 } ? string.Join(" ", validationResult.FailureCommand) : "validation command",
                ["lastError"] = LogTail(validationResult.Errors.Length > 0 ? validationResult.Errors : validationResult.Output),
                ["manualInstructions"] = new JsonArray(new JsonObject
                {
                    ["file"] = "unknown",
                    ["error"] = LogTail(validationResult.Errors.Length > 0 ? validationResult.Errors : validationResult.Output),
                    ["possibleChange"] = "Review the failing validation output and apply the smallest safe manifest/config/script/source fix.",
                    ["risk"] = "manual correction required",
                    ["validationCommand"] = validationResult.FailureCommand is { Count: > 0 } ? string.Join(" ", validationResult.FailureCommand) : "validation command"
                })
            });
        }
        if (validationResult.Passed == false && config.MaxAiRemediationRetries > 0 && validationResult.ManualCorrectionRequests.Count == 0)
        {
            validationResult.ManualCorrectionRequests.Add(new JsonObject
            {
                ["reason"] = "Validation remediation stopped after maxAiRemediationRetries was exhausted.",
                ["failedCommand"] = validationResult.FailureCommand is { Count: > 0 } ? string.Join(" ", validationResult.FailureCommand) : "validation command",
                ["lastError"] = LogTail(validationResult.Errors.Length > 0 ? validationResult.Errors : validationResult.Output),
                ["manualInstructions"] = new JsonArray(new JsonObject
                {
                    ["file"] = "unknown",
                    ["error"] = LogTail(validationResult.Errors.Length > 0 ? validationResult.Errors : validationResult.Output),
                    ["possibleChange"] = "Review the failing validation output and apply the smallest safe manifest/config/script/source fix.",
                    ["risk"] = "manual correction required",
                    ["validationCommand"] = validationResult.FailureCommand is { Count: > 0 } ? string.Join(" ", validationResult.FailureCommand) : "validation command"
                })
            });
        }

        if (validationResult.Passed == false)
        {
            validationResult.SnapshotPath = snapshot;
            validationResult.OutputPath = config.OutputPath;
            if (config.RollbackMode == "auto")
            {
                progress.Error("Validation", "Build failed. Restoring output from snapshot.");
                try { rollback.RestoreSnapshot(snapshot, config.OutputPath); validationResult.AutomaticRollbackApplied = true; }
                catch (Exception ex) { validationResult.RollbackError = ex.Message; progress.Error("Validation", $"Rollback failed: {ex.Message}"); }
            }
            else
            {
                progress.Error("Validation", "Build failed. Output preserved for manual review.");
                PrintManualRollbackOptions(snapshot);
            }
        }

        var finalReport = reporter.GenerateReport(plan, results, analysis, validationResult);
        var finalReportPath = Path.Combine(config.OutputPath, "migration-report.md");
        await File.WriteAllTextAsync(finalReportPath, finalReport, cancellationToken);
        progress.FinalReport(finalReportPath);
        if (validationResult.Passed == false) PrintFailedValidationSummary(progress, "Validation", validationResult, finalReportPath);
        if (config.ShowTimingSummary) timing.Write(config.OutputPath);
            return new MigrationRunResult { Success = validationResult.Passed != false, ReportPath = finalReportPath, LogPath = logPath, ValidationPassed = validationResult.Passed, Warnings = warnings, Errors = validationResult.Passed == false ? [validationResult.Errors] : [] };
        }
        finally
        {
            aiUsage.WriteSummary();
        }
    }

    private async Task<MigrationRunResult> RunAdapterHopMigrationAsync(MigrationConfig config, IMigrationAdapter adapter, IReadOnlyList<MigrationHop> hops, IProgressReporter progress, string logPath, List<string> warnings, TimingRecorder timing, CancellationToken cancellationToken)
    {
        var manifest = await adapter.ParseManifestAsync(config.ProjectPath, cancellationToken);
        progress.Stage("Analysis", DetectionSummary(adapter, manifest));
        var analysis = new System.Text.Json.Nodes.JsonObject
        {
            ["from"] = $"{config.From.Runtime}{config.From.Version}",
            ["to"] = $"{config.To.Runtime}{config.To.Version}",
            ["manifest"] = manifest.DeepClone(),
            ["riskLevel"] = "medium",
            ["confidence"] = 80,
            ["analysisMode"] = "adapter",
            ["planningMode"] = "adapter-sequential"
        };
        var rulesByHop = new Dictionary<(int From, int To), System.Text.Json.Nodes.JsonObject>();
        foreach (var hop in hops)
        {
            rulesByHop[(hop.FromVersion, hop.ToVersion)] = await ruleLoader.LoadRulesAsync(config.From.Runtime, hop.FromVersion.ToString(), hop.ToVersion.ToString(), cancellationToken);
        }

        if (config.DryRun)
        {
            Directory.CreateDirectory(config.OutputPath);
            var report = reporter.GenerateAdapterHopReport(analysis, hops, [], new ValidationResult { Passed = null, Output = "Dry run only." });
            var reportPath = Path.Combine(config.OutputPath, "migration-report.md");
            await File.WriteAllTextAsync(reportPath, report, cancellationToken);
            if (config.ShowTimingSummary) timing.Write(config.OutputPath);
            progress.FinalReport(reportPath);
            return new MigrationRunResult { Success = true, ReportPath = reportPath, LogPath = logPath, ValidationPassed = null, Warnings = warnings };
        }

        if (!config.AutoApprove && !Confirm("Apply these migration hops to a copy of the project?"))
        {
            progress.Error("Execution", "Migration cancelled before execution.");
            return new MigrationRunResult { Success = false, LogPath = logPath, Errors = ["Migration cancelled before execution."], Warnings = warnings };
        }

        progress.Stage("Execution", "Copying project...");
        using (timing.Measure("project copy"))
        {
            MigrationExecutor.CopyProject(config.ProjectPath, config.OutputPath);
        }
        var hopResults = new List<System.Text.Json.Nodes.JsonObject>();
        var validation = new ValidationResult { Passed = true, Output = "All migration hops passed." };
        foreach (var hop in hops)
        {
            string snapshot;
            var hopLabel = $"{RuntimeDisplayName(adapter)} {hop.FromVersion} -> {hop.ToVersion}";
            using (timing.Measure($"rollback snapshot {hopLabel}"))
            {
                snapshot = rollback.CreateSnapshot(config.OutputPath, config.OutputPath);
            }
            JsonObject result;
            using (timing.Measure($"{RuntimeDisplayName(adapter)} hop {hop.FromVersion} -> {hop.ToVersion}"))
            {
                result = await adapter.ExecuteMigrationHopAsync(config.OutputPath, hop, rulesByHop[(hop.FromVersion, hop.ToVersion)], config, progress, logPath, cancellationToken);
            }
            result["snapshotPath"] = snapshot;
            hopResults.Add(result);
            if (result["status"]?.ToString() != "done")
            {
                validation = new ValidationResult
                {
                    Passed = false,
                    FailedHop = $"{hop.FromVersion} -> {hop.ToVersion}",
                    Errors = result["validation"]?["errors"]?.ToString() ?? "Migration hop failed.",
                    Output = result["validation"]?["output"]?.ToString() ?? "",
                    FailureCommand = SplitCommandText(result["validation"]?["buildVerificationCommand"]?.ToString() ?? ""),
                    SnapshotPath = snapshot,
                    OutputPath = config.OutputPath
                };
                progress.Error(hopLabel, config.RollbackMode == "manual" ? "Migration failed. Output preserved for manual review." : "Migration failed. Restoring output from snapshot.");
                if (config.RollbackMode == "auto")
                {
                    try { rollback.RestoreSnapshot(snapshot, config.OutputPath); validation.AutomaticRollbackApplied = true; }
                    catch (Exception ex) { validation.RollbackError = ex.Message; progress.Error(hopLabel, $"Rollback failed: {ex.Message}"); }
                }
                else
                {
                    PrintManualRollbackOptions(snapshot);
                }
                break;
            }
        }

        validation.RollbackMode = config.RollbackMode;
        var final = reporter.GenerateAdapterHopReport(analysis, hops, hopResults, validation);
        var finalPath = Path.Combine(config.OutputPath, "migration-report.md");
        await File.WriteAllTextAsync(finalPath, final, cancellationToken);
        if (config.ShowTimingSummary) timing.Write(config.OutputPath);
        progress.FinalReport(finalPath);
        if (validation.Passed == false) PrintFailedValidationSummary(progress, $"{RuntimeDisplayName(adapter)} {validation.FailedHop ?? "validation"}", validation, finalPath);
        return new MigrationRunResult { Success = validation.Passed != false, ReportPath = finalPath, LogPath = logPath, ValidationPassed = validation.Passed, Warnings = warnings, Errors = validation.Passed == false ? [validation.Errors] : [] };
    }

    private static string DetectionSummary(IMigrationAdapter adapter, JsonObject manifest)
    {
        if (adapter.RuntimeName.Equals("angular", StringComparison.OrdinalIgnoreCase))
        {
            return $"Detected Angular {manifest["angularVersion"]?.ToString() ?? "unknown"} project using {manifest["packageManager"]?.ToString() ?? "unknown"}.";
        }
        if (adapter.RuntimeName.Equals("dotnet", StringComparison.OrdinalIgnoreCase))
        {
            var frameworks = manifest["projects"]?.AsArray()?.OfType<JsonObject>()
                .SelectMany(p => p["targetFrameworks"]?.AsArray()?.Select(f => f?.ToString() ?? "") ?? [])
                .Where(f => !string.IsNullOrWhiteSpace(f))
                .Distinct()
                .Order()
                .ToArray() ?? [];
            return $"Detected .NET project targeting {(frameworks.Length == 0 ? "unknown framework" : string.Join(", ", frameworks))}.";
        }
        return $"Detected {adapter.RuntimeName} project.";
    }

    private static string RuntimeDisplayName(IMigrationAdapter adapter) => adapter.RuntimeName.Equals("dotnet", StringComparison.OrdinalIgnoreCase) ? ".NET" : adapter.RuntimeName.Equals("angular", StringComparison.OrdinalIgnoreCase) ? "Angular" : adapter.RuntimeName;

    private static bool ShouldResolveAiCli(MigrationConfig config) => config.Ai.Provider is null && (config.Ai.UseAi || config.Ai.AiCli == "none");
    private static bool Confirm(string prompt) { Console.Write($"{prompt} [y/N] "); var answer = Console.ReadLine()?.Trim().ToLowerInvariant(); return answer is "y" or "yes"; }
    private static void PrintManualRollbackOptions(string snapshot)
    {
        ConsoleFormatter.WriteLine(ConsoleLabel.Warn, "[Rollback] Automatic rollback disabled.");
        ConsoleFormatter.WriteLine(ConsoleLabel.Info, $"[Rollback] Snapshot available at: {snapshot}");
        ConsoleFormatter.WriteLine(ConsoleLabel.Info, "[Rollback] Review output manually or run rollback command.");
    }
    private static void RecordValidationFailure(ValidationResult validation, string runtime, string? hop, int attempt, bool remediationAttempted)
    {
        validation.ValidationFailures.Add(new JsonObject
        {
            ["command"] = validation.FailureCommand is { Count: > 0 } ? string.Join(" ", validation.FailureCommand) : "validation command",
            ["exitCode"] = ExtractExitCode(validation.Output + "\n" + validation.Errors),
            ["failureCategory"] = ClassifyValidationFailure(validation.Output + "\n" + validation.Errors),
            ["errorTail"] = LogTail(validation.Errors.Length > 0 ? validation.Errors : validation.Output),
            ["migrationHop"] = validation.FailedHop ?? hop ?? "",
            ["runtime"] = runtime,
            ["attempt"] = attempt,
            ["remediationAttempted"] = remediationAttempted
        });
    }

    private static int? ExtractExitCode(string text) => System.Text.RegularExpressions.Regex.Match(text, @"exit code:\s*(?<code>-?\d+)", System.Text.RegularExpressions.RegexOptions.IgnoreCase) is { Success: true } m ? int.Parse(m.Groups["code"].Value) : null;
    private static IReadOnlyList<string>? SplitCommandText(string command) => string.IsNullOrWhiteSpace(command) ? null : command.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    private static string ClassifyValidationFailure(string text)
    {
        if (AiRemediationPlanner.IsCodexSandboxValidationError(text)) return "environment_error";
        if (text.Contains("Unknown argument: prod", StringComparison.OrdinalIgnoreCase)) return "script";
        if (text.Contains("ERESOLVE", StringComparison.OrdinalIgnoreCase) || text.Contains("peer dependency", StringComparison.OrdinalIgnoreCase)) return "dependency";
        if (AiRemediationPlanner.IsAngularMaterialSassThemingFailure(text)) return "material_sass_theming_api";
        if (AiRemediationPlanner.IsCssDependencyImportFailure(text)) return "css_dependency_import";
        if (System.Text.RegularExpressions.Regex.IsMatch(text, @"node_modules[\\/].*TS2304", System.Text.RegularExpressions.RegexOptions.IgnoreCase)) return "type_declaration";
        if (System.Text.RegularExpressions.Regex.IsMatch(text, @"\b(TS|CS|NG)\d+\b|compiler", System.Text.RegularExpressions.RegexOptions.IgnoreCase)) return "compiler";
        if (text.Contains("test failed", StringComparison.OrdinalIgnoreCase)) return "test";
        return "unknown";
    }

    private static string LogTail(string text) => string.Join(Environment.NewLine, (text ?? "").Split(["\r\n", "\n"], StringSplitOptions.None).TakeLast(40));
    private static bool IsAiTimeoutFailure(JsonObject change) =>
        string.Equals(change.StringValue("failureCategory"), "ai_timeout", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(change.StringValue("type"), "ai_timeout", StringComparison.OrdinalIgnoreCase);

    private static bool IsAiEnvironmentError(JsonObject change) =>
        string.Equals(change.StringValue("failureCategory"), "environment_error", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(change.StringValue("type"), "ai_environment_error", StringComparison.OrdinalIgnoreCase);

    private static void PrintFailedValidationSummary(IProgressReporter progress, string stage, ValidationResult validation, string reportPath)
    {
        var command = validation.FailureCommand is { Count: > 0 } ? string.Join(" ", validation.FailureCommand) : "validation command";
        var latestOutput = string.IsNullOrWhiteSpace(validation.Output) ? validation.Errors : validation.Output;
        progress.Error(stage, $"Failed validation command: {command}");
        progress.Error(stage, $"Latest build error tail: {LogTail(latestOutput)}");
        progress.Error(stage, $"Report path: {reportPath}");
    }
}
