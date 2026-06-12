using System.Text;
using System.Text.Json.Nodes;
using Q3.MigrationAgent.AI.Abstractions;
using Q3.MigrationAgent.AI.Claude;
using Q3.MigrationAgent.AI.Codex;
using Q3.MigrationAgent.AI.Providers;
using Q3.MigrationAgent.AI.Prompts;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Core.Commands;
using Q3.MigrationAgent.Core.Logging;
using Q3.MigrationAgent.Shared.Common;
using Q3.MigrationAgent.Shared.Config;
using Q3.ModernizationEngine.Core.Abstractions;
using Q3.ModernizationEngine.Shared.Models;

namespace Q3.ModernizationEngine.Core.Execution;

public sealed class ProviderBackedModuleContentGenerator : IModuleContentGenerator
{
    private readonly IAiCliResolver _ai;
    private readonly DeterministicModuleContentGenerator _fallback = new();

    public ProviderBackedModuleContentGenerator()
    {
        var runner = new CommandRunner(new RunLog());
        var promptLoader = new PromptLoader();
        IAiProvider[] providers = [new CodexCliProvider(runner, promptLoader), new ClaudeCliProvider(runner, promptLoader)];
        _ai = new AiProviderResolver(runner, providers);
    }

    public async Task<ModuleExecutionResult> GenerateAsync(
        ModernizationRequest request,
        ModuleMigrationPlan plan,
        WorkspacePlacement placement,
        IModernizationProgressReporter progress,
        CancellationToken cancellationToken = default)
    {
        if (!request.Ai.UseAi || !SupportedProvider(request.Ai.Provider))
        {
            progress.Detail($"AI not configured for {plan.UnitName}; using deterministic fallback.");
            return await _fallback.GenerateAsync(request, plan, placement, progress, cancellationToken);
        }

        try
        {
            progress.Detail($"Resolving AI provider '{request.Ai.Provider}' for {plan.UnitName}...");
            var config = await _ai.ResolveAsync(ToAiConfig(request.Ai), placement.WorkspaceFolder, null, null, cancellationToken);
            progress.Detail($"Requesting AI-generated content for {plan.UnitName}...");
            var response = await _ai.AskAsync(config, SystemPrompt(), UserPrompt(request, plan, placement), cancellationToken);
            if (response is null)
            {
                progress.Warning($"AI returned no content for {plan.UnitName}; falling back to deterministic generation.");
                return await _fallback.GenerateAsync(request, plan, placement, progress, cancellationToken);
            }

            progress.Detail($"AI returned structured content for {plan.UnitName}.");
            return WriteAiArtifacts(request, plan, placement, response);
        }
        catch
        {
            progress.Warning($"AI generation failed for {plan.UnitName}; falling back to deterministic generation.");
            return await _fallback.GenerateAsync(request, plan, placement, progress, cancellationToken);
        }
    }

    private static ModuleExecutionResult WriteAiArtifacts(
        ModernizationRequest request,
        ModuleMigrationPlan plan,
        WorkspacePlacement placement,
        JsonObject response)
    {
        var warnings = response["warnings"]?.AsArray()?.Select(n => n?.ToString() ?? "").Where(s => s.Length > 0).ToList() ?? [];
        var review = response["manualReviewReasons"]?.AsArray()?.Select(n => n?.ToString() ?? "").Where(s => s.Length > 0).ToList() ?? [];
        if (review.Count > 0) warnings.AddRange(review);

        var generated = new List<GeneratedArtifact>();
        foreach (var file in response["files"]?.AsArray()?.OfType<JsonObject>() ?? [])
        {
            var relative = file.StringValue("relativePath");
            if (!IsSafeRelativePath(relative))
            {
                warnings.Add($"Skipped unsafe AI file path: {relative}");
                continue;
            }

            var full = Path.Combine(placement.WorkspaceFolder, relative.Replace('/', Path.DirectorySeparatorChar));
            EnsureWithinWorkspace(full, placement.WorkspaceFolder, request.OutputPath);
            Directory.CreateDirectory(Path.GetDirectoryName(full)!);
            File.WriteAllText(full, file.StringValue("content"), Encoding.UTF8);
            generated.Add(new GeneratedArtifact
            {
                RelativePath = relative,
                Kind = file.StringValue("kind", "generated"),
                Summary = file.StringValue("summary", "AI-generated migration artifact.")
            });
        }

        if (generated.Count == 0)
        {
            warnings.Add("AI generation returned no safe files. Deterministic fallback is recommended.");
        }

        return new ModuleExecutionResult
        {
            UnitId = plan.UnitId,
            UnitName = plan.UnitName,
            Track = plan.Track,
            ExecutorMode = $"ai-{request.Ai.Provider}",
            WorkspaceFolder = placement.WorkspaceFolder,
            GeneratedArtifacts = generated,
            Warnings = warnings
        };
    }

    private static string SystemPrompt() =>
        """
        You are a migration-master code generation assistant.
        Generate only files for the single requested module.
        Do not reference files outside the assigned workspace.
        Do not change business behavior unless the provided steps explicitly require it.
        Keep output JSON-only with:
        {
          "summary": "...",
          "files": [
            { "relativePath": "path/in/workspace.ext", "kind": "blazor-page|api-endpoint|business-service|contract|sql-script", "summary": "...", "content": "..." }
          ],
          "warnings": [],
          "manualReviewReasons": []
        }
        """;

    private static string UserPrompt(ModernizationRequest request, ModuleMigrationPlan plan, WorkspacePlacement placement)
    {
        var payload = new JsonObject
        {
            ["targetMode"] = request.TargetMode,
            ["track"] = plan.Track,
            ["unitName"] = plan.UnitName,
            ["modulePath"] = plan.ModulePath,
            ["workspaceFolder"] = placement.WorkspaceFolder,
            ["summary"] = plan.Summary,
            ["entryPoints"] = new JsonArray(plan.EntryPoints.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
            ["exitPoints"] = new JsonArray(plan.ExitPoints.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
            ["dependsOnUnits"] = new JsonArray(plan.DependsOnUnits.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
            ["suggestedOutputs"] = new JsonArray(plan.SuggestedOutputs.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
            ["steps"] = new JsonArray(plan.Steps.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
            ["sqlArtifacts"] = new JsonArray(plan.SqlArtifacts.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
            ["manualReviewReasons"] = new JsonArray(plan.ManualReviewReasons.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray())
        };

        return payload.ToJsonString(new() { WriteIndented = true });
    }

    private static AiConfig ToAiConfig(ModernizationAiOptions options) => new()
    {
        UseAi = options.UseAi,
        Provider = options.Provider,
        Mode = "cli",
        AiCli = options.AiCli
    };

    private static bool SupportedProvider(string provider) =>
        provider.Equals("codex", StringComparison.OrdinalIgnoreCase) || provider.Equals("claude", StringComparison.OrdinalIgnoreCase);

    private static bool IsSafeRelativePath(string path)
    {
        if (string.IsNullOrWhiteSpace(path)) return false;
        if (Path.IsPathRooted(path)) return false;
        var normalized = path.Replace('\\', '/');
        return !normalized.Contains("../", StringComparison.Ordinal) &&
               !normalized.StartsWith("..", StringComparison.Ordinal) &&
               !normalized.Contains(':', StringComparison.Ordinal);
    }

    private static void EnsureWithinWorkspace(string fullPath, string workspaceFolder, string outputRoot)
    {
        var full = Path.GetFullPath(fullPath).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        var workspace = Path.GetFullPath(workspaceFolder).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        var output = Path.GetFullPath(outputRoot).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        if (!full.StartsWith(workspace, StringComparison.OrdinalIgnoreCase) || !full.StartsWith(output, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException($"AI attempted to write outside the guarded workspace: {fullPath}");
        }
    }
}
