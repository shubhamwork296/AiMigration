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
    private static readonly HashSet<string> RemediationRisks = ["low", "medium", "high"];
    private static readonly HashSet<string> RemediationFailureCategories =
    [
        "script", "dependency", "type_declaration", "css_dependency_import", "dependency_asset_import_resolution",
        "material_sass_theming_api", "third_party_angular_incompatibility", "compiler", "config", "test", "unknown"
    ];
    private static readonly HashSet<string> RemediationChangeTypes =
    [
        "script_update", "package_update", "config_update", "type_shim", "source_update", "style_import_update",
        "test_config_update", "dependency", "package"
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

        var scan = ScanJsonObjects(source);
        foreach (var candidate in scan.Candidates)
        {
            if (IsInsideMarkdownFence(source, candidate.Start)) continue;
            JsonObject? parsed;
            try
            {
                parsed = JsonNode.Parse(candidate.Text) as JsonObject;
            }
            catch (JsonException)
            {
                continue;
            }

            scan.ParsedAny = true;
            if (parsed is not null && IsExpectedResponseSchema(parsed))
            {
                return parsed;
            }
        }

        WriteRawOutput(rawStdout ?? text, rawStderr ?? "");
        throw ParseFailure(provider, FailureKind(source, scan), scan.Candidates.Count > 0, scan.ParsedAny, scan.Truncated, rawStdout ?? text, rawStderr ?? "");
    }

    public static JsonObject ParseCodexResponse(string stdout, string stderr, IReadOnlyList<string> command, string provider)
    {
        var parseSource = UsesJsonLines(command)
            ? ExtractFinalJsonLineMessage(stdout) ?? ""
            : stdout;
        return ParseJsonObject(parseSource, provider, stdout, stderr);
    }

    private static JsonObject? ParseJsonLine(string line)
    {
        try
        {
            return JsonNode.Parse(line) as JsonObject;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static string? ExtractFinalJsonLineMessage(string stdout)
    {
        var messages = new List<string>();
        foreach (var line in stdout.Split(["\r\n", "\n"], StringSplitOptions.RemoveEmptyEntries))
        {
            var evt = ParseJsonLine(line.Trim());
            if (evt is null) continue;
            var type = evt.StringValue("type", evt.StringValue("event", evt.StringValue("msg_type")));
            if (!type.Contains("assistant", StringComparison.OrdinalIgnoreCase) &&
                !type.Contains("agent", StringComparison.OrdinalIgnoreCase) &&
                !type.Contains("turn", StringComparison.OrdinalIgnoreCase) &&
                !type.Contains("message", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var text = ExtractMessageText(evt);
            if (!string.IsNullOrWhiteSpace(text)) messages.Add(text);
        }
        return messages.LastOrDefault();
    }

    private static string? ExtractMessageText(JsonNode? node)
    {
        if (node is null) return null;
        if (node is JsonValue value)
        {
            return value.TryGetValue<string>(out var text) ? text : null;
        }
        if (node is JsonArray array)
        {
            var parts = array.Select(ExtractMessageText).Where(s => !string.IsNullOrWhiteSpace(s)).ToArray();
            return parts.Length == 0 ? null : string.Join("\n", parts);
        }
        if (node is not JsonObject obj) return null;

        foreach (var key in new[] { "message", "content", "text", "output", "response", "final_response" })
        {
            if (obj.TryGetPropertyValue(key, out var child))
            {
                var text = ExtractMessageText(child);
                if (!string.IsNullOrWhiteSpace(text)) return text;
            }
        }
        return null;
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

    private static bool IsExpectedResponseSchema(JsonObject obj) =>
        IsRemediationPlanSchema(obj) || IsRecommendationSchema(obj) || IsPackageClassificationSchema(obj) || IsThirdPartyPackageRemediationSchema(obj) || IsModernizationGenerationSchema(obj) || IsModernizationModulePlanSchema(obj);

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

    private static bool IsRecommendationSchema(JsonObject obj) =>
        obj["recommendations"] is JsonArray && (obj["warnings"] is null or JsonArray);

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

    private static bool IsModernizationGenerationSchema(JsonObject obj)
    {
        if (obj["summary"] is null || obj["files"] is not JsonArray files) return false;
        foreach (var file in files.OfType<JsonObject>())
        {
            if (string.IsNullOrWhiteSpace(file.StringValue("relativePath"))) return false;
            if (string.IsNullOrWhiteSpace(file.StringValue("kind"))) return false;
            if (string.IsNullOrWhiteSpace(file.StringValue("content"))) return false;
        }

        if (obj["warnings"] is not null and not JsonArray) return false;
        if (obj["manualReviewReasons"] is not null and not JsonArray) return false;
        return true;
    }

    private static bool IsModernizationModulePlanSchema(JsonObject obj)
    {
        if (obj["summary"] is null) return false;
        if (obj["suggestedOutputs"] is not null and not JsonArray) return false;
        if (obj["steps"] is not null and not JsonArray) return false;
        if (obj["sqlArtifacts"] is not null and not JsonArray) return false;
        if (obj["manualReviewReasons"] is not null and not JsonArray) return false;
        return obj["steps"] is JsonArray || obj["suggestedOutputs"] is JsonArray;
    }

    private static bool IsInsideMarkdownFence(string text, int index)
    {
        var before = text[..index];
        var fenceCount = Regex.Matches(before, "```").Count;
        return fenceCount % 2 == 1;
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

    private static InvalidOperationException ParseFailure(string provider, string kind, bool balancedFound, bool parsedAny, bool truncated, string stdout, string stderr)
    {
        var schemaDetails = kind == "schema-validation-failed" ? SchemaValidationDetails(stdout) : "";
        return new InvalidOperationException(
            $"{provider} JSON parse failed ({kind}). Balanced JSON object found: {balancedFound}. JSON parsed: {parsedAny}. Truncated JSON detected: {truncated}. " +
            schemaDetails +
            $"Raw stdout first 500 chars: {Preview(stdout)}. Raw stderr first 500 chars: {Preview(stderr)}. Raw output saved to {RawOutputPath}");
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
            var expected = new[] { "summary/confidence/risk/changes", "recommendations", "packages", "packageUpdates/manualReview" };
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

    private static string Preview(string value)
    {
        var normalized = value.Replace("\r", "\\r", StringComparison.Ordinal).Replace("\n", "\\n", StringComparison.Ordinal);
        return normalized[..Math.Min(normalized.Length, 500)];
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
        ? [path ?? name, "exec", "--skip-git-repo-check"]
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
}
