using System.Text.Json;
using System.Text.Json.Nodes;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Core.Execution;
using Q3.MigrationAgent.Shared.Common;
using Q3.MigrationAgent.Shared.Config;
using Q3.MigrationAgent.Shared.DTO;

namespace Q3.MigrationAgent.Core.Remediation;

public sealed class AiRemediationPlanner(IAiService ai)
{
    private static readonly HashSet<string> SafeStructuralNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "Directory.Build.props", "Directory.Build.targets", "Directory.Packages.props", "global.json", "NuGet.config",
        "package.json", "angular.json", "tsconfig.json", "browserslist", ".browserslistrc", ".npmrc",
        "pom.xml", "build.gradle", "build.gradle.kts", "settings.gradle", "gradle.properties",
        "pyproject.toml", "requirements.txt", "go.mod", "Gemfile"
    };

    public async Task<RemediationAttempt> TryRemediateAsync(
        MigrationConfig config,
        string outputPath,
        IMigrationAdapter adapter,
        ValidationResult validation,
        int attempt,
        CancellationToken cancellationToken = default)
    {
        var prompt = new JsonObject
        {
            ["validationOutput"] = validation.Output.Length > 0 ? validation.Output : validation.Errors,
            ["attempt"] = attempt,
            ["maxAttempts"] = config.MaxAiRemediationRetries,
            ["allowedInitialPlanningEdits"] = new JsonArray("dependency", "package", "build_setting", "project_manifest", "dependency_manifest"),
            ["sourceEditPolicy"] = "Only propose source file replacements when the validation output names the file and error directly.",
            ["requiredResponseShape"] = new JsonObject
            {
                ["canAutoFix"] = true,
                ["requiresHumanReview"] = false,
                ["confidence"] = "high|medium|low",
                ["changes"] = new JsonArray(),
                ["manualInstructions"] = new JsonArray()
            }
        };
        var plan = await ai.AskAsync(config.Ai, RemediationPrompt, prompt.ToJsonString(JsonHelpers.SerializerOptions), cancellationToken);
        if (plan is null) return RemediationAttempt.NotAttempted();
        var safety = ValidatePlan(plan, validation);
        if (!safety.Safe)
        {
            return RemediationAttempt.Manual(ManualRequest(plan, validation, safety.Reason));
        }

        var changes = new List<JsonObject>();
        foreach (var change in plan["changes"]?.AsArray()?.OfType<JsonObject>() ?? [])
        {
            var applied = await ApplyChangeAsync(change, outputPath, adapter, attempt, config.MaxAiRemediationRetries, validation, cancellationToken);
            if (applied is not null) changes.Add(applied);
        }

        return changes.Count == 0
            ? RemediationAttempt.Manual(ManualRequest(plan, validation, "AI returned no safe executable remediation changes."))
            : RemediationAttempt.AppliedResult(changes);
    }

    private static (bool Safe, string Reason) ValidatePlan(JsonObject plan, ValidationResult validation)
    {
        if (plan.BoolValue("requiresHumanReview")) return (false, "AI requested human review.");
        if (plan.BoolValue("businessLogicChanged")) return (false, "AI plan would change business logic.");
        if (string.Equals(plan.StringValue("confidence"), "low", StringComparison.OrdinalIgnoreCase)) return (false, "AI confidence is low.");
        if (plan["canAutoFix"] is not null && !plan.BoolValue("canAutoFix")) return (false, "AI marked the fix as not safe to apply automatically.");
        foreach (var change in plan["changes"]?.AsArray()?.OfType<JsonObject>() ?? [])
        {
            var file = change.StringValue("file");
            if (IsSourceFile(file) && !ValidationMentionsFile(validation, file)) return (false, $"Source file {file} is not directly tied to the validation failure.");
            if (IsSourceFile(file) && change.StringValue("functionalImpact") is not ("none" or "equivalent")) return (false, $"Source file {file} has unsafe functional impact.");
        }
        return (true, "");
    }

    private static async Task<JsonObject?> ApplyChangeAsync(JsonObject change, string outputPath, IMigrationAdapter adapter, int attempt, int maxAttempts, ValidationResult validation, CancellationToken cancellationToken)
    {
        var type = change.StringValue("type");
        if (type is "dependency" or "package")
        {
            var files = await adapter.UpgradePackageAsync(outputPath, change, cancellationToken);
            return new JsonObject { ["attempt"] = attempt, ["maxAttempts"] = maxAttempts, ["type"] = type, ["file"] = change.StringValue("sourceFile"), ["name"] = change.StringValue("name"), ["reason"] = change.StringValue("reason"), ["files"] = JsonSerializer.SerializeToNode(files.Select(f => Path.GetRelativePath(outputPath, f)).ToArray()) };
        }

        var file = change.StringValue("file");
        if (!IsSafeManifest(file) && !(IsSourceFile(file) && ValidationMentionsFile(validation, file))) return null;
        var full = Path.GetFullPath(Path.Combine(outputPath, file));
        if (!full.StartsWith(Path.GetFullPath(outputPath), StringComparison.OrdinalIgnoreCase) || !File.Exists(full)) return null;
        var before = await File.ReadAllTextAsync(full, cancellationToken);
        var find = change.StringValue("find");
        var replace = change.StringValue("replace");
        if (string.IsNullOrEmpty(find) || before.Contains(find, StringComparison.Ordinal) is false) return null;
        await File.WriteAllTextAsync(full, before.Replace(find, replace, StringComparison.Ordinal), cancellationToken);
        return new JsonObject { ["attempt"] = attempt, ["maxAttempts"] = maxAttempts, ["type"] = type, ["file"] = file, ["reason"] = change.StringValue("reason"), ["businessFile"] = IsSourceFile(file), ["functionalImpact"] = change.StringValue("functionalImpact", "unknown") };
    }

    private static JsonObject ManualRequest(JsonObject plan, ValidationResult validation, string reason)
    {
        var instructions = plan["manualInstructions"]?.DeepClone() as JsonArray ?? new JsonArray();
        if (instructions.Count == 0)
        {
            instructions.Add(new JsonObject { ["file"] = "unknown", ["line"] = null, ["error"] = validation.Errors.Length > 0 ? validation.Errors : validation.Output, ["possibleChange"] = "", ["risk"] = reason, ["validationCommand"] = "rerun migration validation" });
        }
        return new JsonObject { ["requiresHumanReview"] = true, ["reason"] = reason, ["manualInstructions"] = instructions };
    }

    private static bool IsSafeManifest(string file)
    {
        var name = Path.GetFileName(file.Replace('\\', '/'));
        return SafeStructuralNames.Contains(name) || name.EndsWith(".csproj", StringComparison.OrdinalIgnoreCase) || name.EndsWith(".sln", StringComparison.OrdinalIgnoreCase) || name.StartsWith("tsconfig.", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsSourceFile(string file) => file.Replace('\\', '/').Contains("/src/", StringComparison.OrdinalIgnoreCase) || file.StartsWith("src/", StringComparison.OrdinalIgnoreCase) || new[] { ".cs", ".ts", ".js", ".java", ".py", ".go" }.Any(ext => file.EndsWith(ext, StringComparison.OrdinalIgnoreCase));
    private static bool ValidationMentionsFile(ValidationResult validation, string file) => (validation.Output + "\n" + validation.Errors).Contains(file.Replace('\\', '/'), StringComparison.OrdinalIgnoreCase) || (validation.Output + "\n" + validation.Errors).Contains(file.Replace('/', Path.DirectorySeparatorChar), StringComparison.OrdinalIgnoreCase);

    private const string RemediationPrompt = "Return only strict JSON. Propose the smallest validation remediation. Prefer dependency, package, project manifest, runtime, or build manifest edits. Source edits are allowed only when the validation output directly identifies the file and error. Reject behavior changes, removals, disabled tests, ts-ignore, broad refactors, and low-confidence changes.";
}

public sealed record RemediationAttempt(bool Attempted, bool Applied, IReadOnlyList<JsonObject> Changes, JsonObject? ManualCorrection)
{
    public static RemediationAttempt NotAttempted() => new(false, false, [], null);
    public static RemediationAttempt AppliedResult(IReadOnlyList<JsonObject> changes) => new(true, true, changes, null);
    public static RemediationAttempt Manual(JsonObject request) => new(true, false, [], request);
}
