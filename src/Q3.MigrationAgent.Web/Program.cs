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

app.MapPost("/api/migration/browse-file", async (
    BrowseFolderRequest request,
    FolderDialogService folderDialogService,
    CancellationToken cancellationToken) =>
{
    var selectedPath = await folderDialogService.BrowseFileAsync(request.InitialPath, cancellationToken);
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
    configService.SaveConfig(effectiveConfig, request.MigrationMode);

    var started = await runner.StartAsync(request.MigrationMode);
    if (!started)
    {
        return Results.Conflict(new { message = "A migration is already running." });
    }

    return Results.Accepted("/api/migration/start", new
    {
        message = "Migration started.",
        command = string.Equals(request.MigrationMode?.Trim(), "legacy", StringComparison.OrdinalIgnoreCase)
            ? MigrationProcessRunner.LegacyCommandDisplay
            : MigrationProcessRunner.CommandDisplay
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
    var isLegacy = string.Equals(request.MigrationMode?.Trim(), "legacy", StringComparison.OrdinalIgnoreCase);
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

    if (isLegacy)
    {
        if (IsRelativePath(request.TargetArchitecturePath))
        {
            return "Target architecture folder must be an absolute path.";
        }

        if (string.IsNullOrWhiteSpace(request.TargetArchitecturePath))
        {
            return "Target architecture folder is required for legacy migration.";
        }

        if (!Directory.Exists(request.TargetArchitecturePath.Trim()))
        {
            return $"Target architecture folder does not exist: {request.TargetArchitecturePath.Trim()}";
        }

        if (IsRelativePath(request.MigrationContextPath))
        {
            return "Context file must be an absolute path.";
        }

        if (!string.IsNullOrWhiteSpace(request.MigrationContextPath) && !File.Exists(request.MigrationContextPath.Trim()))
        {
            return $"Context file does not exist: {request.MigrationContextPath.Trim()}";
        }
    }

    return null;
}

static bool IsRelativePath(string? path)
{
    return !string.IsNullOrWhiteSpace(path) && !Path.IsPathRooted(path.Trim());
}
