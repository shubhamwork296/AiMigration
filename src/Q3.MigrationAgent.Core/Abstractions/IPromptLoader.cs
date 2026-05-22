namespace Q3.MigrationAgent.Core.Abstractions;

public interface IPromptLoader
{
    string Load(string promptPath);
}
