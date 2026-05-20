using System.Collections.Concurrent;
using System.Diagnostics;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Core.Logging;
using Q3.MigrationAgent.Shared.DTO;

namespace Q3.MigrationAgent.Core.Commands;

public sealed class CommandRunner(RunLog? runLog = null) : ICommandRunner
{
    private static readonly string[] WindowsExtensions = [".cmd", ".exe", ".bat"];
    private readonly RunLog _runLog = runLog ?? new RunLog();

    public async Task<CommandResult> RunAsync(
        IReadOnlyList<string> command,
        string? workingDirectory = null,
        string? input = null,
        int? timeoutSeconds = null,
        IProgressReporter? progress = null,
        string? stage = null,
        string? description = null,
        string? logPath = null,
        double heartbeatIntervalSeconds = 120,
        int? idleTimeoutSeconds = null,
        CancellationToken cancellationToken = default)
    {
        if (command.Count == 0)
        {
            return new CommandResult { ReturnCode = 127, Stderr = "No command specified." };
        }

        var resolved = ResolveCommand(command);
        var commandText = string.Join(" ", command);
        var resolvedText = string.Join(" ", resolved);
        _runLog.Append(logPath, $"$ {commandText}\nresolved: {resolvedText}\ncwd: {workingDirectory ?? Directory.GetCurrentDirectory()}");
        var started = Stopwatch.StartNew();
        if (progress is not null && stage is not null && description is not null)
        {
            progress.Stage(stage, $"Starting {description}...");
        }

        try
        {
            return await RunProcessAsync(resolved, workingDirectory, input, timeoutSeconds, progress, stage, description, logPath, heartbeatIntervalSeconds, idleTimeoutSeconds, started, cancellationToken);
        }
        catch (FileNotFoundException ex)
        {
            started.Stop();
            _runLog.Append(logPath, $"ERROR: {ex.Message}\nelapsed: {FormatElapsed(started.Elapsed.TotalSeconds)}");
            progress?.Error(stage ?? "Command", $"{description ?? "command"} failed. Full log: {logPath}");
            return new CommandResult { ReturnCode = 127, Stderr = ex.Message, ResolvedCommand = resolved, DurationSeconds = started.Elapsed.TotalSeconds };
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            started.Stop();
            var timeoutKind = timeoutSeconds is not null && started.Elapsed.TotalSeconds >= timeoutSeconds.Value ? "total-timeout" : "idle-timeout";
            _runLog.Append(logPath, $"TIMEOUT ({timeoutKind})\nelapsed: {FormatElapsed(started.Elapsed.TotalSeconds)}");
            progress?.Error(stage ?? "Command", $"{description ?? "command"} failed. Full log: {logPath}");
            return new CommandResult { ReturnCode = 124, Stderr = $"Command timed out ({timeoutKind}).", ResolvedCommand = resolved, DurationSeconds = started.Elapsed.TotalSeconds, TimeoutKind = timeoutKind, FailureCategory = timeoutKind, FailureReason = "Command timed out.", SuggestedNextAction = "Increase the command timeout or inspect the process output in the migration log." };
        }
    }

    public static IReadOnlyList<string> ResolveCommand(IReadOnlyList<string> command)
    {
        if (command.Count == 0) return command;
        var executable = ResolveExecutable(command[0]) ?? command[0];
        return [executable, .. command.Skip(1)];
    }

    public static string? ResolveExecutable(string name)
    {
        if (!OperatingSystem.IsWindows())
        {
            return FindOnPath(name);
        }

        var suffix = Path.GetExtension(name).ToLowerInvariant();
        var candidates = WindowsExtensions.Contains(suffix)
            ? [name]
            : WindowsExtensions.Select(ext => name + ext).Concat([name]);
        return candidates.Select(FindOnPath).FirstOrDefault(path => path is not null);
    }

    private async Task<CommandResult> RunProcessAsync(
        IReadOnlyList<string> command,
        string? workingDirectory,
        string? input,
        int? timeoutSeconds,
        IProgressReporter? progress,
        string? stage,
        string? description,
        string? logPath,
        double heartbeatIntervalSeconds,
        int? idleTimeoutSeconds,
        Stopwatch started,
        CancellationToken cancellationToken)
    {
        var psi = new ProcessStartInfo(command[0])
        {
            WorkingDirectory = workingDirectory ?? Directory.GetCurrentDirectory(),
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            RedirectStandardInput = input is not null,
            UseShellExecute = false
        };
        foreach (var arg in command.Skip(1)) psi.ArgumentList.Add(arg);

        using var process = new Process { StartInfo = psi, EnableRaisingEvents = true };
        if (!process.Start())
        {
            throw new FileNotFoundException($"Unable to start command: {command[0]}");
        }

        if (input is not null)
        {
            await process.StandardInput.WriteAsync(input.AsMemory(), cancellationToken);
            process.StandardInput.Close();
        }

        var output = new ConcurrentQueue<(string Stream, string Line)>();
        var stdoutTask = Task.Run(() => ReadStreamAsync(process.StandardOutput, "stdout", output, cancellationToken), cancellationToken);
        var stderrTask = Task.Run(() => ReadStreamAsync(process.StandardError, "stderr", output, cancellationToken), cancellationToken);
        using var timeoutCts = timeoutSeconds is null ? null : new CancellationTokenSource(TimeSpan.FromSeconds(timeoutSeconds.Value));
        using var idleCts = idleTimeoutSeconds is > 0 ? new CancellationTokenSource(TimeSpan.FromSeconds(idleTimeoutSeconds.Value)) : null;
        using var linked = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts?.Token ?? CancellationToken.None, idleCts?.Token ?? CancellationToken.None);

        var stdout = new List<string>();
        var stderr = new List<string>();
        var lastHeartbeat = Stopwatch.StartNew();
        var lastOutputUtc = DateTimeOffset.UtcNow;
        while (!process.HasExited)
        {
            if (Drain(output, stdout, stderr, progress, logPath))
            {
                lastOutputUtc = DateTimeOffset.UtcNow;
                idleCts?.CancelAfter(TimeSpan.FromSeconds(idleTimeoutSeconds!.Value));
            }
            if (idleTimeoutSeconds is > 0 && (DateTimeOffset.UtcNow - lastOutputUtc).TotalSeconds >= idleTimeoutSeconds.Value)
            {
                try { process.Kill(entireProcessTree: true); } catch { }
                started.Stop();
                _runLog.Append(logPath, $"TIMEOUT (idle-timeout)\nelapsed: {FormatElapsed(started.Elapsed.TotalSeconds)}");
                return new CommandResult { ReturnCode = 124, Stdout = string.Concat(stdout), Stderr = "Command timed out (idle-timeout).", ResolvedCommand = command.ToArray(), DurationSeconds = started.Elapsed.TotalSeconds, TimeoutKind = "idle-timeout", FailureCategory = "idle-timeout", FailureReason = $"No output for {idleTimeoutSeconds.Value} seconds.", SuggestedNextAction = "Inspect the migration log or rerun with a larger idle timeout." };
            }
            if (linked.IsCancellationRequested)
            {
                try { process.Kill(entireProcessTree: true); } catch { }
                if (idleCts?.IsCancellationRequested == true)
                {
                    started.Stop();
                    _runLog.Append(logPath, $"TIMEOUT (idle-timeout)\nelapsed: {FormatElapsed(started.Elapsed.TotalSeconds)}");
                    return new CommandResult { ReturnCode = 124, Stdout = string.Concat(stdout), Stderr = "Command timed out (idle-timeout).", ResolvedCommand = command.ToArray(), DurationSeconds = started.Elapsed.TotalSeconds, TimeoutKind = "idle-timeout", FailureCategory = "idle-timeout", FailureReason = $"No output for {idleTimeoutSeconds!.Value} seconds.", SuggestedNextAction = "Inspect the migration log or rerun with a larger idle timeout." };
                }
                throw new OperationCanceledException();
            }
            if (progress is not null && stage is not null && description is not null && heartbeatIntervalSeconds > 0 && lastHeartbeat.Elapsed.TotalSeconds >= heartbeatIntervalSeconds)
            {
                progress.Stage(stage, $"{description} still running... elapsed {FormatElapsed(started.Elapsed.TotalSeconds)}");
                lastHeartbeat.Restart();
            }
            await Task.Delay(100, cancellationToken);
        }

        await Task.WhenAll(stdoutTask, stderrTask);
        Drain(output, stdout, stderr, progress, logPath);
        started.Stop();
        var stdoutText = string.Concat(stdout);
        var stderrText = string.Concat(stderr);
        _runLog.Append(logPath, $"exit code: {process.ExitCode}\nelapsed: {FormatElapsed(started.Elapsed.TotalSeconds)}\n{stdoutText}{stderrText}");
        if (progress is not null && stage is not null && description is not null)
        {
            if (process.ExitCode == 0) progress.Stage(stage, $"{description} completed successfully.");
            else progress.Error(stage, $"{description} failed. Full log: {logPath}");
        }

        return new CommandResult
        {
            ReturnCode = process.ExitCode,
            Stdout = stdoutText,
            Stderr = stderrText,
            ResolvedCommand = command.ToArray(),
            DurationSeconds = started.Elapsed.TotalSeconds
        };
    }

    private static async Task ReadStreamAsync(StreamReader reader, string name, ConcurrentQueue<(string Stream, string Line)> output, CancellationToken cancellationToken)
    {
        while (!reader.EndOfStream)
        {
            var line = await reader.ReadLineAsync(cancellationToken);
            if (line is not null) output.Enqueue((name, line + Environment.NewLine));
        }
    }

    private bool Drain(ConcurrentQueue<(string Stream, string Line)> output, List<string> stdout, List<string> stderr, IProgressReporter? progress, string? logPath)
    {
        var drained = false;
        while (output.TryDequeue(out var item))
        {
            drained = true;
            if (item.Stream == "stdout") stdout.Add(item.Line);
            else stderr.Add(item.Line);
            _runLog.Append(logPath, item.Line.TrimEnd());
            if (progress?.Verbose == true) Console.Write(item.Line);
        }
        return drained;
    }

    private static string? FindOnPath(string name)
    {
        if (Path.IsPathRooted(name) && File.Exists(name)) return name;
        var path = Environment.GetEnvironmentVariable("PATH") ?? "";
        foreach (var dir in path.Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries))
        {
            var candidate = Path.Combine(dir, name);
            if (File.Exists(candidate)) return candidate;
        }
        return null;
    }

    private static string FormatElapsed(double seconds) => seconds >= 60 ? $"{(int)(seconds / 60)}m" : $"{(int)seconds}s";
}
