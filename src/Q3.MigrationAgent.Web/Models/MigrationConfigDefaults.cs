namespace Q3.MigrationAgent.Web.Models;

public sealed record MigrationConfigDefaults(
    string MigrationMode,
    string? SourcePath,
    string? OutputPath,
    string? TargetArchitecturePath,
    string? MigrationContextPath,
    string? CurrentTechnology,
    string? TargetTechnology,
    string? CurrentVersion,
    string? TargetVersion);
