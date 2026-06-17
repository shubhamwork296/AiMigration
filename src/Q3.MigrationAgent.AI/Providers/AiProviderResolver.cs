using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Q3.MigrationAgent.AI.Abstractions;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Shared.Common;
using Q3.MigrationAgent.Shared.Config;

namespace Q3.MigrationAgent.AI.Providers;

public sealed class AiProviderResolver(ICommandRunner commandRunner, IEnumerable<IAiProvider> providers) : IAiCliResolver
{
    public static readonly HashSet<string> SupportedProviders = ["codex", "claude"];
    public static readonly HashSet<string> SupportedModes = ["auto", "cli"];
    public const string RawOutputPath = "codex_raw_output.txt";
    public const string ParsedCandidatePath = "codex_parsed_candidate.txt";
    private static readonly HashSet<string> RemediationRisks = ["low", "medium", "high"];
    private static readonly HashSet<string> RemediationFailureCategories =
    [
        "script", "dependency", "type_declaration", "css_dependency_import", "dependency_asset_import_resolution",
        "material_sass_theming_api", "third_party_angular_incompatibility", "compiler", "config", "test", "unknown"
    ];
    private static readonly HashSet<string> RemediationChangeTypes =
    [
        "script_update", "package_update", "config_update", "type_shim", "source_update", "style_import_update",
        "minimal_module_or_import_wiring", "test_config_update", "dependency", "package"
    ];
    private static readonly Dictionary<string, string> CliPackages = new(StringComparer.OrdinalIgnoreCase)
    {
        ["codex"] = "@openai/codex",
        ["claude"] = "@anthropic-ai/claude-code"
    };

    public async Task<AiConfig> ResolveAsync(AiConfig config, string? cwd, IProgressReporter? progress, string? logPath, CancellationToken cancellationToken = default)
    {
        var requested = (config.AiCli ?? "auto").ToLowerInvariant();
        if (requested == "none")
        {
            progress?.Stage("AI CLI", "AI CLI disabled by configuration.");
            return config with { UseAi = false, Provider = null, CliCommand = null, AiCli = "none" };
        }

        progress?.Stage("AI CLI", "Detecting AI CLI...");
        var (selected, detection) = await ResolveCliSelectionAsync(requested, cwd, progress, logPath, cancellationToken);
        if (selected is null)
        {
            progress?.Stage("AI CLI", requested is "codex" or "claude"
                ? $"Requested {DisplayName(requested)} CLI was not found. Continuing with deterministic fallback."
                : "No supported AI CLI found. Continuing with deterministic fallback.");
            return config with { UseAi = false, Provider = null, CliCommand = null };
        }

        var (latest, warnings) = await LatestCliVersionAsync(selected, cwd, logPath, cancellationToken);
        var installed = detection?.Version;
        if (latest is not null && installed is not null && SemverLessThan(installed, latest))
        {
            warnings.Add($"{DisplayName(selected)} CLI {installed} is older than latest {latest}. Suggested command: npm install -g {CliPackages[selected]}@{latest}");
        }
        foreach (var warning in warnings) progress?.Stage("AI CLI", warning);
        progress?.Stage("AI CLI", $"Selected AI CLI: {selected}");
        return config with
        {
            UseAi = true,
            Provider = selected,
            CliCommand = config.CliCommand ?? CliCommandFor(selected, detection?.Path),
            CliVersion = installed,
            LatestVersion = latest,
            CliWarnings = warnings
        };
    }

    public Task<JsonObject?> AskAsync(AiConfig config, string system, string user, CancellationToken cancellationToken = default)
    {
        if (!config.UseAi || string.IsNullOrWhiteSpace(config.Provider)) return Task.FromResult<JsonObject?>(null);
        var provider = providers.FirstOrDefault(p => string.Equals(p.Name, config.Provider, StringComparison.OrdinalIgnoreCase));
        if (provider is null) throw new InvalidOperationException($"Unsupported AI provider: {config.Provider}");
        return provider.AskAsync(config, system, user, cancellationToken);
    }

    public static JsonObject ParseJsonObject(string text, string provider, string? rawStdout = null, string? rawStderr = null)
    {
        var source = text.Trim();
        if (source.Length == 0)
        {
            WriteRawOutput(rawStdout ?? text, rawStderr ?? "");
            throw ParseFailure(provider, "empty-output", false, false, false, rawStdout ?? text, rawStderr ?? "");
        }

        var scan = ScanJsonObjects(StripMarkdownCodeFence(source));
        var parsedResponse = TryParseExpectedResponse(source, scan);
        if (parsedResponse is not null) return parsedResponse;

        WriteRawOutput(rawStdout ?? text, rawStderr ?? "");
        throw ParseFailure(provider, FailureKind(source, scan), scan.Candidates.Count > 0, scan.ParsedAny, scan.Truncated, rawStdout ?? text, rawStderr ?? "", scan);
    }

    public static JsonObject ParseCodexResponse(string stdout, string stderr, IReadOnlyList<string> command, string provider)
    {
        if (!UsesJsonLines(command)) return ParseJsonObject(stdout, provider, stdout, stderr);

        var eventResponse = ExtractJsonLineAgentMessage(stdout, out var diagnostics);
        if (eventResponse is not null) return eventResponse;

        if (LooksLikeCodexEventStream(stdout))
        {
            WriteRawOutput(stdout, stderr);
            var reason = diagnostics.AgentMessagesFound == 0 ? "no-agent-message-found" : diagnostics.FailureReason;
            throw new AiJsonParseException(
                $"{provider} JSON parse failed ({reason}). candidatesAttempted={diagnostics.CandidatesAttempted}. agentMessagesFound={diagnostics.AgentMessagesFound}. " +
                $"{diagnostics.Details} rawOutputPath={RawOutputPath}. parsedCandidatePath={diagnostics.CandidatePath ?? "not available"}. " +
                $"Raw stdout first 500 chars: {Preview(stdout)}. Raw stderr first 500 chars: {Preview(stderr)}.",
                reason,
                RawOutputPath,
                diagnostics.CandidatePath,
                diagnostics.CandidatesAttempted,
                diagnostics.RejectedField,
                diagnostics.RejectedValue,
                diagnostics.AllowedValues);
        }

        return ParseJsonObject(stdout, provider, stdout, stderr);
    }

    private static JsonObject? ParseJsonLine(string line)
    {
        try
        {
            var parsed = JsonNode.Parse(line) as JsonObject;
            return parsed is not null && IsJsonObjectUsable(parsed) ? parsed : null;
        }
        catch (Exception ex) when (ex is JsonException or ArgumentException)
        {
            return null;
        }
    }

    private static JsonObject? ExtractJsonLineAgentMessage(string stdout, out CodexJsonLineDiagnostics diagnostics)
    {
        diagnostics = new CodexJsonLineDiagnostics();
        foreach (var line in stdout.Split(["\r\n", "\n"], StringSplitOptions.RemoveEmptyEntries))
        {
            var evt = ParseJsonLine(line.Trim());
            if (evt is null) continue;

            if (!string.Equals(evt.StringValue("type"), "item.completed", StringComparison.OrdinalIgnoreCase)) continue;
            if (evt["item"] is not JsonObject item) continue;
            if (!string.Equals(item.StringValue("type"), "agent_message", StringComparison.OrdinalIgnoreCase)) continue;
            if (item["text"] is not JsonValue textValue || !textValue.TryGetValue<string>(out var text) || string.IsNullOrWhiteSpace(text)) continue;
            diagnostics.AgentMessagesFound++;

            var candidateSource = StripMarkdownCodeFence(text);
            var scan = ScanJsonObjects(candidateSource);
            diagnostics.CandidatesAttempted += Math.Max(scan.Candidates.Count, 1);
            diagnostics.Truncated |= scan.Truncated;
            var parsed = TryParseExpectedResponse(candidateSource, scan);
            if (parsed is not null) return parsed;

            diagnostics.LastCandidate = scan.Candidates.OrderByDescending(c => c.Text.Length).FirstOrDefault()?.Text ?? Preview(candidateSource, 1000);
            diagnostics.ParsedAny |= scan.ParsedAny;
            diagnostics.BalancedFound |= scan.Candidates.Count > 0;
        }

        if (diagnostics.AgentMessagesFound == 0) diagnostics.FailureReason = "no-agent-message-found";
        else if (diagnostics.Truncated || !diagnostics.BalancedFound) diagnostics.FailureReason = "balanced-json-not-found";
        else if (!diagnostics.ParsedAny) diagnostics.FailureReason = "malformed-json";
        else diagnostics.FailureReason = "schema-validation-failed";

        if (!string.IsNullOrWhiteSpace(diagnostics.LastCandidate))
        {
            File.WriteAllText(ParsedCandidatePath, diagnostics.LastCandidate);
            diagnostics.CandidatePath = ParsedCandidatePath;
            var detail = SchemaValidationDetails(diagnostics.LastCandidate);
            diagnostics.Details = detail;
            var field = Regex.Match(detail, @"rejectedField=([^,\s]+), rejectedValue=([^,\s]+)(?:, allowedValues=([^\.]+))?");
            if (field.Success)
            {
                diagnostics.RejectedField = field.Groups[1].Value;
                diagnostics.RejectedValue = field.Groups[2].Value;
                diagnostics.AllowedValues = field.Groups[3].Value;
            }
        }

        return null;
    }

    private static bool LooksLikeCodexEventStream(string stdout)
    {
        foreach (var line in stdout.Split(["\r\n", "\n"], StringSplitOptions.RemoveEmptyEntries))
        {
            var evt = ParseJsonLine(line.Trim());
            var type = evt?.StringValue("type");
            if (type is "thread.started" or "turn.started" or "turn.completed" or "item.completed") return true;
        }
        return false;
    }

    private static bool UsesJsonLines(IReadOnlyList<string> command) =>
        command.Any(arg => string.Equals(arg, "--json", StringComparison.OrdinalIgnoreCase));

    private static JsonObjectScan ScanJsonObjects(string text)
    {
        var scan = new JsonObjectScan();
        for (var start = 0; start < text.Length; start++)
        {
            if (text[start] != '{') continue;
            var depth = 0;
            var inString = false;
            var escaping = false;
            for (var i = start; i < text.Length; i++)
            {
                var ch = text[i];
                if (inString)
                {
                    if (escaping)
                    {
                        escaping = false;
                    }
                    else if (ch == '\\')
                    {
                        escaping = true;
                    }
                    else if (ch == '"')
                    {
                        inString = false;
                    }
                    continue;
                }

                if (ch == '"')
                {
                    inString = true;
                }
                else if (ch == '{')
                {
                    depth++;
                }
                else if (ch == '}')
                {
                    depth--;
                    if (depth == 0)
                    {
                        scan.Candidates.Add(new JsonCandidate(start, text[start..(i + 1)]));
                        break;
                    }
                }
            }

            if (depth > 0) scan.Truncated = true;
        }
        return scan;
    }

    private static JsonObject? TryParseExpectedResponse(string source, JsonObjectScan scan)
    {
        foreach (var candidate in scan.Candidates.OrderByDescending(c => c.Text.Length))
        {
            JsonObject? parsed;
            try
            {
                parsed = JsonNode.Parse(candidate.Text) as JsonObject;
            }
            catch (Exception ex) when (ex is JsonException or ArgumentException)
            {
                continue;
            }

            if (parsed is null || !IsJsonObjectUsable(parsed)) continue;

            scan.ParsedAny = true;
            if (IsExpectedResponseSchema(parsed))
            {
                return parsed;
            }
        }

        return null;
    }

    private static bool IsJsonObjectUsable(JsonObject obj)
    {
        try
        {
            foreach (var property in obj)
            {
                _ = obj.ContainsKey(property.Key);
                if (!IsJsonNodeUsable(property.Value)) return false;
            }
            return true;
        }
        catch (ArgumentException)
        {
            return false;
        }
    }

    private static bool IsJsonNodeUsable(JsonNode? node) =>
        node switch
        {
            null => true,
            JsonObject obj => IsJsonObjectUsable(obj),
            JsonArray arr => arr.All(IsJsonNodeUsable),
            _ => true
        };

    private static bool IsExpectedResponseSchema(JsonObject obj) =>
        IsRemediationPlanSchema(obj) ||
        IsRecommendationSchema(obj) ||
        IsPackageClassificationSchema(obj) ||
        IsThirdPartyPackageRemediationSchema(obj) ||
        IsInstallStrategySchema(obj) ||
        IsStructuralConfigSchema(obj);

    private static bool IsRemediationPlanSchema(JsonObject obj)
    {
        if (obj["summary"] is null || obj["confidence"] is null || obj["risk"] is null || obj["changes"] is not JsonArray changes) return false;
        if (!RemediationRisks.Contains(obj.StringValue("risk"))) return false;
        var failureCategory = obj.StringValue("failureCategory", "unknown");
        if (!RemediationFailureCategories.Contains(failureCategory)) return false;
        if (obj["commandsToRunAfter"] is not null and not JsonArray) return false;
        foreach (var change in changes)
        {
            if (change is not JsonObject changeObj) return false;
            if (!RemediationChangeTypes.Contains(changeObj.StringValue("type"))) return false;
            if (string.IsNullOrWhiteSpace(changeObj.StringValue("file"))) return false;
            if (string.IsNullOrWhiteSpace(changeObj.StringValue("reason"))) return false;
        }
        return true;
    }

    private static bool IsRecommendationSchema(JsonObject obj)
    {
        if (obj["recommendations"] is not JsonArray recommendations) return false;
        if (obj["warnings"] is not null && obj["warnings"] is not JsonArray) return false;
        foreach (var item in recommendations.OfType<JsonObject>())
        {
            if (string.IsNullOrWhiteSpace(item.StringValue("packageName", item.StringValue("package")))) return false;
            var action = item.StringValue("action");
            if (!string.IsNullOrWhiteSpace(action) && action is not ("align" or "preserve" or "add" or "remove" or "manualReview" or "update" or "upgrade" or "bump" or "update_dependency" or "hold" or "manual_review")) return false;
        }

        return true;
    }

    private static bool IsPackageClassificationSchema(JsonObject obj)
    {
        if (obj["packages"] is not JsonArray packages) return false;
        foreach (var package in packages.OfType<JsonObject>())
        {
            if (string.IsNullOrWhiteSpace(package.StringValue("name", package.StringValue("package")))) return false;
            if (string.IsNullOrWhiteSpace(package.StringValue("role", package.StringValue("classification")))) return false;
            if (string.IsNullOrWhiteSpace(package.StringValue("recommendedAction", package.StringValue("action")))) return false;
        }
        return true;
    }

    private static bool IsThirdPartyPackageRemediationSchema(JsonObject obj)
    {
        if (obj["packageUpdates"] is JsonArray updates && obj["manualReview"] is JsonArray)
        {
            return updates.OfType<JsonObject>().All(update =>
                !string.IsNullOrWhiteSpace(update.StringValue("package")) &&
                !string.IsNullOrWhiteSpace(update.StringValue("version")) &&
                update.StringValue("errorCategory") == "third_party_angular_library_incompatibility" &&
                update.StringValue("expectedCodeImpact") == "none");
        }

        if (obj["remediations"] is JsonArray remediations)
        {
            return remediations.OfType<JsonObject>().All(update =>
                !string.IsNullOrWhiteSpace(update.StringValue("packageName", update.StringValue("targetPackageName"))) &&
                !string.IsNullOrWhiteSpace(update.StringValue("targetVersionRange")) &&
                update.StringValue("detectedErrorCategory", "third_party_angular_library_incompatibility") == "third_party_angular_library_incompatibility");
        }

        return false;
    }

    private static bool IsInstallStrategySchema(JsonObject obj)
    {
        if (obj["strategy"] is null || obj["command"] is null || obj["reason"] is null || obj["confidence"] is null || obj["risk"] is null) return false;
        if (obj["isRetry"] is null || obj["isFallback"] is null || obj["maxRetries"] is null || obj["failureClassification"] is null) return false;

        var strategy = obj.StringValue("strategy");
        if (strategy is not ("normalInstall" or "legacyPeerDepsInstall" or "retrySameCommand" or "manualReview")) return false;
        if (obj.StringValue("risk") is not ("low" or "medium" or "high")) return false;
        if (obj.StringValue("failureClassification") is not ("none" or "peerDependencyConflict" or "transientNetworkFailure" or "registryAuthFailure" or "packageVersionNotFound" or "unknownFailure")) return false;
        return obj["isRetry"] is JsonValue && obj["isFallback"] is JsonValue && obj["maxRetries"] is JsonValue;
    }

    private static bool IsStructuralConfigSchema(JsonObject obj)
    {
        if (obj["targetAngularHop"] is null || obj["changes"] is not JsonArray changes || obj["manualRecommendations"] is not JsonArray manualRecommendations || obj["safetyDecision"] is not JsonObject safetyDecision) return false;
        if (safetyDecision["canApplyAutomatically"] is null || safetyDecision["requiresManualReview"] is null || safetyDecision["reason"] is null) return false;

        foreach (var change in changes)
        {
            if (change is not JsonObject changeObj) return false;
            if (string.IsNullOrWhiteSpace(changeObj.StringValue("filePath"))) return false;
            if (changeObj.StringValue("changeType") is not ("update_builder" or "update_option" or "remove_deprecated_option" or "update_tsconfig" or "update_script" or "manual_review")) return false;
            if (changeObj["patch"] is not JsonObject patch || patch["before"] is null || patch["after"] is null) return false;
        }

        foreach (var item in manualRecommendations)
        {
            if (item is not JsonObject recommendation) return false;
            if (recommendation["reason"] is null) return false;
        }

        return true;
    }

    private static string StripMarkdownCodeFence(string text)
    {
        var trimmed = text.Trim();
        var match = Regex.Match(trimmed, @"^```(?:json)?\s*(?<body>[\s\S]*?)\s*```$", RegexOptions.IgnoreCase);
        return match.Success ? match.Groups["body"].Value.Trim() : text;
    }

    private static string FailureKind(string source, JsonObjectScan scan)
    {
        if (scan.Truncated) return "truncated-json";
        if (scan.Candidates.Count == 0) return LooksLikeCliOnly(source) ? "cli-session-text-only" : "no-balanced-json-object";
        return scan.ParsedAny ? "schema-validation-failed" : "no-parseable-json-object";
    }

    private static bool LooksLikeCliOnly(string text) =>
        text.Contains("OpenAI Codex", StringComparison.OrdinalIgnoreCase) ||
        text.Contains("workdir:", StringComparison.OrdinalIgnoreCase) ||
        text.Contains("model:", StringComparison.OrdinalIgnoreCase);

    private static AiJsonParseException ParseFailure(string provider, string kind, bool balancedFound, bool parsedAny, bool truncated, string stdout, string stderr, JsonObjectScan? scan = null)
    {
        var schemaDetails = kind == "schema-validation-failed" ? SchemaValidationDetails(stdout) : "";
        if (scan?.Candidates.Count > 0)
        {
            File.WriteAllText(ParsedCandidatePath, scan.Candidates.OrderByDescending(c => c.Text.Length).First().Text);
        }
        return new AiJsonParseException(
            $"{provider} JSON parse failed ({kind}). Balanced JSON object found: {balancedFound}. JSON parsed: {parsedAny}. Truncated JSON detected: {truncated}. " +
            schemaDetails +
            $"rawOutputPath={RawOutputPath}. parsedCandidatePath={(scan?.Candidates.Count > 0 ? ParsedCandidatePath : "not available")}. " +
            $"Raw stdout first 500 chars: {Preview(stdout)}. Raw stderr first 500 chars: {Preview(stderr)}.",
            kind,
            RawOutputPath,
            scan?.Candidates.Count > 0 ? ParsedCandidatePath : null,
            scan?.Candidates.Count ?? 0);
    }

    private static string SchemaValidationDetails(string stdout)
    {
        try
        {
            var first = ScanJsonObjects(stdout).Candidates
                .Select(c =>
                {
                    try { return JsonNode.Parse(c.Text) as JsonObject; }
                    catch (JsonException) { return null; }
                })
                .FirstOrDefault(o => o is not null);
            if (first is null) return "";
            if (first["recommendations"] is JsonArray recommendations)
            {
                if (recommendations.Count == 0) return "parseFailureReason=empty-recommendations. ";
                foreach (var item in recommendations.OfType<JsonObject>())
                {
                    var action = item.StringValue("action");
                    if (!string.IsNullOrWhiteSpace(action) && action is not ("align" or "preserve" or "add" or "remove" or "manualReview" or "update" or "upgrade" or "bump" or "update_dependency" or "hold" or "manual_review"))
                    {
                        return $"parseFailureReason=unsupported-enum-value, rejectedField=action, rejectedValue={action}, allowedValues=align|preserve|add|remove|manualReview. ";
                    }
                    if (string.IsNullOrWhiteSpace(item.StringValue("packageName", item.StringValue("package"))))
                    {
                        return "parseFailureReason=missing-required-property, rejectedField=packageName. ";
                    }
                }
            }

            var expected = new[] { "summary/confidence/risk/changes", "recommendations", "packages", "packageUpdates/manualReview", "strategy/command", "targetAngularHop/changes/manualRecommendations/safetyDecision" };
            var actual = first.Select(kvp => kvp.Key).ToArray();
            var missing = new[] { "packageUpdates", "manualReview" }.Where(f => !first.ContainsKey(f)).ToArray();
            var unexpected = actual.Where(f => !new[] { "packageUpdates", "manualReview" }.Contains(f)).ToArray();
            var failedPath = missing.Length > 0 ? "$." + missing[0] : "$";
            return $"Expected top-level fields: {string.Join(" or ", expected)}. Actual top-level fields: {string.Join(", ", actual)}. Missing fields: {string.Join(", ", missing)}. Unexpected fields: {string.Join(", ", unexpected)}. Failed field path: {failedPath}. ";
        }
        catch
        {
            return "";
        }
    }

    private static string Preview(string value, int max = 500)
    {
        var normalized = value.Replace("\r", "\\r", StringComparison.Ordinal).Replace("\n", "\\n", StringComparison.Ordinal);
        return normalized[..Math.Min(normalized.Length, max)];
    }

    private static void WriteRawOutput(string stdout, string stderr)
    {
        File.WriteAllText(RawOutputPath, $"--- stdout ---{Environment.NewLine}{stdout}{Environment.NewLine}--- stderr ---{Environment.NewLine}{stderr}");
    }

    private async Task<(string? Selected, CliDetection? Detection)> ResolveCliSelectionAsync(
        string requested,
        string? cwd,
        IProgressReporter? progress,
        string? logPath,
        CancellationToken cancellationToken)
    {
        if (requested is "codex" or "claude")
        {
            var detection = await DetectCliAsync(requested, cwd, logPath, cancellationToken);
            if (!detection.Available) return (null, detection);
            progress?.Stage("AI CLI", $"Found {DisplayName(requested)} CLI: {detection.Version ?? "unknown"}");
            return (requested, detection);
        }

        if (requested == "auto")
        {
            var codex = await DetectCliAsync("codex", cwd, logPath, cancellationToken);
            if (codex.Available)
            {
                progress?.Stage("AI CLI", $"Found Codex CLI: {codex.Version ?? "unknown"}");
                return ("codex", codex);
            }

            var claude = await DetectCliAsync("claude", cwd, logPath, cancellationToken);
            if (claude.Available)
            {
                progress?.Stage("AI CLI", $"Found Claude CLI: {claude.Version ?? "unknown"}");
                return ("claude", claude);
            }
        }

        return (null, null);
    }

    private async Task<CliDetection> DetectCliAsync(string name, string? cwd, string? logPath, CancellationToken cancellationToken)
    {
        var locator = OperatingSystem.IsWindows() ? "where" : "which";
        var located = await commandRunner.RunAsync([locator, name], cwd, timeoutSeconds: 30, logPath: logPath, cancellationToken: cancellationToken);
        if (located.ReturnCode != 0) return new CliDetection(false, null, null);

        var path = FirstOutputLine(located);
        var version = await commandRunner.RunAsync([path ?? name, "--version"], cwd, timeoutSeconds: 30, logPath: logPath, cancellationToken: cancellationToken);
        return new CliDetection(
            true,
            path,
            ParseCliVersion(version.Stdout + "\n" + version.Stderr));
    }

    private async Task<(string? Latest, List<string> Warnings)> LatestCliVersionAsync(string name, string? cwd, string? logPath, CancellationToken cancellationToken)
    {
        var result = await commandRunner.RunAsync(["npm", "view", CliPackages[name], "version", "--json"], cwd, timeoutSeconds: 8, idleTimeoutSeconds: 5, logPath: logPath, cancellationToken: cancellationToken);
        if (result.ReturnCode != 0) return (null, [$"Latest {DisplayName(name)} CLI version lookup failed. Continuing with installed CLI."]);
        try
        {
            var parsed = JsonNode.Parse(result.Stdout);
            var version = ParseCliVersion(parsed?.ToString() ?? "");
            return version is null ? (null, [$"Latest {DisplayName(name)} CLI version could not be parsed. Continuing with installed CLI."]) : (version, []);
        }
        catch (JsonException)
        {
            return (null, [$"Latest {DisplayName(name)} CLI version could not be parsed. Continuing with installed CLI."]);
        }
    }

    private static IReadOnlyList<string> CliCommandFor(string name, string? path) => name == "codex"
        ? [path ?? name, "exec", "--json", "--skip-git-repo-check"]
        : [path ?? name, "-p"];

    private static string? FirstOutputLine(dynamic result)
    {
        var lines = ((string)result.Stdout + "\n" + (string)result.Stderr)
            .Split('\n')
            .Select(line => line.Trim())
            .Where(line => line.Length > 0)
            .ToArray();
        if (OperatingSystem.IsWindows())
        {
            var cmd = lines.FirstOrDefault(line => line.EndsWith(".cmd", StringComparison.OrdinalIgnoreCase));
            if (cmd is not null) return cmd;
        }
        return lines.FirstOrDefault();
    }

    private static string? ParseCliVersion(string text) => Regex.Match(text, @"(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)") is { Success: true } m ? m.Groups[1].Value : null;

    private static bool SemverLessThan(string left, string right)
    {
        static int[] Parts(string value) => ParseCliVersion(value)?.Split('.', '-', '+').Take(3).Select(int.Parse).ToArray() ?? [0, 0, 0];
        var l = Parts(left);
        var r = Parts(right);
        return l[0] != r[0] ? l[0] < r[0] : l[1] != r[1] ? l[1] < r[1] : l[2] < r[2];
    }

    private static string DisplayName(string name) => name.Equals("codex", StringComparison.OrdinalIgnoreCase) ? "Codex" : "Claude";

    private sealed record CliDetection(bool Available, string? Path, string? Version);
    private sealed record JsonCandidate(int Start, string Text);
    private sealed class JsonObjectScan
    {
        public List<JsonCandidate> Candidates { get; } = [];
        public bool ParsedAny { get; set; }
        public bool Truncated { get; set; }
    }

    private sealed class CodexJsonLineDiagnostics
    {
        public int AgentMessagesFound { get; set; }
        public int CandidatesAttempted { get; set; }
        public bool BalancedFound { get; set; }
        public bool ParsedAny { get; set; }
        public bool Truncated { get; set; }
        public string FailureReason { get; set; } = "schema-validation-failed";
        public string? LastCandidate { get; set; }
        public string? CandidatePath { get; set; }
        public string Details { get; set; } = "";
        public string? RejectedField { get; set; }
        public string? RejectedValue { get; set; }
        public string? AllowedValues { get; set; }
    }
}

public sealed class AiJsonParseException : InvalidOperationException
{
    public AiJsonParseException(string message, string failureReason, string rawOutputPath, string? parsedCandidatePath, int candidatesAttempted, string? rejectedField = null, string? rejectedValue = null, string? allowedValues = null)
        : base(message)
    {
        FailureReason = failureReason;
        RawOutputPath = rawOutputPath;
        ParsedCandidatePath = parsedCandidatePath;
        CandidatesAttempted = candidatesAttempted;
        RejectedField = rejectedField;
        RejectedValue = rejectedValue;
        AllowedValues = allowedValues;
    }

    public string FailureReason { get; }
    public string RawOutputPath { get; }
    public string? ParsedCandidatePath { get; }
    public int CandidatesAttempted { get; }
    public string? RejectedField { get; }
    public string? RejectedValue { get; }
    public string? AllowedValues { get; }
}
