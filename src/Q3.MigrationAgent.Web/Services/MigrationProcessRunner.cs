using System.Diagnostics;
using Microsoft.AspNetCore.SignalR;
using Q3.MigrationAgent.Web.Hubs;

namespace Q3.MigrationAgent.Web.Services;

public sealed class MigrationProcessRunner
{
    public const string CommandDisplay = "dotnet run --project src/Q3.MigrationAgent.Cli -- --config migrate.config.json";
    public const string LegacyCommandDisplay = "dotnet run --project src/Q3.LegacyMigration.Cli -- --config legacy-migrate.config.json";

    private readonly RepositoryRootProvider _rootProvider;
    private readonly IHubContext<MigrationHub> _hubContext;
    private readonly ILogger<MigrationProcessRunner> _logger;
    private readonly object _gate = new();
    private Process? _process;

    public MigrationProcessRunner(
        RepositoryRootProvider rootProvider,
        IHubContext<MigrationHub> hubContext,
        ILogger<MigrationProcessRunner> logger)
    {
        _rootProvider = rootProvider;
        _hubContext = hubContext;
        _logger = logger;
    }

    public bool IsRunning
    {
        get
        {
            lock (_gate)
            {
                return _process is { HasExited: false };
            }
        }
    }

    public Task<bool> StartAsync(string? migrationMode = null)
    {
        Process process;
        var isLegacy = string.Equals(migrationMode?.Trim(), "legacy", StringComparison.OrdinalIgnoreCase);
        var arguments = isLegacy
            ? "run --project src/Q3.LegacyMigration.Cli -- --config legacy-migrate.config.json"
            : "run --project src/Q3.MigrationAgent.Cli -- --config migrate.config.json";

        lock (_gate)
        {
            if (_process is { HasExited: false })
            {
                return Task.FromResult(false);
            }

            process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "dotnet",
                    Arguments = arguments,
                    WorkingDirectory = _rootProvider.RootPath,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                },
                EnableRaisingEvents = true
            };

            _process = process;
        }

        _ = RunProcessAsync(process, isLegacy ? LegacyCommandDisplay : CommandDisplay);
        return Task.FromResult(true);
    }

    public async Task<bool> CancelAsync()
    {
        Process? process;
        lock (_gate)
        {
            process = _process;
        }

        if (process is null || process.HasExited)
        {
            return false;
        }

        await BroadcastStatusAsync("Cancellation requested.");
        try
        {
            process.Kill(entireProcessTree: true);
            return true;
        }
        catch (InvalidOperationException)
        {
            return false;
        }
    }

    private async Task RunProcessAsync(Process process, string commandDisplay)
    {
        await BroadcastStatusAsync($"Starting: {commandDisplay}");

        try
        {
            process.Start();

            var stdoutTask = ReadLinesAsync(process.StandardOutput, "stdout");
            var stderrTask = ReadLinesAsync(process.StandardError, "stderr");

            await process.WaitForExitAsync();
            await Task.WhenAll(stdoutTask, stderrTask);
            await BroadcastCompletedAsync(process.ExitCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Migration process runner failed.");
            await BroadcastLogAsync("stderr", $"Migration process runner failed: {ex.Message}");
            await BroadcastCompletedAsync(-1);
        }
        finally
        {
            ClearProcess(process);
        }
    }

    private async Task ReadLinesAsync(StreamReader reader, string stream)
    {
        while (!reader.EndOfStream)
        {
            var line = await reader.ReadLineAsync();
            if (line is not null)
            {
                await BroadcastLogAsync(stream, line);
            }
        }
    }

    private Task BroadcastLogAsync(string stream, string line)
    {
        return _hubContext.Clients.All.SendAsync("log", new
        {
            stream,
            line,
            timestamp = DateTimeOffset.Now
        });
    }

    private Task BroadcastStatusAsync(string message)
    {
        return _hubContext.Clients.All.SendAsync("status", new
        {
            message,
            timestamp = DateTimeOffset.Now
        });
    }

    private Task BroadcastCompletedAsync(int exitCode)
    {
        return _hubContext.Clients.All.SendAsync("completed", new
        {
            exitCode,
            timestamp = DateTimeOffset.Now
        });
    }

    private void ClearProcess(Process process)
    {
        lock (_gate)
        {
            if (ReferenceEquals(_process, process))
            {
                _process = null;
            }
        }

        process.Dispose();
    }
}
