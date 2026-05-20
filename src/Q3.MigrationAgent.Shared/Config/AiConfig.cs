namespace Q3.MigrationAgent.Shared.Config;

public sealed record AiConfig
{
    public bool UseAi { get; init; }
    public string? Provider { get; init; }
    public string Mode { get; init; } = "cli";
    public IReadOnlyList<string>? CliCommand { get; init; }
    public string AiCli { get; init; } = "auto";
    public string? CliVersion { get; init; }
    public string? LatestVersion { get; init; }
    public IReadOnlyList<string> CliWarnings { get; init; } = Array.Empty<string>();
}

