using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Shared.DTO;

namespace Q3.MigrationAgent.Core.Validation;

public sealed class MigrationValidator
{
    public async Task<ValidationResult> ValidateAsync(string outputPath, IMigrationAdapter adapter, int? timeoutSeconds = null, int? idleTimeoutSeconds = null, CancellationToken cancellationToken = default)
    {
        var build = await adapter.RunBuildAsync(outputPath, timeoutSeconds, idleTimeoutSeconds, cancellationToken);
        return build.Success
            ? new ValidationResult { Passed = true, Output = build.Output }
            : new ValidationResult
            {
                Passed = false,
                Errors = build.Output,
                Suggestion = "Review build output and add explicit transform rules for any required source changes."
            };
    }
}
