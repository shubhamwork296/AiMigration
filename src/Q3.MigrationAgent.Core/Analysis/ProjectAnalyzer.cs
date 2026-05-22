using System.Text.Json;
using System.Text.Json.Nodes;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Shared.Common;
using Q3.MigrationAgent.Shared.Config;

namespace Q3.MigrationAgent.Core.Analysis;

public sealed class ProjectAnalyzer(IAiService ai, IPromptLoader? promptLoader = null)
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
        var aiAnalysis = await ai.AskAsync(config.Ai, LoadPrompt("analysis/structural-analysis"), payload.ToJsonString(JsonHelpers.SerializerOptions), cancellationToken);
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

    private string LoadPrompt(string promptPath) => promptLoader?.Load(promptPath) ?? throw new InvalidOperationException("Prompt loader is required when AI analysis is enabled.");
}
