using System.Text.Json.Nodes;
using Q3.MigrationAgent.Adapters.PackageClassification;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Shared.Common;
using Q3.MigrationAgent.Shared.Config;

namespace Q3.MigrationAgent.Tests;

public sealed class PackageClassifierTests
{
    [Fact]
    public void ValidatePackageClassification_Preserves_Unknown_And_ThirdParty_As_Advisory()
    {
        var classifier = new PackageClassifier(new NullAi());
        var plan = new JsonObject
        {
            ["packages"] = new JsonArray(
                Package("ngx-spinner", "third-party-angular-library", "suggest-compatible-upgrade", blocking: true),
                Package("unknown-widget", "unknown", "defer-until-failure", blocking: true)),
            ["blockers"] = new JsonArray(
                new JsonObject { ["package"] = "ngx-spinner", ["reason"] = "peer warning" },
                new JsonObject { ["package"] = "unknown-widget", ["reason"] = "unknown compatibility" }),
            ["warnings"] = new JsonArray(),
            ["suggestedUpgrades"] = new JsonArray()
        };

        var result = classifier.ValidatePackageClassification(plan, ["ngx-spinner", "unknown-widget"]);

        Assert.Empty(result["blockers"]!.AsArray());
        Assert.Contains(result["packages"]!.AsArray().OfType<JsonObject>(), p => p.StringValue("name") == "ngx-spinner" && p.BoolValue("blocking") == false);
        Assert.Contains(result["packages"]!.AsArray().OfType<JsonObject>(), p => p.StringValue("name") == "unknown-widget" && p.BoolValue("blocking") == false);
    }

    [Fact]
    public void ValidatePackageClassification_Rejects_Invalid_Enum_Without_Inventing_Fallback()
    {
        var classifier = new PackageClassifier(new NullAi());
        var plan = new JsonObject
        {
            ["packages"] = new JsonArray(Package("ngx-spinner", "third-party-angular-library", "upgrade | preserve")),
            ["blockers"] = new JsonArray(),
            ["warnings"] = new JsonArray(),
            ["suggestedUpgrades"] = new JsonArray()
        };

        var result = classifier.ValidatePackageClassification(plan, ["ngx-spinner"]);

        Assert.Empty(result["packages"]!.AsArray());
        Assert.Contains(result["warnings"]!.AsArray().Select(w => w?.ToString() ?? ""), w => w.Contains("action 'upgrade | preserve' is not allowlisted"));
    }

    private static JsonObject Package(string name, string role, string action, bool blocking = false) => new()
    {
        ["package"] = name,
        ["role"] = role,
        ["recommendedAction"] = action,
        ["reason"] = "test",
        ["confidence"] = "high",
        ["blocking"] = blocking
    };

    private sealed class NullAi : IAiService
    {
        public Task<JsonObject?> AskAsync(AiConfig config, string system, string user, CancellationToken cancellationToken = default) => Task.FromResult<JsonObject?>(null);
    }
}
