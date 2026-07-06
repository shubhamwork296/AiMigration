using System.Diagnostics;
using System.ComponentModel;
using System.Text;

namespace Q3.LegacyMigration.Commands;

public interface ICommandRunner
{
    Task<CommandResult> RunAsync(IReadOnlyList<string> command, string workingDirectory, int timeoutSeconds, CancellationToken cancellationToken = default, string? input = null);
}

public sealed record CommandResult(int ExitCode, string Output);

public sealed class CommandRunner : ICommandRunner
{
    private static readonly string[] WindowsExtensions = [".cmd", ".exe", ".bat", ".ps1"];

    public async Task<CommandResult> RunAsync(IReadOnlyList<string> command, string workingDirectory, int timeoutSeconds, CancellationToken cancellationToken = default, string? input = null)
    {
        if (command.Count == 0) throw new ArgumentException("Command cannot be empty.", nameof(command));
        using var timeout = timeoutSeconds > 0 ? new CancellationTokenSource(TimeSpan.FromSeconds(timeoutSeconds)) : new CancellationTokenSource();
        using var linked = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeout.Token);
        var output = new StringBuilder();
        var resolved = ResolveCommand(command, workingDirectory);
        var start = new ProcessStartInfo(resolved[0])
        {
            WorkingDirectory = workingDirectory,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            RedirectStandardInput = input is not null,
            UseShellExecute = false
        };
        foreach (var arg in resolved.Skip(1)) start.ArgumentList.Add(arg);
        using var process = StartProcess(start, command[0]);
        if (process is null) return new CommandResult(127, $"Command not found: {command[0]}");
        process.OutputDataReceived += (_, e) => { if (e.Data is not null) output.AppendLine(e.Data); };
        process.ErrorDataReceived += (_, e) => { if (e.Data is not null) output.AppendLine(e.Data); };
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();
        if (input is not null)
        {
            await process.StandardInput.WriteAsync(input);
            await process.StandardInput.FlushAsync(cancellationToken);
            process.StandardInput.Close();
        }
        await process.WaitForExitAsync(linked.Token);
        return new CommandResult(process.ExitCode, output.ToString());
    }

    public static IReadOnlyList<string> ResolveCommand(IReadOnlyList<string> command, string? workingDirectory = null)
    {
        if (command.Count == 0) return command;
        var executable = OperatingSystem.IsWindows()
            ? ResolveWindowsExecutable(command[0], workingDirectory)
            : ResolveExecutable(command[0]);
        if (executable is null) return command;
        if (OperatingSystem.IsWindows() && string.Equals(Path.GetExtension(executable), ".ps1", StringComparison.OrdinalIgnoreCase))
        {
            return ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", executable, .. command.Skip(1)];
        }

        return [executable, .. command.Skip(1)];
    }

    private static string? ResolveWindowsExecutable(string name, string? workingDirectory)
    {
        if (Path.GetExtension(name).Length > 0)
        {
            return ResolveExecutable(name, workingDirectory);
        }

        if (Path.IsPathRooted(name) || name.Contains(Path.DirectorySeparatorChar) || name.Contains(Path.AltDirectorySeparatorChar))
        {
            foreach (var extension in WindowsExtensions)
            {
                var resolved = ResolveExecutable(name + extension, workingDirectory);
                if (resolved is not null) return resolved;
            }

            return ResolveExecutable(name, workingDirectory);
        }

        var path = Environment.GetEnvironmentVariable("PATH") ?? "";
        foreach (var dir in path.Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries))
        {
            foreach (var extension in WindowsExtensions)
            {
                var candidate = Path.Combine(dir, name + extension);
                if (File.Exists(candidate)) return candidate;
            }

            var extensionless = Path.Combine(dir, name);
            if (File.Exists(extensionless)) return extensionless;
        }

        return null;
    }

    private static string? ResolveExecutable(string name, string? workingDirectory = null)
    {
        if (Path.IsPathRooted(name) && File.Exists(name)) return name;
        if (!Path.IsPathRooted(name) && (name.Contains(Path.DirectorySeparatorChar) || name.Contains(Path.AltDirectorySeparatorChar)))
        {
            var fullPath = Path.GetFullPath(name, workingDirectory ?? Directory.GetCurrentDirectory());
            return File.Exists(fullPath) ? fullPath : null;
        }

        var path = Environment.GetEnvironmentVariable("PATH") ?? "";
        foreach (var dir in path.Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries))
        {
            var candidate = Path.Combine(dir, name);
            if (File.Exists(candidate)) return candidate;
        }

        return null;
    }

    private static Process? StartProcess(ProcessStartInfo start, string executable)
    {
        try
        {
            return Process.Start(start) ?? throw new InvalidOperationException($"Failed to start command {executable}.");
        }
        catch (Win32Exception ex) when (ex.NativeErrorCode == 2)
        {
            return null;
        }
    }
}
