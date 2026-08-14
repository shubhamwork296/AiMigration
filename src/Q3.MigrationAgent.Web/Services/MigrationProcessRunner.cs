using System.Diagnostics;
using Microsoft.AspNetCore.SignalR;
using Q3.MigrationAgent.Web.Hubs;

namespace Q3.MigrationAgent.Web.Services;

public sealed class MigrationProcessRunner
{
    public const string CommandDisplay = "dotnet run --project src/Q3.MigrationAgent.Cli -- --config migrate.config.json";

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

    public Task<bool> StartAsync()
    {
        Process process;

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
                    Arguments = "run --project src/Q3.MigrationAgent.Cli -- --config migrate.config.json",
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

        _ = RunProcessAsync(process);
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

    private async Task RunProcessAsync(Process process)
    {
        await BroadcastStatusAsync($"Starting: {CommandDisplay}");

        try
        {
            process.Start();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to start migration process.");
            await BroadcastLogAsync("stderr", $"Failed to start migration process: {ex.Message}");
            await BroadcastCompletedAsync(-1);
            ClearProcess(process);
            return;
        }

        var stdoutTask = ReadLinesAsync(process.StandardOutput, "stdout");
        var stderrTask = ReadLinesAsync(process.StandardError, "stderr");

        await process.WaitForExitAsync();
        await Task.WhenAll(stdoutTask, stderrTask);
        await BroadcastCompletedAsync(process.ExitCode);
        ClearProcess(process);
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
