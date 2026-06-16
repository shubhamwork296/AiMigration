using Q3.MigrationAgent.Adapters.PackageClassification;

namespace Q3.MigrationAgent.Adapters.Angular;

internal static class AngularCriticalDependencyPolicy
{
    public static readonly HashSet<string> CriticalPackages = new(StringComparer.OrdinalIgnoreCase)
    {
        "@angular/animations",
        "@angular/common",
        "@angular/compiler",
        "@angular/core",
        "@angular/forms",
        "@angular/localize",
        "@angular/platform-browser",
        "@angular/platform-browser-dynamic",
        "@angular/router",
        "@angular/compiler-cli",
        "@angular/cli",
        "@angular/language-service",
        "@angular-devkit/build-angular",
        "@angular/cdk",
        "@angular/material",
        "@angular/material-moment-adapter",
        "typescript",
        "rxjs",
        "zone.js",
        "tslib"
    };

    public static bool IsCriticalPackage(string name) =>
        CriticalPackages.Contains(name);

    public static bool IsAngularOwnedPackage(string name) =>
        name.StartsWith("@angular/", StringComparison.OrdinalIgnoreCase) ||
        name.StartsWith("@angular-devkit/", StringComparison.OrdinalIgnoreCase);

    public static bool IsSupportedTypeScriptForTarget(string version, int targetAngularMajor)
    {
        var tuple = VersionTuple(version);
        if (tuple is null) return false;
        return targetAngularMajor switch
        {
            13 => Compare(tuple, [4, 4, 0]) >= 0 && Compare(tuple, [4, 6, 0]) < 0,
            14 => Compare(tuple, [4, 6, 0]) >= 0 && Compare(tuple, [4, 9, 0]) < 0,
            15 => Compare(tuple, [4, 8, 2]) >= 0 && Compare(tuple, [5, 0, 0]) < 0,
            16 => Compare(tuple, [4, 9, 3]) >= 0 && Compare(tuple, [5, 2, 0]) < 0,
            17 => Compare(tuple, [5, 2, 0]) >= 0 && Compare(tuple, [5, 5, 0]) < 0,
            18 => Compare(tuple, [5, 4, 0]) >= 0 && Compare(tuple, [5, 6, 0]) < 0,
            _ => true
        };
    }

    public static string TypeScriptVersionForAngular(int targetMajor) => targetMajor switch
    {
        13 => "~4.5.5",
        14 => "~4.8.4",
        15 => "~4.9.5",
        16 => "~5.1.6",
        17 => "~5.4.5",
        18 => "~5.5.4",
        _ => "~5.5.4"
    };

    public static bool IsSafeCriticalAlignment(string packageName, string targetVersion, int targetAngularMajor)
    {
        if (!IsCriticalPackage(packageName)) return false;
        if (string.IsNullOrWhiteSpace(targetVersion) || !NpmVersionRange.IsSafe(targetVersion)) return false;
        if (packageName.Equals("typescript", StringComparison.OrdinalIgnoreCase))
        {
            return IsSupportedTypeScriptForTarget(targetVersion, targetAngularMajor);
        }

        if (IsAngularOwnedPackage(packageName))
        {
            return NpmVersionRange.Major(targetVersion) == targetAngularMajor;
        }

        return true;
    }

    private static int[]? VersionTuple(string? version)
    {
        var match = System.Text.RegularExpressions.Regex.Match(version ?? "", @"(\d+)(?:\.(\d+))?(?:\.(\d+))?");
        return match.Success
            ? match.Groups.Values.Skip(1).Where(g => g.Success).Select(g => int.Parse(g.Value)).ToArray()
            : null;
    }

    private static int Compare(int[] left, int[] right)
    {
        for (var i = 0; i < Math.Max(left.Length, right.Length); i++)
        {
            var l = i < left.Length ? left[i] : 0;
            var r = i < right.Length ? right[i] : 0;
            if (l != r) return l.CompareTo(r);
        }
        return 0;
    }
}
