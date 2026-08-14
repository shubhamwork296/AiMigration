using System.Text.Json.Nodes;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Adapters.PackageClassification;
using Q3.MigrationAgent.Shared.Common;
using Q3.MigrationAgent.Shared.Config;
using Q3.MigrationAgent.Shared.DTO;

namespace Q3.MigrationAgent.Adapters.Angular;

public sealed class AngularPackageVersionRecommendationPlanner(IAiService ai, IPromptLoader promptLoader)
{
    private const double MinimumRecommendationConfidence = 30;
    private const double MinimumNonAngularRecommendationConfidence = 30;

    private static readonly HashSet<string> Actions = ["upgrade", "preserve", "remove", "manualReview"];
    private static readonly HashSet<string> Risks = ["low", "medium", "high"];
    private static readonly HashSet<string> Impacts = ["required", "advisory", "none", "unknown"];

    public async Task<JsonObject> RecommendAsync(
        AiConfig aiConfig,
        MigrationHop hop,
        JsonObject packageJson,
        IReadOnlyList<JsonObject> packageDecisions,
        IReadOnlyDictionary<string, string> defaultTargets,
        JsonObject? installFailureContext = null,
        JsonObject? peerConflictContext = null,
        CancellationToken cancellationToken = default)
    {
        var directPackages = DirectPackageMap(packageJson);
        var payload = new JsonObject
        {
            ["currentAngularMajor"] = hop.FromVersion,
            ["targetAngularMajor"] = hop.ToVersion,
            ["targetAngularHop"] = $"{hop.FromVersion}->{hop.ToVersion}",
            ["currentAngularPackageVersions"] = AngularPackageVersions(packageJson),
            ["packages"] = new JsonArray(packageDecisions.Select(d => (JsonNode?)PackagePayload(d, directPackages, defaultTargets)).Where(n => n is not null).ToArray()),
            ["installFailureContext"] = installFailureContext?.DeepClone() ?? new JsonObject(),
            ["peerDependencyConflictContext"] = peerConflictContext?.DeepClone() ?? new JsonObject(),
            ["requiredResponseShape"] = new JsonObject
            {
                ["targetAngularMajor"] = hop.ToVersion,
                ["recommendations"] = new JsonArray(),
                ["warnings"] = new JsonArray()
            }
        };

        try
        {
            var response = await ai.AskAsync(aiConfig, promptLoader.Load("angular/angular-package-version-recommendation"), payload.ToJsonString(JsonHelpers.SerializerOptions), cancellationToken);
            return Validate(response, hop.ToVersion, directPackages, packageDecisions, defaultTargets);
        }
        catch (Exception ex)
        {
            return Fallback($"AI package version recommendation unavailable: {ex.Message}");
        }
    }

    public async Task<JsonObject?> RecommendAlternativeAsync(
        AiConfig aiConfig,
        MigrationHop hop,
        JsonObject packageJson,
        JsonObject failedRecommendation,
        string npmError,
        CancellationToken cancellationToken = default)
    {
        var packageName = failedRecommendation.StringValue("packageName");
        var currentVersion = failedRecommendation.StringValue("currentVersion");
        var recommendedVersion = failedRecommendation.StringValue("recommendedVersion");
        var payload = new JsonObject
        {
            ["targetAngularMajor"] = hop.ToVersion,
            ["failedRecommendation"] = failedRecommendation.DeepClone(),
            ["npmVerificationFailure"] = new JsonObject
            {
                ["packageName"] = packageName,
                ["recommendedVersion"] = recommendedVersion,
                ["npmError"] = npmError
            },
            ["instruction"] = $"The recommended version {packageName}@{recommendedVersion} does not exist. npm returned E404. Recommend a valid Angular {hop.ToVersion}-compatible version. Do not assume all Angular packages share the same patch version.",
            ["packageJson"] = packageJson.DeepClone(),
            ["requiredResponseShape"] = new JsonObject
            {
                ["targetAngularMajor"] = hop.ToVersion,
                ["recommendations"] = new JsonArray(new JsonObject
                {
                    ["packageName"] = packageName,
                    ["currentVersion"] = currentVersion,
                    ["recommendedVersion"] = "version-range",
                    ["action"] = "upgrade",
                    ["confidence"] = 90,
                    ["risk"] = "low",
                    ["reason"] = "short specific Angular compatibility reason",
                    ["installImpact"] = "required",
                    ["buildImpact"] = "required",
                    ["manualReviewRequired"] = false
                }),
                ["warnings"] = new JsonArray()
            }
        };

        try
        {
            var response = await ai.AskAsync(aiConfig, promptLoader.Load("angular/angular-package-version-recommendation"), payload.ToJsonString(JsonHelpers.SerializerOptions), cancellationToken);
            if (response?["recommendations"] is not JsonArray recommendations) return null;
            var alternative = recommendations.OfType<JsonObject>().FirstOrDefault(r => RecommendationPackageName(r).Equals(packageName, StringComparison.OrdinalIgnoreCase));
            if (alternative is null) return null;
            var directPackages = DirectPackageMap(packageJson);
            var validation = ValidateRecommendation(alternative, hop.ToVersion, directPackages, new Dictionary<string, JsonObject>(StringComparer.OrdinalIgnoreCase), new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase));
            if (!validation.Accepted) return null;
            var clone = NormalizeRecommendation(alternative);
            clone["accepted"] = true;
            clone["section"] = directPackages[packageName].Section;
            clone["aiReRecommendation"] = true;
            return clone;
        }
        catch
        {
            return null;
        }
    }

    private static JsonObject? PackagePayload(JsonObject decision, IReadOnlyDictionary<string, (string Version, string Section)> directPackages, IReadOnlyDictionary<string, string> defaultTargets)
    {
        var name = decision.StringValue("name");
        if (!directPackages.TryGetValue(name, out var direct)) return null;
        return new JsonObject
        {
            ["packageName"] = name,
            ["currentVersion"] = direct.Version,
            ["section"] = direct.Section,
            ["classification"] = decision.StringValue("category"),
            ["plannedAction"] = decision.StringValue("action"),
            ["plannedTargetVersion"] = SuggestedTargetVersion(decision),
            ["defaultTargetVersion"] = defaultTargets.GetValueOrDefault(name)
        };
    }

    private static string SuggestedTargetVersion(JsonObject item) =>
        item.StringValue("targetVersion", item.StringValue("toVersion", item.StringValue("recommendedVersion")));

    private static JsonObject Validate(JsonObject? response, int targetAngularMajor, IReadOnlyDictionary<string, (string Version, string Section)> directPackages, IReadOnlyList<JsonObject> packageDecisions, IReadOnlyDictionary<string, string> defaultTargets)
    {
        if (response?["recommendations"] is not JsonArray recommendations) return Fallback("AI package version recommendation response was missing recommendations.");
        var accepted = new JsonArray();
        var rejected = new JsonArray();
        var manual = new JsonArray();
        var byName = packageDecisions.ToDictionary(d => d.StringValue("name"), StringComparer.OrdinalIgnoreCase);

        foreach (var item in recommendations.OfType<JsonObject>())
        {
            var validation = ValidateRecommendation(item, targetAngularMajor, directPackages, byName, defaultTargets);
            var clone = NormalizeRecommendation(item);
            if (validation.Accepted)
            {
                clone["accepted"] = true;
                clone["section"] = directPackages[clone.StringValue("packageName")].Section;
                accepted.Add(clone);
            }
            else
            {
                clone["accepted"] = false;
                clone["rejectionReason"] = validation.Reason;
                rejected.Add(clone);
                manual.Add(new JsonObject { ["name"] = clone.StringValue("packageName", "unknown"), ["reason"] = validation.Reason, ["risk"] = clone.StringValue("risk", "medium") });
            }
        }

        return new JsonObject
        {
            ["attempted"] = true,
            ["fallbackUsed"] = false,
            ["accepted"] = accepted,
            ["rejected"] = rejected,
            ["manualReview"] = manual,
            ["warnings"] = response["warnings"]?.DeepClone() ?? new JsonArray()
        };
    }

    private static (bool Accepted, string Reason) ValidateRecommendation(JsonObject item, int targetAngularMajor, IReadOnlyDictionary<string, (string Version, string Section)> directPackages, IReadOnlyDictionary<string, JsonObject> packageDecisions, IReadOnlyDictionary<string, string> defaultTargets)
    {
        var name = RecommendationPackageName(item);
        var action = item.StringValue("action");
        var risk = item.StringValue("risk");
        var installImpact = item.StringValue("installImpact");
        var buildImpact = item.StringValue("buildImpact");
        var recommended = RecommendationTargetVersion(item);
        var confidence = NormalizeConfidence(DoubleValue(item, "confidence", 0));
        var angularOwned = AngularCriticalDependencyPolicy.IsAngularOwnedPackage(name);
        var validationDriven = item.BoolValue("validationDriven");
        var criticalAlignment = AngularCriticalDependencyPolicy.IsSafeCriticalAlignment(name, recommended, targetAngularMajor);

        if (!directPackages.ContainsKey(name)) return (false, "Package is not a direct dependency in package.json.");
        if (!Actions.Contains(action)) return (false, "Recommendation action is not allowlisted.");
        if (!Risks.Contains(risk)) return (false, "Recommendation risk is not allowlisted.");
        if (!Impacts.Contains(installImpact) || !Impacts.Contains(buildImpact)) return (false, "Recommendation impact is not allowlisted.");
        if (item.BoolValue("manualReviewRequired") || action == "manualReview") return (false, item.StringValue("reason", "AI requested manual review."));
        if (risk == "high" && !criticalAlignment) return (false, "High-risk package version recommendation requires manual review.");
        if (confidence < MinimumRecommendationConfidence) return (false, $"Package version recommendation confidence is below {MinimumRecommendationConfidence}.");
        if (confidence < MinimumNonAngularRecommendationConfidence && !angularOwned) return (false, $"Non-Angular package version recommendation confidence is below {MinimumNonAngularRecommendationConfidence}.");
        if (action != "upgrade") return (true, "");
        if (!angularOwned && !validationDriven) return (false, "Third-party package upgrades require validationDriven=true after an install/build/test failure.");
        if (string.IsNullOrWhiteSpace(recommended)) return (false, "Upgrade recommendation requires recommendedVersion.");
        if (!NpmVersionRange.IsSafe(recommended)) return (false, "Recommended version is not a safe bounded npm semver range.");
        if (angularOwned && NpmVersionRange.Major(recommended) != targetAngularMajor) return (false, "Angular-owned package recommendation does not match the target Angular major.");
        return (true, "");
    }

    private static JsonObject NormalizeRecommendation(JsonObject item)
    {
        var clone = item.DeepClone().AsObject();
        clone["packageName"] = RecommendationPackageName(item);
        clone["currentVersion"] = RecommendationCurrentVersion(item);
        clone["recommendedVersion"] = RecommendationTargetVersion(item);
        clone["action"] = clone.StringValue("action", "upgrade");
        clone["risk"] = clone.StringValue("risk", "low");
        clone["installImpact"] = clone.StringValue("installImpact", "required");
        clone["buildImpact"] = clone.StringValue("buildImpact", "required");
        clone["manualReviewRequired"] = clone.BoolValue("manualReviewRequired");
        return clone;
    }

    private static string RecommendationPackageName(JsonObject item) => item.StringValue("packageName", item.StringValue("package"));
    private static string RecommendationCurrentVersion(JsonObject item) => item.StringValue("currentVersion", item.StringValue("from"));
    private static string RecommendationTargetVersion(JsonObject item) => item.StringValue("recommendedVersion", item.StringValue("to"));

    private static bool IsAngularOwnedPackageName(string name) => AngularCriticalDependencyPolicy.IsAngularOwnedPackage(name);

    private static Dictionary<string, (string Version, string Section)> DirectPackageMap(JsonObject packageJson)
    {
        var result = new Dictionary<string, (string, string)>(StringComparer.OrdinalIgnoreCase);
        foreach (var section in new[] { "dependencies", "devDependencies" })
        {
            foreach (var dep in packageJson[section]?.AsObject() ?? [])
            {
                result[dep.Key] = (dep.Value?.ToString() ?? "", section);
            }
        }
        return result;
    }

    private static JsonObject AngularPackageVersions(JsonObject packageJson)
    {
        var result = new JsonObject();
        foreach (var dep in DirectPackageMap(packageJson).Where(kvp => kvp.Key.StartsWith("@angular/", StringComparison.OrdinalIgnoreCase) || kvp.Key is "rxjs" or "zone.js" or "tslib" or "typescript"))
        {
            result[dep.Key] = dep.Value.Version;
        }
        return result;
    }

    private static double DoubleValue(JsonObject obj, string name, double defaultValue)
    {
        if (!obj.TryGetPropertyValue(name, out var value) || value is null) return defaultValue;
        return value.GetValueKind() == System.Text.Json.JsonValueKind.Number && value.AsValue().TryGetValue<double>(out var number) ? number : double.TryParse(value.ToString(), out number) ? number : defaultValue;
    }

    private static double NormalizeConfidence(double confidence) => confidence is > 0 and <= 1 ? confidence * 100 : confidence;

    private static JsonObject Fallback(string reason) => new()
    {
        ["attempted"] = true,
        ["fallbackUsed"] = true,
        ["accepted"] = new JsonArray(),
        ["rejected"] = new JsonArray(),
        ["manualReview"] = new JsonArray(),
        ["warnings"] = new JsonArray(reason)
    };
}
