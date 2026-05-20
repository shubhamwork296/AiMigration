using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Shared.Common;
using Q3.MigrationAgent.Shared.Config;

namespace Q3.MigrationAgent.Core.Planning;

public sealed class MigrationPlanner(IAiService ai)
{
    private static readonly HashSet<string> StructuralRoles = ["project_manifest", "dependency_manifest", "build_manifest", "solution_manifest", "lock_file"];
    private static readonly HashSet<string> BlockedRoles = ["source_code", "business_logic", "configuration", "generated_file", "unknown"];
    private static readonly HashSet<string> ChangeTypes = ["framework", "runtime", "dependency", "package", "build_setting", "project_reference", "script", "regenerate_lock_file"];
    private static readonly HashSet<string> DependencyEvidence = ["manifest", "dependency-family", "validation", "target-framework", "target-runtime", "restore-error", "build-error", "NU1605"];

    public async Task<IReadOnlyList<JsonObject>> BuildMigrationPlanAsync(JsonObject analysis, JsonObject rules, AiConfig aiConfig, CancellationToken cancellationToken = default)
    {
        var normalizedRules = NormalizeDependencyRules(rules);
        StoreStructureClassification(analysis, FallbackStructureClassification(analysis));
        var deterministic = BuildChangePlan(analysis, normalizedRules);
        var aiPlan = await ai.AskAsync(aiConfig, BuildPlanningPrompt(), new JsonObject
        {
            ["rules"] = normalizedRules.DeepClone(),
            ["analysis"] = analysis.DeepClone(),
            ["deterministicPlan"] = JsonSerializer.SerializeToNode(deterministic),
            ["requiredResponseShape"] = new JsonObject { ["plan"] = new JsonArray(), ["planningSummary"] = "short summary of why these structural changes are needed" }
        }.ToJsonString(JsonHelpers.SerializerOptions), cancellationToken);
        if (aiPlan is null)
        {
            analysis["planningMode"] = "rule-based";
            return deterministic;
        }
        var validated = ValidateAiPlan(aiPlan["plan"], analysis, normalizedRules);
        if (validated.Count == 0)
        {
            analysis["planningMode"] = "rule-based";
            analysis["planningNotes"] = "AI planner returned no executable structural changes; used deterministic plan.";
            return deterministic;
        }
        analysis["planningMode"] = aiConfig.Provider ?? "ai";
        analysis["planningNotes"] = aiPlan.StringValue("planningSummary");
        return MergePlans(validated, deterministic);
    }

    public IReadOnlyList<JsonObject> BuildChangePlan(JsonObject analysis, JsonObject rules)
    {
        var normalizedRules = NormalizeDependencyRules(rules);
        EnsureStructureClassification(analysis);
        var plan = new List<JsonObject>();
        var targetRule = normalizedRules["targetFrameworkChange"]?.AsObject();
        if (targetRule is not null)
        {
            foreach (var file in StructuralFiles(analysis).Where(f => IsAllowedStructuralTarget(f, analysis, "framework")))
            {
                plan.Add(new JsonObject
                {
                    ["type"] = "framework",
                    ["priority"] = 1,
                    ["source"] = "rule",
                    ["file"] = file,
                    ["find"] = targetRule.StringValue("from"),
                    ["replace"] = targetRule.StringValue("to"),
                    ["description"] = $"Update target framework {targetRule.StringValue("from")} to {targetRule.StringValue("to")}."
                });
            }
        }
        var manifestDependencies = ManifestDependencyVersions(analysis);
        foreach (var dependency in normalizedRules["dependencyChanges"]?.AsArray()?.OfType<JsonObject>() ?? [])
        {
            var name = dependency.StringValue("name");
            if (manifestDependencies.Count > 0 && !manifestDependencies.ContainsKey(name)) continue;
            var manifestDependency = manifestDependencies.GetValueOrDefault(name, new JsonObject());
            var sourceFile = dependency.StringValue("sourceFile", manifestDependency.StringValue("sourceFile"));
            if (!string.IsNullOrWhiteSpace(sourceFile) && !IsAllowedStructuralTarget(sourceFile, analysis, "dependency")) continue;
            var item = dependency.DeepClone().AsObject();
            item["type"] = "dependency";
            item["priority"] = 2;
            item["sourceFile"] = sourceFile;
            item["manager"] = dependency.StringValue("manager", manifestDependency.StringValue("manager", "unknown"));
            item["ecosystem"] = dependency.StringValue("ecosystem", manifestDependency.StringValue("ecosystem", "unknown"));
            item["source"] = "rule";
            item["description"] = $"Upgrade {name} to {dependency.StringValue("toVersion")}.";
            plan.Add(item);
        }
        return SortPlan(plan);
    }

    public JsonObject NormalizeDependencyRules(JsonObject rules)
    {
        var normalized = rules.DeepClone().AsObject();
        if (normalized["dependencyChanges"] is null && normalized["packageChanges"] is JsonArray packages)
        {
            normalized["dependencyChanges"] = new JsonArray(packages.OfType<JsonObject>().Select(p => NormalizeDependencyChangeInput(p, "rule")).ToArray<JsonNode?>());
        }
        else if (normalized["dependencyChanges"] is JsonArray dependencies)
        {
            normalized["dependencyChanges"] = new JsonArray(dependencies.OfType<JsonObject>().Select(p => NormalizeDependencyChangeInput(p, "rule")).ToArray<JsonNode?>());
        }
        return normalized;
    }

    public IReadOnlyList<JsonObject> ValidateAiPlan(JsonNode? planNode, JsonObject analysis, JsonObject rules)
    {
        if (planNode is not JsonArray plan) return [];
        var validated = new List<JsonObject>();
        foreach (var item in plan.OfType<JsonObject>())
        {
            var type = item.StringValue("type");
            JsonObject? result = type switch
            {
                "framework" => ValidateFrameworkChange(item, analysis, rules),
                "runtime" => ValidateRuntimeChange(item, analysis, rules),
                "dependency" or "package" => ValidateDependencyChange(item, analysis, rules),
                _ => null
            };
            if (result is not null) validated.Add(result);
        }
        return SortPlan(validated);
    }

    public IReadOnlyList<JsonObject> ParseNu1605Downgrades(string output)
    {
        var results = new List<JsonObject>();
        foreach (Match match in Regex.Matches(output, @"Detected package downgrade:\s*(?<name>[^\s]+)\s+from\s+(?<requested>[^\s]+)\s+to\s+(?<current>[^\s\.,;:)]+)", RegexOptions.IgnoreCase))
        {
            results.Add(new JsonObject
            {
                ["name"] = CleanVersionToken(match.Groups["name"].Value),
                ["requestedVersion"] = CleanVersionToken(match.Groups["requested"].Value),
                ["currentVersion"] = CleanVersionToken(match.Groups["current"].Value)
            });
        }
        return results;
    }

    private JsonObject? ValidateFrameworkChange(JsonObject item, JsonObject analysis, JsonObject rules)
    {
        var target = rules["targetFrameworkChange"]?.AsObject();
        if (target is null) return null;
        if (item.StringValue("find") != target.StringValue("from") || item.StringValue("replace") != target.StringValue("to")) return null;
        var file = item.StringValue("file");
        if (!IsAllowedStructuralTarget(file, analysis, "framework")) return null;
        return new JsonObject { ["type"] = "framework", ["priority"] = 1, ["source"] = "ai", ["file"] = file, ["find"] = target.StringValue("from"), ["replace"] = target.StringValue("to"), ["description"] = item.StringValue("description", $"Update target framework {target.StringValue("from")} to {target.StringValue("to")}.") };
    }

    private JsonObject? ValidateRuntimeChange(JsonObject item, JsonObject analysis, JsonObject rules)
    {
        var target = rules["targetRuntimeChange"]?.AsObject();
        if (target is null) return null;
        if (item.StringValue("find") != target.StringValue("from") || item.StringValue("replace") != target.StringValue("to")) return null;
        var file = item.StringValue("file");
        if (!IsAllowedStructuralTarget(file, analysis, "runtime")) return null;
        return new JsonObject { ["type"] = "runtime", ["priority"] = 1, ["source"] = "ai", ["file"] = file, ["find"] = target.StringValue("from"), ["replace"] = target.StringValue("to"), ["description"] = item.StringValue("description", $"Update target runtime {target.StringValue("from")} to {target.StringValue("to")}.") };
    }

    private JsonObject? ValidateDependencyChange(JsonObject item, JsonObject analysis, JsonObject rules)
    {
        var normalized = NormalizeDependencyChangeInput(item);
        var name = normalized.StringValue("name");
        if (string.IsNullOrWhiteSpace(name)) return null;
        var ruleByName = rules["dependencyChanges"]?.AsArray()?.OfType<JsonObject>().ToDictionary(d => d.StringValue("name"), StringComparer.OrdinalIgnoreCase) ?? [];
        var manifest = ManifestDependencyVersions(analysis);
        if (ruleByName.TryGetValue(name, out var rule))
        {
            if (manifest.Count > 0 && !manifest.ContainsKey(name)) return null;
            var manifestDependency = manifest.GetValueOrDefault(name, new JsonObject());
            var sourceFile = rule.StringValue("sourceFile", normalized.StringValue("sourceFile", manifestDependency.StringValue("sourceFile")));
            if (!IsAllowedStructuralTarget(sourceFile, analysis, "dependency")) return null;
            var result = rule.DeepClone().AsObject();
            result["type"] = "dependency";
            result["priority"] = 2;
            result["sourceFile"] = sourceFile;
            result["source"] = "ai";
            result["manager"] = rule.StringValue("manager", manifestDependency.StringValue("manager", "unknown"));
            result["ecosystem"] = rule.StringValue("ecosystem", manifestDependency.StringValue("ecosystem", "unknown"));
            result["description"] = normalized.StringValue("description", $"Upgrade {name} to {rule.StringValue("toVersion")}.");
            return result;
        }
        return ValidateAiInferredDependencyChange(normalized, manifest, analysis, [], null, "ai");
    }

    private JsonObject? ValidateAiInferredDependencyChange(JsonObject item, Dictionary<string, JsonObject> manifest, JsonObject analysis, IReadOnlyList<JsonObject> currentPlan, string? validationOutput, string source)
    {
        var name = item.StringValue("name");
        if (!manifest.TryGetValue(name, out var manifestDependency)) return null;
        if (item.StringValue("action") != "upgrade") return null;
        var toVersion = item.StringValue("toVersion");
        if (!IsSafeTargetVersion(toVersion)) return null;
        var fromVersion = manifestDependency.StringValue("version");
        if (!string.IsNullOrWhiteSpace(fromVersion) && IsObviousDowngradeOrNoop(fromVersion, toVersion)) return null;
        var sourceFile = item.StringValue("sourceFile", manifestDependency.StringValue("sourceFile"));
        if (!IsAllowedStructuralTarget(sourceFile, analysis, "dependency")) return null;
        if (!HasDependencyUpgradeEvidence(item, name, analysis, currentPlan, validationOutput)) return null;
        return new JsonObject
        {
            ["type"] = "dependency",
            ["priority"] = 2,
            ["name"] = name,
            ["fromVersion"] = fromVersion,
            ["toVersion"] = toVersion,
            ["action"] = "upgrade",
            ["manager"] = manifestDependency.StringValue("manager", "unknown"),
            ["ecosystem"] = manifestDependency.StringValue("ecosystem", "unknown"),
            ["sourceFile"] = sourceFile,
            ["source"] = source,
            ["description"] = item.StringValue("description", $"Upgrade {name} to {toVersion}."),
            ["reason"] = item.StringValue("reason"),
            ["evidence"] = item.StringValue("evidence")
        };
    }

    private static JsonObject NormalizeDependencyChangeInput(JsonObject item, string? source = null)
    {
        var normalized = item.DeepClone().AsObject();
        if (normalized["type"] is null || normalized.StringValue("type") == "package") normalized["type"] = "dependency";
        if (source is not null && normalized["source"] is null) normalized["source"] = source;
        normalized["action"] ??= "upgrade";
        normalized["manager"] ??= "unknown";
        normalized["ecosystem"] ??= "unknown";
        return normalized;
    }

    private static void EnsureStructureClassification(JsonObject analysis)
    {
        if (analysis["classifiedFiles"] is not null) return;
        StoreStructureClassification(analysis, FallbackStructureClassification(analysis));
    }

    private static void StoreStructureClassification(JsonObject analysis, JsonObject structure)
    {
        analysis["structureClassification"] = structure.DeepClone();
        analysis["classifiedFiles"] = FlattenClassifiedFiles(structure);
    }

    private static JsonObject FallbackStructureClassification(JsonObject analysis)
    {
        var files = new JsonArray();
        foreach (var path in DiscoveredFiles(analysis).Order())
        {
            var fallback = FallbackRoleForPath(path);
            if (fallback is null) continue;
            files.Add(new JsonObject { ["path"] = path, ["role"] = fallback.Value.Role, ["allowedChangeTypes"] = new JsonArray(fallback.Value.Allowed.Select(x => (JsonNode?)JsonValue.Create(x)).ToArray()), ["reason"] = "Matched deterministic manifest discovery fallback.", ["confidence"] = 0.6 });
        }
        return new JsonObject { ["ecosystems"] = new JsonArray(new JsonObject { ["name"] = FallbackEcosystemName(files), ["languages"] = new JsonArray("unknown"), ["packageManager"] = "unknown", ["confidence"] = files.Count > 0 ? 0.5 : 0.0, ["files"] = files }), ["summary"] = "Deterministic structural discovery fallback." };
    }

    private static JsonObject FlattenClassifiedFiles(JsonObject structure)
    {
        var result = new JsonObject();
        foreach (var file in structure["ecosystems"]?.AsArray()?.OfType<JsonObject>().SelectMany(e => e["files"]?.AsArray()?.OfType<JsonObject>() ?? []) ?? [])
        {
            result[file.StringValue("path")] = file.DeepClone();
        }
        return result;
    }

    private static IEnumerable<string> StructuralFiles(JsonObject analysis)
    {
        EnsureStructureClassification(analysis);
        return analysis["classifiedFiles"]?.AsObject()
            .Where(kvp => kvp.Value is JsonObject info && StructuralRoles.Contains(info.StringValue("role")) && !BlockedRoles.Contains(info.StringValue("role")))
            .Select(kvp => kvp.Key) ?? [];
    }

    private static bool IsAllowedStructuralTarget(string fileName, JsonObject analysis, string changeType)
    {
        if (string.IsNullOrWhiteSpace(fileName) || !ChangeTypes.Contains(changeType)) return false;
        EnsureStructureClassification(analysis);
        if (fileName.Contains('*')) return ClassifiedFilesMatching(fileName, analysis).Any(path => IsAllowedStructuralTarget(path, analysis, changeType));
        var classified = analysis["classifiedFiles"]?.AsObject();
        if (classified?[fileName] is not JsonObject info) return false;
        var role = info.StringValue("role");
        if (!StructuralRoles.Contains(role) || BlockedRoles.Contains(role)) return false;
        if (role == "lock_file" && changeType != "regenerate_lock_file") return false;
        return info["allowedChangeTypes"]?.AsArray()?.Select(x => x?.ToString()).Contains(changeType) == true;
    }

    private static IEnumerable<string> ClassifiedFilesMatching(string pattern, JsonObject analysis)
    {
        var files = analysis["classifiedFiles"]?.AsObject().Select(kvp => kvp.Key) ?? [];
        if (pattern.StartsWith("**/", StringComparison.Ordinal)) pattern = pattern[3..];
        return files.Where(f => Matches(Path.GetFileName(f.Replace('\\', '/')), pattern) || Matches(f.Replace('\\', '/'), pattern));
    }

    private static Dictionary<string, JsonObject> ManifestDependencyVersions(JsonObject analysis)
    {
        var result = new Dictionary<string, JsonObject>(StringComparer.OrdinalIgnoreCase);
        foreach (var dependency in ManifestDependencies(analysis)) result[dependency.StringValue("name")] = dependency;
        return result;
    }

    private static IEnumerable<JsonObject> ManifestDependencies(JsonObject analysis)
    {
        var manifest = analysis["manifest"]?.AsObject() ?? new JsonObject();
        foreach (var project in manifest["projects"]?.AsArray()?.OfType<JsonObject>() ?? [])
        {
            var sourceFile = project.StringValue("path");
            foreach (var package in project["packages"]?.AsArray()?.OfType<JsonObject>() ?? [])
            {
                var name = package.StringValue("name");
                if (string.IsNullOrWhiteSpace(name)) continue;
                yield return new JsonObject { ["name"] = name, ["version"] = package.StringValue("version", package.StringValue("Version", package.StringValue("fromVersion"))), ["manager"] = package.StringValue("manager", manifest.StringValue("runtime") == "dotnet" ? "nuget" : "unknown"), ["ecosystem"] = package.StringValue("ecosystem", manifest.StringValue("runtime") == "dotnet" ? "dotnet" : "unknown"), ["sourceFile"] = package.StringValue("sourceFile", sourceFile), ["scope"] = package.StringValue("scope", "direct") };
            }
        }
        foreach (var dependency in manifest["dependencies"]?.AsArray()?.OfType<JsonObject>() ?? []) yield return dependency;
    }

    private static HashSet<string> DiscoveredFiles(JsonObject analysis)
    {
        var files = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var manifest = analysis["manifest"]?.AsObject();
        foreach (var project in manifest?["projects"]?.AsArray()?.OfType<JsonObject>() ?? [])
            if (!string.IsNullOrWhiteSpace(project.StringValue("path"))) files.Add(project.StringValue("path"));
        foreach (var finding in analysis["findings"]?.AsArray()?.OfType<JsonObject>() ?? [])
            if (!string.IsNullOrWhiteSpace(finding.StringValue("file"))) files.Add(finding.StringValue("file"));
        return files;
    }

    private static (string Role, string[] Allowed)? FallbackRoleForPath(string path)
    {
        var file = Path.GetFileName(path.Replace('\\', '/'));
        return file switch
        {
            var f when f.EndsWith(".csproj", StringComparison.OrdinalIgnoreCase) => ("project_manifest", ["framework", "runtime", "dependency", "package", "build_setting", "project_reference"]),
            var f when f.EndsWith(".sln", StringComparison.OrdinalIgnoreCase) => ("solution_manifest", ["project_reference", "build_setting"]),
            "Directory.Build.props" or "Directory.Build.targets" => ("build_manifest", ["framework", "runtime", "dependency", "package", "build_setting"]),
            "Directory.Packages.props" => ("dependency_manifest", ["dependency", "package"]),
            "global.json" => ("build_manifest", ["runtime", "build_setting"]),
            "NuGet.config" => ("dependency_manifest", ["dependency", "package", "build_setting"]),
            "package.json" => ("dependency_manifest", ["runtime", "dependency", "package", "script"]),
            "angular.json" => ("build_manifest", ["runtime", "build_setting", "script"]),
            "tsconfig.json" => ("build_manifest", ["runtime", "build_setting"]),
            var f when f.StartsWith("tsconfig.", StringComparison.OrdinalIgnoreCase) && f.EndsWith(".json", StringComparison.OrdinalIgnoreCase) => ("build_manifest", ["runtime", "build_setting"]),
            "browserslist" or ".browserslistrc" => ("build_manifest", ["build_setting"]),
            ".npmrc" => ("dependency_manifest", ["dependency", "package", "build_setting"]),
            "package-lock.json" or "pnpm-lock.yaml" or "yarn.lock" => ("lock_file", ["regenerate_lock_file"]),
            "pom.xml" => ("project_manifest", ["framework", "runtime", "dependency", "package", "build_setting"]),
            "build.gradle" or "build.gradle.kts" or "settings.gradle" or "gradle.properties" => ("build_manifest", ["framework", "runtime", "dependency", "package", "build_setting", "script"]),
            "pyproject.toml" or "requirements.txt" => ("dependency_manifest", ["runtime", "dependency", "package", "build_setting"]),
            "poetry.lock" => ("lock_file", ["regenerate_lock_file"]),
            "go.mod" => ("dependency_manifest", ["runtime", "dependency", "package"]),
            "go.sum" => ("lock_file", ["regenerate_lock_file"]),
            "Gemfile" => ("dependency_manifest", ["runtime", "dependency", "package"]),
            "Gemfile.lock" => ("lock_file", ["regenerate_lock_file"]),
            _ => null
        };
    }

    private static string FallbackEcosystemName(JsonArray files)
    {
        var names = files.OfType<JsonObject>().Select(f => Path.GetFileName(f.StringValue("path"))).ToHashSet(StringComparer.OrdinalIgnoreCase);
        if (names.Any(n => n.EndsWith(".csproj") || n.EndsWith(".sln"))) return "dotnet";
        if (names.Contains("package.json")) return "npm";
        return "unknown";
    }

    private static bool HasDependencyUpgradeEvidence(JsonObject item, string name, JsonObject analysis, IReadOnlyList<JsonObject> currentPlan, string? validationOutput)
    {
        var evidence = item.StringValue("evidence");
        if (!DependencyEvidence.Contains(evidence)) return false;
        if (evidence == "NU1605") return validationOutput?.Contains(name, StringComparison.OrdinalIgnoreCase) == true;
        if (evidence is "validation" or "restore-error" or "build-error") return validationOutput?.Contains(name, StringComparison.OrdinalIgnoreCase) == true;
        if (evidence == "dependency-family") return currentPlan.Any(p => p.StringValue("type") is "dependency" or "package");
        if (evidence is "manifest" or "target-framework" or "target-runtime") return AlignsWithFrameworkMajorVersion(item.StringValue("fromVersion"), item.StringValue("toVersion"), analysis);
        return false;
    }

    private static bool AlignsWithFrameworkMajorVersion(string fromVersion, string toVersion, JsonObject analysis)
    {
        var current = VersionPrefix(fromVersion);
        var target = VersionPrefix(toVersion);
        var from = FrameworkMajorVersion(analysis.StringValue("from"));
        var to = FrameworkMajorVersion(analysis.StringValue("to"));
        return current is not null && target is not null && from is not null && to is not null && current[0] == from && target[0] == to;
    }

    private static bool IsSafeTargetVersion(string value) => !string.IsNullOrWhiteSpace(value) && value == value.Trim() && !value.Contains('*') && Regex.IsMatch(value, @"^[0-9A-Za-z][0-9A-Za-z.+-]*$");
    private static bool IsObviousDowngradeOrNoop(string from, string to)
    {
        var current = VersionPrefix(from);
        var target = VersionPrefix(to);
        if (current is null || target is null) return true;
        for (var i = 0; i < Math.Min(current.Length, target.Length); i++)
        {
            if (target[i] != current[i]) return target[i] < current[i];
        }
        return target.Length <= current.Length;
    }

    private static int[]? VersionPrefix(string value)
    {
        var match = Regex.Match(value, @"^\s*(\d+(?:\.\d+)*)");
        return match.Success ? match.Groups[1].Value.Split('.').Select(int.Parse).ToArray() : null;
    }

    private static int? FrameworkMajorVersion(string value) => Regex.Match(value, @"(\d+)(?:\.\d+)?") is { Success: true } m ? int.Parse(m.Groups[1].Value) : null;
    private static string CleanVersionToken(string value) => value.TrimEnd('.', ',', ';', ':', ')');
    private static bool Matches(string value, string pattern) => pattern.StartsWith("*.") ? value.EndsWith(pattern[1..], StringComparison.OrdinalIgnoreCase) : string.Equals(value, pattern, StringComparison.OrdinalIgnoreCase);
    private static IReadOnlyList<JsonObject> SortPlan(IEnumerable<JsonObject> plan) => plan.OrderBy(p => p.IntValue("priority")).ThenBy(p => p.StringValue("type")).ThenBy(p => p.StringValue("name")).ToArray();
    private static IReadOnlyList<JsonObject> MergePlans(IEnumerable<JsonObject> preferred, IEnumerable<JsonObject> fallback) => preferred.Concat(fallback).GroupBy(PlanKey).Select(g => g.First()).OrderBy(p => p.IntValue("priority")).ThenBy(p => p.StringValue("type")).ToArray();
    private static string PlanKey(JsonObject item) => item.StringValue("type") is "dependency" or "package" ? $"dependency|{item.StringValue("name")}|{item.StringValue("toVersion")}|{item.StringValue("sourceFile")}" : $"{item.StringValue("type")}|{item.StringValue("file")}|{item.StringValue("find")}|{item.StringValue("replace")}";
    private static string BuildPlanningPrompt() => "You are a senior software migration planner. Return only valid JSON. Plan only structural framework/runtime/dependency/package changes. Do not plan source-code or business-logic edits.";
}
