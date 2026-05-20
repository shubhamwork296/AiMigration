using System.Text.Json;
using System.Text.Json.Nodes;

namespace Q3.MigrationAgent.Shared.Common;

public static class JsonHelpers
{
    public static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = true
    };

    public static string StringValue(this JsonObject obj, string name, string defaultValue = "")
    {
        return obj.TryGetPropertyValue(name, out var value) ? value?.GetValue<string>() ?? defaultValue : defaultValue;
    }

    public static int IntValue(this JsonObject obj, string name, int defaultValue = 0)
    {
        if (!obj.TryGetPropertyValue(name, out var value) || value is null)
        {
            return defaultValue;
        }

        return value.GetValueKind() == JsonValueKind.Number && value.AsValue().TryGetValue<int>(out var number)
            ? number
            : int.TryParse(value.ToString(), out number) ? number : defaultValue;
    }

    public static bool BoolValue(this JsonObject obj, string name, bool defaultValue = false)
    {
        if (!obj.TryGetPropertyValue(name, out var value) || value is null)
        {
            return defaultValue;
        }

        return value.GetValueKind() == JsonValueKind.True || value.GetValueKind() == JsonValueKind.False
            ? value.GetValue<bool>()
            : bool.TryParse(value.ToString(), out var parsed) ? parsed : defaultValue;
    }
}

