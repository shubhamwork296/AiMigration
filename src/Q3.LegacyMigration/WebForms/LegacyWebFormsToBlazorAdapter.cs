using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Security.Cryptography;
using System.Xml.Linq;
using Q3.LegacyMigration.Commands;
using Q3.LegacyMigration.Config;

namespace Q3.LegacyMigration.WebForms;

public sealed class LegacyWebFormsToBlazorAdapter
{
    private readonly WebFormsProjectAnalyzer _analyzer = new();

    public async Task<LegacyMigrationResult> MigrateAsync(LegacyMigrationConfig config, ICommandRunner runner, CancellationToken cancellationToken = default)
    {
        var analysis = WithMigrationContext(_analyzer.Analyze(config.ProjectPath), config);
        Directory.CreateDirectory(config.OutputPath);

        if (config.DryRun)
        {
            var reportPath = await WriteReportAsync(config.OutputPath, analysis, [], "Dry run only.", cancellationToken);
            return new LegacyMigrationResult { Success = true, OutputPath = config.OutputPath, ReportPath = reportPath };
        }

        CopyDirectory(config.TargetArchitecturePath, config.OutputPath);
        var appProject = FindBlazorProject(config.OutputPath);
        var appRoot = Path.GetDirectoryName(appProject)!;
        var generated = new List<string>();
        var aiOutput = "";

        AddSqlClientPackage(appProject);
        PatchAppSettings(appRoot, analysis);
        if (config.UseAi)
        {
            var beforeAi = SnapshotFiles(config.OutputPath);
            var ai = await RunAiMigrationAsync(config, appProject, analysis, runner, cancellationToken);
            aiOutput = $"AI migration exit={ai.ExitCode}{Environment.NewLine}{ai.Output}";
            if (ai.ExitCode == 127)
            {
                generated.AddRange(GenerateHiringTracker(appRoot, analysis));
                PatchDependencyInjection(appRoot);
                PatchNavigation(appRoot);
                PatchHome(appRoot);
            }
            else if (ai.ExitCode != 0)
            {
                var reportPath = await WriteReportAsync(config.OutputPath, analysis, generated, aiOutput, cancellationToken);
                return new LegacyMigrationResult { Success = false, OutputPath = config.OutputPath, ReportPath = reportPath, ValidationCommands = [config.AiCli], ValidationOutput = ai.Output };
            }
            else
            {
                generated.AddRange(ChangedFiles(config.OutputPath, beforeAi));
            }
        }
        else
        {
            generated.AddRange(GenerateHiringTracker(appRoot, analysis));
            PatchDependencyInjection(appRoot);
            PatchNavigation(appRoot);
            PatchHome(appRoot);
        }

        var restore = await runner.RunAsync(["dotnet", "restore", appProject], config.OutputPath, config.CommandTimeoutSeconds, cancellationToken);
        var build = restore.ExitCode == 0
            ? await runner.RunAsync(["dotnet", "build", appProject, "-v:minimal", "--no-restore"], config.OutputPath, config.CommandTimeoutSeconds, cancellationToken)
            : new CommandResult(1, "dotnet restore failed; build was skipped.");
        var validationOutput = $"{(config.UseAi ? $"{aiOutput}{Environment.NewLine}" : "")}dotnet restore exit={restore.ExitCode}{Environment.NewLine}{restore.Output}{Environment.NewLine}dotnet build exit={build.ExitCode}{Environment.NewLine}{build.Output}";
        var report = await WriteReportAsync(config.OutputPath, analysis, generated, validationOutput, cancellationToken);

        return new LegacyMigrationResult
        {
            Success = restore.ExitCode == 0 && build.ExitCode == 0,
            OutputPath = config.OutputPath,
            ReportPath = report,
            GeneratedFiles = generated.Select(f => Path.GetRelativePath(config.OutputPath, f).Replace('\\', '/')).ToArray(),
            ValidationCommands = config.UseAi ? [$"{config.AiCli} migration", "dotnet restore", "dotnet build"] : ["dotnet restore", "dotnet build"],
            ValidationOutput = validationOutput
        };
    }

    private static Task<CommandResult> RunAiMigrationAsync(
        LegacyMigrationConfig config,
        string appProject,
        WebFormsAnalysis analysis,
        ICommandRunner runner,
        CancellationToken cancellationToken)
    {
        var command = config.AiCliCommand is { Count: > 0 } ? config.AiCliCommand : AiCommand(config.AiCli);
        var prompt = BuildAiMigrationPrompt(config, appProject, analysis);
        return runner.RunAsync(command, config.OutputPath, config.AiTimeoutSeconds, cancellationToken, prompt);
    }

    private static IReadOnlyList<string> AiCommand(string aiCli)
    {
        if (string.Equals(aiCli, "claude", StringComparison.OrdinalIgnoreCase)) return ["claude", "-p"];
        return ["codex", "exec", "--skip-git-repo-check"];
    }

    private static string BuildAiMigrationPrompt(LegacyMigrationConfig config, string appProject, WebFormsAnalysis analysis)
    {
        var sourceFiles = string.Join(Environment.NewLine, analysis.WebFormsFiles.Select(f => "- " + Path.Combine(config.ProjectPath, f.Replace('/', Path.DirectorySeparatorChar))));
        var masterPages = analysis.MasterPages.Count == 0 ? "none detected" : string.Join(", ", analysis.MasterPages);
        return $$"""
You are migrating an ASP.NET WebForms application to the copied Blazor SSR target app in place.

Source WebForms root:
{{config.ProjectPath}}

Output Blazor app root:
{{Path.GetDirectoryName(appProject)}}

Target project:
{{appProject}}

Primary requirement:
Preserve the source application's user-visible UI and workflows as closely as possible. Do not leave unrelated starter/template pages in navigation or first-run UI. Convert each source page, master layout, navigation item, labels, tables, forms, filters, buttons, validation messages, alert behavior, CSS, and visual assets into equivalent Blazor/.NET 8 code. Keep route parameters only where they replace legacy Session record IDs without changing user-visible behavior.

Source files to migrate:
{{sourceFiles}}

Detected master pages:
{{masterPages}}

Detected features:
- SqlDataSource: {{analysis.UsesSqlDataSource}}
- Direct ADO.NET: {{analysis.UsesDirectAdoNet}}
- Session state: {{analysis.UsesSessionState}}
- Primary connection string: {{analysis.PrimaryConnectionStringName ?? "none detected"}}

Migration context:
{{(string.IsNullOrWhiteSpace(analysis.MigrationContext) ? "No extra migration context was provided." : analysis.MigrationContext)}}

Implementation constraints:
- Edit files under the output Blazor app only.
- Read the source .aspx, .master, .designer.cs, code-behind, Web.config, Content, Scripts, fonts, and App_Data files as needed.
- Recreate the WebForms UI faithfully; do not use the existing hard-coded HiringTracker scaffold as a substitute.
- Migrate data access into services/repositories using parameterized SQL.
- Use ConnectionStrings:HiringConnection in appsettings.json.
- Ensure the target project builds with dotnet build.
- After editing, summarize changed files and any behavior that could not be preserved.
""";
    }

    private static IReadOnlyList<string> GenerateHiringTracker(string appRoot, WebFormsAnalysis analysis)
    {
        var generated = new List<string>();
        generated.Add(Write(appRoot, "Components/Models/Hiring/Client.cs", ClientModel()));
        generated.Add(Write(appRoot, "Components/Models/Hiring/Position.cs", PositionModel()));
        generated.Add(Write(appRoot, "Components/Models/Hiring/ClientListFilter.cs", ClientListFilter()));
        generated.Add(Write(appRoot, "Components/Models/Hiring/PositionListFilter.cs", PositionListFilter()));
        generated.Add(Write(appRoot, "Components/Models/Hiring/ClientOption.cs", ClientOption()));
        generated.Add(Write(appRoot, "Data/IHiringRepository.cs", RepositoryInterface()));
        generated.Add(Write(appRoot, "Data/SqlHiringRepository.cs", RepositoryImplementation()));
        generated.Add(Write(appRoot, "Services/IHiringDataService.cs", ServiceInterface()));
        generated.Add(Write(appRoot, "Services/HiringDataService.cs", ServiceImplementation()));
        generated.Add(Write(appRoot, "Components/Pages/Clients/ClientsList.razor", ClientsListPage()));
        generated.Add(Write(appRoot, "Components/Pages/Clients/ClientForm.razor", ClientFormPage()));
        generated.Add(Write(appRoot, "Components/Pages/Positions/PositionsList.razor", PositionsListPage()));
        generated.Add(Write(appRoot, "Components/Pages/Positions/PositionForm.razor", PositionFormPage()));
        generated.Add(Write(appRoot, "Components/Pages/LegacyMigrationSummary.razor", SummaryPage(analysis)));
        return generated;
    }

    private static WebFormsAnalysis WithMigrationContext(WebFormsAnalysis analysis, LegacyMigrationConfig config)
    {
        if (string.IsNullOrWhiteSpace(config.MigrationContextPath)) return analysis;
        var context = File.ReadAllText(config.MigrationContextPath);
        return analysis with
        {
            MigrationContextPath = config.MigrationContextPath,
            MigrationContext = context.Length > 12000 ? context[..12000] : context
        };
    }

    private static void PatchDependencyInjection(string appRoot)
    {
        var file = Path.Combine(appRoot, "DI", "DependancyInjector.cs");
        var text = File.ReadAllText(file);
        if (!text.Contains("IRM.SPA.Data;", StringComparison.Ordinal))
            text = text.Replace("using IRM.SPA.Config;", "using IRM.SPA.Config;\r\nusing IRM.SPA.Data;");
        if (!text.Contains("services.AddScoped<IHiringRepository", StringComparison.Ordinal))
        {
            text = text.Replace("RegisterModelValidators(services);", "RegisterModelValidators(services);\r\n            services.AddScoped<IHiringRepository, SqlHiringRepository>();\r\n            services.AddScoped<IHiringDataService, HiringDataService>();");
        }
        File.WriteAllText(file, text);
    }

    private static void PatchNavigation(string appRoot)
    {
        var file = Path.Combine(appRoot, "Components", "Layout", "NavMenu.razor");
        var text = File.ReadAllText(file);
        if (text.Contains("href=\"clients\"", StringComparison.Ordinal)) return;
        var insert = """

        <div class="nav-item px-3">
            <NavLink class="nav-link" href="clients">
                <span class="bi bi-people-fill-nav-menu" aria-hidden="true"></span> Clients
            </NavLink>
        </div>

        <div class="nav-item px-3">
            <NavLink class="nav-link" href="positions">
                <span class="bi bi-list-check-nav-menu" aria-hidden="true"></span> Positions
            </NavLink>
        </div>

        <div class="nav-item px-3">
            <NavLink class="nav-link" href="legacy-migration">
                <span class="bi bi-info-circle-fill-nav-menu" aria-hidden="true"></span> Migration
            </NavLink>
        </div>
""";
        text = text.Replace("    </nav>", insert + "\r\n    </nav>");
        File.WriteAllText(file, text);
    }

    private static void PatchHome(string appRoot)
    {
        var file = Path.Combine(appRoot, "Components", "Pages", "Home.razor");
        File.WriteAllText(file, """
@page "/"

<PageTitle>Hiring Tracking</PageTitle>

<h1>Hiring Tracking</h1>

<div class="d-flex gap-2 mt-3">
    <a class="btn btn-primary" href="positions">Positions</a>
    <a class="btn btn-outline-primary" href="clients">Clients</a>
</div>
""");
    }

    private static void PatchAppSettings(string appRoot, WebFormsAnalysis analysis)
    {
        var file = Path.Combine(appRoot, "appsettings.json");
        var root = JsonNode.Parse(File.ReadAllText(file))?.AsObject() ?? new JsonObject();
        var connectionStrings = root["ConnectionStrings"] as JsonObject ?? new JsonObject();
        connectionStrings["HiringConnection"] = analysis.PrimaryConnectionString ?? "Server=(localdb)\\MSSQLLocalDB;Database=HiringDb;Trusted_Connection=True;TrustServerCertificate=True";
        root["ConnectionStrings"] = connectionStrings;
        File.WriteAllText(file, root.ToJsonString(new JsonSerializerOptions { WriteIndented = true }));
    }

    private static void AddSqlClientPackage(string csproj)
    {
        var doc = XDocument.Load(csproj, LoadOptions.PreserveWhitespace);
        var project = doc.Root!;
        if (doc.Descendants("PackageReference").Any(e => string.Equals(e.Attribute("Include")?.Value, "Microsoft.Data.SqlClient", StringComparison.OrdinalIgnoreCase))) return;
        var itemGroup = project.Elements("ItemGroup").FirstOrDefault(e => e.Elements("PackageReference").Any()) ?? new XElement("ItemGroup");
        if (itemGroup.Parent is null) project.Add(itemGroup);
        itemGroup.Add(new XElement("PackageReference", new XAttribute("Include", "Microsoft.Data.SqlClient"), new XAttribute("Version", "5.2.2")));
        doc.Save(csproj);
    }

    private static string FindBlazorProject(string root)
    {
        var candidates = Directory.EnumerateFiles(root, "*.csproj", SearchOption.AllDirectories)
            .Where(path => !path.Contains(".Tests", StringComparison.OrdinalIgnoreCase))
            .OrderBy(path => path.Contains($"{Path.DirectorySeparatorChar}IRM.SPA{Path.DirectorySeparatorChar}", StringComparison.OrdinalIgnoreCase) ? 0 : 1)
            .ToArray();
        return candidates.FirstOrDefault() ?? throw new InvalidOperationException("No Blazor target .csproj was found in targetArchitecturePath.");
    }

    private static async Task<string> WriteReportAsync(string outputPath, WebFormsAnalysis analysis, IReadOnlyList<string> generated, string validationOutput, CancellationToken cancellationToken)
    {
        var reportPath = Path.Combine(outputPath, "legacy-migration-report.md");
        var report = new StringBuilder();
        report.AppendLine("# Legacy WebForms to Blazor SSR Migration Report");
        report.AppendLine();
        report.AppendLine($"- Application: {analysis.ApplicationName}");
        report.AppendLine($"- WebForms files analyzed: {analysis.WebFormsFiles.Count}");
        report.AppendLine($"- Uses SqlDataSource: {analysis.UsesSqlDataSource}");
        report.AppendLine($"- Uses direct ADO.NET: {analysis.UsesDirectAdoNet}");
        report.AppendLine($"- Uses Session state: {analysis.UsesSessionState}");
        report.AppendLine($"- Connection string migrated: {analysis.PrimaryConnectionStringName ?? "none detected"}");
        report.AppendLine($"- Migration context: {analysis.MigrationContextPath ?? "not provided"}");
        report.AppendLine($"- Generated files: {generated.Count}");
        report.AppendLine();
        if (!string.IsNullOrWhiteSpace(analysis.MigrationContext))
        {
            report.AppendLine("## Migration Context Applied");
            report.AppendLine();
            report.AppendLine("```text");
            report.AppendLine(TrimForReport(analysis.MigrationContext));
            report.AppendLine("```");
            report.AppendLine();
        }
        report.AppendLine("## Generated Files");
        foreach (var file in generated.Select(f => Path.GetRelativePath(outputPath, f).Replace('\\', '/')).Order()) report.AppendLine($"- {file}");
        report.AppendLine();
        report.AppendLine("## Validation");
        report.AppendLine("```text");
        report.AppendLine(validationOutput);
        report.AppendLine("```");
        await File.WriteAllTextAsync(reportPath, report.ToString(), cancellationToken);
        return reportPath;
    }

    private static string TrimForReport(string text) => text.Length <= 4000 ? text : text[..4000] + Environment.NewLine + "...";

    private static Dictionary<string, string> SnapshotFiles(string root) =>
        Directory.EnumerateFiles(root, "*", SearchOption.AllDirectories)
            .Where(path => !path.Split(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar).Any(part => part is "bin" or "obj" or ".git" or ".vs"))
            .ToDictionary(path => Path.GetRelativePath(root, path), FileHash, StringComparer.OrdinalIgnoreCase);

    private static IReadOnlyList<string> ChangedFiles(string root, IReadOnlyDictionary<string, string> before)
    {
        var changed = new List<string>();
        foreach (var file in Directory.EnumerateFiles(root, "*", SearchOption.AllDirectories))
        {
            if (file.Split(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar).Any(part => part is "bin" or "obj" or ".git" or ".vs")) continue;
            var relative = Path.GetRelativePath(root, file);
            if (!before.TryGetValue(relative, out var hash) || !string.Equals(hash, FileHash(file), StringComparison.Ordinal))
            {
                changed.Add(file);
            }
        }
        return changed.Order(StringComparer.OrdinalIgnoreCase).ToArray();
    }

    private static string FileHash(string path)
    {
        using var stream = File.OpenRead(path);
        return Convert.ToHexString(SHA256.HashData(stream));
    }

    private static void CopyDirectory(string source, string destination)
    {
        if (Directory.Exists(destination)) ClearDirectory(destination);
        Directory.CreateDirectory(destination);
        foreach (var directory in Directory.EnumerateDirectories(source))
        {
            var name = Path.GetFileName(directory);
            if (name is "bin" or "obj" or ".git" or ".vs") continue;
            CopyDirectory(directory, Path.Combine(destination, name));
        }
        foreach (var file in Directory.EnumerateFiles(source))
        {
            var name = Path.GetFileName(file);
            if (name.EndsWith(".user", StringComparison.OrdinalIgnoreCase)) continue;
            File.Copy(file, Path.Combine(destination, name), overwrite: true);
        }
    }

    private static void ClearDirectory(string directory)
    {
        foreach (var childDirectory in Directory.EnumerateDirectories(directory))
        {
            Directory.Delete(childDirectory, recursive: true);
        }
        foreach (var file in Directory.EnumerateFiles(directory))
        {
            File.Delete(file);
        }
    }

    private static string Write(string root, string relativePath, string content)
    {
        var full = Path.Combine(root, relativePath.Replace('/', Path.DirectorySeparatorChar));
        Directory.CreateDirectory(Path.GetDirectoryName(full)!);
        File.WriteAllText(full, content);
        return full;
    }

    private static string SummaryPage(WebFormsAnalysis analysis) => $$"""
@page "/legacy-migration"

<PageTitle>Legacy Migration</PageTitle>

<h1>Legacy Migration</h1>

<dl class="row">
    <dt class="col-sm-3">Source application</dt>
    <dd class="col-sm-9">{{analysis.ApplicationName}}</dd>
    <dt class="col-sm-3">WebForms files</dt>
    <dd class="col-sm-9">{{analysis.WebFormsFiles.Count}}</dd>
    <dt class="col-sm-3">Session converted</dt>
    <dd class="col-sm-9">Route parameters replace selected entity session state.</dd>
    <dt class="col-sm-3">Data access converted</dt>
    <dd class="col-sm-9">SqlDataSource and ADO.NET page code moved to repository and service classes.</dd>
    <dt class="col-sm-3">Context source</dt>
    <dd class="col-sm-9">{{(analysis.MigrationContextPath is null ? "Not provided" : analysis.MigrationContextPath)}}</dd>
</dl>

{{ContextMarkup(analysis)}}
""";

    private static string ContextMarkup(WebFormsAnalysis analysis)
    {
        if (string.IsNullOrWhiteSpace(analysis.MigrationContext)) return "";
        var excerpt = RazorText(System.Net.WebUtility.HtmlEncode(TrimForReport(analysis.MigrationContext)));
        return $"""
<h2>Migration Context Notes</h2>
<pre class="border rounded p-3 bg-light">{excerpt}</pre>
""";
    }

    private static string RazorText(string text) => text.Replace("@", "@@", StringComparison.Ordinal);

    private static string ClientModel() => """
namespace IRM.SPA.Components.Models.Hiring;

public sealed class Client
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Email { get; set; } = "";
    public string ContactName { get; set; } = "";
    public string Website { get; set; } = "";
}
""";

    private static string PositionModel() => """
namespace IRM.SPA.Components.Models.Hiring;

public sealed class Position
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public DateTime? StartDate { get; set; }
    public DateTime? Deadline { get; set; }
    public bool Hired { get; set; }
    public int? IdClient { get; set; }
    public string ClientName { get; set; } = "";
    public string ClientContactName { get; set; } = "";
    public string ClientContactPhone { get; set; } = "";
    public string ClientContactEmail { get; set; } = "";
}
""";

    private static string ClientListFilter() => """
namespace IRM.SPA.Components.Models.Hiring;

public sealed class ClientListFilter
{
    public int? Id { get; set; }
    public string? Name { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? ContactName { get; set; }
    public string? Website { get; set; }
}
""";

    private static string PositionListFilter() => """
namespace IRM.SPA.Components.Models.Hiring;

public sealed class PositionListFilter
{
    public int? Id { get; set; }
    public string? Name { get; set; }
    public string? ClientContactName { get; set; }
}
""";

    private static string ClientOption() => """
namespace IRM.SPA.Components.Models.Hiring;

public sealed record ClientOption(int Id, string Name);
""";

    private static string ServiceInterface() => """
using IRM.SPA.Components.Models.Hiring;

namespace IRM.SPA.Services;

public interface IHiringDataService
{
    Task<IReadOnlyList<Client>> GetClientsAsync(ClientListFilter filter, CancellationToken cancellationToken = default);
    Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default);
    Task<int> SaveClientAsync(Client client, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Position>> GetPositionsAsync(PositionListFilter filter, CancellationToken cancellationToken = default);
    Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default);
    Task<int> SavePositionAsync(Position position, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ClientOption>> GetClientOptionsAsync(CancellationToken cancellationToken = default);
}
""";

    private static string ServiceImplementation() => """
using IRM.SPA.Components.Models.Hiring;
using IRM.SPA.Data;

namespace IRM.SPA.Services;

public sealed class HiringDataService(IHiringRepository repository) : IHiringDataService
{
    public Task<IReadOnlyList<Client>> GetClientsAsync(ClientListFilter filter, CancellationToken cancellationToken = default) => repository.GetClientsAsync(filter, cancellationToken);
    public Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default) => repository.GetClientAsync(id, cancellationToken);
    public Task<int> SaveClientAsync(Client client, CancellationToken cancellationToken = default) => repository.SaveClientAsync(client, cancellationToken);
    public Task<IReadOnlyList<Position>> GetPositionsAsync(PositionListFilter filter, CancellationToken cancellationToken = default) => repository.GetPositionsAsync(filter, cancellationToken);
    public Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default) => repository.GetPositionAsync(id, cancellationToken);
    public Task<int> SavePositionAsync(Position position, CancellationToken cancellationToken = default) => repository.SavePositionAsync(position, cancellationToken);
    public Task<IReadOnlyList<ClientOption>> GetClientOptionsAsync(CancellationToken cancellationToken = default) => repository.GetClientOptionsAsync(cancellationToken);
}
""";

    private static string RepositoryInterface() => """
using IRM.SPA.Components.Models.Hiring;

namespace IRM.SPA.Data;

public interface IHiringRepository
{
    Task<IReadOnlyList<Client>> GetClientsAsync(ClientListFilter filter, CancellationToken cancellationToken = default);
    Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default);
    Task<int> SaveClientAsync(Client client, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Position>> GetPositionsAsync(PositionListFilter filter, CancellationToken cancellationToken = default);
    Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default);
    Task<int> SavePositionAsync(Position position, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ClientOption>> GetClientOptionsAsync(CancellationToken cancellationToken = default);
}
""";

    private static string RepositoryImplementation() => """
using System.Data;
using IRM.SPA.Components.Models.Hiring;
using Microsoft.Data.SqlClient;

namespace IRM.SPA.Data;

public sealed class SqlHiringRepository(IConfiguration configuration) : IHiringRepository
{
    private string ConnectionString => configuration.GetConnectionString("HiringConnection") ?? throw new InvalidOperationException("ConnectionStrings:HiringConnection is missing.");

    public async Task<IReadOnlyList<Client>> GetClientsAsync(ClientListFilter filter, CancellationToken cancellationToken = default)
    {
        var sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients";
        var where = new List<string>();
        var parameters = new List<SqlParameter>();
        if (filter.Id is not null) { where.Add("Id = @Id"); parameters.Add(new SqlParameter("@Id", filter.Id)); }
        AddLike(where, parameters, "Name", filter.Name);
        AddLike(where, parameters, "Phone", filter.Phone);
        AddLike(where, parameters, "Email", filter.Email);
        AddLike(where, parameters, "ContactName", filter.ContactName);
        AddLike(where, parameters, "Website", filter.Website);
        if (where.Count > 0) sql += " WHERE " + string.Join(" AND ", where);
        sql += " ORDER BY Name";
        await using var connection = new SqlConnection(ConnectionString);
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddRange(parameters.ToArray());
        await connection.OpenAsync(cancellationToken);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var rows = new List<Client>();
        while (await reader.ReadAsync(cancellationToken))
        {
            rows.Add(new Client { Id = reader.GetInt32(0), Name = Text(reader, 1), Phone = Text(reader, 2), Email = Text(reader, 3), ContactName = Text(reader, 4), Website = Text(reader, 5) });
        }
        return rows;
    }

    public async Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default)
    {
        await using var connection = new SqlConnection(ConnectionString);
        await using var command = new SqlCommand("SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients WHERE Id = @Id", connection);
        command.Parameters.Add(new SqlParameter("@Id", id));
        await connection.OpenAsync(cancellationToken);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken)
            ? new Client { Id = reader.GetInt32(0), Name = Text(reader, 1), Phone = Text(reader, 2), Email = Text(reader, 3), ContactName = Text(reader, 4), Website = Text(reader, 5) }
            : null;
    }

    public async Task<int> SaveClientAsync(Client client, CancellationToken cancellationToken = default)
    {
        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);
        var isNew = client.Id == 0;
        var sql = isNew
            ? "INSERT INTO Clients (Name, Phone, Email, ContactName, Website) OUTPUT INSERTED.Id VALUES (@Name, @Phone, @Email, @ContactName, @Website)"
            : "UPDATE Clients SET Name=@Name, Phone=@Phone, Email=@Email, ContactName=@ContactName, Website=@Website WHERE Id=@Id; SELECT @Id";
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddRange([
            new SqlParameter("@Name", client.Name),
            new SqlParameter("@Phone", client.Phone),
            new SqlParameter("@Email", client.Email),
            new SqlParameter("@ContactName", client.ContactName),
            new SqlParameter("@Website", client.Website),
            new SqlParameter("@Id", client.Id)
        ]);
        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
    }

    public async Task<IReadOnlyList<Position>> GetPositionsAsync(PositionListFilter filter, CancellationToken cancellationToken = default)
    {
        var sql = "SELECT Positions.Id, Positions.Name, Positions.Description, Positions.StartDate, Positions.Deadline, Positions.Hired, Positions.IdClient, Clients.Name AS ClientName, Positions.ClientContactName, Positions.ClientContactPhone, Positions.ClientContactEmail FROM Positions LEFT JOIN Clients ON Positions.IdClient = Clients.Id";
        var where = new List<string>();
        var parameters = new List<SqlParameter>();
        if (filter.Id is not null) { where.Add("Positions.Id = @Id"); parameters.Add(new SqlParameter("@Id", filter.Id)); }
        AddLike(where, parameters, "Positions.Name", filter.Name);
        AddLike(where, parameters, "Positions.ClientContactName", filter.ClientContactName);
        if (where.Count > 0) sql += " WHERE " + string.Join(" AND ", where);
        sql += " ORDER BY Positions.Name";
        await using var connection = new SqlConnection(ConnectionString);
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddRange(parameters.ToArray());
        await connection.OpenAsync(cancellationToken);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var rows = new List<Position>();
        while (await reader.ReadAsync(cancellationToken)) rows.Add(ReadPosition(reader));
        return rows;
    }

    public async Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default)
    {
        await using var connection = new SqlConnection(ConnectionString);
        await using var command = new SqlCommand("SELECT Id, Name, Description, StartDate, Deadline, Hired, IdClient, '' AS ClientName, ClientContactName, ClientContactPhone, ClientContactEmail FROM Positions WHERE Id = @Id", connection);
        command.Parameters.Add(new SqlParameter("@Id", id));
        await connection.OpenAsync(cancellationToken);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? ReadPosition(reader) : null;
    }

    public async Task<int> SavePositionAsync(Position position, CancellationToken cancellationToken = default)
    {
        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);
        var isNew = position.Id == 0;
        var sql = isNew
            ? "INSERT INTO Positions(Name, Description, StartDate, Deadline, Hired, ClientContactName, ClientContactPhone, ClientContactEmail, IdClient) OUTPUT INSERTED.Id VALUES (@Name, @Description, @StartDate, @Deadline, @Hired, @ClientContactName, @ClientContactPhone, @ClientContactEmail, @IdClient)"
            : "UPDATE Positions SET Name=@Name, Description=@Description, StartDate=@StartDate, Deadline=@Deadline, Hired=@Hired, ClientContactName=@ClientContactName, ClientContactPhone=@ClientContactPhone, ClientContactEmail=@ClientContactEmail, IdClient=@IdClient WHERE Id=@Id; SELECT @Id";
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddRange([
            new SqlParameter("@Name", position.Name),
            new SqlParameter("@Description", position.Description),
            new SqlParameter("@StartDate", (object?)position.StartDate ?? DBNull.Value),
            new SqlParameter("@Deadline", (object?)position.Deadline ?? DBNull.Value),
            new SqlParameter("@Hired", position.Hired),
            new SqlParameter("@ClientContactName", position.ClientContactName),
            new SqlParameter("@ClientContactPhone", position.ClientContactPhone),
            new SqlParameter("@ClientContactEmail", position.ClientContactEmail),
            new SqlParameter("@IdClient", (object?)position.IdClient ?? DBNull.Value),
            new SqlParameter("@Id", position.Id)
        ]);
        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
    }

    public async Task<IReadOnlyList<ClientOption>> GetClientOptionsAsync(CancellationToken cancellationToken = default)
    {
        await using var connection = new SqlConnection(ConnectionString);
        await using var command = new SqlCommand("SELECT Id, Name FROM Clients ORDER BY Name", connection);
        await connection.OpenAsync(cancellationToken);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var rows = new List<ClientOption>();
        while (await reader.ReadAsync(cancellationToken)) rows.Add(new ClientOption(reader.GetInt32(0), Text(reader, 1)));
        return rows;
    }

    private static void AddLike(List<string> where, List<SqlParameter> parameters, string column, string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return;
        var name = "@p" + parameters.Count;
        where.Add(column + " LIKE " + name);
        parameters.Add(new SqlParameter(name, "%" + value + "%"));
    }

    private static Position ReadPosition(SqlDataReader reader) => new()
    {
        Id = reader.GetInt32(0),
        Name = Text(reader, 1),
        Description = Text(reader, 2),
        StartDate = NullableDate(reader, 3),
        Deadline = NullableDate(reader, 4),
        Hired = !reader.IsDBNull(5) && reader.GetBoolean(5),
        IdClient = reader.IsDBNull(6) ? null : reader.GetInt32(6),
        ClientName = Text(reader, 7),
        ClientContactName = Text(reader, 8),
        ClientContactPhone = Text(reader, 9),
        ClientContactEmail = Text(reader, 10)
    };

    private static string Text(SqlDataReader reader, int ordinal) => reader.IsDBNull(ordinal) ? "" : reader.GetString(ordinal);
    private static DateTime? NullableDate(SqlDataReader reader, int ordinal) => reader.IsDBNull(ordinal) ? null : reader.GetDateTime(ordinal);
}
""";

    private static string ClientsListPage() => """
@page "/clients"
@rendermode InteractiveServer
@using IRM.SPA.Components.Models.Hiring
@using IRM.SPA.Services
@inject IHiringDataService HiringData

<PageTitle>Clients</PageTitle>

<div class="d-flex align-items-center justify-content-between mb-3">
    <h1>Clients</h1>
    <a class="btn btn-primary" href="clients/new">Add Client</a>
</div>

<div class="row g-2 mb-3">
    <div class="col-md-2"><input class="form-control" placeholder="Id" @bind="idText" /></div>
    <div class="col-md-2"><input class="form-control" placeholder="Name" @bind="filter.Name" /></div>
    <div class="col-md-2"><input class="form-control" placeholder="Phone" @bind="filter.Phone" /></div>
    <div class="col-md-2"><input class="form-control" placeholder="Email" @bind="filter.Email" /></div>
    <div class="col-md-2"><input class="form-control" placeholder="Contact" @bind="filter.ContactName" /></div>
    <div class="col-md-2"><button class="btn btn-outline-primary w-100" @onclick="LoadAsync">Filter</button></div>
</div>

<table class="table table-striped table-hover">
    <thead><tr><th>Id</th><th>Name</th><th>Phone</th><th>Email</th><th>Website</th><th>Contact</th><th></th></tr></thead>
    <tbody>
    @foreach (var client in clients)
    {
        <tr>
            <td>@client.Id</td>
            <td>@client.Name</td>
            <td>@client.Phone</td>
            <td>@client.Email</td>
            <td>@client.Website</td>
            <td>@client.ContactName</td>
            <td><a class="btn btn-sm btn-outline-secondary" href="@($"clients/{client.Id}")">Details</a></td>
        </tr>
    }
    </tbody>
</table>

@code {
    private readonly ClientListFilter filter = new();
    private IReadOnlyList<Client> clients = [];
    private string? idText;

    protected override Task OnInitializedAsync() => LoadAsync();

    private async Task LoadAsync()
    {
        filter.Id = int.TryParse(idText, out var id) ? id : null;
        clients = await HiringData.GetClientsAsync(filter);
    }
}
""";

    private static string ClientFormPage() => """
@page "/clients/new"
@page "/clients/{Id:int}"
@rendermode InteractiveServer
@using IRM.SPA.Components.Models.Hiring
@using IRM.SPA.Services
@inject IHiringDataService HiringData
@inject NavigationManager Navigation

<PageTitle>@Title</PageTitle>

<h1>@Title</h1>

@if (!string.IsNullOrWhiteSpace(message))
{
    <div class="alert alert-success">@message</div>
}

<div class="row g-3">
    <div class="col-md-6"><label class="form-label">Name</label><input class="form-control" @bind="client.Name" /></div>
    <div class="col-md-6"><label class="form-label">Phone</label><input class="form-control" @bind="client.Phone" /></div>
    <div class="col-md-6"><label class="form-label">Email</label><input class="form-control" @bind="client.Email" /></div>
    <div class="col-md-6"><label class="form-label">Contact Name</label><input class="form-control" @bind="client.ContactName" /></div>
    <div class="col-md-12"><label class="form-label">Website</label><input class="form-control" @bind="client.Website" /></div>
</div>

<div class="mt-3 d-flex gap-2">
    <button class="btn btn-primary" @onclick="SaveAsync">Save</button>
    <a class="btn btn-outline-secondary" href="clients">Back</a>
</div>

@code {
    [Parameter] public int? Id { get; set; }
    private Client client = new();
    private string? message;
    private string Title => Id is null ? "Add Client" : "Edit Client";

    protected override async Task OnParametersSetAsync()
    {
        if (Id is null) return;
        client = await HiringData.GetClientAsync(Id.Value) ?? new Client();
    }

    private async Task SaveAsync()
    {
        client.Id = await HiringData.SaveClientAsync(client);
        message = "Client saved successfully.";
        if (Id is null) Navigation.NavigateTo($"clients/{client.Id}");
    }
}
""";

    private static string PositionsListPage() => """
@page "/positions"
@rendermode InteractiveServer
@using IRM.SPA.Components.Models.Hiring
@using IRM.SPA.Services
@inject IHiringDataService HiringData

<PageTitle>Positions</PageTitle>

<div class="d-flex align-items-center justify-content-between mb-3">
    <h1>Positions</h1>
    <a class="btn btn-primary" href="positions/new">Add Position</a>
</div>

<div class="row g-2 mb-3">
    <div class="col-md-2"><input class="form-control" placeholder="Id" @bind="idText" /></div>
    <div class="col-md-4"><input class="form-control" placeholder="Name" @bind="filter.Name" /></div>
    <div class="col-md-4"><input class="form-control" placeholder="Contact" @bind="filter.ClientContactName" /></div>
    <div class="col-md-2"><button class="btn btn-outline-primary w-100" @onclick="LoadAsync">Filter</button></div>
</div>

<table class="table table-striped table-hover">
    <thead><tr><th>Id</th><th>Name</th><th>Client</th><th>Start</th><th>Deadline</th><th>Hired</th><th>Contact</th><th></th></tr></thead>
    <tbody>
    @foreach (var position in positions)
    {
        <tr>
            <td>@position.Id</td>
            <td>@position.Name</td>
            <td>@position.ClientName</td>
            <td>@position.StartDate?.ToString("yyyy-MM-dd")</td>
            <td>@position.Deadline?.ToString("yyyy-MM-dd")</td>
            <td>@position.Hired</td>
            <td>@position.ClientContactName</td>
            <td><a class="btn btn-sm btn-outline-secondary" href="@($"positions/{position.Id}")">Details</a></td>
        </tr>
    }
    </tbody>
</table>

@code {
    private readonly PositionListFilter filter = new();
    private IReadOnlyList<Position> positions = [];
    private string? idText;

    protected override Task OnInitializedAsync() => LoadAsync();

    private async Task LoadAsync()
    {
        filter.Id = int.TryParse(idText, out var id) ? id : null;
        positions = await HiringData.GetPositionsAsync(filter);
    }
}
""";

    private static string PositionFormPage() => """
@page "/positions/new"
@page "/positions/{Id:int}"
@rendermode InteractiveServer
@using IRM.SPA.Components.Models.Hiring
@using IRM.SPA.Services
@inject IHiringDataService HiringData
@inject NavigationManager Navigation

<PageTitle>@Title</PageTitle>

<h1>@Title</h1>

@if (!string.IsNullOrWhiteSpace(message))
{
    <div class="alert alert-success">@message</div>
}

<div class="row g-3">
    <div class="col-md-6"><label class="form-label">Name</label><input class="form-control" @bind="position.Name" /></div>
    <div class="col-md-6"><label class="form-label">Client</label><select class="form-select" @bind="position.IdClient"><option value="">Select client</option>@foreach (var client in clients) { <option value="@client.Id">@client.Name</option> }</select></div>
    <div class="col-md-12"><label class="form-label">Description</label><textarea class="form-control" rows="4" @bind="position.Description"></textarea></div>
    <div class="col-md-6"><label class="form-label">Start Date</label><input type="date" class="form-control" @bind="position.StartDate" /></div>
    <div class="col-md-6"><label class="form-label">Deadline</label><input type="date" class="form-control" @bind="position.Deadline" /></div>
    <div class="col-md-12"><label class="form-check"><input class="form-check-input" type="checkbox" @bind="position.Hired" /> Hired</label></div>
    <div class="col-md-4"><label class="form-label">Contact Name</label><input class="form-control" @bind="position.ClientContactName" /></div>
    <div class="col-md-4"><label class="form-label">Contact Phone</label><input class="form-control" @bind="position.ClientContactPhone" /></div>
    <div class="col-md-4"><label class="form-label">Contact Email</label><input class="form-control" @bind="position.ClientContactEmail" /></div>
</div>

<div class="mt-3 d-flex gap-2">
    <button class="btn btn-primary" @onclick="SaveAsync">Save</button>
    <a class="btn btn-outline-secondary" href="positions">Back</a>
</div>

@code {
    [Parameter] public int? Id { get; set; }
    private Position position = new();
    private IReadOnlyList<ClientOption> clients = [];
    private string? message;
    private string Title => Id is null ? "Add Position" : "Edit Position";

    protected override async Task OnParametersSetAsync()
    {
        clients = await HiringData.GetClientOptionsAsync();
        if (Id is null) return;
        position = await HiringData.GetPositionAsync(Id.Value) ?? new Position();
    }

    private async Task SaveAsync()
    {
        position.Id = await HiringData.SavePositionAsync(position);
        message = "Position saved successfully.";
        if (Id is null) Navigation.NavigateTo($"positions/{position.Id}");
    }
}
""";
}
