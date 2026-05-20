namespace Q3.MigrationAgent.Tests;

internal static class TestWorkspace
{
    public static string Create()
    {
        var path = Path.Combine(Path.GetTempPath(), "q3-migration-agent-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(path);
        return path;
    }
}

