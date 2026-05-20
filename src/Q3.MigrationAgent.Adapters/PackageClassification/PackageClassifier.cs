using System.Text.Json;
using System.Text.Json.Nodes;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Shared.Config;

namespace Q3.MigrationAgent.Adapters.PackageClassification;

public sealed record ClassificationSafety(
    string PreflightRemediationMode = "suggest",
    bool AllowBusinessLogicChanges = false,
    bool DirectDependenciesOnlyPreflight = true,
    bool AvoidFullVersionScans = true);

public sealed class PackageClassifier(IAiService ai)
{
    public static readonly HashSet<string> FrameworkAlignedRoles = ["framework-core", "framework-cli", "framework-compiler", "framework-extension"];
    public static readonly HashSet<string> FrameworkCoupledRoles = ["framework-coupled-ui", "framework-coupled-tooling"];
    private static readonly HashSet<string> ThirdPartyFrameworkRoles = ["third-party-framework-library", "third-party-angular-library"];
    private static readonly HashSet<string> PackageRoles =
    [
        "framework-core", "framework-cli", "framework-compiler", "framework-extension",
        "framework-coupled-ui", "framework-coupled-tooling", "third-party-framework-library",
        "third-party-angular-library", "angular-runtime-support", "runtime-critical", "build-tooling", "test-tooling",
        "unrelated-third-party", "unknown"
    ];
    private static readonly HashSet<string> PackageActions =
    [
        "upgrade-with-framework-target", "upgrade-with-target-major", "suggest-compatible-upgrade",
        "keep-current", "warn-only", "defer-until-failure", "remove-only-if-unused-and-confirmed",
        "investigate-after-install-failure", "investigate-after-build-failure"
    ];

    public async Task<JsonObject> ClassifyPackagesAsync(
        AiConfig? aiConfig,
        string runtime,
        int? currentVersion,
        int targetVersion,
        IReadOnlyList<JsonObject> dependencies,
        IReadOnlyList<JsonObject> devDependencies,
        JsonObject npmMetadata,
        IReadOnlyList<JsonObject>? previousFailures = null,
        CancellationToken cancellationToken = default)
    {
        var payload = new JsonObject
        {
            ["runtime"] = runtime,
            ["currentVersion"] = currentVersion,
            ["targetVersion"] = targetVersion,
            ["dependencies"] = JsonSerializer.SerializeToNode(dependencies),
            ["devDependencies"] = JsonSerializer.SerializeToNode(devDependencies),
            ["npmMetadata"] = npmMetadata.DeepClone(),
            ["previousCommandFailures"] = JsonSerializer.SerializeToNode(previousFailures ?? [])
        };
        if (aiConfig?.UseAi == true)
        {
            var result = await ai.AskAsync(aiConfig, PackageClassifierPrompt, payload.ToJsonString(), cancellationToken);
            if (result is not null) return result;
        }
        return FallbackClassification(runtime, dependencies, devDependencies, npmMetadata);
    }

    public JsonObject ValidatePackageClassification(JsonObject plan, HashSet<string> directPackageNames, ClassificationSafety? safety = null)
    {
        safety ??= new ClassificationSafety();
        var packages = new JsonArray();
        var warnings = new JsonArray(plan["warnings"]?.AsArray()?.Select(w => (JsonNode?)JsonValue.Create(w?.ToString() ?? "")).ToArray() ?? []);
        var blockers = new JsonArray();
        var suggested = new JsonArray();

        foreach (var item in plan["packages"]?.AsArray()?.OfType<JsonObject>() ?? [])
        {
            var name = item["name"]?.ToString()?.Trim() ?? "";
            if (!directPackageNames.Contains(name))
            {
                warnings.Add($"Ignored AI classification for non-direct dependency {(name.Length == 0 ? "<unknown>" : name)}.");
                continue;
            }
            var role = NormalRole(item["role"]?.ToString());
            var action = NormalAction(item["recommendedAction"]?.ToString());
            var blocking = item["blocking"]?.GetValue<bool>() == true;
            if (ThirdPartyFrameworkRoles.Contains(role) || role == "unknown") blocking = false;
            if (action == "remove-only-if-unused-and-confirmed")
            {
                action = "warn-only";
                warnings.Add($"Ignored removal recommendation for {name}; removals require explicit confirmation.");
            }
            if (safety.PreflightRemediationMode != "apply" && ThirdPartyFrameworkRoles.Contains(role))
            {
                if (action is not ("warn-only" or "defer-until-failure" or "investigate-after-install-failure" or "investigate-after-build-failure" or "suggest-compatible-upgrade"))
                {
                    action = "warn-only";
                }
                blocking = false;
            }
            packages.Add(new JsonObject { ["name"] = name, ["role"] = role, ["recommendedAction"] = action, ["reason"] = item["reason"]?.ToString() ?? "No reason provided.", ["confidence"] = NormalizeConfidence(item["confidence"]?.ToString()), ["blocking"] = blocking });
        }

        foreach (var blocker in plan["blockers"]?.AsArray()?.OfType<JsonObject>() ?? [])
        {
            var package = blocker["package"]?.ToString();
            var classified = packages.OfType<JsonObject>().FirstOrDefault(p => p["name"]?.ToString() == package);
            if (classified?["blocking"]?.GetValue<bool>() == true) blockers.Add(blocker.DeepClone());
            else warnings.Add(blocker["reason"]?.ToString() ?? $"{package} is advisory, not a blocker.");
        }

        foreach (var upgrade in plan["suggestedUpgrades"]?.AsArray()?.OfType<JsonObject>() ?? [])
        {
            if (directPackageNames.Contains(upgrade["package"]?.ToString() ?? "")) suggested.Add(upgrade.DeepClone());
        }
        return new JsonObject { ["packages"] = packages, ["blockers"] = blockers, ["warnings"] = warnings, ["suggestedUpgrades"] = suggested };
    }

    private static JsonObject FallbackClassification(string runtime, IReadOnlyList<JsonObject> dependencies, IReadOnlyList<JsonObject> devDependencies, JsonObject npmMetadata)
    {
        var packages = new JsonArray();
        foreach (var dependency in dependencies.Concat(devDependencies))
        {
            var name = dependency["name"]?.ToString() ?? "";
            var section = dependency["section"]?.ToString();
            var peers = npmMetadata[name]?["peerDependencies"]?.AsObject() ?? new JsonObject();
            var role = InferRole(runtime, name, section, peers);
            packages.Add(new JsonObject { ["name"] = name, ["role"] = role, ["recommendedAction"] = ActionForRole(role), ["reason"] = ReasonForRole(runtime, role, peers), ["confidence"] = role is "unknown" or "third-party-framework-library" ? "medium" : "high", ["blocking"] = false });
        }
        return new JsonObject { ["packages"] = packages, ["blockers"] = new JsonArray(), ["warnings"] = new JsonArray(), ["suggestedUpgrades"] = new JsonArray() };
    }

    private static string InferRole(string runtime, string name, string? section, JsonObject peers)
    {
        var scope = $"@{runtime}/";
        if (runtime == "angular" && name == "@angular-devkit/build-angular") return "framework-coupled-tooling";
        if (name == $"@{runtime}/core") return "framework-core";
        if (name == $"@{runtime}/cli") return "framework-cli";
        if (name.Contains("compiler", StringComparison.OrdinalIgnoreCase) && name.StartsWith(scope, StringComparison.OrdinalIgnoreCase)) return "framework-compiler";
        if (name.StartsWith(scope, StringComparison.OrdinalIgnoreCase)) return "framework-extension";
        if (peers.Select(kvp => kvp.Key).Any(peer => peer.StartsWith(scope, StringComparison.OrdinalIgnoreCase))) return "third-party-framework-library";
        if (section == "devDependencies")
        {
            var lowered = name.ToLowerInvariant();
            if (new[] { "test", "jest", "karma", "jasmine", "cypress", "playwright" }.Any(lowered.Contains)) return "test-tooling";
            if (new[] { "typescript", "eslint", "webpack", "builder", "build" }.Any(lowered.Contains)) return "build-tooling";
        }
        if (runtime == "angular" && name is ("rxjs" or "zone.js" or "tslib")) return "angular-runtime-support";
        if (name is "rxjs" or "zone.js") return "runtime-critical";
        return "unrelated-third-party";
    }

    private static string ActionForRole(string role) => FrameworkAlignedRoles.Contains(role) ? "upgrade-with-framework-target" : FrameworkCoupledRoles.Contains(role) ? "upgrade-with-target-major" : ThirdPartyFrameworkRoles.Contains(role) ? "warn-only" : role is "build-tooling" or "runtime-critical" or "angular-runtime-support" ? "suggest-compatible-upgrade" : role == "unknown" ? "defer-until-failure" : "keep-current";
    private static string ReasonForRole(string runtime, string role, JsonObject peers) => FrameworkAlignedRoles.Contains(role) ? $"Package appears to be owned by the {runtime} framework and should align with the target framework version." : ThirdPartyFrameworkRoles.Contains(role) ? "Package declares framework peer dependencies; treat compatibility risk as advisory until install/build fails." : peers.Count > 0 ? "Package declares peer dependencies that may affect migration." : "No framework coupling evidence found in bounded metadata.";
    private static string NormalRole(string? value) => value == "third-party-angular-library" ? "third-party-framework-library" : PackageRoles.Contains(value ?? "") ? value! : "unknown";
    private static string NormalAction(string? value) => PackageActions.Contains(value ?? "") ? value! : "defer-until-failure";
    private static string NormalizeConfidence(string? value) => value is "low" or "medium" or "high" ? value : "medium";

    private const string PackageClassifierPrompt = "You are classifying dependencies for a framework migration. Return strict JSON only. Unknown compatibility is not a blocker. Third-party peer warnings are advisory. Do not recommend latest unconstrained for framework-coupled packages.";
}
