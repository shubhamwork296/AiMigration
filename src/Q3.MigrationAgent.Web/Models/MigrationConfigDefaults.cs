namespace Q3.MigrationAgent.Web.Models;

public sealed record MigrationConfigDefaults(
    string? SourcePath,
    string? OutputPath,
    string? CurrentTechnology,
    string? TargetTechnology,
    string? CurrentVersion,
    string? TargetVersion);
