namespace Q3.LegacyMigration.Tests;

internal static class TestWorkspace
{
    public static string Create()
    {
        var root = Path.Combine(Path.GetTempPath(), "q3-legacy-migration-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(root);
        return root;
    }
}
