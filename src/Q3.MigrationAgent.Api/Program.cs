using Q3.MigrationAgent.Business.DI;
using Q3.MigrationAgent.Shared.Config;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton(MigrationAgentServices.Create());

var app = builder.Build();

app.MapPost("/api/migration/run", async (MigrationRequest request, MigrationAgentServices services, CancellationToken cancellationToken) =>
{
    try
    {
        MigrationConfig config;
        if (!string.IsNullOrWhiteSpace(request.ConfigPath))
        {
            config = await services.ConfigLoader.LoadAsync(request.ConfigPath, cancellationToken: cancellationToken);
        }
        else if (request.Config is not null)
        {
            config = request.Config;
        }
        else
        {
            return Results.BadRequest(new MigrationResponse(false, null, null, null, ["configPath or config is required."], []));
        }

        var result = await services.Orchestrator.RunMigrationAsync(config, cancellationToken);
        return Results.Ok(new MigrationResponse(result.Success, result.ReportPath, result.LogPath, result.ValidationPassed, result.Errors, result.Warnings));
    }
    catch (Exception ex)
    {
        return Results.Ok(new MigrationResponse(false, null, null, false, [ex.Message], []));
    }
});

app.Run();

public sealed record MigrationRequest(string? ConfigPath, MigrationConfig? Config);
public sealed record MigrationResponse(bool Success, string? ReportPath, string? LogPath, bool? ValidationPassed, IReadOnlyList<string> Errors, IReadOnlyList<string> Warnings);

