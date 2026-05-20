using Q3.MigrationAgent.Core.Execution;

namespace Q3.MigrationAgent.Core.Rollback;

public sealed class RollbackService
{
    public string CreateSnapshot(string projectPath, string outputPath)
    {
        var rollbackRoot = Path.Combine(Path.GetDirectoryName(outputPath) ?? Directory.GetCurrentDirectory(), "rollback");
        Directory.CreateDirectory(rollbackRoot);
        var snapshot = Path.Combine(rollbackRoot, $"{DateTimeOffset.Now:yyyyMMdd-HHmmss}-{Guid.NewGuid():N}"[..24]);
        MigrationExecutor.CopyDirectory(projectPath, snapshot);
        return snapshot;
    }

    public void RestoreSnapshot(string snapshotPath, string targetPath)
    {
        if (Directory.Exists(targetPath)) RemoveTreeWithRetry(targetPath);
        CopyTreeWithRetry(snapshotPath, targetPath);
    }

    private static void RemoveTreeWithRetry(string path, int attempts = 5)
    {
        Exception? last = null;
        for (var i = 0; i < attempts; i++)
        {
            try { Directory.Delete(path, recursive: true); return; }
            catch (IOException ex) { last = ex; Thread.Sleep(500 * (i + 1)); }
            catch (UnauthorizedAccessException ex) { last = ex; Thread.Sleep(500 * (i + 1)); }
        }
        if (last is not null) throw last;
    }

    private static void CopyTreeWithRetry(string source, string destination, int attempts = 5)
    {
        Exception? last = null;
        for (var i = 0; i < attempts; i++)
        {
            try { MigrationExecutor.CopyDirectory(source, destination); return; }
            catch (IOException ex)
            {
                last = ex;
                if (Directory.Exists(destination)) RemoveTreeWithRetry(destination);
                Thread.Sleep(500 * (i + 1));
            }
        }
        if (last is not null) throw last;
    }
}

