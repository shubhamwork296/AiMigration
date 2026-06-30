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
            if (runtime.Equals("dotnet", StringComparison.OrdinalIgnoreCase) &&
                MajorFromSpec(fromVersion) is { } fromMajor &&
                MajorFromSpec(toVersion) is { } toMajor &&
                toMajor > fromMajor)
            {
                return GeneratedDotNetRules(fromMajor, toMajor);
            }

            throw new FileNotFoundException($"No rules found for {runtime} {fromVersion} to {toVersion}", rulePath);
        }

        var json = await File.ReadAllTextAsync(rulePath, cancellationToken);
        return JsonNode.Parse(json)?.AsObject() ?? throw new InvalidOperationException($"Rule file is not a JSON object: {rulePath}");
    }

    private static JsonObject GeneratedDotNetRules(int fromMajor, int toMajor) => new()
    {
        ["from"] = $"dotnet{fromMajor}",
        ["to"] = $"dotnet{toMajor}",
        ["source"] = "generated-dotnet-hop-policy",
        ["targetFrameworkChange"] = new JsonObject
        {
            ["from"] = $"net{fromMajor}.0",
            ["to"] = $"net{toMajor}.0",
            ["files"] = new JsonArray("*.csproj", "Directory.Build.props", "Directory.Build.targets")
        },
        ["packageFamilyPolicies"] = new JsonArray(
            new JsonObject { ["prefix"] = "Microsoft.AspNetCore.", ["fromMajor"] = fromMajor, ["toVersion"] = $"{toMajor}.0.0", ["reason"] = "ASP.NET Core packages are aligned with the target .NET major when directly referenced." },
            new JsonObject { ["prefix"] = "Microsoft.EntityFrameworkCore", ["fromMajor"] = fromMajor, ["toVersion"] = $"{toMajor}.0.0", ["reason"] = "Entity Framework Core packages are aligned with the target .NET major when directly referenced." },
            new JsonObject { ["prefix"] = "Microsoft.Extensions.", ["fromMajor"] = fromMajor, ["toVersion"] = $"{toMajor}.0.0", ["reason"] = "Microsoft.Extensions packages are aligned with the target .NET major when directly referenced." }),
        ["deprecatedApis"] = new JsonArray(),
        ["configChanges"] = new JsonArray()
    };

    private static int? MajorFromSpec(string value) => System.Text.RegularExpressions.Regex.Match(value ?? "", @"(\d+)") is { Success: true } m ? int.Parse(m.Groups[1].Value) : null;
}
