namespace IRM.SPA.Models;

public sealed class Client
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string ContactName { get; set; } = string.Empty;
    public string Website { get; set; } = string.Empty;
}
