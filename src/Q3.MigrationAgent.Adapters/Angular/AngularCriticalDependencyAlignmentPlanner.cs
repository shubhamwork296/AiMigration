using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Q3.MigrationAgent.Adapters.PackageClassification;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Shared.Common;
using Q3.MigrationAgent.Shared.Config;
using Q3.MigrationAgent.Shared.DTO;

namespace Q3.MigrationAgent.Adapters.Angular;

public sealed class AngularCriticalDependencyAlignmentPlanner(IAiService ai, IPromptLoader promptLoader)
{
    private static readonly HashSet<string> Actions = ["align", "preserve", "add", "remove", "manualReview"];
    private static readonly HashSet<string> Criticalities = ["required", "recommended", "advisory", "unknown"];
    private static readonly HashSet<string> Risks = ["low", "medium", "high"];
    private static readonly HashSet<string> Sections = ["dependencies", "devDependencies"];
    private static readonly HashSet<string> RuntimeSupportPackages = ["rxjs", "zone.js", "tslib"];
    private static readonly HashSet<string> AngularOwned = AngularCriticalDependencyPolicy.CriticalPackages
        .Where(AngularCriticalDependencyPolicy.IsAngularOwnedPackage)
        .ToHashSet(StringComparer.OrdinalIgnoreCase);
    private static readonly string[] TypeScriptPeerPackages = ["@angular/compiler-cli", "@angular-devkit/build-angular", "@ngtools/webpack"];

    public async Task<JsonObject> RecommendAsync(
        AiConfig aiConfig,
        MigrationHop hop,
        JsonObject packageJson,
        JsonObject? classification = null,
        JsonObject? packageVersionRecommendations = null,
        JsonObject? installFailureContext = null,
        JsonObject? buildFailureContext = null,
        JsonObject? npmLsProblemContext = null,
        JsonObject? localPackageMetadata = null,
        CancellationToken cancellationToken = default)
    {
        var direct = DirectPackageMap(packageJson);
        var payload = new JsonObject
        {
            ["sourceAngularMajor"] = hop.FromVersion,
            ["targetAngularMajor"] = hop.ToVersion,
            ["dependencies"] = packageJson["dependencies"]?.DeepClone() ?? new JsonObject(),
            ["devDependencies"] = packageJson["devDependencies"]?.DeepClone() ?? new JsonObject(),
            ["detectedAngularPackageVersions"] = CriticalVersions(direct, p => p.StartsWith("@angular/", StringComparison.OrdinalIgnoreCase) || p.StartsWith("@angular-devkit/", StringComparison.OrdinalIgnoreCase)),
            ["detectedTypeScriptVersion"] = direct.GetValueOrDefault("typescript").Version,
            ["detectedRxJSVersion"] = direct.GetValueOrDefault("rxjs").Version,
            ["detectedZoneJsVersion"] = direct.GetValueOrDefault("zone.js").Version,
            ["detectedAngularCliBuildToolingVersions"] = CriticalVersions(direct, p => p is "@angular/cli" or "@angular/compiler-cli" or "@angular-devkit/build-angular"),
            ["packageClassificationResults"] = classification?.DeepClone() ?? new JsonObject(),
            ["packageVersionRecommendationResults"] = packageVersionRecommendations?.DeepClone() ?? new JsonObject(),
            ["installFailureContext"] = installFailureContext?.DeepClone() ?? new JsonObject(),
            ["buildFailureContext"] = buildFailureContext?.DeepClone() ?? new JsonObject(),
            ["npmLsProblemOutput"] = npmLsProblemContext?.DeepClone() ?? new JsonObject(),
            ["localPackageMetadata"] = localPackageMetadata?.DeepClone() ?? new JsonObject(),
            ["angularTypeScriptPeerRanges"] = TypeScriptPeerRangeEvidence(localPackageMetadata, npmLsProblemContext).ToJson(),
            ["frameworkCriticalPackagesInPackageJson"] = new JsonArray(direct.Where(kvp => IsFrameworkCritical(kvp.Key)).Select(kvp => (JsonNode?)new JsonObject { ["packageName"] = kvp.Key, ["currentVersion"] = kvp.Value.Version, ["dependencySection"] = kvp.Value.Section }).ToArray()),
            ["requiredResponseShape"] = new JsonObject { ["sourceAngularMajor"] = hop.FromVersion, ["targetAngularMajor"] = hop.ToVersion, ["recommendations"] = new JsonArray(), ["warnings"] = new JsonArray() }
        };

        try
        {
            var response = await ai.AskAsync(aiConfig, promptLoader.Load("angular/angular-critical-dependency-alignment"), payload.ToJsonString(JsonHelpers.SerializerOptions), cancellationToken);
            return Validate(response, hop.ToVersion, direct, TypeScriptPeerRangeEvidence(localPackageMetadata, npmLsProblemContext));
        }
        catch (Exception ex)
        {
            return Fallback($"AI critical dependency alignment unavailable: {ex.Message}", packageJson, hop.ToVersion);
        }
    }

    public static JsonObject Validate(JsonObject? response, int targetAngularMajor, IReadOnlyDictionary<string, (string Version, string Section)> directPackages, TypeScriptPeerEvidence? typeScriptPeerEvidence = null)
    {
        if (response?["recommendations"] is not JsonArray recommendations) return Fallback("AI critical dependency alignment response was missing recommendations.", directPackages, targetAngularMajor);
        typeScriptPeerEvidence ??= TypeScriptPeerEvidence.Empty;
        var accepted = new JsonArray();
        var rejected = new JsonArray();
        var manual = new JsonArray();

        foreach (var item in recommendations.OfType<JsonObject>())
        {
            var validation = ValidateRecommendation(item, targetAngularMajor, directPackages, typeScriptPeerEvidence);
            var clone = NormalizeRecommendation(item);
            if (validation.Accepted)
            {
                clone["accepted"] = true;
                if (string.IsNullOrWhiteSpace(clone.StringValue("dependencySection")) && directPackages.TryGetValue(clone.StringValue("packageName"), out var direct)) clone["dependencySection"] = direct.Section;
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

        AddDeterministicTypeScriptPeerCorrection(directPackages, typeScriptPeerEvidence, accepted);
        AddDeterministicBlockers(directPackages, targetAngularMajor, accepted, manual, typeScriptPeerEvidence);
        return new JsonObject { ["attempted"] = true, ["fallbackUsed"] = false, ["accepted"] = accepted, ["rejected"] = rejected, ["manualReview"] = manual, ["warnings"] = response["warnings"]?.DeepClone() ?? new JsonArray() };
    }

    private static (bool Accepted, string Reason) ValidateRecommendation(JsonObject item, int targetAngularMajor, IReadOnlyDictionary<string, (string Version, string Section)> directPackages, TypeScriptPeerEvidence typeScriptPeerEvidence)
    {
        var name = RecommendationPackageName(item);
        var action = item.StringValue("action");
        var section = RecommendationSection(item);
        var recommended = RecommendationTargetVersion(item);
        var criticality = item.StringValue("criticality");
        var risk = item.StringValue("risk");
        var reason = item.StringValue("reason");
        var confidence = NormalizeConfidence(DoubleValue(item, "confidence", 0));

        if (!IsFrameworkCritical(name)) return (false, "Package is not framework-critical or directly relevant to Angular build/install/test compatibility.");
        if (!Actions.Contains(action)) return (false, "Recommendation action is not allowlisted.");
        if (!Criticalities.Contains(criticality)) return (false, "Recommendation criticality is not allowlisted.");
        if (!Risks.Contains(risk)) return (false, "Recommendation risk is not allowlisted.");
        if (!Sections.Contains(section)) return (false, "Dependency section is not dependencies or devDependencies.");
        if (action is "align" or "add")
        {
            if (string.IsNullOrWhiteSpace(recommended)) return (false, "Align/add recommendation requires recommendedVersion.");
            if (!NpmVersionRange.IsSafe(recommended)) return (false, "Recommended version is not a safe bounded npm semver range.");
        }
        if (AngularOwned.Contains(name) && action is "align" or "add" && MajorVersion(recommended) < targetAngularMajor) return (false, "Angular-owned package recommendation is below the target hop major.");
        if (name == "typescript" && action is "align" or "add" && typeScriptPeerEvidence.HasIntersection && !typeScriptPeerEvidence.Contains(recommended)) return (false, $"TypeScript recommendation is outside the Angular tooling peer dependency intersection {typeScriptPeerEvidence.IntersectionText}.");
        if (name == "typescript" && action is "align" or "add" && !AngularCriticalDependencyPolicy.IsSupportedTypeScriptForTarget(recommended, targetAngularMajor)) return (false, "TypeScript recommendation is incompatible with the target Angular major.");
        if (action is "align" or "add" && !AngularCriticalDependencyPolicy.IsSafeCriticalAlignment(name, recommended, targetAngularMajor)) return (false, "Recommended version is not safe for Angular critical dependency alignment.");
        if (confidence < 60) return (false, "Critical dependency recommendation confidence is below 60.");
        if (risk == "high" && !(BlocksKnownFailure(item) && ReasonReferencesSpecificCompatibility(name, reason))) return (false, "High-risk critical dependency recommendation requires manual review.");
        if (confidence < 80 && !ReasonReferencesSpecificCompatibility(name, reason)) return (false, "Medium-confidence recommendation must explicitly reference Angular compatibility.");
        if (item.BoolValue("manualReviewRequired") || action == "manualReview") return (false, string.IsNullOrWhiteSpace(reason) ? "AI requested manual review." : reason);
        return (true, "");
    }

    private static JsonObject NormalizeRecommendation(JsonObject item)
    {
        var clone = item.DeepClone().AsObject();
        clone["packageName"] = RecommendationPackageName(item);
        clone["currentVersion"] = item.StringValue("currentVersion", item.StringValue("from"));
        clone["recommendedVersion"] = RecommendationTargetVersion(item);
        clone["dependencySection"] = RecommendationSection(item);
        return clone;
    }

    private static string RecommendationPackageName(JsonObject item) => item.StringValue("packageName", item.StringValue("package"));
    private static string RecommendationTargetVersion(JsonObject item) => item.StringValue("recommendedVersion", item.StringValue("target", item.StringValue("to")));
    private static string RecommendationSection(JsonObject item) => item.StringValue("dependencySection", item.StringValue("section"));
    private static double NormalizeConfidence(double confidence) => confidence is > 0 and <= 1 ? confidence * 100 : confidence;

    private static void AddDeterministicTypeScriptPeerCorrection(IReadOnlyDictionary<string, (string Version, string Section)> directPackages, TypeScriptPeerEvidence typeScriptPeerEvidence, JsonArray accepted)
    {
        if (!typeScriptPeerEvidence.HasIntersection || string.IsNullOrWhiteSpace(typeScriptPeerEvidence.RecommendedVersion)) return;
        if (!directPackages.TryGetValue("typescript", out var ts)) return;
        if (typeScriptPeerEvidence.Contains(ts.Version)) return;
        if (accepted.OfType<JsonObject>().Any(r => r.StringValue("packageName").Equals("typescript", StringComparison.OrdinalIgnoreCase))) return;

        accepted.Add(new JsonObject
        {
            ["packageName"] = "typescript",
            ["currentVersion"] = ts.Version,
            ["recommendedVersion"] = typeScriptPeerEvidence.RecommendedVersion,
            ["dependencySection"] = ts.Section,
            ["action"] = "align",
            ["criticality"] = "required",
            ["confidence"] = 100,
            ["risk"] = "low",
            ["reason"] = $"TypeScript {ts.Version} is outside the Angular tooling peer dependency intersection {typeScriptPeerEvidence.IntersectionText}.",
            ["blocksInstall"] = typeScriptPeerEvidence.NpmLsInvalid,
            ["blocksBuild"] = true,
            ["manualReviewRequired"] = false,
            ["accepted"] = true
        });
    }

    private static void AddDeterministicBlockers(IReadOnlyDictionary<string, (string Version, string Section)> directPackages, int targetAngularMajor, JsonArray accepted, JsonArray manual, TypeScriptPeerEvidence? typeScriptPeerEvidence = null)
    {
        if (!directPackages.TryGetValue("typescript", out var ts)) return;
        if (typeScriptPeerEvidence?.HasIntersection == true && typeScriptPeerEvidence.Contains(ts.Version)) return;
        if (typeScriptPeerEvidence?.HasIntersection != true && AngularCriticalDependencyPolicy.IsSupportedTypeScriptForTarget(ts.Version, targetAngularMajor)) return;
        if (accepted.OfType<JsonObject>().Any(r => r.StringValue("packageName").Equals("typescript", StringComparison.OrdinalIgnoreCase))) return;
        manual.Add(new JsonObject
        {
            ["name"] = "typescript",
            ["reason"] = typeScriptPeerEvidence?.HasIntersection == true
                ? $"TypeScript {ts.Version} is incompatible with Angular tooling peer dependency intersection {typeScriptPeerEvidence.IntersectionText}; critical dependency alignment requires manual review before build."
                : $"TypeScript {ts.Version} is incompatible with Angular {targetAngularMajor}; critical dependency alignment requires manual review before build.",
            ["risk"] = "high"
        });
    }

    private static JsonObject Fallback(string reason, JsonObject packageJson, int targetAngularMajor) => Fallback(reason, DirectPackageMap(packageJson), targetAngularMajor);

    private static JsonObject Fallback(string reason, IReadOnlyDictionary<string, (string Version, string Section)> directPackages, int targetAngularMajor)
    {
        var manual = new JsonArray();
        AddDeterministicBlockers(directPackages, targetAngularMajor, new JsonArray(), manual);
        return new JsonObject { ["attempted"] = true, ["fallbackUsed"] = true, ["accepted"] = new JsonArray(), ["rejected"] = new JsonArray(), ["manualReview"] = manual, ["warnings"] = new JsonArray(reason) };
    }

    public static bool IsFrameworkCritical(string name) => AngularCriticalDependencyPolicy.IsCriticalPackage(name);

    private static Dictionary<string, (string Version, string Section)> DirectPackageMap(JsonObject packageJson)
    {
        var result = new Dictionary<string, (string, string)>(StringComparer.OrdinalIgnoreCase);
        foreach (var section in Sections)
        {
            foreach (var dep in packageJson[section]?.AsObject() ?? []) result[dep.Key] = (dep.Value?.ToString() ?? "", section);
        }
        return result;
    }

    private static JsonObject CriticalVersions(IReadOnlyDictionary<string, (string Version, string Section)> direct, Func<string, bool> predicate)
    {
        var result = new JsonObject();
        foreach (var dep in direct.Where(kvp => predicate(kvp.Key))) result[dep.Key] = dep.Value.Version;
        return result;
    }

    public static bool IsTypeScriptCompatibleWithAngular(string version, int targetAngularMajor) =>
        AngularCriticalDependencyPolicy.IsSupportedTypeScriptForTarget(version, targetAngularMajor);

    private static TypeScriptPeerEvidence TypeScriptPeerRangeEvidence(JsonObject? localPackageMetadata, JsonObject? npmLsProblemContext)
    {
        var ranges = new List<TypeScriptPeerRange>();
        if (localPackageMetadata is not null)
        {
            foreach (var package in TypeScriptPeerPackages)
            {
                var range = localPackageMetadata[package]?["peerDependencies"]?["typescript"]?.ToString();
                var version = localPackageMetadata[package]?.AsObject().StringValue("version");
                AddRange(ranges, package, version, range, "localPackageMetadata");
            }
        }

        var npmLsText = $"{npmLsProblemContext?["stdout"]}\n{npmLsProblemContext?["stderr"]}";
        var npmLsInvalid = npmLsProblemContext?.IntValue("returncode") != 0 && npmLsText.Contains("invalid", StringComparison.OrdinalIgnoreCase);
        foreach (Match match in Regex.Matches(npmLsText, @"(?<range>>=?\s*\d+(?:\.\d+){0,2}\s+<?=?\s*\d+(?:\.\d+){0,2})[""']?\s+from\s+(?<package>@angular/compiler-cli|@angular-devkit/build-angular|@ngtools/webpack)@(?<version>[^\s]+)", RegexOptions.IgnoreCase))
        {
            AddRange(ranges, match.Groups["package"].Value, match.Groups["version"].Value, NormalizeRange(match.Groups["range"].Value), "npmLs");
        }
        foreach (Match match in Regex.Matches(npmLsText, @"(?<package>@angular/compiler-cli|@angular-devkit/build-angular|@ngtools/webpack)@(?<version>[^\s]+)\s+requires\s+TypeScript\s+(?<range>>=?\s*\d+(?:\.\d+){0,2}\s+<?=?\s*\d+(?:\.\d+){0,2})", RegexOptions.IgnoreCase))
        {
            AddRange(ranges, match.Groups["package"].Value, match.Groups["version"].Value, NormalizeRange(match.Groups["range"].Value), "npmLs");
        }

        return TypeScriptPeerEvidence.Create(ranges, npmLsInvalid);
    }

    private static void AddRange(List<TypeScriptPeerRange> ranges, string package, string? packageVersion, string? range, string source)
    {
        if (string.IsNullOrWhiteSpace(range) || ranges.Any(r => r.Package.Equals(package, StringComparison.OrdinalIgnoreCase) && r.Range == range)) return;
        var parsed = VersionRange.TryParse(range);
        if (parsed is null) return;
        ranges.Add(new TypeScriptPeerRange(package, packageVersion ?? "", range, source, parsed));
    }

    private static string NormalizeRange(string range) => Regex.Replace(range, @"\s+", " ").Trim();

    private static bool BlocksKnownFailure(JsonObject item) => item.BoolValue("blocksBuild") || item.BoolValue("blocksInstall");
    private static bool ReasonReferencesSpecificCompatibility(string packageName, string reason)
    {
        if (!reason.Contains("Angular", StringComparison.OrdinalIgnoreCase)) return false;
        if (reason.Contains("TypeScript", StringComparison.OrdinalIgnoreCase) ||
            reason.Contains("compiler", StringComparison.OrdinalIgnoreCase) ||
            reason.Contains("peer", StringComparison.OrdinalIgnoreCase) ||
            reason.Contains("build", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return RuntimeSupportPackages.Contains(packageName) &&
               (reason.Contains(packageName, StringComparison.OrdinalIgnoreCase) ||
                reason.Contains("runtime", StringComparison.OrdinalIgnoreCase) ||
                reason.Contains("compatib", StringComparison.OrdinalIgnoreCase) ||
                reason.Contains("requires", StringComparison.OrdinalIgnoreCase));
    }
    private static int? MajorVersion(string value) => Regex.Match(value, @"\d+") is { Success: true } m ? int.Parse(m.Value) : null;
    private static int[]? VersionTuple(string? version) => Regex.Match(version ?? "", @"(\d+)(?:\.(\d+))?(?:\.(\d+))?") is { Success: true } m ? m.Groups.Values.Skip(1).Where(g => g.Success).Select(g => int.Parse(g.Value)).ToArray() : null;
    private static int Compare(int[] left, int[] right) { for (var i = 0; i < Math.Max(left.Length, right.Length); i++) { var l = i < left.Length ? left[i] : 0; var r = i < right.Length ? right[i] : 0; if (l != r) return l.CompareTo(r); } return 0; }

    private static double DoubleValue(JsonObject obj, string name, double defaultValue)
    {
        if (!obj.TryGetPropertyValue(name, out var value) || value is null) return defaultValue;
        return value.GetValueKind() == JsonValueKind.Number && value.AsValue().TryGetValue<double>(out var number) ? number : double.TryParse(value.ToString(), out number) ? number : defaultValue;
    }

    public sealed record TypeScriptPeerRange(string Package, string PackageVersion, string Range, string Source, VersionRange Parsed);

    public sealed record TypeScriptPeerEvidence(IReadOnlyList<TypeScriptPeerRange> Ranges, VersionRange? Intersection, bool NpmLsInvalid)
    {
        public static TypeScriptPeerEvidence Empty { get; } = new([], null, false);
        public bool HasIntersection => Intersection is not null && Ranges.Count > 0;
        public string IntersectionText => Intersection?.ToString() ?? "";
        public string RecommendedVersion => Intersection?.RecommendedTypeScriptVersion() ?? "";
        public bool Contains(string version) => Intersection?.Contains(version) == true;

        public static TypeScriptPeerEvidence Create(IReadOnlyList<TypeScriptPeerRange> ranges, bool npmLsInvalid)
        {
            VersionRange? intersection = null;
            foreach (var range in ranges)
            {
                intersection = intersection is null ? range.Parsed : intersection.Intersect(range.Parsed);
                if (intersection is null) break;
            }
            return new TypeScriptPeerEvidence(ranges, intersection, npmLsInvalid);
        }

        public JsonObject ToJson() => new()
        {
            ["ranges"] = new JsonArray(Ranges.Select(r => (JsonNode?)new JsonObject { ["packageName"] = r.Package, ["packageVersion"] = r.PackageVersion, ["typescriptPeerRange"] = r.Range, ["source"] = r.Source }).ToArray()),
            ["intersection"] = IntersectionText,
            ["recommendedVersionFromIntersection"] = RecommendedVersion,
            ["npmLsInvalid"] = NpmLsInvalid
        };
    }

    public sealed record VersionRange(int[]? MinVersion, bool MinInclusive, int[]? MaxVersion, bool MaxInclusive)
    {
        public static VersionRange? TryParse(string range)
        {
            int[]? min = null;
            int[]? max = null;
            var minInclusive = true;
            var maxInclusive = true;
            foreach (Match match in Regex.Matches(range, @"(?<op>>=|>|<=|<)\s*(?<version>\d+(?:\.\d+){0,2})"))
            {
                var version = VersionTuple(match.Groups["version"].Value);
                if (version is null) continue;
                switch (match.Groups["op"].Value)
                {
                    case ">=":
                    case ">":
                        if (min is null || Compare(version, min) > 0 || Compare(version, min) == 0 && match.Groups["op"].Value == ">" && minInclusive)
                        {
                            min = version;
                            minInclusive = match.Groups["op"].Value == ">=";
                        }
                        break;
                    case "<=":
                    case "<":
                        if (max is null || Compare(version, max) < 0 || Compare(version, max) == 0 && match.Groups["op"].Value == "<" && maxInclusive)
                        {
                            max = version;
                            maxInclusive = match.Groups["op"].Value == "<=";
                        }
                        break;
                }
            }
            return min is null && max is null ? null : new VersionRange(min, minInclusive, max, maxInclusive);
        }

        public VersionRange? Intersect(VersionRange other)
        {
            var min = MinVersion;
            var minInclusive = MinInclusive;
            if (other.MinVersion is not null && (min is null || Compare(other.MinVersion, min) > 0 || Compare(other.MinVersion, min) == 0 && !other.MinInclusive))
            {
                min = other.MinVersion;
                minInclusive = other.MinInclusive;
            }

            var max = MaxVersion;
            var maxInclusive = MaxInclusive;
            if (other.MaxVersion is not null && (max is null || Compare(other.MaxVersion, max) < 0 || Compare(other.MaxVersion, max) == 0 && !other.MaxInclusive))
            {
                max = other.MaxVersion;
                maxInclusive = other.MaxInclusive;
            }

            if (min is not null && max is not null)
            {
                var cmp = Compare(min, max);
                if (cmp > 0 || cmp == 0 && (!minInclusive || !maxInclusive)) return null;
            }
            return new VersionRange(min, minInclusive, max, maxInclusive);
        }

        public bool Contains(string version)
        {
            var tuple = VersionTuple(version);
            if (tuple is null) return false;
            if (MinVersion is not null)
            {
                var cmp = Compare(tuple, MinVersion);
                if (cmp < 0 || cmp == 0 && !MinInclusive) return false;
            }
            if (MaxVersion is not null)
            {
                var cmp = Compare(tuple, MaxVersion);
                if (cmp > 0 || cmp == 0 && !MaxInclusive) return false;
            }
            return true;
        }

        public string RecommendedTypeScriptVersion()
        {
            if (MaxVersion is null) return "";
            var major = MaxVersion.ElementAtOrDefault(0);
            var minor = MaxVersion.ElementAtOrDefault(1);
            var patch = MaxVersion.ElementAtOrDefault(2);
            if (!MaxInclusive)
            {
                if (patch > 0) patch--;
                else if (minor > 0)
                {
                    minor--;
                    patch = 5;
                }
                else return "";
            }
            var candidate = $"~{major}.{minor}.{patch}";
            return Contains(candidate) ? candidate : "";
        }

        public override string ToString()
        {
            var parts = new List<string>();
            if (MinVersion is not null) parts.Add($"{(MinInclusive ? ">=" : ">")}{string.Join('.', MinVersion)}");
            if (MaxVersion is not null) parts.Add($"{(MaxInclusive ? "<=" : "<")}{string.Join('.', MaxVersion)}");
            return string.Join(' ', parts);
        }
    }
}
