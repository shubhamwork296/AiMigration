using System.Text.Json.Nodes;
using Q3.MigrationAgent.AI.Prompts;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Core.Planning;
using Q3.MigrationAgent.Shared.Common;
using Q3.MigrationAgent.Shared.Config;

namespace Q3.MigrationAgent.Tests;

public sealed class MigrationPlannerTests
{
    [Fact]
    public async Task DotNet_Ai_PackageUpdates_Are_Accepted_For_Framework_Owned_Direct_Packages()
    {
        var ai = new StubAi(new JsonObject
        {
            ["summary"] = ".NET package alignment",
            ["confidence"] = 90,
            ["risk"] = "low",
            ["packageUpdates"] = new JsonArray(
                new JsonObject
                {
                    ["packageName"] = "Microsoft.Extensions.Http",
                    ["fromVersion"] = "6.*",
                    ["toVersion"] = "8.0.0",
                    ["action"] = "upgrade"
                },
                new JsonObject
                {
                    ["packageName"] = "Microsoft.Extensions.Hosting",
                    ["fromVersion"] = "6.*",
                    ["toVersion"] = "8.0.0",
                    ["action"] = "upgrade"
                }),
            ["manualReview"] = new JsonArray(),
            ["changes"] = new JsonArray(),
            ["recommendations"] = new JsonArray()
        });
        var planner = new MigrationPlanner(ai, new PromptLoader());
        var analysis = DotNetAnalysis();
        var rules = new JsonObject
        {
            ["targetFrameworkChange"] = new JsonObject { ["from"] = "net6.0", ["to"] = "net8.0", ["files"] = new JsonArray("*.csproj") },
            ["packageChanges"] = new JsonArray()
        };

        var plan = await planner.BuildMigrationPlanAsync(analysis, rules, new AiConfig { UseAi = true, Provider = "codex" });

        Assert.Contains(plan, p => p.StringValue("name") == "Microsoft.Extensions.Http" && p.StringValue("toVersion") == "8.0.0" && p.StringValue("source") == "ai");
        Assert.Contains(plan, p => p.StringValue("name") == "Microsoft.Extensions.Hosting" && p.StringValue("toVersion") == "8.0.0" && p.StringValue("source") == "ai");
        Assert.Equal("codex", analysis.StringValue("planningMode"));
    }

    [Fact]
    public void DotNet_Rule_Plan_Includes_Extensions_Http_And_Hosting_When_Present()
    {
        var planner = new MigrationPlanner(new StubAi(new JsonObject()), new PromptLoader());
        var plan = planner.BuildChangePlan(DotNetAnalysis(), DotNetRules());

        Assert.Contains(plan, p => p.StringValue("name") == "Microsoft.Extensions.Http" && p.StringValue("toVersion") == "8.0.0" && p.StringValue("source") == "rule");
        Assert.Contains(plan, p => p.StringValue("name") == "Microsoft.Extensions.Hosting" && p.StringValue("toVersion") == "8.0.0" && p.StringValue("source") == "rule");
    }

    private static JsonObject DotNetAnalysis() => new()
    {
        ["from"] = "dotnet6",
        ["to"] = "dotnet8",
        ["manifest"] = new JsonObject
        {
            ["runtime"] = "dotnet",
            ["projects"] = new JsonArray(
                new JsonObject
                {
                    ["path"] = "SeatPicker.Extractor/SeatPicker.Extractor.csproj",
                    ["targetFrameworks"] = new JsonArray("net6.0"),
                    ["packages"] = new JsonArray(new JsonObject { ["name"] = "Microsoft.Extensions.Http", ["version"] = "6.0.0" })
                },
                new JsonObject
                {
                    ["path"] = "SeatPicker.Job.Runner/SeatPicker.Job.Runner.csproj",
                    ["targetFrameworks"] = new JsonArray("net6.0"),
                    ["packages"] = new JsonArray(new JsonObject { ["name"] = "Microsoft.Extensions.Hosting", ["version"] = "6.0.1" })
                })
        },
        ["findings"] = new JsonArray(),
        ["riskLevel"] = "medium",
        ["confidence"] = 88,
        ["analysisMode"] = "codex"
    };

    private static JsonObject DotNetRules() => new()
    {
        ["targetFrameworkChange"] = new JsonObject { ["from"] = "net6.0", ["to"] = "net8.0", ["files"] = new JsonArray("*.csproj") },
        ["packageChanges"] = new JsonArray(
            new JsonObject { ["name"] = "Microsoft.Extensions.Http", ["fromVersion"] = "6.*", ["toVersion"] = "8.0.0", ["action"] = "upgrade" },
            new JsonObject { ["name"] = "Microsoft.Extensions.Hosting", ["fromVersion"] = "6.*", ["toVersion"] = "8.0.0", ["action"] = "upgrade" })
    };

    private sealed class StubAi(JsonObject response) : IAiService
    {
        public Task<JsonObject?> AskAsync(AiConfig config, string system, string user, CancellationToken cancellationToken = default) =>
            Task.FromResult<JsonObject?>(response);
    }
}
