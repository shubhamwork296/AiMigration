using System.Text;
using Q3.ModernizationEngine.Core.Abstractions;
using Q3.ModernizationEngine.Shared.Models;

namespace Q3.ModernizationEngine.Core.Execution;

public sealed class DeterministicModuleContentGenerator : IModuleContentGenerator
{
    private readonly LegacyBusinessLogicExtractor _extractor = new();

    public Task<ModuleExecutionResult> GenerateAsync(
        ModernizationRequest request,
        ModuleMigrationPlan plan,
        WorkspacePlacement placement,
        IModernizationProgressReporter progress,
        CancellationToken cancellationToken = default)
    {
        progress.Detail($"Using deterministic generator for {plan.UnitName}.");
        var artifacts = new List<GeneratedArtifact>();
        var warnings = new List<string>();
        var legacyContext = _extractor.Extract(request, plan);
        progress.Detail($"Business logic token: {legacyContext.DominantToken}");
        progress.Detail($"Matched business files: {string.Join(", ", legacyContext.BusinessFiles.Select(Path.GetFileName).DefaultIfEmpty("none"))}");
        progress.Detail($"Matched repository files: {string.Join(", ", legacyContext.RepositoryFiles.Select(Path.GetFileName).DefaultIfEmpty("none"))}");
        progress.Detail($"Extracted service methods: {legacyContext.ServiceMethods.Count}; repository methods: {legacyContext.RepositoryMethods.Count}");

        if (plan.Track == "Blazor" && IncludesBlazor(plan.TargetMode))
        {
            artifacts.Add(WriteArtifact(placement, Path.Combine("Pages", $"{Sanitize(plan.UnitName)}.razor"), "blazor-page", BuildBlazorPage(plan)));
            artifacts.Add(WriteArtifact(placement, Path.Combine("Models", $"{Sanitize(plan.UnitName)}ViewModel.cs"), "blazor-viewmodel", BuildViewModel(plan)));
        }

        if (IncludesApi(plan.TargetMode))
        {
            artifacts.Add(WriteArtifact(placement, Path.Combine("Controllers", $"{Sanitize(plan.UnitName)}Controller.cs"), "api-endpoint", BuildApiEndpoint(plan, legacyContext)));
            artifacts.Add(WriteArtifact(placement, Path.Combine("Contracts", $"{Sanitize(plan.UnitName)}Contracts.cs"), "api-contracts", BuildApiContracts(plan, legacyContext)));
            artifacts.Add(WriteArtifact(placement, Path.Combine("Services", $"I{Sanitize(plan.UnitName)}Service.cs"), "api-service-contract", BuildBusinessContract(plan, legacyContext)));
            artifacts.Add(WriteArtifact(placement, Path.Combine("Services", $"{Sanitize(plan.UnitName)}Service.cs"), "api-service", BuildBusinessService(plan, legacyContext)));
            artifacts.Add(WriteArtifact(placement, Path.Combine("DI", $"{Sanitize(plan.UnitName)}Registration.cs"), "api-di", BuildDiRegistration(plan)));
        }
        
        if (plan.Track == "BusinessLogic" && !IncludesApi(plan.TargetMode))
        {
            artifacts.Add(WriteArtifact(placement, $"{Sanitize(plan.UnitName)}Service.cs", "business-service", BuildBusinessService(plan, legacyContext)));
            artifacts.Add(WriteArtifact(placement, $"{Sanitize(plan.UnitName)}ServiceContract.cs", "business-contract", BuildBusinessContract(plan, legacyContext)));
        }

        if (IncludesApi(plan.TargetMode) && plan.SqlArtifacts.Count > 0)
        {
            artifacts.Add(WriteArtifact(placement, Path.Combine("Repositories", $"I{Sanitize(plan.UnitName)}Repository.cs"), "api-repository-contract", BuildRepositoryContract(plan, legacyContext)));
            artifacts.Add(WriteArtifact(placement, Path.Combine("Repositories", $"{Sanitize(plan.UnitName)}Repository.cs"), "api-repository", BuildRepositoryStub(plan, legacyContext)));
        }

        if (plan.SqlArtifacts.Count > 0)
        {
            artifacts.Add(WriteArtifact(placement, Path.Combine("Sql", $"{Sanitize(plan.UnitName)}.sql"), "sql-script", BuildSqlTemplate(plan)));
            warnings.Add("SQL-related migration work was detected. Review generated SQL placeholder before execution.");
        }

        if (plan.ManualReviewReasons.Count > 0)
        {
            warnings.AddRange(plan.ManualReviewReasons);
        }

        return Task.FromResult(new ModuleExecutionResult
        {
            UnitId = plan.UnitId,
            UnitName = plan.UnitName,
            Track = plan.Track,
            ExecutorMode = request.Ai.UseAi ? "generic-execution-fallback" : "deterministic",
            WorkspaceFolder = placement.WorkspaceFolder,
            GeneratedArtifacts = artifacts,
            Warnings = warnings
        });
    }

    private static GeneratedArtifact WriteArtifact(WorkspacePlacement placement, string relativePath, string kind, string content)
    {
        var path = Path.Combine(placement.WorkspaceFolder, relativePath);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        File.WriteAllText(path, content, Encoding.UTF8);
        return new GeneratedArtifact
        {
            RelativePath = Path.GetRelativePath(placement.WorkspaceFolder, path).Replace(Path.DirectorySeparatorChar, '/'),
            Kind = kind,
            Summary = $"Generated {kind} scaffold in {placement.Track} track."
        };
    }

    private static string BuildBlazorPage(ModuleMigrationPlan plan) => $$"""
@page "/{{Slug(plan.UnitName)}}"

<PageTitle>{{plan.UnitName}}</PageTitle>

<h3>{{plan.UnitName}}</h3>

<p>This scaffold was generated by the migration master for the {{plan.Track}} track.</p>

<ul>
@foreach (var step in MigrationSteps)
{
    <li>@step</li>
}
</ul>

@code {
    private static readonly string[] MigrationSteps = new[]
    {
{{JoinLines(plan.Steps.Select(s => $"        \"{Escape(s)}\","))}}
    };
}
""";

    private static string BuildViewModel(ModuleMigrationPlan plan) => $$"""
namespace Generated.Blazor;

public sealed class {{Sanitize(plan.UnitName)}}ViewModel
{
    public string Title { get; } = "{{Escape(plan.UnitName)}}";
    public string Summary { get; } = "{{Escape(plan.Summary)}}";
}
""";

    private static string BuildApiEndpoint(ModuleMigrationPlan plan, LegacyBusinessLogicContext context) => $$"""
namespace Generated.Api.Controllers;

using Microsoft.AspNetCore.Mvc;
using Generated.Api.Contracts;

[ApiController]
[Route("api/{{Slug(plan.UnitName)}}")]
public sealed class {{Sanitize(plan.UnitName)}}Controller : ControllerBase
{
    private readonly I{{Sanitize(plan.UnitName)}}Service _service;

    public {{Sanitize(plan.UnitName)}}Controller(I{{Sanitize(plan.UnitName)}}Service service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<{{Sanitize(plan.UnitName)}}Response>> Get(CancellationToken cancellationToken)
    {
        var operations = await _service.DescribeAvailableOperationsAsync(cancellationToken);
        return Ok(new {{Sanitize(plan.UnitName)}}Response("{{Escape(plan.UnitName)}} endpoint scaffold", operations));
    }
}
""";

    private static string BuildApiContracts(ModuleMigrationPlan plan, LegacyBusinessLogicContext context) => $$"""
namespace Generated.Api.Contracts;

public sealed record {{Sanitize(plan.UnitName)}}Request(string CorrelationId);

public sealed record {{Sanitize(plan.UnitName)}}Response(string Message, IReadOnlyList<string> Operations);
""";

    private static string BuildBusinessService(ModuleMigrationPlan plan, LegacyBusinessLogicContext context) => $$"""
namespace Generated.Api.Services;

using Generated.Api.Repositories;

public sealed class {{Sanitize(plan.UnitName)}}Service : I{{Sanitize(plan.UnitName)}}Service
{
    private readonly I{{Sanitize(plan.UnitName)}}Repository _repository;

    public {{Sanitize(plan.UnitName)}}Service(I{{Sanitize(plan.UnitName)}}Repository repository)
    {
        _repository = repository;
    }

{{JoinLines(BuildServiceMethods(plan, context))}}
}
""";

    private static string BuildRepositoryStub(ModuleMigrationPlan plan, LegacyBusinessLogicContext context) => $$"""
namespace Generated.Api.Repositories;

public sealed class {{Sanitize(plan.UnitName)}}Repository : I{{Sanitize(plan.UnitName)}}Repository
{
{{JoinLines(BuildRepositoryMethods(context))}}
}
""";

    private static string BuildDiRegistration(ModuleMigrationPlan plan) => $$"""
namespace Generated.Api.DI;

using Microsoft.Extensions.DependencyInjection;

public static class {{Sanitize(plan.UnitName)}}Registration
{
    public static IServiceCollection Add{{Sanitize(plan.UnitName)}}Module(this IServiceCollection services)
    {
        services.AddScoped<I{{Sanitize(plan.UnitName)}}Service, {{Sanitize(plan.UnitName)}}Service>();
        return services;
    }
}
""";

    private static string BuildBusinessContract(ModuleMigrationPlan plan, LegacyBusinessLogicContext context) => $$"""
namespace Generated.Api.Services;

public interface I{{Sanitize(plan.UnitName)}}Service
{
    Task<IReadOnlyList<string>> DescribeAvailableOperationsAsync(CancellationToken cancellationToken);
{{JoinLines(BuildServiceContractMethods(context))}}
}
""";

    private static string BuildRepositoryContract(ModuleMigrationPlan plan, LegacyBusinessLogicContext context) => $$"""
namespace Generated.Api.Repositories;

public interface I{{Sanitize(plan.UnitName)}}Repository
{
{{JoinLines(BuildRepositoryContractMethods(context))}}
}
""";

    private static string BuildSqlTemplate(ModuleMigrationPlan plan) => $$"""
-- SQL migration placeholder for {{plan.UnitName}}
-- Review and replace with real extraction or migration script.

{{JoinLines(plan.SqlArtifacts.Select(s => $"-- {Escape(s)}"))}}
""";

    private static string Sanitize(string name)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var cleaned = new string(name.Where(ch => !invalid.Contains(ch)).ToArray());
        cleaned = cleaned.Replace(" ", "", StringComparison.Ordinal);
        return string.IsNullOrWhiteSpace(cleaned) ? "GeneratedModule" : cleaned;
    }

    private static string Slug(string name) =>
        string.Join("-", name.Split([' ', '_', '-'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)).ToLowerInvariant();

    private static bool IncludesBlazor(string targetMode) =>
        targetMode is "blazor-only" or "blazor-and-api" or "ui-only";

    private static bool IncludesApi(string targetMode) =>
        targetMode is "api-only" or "blazor-and-api" or "api-phase";

    private static string Escape(string value) => value.Replace("\\", "\\\\", StringComparison.Ordinal).Replace("\"", "\\\"", StringComparison.Ordinal);

    private static string JoinLines(IEnumerable<string> lines) => string.Join(Environment.NewLine, lines);

    private static IEnumerable<string> BuildServiceContractMethods(LegacyBusinessLogicContext context)
    {
        foreach (var method in context.ServiceMethods.Take(12))
        {
            yield return $"    Task<{MapReturnType(method.ReturnType)}> {method.MethodName}Async({BuildParameters(method.Parameters, includeCancellation: true)});";
        }
    }

    private static IEnumerable<string> BuildRepositoryContractMethods(LegacyBusinessLogicContext context)
    {
        foreach (var method in context.RepositoryMethods.Take(12))
        {
            yield return $"    Task<{MapReturnType(method.ReturnType)}> {method.MethodName}Async({BuildParameters(method.Parameters, includeCancellation: true)});";
        }
    }

    private static IEnumerable<string> BuildServiceMethods(ModuleMigrationPlan plan, LegacyBusinessLogicContext context)
    {
        yield return """
    public Task<IReadOnlyList<string>> DescribeAvailableOperationsAsync(CancellationToken cancellationToken)
    {
        IReadOnlyList<string> operations = new[]
        {
""";
        foreach (var method in context.ServiceMethods.Take(12))
        {
            yield return $"            \"{method.MethodName}\",";
        }
        if (context.ServiceMethods.Count == 0)
        {
            yield return $"            \"{Escape(plan.UnitName)}_manual_review\",";
        }
        yield return """
        };

        return Task.FromResult(operations);
    }
""";

        foreach (var method in context.ServiceMethods.Take(12))
        {
            yield return $"    // Legacy source: {Escape(Path.GetFileName(method.SourceFile))} :: {Escape(method.MethodName)}";
            yield return $"    public async Task<{MapReturnType(method.ReturnType)}> {method.MethodName}Async({BuildParameters(method.Parameters, includeCancellation: true)})";
            yield return "    {";
            yield return $"        // Converted from BusinessLayer method {method.MethodName}; preserve business behavior during full migration.";
            yield return $"        return await _repository.{method.MethodName}Async({BuildInvocationArguments(method.Parameters)}{BuildCancellationArgument(method.Parameters)});";
            yield return "    }";
            yield return "";
        }
    }

    private static IEnumerable<string> BuildRepositoryMethods(LegacyBusinessLogicContext context)
    {
        foreach (var method in context.RepositoryMethods.Take(12))
        {
            yield return $"    // Legacy SQL source: {Escape(Path.GetFileName(method.SourceFile))} :: {Escape(method.MethodName)}";
            yield return $"    public Task<{MapReturnType(method.ReturnType)}> {method.MethodName}Async({BuildParameters(method.Parameters, includeCancellation: true)})";
            yield return "    {";
            yield return "        // TODO: Replace this placeholder with translated parameterized SQL or ORM logic from the legacy repository.";
            yield return $"        throw new NotImplementedException(\"Legacy repository method '{Escape(method.MethodName)}' requires SQL translation.\");";
            yield return "    }";
            yield return "";
        }
    }

    private static string BuildParameters(IReadOnlyList<LegacyParameterSignature> parameters, bool includeCancellation)
    {
        var parts = parameters
            .Select(parameter => $"{MapParameterType(parameter.Type)} {parameter.Name}")
            .ToList();
        if (includeCancellation)
        {
            parts.Add("CancellationToken cancellationToken");
        }

        return string.Join(", ", parts);
    }

    private static string BuildInvocationArguments(IReadOnlyList<LegacyParameterSignature> parameters)
    {
        if (parameters.Count == 0)
        {
            return string.Empty;
        }

        return string.Join(", ", parameters.Select(parameter => parameter.Name)) + ", ";
    }

    private static string BuildCancellationArgument(IReadOnlyList<LegacyParameterSignature> parameters) => "cancellationToken";

    private static string MapReturnType(string legacyReturnType) => legacyReturnType switch
    {
        "int" => "int",
        "string" => "string",
        "bool" => "bool",
        "DataSet" => "object?",
        _ => "object?"
    };

    private static string MapParameterType(string legacyType) => legacyType switch
    {
        "int" => "int",
        "string" => "string",
        "bool" => "bool",
        "DateTime" => "DateTime",
        _ => "object?"
    };
}
