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

    public JsonObject LoadConfig()
    {
        lock (_gate)
        {
            if (!File.Exists(_rootProvider.ConfigPath))
            {
                return new JsonObject();
            }

            var json = File.ReadAllText(_rootProvider.ConfigPath);
            if (string.IsNullOrWhiteSpace(json))
            {
                return new JsonObject();
            }

            return JsonNode.Parse(json) as JsonObject ?? new JsonObject();
        }
    }

    public MigrationConfigDefaults GetDefaults()
    {
        var config = LoadConfig();
        return new MigrationConfigDefaults(
            GetString(config, "projectPath"),
            GetString(config, "outputPath"),
            GetString(config, "from", "runtime") ?? GetString(config, "runtime"),
            GetString(config, "to", "runtime") ?? GetString(config, "runtime"),
            GetString(config, "from", "version") ?? GetString(config, "currentVersion"),
            GetString(config, "to", "version") ?? GetString(config, "targetVersion"));
    }

    public JsonObject BuildEffectiveConfig(MigrationStartRequest request)
    {
        var config = LoadConfig();

        SetIfProvided(config, "projectPath", request.SourcePath);
        SetIfProvided(config, "outputPath", request.OutputPath);
        SetNestedIfProvided(config, "from", "runtime", NormalizeTechnology(request.CurrentTechnology));
        SetNestedIfProvided(config, "to", "runtime", NormalizeTechnology(request.TargetTechnology));
        SetNestedIfProvided(config, "from", "version", request.CurrentVersion);
        SetNestedIfProvided(config, "to", "version", request.TargetVersion);

        UpdateLegacyIfPresent(config, "runtime", NormalizeTechnology(request.CurrentTechnology));
        UpdateLegacyIfPresent(config, "currentVersion", request.CurrentVersion);
        UpdateLegacyIfPresent(config, "targetVersion", request.TargetVersion);

        return config;
    }

    public void SaveConfig(JsonObject config)
    {
        lock (_gate)
        {
            var json = config.ToJsonString(WriteOptions);
            File.WriteAllText(_rootProvider.ConfigPath, json);
        }
    }

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
            _ => value.Trim()
        };
    }

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
