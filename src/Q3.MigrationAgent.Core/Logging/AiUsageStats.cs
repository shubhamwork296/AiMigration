namespace Q3.MigrationAgent.Core.Logging;

public sealed record AiUsageStats
{
    public string? CallName { get; init; }
    public string? Model { get; init; }
    public long? InputTokens { get; init; }
    public long? CachedInputTokens { get; init; }
    public long? OutputTokens { get; init; }
    public long? ReasoningTokens { get; init; }
    public long? TotalTokens { get; init; }
    public bool Available { get; init; }
}

public sealed record EstimatedAiUsageStats
{
    public string? PromptName { get; init; }
    public string? PromptPath { get; init; }
    public int InputChars { get; init; }
    public int EstimatedInputTokens { get; init; }
    public int OutputChars { get; init; }
    public int EstimatedOutputTokens { get; init; }
    public int EstimatedTotalTokens => EstimatedInputTokens + EstimatedOutputTokens;
    public int? ExitCode { get; init; }
    public long? DurationMs { get; init; }
    public string? JsonParseStatus { get; init; }
}

public sealed class AiUsageTracker(RunLog? runLog = null)
{
    private readonly RunLog _runLog = runLog ?? new RunLog();
    private readonly object _lock = new();
    private readonly List<AiUsageStats> _calls = [];
    private readonly List<EstimatedAiUsageStats> _estimatedCalls = [];
    private string? _logPath;

    public void Start(string? logPath)
    {
        lock (_lock)
        {
            _logPath = logPath;
            _calls.Clear();
            _estimatedCalls.Clear();
        }
    }

    public EstimatedAiUsageStats RecordEstimatedInput(string promptName, string? promptPath, string input)
    {
        var stats = new EstimatedAiUsageStats
        {
            PromptName = promptName,
            PromptPath = promptPath,
            InputChars = input?.Length ?? 0,
            EstimatedInputTokens = AiTokenEstimator.EstimateTokens(input)
        };

        lock (_lock)
        {
            _estimatedCalls.Add(stats);
            _runLog.Append(_logPath, $"[AI Usage] prompt={Value(stats.PromptName)}, promptPath={Value(stats.PromptPath)}, inputChars={stats.InputChars}, estimatedInputTokens={stats.EstimatedInputTokens}");
        }

        return stats;
    }

    public void RecordEstimatedOutput(EstimatedAiUsageStats inputStats, string output, int? exitCode, long? durationMs, string? jsonParseStatus)
    {
        var completed = inputStats with
        {
            OutputChars = output?.Length ?? 0,
            EstimatedOutputTokens = AiTokenEstimator.EstimateTokens(output),
            ExitCode = exitCode,
            DurationMs = durationMs,
            JsonParseStatus = jsonParseStatus
        };

        lock (_lock)
        {
            var index = _estimatedCalls.IndexOf(inputStats);
            if (index >= 0) _estimatedCalls[index] = completed;
            else _estimatedCalls.Add(completed);

            _runLog.Append(_logPath, $"[AI Usage] prompt={Value(completed.PromptName)}, outputChars={completed.OutputChars}, estimatedOutputTokens={completed.EstimatedOutputTokens}, estimatedTotalTokens={completed.EstimatedTotalTokens}, exitCode={Value(completed.ExitCode)}, durationMs={Value(completed.DurationMs)}, jsonParseStatus={Value(completed.JsonParseStatus)}");
        }
    }

    public void RecordCodexCall(string callName, AiUsageStats? usage)
    {
        lock (_lock)
        {
            if (usage is null || !usage.Available)
            {
                _calls.Add(new AiUsageStats { CallName = callName });
                _runLog.Append(_logPath, "[AI USAGE] Codex token usage not available for this call.");
                return;
            }

            var call = usage with { CallName = callName };
            _calls.Add(call);
            _runLog.Append(_logPath, string.Join(Environment.NewLine,
                $"[AI USAGE] Codex call: {callName}",
                $"[AI USAGE] Model: {Value(call.Model)}",
                $"[AI USAGE] Input tokens: {Value(call.InputTokens)}",
                $"[AI USAGE] Cached input tokens: {Value(call.CachedInputTokens)}",
                $"[AI USAGE] Output tokens: {Value(call.OutputTokens)}",
                $"[AI USAGE] Reasoning tokens: {Value(call.ReasoningTokens)}",
                $"[AI USAGE] Total tokens: {Value(call.TotalTokens)}"));
        }
    }

    public void WriteSummary()
    {
        lock (_lock)
        {
            if (_estimatedCalls.Count > 0)
            {
                _runLog.Append(_logPath, $"[AI Usage Summary] calls={_estimatedCalls.Count}, estimatedInputTokens={_estimatedCalls.Sum(c => c.EstimatedInputTokens)}, estimatedOutputTokens={_estimatedCalls.Sum(c => c.EstimatedOutputTokens)}, estimatedTotalTokens={_estimatedCalls.Sum(c => c.EstimatedTotalTokens)}");
            }

            if (_calls.Count == 0) return;

            _runLog.Append(_logPath, string.Join(Environment.NewLine,
                $"[AI USAGE] Total Codex calls: {_calls.Count}",
                $"[AI USAGE] Total input tokens: {Sum(c => c.InputTokens)}",
                $"[AI USAGE] Total cached input tokens: {Sum(c => c.CachedInputTokens)}",
                $"[AI USAGE] Total output tokens: {Sum(c => c.OutputTokens)}",
                $"[AI USAGE] Total reasoning tokens: {Sum(c => c.ReasoningTokens)}",
                $"[AI USAGE] Total tokens consumed: {Sum(c => c.TotalTokens)}"));
        }
    }

    private string Sum(Func<AiUsageStats, long?> selector)
    {
        var values = _calls.Select(selector).Where(v => v.HasValue).Select(v => v!.Value).ToArray();
        return values.Length == 0 ? "not available" : values.Sum().ToString();
    }

    private static string Value(string? value) => string.IsNullOrWhiteSpace(value) ? "not available" : value;
    private static string Value(long? value) => value?.ToString() ?? "not available";
    private static string Value(int? value) => value?.ToString() ?? "not available";
}
