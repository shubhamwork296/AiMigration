# Legacy WebForms to Blazor SSR Migration Report

- Application: HiringTrackingSite
- WebForms files analyzed: 20
- Uses SqlDataSource: True
- Uses direct ADO.NET: True
- Uses Session state: True
- Connection string migrated: HiringConnectionString
- Migration context: D:\Projects\AI\WebFormsMigrationDemo\Source\MIGRATION_CONTEXT.md
- Generated files: 0

## Migration Context Applied

```text
# Migration Context: HiringTrackingSite

This repository contains a legacy ASP.NET WebForms application named `HiringTrackingSite`. The migration goal is to move the app from `.aspx` WebForms on .NET Framework to a modern .NET web application, preferably ASP.NET Core MVC or Razor Pages unless another target architecture is explicitly chosen.

## Current Application

- Solution: `HiringTrackingSite.sln`
- Web project: `HiringTrackingSite/HiringTrackingSite.csproj`
- Current framework: .NET Framework 4.8
- Application type: ASP.NET WebForms web application
- Language: C#
- Main domain: hiring tracker for clients and positions
- Local development URL in project file: `http://localhost:1091/`
- Data store: SQL Server LocalDB `.mdf` file at `HiringTrackingSite/App_Data/HiringDb.mdf`

The app is small and page-oriented. It uses WebForms server controls, code-behind event handlers, `Session` state for passing selected record IDs, `SqlDataSource` on list pages, and direct ADO.NET commands on detail pages.

## Important Existing Files

- `Default.aspx` / `Default.aspx.cs`: home page with links to positions and clients.
- `Site.Master` / `Site.Master.cs`: shared layout, Bootstrap 3 navigation, footer, script manager, bundle references.
- `ClientsList.aspx` / `ClientsList.aspx.cs`: clients list, filters, details navigation, add-new navigation.
- `ClientDetails.aspx` / `ClientDetails.aspx.cs`: client create/update form.
- `PositionsList.aspx` / `PositionsList.aspx.cs`: positions list, basic filtering, details navigation, add-new navigation.
- `PositionDetails.aspx` / `PositionDetails.aspx.cs`: position create/update form and client dropdown.
- `DataExtensions.cs`: helper extension for adding SQL command parameters.
- `Web.config`: connection strings, .NET Framework settings, Application Insights module, EF6 config, binding redirects.
- `packages.config`: NuGet package list for the legacy WebForms app.

## Legacy Dependencies

The legacy app includes:

- ASP.NET WebForms and `System.Web`
- ASP.NET FriendlyUrls
- ASP.NET Bundling/Optimization
- Bootstrap 3.0.0
- jQuery 1.10.2
- Modernizr 2.6.2
- Respond.js
- Microsoft Application Insights 1.2.x
- Entity Framework 6.1.3 packages, although the observed app behavior primarily uses ADO.NET and `SqlDataSource`
- ASP.NET Identity/Owin packages, although authentication is disabled in `Web.config`

Do not assume the Identity/Owin packages represent active user login behavior. `Web.config` has `<authentication mode="None"/>`, clears membership/profile/role providers, and the visible app pages do not require authentication.

## Data Connections

`Web.config` defines two connection strings:

- `DefaultConnection`: ASP.NET template identity/session database. It points to an `aspnet-HiringTrackingSite-...mdf` file that is not part of the visible app workflow.
- `HiringConnectionString`: application database. It points to `|DataDirectory|\HiringDb.mdf` and is the connection used by clients and positions pages.

The migration should prioritize `HiringConnectionString`.

Recommended modern target:

- Move connection settings to `appsettings.json` / user secrets / environment variables.
- Avoid checked-in production secrets.
- Prefer EF Core or a small repository/service layer with parameterized SQL.
- If keeping SQL Server LocalDB for development, use a normal connection string and document how the database is attached or migrated.

## Inferred Database Model

The application uses at least these tables.

### Clients

Observed columns:

- `Id` int primary key / identity
- `Name` varchar/string
- `Phone` varchar/string
- `Email` varchar/string
- `ContactName` varchar/string
- `Website` varchar/string

Used SQL:

- `SELECT * FROM Clients`
- `SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients WHERE Id = @Id`
- `INSERT INTO Clients (Name, Phone, Email, ContactName, Website) OUTPUT INSERTED.ID VALUES (...)`
- `UPDATE Clients SET Name=@Name, Phone=@Phone, Email=@Email, ContactName=@ContactName, Webs
...
```

## Generated Files

## Validation
```text
AI migration exit=1
Reading prompt from stdin...
OpenAI Codex v0.136.0
--------
workdir: D:\Projects\AI\AiMigration\rollback
model: gpt-5.5
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR]
reasoning effort: none
reasoning summaries: none
session id: 019f364f-183d-7ca3-a7ee-258a42819c7f
--------
user
You are migrating an ASP.NET WebForms application to the copied Blazor SSR target app in place.

Source WebForms root:
D:\Projects\AI\WebFormsMigrationDemo\Source

Output Blazor app root:
D:\Projects\AI\AiMigration\rollback\src\IRM.SPA

Target project:
D:\Projects\AI\AiMigration\rollback\src\IRM.SPA\IRM.SPA.csproj

Primary requirement:
Preserve the source application's user-visible UI and workflows as closely as possible. Do not leave unrelated starter/template pages in navigation or first-run UI. Convert each source page, master layout, navigation item, labels, tables, forms, filters, buttons, validation messages, alert behavior, CSS, and visual assets into equivalent Blazor/.NET 8 code. Keep route parameters only where they replace legacy Session record IDs without changing user-visible behavior.

Source files to migrate:
- D:\Projects\AI\WebFormsMigrationDemo\Source\HiringTrackingSite\ClientDetails.aspx
- D:\Projects\AI\WebFormsMigrationDemo\Source\HiringTrackingSite\ClientDetails.aspx.cs
- D:\Projects\AI\WebFormsMigrationDemo\Source\HiringTrackingSite\ClientDetails.aspx.designer.cs
- D:\Projects\AI\WebFormsMigrationDemo\Source\HiringTrackingSite\ClientsList.aspx
- D:\Projects\AI\WebFormsMigrationDemo\Source\HiringTrackingSite\ClientsList.aspx.cs
- D:\Projects\AI\WebFormsMigrationDemo\Source\HiringTrackingSite\ClientsList.aspx.designer.cs
- D:\Projects\AI\WebFormsMigrationDemo\Source\HiringTrackingSite\Default.aspx
- D:\Projects\AI\WebFormsMigrationDemo\Source\HiringTrackingSite\Default.aspx.cs
- D:\Projects\AI\WebFormsMigrationDemo\Source\HiringTrackingSite\Default.aspx.designer.cs
- D:\Projects\AI\WebFormsMigrationDemo\Source\HiringTrackingSite\packages.config
- D:\Projects\AI\WebFormsMigrationDemo\Source\HiringTrackingSite\PositionDetails.aspx
- D:\Projects\AI\WebFormsMigrationDemo\Source\HiringTrackingSite\PositionDetails.aspx.cs
- D:\Projects\AI\WebFormsMigrationDemo\Source\HiringTrackingSite\PositionDetails.aspx.designer.cs
- D:\Projects\AI\WebFormsMigrationDemo\Source\HiringTrackingSite\PositionsList.aspx
- D:\Projects\AI\WebFormsMigrationDemo\Source\HiringTrackingSite\PositionsList.aspx.cs
- D:\Projects\AI\WebFormsMigrationDemo\Source\HiringTrackingSite\PositionsList.aspx.designer.cs
- D:\Projects\AI\WebFormsMigrationDemo\Source\HiringTrackingSite\Site.Master
- D:\Projects\AI\WebFormsMigrationDemo\Source\HiringTrackingSite\Site.Master.cs
- D:\Projects\AI\WebFormsMigrationDemo\Source\HiringTrackingSite\Site.Master.designer.cs
- D:\Projects\AI\WebFormsMigrationDemo\Source\HiringTrackingSite\Web.config

Detected master pages:
HiringTrackingSite/Site.Master

Detected features:
- SqlDataSource: True
- Direct ADO.NET: True
- Session state: True
- Primary connection string: HiringConnectionString

Migration context:
# Migration Context: HiringTrackingSite

This repository contains a legacy ASP.NET WebForms application named `HiringTrackingSite`. The migration goal is to move the app from `.aspx` WebForms on .NET Framework to a modern .NET web application, preferably ASP.NET Core MVC or Razor Pages unless another target architecture is explicitly chosen.

## Current Application

- Solution: `HiringTrackingSite.sln`
- Web project: `HiringTrackingSite/HiringTrackingSite.csproj`
- Current framework: .NET Framework 4.8
- Application type: ASP.NET WebForms web application
- Language: C#
- Main domain: hiring tracker for clients and positions
- Local development URL in project file: `http://localhost:1091/`
- Data store: SQL Server LocalDB `.mdf` file at `HiringTrackingSite/App_Data/HiringDb.mdf`

The app is small and page-oriented. It uses WebForms server controls, code-behind event handlers, `Session` state for passing selected record IDs, `SqlDataSource` on list pages, and direct ADO.NET commands on detail pages.

## Important Existing Files

- `Default.aspx` / `Default.aspx.cs`: home page with links to positions and clients.
- `Site.Master` / `Site.Master.cs`: shared layout, Bootstrap 3 navigation, footer, script manager, bundle references.
- `ClientsList.aspx` / `ClientsList.aspx.cs`: clients list, filters, details navigation, add-new navigation.
- `ClientDetails.aspx` / `ClientDetails.aspx.cs`: client create/update form.
- `PositionsList.aspx` / `PositionsList.aspx.cs`: positions list, basic filtering, details navigation, add-new navigation.
- `PositionDetails.aspx` / `PositionDetails.aspx.cs`: position create/update form and client dropdown.
- `DataExtensions.cs`: helper extension for adding SQL command parameters.
- `Web.config`: connection strings, .NET Framework settings, Application Insights module, EF6 config, binding redirects.
- `packages.config`: NuGet package list for the legacy WebForms app.

## Legacy Dependencies

The legacy app includes:

- ASP.NET WebForms and `System.Web`
- ASP.NET FriendlyUrls
- ASP.NET Bundling/Optimization
- Bootstrap 3.0.0
- jQuery 1.10.2
- Modernizr 2.6.2
- Respond.js
- Microsoft Application Insights 1.2.x
- Entity Framework 6.1.3 packages, although the observed app behavior primarily uses ADO.NET and `SqlDataSource`
- ASP.NET Identity/Owin packages, although authentication is disabled in `Web.config`

Do not assume the Identity/Owin packages represent active user login behavior. `Web.config` has `<authentication mode="None"/>`, clears membership/profile/role providers, and the visible app pages do not require authentication.

## Data Connections

`Web.config` defines two connection strings:

- `DefaultConnection`: ASP.NET template identity/session database. It points to an `aspnet-HiringTrackingSite-...mdf` file that is not part of the visible app workflow.
- `HiringConnectionString`: application database. It points to `|DataDirectory|\HiringDb.mdf` and is the connection used by clients and positions pages.

The migration should prioritize `HiringConnectionString`.

Recommended modern target:

- Move connection settings to `appsettings.json` / user secrets / environment variables.
- Avoid checked-in production secrets.
- Prefer EF Core or a small repository/service layer with parameterized SQL.
- If keeping SQL Server LocalDB for development, use a normal connection string and document how the database is attached or migrated.

## Inferred Database Model

The application uses at least these tables.

### Clients

Observed columns:

- `Id` int primary key / identity
- `Name` varchar/string
- `Phone` varchar/string
- `Email` varchar/string
- `ContactName` varchar/string
- `Website` varchar/string

Used SQL:

- `SELECT * FROM Clients`
- `SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients WHERE Id = @Id`
- `INSERT INTO Clients (Name, Phone, Email, ContactName, Website) OUTPUT INSERTED.ID VALUES (...)`
- `UPDATE Clients SET Name=@Name, Phone=@Phone, Email=@Email, ContactName=@ContactName, Website=@Website WHERE Id=@Id`

### Positions

Observed columns:

- `Id` int primary key / identity
- `Name` varchar/string
- `Description` varchar/string
- `StartDate` date/datetime
- `Deadline` date/datetime
- `Hired` bit/bool
- `IdClient` int foreign key to `Clients.Id`
- `ClientContactName` varchar/string
- `ClientContactPhone` varchar/string
- `ClientContactEmail` varchar/string

Used SQL:

- `SELECT Positions.*, Clients.Name AS ClientName FROM Positions LEFT JOIN Clients ON Positions.IdClient = Clients.Id`
- `SELECT Id, Name, Description, StartDate, Deadline, Hired, IdClient, ClientContactName, ClientContactPhone, ClientContactEmail FROM Positions WHERE Id = @Id`
- `SELECT Id, Name FROM Clients`
- `INSERT INTO Positions (...) OUTPUT INSERTED.ID VALUES (...)`
- `UPDATE Positions SET Name=@Name, Description=@Description, StartDate=@StartDate, Deadline=@Deadline, Hired=@Hired, ClientContactName=@ClientContactName, ClientContactPhone=@ClientContactPhone, ClientContactEmail=@ClientContactEmail WHERE Id=@Id`

Note: `PositionsList.aspx` displays `ClientContactName`, but the current list query only aliases `Clients.Name AS ClientName` and selects `Positions.*`. Preserve the existing display intent: show position data plus client name and contact name.

## Current User Workflows

### Home

Route/page:

- `/`
- `Default.aspx`

Behavior:

- Shows "Hiring Tracking".
- Links to positions and clients lists.

### Clients List

Route/page:

- `ClientsList.aspx`
- Friendly URL may allow `ClientsList`

Behavior:

- Displays client rows with Id, client name, phone, email, website, and contact name.
- Provides text filters for Id, Name, Phone, Email, Website, and ContactName.
- Details link stores selected client id in `Session["ClientId"]`, then redirects to `ClientDetails.aspx`.
- Add-new link clears `Session["ClientId"]`, then redirects to `ClientDetails`.

Migration guidance:

- Replace session-based selected IDs with route values, for example `/clients/{id}` and `/clients/new`.
- Parameterize all filters. Current filter SQL is vulnerable to SQL injection because it concatenates textbox values into SQL.

### Client Details

Route/page:

- `ClientDetails.aspx`
- Friendly URL may allow `ClientDetails`

Behavior:

- If `Session["ClientId"]` exists, loads that client and shows Update button.
- If no client id exists or no row is found, shows Insert button.
- Update modifies client fields and shows JavaScript alert on success.
- Insert creates a client, writes generated id into `IdLabel1`, and shows JavaScript alert on success.

Migration guidance:

- Use distinct Create/Edit pages or handlers.
- Replace JavaScript alerts with model state messages, TempData, or a standard notification component.
- Add validation for required fields and email/URL format if the business owner agrees.

### Positions List

Route/page:

- `PositionsList.aspx`
- Friendly URL may allow `PositionsList`

Behavior:

- Displays position rows with Id, Name, Description, Start Date, Deadline, Hired, client/contact display, and Details link.
- Currently only the Id filter is implemented in code-behind, even though the markup has textboxes for more fields.
- Details link stores selected position id in `Session["PositionId"]`, then redirects to `PositionDetails.aspx`.
- Add-new link clears `Session["PositionId"]`, then redirects to `PositionDetails`.

Migration guidance:

- Replace session-based selected IDs with route values, for example `/positions/{id}` and `/positions/new`.
- Decide whether to preserve the current behavior exactly or implement the visible filters for Name, Description, StartDate, Deadline, and ClientContact.
- Parameterize all filters.

### Position Details

Route/page:

- `PositionDetails.aspx`
- Friendly URL may allow `PositionDetails`

Behavior:

- Loads client dropdown from `Clients` on every page load.
- If `Session["PositionId"]` exists, loads position and shows Update button.
- If no position id exists or no row is found, shows Insert button.
- Form fields include name, description, start date, deadline, hired checkbox, client dropdown, client contact name/phone/email.
- Update does not update `IdClient` in the current implementation.
- Insert saves `IdClient` from the selected client dropdown.

Migration guidance:

- Confirm whether editing an existing position should allow changing the client. The UI shows a client dropdown, but the legacy update SQL does not persist `IdClient`.
- Bind dropdown options through a view model.
- Use typed `DateTime`/`DateOnly` handling and server-side validation.

## Suggested Target Structure

If migrating to ASP.NET Core MVC:

- `Models/Client.cs`
- `Models/Position.cs`
- `Data/HiringDbContext.cs` or `Data/HiringRepository.cs`
- `Controllers/HomeController.cs`
- `Controllers/ClientsController.cs`
- `Controllers/PositionsController.cs`
- `Views/Shared/_Layout.cshtml`
- `Views/Home/Index.cshtml`
- `Views/Clients/Index.cshtml`
- `Views/Clients/Create.cshtml`
- `Views/Clients/Edit.cshtml`
- `Views/Positions/Index.cshtml`
- `Views/Positions/Create.cshtml`
- `Views/Positions/Edit.cshtml`

If migrating to Razor Pages:

- `Pages/Index.cshtml`
- `Pages/Clients/Index.cshtml`
- `Pages/Clients/Create.cshtml`
- `Pages/Clients/Edit.cshtml`
- `Pages/Positions/Index.cshtml`
- `Pages/Positions/Create.cshtml`
- `Pages/Positions/Edit.cshtml`
- `Pages/Shared/_Layout.cshtml`
- shared models/data layer as above

## Migration Rules

- Preserve the visible workflows first: list clients, create/edit clients, list positions, create/edit positions.
- Replace `.aspx`, master pages, server controls, postback events, and designer files with ASP.NET Core routes, views/pages, handlers, and view models.
- Do not carry forward `System.Web`, `SqlDataSource`, `ScriptManager`, WebForms bundles, or WebForms JavaScript assets.
- Do not use `Session` for entity selection. Use route parameters.
- Replace string-concatenated SQL filters with parameterized queries or LINQ.
- Preserve Bootstrap-based layout initially unless a redesign is explicitly requested.
- Treat the `.mdf` file as a legacy data source. Prefer creating migrations or SQL scripts for the target database rather than relying on WebForms `App_Data`.
- Keep business behavior compatible unless the legacy code is clearly unsafe or inconsistent. Document behavior changes.

## Known Legacy Issues To Fix During Migration

- SQL injection risk in list filters due to raw string concatenation.
- Session-based navigation for selected record IDs makes URLs non-shareable and fragile.
- `PositionDetails` loads client dropdown on every request before checking `IsPostBack`.
- `PositionDetails` update does not persist `IdClient`, despite exposing the client dropdown.
- `PositionsList` has filter textboxes that are mostly not implemented.
- `ClientsList` and `PositionsList` build table rows through `DataList` inside a table, which should be replaced with normal semantic table markup.
- Success messages contain typos: "succesfully".
- `Web.config` has `compilation targetFramework="4.8"` but `httpRuntime targetFramework="4.5.2"`.
- Legacy packages include template authentication and telemetry dependencies that may not be needed.

## Verification After Migration

Verify these scenarios manually or with automated tests:

- Home page loads and links to clients and positions.
- Clients list loads rows from the migrated database.
- Client filters work and are parameterized.
- Add client creates a row and redirects or displays success.
- Edit client loads existing values and saves changes.
- Positions list loads rows and shows client name/contact information.
- Position Id filter works; any newly implemented filters should be tested.
- Add position creates a row with selected client and contact fields.
- Edit position loads existing values and saves changes.
- Date fields round-trip using the expected `yyyy-MM-dd` browser input format.
- No route depends on prior session state to identify the selected client or position.



Implementation constraints:
- Edit files under the output Blazor app only.
- Read the source .aspx, .master, .designer.cs, code-behind, Web.config, Content, Scripts, fonts, and App_Data files as needed.
- Recreate the WebForms UI faithfully; do not use the existing hard-coded HiringTracker scaffold as a substitute.
- Migrate data access into services/repositories using parameterized SQL.
- Use ConnectionStrings:HiringConnection in appsettings.json.
- Ensure the target project builds with dotnet build.
- After editing, summarize changed files and any behavior that could not be preserved.
ERROR: You've hit your usage limit. Upgrade to Pro (https://chatgpt.com/explore/pro), visit https://chatgpt.com/codex/settings/usage to purchase more credits or try again at 2:47 PM.
ERROR: You've hit your usage limit. Upgrade to Pro (https://chatgpt.com/explore/pro), visit https://chatgpt.com/codex/settings/usage to purchase more credits or try again at 2:47 PM.

```
