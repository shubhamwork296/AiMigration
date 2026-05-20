using System.Text.Json.Nodes;

namespace Q3.MigrationAgent.Shared.DTO;

public sealed record MigrationHop(int FromVersion, int ToVersion, string Description)
{
    public string Type { get; init; } = "angular-hop";
}

public sealed record CommandResult
{
    public int ReturnCode { get; init; }
    public string Stdout { get; init; } = "";
    public string Stderr { get; init; } = "";
    public IReadOnlyList<string> ResolvedCommand { get; init; } = Array.Empty<string>();
    public double DurationSeconds { get; init; }
    public string? TimeoutKind { get; init; }
    public string? FailureCategory { get; init; }
    public string? FailureReason { get; init; }
    public string? SuggestedNextAction { get; init; }
}

public sealed record BuildResult(bool Success, string Output);

public sealed record InstallStrategyDecision
{
    public string PackageManager { get; init; } = "npm";
    public string Strategy { get; init; } = "";
    public string Mode { get; init; } = "normal";
    public string Command { get; init; } = "";
    public InstallStrategyFlags Flags { get; init; } = new();
    public string Reason { get; init; } = "";
    public string Risk { get; init; } = "low";
    public double Confidence { get; init; } = 1.0;
    public bool IsRetry { get; init; }
    public bool IsFallback { get; init; }
    public int MaxRetries { get; init; }
    public string FailureClassification { get; init; } = "none";
}

public sealed record InstallStrategyFlags
{
    public bool NoAudit { get; init; } = true;
    public bool NoFund { get; init; } = true;
    public bool PreferOffline { get; init; } = true;
    public bool Verbose { get; init; }
    public bool LegacyPeerDeps { get; init; }
    public bool Force { get; init; }
}

public sealed record InstallAttemptResult
{
    public required InstallStrategyDecision Decision { get; init; }
    public required IReadOnlyList<string> Command { get; init; }
    public required CommandResult Result { get; init; }
    public string StrategySource { get; init; } = "deterministic-fallback";
    public bool FallbackUsed { get; init; }
    public bool RetryUsed { get; init; }
    public bool LegacyPeerDepsUsed { get; init; }
    public int RetryCount { get; init; }
    public bool AiStrategyUsed { get; init; }
    public bool AiStrategyAccepted { get; init; }
    public string AiStrategyRejectedReason { get; init; } = "";
    public bool ManualActionRequired { get; init; }
    public InstallFailureClassification? FailureClassification { get; init; }
    public JsonObject? PeerDependencyConflict { get; init; }
}

public sealed record InstallFailureClassification(string Category, string Reason, string SuggestedNextAction);

public sealed record ValidationResult
{
    public bool? Passed { get; set; }
    public string Output { get; set; } = "";
    public string Errors { get; set; } = "";
    public string Suggestion { get; set; } = "";
    public string? SnapshotPath { get; set; }
    public string? OutputPath { get; set; }
    public string? RollbackError { get; set; }
    public string? FailedHop { get; set; }
    public IReadOnlyList<string>? FailureCommand { get; set; }
    public IReadOnlyList<string>? SuggestedCorrectedCommand { get; set; }
    public List<JsonObject> Attempts { get; set; } = [];
    public List<JsonObject> AiRemediationChanges { get; set; } = [];
    public List<JsonObject> ManualCorrectionRequests { get; set; } = [];
    public string RollbackMode { get; set; } = "manual";
    public bool AutomaticRollbackApplied { get; set; }
}

public sealed record ChangeResult
{
    public JsonObject Change { get; init; } = new();
    public string Status { get; init; } = "skipped";
    public IReadOnlyList<string> Files { get; init; } = Array.Empty<string>();
    public string? Error { get; init; }
}

public sealed record MigrationRunResult
{
    public bool Success { get; init; }
    public string? ReportPath { get; init; }
    public string? LogPath { get; init; }
    public bool? ValidationPassed { get; init; }
    public IReadOnlyList<string> Errors { get; init; } = Array.Empty<string>();
    public IReadOnlyList<string> Warnings { get; init; } = Array.Empty<string>();
}
