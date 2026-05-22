using System.Text.Json.Nodes;
using Q3.MigrationAgent.AI.Prompts;
using Q3.MigrationAgent.Adapters.Angular;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Shared.Common;
using Q3.MigrationAgent.Shared.Config;
using Q3.MigrationAgent.Shared.DTO;

namespace Q3.MigrationAgent.Tests;

public sealed class AngularPackageVersionRecommendationPlannerTests
{
    [Fact]
    public async Task Accepts_Caret_Semver_Recommendations_For_Angular_Owned_Packages()
    {
        var ai = new CapturingAi(new JsonObject
        {
            ["targetAngularMajor"] = 14,
            ["recommendations"] = new JsonArray(
                Rec("@angular-devkit/build-angular", "^13.1.0", "^14.2.13", "Angular DevKit build tooling aligned with published Angular 14.2 stable line."),
                Rec("@angular/core", "^13.3.0", "^14.3.0", "derived from target major")),
            ["warnings"] = new JsonArray()
        });
        var result = await Planner(ai).RecommendAsync(Config(), Hop(), PackageJson(), Decisions(), new Dictionary<string, string> { ["@angular-devkit/build-angular"] = "^14.3.0", ["@angular/core"] = "^14.3.0" });

        Assert.Contains(result["accepted"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "@angular-devkit/build-angular" && r.StringValue("recommendedVersion") == "^14.2.13");
        Assert.Contains(result["accepted"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "@angular/core" && r.StringValue("recommendedVersion") == "^14.3.0");
        Assert.DoesNotContain(result["rejected"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "@angular/core");
        Assert.Single(ai.UserPayloads);
    }

    [Fact]
    public async Task Accepts_Strict_Package_From_To_Response_Shape()
    {
        var ai = new CapturingAi(new JsonObject
        {
            ["targetAngularMajor"] = 14,
            ["recommendations"] = new JsonArray(new JsonObject
            {
                ["package"] = "@angular/core",
                ["from"] = "^13.3.0",
                ["to"] = "~14.3.0",
                ["role"] = "framework",
                ["reason"] = "Angular core package for target major 14.",
                ["confidence"] = 0.95,
                ["action"] = "upgrade",
                ["risk"] = "low",
                ["installImpact"] = "required",
                ["buildImpact"] = "required",
                ["manualReviewRequired"] = false
            }),
            ["warnings"] = new JsonArray()
        });

        var result = await Planner(ai).RecommendAsync(Config(), Hop(), PackageJson(), Decisions(), new Dictionary<string, string>());

        Assert.Contains(result["accepted"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "@angular/core" && r.StringValue("recommendedVersion") == "~14.3.0");
    }

    [Theory]
    [InlineData("latest")]
    [InlineData("*")]
    public async Task Rejects_Unbounded_Recommendations(string version)
    {
        var result = await Planner(new CapturingAi(Response(Rec("@angular-devkit/build-angular", "^13.1.0", version, "unsafe"))))
            .RecommendAsync(Config(), Hop(), PackageJson(), Decisions(), new Dictionary<string, string>());

        Assert.Contains(result["rejected"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "@angular-devkit/build-angular");
    }

    [Fact]
    public async Task Rejects_Wrong_Major_For_Angular_Owned_Package()
    {
        var result = await Planner(new CapturingAi(Response(Rec("@angular-devkit/build-angular", "^13.1.0", "^15.0.0", "wrong major"))))
            .RecommendAsync(Config(), Hop(), PackageJson(), Decisions(), new Dictionary<string, string>());

        Assert.Contains(result["rejected"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("rejectionReason").Contains("target Angular major"));
    }

    [Fact]
    public async Task Low_Confidence_Becomes_Manual_Review_Proactive_ThirdParty_Rejected_But_Critical_Alignment_Is_Accepted()
    {
        var result = await Planner(new CapturingAi(Response(
                Rec("@angular-slider/ngx-slider", "^13.0.0", "^14.0.0", "low confidence", confidence: 55),
                Rec("@angular-devkit/build-angular", "^13.1.0", "^14.2.13", "specific but risky", risk: "high"))))
            .RecommendAsync(Config(), Hop(), PackageJson(), Decisions(), new Dictionary<string, string>());

        Assert.Single(result["manualReview"]!.AsArray());
        Assert.Single(result["rejected"]!.AsArray());
        Assert.Contains(result["accepted"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "@angular-devkit/build-angular");
    }

    [Fact]
    public async Task Rejects_Proactive_ThirdParty_Angular_Package_Upgrade()
    {
        var result = await Planner(new CapturingAi(Response(Rec("@angular-slider/ngx-slider", "^13.0.0", "^14.0.0", "proactive third-party upgrade", confidence: 95))))
            .RecommendAsync(Config(), Hop(), PackageJson(), Decisions(), new Dictionary<string, string>());

        Assert.Contains(result["rejected"]!.AsArray().OfType<JsonObject>(), r =>
            r.StringValue("packageName") == "@angular-slider/ngx-slider" &&
            r.StringValue("rejectionReason").Contains("validationDriven=true"));
    }

    [Fact]
    public async Task Accepts_Validation_Driven_ThirdParty_Angular_Package_Upgrade()
    {
        var recommendation = Rec("@angular-slider/ngx-slider", "^13.0.0", "^14.0.0", "build validation identified this package as the blocker", confidence: 95);
        recommendation["validationDriven"] = true;

        var result = await Planner(new CapturingAi(Response(recommendation)))
            .RecommendAsync(Config(), Hop(), PackageJson(), Decisions(), new Dictionary<string, string>());

        Assert.Contains(result["accepted"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "@angular-slider/ngx-slider");
    }

    [Fact]
    public async Task Rejects_Invalid_Action_Enum()
    {
        var recommendation = Rec("@angular/core", "^13.3.0", "^14.2.13", "invalid enum");
        recommendation["action"] = "upgrade | preserve";

        var result = await Planner(new CapturingAi(Response(recommendation)))
            .RecommendAsync(Config(), Hop(), PackageJson(), Decisions(), new Dictionary<string, string>());

        Assert.Contains(result["rejected"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("rejectionReason").Contains("action"));
    }

    [Fact]
    public async Task Missing_Recommendations_Falls_Back_Safely()
    {
        var result = await Planner(new CapturingAi(new JsonObject { ["items"] = new JsonArray() }))
            .RecommendAsync(Config(), Hop(), PackageJson(), Decisions(), new Dictionary<string, string>());

        Assert.True(result.BoolValue("fallbackUsed"));
        Assert.Empty(result["accepted"]!.AsArray());
    }

    private static AngularPackageVersionRecommendationPlanner Planner(IAiService ai) => new(ai, new PromptLoader());

    private static AiConfig Config() => new() { UseAi = true, Provider = "codex" };

    private static MigrationHop Hop() => new(13, 14, "Angular 13 to 14");

    private static JsonObject PackageJson() => new()
    {
        ["dependencies"] = new JsonObject
        {
            ["@angular/core"] = "^13.3.0",
            ["@angular-slider/ngx-slider"] = "^13.0.0"
        },
        ["devDependencies"] = new JsonObject
        {
            ["@angular-devkit/build-angular"] = "^13.1.0"
        }
    };

    private static IReadOnlyList<JsonObject> Decisions() =>
    [
        Decision("@angular/core", "dependencies", "angular_framework_package"),
        Decision("@angular-slider/ngx-slider", "dependencies", "angular_ui_or_extension_package"),
        Decision("@angular-devkit/build-angular", "devDependencies", "angular_tooling_package")
    ];

    private static JsonObject Decision(string name, string section, string category) => new()
    {
        ["name"] = name,
        ["currentVersion"] = "",
        ["section"] = section,
        ["category"] = category,
        ["targetVersion"] = null,
        ["action"] = category.StartsWith("angular_") ? "upgrade" : "preserve",
        ["confidence"] = 0.95,
        ["risk"] = "low"
    };

    private static JsonObject Response(params JsonObject[] recommendations) => new()
    {
        ["targetAngularMajor"] = 14,
        ["recommendations"] = new JsonArray(recommendations.Select(r => (JsonNode?)r).ToArray()),
        ["warnings"] = new JsonArray()
    };

    private static JsonObject Rec(string name, string current, string? version, string reason, double confidence = 90, string risk = "low") => new()
    {
        ["packageName"] = name,
        ["currentVersion"] = current,
        ["recommendedVersion"] = version,
        ["action"] = "upgrade",
        ["confidence"] = confidence,
        ["risk"] = risk,
        ["reason"] = reason,
        ["installImpact"] = "required",
        ["buildImpact"] = "required",
        ["manualReviewRequired"] = false
    };

    private sealed class CapturingAi(JsonObject response) : IAiService
    {
        public List<string> UserPayloads { get; } = [];
        public Task<JsonObject?> AskAsync(AiConfig config, string system, string user, CancellationToken cancellationToken = default)
        {
            UserPayloads.Add(user);
            return Task.FromResult<JsonObject?>(response);
        }
    }
}
