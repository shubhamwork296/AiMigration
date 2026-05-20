using System.Diagnostics;
using System.Text.Json;

namespace Q3.MigrationAgent.Core.Timing;

public sealed class TimingRecorder
{
    private readonly List<Dictionary<string, object>> _items = [];

    public IDisposable Measure(string name)
    {
        var sw = Stopwatch.StartNew();
        return new Scope(() =>
        {
            sw.Stop();
            Add(name, sw.Elapsed.TotalSeconds);
        });
    }

    public void Add(string name, double seconds, string status = "completed")
    {
        _items.Add(new Dictionary<string, object>
        {
            ["name"] = name,
            ["seconds"] = Math.Round(seconds, 3),
            ["status"] = status
        });
    }

    public (string JsonPath, string MarkdownPath) Write(string outputPath)
    {
        Directory.CreateDirectory(outputPath);
        var jsonPath = Path.Combine(outputPath, "migration-timing-summary.json");
        var mdPath = Path.Combine(outputPath, "migration-timing-summary.md");
        var total = Math.Round(_items.Sum(i => Convert.ToDouble(i["seconds"])), 3);
        File.WriteAllText(jsonPath, JsonSerializer.Serialize(new { totalSeconds = total, timings = _items }, new JsonSerializerOptions { WriteIndented = true }) + Environment.NewLine);
        var lines = new List<string>
        {
            "# Migration Timing Summary",
            "",
            $"- Total seconds: {total}",
            "",
            "| Stage | Seconds | Status |",
            "| --- | ---: | --- |"
        };
        lines.AddRange(_items.Select(i => $"| {i["name"]} | {i["seconds"]} | {i["status"]} |"));
        lines.Add("");
        File.WriteAllLines(mdPath, lines);
        return (jsonPath, mdPath);
    }

    private sealed class Scope(Action onDispose) : IDisposable
    {
        public void Dispose() => onDispose();
    }
}

