using System.Text.Json.Nodes;
using Q3.MigrationAgent.Shared.Config;

namespace Q3.MigrationAgent.Core.Abstractions;

public interface IAiService
{
    Task<JsonObject?> AskAsync(AiConfig config, string system, string user, CancellationToken cancellationToken = default);
}

