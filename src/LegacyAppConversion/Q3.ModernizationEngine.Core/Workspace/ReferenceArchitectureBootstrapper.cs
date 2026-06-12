using Q3.ModernizationEngine.Core.Abstractions;

namespace Q3.ModernizationEngine.Core.Workspace;

public sealed class ReferenceArchitectureBootstrapper
{
    public Task BootstrapAsync(
        string sourceArchitecturePath,
        string workspacePath,
        string solutionName,
        IModernizationProgressReporter progress,
        CancellationToken cancellationToken = default)
    {
        var sourceRoot = Path.GetFullPath(sourceArchitecturePath);
        var targetRoot = Path.GetFullPath(workspacePath);

        progress.Stage("Bootstrap", $"Copying reference architecture into workspace: {sourceRoot}");
        CopyDirectory(sourceRoot, targetRoot);

        var slnFiles = Directory.EnumerateFiles(targetRoot, "*.sln", SearchOption.AllDirectories).ToArray();
        foreach (var slnFile in slnFiles)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var directory = Path.GetDirectoryName(slnFile)!;
            var targetFile = Path.Combine(directory, $"{solutionName}.sln");
            if (string.Equals(slnFile, targetFile, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (File.Exists(targetFile))
            {
                File.SetAttributes(targetFile, FileAttributes.Normal);
                File.Delete(targetFile);
            }

            File.SetAttributes(slnFile, FileAttributes.Normal);
            File.Copy(slnFile, targetFile, overwrite: true);
            progress.Detail($"Renamed solution file: {Path.GetFileName(slnFile)} -> {Path.GetFileName(targetFile)}");
        }

        progress.Detail("Reference architecture bootstrap completed.");
        return Task.CompletedTask;
    }

    private static void CopyDirectory(string sourceRoot, string targetRoot)
    {
        Directory.CreateDirectory(targetRoot);

        foreach (var directory in Directory.EnumerateDirectories(sourceRoot, "*", SearchOption.AllDirectories))
        {
            var relative = Path.GetRelativePath(sourceRoot, directory);
            Directory.CreateDirectory(Path.Combine(targetRoot, relative));
        }

        foreach (var file in Directory.EnumerateFiles(sourceRoot, "*", SearchOption.AllDirectories))
        {
            if (Path.GetExtension(file).Equals(".sln", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var relative = Path.GetRelativePath(sourceRoot, file);
            var destination = Path.Combine(targetRoot, relative);
            Directory.CreateDirectory(Path.GetDirectoryName(destination)!);
            File.Copy(file, destination, overwrite: true);
            File.SetAttributes(destination, FileAttributes.Normal);
        }
    }
}
