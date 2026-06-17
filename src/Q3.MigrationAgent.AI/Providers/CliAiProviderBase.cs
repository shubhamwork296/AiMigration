using System.Text.Json.Nodes;
using Q3.MigrationAgent.AI.Abstractions;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Core.Logging;
using Q3.MigrationAgent.Shared.Config;
using Q3.MigrationAgent.Shared.DTO;

namespace Q3.MigrationAgent.AI.Providers;

public abstract class CliAiProviderBase(ICommandRunner commandRunner, IPromptLoader promptLoader, AiUsageTracker? usageTracker = null) : IAiProvider
{
    public abstract string Name { get; }
    protected abstract IReadOnlyList<string> DefaultCommand(AiConfig config);

    public async Task<JsonObject?> AskAsync(AiConfig config, string system, string user, CancellationToken cancellationToken = default)
    {
        if (!config.UseAi) return null;
        var command = PrepareCommand(config.CliCommand ?? DefaultCommand(config));
        var prompt = string.Join("\n\n", [system, promptLoader.Load("common/json-output-system"), user]);
        var inputUsage = usageTracker?.RecordEstimatedInput(InferCallName(system), null, prompt);
        CommandResult? completed = null;
        var jsonParseStatus = "not-attempted";
        string? jsonParseDiagnostics = null;
        var outputLogged = false;
        try
        {
            completed = await commandRunner.RunAsync([.. command, "-"], input: prompt, timeoutSeconds: config.TimeoutSeconds, idleTimeoutSeconds: config.IdleTimeoutSeconds, cancellationToken: cancellationToken);
            if (completed.ReturnCode == 127) throw new InvalidOperationException($"{Name} CLI was not found. Install it or set aiCliCommand to the CLI executable.");
            if (completed.TimeoutKind is not null)
            {
                var detail = string.IsNullOrWhiteSpace(completed.FailureReason) ? completed.Stderr : completed.FailureReason;
                throw new TimeoutException($"{Name} CLI timed out during remediation planning ({completed.TimeoutKind}): {detail}");
            }
            if (completed.ReturnCode != 0)
            {
                var output = (completed.Stdout + "\n" + completed.Stderr).Trim();
                throw new InvalidOperationException($"{Name} CLI failed: {output[..Math.Min(output.Length, 1000)]}");
            }

            try
            {
                var parsed = AiProviderResolver.ParseCodexResponse(completed.Stdout, completed.Stderr, command, Name);
                jsonParseStatus = "parsed";
                LogEstimatedOutput(inputUsage, completed, jsonParseStatus);
                outputLogged = true;
                return parsed;
            }
            catch (AiJsonParseException ex)
            {
                jsonParseStatus = "failed";
                jsonParseDiagnostics = JsonParseDiagnostics(ex);
                throw;
            }
        }
        finally
        {
            if (!outputLogged && completed is not null)
            {
                LogEstimatedOutput(inputUsage, completed, jsonParseStatus, jsonParseDiagnostics);
            }
        }
    }

    protected virtual IReadOnlyList<string> PrepareCommand(IReadOnlyList<string> command) => command;

    private void LogEstimatedOutput(EstimatedAiUsageStats? inputUsage, CommandResult completed, string jsonParseStatus, string? jsonParseDiagnostics = null)
    {
        if (inputUsage is null) return;
        usageTracker?.RecordEstimatedOutput(
            inputUsage,
            completed.Stdout + "\n" + completed.Stderr,
            completed.ReturnCode,
            (long)Math.Ceiling(completed.DurationSeconds * 1000),
            jsonParseStatus,
            jsonParseDiagnostics);
    }

    private static string JsonParseDiagnostics(AiJsonParseException ex)
    {
        var parts = new List<string>
        {
            $"parseFailureReason={ex.FailureReason}",
            $"rawOutputPath={ex.RawOutputPath}",
            $"candidatesAttempted={ex.CandidatesAttempted}"
        };
        if (!string.IsNullOrWhiteSpace(ex.ParsedCandidatePath)) parts.Add($"parsedCandidatePath={ex.ParsedCandidatePath}");
        if (!string.IsNullOrWhiteSpace(ex.RejectedField)) parts.Add($"rejectedField={ex.RejectedField}");
        if (!string.IsNullOrWhiteSpace(ex.RejectedValue)) parts.Add($"rejectedValue={ex.RejectedValue}");
        if (!string.IsNullOrWhiteSpace(ex.AllowedValues)) parts.Add($"allowedValues={ex.AllowedValues}");
        return string.Join(", ", parts);
    }

    private static string InferCallName(string system)
    {
        var text = system.ToLowerInvariant();
        if (text.Contains("package version recommendation", StringComparison.Ordinal)) return "package-version-recommendation";
        if (text.Contains("critical dependency", StringComparison.Ordinal)) return "critical-dependency-alignment";
        if (text.Contains("package classification", StringComparison.Ordinal) || text.Contains("classify package", StringComparison.Ordinal)) return "package-classification";
        if (text.Contains("structural", StringComparison.Ordinal) && text.Contains("analysis", StringComparison.Ordinal)) return "structural-analysis";
        if (text.Contains("structural", StringComparison.Ordinal) && text.Contains("config", StringComparison.Ordinal)) return "structural-config";
        if (text.Contains("install strategy", StringComparison.Ordinal)) return "install-strategy";
        if (text.Contains("remediation", StringComparison.Ordinal)) return "validation-remediation";
        if (text.Contains("migration plan", StringComparison.Ordinal) || text.Contains("planning", StringComparison.Ordinal)) return "migration-planning";
        return "ai-request";
    }
}
