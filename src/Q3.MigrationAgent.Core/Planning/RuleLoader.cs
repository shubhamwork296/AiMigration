using System.Text.Json.Nodes;

namespace Q3.MigrationAgent.Core.Planning;

public interface IRuleLoader
{
    Task<JsonObject> LoadRulesAsync(string runtime, string fromVersion, string toVersion, CancellationToken cancellationToken = default);
}

public sealed class JsonRuleLoader(string rulesRoot) : IRuleLoader
{
    public async Task<JsonObject> LoadRulesAsync(string runtime, string fromVersion, string toVersion, CancellationToken cancellationToken = default)
    {
        var rulePath = Path.Combine(rulesRoot, runtime, $"{fromVersion}-to-{toVersion}.json");
        if (!File.Exists(rulePath))
        {
            throw new FileNotFoundException($"No rules found for {runtime} {fromVersion} to {toVersion}", rulePath);
        }

        var json = await File.ReadAllTextAsync(rulePath, cancellationToken);
        return JsonNode.Parse(json)?.AsObject() ?? throw new InvalidOperationException($"Rule file is not a JSON object: {rulePath}");
    }
}

