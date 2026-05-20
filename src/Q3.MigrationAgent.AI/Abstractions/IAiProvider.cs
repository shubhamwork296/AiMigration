using System.Text.Json.Nodes;
using Q3.MigrationAgent.Shared.Config;

namespace Q3.MigrationAgent.AI.Abstractions;

public interface IAiProvider
{
    string Name { get; }
    Task<JsonObject?> AskAsync(AiConfig config, string system, string user, CancellationToken cancellationToken = default);
}

