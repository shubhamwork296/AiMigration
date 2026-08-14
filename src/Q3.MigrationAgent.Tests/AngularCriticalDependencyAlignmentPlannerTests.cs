using System.Text.Json.Nodes;
using Q3.MigrationAgent.AI.Prompts;
using Q3.MigrationAgent.Adapters.Angular;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Shared.Common;
using Q3.MigrationAgent.Shared.Config;
using Q3.MigrationAgent.Shared.DTO;

namespace Q3.MigrationAgent.Tests;

public sealed class AngularCriticalDependencyAlignmentPlannerTests
{
    [Fact]
    public async Task Angular_20_With_Invalid_TypeScript_Falls_Back_To_58()
    {
        var npmLs = new JsonObject
        {
            ["command"] = "npm ls typescript",
            ["returncode"] = 1,
            ["stdout"] = "",
            ["stderr"] = """
typescript@5.5.4 invalid: ">=5.8 <6.0" from @angular-devkit/build-angular@20.3.28
"""
        };

        var ai = new CapturingAi(Response());
        var result = await Planner(ai)
            .RecommendAsync(Config(), new MigrationHop(19, 20, "Angular 19 to 20"), PackageJson("~5.5.4"), npmLsProblemContext: npmLs);

        Assert.Contains(result["accepted"]!.AsArray().OfType<JsonObject>(), r =>
            r.StringValue("packageName") == "typescript" &&
            r.StringValue("recommendedVersion") == "~5.8.3");
        Assert.Empty(result["manualReview"]!.AsArray());
        var payload = JsonNode.Parse(ai.UserPayloads.Single())!.AsObject();
        Assert.Equal(">=5.8 <6.0", payload["angularTypeScriptPeerRanges"]!.AsObject().StringValue("intersection"));
    }

    [Fact]
    public async Task Angular_13_With_TypeScript_55_Accepts_Compatible_Pin()
    {
        var ai = new CapturingAi(Response(Rec("typescript", "^5.5.4", "~4.5.5", "Angular 13 compiler-cli requires TypeScript >=4.4 <4.6 and TypeScript 5.5 causes compiler API failures.")));

        var result = await Planner(ai).RecommendAsync(Config(), new MigrationHop(13, 13, "Angular 13 alignment"), PackageJson("^5.5.4"));

        Assert.Contains(result["accepted"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "typescript" && r.StringValue("recommendedVersion") == "~4.5.5");
        Assert.Single(ai.UserPayloads);
    }

    [Fact]
    public async Task Angular_13_With_Valid_TypeScript_Preserves()
    {
        var result = await Planner(new CapturingAi(Response(Rec("typescript", "~4.5.5", null, "Angular 13 TypeScript range is already compatible.", action: "preserve", blocksBuild: false))))
            .RecommendAsync(Config(), new MigrationHop(13, 13, "Angular 13 alignment"), PackageJson("~4.5.5"));

        Assert.Contains(result["accepted"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "typescript" && r.StringValue("action") == "preserve");
        Assert.Empty(result["manualReview"]!.AsArray());
    }

    [Fact]
    public async Task Accepts_Strict_Package_Source_Target_Response_Shape_With_Fractional_Confidence()
    {
        var ai = new CapturingAi(Response(new JsonObject
        {
            ["package"] = "typescript",
            ["source"] = "~5.5.4",
            ["target"] = "~4.5.5",
            ["section"] = "devDependencies",
            ["action"] = "align",
            ["criticality"] = "required",
            ["confidence"] = 0.95,
            ["risk"] = "low",
            ["reason"] = "Angular 13 compiler-cli peer compatibility requires TypeScript >=4.4 <4.6.",
            ["blocksInstall"] = false,
            ["blocksBuild"] = true,
            ["manualReviewRequired"] = false
        }));

        var result = await Planner(ai).RecommendAsync(Config(), new MigrationHop(13, 13, "Angular 13 alignment"), PackageJson("^5.5.4"));

        Assert.Contains(result["accepted"]!.AsArray().OfType<JsonObject>(), r =>
            r.StringValue("packageName") == "typescript" &&
            r.StringValue("recommendedVersion") == "~4.5.5" &&
            r.StringValue("dependencySection") == "devDependencies");
    }

    [Fact]
    public async Task Rejects_Invalid_Action_Enum()
    {
        var invalid = Rec("typescript", "^5.5.4", "~4.5.5", "Angular 13 compiler TypeScript compatibility.");
        invalid["action"] = "align | preserve";

        var result = await Planner(new CapturingAi(Response(invalid)))
            .RecommendAsync(Config(), new MigrationHop(13, 13, "Angular 13 alignment"), PackageJson("^5.5.4"));

        Assert.Contains(result["rejected"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "typescript" && r.StringValue("rejectionReason").Contains("action"));
    }

    [Fact]
    public async Task Angular_13_CompilerCli_Peer_Range_Rejects_TypeScript_484()
    {
        var ai = new CapturingAi(Response(Rec("typescript", "~4.8.4", "~4.8.4", "Angular 13 broad TypeScript 4.x compatibility.", confidence: 95)));

        var result = await Planner(ai).RecommendAsync(Config(), new MigrationHop(13, 13, "Angular 13 alignment"), PackageJson("~4.8.4"), localPackageMetadata: Angular13PeerMetadata());

        Assert.Contains(result["rejected"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "typescript" && r.StringValue("rejectionReason").Contains("<4.6"));
        Assert.Contains(result["accepted"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "typescript" && r.StringValue("recommendedVersion") == "~4.5.5");
        var payload = JsonNode.Parse(ai.UserPayloads.Single())!.AsObject();
        Assert.Contains(payload["angularTypeScriptPeerRanges"]!["ranges"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "@angular/compiler-cli" && r.StringValue("typescriptPeerRange") == ">=4.4.2 <4.6");
        Assert.Equal(">=4.4.3 <4.6", payload["angularTypeScriptPeerRanges"]!.AsObject().StringValue("intersection"));
    }

    [Fact]
    public async Task Angular_13_CompilerCli_Peer_Range_Accepts_TypeScript_455()
    {
        var result = await Planner(new CapturingAi(Response(Rec("typescript", "~4.8.4", "~4.5.5", "Angular 13 compiler-cli peer range requires TypeScript >=4.4.3 <4.6.", confidence: 95))))
            .RecommendAsync(Config(), new MigrationHop(13, 13, "Angular 13 alignment"), PackageJson("~4.8.4"), localPackageMetadata: Angular13PeerMetadata());

        Assert.Contains(result["accepted"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "typescript" && r.StringValue("recommendedVersion") == "~4.5.5");
        Assert.DoesNotContain(result["rejected"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "typescript");
    }

    [Fact]
    public async Task Npm_Ls_Invalid_TypeScript_Output_Triggers_Correction_To_455()
    {
        var npmLs = new JsonObject
        {
            ["command"] = "npm ls typescript",
            ["returncode"] = 1,
            ["stdout"] = "",
            ["stderr"] = """
typescript@4.8.4 invalid: ">=4.4.2 <4.6" from @angular/compiler-cli@13.1.3
typescript@4.8.4 invalid: ">=4.4.3 <4.7" from @angular-devkit/build-angular@13.3.11
typescript@4.8.4 invalid: ">=4.4.3 <4.7" from @ngtools/webpack@13.3.11
"""
        };

        var result = await Planner(new CapturingAi(Response()))
            .RecommendAsync(Config(), new MigrationHop(13, 13, "Angular 13 alignment"), PackageJson("~4.8.4"), npmLsProblemContext: npmLs);

        Assert.Contains(result["accepted"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "typescript" && r.StringValue("recommendedVersion") == "~4.5.5");
        Assert.Empty(result["manualReview"]!.AsArray());
    }

    [Fact]
    public async Task High_Confidence_Ai_TypeScript_Outside_Peer_Intersection_Is_Rejected()
    {
        var result = await Planner(new CapturingAi(Response(Rec("typescript", "~4.8.4", "~4.8.4", "Angular compiler peer dependency compatibility.", confidence: 100))))
            .RecommendAsync(Config(), new MigrationHop(13, 13, "Angular 13 alignment"), PackageJson("~4.8.4"), localPackageMetadata: Angular13PeerMetadata());

        Assert.Contains(result["rejected"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "typescript" && r.StringValue("recommendedVersion") == "~4.8.4");
        Assert.Contains(result["accepted"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "typescript" && r.StringValue("recommendedVersion") == "~4.5.5");
    }

    [Theory]
    [InlineData("latest")]
    [InlineData("*")]
    public async Task Rejects_Unbounded_TypeScript_Recommendations(string version)
    {
        var result = await Planner(new CapturingAi(Response(Rec("typescript", "^5.5.4", version, "Angular 13 compiler TypeScript compatibility."))))
            .RecommendAsync(Config(), new MigrationHop(13, 13, "Angular 13 alignment"), PackageJson("^5.5.4"));

        Assert.Contains(result["rejected"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "typescript");
    }

    [Fact]
    public async Task Rejects_Angular_Owned_Recommendation_Below_Target_Major()
    {
        var result = await Planner(new CapturingAi(Response(Rec("@angular/core", "^13.3.0", "^13.3.12", "Angular 14 build compatibility requires aligned Angular package.", section: "dependencies"))))
            .RecommendAsync(Config(), new MigrationHop(13, 14, "Angular 13 to 14"), PackageJson("^4.8.4"));

        Assert.Contains(result["rejected"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "@angular/core" && r.StringValue("rejectionReason").Contains("below the target hop major"));
    }

    [Fact]
    public async Task Normalizes_Safe_Action_Field_And_Section_Aliases()
    {
        var ai = new CapturingAi(Response(new JsonObject
        {
            ["package"] = "typescript",
            ["current"] = "^5.5.4",
            ["recommended"] = "~4.5.5",
            ["section"] = "devDependency",
            ["action"] = "upgrade",
            ["criticality"] = "required",
            ["confidence"] = 95,
            ["risk"] = "low",
            ["reason"] = "Angular 13 compiler-cli peer compatibility requires TypeScript >=4.4 <4.6.",
            ["blocksInstall"] = false,
            ["blocksBuild"] = true,
            ["manualReviewRequired"] = false
        }));

        var result = await Planner(ai).RecommendAsync(Config(), new MigrationHop(13, 13, "Angular 13 alignment"), PackageJson("^5.5.4"));

        Assert.Contains(result["accepted"]!.AsArray().OfType<JsonObject>(), r =>
            r.StringValue("packageName") == "typescript" &&
            r.StringValue("action") == "align" &&
            r.StringValue("dependencySection") == "devDependencies" &&
            r.StringValue("recommendedVersion") == "~4.5.5" &&
            r.StringValue("currentVersion") == "^5.5.4");
    }

    [Fact]
    public async Task Angular_19_Accepts_ZoneJs_Runtime_Support_Alignment()
    {
        var result = await Planner(new CapturingAi(Response(Rec("zone.js", "^0.14.10", "~0.15.0", "Angular 19 requires a zone.js runtime support version compatible with Angular 19.", confidence: 75, section: "dependencies", blocksBuild: false))))
            .RecommendAsync(Config(), new MigrationHop(18, 19, "Angular 18 to 19"), Angular18PackageJson());

        Assert.Contains(result["accepted"]!.AsArray().OfType<JsonObject>(), r =>
            r.StringValue("packageName") == "zone.js" &&
            r.StringValue("recommendedVersion") == "~0.15.0" &&
            r.StringValue("dependencySection") == "dependencies");
        Assert.DoesNotContain(result["rejected"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "zone.js");
    }

    [Fact]
    public async Task Angular_Owned_Extension_Packages_Are_Framework_Critical()
    {
        var result = await Planner(new CapturingAi(Response(
                Rec("@angular/localize", "18.2.13", "19.2.0", "Angular localize must align with Angular framework packages for Angular 19.", section: "dependencies"),
                Rec("@angular/material-moment-adapter", "18.2.13", "19.2.0", "Angular Material adapter must align with Angular Material for Angular 19.", section: "dependencies"))))
            .RecommendAsync(Config(), new MigrationHop(18, 19, "Angular 18 to 19"), Angular18PackageJson());

        Assert.Contains(result["accepted"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "@angular/localize");
        Assert.Contains(result["accepted"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("packageName") == "@angular/material-moment-adapter");
    }

    [Fact]
    public async Task Rejects_Angular_Owned_Framework_Ranges()
    {
        var result = await Planner(new CapturingAi(Response(
                Rec("@angular/core", "19.2.0", "^20.0.0", "Angular core must align with Angular framework packages for Angular 20.", section: "dependencies"))))
            .RecommendAsync(Config(), new MigrationHop(19, 20, "Angular 19 to 20"), PackageJson("~5.8.3"));

        Assert.Contains(result["rejected"]!.AsArray().OfType<JsonObject>(), r =>
            r.StringValue("packageName") == "@angular/core" &&
            r.StringValue("rejectionReason").Contains("exact synchronized version"));
    }

    [Fact]
    public async Task Rejects_Mixed_Angular_Owned_Framework_Patches()
    {
        var result = await Planner(new CapturingAi(Response(
                Rec("@angular/core", "19.2.0", "20.1.8", "Angular core must align with Angular framework packages for Angular 20.", section: "dependencies"),
                Rec("@angular/compiler", "19.2.0", "20.3.25", "Angular compiler must align with Angular framework packages for Angular 20.", section: "dependencies"))))
            .RecommendAsync(Config(), new MigrationHop(19, 20, "Angular 19 to 20"), PackageJson("~5.8.3"));

        Assert.Contains(result["rejected"]!.AsArray().OfType<JsonObject>(), r =>
            r.StringValue("packageName") == "@angular/core" &&
            r.StringValue("rejectionReason").Contains("mixed Angular-owned framework recommendation"));
        Assert.Empty(result["accepted"]!.AsArray().OfType<JsonObject>().Where(r => r.StringValue("packageName").StartsWith("@angular/", StringComparison.OrdinalIgnoreCase)));
    }

    [Fact]
    public async Task Low_Confidence_And_High_Risk_Become_Manual_Review()
    {
        var result = await Planner(new CapturingAi(Response(
                Rec("typescript", "^5.5.4", "~4.5.5", "Angular 13 compiler TypeScript compatibility.", confidence: 55),
                Rec("@angular-devkit/build-angular", "^13.3.0", "^13.3.11", "Uncertain.", risk: "high", blocksBuild: false))))
            .RecommendAsync(Config(), new MigrationHop(13, 13, "Angular 13 alignment"), PackageJson("^5.5.4"));

        Assert.True(result["manualReview"]!.AsArray().Count >= 2);
        Assert.Equal(2, result["rejected"]!.AsArray().Count);
    }

    [Fact]
    public async Task Invalid_Ai_Json_Falls_Back_Safely()
    {
        var result = await Planner(new CapturingAi(new JsonObject { ["items"] = new JsonArray() }))
            .RecommendAsync(Config(), new MigrationHop(13, 13, "Angular 13 alignment"), PackageJson("^5.5.4"));

        Assert.True(result.BoolValue("fallbackUsed"));
        Assert.Empty(result["accepted"]!.AsArray());
        Assert.Contains(result["manualReview"]!.AsArray().OfType<JsonObject>(), r => r.StringValue("name") == "typescript");
    }

    [Fact]
    public async Task Critical_Dependency_Payload_Excludes_Noncritical_Packages()
    {
        var packageJson = PackageJson("^5.5.4");
        packageJson["dependencies"]!.AsObject()["lodash"] = "^4.17.21";
        packageJson["devDependencies"]!.AsObject()["jest"] = "^29.0.0";
        var classification = new JsonObject
        {
            ["packages"] = new JsonArray(
                new JsonObject { ["name"] = "typescript", ["section"] = "devDependencies", ["action"] = "upgrade" },
                new JsonObject { ["name"] = "lodash", ["section"] = "dependencies", ["action"] = "preserve" })
        };
        var recommendations = new JsonObject
        {
            ["accepted"] = new JsonArray(
                Rec("typescript", "^5.5.4", "~4.5.5", "Angular 13 compiler-cli requires TypeScript >=4.4 <4.6."),
                Rec("jest", "^29.0.0", "^30.0.0", "Noncritical test package.", section: "devDependencies"))
        };
        var ai = new CapturingAi(Response());

        await Planner(ai).RecommendAsync(Config(), new MigrationHop(13, 13, "Angular 13 alignment"), packageJson, classification, recommendations);

        var payload = JsonNode.Parse(ai.UserPayloads.Single())!.AsObject();
        Assert.False(payload["dependencies"]!.AsObject().ContainsKey("lodash"));
        Assert.False(payload["devDependencies"]!.AsObject().ContainsKey("jest"));
        Assert.DoesNotContain(payload["packageClassificationResults"]!["packages"]!.AsArray().OfType<JsonObject>(), p => p.StringValue("name") == "lodash");
        Assert.DoesNotContain(payload["packageVersionRecommendationResults"]!["accepted"]!.AsArray().OfType<JsonObject>(), p => p.StringValue("packageName") == "jest");
    }

    private static AngularCriticalDependencyAlignmentPlanner Planner(IAiService ai) => new(ai, new PromptLoader());
    private static AiConfig Config() => new() { UseAi = true, Provider = "codex" };

    private static JsonObject PackageJson(string typescriptVersion) => new()
    {
        ["dependencies"] = new JsonObject { ["@angular/core"] = "^13.3.0" },
        ["devDependencies"] = new JsonObject { ["@angular/compiler-cli"] = "^13.1.3", ["@angular-devkit/build-angular"] = "^13.3.11", ["typescript"] = typescriptVersion }
    };

    private static JsonObject Angular18PackageJson() => new()
    {
        ["dependencies"] = new JsonObject
        {
            ["@angular/core"] = "18.2.13",
            ["@angular/localize"] = "18.2.13",
            ["@angular/material-moment-adapter"] = "18.2.13",
            ["zone.js"] = "^0.14.10",
            ["rxjs"] = "^7.4.0",
            ["tslib"] = "^2.6.2"
        },
        ["devDependencies"] = new JsonObject
        {
            ["@angular/compiler-cli"] = "18.2.13",
            ["@angular-devkit/build-angular"] = "18.2.12",
            ["typescript"] = "^5.5.2"
        }
    };

    private static JsonObject Angular13PeerMetadata() => new()
    {
        ["@angular/compiler-cli"] = Metadata("13.1.3", ">=4.4.2 <4.6"),
        ["@angular-devkit/build-angular"] = Metadata("13.3.11", ">=4.4.3 <4.7"),
        ["@ngtools/webpack"] = Metadata("13.3.11", ">=4.4.3 <4.7")
    };

    private static JsonObject Metadata(string version, string typescriptRange) => new()
    {
        ["version"] = version,
        ["peerDependencies"] = new JsonObject { ["typescript"] = typescriptRange }
    };

    private static JsonObject Response(params JsonObject[] recommendations) => new()
    {
        ["sourceAngularMajor"] = 13,
        ["targetAngularMajor"] = 13,
        ["recommendations"] = new JsonArray(recommendations.Select(r => (JsonNode?)r).ToArray()),
        ["warnings"] = new JsonArray()
    };

    private static JsonObject Rec(string name, string current, string? recommended, string reason, string action = "align", double confidence = 95, string risk = "low", string section = "devDependencies", string criticality = "required", bool blocksBuild = true) => new()
    {
        ["packageName"] = name,
        ["currentVersion"] = current,
        ["recommendedVersion"] = recommended,
        ["dependencySection"] = section,
        ["action"] = action,
        ["criticality"] = criticality,
        ["confidence"] = confidence,
        ["risk"] = risk,
        ["reason"] = reason,
        ["blocksInstall"] = false,
        ["blocksBuild"] = blocksBuild,
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
