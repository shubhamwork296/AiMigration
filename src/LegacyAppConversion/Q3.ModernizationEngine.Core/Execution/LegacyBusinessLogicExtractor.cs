using System.Text.RegularExpressions;
using Q3.ModernizationEngine.Shared.Models;

namespace Q3.ModernizationEngine.Core.Execution;

internal sealed class LegacyBusinessLogicExtractor
{
    public LegacyBusinessLogicContext Extract(ModernizationRequest request, ModuleMigrationPlan plan)
    {
        var sourceRoot = request.SourcePath;
        var businessLayer = Path.Combine(sourceRoot, "BusinessLayer");
        var databaseLayer = Path.Combine(sourceRoot, "DatabaseLeyer");
        var abstractLayer = Path.Combine(sourceRoot, "AbstractLayer");

        var moduleBaseNames = plan.EntryPoints
            .Concat(plan.UnitName.Split(' ', StringSplitOptions.RemoveEmptyEntries))
            .Concat(plan.ModulePath.Split('/', StringSplitOptions.RemoveEmptyEntries))
            .Select(NormalizeToken)
            .Where(token => token.Length >= 4)
            .ToArray();

        var dominantToken = FindDominantToken(plan);
        var businessFiles = FindMatchingFiles(businessLayer, dominantToken, "BL", moduleBaseNames);
        var repositoryFiles = FindMatchingFiles(databaseLayer, dominantToken, "DB", moduleBaseNames);
        var modelFiles = FindMatchingFiles(abstractLayer, dominantToken, "", moduleBaseNames);

        return new LegacyBusinessLogicContext
        {
            DominantToken = dominantToken,
            ServiceMethods = businessFiles.SelectMany(file => ExtractMethods(file, "service")).ToArray(),
            RepositoryMethods = repositoryFiles.SelectMany(file => ExtractMethods(file, "repository")).ToArray(),
            ModelFiles = modelFiles.ToArray(),
            BusinessFiles = businessFiles.ToArray(),
            RepositoryFiles = repositoryFiles.ToArray()
        };
    }

    private static string FindDominantToken(ModuleMigrationPlan plan)
    {
        var baseNames = plan.EntryPoints
            .Select(RemoveFileSuffixNoise)
            .Where(name => name.Length >= 5)
            .ToArray();

        if (baseNames.Length == 0)
        {
            return NormalizeToken(plan.UnitName);
        }

        var prefix = baseNames[0];
        foreach (var name in baseNames.Skip(1))
        {
            prefix = CommonPrefix(prefix, name);
            if (prefix.Length < 5)
            {
                break;
            }
        }

        return NormalizeToken(prefix.Length >= 5 ? prefix : plan.UnitName);
    }

    private static IEnumerable<string> FindMatchingFiles(string folder, string dominantToken, string requiredPrefix, IReadOnlyList<string> tokens)
    {
        if (!Directory.Exists(folder))
        {
            return [];
        }

        var files = Directory.EnumerateFiles(folder, "*.cs", SearchOption.TopDirectoryOnly).ToArray();
        var matched = files
            .Where(file =>
            {
                var name = Path.GetFileNameWithoutExtension(file);
                if (requiredPrefix.Length > 0 && !name.StartsWith(requiredPrefix, StringComparison.OrdinalIgnoreCase))
                {
                    return false;
                }

                if (dominantToken.Length >= 4 && name.Contains(dominantToken, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }

                return tokens.Any(token => token.Length >= 4 && name.Contains(token, StringComparison.OrdinalIgnoreCase));
            })
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        return matched;
    }

    private static IEnumerable<LegacyMethodSignature> ExtractMethods(string file, string layer)
    {
        var content = File.ReadAllText(file);
        var className = Path.GetFileNameWithoutExtension(file);
        var regex = new Regex(@"public\s+(?<return>[A-Za-z0-9_<>\.\[\]]+)\s+(?<name>[A-Za-z0-9_]+)\s*\((?<params>[^)]*)\)", RegexOptions.Multiline);
        foreach (Match match in regex.Matches(content))
        {
            var name = match.Groups["name"].Value;
            if (name.Equals(className, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            yield return new LegacyMethodSignature
            {
                Layer = layer,
                SourceFile = file,
                ReturnType = match.Groups["return"].Value.Trim(),
                MethodName = name.Trim(),
                Parameters = ParseParameters(match.Groups["params"].Value)
            };
        }
    }

    private static IReadOnlyList<LegacyParameterSignature> ParseParameters(string parameters)
    {
        if (string.IsNullOrWhiteSpace(parameters))
        {
            return [];
        }

        return parameters
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(part =>
            {
                var pieces = part.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                if (pieces.Length == 0)
                {
                    return null;
                }

                if (pieces.Length == 1)
                {
                    return new LegacyParameterSignature { Type = "object", Name = NormalizeParameterName(pieces[0]) };
                }

                return new LegacyParameterSignature
                {
                    Type = pieces[^2],
                    Name = NormalizeParameterName(pieces[^1])
                };
            })
            .Where(signature => signature is not null)
            .Cast<LegacyParameterSignature>()
            .ToArray();
    }

    private static string NormalizeParameterName(string name)
    {
        var cleaned = name.Trim().TrimEnd(',');
        return string.IsNullOrWhiteSpace(cleaned) ? "value" : cleaned;
    }

    private static string RemoveFileSuffixNoise(string input) =>
        input.Replace(".aspx", "", StringComparison.OrdinalIgnoreCase)
             .Replace(".master", "", StringComparison.OrdinalIgnoreCase)
             .Replace(".ascx", "", StringComparison.OrdinalIgnoreCase);

    private static string CommonPrefix(string left, string right)
    {
        var max = Math.Min(left.Length, right.Length);
        var index = 0;
        while (index < max && left[index] == right[index])
        {
            index++;
        }

        return left[..index];
    }

    private static string NormalizeToken(string input)
    {
        var letters = new string(input.Where(char.IsLetterOrDigit).ToArray());
        return letters;
    }
}

internal sealed record LegacyBusinessLogicContext
{
    public required string DominantToken { get; init; }
    public required IReadOnlyList<LegacyMethodSignature> ServiceMethods { get; init; }
    public required IReadOnlyList<LegacyMethodSignature> RepositoryMethods { get; init; }
    public required IReadOnlyList<string> BusinessFiles { get; init; }
    public required IReadOnlyList<string> RepositoryFiles { get; init; }
    public required IReadOnlyList<string> ModelFiles { get; init; }
}

internal sealed record LegacyMethodSignature
{
    public required string Layer { get; init; }
    public required string SourceFile { get; init; }
    public required string ReturnType { get; init; }
    public required string MethodName { get; init; }
    public required IReadOnlyList<LegacyParameterSignature> Parameters { get; init; }
}

internal sealed record LegacyParameterSignature
{
    public required string Type { get; init; }
    public required string Name { get; init; }
}
