using Q3.MigrationAgent.Core.Logging;

namespace Q3.MigrationAgent.Tests;

public sealed class AiTokenEstimatorTests
{
    [Fact]
    public void EstimateTokens_Null_Returns_Zero()
    {
        Assert.Equal(0, AiTokenEstimator.EstimateTokens(null));
    }

    [Fact]
    public void EstimateTokens_Empty_Returns_Zero()
    {
        Assert.Equal(0, AiTokenEstimator.EstimateTokens(""));
    }

    [Fact]
    public void EstimateTokens_Whitespace_Returns_Zero()
    {
        Assert.Equal(0, AiTokenEstimator.EstimateTokens("   "));
    }

    [Fact]
    public void EstimateTokens_Four_Characters_Returns_One()
    {
        Assert.Equal(1, AiTokenEstimator.EstimateTokens("abcd"));
    }

    [Fact]
    public void EstimateTokens_Five_Characters_Returns_Two()
    {
        Assert.Equal(2, AiTokenEstimator.EstimateTokens("abcde"));
    }

    [Fact]
    public void EstimateTokens_Four_Hundred_Characters_Returns_One_Hundred()
    {
        Assert.Equal(100, AiTokenEstimator.EstimateTokens(new string('a', 400)));
    }
}
