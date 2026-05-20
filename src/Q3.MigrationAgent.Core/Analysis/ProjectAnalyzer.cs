using System.Text.Json;
using System.Text.Json.Nodes;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Shared.Common;
using Q3.MigrationAgent.Shared.Config;

namespace Q3.MigrationAgent.Core.Analysis;

public sealed class ProjectAnalyzer(IAiService ai)
{
    public async Task<JsonObject> AnalyzeProjectAsync(
        string projectPath,
        MigrationConfig config,
        JsonObject rules,
        JsonObject manifest,
        IMigrationAdapter adapter,
        CancellationToken cancellationToken = default)
    {
        var files = await adapter.CollectProjectFilesAsync(projectPath, cancellationToken);
        var payload = new JsonObject
        {
            ["migration"] = new JsonObject
            {
                ["runtime"] = config.From.Runtime,
                ["from"] = config.From.Version,
                ["to"] = config.To.Version
            },
            ["rules"] = rules.DeepClone(),
            ["manifest"] = manifest.DeepClone(),
            ["projectFiles"] = JsonSerializer.SerializeToNode(files),
            ["requiredResponseShape"] = new JsonObject
            {
                ["findings"] = new JsonArray(),
                ["riskLevel"] = "low|medium|high",
                ["confidence"] = "0-100"
            }
        };
        var aiAnalysis = await ai.AskAsync(config.Ai, BuildStructuralPrompt(), payload.ToJsonString(JsonHelpers.SerializerOptions), cancellationToken);
        if (aiAnalysis is not null)
        {
            aiAnalysis["analysisMode"] ??= config.Ai.Provider ?? "ai";
            aiAnalysis["manifest"] ??= manifest.DeepClone();
            return Normalize(aiAnalysis, config);
        }
        return RuleBasedAnalysis(config, rules, manifest);
    }

    private static JsonObject RuleBasedAnalysis(MigrationConfig config, JsonObject rules, JsonObject manifest)
    {
        var findings = new JsonArray();
        var targetRule = rules["targetFrameworkChange"]?.AsObject();
        if (targetRule is not null)
        {
            foreach (var project in manifest["projects"]?.AsArray()?.OfType<JsonObject>() ?? [])
            {
                var frameworks = project["targetFrameworks"]?.AsArray()?.Select(x => x?.ToString()).ToHashSet() ?? [];
                if (frameworks.Contains(targetRule.StringValue("from")))
                {
                    findings.Add(new JsonObject
                    {
                        ["type"] = "targetFramework",
                        ["file"] = project.StringValue("path"),
                        ["old"] = targetRule.StringValue("from"),
                        ["new"] = targetRule.StringValue("to"),
                        ["description"] = $"Update {project.StringValue("path")} target framework."
                    });
                }
            }
        }
        return Normalize(new JsonObject
        {
            ["from"] = $"{config.From.Runtime}{config.From.Version}",
            ["to"] = $"{config.To.Runtime}{config.To.Version}",
            ["findings"] = findings,
            ["manifest"] = manifest.DeepClone(),
            ["riskLevel"] = "low",
            ["confidence"] = 80,
            ["analysisMode"] = "rule-based"
        }, config);
    }

    private static JsonObject Normalize(JsonObject analysis, MigrationConfig config)
    {
        analysis["from"] ??= $"{config.From.Runtime}{config.From.Version}";
        analysis["to"] ??= $"{config.To.Runtime}{config.To.Version}";
        analysis["findings"] ??= new JsonArray();
        analysis["riskLevel"] ??= "medium";
        analysis["confidence"] ??= 50;
        return analysis;
    }

    private static string BuildStructuralPrompt() => """
You are a senior software migration engineer working across multiple programming languages (e.g., .NET, Java, Python, Node.js).

Your responsibility is to generate a SAFE migration analysis that ONLY modifies the OUTER STRUCTURE of a project.

STRICT RULES (NON-NEGOTIABLE):
1. You MUST NOT modify business logic.
2. You MUST NOT suggest any changes inside source code files such as .cs, .java, .py, .js, .ts, .cpp, .go.
3. You MUST NOT suggest API replacements, method changes, class refactoring, or logic updates.
4. You are ONLY allowed to suggest runtime/framework upgrades, dependency/package version upgrades, project configuration updates, and build configuration changes.
5. If a required migration step involves modifying code, you MUST IGNORE it.
6. If you are unsure, return findings as an empty list.

Return only valid JSON using the requested response shape.
""";
}
