namespace Q3.MigrationAgent.Core.Logging;

public static class AiTokenEstimator
{
    public static int EstimateTokens(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return 0;
        }

        return (int)Math.Ceiling(text.Length / 4.0);
    }
}
