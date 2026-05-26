using System.Text.RegularExpressions;

namespace Q3.MigrationAgent.Adapters.PackageClassification;

public static class NpmVersionRange
{
    private static readonly Regex NumericVersion = new(@"^\d+(?:\.\d+){0,2}(?:[-+][0-9A-Za-z.-]+)?$", RegexOptions.Compiled);
    private static readonly Regex XRange = new(@"^\d+(?:\.(?:\d+|x|X|\*)){0,2}$", RegexOptions.Compiled);
    private static readonly Regex Comparator = new(@"^(?:>=|<=|>|<|=)?\d+(?:\.\d+){0,2}(?:[-+][0-9A-Za-z.-]+)?$", RegexOptions.Compiled);

    public static bool IsSafe(string? value)
    {
        var trimmed = value?.Trim() ?? "";
        if (trimmed is "" or "*" || trimmed.Equals("latest", StringComparison.OrdinalIgnoreCase)) return false;
        if (trimmed.Contains("||") || trimmed.Contains(" or ", StringComparison.OrdinalIgnoreCase) || trimmed.Contains(',')) return false;

        if (trimmed[0] is '^' or '~')
        {
            var inner = trimmed[1..];
            return NumericVersion.IsMatch(inner) || XRange.IsMatch(inner);
        }

        if (NumericVersion.IsMatch(trimmed) || XRange.IsMatch(trimmed)) return true;

        var parts = trimmed.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        return parts.Length > 0 && parts.All(part => Comparator.IsMatch(part));
    }

    public static string? Normalize(string? value)
    {
        var trimmed = value?.Trim();
        if (string.IsNullOrWhiteSpace(trimmed) || trimmed == "null") return null;

        if (Regex.IsMatch(trimmed, @"^(?<major>\d+)\.(?:x|X|\*)$"))
        {
            var major = Regex.Match(trimmed, @"^\d+").Value;
            return $"^{major}.0.0";
        }

        if (Regex.IsMatch(trimmed, @"^(?<major>\d+)\.(?:x|X|\*)\.(?:x|X|\*)$"))
        {
            var major = Regex.Match(trimmed, @"^\d+").Value;
            return $"^{major}.0.0";
        }

        if (Regex.IsMatch(trimmed, @"^[~^](?<major>\d+)\.(?:x|X|\*)$"))
        {
            var prefix = trimmed[0];
            var major = Regex.Match(trimmed, @"\d+").Value;
            return $"{prefix}{major}.0.0";
        }

        if (Regex.IsMatch(trimmed, @"^[~^](?<major>\d+)\.(?:x|X|\*)\.(?:x|X|\*)$"))
        {
            var prefix = trimmed[0];
            var major = Regex.Match(trimmed, @"\d+").Value;
            return $"{prefix}{major}.0.0";
        }

        return trimmed;
    }

    public static int? Major(string? value) => Regex.Match(value ?? "", @"\d+") is { Success: true } m ? int.Parse(m.Value) : null;

    public static bool Satisfies(string? version, string? range)
    {
        var actual = VersionTuple(version);
        if (actual is null) return false;
        var normalized = Normalize(range);
        if (string.IsNullOrWhiteSpace(normalized) || !IsSafe(normalized)) return false;

        if (normalized[0] == '^')
        {
            var lower = VersionTuple(normalized[1..]);
            if (lower is null || Compare(actual, lower) < 0) return false;
            var upper = lower[0] > 0
                ? new[] { lower[0] + 1, 0, 0 }
                : lower[1] > 0
                    ? new[] { 0, lower[1] + 1, 0 }
                    : new[] { 0, 0, lower[2] + 1 };
            return Compare(actual, upper) < 0;
        }

        if (normalized[0] == '~')
        {
            var lower = VersionTuple(normalized[1..]);
            if (lower is null || Compare(actual, lower) < 0) return false;
            var upper = new[] { lower[0], lower[1] + 1, 0 };
            return Compare(actual, upper) < 0;
        }

        var parts = normalized.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (parts.Length > 1 || Regex.IsMatch(normalized, @"^(?:>=|<=|>|<|=)"))
        {
            return parts.All(part => SatisfiesComparator(actual, part));
        }

        var exact = VersionTuple(normalized);
        return exact is not null && Compare(actual, exact) == 0;
    }

    private static bool SatisfiesComparator(int[] actual, string comparator)
    {
        var match = Regex.Match(comparator, @"^(?<op>>=|<=|>|<|=)?(?<version>\d+(?:\.\d+){0,2}(?:[-+][0-9A-Za-z.-]+)?)$");
        if (!match.Success) return false;
        var expected = VersionTuple(match.Groups["version"].Value);
        if (expected is null) return false;
        var comparison = Compare(actual, expected);
        return match.Groups["op"].Value switch
        {
            ">" => comparison > 0,
            ">=" => comparison >= 0,
            "<" => comparison < 0,
            "<=" => comparison <= 0,
            _ => comparison == 0
        };
    }

    private static int[]? VersionTuple(string? version)
    {
        var match = Regex.Match(version ?? "", @"^(?:[~^=<>]+\s*)?(?<major>\d+)(?:\.(?<minor>\d+|x|X|\*))?(?:\.(?<patch>\d+|x|X|\*))?");
        if (!match.Success) return null;
        return
        [
            int.Parse(match.Groups["major"].Value),
            NumericPart(match.Groups["minor"].Value),
            NumericPart(match.Groups["patch"].Value)
        ];
    }

    private static int NumericPart(string value) => int.TryParse(value, out var number) ? number : 0;

    private static int Compare(int[] left, int[] right)
    {
        for (var i = 0; i < 3; i++)
        {
            var comparison = left[i].CompareTo(right[i]);
            if (comparison != 0) return comparison;
        }
        return 0;
    }
}
