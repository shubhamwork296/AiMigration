using System.Text.Json.Nodes;
using Q3.MigrationAgent.Business.Abstractions;
using Q3.MigrationAgent.Shared.Common;
using Q3.MigrationAgent.Shared.Config;

namespace Q3.MigrationAgent.Business.Services;

public sealed class ConfigLoader : IConfigLoader
{
    private static readonly HashSet<string> SupportedProviders = ["codex", "claude"];
    private static readonly HashSet<string> SupportedModes = ["auto", "cli"];

    public async Task<MigrationConfig> LoadAsync(string configPath, string? verbosityOverride = null, CancellationToken cancellationToken = default)
    {
        var fullPath = Path.GetFullPath(configPath);
        if (!File.Exists(fullPath)) throw new FileNotFoundException($"Config file not found: {fullPath}", fullPath);
        var raw = JsonNode.Parse(await File.ReadAllTextAsync(fullPath, cancellationToken))?.AsObject()
            ?? throw new InvalidOperationException("Config must be a JSON object.");
        var config = ParseConfig(raw, Path.GetDirectoryName(fullPath)!, verbosityOverride);
        ValidateConfig(config);
        return config;
    }

    private static MigrationConfig ParseConfig(JsonObject raw, string baseDir, string? verbosityOverride)
    {
        return new MigrationConfig
        {
            ProjectPath = ResolvePath(raw.StringValue("projectPath"), baseDir),
            From = ParseRuntimeSpec(raw, "from"),
            To = ParseToSpec(raw),
            OutputPath = ResolvePath(raw.StringValue("outputPath", "./output"), baseDir),
            DryRun = raw.BoolValue("dryRun"),
            AutoApprove = raw.BoolValue("autoApprove"),
            MaxRetries = raw.IntValue("maxRetries", 1),
            Ai = ParseAiConfig(raw),
            OptionalMigrations = raw.BoolValue("optionalMigrations"),
            Verbosity = verbosityOverride ?? ParseVerbosity(raw),
            AutoRemediateDependencies = raw.BoolValue("autoRemediateDependencies"),
            OnDependencyCompatibilityIssue = raw.StringValue("onDependencyCompatibilityIssue", "auto-remediate-and-continue"),
            AllowAngularForceUpdate = raw.BoolValue("allowAngularForceUpdate"),
            AllowPrereleaseDependencyVersions = raw.BoolValue("allowPrereleaseDependencyVersions"),
            MaxDependencyRemediationRetriesPerHop = raw.IntValue("maxDependencyRemediationRetriesPerHop", 1),
            ContinueAfterSuccessfulRemediation = raw.BoolValue("continueAfterSuccessfulRemediation", true),
            DependencyCheckTimeoutSeconds = raw.IntValue("dependencyCheckTimeoutSeconds", 300),
            SkipPreflightDependencyCompatibility = raw.BoolValue("skipPreflightDependencyCompatibility"),
            PreflightRemediationMode = raw.StringValue("preflightRemediationMode", "suggest"),
            AllowLegacyPeerDepsFallback = raw.BoolValue("allowLegacyPeerDepsFallback", true),
            CommandTimeoutSeconds = raw.IntValue("commandTimeoutSeconds", 600),
            CommandIdleTimeoutSeconds = raw.IntValue("commandIdleTimeoutSeconds"),
            ShowTimingSummary = raw.BoolValue("showTimingSummary", true),
            MaxAiRemediationRetries = raw.IntValue("maxAiRemediationRetries", 3),
            RollbackMode = raw.StringValue("rollbackMode", "manual"),
            AllowBusinessLogicChanges = raw.BoolValue("allowBusinessLogicChanges"),
            PreferNgUpdate = raw.BoolValue("preferNgUpdate", true),
            AvoidFullVersionScans = raw.BoolValue("avoidFullVersionScans", true),
            DirectDependenciesOnlyPreflight = raw.BoolValue("directDependenciesOnlyPreflight", true)
        };
    }

    private static RuntimeSpec ParseRuntimeSpec(JsonObject raw, string key)
    {
        if (raw[key] is JsonObject obj) return new RuntimeSpec(obj.StringValue("runtime"), obj.StringValue("version"));
        if (key == "from") return new RuntimeSpec(raw.StringValue("runtime", "angular"), raw.StringValue("currentVersion"));
        throw new KeyNotFoundException(key);
    }

    private static RuntimeSpec ParseToSpec(JsonObject raw)
    {
        if (raw["to"] is JsonObject obj) return new RuntimeSpec(obj.StringValue("runtime"), obj.StringValue("version"));
        if (raw["targetVersion"] is not null)
        {
            var fromRuntime = raw["from"] is JsonObject from ? from.StringValue("runtime") : "";
            return new RuntimeSpec(raw.StringValue("runtime", string.IsNullOrEmpty(fromRuntime) ? "angular" : fromRuntime), raw.StringValue("targetVersion"));
        }
        throw new KeyNotFoundException("to");
    }

    private static AiConfig ParseAiConfig(JsonObject raw)
    {
        var aiSection = raw["ai"] as JsonObject ?? new JsonObject();
        var aiCli = raw.StringValue("aiCli", aiSection.StringValue("aiCli", "auto")).ToLowerInvariant();
        var useAi = raw["useAi"] is not null ? raw.BoolValue("useAi") : aiSection.BoolValue("useAi", aiCli != "none");
        var provider = raw.StringValue("aiProvider", aiSection.StringValue("provider"));
        var mode = raw.StringValue("aiMode", aiSection.StringValue("mode", "cli")).ToLowerInvariant();
        IReadOnlyList<string>? command = null;
        var commandNode = raw["aiCliCommand"] ?? aiSection["cliCommand"];
        if (commandNode is JsonArray array) command = array.Select(x => x?.ToString() ?? "").Where(s => s.Length > 0).ToArray();
        else if (commandNode is not null) command = commandNode.ToString().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        return new AiConfig { UseAi = useAi, Provider = string.IsNullOrWhiteSpace(provider) ? null : provider.ToLowerInvariant(), Mode = mode, CliCommand = command, AiCli = aiCli };
    }

    private static string ParseVerbosity(JsonObject raw)
    {
        if (raw.BoolValue("verbose")) return "verbose";
        if (raw.BoolValue("quiet")) return "quiet";
        var value = raw.StringValue("verbosity", "default").ToLowerInvariant();
        return value is "default" or "verbose" or "quiet" ? value : throw new InvalidOperationException("verbosity must be one of: default, verbose, quiet.");
    }

    private static string ResolvePath(string value, string baseDir) => Path.IsPathRooted(value) ? Path.GetFullPath(value) : Path.GetFullPath(Path.Combine(baseDir, value));

    private static void ValidateConfig(MigrationConfig config)
    {
        if (!Directory.Exists(config.ProjectPath)) throw new DirectoryNotFoundException($"Project path does not exist: {config.ProjectPath}");
        if (Path.GetFullPath(config.ProjectPath).TrimEnd('\\', '/') == Path.GetFullPath(config.OutputPath).TrimEnd('\\', '/')) throw new InvalidOperationException("outputPath must be different from projectPath.");
        if (!string.Equals(config.From.Runtime, config.To.Runtime, StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("Cross-runtime migrations are not supported by this starter.");
        if (config.MaxRetries < 0) throw new InvalidOperationException("maxRetries must be zero or greater.");
        if (config.OnDependencyCompatibilityIssue is not ("auto-remediate-and-continue" or "stop-hop")) throw new InvalidOperationException("onDependencyCompatibilityIssue must be one of: auto-remediate-and-continue, stop-hop.");
        if (config.MaxDependencyRemediationRetriesPerHop < 0) throw new InvalidOperationException("maxDependencyRemediationRetriesPerHop must be zero or greater.");
        if (config.DependencyCheckTimeoutSeconds < 0) throw new InvalidOperationException("dependencyCheckTimeoutSeconds must be zero or greater.");
        if (config.CommandTimeoutSeconds < 0) throw new InvalidOperationException("commandTimeoutSeconds must be zero or greater.");
        if (config.CommandIdleTimeoutSeconds < 0) throw new InvalidOperationException("commandIdleTimeoutSeconds must be zero or greater.");
        if (config.PreflightRemediationMode is not ("off" or "suggest" or "apply")) throw new InvalidOperationException("preflightRemediationMode must be one of: off, suggest, apply.");
        if (config.MaxAiRemediationRetries < 0) throw new InvalidOperationException("maxAiRemediationRetries must be zero or greater.");
        if (config.RollbackMode is not ("manual" or "auto")) throw new InvalidOperationException("rollbackMode must be one of: manual, auto.");
        if (config.Ai.AiCli is not ("auto" or "codex" or "claude" or "none")) throw new InvalidOperationException("aiCli must be one of: auto, codex, claude, none.");
        if (config.Ai.UseAi)
        {
            if (config.Ai.Provider is not null && !SupportedProviders.Contains(config.Ai.Provider)) throw new InvalidOperationException($"aiProvider must be one of: {string.Join(", ", SupportedProviders.Order())}.");
            if (!SupportedModes.Contains(config.Ai.Mode)) throw new InvalidOperationException($"aiMode must be one of: {string.Join(", ", SupportedModes.Order())}.");
        }
    }
}
