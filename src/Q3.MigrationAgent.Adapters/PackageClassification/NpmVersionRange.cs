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
}
