using System.Text.Json.Nodes;

namespace Q3.LegacyMigration.Config;

public sealed class LegacyMigrationConfigLoader
{
    public async Task<LegacyMigrationConfig> LoadAsync(string configPath, CancellationToken cancellationToken = default)
    {
        var fullPath = Path.GetFullPath(configPath);
        if (!File.Exists(fullPath)) throw new FileNotFoundException($"Config file not found: {fullPath}", fullPath);

        var raw = JsonNode.Parse(await File.ReadAllTextAsync(fullPath, cancellationToken))?.AsObject()
            ?? throw new InvalidOperationException("Config must be a JSON object.");
        var baseDir = Path.GetDirectoryName(fullPath)!;
        var config = new LegacyMigrationConfig
        {
            ProjectPath = ResolvePath(Value(raw, "projectPath"), baseDir),
            From = Runtime(raw, "from"),
            To = Runtime(raw, "to"),
            OutputPath = ResolvePath(Value(raw, "outputPath", "./legacy-output"), baseDir),
            TargetArchitecturePath = ResolvePath(Value(raw, "targetArchitecturePath"), baseDir),
            MigrationContextPath = OptionalPath(raw, "migrationContextPath", baseDir),
            DryRun = Bool(raw, "dryRun"),
            UseAi = Bool(raw, "useAi"),
            AiCli = Value(raw, "aiCli", "codex"),
            AiCliCommand = Command(raw, "aiCliCommand"),
            AiTimeoutSeconds = Int(raw, "aiTimeoutSeconds", 600),
            CommandTimeoutSeconds = Int(raw, "commandTimeoutSeconds", 600)
        };
        Validate(config);
        return config;
    }

    private static RuntimeSpec Runtime(JsonObject raw, string key)
    {
        if (raw[key] is not JsonObject value) throw new InvalidOperationException($"{key}.runtime and {key}.version are required.");
        return new RuntimeSpec(Value(value, "runtime"), Value(value, "version"));
    }

    private static void Validate(LegacyMigrationConfig config)
    {
        if (!string.Equals(config.From.Runtime, "legacy-webforms", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("from.runtime must be legacy-webforms.");
        if (!string.Equals(config.To.Runtime, "blazor-ssr", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("to.runtime must be blazor-ssr.");
        if (!Directory.Exists(config.ProjectPath)) throw new DirectoryNotFoundException($"projectPath does not exist: {config.ProjectPath}");
        if (!Directory.Exists(config.TargetArchitecturePath)) throw new DirectoryNotFoundException($"targetArchitecturePath does not exist: {config.TargetArchitecturePath}");
        if (!string.IsNullOrWhiteSpace(config.MigrationContextPath) && !File.Exists(config.MigrationContextPath))
            throw new FileNotFoundException($"migrationContextPath does not exist: {config.MigrationContextPath}", config.MigrationContextPath);
        if (Path.GetFullPath(config.ProjectPath).TrimEnd('\\', '/') == Path.GetFullPath(config.OutputPath).TrimEnd('\\', '/'))
            throw new InvalidOperationException("outputPath must be different from projectPath.");
        if (config.UseAi && !string.Equals(config.AiCli, "codex", StringComparison.OrdinalIgnoreCase) && !string.Equals(config.AiCli, "claude", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("aiCli must be codex or claude when useAi is true.");
        if (config.AiCliCommand is { Count: 0 }) throw new InvalidOperationException("aiCliCommand must not be empty.");
        if (config.AiTimeoutSeconds < 0) throw new InvalidOperationException("aiTimeoutSeconds must be zero or greater.");
        if (config.CommandTimeoutSeconds < 0) throw new InvalidOperationException("commandTimeoutSeconds must be zero or greater.");
    }

    private static string ResolvePath(string value, string baseDir) => Path.IsPathRooted(value) ? Path.GetFullPath(value) : Path.GetFullPath(Path.Combine(baseDir, value));
    private static string? OptionalPath(JsonObject raw, string name, string baseDir) => raw[name] is null || string.IsNullOrWhiteSpace(raw[name]!.ToString()) ? null : ResolvePath(raw[name]!.ToString(), baseDir);
    private static string Value(JsonObject raw, string name, string? fallback = null) => raw[name]?.ToString() ?? fallback ?? throw new InvalidOperationException($"{name} is required.");
    private static bool Bool(JsonObject raw, string name) => raw[name] is not null && bool.TryParse(raw[name]!.ToString(), out var value) && value;
    private static int Int(JsonObject raw, string name, int fallback) => raw[name] is null ? fallback : int.Parse(raw[name]!.ToString());

    private static IReadOnlyList<string>? Command(JsonObject raw, string name)
    {
        if (raw[name] is null) return null;
        if (raw[name] is JsonArray array) return array.Select(item => item?.ToString() ?? "").Where(item => item.Length > 0).ToArray();
        var text = raw[name]?.ToString();
        return string.IsNullOrWhiteSpace(text) ? [] : SplitCommandLine(text);
    }

    private static IReadOnlyList<string> SplitCommandLine(string text)
    {
        var args = new List<string>();
        var current = new System.Text.StringBuilder();
        var inQuotes = false;
        for (var i = 0; i < text.Length; i++)
        {
            var ch = text[i];
            if (ch == '"')
            {
                inQuotes = !inQuotes;
                continue;
            }
            if (char.IsWhiteSpace(ch) && !inQuotes)
            {
                if (current.Length > 0)
                {
                    args.Add(current.ToString());
                    current.Clear();
                }
                continue;
            }
            current.Append(ch);
        }
        if (current.Length > 0) args.Add(current.ToString());
        return args;
    }
}
