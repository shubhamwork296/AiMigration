using System.Text.Json;
using System.Text.Json.Nodes;
using Q3.MigrationAgent.Core.Logging;

namespace Q3.MigrationAgent.AI.Providers;

public static class CodexUsageParser
{
    public static AiUsageStats? Parse(string stdout, string stderr)
    {
        try
        {
            AiUsageStats? latest = null;
            foreach (var line in (stdout + "\n" + stderr).Split(["\r\n", "\n"], StringSplitOptions.RemoveEmptyEntries))
            {
                var parsed = TryParseObject(line.Trim());
                if (parsed is null) continue;
                var usage = Extract(parsed);
                if (usage?.Available == true) latest = usage;
            }

            if (latest is not null) return latest;

            var whole = TryParseObject((stdout + "\n" + stderr).Trim());
            return whole is null ? null : Extract(whole);
        }
        catch
        {
            return null;
        }
    }

    private static JsonObject? TryParseObject(string text)
    {
        if (string.IsNullOrWhiteSpace(text) || !text.TrimStart().StartsWith('{')) return null;
        try { return JsonNode.Parse(text) as JsonObject; }
        catch (JsonException) { return null; }
    }

    private static AiUsageStats? Extract(JsonObject root)
    {
        AiUsageStats? latest = null;
        Visit(root, candidate =>
        {
            var stats = StatsFrom(candidate);
            if (!stats.Available) return;
            var merged = stats.Model is null && latest?.Model is not null ? stats with { Model = latest.Model } : stats;
            if (latest is null || Score(merged) >= Score(latest)) latest = merged;
        });
        return latest;
    }

    private static int Score(AiUsageStats stats) =>
        (stats.Model is null ? 0 : 1) +
        (stats.InputTokens is null ? 0 : 1) +
        (stats.CachedInputTokens is null ? 0 : 1) +
        (stats.OutputTokens is null ? 0 : 1) +
        (stats.ReasoningTokens is null ? 0 : 1) +
        (stats.TotalTokens is null ? 0 : 1);

    private static void Visit(JsonNode? node, Action<JsonObject> visit)
    {
        if (node is JsonObject obj)
        {
            visit(obj);
            foreach (var child in obj.Select(kvp => kvp.Value)) Visit(child, visit);
        }
        else if (node is JsonArray array)
        {
            foreach (var child in array) Visit(child, visit);
        }
    }

    private static AiUsageStats StatsFrom(JsonObject obj)
    {
        var usage = FirstObject(obj, "usage", "token_usage", "tokenUsage", "token_count", "token_counts", "tokenCount", "tokenCounts") ?? obj;
        var input = FirstLong(usage, "input_tokens", "inputTokens", "prompt_tokens", "promptTokens");
        var cached = FirstLong(usage, "cached_input_tokens", "cachedInputTokens", "cached_prompt_tokens", "cachedPromptTokens", "cache_read_input_tokens", "cacheReadInputTokens");
        var output = FirstLong(usage, "output_tokens", "outputTokens", "completion_tokens", "completionTokens");
        var reasoning = FirstLong(usage, "reasoning_tokens", "reasoningTokens");
        var total = FirstLong(usage, "total_tokens", "totalTokens", "tokens", "total");

        foreach (var detailsName in new[] { "input_tokens_details", "inputTokensDetails", "prompt_tokens_details", "promptTokensDetails" })
        {
            if (cached is not null) break;
            cached = FirstLong(FirstObject(usage, detailsName), "cached_tokens", "cachedTokens", "cached_input_tokens", "cachedInputTokens");
        }

        foreach (var detailsName in new[] { "output_tokens_details", "outputTokensDetails", "completion_tokens_details", "completionTokensDetails" })
        {
            if (reasoning is not null) break;
            reasoning = FirstLong(FirstObject(usage, detailsName), "reasoning_tokens", "reasoningTokens");
        }

        var model = FirstString(obj, "model", "model_name", "modelName") ?? FirstString(usage, "model", "model_name", "modelName");
        var available = model is not null || input is not null || cached is not null || output is not null || reasoning is not null || total is not null;
        return new AiUsageStats
        {
            Model = model,
            InputTokens = input,
            CachedInputTokens = cached,
            OutputTokens = output,
            ReasoningTokens = reasoning,
            TotalTokens = total,
            Available = available
        };
    }

    private static JsonObject? FirstObject(JsonObject? obj, params string[] keys)
    {
        if (obj is null) return null;
        foreach (var key in keys)
        {
            if (obj.TryGetPropertyValue(key, out var value) && value is JsonObject child) return child;
        }
        return null;
    }

    private static string? FirstString(JsonObject? obj, params string[] keys)
    {
        if (obj is null) return null;
        foreach (var key in keys)
        {
            if (obj.TryGetPropertyValue(key, out var value) && value is JsonValue jsonValue && jsonValue.TryGetValue<string>(out var text) && !string.IsNullOrWhiteSpace(text))
            {
                return text;
            }
        }
        return null;
    }

    private static long? FirstLong(JsonObject? obj, params string[] keys)
    {
        if (obj is null) return null;
        foreach (var key in keys)
        {
            if (!obj.TryGetPropertyValue(key, out var value) || value is not JsonValue jsonValue) continue;
            if (jsonValue.TryGetValue<long>(out var longValue)) return longValue;
            if (jsonValue.TryGetValue<int>(out var intValue)) return intValue;
            if (jsonValue.TryGetValue<string>(out var text) && long.TryParse(text, out var parsed)) return parsed;
        }
        return null;
    }
}
