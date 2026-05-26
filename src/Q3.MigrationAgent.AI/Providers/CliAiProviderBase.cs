using System.Text.Json.Nodes;
using Q3.MigrationAgent.AI.Abstractions;
using Q3.MigrationAgent.Core.Abstractions;
using Q3.MigrationAgent.Shared.Config;

namespace Q3.MigrationAgent.AI.Providers;

public abstract class CliAiProviderBase(ICommandRunner commandRunner, IPromptLoader promptLoader) : IAiProvider
{
    public abstract string Name { get; }
    protected abstract IReadOnlyList<string> DefaultCommand(AiConfig config);

    public async Task<JsonObject?> AskAsync(AiConfig config, string system, string user, CancellationToken cancellationToken = default)
    {
        if (!config.UseAi) return null;
        var command = config.CliCommand ?? DefaultCommand(config);
        var prompt = string.Join("\n\n", [system, promptLoader.Load("common/json-output-system"), user]);
        var completed = await commandRunner.RunAsync([.. command, "-"], input: prompt, timeoutSeconds: 300, idleTimeoutSeconds: 120, cancellationToken: cancellationToken);
        if (completed.ReturnCode == 127) throw new InvalidOperationException($"{Name} CLI was not found. Install it or set aiCliCommand to the CLI executable.");
        if (completed.TimeoutKind is not null)
        {
            var detail = string.IsNullOrWhiteSpace(completed.FailureReason) ? completed.Stderr : completed.FailureReason;
            throw new TimeoutException($"{Name} CLI timed out during remediation planning ({completed.TimeoutKind}): {detail}");
        }
        if (completed.ReturnCode != 0)
        {
            var output = (completed.Stdout + "\n" + completed.Stderr).Trim();
            throw new InvalidOperationException($"{Name} CLI failed: {output[..Math.Min(output.Length, 1000)]}");
        }
        return AiProviderResolver.ParseCodexResponse(completed.Stdout, completed.Stderr, command, Name);
    }
}
