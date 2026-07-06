namespace Q3.LegacyMigration.WebForms;

public sealed record WebFormsAnalysis
{
    public string ApplicationName { get; init; } = "LegacyWebFormsApplication";
    public bool UsesSqlDataSource { get; init; }
    public bool UsesSessionState { get; init; }
    public bool UsesDirectAdoNet { get; init; }
    public bool HasClientsWorkflow { get; init; }
    public bool HasPositionsWorkflow { get; init; }
    public string? PrimaryConnectionStringName { get; init; }
    public string? PrimaryConnectionString { get; init; }
    public string? MigrationContextPath { get; init; }
    public string? MigrationContext { get; init; }
    public IReadOnlyList<string> WebFormsFiles { get; init; } = [];
    public IReadOnlyList<string> MasterPages { get; init; } = [];
}
