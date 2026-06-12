using System.Text.Json.Nodes;
using Q3.MigrationAgent.AI.Abstractions;
using Q3.MigrationAgent.AI.Claude;
using Q3.MigrationAgent.AI.Codex;
using Q3.MigrationAgent.AI.Providers;
using Q3.MigrationAgent.AI.Prompts;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Core.Commands;
using Q3.MigrationAgent.Core.Logging;
using Q3.MigrationAgent.Shared.Config;
using Q3.ModernizationEngine.Core.Abstractions;
using Q3.ModernizationEngine.Shared.Models;

namespace Q3.ModernizationEngine.Core.Planning;

public sealed class ProviderBackedModernizationAiPlanner : IModernizationAiPlanner
{
    private readonly IAiCliResolver _ai;

    public ProviderBackedModernizationAiPlanner()
    {
        var runner = new CommandRunner(new RunLog());
        var promptLoader = new PromptLoader();
        IAiProvider[] providers = [new CodexCliProvider(runner, promptLoader), new ClaudeCliProvider(runner, promptLoader)];
        _ai = new AiProviderResolver(runner, providers);
    }

    public async Task<ModuleMigrationPlan?> TryPlanAsync(
        ModernizationRequest request,
        MigrationUnit unit,
        TargetArchitectureProfile architecture,
        WorkspacePlacement placement,
        CancellationToken cancellationToken = default)
    {
        if (!request.Ai.UseAi || !SupportedProvider(request.Ai.Provider))
        {
            return null;
        }

        try
        {
            var config = await _ai.ResolveAsync(ToAiConfig(request.Ai), placement.WorkspaceFolder, null, null, cancellationToken);
            if (!config.UseAi || string.IsNullOrWhiteSpace(config.Provider))
            {
                return null;
            }

            var response = await _ai.AskAsync(config, SystemPrompt(), UserPrompt(request, unit, architecture, placement), cancellationToken);
            if (response is null)
            {
                return null;
            }

            return ParsePlan(request, unit, response);
        }
        catch
        {
            return null;
        }
    }

    private static ModuleMigrationPlan ParsePlan(ModernizationRequest request, MigrationUnit unit, JsonObject response)
    {
        var outputs = response["suggestedOutputs"]?.AsArray()?.Select(n => n?.ToString() ?? "").Where(s => s.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase).ToArray() ?? [];
        var steps = response["steps"]?.AsArray()?.Select(n => n?.ToString() ?? "").Where(s => s.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase).ToArray() ?? [];
        var sql = response["sqlArtifacts"]?.AsArray()?.Select(n => n?.ToString() ?? "").Where(s => s.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase).ToArray() ?? [];
        var review = response["manualReviewReasons"]?.AsArray()?.Select(n => n?.ToString() ?? "").Where(s => s.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase).ToArray() ?? [];

        return new ModuleMigrationPlan
        {
            UnitId = unit.Id,
            UnitName = unit.Name,
            ModulePath = unit.ModulePath,
            Track = unit.Track,
            TargetMode = request.TargetMode,
            PlannerMode = $"ai-{request.Ai.Provider}",
            EntryPoints = unit.EntryPoints,
            ExitPoints = unit.ExitPoints,
            DependsOnUnits = unit.DependsOn,
            SuggestedOutputs = outputs.Length == 0 ? DeterministicModernizationAiPlanner.BuildDeterministicPlan(request, unit, new WorkspacePlacement
            {
                UnitId = unit.Id,
                UnitName = unit.Name,
                ModulePath = unit.ModulePath,
                Track = unit.Track,
                TargetArea = unit.TargetArea,
                WorkspaceFolder = string.Empty,
                RequiresManualReview = unit.RequiresManualReview,
                Notes = []
            }).SuggestedOutputs : outputs,
            Steps = steps.Length == 0 ? ["Review the module inventory and migrate this module in a guarded sequence."] : steps,
            SqlArtifacts = sql,
            ManualReviewReasons = review,
            Summary = response["summary"]?.ToString() ?? $"{unit.Name} requires module-by-module migration planning."
        };
    }

    private static string SystemPrompt() =>
        """
        You are a senior modernization planning agent.
        Plan one migration module at a time.
        Keep the plan practical and dependency-aware.
        Avoid creating unnecessary folders or splitting one business feature into many tiny units.
        Return only JSON with this exact schema:
        {
          "summary": "string",
          "suggestedOutputs": ["string"],
          "steps": ["string"],
          "sqlArtifacts": ["string"],
          "manualReviewReasons": ["string"]
        }
        Rules:
        - Respect the requested target mode.
        - Use the supplied module boundary; refine the migration sequence, not the module id.
        - Mention start points, dependent modules, and end/boundary points in the steps when relevant.
        - Do not suggest writing outside the assigned target architecture shape.
        - Prefer fewer, meaningful outputs over many placeholder files.
        - If risk is high, add manualReviewReasons instead of pretending the migration is automatic.
        """;

    private static string UserPrompt(
        ModernizationRequest request,
        MigrationUnit unit,
        TargetArchitectureProfile architecture,
        WorkspacePlacement placement)
    {
        var payload = new JsonObject
        {
            ["targetMode"] = request.TargetMode,
            ["targetUiType"] = request.TargetUiType,
            ["targetRuntime"] = request.TargetRuntime,
            ["targetVersion"] = request.TargetVersion,
            ["unit"] = new JsonObject
            {
                ["id"] = unit.Id,
                ["name"] = unit.Name,
                ["modulePath"] = unit.ModulePath,
                ["track"] = unit.Track,
                ["category"] = unit.Category,
                ["targetArea"] = unit.TargetArea,
                ["riskScore"] = unit.RiskScore,
                ["requiresManualReview"] = unit.RequiresManualReview,
                ["files"] = new JsonArray(unit.Files.Select(f => (JsonNode?)JsonValue.Create(f)).ToArray()),
                ["signals"] = new JsonArray(unit.Signals.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
                ["entryPoints"] = new JsonArray(unit.EntryPoints.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
                ["exitPoints"] = new JsonArray(unit.ExitPoints.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray()),
                ["dependsOnUnits"] = new JsonArray(unit.DependsOn.Select(s => (JsonNode?)JsonValue.Create(s)).ToArray())
            },
            ["placement"] = new JsonObject
            {
                ["targetArea"] = placement.TargetArea,
                ["workspaceFolder"] = placement.WorkspaceFolder
            },
            ["architecture"] = new JsonObject
            {
                ["trackRoots"] = new JsonObject(architecture.TrackRoots.Select(kvp => new KeyValuePair<string, JsonNode?>(kvp.Key, JsonValue.Create(kvp.Value)))),
                ["placementHints"] = new JsonObject(architecture.PlacementHints.Select(kvp => new KeyValuePair<string, JsonNode?>(kvp.Key, JsonValue.Create(kvp.Value))))
            }
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
}
