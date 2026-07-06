using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;
using Q3.MigrationAgent.Web.Models;

namespace Q3.MigrationAgent.Web.Services;

public sealed class MigrationConfigService
{
    private static readonly JsonSerializerOptions WriteOptions = new()
    {
        WriteIndented = true
    };

    private readonly RepositoryRootProvider _rootProvider;
    private readonly object _gate = new();

    public MigrationConfigService(RepositoryRootProvider rootProvider)
    {
        _rootProvider = rootProvider;
    }

    public JsonObject LoadConfig(string? migrationMode = null)
    {
        lock (_gate)
        {
            var configPath = ConfigPathFor(migrationMode);
            if (!File.Exists(configPath))
            {
                return new JsonObject();
            }

            var json = File.ReadAllText(configPath);
            if (string.IsNullOrWhiteSpace(json))
            {
                return new JsonObject();
            }

            return JsonNode.Parse(json) as JsonObject ?? new JsonObject();
        }
    }

    public MigrationConfigDefaults GetDefaults()
    {
        var mode = File.Exists(_rootProvider.LegacyConfigPath) ? "legacy" : "standard";
        var config = LoadConfig(mode);
        if (mode == "standard" && LooksLikeLegacyConfig(config))
        {
            mode = "legacy";
        }

        return new MigrationConfigDefaults(
            mode,
            GetString(config, "projectPath"),
            GetString(config, "outputPath"),
            GetString(config, "targetArchitecturePath"),
            GetString(config, "migrationContextPath"),
            GetString(config, "from", "runtime") ?? GetString(config, "runtime"),
            GetString(config, "to", "runtime") ?? GetString(config, "runtime"),
            GetString(config, "from", "version") ?? GetString(config, "currentVersion"),
            GetString(config, "to", "version") ?? GetString(config, "targetVersion"));
    }

    public JsonObject BuildEffectiveConfig(MigrationStartRequest request)
    {
        var config = LoadConfig(request.MigrationMode);

        SetIfProvided(config, "projectPath", request.SourcePath);
        SetIfProvided(config, "outputPath", request.OutputPath);
        SetIfProvided(config, "targetArchitecturePath", request.TargetArchitecturePath);
        SetIfProvided(config, "migrationContextPath", request.MigrationContextPath);
        SetNestedIfProvided(config, "from", "runtime", NormalizeTechnology(request.CurrentTechnology));
        SetNestedIfProvided(config, "to", "runtime", NormalizeTechnology(request.TargetTechnology));
        SetNestedIfProvided(config, "from", "version", request.CurrentVersion);
        SetNestedIfProvided(config, "to", "version", request.TargetVersion);

        if (IsLegacyMode(request.MigrationMode))
        {
            SetIfMissing(config, "dryRun", false);
            SetIfMissing(config, "useAi", true);
            SetIfMissing(config, "aiCli", "codex");
            SetIfMissing(config, "aiCliCommand", new JsonArray("codex", "exec", "--skip-git-repo-check"));
            SetIfMissing(config, "aiTimeoutSeconds", 600);
            SetIfMissing(config, "commandTimeoutSeconds", 600);
        }

        UpdateLegacyIfPresent(config, "runtime", NormalizeTechnology(request.CurrentTechnology));
        UpdateLegacyIfPresent(config, "currentVersion", request.CurrentVersion);
        UpdateLegacyIfPresent(config, "targetVersion", request.TargetVersion);

        return config;
    }

    public void SaveConfig(JsonObject config, string? migrationMode = null)
    {
        lock (_gate)
        {
            var json = config.ToJsonString(WriteOptions);
            File.WriteAllText(ConfigPathFor(migrationMode), json);
        }
    }

    private string ConfigPathFor(string? migrationMode) =>
        IsLegacyMode(migrationMode) ? _rootProvider.LegacyConfigPath : _rootProvider.ConfigPath;

    private static string? GetString(JsonObject config, string propertyName)
    {
        return config.TryGetPropertyValue(propertyName, out var value) ? ReadScalar(value) : null;
    }

    private static string? GetString(JsonObject config, string objectName, string propertyName)
    {
        if (config.TryGetPropertyValue(objectName, out var node) && node is JsonObject child)
        {
            return GetString(child, propertyName);
        }

        return null;
    }

    private static void SetIfProvided(JsonObject config, string propertyName, string? value)
    {
        if (!string.IsNullOrWhiteSpace(value))
        {
            config[propertyName] = value.Trim();
        }
    }

    private static void SetIfMissing(JsonObject config, string propertyName, JsonNode value)
    {
        if (config[propertyName] is null)
        {
            config[propertyName] = value;
        }
    }

    private static void SetNestedIfProvided(JsonObject config, string objectName, string propertyName, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return;
        }

        if (config[objectName] is not JsonObject child)
        {
            child = new JsonObject();
            config[objectName] = child;
        }

        child[propertyName] = value.Trim();
    }

    private static void UpdateLegacyIfPresent(JsonObject config, string propertyName, string? value)
    {
        if (!string.IsNullOrWhiteSpace(value) && config.ContainsKey(propertyName))
        {
            config[propertyName] = value.Trim();
        }
    }

    private static string? NormalizeTechnology(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim().ToLowerInvariant() switch
        {
            "angular" => "angular",
            "dotnet" => "dotnet",
            ".net" => "dotnet",
            "legacy webforms" => "legacy-webforms",
            "legacy-webforms" => "legacy-webforms",
            "webforms" => "legacy-webforms",
            "blazor ssr" => "blazor-ssr",
            "blazor-ssr" => "blazor-ssr",
            _ => value.Trim()
        };
    }

    private static bool IsLegacyMode(string? migrationMode) =>
        string.Equals(migrationMode?.Trim(), "legacy", StringComparison.OrdinalIgnoreCase);

    private static bool LooksLikeLegacyConfig(JsonObject config) =>
        string.Equals(GetString(config, "from", "runtime"), "legacy-webforms", StringComparison.OrdinalIgnoreCase) ||
        !string.IsNullOrWhiteSpace(GetString(config, "targetArchitecturePath")) ||
        !string.IsNullOrWhiteSpace(GetString(config, "migrationContextPath"));

    private static string? ReadScalar(JsonNode? value)
    {
        if (value is null)
        {
            return null;
        }

        if (value is JsonValue jsonValue)
        {
            if (jsonValue.TryGetValue<string>(out var stringValue))
            {
                return stringValue;
            }

            if (jsonValue.TryGetValue<int>(out var intValue))
            {
                return intValue.ToString(CultureInfo.InvariantCulture);
            }

            if (jsonValue.TryGetValue<long>(out var longValue))
            {
                return longValue.ToString(CultureInfo.InvariantCulture);
            }

            if (jsonValue.TryGetValue<double>(out var doubleValue))
            {
                return doubleValue.ToString(CultureInfo.InvariantCulture);
            }

            if (jsonValue.TryGetValue<bool>(out var boolValue))
            {
                return boolValue.ToString(CultureInfo.InvariantCulture);
            }
        }

        return value.ToJsonString();
    }
}
