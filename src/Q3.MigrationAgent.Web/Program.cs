using Q3.MigrationAgent.Web.Hubs;
using Q3.MigrationAgent.Web.Models;
using Q3.MigrationAgent.Web.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalR();
builder.Services.AddSingleton<RepositoryRootProvider>();
builder.Services.AddSingleton<MigrationConfigService>();
builder.Services.AddSingleton<MigrationProcessRunner>();
builder.Services.AddSingleton<FolderDialogService>();

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapHub<MigrationHub>("/migrationHub");

app.MapGet("/", (IWebHostEnvironment environment) =>
{
    var indexPath = Path.Combine(environment.WebRootPath, "index.html");
    return Results.File(indexPath, "text/html");
});

app.MapGet("/api/migration/config-defaults", (MigrationConfigService configService) =>
{
    return Results.Ok(configService.GetDefaults());
});

app.MapPost("/api/migration/browse-folder", async (
    BrowseFolderRequest request,
    FolderDialogService folderDialogService,
    CancellationToken cancellationToken) =>
{
    var selectedPath = await folderDialogService.BrowseAsync(request.InitialPath, cancellationToken);
    return selectedPath is null
        ? Results.NoContent()
        : Results.Ok(new { path = selectedPath });
});

app.MapPost("/api/migration/start", async (
    MigrationStartRequest request,
    MigrationConfigService configService,
    MigrationProcessRunner runner) =>
{
    if (runner.IsRunning)
    {
        return Results.Conflict(new { message = "A migration is already running." });
    }

    var validationError = ValidatePathRequest(request);
    if (validationError is not null)
    {
        return Results.BadRequest(new { message = validationError });
    }

    var effectiveConfig = configService.BuildEffectiveConfig(request);
    configService.SaveConfig(effectiveConfig);

    var started = await runner.StartAsync();
    if (!started)
    {
        return Results.Conflict(new { message = "A migration is already running." });
    }

    return Results.Accepted("/api/migration/start", new
    {
        message = "Migration started.",
        command = MigrationProcessRunner.CommandDisplay
    });
});

app.MapPost("/api/migration/cancel", async (MigrationProcessRunner runner) =>
{
    var cancelled = await runner.CancelAsync();
    if (!cancelled)
    {
        return Results.NotFound(new { message = "No migration process is running." });
    }

    return Results.Ok(new { message = "Cancellation requested." });
});

app.MapFallbackToFile("index.html");

app.Run();

static string? ValidatePathRequest(MigrationStartRequest request)
{
    if (IsRelativePath(request.SourcePath))
    {
        return "Source folder must be an absolute path, for example D:\\Projects\\AWC\\awc_bookingflow_api\\PICO.API.";
    }

    if (!string.IsNullOrWhiteSpace(request.SourcePath) && !Directory.Exists(request.SourcePath.Trim()))
    {
        return $"Source folder does not exist: {request.SourcePath.Trim()}";
    }

    if (IsRelativePath(request.OutputPath))
    {
        return "Output folder must be an absolute path, for example D:\\Projects\\AWC\\awc_bookingflow_api\\PICO.API_Output.";
    }

    return null;
}

static bool IsRelativePath(string? path)
{
    return !string.IsNullOrWhiteSpace(path) && !Path.IsPathRooted(path.Trim());
}
