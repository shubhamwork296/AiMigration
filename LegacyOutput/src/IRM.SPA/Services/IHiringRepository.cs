using IRM.SPA.Models;

namespace IRM.SPA.Services;

public interface IHiringRepository
{
    Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default);
    Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default);
    Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default);
    Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default);
    Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default);
    Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default);
    Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default);
}
