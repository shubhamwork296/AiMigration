namespace Q3.MigrationAgent.Shared.Config;

public sealed record MigrationConfig
{
    public required string ProjectPath { get; init; }
    public required RuntimeSpec From { get; init; }
    public required RuntimeSpec To { get; init; }
    public required string OutputPath { get; init; }
    public bool DryRun { get; init; }
    public bool AutoApprove { get; init; }
    public int MaxRetries { get; init; } = 1;
    public AiConfig Ai { get; init; } = new();
    public bool OptionalMigrations { get; init; }
    public string Verbosity { get; init; } = "default";
    public bool AutoRemediateDependencies { get; init; }
    public string OnDependencyCompatibilityIssue { get; init; } = "auto-remediate-and-continue";
    public bool AllowAngularForceUpdate { get; init; }
    public bool AllowPrereleaseDependencyVersions { get; init; }
    public int MaxDependencyRemediationRetriesPerHop { get; init; } = 1;
    public bool ContinueAfterSuccessfulRemediation { get; init; } = true;
    public int DependencyCheckTimeoutSeconds { get; init; } = 300;
    public bool SkipPreflightDependencyCompatibility { get; init; }
    public string PreflightRemediationMode { get; init; } = "suggest";
    public bool AllowLegacyPeerDepsFallback { get; init; } = true;
    public int CommandTimeoutSeconds { get; init; } = 600;
    public int CommandIdleTimeoutSeconds { get; init; }
    public bool ShowTimingSummary { get; init; } = true;
    public int MaxAiRemediationRetries { get; init; } = 3;
    public string RollbackMode { get; init; } = "manual";
    public bool AllowBusinessLogicChanges { get; init; }
    public bool PreferNgUpdate { get; init; } = true;
    public bool AvoidFullVersionScans { get; init; } = true;
    public bool DirectDependenciesOnlyPreflight { get; init; } = true;
}
