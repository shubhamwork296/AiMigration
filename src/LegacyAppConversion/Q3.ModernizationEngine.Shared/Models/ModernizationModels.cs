namespace Q3.ModernizationEngine.Shared.Models;

public sealed record ModernizationRequest
{
    public required string SourcePath { get; init; }
    public required string OutputPath { get; init; }
    public required string TargetArchitecturePath { get; init; }
    public string SourceApplicationType { get; init; } = "aspnet-webforms";
    public string TargetUiType { get; init; } = "blazor";
    public string TargetRuntime { get; init; } = "dotnet";
    public string TargetVersion { get; init; } = "10.0";
    public string TargetMode { get; init; } = "blazor-and-api";
    public string ModuleSelection { get; init; } = "";
    public string ExecutionPhase { get; init; } = "full";
    public bool ListModulesOnly { get; init; }
    public ModernizationAiOptions Ai { get; init; } = new();
}

public sealed record ModernizationAiOptions
{
    public bool UseAi { get; init; }
    public string Provider { get; init; } = "deterministic";
    public string AiCli { get; init; } = "auto";
    public string Mode { get; init; } = "plan";
    public string PromptStyle { get; init; } = "generic-modernization";
}

public sealed record DiscoveredArtifact
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required string Type { get; init; }
    public required IReadOnlyList<string> Files { get; init; }
    public required IReadOnlyList<string> DependsOn { get; init; }
    public required IReadOnlyList<string> ReferencedBy { get; init; }
    public required IReadOnlyList<string> Signals { get; init; }
    public required int RiskScore { get; init; }
    public required bool RequiresManualReview { get; init; }
    public required string Notes { get; init; }
}

public sealed record MigrationUnit
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required string ModulePath { get; init; }
    public required string Track { get; init; }
    public required string Category { get; init; }
    public required IReadOnlyList<string> Files { get; init; }
    public required IReadOnlyList<string> ArtifactIds { get; init; }
    public required IReadOnlyList<string> DependsOn { get; init; }
    public required IReadOnlyList<string> EntryPoints { get; init; }
    public required IReadOnlyList<string> ExitPoints { get; init; }
    public required IReadOnlyList<string> Signals { get; init; }
    public required string TargetArea { get; init; }
    public required string Status { get; init; }
    public required int RiskScore { get; init; }
    public required bool RequiresManualReview { get; init; }
}

public sealed record ExecutionPlan
{
    public required IReadOnlyList<MigrationUnit> Units { get; init; }
    public required IReadOnlyList<string> OrderedUnitIds { get; init; }
    public required IReadOnlyList<string> ManualReviewItems { get; init; }
    public required IReadOnlyList<string> GuardRails { get; init; }
}

public sealed record ModuleMigrationPlan
{
    public required string UnitId { get; init; }
    public required string UnitName { get; init; }
    public required string ModulePath { get; init; }
    public required string Track { get; init; }
    public required string TargetMode { get; init; }
    public required string PlannerMode { get; init; }
    public required IReadOnlyList<string> EntryPoints { get; init; }
    public required IReadOnlyList<string> ExitPoints { get; init; }
    public required IReadOnlyList<string> DependsOnUnits { get; init; }
    public required IReadOnlyList<string> SuggestedOutputs { get; init; }
    public required IReadOnlyList<string> Steps { get; init; }
    public required IReadOnlyList<string> SqlArtifacts { get; init; }
    public required IReadOnlyList<string> ManualReviewReasons { get; init; }
    public required string Summary { get; init; }
}

public sealed record GeneratedArtifact
{
    public required string RelativePath { get; init; }
    public required string Kind { get; init; }
    public required string Summary { get; init; }
}

public sealed record ModuleExecutionResult
{
    public required string UnitId { get; init; }
    public required string UnitName { get; init; }
    public required string Track { get; init; }
    public required string ExecutorMode { get; init; }
    public required string WorkspaceFolder { get; init; }
    public required IReadOnlyList<GeneratedArtifact> GeneratedArtifacts { get; init; }
    public required IReadOnlyList<string> Warnings { get; init; }
}

public sealed record TargetArchitectureProfile
{
    public required string RootPath { get; init; }
    public required IReadOnlyList<string> KnownFolders { get; init; }
    public required IReadOnlyDictionary<string, string> TrackRoots { get; init; }
    public required IReadOnlyDictionary<string, string> PlacementHints { get; init; }
    public required IReadOnlyList<string> Notes { get; init; }
}

public sealed record WorkspacePlacement
{
    public required string UnitId { get; init; }
    public required string UnitName { get; init; }
    public required string ModulePath { get; init; }
    public required string Track { get; init; }
    public required string TargetArea { get; init; }
    public required string WorkspaceFolder { get; init; }
    public required bool RequiresManualReview { get; init; }
    public required IReadOnlyList<string> Notes { get; init; }
}

public sealed record GraphNode
{
    public required string Id { get; init; }
    public required string Label { get; init; }
    public required string Kind { get; init; }
    public required IReadOnlyList<string> Tags { get; init; }
}

public sealed record GraphEdge
{
    public required string From { get; init; }
    public required string To { get; init; }
    public required string Kind { get; init; }
}

public sealed record LegacyGraph
{
    public required IReadOnlyList<GraphNode> Nodes { get; init; }
    public required IReadOnlyList<GraphEdge> Edges { get; init; }
}

public sealed record ModernizationRunResult
{
    public required string WorkspacePath { get; init; }
    public required string ReportPath { get; init; }
    public required int TotalUnits { get; init; }
    public required int ManualReviewCount { get; init; }
    public required string GraphPath { get; init; }
    public required string StatusPath { get; init; }
    public required string TargetArchitectureReportPath { get; init; }
    public required string WorkspacePlanPath { get; init; }
    public required string ModulePlansPath { get; init; }
    public required string ExecutionResultsPath { get; init; }
}
