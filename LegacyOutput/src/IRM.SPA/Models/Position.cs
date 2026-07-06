namespace IRM.SPA.Models;

public sealed class Position
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime? StartDate { get; set; }
    public DateTime? Deadline { get; set; }
    public bool Hired { get; set; }
    public int? IdClient { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string ClientContactName { get; set; } = string.Empty;
    public string ClientContactPhone { get; set; } = string.Empty;
    public string ClientContactEmail { get; set; } = string.Empty;
}
