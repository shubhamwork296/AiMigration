namespace Q3.LegacyMigration;

public sealed record LegacyMigrationResult
{
    public required bool Success { get; init; }
    public required string OutputPath { get; init; }
    public required string ReportPath { get; init; }
    public IReadOnlyList<string> GeneratedFiles { get; init; } = [];
    public IReadOnlyList<string> ValidationCommands { get; init; } = [];
    public string ValidationOutput { get; init; } = "";
}
