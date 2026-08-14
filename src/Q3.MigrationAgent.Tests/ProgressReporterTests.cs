using Q3.MigrationAgent.Core.Progress;

namespace Q3.MigrationAgent.Tests;

public sealed class ProgressReporterTests
{
    [Fact]
    public void Progress_Output_Adds_Label_And_Keeps_Original_Message()
    {
        var previousOut = Console.Out;
        using var writer = new StringWriter();

        try
        {
            Console.SetOut(writer);

            new ProgressReporter().Stage("Analysis", "Planning migration hops...");

            var output = writer.ToString();
            Assert.Contains("[STEP]", output);
            Assert.Contains("[Analysis] Planning migration hops...", output);
        }
        finally
        {
            Console.SetOut(previousOut);
        }
    }

    [Fact]
    public void ConsoleFormatter_Restores_Previous_Color()
    {
        ConsoleColor previous;
        try
        {
            previous = Console.ForegroundColor;
        }
        catch
        {
            return;
        }

        var previousOut = Console.Out;
        using var writer = new StringWriter();

        try
        {
            Console.SetOut(writer);
            ConsoleFormatter.WriteLine(ConsoleLabel.Warn, "check");
            Assert.Equal(previous, Console.ForegroundColor);
        }
        finally
        {
            Console.SetOut(previousOut);
            try
            {
                Console.ForegroundColor = previous;
            }
            catch
            {
            }
        }
    }
}
