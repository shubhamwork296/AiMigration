using Q3.ModernizationEngine.Core.Abstractions;
using Q3.ModernizationEngine.Shared.Models;

namespace Q3.ModernizationEngine.Core.Planning;

public sealed class DeterministicModernizationAiPlanner : IModernizationAiPlanner
{
    public Task<ModuleMigrationPlan?> TryPlanAsync(
        ModernizationRequest request,
        MigrationUnit unit,
        TargetArchitectureProfile architecture,
        WorkspacePlacement placement,
        CancellationToken cancellationToken = default)
    {
        if (!request.Ai.UseAi)
        {
            return Task.FromResult<ModuleMigrationPlan?>(null);
        }

        var plan = BuildDeterministicPlan(request, unit, placement, plannerMode: $"fallback-{request.Ai.Provider}");
        return Task.FromResult<ModuleMigrationPlan?>(plan);
    }

    public static ModuleMigrationPlan BuildDeterministicPlan(
        ModernizationRequest request,
        MigrationUnit unit,
        WorkspacePlacement placement,
        string plannerMode = "deterministic")
    {
        var outputs = SuggestedOutputs(unit, request.TargetMode);
        var steps = SuggestedSteps(unit, request.TargetMode);
        var sql = DetectSqlArtifacts(unit);
        var review = unit.RequiresManualReview
            ? BuildReviewReasons(unit)
            : [];

        return new ModuleMigrationPlan
        {
            UnitId = unit.Id,
            UnitName = unit.Name,
            ModulePath = unit.ModulePath,
            Track = unit.Track,
            TargetMode = request.TargetMode,
            PlannerMode = plannerMode,
            EntryPoints = unit.EntryPoints,
            ExitPoints = unit.ExitPoints,
            DependsOnUnits = unit.DependsOn,
            SuggestedOutputs = outputs,
            Steps = steps,
            SqlArtifacts = sql,
            ManualReviewReasons = review,
            Summary = BuildSummary(unit, request.TargetMode, placement, sql, review)
        };
    }

    private static IReadOnlyList<string> SuggestedOutputs(MigrationUnit unit, string targetMode)
    {
        var outputs = new List<string>();
        if (unit.Track == "Blazor" && IncludesBlazor(targetMode))
        {
            outputs.Add("Blazor page/component");
            outputs.Add("Blazor state/view-model");
        }

        if (unit.Track == "BusinessLogic")
        {
            outputs.Add("Business service contract");
            outputs.Add("Business service implementation");
        }

        if (IncludesApi(targetMode))
        {
            outputs.Add("API endpoint or controller contract");
            outputs.Add("DTO/request-response mapping");
        }

        if (unit.Signals.Contains("direct-sql", StringComparer.OrdinalIgnoreCase))
        {
            outputs.Add("SQL extraction/review script");
        }

        return outputs;
    }

    private static IReadOnlyList<string> SuggestedSteps(MigrationUnit unit, string targetMode)
    {
        var steps = new List<string>();
        if (unit.Track == "BusinessLogic")
        {
            steps.Add("Extract business rules and supporting services from legacy files.");
            steps.Add("Map legacy dependencies into reusable service abstractions.");
            if (IncludesApi(targetMode))
            {
                steps.Add("Expose business capabilities through API contracts for downstream consumers.");
            }
        }
        else if (IncludesBlazor(targetMode))
        {
            steps.Add("Map legacy UI flow into Blazor components/pages.");
            if (IncludesApi(targetMode))
            {
                steps.Add("Connect Blazor interactions to API contracts instead of direct legacy coupling.");
            }
            else
            {
                steps.Add("Keep Blazor migration aligned with reusable business logic contracts.");
            }
        }

        if (IsApiPhaseOnly(targetMode))
        {
            steps.Add("Stop after API/service generation; do not generate UI artifacts in this phase.");
        }

        if (IsUiPhaseOnly(targetMode))
        {
            steps.Add("Use existing API/service contracts and focus only on UI migration in this phase.");
        }

        if (unit.Signals.Contains("session-state", StringComparer.OrdinalIgnoreCase))
        {
            steps.Add("Replace session-bound behavior with explicit state management or API-backed state.");
        }

        if (unit.Signals.Contains("viewstate", StringComparer.OrdinalIgnoreCase) || unit.Signals.Contains("partial-postback", StringComparer.OrdinalIgnoreCase))
        {
            steps.Add("Replace postback/viewstate lifecycle with explicit component state transitions.");
        }

        if (unit.Signals.Contains("forms-auth", StringComparer.OrdinalIgnoreCase))
        {
            steps.Add("Review authentication flow before automatic migration.");
        }

        return steps;
    }

    private static IReadOnlyList<string> DetectSqlArtifacts(MigrationUnit unit)
    {
        if (!unit.Signals.Contains("direct-sql", StringComparer.OrdinalIgnoreCase))
        {
            return [];
        }

        return
        [
            "Create SQL extraction checklist",
            "Review inline queries and stored procedure dependencies",
            "Generate API/data-access migration script if needed"
        ];
    }

    private static IReadOnlyList<string> BuildReviewReasons(MigrationUnit unit)
    {
        var reasons = new List<string>();
        if (unit.Signals.Contains("session-state", StringComparer.OrdinalIgnoreCase)) reasons.Add("Session state requires explicit migration strategy.");
        if (unit.Signals.Contains("viewstate", StringComparer.OrdinalIgnoreCase)) reasons.Add("ViewState usage cannot be mechanically converted.");
        if (unit.Signals.Contains("system-web", StringComparer.OrdinalIgnoreCase)) reasons.Add("System.Web dependency requires platform redesign review.");
        if (unit.Signals.Contains("forms-auth", StringComparer.OrdinalIgnoreCase)) reasons.Add("Forms authentication flow requires security review.");
        if (unit.Signals.Contains("config-dependency", StringComparer.OrdinalIgnoreCase)) reasons.Add("Config-heavy logic should be mapped manually before automation.");
        return reasons.Count == 0 ? ["Legacy complexity requires manual review."] : reasons;
    }

    private static string BuildSummary(MigrationUnit unit, string targetMode, WorkspacePlacement placement, IReadOnlyList<string> sql, IReadOnlyList<string> review)
    {
        var summary = $"{unit.Name} will be migrated through the {unit.Track} track into {placement.TargetArea}";
        summary += IncludesApi(targetMode) ? " with API integration enabled." : ".";
        if (unit.EntryPoints.Count > 0) summary += $" Start from {string.Join(", ", unit.EntryPoints)}.";
        if (unit.ExitPoints.Count > 0) summary += $" Boundary points: {string.Join(", ", unit.ExitPoints)}.";
        if (sql.Count > 0) summary += " SQL extraction work is required.";
        if (review.Count > 0) summary += " Manual review is required before automated generation.";
        return summary;
    }

    private static bool IncludesBlazor(string targetMode) =>
        targetMode is "blazor-only" or "blazor-and-api" or "ui-only";

    private static bool IncludesApi(string targetMode) =>
        targetMode is "api-only" or "blazor-and-api" or "api-phase";

    private static bool IsApiPhaseOnly(string targetMode) =>
        targetMode is "api-only" or "api-phase";

    private static bool IsUiPhaseOnly(string targetMode) =>
        targetMode is "ui-only";
}
