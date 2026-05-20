using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Q3.MigrationAgent.AI.Abstractions;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Shared.Config;

namespace Q3.MigrationAgent.AI.Providers;

public sealed class AiProviderResolver(ICommandRunner commandRunner, IEnumerable<IAiProvider> providers) : IAiCliResolver
{
    public static readonly HashSet<string> SupportedProviders = ["codex", "claude"];
    public static readonly HashSet<string> SupportedModes = ["auto", "cli"];
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

    public static JsonObject ParseJsonObject(string text, string provider)
    {
        var stripped = text.Trim();
        if (stripped.Length == 0) throw new InvalidOperationException($"{provider} returned empty output");
        if (stripped.StartsWith("```", StringComparison.Ordinal))
        {
            stripped = stripped.Trim('`').Trim();
            if (stripped.StartsWith("json", StringComparison.OrdinalIgnoreCase)) stripped = stripped[4..].Trim();
        }

        for (var i = 0; i < stripped.Length; i++)
        {
            if (stripped[i] is not ('{' or '[')) continue;
            try
            {
                var node = JsonNode.Parse(stripped[i..]);
                if (node is JsonObject obj) return obj;
                if (node is JsonArray arr) return new JsonObject { ["items"] = arr };
            }
            catch (JsonException) { }
        }
        File.WriteAllText("codex_raw_output.txt", text);
        throw new InvalidOperationException($"{provider} did not return a valid JSON object. Raw output saved to codex_raw_output.txt");
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
}
