using System.Data;
using IRM.SPA.Models;
using Microsoft.Data.SqlClient;

namespace IRM.SPA.Services;

public sealed class HiringRepository(IConfiguration configuration) : IHiringRepository
{
    private readonly string _connectionString = configuration.GetConnectionString("HiringConnection")
        ?? throw new InvalidOperationException("ConnectionStrings:HiringConnection is not configured.");

    public async Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default)
    {
        var where = new List<string>();
        var parameters = new List<SqlParameter>();

        if (int.TryParse(filter.Id, out var id))
        {
            where.Add("Id = @Id");
            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
        }

        AddLike(where, parameters, "Name", filter.Name);
        AddLike(where, parameters, "Phone", filter.Phone);
        AddLike(where, parameters, "Email", filter.Email);
        AddLike(where, parameters, "Website", filter.Website);
        AddLike(where, parameters, "ContactName", filter.ContactName);

        var sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients";
        if (where.Count > 0)
        {
            sql += " WHERE " + string.Join(" AND ", where);
        }

        sql += " ORDER BY Id";

        await using var connection = CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddRange(parameters.ToArray());
        await connection.OpenAsync(cancellationToken);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var clients = new List<Client>();
        while (await reader.ReadAsync(cancellationToken))
        {
            clients.Add(ReadClient(reader));
        }

        return clients;
    }

    public async Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default)
    {
        const string sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients WHERE Id = @Id";
        await using var connection = CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
        await connection.OpenAsync(cancellationToken);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? ReadClient(reader) : null;
    }

    public async Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default)
    {
        const string sql = """
            INSERT INTO Clients (Name, Phone, Email, ContactName, Website)
            OUTPUT INSERTED.ID
            VALUES (@Name, @Phone, @Email, @ContactName, @Website)
            """;

        await using var connection = CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        AddClientParameters(command, client);
        await connection.OpenAsync(cancellationToken);
        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
    }

    public async Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default)
    {
        const string sql = """
            UPDATE Clients
            SET Name = @Name, Phone = @Phone, Email = @Email, ContactName = @ContactName, Website = @Website
            WHERE Id = @Id
            """;

        await using var connection = CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        AddClientParameters(command, client);
        command.Parameters.Add("@Id", SqlDbType.Int).Value = client.Id;
        await connection.OpenAsync(cancellationToken);
        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
    }

    public async Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default)
    {
        var where = new List<string>();
        var parameters = new List<SqlParameter>();

        if (int.TryParse(filter.Id, out var id))
        {
            where.Add("Positions.Id = @Id");
            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
        }

        AddLike(where, parameters, "Positions.Name", filter.Name, "@Name");
        AddLike(where, parameters, "Positions.Description", filter.Description, "@Description");
        AddLike(where, parameters, "CONVERT(varchar(10), Positions.StartDate, 120)", filter.StartDate, "@StartDate");
        AddLike(where, parameters, "CONVERT(varchar(10), Positions.Deadline, 120)", filter.Deadline, "@Deadline");
        AddLike(where, parameters, "Positions.ClientContactName", filter.ClientContact, "@ClientContact");

        var sql = """
            SELECT Positions.Id, Positions.Name, Positions.Description, Positions.StartDate, Positions.Deadline,
                   Positions.Hired, Positions.IdClient, Positions.ClientContactName, Positions.ClientContactPhone,
                   Positions.ClientContactEmail, Clients.Name AS ClientName
            FROM Positions
            LEFT JOIN Clients ON Positions.IdClient = Clients.Id
            """;

        if (where.Count > 0)
        {
            sql += " WHERE " + string.Join(" AND ", where);
        }

        sql += " ORDER BY Positions.Id";

        await using var connection = CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddRange(parameters.ToArray());
        await connection.OpenAsync(cancellationToken);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var positions = new List<Position>();
        while (await reader.ReadAsync(cancellationToken))
        {
            positions.Add(ReadPosition(reader, includeClientName: true));
        }

        return positions;
    }

    public async Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default)
    {
        const string sql = """
            SELECT Id, Name, Description, StartDate, Deadline, Hired, IdClient,
                   ClientContactName, ClientContactPhone, ClientContactEmail
            FROM Positions
            WHERE Id = @Id
            """;

        await using var connection = CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
        await connection.OpenAsync(cancellationToken);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? ReadPosition(reader, includeClientName: false) : null;
    }

    public async Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default)
    {
        const string sql = """
            INSERT INTO Positions (Name, Description, StartDate, Deadline, Hired, ClientContactName,
                                   ClientContactPhone, ClientContactEmail, IdClient)
            OUTPUT INSERTED.ID
            VALUES (@Name, @Description, @StartDate, @Deadline, @Hired, @ClientContactName,
                    @ClientContactPhone, @ClientContactEmail, @IdClient)
            """;

        await using var connection = CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        AddPositionParameters(command, position, includeClient: true);
        await connection.OpenAsync(cancellationToken);
        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
    }

    public async Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default)
    {
        const string sql = """
            UPDATE Positions
            SET Name = @Name, Description = @Description, StartDate = @StartDate, Deadline = @Deadline,
                Hired = @Hired, ClientContactName = @ClientContactName, ClientContactPhone = @ClientContactPhone,
                ClientContactEmail = @ClientContactEmail, IdClient = @IdClient
            WHERE Id = @Id
            """;

        await using var connection = CreateConnection();
        await using var command = new SqlCommand(sql, connection);
        AddPositionParameters(command, position, includeClient: true);
        command.Parameters.Add("@Id", SqlDbType.Int).Value = position.Id;
        await connection.OpenAsync(cancellationToken);
        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
    }

    private SqlConnection CreateConnection() => new(_connectionString);

    private static void AddClientParameters(SqlCommand command, Client client)
    {
        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = client.Name;
        command.Parameters.Add("@Phone", SqlDbType.VarChar).Value = client.Phone;
        command.Parameters.Add("@Email", SqlDbType.VarChar).Value = client.Email;
        command.Parameters.Add("@ContactName", SqlDbType.VarChar).Value = client.ContactName;
        command.Parameters.Add("@Website", SqlDbType.VarChar).Value = client.Website;
    }

    private static void AddPositionParameters(SqlCommand command, Position position, bool includeClient)
    {
        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = position.Name;
        command.Parameters.Add("@Description", SqlDbType.VarChar).Value = position.Description;
        command.Parameters.Add("@StartDate", SqlDbType.Date).Value = (object?)position.StartDate ?? DBNull.Value;
        command.Parameters.Add("@Deadline", SqlDbType.Date).Value = (object?)position.Deadline ?? DBNull.Value;
        command.Parameters.Add("@Hired", SqlDbType.Bit).Value = position.Hired;
        command.Parameters.Add("@ClientContactName", SqlDbType.VarChar).Value = position.ClientContactName;
        command.Parameters.Add("@ClientContactPhone", SqlDbType.VarChar).Value = position.ClientContactPhone;
        command.Parameters.Add("@ClientContactEmail", SqlDbType.VarChar).Value = position.ClientContactEmail;
        if (includeClient)
        {
            command.Parameters.Add("@IdClient", SqlDbType.Int).Value = (object?)position.IdClient ?? DBNull.Value;
        }
    }

    private static void AddLike(List<string> where, List<SqlParameter> parameters, string column, string? value, string? parameterName = null)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return;
        }

        parameterName ??= "@" + column.Replace(".", string.Empty);
        where.Add($"{column} LIKE {parameterName}");
        parameters.Add(new SqlParameter(parameterName, SqlDbType.VarChar) { Value = "%" + value.Trim() + "%" });
    }

    private static Client ReadClient(SqlDataReader reader) => new()
    {
        Id = reader.GetInt32(0),
        Name = GetString(reader, 1),
        Phone = GetString(reader, 2),
        Email = GetString(reader, 3),
        ContactName = GetString(reader, 4),
        Website = GetString(reader, 5)
    };

    private static Position ReadPosition(SqlDataReader reader, bool includeClientName)
    {
        var position = new Position
        {
            Id = reader.GetInt32(0),
            Name = GetString(reader, 1),
            Description = GetString(reader, 2),
            StartDate = reader.IsDBNull(3) ? null : reader.GetDateTime(3),
            Deadline = reader.IsDBNull(4) ? null : reader.GetDateTime(4),
            Hired = !reader.IsDBNull(5) && reader.GetBoolean(5),
            IdClient = reader.IsDBNull(6) ? null : reader.GetInt32(6),
            ClientContactName = GetString(reader, 7),
            ClientContactPhone = GetString(reader, 8),
            ClientContactEmail = GetString(reader, 9)
        };

        if (includeClientName)
        {
            position.ClientName = GetString(reader, 10);
        }

        return position;
    }

    private static string GetString(SqlDataReader reader, int ordinal) =>
        reader.IsDBNull(ordinal) ? string.Empty : reader.GetString(ordinal);
}
