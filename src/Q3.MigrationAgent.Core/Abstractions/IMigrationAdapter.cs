using System.Text.Json.Nodes;
using Q3.MigrationAgent.Shared.Config;
using Q3.MigrationAgent.Shared.DTO;

namespace Q3.MigrationAgent.Core.Abstractions;

public interface IMigrationAdapter
{
    string RuntimeName { get; }
    Task<bool> DetectAsync(string projectPath, CancellationToken cancellationToken = default);
    Task<JsonObject> ParseManifestAsync(string projectPath, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<string>> UpgradePackageAsync(string projectPath, JsonObject change, CancellationToken cancellationToken = default);
    Task<BuildResult> RunBuildAsync(string projectPath, int? timeoutSeconds = null, int? idleTimeoutSeconds = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyDictionary<string, string>> CollectProjectFilesAsync(string projectPath, CancellationToken cancellationToken = default);
    IReadOnlyList<MigrationHop> ExpandMigrationHops(string fromVersion, string toVersion);
    Task<JsonObject> ExecuteMigrationHopAsync(
        string projectPath,
        MigrationHop hop,
        JsonObject rules,
        MigrationConfig config,
        IProgressReporter? progress,
        string? logPath,
        CancellationToken cancellationToken = default);
}
