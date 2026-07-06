namespace Q3.LegacyMigration.Config;

public sealed record LegacyMigrationConfig
{
    public required string ProjectPath { get; init; }
    public required RuntimeSpec From { get; init; }
    public required RuntimeSpec To { get; init; }
    public required string OutputPath { get; init; }
    public required string TargetArchitecturePath { get; init; }
    public string? MigrationContextPath { get; init; }
    public bool DryRun { get; init; }
    public bool UseAi { get; init; }
    public string AiCli { get; init; } = "codex";
    public IReadOnlyList<string>? AiCliCommand { get; init; }
    public int AiTimeoutSeconds { get; init; } = 600;
    public int CommandTimeoutSeconds { get; init; } = 600;
}
