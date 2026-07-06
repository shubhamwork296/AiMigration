# Legacy WebForms to Blazor SSR Migration Report

- Application: HiringTrackingSite
- WebForms files analyzed: 20
- Uses SqlDataSource: True
- Uses direct ADO.NET: True
- Uses Session state: True
- Connection string migrated: HiringConnectionString
- Migration context: D:\Projects\AI\WebFormsMigrationDemo\Source\MIGRATION_CONTEXT.md
- Generated files: 19

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
- src/IRM.SPA/App_Data/HiringDb_log.ldf
- src/IRM.SPA/App_Data/HiringDb.mdf
- src/IRM.SPA/Components/_Imports.razor
- src/IRM.SPA/Components/Layout/MainLayout.razor
- src/IRM.SPA/Components/Layout/NavMenu.razor
- src/IRM.SPA/Components/Pages/ClientDetails.razor
- src/IRM.SPA/Components/Pages/ClientsList.razor
- src/IRM.SPA/Components/Pages/Home.razor
- src/IRM.SPA/Components/Pages/PositionDetails.razor
- src/IRM.SPA/Components/Pages/PositionsList.razor
- src/IRM.SPA/DI/DependancyInjector.cs
- src/IRM.SPA/Models/Client.cs
- src/IRM.SPA/Models/ClientFilter.cs
- src/IRM.SPA/Models/Position.cs
- src/IRM.SPA/Models/PositionFilter.cs
- src/IRM.SPA/Program.cs
- src/IRM.SPA/Services/HiringRepository.cs
- src/IRM.SPA/Services/IHiringRepository.cs
- src/IRM.SPA/wwwroot/app.css

## Validation
```text
AI migration exit=0
Reading prompt from stdin...
OpenAI Codex v0.136.0
--------
workdir: D:\Projects\AI\AiMigration\LegacyOutput
model: gpt-5.5
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR]
reasoning effort: none
reasoning summaries: none
session id: 019f1e0c-e7b7-7d72-879d-373ac7a193cc
--------
user
You are migrating an ASP.NET WebForms application to the copied Blazor SSR target app in place.

Source WebForms root:
D:\Projects\AI\WebFormsMigrationDemo\Source

Output Blazor app root:
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA

Target project:
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\IRM.SPA.csproj

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
codex
I’ll inspect the target Blazor app and the source WebForms pages first, then make the migration in place under `src\IRM.SPA` and build it.
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git status --short' in D:\Projects\AI\AiMigration\LegacyOutput
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg --files' in D:\Projects\AI\WebFormsMigrationDemo\Source\HiringTrackingSite
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg --files' in D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA
 succeeded in 491ms:
Web.Release.config
Web.Debug.config
Web.config
Startup.cs
Site.Master.designer.cs
Site.Master.cs
Site.Master
Default.aspx.designer.cs
Default.aspx.cs
Default.aspx
DataExtensions.cs
Content\Site.css
Content\bootstrap.min.css
Content\bootstrap.css
ClientsList.aspx.designer.cs
ClientsList.aspx.cs
ClientsList.aspx
ClientDetails.aspx.designer.cs
ClientDetails.aspx.cs
ClientDetails.aspx
Bundle.config
PositionDetails.aspx.designer.cs
ApplicationInsights.config
PositionDetails.aspx.cs
PositionDetails.aspx
packages.config
Project_Readme.html
HiringTrackingSite.csproj
PositionsList.aspx.designer.cs
Global.asax.cs
Global.asax
favicon.ico
Scripts\ai.0.15.0-build58334.js
Scripts\ai.0.15.0-build58334.min.js
Scripts\bootstrap.js
Scripts\_references.js
App_Start\Startup.Auth.cs
App_Start\RouteConfig.cs
App_Start\IdentityConfig.cs
App_Start\BundleConfig.cs
Scripts\jquery-1.10.2.min.js
Scripts\jquery-1.10.2.js
Scripts\jquery-1.10.2.intellisense.js
Scripts\bootstrap.min.js
Scripts\modernizr-2.6.2.js
Scripts\jquery-1.10.2.min.map
Scripts\respond.js
Scripts\respond.min.js
PositionsList.aspx
PositionsList.aspx.cs
fonts\glyphicons-halflings-regular.woff
fonts\glyphicons-halflings-regular.ttf
fonts\glyphicons-halflings-regular.svg
fonts\glyphicons-halflings-regular.eot
App_Data\HiringDb_log.ldf
App_Data\HiringDb.mdf
Properties\AssemblyInfo.cs
Scripts\WebForms\WebUIValidation.js
Scripts\WebForms\WebParts.js
Scripts\WebForms\WebForms.js
Scripts\WebForms\TreeView.js
Scripts\WebForms\SmartNav.js
Scripts\WebForms\GridView.js
Scripts\WebForms\Focus.js
Scripts\WebForms\DetailsView.js
Scripts\WebForms\Menu.js
Scripts\WebForms\MenuStandards.js
Scripts\WebForms\MSAjax\MicrosoftAjaxWebServices.js
Scripts\WebForms\MSAjax\MicrosoftAjaxWebForms.js
Scripts\WebForms\MSAjax\MicrosoftAjaxTimer.js
Scripts\WebForms\MSAjax\MicrosoftAjaxSerialization.js
Scripts\WebForms\MSAjax\MicrosoftAjaxNetwork.js
Scripts\WebForms\MSAjax\MicrosoftAjaxHistory.js
Scripts\WebForms\MSAjax\MicrosoftAjaxGlobalization.js
Scripts\WebForms\MSAjax\MicrosoftAjaxCore.js
Scripts\WebForms\MSAjax\MicrosoftAjaxComponentModel.js
Scripts\WebForms\MSAjax\MicrosoftAjaxApplicationServices.js
Scripts\WebForms\MSAjax\MicrosoftAjax.js

 succeeded in 577ms:
Program.cs
appsettings.Development.json
appsettings.json
nlog.config
Middlewares\SecurityHeadersMiddleware.cs
Middlewares\ExceptionMiddleware.cs
IRMSPA.sln
IRM.SPA.csproj
Validators\ControlValidator.cs
Properties\launchSettings.json
DI\DependancyInjector.cs
CommonHelper\AppConstants.cs
CommonHelper\MethodHelper.cs
Services\IProductApi.cs
wwwroot\app.css
wwwroot\favicon.png
Config\ConfigurationOptions.cs
Components\_Imports.razor
Components\Routes.razor
wwwroot\bootstrap\bootstrap.min.css.map
wwwroot\bootstrap\bootstrap.min.css
Components\Pages\Weather.razor
Components\Pages\Templates\Template.razor
Components\Pages\Controls\Controls.razor
Components\Pages\Reports\Report.razor
Components\Pages\Home.razor
Components\Pages\Error.razor
Components\Pages\Dashboard\Dashboard.razor
Components\Pages\Counter.razor
Components\App.razor
Components\Pages\Audits\Audit.razor
Components\Layout\MainLayout.razor
Components\Layout\MainLayout.razor.css
Components\Layout\NavMenu.razor
Components\Layout\NavMenu.razor.css
Components\Models\Templates\Template.cs
Components\Models\Reports\Report.cs
Components\Models\Controls\Control.cs
Components\Models\Dashboard\Dashboard.cs

 succeeded in 629ms:
 M ../.vs/ProjectEvaluation/q3.migrationagent.metadata.v9.bin
 M ../.vs/ProjectEvaluation/q3.migrationagent.projects.v9.bin
 M ../.vs/ProjectEvaluation/q3.migrationagent.strings.v9.bin
 M ../.vs/Q3.MigrationAgent/v17/.suo
 M ../.vs/Q3.MigrationAgent/v17/DocumentLayout.json
?? ./
?? ../legacy-migrate.config.example.json
?? ../src/Q3.LegacyMigration.Cli/
?? ../src/Q3.LegacyMigration.Tests/
?? ../src/Q3.LegacyMigration/

codex
The target app is a Blazor SSR scaffold with unrelated dashboard/control pages still present. I’m reading the legacy markup and code-behind alongside the app shell so I can replace the scaffold with the actual hiring tracker workflow.
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Raw Site.Master' in D:\Projects\AI\WebFormsMigrationDemo\Source\HiringTrackingSite
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Raw Default.aspx; Get-Content -Raw ClientsList.aspx; Get-Content -Raw ClientDetails.aspx' in D:\Projects\AI\WebFormsMigrationDemo\Source\HiringTrackingSite
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -Raw Web.config; Get-Content -Raw Content\\Site.css" in D:\Projects\AI\WebFormsMigrationDemo\Source\HiringTrackingSite
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Raw ClientsList.aspx.cs; Get-Content -Raw ClientDetails.aspx.cs; Get-Content -Raw PositionsList.aspx.cs; Get-Content -Raw PositionDetails.aspx.cs' in D:\Projects\AI\WebFormsMigrationDemo\Source\HiringTrackingSite
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -Raw Program.cs; Get-Content -Raw Components\\Layout\\MainLayout.razor; Get-Content -Raw Components\\Layout\\NavMenu.razor; Get-Content -Raw Components\\Routes.razor; Get-Content -Raw Components\\Pages\\Home.razor; Get-Content -Raw appsettings.json; Get-Content -Raw IRM.SPA.csproj" in D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Raw PositionsList.aspx; Get-Content -Raw PositionDetails.aspx' in D:\Projects\AI\WebFormsMigrationDemo\Source\HiringTrackingSite
 succeeded in 533ms:
<%@ Master Language="C#" AutoEventWireup="true" CodeBehind="Site.master.cs" Inherits="HiringTrackingSite.SiteMaster" %>

<!DOCTYPE html>

<html lang="en">
<head runat="server">
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><%: Page.Title %> - Hiring Tracker</title>

    <asp:PlaceHolder runat="server">
        <%: Scripts.Render("~/bundles/modernizr") %>
    </asp:PlaceHolder>
    <webopt:bundlereference runat="server" path="~/Content/css" />
    <link href="~/favicon.ico" rel="shortcut icon" type="image/x-icon" />

</head>
<body>
    <form runat="server">
        <asp:ScriptManager runat="server">
            <Scripts>
                <%--To learn more about bundling scripts in ScriptManager see http://go.microsoft.com/fwlink/?LinkID=301884 --%>
                <%--Framework Scripts--%>
                <asp:ScriptReference Name="MsAjaxBundle" />
                <asp:ScriptReference Name="jquery" />
                <asp:ScriptReference Name="bootstrap" />
                <asp:ScriptReference Name="respond" />
                <asp:ScriptReference Name="WebForms.js" Assembly="System.Web" Path="~/Scripts/WebForms/WebForms.js" />
                <asp:ScriptReference Name="WebUIValidation.js" Assembly="System.Web" Path="~/Scripts/WebForms/WebUIValidation.js" />
                <asp:ScriptReference Name="MenuStandards.js" Assembly="System.Web" Path="~/Scripts/WebForms/MenuStandards.js" />
                <asp:ScriptReference Name="GridView.js" Assembly="System.Web" Path="~/Scripts/WebForms/GridView.js" />
                <asp:ScriptReference Name="DetailsView.js" Assembly="System.Web" Path="~/Scripts/WebForms/DetailsView.js" />
                <asp:ScriptReference Name="TreeView.js" Assembly="System.Web" Path="~/Scripts/WebForms/TreeView.js" />
                <asp:ScriptReference Name="WebParts.js" Assembly="System.Web" Path="~/Scripts/WebForms/WebParts.js" />
                <asp:ScriptReference Name="Focus.js" Assembly="System.Web" Path="~/Scripts/WebForms/Focus.js" />
                <asp:ScriptReference Name="WebFormsBundle" />
                <%--Site Scripts--%>
            </Scripts>
        </asp:ScriptManager>

        <div class="navbar navbar-inverse navbar-fixed-top">
            <div class="container">
                <div class="navbar-header">
                    <button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-collapse">
                        <span class="icon-bar"></span>
                        <span class="icon-bar"></span>
                        <span class="icon-bar"></span>
                    </button>
                    <a class="navbar-brand" runat="server" href="~/">Hiring Tracker</a>
                </div>
                <div class="navbar-collapse collapse">
                    <ul class="nav navbar-nav">
                        <li><a runat="server" href="~/">Home</a></li>
                        <li><a runat="server" href="ClientsList.aspx">Clients</a></li>
                        <li><a runat="server" href="PositionsList.aspx">Positions</a></li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="container body-content">
            <asp:ContentPlaceHolder ID="MainContent" runat="server">
            </asp:ContentPlaceHolder>
            <hr />
            <footer>
                <p>&copy; <%: DateTime.Now.Year %> - Hiring Tracker</p>
            </footer>
        </div>
    </form>
</body>
</html>


 succeeded in 639ms:
<%@ Page Title="Home Page" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="Default.aspx.cs" Inherits="HiringTrackingSite._Default" %>

<asp:Content ID="BodyContent" ContentPlaceHolderID="MainContent" runat="server">

    <div class="jumbotron">
        <h1>Hiring Tracking</h1>
        <p class="lead">Track positions and candidates.</p>
    </div>

    <div class="row">
<%--        <div class="col-md-4">
            <h2>Candidates</h2>
            <p>
                All existing candidates with their resumes. View and edit their information or associate with open positions.
            </p>
            <p>
                <a class="btn btn-default" href="Candidates.aspx">View</a>
            </p>
        </div>--%>
        <div class="col-md-4">
            <h2>Positions</h2>
            <p>
                View open positions or query previous hires.
            </p>
            <p>
                <a class="btn btn-default" href="PositionsList.aspx">View</a>
            </p>
        </div>
        <div class="col-md-4">
            <h2>Clients</h2>
            <p>
                Manage contacts requesting the positions.
            </p>
            <p>
                <a class="btn btn-default" href="ClientsList.aspx">View</a>
            </p>
        </div>
    </div>

</asp:Content>

<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="ClientsList.aspx.cs" Inherits="HiringTrackingSite.ClientsListForm" %>

<asp:Content ID="Content1" ContentPlaceHolderID="MainContent" runat="server">
    <br />
    <table>
        <tr>
            <th>Id</th>
            <th>Client Name</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Website</th>
            <th>Contact Name</th>
            <th></th>
        </tr>
        <tr>
            <th><asp:Textbox ID="IdFilter" runat="server"></asp:Textbox></th>
            <th><asp:Textbox ID="NameFilter" runat="server"></asp:Textbox></th>
            <th><asp:Textbox ID="PhoneFilter" runat="server"></asp:Textbox></th>
            <th><asp:Textbox ID="EmailFilter" runat="server"></asp:Textbox></th>
            <th><asp:Textbox ID="WebsiteFilter" runat="server"></asp:Textbox></th>
            <th><asp:Textbox ID="ContactNameFilter" runat="server"></asp:Textbox></th>
            <th><asp:Button runat="server" ID="btnFilter" OnClick="btnFilter_Click" Text="Filter" /></th>
        </tr>
        <asp:DataList ID="DataList1" runat="server" DataKeyField="Id" DataSourceID="ClientsDataSource" RepeatLayout="Flow">
            <ItemTemplate>
                <tr>
                    <td>
        <asp:Label ID="IdLabel" runat="server" Text='<%# Eval("Id") %>' />
                    </td> 
                    <td>
        <asp:Label ID="NameLabel" runat="server" Text='<%# Eval("Name") %>' />
                    </td>
                    <td>
        <asp:Label ID="PhoneLabel" runat="server" Text='<%# Eval("Phone") %>' />
                    </td>
                    <td>
        <asp:Label ID="EmailLabel" runat="server" Text='<%# Eval("Email") %>' />
                    </td>
                    <td>
        <asp:Label ID="WebsiteLabel" runat="server" Text='<%# Eval("Website") %>' />
                    </td>
                    <td>
        <asp:Label ID="ContactNameLabel" runat="server" Text='<%# Eval("ContactName") %>' />
                    </td>
                    <td><asp:LinkButton runat="server" CommandArgument='<%# Eval("Id") %>' OnClick="Details_Click" >Details</asp:LinkButton></td>
                </tr>
            </ItemTemplate>
        </asp:DataList>

    </table>
    <asp:LinkButton ID="AddNewButton" OnClick="AddNewButton_Click" runat="server">Add new client</asp:LinkButton>
    <asp:SqlDataSource ID="ClientsDataSource" runat="server" ConnectionString="<%$ ConnectionStrings:HiringConnectionString %>" SelectCommand="SELECT * FROM [Clients]"></asp:SqlDataSource>
</asp:Content>

<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="ClientDetails.aspx.cs" Inherits="HiringTrackingSite.ClientDetails" %>

<asp:Content ID="Content1" ContentPlaceHolderID="MainContent" runat="server">
    <span class="formLabel">Id:</span>
            <asp:Label ID="IdLabel1" runat="server" Text="" />
    <br />
    <span class="formLabel">Name:</span>
            <asp:TextBox ID="NameTextBox" runat="server" Text="" />
    <br />
    <span class="formLabel">Phone:</span>
            <asp:TextBox ID="PhoneTextBox" runat="server" Text="" />
    <br />
    <span class="formLabel">Email:</span>
            <asp:TextBox ID="EmailTextBox" runat="server" Text="" />
    <br />
    <span class="formLabel">Contact Name:</span>
            <asp:TextBox ID="ContactNameTextBox" runat="server" Text="" />
    <br />
    <span class="formLabel">Website:</span>
            <asp:TextBox ID="WebsiteTextBox" runat="server" Text="" />
    <br />
    <asp:LinkButton ID="UpdateButton" runat="server" CausesValidation="True" CommandName="Update" Text="Update" OnClick="UpdateButton_Click" />
    <asp:LinkButton ID="InsertButton" runat="server" CausesValidation="True" CommandName="Update" Text="Insert" OnClick="InsertButton_Click" />
    
</asp:Content>


 succeeded in 790ms:
<?xml version="1.0"?>
<!--
  For more information on how to configure your ASP.NET application, please visit
  http://go.microsoft.com/fwlink/?LinkId=169433
  -->
<configuration>
  <configSections>
    <!-- For more information on Entity Framework configuration, visit http://go.microsoft.com/fwlink/?LinkID=237468 -->
    <section name="entityFramework" type="System.Data.Entity.Internal.ConfigFile.EntityFrameworkSection, EntityFramework, Version=6.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089" requirePermission="false"/>
  </configSections>
  <connectionStrings>
    <add name="DefaultConnection" connectionString="Data Source=(LocalDb)\MSSQLLocalDB;AttachDbFilename=|DataDirectory|\aspnet-HiringTrackingSite-20210202124437.mdf;Initial Catalog=aspnet-HiringTrackingSite-20210202124437;Integrated Security=True" providerName="System.Data.SqlClient"/>
    <add name="HiringConnectionString" connectionString="Data Source=(LocalDB)\MSSQLLocalDB;AttachDbFilename=|DataDirectory|\HiringDb.mdf;Integrated Security=True;Connect Timeout=30" providerName="System.Data.SqlClient"/>
  </connectionStrings>
  <!--
    For a description of web.config changes see http://go.microsoft.com/fwlink/?LinkId=235367.

    The following attributes can be set on the <httpRuntime> tag.
      <system.Web>
        <httpRuntime targetFramework="4.8" />
      </system.Web>
  -->
  <system.web>
    <authentication mode="None"/>
    <compilation debug="true" targetFramework="4.8"/>
    <httpRuntime targetFramework="4.5.2"/>
    <pages>
      <namespaces>
        <add namespace="System.Web.Optimization"/>
        <add namespace="Microsoft.AspNet.Identity"/>
      </namespaces>
      <controls>
        <add assembly="Microsoft.AspNet.Web.Optimization.WebForms" namespace="Microsoft.AspNet.Web.Optimization.WebForms" tagPrefix="webopt"/>
      </controls>
    </pages>
    <membership>
      <providers>
        <!--
        ASP.NET Membership is disabled in this template. Please visit the following link http://go.microsoft.com/fwlink/?LinkId=301889 to learn about the ASP.NET Membership support in this template
        -->
        <clear/>
      </providers>
    </membership>
    <profile>
      <providers>
        <!--
        ASP.NET Membership Profile is disabled in this template. Please visit the following link http://go.microsoft.com/fwlink/?LinkId=301889 to learn about the ASP.NET Membership support in this template
        -->
        <clear/>
      </providers>
    </profile>
    <roleManager>
      <!--
          ASP.NET Membership Role is disabled in this template. Please visit the following link http://go.microsoft.com/fwlink/?LinkId=301889 to learn about the ASP.NET Membership support in this template
        -->
      <providers>
        <clear/>
      </providers>
    </roleManager>
    <!--
            If you are deploying to a cloud environment that has multiple web server instances,
            you should change session state mode from "InProc" to "Custom". In addition,
            change the connection string named "DefaultConnection" to connect to an instance
            of SQL Server (including SQL Azure and SQL  Compact) instead of to SQL Server Express.
      -->
    <sessionState mode="InProc" customProvider="DefaultSessionProvider">
      <providers>
        <add name="DefaultSessionProvider" type="System.Web.Providers.DefaultSessionStateProvider, System.Web.Providers, Version=2.0.0.0, Culture=neutral, PublicKeyToken=31bf3856ad364e35" connectionStringName="DefaultConnection"/>
      </providers>
    </sessionState>
    <httpModules>
      <add name="ApplicationInsightsWebTracking" type="Microsoft.ApplicationInsights.Web.ApplicationInsightsHttpModule, Microsoft.AI.Web"/>
    </httpModules>
  </system.web>
  <system.webServer>
    <modules>
      <remove name="FormsAuthentication"/>
      <remove name="ApplicationInsightsWebTracking"/>
      <add name="ApplicationInsightsWebTracking" type="Microsoft.ApplicationInsights.Web.ApplicationInsightsHttpModule, Microsoft.AI.Web" preCondition="managedHandler"/>
    </modules>
    <validation validateIntegratedModeConfiguration="false"/>
  </system.webServer>
  <runtime>
    <assemblyBinding xmlns="urn:schemas-microsoft-com:asm.v1">
      <dependentAssembly>
        <assemblyIdentity name="Newtonsoft.Json" culture="neutral" publicKeyToken="30ad4fe6b2a6aeed"/>
        <bindingRedirect oldVersion="0.0.0.0-6.0.0.0" newVersion="6.0.0.0"/>
      </dependentAssembly>
      <dependentAssembly>
        <assemblyIdentity name="WebGrease" culture="neutral" publicKeyToken="31bf3856ad364e35"/>
        <bindingRedirect oldVersion="0.0.0.0-1.5.2.14234" newVersion="1.5.2.14234"/>
      </dependentAssembly>
      <dependentAssembly>
        <assemblyIdentity name="EntityFramework" publicKeyToken="b77a5c561934e089"/>
        <bindingRedirect oldVersion="0.0.0.0-6.0.0.0" newVersion="6.0.0.0"/>
      </dependentAssembly>
      <dependentAssembly>
        <assemblyIdentity name="Microsoft.Owin" culture="neutral" publicKeyToken="31bf3856ad364e35"/>
        <bindingRedirect oldVersion="0.0.0.0-3.0.1.0" newVersion="3.0.1.0"/>
      </dependentAssembly>
      <dependentAssembly>
        <assemblyIdentity name="Microsoft.Owin.Security.OAuth" culture="neutral" publicKeyToken="31bf3856ad364e35"/>
        <bindingRedirect oldVersion="0.0.0.0-3.0.1.0" newVersion="3.0.1.0"/>
      </dependentAssembly>
      <dependentAssembly>
        <assemblyIdentity name="Microsoft.Owin.Security.Cookies" culture="neutral" publicKeyToken="31bf3856ad364e35"/>
        <bindingRedirect oldVersion="0.0.0.0-3.0.1.0" newVersion="3.0.1.0"/>
      </dependentAssembly>
      <dependentAssembly>
        <assemblyIdentity name="Microsoft.Owin.Security" culture="neutral" publicKeyToken="31bf3856ad364e35"/>
        <bindingRedirect oldVersion="0.0.0.0-3.0.1.0" newVersion="3.0.1.0"/>
      </dependentAssembly>
    </assemblyBinding>
  </runtime>
  <entityFramework>
    <defaultConnectionFactory type="System.Data.Entity.Infrastructure.LocalDbConnectionFactory, EntityFramework">
      <parameters>
        <parameter value="mssqllocaldb"/>
      </parameters>
    </defaultConnectionFactory>
    <providers>
      <provider invariantName="System.Data.SqlClient" type="System.Data.Entity.SqlServer.SqlProviderServices, EntityFramework.SqlServer"/>
    </providers>
  </entityFramework>
  <system.codedom>
    <compilers>
      <compiler language="c#;cs;csharp" extension=".cs" type="Microsoft.CodeDom.Providers.DotNetCompilerPlatform.CSharpCodeProvider, Microsoft.CodeDom.Providers.DotNetCompilerPlatform, Version=1.0.0.0, Culture=neutral, PublicKeyToken=31bf3856ad364e35" warningLevel="4" compilerOptions="/langversion:6 /nowarn:1659;1699;1701"/>
      <compiler language="vb;vbs;visualbasic;vbscript" extension=".vb" type="Microsoft.CodeDom.Providers.DotNetCompilerPlatform.VBCodeProvider, Microsoft.CodeDom.Providers.DotNetCompilerPlatform, Version=1.0.0.0, Culture=neutral, PublicKeyToken=31bf3856ad364e35" warningLevel="4" compilerOptions="/langversion:14 /nowarn:41008 /define:_MYTYPE=\&quot;Web\&quot; /optionInfer+"/>
    </compilers>
  </system.codedom>
</configuration>
/* Move down content because we have a fixed navbar that is 50px tall */
body {
    padding-top: 50px;
    padding-bottom: 20px;
}

/* Wrapping element */
/* Set some basic padding to keep content from hitting the edges */
.body-content {
    padding-left: 15px;
    padding-right: 15px;
}

/* Override the default bootstrap behavior where horizontal description lists 
   will truncate terms that are too long to fit in the left column 
*/
.dl-horizontal dt {
    white-space: normal;
}

/* Set widths on the form inputs since otherwise they're 100% wide */
input[type="text"],
input[type="password"],
input[type="email"],
input[type="tel"],
input[type="select"] {
    max-width: 280px;
}

/* Responsive: Portrait tablets and up */
@media screen and (min-width: 768px) {
    .jumbotron {
        margin-top: 20px;
    }
    .body-content {
        padding: 0;
    }
}


.formLabel{
    display:inline-block;
    width:200px;
}

 succeeded in 888ms:
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace HiringTrackingSite
{
    public partial class ClientsListForm : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            ClientsDataSource.SelectCommand = "Select * from Clients";
        }

        protected void Details_Click(object sender, EventArgs e)
        {
            Session["ClientId"] = ((LinkButton)sender).CommandArgument;

            Response.Redirect("ClientDetails.aspx", true);
        }

        protected void btnFilter_Click(object sender, EventArgs e)
        {
            List<string> filters = new List<string>();
            if (!string.IsNullOrWhiteSpace(IdFilter.Text))
            {
                filters.Add("Id=" + IdFilter.Text);
            }
            if (!string.IsNullOrWhiteSpace(NameFilter.Text))
            {
                filters.Add($"Name like '%{NameFilter.Text}%'");
            }
            if (!string.IsNullOrWhiteSpace(PhoneFilter.Text))
            {
                filters.Add($"Phone like '%{PhoneFilter.Text}%'");
            }
            if (!string.IsNullOrWhiteSpace(EmailFilter.Text))
            {
                filters.Add($"Email like '%{EmailFilter.Text}%'");
            }
            if (!string.IsNullOrWhiteSpace(ContactNameFilter.Text))
            {
                filters.Add($"ContactName like '%{ContactNameFilter.Text}%'");
            }
            if (!string.IsNullOrWhiteSpace(WebsiteFilter.Text))
            {
                filters.Add($"Website like '%{WebsiteFilter.Text}%'");
            }

            string filter = string.Join(" AND ", filters.ToArray());

            if (!string.IsNullOrWhiteSpace(filter))
            {
                filter = " WHERE " + filter;
            }

            ClientsDataSource.SelectCommand += filter;
            DataList1.DataBind();

        }

        protected void AddNewButton_Click(object sender, EventArgs e)
        {
            Session["ClientId"] = null;
            Response.Redirect("ClientDetails", true);
        }
    }
}
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace HiringTrackingSite
{
    public partial class ClientDetails : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!IsPostBack)
            {
                if (Session["ClientId"] != null)
                {
                    LoadClientInformation(Convert.ToInt32(Session["ClientId"]));
                }
                else
                {
                    UpdateButton.Visible = false;
                    InsertButton.Visible = true;
                }
            }
        }

        private void LoadClientInformation(int v)
        {
            string connectionString = ConfigurationManager.ConnectionStrings["HiringConnectionString"].ToString();

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                SqlCommand cmd = new SqlCommand("SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients Where Id = @Id", conn);
                cmd.Parameters.Add("@Id", SqlDbType.Int);
                cmd.Parameters["@Id"].Value = v;
                var reader = cmd.ExecuteReader();
                if (reader.Read())
                {
                    IdLabel1.Text = reader.GetInt32(0).ToString();
                    NameTextBox.Text = reader.GetString(1);
                    PhoneTextBox.Text = reader.GetString(2);
                    EmailTextBox.Text = reader.GetString(3);
                    ContactNameTextBox.Text = reader.GetString(4);
                    WebsiteTextBox.Text = reader.GetString(5);
                    UpdateButton.Visible = true;
                    InsertButton.Visible = false;
                }
                else
                {
                    UpdateButton.Visible = false;
                    InsertButton.Visible = true;
                }
            }

        }

        protected void UpdateButton_Click(object sender, EventArgs e)
        {
            string connectionString = ConfigurationManager.ConnectionStrings["HiringConnectionString"].ToString();

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                SqlCommand cmd = new SqlCommand("Update Clients set Name=@Name, Phone=@Phone, Email=@Email, ContactName=@ContactName, Website=@Website where id = @id", conn);
                cmd.Parameters.Add("@Name", SqlDbType.VarChar);
                cmd.Parameters["@Name"].Value = NameTextBox.Text;
                cmd.Parameters.Add("@Phone", SqlDbType.VarChar);
                cmd.Parameters["@Phone"].Value = PhoneTextBox.Text;
                cmd.Parameters.Add("@Email", SqlDbType.VarChar);
                cmd.Parameters["@Email"].Value = EmailTextBox.Text;
                cmd.Parameters.Add("@ContactName", SqlDbType.VarChar);
                cmd.Parameters["@ContactName"].Value = ContactNameTextBox.Text;
                cmd.Parameters.Add("@Website", SqlDbType.VarChar);
                cmd.Parameters["@Website"].Value = WebsiteTextBox.Text;
                cmd.Parameters.Add("@id", SqlDbType.VarChar);
                cmd.Parameters["@id"].Value = IdLabel1.Text;
                var affectedRows = cmd.ExecuteNonQuery();

                if (affectedRows == 1)
                {
                    ClientScript.RegisterStartupScript(this.GetType(), "Message", $"<script>alert('Client updated succesfully');</script>");
                }
            }
        }

        protected void InsertButton_Click(object sender, EventArgs e)
        {
            string connectionString = ConfigurationManager.ConnectionStrings["HiringConnectionString"].ToString();

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                SqlCommand cmd = new SqlCommand("Insert into Clients (Name, Phone, Email, ContactName, Website)  OUTPUT INSERTED.ID " +
                    "  values (@Name, @Phone, @Email, @ContactName, @Website)", conn);
                cmd.Parameters.Add("@Name", SqlDbType.VarChar);
                cmd.Parameters["@Name"].Value = NameTextBox.Text;
                cmd.Parameters.Add("@Phone", SqlDbType.VarChar);
                cmd.Parameters["@Phone"].Value = PhoneTextBox.Text;
                cmd.Parameters.Add("@Email", SqlDbType.VarChar);
                cmd.Parameters["@Email"].Value = EmailTextBox.Text;
                cmd.Parameters.Add("@ContactName", SqlDbType.VarChar);
                cmd.Parameters["@ContactName"].Value = ContactNameTextBox.Text;
                cmd.Parameters.Add("@Website", SqlDbType.VarChar);
                cmd.Parameters["@Website"].Value = WebsiteTextBox.Text;
                var id = cmd.ExecuteScalar();
                IdLabel1.Text = id.ToString();

                ClientScript.RegisterStartupScript(this.GetType(), "Message", $"<script>alert('Client added succesfully');</script>");
            }
        }
    }
}
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace HiringTrackingSite
{
    public partial class PositionsList : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            PositionsDataSource.SelectCommand = "SELECT Positions.*, Clients.Name as ClientName FROM Positions left join Clients on positions.idclient = clients.id";
        }

        protected void Details_Click(object sender, EventArgs e)
        {
            Session["PositionId"] = ((LinkButton)sender).CommandArgument;

            Response.Redirect("PositionDetails.aspx", true);
        }

        protected void btnFilter_Click(object sender, EventArgs e)
        {
            List<string> filters = new List<string>();
            if (!string.IsNullOrWhiteSpace(IdFilter.Text))
            {
                filters.Add("Id=" + IdFilter.Text);
            }
           
            string filter = string.Join(" AND ", filters.ToArray());

            if (!string.IsNullOrWhiteSpace(filter))
            {
                filter = " WHERE " + filter;
            }

            PositionsDataSource.SelectCommand += filter;
            DataList1.DataBind();

        }

        protected void AddNewButton_Click(object sender, EventArgs e)
        {
            Session["PositionId"] = null;
            Response.Redirect("PositionDetails", true);
        }
    }
}
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;

namespace HiringTrackingSite
{
    public partial class PositionDetailsForm : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            LoadClientsList();
            if (!IsPostBack)
            {
                if (Session["PositionId"] != null)
                {
                    LoadPositionsInformation(Convert.ToInt32(Session["PositionId"]));
                }
                else
                {
                    UpdateButton.Visible = false;
                    InsertButton.Visible = true;
                }
            }
        }

        private void LoadClientsList()
        {
            string connectionString = ConfigurationManager.ConnectionStrings["HiringConnectionString"].ToString();

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                SqlCommand cmd = new SqlCommand("SELECT Id, Name FROM Clients", conn);
                SqlDataAdapter da = new SqlDataAdapter(cmd);
                DataTable dt = new DataTable();
                da.Fill(dt);
                ClientCombo.DataTextField = "Name";
                ClientCombo.DataValueField = "Id";
                ClientCombo.DataSource = dt;
                ClientCombo.DataBind();

            }
        }

        private void LoadPositionsInformation(int v)
        {
            string connectionString = ConfigurationManager.ConnectionStrings["HiringConnectionString"].ToString();

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                SqlCommand cmd = new SqlCommand("SELECT Id, Name, Description, StartDate, Deadline, Hired, IdClient, ClientContactName, ClientContactPhone,ClientContactEmail from Positions Where Id = @Id", conn);
                cmd.Parameters.Add("@Id", SqlDbType.Int);
                cmd.Parameters["@Id"].Value = v;
                var reader = cmd.ExecuteReader();
                if (reader.Read())
                {
                    IdLabel1.Text = reader.GetInt32(0).ToString();
                    NameTextBox.Text = reader.GetString(1);
                    DescriptionTextBox.Text = reader.GetString(2);
                    StartDateTextBox.Text = reader.GetDateTime(3).ToString("yyyy-MM-dd");
                    DeadlineTextBox.Text = reader.GetDateTime(4).ToString("yyyy-MM-dd");
                    HiredCheckbox.Checked = reader.GetBoolean(5);
                    ClientCombo.SelectedValue = reader.GetInt32(6).ToString();
                    ClientContactNameTextBox.Text = reader.GetString(7);
                    ClientContactPhoneTextBox.Text = reader.GetString(8);
                    ClientContactEmailTextBox.Text = reader.GetString(9);
                    UpdateButton.Visible = true;
                    InsertButton.Visible = false;
                }
                else
                {
                    UpdateButton.Visible = false;
                    InsertButton.Visible = true;
                }
            }

        }
        protected void UpdateButton_Click(object sender, EventArgs e)
        {
            string connectionString = ConfigurationManager.ConnectionStrings["HiringConnectionString"].ToString();

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                SqlCommand cmd = new SqlCommand("Update Positions set Name=@Name, Description=@Description, StartDate=@StartDate, Deadline=@Deadline, Hired=@Hired, ClientContactName=@ClientContactName, ClientContactPhone=@ClientContactPhone, ClientContactEmail=@ClientContactEmail where id = @id", conn);
                cmd.AddNewParameter("@Name", SqlDbType.VarChar, NameTextBox.Text);
                cmd.AddNewParameter("@Description", SqlDbType.VarChar, DescriptionTextBox.Text);
                cmd.AddNewParameter("@StartDate", SqlDbType.Date, StartDateTextBox.Text);
                cmd.AddNewParameter("@Deadline", SqlDbType.Date, DeadlineTextBox.Text);
                cmd.AddNewParameter("@Hired", SqlDbType.Bit, HiredCheckbox.Checked);
                cmd.AddNewParameter("@ClientContactName", SqlDbType.VarChar, ClientContactNameTextBox.Text);
                cmd.AddNewParameter("@ClientContactPhone", SqlDbType.VarChar, ClientContactPhoneTextBox.Text);
                cmd.AddNewParameter("@ClientContactEmail", SqlDbType.VarChar, ClientContactEmailTextBox.Text);
                cmd.AddNewParameter("@id", SqlDbType.Int, IdLabel1.Text);
                var affectedRows = cmd.ExecuteNonQuery();

                if (affectedRows == 1)
                {
                    ClientScript.RegisterStartupScript(this.GetType(), "Message", $"<script>alert('Position updated succesfully');</script>");
                }
            }
        }

        protected void InsertButton_Click(object sender, EventArgs e)
        {
            string connectionString = ConfigurationManager.ConnectionStrings["HiringConnectionString"].ToString();

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                SqlCommand cmd = new SqlCommand("Insert into Positions(Name, Description, StartDate, Deadline, Hired, ClientContactName, ClientContactPhone, ClientContactEmail, IdClient) OUTPUT INSERTED.ID " +
                    "  values (@Name, @Description, @StartDate, @Deadline, @Hired, @ClientContactName, @ClientContactPhone, @ClientContactEmail, @IdClient)", conn);
                cmd.AddNewParameter("@Name", SqlDbType.VarChar, NameTextBox.Text);
                cmd.AddNewParameter("@Description", SqlDbType.VarChar, DescriptionTextBox.Text);
                cmd.AddNewParameter("@StartDate", SqlDbType.Date, StartDateTextBox.Text);
                cmd.AddNewParameter("@Deadline", SqlDbType.Date, DeadlineTextBox.Text);
                cmd.AddNewParameter("@Hired", SqlDbType.Bit, HiredCheckbox.Checked);
                cmd.AddNewParameter("@ClientContactName", SqlDbType.VarChar, ClientContactNameTextBox.Text);
                cmd.AddNewParameter("@ClientContactPhone", SqlDbType.VarChar, ClientContactPhoneTextBox.Text);
                cmd.AddNewParameter("@ClientContactEmail", SqlDbType.VarChar, ClientContactEmailTextBox.Text);
                cmd.AddNewParameter("@IdClient", SqlDbType.Int, ClientCombo.SelectedValue);
                var id = cmd.ExecuteScalar();
                IdLabel1.Text = id.ToString();

                ClientScript.RegisterStartupScript(this.GetType(), "Message", $"<script>alert('Position added succesfully');</script>");
            }
        }

    }
}

 succeeded in 954ms:
using IRM.SPA.Components;
using IRM.SPA.Config;
using IRM.SPA.DI;
using IRM.SPA.Middleware;
using IRM.SPA.Middlewares;

namespace IRM.SPA
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            ConfigurationOptions config = builder.Configuration.Get<ConfigurationOptions>() ?? new ConfigurationOptions();
            // Add services to the container.
            builder.Services.AddRazorComponents()
                .AddInteractiveServerComponents();           
            DependancyInjector.RegisterServices(builder.Services, config);
            builder.Services.AddSingleton(config);
            var app = builder.Build();
            
            // Configure the HTTP request pipeline.
            if (!app.Environment.IsDevelopment())
            {
                app.UseExceptionHandler("/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }
            app.UseMiddleware<SecurityHeadersMiddleware>();
            app.UseMiddleware<ExceptionMiddleware>();
            app.UseHttpsRedirection();

            app.UseStaticFiles();
            app.UseAntiforgery();

            app.MapRazorComponents<App>()
                .AddInteractiveServerRenderMode();
            
            app.Run();
        }
    }
}

@inherits LayoutComponentBase

<div class="page">
    <div class="sidebar">
        <NavMenu />
    </div>

    <main>
        <div class="top-row px-4">
            <a href="https://learn.microsoft.com/aspnet/core/" target="_blank">About</a>
        </div>

        <article class="content px-4">
            @Body
        </article>
    </main>
</div>

<div id="blazor-error-ui">
    An unhandled error has occurred.
    <a href="" class="reload">Reload</a>
    <a class="dismiss">🗙</a>
</div>

<div class="top-row ps-3 navbar navbar-dark">
    <div class="container-fluid">
        <a class="navbar-brand" href="">IRM.SPA</a>
    </div>
</div>

<input type="checkbox" title="Navigation menu" class="navbar-toggler" />

<div class="nav-scrollable" onclick="document.querySelector('.navbar-toggler').click()">
    <nav class="flex-column">
        <div class="nav-item px-3">
            <NavLink class="nav-link" href="" Match="NavLinkMatch.All">
                <span class="bi bi-house-door-fill-nav-menu" aria-hidden="true"></span> Home
            </NavLink>
        </div>

        <div class="nav-item px-3">
            <NavLink class="nav-link" href="counter">
                <span class="bi bi-plus-square-fill-nav-menu" aria-hidden="true"></span> Counter
            </NavLink>
        </div>

        <div class="nav-item px-3">
            <NavLink class="nav-link" href="weather">
                <span class="bi bi-list-nested-nav-menu" aria-hidden="true"></span> Weather
            </NavLink>
        </div>
    </nav>
</div>


<Router AppAssembly="typeof(Program).Assembly">
    <Found Context="routeData">
        <RouteView RouteData="routeData" DefaultLayout="typeof(Layout.MainLayout)" />
        <FocusOnNavigate RouteData="routeData" Selector="h1" />
    </Found>
</Router>

@page "/"

<PageTitle>Home</PageTitle>

<h1>Hello, world!</h1>

Welcome to your new app.

{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "Integrations": {
    "SystemAPI": {
      "ApiClient": "",
      "ApiSecret": "",
      "URL": "http://localhost:5241"
    },
    "ProductApi": {
      "ApiClient": "",
      "ApiSecret": "",
      "URL": "http://localhost:5242"
    }
  },
  "ConnectionStrings": {
    "HiringConnection": "Data Source=(LocalDB)\\MSSQLLocalDB;AttachDbFilename=|DataDirectory|\\HiringDb.mdf;Integrated Security=True;Connect Timeout=30"
  }
}
<?xml version="1.0" encoding="utf-8"?>
<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Blazored.FluentValidation" Version="2.2.0" />
    <PackageReference Include="NLog" Version="5.3.2" />
    <PackageReference Include="NLog.Extensions.Logging" Version="5.3.11" />
    <PackageReference Include="NLog.Web.AspNetCore" Version="5.3.11" />
    <PackageReference Include="Refit.HttpClientFactory" Version="7.1.2" />
  <PackageReference Include="Microsoft.Data.SqlClient" Version="5.2.2" /></ItemGroup>

</Project>


 succeeded in 990ms:
<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="PositionsList.aspx.cs" Inherits="HiringTrackingSite.PositionsList" %>
<asp:Content ID="Content1" ContentPlaceHolderID="MainContent" runat="server">
    <br />
    <table>
        <tr>
            <th>Id</th>
            <th>Name</th>
            <th>Description</th>
            <th>Start Date</th>
            <th>Deadline</th>
            <th>Position Closed</th>
            <th>Client Contact</th>
            <th></th>
        </tr>
        <tr>
            <th><asp:Textbox ID="IdFilter" runat="server"></asp:Textbox></th>
            <th><asp:Textbox ID="NameFilter" runat="server"></asp:Textbox></th>
            <th><asp:Textbox ID="DescriptionFilter" runat="server"></asp:Textbox></th>
            <th><asp:Textbox ID="StartDateFilter" runat="server"></asp:Textbox></th>
            <th><asp:Textbox ID="DeadlineFilter" runat="server"></asp:Textbox></th>
            <th></th>
            <th><asp:Textbox ID="ClientContactFilter" runat="server"></asp:Textbox></th>
            <th><asp:Button runat="server" ID="btnFilter" OnClick="btnFilter_Click" Text="Filter" /></th>
        </tr>
        <asp:DataList ID="DataList1" runat="server" DataKeyField="Id" DataSourceID="PositionsDataSource" RepeatLayout="Flow">
            <ItemTemplate>
                <tr>
                    <td>
        <asp:Label ID="IdLabel" runat="server" Text='<%# Eval("Id") %>' />
                    </td>
                    <td>
        <asp:Label ID="NameLabel" runat="server" Text='<%# Eval("Name") %>' />
                    </td>
                    <td>
        <asp:Label ID="PhoneLabel" runat="server" Text='<%# Eval("Description") %>' />
                    </td>
                    <td>
        <asp:Label ID="EmailLabel" runat="server" Text='<%# Eval("StartDate") %>' />
                    </td>
                    <td>
        <asp:Label ID="WebsiteLabel" runat="server" Text='<%# Eval("Deadline") %>' />
                    </td>
                    <td>
        <asp:Label ID="ContactNameLabel" runat="server" Text='<%# Eval("Hired") %>' />
                    </td>
                    <td>
        <asp:Label ID="Label1" runat="server" Text='<%# Eval("ClientName") + " (" + Eval("ClientContactName") + ")" %>' />
                    </td>
                    <td><asp:LinkButton runat="server" CommandArgument='<%# Eval("Id") %>' OnClick="Details_Click" >Details</asp:LinkButton></td>
                </tr>
            </ItemTemplate>
        </asp:DataList>

    </table>
    <asp:LinkButton ID="AddNewButton" OnClick="AddNewButton_Click" runat="server">Add new position</asp:LinkButton>
    <asp:SqlDataSource ID="PositionsDataSource" runat="server" ConnectionString="<%$ ConnectionStrings:HiringConnectionString %>" ></asp:SqlDataSource>
</asp:Content>

<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="PositionDetails.aspx.cs" Inherits="HiringTrackingSite.PositionDetailsForm" %>

<asp:Content ID="Content1" ContentPlaceHolderID="MainContent" runat="server">
    <span class="formLabel">Id:</span>
            <asp:Label ID="IdLabel1" runat="server" Text="" />
    <br />
    <span class="formLabel">Name:</span>
            <asp:TextBox ID="NameTextBox" runat="server" Text="" />
    <br />
    <span class="formLabel">Description:</span>
            <asp:TextBox TextMode="MultiLine" ID="DescriptionTextBox" runat="server" Rows="6" Width="500" Text="" />
    <br />
    <span class="formLabel">Start Date:</span>
            <asp:TextBox ID="StartDateTextBox" TextMode="Date" runat="server" Text="" />
    <br />
    <span class="formLabel">Deadline:</span>
            <asp:TextBox ID="DeadlineTextBox" TextMode="Date" runat="server" Text="" />
    <br />
    <span class="formLabel">Hired?:</span>
            <asp:CheckBox ID="HiredCheckbox" runat="server" Checked="false" />
    <br /> 
    <span class="formLabel">Client:</span>
            <asp:DropDownList ID="ClientCombo" runat="server" />
    <br />
    <span class="formLabel">Client Contact Name:</span>
            <asp:TextBox ID="ClientContactNameTextBox" runat="server" Text="" />
    <br />
    <span class="formLabel">Phone:</span>
            <asp:TextBox ID="ClientContactPhoneTextBox" runat="server" Text="" />
    <br />
    <span class="formLabel">Email:</span>
            <asp:TextBox ID="ClientContactEmailTextBox" runat="server" Text="" />
    <br />
    <asp:LinkButton ID="UpdateButton" runat="server" CausesValidation="True" CommandName="Update" Text="Update" OnClick="UpdateButton_Click" />
    <asp:LinkButton ID="InsertButton" runat="server" CausesValidation="True" CommandName="Update" Text="Insert" OnClick="InsertButton_Click" />
    
</asp:Content>


codex
I’ve got the core legacy behavior: Bootstrap 3 fixed top nav, a jumbotron home page, list tables with filter rows, detail forms, alert-style success messages, and session IDs replaced by routes. Next I’m adding a small SQL repository and Blazor pages, then trimming the scaffold navigation.
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -Raw Components\\App.razor" in D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -Raw wwwroot\\app.css; Get-Content -Raw Components\\Layout\\MainLayout.razor.css; Get-Content -Raw Components\\Layout\\NavMenu.razor.css" in D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -Raw Components\\_Imports.razor" in D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -Raw DI\\DependancyInjector.cs" in D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA
 succeeded in 754ms:
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <base href="/" />
    <link rel="stylesheet" href="bootstrap/bootstrap.min.css" />
    <link rel="stylesheet" href="app.css" />
    <link rel="stylesheet" href="IRM.SPA.styles.css" />
    <link rel="icon" type="image/png" href="favicon.png" />
    <HeadOutlet />
</head>

<body>
    <Routes />
    <script src="_framework/blazor.web.js"></script>
</body>

</html>


 succeeded in 822ms:
html, body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

a, .btn-link {
    color: #006bb7;
}

.btn-primary {
    color: #fff;
    background-color: #1b6ec2;
    border-color: #1861ac;
}

.btn:focus, .btn:active:focus, .btn-link.nav-link:focus, .form-control:focus, .form-check-input:focus {
  box-shadow: 0 0 0 0.1rem white, 0 0 0 0.25rem #258cfb;
}

.content {
    padding-top: 1.1rem;
}

h1:focus {
    outline: none;
}

.valid.modified:not([type=checkbox]) {
    outline: 1px solid #26b050;
}

.invalid {
    outline: 1px solid #e50000;
}

.validation-message {
    color: #e50000;
}

.blazor-error-boundary {
    background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNDkiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIG92ZXJmbG93PSJoaWRkZW4iPjxkZWZzPjxjbGlwUGF0aCBpZD0iY2xpcDAiPjxyZWN0IHg9IjIzNSIgeT0iNTEiIHdpZHRoPSI1NiIgaGVpZ2h0PSI0OSIvPjwvY2xpcFBhdGg+PC9kZWZzPjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMCkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yMzUgLTUxKSI+PHBhdGggZD0iTTI2My41MDYgNTFDMjY0LjcxNyA1MSAyNjUuODEzIDUxLjQ4MzcgMjY2LjYwNiA1Mi4yNjU4TDI2Ny4wNTIgNTIuNzk4NyAyNjcuNTM5IDUzLjYyODMgMjkwLjE4NSA5Mi4xODMxIDI5MC41NDUgOTIuNzk1IDI5MC42NTYgOTIuOTk2QzI5MC44NzcgOTMuNTEzIDI5MSA5NC4wODE1IDI5MSA5NC42NzgyIDI5MSA5Ny4wNjUxIDI4OS4wMzggOTkgMjg2LjYxNyA5OUwyNDAuMzgzIDk5QzIzNy45NjMgOTkgMjM2IDk3LjA2NTEgMjM2IDk0LjY3ODIgMjM2IDk0LjM3OTkgMjM2LjAzMSA5NC4wODg2IDIzNi4wODkgOTMuODA3MkwyMzYuMzM4IDkzLjAxNjIgMjM2Ljg1OCA5Mi4xMzE0IDI1OS40NzMgNTMuNjI5NCAyNTkuOTYxIDUyLjc5ODUgMjYwLjQwNyA1Mi4yNjU4QzI2MS4yIDUxLjQ4MzcgMjYyLjI5NiA1MSAyNjMuNTA2IDUxWk0yNjMuNTg2IDY2LjAxODNDMjYwLjczNyA2Ni4wMTgzIDI1OS4zMTMgNjcuMTI0NSAyNTkuMzEzIDY5LjMzNyAyNTkuMzEzIDY5LjYxMDIgMjU5LjMzMiA2OS44NjA4IDI1OS4zNzEgNzAuMDg4N0wyNjEuNzk1IDg0LjAxNjEgMjY1LjM4IDg0LjAxNjEgMjY3LjgyMSA2OS43NDc1QzI2Ny44NiA2OS43MzA5IDI2Ny44NzkgNjkuNTg3NyAyNjcuODc5IDY5LjMxNzkgMjY3Ljg3OSA2Ny4xMTgyIDI2Ni40NDggNjYuMDE4MyAyNjMuNTg2IDY2LjAxODNaTTI2My41NzYgODYuMDU0N0MyNjEuMDQ5IDg2LjA1NDcgMjU5Ljc4NiA4Ny4zMDA1IDI1OS43ODYgODkuNzkyMSAyNTkuNzg2IDkyLjI4MzcgMjYxLjA0OSA5My41Mjk1IDI2My41NzYgOTMuNTI5NSAyNjYuMTE2IDkzLjUyOTUgMjY3LjM4NyA5Mi4yODM3IDI2Ny4zODcgODkuNzkyMSAyNjcuMzg3IDg3LjMwMDUgMjY2LjExNiA4Ni4wNTQ3IDI2My41NzYgODYuMDU0N1oiIGZpbGw9IiNGRkU1MDAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48L3N2Zz4=) no-repeat 1rem/1.8rem, #b32121;
    padding: 1rem 1rem 1rem 3.7rem;
    color: white;
}

    .blazor-error-boundary::after {
        content: "An error has occurred."
    }

.darker-border-checkbox.form-check-input {
    border-color: #929292;
}

.page {
    position: relative;
    display: flex;
    flex-direction: column;
}

main {
    flex: 1;
}

.sidebar {
    background-image: linear-gradient(180deg, rgb(5, 39, 103) 0%, #3a0647 70%);
}

.top-row {
    background-color: #f7f7f7;
    border-bottom: 1px solid #d6d5d5;
    justify-content: flex-end;
    height: 3.5rem;
    display: flex;
    align-items: center;
}

    .top-row ::deep a, .top-row ::deep .btn-link {
        white-space: nowrap;
        margin-left: 1.5rem;
        text-decoration: none;
    }

    .top-row ::deep a:hover, .top-row ::deep .btn-link:hover {
        text-decoration: underline;
    }

    .top-row ::deep a:first-child {
        overflow: hidden;
        text-overflow: ellipsis;
    }

@media (max-width: 640.98px) {
    .top-row {
        justify-content: space-between;
    }

    .top-row ::deep a, .top-row ::deep .btn-link {
        margin-left: 0;
    }
}

@media (min-width: 641px) {
    .page {
        flex-direction: row;
    }

    .sidebar {
        width: 250px;
        height: 100vh;
        position: sticky;
        top: 0;
    }

    .top-row {
        position: sticky;
        top: 0;
        z-index: 1;
    }

    .top-row.auth ::deep a:first-child {
        flex: 1;
        text-align: right;
        width: 0;
    }

    .top-row, article {
        padding-left: 2rem !important;
        padding-right: 1.5rem !important;
    }
}

#blazor-error-ui {
    background: lightyellow;
    bottom: 0;
    box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.2);
    display: none;
    left: 0;
    padding: 0.6rem 1.25rem 0.7rem 1.25rem;
    position: fixed;
    width: 100%;
    z-index: 1000;
}

    #blazor-error-ui .dismiss {
        cursor: pointer;
        position: absolute;
        right: 0.75rem;
        top: 0.5rem;
    }

.navbar-toggler {
    appearance: none;
    cursor: pointer;
    width: 3.5rem;
    height: 2.5rem;
    color: white;
    position: absolute;
    top: 0.5rem;
    right: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%28255, 255, 255, 0.55%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e") no-repeat center/1.75rem rgba(255, 255, 255, 0.1);
}

.navbar-toggler:checked {
    background-color: rgba(255, 255, 255, 0.5);
}

.top-row {
    height: 3.5rem;
    background-color: rgba(0,0,0,0.4);
}

.navbar-brand {
    font-size: 1.1rem;
}

.bi {
    display: inline-block;
    position: relative;
    width: 1.25rem;
    height: 1.25rem;
    margin-right: 0.75rem;
    top: -1px;
    background-size: cover;
}

.bi-house-door-fill-nav-menu {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='white' class='bi bi-house-door-fill' viewBox='0 0 16 16'%3E%3Cpath d='M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5Z'/%3E%3C/svg%3E");
}

.bi-plus-square-fill-nav-menu {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='white' class='bi bi-plus-square-fill' viewBox='0 0 16 16'%3E%3Cpath d='M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm6.5 4.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3a.5.5 0 0 1 1 0z'/%3E%3C/svg%3E");
}

.bi-list-nested-nav-menu {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='white' class='bi bi-list-nested' viewBox='0 0 16 16'%3E%3Cpath fill-rule='evenodd' d='M4.5 11.5A.5.5 0 0 1 5 11h10a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm-2-4A.5.5 0 0 1 3 7h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm-2-4A.5.5 0 0 1 1 3h10a.5.5 0 0 1 0 1H1a.5.5 0 0 1-.5-.5z'/%3E%3C/svg%3E");
}

.nav-item {
    font-size: 0.9rem;
    padding-bottom: 0.5rem;
}

    .nav-item:first-of-type {
        padding-top: 1rem;
    }

    .nav-item:last-of-type {
        padding-bottom: 1rem;
    }

    .nav-item ::deep .nav-link {
        color: #d7d7d7;
        background: none;
        border: none;
        border-radius: 4px;
        height: 3rem;
        display: flex;
        align-items: center;
        line-height: 3rem;
        width: 100%;
    }

.nav-item ::deep a.active {
    background-color: rgba(255,255,255,0.37);
    color: white;
}

.nav-item ::deep .nav-link:hover {
    background-color: rgba(255,255,255,0.1);
    color: white;
}

.nav-scrollable {
    display: none;
}

.navbar-toggler:checked ~ .nav-scrollable {
    display: block;
}

@media (min-width: 641px) {
    .navbar-toggler {
        display: none;
    }

    .nav-scrollable {
        /* Never collapse the sidebar for wide screens */
        display: block;

        /* Allow sidebar to scroll for tall menus */
        height: calc(100vh - 3.5rem);
        overflow-y: auto;
    }
}


 succeeded in 861ms:
@using System.Net.Http
@using System.Net.Http.Json
@using Microsoft.AspNetCore.Components.Forms
@using Microsoft.AspNetCore.Components.Routing
@using Microsoft.AspNetCore.Components.Web
@using static Microsoft.AspNetCore.Components.Web.RenderMode
@using Microsoft.AspNetCore.Components.Web.Virtualization
@using Microsoft.JSInterop
@using IRM.SPA
@using IRM.SPA.Components


 succeeded in 919ms:

using FluentValidation;

using IRM.SPA.CommonHelper;
using IRM.SPA.Components.Models.Controls;
using IRM.SPA.Config;
using IRM.SPA.Services;
using IRM.SPA.Validators;

using Refit;

namespace IRM.SPA.DI
{
    public static class DependancyInjector
    {
        public static void RegisterServices(IServiceCollection services, ConfigurationOptions config)
        {
           

            RegisterApiClients(services, config);           
            RegisterModelValidators(services);
        }
       
        private static void RegisterModelValidators(IServiceCollection services)
        {
            services.AddScoped<IValidator<Control>, ControlValidator>();
        }
        private static void RegisterApiClients(IServiceCollection services, ConfigurationOptions config)
        {
            RegisterRefit<IProductApi>(config.Integrations.ProductApi, services);
        }
        private static void RegisterRefit<T>(BaseApiSettings? apiSettings, IServiceCollection services) where T : class
        {
            if (apiSettings != null && !string.IsNullOrEmpty(apiSettings.URL))
            {
                services.AddRefitClient<T>().ConfigureHttpClient(c =>
                {
                    c.BaseAddress = new Uri(apiSettings.URL);
                    c.DefaultRequestHeaders.Add(AppConstants.ApiHeaders.ApiKey, apiSettings.ApiSecret);
                    c.DefaultRequestHeaders.Add(AppConstants.ApiHeaders.ApiClient, apiSettings.ApiClient);
                });
            }
        }
    }
}


codex
I’m going to preserve old URLs as aliases where practical, while using clean routes for record IDs (`/clients/5`, `/positions/5`). The list filters will be parameterized SQL; for positions I’m wiring all visible filters rather than keeping the legacy “only Id works” inconsistency.
codex
The first edits add the domain model and repository layer. This keeps database access out of the components and makes the filters explicit SQL parameters instead of concatenated clauses.
apply patch
patch: completed
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Models\Client.cs
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Models\ClientFilter.cs
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Models\Position.cs
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Models\PositionFilter.cs
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Services\HiringRepository.cs
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Services\IHiringRepository.cs
diff --git a/LegacyOutput/src/IRM.SPA/Models/Client.cs b/LegacyOutput/src/IRM.SPA/Models/Client.cs
new file mode 100644
index 0000000000000000000000000000000000000000..46bfecbc332bde56ebed47d21516d9a9c7773d42
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Client.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class Client
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Phone { get; set; } = string.Empty;
+    public string Email { get; set; } = string.Empty;
+    public string ContactName { get; set; } = string.Empty;
+    public string Website { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..d59d0bb30c1802c64fa28e40d6a449e156739081
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class ClientFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Phone { get; set; }
+    public string? Email { get; set; }
+    public string? Website { get; set; }
+    public string? ContactName { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/Position.cs b/LegacyOutput/src/IRM.SPA/Models/Position.cs
new file mode 100644
index 0000000000000000000000000000000000000000..a6f9543eebd29c5626ed28741e6b4065ad3d16cf
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Position.cs
@@ -0,0 +1,16 @@
+namespace IRM.SPA.Models;
+
+public sealed class Position
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Description { get; set; } = string.Empty;
+    public DateTime? StartDate { get; set; }
+    public DateTime? Deadline { get; set; }
+    public bool Hired { get; set; }
+    public int? IdClient { get; set; }
+    public string ClientName { get; set; } = string.Empty;
+    public string ClientContactName { get; set; } = string.Empty;
+    public string ClientContactPhone { get; set; } = string.Empty;
+    public string ClientContactEmail { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..cfa76e79d96580b7b4d98e9b476807ef6f12acb5
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class PositionFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Description { get; set; }
+    public string? StartDate { get; set; }
+    public string? Deadline { get; set; }
+    public string? ClientContact { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..1c88253e59d707a339e900e3d8c1a8b2d56950d2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
@@ -0,0 +1,268 @@
+using System.Data;
+using IRM.SPA.Models;
+using Microsoft.Data.SqlClient;
+
+namespace IRM.SPA.Services;
+
+public sealed class HiringRepository(IConfiguration configuration) : IHiringRepository
+{
+    private readonly string _connectionString = configuration.GetConnectionString("HiringConnection")
+        ?? throw new InvalidOperationException("ConnectionStrings:HiringConnection is not configured.");
+
+    public async Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Name", filter.Name);
+        AddLike(where, parameters, "Phone", filter.Phone);
+        AddLike(where, parameters, "Email", filter.Email);
+        AddLike(where, parameters, "Website", filter.Website);
+        AddLike(where, parameters, "ContactName", filter.ContactName);
+
+        var sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients";
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var clients = new List<Client>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            clients.Add(ReadClient(reader));
+        }
+
+        return clients;
+    }
+
+    public async Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients WHERE Id = @Id";
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadClient(reader) : null;
+    }
+
+    public async Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Clients (Name, Phone, Email, ContactName, Website)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Phone, @Email, @ContactName, @Website)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Clients
+            SET Name = @Name, Phone = @Phone, Email = @Email, ContactName = @ContactName, Website = @Website
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = client.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    public async Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Positions.Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Positions.Name", filter.Name, "@Name");
+        AddLike(where, parameters, "Positions.Description", filter.Description, "@Description");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.StartDate, 120)", filter.StartDate, "@StartDate");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.Deadline, 120)", filter.Deadline, "@Deadline");
+        AddLike(where, parameters, "Positions.ClientContactName", filter.ClientContact, "@ClientContact");
+
+        var sql = """
+            SELECT Positions.Id, Positions.Name, Positions.Description, Positions.StartDate, Positions.Deadline,
+                   Positions.Hired, Positions.IdClient, Positions.ClientContactName, Positions.ClientContactPhone,
+                   Positions.ClientContactEmail, Clients.Name AS ClientName
+            FROM Positions
+            LEFT JOIN Clients ON Positions.IdClient = Clients.Id
+            """;
+
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Positions.Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var positions = new List<Position>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            positions.Add(ReadPosition(reader, includeClientName: true));
+        }
+
+        return positions;
+    }
+
+    public async Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            SELECT Id, Name, Description, StartDate, Deadline, Hired, IdClient,
+                   ClientContactName, ClientContactPhone, ClientContactEmail
+            FROM Positions
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadPosition(reader, includeClientName: false) : null;
+    }
+
+    public async Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Positions (Name, Description, StartDate, Deadline, Hired, ClientContactName,
+                                   ClientContactPhone, ClientContactEmail, IdClient)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Description, @StartDate, @Deadline, @Hired, @ClientContactName,
+                    @ClientContactPhone, @ClientContactEmail, @IdClient)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Positions
+            SET Name = @Name, Description = @Description, StartDate = @StartDate, Deadline = @Deadline,
+                Hired = @Hired, ClientContactName = @ClientContactName, ClientContactPhone = @ClientContactPhone,
+                ClientContactEmail = @ClientContactEmail, IdClient = @IdClient
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = position.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    private SqlConnection CreateConnection() => new(_connectionString);
+
+    private static void AddClientParameters(SqlCommand command, Client client)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = client.Name;
+        command.Parameters.Add("@Phone", SqlDbType.VarChar).Value = client.Phone;
+        command.Parameters.Add("@Email", SqlDbType.VarChar).Value = client.Email;
+        command.Parameters.Add("@ContactName", SqlDbType.VarChar).Value = client.ContactName;
+        command.Parameters.Add("@Website", SqlDbType.VarChar).Value = client.Website;
+    }
+
+    private static void AddPositionParameters(SqlCommand command, Position position, bool includeClient)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = position.Name;
+        command.Parameters.Add("@Description", SqlDbType.VarChar).Value = position.Description;
+        command.Parameters.Add("@StartDate", SqlDbType.Date).Value = (object?)position.StartDate ?? DBNull.Value;
+        command.Parameters.Add("@Deadline", SqlDbType.Date).Value = (object?)position.Deadline ?? DBNull.Value;
+        command.Parameters.Add("@Hired", SqlDbType.Bit).Value = position.Hired;
+        command.Parameters.Add("@ClientContactName", SqlDbType.VarChar).Value = position.ClientContactName;
+        command.Parameters.Add("@ClientContactPhone", SqlDbType.VarChar).Value = position.ClientContactPhone;
+        command.Parameters.Add("@ClientContactEmail", SqlDbType.VarChar).Value = position.ClientContactEmail;
+        if (includeClient)
+        {
+            command.Parameters.Add("@IdClient", SqlDbType.Int).Value = (object?)position.IdClient ?? DBNull.Value;
+        }
+    }
+
+    private static void AddLike(List<string> where, List<SqlParameter> parameters, string column, string? value, string? parameterName = null)
+    {
+        if (string.IsNullOrWhiteSpace(value))
+        {
+            return;
+        }
+
+        parameterName ??= "@" + column.Replace(".", string.Empty);
+        where.Add($"{column} LIKE {parameterName}");
+        parameters.Add(new SqlParameter(parameterName, SqlDbType.VarChar) { Value = "%" + value.Trim() + "%" });
+    }
+
+    private static Client ReadClient(SqlDataReader reader) => new()
+    {
+        Id = reader.GetInt32(0),
+        Name = GetString(reader, 1),
+        Phone = GetString(reader, 2),
+        Email = GetString(reader, 3),
+        ContactName = GetString(reader, 4),
+        Website = GetString(reader, 5)
+    };
+
+    private static Position ReadPosition(SqlDataReader reader, bool includeClientName)
+    {
+        var position = new Position
+        {
+            Id = reader.GetInt32(0),
+            Name = GetString(reader, 1),
+            Description = GetString(reader, 2),
+            StartDate = reader.IsDBNull(3) ? null : reader.GetDateTime(3),
+            Deadline = reader.IsDBNull(4) ? null : reader.GetDateTime(4),
+            Hired = !reader.IsDBNull(5) && reader.GetBoolean(5),
+            IdClient = reader.IsDBNull(6) ? null : reader.GetInt32(6),
+            ClientContactName = GetString(reader, 7),
+            ClientContactPhone = GetString(reader, 8),
+            ClientContactEmail = GetString(reader, 9)
+        };
+
+        if (includeClientName)
+        {
+            position.ClientName = GetString(reader, 10);
+        }
+
+        return position;
+    }
+
+    private static string GetString(SqlDataReader reader, int ordinal) =>
+        reader.IsDBNull(ordinal) ? string.Empty : reader.GetString(ordinal);
+}
diff --git a/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..468316298ba01ef622db9ffeeb20a3df775fc996
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
@@ -0,0 +1,15 @@
+using IRM.SPA.Models;
+
+namespace IRM.SPA.Services;
+
+public interface IHiringRepository
+{
+    Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default);
+    Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default);
+    Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default);
+    Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default);
+}

diff --git a/LegacyOutput/src/IRM.SPA/Models/Client.cs b/LegacyOutput/src/IRM.SPA/Models/Client.cs
new file mode 100644
index 0000000000000000000000000000000000000000..46bfecbc332bde56ebed47d21516d9a9c7773d42
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Client.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class Client
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Phone { get; set; } = string.Empty;
+    public string Email { get; set; } = string.Empty;
+    public string ContactName { get; set; } = string.Empty;
+    public string Website { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..d59d0bb30c1802c64fa28e40d6a449e156739081
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class ClientFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Phone { get; set; }
+    public string? Email { get; set; }
+    public string? Website { get; set; }
+    public string? ContactName { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/Position.cs b/LegacyOutput/src/IRM.SPA/Models/Position.cs
new file mode 100644
index 0000000000000000000000000000000000000000..a6f9543eebd29c5626ed28741e6b4065ad3d16cf
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Position.cs
@@ -0,0 +1,16 @@
+namespace IRM.SPA.Models;
+
+public sealed class Position
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Description { get; set; } = string.Empty;
+    public DateTime? StartDate { get; set; }
+    public DateTime? Deadline { get; set; }
+    public bool Hired { get; set; }
+    public int? IdClient { get; set; }
+    public string ClientName { get; set; } = string.Empty;
+    public string ClientContactName { get; set; } = string.Empty;
+    public string ClientContactPhone { get; set; } = string.Empty;
+    public string ClientContactEmail { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..cfa76e79d96580b7b4d98e9b476807ef6f12acb5
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class PositionFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Description { get; set; }
+    public string? StartDate { get; set; }
+    public string? Deadline { get; set; }
+    public string? ClientContact { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..1c88253e59d707a339e900e3d8c1a8b2d56950d2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
@@ -0,0 +1,268 @@
+using System.Data;
+using IRM.SPA.Models;
+using Microsoft.Data.SqlClient;
+
+namespace IRM.SPA.Services;
+
+public sealed class HiringRepository(IConfiguration configuration) : IHiringRepository
+{
+    private readonly string _connectionString = configuration.GetConnectionString("HiringConnection")
+        ?? throw new InvalidOperationException("ConnectionStrings:HiringConnection is not configured.");
+
+    public async Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Name", filter.Name);
+        AddLike(where, parameters, "Phone", filter.Phone);
+        AddLike(where, parameters, "Email", filter.Email);
+        AddLike(where, parameters, "Website", filter.Website);
+        AddLike(where, parameters, "ContactName", filter.ContactName);
+
+        var sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients";
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var clients = new List<Client>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            clients.Add(ReadClient(reader));
+        }
+
+        return clients;
+    }
+
+    public async Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients WHERE Id = @Id";
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadClient(reader) : null;
+    }
+
+    public async Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Clients (Name, Phone, Email, ContactName, Website)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Phone, @Email, @ContactName, @Website)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Clients
+            SET Name = @Name, Phone = @Phone, Email = @Email, ContactName = @ContactName, Website = @Website
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = client.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    public async Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Positions.Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Positions.Name", filter.Name, "@Name");
+        AddLike(where, parameters, "Positions.Description", filter.Description, "@Description");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.StartDate, 120)", filter.StartDate, "@StartDate");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.Deadline, 120)", filter.Deadline, "@Deadline");
+        AddLike(where, parameters, "Positions.ClientContactName", filter.ClientContact, "@ClientContact");
+
+        var sql = """
+            SELECT Positions.Id, Positions.Name, Positions.Description, Positions.StartDate, Positions.Deadline,
+                   Positions.Hired, Positions.IdClient, Positions.ClientContactName, Positions.ClientContactPhone,
+                   Positions.ClientContactEmail, Clients.Name AS ClientName
+            FROM Positions
+            LEFT JOIN Clients ON Positions.IdClient = Clients.Id
+            """;
+
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Positions.Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var positions = new List<Position>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            positions.Add(ReadPosition(reader, includeClientName: true));
+        }
+
+        return positions;
+    }
+
+    public async Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            SELECT Id, Name, Description, StartDate, Deadline, Hired, IdClient,
+                   ClientContactName, ClientContactPhone, ClientContactEmail
+            FROM Positions
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadPosition(reader, includeClientName: false) : null;
+    }
+
+    public async Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Positions (Name, Description, StartDate, Deadline, Hired, ClientContactName,
+                                   ClientContactPhone, ClientContactEmail, IdClient)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Description, @StartDate, @Deadline, @Hired, @ClientContactName,
+                    @ClientContactPhone, @ClientContactEmail, @IdClient)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Positions
+            SET Name = @Name, Description = @Description, StartDate = @StartDate, Deadline = @Deadline,
+                Hired = @Hired, ClientContactName = @ClientContactName, ClientContactPhone = @ClientContactPhone,
+                ClientContactEmail = @ClientContactEmail, IdClient = @IdClient
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = position.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    private SqlConnection CreateConnection() => new(_connectionString);
+
+    private static void AddClientParameters(SqlCommand command, Client client)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = client.Name;
+        command.Parameters.Add("@Phone", SqlDbType.VarChar).Value = client.Phone;
+        command.Parameters.Add("@Email", SqlDbType.VarChar).Value = client.Email;
+        command.Parameters.Add("@ContactName", SqlDbType.VarChar).Value = client.ContactName;
+        command.Parameters.Add("@Website", SqlDbType.VarChar).Value = client.Website;
+    }
+
+    private static void AddPositionParameters(SqlCommand command, Position position, bool includeClient)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = position.Name;
+        command.Parameters.Add("@Description", SqlDbType.VarChar).Value = position.Description;
+        command.Parameters.Add("@StartDate", SqlDbType.Date).Value = (object?)position.StartDate ?? DBNull.Value;
+        command.Parameters.Add("@Deadline", SqlDbType.Date).Value = (object?)position.Deadline ?? DBNull.Value;
+        command.Parameters.Add("@Hired", SqlDbType.Bit).Value = position.Hired;
+        command.Parameters.Add("@ClientContactName", SqlDbType.VarChar).Value = position.ClientContactName;
+        command.Parameters.Add("@ClientContactPhone", SqlDbType.VarChar).Value = position.ClientContactPhone;
+        command.Parameters.Add("@ClientContactEmail", SqlDbType.VarChar).Value = position.ClientContactEmail;
+        if (includeClient)
+        {
+            command.Parameters.Add("@IdClient", SqlDbType.Int).Value = (object?)position.IdClient ?? DBNull.Value;
+        }
+    }
+
+    private static void AddLike(List<string> where, List<SqlParameter> parameters, string column, string? value, string? parameterName = null)
+    {
+        if (string.IsNullOrWhiteSpace(value))
+        {
+            return;
+        }
+
+        parameterName ??= "@" + column.Replace(".", string.Empty);
+        where.Add($"{column} LIKE {parameterName}");
+        parameters.Add(new SqlParameter(parameterName, SqlDbType.VarChar) { Value = "%" + value.Trim() + "%" });
+    }
+
+    private static Client ReadClient(SqlDataReader reader) => new()
+    {
+        Id = reader.GetInt32(0),
+        Name = GetString(reader, 1),
+        Phone = GetString(reader, 2),
+        Email = GetString(reader, 3),
+        ContactName = GetString(reader, 4),
+        Website = GetString(reader, 5)
+    };
+
+    private static Position ReadPosition(SqlDataReader reader, bool includeClientName)
+    {
+        var position = new Position
+        {
+            Id = reader.GetInt32(0),
+            Name = GetString(reader, 1),
+            Description = GetString(reader, 2),
+            StartDate = reader.IsDBNull(3) ? null : reader.GetDateTime(3),
+            Deadline = reader.IsDBNull(4) ? null : reader.GetDateTime(4),
+            Hired = !reader.IsDBNull(5) && reader.GetBoolean(5),
+            IdClient = reader.IsDBNull(6) ? null : reader.GetInt32(6),
+            ClientContactName = GetString(reader, 7),
+            ClientContactPhone = GetString(reader, 8),
+            ClientContactEmail = GetString(reader, 9)
+        };
+
+        if (includeClientName)
+        {
+            position.ClientName = GetString(reader, 10);
+        }
+
+        return position;
+    }
+
+    private static string GetString(SqlDataReader reader, int ordinal) =>
+        reader.IsDBNull(ordinal) ? string.Empty : reader.GetString(ordinal);
+}
diff --git a/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..468316298ba01ef622db9ffeeb20a3df775fc996
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
@@ -0,0 +1,15 @@
+using IRM.SPA.Models;
+
+namespace IRM.SPA.Services;
+
+public interface IHiringRepository
+{
+    Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default);
+    Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default);
+    Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default);
+    Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default);
+}

codex
Now I’m replacing the scaffold pages with the WebForms-equivalent Blazor routes and layout. I’ll keep the old `.aspx` list routes as compatibility aliases so bookmarks to the list pages still land on the migrated screens.
apply patch
patch: completed
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Pages\ClientDetails.razor
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Pages\ClientsList.razor
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Pages\Home.razor
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Pages\PositionDetails.razor
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Pages\PositionsList.razor
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor
new file mode 100644
index 0000000000000000000000000000000000000000..1232eae426ef2325a0505f006805d6a05ba6115e
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor
@@ -0,0 +1,104 @@
+@page "/clients/new"
+@page "/clients/{Id:int}"
+@page "/ClientDetails"
+@page "/ClientDetails.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+@inject IJSRuntime JS
+
+<PageTitle>Client Details - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="SaveAsync" @onsubmit:preventDefault>
+    <span class="formLabel">Id:</span>
+    <span>@(client.Id == 0 ? string.Empty : client.Id)</span>
+    <br />
+    <span class="formLabel">Name:</span>
+    <input type="text" @bind="client.Name" />
+    <br />
+    <span class="formLabel">Phone:</span>
+    <input type="text" @bind="client.Phone" />
+    <br />
+    <span class="formLabel">Email:</span>
+    <input type="text" @bind="client.Email" />
+    <br />
+    <span class="formLabel">Contact Name:</span>
+    <input type="text" @bind="client.ContactName" />
+    <br />
+    <span class="formLabel">Website:</span>
+    <input type="text" @bind="client.Website" />
+    <br />
+    @if (isEdit)
+    {
+        <button class="link-button" type="submit">Update</button>
+    }
+    else
+    {
+        <button class="link-button" type="submit">Insert</button>
+    }
+</form>
+
+@code {
+    [Parameter] public int? Id { get; set; }
+
+    private Client client = new();
+    private bool isEdit;
+    private string? errorMessage;
+
+    protected override async Task OnParametersSetAsync()
+    {
+        errorMessage = null;
+        isEdit = false;
+        client = new Client();
+
+        if (Id is not { } id)
+        {
+            return;
+        }
+
+        try
+        {
+            var existing = await Repository.GetClientAsync(id);
+            if (existing is not null)
+            {
+                client = existing;
+                isEdit = true;
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load client. " + ex.Message;
+        }
+    }
+
+    private async Task SaveAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            if (isEdit)
+            {
+                if (await Repository.UpdateClientAsync(client))
+                {
+                    await JS.InvokeVoidAsync("alert", "Client updated successfully");
+                }
+            }
+            else
+            {
+                client.Id = await Repository.InsertClientAsync(client);
+                isEdit = true;
+                await JS.InvokeVoidAsync("alert", "Client added successfully");
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to save client. " + ex.Message;
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor
new file mode 100644
index 0000000000000000000000000000000000000000..774521377b61d400b5e79c84a3304d20b83878b3
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor
@@ -0,0 +1,85 @@
+@page "/clients"
+@page "/ClientsList"
+@page "/ClientsList.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+
+<PageTitle>Clients - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="ApplyFilter" @onsubmit:preventDefault>
+    <table class="legacy-table">
+        <thead>
+            <tr>
+                <th>Id</th>
+                <th>Client Name</th>
+                <th>Phone</th>
+                <th>Email</th>
+                <th>Website</th>
+                <th>Contact Name</th>
+                <th></th>
+            </tr>
+            <tr>
+                <th><input type="text" @bind="filter.Id" /></th>
+                <th><input type="text" @bind="filter.Name" /></th>
+                <th><input type="text" @bind="filter.Phone" /></th>
+                <th><input type="text" @bind="filter.Email" /></th>
+                <th><input type="text" @bind="filter.Website" /></th>
+                <th><input type="text" @bind="filter.ContactName" /></th>
+                <th><button type="submit">Filter</button></th>
+            </tr>
+        </thead>
+        <tbody>
+            @foreach (var client in clients)
+            {
+                <tr>
+                    <td>@client.Id</td>
+                    <td>@client.Name</td>
+                    <td>@client.Phone</td>
+                    <td>@client.Email</td>
+                    <td>@client.Website</td>
+                    <td>@client.ContactName</td>
+                    <td><a href="clients/@client.Id">Details</a></td>
+                </tr>
+            }
+        </tbody>
+    </table>
+</form>
+
+<a href="clients/new">Add new client</a>
+
+@code {
+    private readonly ClientFilter filter = new();
+    private IReadOnlyList<Client> clients = [];
+    private string? errorMessage;
+
+    protected override async Task OnInitializedAsync()
+    {
+        await LoadClientsAsync();
+    }
+
+    private async Task ApplyFilter()
+    {
+        await LoadClientsAsync();
+    }
+
+    private async Task LoadClientsAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            clients = await Repository.GetClientsAsync(filter);
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load clients. " + ex.Message;
+            clients = [];
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
index df0502354fdfbbef85e1673ffcff56d85d2481bf..e4fbd72369d329a04d4cead6939579592e284c3d
--- a/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
@@ -1,7 +1,26 @@
-﻿@page "/"
-
-<PageTitle>Home</PageTitle>
-
-<h1>Hello, world!</h1>
-
-Welcome to your new app.
+@page "/"
+@page "/Default.aspx"
+
+<PageTitle>Home Page - Hiring Tracker</PageTitle>
+
+<div class="jumbotron">
+    <h1>Hiring Tracking</h1>
+    <p class="lead">Track positions and candidates.</p>
+</div>
+
+<div class="row">
+    <div class="col-md-4">
+        <h2>Positions</h2>
+        <p>View open positions or query previous hires.</p>
+        <p>
+            <a class="btn btn-default" href="positions">View</a>
+        </p>
+    </div>
+    <div class="col-md-4">
+        <h2>Clients</h2>
+        <p>Manage contacts requesting the positions.</p>
+        <p>
+            <a class="btn btn-default" href="clients">View</a>
+        </p>
+    </div>
+</div>
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor
new file mode 100644
index 0000000000000000000000000000000000000000..e0d3014b542dc83cf4f5709a90472cf1a58e9deb
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor
@@ -0,0 +1,139 @@
+@page "/positions/new"
+@page "/positions/{Id:int}"
+@page "/PositionDetails"
+@page "/PositionDetails.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+@inject IJSRuntime JS
+
+<PageTitle>Position Details - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="SaveAsync" @onsubmit:preventDefault>
+    <span class="formLabel">Id:</span>
+    <span>@(position.Id == 0 ? string.Empty : position.Id)</span>
+    <br />
+    <span class="formLabel">Name:</span>
+    <input type="text" @bind="position.Name" />
+    <br />
+    <span class="formLabel">Description:</span>
+    <textarea rows="6" class="description-input" @bind="position.Description"></textarea>
+    <br />
+    <span class="formLabel">Start Date:</span>
+    <input type="date" @bind="startDateText" />
+    <br />
+    <span class="formLabel">Deadline:</span>
+    <input type="date" @bind="deadlineText" />
+    <br />
+    <span class="formLabel">Hired?:</span>
+    <input type="checkbox" @bind="position.Hired" />
+    <br />
+    <span class="formLabel">Client:</span>
+    <select @bind="position.IdClient">
+        @foreach (var client in clients)
+        {
+            <option value="@client.Id">@client.Name</option>
+        }
+    </select>
+    <br />
+    <span class="formLabel">Client Contact Name:</span>
+    <input type="text" @bind="position.ClientContactName" />
+    <br />
+    <span class="formLabel">Phone:</span>
+    <input type="text" @bind="position.ClientContactPhone" />
+    <br />
+    <span class="formLabel">Email:</span>
+    <input type="text" @bind="position.ClientContactEmail" />
+    <br />
+    @if (isEdit)
+    {
+        <button class="link-button" type="submit">Update</button>
+    }
+    else
+    {
+        <button class="link-button" type="submit">Insert</button>
+    }
+</form>
+
+@code {
+    [Parameter] public int? Id { get; set; }
+
+    private Position position = new();
+    private IReadOnlyList<Client> clients = [];
+    private bool isEdit;
+    private string? errorMessage;
+    private string startDateText = string.Empty;
+    private string deadlineText = string.Empty;
+
+    protected override async Task OnParametersSetAsync()
+    {
+        errorMessage = null;
+        isEdit = false;
+        position = new Position();
+        startDateText = string.Empty;
+        deadlineText = string.Empty;
+
+        try
+        {
+            clients = await Repository.GetClientsAsync(new ClientFilter());
+            position.IdClient = clients.FirstOrDefault()?.Id;
+
+            if (Id is not { } id)
+            {
+                return;
+            }
+
+            var existing = await Repository.GetPositionAsync(id);
+            if (existing is not null)
+            {
+                position = existing;
+                startDateText = ToDateInputValue(position.StartDate);
+                deadlineText = ToDateInputValue(position.Deadline);
+                isEdit = true;
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load position. " + ex.Message;
+        }
+    }
+
+    private async Task SaveAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            position.StartDate = ParseDate(startDateText);
+            position.Deadline = ParseDate(deadlineText);
+
+            if (isEdit)
+            {
+                if (await Repository.UpdatePositionAsync(position))
+                {
+                    await JS.InvokeVoidAsync("alert", "Position updated successfully");
+                }
+            }
+            else
+            {
+                position.Id = await Repository.InsertPositionAsync(position);
+                isEdit = true;
+                await JS.InvokeVoidAsync("alert", "Position added successfully");
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to save position. " + ex.Message;
+        }
+    }
+
+    private static string ToDateInputValue(DateTime? value) => value?.ToString("yyyy-MM-dd") ?? string.Empty;
+
+    private static DateTime? ParseDate(string value) =>
+        DateTime.TryParse(value, out var parsed) ? parsed.Date : null;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor
new file mode 100644
index 0000000000000000000000000000000000000000..efdcec61db320f36ea4b1bad176e604944be65e2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor
@@ -0,0 +1,88 @@
+@page "/positions"
+@page "/PositionsList"
+@page "/PositionsList.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+
+<PageTitle>Positions - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="ApplyFilter" @onsubmit:preventDefault>
+    <table class="legacy-table">
+        <thead>
+            <tr>
+                <th>Id</th>
+                <th>Name</th>
+                <th>Description</th>
+                <th>Start Date</th>
+                <th>Deadline</th>
+                <th>Position Closed</th>
+                <th>Client Contact</th>
+                <th></th>
+            </tr>
+            <tr>
+                <th><input type="text" @bind="filter.Id" /></th>
+                <th><input type="text" @bind="filter.Name" /></th>
+                <th><input type="text" @bind="filter.Description" /></th>
+                <th><input type="text" @bind="filter.StartDate" /></th>
+                <th><input type="text" @bind="filter.Deadline" /></th>
+                <th></th>
+                <th><input type="text" @bind="filter.ClientContact" /></th>
+                <th><button type="submit">Filter</button></th>
+            </tr>
+        </thead>
+        <tbody>
+            @foreach (var position in positions)
+            {
+                <tr>
+                    <td>@position.Id</td>
+                    <td>@position.Name</td>
+                    <td>@position.Description</td>
+                    <td>@position.StartDate</td>
+                    <td>@position.Deadline</td>
+                    <td>@position.Hired</td>
+                    <td>@position.ClientName (@position.ClientContactName)</td>
+                    <td><a href="positions/@position.Id">Details</a></td>
+                </tr>
+            }
+        </tbody>
+    </table>
+</form>
+
+<a href="positions/new">Add new position</a>
+
+@code {
+    private readonly PositionFilter filter = new();
+    private IReadOnlyList<Position> positions = [];
+    private string? errorMessage;
+
+    protected override async Task OnInitializedAsync()
+    {
+        await LoadPositionsAsync();
+    }
+
+    private async Task ApplyFilter()
+    {
+        await LoadPositionsAsync();
+    }
+
+    private async Task LoadPositionsAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            positions = await Repository.GetPositionsAsync(filter);
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load positions. " + ex.Message;
+            positions = [];
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/Client.cs b/LegacyOutput/src/IRM.SPA/Models/Client.cs
new file mode 100644
index 0000000000000000000000000000000000000000..46bfecbc332bde56ebed47d21516d9a9c7773d42
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Client.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class Client
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Phone { get; set; } = string.Empty;
+    public string Email { get; set; } = string.Empty;
+    public string ContactName { get; set; } = string.Empty;
+    public string Website { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..d59d0bb30c1802c64fa28e40d6a449e156739081
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class ClientFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Phone { get; set; }
+    public string? Email { get; set; }
+    public string? Website { get; set; }
+    public string? ContactName { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/Position.cs b/LegacyOutput/src/IRM.SPA/Models/Position.cs
new file mode 100644
index 0000000000000000000000000000000000000000..a6f9543eebd29c5626ed28741e6b4065ad3d16cf
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Position.cs
@@ -0,0 +1,16 @@
+namespace IRM.SPA.Models;
+
+public sealed class Position
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Description { get; set; } = string.Empty;
+    public DateTime? StartDate { get; set; }
+    public DateTime? Deadline { get; set; }
+    public bool Hired { get; set; }
+    public int? IdClient { get; set; }
+    public string ClientName { get; set; } = string.Empty;
+    public string ClientContactName { get; set; } = string.Empty;
+    public string ClientContactPhone { get; set; } = string.Empty;
+    public string ClientContactEmail { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..cfa76e79d96580b7b4d98e9b476807ef6f12acb5
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class PositionFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Description { get; set; }
+    public string? StartDate { get; set; }
+    public string? Deadline { get; set; }
+    public string? ClientContact { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..1c88253e59d707a339e900e3d8c1a8b2d56950d2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
@@ -0,0 +1,268 @@
+using System.Data;
+using IRM.SPA.Models;
+using Microsoft.Data.SqlClient;
+
+namespace IRM.SPA.Services;
+
+public sealed class HiringRepository(IConfiguration configuration) : IHiringRepository
+{
+    private readonly string _connectionString = configuration.GetConnectionString("HiringConnection")
+        ?? throw new InvalidOperationException("ConnectionStrings:HiringConnection is not configured.");
+
+    public async Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Name", filter.Name);
+        AddLike(where, parameters, "Phone", filter.Phone);
+        AddLike(where, parameters, "Email", filter.Email);
+        AddLike(where, parameters, "Website", filter.Website);
+        AddLike(where, parameters, "ContactName", filter.ContactName);
+
+        var sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients";
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var clients = new List<Client>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            clients.Add(ReadClient(reader));
+        }
+
+        return clients;
+    }
+
+    public async Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients WHERE Id = @Id";
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadClient(reader) : null;
+    }
+
+    public async Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Clients (Name, Phone, Email, ContactName, Website)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Phone, @Email, @ContactName, @Website)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Clients
+            SET Name = @Name, Phone = @Phone, Email = @Email, ContactName = @ContactName, Website = @Website
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = client.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    public async Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Positions.Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Positions.Name", filter.Name, "@Name");
+        AddLike(where, parameters, "Positions.Description", filter.Description, "@Description");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.StartDate, 120)", filter.StartDate, "@StartDate");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.Deadline, 120)", filter.Deadline, "@Deadline");
+        AddLike(where, parameters, "Positions.ClientContactName", filter.ClientContact, "@ClientContact");
+
+        var sql = """
+            SELECT Positions.Id, Positions.Name, Positions.Description, Positions.StartDate, Positions.Deadline,
+                   Positions.Hired, Positions.IdClient, Positions.ClientContactName, Positions.ClientContactPhone,
+                   Positions.ClientContactEmail, Clients.Name AS ClientName
+            FROM Positions
+            LEFT JOIN Clients ON Positions.IdClient = Clients.Id
+            """;
+
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Positions.Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var positions = new List<Position>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            positions.Add(ReadPosition(reader, includeClientName: true));
+        }
+
+        return positions;
+    }
+
+    public async Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            SELECT Id, Name, Description, StartDate, Deadline, Hired, IdClient,
+                   ClientContactName, ClientContactPhone, ClientContactEmail
+            FROM Positions
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadPosition(reader, includeClientName: false) : null;
+    }
+
+    public async Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Positions (Name, Description, StartDate, Deadline, Hired, ClientContactName,
+                                   ClientContactPhone, ClientContactEmail, IdClient)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Description, @StartDate, @Deadline, @Hired, @ClientContactName,
+                    @ClientContactPhone, @ClientContactEmail, @IdClient)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Positions
+            SET Name = @Name, Description = @Description, StartDate = @StartDate, Deadline = @Deadline,
+                Hired = @Hired, ClientContactName = @ClientContactName, ClientContactPhone = @ClientContactPhone,
+                ClientContactEmail = @ClientContactEmail, IdClient = @IdClient
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = position.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    private SqlConnection CreateConnection() => new(_connectionString);
+
+    private static void AddClientParameters(SqlCommand command, Client client)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = client.Name;
+        command.Parameters.Add("@Phone", SqlDbType.VarChar).Value = client.Phone;
+        command.Parameters.Add("@Email", SqlDbType.VarChar).Value = client.Email;
+        command.Parameters.Add("@ContactName", SqlDbType.VarChar).Value = client.ContactName;
+        command.Parameters.Add("@Website", SqlDbType.VarChar).Value = client.Website;
+    }
+
+    private static void AddPositionParameters(SqlCommand command, Position position, bool includeClient)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = position.Name;
+        command.Parameters.Add("@Description", SqlDbType.VarChar).Value = position.Description;
+        command.Parameters.Add("@StartDate", SqlDbType.Date).Value = (object?)position.StartDate ?? DBNull.Value;
+        command.Parameters.Add("@Deadline", SqlDbType.Date).Value = (object?)position.Deadline ?? DBNull.Value;
+        command.Parameters.Add("@Hired", SqlDbType.Bit).Value = position.Hired;
+        command.Parameters.Add("@ClientContactName", SqlDbType.VarChar).Value = position.ClientContactName;
+        command.Parameters.Add("@ClientContactPhone", SqlDbType.VarChar).Value = position.ClientContactPhone;
+        command.Parameters.Add("@ClientContactEmail", SqlDbType.VarChar).Value = position.ClientContactEmail;
+        if (includeClient)
+        {
+            command.Parameters.Add("@IdClient", SqlDbType.Int).Value = (object?)position.IdClient ?? DBNull.Value;
+        }
+    }
+
+    private static void AddLike(List<string> where, List<SqlParameter> parameters, string column, string? value, string? parameterName = null)
+    {
+        if (string.IsNullOrWhiteSpace(value))
+        {
+            return;
+        }
+
+        parameterName ??= "@" + column.Replace(".", string.Empty);
+        where.Add($"{column} LIKE {parameterName}");
+        parameters.Add(new SqlParameter(parameterName, SqlDbType.VarChar) { Value = "%" + value.Trim() + "%" });
+    }
+
+    private static Client ReadClient(SqlDataReader reader) => new()
+    {
+        Id = reader.GetInt32(0),
+        Name = GetString(reader, 1),
+        Phone = GetString(reader, 2),
+        Email = GetString(reader, 3),
+        ContactName = GetString(reader, 4),
+        Website = GetString(reader, 5)
+    };
+
+    private static Position ReadPosition(SqlDataReader reader, bool includeClientName)
+    {
+        var position = new Position
+        {
+            Id = reader.GetInt32(0),
+            Name = GetString(reader, 1),
+            Description = GetString(reader, 2),
+            StartDate = reader.IsDBNull(3) ? null : reader.GetDateTime(3),
+            Deadline = reader.IsDBNull(4) ? null : reader.GetDateTime(4),
+            Hired = !reader.IsDBNull(5) && reader.GetBoolean(5),
+            IdClient = reader.IsDBNull(6) ? null : reader.GetInt32(6),
+            ClientContactName = GetString(reader, 7),
+            ClientContactPhone = GetString(reader, 8),
+            ClientContactEmail = GetString(reader, 9)
+        };
+
+        if (includeClientName)
+        {
+            position.ClientName = GetString(reader, 10);
+        }
+
+        return position;
+    }
+
+    private static string GetString(SqlDataReader reader, int ordinal) =>
+        reader.IsDBNull(ordinal) ? string.Empty : reader.GetString(ordinal);
+}
diff --git a/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..468316298ba01ef622db9ffeeb20a3df775fc996
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
@@ -0,0 +1,15 @@
+using IRM.SPA.Models;
+
+namespace IRM.SPA.Services;
+
+public interface IHiringRepository
+{
+    Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default);
+    Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default);
+    Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default);
+    Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default);
+}

diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor
new file mode 100644
index 0000000000000000000000000000000000000000..1232eae426ef2325a0505f006805d6a05ba6115e
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor
@@ -0,0 +1,104 @@
+@page "/clients/new"
+@page "/clients/{Id:int}"
+@page "/ClientDetails"
+@page "/ClientDetails.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+@inject IJSRuntime JS
+
+<PageTitle>Client Details - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="SaveAsync" @onsubmit:preventDefault>
+    <span class="formLabel">Id:</span>
+    <span>@(client.Id == 0 ? string.Empty : client.Id)</span>
+    <br />
+    <span class="formLabel">Name:</span>
+    <input type="text" @bind="client.Name" />
+    <br />
+    <span class="formLabel">Phone:</span>
+    <input type="text" @bind="client.Phone" />
+    <br />
+    <span class="formLabel">Email:</span>
+    <input type="text" @bind="client.Email" />
+    <br />
+    <span class="formLabel">Contact Name:</span>
+    <input type="text" @bind="client.ContactName" />
+    <br />
+    <span class="formLabel">Website:</span>
+    <input type="text" @bind="client.Website" />
+    <br />
+    @if (isEdit)
+    {
+        <button class="link-button" type="submit">Update</button>
+    }
+    else
+    {
+        <button class="link-button" type="submit">Insert</button>
+    }
+</form>
+
+@code {
+    [Parameter] public int? Id { get; set; }
+
+    private Client client = new();
+    private bool isEdit;
+    private string? errorMessage;
+
+    protected override async Task OnParametersSetAsync()
+    {
+        errorMessage = null;
+        isEdit = false;
+        client = new Client();
+
+        if (Id is not { } id)
+        {
+            return;
+        }
+
+        try
+        {
+            var existing = await Repository.GetClientAsync(id);
+            if (existing is not null)
+            {
+                client = existing;
+                isEdit = true;
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load client. " + ex.Message;
+        }
+    }
+
+    private async Task SaveAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            if (isEdit)
+            {
+                if (await Repository.UpdateClientAsync(client))
+                {
+                    await JS.InvokeVoidAsync("alert", "Client updated successfully");
+                }
+            }
+            else
+            {
+                client.Id = await Repository.InsertClientAsync(client);
+                isEdit = true;
+                await JS.InvokeVoidAsync("alert", "Client added successfully");
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to save client. " + ex.Message;
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor
new file mode 100644
index 0000000000000000000000000000000000000000..774521377b61d400b5e79c84a3304d20b83878b3
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor
@@ -0,0 +1,85 @@
+@page "/clients"
+@page "/ClientsList"
+@page "/ClientsList.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+
+<PageTitle>Clients - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="ApplyFilter" @onsubmit:preventDefault>
+    <table class="legacy-table">
+        <thead>
+            <tr>
+                <th>Id</th>
+                <th>Client Name</th>
+                <th>Phone</th>
+                <th>Email</th>
+                <th>Website</th>
+                <th>Contact Name</th>
+                <th></th>
+            </tr>
+            <tr>
+                <th><input type="text" @bind="filter.Id" /></th>
+                <th><input type="text" @bind="filter.Name" /></th>
+                <th><input type="text" @bind="filter.Phone" /></th>
+                <th><input type="text" @bind="filter.Email" /></th>
+                <th><input type="text" @bind="filter.Website" /></th>
+                <th><input type="text" @bind="filter.ContactName" /></th>
+                <th><button type="submit">Filter</button></th>
+            </tr>
+        </thead>
+        <tbody>
+            @foreach (var client in clients)
+            {
+                <tr>
+                    <td>@client.Id</td>
+                    <td>@client.Name</td>
+                    <td>@client.Phone</td>
+                    <td>@client.Email</td>
+                    <td>@client.Website</td>
+                    <td>@client.ContactName</td>
+                    <td><a href="clients/@client.Id">Details</a></td>
+                </tr>
+            }
+        </tbody>
+    </table>
+</form>
+
+<a href="clients/new">Add new client</a>
+
+@code {
+    private readonly ClientFilter filter = new();
+    private IReadOnlyList<Client> clients = [];
+    private string? errorMessage;
+
+    protected override async Task OnInitializedAsync()
+    {
+        await LoadClientsAsync();
+    }
+
+    private async Task ApplyFilter()
+    {
+        await LoadClientsAsync();
+    }
+
+    private async Task LoadClientsAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            clients = await Repository.GetClientsAsync(filter);
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load clients. " + ex.Message;
+            clients = [];
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
index df0502354fdfbbef85e1673ffcff56d85d2481bf..e4fbd72369d329a04d4cead6939579592e284c3d
--- a/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
@@ -1,7 +1,26 @@
-﻿@page "/"
-
-<PageTitle>Home</PageTitle>
-
-<h1>Hello, world!</h1>
-
-Welcome to your new app.
+@page "/"
+@page "/Default.aspx"
+
+<PageTitle>Home Page - Hiring Tracker</PageTitle>
+
+<div class="jumbotron">
+    <h1>Hiring Tracking</h1>
+    <p class="lead">Track positions and candidates.</p>
+</div>
+
+<div class="row">
+    <div class="col-md-4">
+        <h2>Positions</h2>
+        <p>View open positions or query previous hires.</p>
+        <p>
+            <a class="btn btn-default" href="positions">View</a>
+        </p>
+    </div>
+    <div class="col-md-4">
+        <h2>Clients</h2>
+        <p>Manage contacts requesting the positions.</p>
+        <p>
+            <a class="btn btn-default" href="clients">View</a>
+        </p>
+    </div>
+</div>
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor
new file mode 100644
index 0000000000000000000000000000000000000000..e0d3014b542dc83cf4f5709a90472cf1a58e9deb
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor
@@ -0,0 +1,139 @@
+@page "/positions/new"
+@page "/positions/{Id:int}"
+@page "/PositionDetails"
+@page "/PositionDetails.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+@inject IJSRuntime JS
+
+<PageTitle>Position Details - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="SaveAsync" @onsubmit:preventDefault>
+    <span class="formLabel">Id:</span>
+    <span>@(position.Id == 0 ? string.Empty : position.Id)</span>
+    <br />
+    <span class="formLabel">Name:</span>
+    <input type="text" @bind="position.Name" />
+    <br />
+    <span class="formLabel">Description:</span>
+    <textarea rows="6" class="description-input" @bind="position.Description"></textarea>
+    <br />
+    <span class="formLabel">Start Date:</span>
+    <input type="date" @bind="startDateText" />
+    <br />
+    <span class="formLabel">Deadline:</span>
+    <input type="date" @bind="deadlineText" />
+    <br />
+    <span class="formLabel">Hired?:</span>
+    <input type="checkbox" @bind="position.Hired" />
+    <br />
+    <span class="formLabel">Client:</span>
+    <select @bind="position.IdClient">
+        @foreach (var client in clients)
+        {
+            <option value="@client.Id">@client.Name</option>
+        }
+    </select>
+    <br />
+    <span class="formLabel">Client Contact Name:</span>
+    <input type="text" @bind="position.ClientContactName" />
+    <br />
+    <span class="formLabel">Phone:</span>
+    <input type="text" @bind="position.ClientContactPhone" />
+    <br />
+    <span class="formLabel">Email:</span>
+    <input type="text" @bind="position.ClientContactEmail" />
+    <br />
+    @if (isEdit)
+    {
+        <button class="link-button" type="submit">Update</button>
+    }
+    else
+    {
+        <button class="link-button" type="submit">Insert</button>
+    }
+</form>
+
+@code {
+    [Parameter] public int? Id { get; set; }
+
+    private Position position = new();
+    private IReadOnlyList<Client> clients = [];
+    private bool isEdit;
+    private string? errorMessage;
+    private string startDateText = string.Empty;
+    private string deadlineText = string.Empty;
+
+    protected override async Task OnParametersSetAsync()
+    {
+        errorMessage = null;
+        isEdit = false;
+        position = new Position();
+        startDateText = string.Empty;
+        deadlineText = string.Empty;
+
+        try
+        {
+            clients = await Repository.GetClientsAsync(new ClientFilter());
+            position.IdClient = clients.FirstOrDefault()?.Id;
+
+            if (Id is not { } id)
+            {
+                return;
+            }
+
+            var existing = await Repository.GetPositionAsync(id);
+            if (existing is not null)
+            {
+                position = existing;
+                startDateText = ToDateInputValue(position.StartDate);
+                deadlineText = ToDateInputValue(position.Deadline);
+                isEdit = true;
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load position. " + ex.Message;
+        }
+    }
+
+    private async Task SaveAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            position.StartDate = ParseDate(startDateText);
+            position.Deadline = ParseDate(deadlineText);
+
+            if (isEdit)
+            {
+                if (await Repository.UpdatePositionAsync(position))
+                {
+                    await JS.InvokeVoidAsync("alert", "Position updated successfully");
+                }
+            }
+            else
+            {
+                position.Id = await Repository.InsertPositionAsync(position);
+                isEdit = true;
+                await JS.InvokeVoidAsync("alert", "Position added successfully");
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to save position. " + ex.Message;
+        }
+    }
+
+    private static string ToDateInputValue(DateTime? value) => value?.ToString("yyyy-MM-dd") ?? string.Empty;
+
+    private static DateTime? ParseDate(string value) =>
+        DateTime.TryParse(value, out var parsed) ? parsed.Date : null;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor
new file mode 100644
index 0000000000000000000000000000000000000000..efdcec61db320f36ea4b1bad176e604944be65e2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor
@@ -0,0 +1,88 @@
+@page "/positions"
+@page "/PositionsList"
+@page "/PositionsList.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+
+<PageTitle>Positions - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="ApplyFilter" @onsubmit:preventDefault>
+    <table class="legacy-table">
+        <thead>
+            <tr>
+                <th>Id</th>
+                <th>Name</th>
+                <th>Description</th>
+                <th>Start Date</th>
+                <th>Deadline</th>
+                <th>Position Closed</th>
+                <th>Client Contact</th>
+                <th></th>
+            </tr>
+            <tr>
+                <th><input type="text" @bind="filter.Id" /></th>
+                <th><input type="text" @bind="filter.Name" /></th>
+                <th><input type="text" @bind="filter.Description" /></th>
+                <th><input type="text" @bind="filter.StartDate" /></th>
+                <th><input type="text" @bind="filter.Deadline" /></th>
+                <th></th>
+                <th><input type="text" @bind="filter.ClientContact" /></th>
+                <th><button type="submit">Filter</button></th>
+            </tr>
+        </thead>
+        <tbody>
+            @foreach (var position in positions)
+            {
+                <tr>
+                    <td>@position.Id</td>
+                    <td>@position.Name</td>
+                    <td>@position.Description</td>
+                    <td>@position.StartDate</td>
+                    <td>@position.Deadline</td>
+                    <td>@position.Hired</td>
+                    <td>@position.ClientName (@position.ClientContactName)</td>
+                    <td><a href="positions/@position.Id">Details</a></td>
+                </tr>
+            }
+        </tbody>
+    </table>
+</form>
+
+<a href="positions/new">Add new position</a>
+
+@code {
+    private readonly PositionFilter filter = new();
+    private IReadOnlyList<Position> positions = [];
+    private string? errorMessage;
+
+    protected override async Task OnInitializedAsync()
+    {
+        await LoadPositionsAsync();
+    }
+
+    private async Task ApplyFilter()
+    {
+        await LoadPositionsAsync();
+    }
+
+    private async Task LoadPositionsAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            positions = await Repository.GetPositionsAsync(filter);
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load positions. " + ex.Message;
+            positions = [];
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/Client.cs b/LegacyOutput/src/IRM.SPA/Models/Client.cs
new file mode 100644
index 0000000000000000000000000000000000000000..46bfecbc332bde56ebed47d21516d9a9c7773d42
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Client.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class Client
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Phone { get; set; } = string.Empty;
+    public string Email { get; set; } = string.Empty;
+    public string ContactName { get; set; } = string.Empty;
+    public string Website { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..d59d0bb30c1802c64fa28e40d6a449e156739081
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class ClientFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Phone { get; set; }
+    public string? Email { get; set; }
+    public string? Website { get; set; }
+    public string? ContactName { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/Position.cs b/LegacyOutput/src/IRM.SPA/Models/Position.cs
new file mode 100644
index 0000000000000000000000000000000000000000..a6f9543eebd29c5626ed28741e6b4065ad3d16cf
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Position.cs
@@ -0,0 +1,16 @@
+namespace IRM.SPA.Models;
+
+public sealed class Position
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Description { get; set; } = string.Empty;
+    public DateTime? StartDate { get; set; }
+    public DateTime? Deadline { get; set; }
+    public bool Hired { get; set; }
+    public int? IdClient { get; set; }
+    public string ClientName { get; set; } = string.Empty;
+    public string ClientContactName { get; set; } = string.Empty;
+    public string ClientContactPhone { get; set; } = string.Empty;
+    public string ClientContactEmail { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..cfa76e79d96580b7b4d98e9b476807ef6f12acb5
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class PositionFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Description { get; set; }
+    public string? StartDate { get; set; }
+    public string? Deadline { get; set; }
+    public string? ClientContact { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..1c88253e59d707a339e900e3d8c1a8b2d56950d2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
@@ -0,0 +1,268 @@
+using System.Data;
+using IRM.SPA.Models;
+using Microsoft.Data.SqlClient;
+
+namespace IRM.SPA.Services;
+
+public sealed class HiringRepository(IConfiguration configuration) : IHiringRepository
+{
+    private readonly string _connectionString = configuration.GetConnectionString("HiringConnection")
+        ?? throw new InvalidOperationException("ConnectionStrings:HiringConnection is not configured.");
+
+    public async Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Name", filter.Name);
+        AddLike(where, parameters, "Phone", filter.Phone);
+        AddLike(where, parameters, "Email", filter.Email);
+        AddLike(where, parameters, "Website", filter.Website);
+        AddLike(where, parameters, "ContactName", filter.ContactName);
+
+        var sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients";
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var clients = new List<Client>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            clients.Add(ReadClient(reader));
+        }
+
+        return clients;
+    }
+
+    public async Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients WHERE Id = @Id";
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadClient(reader) : null;
+    }
+
+    public async Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Clients (Name, Phone, Email, ContactName, Website)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Phone, @Email, @ContactName, @Website)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Clients
+            SET Name = @Name, Phone = @Phone, Email = @Email, ContactName = @ContactName, Website = @Website
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = client.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    public async Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Positions.Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Positions.Name", filter.Name, "@Name");
+        AddLike(where, parameters, "Positions.Description", filter.Description, "@Description");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.StartDate, 120)", filter.StartDate, "@StartDate");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.Deadline, 120)", filter.Deadline, "@Deadline");
+        AddLike(where, parameters, "Positions.ClientContactName", filter.ClientContact, "@ClientContact");
+
+        var sql = """
+            SELECT Positions.Id, Positions.Name, Positions.Description, Positions.StartDate, Positions.Deadline,
+                   Positions.Hired, Positions.IdClient, Positions.ClientContactName, Positions.ClientContactPhone,
+                   Positions.ClientContactEmail, Clients.Name AS ClientName
+            FROM Positions
+            LEFT JOIN Clients ON Positions.IdClient = Clients.Id
+            """;
+
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Positions.Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var positions = new List<Position>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            positions.Add(ReadPosition(reader, includeClientName: true));
+        }
+
+        return positions;
+    }
+
+    public async Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            SELECT Id, Name, Description, StartDate, Deadline, Hired, IdClient,
+                   ClientContactName, ClientContactPhone, ClientContactEmail
+            FROM Positions
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadPosition(reader, includeClientName: false) : null;
+    }
+
+    public async Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Positions (Name, Description, StartDate, Deadline, Hired, ClientContactName,
+                                   ClientContactPhone, ClientContactEmail, IdClient)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Description, @StartDate, @Deadline, @Hired, @ClientContactName,
+                    @ClientContactPhone, @ClientContactEmail, @IdClient)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Positions
+            SET Name = @Name, Description = @Description, StartDate = @StartDate, Deadline = @Deadline,
+                Hired = @Hired, ClientContactName = @ClientContactName, ClientContactPhone = @ClientContactPhone,
+                ClientContactEmail = @ClientContactEmail, IdClient = @IdClient
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = position.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    private SqlConnection CreateConnection() => new(_connectionString);
+
+    private static void AddClientParameters(SqlCommand command, Client client)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = client.Name;
+        command.Parameters.Add("@Phone", SqlDbType.VarChar).Value = client.Phone;
+        command.Parameters.Add("@Email", SqlDbType.VarChar).Value = client.Email;
+        command.Parameters.Add("@ContactName", SqlDbType.VarChar).Value = client.ContactName;
+        command.Parameters.Add("@Website", SqlDbType.VarChar).Value = client.Website;
+    }
+
+    private static void AddPositionParameters(SqlCommand command, Position position, bool includeClient)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = position.Name;
+        command.Parameters.Add("@Description", SqlDbType.VarChar).Value = position.Description;
+        command.Parameters.Add("@StartDate", SqlDbType.Date).Value = (object?)position.StartDate ?? DBNull.Value;
+        command.Parameters.Add("@Deadline", SqlDbType.Date).Value = (object?)position.Deadline ?? DBNull.Value;
+        command.Parameters.Add("@Hired", SqlDbType.Bit).Value = position.Hired;
+        command.Parameters.Add("@ClientContactName", SqlDbType.VarChar).Value = position.ClientContactName;
+        command.Parameters.Add("@ClientContactPhone", SqlDbType.VarChar).Value = position.ClientContactPhone;
+        command.Parameters.Add("@ClientContactEmail", SqlDbType.VarChar).Value = position.ClientContactEmail;
+        if (includeClient)
+        {
+            command.Parameters.Add("@IdClient", SqlDbType.Int).Value = (object?)position.IdClient ?? DBNull.Value;
+        }
+    }
+
+    private static void AddLike(List<string> where, List<SqlParameter> parameters, string column, string? value, string? parameterName = null)
+    {
+        if (string.IsNullOrWhiteSpace(value))
+        {
+            return;
+        }
+
+        parameterName ??= "@" + column.Replace(".", string.Empty);
+        where.Add($"{column} LIKE {parameterName}");
+        parameters.Add(new SqlParameter(parameterName, SqlDbType.VarChar) { Value = "%" + value.Trim() + "%" });
+    }
+
+    private static Client ReadClient(SqlDataReader reader) => new()
+    {
+        Id = reader.GetInt32(0),
+        Name = GetString(reader, 1),
+        Phone = GetString(reader, 2),
+        Email = GetString(reader, 3),
+        ContactName = GetString(reader, 4),
+        Website = GetString(reader, 5)
+    };
+
+    private static Position ReadPosition(SqlDataReader reader, bool includeClientName)
+    {
+        var position = new Position
+        {
+            Id = reader.GetInt32(0),
+            Name = GetString(reader, 1),
+            Description = GetString(reader, 2),
+            StartDate = reader.IsDBNull(3) ? null : reader.GetDateTime(3),
+            Deadline = reader.IsDBNull(4) ? null : reader.GetDateTime(4),
+            Hired = !reader.IsDBNull(5) && reader.GetBoolean(5),
+            IdClient = reader.IsDBNull(6) ? null : reader.GetInt32(6),
+            ClientContactName = GetString(reader, 7),
+            ClientContactPhone = GetString(reader, 8),
+            ClientContactEmail = GetString(reader, 9)
+        };
+
+        if (includeClientName)
+        {
+            position.ClientName = GetString(reader, 10);
+        }
+
+        return position;
+    }
+
+    private static string GetString(SqlDataReader reader, int ordinal) =>
+        reader.IsDBNull(ordinal) ? string.Empty : reader.GetString(ordinal);
+}
diff --git a/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..468316298ba01ef622db9ffeeb20a3df775fc996
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
@@ -0,0 +1,15 @@
+using IRM.SPA.Models;
+
+namespace IRM.SPA.Services;
+
+public interface IHiringRepository
+{
+    Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default);
+    Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default);
+    Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default);
+    Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default);
+}

codex
I’m trimming the Blazor starter shell now: the sidebar/counter/weather navigation is being replaced by the original fixed Bootstrap navbar and footer from `Site.Master`.
apply patch
patch: completed
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Layout\MainLayout.razor
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Layout\NavMenu.razor
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\_Imports.razor
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\DI\DependancyInjector.cs
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Program.cs
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\wwwroot\app.css
diff --git a/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor b/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
index 62e62873d628af7e91de98824e1143460b2db2a0..a9714ae63155375bce0d34f8e2a2cda4c6cfbeeb
--- a/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
@@ -1,23 +1,30 @@
-﻿@inherits LayoutComponentBase
-
-<div class="page">
-    <div class="sidebar">
-        <NavMenu />
-    </div>
-
-    <main>
-        <div class="top-row px-4">
-            <a href="https://learn.microsoft.com/aspnet/core/" target="_blank">About</a>
-        </div>
-
-        <article class="content px-4">
-            @Body
-        </article>
-    </main>
-</div>
-
-<div id="blazor-error-ui">
-    An unhandled error has occurred.
-    <a href="" class="reload">Reload</a>
-    <a class="dismiss">🗙</a>
-</div>
+@inherits LayoutComponentBase
+
+<div class="navbar navbar-inverse navbar-fixed-top">
+    <div class="container">
+        <div class="navbar-header">
+            <a class="navbar-brand" href="/">Hiring Tracker</a>
+        </div>
+        <div class="navbar-collapse collapse">
+            <ul class="nav navbar-nav">
+                <li><NavLink href="/" Match="NavLinkMatch.All">Home</NavLink></li>
+                <li><NavLink href="clients">Clients</NavLink></li>
+                <li><NavLink href="positions">Positions</NavLink></li>
+            </ul>
+        </div>
+    </div>
+</div>
+
+<div class="container body-content">
+    @Body
+    <hr />
+    <footer>
+        <p>&copy; @DateTime.Now.Year - Hiring Tracker</p>
+    </footer>
+</div>
+
+<div id="blazor-error-ui">
+    An unhandled error has occurred.
+    <a href="" class="reload">Reload</a>
+    <a class="dismiss">x</a>
+</div>
diff --git a/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor b/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
index 259e68b4bc97ef9ecc0b3899dc192d7790fd9b4c..c765fe7b74acb5c30b228509af2a8a6e6e1bf3c6
--- a/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
@@ -1,30 +1 @@
-﻿<div class="top-row ps-3 navbar navbar-dark">
-    <div class="container-fluid">
-        <a class="navbar-brand" href="">IRM.SPA</a>
-    </div>
-</div>
-
-<input type="checkbox" title="Navigation menu" class="navbar-toggler" />
-
-<div class="nav-scrollable" onclick="document.querySelector('.navbar-toggler').click()">
-    <nav class="flex-column">
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="" Match="NavLinkMatch.All">
-                <span class="bi bi-house-door-fill-nav-menu" aria-hidden="true"></span> Home
-            </NavLink>
-        </div>
-
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="counter">
-                <span class="bi bi-plus-square-fill-nav-menu" aria-hidden="true"></span> Counter
-            </NavLink>
-        </div>
-
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="weather">
-                <span class="bi bi-list-nested-nav-menu" aria-hidden="true"></span> Weather
-            </NavLink>
-        </div>
-    </nav>
-</div>
-
+@* Navigation is defined in MainLayout to match the legacy Site.Master markup. *@
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor
new file mode 100644
index 0000000000000000000000000000000000000000..1232eae426ef2325a0505f006805d6a05ba6115e
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor
@@ -0,0 +1,104 @@
+@page "/clients/new"
+@page "/clients/{Id:int}"
+@page "/ClientDetails"
+@page "/ClientDetails.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+@inject IJSRuntime JS
+
+<PageTitle>Client Details - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="SaveAsync" @onsubmit:preventDefault>
+    <span class="formLabel">Id:</span>
+    <span>@(client.Id == 0 ? string.Empty : client.Id)</span>
+    <br />
+    <span class="formLabel">Name:</span>
+    <input type="text" @bind="client.Name" />
+    <br />
+    <span class="formLabel">Phone:</span>
+    <input type="text" @bind="client.Phone" />
+    <br />
+    <span class="formLabel">Email:</span>
+    <input type="text" @bind="client.Email" />
+    <br />
+    <span class="formLabel">Contact Name:</span>
+    <input type="text" @bind="client.ContactName" />
+    <br />
+    <span class="formLabel">Website:</span>
+    <input type="text" @bind="client.Website" />
+    <br />
+    @if (isEdit)
+    {
+        <button class="link-button" type="submit">Update</button>
+    }
+    else
+    {
+        <button class="link-button" type="submit">Insert</button>
+    }
+</form>
+
+@code {
+    [Parameter] public int? Id { get; set; }
+
+    private Client client = new();
+    private bool isEdit;
+    private string? errorMessage;
+
+    protected override async Task OnParametersSetAsync()
+    {
+        errorMessage = null;
+        isEdit = false;
+        client = new Client();
+
+        if (Id is not { } id)
+        {
+            return;
+        }
+
+        try
+        {
+            var existing = await Repository.GetClientAsync(id);
+            if (existing is not null)
+            {
+                client = existing;
+                isEdit = true;
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load client. " + ex.Message;
+        }
+    }
+
+    private async Task SaveAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            if (isEdit)
+            {
+                if (await Repository.UpdateClientAsync(client))
+                {
+                    await JS.InvokeVoidAsync("alert", "Client updated successfully");
+                }
+            }
+            else
+            {
+                client.Id = await Repository.InsertClientAsync(client);
+                isEdit = true;
+                await JS.InvokeVoidAsync("alert", "Client added successfully");
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to save client. " + ex.Message;
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor
new file mode 100644
index 0000000000000000000000000000000000000000..774521377b61d400b5e79c84a3304d20b83878b3
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor
@@ -0,0 +1,85 @@
+@page "/clients"
+@page "/ClientsList"
+@page "/ClientsList.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+
+<PageTitle>Clients - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="ApplyFilter" @onsubmit:preventDefault>
+    <table class="legacy-table">
+        <thead>
+            <tr>
+                <th>Id</th>
+                <th>Client Name</th>
+                <th>Phone</th>
+                <th>Email</th>
+                <th>Website</th>
+                <th>Contact Name</th>
+                <th></th>
+            </tr>
+            <tr>
+                <th><input type="text" @bind="filter.Id" /></th>
+                <th><input type="text" @bind="filter.Name" /></th>
+                <th><input type="text" @bind="filter.Phone" /></th>
+                <th><input type="text" @bind="filter.Email" /></th>
+                <th><input type="text" @bind="filter.Website" /></th>
+                <th><input type="text" @bind="filter.ContactName" /></th>
+                <th><button type="submit">Filter</button></th>
+            </tr>
+        </thead>
+        <tbody>
+            @foreach (var client in clients)
+            {
+                <tr>
+                    <td>@client.Id</td>
+                    <td>@client.Name</td>
+                    <td>@client.Phone</td>
+                    <td>@client.Email</td>
+                    <td>@client.Website</td>
+                    <td>@client.ContactName</td>
+                    <td><a href="clients/@client.Id">Details</a></td>
+                </tr>
+            }
+        </tbody>
+    </table>
+</form>
+
+<a href="clients/new">Add new client</a>
+
+@code {
+    private readonly ClientFilter filter = new();
+    private IReadOnlyList<Client> clients = [];
+    private string? errorMessage;
+
+    protected override async Task OnInitializedAsync()
+    {
+        await LoadClientsAsync();
+    }
+
+    private async Task ApplyFilter()
+    {
+        await LoadClientsAsync();
+    }
+
+    private async Task LoadClientsAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            clients = await Repository.GetClientsAsync(filter);
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load clients. " + ex.Message;
+            clients = [];
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
index df0502354fdfbbef85e1673ffcff56d85d2481bf..e4fbd72369d329a04d4cead6939579592e284c3d
--- a/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
@@ -1,7 +1,26 @@
-﻿@page "/"
-
-<PageTitle>Home</PageTitle>
-
-<h1>Hello, world!</h1>
-
-Welcome to your new app.
+@page "/"
+@page "/Default.aspx"
+
+<PageTitle>Home Page - Hiring Tracker</PageTitle>
+
+<div class="jumbotron">
+    <h1>Hiring Tracking</h1>
+    <p class="lead">Track positions and candidates.</p>
+</div>
+
+<div class="row">
+    <div class="col-md-4">
+        <h2>Positions</h2>
+        <p>View open positions or query previous hires.</p>
+        <p>
+            <a class="btn btn-default" href="positions">View</a>
+        </p>
+    </div>
+    <div class="col-md-4">
+        <h2>Clients</h2>
+        <p>Manage contacts requesting the positions.</p>
+        <p>
+            <a class="btn btn-default" href="clients">View</a>
+        </p>
+    </div>
+</div>
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor
new file mode 100644
index 0000000000000000000000000000000000000000..e0d3014b542dc83cf4f5709a90472cf1a58e9deb
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor
@@ -0,0 +1,139 @@
+@page "/positions/new"
+@page "/positions/{Id:int}"
+@page "/PositionDetails"
+@page "/PositionDetails.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+@inject IJSRuntime JS
+
+<PageTitle>Position Details - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="SaveAsync" @onsubmit:preventDefault>
+    <span class="formLabel">Id:</span>
+    <span>@(position.Id == 0 ? string.Empty : position.Id)</span>
+    <br />
+    <span class="formLabel">Name:</span>
+    <input type="text" @bind="position.Name" />
+    <br />
+    <span class="formLabel">Description:</span>
+    <textarea rows="6" class="description-input" @bind="position.Description"></textarea>
+    <br />
+    <span class="formLabel">Start Date:</span>
+    <input type="date" @bind="startDateText" />
+    <br />
+    <span class="formLabel">Deadline:</span>
+    <input type="date" @bind="deadlineText" />
+    <br />
+    <span class="formLabel">Hired?:</span>
+    <input type="checkbox" @bind="position.Hired" />
+    <br />
+    <span class="formLabel">Client:</span>
+    <select @bind="position.IdClient">
+        @foreach (var client in clients)
+        {
+            <option value="@client.Id">@client.Name</option>
+        }
+    </select>
+    <br />
+    <span class="formLabel">Client Contact Name:</span>
+    <input type="text" @bind="position.ClientContactName" />
+    <br />
+    <span class="formLabel">Phone:</span>
+    <input type="text" @bind="position.ClientContactPhone" />
+    <br />
+    <span class="formLabel">Email:</span>
+    <input type="text" @bind="position.ClientContactEmail" />
+    <br />
+    @if (isEdit)
+    {
+        <button class="link-button" type="submit">Update</button>
+    }
+    else
+    {
+        <button class="link-button" type="submit">Insert</button>
+    }
+</form>
+
+@code {
+    [Parameter] public int? Id { get; set; }
+
+    private Position position = new();
+    private IReadOnlyList<Client> clients = [];
+    private bool isEdit;
+    private string? errorMessage;
+    private string startDateText = string.Empty;
+    private string deadlineText = string.Empty;
+
+    protected override async Task OnParametersSetAsync()
+    {
+        errorMessage = null;
+        isEdit = false;
+        position = new Position();
+        startDateText = string.Empty;
+        deadlineText = string.Empty;
+
+        try
+        {
+            clients = await Repository.GetClientsAsync(new ClientFilter());
+            position.IdClient = clients.FirstOrDefault()?.Id;
+
+            if (Id is not { } id)
+            {
+                return;
+            }
+
+            var existing = await Repository.GetPositionAsync(id);
+            if (existing is not null)
+            {
+                position = existing;
+                startDateText = ToDateInputValue(position.StartDate);
+                deadlineText = ToDateInputValue(position.Deadline);
+                isEdit = true;
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load position. " + ex.Message;
+        }
+    }
+
+    private async Task SaveAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            position.StartDate = ParseDate(startDateText);
+            position.Deadline = ParseDate(deadlineText);
+
+            if (isEdit)
+            {
+                if (await Repository.UpdatePositionAsync(position))
+                {
+                    await JS.InvokeVoidAsync("alert", "Position updated successfully");
+                }
+            }
+            else
+            {
+                position.Id = await Repository.InsertPositionAsync(position);
+                isEdit = true;
+                await JS.InvokeVoidAsync("alert", "Position added successfully");
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to save position. " + ex.Message;
+        }
+    }
+
+    private static string ToDateInputValue(DateTime? value) => value?.ToString("yyyy-MM-dd") ?? string.Empty;
+
+    private static DateTime? ParseDate(string value) =>
+        DateTime.TryParse(value, out var parsed) ? parsed.Date : null;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor
new file mode 100644
index 0000000000000000000000000000000000000000..efdcec61db320f36ea4b1bad176e604944be65e2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor
@@ -0,0 +1,88 @@
+@page "/positions"
+@page "/PositionsList"
+@page "/PositionsList.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+
+<PageTitle>Positions - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="ApplyFilter" @onsubmit:preventDefault>
+    <table class="legacy-table">
+        <thead>
+            <tr>
+                <th>Id</th>
+                <th>Name</th>
+                <th>Description</th>
+                <th>Start Date</th>
+                <th>Deadline</th>
+                <th>Position Closed</th>
+                <th>Client Contact</th>
+                <th></th>
+            </tr>
+            <tr>
+                <th><input type="text" @bind="filter.Id" /></th>
+                <th><input type="text" @bind="filter.Name" /></th>
+                <th><input type="text" @bind="filter.Description" /></th>
+                <th><input type="text" @bind="filter.StartDate" /></th>
+                <th><input type="text" @bind="filter.Deadline" /></th>
+                <th></th>
+                <th><input type="text" @bind="filter.ClientContact" /></th>
+                <th><button type="submit">Filter</button></th>
+            </tr>
+        </thead>
+        <tbody>
+            @foreach (var position in positions)
+            {
+                <tr>
+                    <td>@position.Id</td>
+                    <td>@position.Name</td>
+                    <td>@position.Description</td>
+                    <td>@position.StartDate</td>
+                    <td>@position.Deadline</td>
+                    <td>@position.Hired</td>
+                    <td>@position.ClientName (@position.ClientContactName)</td>
+                    <td><a href="positions/@position.Id">Details</a></td>
+                </tr>
+            }
+        </tbody>
+    </table>
+</form>
+
+<a href="positions/new">Add new position</a>
+
+@code {
+    private readonly PositionFilter filter = new();
+    private IReadOnlyList<Position> positions = [];
+    private string? errorMessage;
+
+    protected override async Task OnInitializedAsync()
+    {
+        await LoadPositionsAsync();
+    }
+
+    private async Task ApplyFilter()
+    {
+        await LoadPositionsAsync();
+    }
+
+    private async Task LoadPositionsAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            positions = await Repository.GetPositionsAsync(filter);
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load positions. " + ex.Message;
+            positions = [];
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/_Imports.razor b/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
index de2621323fafca41583fecc7d1b4b181a1e49ac1..4ca0297300bf206b5f4f4e3af4a8adffd1865970
--- a/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
@@ -5,6 +5,8 @@
 @using Microsoft.AspNetCore.Components.Web
 @using static Microsoft.AspNetCore.Components.Web.RenderMode
 @using Microsoft.AspNetCore.Components.Web.Virtualization
-@using Microsoft.JSInterop
-@using IRM.SPA
-@using IRM.SPA.Components
+@using Microsoft.JSInterop
+@using IRM.SPA
+@using IRM.SPA.Components
+@using IRM.SPA.Models
+@using IRM.SPA.Services
diff --git a/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs b/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
index 8a7b20c19addfd182712b09a487081eda45d085a..a1e19750167d74ae38221cb933beb102768676d5
--- a/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
+++ b/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
@@ -13,13 +13,14 @@
 {
     public static class DependancyInjector
     {
-        public static void RegisterServices(IServiceCollection services, ConfigurationOptions config)
-        {
-           
-
-            RegisterApiClients(services, config);           
-            RegisterModelValidators(services);
-        }
+        public static void RegisterServices(IServiceCollection services, ConfigurationOptions config)
+        {
+           
+
+            services.AddScoped<IHiringRepository, HiringRepository>();
+            RegisterApiClients(services, config);           
+            RegisterModelValidators(services);
+        }
        
         private static void RegisterModelValidators(IServiceCollection services)
         {
diff --git a/LegacyOutput/src/IRM.SPA/Models/Client.cs b/LegacyOutput/src/IRM.SPA/Models/Client.cs
new file mode 100644
index 0000000000000000000000000000000000000000..46bfecbc332bde56ebed47d21516d9a9c7773d42
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Client.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class Client
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Phone { get; set; } = string.Empty;
+    public string Email { get; set; } = string.Empty;
+    public string ContactName { get; set; } = string.Empty;
+    public string Website { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..d59d0bb30c1802c64fa28e40d6a449e156739081
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class ClientFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Phone { get; set; }
+    public string? Email { get; set; }
+    public string? Website { get; set; }
+    public string? ContactName { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/Position.cs b/LegacyOutput/src/IRM.SPA/Models/Position.cs
new file mode 100644
index 0000000000000000000000000000000000000000..a6f9543eebd29c5626ed28741e6b4065ad3d16cf
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Position.cs
@@ -0,0 +1,16 @@
+namespace IRM.SPA.Models;
+
+public sealed class Position
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Description { get; set; } = string.Empty;
+    public DateTime? StartDate { get; set; }
+    public DateTime? Deadline { get; set; }
+    public bool Hired { get; set; }
+    public int? IdClient { get; set; }
+    public string ClientName { get; set; } = string.Empty;
+    public string ClientContactName { get; set; } = string.Empty;
+    public string ClientContactPhone { get; set; } = string.Empty;
+    public string ClientContactEmail { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..cfa76e79d96580b7b4d98e9b476807ef6f12acb5
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class PositionFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Description { get; set; }
+    public string? StartDate { get; set; }
+    public string? Deadline { get; set; }
+    public string? ClientContact { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Program.cs b/LegacyOutput/src/IRM.SPA/Program.cs
index 00184fc283cd7060825796fd98e55be1c243edd6..2008eaa884f07089ce5823fe41c6a6336a34f709
--- a/LegacyOutput/src/IRM.SPA/Program.cs
+++ b/LegacyOutput/src/IRM.SPA/Program.cs
@@ -10,8 +10,9 @@
     {
         public static void Main(string[] args)
         {
-            var builder = WebApplication.CreateBuilder(args);
-            ConfigurationOptions config = builder.Configuration.Get<ConfigurationOptions>() ?? new ConfigurationOptions();
+            var builder = WebApplication.CreateBuilder(args);
+            AppDomain.CurrentDomain.SetData("DataDirectory", Path.Combine(builder.Environment.ContentRootPath, "App_Data"));
+            ConfigurationOptions config = builder.Configuration.Get<ConfigurationOptions>() ?? new ConfigurationOptions();
             // Add services to the container.
             builder.Services.AddRazorComponents()
                 .AddInteractiveServerComponents();           
diff --git a/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..1c88253e59d707a339e900e3d8c1a8b2d56950d2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
@@ -0,0 +1,268 @@
+using System.Data;
+using IRM.SPA.Models;
+using Microsoft.Data.SqlClient;
+
+namespace IRM.SPA.Services;
+
+public sealed class HiringRepository(IConfiguration configuration) : IHiringRepository
+{
+    private readonly string _connectionString = configuration.GetConnectionString("HiringConnection")
+        ?? throw new InvalidOperationException("ConnectionStrings:HiringConnection is not configured.");
+
+    public async Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Name", filter.Name);
+        AddLike(where, parameters, "Phone", filter.Phone);
+        AddLike(where, parameters, "Email", filter.Email);
+        AddLike(where, parameters, "Website", filter.Website);
+        AddLike(where, parameters, "ContactName", filter.ContactName);
+
+        var sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients";
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var clients = new List<Client>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            clients.Add(ReadClient(reader));
+        }
+
+        return clients;
+    }
+
+    public async Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients WHERE Id = @Id";
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadClient(reader) : null;
+    }
+
+    public async Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Clients (Name, Phone, Email, ContactName, Website)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Phone, @Email, @ContactName, @Website)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Clients
+            SET Name = @Name, Phone = @Phone, Email = @Email, ContactName = @ContactName, Website = @Website
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = client.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    public async Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Positions.Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Positions.Name", filter.Name, "@Name");
+        AddLike(where, parameters, "Positions.Description", filter.Description, "@Description");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.StartDate, 120)", filter.StartDate, "@StartDate");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.Deadline, 120)", filter.Deadline, "@Deadline");
+        AddLike(where, parameters, "Positions.ClientContactName", filter.ClientContact, "@ClientContact");
+
+        var sql = """
+            SELECT Positions.Id, Positions.Name, Positions.Description, Positions.StartDate, Positions.Deadline,
+                   Positions.Hired, Positions.IdClient, Positions.ClientContactName, Positions.ClientContactPhone,
+                   Positions.ClientContactEmail, Clients.Name AS ClientName
+            FROM Positions
+            LEFT JOIN Clients ON Positions.IdClient = Clients.Id
+            """;
+
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Positions.Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var positions = new List<Position>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            positions.Add(ReadPosition(reader, includeClientName: true));
+        }
+
+        return positions;
+    }
+
+    public async Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            SELECT Id, Name, Description, StartDate, Deadline, Hired, IdClient,
+                   ClientContactName, ClientContactPhone, ClientContactEmail
+            FROM Positions
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadPosition(reader, includeClientName: false) : null;
+    }
+
+    public async Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Positions (Name, Description, StartDate, Deadline, Hired, ClientContactName,
+                                   ClientContactPhone, ClientContactEmail, IdClient)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Description, @StartDate, @Deadline, @Hired, @ClientContactName,
+                    @ClientContactPhone, @ClientContactEmail, @IdClient)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Positions
+            SET Name = @Name, Description = @Description, StartDate = @StartDate, Deadline = @Deadline,
+                Hired = @Hired, ClientContactName = @ClientContactName, ClientContactPhone = @ClientContactPhone,
+                ClientContactEmail = @ClientContactEmail, IdClient = @IdClient
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = position.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    private SqlConnection CreateConnection() => new(_connectionString);
+
+    private static void AddClientParameters(SqlCommand command, Client client)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = client.Name;
+        command.Parameters.Add("@Phone", SqlDbType.VarChar).Value = client.Phone;
+        command.Parameters.Add("@Email", SqlDbType.VarChar).Value = client.Email;
+        command.Parameters.Add("@ContactName", SqlDbType.VarChar).Value = client.ContactName;
+        command.Parameters.Add("@Website", SqlDbType.VarChar).Value = client.Website;
+    }
+
+    private static void AddPositionParameters(SqlCommand command, Position position, bool includeClient)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = position.Name;
+        command.Parameters.Add("@Description", SqlDbType.VarChar).Value = position.Description;
+        command.Parameters.Add("@StartDate", SqlDbType.Date).Value = (object?)position.StartDate ?? DBNull.Value;
+        command.Parameters.Add("@Deadline", SqlDbType.Date).Value = (object?)position.Deadline ?? DBNull.Value;
+        command.Parameters.Add("@Hired", SqlDbType.Bit).Value = position.Hired;
+        command.Parameters.Add("@ClientContactName", SqlDbType.VarChar).Value = position.ClientContactName;
+        command.Parameters.Add("@ClientContactPhone", SqlDbType.VarChar).Value = position.ClientContactPhone;
+        command.Parameters.Add("@ClientContactEmail", SqlDbType.VarChar).Value = position.ClientContactEmail;
+        if (includeClient)
+        {
+            command.Parameters.Add("@IdClient", SqlDbType.Int).Value = (object?)position.IdClient ?? DBNull.Value;
+        }
+    }
+
+    private static void AddLike(List<string> where, List<SqlParameter> parameters, string column, string? value, string? parameterName = null)
+    {
+        if (string.IsNullOrWhiteSpace(value))
+        {
+            return;
+        }
+
+        parameterName ??= "@" + column.Replace(".", string.Empty);
+        where.Add($"{column} LIKE {parameterName}");
+        parameters.Add(new SqlParameter(parameterName, SqlDbType.VarChar) { Value = "%" + value.Trim() + "%" });
+    }
+
+    private static Client ReadClient(SqlDataReader reader) => new()
+    {
+        Id = reader.GetInt32(0),
+        Name = GetString(reader, 1),
+        Phone = GetString(reader, 2),
+        Email = GetString(reader, 3),
+        ContactName = GetString(reader, 4),
+        Website = GetString(reader, 5)
+    };
+
+    private static Position ReadPosition(SqlDataReader reader, bool includeClientName)
+    {
+        var position = new Position
+        {
+            Id = reader.GetInt32(0),
+            Name = GetString(reader, 1),
+            Description = GetString(reader, 2),
+            StartDate = reader.IsDBNull(3) ? null : reader.GetDateTime(3),
+            Deadline = reader.IsDBNull(4) ? null : reader.GetDateTime(4),
+            Hired = !reader.IsDBNull(5) && reader.GetBoolean(5),
+            IdClient = reader.IsDBNull(6) ? null : reader.GetInt32(6),
+            ClientContactName = GetString(reader, 7),
+            ClientContactPhone = GetString(reader, 8),
+            ClientContactEmail = GetString(reader, 9)
+        };
+
+        if (includeClientName)
+        {
+            position.ClientName = GetString(reader, 10);
+        }
+
+        return position;
+    }
+
+    private static string GetString(SqlDataReader reader, int ordinal) =>
+        reader.IsDBNull(ordinal) ? string.Empty : reader.GetString(ordinal);
+}
diff --git a/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..468316298ba01ef622db9ffeeb20a3df775fc996
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
@@ -0,0 +1,15 @@
+using IRM.SPA.Models;
+
+namespace IRM.SPA.Services;
+
+public interface IHiringRepository
+{
+    Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default);
+    Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default);
+    Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default);
+    Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default);
+}
diff --git a/LegacyOutput/src/IRM.SPA/wwwroot/app.css b/LegacyOutput/src/IRM.SPA/wwwroot/app.css
index 7ac30e2a8df7ef2e3f233e331d1d58ca449099d8..c4e3f519ac693dd5c0ee569dc7dae70aa51945dc
--- a/LegacyOutput/src/IRM.SPA/wwwroot/app.css
+++ b/LegacyOutput/src/IRM.SPA/wwwroot/app.css
@@ -1,51 +1,247 @@
-html, body {
-    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
-}
-
-a, .btn-link {
-    color: #006bb7;
-}
-
-.btn-primary {
-    color: #fff;
-    background-color: #1b6ec2;
-    border-color: #1861ac;
-}
-
-.btn:focus, .btn:active:focus, .btn-link.nav-link:focus, .form-control:focus, .form-check-input:focus {
-  box-shadow: 0 0 0 0.1rem white, 0 0 0 0.25rem #258cfb;
-}
-
-.content {
-    padding-top: 1.1rem;
-}
-
-h1:focus {
-    outline: none;
-}
-
-.valid.modified:not([type=checkbox]) {
-    outline: 1px solid #26b050;
-}
-
-.invalid {
-    outline: 1px solid #e50000;
-}
-
-.validation-message {
-    color: #e50000;
-}
-
-.blazor-error-boundary {
-    background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNDkiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIG92ZXJmbG93PSJoaWRkZW4iPjxkZWZzPjxjbGlwUGF0aCBpZD0iY2xpcDAiPjxyZWN0IHg9IjIzNSIgeT0iNTEiIHdpZHRoPSI1NiIgaGVpZ2h0PSI0OSIvPjwvY2xpcFBhdGg+PC9kZWZzPjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMCkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yMzUgLTUxKSI+PHBhdGggZD0iTTI2My41MDYgNTFDMjY0LjcxNyA1MSAyNjUuODEzIDUxLjQ4MzcgMjY2LjYwNiA1Mi4yNjU4TDI2Ny4wNTIgNTIuNzk4NyAyNjcuNTM5IDUzLjYyODMgMjkwLjE4NSA5Mi4xODMxIDI5MC41NDUgOTIuNzk1IDI5MC42NTYgOTIuOTk2QzI5MC44NzcgOTMuNTEzIDI5MSA5NC4wODE1IDI5MSA5NC42NzgyIDI5MSA5Ny4wNjUxIDI4OS4wMzggOTkgMjg2LjYxNyA5OUwyNDAuMzgzIDk5QzIzNy45NjMgOTkgMjM2IDk3LjA2NTEgMjM2IDk0LjY3ODIgMjM2IDk0LjM3OTkgMjM2LjAzMSA5NC4wODg2IDIzNi4wODkgOTMuODA3MkwyMzYuMzM4IDkzLjAxNjIgMjM2Ljg1OCA5Mi4xMzE0IDI1OS40NzMgNTMuNjI5NCAyNTkuOTYxIDUyLjc5ODUgMjYwLjQwNyA1Mi4yNjU4QzI2MS4yIDUxLjQ4MzcgMjYyLjI5NiA1MSAyNjMuNTA2IDUxWk0yNjMuNTg2IDY2LjAxODNDMjYwLjczNyA2Ni4wMTgzIDI1OS4zMTMgNjcuMTI0NSAyNTkuMzEzIDY5LjMzNyAyNTkuMzEzIDY5LjYxMDIgMjU5LjMzMiA2OS44NjA4IDI1OS4zNzEgNzAuMDg4N0wyNjEuNzk1IDg0LjAxNjEgMjY1LjM4IDg0LjAxNjEgMjY3LjgyMSA2OS43NDc1QzI2Ny44NiA2OS43MzA5IDI2Ny44NzkgNjkuNTg3NyAyNjcuODc5IDY5LjMxNzkgMjY3Ljg3OSA2Ny4xMTgyIDI2Ni40NDggNjYuMDE4MyAyNjMuNTg2IDY2LjAxODNaTTI2My41NzYgODYuMDU0N0MyNjEuMDQ5IDg2LjA1NDcgMjU5Ljc4NiA4Ny4zMDA1IDI1OS43ODYgODkuNzkyMSAyNTkuNzg2IDkyLjI4MzcgMjYxLjA0OSA5My41Mjk1IDI2My41NzYgOTMuNTI5NSAyNjYuMTE2IDkzLjUyOTUgMjY3LjM4NyA5Mi4yODM3IDI2Ny4zODcgODkuNzkyMSAyNjcuMzg3IDg3LjMwMDUgMjY2LjExNiA4Ni4wNTQ3IDI2My41NzYgODYuMDU0N1oiIGZpbGw9IiNGRkU1MDAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48L3N2Zz4=) no-repeat 1rem/1.8rem, #b32121;
-    padding: 1rem 1rem 1rem 3.7rem;
-    color: white;
-}
-
-    .blazor-error-boundary::after {
-        content: "An error has occurred."
-    }
-
-.darker-border-checkbox.form-check-input {
-    border-color: #929292;
-}
+html,
+body {
+    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
+}
+
+body {
+    padding-top: 50px;
+    padding-bottom: 20px;
+}
+
+.body-content {
+    padding-left: 15px;
+    padding-right: 15px;
+}
+
+.dl-horizontal dt {
+    white-space: normal;
+}
+
+input[type="text"],
+input[type="password"],
+input[type="email"],
+input[type="tel"],
+input[type="select"] {
+    max-width: 280px;
+}
+
+.jumbotron {
+    padding: 30px;
+    margin-bottom: 30px;
+    color: inherit;
+    background-color: #eee;
+    border-radius: 6px;
+}
+
+.jumbotron h1 {
+    font-size: 63px;
+}
+
+.lead {
+    margin-bottom: 20px;
+    font-size: 21px;
+    font-weight: 300;
+    line-height: 1.4;
+}
+
+.navbar-inverse {
+    background-color: #222;
+    border-color: #080808;
+}
+
+.navbar-fixed-top {
+    position: fixed;
+    right: 0;
+    left: 0;
+    z-index: 1030;
+    top: 0;
+    border-width: 0 0 1px;
+}
+
+.navbar {
+    min-height: 50px;
+    margin-bottom: 20px;
+    border: 1px solid transparent;
+}
+
+.navbar-header {
+    float: left;
+}
+
+.navbar-brand {
+    float: left;
+    height: 50px;
+    padding: 15px;
+    font-size: 18px;
+    line-height: 20px;
+}
+
+.navbar-inverse .navbar-brand,
+.navbar-inverse .navbar-nav > li > a {
+    color: #9d9d9d;
+}
+
+.navbar-inverse .navbar-brand:hover,
+.navbar-inverse .navbar-nav > li > a:hover,
+.navbar-inverse .navbar-nav > li > a.active {
+    color: #fff;
+    text-decoration: none;
+}
+
+.navbar-nav {
+    float: left;
+    margin: 0;
+}
+
+.nav > li {
+    position: relative;
+    display: block;
+}
+
+.navbar-nav > li {
+    float: left;
+}
+
+.nav > li > a {
+    position: relative;
+    display: block;
+    padding: 10px 15px;
+}
+
+.navbar-nav > li > a {
+    padding-top: 15px;
+    padding-bottom: 15px;
+    line-height: 20px;
+}
+
+.btn-default {
+    color: #333;
+    background-color: #fff;
+    border-color: #ccc;
+}
+
+.btn {
+    display: inline-block;
+    padding: 6px 12px;
+    margin-bottom: 0;
+    font-size: 14px;
+    font-weight: 400;
+    line-height: 1.42857143;
+    text-align: center;
+    white-space: nowrap;
+    vertical-align: middle;
+    cursor: pointer;
+    border: 1px solid transparent;
+    border-radius: 4px;
+}
+
+.formLabel {
+    display: inline-block;
+    width: 200px;
+}
+
+.legacy-table {
+    margin-top: 20px;
+    margin-bottom: 10px;
+    border-collapse: separate;
+    border-spacing: 2px;
+}
+
+.legacy-table th,
+.legacy-table td {
+    padding: 1px;
+    font-weight: normal;
+    text-align: left;
+    vertical-align: top;
+}
+
+.legacy-table th {
+    font-weight: bold;
+}
+
+.legacy-table input[type="text"] {
+    width: 130px;
+}
+
+.description-input {
+    width: 500px;
+    max-width: 100%;
+    vertical-align: top;
+}
+
+.link-button {
+    padding: 0;
+    color: #337ab7;
+    background: none;
+    border: 0;
+    cursor: pointer;
+    font: inherit;
+}
+
+.link-button:hover {
+    color: #23527c;
+    text-decoration: underline;
+}
+
+.alert {
+    padding: 15px;
+    margin-top: 20px;
+    margin-bottom: 20px;
+    border: 1px solid transparent;
+    border-radius: 4px;
+}
+
+.alert-danger {
+    color: #a94442;
+    background-color: #f2dede;
+    border-color: #ebccd1;
+}
+
+@media screen and (min-width: 768px) {
+    .jumbotron {
+        margin-top: 20px;
+    }
+
+    .body-content {
+        padding: 0;
+    }
+}
+
+@media screen and (max-width: 767px) {
+    .navbar-header,
+    .navbar-nav,
+    .navbar-nav > li {
+        float: none;
+    }
+
+    .navbar-fixed-top {
+        position: static;
+    }
+
+    body {
+        padding-top: 0;
+    }
+
+    .jumbotron h1 {
+        font-size: 42px;
+    }
+}
+
+#blazor-error-ui {
+    background: lightyellow;
+    bottom: 0;
+    box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.2);
+    display: none;
+    left: 0;
+    padding: 0.6rem 1.25rem 0.7rem 1.25rem;
+    position: fixed;
+    width: 100%;
+    z-index: 1000;
+}
+
+#blazor-error-ui .dismiss {
+    cursor: pointer;
+    position: absolute;
+    right: 0.75rem;
+    top: 0.5rem;
+}

diff --git a/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor b/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
index 62e62873d628af7e91de98824e1143460b2db2a0..a9714ae63155375bce0d34f8e2a2cda4c6cfbeeb
--- a/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
@@ -1,23 +1,30 @@
-﻿@inherits LayoutComponentBase
-
-<div class="page">
-    <div class="sidebar">
-        <NavMenu />
-    </div>
-
-    <main>
-        <div class="top-row px-4">
-            <a href="https://learn.microsoft.com/aspnet/core/" target="_blank">About</a>
-        </div>
-
-        <article class="content px-4">
-            @Body
-        </article>
-    </main>
-</div>
-
-<div id="blazor-error-ui">
-    An unhandled error has occurred.
-    <a href="" class="reload">Reload</a>
-    <a class="dismiss">🗙</a>
-</div>
+@inherits LayoutComponentBase
+
+<div class="navbar navbar-inverse navbar-fixed-top">
+    <div class="container">
+        <div class="navbar-header">
+            <a class="navbar-brand" href="/">Hiring Tracker</a>
+        </div>
+        <div class="navbar-collapse collapse">
+            <ul class="nav navbar-nav">
+                <li><NavLink href="/" Match="NavLinkMatch.All">Home</NavLink></li>
+                <li><NavLink href="clients">Clients</NavLink></li>
+                <li><NavLink href="positions">Positions</NavLink></li>
+            </ul>
+        </div>
+    </div>
+</div>
+
+<div class="container body-content">
+    @Body
+    <hr />
+    <footer>
+        <p>&copy; @DateTime.Now.Year - Hiring Tracker</p>
+    </footer>
+</div>
+
+<div id="blazor-error-ui">
+    An unhandled error has occurred.
+    <a href="" class="reload">Reload</a>
+    <a class="dismiss">x</a>
+</div>
diff --git a/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor b/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
index 259e68b4bc97ef9ecc0b3899dc192d7790fd9b4c..c765fe7b74acb5c30b228509af2a8a6e6e1bf3c6
--- a/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
@@ -1,30 +1 @@
-﻿<div class="top-row ps-3 navbar navbar-dark">
-    <div class="container-fluid">
-        <a class="navbar-brand" href="">IRM.SPA</a>
-    </div>
-</div>
-
-<input type="checkbox" title="Navigation menu" class="navbar-toggler" />
-
-<div class="nav-scrollable" onclick="document.querySelector('.navbar-toggler').click()">
-    <nav class="flex-column">
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="" Match="NavLinkMatch.All">
-                <span class="bi bi-house-door-fill-nav-menu" aria-hidden="true"></span> Home
-            </NavLink>
-        </div>
-
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="counter">
-                <span class="bi bi-plus-square-fill-nav-menu" aria-hidden="true"></span> Counter
-            </NavLink>
-        </div>
-
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="weather">
-                <span class="bi bi-list-nested-nav-menu" aria-hidden="true"></span> Weather
-            </NavLink>
-        </div>
-    </nav>
-</div>
-
+@* Navigation is defined in MainLayout to match the legacy Site.Master markup. *@
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor
new file mode 100644
index 0000000000000000000000000000000000000000..1232eae426ef2325a0505f006805d6a05ba6115e
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor
@@ -0,0 +1,104 @@
+@page "/clients/new"
+@page "/clients/{Id:int}"
+@page "/ClientDetails"
+@page "/ClientDetails.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+@inject IJSRuntime JS
+
+<PageTitle>Client Details - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="SaveAsync" @onsubmit:preventDefault>
+    <span class="formLabel">Id:</span>
+    <span>@(client.Id == 0 ? string.Empty : client.Id)</span>
+    <br />
+    <span class="formLabel">Name:</span>
+    <input type="text" @bind="client.Name" />
+    <br />
+    <span class="formLabel">Phone:</span>
+    <input type="text" @bind="client.Phone" />
+    <br />
+    <span class="formLabel">Email:</span>
+    <input type="text" @bind="client.Email" />
+    <br />
+    <span class="formLabel">Contact Name:</span>
+    <input type="text" @bind="client.ContactName" />
+    <br />
+    <span class="formLabel">Website:</span>
+    <input type="text" @bind="client.Website" />
+    <br />
+    @if (isEdit)
+    {
+        <button class="link-button" type="submit">Update</button>
+    }
+    else
+    {
+        <button class="link-button" type="submit">Insert</button>
+    }
+</form>
+
+@code {
+    [Parameter] public int? Id { get; set; }
+
+    private Client client = new();
+    private bool isEdit;
+    private string? errorMessage;
+
+    protected override async Task OnParametersSetAsync()
+    {
+        errorMessage = null;
+        isEdit = false;
+        client = new Client();
+
+        if (Id is not { } id)
+        {
+            return;
+        }
+
+        try
+        {
+            var existing = await Repository.GetClientAsync(id);
+            if (existing is not null)
+            {
+                client = existing;
+                isEdit = true;
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load client. " + ex.Message;
+        }
+    }
+
+    private async Task SaveAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            if (isEdit)
+            {
+                if (await Repository.UpdateClientAsync(client))
+                {
+                    await JS.InvokeVoidAsync("alert", "Client updated successfully");
+                }
+            }
+            else
+            {
+                client.Id = await Repository.InsertClientAsync(client);
+                isEdit = true;
+                await JS.InvokeVoidAsync("alert", "Client added successfully");
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to save client. " + ex.Message;
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor
new file mode 100644
index 0000000000000000000000000000000000000000..774521377b61d400b5e79c84a3304d20b83878b3
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor
@@ -0,0 +1,85 @@
+@page "/clients"
+@page "/ClientsList"
+@page "/ClientsList.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+
+<PageTitle>Clients - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="ApplyFilter" @onsubmit:preventDefault>
+    <table class="legacy-table">
+        <thead>
+            <tr>
+                <th>Id</th>
+                <th>Client Name</th>
+                <th>Phone</th>
+                <th>Email</th>
+                <th>Website</th>
+                <th>Contact Name</th>
+                <th></th>
+            </tr>
+            <tr>
+                <th><input type="text" @bind="filter.Id" /></th>
+                <th><input type="text" @bind="filter.Name" /></th>
+                <th><input type="text" @bind="filter.Phone" /></th>
+                <th><input type="text" @bind="filter.Email" /></th>
+                <th><input type="text" @bind="filter.Website" /></th>
+                <th><input type="text" @bind="filter.ContactName" /></th>
+                <th><button type="submit">Filter</button></th>
+            </tr>
+        </thead>
+        <tbody>
+            @foreach (var client in clients)
+            {
+                <tr>
+                    <td>@client.Id</td>
+                    <td>@client.Name</td>
+                    <td>@client.Phone</td>
+                    <td>@client.Email</td>
+                    <td>@client.Website</td>
+                    <td>@client.ContactName</td>
+                    <td><a href="clients/@client.Id">Details</a></td>
+                </tr>
+            }
+        </tbody>
+    </table>
+</form>
+
+<a href="clients/new">Add new client</a>
+
+@code {
+    private readonly ClientFilter filter = new();
+    private IReadOnlyList<Client> clients = [];
+    private string? errorMessage;
+
+    protected override async Task OnInitializedAsync()
+    {
+        await LoadClientsAsync();
+    }
+
+    private async Task ApplyFilter()
+    {
+        await LoadClientsAsync();
+    }
+
+    private async Task LoadClientsAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            clients = await Repository.GetClientsAsync(filter);
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load clients. " + ex.Message;
+            clients = [];
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
index df0502354fdfbbef85e1673ffcff56d85d2481bf..e4fbd72369d329a04d4cead6939579592e284c3d
--- a/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
@@ -1,7 +1,26 @@
-﻿@page "/"
-
-<PageTitle>Home</PageTitle>
-
-<h1>Hello, world!</h1>
-
-Welcome to your new app.
+@page "/"
+@page "/Default.aspx"
+
+<PageTitle>Home Page - Hiring Tracker</PageTitle>
+
+<div class="jumbotron">
+    <h1>Hiring Tracking</h1>
+    <p class="lead">Track positions and candidates.</p>
+</div>
+
+<div class="row">
+    <div class="col-md-4">
+        <h2>Positions</h2>
+        <p>View open positions or query previous hires.</p>
+        <p>
+            <a class="btn btn-default" href="positions">View</a>
+        </p>
+    </div>
+    <div class="col-md-4">
+        <h2>Clients</h2>
+        <p>Manage contacts requesting the positions.</p>
+        <p>
+            <a class="btn btn-default" href="clients">View</a>
+        </p>
+    </div>
+</div>
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor
new file mode 100644
index 0000000000000000000000000000000000000000..e0d3014b542dc83cf4f5709a90472cf1a58e9deb
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor
@@ -0,0 +1,139 @@
+@page "/positions/new"
+@page "/positions/{Id:int}"
+@page "/PositionDetails"
+@page "/PositionDetails.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+@inject IJSRuntime JS
+
+<PageTitle>Position Details - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="SaveAsync" @onsubmit:preventDefault>
+    <span class="formLabel">Id:</span>
+    <span>@(position.Id == 0 ? string.Empty : position.Id)</span>
+    <br />
+    <span class="formLabel">Name:</span>
+    <input type="text" @bind="position.Name" />
+    <br />
+    <span class="formLabel">Description:</span>
+    <textarea rows="6" class="description-input" @bind="position.Description"></textarea>
+    <br />
+    <span class="formLabel">Start Date:</span>
+    <input type="date" @bind="startDateText" />
+    <br />
+    <span class="formLabel">Deadline:</span>
+    <input type="date" @bind="deadlineText" />
+    <br />
+    <span class="formLabel">Hired?:</span>
+    <input type="checkbox" @bind="position.Hired" />
+    <br />
+    <span class="formLabel">Client:</span>
+    <select @bind="position.IdClient">
+        @foreach (var client in clients)
+        {
+            <option value="@client.Id">@client.Name</option>
+        }
+    </select>
+    <br />
+    <span class="formLabel">Client Contact Name:</span>
+    <input type="text" @bind="position.ClientContactName" />
+    <br />
+    <span class="formLabel">Phone:</span>
+    <input type="text" @bind="position.ClientContactPhone" />
+    <br />
+    <span class="formLabel">Email:</span>
+    <input type="text" @bind="position.ClientContactEmail" />
+    <br />
+    @if (isEdit)
+    {
+        <button class="link-button" type="submit">Update</button>
+    }
+    else
+    {
+        <button class="link-button" type="submit">Insert</button>
+    }
+</form>
+
+@code {
+    [Parameter] public int? Id { get; set; }
+
+    private Position position = new();
+    private IReadOnlyList<Client> clients = [];
+    private bool isEdit;
+    private string? errorMessage;
+    private string startDateText = string.Empty;
+    private string deadlineText = string.Empty;
+
+    protected override async Task OnParametersSetAsync()
+    {
+        errorMessage = null;
+        isEdit = false;
+        position = new Position();
+        startDateText = string.Empty;
+        deadlineText = string.Empty;
+
+        try
+        {
+            clients = await Repository.GetClientsAsync(new ClientFilter());
+            position.IdClient = clients.FirstOrDefault()?.Id;
+
+            if (Id is not { } id)
+            {
+                return;
+            }
+
+            var existing = await Repository.GetPositionAsync(id);
+            if (existing is not null)
+            {
+                position = existing;
+                startDateText = ToDateInputValue(position.StartDate);
+                deadlineText = ToDateInputValue(position.Deadline);
+                isEdit = true;
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load position. " + ex.Message;
+        }
+    }
+
+    private async Task SaveAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            position.StartDate = ParseDate(startDateText);
+            position.Deadline = ParseDate(deadlineText);
+
+            if (isEdit)
+            {
+                if (await Repository.UpdatePositionAsync(position))
+                {
+                    await JS.InvokeVoidAsync("alert", "Position updated successfully");
+                }
+            }
+            else
+            {
+                position.Id = await Repository.InsertPositionAsync(position);
+                isEdit = true;
+                await JS.InvokeVoidAsync("alert", "Position added successfully");
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to save position. " + ex.Message;
+        }
+    }
+
+    private static string ToDateInputValue(DateTime? value) => value?.ToString("yyyy-MM-dd") ?? string.Empty;
+
+    private static DateTime? ParseDate(string value) =>
+        DateTime.TryParse(value, out var parsed) ? parsed.Date : null;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor
new file mode 100644
index 0000000000000000000000000000000000000000..efdcec61db320f36ea4b1bad176e604944be65e2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor
@@ -0,0 +1,88 @@
+@page "/positions"
+@page "/PositionsList"
+@page "/PositionsList.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+
+<PageTitle>Positions - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="ApplyFilter" @onsubmit:preventDefault>
+    <table class="legacy-table">
+        <thead>
+            <tr>
+                <th>Id</th>
+                <th>Name</th>
+                <th>Description</th>
+                <th>Start Date</th>
+                <th>Deadline</th>
+                <th>Position Closed</th>
+                <th>Client Contact</th>
+                <th></th>
+            </tr>
+            <tr>
+                <th><input type="text" @bind="filter.Id" /></th>
+                <th><input type="text" @bind="filter.Name" /></th>
+                <th><input type="text" @bind="filter.Description" /></th>
+                <th><input type="text" @bind="filter.StartDate" /></th>
+                <th><input type="text" @bind="filter.Deadline" /></th>
+                <th></th>
+                <th><input type="text" @bind="filter.ClientContact" /></th>
+                <th><button type="submit">Filter</button></th>
+            </tr>
+        </thead>
+        <tbody>
+            @foreach (var position in positions)
+            {
+                <tr>
+                    <td>@position.Id</td>
+                    <td>@position.Name</td>
+                    <td>@position.Description</td>
+                    <td>@position.StartDate</td>
+                    <td>@position.Deadline</td>
+                    <td>@position.Hired</td>
+                    <td>@position.ClientName (@position.ClientContactName)</td>
+                    <td><a href="positions/@position.Id">Details</a></td>
+                </tr>
+            }
+        </tbody>
+    </table>
+</form>
+
+<a href="positions/new">Add new position</a>
+
+@code {
+    private readonly PositionFilter filter = new();
+    private IReadOnlyList<Position> positions = [];
+    private string? errorMessage;
+
+    protected override async Task OnInitializedAsync()
+    {
+        await LoadPositionsAsync();
+    }
+
+    private async Task ApplyFilter()
+    {
+        await LoadPositionsAsync();
+    }
+
+    private async Task LoadPositionsAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            positions = await Repository.GetPositionsAsync(filter);
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load positions. " + ex.Message;
+            positions = [];
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/_Imports.razor b/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
index de2621323fafca41583fecc7d1b4b181a1e49ac1..4ca0297300bf206b5f4f4e3af4a8adffd1865970
--- a/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
@@ -5,6 +5,8 @@
 @using Microsoft.AspNetCore.Components.Web
 @using static Microsoft.AspNetCore.Components.Web.RenderMode
 @using Microsoft.AspNetCore.Components.Web.Virtualization
-@using Microsoft.JSInterop
-@using IRM.SPA
-@using IRM.SPA.Components
+@using Microsoft.JSInterop
+@using IRM.SPA
+@using IRM.SPA.Components
+@using IRM.SPA.Models
+@using IRM.SPA.Services
diff --git a/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs b/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
index 8a7b20c19addfd182712b09a487081eda45d085a..a1e19750167d74ae38221cb933beb102768676d5
--- a/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
+++ b/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
@@ -13,13 +13,14 @@
 {
     public static class DependancyInjector
     {
-        public static void RegisterServices(IServiceCollection services, ConfigurationOptions config)
-        {
-           
-
-            RegisterApiClients(services, config);           
-            RegisterModelValidators(services);
-        }
+        public static void RegisterServices(IServiceCollection services, ConfigurationOptions config)
+        {
+           
+
+            services.AddScoped<IHiringRepository, HiringRepository>();
+            RegisterApiClients(services, config);           
+            RegisterModelValidators(services);
+        }
        
         private static void RegisterModelValidators(IServiceCollection services)
         {
diff --git a/LegacyOutput/src/IRM.SPA/Models/Client.cs b/LegacyOutput/src/IRM.SPA/Models/Client.cs
new file mode 100644
index 0000000000000000000000000000000000000000..46bfecbc332bde56ebed47d21516d9a9c7773d42
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Client.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class Client
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Phone { get; set; } = string.Empty;
+    public string Email { get; set; } = string.Empty;
+    public string ContactName { get; set; } = string.Empty;
+    public string Website { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..d59d0bb30c1802c64fa28e40d6a449e156739081
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class ClientFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Phone { get; set; }
+    public string? Email { get; set; }
+    public string? Website { get; set; }
+    public string? ContactName { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/Position.cs b/LegacyOutput/src/IRM.SPA/Models/Position.cs
new file mode 100644
index 0000000000000000000000000000000000000000..a6f9543eebd29c5626ed28741e6b4065ad3d16cf
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Position.cs
@@ -0,0 +1,16 @@
+namespace IRM.SPA.Models;
+
+public sealed class Position
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Description { get; set; } = string.Empty;
+    public DateTime? StartDate { get; set; }
+    public DateTime? Deadline { get; set; }
+    public bool Hired { get; set; }
+    public int? IdClient { get; set; }
+    public string ClientName { get; set; } = string.Empty;
+    public string ClientContactName { get; set; } = string.Empty;
+    public string ClientContactPhone { get; set; } = string.Empty;
+    public string ClientContactEmail { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..cfa76e79d96580b7b4d98e9b476807ef6f12acb5
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class PositionFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Description { get; set; }
+    public string? StartDate { get; set; }
+    public string? Deadline { get; set; }
+    public string? ClientContact { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Program.cs b/LegacyOutput/src/IRM.SPA/Program.cs
index 00184fc283cd7060825796fd98e55be1c243edd6..2008eaa884f07089ce5823fe41c6a6336a34f709
--- a/LegacyOutput/src/IRM.SPA/Program.cs
+++ b/LegacyOutput/src/IRM.SPA/Program.cs
@@ -10,8 +10,9 @@
     {
         public static void Main(string[] args)
         {
-            var builder = WebApplication.CreateBuilder(args);
-            ConfigurationOptions config = builder.Configuration.Get<ConfigurationOptions>() ?? new ConfigurationOptions();
+            var builder = WebApplication.CreateBuilder(args);
+            AppDomain.CurrentDomain.SetData("DataDirectory", Path.Combine(builder.Environment.ContentRootPath, "App_Data"));
+            ConfigurationOptions config = builder.Configuration.Get<ConfigurationOptions>() ?? new ConfigurationOptions();
             // Add services to the container.
             builder.Services.AddRazorComponents()
                 .AddInteractiveServerComponents();           
diff --git a/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..1c88253e59d707a339e900e3d8c1a8b2d56950d2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
@@ -0,0 +1,268 @@
+using System.Data;
+using IRM.SPA.Models;
+using Microsoft.Data.SqlClient;
+
+namespace IRM.SPA.Services;
+
+public sealed class HiringRepository(IConfiguration configuration) : IHiringRepository
+{
+    private readonly string _connectionString = configuration.GetConnectionString("HiringConnection")
+        ?? throw new InvalidOperationException("ConnectionStrings:HiringConnection is not configured.");
+
+    public async Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Name", filter.Name);
+        AddLike(where, parameters, "Phone", filter.Phone);
+        AddLike(where, parameters, "Email", filter.Email);
+        AddLike(where, parameters, "Website", filter.Website);
+        AddLike(where, parameters, "ContactName", filter.ContactName);
+
+        var sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients";
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var clients = new List<Client>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            clients.Add(ReadClient(reader));
+        }
+
+        return clients;
+    }
+
+    public async Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients WHERE Id = @Id";
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadClient(reader) : null;
+    }
+
+    public async Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Clients (Name, Phone, Email, ContactName, Website)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Phone, @Email, @ContactName, @Website)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Clients
+            SET Name = @Name, Phone = @Phone, Email = @Email, ContactName = @ContactName, Website = @Website
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = client.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    public async Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Positions.Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Positions.Name", filter.Name, "@Name");
+        AddLike(where, parameters, "Positions.Description", filter.Description, "@Description");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.StartDate, 120)", filter.StartDate, "@StartDate");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.Deadline, 120)", filter.Deadline, "@Deadline");
+        AddLike(where, parameters, "Positions.ClientContactName", filter.ClientContact, "@ClientContact");
+
+        var sql = """
+            SELECT Positions.Id, Positions.Name, Positions.Description, Positions.StartDate, Positions.Deadline,
+                   Positions.Hired, Positions.IdClient, Positions.ClientContactName, Positions.ClientContactPhone,
+                   Positions.ClientContactEmail, Clients.Name AS ClientName
+            FROM Positions
+            LEFT JOIN Clients ON Positions.IdClient = Clients.Id
+            """;
+
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Positions.Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var positions = new List<Position>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            positions.Add(ReadPosition(reader, includeClientName: true));
+        }
+
+        return positions;
+    }
+
+    public async Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            SELECT Id, Name, Description, StartDate, Deadline, Hired, IdClient,
+                   ClientContactName, ClientContactPhone, ClientContactEmail
+            FROM Positions
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadPosition(reader, includeClientName: false) : null;
+    }
+
+    public async Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Positions (Name, Description, StartDate, Deadline, Hired, ClientContactName,
+                                   ClientContactPhone, ClientContactEmail, IdClient)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Description, @StartDate, @Deadline, @Hired, @ClientContactName,
+                    @ClientContactPhone, @ClientContactEmail, @IdClient)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Positions
+            SET Name = @Name, Description = @Description, StartDate = @StartDate, Deadline = @Deadline,
+                Hired = @Hired, ClientContactName = @ClientContactName, ClientContactPhone = @ClientContactPhone,
+                ClientContactEmail = @ClientContactEmail, IdClient = @IdClient
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = position.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    private SqlConnection CreateConnection() => new(_connectionString);
+
+    private static void AddClientParameters(SqlCommand command, Client client)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = client.Name;
+        command.Parameters.Add("@Phone", SqlDbType.VarChar).Value = client.Phone;
+        command.Parameters.Add("@Email", SqlDbType.VarChar).Value = client.Email;
+        command.Parameters.Add("@ContactName", SqlDbType.VarChar).Value = client.ContactName;
+        command.Parameters.Add("@Website", SqlDbType.VarChar).Value = client.Website;
+    }
+
+    private static void AddPositionParameters(SqlCommand command, Position position, bool includeClient)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = position.Name;
+        command.Parameters.Add("@Description", SqlDbType.VarChar).Value = position.Description;
+        command.Parameters.Add("@StartDate", SqlDbType.Date).Value = (object?)position.StartDate ?? DBNull.Value;
+        command.Parameters.Add("@Deadline", SqlDbType.Date).Value = (object?)position.Deadline ?? DBNull.Value;
+        command.Parameters.Add("@Hired", SqlDbType.Bit).Value = position.Hired;
+        command.Parameters.Add("@ClientContactName", SqlDbType.VarChar).Value = position.ClientContactName;
+        command.Parameters.Add("@ClientContactPhone", SqlDbType.VarChar).Value = position.ClientContactPhone;
+        command.Parameters.Add("@ClientContactEmail", SqlDbType.VarChar).Value = position.ClientContactEmail;
+        if (includeClient)
+        {
+            command.Parameters.Add("@IdClient", SqlDbType.Int).Value = (object?)position.IdClient ?? DBNull.Value;
+        }
+    }
+
+    private static void AddLike(List<string> where, List<SqlParameter> parameters, string column, string? value, string? parameterName = null)
+    {
+        if (string.IsNullOrWhiteSpace(value))
+        {
+            return;
+        }
+
+        parameterName ??= "@" + column.Replace(".", string.Empty);
+        where.Add($"{column} LIKE {parameterName}");
+        parameters.Add(new SqlParameter(parameterName, SqlDbType.VarChar) { Value = "%" + value.Trim() + "%" });
+    }
+
+    private static Client ReadClient(SqlDataReader reader) => new()
+    {
+        Id = reader.GetInt32(0),
+        Name = GetString(reader, 1),
+        Phone = GetString(reader, 2),
+        Email = GetString(reader, 3),
+        ContactName = GetString(reader, 4),
+        Website = GetString(reader, 5)
+    };
+
+    private static Position ReadPosition(SqlDataReader reader, bool includeClientName)
+    {
+        var position = new Position
+        {
+            Id = reader.GetInt32(0),
+            Name = GetString(reader, 1),
+            Description = GetString(reader, 2),
+            StartDate = reader.IsDBNull(3) ? null : reader.GetDateTime(3),
+            Deadline = reader.IsDBNull(4) ? null : reader.GetDateTime(4),
+            Hired = !reader.IsDBNull(5) && reader.GetBoolean(5),
+            IdClient = reader.IsDBNull(6) ? null : reader.GetInt32(6),
+            ClientContactName = GetString(reader, 7),
+            ClientContactPhone = GetString(reader, 8),
+            ClientContactEmail = GetString(reader, 9)
+        };
+
+        if (includeClientName)
+        {
+            position.ClientName = GetString(reader, 10);
+        }
+
+        return position;
+    }
+
+    private static string GetString(SqlDataReader reader, int ordinal) =>
+        reader.IsDBNull(ordinal) ? string.Empty : reader.GetString(ordinal);
+}
diff --git a/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..468316298ba01ef622db9ffeeb20a3df775fc996
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
@@ -0,0 +1,15 @@
+using IRM.SPA.Models;
+
+namespace IRM.SPA.Services;
+
+public interface IHiringRepository
+{
+    Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default);
+    Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default);
+    Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default);
+    Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default);
+}
diff --git a/LegacyOutput/src/IRM.SPA/wwwroot/app.css b/LegacyOutput/src/IRM.SPA/wwwroot/app.css
index 7ac30e2a8df7ef2e3f233e331d1d58ca449099d8..c4e3f519ac693dd5c0ee569dc7dae70aa51945dc
--- a/LegacyOutput/src/IRM.SPA/wwwroot/app.css
+++ b/LegacyOutput/src/IRM.SPA/wwwroot/app.css
@@ -1,51 +1,247 @@
-html, body {
-    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
-}
-
-a, .btn-link {
-    color: #006bb7;
-}
-
-.btn-primary {
-    color: #fff;
-    background-color: #1b6ec2;
-    border-color: #1861ac;
-}
-
-.btn:focus, .btn:active:focus, .btn-link.nav-link:focus, .form-control:focus, .form-check-input:focus {
-  box-shadow: 0 0 0 0.1rem white, 0 0 0 0.25rem #258cfb;
-}
-
-.content {
-    padding-top: 1.1rem;
-}
-
-h1:focus {
-    outline: none;
-}
-
-.valid.modified:not([type=checkbox]) {
-    outline: 1px solid #26b050;
-}
-
-.invalid {
-    outline: 1px solid #e50000;
-}
-
-.validation-message {
-    color: #e50000;
-}
-
-.blazor-error-boundary {
-    background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNDkiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIG92ZXJmbG93PSJoaWRkZW4iPjxkZWZzPjxjbGlwUGF0aCBpZD0iY2xpcDAiPjxyZWN0IHg9IjIzNSIgeT0iNTEiIHdpZHRoPSI1NiIgaGVpZ2h0PSI0OSIvPjwvY2xpcFBhdGg+PC9kZWZzPjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMCkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yMzUgLTUxKSI+PHBhdGggZD0iTTI2My41MDYgNTFDMjY0LjcxNyA1MSAyNjUuODEzIDUxLjQ4MzcgMjY2LjYwNiA1Mi4yNjU4TDI2Ny4wNTIgNTIuNzk4NyAyNjcuNTM5IDUzLjYyODMgMjkwLjE4NSA5Mi4xODMxIDI5MC41NDUgOTIuNzk1IDI5MC42NTYgOTIuOTk2QzI5MC44NzcgOTMuNTEzIDI5MSA5NC4wODE1IDI5MSA5NC42NzgyIDI5MSA5Ny4wNjUxIDI4OS4wMzggOTkgMjg2LjYxNyA5OUwyNDAuMzgzIDk5QzIzNy45NjMgOTkgMjM2IDk3LjA2NTEgMjM2IDk0LjY3ODIgMjM2IDk0LjM3OTkgMjM2LjAzMSA5NC4wODg2IDIzNi4wODkgOTMuODA3MkwyMzYuMzM4IDkzLjAxNjIgMjM2Ljg1OCA5Mi4xMzE0IDI1OS40NzMgNTMuNjI5NCAyNTkuOTYxIDUyLjc5ODUgMjYwLjQwNyA1Mi4yNjU4QzI2MS4yIDUxLjQ4MzcgMjYyLjI5NiA1MSAyNjMuNTA2IDUxWk0yNjMuNTg2IDY2LjAxODNDMjYwLjczNyA2Ni4wMTgzIDI1OS4zMTMgNjcuMTI0NSAyNTkuMzEzIDY5LjMzNyAyNTkuMzEzIDY5LjYxMDIgMjU5LjMzMiA2OS44NjA4IDI1OS4zNzEgNzAuMDg4N0wyNjEuNzk1IDg0LjAxNjEgMjY1LjM4IDg0LjAxNjEgMjY3LjgyMSA2OS43NDc1QzI2Ny44NiA2OS43MzA5IDI2Ny44NzkgNjkuNTg3NyAyNjcuODc5IDY5LjMxNzkgMjY3Ljg3OSA2Ny4xMTgyIDI2Ni40NDggNjYuMDE4MyAyNjMuNTg2IDY2LjAxODNaTTI2My41NzYgODYuMDU0N0MyNjEuMDQ5IDg2LjA1NDcgMjU5Ljc4NiA4Ny4zMDA1IDI1OS43ODYgODkuNzkyMSAyNTkuNzg2IDkyLjI4MzcgMjYxLjA0OSA5My41Mjk1IDI2My41NzYgOTMuNTI5NSAyNjYuMTE2IDkzLjUyOTUgMjY3LjM4NyA5Mi4yODM3IDI2Ny4zODcgODkuNzkyMSAyNjcuMzg3IDg3LjMwMDUgMjY2LjExNiA4Ni4wNTQ3IDI2My41NzYgODYuMDU0N1oiIGZpbGw9IiNGRkU1MDAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48L3N2Zz4=) no-repeat 1rem/1.8rem, #b32121;
-    padding: 1rem 1rem 1rem 3.7rem;
-    color: white;
-}
-
-    .blazor-error-boundary::after {
-        content: "An error has occurred."
-    }
-
-.darker-border-checkbox.form-check-input {
-    border-color: #929292;
-}
+html,
+body {
+    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
+}
+
+body {
+    padding-top: 50px;
+    padding-bottom: 20px;
+}
+
+.body-content {
+    padding-left: 15px;
+    padding-right: 15px;
+}
+
+.dl-horizontal dt {
+    white-space: normal;
+}
+
+input[type="text"],
+input[type="password"],
+input[type="email"],
+input[type="tel"],
+input[type="select"] {
+    max-width: 280px;
+}
+
+.jumbotron {
+    padding: 30px;
+    margin-bottom: 30px;
+    color: inherit;
+    background-color: #eee;
+    border-radius: 6px;
+}
+
+.jumbotron h1 {
+    font-size: 63px;
+}
+
+.lead {
+    margin-bottom: 20px;
+    font-size: 21px;
+    font-weight: 300;
+    line-height: 1.4;
+}
+
+.navbar-inverse {
+    background-color: #222;
+    border-color: #080808;
+}
+
+.navbar-fixed-top {
+    position: fixed;
+    right: 0;
+    left: 0;
+    z-index: 1030;
+    top: 0;
+    border-width: 0 0 1px;
+}
+
+.navbar {
+    min-height: 50px;
+    margin-bottom: 20px;
+    border: 1px solid transparent;
+}
+
+.navbar-header {
+    float: left;
+}
+
+.navbar-brand {
+    float: left;
+    height: 50px;
+    padding: 15px;
+    font-size: 18px;
+    line-height: 20px;
+}
+
+.navbar-inverse .navbar-brand,
+.navbar-inverse .navbar-nav > li > a {
+    color: #9d9d9d;
+}
+
+.navbar-inverse .navbar-brand:hover,
+.navbar-inverse .navbar-nav > li > a:hover,
+.navbar-inverse .navbar-nav > li > a.active {
+    color: #fff;
+    text-decoration: none;
+}
+
+.navbar-nav {
+    float: left;
+    margin: 0;
+}
+
+.nav > li {
+    position: relative;
+    display: block;
+}
+
+.navbar-nav > li {
+    float: left;
+}
+
+.nav > li > a {
+    position: relative;
+    display: block;
+    padding: 10px 15px;
+}
+
+.navbar-nav > li > a {
+    padding-top: 15px;
+    padding-bottom: 15px;
+    line-height: 20px;
+}
+
+.btn-default {
+    color: #333;
+    background-color: #fff;
+    border-color: #ccc;
+}
+
+.btn {
+    display: inline-block;
+    padding: 6px 12px;
+    margin-bottom: 0;
+    font-size: 14px;
+    font-weight: 400;
+    line-height: 1.42857143;
+    text-align: center;
+    white-space: nowrap;
+    vertical-align: middle;
+    cursor: pointer;
+    border: 1px solid transparent;
+    border-radius: 4px;
+}
+
+.formLabel {
+    display: inline-block;
+    width: 200px;
+}
+
+.legacy-table {
+    margin-top: 20px;
+    margin-bottom: 10px;
+    border-collapse: separate;
+    border-spacing: 2px;
+}
+
+.legacy-table th,
+.legacy-table td {
+    padding: 1px;
+    font-weight: normal;
+    text-align: left;
+    vertical-align: top;
+}
+
+.legacy-table th {
+    font-weight: bold;
+}
+
+.legacy-table input[type="text"] {
+    width: 130px;
+}
+
+.description-input {
+    width: 500px;
+    max-width: 100%;
+    vertical-align: top;
+}
+
+.link-button {
+    padding: 0;
+    color: #337ab7;
+    background: none;
+    border: 0;
+    cursor: pointer;
+    font: inherit;
+}
+
+.link-button:hover {
+    color: #23527c;
+    text-decoration: underline;
+}
+
+.alert {
+    padding: 15px;
+    margin-top: 20px;
+    margin-bottom: 20px;
+    border: 1px solid transparent;
+    border-radius: 4px;
+}
+
+.alert-danger {
+    color: #a94442;
+    background-color: #f2dede;
+    border-color: #ebccd1;
+}
+
+@media screen and (min-width: 768px) {
+    .jumbotron {
+        margin-top: 20px;
+    }
+
+    .body-content {
+        padding: 0;
+    }
+}
+
+@media screen and (max-width: 767px) {
+    .navbar-header,
+    .navbar-nav,
+    .navbar-nav > li {
+        float: none;
+    }
+
+    .navbar-fixed-top {
+        position: static;
+    }
+
+    body {
+        padding-top: 0;
+    }
+
+    .jumbotron h1 {
+        font-size: 42px;
+    }
+}
+
+#blazor-error-ui {
+    background: lightyellow;
+    bottom: 0;
+    box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.2);
+    display: none;
+    left: 0;
+    padding: 0.6rem 1.25rem 0.7rem 1.25rem;
+    position: fixed;
+    width: 100%;
+    z-index: 1000;
+}
+
+#blazor-error-ui .dismiss {
+    cursor: pointer;
+    position: absolute;
+    right: 0.75rem;
+    top: 0.5rem;
+}

codex
The migrated UI files are in place. I’m copying the legacy LocalDB files into the target app’s `App_Data` and then running a build to catch Razor/C# issues.
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "New-Item -ItemType Directory -Force App_Data | Out-Null; Copy-Item \"D:\\Projects\\AI\\WebFormsMigrationDemo\\Source\\HiringTrackingSite\\App_Data\\HiringDb.mdf\" App_Data\\HiringDb.mdf -Force; Copy-Item \"D:\\Projects\\AI\\WebFormsMigrationDemo\\Source\\HiringTrackingSite\\App_Data\\HiringDb_log.ldf\" App_Data\\HiringDb_log.ldf -Force; Get-ChildItem App_Data" in D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'dotnet build IRM.SPA.csproj' in D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA
 succeeded in 1060ms:


    Directory: D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\App_Data


Mode                 LastWriteTime         Length Name                                                                 
----                 -------------         ------ ----                                                                 
-a----          7/1/2026   6:06 PM        8388608 HiringDb.mdf                                                         
-a----          7/1/2026   6:06 PM        8388608 HiringDb_log.ldf                                                     



 exited 1 in 7127ms:
  Determining projects to restore...
  Restored D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\IRM.SPA.csproj (in 1.86 sec).
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Pages\PositionDetails.razor(29,31): error CS1503: Argument 1: cannot convert from 'string' to 'System.DateTime' [D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\IRM.SPA.csproj]
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\obj\Debug\net8.0\Microsoft.CodeAnalysis.Razor.Compiler\Microsoft.NET.Sdk.Razor.SourceGenerators.RazorSourceGenerator\Components\Pages\PositionDetails_razor.g.cs(237,160): error CS0029: Cannot implicitly convert type 'System.TimeOnly?' to 'string' [D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\IRM.SPA.csproj]
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Pages\PositionDetails.razor(32,31): error CS1503: Argument 1: cannot convert from 'string' to 'System.DateTime' [D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\IRM.SPA.csproj]
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\obj\Debug\net8.0\Microsoft.CodeAnalysis.Razor.Compiler\Microsoft.NET.Sdk.Razor.SourceGenerators.RazorSourceGenerator\Components\Pages\PositionDetails_razor.g.cs(253,159): error CS0029: Cannot implicitly convert type 'System.TimeOnly?' to 'string' [D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\IRM.SPA.csproj]

Build FAILED.

D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Pages\PositionDetails.razor(29,31): error CS1503: Argument 1: cannot convert from 'string' to 'System.DateTime' [D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\IRM.SPA.csproj]
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\obj\Debug\net8.0\Microsoft.CodeAnalysis.Razor.Compiler\Microsoft.NET.Sdk.Razor.SourceGenerators.RazorSourceGenerator\Components\Pages\PositionDetails_razor.g.cs(237,160): error CS0029: Cannot implicitly convert type 'System.TimeOnly?' to 'string' [D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\IRM.SPA.csproj]
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Pages\PositionDetails.razor(32,31): error CS1503: Argument 1: cannot convert from 'string' to 'System.DateTime' [D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\IRM.SPA.csproj]
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\obj\Debug\net8.0\Microsoft.CodeAnalysis.Razor.Compiler\Microsoft.NET.Sdk.Razor.SourceGenerators.RazorSourceGenerator\Components\Pages\PositionDetails_razor.g.cs(253,159): error CS0029: Cannot implicitly convert type 'System.TimeOnly?' to 'string' [D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\IRM.SPA.csproj]
    0 Warning(s)
    4 Error(s)

Time Elapsed 00:00:06.12

2026-07-01T14:24:44.908099Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 7.1 seconds
Output:
  Determining projects to restore...
  Restored D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\IRM.SPA.csproj (in 1.86 sec).
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Pages\PositionDetails.razor(29,31): error CS1503: Argument 1: cannot convert from 'string' to 'System.DateTime' [D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\IRM.SPA.csproj]
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\obj\Debug\net8.0\Microsoft.CodeAnalysis.Razor.Compiler\Microsoft.NET.Sdk.Razor.SourceGenerators.RazorSourceGenerator\Components\Pages\PositionDetails_razor.g.cs(237,160): error CS0029: Cannot implicitly convert type 'System.TimeOnly?' to 'string' [D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\IRM.SPA.csproj]
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Pages\PositionDetails.razor(32,31): error CS1503: Argument 1: cannot convert from 'string' to 'System.DateTime' [D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\IRM.SPA.csproj]
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\obj\Debug\net8.0\Microsoft.CodeAnalysis.Razor.Compiler\Microsoft.NET.Sdk.Razor.SourceGenerators.RazorSourceGenerator\Components\Pages\PositionDetails_razor.g.cs(253,159): error CS0029: Cannot implicitly convert type 'System.TimeOnly?' to 'string' [D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\IRM.SPA.csproj]

Build FAILED.

D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Pages\PositionDetails.razor(29,31): error CS1503: Argument 1: cannot convert from 'string' to 'System.DateTime' [D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\IRM.SPA.csproj]
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\obj\Debug\net8.0\Microsoft.CodeAnalysis.Razor.Compiler\Microsoft.NET.Sdk.Razor.SourceGenerators.RazorSourceGenerator\Components\Pages\PositionDetails_razor.g.cs(237,160): error CS0029: Cannot implicitly convert type 'System.TimeOnly?' to 'string' [D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\IRM.SPA.csproj]
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Pages\PositionDetails.razor(32,31): error CS1503: Argument 1: cannot convert from 'string' to 'System.DateTime' [D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\IRM.SPA.csproj]
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\obj\Debug\net8.0\Microsoft.CodeAnalysis.Razor.Compiler\Microsoft.NET.Sdk.Razor.SourceGenerators.RazorSourceGenerator\Components\Pages\PositionDetails_razor.g.cs(253,159): error CS0029: Cannot implicitly convert type 'System.TimeOnly?' to 'string' [D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\IRM.SPA.csproj]
    0 Warning(s)
    4 Error(s)

Time Elapsed 00:00:06.12

diff --git a/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor b/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
index 62e62873d628af7e91de98824e1143460b2db2a0..a9714ae63155375bce0d34f8e2a2cda4c6cfbeeb
--- a/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
@@ -1,23 +1,30 @@
-﻿@inherits LayoutComponentBase
-
-<div class="page">
-    <div class="sidebar">
-        <NavMenu />
-    </div>
-
-    <main>
-        <div class="top-row px-4">
-            <a href="https://learn.microsoft.com/aspnet/core/" target="_blank">About</a>
-        </div>
-
-        <article class="content px-4">
-            @Body
-        </article>
-    </main>
-</div>
-
-<div id="blazor-error-ui">
-    An unhandled error has occurred.
-    <a href="" class="reload">Reload</a>
-    <a class="dismiss">🗙</a>
-</div>
+@inherits LayoutComponentBase
+
+<div class="navbar navbar-inverse navbar-fixed-top">
+    <div class="container">
+        <div class="navbar-header">
+            <a class="navbar-brand" href="/">Hiring Tracker</a>
+        </div>
+        <div class="navbar-collapse collapse">
+            <ul class="nav navbar-nav">
+                <li><NavLink href="/" Match="NavLinkMatch.All">Home</NavLink></li>
+                <li><NavLink href="clients">Clients</NavLink></li>
+                <li><NavLink href="positions">Positions</NavLink></li>
+            </ul>
+        </div>
+    </div>
+</div>
+
+<div class="container body-content">
+    @Body
+    <hr />
+    <footer>
+        <p>&copy; @DateTime.Now.Year - Hiring Tracker</p>
+    </footer>
+</div>
+
+<div id="blazor-error-ui">
+    An unhandled error has occurred.
+    <a href="" class="reload">Reload</a>
+    <a class="dismiss">x</a>
+</div>
diff --git a/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor b/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
index 259e68b4bc97ef9ecc0b3899dc192d7790fd9b4c..c765fe7b74acb5c30b228509af2a8a6e6e1bf3c6
--- a/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
@@ -1,30 +1 @@
-﻿<div class="top-row ps-3 navbar navbar-dark">
-    <div class="container-fluid">
-        <a class="navbar-brand" href="">IRM.SPA</a>
-    </div>
-</div>
-
-<input type="checkbox" title="Navigation menu" class="navbar-toggler" />
-
-<div class="nav-scrollable" onclick="document.querySelector('.navbar-toggler').click()">
-    <nav class="flex-column">
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="" Match="NavLinkMatch.All">
-                <span class="bi bi-house-door-fill-nav-menu" aria-hidden="true"></span> Home
-            </NavLink>
-        </div>
-
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="counter">
-                <span class="bi bi-plus-square-fill-nav-menu" aria-hidden="true"></span> Counter
-            </NavLink>
-        </div>
-
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="weather">
-                <span class="bi bi-list-nested-nav-menu" aria-hidden="true"></span> Weather
-            </NavLink>
-        </div>
-    </nav>
-</div>
-
+@* Navigation is defined in MainLayout to match the legacy Site.Master markup. *@
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor
new file mode 100644
index 0000000000000000000000000000000000000000..1232eae426ef2325a0505f006805d6a05ba6115e
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor
@@ -0,0 +1,104 @@
+@page "/clients/new"
+@page "/clients/{Id:int}"
+@page "/ClientDetails"
+@page "/ClientDetails.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+@inject IJSRuntime JS
+
+<PageTitle>Client Details - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="SaveAsync" @onsubmit:preventDefault>
+    <span class="formLabel">Id:</span>
+    <span>@(client.Id == 0 ? string.Empty : client.Id)</span>
+    <br />
+    <span class="formLabel">Name:</span>
+    <input type="text" @bind="client.Name" />
+    <br />
+    <span class="formLabel">Phone:</span>
+    <input type="text" @bind="client.Phone" />
+    <br />
+    <span class="formLabel">Email:</span>
+    <input type="text" @bind="client.Email" />
+    <br />
+    <span class="formLabel">Contact Name:</span>
+    <input type="text" @bind="client.ContactName" />
+    <br />
+    <span class="formLabel">Website:</span>
+    <input type="text" @bind="client.Website" />
+    <br />
+    @if (isEdit)
+    {
+        <button class="link-button" type="submit">Update</button>
+    }
+    else
+    {
+        <button class="link-button" type="submit">Insert</button>
+    }
+</form>
+
+@code {
+    [Parameter] public int? Id { get; set; }
+
+    private Client client = new();
+    private bool isEdit;
+    private string? errorMessage;
+
+    protected override async Task OnParametersSetAsync()
+    {
+        errorMessage = null;
+        isEdit = false;
+        client = new Client();
+
+        if (Id is not { } id)
+        {
+            return;
+        }
+
+        try
+        {
+            var existing = await Repository.GetClientAsync(id);
+            if (existing is not null)
+            {
+                client = existing;
+                isEdit = true;
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load client. " + ex.Message;
+        }
+    }
+
+    private async Task SaveAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            if (isEdit)
+            {
+                if (await Repository.UpdateClientAsync(client))
+                {
+                    await JS.InvokeVoidAsync("alert", "Client updated successfully");
+                }
+            }
+            else
+            {
+                client.Id = await Repository.InsertClientAsync(client);
+                isEdit = true;
+                await JS.InvokeVoidAsync("alert", "Client added successfully");
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to save client. " + ex.Message;
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor
new file mode 100644
index 0000000000000000000000000000000000000000..774521377b61d400b5e79c84a3304d20b83878b3
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor
@@ -0,0 +1,85 @@
+@page "/clients"
+@page "/ClientsList"
+@page "/ClientsList.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+
+<PageTitle>Clients - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="ApplyFilter" @onsubmit:preventDefault>
+    <table class="legacy-table">
+        <thead>
+            <tr>
+                <th>Id</th>
+                <th>Client Name</th>
+                <th>Phone</th>
+                <th>Email</th>
+                <th>Website</th>
+                <th>Contact Name</th>
+                <th></th>
+            </tr>
+            <tr>
+                <th><input type="text" @bind="filter.Id" /></th>
+                <th><input type="text" @bind="filter.Name" /></th>
+                <th><input type="text" @bind="filter.Phone" /></th>
+                <th><input type="text" @bind="filter.Email" /></th>
+                <th><input type="text" @bind="filter.Website" /></th>
+                <th><input type="text" @bind="filter.ContactName" /></th>
+                <th><button type="submit">Filter</button></th>
+            </tr>
+        </thead>
+        <tbody>
+            @foreach (var client in clients)
+            {
+                <tr>
+                    <td>@client.Id</td>
+                    <td>@client.Name</td>
+                    <td>@client.Phone</td>
+                    <td>@client.Email</td>
+                    <td>@client.Website</td>
+                    <td>@client.ContactName</td>
+                    <td><a href="clients/@client.Id">Details</a></td>
+                </tr>
+            }
+        </tbody>
+    </table>
+</form>
+
+<a href="clients/new">Add new client</a>
+
+@code {
+    private readonly ClientFilter filter = new();
+    private IReadOnlyList<Client> clients = [];
+    private string? errorMessage;
+
+    protected override async Task OnInitializedAsync()
+    {
+        await LoadClientsAsync();
+    }
+
+    private async Task ApplyFilter()
+    {
+        await LoadClientsAsync();
+    }
+
+    private async Task LoadClientsAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            clients = await Repository.GetClientsAsync(filter);
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load clients. " + ex.Message;
+            clients = [];
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
index df0502354fdfbbef85e1673ffcff56d85d2481bf..e4fbd72369d329a04d4cead6939579592e284c3d
--- a/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
@@ -1,7 +1,26 @@
-﻿@page "/"
-
-<PageTitle>Home</PageTitle>
-
-<h1>Hello, world!</h1>
-
-Welcome to your new app.
+@page "/"
+@page "/Default.aspx"
+
+<PageTitle>Home Page - Hiring Tracker</PageTitle>
+
+<div class="jumbotron">
+    <h1>Hiring Tracking</h1>
+    <p class="lead">Track positions and candidates.</p>
+</div>
+
+<div class="row">
+    <div class="col-md-4">
+        <h2>Positions</h2>
+        <p>View open positions or query previous hires.</p>
+        <p>
+            <a class="btn btn-default" href="positions">View</a>
+        </p>
+    </div>
+    <div class="col-md-4">
+        <h2>Clients</h2>
+        <p>Manage contacts requesting the positions.</p>
+        <p>
+            <a class="btn btn-default" href="clients">View</a>
+        </p>
+    </div>
+</div>
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor
new file mode 100644
index 0000000000000000000000000000000000000000..e0d3014b542dc83cf4f5709a90472cf1a58e9deb
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor
@@ -0,0 +1,139 @@
+@page "/positions/new"
+@page "/positions/{Id:int}"
+@page "/PositionDetails"
+@page "/PositionDetails.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+@inject IJSRuntime JS
+
+<PageTitle>Position Details - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="SaveAsync" @onsubmit:preventDefault>
+    <span class="formLabel">Id:</span>
+    <span>@(position.Id == 0 ? string.Empty : position.Id)</span>
+    <br />
+    <span class="formLabel">Name:</span>
+    <input type="text" @bind="position.Name" />
+    <br />
+    <span class="formLabel">Description:</span>
+    <textarea rows="6" class="description-input" @bind="position.Description"></textarea>
+    <br />
+    <span class="formLabel">Start Date:</span>
+    <input type="date" @bind="startDateText" />
+    <br />
+    <span class="formLabel">Deadline:</span>
+    <input type="date" @bind="deadlineText" />
+    <br />
+    <span class="formLabel">Hired?:</span>
+    <input type="checkbox" @bind="position.Hired" />
+    <br />
+    <span class="formLabel">Client:</span>
+    <select @bind="position.IdClient">
+        @foreach (var client in clients)
+        {
+            <option value="@client.Id">@client.Name</option>
+        }
+    </select>
+    <br />
+    <span class="formLabel">Client Contact Name:</span>
+    <input type="text" @bind="position.ClientContactName" />
+    <br />
+    <span class="formLabel">Phone:</span>
+    <input type="text" @bind="position.ClientContactPhone" />
+    <br />
+    <span class="formLabel">Email:</span>
+    <input type="text" @bind="position.ClientContactEmail" />
+    <br />
+    @if (isEdit)
+    {
+        <button class="link-button" type="submit">Update</button>
+    }
+    else
+    {
+        <button class="link-button" type="submit">Insert</button>
+    }
+</form>
+
+@code {
+    [Parameter] public int? Id { get; set; }
+
+    private Position position = new();
+    private IReadOnlyList<Client> clients = [];
+    private bool isEdit;
+    private string? errorMessage;
+    private string startDateText = string.Empty;
+    private string deadlineText = string.Empty;
+
+    protected override async Task OnParametersSetAsync()
+    {
+        errorMessage = null;
+        isEdit = false;
+        position = new Position();
+        startDateText = string.Empty;
+        deadlineText = string.Empty;
+
+        try
+        {
+            clients = await Repository.GetClientsAsync(new ClientFilter());
+            position.IdClient = clients.FirstOrDefault()?.Id;
+
+            if (Id is not { } id)
+            {
+                return;
+            }
+
+            var existing = await Repository.GetPositionAsync(id);
+            if (existing is not null)
+            {
+                position = existing;
+                startDateText = ToDateInputValue(position.StartDate);
+                deadlineText = ToDateInputValue(position.Deadline);
+                isEdit = true;
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load position. " + ex.Message;
+        }
+    }
+
+    private async Task SaveAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            position.StartDate = ParseDate(startDateText);
+            position.Deadline = ParseDate(deadlineText);
+
+            if (isEdit)
+            {
+                if (await Repository.UpdatePositionAsync(position))
+                {
+                    await JS.InvokeVoidAsync("alert", "Position updated successfully");
+                }
+            }
+            else
+            {
+                position.Id = await Repository.InsertPositionAsync(position);
+                isEdit = true;
+                await JS.InvokeVoidAsync("alert", "Position added successfully");
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to save position. " + ex.Message;
+        }
+    }
+
+    private static string ToDateInputValue(DateTime? value) => value?.ToString("yyyy-MM-dd") ?? string.Empty;
+
+    private static DateTime? ParseDate(string value) =>
+        DateTime.TryParse(value, out var parsed) ? parsed.Date : null;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor
new file mode 100644
index 0000000000000000000000000000000000000000..efdcec61db320f36ea4b1bad176e604944be65e2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor
@@ -0,0 +1,88 @@
+@page "/positions"
+@page "/PositionsList"
+@page "/PositionsList.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+
+<PageTitle>Positions - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="ApplyFilter" @onsubmit:preventDefault>
+    <table class="legacy-table">
+        <thead>
+            <tr>
+                <th>Id</th>
+                <th>Name</th>
+                <th>Description</th>
+                <th>Start Date</th>
+                <th>Deadline</th>
+                <th>Position Closed</th>
+                <th>Client Contact</th>
+                <th></th>
+            </tr>
+            <tr>
+                <th><input type="text" @bind="filter.Id" /></th>
+                <th><input type="text" @bind="filter.Name" /></th>
+                <th><input type="text" @bind="filter.Description" /></th>
+                <th><input type="text" @bind="filter.StartDate" /></th>
+                <th><input type="text" @bind="filter.Deadline" /></th>
+                <th></th>
+                <th><input type="text" @bind="filter.ClientContact" /></th>
+                <th><button type="submit">Filter</button></th>
+            </tr>
+        </thead>
+        <tbody>
+            @foreach (var position in positions)
+            {
+                <tr>
+                    <td>@position.Id</td>
+                    <td>@position.Name</td>
+                    <td>@position.Description</td>
+                    <td>@position.StartDate</td>
+                    <td>@position.Deadline</td>
+                    <td>@position.Hired</td>
+                    <td>@position.ClientName (@position.ClientContactName)</td>
+                    <td><a href="positions/@position.Id">Details</a></td>
+                </tr>
+            }
+        </tbody>
+    </table>
+</form>
+
+<a href="positions/new">Add new position</a>
+
+@code {
+    private readonly PositionFilter filter = new();
+    private IReadOnlyList<Position> positions = [];
+    private string? errorMessage;
+
+    protected override async Task OnInitializedAsync()
+    {
+        await LoadPositionsAsync();
+    }
+
+    private async Task ApplyFilter()
+    {
+        await LoadPositionsAsync();
+    }
+
+    private async Task LoadPositionsAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            positions = await Repository.GetPositionsAsync(filter);
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load positions. " + ex.Message;
+            positions = [];
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/_Imports.razor b/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
index de2621323fafca41583fecc7d1b4b181a1e49ac1..4ca0297300bf206b5f4f4e3af4a8adffd1865970
--- a/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
@@ -5,6 +5,8 @@
 @using Microsoft.AspNetCore.Components.Web
 @using static Microsoft.AspNetCore.Components.Web.RenderMode
 @using Microsoft.AspNetCore.Components.Web.Virtualization
-@using Microsoft.JSInterop
-@using IRM.SPA
-@using IRM.SPA.Components
+@using Microsoft.JSInterop
+@using IRM.SPA
+@using IRM.SPA.Components
+@using IRM.SPA.Models
+@using IRM.SPA.Services
diff --git a/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs b/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
index 8a7b20c19addfd182712b09a487081eda45d085a..a1e19750167d74ae38221cb933beb102768676d5
--- a/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
+++ b/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
@@ -13,13 +13,14 @@
 {
     public static class DependancyInjector
     {
-        public static void RegisterServices(IServiceCollection services, ConfigurationOptions config)
-        {
-           
-
-            RegisterApiClients(services, config);           
-            RegisterModelValidators(services);
-        }
+        public static void RegisterServices(IServiceCollection services, ConfigurationOptions config)
+        {
+           
+
+            services.AddScoped<IHiringRepository, HiringRepository>();
+            RegisterApiClients(services, config);           
+            RegisterModelValidators(services);
+        }
        
         private static void RegisterModelValidators(IServiceCollection services)
         {
diff --git a/LegacyOutput/src/IRM.SPA/Models/Client.cs b/LegacyOutput/src/IRM.SPA/Models/Client.cs
new file mode 100644
index 0000000000000000000000000000000000000000..46bfecbc332bde56ebed47d21516d9a9c7773d42
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Client.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class Client
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Phone { get; set; } = string.Empty;
+    public string Email { get; set; } = string.Empty;
+    public string ContactName { get; set; } = string.Empty;
+    public string Website { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..d59d0bb30c1802c64fa28e40d6a449e156739081
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class ClientFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Phone { get; set; }
+    public string? Email { get; set; }
+    public string? Website { get; set; }
+    public string? ContactName { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/Position.cs b/LegacyOutput/src/IRM.SPA/Models/Position.cs
new file mode 100644
index 0000000000000000000000000000000000000000..a6f9543eebd29c5626ed28741e6b4065ad3d16cf
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Position.cs
@@ -0,0 +1,16 @@
+namespace IRM.SPA.Models;
+
+public sealed class Position
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Description { get; set; } = string.Empty;
+    public DateTime? StartDate { get; set; }
+    public DateTime? Deadline { get; set; }
+    public bool Hired { get; set; }
+    public int? IdClient { get; set; }
+    public string ClientName { get; set; } = string.Empty;
+    public string ClientContactName { get; set; } = string.Empty;
+    public string ClientContactPhone { get; set; } = string.Empty;
+    public string ClientContactEmail { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..cfa76e79d96580b7b4d98e9b476807ef6f12acb5
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class PositionFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Description { get; set; }
+    public string? StartDate { get; set; }
+    public string? Deadline { get; set; }
+    public string? ClientContact { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Program.cs b/LegacyOutput/src/IRM.SPA/Program.cs
index 00184fc283cd7060825796fd98e55be1c243edd6..2008eaa884f07089ce5823fe41c6a6336a34f709
--- a/LegacyOutput/src/IRM.SPA/Program.cs
+++ b/LegacyOutput/src/IRM.SPA/Program.cs
@@ -10,8 +10,9 @@
     {
         public static void Main(string[] args)
         {
-            var builder = WebApplication.CreateBuilder(args);
-            ConfigurationOptions config = builder.Configuration.Get<ConfigurationOptions>() ?? new ConfigurationOptions();
+            var builder = WebApplication.CreateBuilder(args);
+            AppDomain.CurrentDomain.SetData("DataDirectory", Path.Combine(builder.Environment.ContentRootPath, "App_Data"));
+            ConfigurationOptions config = builder.Configuration.Get<ConfigurationOptions>() ?? new ConfigurationOptions();
             // Add services to the container.
             builder.Services.AddRazorComponents()
                 .AddInteractiveServerComponents();           
diff --git a/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..1c88253e59d707a339e900e3d8c1a8b2d56950d2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
@@ -0,0 +1,268 @@
+using System.Data;
+using IRM.SPA.Models;
+using Microsoft.Data.SqlClient;
+
+namespace IRM.SPA.Services;
+
+public sealed class HiringRepository(IConfiguration configuration) : IHiringRepository
+{
+    private readonly string _connectionString = configuration.GetConnectionString("HiringConnection")
+        ?? throw new InvalidOperationException("ConnectionStrings:HiringConnection is not configured.");
+
+    public async Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Name", filter.Name);
+        AddLike(where, parameters, "Phone", filter.Phone);
+        AddLike(where, parameters, "Email", filter.Email);
+        AddLike(where, parameters, "Website", filter.Website);
+        AddLike(where, parameters, "ContactName", filter.ContactName);
+
+        var sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients";
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var clients = new List<Client>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            clients.Add(ReadClient(reader));
+        }
+
+        return clients;
+    }
+
+    public async Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients WHERE Id = @Id";
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadClient(reader) : null;
+    }
+
+    public async Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Clients (Name, Phone, Email, ContactName, Website)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Phone, @Email, @ContactName, @Website)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Clients
+            SET Name = @Name, Phone = @Phone, Email = @Email, ContactName = @ContactName, Website = @Website
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = client.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    public async Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Positions.Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Positions.Name", filter.Name, "@Name");
+        AddLike(where, parameters, "Positions.Description", filter.Description, "@Description");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.StartDate, 120)", filter.StartDate, "@StartDate");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.Deadline, 120)", filter.Deadline, "@Deadline");
+        AddLike(where, parameters, "Positions.ClientContactName", filter.ClientContact, "@ClientContact");
+
+        var sql = """
+            SELECT Positions.Id, Positions.Name, Positions.Description, Positions.StartDate, Positions.Deadline,
+                   Positions.Hired, Positions.IdClient, Positions.ClientContactName, Positions.ClientContactPhone,
+                   Positions.ClientContactEmail, Clients.Name AS ClientName
+            FROM Positions
+            LEFT JOIN Clients ON Positions.IdClient = Clients.Id
+            """;
+
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Positions.Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var positions = new List<Position>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            positions.Add(ReadPosition(reader, includeClientName: true));
+        }
+
+        return positions;
+    }
+
+    public async Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            SELECT Id, Name, Description, StartDate, Deadline, Hired, IdClient,
+                   ClientContactName, ClientContactPhone, ClientContactEmail
+            FROM Positions
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadPosition(reader, includeClientName: false) : null;
+    }
+
+    public async Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Positions (Name, Description, StartDate, Deadline, Hired, ClientContactName,
+                                   ClientContactPhone, ClientContactEmail, IdClient)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Description, @StartDate, @Deadline, @Hired, @ClientContactName,
+                    @ClientContactPhone, @ClientContactEmail, @IdClient)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Positions
+            SET Name = @Name, Description = @Description, StartDate = @StartDate, Deadline = @Deadline,
+                Hired = @Hired, ClientContactName = @ClientContactName, ClientContactPhone = @ClientContactPhone,
+                ClientContactEmail = @ClientContactEmail, IdClient = @IdClient
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = position.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    private SqlConnection CreateConnection() => new(_connectionString);
+
+    private static void AddClientParameters(SqlCommand command, Client client)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = client.Name;
+        command.Parameters.Add("@Phone", SqlDbType.VarChar).Value = client.Phone;
+        command.Parameters.Add("@Email", SqlDbType.VarChar).Value = client.Email;
+        command.Parameters.Add("@ContactName", SqlDbType.VarChar).Value = client.ContactName;
+        command.Parameters.Add("@Website", SqlDbType.VarChar).Value = client.Website;
+    }
+
+    private static void AddPositionParameters(SqlCommand command, Position position, bool includeClient)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = position.Name;
+        command.Parameters.Add("@Description", SqlDbType.VarChar).Value = position.Description;
+        command.Parameters.Add("@StartDate", SqlDbType.Date).Value = (object?)position.StartDate ?? DBNull.Value;
+        command.Parameters.Add("@Deadline", SqlDbType.Date).Value = (object?)position.Deadline ?? DBNull.Value;
+        command.Parameters.Add("@Hired", SqlDbType.Bit).Value = position.Hired;
+        command.Parameters.Add("@ClientContactName", SqlDbType.VarChar).Value = position.ClientContactName;
+        command.Parameters.Add("@ClientContactPhone", SqlDbType.VarChar).Value = position.ClientContactPhone;
+        command.Parameters.Add("@ClientContactEmail", SqlDbType.VarChar).Value = position.ClientContactEmail;
+        if (includeClient)
+        {
+            command.Parameters.Add("@IdClient", SqlDbType.Int).Value = (object?)position.IdClient ?? DBNull.Value;
+        }
+    }
+
+    private static void AddLike(List<string> where, List<SqlParameter> parameters, string column, string? value, string? parameterName = null)
+    {
+        if (string.IsNullOrWhiteSpace(value))
+        {
+            return;
+        }
+
+        parameterName ??= "@" + column.Replace(".", string.Empty);
+        where.Add($"{column} LIKE {parameterName}");
+        parameters.Add(new SqlParameter(parameterName, SqlDbType.VarChar) { Value = "%" + value.Trim() + "%" });
+    }
+
+    private static Client ReadClient(SqlDataReader reader) => new()
+    {
+        Id = reader.GetInt32(0),
+        Name = GetString(reader, 1),
+        Phone = GetString(reader, 2),
+        Email = GetString(reader, 3),
+        ContactName = GetString(reader, 4),
+        Website = GetString(reader, 5)
+    };
+
+    private static Position ReadPosition(SqlDataReader reader, bool includeClientName)
+    {
+        var position = new Position
+        {
+            Id = reader.GetInt32(0),
+            Name = GetString(reader, 1),
+            Description = GetString(reader, 2),
+            StartDate = reader.IsDBNull(3) ? null : reader.GetDateTime(3),
+            Deadline = reader.IsDBNull(4) ? null : reader.GetDateTime(4),
+            Hired = !reader.IsDBNull(5) && reader.GetBoolean(5),
+            IdClient = reader.IsDBNull(6) ? null : reader.GetInt32(6),
+            ClientContactName = GetString(reader, 7),
+            ClientContactPhone = GetString(reader, 8),
+            ClientContactEmail = GetString(reader, 9)
+        };
+
+        if (includeClientName)
+        {
+            position.ClientName = GetString(reader, 10);
+        }
+
+        return position;
+    }
+
+    private static string GetString(SqlDataReader reader, int ordinal) =>
+        reader.IsDBNull(ordinal) ? string.Empty : reader.GetString(ordinal);
+}
diff --git a/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..468316298ba01ef622db9ffeeb20a3df775fc996
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
@@ -0,0 +1,15 @@
+using IRM.SPA.Models;
+
+namespace IRM.SPA.Services;
+
+public interface IHiringRepository
+{
+    Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default);
+    Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default);
+    Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default);
+    Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default);
+}
diff --git a/LegacyOutput/src/IRM.SPA/wwwroot/app.css b/LegacyOutput/src/IRM.SPA/wwwroot/app.css
index 7ac30e2a8df7ef2e3f233e331d1d58ca449099d8..c4e3f519ac693dd5c0ee569dc7dae70aa51945dc
--- a/LegacyOutput/src/IRM.SPA/wwwroot/app.css
+++ b/LegacyOutput/src/IRM.SPA/wwwroot/app.css
@@ -1,51 +1,247 @@
-html, body {
-    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
-}
-
-a, .btn-link {
-    color: #006bb7;
-}
-
-.btn-primary {
-    color: #fff;
-    background-color: #1b6ec2;
-    border-color: #1861ac;
-}
-
-.btn:focus, .btn:active:focus, .btn-link.nav-link:focus, .form-control:focus, .form-check-input:focus {
-  box-shadow: 0 0 0 0.1rem white, 0 0 0 0.25rem #258cfb;
-}
-
-.content {
-    padding-top: 1.1rem;
-}
-
-h1:focus {
-    outline: none;
-}
-
-.valid.modified:not([type=checkbox]) {
-    outline: 1px solid #26b050;
-}
-
-.invalid {
-    outline: 1px solid #e50000;
-}
-
-.validation-message {
-    color: #e50000;
-}
-
-.blazor-error-boundary {
-    background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNDkiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIG92ZXJmbG93PSJoaWRkZW4iPjxkZWZzPjxjbGlwUGF0aCBpZD0iY2xpcDAiPjxyZWN0IHg9IjIzNSIgeT0iNTEiIHdpZHRoPSI1NiIgaGVpZ2h0PSI0OSIvPjwvY2xpcFBhdGg+PC9kZWZzPjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMCkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yMzUgLTUxKSI+PHBhdGggZD0iTTI2My41MDYgNTFDMjY0LjcxNyA1MSAyNjUuODEzIDUxLjQ4MzcgMjY2LjYwNiA1Mi4yNjU4TDI2Ny4wNTIgNTIuNzk4NyAyNjcuNTM5IDUzLjYyODMgMjkwLjE4NSA5Mi4xODMxIDI5MC41NDUgOTIuNzk1IDI5MC42NTYgOTIuOTk2QzI5MC44NzcgOTMuNTEzIDI5MSA5NC4wODE1IDI5MSA5NC42NzgyIDI5MSA5Ny4wNjUxIDI4OS4wMzggOTkgMjg2LjYxNyA5OUwyNDAuMzgzIDk5QzIzNy45NjMgOTkgMjM2IDk3LjA2NTEgMjM2IDk0LjY3ODIgMjM2IDk0LjM3OTkgMjM2LjAzMSA5NC4wODg2IDIzNi4wODkgOTMuODA3MkwyMzYuMzM4IDkzLjAxNjIgMjM2Ljg1OCA5Mi4xMzE0IDI1OS40NzMgNTMuNjI5NCAyNTkuOTYxIDUyLjc5ODUgMjYwLjQwNyA1Mi4yNjU4QzI2MS4yIDUxLjQ4MzcgMjYyLjI5NiA1MSAyNjMuNTA2IDUxWk0yNjMuNTg2IDY2LjAxODNDMjYwLjczNyA2Ni4wMTgzIDI1OS4zMTMgNjcuMTI0NSAyNTkuMzEzIDY5LjMzNyAyNTkuMzEzIDY5LjYxMDIgMjU5LjMzMiA2OS44NjA4IDI1OS4zNzEgNzAuMDg4N0wyNjEuNzk1IDg0LjAxNjEgMjY1LjM4IDg0LjAxNjEgMjY3LjgyMSA2OS43NDc1QzI2Ny44NiA2OS43MzA5IDI2Ny44NzkgNjkuNTg3NyAyNjcuODc5IDY5LjMxNzkgMjY3Ljg3OSA2Ny4xMTgyIDI2Ni40NDggNjYuMDE4MyAyNjMuNTg2IDY2LjAxODNaTTI2My41NzYgODYuMDU0N0MyNjEuMDQ5IDg2LjA1NDcgMjU5Ljc4NiA4Ny4zMDA1IDI1OS43ODYgODkuNzkyMSAyNTkuNzg2IDkyLjI4MzcgMjYxLjA0OSA5My41Mjk1IDI2My41NzYgOTMuNTI5NSAyNjYuMTE2IDkzLjUyOTUgMjY3LjM4NyA5Mi4yODM3IDI2Ny4zODcgODkuNzkyMSAyNjcuMzg3IDg3LjMwMDUgMjY2LjExNiA4Ni4wNTQ3IDI2My41NzYgODYuMDU0N1oiIGZpbGw9IiNGRkU1MDAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48L3N2Zz4=) no-repeat 1rem/1.8rem, #b32121;
-    padding: 1rem 1rem 1rem 3.7rem;
-    color: white;
-}
-
-    .blazor-error-boundary::after {
-        content: "An error has occurred."
-    }
-
-.darker-border-checkbox.form-check-input {
-    border-color: #929292;
-}
+html,
+body {
+    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
+}
+
+body {
+    padding-top: 50px;
+    padding-bottom: 20px;
+}
+
+.body-content {
+    padding-left: 15px;
+    padding-right: 15px;
+}
+
+.dl-horizontal dt {
+    white-space: normal;
+}
+
+input[type="text"],
+input[type="password"],
+input[type="email"],
+input[type="tel"],
+input[type="select"] {
+    max-width: 280px;
+}
+
+.jumbotron {
+    padding: 30px;
+    margin-bottom: 30px;
+    color: inherit;
+    background-color: #eee;
+    border-radius: 6px;
+}
+
+.jumbotron h1 {
+    font-size: 63px;
+}
+
+.lead {
+    margin-bottom: 20px;
+    font-size: 21px;
+    font-weight: 300;
+    line-height: 1.4;
+}
+
+.navbar-inverse {
+    background-color: #222;
+    border-color: #080808;
+}
+
+.navbar-fixed-top {
+    position: fixed;
+    right: 0;
+    left: 0;
+    z-index: 1030;
+    top: 0;
+    border-width: 0 0 1px;
+}
+
+.navbar {
+    min-height: 50px;
+    margin-bottom: 20px;
+    border: 1px solid transparent;
+}
+
+.navbar-header {
+    float: left;
+}
+
+.navbar-brand {
+    float: left;
+    height: 50px;
+    padding: 15px;
+    font-size: 18px;
+    line-height: 20px;
+}
+
+.navbar-inverse .navbar-brand,
+.navbar-inverse .navbar-nav > li > a {
+    color: #9d9d9d;
+}
+
+.navbar-inverse .navbar-brand:hover,
+.navbar-inverse .navbar-nav > li > a:hover,
+.navbar-inverse .navbar-nav > li > a.active {
+    color: #fff;
+    text-decoration: none;
+}
+
+.navbar-nav {
+    float: left;
+    margin: 0;
+}
+
+.nav > li {
+    position: relative;
+    display: block;
+}
+
+.navbar-nav > li {
+    float: left;
+}
+
+.nav > li > a {
+    position: relative;
+    display: block;
+    padding: 10px 15px;
+}
+
+.navbar-nav > li > a {
+    padding-top: 15px;
+    padding-bottom: 15px;
+    line-height: 20px;
+}
+
+.btn-default {
+    color: #333;
+    background-color: #fff;
+    border-color: #ccc;
+}
+
+.btn {
+    display: inline-block;
+    padding: 6px 12px;
+    margin-bottom: 0;
+    font-size: 14px;
+    font-weight: 400;
+    line-height: 1.42857143;
+    text-align: center;
+    white-space: nowrap;
+    vertical-align: middle;
+    cursor: pointer;
+    border: 1px solid transparent;
+    border-radius: 4px;
+}
+
+.formLabel {
+    display: inline-block;
+    width: 200px;
+}
+
+.legacy-table {
+    margin-top: 20px;
+    margin-bottom: 10px;
+    border-collapse: separate;
+    border-spacing: 2px;
+}
+
+.legacy-table th,
+.legacy-table td {
+    padding: 1px;
+    font-weight: normal;
+    text-align: left;
+    vertical-align: top;
+}
+
+.legacy-table th {
+    font-weight: bold;
+}
+
+.legacy-table input[type="text"] {
+    width: 130px;
+}
+
+.description-input {
+    width: 500px;
+    max-width: 100%;
+    vertical-align: top;
+}
+
+.link-button {
+    padding: 0;
+    color: #337ab7;
+    background: none;
+    border: 0;
+    cursor: pointer;
+    font: inherit;
+}
+
+.link-button:hover {
+    color: #23527c;
+    text-decoration: underline;
+}
+
+.alert {
+    padding: 15px;
+    margin-top: 20px;
+    margin-bottom: 20px;
+    border: 1px solid transparent;
+    border-radius: 4px;
+}
+
+.alert-danger {
+    color: #a94442;
+    background-color: #f2dede;
+    border-color: #ebccd1;
+}
+
+@media screen and (min-width: 768px) {
+    .jumbotron {
+        margin-top: 20px;
+    }
+
+    .body-content {
+        padding: 0;
+    }
+}
+
+@media screen and (max-width: 767px) {
+    .navbar-header,
+    .navbar-nav,
+    .navbar-nav > li {
+        float: none;
+    }
+
+    .navbar-fixed-top {
+        position: static;
+    }
+
+    body {
+        padding-top: 0;
+    }
+
+    .jumbotron h1 {
+        font-size: 42px;
+    }
+}
+
+#blazor-error-ui {
+    background: lightyellow;
+    bottom: 0;
+    box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.2);
+    display: none;
+    left: 0;
+    padding: 0.6rem 1.25rem 0.7rem 1.25rem;
+    position: fixed;
+    width: 100%;
+    z-index: 1000;
+}
+
+#blazor-error-ui .dismiss {
+    cursor: pointer;
+    position: absolute;
+    right: 0.75rem;
+    top: 0.5rem;
+}

codex
The first build caught Razor’s special handling for `type="date"` bindings. I’m switching those two inputs to explicit string change handlers so the legacy `yyyy-MM-dd` value round-trips cleanly.
apply patch
patch: completed
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Pages\PositionDetails.razor
diff --git a/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor b/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
index 62e62873d628af7e91de98824e1143460b2db2a0..a9714ae63155375bce0d34f8e2a2cda4c6cfbeeb
--- a/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
@@ -1,23 +1,30 @@
-﻿@inherits LayoutComponentBase
-
-<div class="page">
-    <div class="sidebar">
-        <NavMenu />
-    </div>
-
-    <main>
-        <div class="top-row px-4">
-            <a href="https://learn.microsoft.com/aspnet/core/" target="_blank">About</a>
-        </div>
-
-        <article class="content px-4">
-            @Body
-        </article>
-    </main>
-</div>
-
-<div id="blazor-error-ui">
-    An unhandled error has occurred.
-    <a href="" class="reload">Reload</a>
-    <a class="dismiss">🗙</a>
-</div>
+@inherits LayoutComponentBase
+
+<div class="navbar navbar-inverse navbar-fixed-top">
+    <div class="container">
+        <div class="navbar-header">
+            <a class="navbar-brand" href="/">Hiring Tracker</a>
+        </div>
+        <div class="navbar-collapse collapse">
+            <ul class="nav navbar-nav">
+                <li><NavLink href="/" Match="NavLinkMatch.All">Home</NavLink></li>
+                <li><NavLink href="clients">Clients</NavLink></li>
+                <li><NavLink href="positions">Positions</NavLink></li>
+            </ul>
+        </div>
+    </div>
+</div>
+
+<div class="container body-content">
+    @Body
+    <hr />
+    <footer>
+        <p>&copy; @DateTime.Now.Year - Hiring Tracker</p>
+    </footer>
+</div>
+
+<div id="blazor-error-ui">
+    An unhandled error has occurred.
+    <a href="" class="reload">Reload</a>
+    <a class="dismiss">x</a>
+</div>
diff --git a/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor b/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
index 259e68b4bc97ef9ecc0b3899dc192d7790fd9b4c..c765fe7b74acb5c30b228509af2a8a6e6e1bf3c6
--- a/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
@@ -1,30 +1 @@
-﻿<div class="top-row ps-3 navbar navbar-dark">
-    <div class="container-fluid">
-        <a class="navbar-brand" href="">IRM.SPA</a>
-    </div>
-</div>
-
-<input type="checkbox" title="Navigation menu" class="navbar-toggler" />
-
-<div class="nav-scrollable" onclick="document.querySelector('.navbar-toggler').click()">
-    <nav class="flex-column">
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="" Match="NavLinkMatch.All">
-                <span class="bi bi-house-door-fill-nav-menu" aria-hidden="true"></span> Home
-            </NavLink>
-        </div>
-
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="counter">
-                <span class="bi bi-plus-square-fill-nav-menu" aria-hidden="true"></span> Counter
-            </NavLink>
-        </div>
-
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="weather">
-                <span class="bi bi-list-nested-nav-menu" aria-hidden="true"></span> Weather
-            </NavLink>
-        </div>
-    </nav>
-</div>
-
+@* Navigation is defined in MainLayout to match the legacy Site.Master markup. *@
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor
new file mode 100644
index 0000000000000000000000000000000000000000..1232eae426ef2325a0505f006805d6a05ba6115e
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor
@@ -0,0 +1,104 @@
+@page "/clients/new"
+@page "/clients/{Id:int}"
+@page "/ClientDetails"
+@page "/ClientDetails.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+@inject IJSRuntime JS
+
+<PageTitle>Client Details - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="SaveAsync" @onsubmit:preventDefault>
+    <span class="formLabel">Id:</span>
+    <span>@(client.Id == 0 ? string.Empty : client.Id)</span>
+    <br />
+    <span class="formLabel">Name:</span>
+    <input type="text" @bind="client.Name" />
+    <br />
+    <span class="formLabel">Phone:</span>
+    <input type="text" @bind="client.Phone" />
+    <br />
+    <span class="formLabel">Email:</span>
+    <input type="text" @bind="client.Email" />
+    <br />
+    <span class="formLabel">Contact Name:</span>
+    <input type="text" @bind="client.ContactName" />
+    <br />
+    <span class="formLabel">Website:</span>
+    <input type="text" @bind="client.Website" />
+    <br />
+    @if (isEdit)
+    {
+        <button class="link-button" type="submit">Update</button>
+    }
+    else
+    {
+        <button class="link-button" type="submit">Insert</button>
+    }
+</form>
+
+@code {
+    [Parameter] public int? Id { get; set; }
+
+    private Client client = new();
+    private bool isEdit;
+    private string? errorMessage;
+
+    protected override async Task OnParametersSetAsync()
+    {
+        errorMessage = null;
+        isEdit = false;
+        client = new Client();
+
+        if (Id is not { } id)
+        {
+            return;
+        }
+
+        try
+        {
+            var existing = await Repository.GetClientAsync(id);
+            if (existing is not null)
+            {
+                client = existing;
+                isEdit = true;
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load client. " + ex.Message;
+        }
+    }
+
+    private async Task SaveAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            if (isEdit)
+            {
+                if (await Repository.UpdateClientAsync(client))
+                {
+                    await JS.InvokeVoidAsync("alert", "Client updated successfully");
+                }
+            }
+            else
+            {
+                client.Id = await Repository.InsertClientAsync(client);
+                isEdit = true;
+                await JS.InvokeVoidAsync("alert", "Client added successfully");
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to save client. " + ex.Message;
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor
new file mode 100644
index 0000000000000000000000000000000000000000..774521377b61d400b5e79c84a3304d20b83878b3
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor
@@ -0,0 +1,85 @@
+@page "/clients"
+@page "/ClientsList"
+@page "/ClientsList.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+
+<PageTitle>Clients - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="ApplyFilter" @onsubmit:preventDefault>
+    <table class="legacy-table">
+        <thead>
+            <tr>
+                <th>Id</th>
+                <th>Client Name</th>
+                <th>Phone</th>
+                <th>Email</th>
+                <th>Website</th>
+                <th>Contact Name</th>
+                <th></th>
+            </tr>
+            <tr>
+                <th><input type="text" @bind="filter.Id" /></th>
+                <th><input type="text" @bind="filter.Name" /></th>
+                <th><input type="text" @bind="filter.Phone" /></th>
+                <th><input type="text" @bind="filter.Email" /></th>
+                <th><input type="text" @bind="filter.Website" /></th>
+                <th><input type="text" @bind="filter.ContactName" /></th>
+                <th><button type="submit">Filter</button></th>
+            </tr>
+        </thead>
+        <tbody>
+            @foreach (var client in clients)
+            {
+                <tr>
+                    <td>@client.Id</td>
+                    <td>@client.Name</td>
+                    <td>@client.Phone</td>
+                    <td>@client.Email</td>
+                    <td>@client.Website</td>
+                    <td>@client.ContactName</td>
+                    <td><a href="clients/@client.Id">Details</a></td>
+                </tr>
+            }
+        </tbody>
+    </table>
+</form>
+
+<a href="clients/new">Add new client</a>
+
+@code {
+    private readonly ClientFilter filter = new();
+    private IReadOnlyList<Client> clients = [];
+    private string? errorMessage;
+
+    protected override async Task OnInitializedAsync()
+    {
+        await LoadClientsAsync();
+    }
+
+    private async Task ApplyFilter()
+    {
+        await LoadClientsAsync();
+    }
+
+    private async Task LoadClientsAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            clients = await Repository.GetClientsAsync(filter);
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load clients. " + ex.Message;
+            clients = [];
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
index df0502354fdfbbef85e1673ffcff56d85d2481bf..e4fbd72369d329a04d4cead6939579592e284c3d
--- a/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
@@ -1,7 +1,26 @@
-﻿@page "/"
-
-<PageTitle>Home</PageTitle>
-
-<h1>Hello, world!</h1>
-
-Welcome to your new app.
+@page "/"
+@page "/Default.aspx"
+
+<PageTitle>Home Page - Hiring Tracker</PageTitle>
+
+<div class="jumbotron">
+    <h1>Hiring Tracking</h1>
+    <p class="lead">Track positions and candidates.</p>
+</div>
+
+<div class="row">
+    <div class="col-md-4">
+        <h2>Positions</h2>
+        <p>View open positions or query previous hires.</p>
+        <p>
+            <a class="btn btn-default" href="positions">View</a>
+        </p>
+    </div>
+    <div class="col-md-4">
+        <h2>Clients</h2>
+        <p>Manage contacts requesting the positions.</p>
+        <p>
+            <a class="btn btn-default" href="clients">View</a>
+        </p>
+    </div>
+</div>
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor
new file mode 100644
index 0000000000000000000000000000000000000000..51bb6ec59ec33db24c64c1bb595bdf18d2e087ec
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor
@@ -0,0 +1,139 @@
+@page "/positions/new"
+@page "/positions/{Id:int}"
+@page "/PositionDetails"
+@page "/PositionDetails.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+@inject IJSRuntime JS
+
+<PageTitle>Position Details - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="SaveAsync" @onsubmit:preventDefault>
+    <span class="formLabel">Id:</span>
+    <span>@(position.Id == 0 ? string.Empty : position.Id)</span>
+    <br />
+    <span class="formLabel">Name:</span>
+    <input type="text" @bind="position.Name" />
+    <br />
+    <span class="formLabel">Description:</span>
+    <textarea rows="6" class="description-input" @bind="position.Description"></textarea>
+    <br />
+    <span class="formLabel">Start Date:</span>
+    <input type="date" value="@startDateText" @onchange="e => startDateText = e.Value?.ToString() ?? string.Empty" />
+    <br />
+    <span class="formLabel">Deadline:</span>
+    <input type="date" value="@deadlineText" @onchange="e => deadlineText = e.Value?.ToString() ?? string.Empty" />
+    <br />
+    <span class="formLabel">Hired?:</span>
+    <input type="checkbox" @bind="position.Hired" />
+    <br />
+    <span class="formLabel">Client:</span>
+    <select @bind="position.IdClient">
+        @foreach (var client in clients)
+        {
+            <option value="@client.Id">@client.Name</option>
+        }
+    </select>
+    <br />
+    <span class="formLabel">Client Contact Name:</span>
+    <input type="text" @bind="position.ClientContactName" />
+    <br />
+    <span class="formLabel">Phone:</span>
+    <input type="text" @bind="position.ClientContactPhone" />
+    <br />
+    <span class="formLabel">Email:</span>
+    <input type="text" @bind="position.ClientContactEmail" />
+    <br />
+    @if (isEdit)
+    {
+        <button class="link-button" type="submit">Update</button>
+    }
+    else
+    {
+        <button class="link-button" type="submit">Insert</button>
+    }
+</form>
+
+@code {
+    [Parameter] public int? Id { get; set; }
+
+    private Position position = new();
+    private IReadOnlyList<Client> clients = [];
+    private bool isEdit;
+    private string? errorMessage;
+    private string startDateText = string.Empty;
+    private string deadlineText = string.Empty;
+
+    protected override async Task OnParametersSetAsync()
+    {
+        errorMessage = null;
+        isEdit = false;
+        position = new Position();
+        startDateText = string.Empty;
+        deadlineText = string.Empty;
+
+        try
+        {
+            clients = await Repository.GetClientsAsync(new ClientFilter());
+            position.IdClient = clients.FirstOrDefault()?.Id;
+
+            if (Id is not { } id)
+            {
+                return;
+            }
+
+            var existing = await Repository.GetPositionAsync(id);
+            if (existing is not null)
+            {
+                position = existing;
+                startDateText = ToDateInputValue(position.StartDate);
+                deadlineText = ToDateInputValue(position.Deadline);
+                isEdit = true;
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load position. " + ex.Message;
+        }
+    }
+
+    private async Task SaveAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            position.StartDate = ParseDate(startDateText);
+            position.Deadline = ParseDate(deadlineText);
+
+            if (isEdit)
+            {
+                if (await Repository.UpdatePositionAsync(position))
+                {
+                    await JS.InvokeVoidAsync("alert", "Position updated successfully");
+                }
+            }
+            else
+            {
+                position.Id = await Repository.InsertPositionAsync(position);
+                isEdit = true;
+                await JS.InvokeVoidAsync("alert", "Position added successfully");
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to save position. " + ex.Message;
+        }
+    }
+
+    private static string ToDateInputValue(DateTime? value) => value?.ToString("yyyy-MM-dd") ?? string.Empty;
+
+    private static DateTime? ParseDate(string value) =>
+        DateTime.TryParse(value, out var parsed) ? parsed.Date : null;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor
new file mode 100644
index 0000000000000000000000000000000000000000..efdcec61db320f36ea4b1bad176e604944be65e2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor
@@ -0,0 +1,88 @@
+@page "/positions"
+@page "/PositionsList"
+@page "/PositionsList.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+
+<PageTitle>Positions - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="ApplyFilter" @onsubmit:preventDefault>
+    <table class="legacy-table">
+        <thead>
+            <tr>
+                <th>Id</th>
+                <th>Name</th>
+                <th>Description</th>
+                <th>Start Date</th>
+                <th>Deadline</th>
+                <th>Position Closed</th>
+                <th>Client Contact</th>
+                <th></th>
+            </tr>
+            <tr>
+                <th><input type="text" @bind="filter.Id" /></th>
+                <th><input type="text" @bind="filter.Name" /></th>
+                <th><input type="text" @bind="filter.Description" /></th>
+                <th><input type="text" @bind="filter.StartDate" /></th>
+                <th><input type="text" @bind="filter.Deadline" /></th>
+                <th></th>
+                <th><input type="text" @bind="filter.ClientContact" /></th>
+                <th><button type="submit">Filter</button></th>
+            </tr>
+        </thead>
+        <tbody>
+            @foreach (var position in positions)
+            {
+                <tr>
+                    <td>@position.Id</td>
+                    <td>@position.Name</td>
+                    <td>@position.Description</td>
+                    <td>@position.StartDate</td>
+                    <td>@position.Deadline</td>
+                    <td>@position.Hired</td>
+                    <td>@position.ClientName (@position.ClientContactName)</td>
+                    <td><a href="positions/@position.Id">Details</a></td>
+                </tr>
+            }
+        </tbody>
+    </table>
+</form>
+
+<a href="positions/new">Add new position</a>
+
+@code {
+    private readonly PositionFilter filter = new();
+    private IReadOnlyList<Position> positions = [];
+    private string? errorMessage;
+
+    protected override async Task OnInitializedAsync()
+    {
+        await LoadPositionsAsync();
+    }
+
+    private async Task ApplyFilter()
+    {
+        await LoadPositionsAsync();
+    }
+
+    private async Task LoadPositionsAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            positions = await Repository.GetPositionsAsync(filter);
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load positions. " + ex.Message;
+            positions = [];
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/_Imports.razor b/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
index de2621323fafca41583fecc7d1b4b181a1e49ac1..4ca0297300bf206b5f4f4e3af4a8adffd1865970
--- a/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
@@ -5,6 +5,8 @@
 @using Microsoft.AspNetCore.Components.Web
 @using static Microsoft.AspNetCore.Components.Web.RenderMode
 @using Microsoft.AspNetCore.Components.Web.Virtualization
-@using Microsoft.JSInterop
-@using IRM.SPA
-@using IRM.SPA.Components
+@using Microsoft.JSInterop
+@using IRM.SPA
+@using IRM.SPA.Components
+@using IRM.SPA.Models
+@using IRM.SPA.Services
diff --git a/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs b/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
index 8a7b20c19addfd182712b09a487081eda45d085a..a1e19750167d74ae38221cb933beb102768676d5
--- a/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
+++ b/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
@@ -13,13 +13,14 @@
 {
     public static class DependancyInjector
     {
-        public static void RegisterServices(IServiceCollection services, ConfigurationOptions config)
-        {
-           
-
-            RegisterApiClients(services, config);           
-            RegisterModelValidators(services);
-        }
+        public static void RegisterServices(IServiceCollection services, ConfigurationOptions config)
+        {
+           
+
+            services.AddScoped<IHiringRepository, HiringRepository>();
+            RegisterApiClients(services, config);           
+            RegisterModelValidators(services);
+        }
        
         private static void RegisterModelValidators(IServiceCollection services)
         {
diff --git a/LegacyOutput/src/IRM.SPA/Models/Client.cs b/LegacyOutput/src/IRM.SPA/Models/Client.cs
new file mode 100644
index 0000000000000000000000000000000000000000..46bfecbc332bde56ebed47d21516d9a9c7773d42
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Client.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class Client
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Phone { get; set; } = string.Empty;
+    public string Email { get; set; } = string.Empty;
+    public string ContactName { get; set; } = string.Empty;
+    public string Website { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..d59d0bb30c1802c64fa28e40d6a449e156739081
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class ClientFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Phone { get; set; }
+    public string? Email { get; set; }
+    public string? Website { get; set; }
+    public string? ContactName { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/Position.cs b/LegacyOutput/src/IRM.SPA/Models/Position.cs
new file mode 100644
index 0000000000000000000000000000000000000000..a6f9543eebd29c5626ed28741e6b4065ad3d16cf
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Position.cs
@@ -0,0 +1,16 @@
+namespace IRM.SPA.Models;
+
+public sealed class Position
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Description { get; set; } = string.Empty;
+    public DateTime? StartDate { get; set; }
+    public DateTime? Deadline { get; set; }
+    public bool Hired { get; set; }
+    public int? IdClient { get; set; }
+    public string ClientName { get; set; } = string.Empty;
+    public string ClientContactName { get; set; } = string.Empty;
+    public string ClientContactPhone { get; set; } = string.Empty;
+    public string ClientContactEmail { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..cfa76e79d96580b7b4d98e9b476807ef6f12acb5
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class PositionFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Description { get; set; }
+    public string? StartDate { get; set; }
+    public string? Deadline { get; set; }
+    public string? ClientContact { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Program.cs b/LegacyOutput/src/IRM.SPA/Program.cs
index 00184fc283cd7060825796fd98e55be1c243edd6..2008eaa884f07089ce5823fe41c6a6336a34f709
--- a/LegacyOutput/src/IRM.SPA/Program.cs
+++ b/LegacyOutput/src/IRM.SPA/Program.cs
@@ -10,8 +10,9 @@
     {
         public static void Main(string[] args)
         {
-            var builder = WebApplication.CreateBuilder(args);
-            ConfigurationOptions config = builder.Configuration.Get<ConfigurationOptions>() ?? new ConfigurationOptions();
+            var builder = WebApplication.CreateBuilder(args);
+            AppDomain.CurrentDomain.SetData("DataDirectory", Path.Combine(builder.Environment.ContentRootPath, "App_Data"));
+            ConfigurationOptions config = builder.Configuration.Get<ConfigurationOptions>() ?? new ConfigurationOptions();
             // Add services to the container.
             builder.Services.AddRazorComponents()
                 .AddInteractiveServerComponents();           
diff --git a/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..1c88253e59d707a339e900e3d8c1a8b2d56950d2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
@@ -0,0 +1,268 @@
+using System.Data;
+using IRM.SPA.Models;
+using Microsoft.Data.SqlClient;
+
+namespace IRM.SPA.Services;
+
+public sealed class HiringRepository(IConfiguration configuration) : IHiringRepository
+{
+    private readonly string _connectionString = configuration.GetConnectionString("HiringConnection")
+        ?? throw new InvalidOperationException("ConnectionStrings:HiringConnection is not configured.");
+
+    public async Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Name", filter.Name);
+        AddLike(where, parameters, "Phone", filter.Phone);
+        AddLike(where, parameters, "Email", filter.Email);
+        AddLike(where, parameters, "Website", filter.Website);
+        AddLike(where, parameters, "ContactName", filter.ContactName);
+
+        var sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients";
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var clients = new List<Client>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            clients.Add(ReadClient(reader));
+        }
+
+        return clients;
+    }
+
+    public async Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients WHERE Id = @Id";
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadClient(reader) : null;
+    }
+
+    public async Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Clients (Name, Phone, Email, ContactName, Website)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Phone, @Email, @ContactName, @Website)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Clients
+            SET Name = @Name, Phone = @Phone, Email = @Email, ContactName = @ContactName, Website = @Website
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = client.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    public async Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Positions.Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Positions.Name", filter.Name, "@Name");
+        AddLike(where, parameters, "Positions.Description", filter.Description, "@Description");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.StartDate, 120)", filter.StartDate, "@StartDate");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.Deadline, 120)", filter.Deadline, "@Deadline");
+        AddLike(where, parameters, "Positions.ClientContactName", filter.ClientContact, "@ClientContact");
+
+        var sql = """
+            SELECT Positions.Id, Positions.Name, Positions.Description, Positions.StartDate, Positions.Deadline,
+                   Positions.Hired, Positions.IdClient, Positions.ClientContactName, Positions.ClientContactPhone,
+                   Positions.ClientContactEmail, Clients.Name AS ClientName
+            FROM Positions
+            LEFT JOIN Clients ON Positions.IdClient = Clients.Id
+            """;
+
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Positions.Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var positions = new List<Position>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            positions.Add(ReadPosition(reader, includeClientName: true));
+        }
+
+        return positions;
+    }
+
+    public async Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            SELECT Id, Name, Description, StartDate, Deadline, Hired, IdClient,
+                   ClientContactName, ClientContactPhone, ClientContactEmail
+            FROM Positions
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadPosition(reader, includeClientName: false) : null;
+    }
+
+    public async Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Positions (Name, Description, StartDate, Deadline, Hired, ClientContactName,
+                                   ClientContactPhone, ClientContactEmail, IdClient)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Description, @StartDate, @Deadline, @Hired, @ClientContactName,
+                    @ClientContactPhone, @ClientContactEmail, @IdClient)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Positions
+            SET Name = @Name, Description = @Description, StartDate = @StartDate, Deadline = @Deadline,
+                Hired = @Hired, ClientContactName = @ClientContactName, ClientContactPhone = @ClientContactPhone,
+                ClientContactEmail = @ClientContactEmail, IdClient = @IdClient
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = position.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    private SqlConnection CreateConnection() => new(_connectionString);
+
+    private static void AddClientParameters(SqlCommand command, Client client)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = client.Name;
+        command.Parameters.Add("@Phone", SqlDbType.VarChar).Value = client.Phone;
+        command.Parameters.Add("@Email", SqlDbType.VarChar).Value = client.Email;
+        command.Parameters.Add("@ContactName", SqlDbType.VarChar).Value = client.ContactName;
+        command.Parameters.Add("@Website", SqlDbType.VarChar).Value = client.Website;
+    }
+
+    private static void AddPositionParameters(SqlCommand command, Position position, bool includeClient)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = position.Name;
+        command.Parameters.Add("@Description", SqlDbType.VarChar).Value = position.Description;
+        command.Parameters.Add("@StartDate", SqlDbType.Date).Value = (object?)position.StartDate ?? DBNull.Value;
+        command.Parameters.Add("@Deadline", SqlDbType.Date).Value = (object?)position.Deadline ?? DBNull.Value;
+        command.Parameters.Add("@Hired", SqlDbType.Bit).Value = position.Hired;
+        command.Parameters.Add("@ClientContactName", SqlDbType.VarChar).Value = position.ClientContactName;
+        command.Parameters.Add("@ClientContactPhone", SqlDbType.VarChar).Value = position.ClientContactPhone;
+        command.Parameters.Add("@ClientContactEmail", SqlDbType.VarChar).Value = position.ClientContactEmail;
+        if (includeClient)
+        {
+            command.Parameters.Add("@IdClient", SqlDbType.Int).Value = (object?)position.IdClient ?? DBNull.Value;
+        }
+    }
+
+    private static void AddLike(List<string> where, List<SqlParameter> parameters, string column, string? value, string? parameterName = null)
+    {
+        if (string.IsNullOrWhiteSpace(value))
+        {
+            return;
+        }
+
+        parameterName ??= "@" + column.Replace(".", string.Empty);
+        where.Add($"{column} LIKE {parameterName}");
+        parameters.Add(new SqlParameter(parameterName, SqlDbType.VarChar) { Value = "%" + value.Trim() + "%" });
+    }
+
+    private static Client ReadClient(SqlDataReader reader) => new()
+    {
+        Id = reader.GetInt32(0),
+        Name = GetString(reader, 1),
+        Phone = GetString(reader, 2),
+        Email = GetString(reader, 3),
+        ContactName = GetString(reader, 4),
+        Website = GetString(reader, 5)
+    };
+
+    private static Position ReadPosition(SqlDataReader reader, bool includeClientName)
+    {
+        var position = new Position
+        {
+            Id = reader.GetInt32(0),
+            Name = GetString(reader, 1),
+            Description = GetString(reader, 2),
+            StartDate = reader.IsDBNull(3) ? null : reader.GetDateTime(3),
+            Deadline = reader.IsDBNull(4) ? null : reader.GetDateTime(4),
+            Hired = !reader.IsDBNull(5) && reader.GetBoolean(5),
+            IdClient = reader.IsDBNull(6) ? null : reader.GetInt32(6),
+            ClientContactName = GetString(reader, 7),
+            ClientContactPhone = GetString(reader, 8),
+            ClientContactEmail = GetString(reader, 9)
+        };
+
+        if (includeClientName)
+        {
+            position.ClientName = GetString(reader, 10);
+        }
+
+        return position;
+    }
+
+    private static string GetString(SqlDataReader reader, int ordinal) =>
+        reader.IsDBNull(ordinal) ? string.Empty : reader.GetString(ordinal);
+}
diff --git a/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..468316298ba01ef622db9ffeeb20a3df775fc996
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
@@ -0,0 +1,15 @@
+using IRM.SPA.Models;
+
+namespace IRM.SPA.Services;
+
+public interface IHiringRepository
+{
+    Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default);
+    Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default);
+    Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default);
+    Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default);
+}
diff --git a/LegacyOutput/src/IRM.SPA/wwwroot/app.css b/LegacyOutput/src/IRM.SPA/wwwroot/app.css
index 7ac30e2a8df7ef2e3f233e331d1d58ca449099d8..c4e3f519ac693dd5c0ee569dc7dae70aa51945dc
--- a/LegacyOutput/src/IRM.SPA/wwwroot/app.css
+++ b/LegacyOutput/src/IRM.SPA/wwwroot/app.css
@@ -1,51 +1,247 @@
-html, body {
-    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
-}
-
-a, .btn-link {
-    color: #006bb7;
-}
-
-.btn-primary {
-    color: #fff;
-    background-color: #1b6ec2;
-    border-color: #1861ac;
-}
-
-.btn:focus, .btn:active:focus, .btn-link.nav-link:focus, .form-control:focus, .form-check-input:focus {
-  box-shadow: 0 0 0 0.1rem white, 0 0 0 0.25rem #258cfb;
-}
-
-.content {
-    padding-top: 1.1rem;
-}
-
-h1:focus {
-    outline: none;
-}
-
-.valid.modified:not([type=checkbox]) {
-    outline: 1px solid #26b050;
-}
-
-.invalid {
-    outline: 1px solid #e50000;
-}
-
-.validation-message {
-    color: #e50000;
-}
-
-.blazor-error-boundary {
-    background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNDkiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIG92ZXJmbG93PSJoaWRkZW4iPjxkZWZzPjxjbGlwUGF0aCBpZD0iY2xpcDAiPjxyZWN0IHg9IjIzNSIgeT0iNTEiIHdpZHRoPSI1NiIgaGVpZ2h0PSI0OSIvPjwvY2xpcFBhdGg+PC9kZWZzPjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMCkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yMzUgLTUxKSI+PHBhdGggZD0iTTI2My41MDYgNTFDMjY0LjcxNyA1MSAyNjUuODEzIDUxLjQ4MzcgMjY2LjYwNiA1Mi4yNjU4TDI2Ny4wNTIgNTIuNzk4NyAyNjcuNTM5IDUzLjYyODMgMjkwLjE4NSA5Mi4xODMxIDI5MC41NDUgOTIuNzk1IDI5MC42NTYgOTIuOTk2QzI5MC44NzcgOTMuNTEzIDI5MSA5NC4wODE1IDI5MSA5NC42NzgyIDI5MSA5Ny4wNjUxIDI4OS4wMzggOTkgMjg2LjYxNyA5OUwyNDAuMzgzIDk5QzIzNy45NjMgOTkgMjM2IDk3LjA2NTEgMjM2IDk0LjY3ODIgMjM2IDk0LjM3OTkgMjM2LjAzMSA5NC4wODg2IDIzNi4wODkgOTMuODA3MkwyMzYuMzM4IDkzLjAxNjIgMjM2Ljg1OCA5Mi4xMzE0IDI1OS40NzMgNTMuNjI5NCAyNTkuOTYxIDUyLjc5ODUgMjYwLjQwNyA1Mi4yNjU4QzI2MS4yIDUxLjQ4MzcgMjYyLjI5NiA1MSAyNjMuNTA2IDUxWk0yNjMuNTg2IDY2LjAxODNDMjYwLjczNyA2Ni4wMTgzIDI1OS4zMTMgNjcuMTI0NSAyNTkuMzEzIDY5LjMzNyAyNTkuMzEzIDY5LjYxMDIgMjU5LjMzMiA2OS44NjA4IDI1OS4zNzEgNzAuMDg4N0wyNjEuNzk1IDg0LjAxNjEgMjY1LjM4IDg0LjAxNjEgMjY3LjgyMSA2OS43NDc1QzI2Ny44NiA2OS43MzA5IDI2Ny44NzkgNjkuNTg3NyAyNjcuODc5IDY5LjMxNzkgMjY3Ljg3OSA2Ny4xMTgyIDI2Ni40NDggNjYuMDE4MyAyNjMuNTg2IDY2LjAxODNaTTI2My41NzYgODYuMDU0N0MyNjEuMDQ5IDg2LjA1NDcgMjU5Ljc4NiA4Ny4zMDA1IDI1OS43ODYgODkuNzkyMSAyNTkuNzg2IDkyLjI4MzcgMjYxLjA0OSA5My41Mjk1IDI2My41NzYgOTMuNTI5NSAyNjYuMTE2IDkzLjUyOTUgMjY3LjM4NyA5Mi4yODM3IDI2Ny4zODcgODkuNzkyMSAyNjcuMzg3IDg3LjMwMDUgMjY2LjExNiA4Ni4wNTQ3IDI2My41NzYgODYuMDU0N1oiIGZpbGw9IiNGRkU1MDAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48L3N2Zz4=) no-repeat 1rem/1.8rem, #b32121;
-    padding: 1rem 1rem 1rem 3.7rem;
-    color: white;
-}
-
-    .blazor-error-boundary::after {
-        content: "An error has occurred."
-    }
-
-.darker-border-checkbox.form-check-input {
-    border-color: #929292;
-}
+html,
+body {
+    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
+}
+
+body {
+    padding-top: 50px;
+    padding-bottom: 20px;
+}
+
+.body-content {
+    padding-left: 15px;
+    padding-right: 15px;
+}
+
+.dl-horizontal dt {
+    white-space: normal;
+}
+
+input[type="text"],
+input[type="password"],
+input[type="email"],
+input[type="tel"],
+input[type="select"] {
+    max-width: 280px;
+}
+
+.jumbotron {
+    padding: 30px;
+    margin-bottom: 30px;
+    color: inherit;
+    background-color: #eee;
+    border-radius: 6px;
+}
+
+.jumbotron h1 {
+    font-size: 63px;
+}
+
+.lead {
+    margin-bottom: 20px;
+    font-size: 21px;
+    font-weight: 300;
+    line-height: 1.4;
+}
+
+.navbar-inverse {
+    background-color: #222;
+    border-color: #080808;
+}
+
+.navbar-fixed-top {
+    position: fixed;
+    right: 0;
+    left: 0;
+    z-index: 1030;
+    top: 0;
+    border-width: 0 0 1px;
+}
+
+.navbar {
+    min-height: 50px;
+    margin-bottom: 20px;
+    border: 1px solid transparent;
+}
+
+.navbar-header {
+    float: left;
+}
+
+.navbar-brand {
+    float: left;
+    height: 50px;
+    padding: 15px;
+    font-size: 18px;
+    line-height: 20px;
+}
+
+.navbar-inverse .navbar-brand,
+.navbar-inverse .navbar-nav > li > a {
+    color: #9d9d9d;
+}
+
+.navbar-inverse .navbar-brand:hover,
+.navbar-inverse .navbar-nav > li > a:hover,
+.navbar-inverse .navbar-nav > li > a.active {
+    color: #fff;
+    text-decoration: none;
+}
+
+.navbar-nav {
+    float: left;
+    margin: 0;
+}
+
+.nav > li {
+    position: relative;
+    display: block;
+}
+
+.navbar-nav > li {
+    float: left;
+}
+
+.nav > li > a {
+    position: relative;
+    display: block;
+    padding: 10px 15px;
+}
+
+.navbar-nav > li > a {
+    padding-top: 15px;
+    padding-bottom: 15px;
+    line-height: 20px;
+}
+
+.btn-default {
+    color: #333;
+    background-color: #fff;
+    border-color: #ccc;
+}
+
+.btn {
+    display: inline-block;
+    padding: 6px 12px;
+    margin-bottom: 0;
+    font-size: 14px;
+    font-weight: 400;
+    line-height: 1.42857143;
+    text-align: center;
+    white-space: nowrap;
+    vertical-align: middle;
+    cursor: pointer;
+    border: 1px solid transparent;
+    border-radius: 4px;
+}
+
+.formLabel {
+    display: inline-block;
+    width: 200px;
+}
+
+.legacy-table {
+    margin-top: 20px;
+    margin-bottom: 10px;
+    border-collapse: separate;
+    border-spacing: 2px;
+}
+
+.legacy-table th,
+.legacy-table td {
+    padding: 1px;
+    font-weight: normal;
+    text-align: left;
+    vertical-align: top;
+}
+
+.legacy-table th {
+    font-weight: bold;
+}
+
+.legacy-table input[type="text"] {
+    width: 130px;
+}
+
+.description-input {
+    width: 500px;
+    max-width: 100%;
+    vertical-align: top;
+}
+
+.link-button {
+    padding: 0;
+    color: #337ab7;
+    background: none;
+    border: 0;
+    cursor: pointer;
+    font: inherit;
+}
+
+.link-button:hover {
+    color: #23527c;
+    text-decoration: underline;
+}
+
+.alert {
+    padding: 15px;
+    margin-top: 20px;
+    margin-bottom: 20px;
+    border: 1px solid transparent;
+    border-radius: 4px;
+}
+
+.alert-danger {
+    color: #a94442;
+    background-color: #f2dede;
+    border-color: #ebccd1;
+}
+
+@media screen and (min-width: 768px) {
+    .jumbotron {
+        margin-top: 20px;
+    }
+
+    .body-content {
+        padding: 0;
+    }
+}
+
+@media screen and (max-width: 767px) {
+    .navbar-header,
+    .navbar-nav,
+    .navbar-nav > li {
+        float: none;
+    }
+
+    .navbar-fixed-top {
+        position: static;
+    }
+
+    body {
+        padding-top: 0;
+    }
+
+    .jumbotron h1 {
+        font-size: 42px;
+    }
+}
+
+#blazor-error-ui {
+    background: lightyellow;
+    bottom: 0;
+    box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.2);
+    display: none;
+    left: 0;
+    padding: 0.6rem 1.25rem 0.7rem 1.25rem;
+    position: fixed;
+    width: 100%;
+    z-index: 1000;
+}
+
+#blazor-error-ui .dismiss {
+    cursor: pointer;
+    position: absolute;
+    right: 0.75rem;
+    top: 0.5rem;
+}

diff --git a/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor b/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
index 62e62873d628af7e91de98824e1143460b2db2a0..a9714ae63155375bce0d34f8e2a2cda4c6cfbeeb
--- a/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
@@ -1,23 +1,30 @@
-﻿@inherits LayoutComponentBase
-
-<div class="page">
-    <div class="sidebar">
-        <NavMenu />
-    </div>
-
-    <main>
-        <div class="top-row px-4">
-            <a href="https://learn.microsoft.com/aspnet/core/" target="_blank">About</a>
-        </div>
-
-        <article class="content px-4">
-            @Body
-        </article>
-    </main>
-</div>
-
-<div id="blazor-error-ui">
-    An unhandled error has occurred.
-    <a href="" class="reload">Reload</a>
-    <a class="dismiss">🗙</a>
-</div>
+@inherits LayoutComponentBase
+
+<div class="navbar navbar-inverse navbar-fixed-top">
+    <div class="container">
+        <div class="navbar-header">
+            <a class="navbar-brand" href="/">Hiring Tracker</a>
+        </div>
+        <div class="navbar-collapse collapse">
+            <ul class="nav navbar-nav">
+                <li><NavLink href="/" Match="NavLinkMatch.All">Home</NavLink></li>
+                <li><NavLink href="clients">Clients</NavLink></li>
+                <li><NavLink href="positions">Positions</NavLink></li>
+            </ul>
+        </div>
+    </div>
+</div>
+
+<div class="container body-content">
+    @Body
+    <hr />
+    <footer>
+        <p>&copy; @DateTime.Now.Year - Hiring Tracker</p>
+    </footer>
+</div>
+
+<div id="blazor-error-ui">
+    An unhandled error has occurred.
+    <a href="" class="reload">Reload</a>
+    <a class="dismiss">x</a>
+</div>
diff --git a/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor b/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
index 259e68b4bc97ef9ecc0b3899dc192d7790fd9b4c..c765fe7b74acb5c30b228509af2a8a6e6e1bf3c6
--- a/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
@@ -1,30 +1 @@
-﻿<div class="top-row ps-3 navbar navbar-dark">
-    <div class="container-fluid">
-        <a class="navbar-brand" href="">IRM.SPA</a>
-    </div>
-</div>
-
-<input type="checkbox" title="Navigation menu" class="navbar-toggler" />
-
-<div class="nav-scrollable" onclick="document.querySelector('.navbar-toggler').click()">
-    <nav class="flex-column">
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="" Match="NavLinkMatch.All">
-                <span class="bi bi-house-door-fill-nav-menu" aria-hidden="true"></span> Home
-            </NavLink>
-        </div>
-
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="counter">
-                <span class="bi bi-plus-square-fill-nav-menu" aria-hidden="true"></span> Counter
-            </NavLink>
-        </div>
-
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="weather">
-                <span class="bi bi-list-nested-nav-menu" aria-hidden="true"></span> Weather
-            </NavLink>
-        </div>
-    </nav>
-</div>
-
+@* Navigation is defined in MainLayout to match the legacy Site.Master markup. *@
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor
new file mode 100644
index 0000000000000000000000000000000000000000..1232eae426ef2325a0505f006805d6a05ba6115e
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor
@@ -0,0 +1,104 @@
+@page "/clients/new"
+@page "/clients/{Id:int}"
+@page "/ClientDetails"
+@page "/ClientDetails.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+@inject IJSRuntime JS
+
+<PageTitle>Client Details - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="SaveAsync" @onsubmit:preventDefault>
+    <span class="formLabel">Id:</span>
+    <span>@(client.Id == 0 ? string.Empty : client.Id)</span>
+    <br />
+    <span class="formLabel">Name:</span>
+    <input type="text" @bind="client.Name" />
+    <br />
+    <span class="formLabel">Phone:</span>
+    <input type="text" @bind="client.Phone" />
+    <br />
+    <span class="formLabel">Email:</span>
+    <input type="text" @bind="client.Email" />
+    <br />
+    <span class="formLabel">Contact Name:</span>
+    <input type="text" @bind="client.ContactName" />
+    <br />
+    <span class="formLabel">Website:</span>
+    <input type="text" @bind="client.Website" />
+    <br />
+    @if (isEdit)
+    {
+        <button class="link-button" type="submit">Update</button>
+    }
+    else
+    {
+        <button class="link-button" type="submit">Insert</button>
+    }
+</form>
+
+@code {
+    [Parameter] public int? Id { get; set; }
+
+    private Client client = new();
+    private bool isEdit;
+    private string? errorMessage;
+
+    protected override async Task OnParametersSetAsync()
+    {
+        errorMessage = null;
+        isEdit = false;
+        client = new Client();
+
+        if (Id is not { } id)
+        {
+            return;
+        }
+
+        try
+        {
+            var existing = await Repository.GetClientAsync(id);
+            if (existing is not null)
+            {
+                client = existing;
+                isEdit = true;
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load client. " + ex.Message;
+        }
+    }
+
+    private async Task SaveAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            if (isEdit)
+            {
+                if (await Repository.UpdateClientAsync(client))
+                {
+                    await JS.InvokeVoidAsync("alert", "Client updated successfully");
+                }
+            }
+            else
+            {
+                client.Id = await Repository.InsertClientAsync(client);
+                isEdit = true;
+                await JS.InvokeVoidAsync("alert", "Client added successfully");
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to save client. " + ex.Message;
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor
new file mode 100644
index 0000000000000000000000000000000000000000..774521377b61d400b5e79c84a3304d20b83878b3
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor
@@ -0,0 +1,85 @@
+@page "/clients"
+@page "/ClientsList"
+@page "/ClientsList.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+
+<PageTitle>Clients - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="ApplyFilter" @onsubmit:preventDefault>
+    <table class="legacy-table">
+        <thead>
+            <tr>
+                <th>Id</th>
+                <th>Client Name</th>
+                <th>Phone</th>
+                <th>Email</th>
+                <th>Website</th>
+                <th>Contact Name</th>
+                <th></th>
+            </tr>
+            <tr>
+                <th><input type="text" @bind="filter.Id" /></th>
+                <th><input type="text" @bind="filter.Name" /></th>
+                <th><input type="text" @bind="filter.Phone" /></th>
+                <th><input type="text" @bind="filter.Email" /></th>
+                <th><input type="text" @bind="filter.Website" /></th>
+                <th><input type="text" @bind="filter.ContactName" /></th>
+                <th><button type="submit">Filter</button></th>
+            </tr>
+        </thead>
+        <tbody>
+            @foreach (var client in clients)
+            {
+                <tr>
+                    <td>@client.Id</td>
+                    <td>@client.Name</td>
+                    <td>@client.Phone</td>
+                    <td>@client.Email</td>
+                    <td>@client.Website</td>
+                    <td>@client.ContactName</td>
+                    <td><a href="clients/@client.Id">Details</a></td>
+                </tr>
+            }
+        </tbody>
+    </table>
+</form>
+
+<a href="clients/new">Add new client</a>
+
+@code {
+    private readonly ClientFilter filter = new();
+    private IReadOnlyList<Client> clients = [];
+    private string? errorMessage;
+
+    protected override async Task OnInitializedAsync()
+    {
+        await LoadClientsAsync();
+    }
+
+    private async Task ApplyFilter()
+    {
+        await LoadClientsAsync();
+    }
+
+    private async Task LoadClientsAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            clients = await Repository.GetClientsAsync(filter);
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load clients. " + ex.Message;
+            clients = [];
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
index df0502354fdfbbef85e1673ffcff56d85d2481bf..e4fbd72369d329a04d4cead6939579592e284c3d
--- a/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
@@ -1,7 +1,26 @@
-﻿@page "/"
-
-<PageTitle>Home</PageTitle>
-
-<h1>Hello, world!</h1>
-
-Welcome to your new app.
+@page "/"
+@page "/Default.aspx"
+
+<PageTitle>Home Page - Hiring Tracker</PageTitle>
+
+<div class="jumbotron">
+    <h1>Hiring Tracking</h1>
+    <p class="lead">Track positions and candidates.</p>
+</div>
+
+<div class="row">
+    <div class="col-md-4">
+        <h2>Positions</h2>
+        <p>View open positions or query previous hires.</p>
+        <p>
+            <a class="btn btn-default" href="positions">View</a>
+        </p>
+    </div>
+    <div class="col-md-4">
+        <h2>Clients</h2>
+        <p>Manage contacts requesting the positions.</p>
+        <p>
+            <a class="btn btn-default" href="clients">View</a>
+        </p>
+    </div>
+</div>
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor
new file mode 100644
index 0000000000000000000000000000000000000000..51bb6ec59ec33db24c64c1bb595bdf18d2e087ec
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor
@@ -0,0 +1,139 @@
+@page "/positions/new"
+@page "/positions/{Id:int}"
+@page "/PositionDetails"
+@page "/PositionDetails.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+@inject IJSRuntime JS
+
+<PageTitle>Position Details - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="SaveAsync" @onsubmit:preventDefault>
+    <span class="formLabel">Id:</span>
+    <span>@(position.Id == 0 ? string.Empty : position.Id)</span>
+    <br />
+    <span class="formLabel">Name:</span>
+    <input type="text" @bind="position.Name" />
+    <br />
+    <span class="formLabel">Description:</span>
+    <textarea rows="6" class="description-input" @bind="position.Description"></textarea>
+    <br />
+    <span class="formLabel">Start Date:</span>
+    <input type="date" value="@startDateText" @onchange="e => startDateText = e.Value?.ToString() ?? string.Empty" />
+    <br />
+    <span class="formLabel">Deadline:</span>
+    <input type="date" value="@deadlineText" @onchange="e => deadlineText = e.Value?.ToString() ?? string.Empty" />
+    <br />
+    <span class="formLabel">Hired?:</span>
+    <input type="checkbox" @bind="position.Hired" />
+    <br />
+    <span class="formLabel">Client:</span>
+    <select @bind="position.IdClient">
+        @foreach (var client in clients)
+        {
+            <option value="@client.Id">@client.Name</option>
+        }
+    </select>
+    <br />
+    <span class="formLabel">Client Contact Name:</span>
+    <input type="text" @bind="position.ClientContactName" />
+    <br />
+    <span class="formLabel">Phone:</span>
+    <input type="text" @bind="position.ClientContactPhone" />
+    <br />
+    <span class="formLabel">Email:</span>
+    <input type="text" @bind="position.ClientContactEmail" />
+    <br />
+    @if (isEdit)
+    {
+        <button class="link-button" type="submit">Update</button>
+    }
+    else
+    {
+        <button class="link-button" type="submit">Insert</button>
+    }
+</form>
+
+@code {
+    [Parameter] public int? Id { get; set; }
+
+    private Position position = new();
+    private IReadOnlyList<Client> clients = [];
+    private bool isEdit;
+    private string? errorMessage;
+    private string startDateText = string.Empty;
+    private string deadlineText = string.Empty;
+
+    protected override async Task OnParametersSetAsync()
+    {
+        errorMessage = null;
+        isEdit = false;
+        position = new Position();
+        startDateText = string.Empty;
+        deadlineText = string.Empty;
+
+        try
+        {
+            clients = await Repository.GetClientsAsync(new ClientFilter());
+            position.IdClient = clients.FirstOrDefault()?.Id;
+
+            if (Id is not { } id)
+            {
+                return;
+            }
+
+            var existing = await Repository.GetPositionAsync(id);
+            if (existing is not null)
+            {
+                position = existing;
+                startDateText = ToDateInputValue(position.StartDate);
+                deadlineText = ToDateInputValue(position.Deadline);
+                isEdit = true;
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load position. " + ex.Message;
+        }
+    }
+
+    private async Task SaveAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            position.StartDate = ParseDate(startDateText);
+            position.Deadline = ParseDate(deadlineText);
+
+            if (isEdit)
+            {
+                if (await Repository.UpdatePositionAsync(position))
+                {
+                    await JS.InvokeVoidAsync("alert", "Position updated successfully");
+                }
+            }
+            else
+            {
+                position.Id = await Repository.InsertPositionAsync(position);
+                isEdit = true;
+                await JS.InvokeVoidAsync("alert", "Position added successfully");
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to save position. " + ex.Message;
+        }
+    }
+
+    private static string ToDateInputValue(DateTime? value) => value?.ToString("yyyy-MM-dd") ?? string.Empty;
+
+    private static DateTime? ParseDate(string value) =>
+        DateTime.TryParse(value, out var parsed) ? parsed.Date : null;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor
new file mode 100644
index 0000000000000000000000000000000000000000..efdcec61db320f36ea4b1bad176e604944be65e2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor
@@ -0,0 +1,88 @@
+@page "/positions"
+@page "/PositionsList"
+@page "/PositionsList.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+
+<PageTitle>Positions - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="ApplyFilter" @onsubmit:preventDefault>
+    <table class="legacy-table">
+        <thead>
+            <tr>
+                <th>Id</th>
+                <th>Name</th>
+                <th>Description</th>
+                <th>Start Date</th>
+                <th>Deadline</th>
+                <th>Position Closed</th>
+                <th>Client Contact</th>
+                <th></th>
+            </tr>
+            <tr>
+                <th><input type="text" @bind="filter.Id" /></th>
+                <th><input type="text" @bind="filter.Name" /></th>
+                <th><input type="text" @bind="filter.Description" /></th>
+                <th><input type="text" @bind="filter.StartDate" /></th>
+                <th><input type="text" @bind="filter.Deadline" /></th>
+                <th></th>
+                <th><input type="text" @bind="filter.ClientContact" /></th>
+                <th><button type="submit">Filter</button></th>
+            </tr>
+        </thead>
+        <tbody>
+            @foreach (var position in positions)
+            {
+                <tr>
+                    <td>@position.Id</td>
+                    <td>@position.Name</td>
+                    <td>@position.Description</td>
+                    <td>@position.StartDate</td>
+                    <td>@position.Deadline</td>
+                    <td>@position.Hired</td>
+                    <td>@position.ClientName (@position.ClientContactName)</td>
+                    <td><a href="positions/@position.Id">Details</a></td>
+                </tr>
+            }
+        </tbody>
+    </table>
+</form>
+
+<a href="positions/new">Add new position</a>
+
+@code {
+    private readonly PositionFilter filter = new();
+    private IReadOnlyList<Position> positions = [];
+    private string? errorMessage;
+
+    protected override async Task OnInitializedAsync()
+    {
+        await LoadPositionsAsync();
+    }
+
+    private async Task ApplyFilter()
+    {
+        await LoadPositionsAsync();
+    }
+
+    private async Task LoadPositionsAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            positions = await Repository.GetPositionsAsync(filter);
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load positions. " + ex.Message;
+            positions = [];
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/_Imports.razor b/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
index de2621323fafca41583fecc7d1b4b181a1e49ac1..4ca0297300bf206b5f4f4e3af4a8adffd1865970
--- a/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
@@ -5,6 +5,8 @@
 @using Microsoft.AspNetCore.Components.Web
 @using static Microsoft.AspNetCore.Components.Web.RenderMode
 @using Microsoft.AspNetCore.Components.Web.Virtualization
-@using Microsoft.JSInterop
-@using IRM.SPA
-@using IRM.SPA.Components
+@using Microsoft.JSInterop
+@using IRM.SPA
+@using IRM.SPA.Components
+@using IRM.SPA.Models
+@using IRM.SPA.Services
diff --git a/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs b/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
index 8a7b20c19addfd182712b09a487081eda45d085a..a1e19750167d74ae38221cb933beb102768676d5
--- a/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
+++ b/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
@@ -13,13 +13,14 @@
 {
     public static class DependancyInjector
     {
-        public static void RegisterServices(IServiceCollection services, ConfigurationOptions config)
-        {
-           
-
-            RegisterApiClients(services, config);           
-            RegisterModelValidators(services);
-        }
+        public static void RegisterServices(IServiceCollection services, ConfigurationOptions config)
+        {
+           
+
+            services.AddScoped<IHiringRepository, HiringRepository>();
+            RegisterApiClients(services, config);           
+            RegisterModelValidators(services);
+        }
        
         private static void RegisterModelValidators(IServiceCollection services)
         {
diff --git a/LegacyOutput/src/IRM.SPA/Models/Client.cs b/LegacyOutput/src/IRM.SPA/Models/Client.cs
new file mode 100644
index 0000000000000000000000000000000000000000..46bfecbc332bde56ebed47d21516d9a9c7773d42
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Client.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class Client
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Phone { get; set; } = string.Empty;
+    public string Email { get; set; } = string.Empty;
+    public string ContactName { get; set; } = string.Empty;
+    public string Website { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..d59d0bb30c1802c64fa28e40d6a449e156739081
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class ClientFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Phone { get; set; }
+    public string? Email { get; set; }
+    public string? Website { get; set; }
+    public string? ContactName { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/Position.cs b/LegacyOutput/src/IRM.SPA/Models/Position.cs
new file mode 100644
index 0000000000000000000000000000000000000000..a6f9543eebd29c5626ed28741e6b4065ad3d16cf
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Position.cs
@@ -0,0 +1,16 @@
+namespace IRM.SPA.Models;
+
+public sealed class Position
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Description { get; set; } = string.Empty;
+    public DateTime? StartDate { get; set; }
+    public DateTime? Deadline { get; set; }
+    public bool Hired { get; set; }
+    public int? IdClient { get; set; }
+    public string ClientName { get; set; } = string.Empty;
+    public string ClientContactName { get; set; } = string.Empty;
+    public string ClientContactPhone { get; set; } = string.Empty;
+    public string ClientContactEmail { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..cfa76e79d96580b7b4d98e9b476807ef6f12acb5
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class PositionFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Description { get; set; }
+    public string? StartDate { get; set; }
+    public string? Deadline { get; set; }
+    public string? ClientContact { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Program.cs b/LegacyOutput/src/IRM.SPA/Program.cs
index 00184fc283cd7060825796fd98e55be1c243edd6..2008eaa884f07089ce5823fe41c6a6336a34f709
--- a/LegacyOutput/src/IRM.SPA/Program.cs
+++ b/LegacyOutput/src/IRM.SPA/Program.cs
@@ -10,8 +10,9 @@
     {
         public static void Main(string[] args)
         {
-            var builder = WebApplication.CreateBuilder(args);
-            ConfigurationOptions config = builder.Configuration.Get<ConfigurationOptions>() ?? new ConfigurationOptions();
+            var builder = WebApplication.CreateBuilder(args);
+            AppDomain.CurrentDomain.SetData("DataDirectory", Path.Combine(builder.Environment.ContentRootPath, "App_Data"));
+            ConfigurationOptions config = builder.Configuration.Get<ConfigurationOptions>() ?? new ConfigurationOptions();
             // Add services to the container.
             builder.Services.AddRazorComponents()
                 .AddInteractiveServerComponents();           
diff --git a/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..1c88253e59d707a339e900e3d8c1a8b2d56950d2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
@@ -0,0 +1,268 @@
+using System.Data;
+using IRM.SPA.Models;
+using Microsoft.Data.SqlClient;
+
+namespace IRM.SPA.Services;
+
+public sealed class HiringRepository(IConfiguration configuration) : IHiringRepository
+{
+    private readonly string _connectionString = configuration.GetConnectionString("HiringConnection")
+        ?? throw new InvalidOperationException("ConnectionStrings:HiringConnection is not configured.");
+
+    public async Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Name", filter.Name);
+        AddLike(where, parameters, "Phone", filter.Phone);
+        AddLike(where, parameters, "Email", filter.Email);
+        AddLike(where, parameters, "Website", filter.Website);
+        AddLike(where, parameters, "ContactName", filter.ContactName);
+
+        var sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients";
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var clients = new List<Client>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            clients.Add(ReadClient(reader));
+        }
+
+        return clients;
+    }
+
+    public async Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients WHERE Id = @Id";
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadClient(reader) : null;
+    }
+
+    public async Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Clients (Name, Phone, Email, ContactName, Website)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Phone, @Email, @ContactName, @Website)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Clients
+            SET Name = @Name, Phone = @Phone, Email = @Email, ContactName = @ContactName, Website = @Website
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = client.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    public async Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Positions.Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Positions.Name", filter.Name, "@Name");
+        AddLike(where, parameters, "Positions.Description", filter.Description, "@Description");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.StartDate, 120)", filter.StartDate, "@StartDate");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.Deadline, 120)", filter.Deadline, "@Deadline");
+        AddLike(where, parameters, "Positions.ClientContactName", filter.ClientContact, "@ClientContact");
+
+        var sql = """
+            SELECT Positions.Id, Positions.Name, Positions.Description, Positions.StartDate, Positions.Deadline,
+                   Positions.Hired, Positions.IdClient, Positions.ClientContactName, Positions.ClientContactPhone,
+                   Positions.ClientContactEmail, Clients.Name AS ClientName
+            FROM Positions
+            LEFT JOIN Clients ON Positions.IdClient = Clients.Id
+            """;
+
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Positions.Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var positions = new List<Position>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            positions.Add(ReadPosition(reader, includeClientName: true));
+        }
+
+        return positions;
+    }
+
+    public async Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            SELECT Id, Name, Description, StartDate, Deadline, Hired, IdClient,
+                   ClientContactName, ClientContactPhone, ClientContactEmail
+            FROM Positions
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadPosition(reader, includeClientName: false) : null;
+    }
+
+    public async Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Positions (Name, Description, StartDate, Deadline, Hired, ClientContactName,
+                                   ClientContactPhone, ClientContactEmail, IdClient)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Description, @StartDate, @Deadline, @Hired, @ClientContactName,
+                    @ClientContactPhone, @ClientContactEmail, @IdClient)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Positions
+            SET Name = @Name, Description = @Description, StartDate = @StartDate, Deadline = @Deadline,
+                Hired = @Hired, ClientContactName = @ClientContactName, ClientContactPhone = @ClientContactPhone,
+                ClientContactEmail = @ClientContactEmail, IdClient = @IdClient
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = position.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    private SqlConnection CreateConnection() => new(_connectionString);
+
+    private static void AddClientParameters(SqlCommand command, Client client)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = client.Name;
+        command.Parameters.Add("@Phone", SqlDbType.VarChar).Value = client.Phone;
+        command.Parameters.Add("@Email", SqlDbType.VarChar).Value = client.Email;
+        command.Parameters.Add("@ContactName", SqlDbType.VarChar).Value = client.ContactName;
+        command.Parameters.Add("@Website", SqlDbType.VarChar).Value = client.Website;
+    }
+
+    private static void AddPositionParameters(SqlCommand command, Position position, bool includeClient)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = position.Name;
+        command.Parameters.Add("@Description", SqlDbType.VarChar).Value = position.Description;
+        command.Parameters.Add("@StartDate", SqlDbType.Date).Value = (object?)position.StartDate ?? DBNull.Value;
+        command.Parameters.Add("@Deadline", SqlDbType.Date).Value = (object?)position.Deadline ?? DBNull.Value;
+        command.Parameters.Add("@Hired", SqlDbType.Bit).Value = position.Hired;
+        command.Parameters.Add("@ClientContactName", SqlDbType.VarChar).Value = position.ClientContactName;
+        command.Parameters.Add("@ClientContactPhone", SqlDbType.VarChar).Value = position.ClientContactPhone;
+        command.Parameters.Add("@ClientContactEmail", SqlDbType.VarChar).Value = position.ClientContactEmail;
+        if (includeClient)
+        {
+            command.Parameters.Add("@IdClient", SqlDbType.Int).Value = (object?)position.IdClient ?? DBNull.Value;
+        }
+    }
+
+    private static void AddLike(List<string> where, List<SqlParameter> parameters, string column, string? value, string? parameterName = null)
+    {
+        if (string.IsNullOrWhiteSpace(value))
+        {
+            return;
+        }
+
+        parameterName ??= "@" + column.Replace(".", string.Empty);
+        where.Add($"{column} LIKE {parameterName}");
+        parameters.Add(new SqlParameter(parameterName, SqlDbType.VarChar) { Value = "%" + value.Trim() + "%" });
+    }
+
+    private static Client ReadClient(SqlDataReader reader) => new()
+    {
+        Id = reader.GetInt32(0),
+        Name = GetString(reader, 1),
+        Phone = GetString(reader, 2),
+        Email = GetString(reader, 3),
+        ContactName = GetString(reader, 4),
+        Website = GetString(reader, 5)
+    };
+
+    private static Position ReadPosition(SqlDataReader reader, bool includeClientName)
+    {
+        var position = new Position
+        {
+            Id = reader.GetInt32(0),
+            Name = GetString(reader, 1),
+            Description = GetString(reader, 2),
+            StartDate = reader.IsDBNull(3) ? null : reader.GetDateTime(3),
+            Deadline = reader.IsDBNull(4) ? null : reader.GetDateTime(4),
+            Hired = !reader.IsDBNull(5) && reader.GetBoolean(5),
+            IdClient = reader.IsDBNull(6) ? null : reader.GetInt32(6),
+            ClientContactName = GetString(reader, 7),
+            ClientContactPhone = GetString(reader, 8),
+            ClientContactEmail = GetString(reader, 9)
+        };
+
+        if (includeClientName)
+        {
+            position.ClientName = GetString(reader, 10);
+        }
+
+        return position;
+    }
+
+    private static string GetString(SqlDataReader reader, int ordinal) =>
+        reader.IsDBNull(ordinal) ? string.Empty : reader.GetString(ordinal);
+}
diff --git a/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..468316298ba01ef622db9ffeeb20a3df775fc996
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
@@ -0,0 +1,15 @@
+using IRM.SPA.Models;
+
+namespace IRM.SPA.Services;
+
+public interface IHiringRepository
+{
+    Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default);
+    Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default);
+    Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default);
+    Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default);
+}
diff --git a/LegacyOutput/src/IRM.SPA/wwwroot/app.css b/LegacyOutput/src/IRM.SPA/wwwroot/app.css
index 7ac30e2a8df7ef2e3f233e331d1d58ca449099d8..c4e3f519ac693dd5c0ee569dc7dae70aa51945dc
--- a/LegacyOutput/src/IRM.SPA/wwwroot/app.css
+++ b/LegacyOutput/src/IRM.SPA/wwwroot/app.css
@@ -1,51 +1,247 @@
-html, body {
-    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
-}
-
-a, .btn-link {
-    color: #006bb7;
-}
-
-.btn-primary {
-    color: #fff;
-    background-color: #1b6ec2;
-    border-color: #1861ac;
-}
-
-.btn:focus, .btn:active:focus, .btn-link.nav-link:focus, .form-control:focus, .form-check-input:focus {
-  box-shadow: 0 0 0 0.1rem white, 0 0 0 0.25rem #258cfb;
-}
-
-.content {
-    padding-top: 1.1rem;
-}
-
-h1:focus {
-    outline: none;
-}
-
-.valid.modified:not([type=checkbox]) {
-    outline: 1px solid #26b050;
-}
-
-.invalid {
-    outline: 1px solid #e50000;
-}
-
-.validation-message {
-    color: #e50000;
-}
-
-.blazor-error-boundary {
-    background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNDkiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIG92ZXJmbG93PSJoaWRkZW4iPjxkZWZzPjxjbGlwUGF0aCBpZD0iY2xpcDAiPjxyZWN0IHg9IjIzNSIgeT0iNTEiIHdpZHRoPSI1NiIgaGVpZ2h0PSI0OSIvPjwvY2xpcFBhdGg+PC9kZWZzPjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMCkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yMzUgLTUxKSI+PHBhdGggZD0iTTI2My41MDYgNTFDMjY0LjcxNyA1MSAyNjUuODEzIDUxLjQ4MzcgMjY2LjYwNiA1Mi4yNjU4TDI2Ny4wNTIgNTIuNzk4NyAyNjcuNTM5IDUzLjYyODMgMjkwLjE4NSA5Mi4xODMxIDI5MC41NDUgOTIuNzk1IDI5MC42NTYgOTIuOTk2QzI5MC44NzcgOTMuNTEzIDI5MSA5NC4wODE1IDI5MSA5NC42NzgyIDI5MSA5Ny4wNjUxIDI4OS4wMzggOTkgMjg2LjYxNyA5OUwyNDAuMzgzIDk5QzIzNy45NjMgOTkgMjM2IDk3LjA2NTEgMjM2IDk0LjY3ODIgMjM2IDk0LjM3OTkgMjM2LjAzMSA5NC4wODg2IDIzNi4wODkgOTMuODA3MkwyMzYuMzM4IDkzLjAxNjIgMjM2Ljg1OCA5Mi4xMzE0IDI1OS40NzMgNTMuNjI5NCAyNTkuOTYxIDUyLjc5ODUgMjYwLjQwNyA1Mi4yNjU4QzI2MS4yIDUxLjQ4MzcgMjYyLjI5NiA1MSAyNjMuNTA2IDUxWk0yNjMuNTg2IDY2LjAxODNDMjYwLjczNyA2Ni4wMTgzIDI1OS4zMTMgNjcuMTI0NSAyNTkuMzEzIDY5LjMzNyAyNTkuMzEzIDY5LjYxMDIgMjU5LjMzMiA2OS44NjA4IDI1OS4zNzEgNzAuMDg4N0wyNjEuNzk1IDg0LjAxNjEgMjY1LjM4IDg0LjAxNjEgMjY3LjgyMSA2OS43NDc1QzI2Ny44NiA2OS43MzA5IDI2Ny44NzkgNjkuNTg3NyAyNjcuODc5IDY5LjMxNzkgMjY3Ljg3OSA2Ny4xMTgyIDI2Ni40NDggNjYuMDE4MyAyNjMuNTg2IDY2LjAxODNaTTI2My41NzYgODYuMDU0N0MyNjEuMDQ5IDg2LjA1NDcgMjU5Ljc4NiA4Ny4zMDA1IDI1OS43ODYgODkuNzkyMSAyNTkuNzg2IDkyLjI4MzcgMjYxLjA0OSA5My41Mjk1IDI2My41NzYgOTMuNTI5NSAyNjYuMTE2IDkzLjUyOTUgMjY3LjM4NyA5Mi4yODM3IDI2Ny4zODcgODkuNzkyMSAyNjcuMzg3IDg3LjMwMDUgMjY2LjExNiA4Ni4wNTQ3IDI2My41NzYgODYuMDU0N1oiIGZpbGw9IiNGRkU1MDAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48L3N2Zz4=) no-repeat 1rem/1.8rem, #b32121;
-    padding: 1rem 1rem 1rem 3.7rem;
-    color: white;
-}
-
-    .blazor-error-boundary::after {
-        content: "An error has occurred."
-    }
-
-.darker-border-checkbox.form-check-input {
-    border-color: #929292;
-}
+html,
+body {
+    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
+}
+
+body {
+    padding-top: 50px;
+    padding-bottom: 20px;
+}
+
+.body-content {
+    padding-left: 15px;
+    padding-right: 15px;
+}
+
+.dl-horizontal dt {
+    white-space: normal;
+}
+
+input[type="text"],
+input[type="password"],
+input[type="email"],
+input[type="tel"],
+input[type="select"] {
+    max-width: 280px;
+}
+
+.jumbotron {
+    padding: 30px;
+    margin-bottom: 30px;
+    color: inherit;
+    background-color: #eee;
+    border-radius: 6px;
+}
+
+.jumbotron h1 {
+    font-size: 63px;
+}
+
+.lead {
+    margin-bottom: 20px;
+    font-size: 21px;
+    font-weight: 300;
+    line-height: 1.4;
+}
+
+.navbar-inverse {
+    background-color: #222;
+    border-color: #080808;
+}
+
+.navbar-fixed-top {
+    position: fixed;
+    right: 0;
+    left: 0;
+    z-index: 1030;
+    top: 0;
+    border-width: 0 0 1px;
+}
+
+.navbar {
+    min-height: 50px;
+    margin-bottom: 20px;
+    border: 1px solid transparent;
+}
+
+.navbar-header {
+    float: left;
+}
+
+.navbar-brand {
+    float: left;
+    height: 50px;
+    padding: 15px;
+    font-size: 18px;
+    line-height: 20px;
+}
+
+.navbar-inverse .navbar-brand,
+.navbar-inverse .navbar-nav > li > a {
+    color: #9d9d9d;
+}
+
+.navbar-inverse .navbar-brand:hover,
+.navbar-inverse .navbar-nav > li > a:hover,
+.navbar-inverse .navbar-nav > li > a.active {
+    color: #fff;
+    text-decoration: none;
+}
+
+.navbar-nav {
+    float: left;
+    margin: 0;
+}
+
+.nav > li {
+    position: relative;
+    display: block;
+}
+
+.navbar-nav > li {
+    float: left;
+}
+
+.nav > li > a {
+    position: relative;
+    display: block;
+    padding: 10px 15px;
+}
+
+.navbar-nav > li > a {
+    padding-top: 15px;
+    padding-bottom: 15px;
+    line-height: 20px;
+}
+
+.btn-default {
+    color: #333;
+    background-color: #fff;
+    border-color: #ccc;
+}
+
+.btn {
+    display: inline-block;
+    padding: 6px 12px;
+    margin-bottom: 0;
+    font-size: 14px;
+    font-weight: 400;
+    line-height: 1.42857143;
+    text-align: center;
+    white-space: nowrap;
+    vertical-align: middle;
+    cursor: pointer;
+    border: 1px solid transparent;
+    border-radius: 4px;
+}
+
+.formLabel {
+    display: inline-block;
+    width: 200px;
+}
+
+.legacy-table {
+    margin-top: 20px;
+    margin-bottom: 10px;
+    border-collapse: separate;
+    border-spacing: 2px;
+}
+
+.legacy-table th,
+.legacy-table td {
+    padding: 1px;
+    font-weight: normal;
+    text-align: left;
+    vertical-align: top;
+}
+
+.legacy-table th {
+    font-weight: bold;
+}
+
+.legacy-table input[type="text"] {
+    width: 130px;
+}
+
+.description-input {
+    width: 500px;
+    max-width: 100%;
+    vertical-align: top;
+}
+
+.link-button {
+    padding: 0;
+    color: #337ab7;
+    background: none;
+    border: 0;
+    cursor: pointer;
+    font: inherit;
+}
+
+.link-button:hover {
+    color: #23527c;
+    text-decoration: underline;
+}
+
+.alert {
+    padding: 15px;
+    margin-top: 20px;
+    margin-bottom: 20px;
+    border: 1px solid transparent;
+    border-radius: 4px;
+}
+
+.alert-danger {
+    color: #a94442;
+    background-color: #f2dede;
+    border-color: #ebccd1;
+}
+
+@media screen and (min-width: 768px) {
+    .jumbotron {
+        margin-top: 20px;
+    }
+
+    .body-content {
+        padding: 0;
+    }
+}
+
+@media screen and (max-width: 767px) {
+    .navbar-header,
+    .navbar-nav,
+    .navbar-nav > li {
+        float: none;
+    }
+
+    .navbar-fixed-top {
+        position: static;
+    }
+
+    body {
+        padding-top: 0;
+    }
+
+    .jumbotron h1 {
+        font-size: 42px;
+    }
+}
+
+#blazor-error-ui {
+    background: lightyellow;
+    bottom: 0;
+    box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.2);
+    display: none;
+    left: 0;
+    padding: 0.6rem 1.25rem 0.7rem 1.25rem;
+    position: fixed;
+    width: 100%;
+    z-index: 1000;
+}
+
+#blazor-error-ui .dismiss {
+    cursor: pointer;
+    position: absolute;
+    right: 0.75rem;
+    top: 0.5rem;
+}

exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'dotnet build IRM.SPA.csproj' in D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA
 succeeded in 3619ms:
  Determining projects to restore...
  All projects are up-to-date for restore.
  IRM.SPA -> D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\bin\Debug\net8.0\IRM.SPA.dll

Build succeeded.
    0 Warning(s)
    0 Error(s)

Time Elapsed 00:00:02.83

diff --git a/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor b/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
index 62e62873d628af7e91de98824e1143460b2db2a0..a9714ae63155375bce0d34f8e2a2cda4c6cfbeeb
--- a/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
@@ -1,23 +1,30 @@
-﻿@inherits LayoutComponentBase
-
-<div class="page">
-    <div class="sidebar">
-        <NavMenu />
-    </div>
-
-    <main>
-        <div class="top-row px-4">
-            <a href="https://learn.microsoft.com/aspnet/core/" target="_blank">About</a>
-        </div>
-
-        <article class="content px-4">
-            @Body
-        </article>
-    </main>
-</div>
-
-<div id="blazor-error-ui">
-    An unhandled error has occurred.
-    <a href="" class="reload">Reload</a>
-    <a class="dismiss">🗙</a>
-</div>
+@inherits LayoutComponentBase
+
+<div class="navbar navbar-inverse navbar-fixed-top">
+    <div class="container">
+        <div class="navbar-header">
+            <a class="navbar-brand" href="/">Hiring Tracker</a>
+        </div>
+        <div class="navbar-collapse collapse">
+            <ul class="nav navbar-nav">
+                <li><NavLink href="/" Match="NavLinkMatch.All">Home</NavLink></li>
+                <li><NavLink href="clients">Clients</NavLink></li>
+                <li><NavLink href="positions">Positions</NavLink></li>
+            </ul>
+        </div>
+    </div>
+</div>
+
+<div class="container body-content">
+    @Body
+    <hr />
+    <footer>
+        <p>&copy; @DateTime.Now.Year - Hiring Tracker</p>
+    </footer>
+</div>
+
+<div id="blazor-error-ui">
+    An unhandled error has occurred.
+    <a href="" class="reload">Reload</a>
+    <a class="dismiss">x</a>
+</div>
diff --git a/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor b/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
index 259e68b4bc97ef9ecc0b3899dc192d7790fd9b4c..c765fe7b74acb5c30b228509af2a8a6e6e1bf3c6
--- a/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
@@ -1,30 +1 @@
-﻿<div class="top-row ps-3 navbar navbar-dark">
-    <div class="container-fluid">
-        <a class="navbar-brand" href="">IRM.SPA</a>
-    </div>
-</div>
-
-<input type="checkbox" title="Navigation menu" class="navbar-toggler" />
-
-<div class="nav-scrollable" onclick="document.querySelector('.navbar-toggler').click()">
-    <nav class="flex-column">
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="" Match="NavLinkMatch.All">
-                <span class="bi bi-house-door-fill-nav-menu" aria-hidden="true"></span> Home
-            </NavLink>
-        </div>
-
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="counter">
-                <span class="bi bi-plus-square-fill-nav-menu" aria-hidden="true"></span> Counter
-            </NavLink>
-        </div>
-
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="weather">
-                <span class="bi bi-list-nested-nav-menu" aria-hidden="true"></span> Weather
-            </NavLink>
-        </div>
-    </nav>
-</div>
-
+@* Navigation is defined in MainLayout to match the legacy Site.Master markup. *@
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor
new file mode 100644
index 0000000000000000000000000000000000000000..1232eae426ef2325a0505f006805d6a05ba6115e
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor
@@ -0,0 +1,104 @@
+@page "/clients/new"
+@page "/clients/{Id:int}"
+@page "/ClientDetails"
+@page "/ClientDetails.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+@inject IJSRuntime JS
+
+<PageTitle>Client Details - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="SaveAsync" @onsubmit:preventDefault>
+    <span class="formLabel">Id:</span>
+    <span>@(client.Id == 0 ? string.Empty : client.Id)</span>
+    <br />
+    <span class="formLabel">Name:</span>
+    <input type="text" @bind="client.Name" />
+    <br />
+    <span class="formLabel">Phone:</span>
+    <input type="text" @bind="client.Phone" />
+    <br />
+    <span class="formLabel">Email:</span>
+    <input type="text" @bind="client.Email" />
+    <br />
+    <span class="formLabel">Contact Name:</span>
+    <input type="text" @bind="client.ContactName" />
+    <br />
+    <span class="formLabel">Website:</span>
+    <input type="text" @bind="client.Website" />
+    <br />
+    @if (isEdit)
+    {
+        <button class="link-button" type="submit">Update</button>
+    }
+    else
+    {
+        <button class="link-button" type="submit">Insert</button>
+    }
+</form>
+
+@code {
+    [Parameter] public int? Id { get; set; }
+
+    private Client client = new();
+    private bool isEdit;
+    private string? errorMessage;
+
+    protected override async Task OnParametersSetAsync()
+    {
+        errorMessage = null;
+        isEdit = false;
+        client = new Client();
+
+        if (Id is not { } id)
+        {
+            return;
+        }
+
+        try
+        {
+            var existing = await Repository.GetClientAsync(id);
+            if (existing is not null)
+            {
+                client = existing;
+                isEdit = true;
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load client. " + ex.Message;
+        }
+    }
+
+    private async Task SaveAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            if (isEdit)
+            {
+                if (await Repository.UpdateClientAsync(client))
+                {
+                    await JS.InvokeVoidAsync("alert", "Client updated successfully");
+                }
+            }
+            else
+            {
+                client.Id = await Repository.InsertClientAsync(client);
+                isEdit = true;
+                await JS.InvokeVoidAsync("alert", "Client added successfully");
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to save client. " + ex.Message;
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor
new file mode 100644
index 0000000000000000000000000000000000000000..774521377b61d400b5e79c84a3304d20b83878b3
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor
@@ -0,0 +1,85 @@
+@page "/clients"
+@page "/ClientsList"
+@page "/ClientsList.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+
+<PageTitle>Clients - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="ApplyFilter" @onsubmit:preventDefault>
+    <table class="legacy-table">
+        <thead>
+            <tr>
+                <th>Id</th>
+                <th>Client Name</th>
+                <th>Phone</th>
+                <th>Email</th>
+                <th>Website</th>
+                <th>Contact Name</th>
+                <th></th>
+            </tr>
+            <tr>
+                <th><input type="text" @bind="filter.Id" /></th>
+                <th><input type="text" @bind="filter.Name" /></th>
+                <th><input type="text" @bind="filter.Phone" /></th>
+                <th><input type="text" @bind="filter.Email" /></th>
+                <th><input type="text" @bind="filter.Website" /></th>
+                <th><input type="text" @bind="filter.ContactName" /></th>
+                <th><button type="submit">Filter</button></th>
+            </tr>
+        </thead>
+        <tbody>
+            @foreach (var client in clients)
+            {
+                <tr>
+                    <td>@client.Id</td>
+                    <td>@client.Name</td>
+                    <td>@client.Phone</td>
+                    <td>@client.Email</td>
+                    <td>@client.Website</td>
+                    <td>@client.ContactName</td>
+                    <td><a href="clients/@client.Id">Details</a></td>
+                </tr>
+            }
+        </tbody>
+    </table>
+</form>
+
+<a href="clients/new">Add new client</a>
+
+@code {
+    private readonly ClientFilter filter = new();
+    private IReadOnlyList<Client> clients = [];
+    private string? errorMessage;
+
+    protected override async Task OnInitializedAsync()
+    {
+        await LoadClientsAsync();
+    }
+
+    private async Task ApplyFilter()
+    {
+        await LoadClientsAsync();
+    }
+
+    private async Task LoadClientsAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            clients = await Repository.GetClientsAsync(filter);
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load clients. " + ex.Message;
+            clients = [];
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
index df0502354fdfbbef85e1673ffcff56d85d2481bf..e4fbd72369d329a04d4cead6939579592e284c3d
--- a/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
@@ -1,7 +1,26 @@
-﻿@page "/"
-
-<PageTitle>Home</PageTitle>
-
-<h1>Hello, world!</h1>
-
-Welcome to your new app.
+@page "/"
+@page "/Default.aspx"
+
+<PageTitle>Home Page - Hiring Tracker</PageTitle>
+
+<div class="jumbotron">
+    <h1>Hiring Tracking</h1>
+    <p class="lead">Track positions and candidates.</p>
+</div>
+
+<div class="row">
+    <div class="col-md-4">
+        <h2>Positions</h2>
+        <p>View open positions or query previous hires.</p>
+        <p>
+            <a class="btn btn-default" href="positions">View</a>
+        </p>
+    </div>
+    <div class="col-md-4">
+        <h2>Clients</h2>
+        <p>Manage contacts requesting the positions.</p>
+        <p>
+            <a class="btn btn-default" href="clients">View</a>
+        </p>
+    </div>
+</div>
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor
new file mode 100644
index 0000000000000000000000000000000000000000..51bb6ec59ec33db24c64c1bb595bdf18d2e087ec
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor
@@ -0,0 +1,139 @@
+@page "/positions/new"
+@page "/positions/{Id:int}"
+@page "/PositionDetails"
+@page "/PositionDetails.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+@inject IJSRuntime JS
+
+<PageTitle>Position Details - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="SaveAsync" @onsubmit:preventDefault>
+    <span class="formLabel">Id:</span>
+    <span>@(position.Id == 0 ? string.Empty : position.Id)</span>
+    <br />
+    <span class="formLabel">Name:</span>
+    <input type="text" @bind="position.Name" />
+    <br />
+    <span class="formLabel">Description:</span>
+    <textarea rows="6" class="description-input" @bind="position.Description"></textarea>
+    <br />
+    <span class="formLabel">Start Date:</span>
+    <input type="date" value="@startDateText" @onchange="e => startDateText = e.Value?.ToString() ?? string.Empty" />
+    <br />
+    <span class="formLabel">Deadline:</span>
+    <input type="date" value="@deadlineText" @onchange="e => deadlineText = e.Value?.ToString() ?? string.Empty" />
+    <br />
+    <span class="formLabel">Hired?:</span>
+    <input type="checkbox" @bind="position.Hired" />
+    <br />
+    <span class="formLabel">Client:</span>
+    <select @bind="position.IdClient">
+        @foreach (var client in clients)
+        {
+            <option value="@client.Id">@client.Name</option>
+        }
+    </select>
+    <br />
+    <span class="formLabel">Client Contact Name:</span>
+    <input type="text" @bind="position.ClientContactName" />
+    <br />
+    <span class="formLabel">Phone:</span>
+    <input type="text" @bind="position.ClientContactPhone" />
+    <br />
+    <span class="formLabel">Email:</span>
+    <input type="text" @bind="position.ClientContactEmail" />
+    <br />
+    @if (isEdit)
+    {
+        <button class="link-button" type="submit">Update</button>
+    }
+    else
+    {
+        <button class="link-button" type="submit">Insert</button>
+    }
+</form>
+
+@code {
+    [Parameter] public int? Id { get; set; }
+
+    private Position position = new();
+    private IReadOnlyList<Client> clients = [];
+    private bool isEdit;
+    private string? errorMessage;
+    private string startDateText = string.Empty;
+    private string deadlineText = string.Empty;
+
+    protected override async Task OnParametersSetAsync()
+    {
+        errorMessage = null;
+        isEdit = false;
+        position = new Position();
+        startDateText = string.Empty;
+        deadlineText = string.Empty;
+
+        try
+        {
+            clients = await Repository.GetClientsAsync(new ClientFilter());
+            position.IdClient = clients.FirstOrDefault()?.Id;
+
+            if (Id is not { } id)
+            {
+                return;
+            }
+
+            var existing = await Repository.GetPositionAsync(id);
+            if (existing is not null)
+            {
+                position = existing;
+                startDateText = ToDateInputValue(position.StartDate);
+                deadlineText = ToDateInputValue(position.Deadline);
+                isEdit = true;
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load position. " + ex.Message;
+        }
+    }
+
+    private async Task SaveAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            position.StartDate = ParseDate(startDateText);
+            position.Deadline = ParseDate(deadlineText);
+
+            if (isEdit)
+            {
+                if (await Repository.UpdatePositionAsync(position))
+                {
+                    await JS.InvokeVoidAsync("alert", "Position updated successfully");
+                }
+            }
+            else
+            {
+                position.Id = await Repository.InsertPositionAsync(position);
+                isEdit = true;
+                await JS.InvokeVoidAsync("alert", "Position added successfully");
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to save position. " + ex.Message;
+        }
+    }
+
+    private static string ToDateInputValue(DateTime? value) => value?.ToString("yyyy-MM-dd") ?? string.Empty;
+
+    private static DateTime? ParseDate(string value) =>
+        DateTime.TryParse(value, out var parsed) ? parsed.Date : null;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor
new file mode 100644
index 0000000000000000000000000000000000000000..efdcec61db320f36ea4b1bad176e604944be65e2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor
@@ -0,0 +1,88 @@
+@page "/positions"
+@page "/PositionsList"
+@page "/PositionsList.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+
+<PageTitle>Positions - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="ApplyFilter" @onsubmit:preventDefault>
+    <table class="legacy-table">
+        <thead>
+            <tr>
+                <th>Id</th>
+                <th>Name</th>
+                <th>Description</th>
+                <th>Start Date</th>
+                <th>Deadline</th>
+                <th>Position Closed</th>
+                <th>Client Contact</th>
+                <th></th>
+            </tr>
+            <tr>
+                <th><input type="text" @bind="filter.Id" /></th>
+                <th><input type="text" @bind="filter.Name" /></th>
+                <th><input type="text" @bind="filter.Description" /></th>
+                <th><input type="text" @bind="filter.StartDate" /></th>
+                <th><input type="text" @bind="filter.Deadline" /></th>
+                <th></th>
+                <th><input type="text" @bind="filter.ClientContact" /></th>
+                <th><button type="submit">Filter</button></th>
+            </tr>
+        </thead>
+        <tbody>
+            @foreach (var position in positions)
+            {
+                <tr>
+                    <td>@position.Id</td>
+                    <td>@position.Name</td>
+                    <td>@position.Description</td>
+                    <td>@position.StartDate</td>
+                    <td>@position.Deadline</td>
+                    <td>@position.Hired</td>
+                    <td>@position.ClientName (@position.ClientContactName)</td>
+                    <td><a href="positions/@position.Id">Details</a></td>
+                </tr>
+            }
+        </tbody>
+    </table>
+</form>
+
+<a href="positions/new">Add new position</a>
+
+@code {
+    private readonly PositionFilter filter = new();
+    private IReadOnlyList<Position> positions = [];
+    private string? errorMessage;
+
+    protected override async Task OnInitializedAsync()
+    {
+        await LoadPositionsAsync();
+    }
+
+    private async Task ApplyFilter()
+    {
+        await LoadPositionsAsync();
+    }
+
+    private async Task LoadPositionsAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            positions = await Repository.GetPositionsAsync(filter);
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load positions. " + ex.Message;
+            positions = [];
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/_Imports.razor b/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
index de2621323fafca41583fecc7d1b4b181a1e49ac1..4ca0297300bf206b5f4f4e3af4a8adffd1865970
--- a/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
@@ -5,6 +5,8 @@
 @using Microsoft.AspNetCore.Components.Web
 @using static Microsoft.AspNetCore.Components.Web.RenderMode
 @using Microsoft.AspNetCore.Components.Web.Virtualization
-@using Microsoft.JSInterop
-@using IRM.SPA
-@using IRM.SPA.Components
+@using Microsoft.JSInterop
+@using IRM.SPA
+@using IRM.SPA.Components
+@using IRM.SPA.Models
+@using IRM.SPA.Services
diff --git a/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs b/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
index 8a7b20c19addfd182712b09a487081eda45d085a..a1e19750167d74ae38221cb933beb102768676d5
--- a/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
+++ b/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
@@ -13,13 +13,14 @@
 {
     public static class DependancyInjector
     {
-        public static void RegisterServices(IServiceCollection services, ConfigurationOptions config)
-        {
-           
-
-            RegisterApiClients(services, config);           
-            RegisterModelValidators(services);
-        }
+        public static void RegisterServices(IServiceCollection services, ConfigurationOptions config)
+        {
+           
+
+            services.AddScoped<IHiringRepository, HiringRepository>();
+            RegisterApiClients(services, config);           
+            RegisterModelValidators(services);
+        }
        
         private static void RegisterModelValidators(IServiceCollection services)
         {
diff --git a/LegacyOutput/src/IRM.SPA/Models/Client.cs b/LegacyOutput/src/IRM.SPA/Models/Client.cs
new file mode 100644
index 0000000000000000000000000000000000000000..46bfecbc332bde56ebed47d21516d9a9c7773d42
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Client.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class Client
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Phone { get; set; } = string.Empty;
+    public string Email { get; set; } = string.Empty;
+    public string ContactName { get; set; } = string.Empty;
+    public string Website { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..d59d0bb30c1802c64fa28e40d6a449e156739081
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class ClientFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Phone { get; set; }
+    public string? Email { get; set; }
+    public string? Website { get; set; }
+    public string? ContactName { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/Position.cs b/LegacyOutput/src/IRM.SPA/Models/Position.cs
new file mode 100644
index 0000000000000000000000000000000000000000..a6f9543eebd29c5626ed28741e6b4065ad3d16cf
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Position.cs
@@ -0,0 +1,16 @@
+namespace IRM.SPA.Models;
+
+public sealed class Position
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Description { get; set; } = string.Empty;
+    public DateTime? StartDate { get; set; }
+    public DateTime? Deadline { get; set; }
+    public bool Hired { get; set; }
+    public int? IdClient { get; set; }
+    public string ClientName { get; set; } = string.Empty;
+    public string ClientContactName { get; set; } = string.Empty;
+    public string ClientContactPhone { get; set; } = string.Empty;
+    public string ClientContactEmail { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..cfa76e79d96580b7b4d98e9b476807ef6f12acb5
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class PositionFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Description { get; set; }
+    public string? StartDate { get; set; }
+    public string? Deadline { get; set; }
+    public string? ClientContact { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Program.cs b/LegacyOutput/src/IRM.SPA/Program.cs
index 00184fc283cd7060825796fd98e55be1c243edd6..2008eaa884f07089ce5823fe41c6a6336a34f709
--- a/LegacyOutput/src/IRM.SPA/Program.cs
+++ b/LegacyOutput/src/IRM.SPA/Program.cs
@@ -10,8 +10,9 @@
     {
         public static void Main(string[] args)
         {
-            var builder = WebApplication.CreateBuilder(args);
-            ConfigurationOptions config = builder.Configuration.Get<ConfigurationOptions>() ?? new ConfigurationOptions();
+            var builder = WebApplication.CreateBuilder(args);
+            AppDomain.CurrentDomain.SetData("DataDirectory", Path.Combine(builder.Environment.ContentRootPath, "App_Data"));
+            ConfigurationOptions config = builder.Configuration.Get<ConfigurationOptions>() ?? new ConfigurationOptions();
             // Add services to the container.
             builder.Services.AddRazorComponents()
                 .AddInteractiveServerComponents();           
diff --git a/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..1c88253e59d707a339e900e3d8c1a8b2d56950d2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
@@ -0,0 +1,268 @@
+using System.Data;
+using IRM.SPA.Models;
+using Microsoft.Data.SqlClient;
+
+namespace IRM.SPA.Services;
+
+public sealed class HiringRepository(IConfiguration configuration) : IHiringRepository
+{
+    private readonly string _connectionString = configuration.GetConnectionString("HiringConnection")
+        ?? throw new InvalidOperationException("ConnectionStrings:HiringConnection is not configured.");
+
+    public async Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Name", filter.Name);
+        AddLike(where, parameters, "Phone", filter.Phone);
+        AddLike(where, parameters, "Email", filter.Email);
+        AddLike(where, parameters, "Website", filter.Website);
+        AddLike(where, parameters, "ContactName", filter.ContactName);
+
+        var sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients";
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var clients = new List<Client>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            clients.Add(ReadClient(reader));
+        }
+
+        return clients;
+    }
+
+    public async Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients WHERE Id = @Id";
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadClient(reader) : null;
+    }
+
+    public async Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Clients (Name, Phone, Email, ContactName, Website)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Phone, @Email, @ContactName, @Website)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Clients
+            SET Name = @Name, Phone = @Phone, Email = @Email, ContactName = @ContactName, Website = @Website
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = client.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    public async Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Positions.Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Positions.Name", filter.Name, "@Name");
+        AddLike(where, parameters, "Positions.Description", filter.Description, "@Description");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.StartDate, 120)", filter.StartDate, "@StartDate");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.Deadline, 120)", filter.Deadline, "@Deadline");
+        AddLike(where, parameters, "Positions.ClientContactName", filter.ClientContact, "@ClientContact");
+
+        var sql = """
+            SELECT Positions.Id, Positions.Name, Positions.Description, Positions.StartDate, Positions.Deadline,
+                   Positions.Hired, Positions.IdClient, Positions.ClientContactName, Positions.ClientContactPhone,
+                   Positions.ClientContactEmail, Clients.Name AS ClientName
+            FROM Positions
+            LEFT JOIN Clients ON Positions.IdClient = Clients.Id
+            """;
+
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Positions.Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var positions = new List<Position>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            positions.Add(ReadPosition(reader, includeClientName: true));
+        }
+
+        return positions;
+    }
+
+    public async Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            SELECT Id, Name, Description, StartDate, Deadline, Hired, IdClient,
+                   ClientContactName, ClientContactPhone, ClientContactEmail
+            FROM Positions
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadPosition(reader, includeClientName: false) : null;
+    }
+
+    public async Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Positions (Name, Description, StartDate, Deadline, Hired, ClientContactName,
+                                   ClientContactPhone, ClientContactEmail, IdClient)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Description, @StartDate, @Deadline, @Hired, @ClientContactName,
+                    @ClientContactPhone, @ClientContactEmail, @IdClient)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Positions
+            SET Name = @Name, Description = @Description, StartDate = @StartDate, Deadline = @Deadline,
+                Hired = @Hired, ClientContactName = @ClientContactName, ClientContactPhone = @ClientContactPhone,
+                ClientContactEmail = @ClientContactEmail, IdClient = @IdClient
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = position.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    private SqlConnection CreateConnection() => new(_connectionString);
+
+    private static void AddClientParameters(SqlCommand command, Client client)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = client.Name;
+        command.Parameters.Add("@Phone", SqlDbType.VarChar).Value = client.Phone;
+        command.Parameters.Add("@Email", SqlDbType.VarChar).Value = client.Email;
+        command.Parameters.Add("@ContactName", SqlDbType.VarChar).Value = client.ContactName;
+        command.Parameters.Add("@Website", SqlDbType.VarChar).Value = client.Website;
+    }
+
+    private static void AddPositionParameters(SqlCommand command, Position position, bool includeClient)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = position.Name;
+        command.Parameters.Add("@Description", SqlDbType.VarChar).Value = position.Description;
+        command.Parameters.Add("@StartDate", SqlDbType.Date).Value = (object?)position.StartDate ?? DBNull.Value;
+        command.Parameters.Add("@Deadline", SqlDbType.Date).Value = (object?)position.Deadline ?? DBNull.Value;
+        command.Parameters.Add("@Hired", SqlDbType.Bit).Value = position.Hired;
+        command.Parameters.Add("@ClientContactName", SqlDbType.VarChar).Value = position.ClientContactName;
+        command.Parameters.Add("@ClientContactPhone", SqlDbType.VarChar).Value = position.ClientContactPhone;
+        command.Parameters.Add("@ClientContactEmail", SqlDbType.VarChar).Value = position.ClientContactEmail;
+        if (includeClient)
+        {
+            command.Parameters.Add("@IdClient", SqlDbType.Int).Value = (object?)position.IdClient ?? DBNull.Value;
+        }
+    }
+
+    private static void AddLike(List<string> where, List<SqlParameter> parameters, string column, string? value, string? parameterName = null)
+    {
+        if (string.IsNullOrWhiteSpace(value))
+        {
+            return;
+        }
+
+        parameterName ??= "@" + column.Replace(".", string.Empty);
+        where.Add($"{column} LIKE {parameterName}");
+        parameters.Add(new SqlParameter(parameterName, SqlDbType.VarChar) { Value = "%" + value.Trim() + "%" });
+    }
+
+    private static Client ReadClient(SqlDataReader reader) => new()
+    {
+        Id = reader.GetInt32(0),
+        Name = GetString(reader, 1),
+        Phone = GetString(reader, 2),
+        Email = GetString(reader, 3),
+        ContactName = GetString(reader, 4),
+        Website = GetString(reader, 5)
+    };
+
+    private static Position ReadPosition(SqlDataReader reader, bool includeClientName)
+    {
+        var position = new Position
+        {
+            Id = reader.GetInt32(0),
+            Name = GetString(reader, 1),
+            Description = GetString(reader, 2),
+            StartDate = reader.IsDBNull(3) ? null : reader.GetDateTime(3),
+            Deadline = reader.IsDBNull(4) ? null : reader.GetDateTime(4),
+            Hired = !reader.IsDBNull(5) && reader.GetBoolean(5),
+            IdClient = reader.IsDBNull(6) ? null : reader.GetInt32(6),
+            ClientContactName = GetString(reader, 7),
+            ClientContactPhone = GetString(reader, 8),
+            ClientContactEmail = GetString(reader, 9)
+        };
+
+        if (includeClientName)
+        {
+            position.ClientName = GetString(reader, 10);
+        }
+
+        return position;
+    }
+
+    private static string GetString(SqlDataReader reader, int ordinal) =>
+        reader.IsDBNull(ordinal) ? string.Empty : reader.GetString(ordinal);
+}
diff --git a/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..468316298ba01ef622db9ffeeb20a3df775fc996
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
@@ -0,0 +1,15 @@
+using IRM.SPA.Models;
+
+namespace IRM.SPA.Services;
+
+public interface IHiringRepository
+{
+    Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default);
+    Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default);
+    Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default);
+    Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default);
+}
diff --git a/LegacyOutput/src/IRM.SPA/wwwroot/app.css b/LegacyOutput/src/IRM.SPA/wwwroot/app.css
index 7ac30e2a8df7ef2e3f233e331d1d58ca449099d8..c4e3f519ac693dd5c0ee569dc7dae70aa51945dc
--- a/LegacyOutput/src/IRM.SPA/wwwroot/app.css
+++ b/LegacyOutput/src/IRM.SPA/wwwroot/app.css
@@ -1,51 +1,247 @@
-html, body {
-    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
-}
-
-a, .btn-link {
-    color: #006bb7;
-}
-
-.btn-primary {
-    color: #fff;
-    background-color: #1b6ec2;
-    border-color: #1861ac;
-}
-
-.btn:focus, .btn:active:focus, .btn-link.nav-link:focus, .form-control:focus, .form-check-input:focus {
-  box-shadow: 0 0 0 0.1rem white, 0 0 0 0.25rem #258cfb;
-}
-
-.content {
-    padding-top: 1.1rem;
-}
-
-h1:focus {
-    outline: none;
-}
-
-.valid.modified:not([type=checkbox]) {
-    outline: 1px solid #26b050;
-}
-
-.invalid {
-    outline: 1px solid #e50000;
-}
-
-.validation-message {
-    color: #e50000;
-}
-
-.blazor-error-boundary {
-    background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNDkiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIG92ZXJmbG93PSJoaWRkZW4iPjxkZWZzPjxjbGlwUGF0aCBpZD0iY2xpcDAiPjxyZWN0IHg9IjIzNSIgeT0iNTEiIHdpZHRoPSI1NiIgaGVpZ2h0PSI0OSIvPjwvY2xpcFBhdGg+PC9kZWZzPjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMCkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yMzUgLTUxKSI+PHBhdGggZD0iTTI2My41MDYgNTFDMjY0LjcxNyA1MSAyNjUuODEzIDUxLjQ4MzcgMjY2LjYwNiA1Mi4yNjU4TDI2Ny4wNTIgNTIuNzk4NyAyNjcuNTM5IDUzLjYyODMgMjkwLjE4NSA5Mi4xODMxIDI5MC41NDUgOTIuNzk1IDI5MC42NTYgOTIuOTk2QzI5MC44NzcgOTMuNTEzIDI5MSA5NC4wODE1IDI5MSA5NC42NzgyIDI5MSA5Ny4wNjUxIDI4OS4wMzggOTkgMjg2LjYxNyA5OUwyNDAuMzgzIDk5QzIzNy45NjMgOTkgMjM2IDk3LjA2NTEgMjM2IDk0LjY3ODIgMjM2IDk0LjM3OTkgMjM2LjAzMSA5NC4wODg2IDIzNi4wODkgOTMuODA3MkwyMzYuMzM4IDkzLjAxNjIgMjM2Ljg1OCA5Mi4xMzE0IDI1OS40NzMgNTMuNjI5NCAyNTkuOTYxIDUyLjc5ODUgMjYwLjQwNyA1Mi4yNjU4QzI2MS4yIDUxLjQ4MzcgMjYyLjI5NiA1MSAyNjMuNTA2IDUxWk0yNjMuNTg2IDY2LjAxODNDMjYwLjczNyA2Ni4wMTgzIDI1OS4zMTMgNjcuMTI0NSAyNTkuMzEzIDY5LjMzNyAyNTkuMzEzIDY5LjYxMDIgMjU5LjMzMiA2OS44NjA4IDI1OS4zNzEgNzAuMDg4N0wyNjEuNzk1IDg0LjAxNjEgMjY1LjM4IDg0LjAxNjEgMjY3LjgyMSA2OS43NDc1QzI2Ny44NiA2OS43MzA5IDI2Ny44NzkgNjkuNTg3NyAyNjcuODc5IDY5LjMxNzkgMjY3Ljg3OSA2Ny4xMTgyIDI2Ni40NDggNjYuMDE4MyAyNjMuNTg2IDY2LjAxODNaTTI2My41NzYgODYuMDU0N0MyNjEuMDQ5IDg2LjA1NDcgMjU5Ljc4NiA4Ny4zMDA1IDI1OS43ODYgODkuNzkyMSAyNTkuNzg2IDkyLjI4MzcgMjYxLjA0OSA5My41Mjk1IDI2My41NzYgOTMuNTI5NSAyNjYuMTE2IDkzLjUyOTUgMjY3LjM4NyA5Mi4yODM3IDI2Ny4zODcgODkuNzkyMSAyNjcuMzg3IDg3LjMwMDUgMjY2LjExNiA4Ni4wNTQ3IDI2My41NzYgODYuMDU0N1oiIGZpbGw9IiNGRkU1MDAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48L3N2Zz4=) no-repeat 1rem/1.8rem, #b32121;
-    padding: 1rem 1rem 1rem 3.7rem;
-    color: white;
-}
-
-    .blazor-error-boundary::after {
-        content: "An error has occurred."
-    }
-
-.darker-border-checkbox.form-check-input {
-    border-color: #929292;
-}
+html,
+body {
+    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
+}
+
+body {
+    padding-top: 50px;
+    padding-bottom: 20px;
+}
+
+.body-content {
+    padding-left: 15px;
+    padding-right: 15px;
+}
+
+.dl-horizontal dt {
+    white-space: normal;
+}
+
+input[type="text"],
+input[type="password"],
+input[type="email"],
+input[type="tel"],
+input[type="select"] {
+    max-width: 280px;
+}
+
+.jumbotron {
+    padding: 30px;
+    margin-bottom: 30px;
+    color: inherit;
+    background-color: #eee;
+    border-radius: 6px;
+}
+
+.jumbotron h1 {
+    font-size: 63px;
+}
+
+.lead {
+    margin-bottom: 20px;
+    font-size: 21px;
+    font-weight: 300;
+    line-height: 1.4;
+}
+
+.navbar-inverse {
+    background-color: #222;
+    border-color: #080808;
+}
+
+.navbar-fixed-top {
+    position: fixed;
+    right: 0;
+    left: 0;
+    z-index: 1030;
+    top: 0;
+    border-width: 0 0 1px;
+}
+
+.navbar {
+    min-height: 50px;
+    margin-bottom: 20px;
+    border: 1px solid transparent;
+}
+
+.navbar-header {
+    float: left;
+}
+
+.navbar-brand {
+    float: left;
+    height: 50px;
+    padding: 15px;
+    font-size: 18px;
+    line-height: 20px;
+}
+
+.navbar-inverse .navbar-brand,
+.navbar-inverse .navbar-nav > li > a {
+    color: #9d9d9d;
+}
+
+.navbar-inverse .navbar-brand:hover,
+.navbar-inverse .navbar-nav > li > a:hover,
+.navbar-inverse .navbar-nav > li > a.active {
+    color: #fff;
+    text-decoration: none;
+}
+
+.navbar-nav {
+    float: left;
+    margin: 0;
+}
+
+.nav > li {
+    position: relative;
+    display: block;
+}
+
+.navbar-nav > li {
+    float: left;
+}
+
+.nav > li > a {
+    position: relative;
+    display: block;
+    padding: 10px 15px;
+}
+
+.navbar-nav > li > a {
+    padding-top: 15px;
+    padding-bottom: 15px;
+    line-height: 20px;
+}
+
+.btn-default {
+    color: #333;
+    background-color: #fff;
+    border-color: #ccc;
+}
+
+.btn {
+    display: inline-block;
+    padding: 6px 12px;
+    margin-bottom: 0;
+    font-size: 14px;
+    font-weight: 400;
+    line-height: 1.42857143;
+    text-align: center;
+    white-space: nowrap;
+    vertical-align: middle;
+    cursor: pointer;
+    border: 1px solid transparent;
+    border-radius: 4px;
+}
+
+.formLabel {
+    display: inline-block;
+    width: 200px;
+}
+
+.legacy-table {
+    margin-top: 20px;
+    margin-bottom: 10px;
+    border-collapse: separate;
+    border-spacing: 2px;
+}
+
+.legacy-table th,
+.legacy-table td {
+    padding: 1px;
+    font-weight: normal;
+    text-align: left;
+    vertical-align: top;
+}
+
+.legacy-table th {
+    font-weight: bold;
+}
+
+.legacy-table input[type="text"] {
+    width: 130px;
+}
+
+.description-input {
+    width: 500px;
+    max-width: 100%;
+    vertical-align: top;
+}
+
+.link-button {
+    padding: 0;
+    color: #337ab7;
+    background: none;
+    border: 0;
+    cursor: pointer;
+    font: inherit;
+}
+
+.link-button:hover {
+    color: #23527c;
+    text-decoration: underline;
+}
+
+.alert {
+    padding: 15px;
+    margin-top: 20px;
+    margin-bottom: 20px;
+    border: 1px solid transparent;
+    border-radius: 4px;
+}
+
+.alert-danger {
+    color: #a94442;
+    background-color: #f2dede;
+    border-color: #ebccd1;
+}
+
+@media screen and (min-width: 768px) {
+    .jumbotron {
+        margin-top: 20px;
+    }
+
+    .body-content {
+        padding: 0;
+    }
+}
+
+@media screen and (max-width: 767px) {
+    .navbar-header,
+    .navbar-nav,
+    .navbar-nav > li {
+        float: none;
+    }
+
+    .navbar-fixed-top {
+        position: static;
+    }
+
+    body {
+        padding-top: 0;
+    }
+
+    .jumbotron h1 {
+        font-size: 42px;
+    }
+}
+
+#blazor-error-ui {
+    background: lightyellow;
+    bottom: 0;
+    box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.2);
+    display: none;
+    left: 0;
+    padding: 0.6rem 1.25rem 0.7rem 1.25rem;
+    position: fixed;
+    width: 100%;
+    z-index: 1000;
+}
+
+#blazor-error-ui .dismiss {
+    cursor: pointer;
+    position: absolute;
+    right: 0.75rem;
+    top: 0.5rem;
+}

codex
The build is clean. I’m doing one more pass for leftover scaffold routes so unrelated starter pages are not still exposed through Blazor routing.
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg "''^@page" Components'"\\Pages" in D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA
 succeeded in 434ms:
Components\Pages\ClientDetails.razor:@page "/clients/new"
Components\Pages\ClientDetails.razor:@page "/clients/{Id:int}"
Components\Pages\ClientDetails.razor:@page "/ClientDetails"
Components\Pages\ClientDetails.razor:@page "/ClientDetails.aspx"
Components\Pages\ClientsList.razor:@page "/clients"
Components\Pages\ClientsList.razor:@page "/ClientsList"
Components\Pages\ClientsList.razor:@page "/ClientsList.aspx"
Components\Pages\Counter.razor:@page "/counter"
Components\Pages\Error.razor:@page "/Error"
Components\Pages\Home.razor:@page "/"
Components\Pages\Home.razor:@page "/Default.aspx"
Components\Pages\PositionDetails.razor:@page "/positions/new"
Components\Pages\PositionDetails.razor:@page "/positions/{Id:int}"
Components\Pages\PositionDetails.razor:@page "/PositionDetails"
Components\Pages\PositionDetails.razor:@page "/PositionDetails.aspx"
Components\Pages\Weather.razor:@page "/weather"
Components\Pages\PositionsList.razor:@page "/positions"
Components\Pages\PositionsList.razor:@page "/PositionsList"
Components\Pages\PositionsList.razor:@page "/PositionsList.aspx"

diff --git a/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor b/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
index 62e62873d628af7e91de98824e1143460b2db2a0..a9714ae63155375bce0d34f8e2a2cda4c6cfbeeb
--- a/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
@@ -1,23 +1,30 @@
-﻿@inherits LayoutComponentBase
-
-<div class="page">
-    <div class="sidebar">
-        <NavMenu />
-    </div>
-
-    <main>
-        <div class="top-row px-4">
-            <a href="https://learn.microsoft.com/aspnet/core/" target="_blank">About</a>
-        </div>
-
-        <article class="content px-4">
-            @Body
-        </article>
-    </main>
-</div>
-
-<div id="blazor-error-ui">
-    An unhandled error has occurred.
-    <a href="" class="reload">Reload</a>
-    <a class="dismiss">🗙</a>
-</div>
+@inherits LayoutComponentBase
+
+<div class="navbar navbar-inverse navbar-fixed-top">
+    <div class="container">
+        <div class="navbar-header">
+            <a class="navbar-brand" href="/">Hiring Tracker</a>
+        </div>
+        <div class="navbar-collapse collapse">
+            <ul class="nav navbar-nav">
+                <li><NavLink href="/" Match="NavLinkMatch.All">Home</NavLink></li>
+                <li><NavLink href="clients">Clients</NavLink></li>
+                <li><NavLink href="positions">Positions</NavLink></li>
+            </ul>
+        </div>
+    </div>
+</div>
+
+<div class="container body-content">
+    @Body
+    <hr />
+    <footer>
+        <p>&copy; @DateTime.Now.Year - Hiring Tracker</p>
+    </footer>
+</div>
+
+<div id="blazor-error-ui">
+    An unhandled error has occurred.
+    <a href="" class="reload">Reload</a>
+    <a class="dismiss">x</a>
+</div>
diff --git a/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor b/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
index 259e68b4bc97ef9ecc0b3899dc192d7790fd9b4c..c765fe7b74acb5c30b228509af2a8a6e6e1bf3c6
--- a/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
@@ -1,30 +1 @@
-﻿<div class="top-row ps-3 navbar navbar-dark">
-    <div class="container-fluid">
-        <a class="navbar-brand" href="">IRM.SPA</a>
-    </div>
-</div>
-
-<input type="checkbox" title="Navigation menu" class="navbar-toggler" />
-
-<div class="nav-scrollable" onclick="document.querySelector('.navbar-toggler').click()">
-    <nav class="flex-column">
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="" Match="NavLinkMatch.All">
-                <span class="bi bi-house-door-fill-nav-menu" aria-hidden="true"></span> Home
-            </NavLink>
-        </div>
-
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="counter">
-                <span class="bi bi-plus-square-fill-nav-menu" aria-hidden="true"></span> Counter
-            </NavLink>
-        </div>
-
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="weather">
-                <span class="bi bi-list-nested-nav-menu" aria-hidden="true"></span> Weather
-            </NavLink>
-        </div>
-    </nav>
-</div>
-
+@* Navigation is defined in MainLayout to match the legacy Site.Master markup. *@
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor
new file mode 100644
index 0000000000000000000000000000000000000000..1232eae426ef2325a0505f006805d6a05ba6115e
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor
@@ -0,0 +1,104 @@
+@page "/clients/new"
+@page "/clients/{Id:int}"
+@page "/ClientDetails"
+@page "/ClientDetails.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+@inject IJSRuntime JS
+
+<PageTitle>Client Details - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="SaveAsync" @onsubmit:preventDefault>
+    <span class="formLabel">Id:</span>
+    <span>@(client.Id == 0 ? string.Empty : client.Id)</span>
+    <br />
+    <span class="formLabel">Name:</span>
+    <input type="text" @bind="client.Name" />
+    <br />
+    <span class="formLabel">Phone:</span>
+    <input type="text" @bind="client.Phone" />
+    <br />
+    <span class="formLabel">Email:</span>
+    <input type="text" @bind="client.Email" />
+    <br />
+    <span class="formLabel">Contact Name:</span>
+    <input type="text" @bind="client.ContactName" />
+    <br />
+    <span class="formLabel">Website:</span>
+    <input type="text" @bind="client.Website" />
+    <br />
+    @if (isEdit)
+    {
+        <button class="link-button" type="submit">Update</button>
+    }
+    else
+    {
+        <button class="link-button" type="submit">Insert</button>
+    }
+</form>
+
+@code {
+    [Parameter] public int? Id { get; set; }
+
+    private Client client = new();
+    private bool isEdit;
+    private string? errorMessage;
+
+    protected override async Task OnParametersSetAsync()
+    {
+        errorMessage = null;
+        isEdit = false;
+        client = new Client();
+
+        if (Id is not { } id)
+        {
+            return;
+        }
+
+        try
+        {
+            var existing = await Repository.GetClientAsync(id);
+            if (existing is not null)
+            {
+                client = existing;
+                isEdit = true;
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load client. " + ex.Message;
+        }
+    }
+
+    private async Task SaveAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            if (isEdit)
+            {
+                if (await Repository.UpdateClientAsync(client))
+                {
+                    await JS.InvokeVoidAsync("alert", "Client updated successfully");
+                }
+            }
+            else
+            {
+                client.Id = await Repository.InsertClientAsync(client);
+                isEdit = true;
+                await JS.InvokeVoidAsync("alert", "Client added successfully");
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to save client. " + ex.Message;
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor
new file mode 100644
index 0000000000000000000000000000000000000000..774521377b61d400b5e79c84a3304d20b83878b3
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor
@@ -0,0 +1,85 @@
+@page "/clients"
+@page "/ClientsList"
+@page "/ClientsList.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+
+<PageTitle>Clients - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="ApplyFilter" @onsubmit:preventDefault>
+    <table class="legacy-table">
+        <thead>
+            <tr>
+                <th>Id</th>
+                <th>Client Name</th>
+                <th>Phone</th>
+                <th>Email</th>
+                <th>Website</th>
+                <th>Contact Name</th>
+                <th></th>
+            </tr>
+            <tr>
+                <th><input type="text" @bind="filter.Id" /></th>
+                <th><input type="text" @bind="filter.Name" /></th>
+                <th><input type="text" @bind="filter.Phone" /></th>
+                <th><input type="text" @bind="filter.Email" /></th>
+                <th><input type="text" @bind="filter.Website" /></th>
+                <th><input type="text" @bind="filter.ContactName" /></th>
+                <th><button type="submit">Filter</button></th>
+            </tr>
+        </thead>
+        <tbody>
+            @foreach (var client in clients)
+            {
+                <tr>
+                    <td>@client.Id</td>
+                    <td>@client.Name</td>
+                    <td>@client.Phone</td>
+                    <td>@client.Email</td>
+                    <td>@client.Website</td>
+                    <td>@client.ContactName</td>
+                    <td><a href="clients/@client.Id">Details</a></td>
+                </tr>
+            }
+        </tbody>
+    </table>
+</form>
+
+<a href="clients/new">Add new client</a>
+
+@code {
+    private readonly ClientFilter filter = new();
+    private IReadOnlyList<Client> clients = [];
+    private string? errorMessage;
+
+    protected override async Task OnInitializedAsync()
+    {
+        await LoadClientsAsync();
+    }
+
+    private async Task ApplyFilter()
+    {
+        await LoadClientsAsync();
+    }
+
+    private async Task LoadClientsAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            clients = await Repository.GetClientsAsync(filter);
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load clients. " + ex.Message;
+            clients = [];
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
index df0502354fdfbbef85e1673ffcff56d85d2481bf..e4fbd72369d329a04d4cead6939579592e284c3d
--- a/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
@@ -1,7 +1,26 @@
-﻿@page "/"
-
-<PageTitle>Home</PageTitle>
-
-<h1>Hello, world!</h1>
-
-Welcome to your new app.
+@page "/"
+@page "/Default.aspx"
+
+<PageTitle>Home Page - Hiring Tracker</PageTitle>
+
+<div class="jumbotron">
+    <h1>Hiring Tracking</h1>
+    <p class="lead">Track positions and candidates.</p>
+</div>
+
+<div class="row">
+    <div class="col-md-4">
+        <h2>Positions</h2>
+        <p>View open positions or query previous hires.</p>
+        <p>
+            <a class="btn btn-default" href="positions">View</a>
+        </p>
+    </div>
+    <div class="col-md-4">
+        <h2>Clients</h2>
+        <p>Manage contacts requesting the positions.</p>
+        <p>
+            <a class="btn btn-default" href="clients">View</a>
+        </p>
+    </div>
+</div>
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor
new file mode 100644
index 0000000000000000000000000000000000000000..51bb6ec59ec33db24c64c1bb595bdf18d2e087ec
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor
@@ -0,0 +1,139 @@
+@page "/positions/new"
+@page "/positions/{Id:int}"
+@page "/PositionDetails"
+@page "/PositionDetails.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+@inject IJSRuntime JS
+
+<PageTitle>Position Details - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="SaveAsync" @onsubmit:preventDefault>
+    <span class="formLabel">Id:</span>
+    <span>@(position.Id == 0 ? string.Empty : position.Id)</span>
+    <br />
+    <span class="formLabel">Name:</span>
+    <input type="text" @bind="position.Name" />
+    <br />
+    <span class="formLabel">Description:</span>
+    <textarea rows="6" class="description-input" @bind="position.Description"></textarea>
+    <br />
+    <span class="formLabel">Start Date:</span>
+    <input type="date" value="@startDateText" @onchange="e => startDateText = e.Value?.ToString() ?? string.Empty" />
+    <br />
+    <span class="formLabel">Deadline:</span>
+    <input type="date" value="@deadlineText" @onchange="e => deadlineText = e.Value?.ToString() ?? string.Empty" />
+    <br />
+    <span class="formLabel">Hired?:</span>
+    <input type="checkbox" @bind="position.Hired" />
+    <br />
+    <span class="formLabel">Client:</span>
+    <select @bind="position.IdClient">
+        @foreach (var client in clients)
+        {
+            <option value="@client.Id">@client.Name</option>
+        }
+    </select>
+    <br />
+    <span class="formLabel">Client Contact Name:</span>
+    <input type="text" @bind="position.ClientContactName" />
+    <br />
+    <span class="formLabel">Phone:</span>
+    <input type="text" @bind="position.ClientContactPhone" />
+    <br />
+    <span class="formLabel">Email:</span>
+    <input type="text" @bind="position.ClientContactEmail" />
+    <br />
+    @if (isEdit)
+    {
+        <button class="link-button" type="submit">Update</button>
+    }
+    else
+    {
+        <button class="link-button" type="submit">Insert</button>
+    }
+</form>
+
+@code {
+    [Parameter] public int? Id { get; set; }
+
+    private Position position = new();
+    private IReadOnlyList<Client> clients = [];
+    private bool isEdit;
+    private string? errorMessage;
+    private string startDateText = string.Empty;
+    private string deadlineText = string.Empty;
+
+    protected override async Task OnParametersSetAsync()
+    {
+        errorMessage = null;
+        isEdit = false;
+        position = new Position();
+        startDateText = string.Empty;
+        deadlineText = string.Empty;
+
+        try
+        {
+            clients = await Repository.GetClientsAsync(new ClientFilter());
+            position.IdClient = clients.FirstOrDefault()?.Id;
+
+            if (Id is not { } id)
+            {
+                return;
+            }
+
+            var existing = await Repository.GetPositionAsync(id);
+            if (existing is not null)
+            {
+                position = existing;
+                startDateText = ToDateInputValue(position.StartDate);
+                deadlineText = ToDateInputValue(position.Deadline);
+                isEdit = true;
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load position. " + ex.Message;
+        }
+    }
+
+    private async Task SaveAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            position.StartDate = ParseDate(startDateText);
+            position.Deadline = ParseDate(deadlineText);
+
+            if (isEdit)
+            {
+                if (await Repository.UpdatePositionAsync(position))
+                {
+                    await JS.InvokeVoidAsync("alert", "Position updated successfully");
+                }
+            }
+            else
+            {
+                position.Id = await Repository.InsertPositionAsync(position);
+                isEdit = true;
+                await JS.InvokeVoidAsync("alert", "Position added successfully");
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to save position. " + ex.Message;
+        }
+    }
+
+    private static string ToDateInputValue(DateTime? value) => value?.ToString("yyyy-MM-dd") ?? string.Empty;
+
+    private static DateTime? ParseDate(string value) =>
+        DateTime.TryParse(value, out var parsed) ? parsed.Date : null;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor
new file mode 100644
index 0000000000000000000000000000000000000000..efdcec61db320f36ea4b1bad176e604944be65e2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor
@@ -0,0 +1,88 @@
+@page "/positions"
+@page "/PositionsList"
+@page "/PositionsList.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+
+<PageTitle>Positions - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="ApplyFilter" @onsubmit:preventDefault>
+    <table class="legacy-table">
+        <thead>
+            <tr>
+                <th>Id</th>
+                <th>Name</th>
+                <th>Description</th>
+                <th>Start Date</th>
+                <th>Deadline</th>
+                <th>Position Closed</th>
+                <th>Client Contact</th>
+                <th></th>
+            </tr>
+            <tr>
+                <th><input type="text" @bind="filter.Id" /></th>
+                <th><input type="text" @bind="filter.Name" /></th>
+                <th><input type="text" @bind="filter.Description" /></th>
+                <th><input type="text" @bind="filter.StartDate" /></th>
+                <th><input type="text" @bind="filter.Deadline" /></th>
+                <th></th>
+                <th><input type="text" @bind="filter.ClientContact" /></th>
+                <th><button type="submit">Filter</button></th>
+            </tr>
+        </thead>
+        <tbody>
+            @foreach (var position in positions)
+            {
+                <tr>
+                    <td>@position.Id</td>
+                    <td>@position.Name</td>
+                    <td>@position.Description</td>
+                    <td>@position.StartDate</td>
+                    <td>@position.Deadline</td>
+                    <td>@position.Hired</td>
+                    <td>@position.ClientName (@position.ClientContactName)</td>
+                    <td><a href="positions/@position.Id">Details</a></td>
+                </tr>
+            }
+        </tbody>
+    </table>
+</form>
+
+<a href="positions/new">Add new position</a>
+
+@code {
+    private readonly PositionFilter filter = new();
+    private IReadOnlyList<Position> positions = [];
+    private string? errorMessage;
+
+    protected override async Task OnInitializedAsync()
+    {
+        await LoadPositionsAsync();
+    }
+
+    private async Task ApplyFilter()
+    {
+        await LoadPositionsAsync();
+    }
+
+    private async Task LoadPositionsAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            positions = await Repository.GetPositionsAsync(filter);
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load positions. " + ex.Message;
+            positions = [];
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/_Imports.razor b/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
index de2621323fafca41583fecc7d1b4b181a1e49ac1..4ca0297300bf206b5f4f4e3af4a8adffd1865970
--- a/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
@@ -5,6 +5,8 @@
 @using Microsoft.AspNetCore.Components.Web
 @using static Microsoft.AspNetCore.Components.Web.RenderMode
 @using Microsoft.AspNetCore.Components.Web.Virtualization
-@using Microsoft.JSInterop
-@using IRM.SPA
-@using IRM.SPA.Components
+@using Microsoft.JSInterop
+@using IRM.SPA
+@using IRM.SPA.Components
+@using IRM.SPA.Models
+@using IRM.SPA.Services
diff --git a/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs b/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
index 8a7b20c19addfd182712b09a487081eda45d085a..a1e19750167d74ae38221cb933beb102768676d5
--- a/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
+++ b/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
@@ -13,13 +13,14 @@
 {
     public static class DependancyInjector
     {
-        public static void RegisterServices(IServiceCollection services, ConfigurationOptions config)
-        {
-           
-
-            RegisterApiClients(services, config);           
-            RegisterModelValidators(services);
-        }
+        public static void RegisterServices(IServiceCollection services, ConfigurationOptions config)
+        {
+           
+
+            services.AddScoped<IHiringRepository, HiringRepository>();
+            RegisterApiClients(services, config);           
+            RegisterModelValidators(services);
+        }
        
         private static void RegisterModelValidators(IServiceCollection services)
         {
diff --git a/LegacyOutput/src/IRM.SPA/Models/Client.cs b/LegacyOutput/src/IRM.SPA/Models/Client.cs
new file mode 100644
index 0000000000000000000000000000000000000000..46bfecbc332bde56ebed47d21516d9a9c7773d42
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Client.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class Client
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Phone { get; set; } = string.Empty;
+    public string Email { get; set; } = string.Empty;
+    public string ContactName { get; set; } = string.Empty;
+    public string Website { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..d59d0bb30c1802c64fa28e40d6a449e156739081
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class ClientFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Phone { get; set; }
+    public string? Email { get; set; }
+    public string? Website { get; set; }
+    public string? ContactName { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/Position.cs b/LegacyOutput/src/IRM.SPA/Models/Position.cs
new file mode 100644
index 0000000000000000000000000000000000000000..a6f9543eebd29c5626ed28741e6b4065ad3d16cf
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Position.cs
@@ -0,0 +1,16 @@
+namespace IRM.SPA.Models;
+
+public sealed class Position
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Description { get; set; } = string.Empty;
+    public DateTime? StartDate { get; set; }
+    public DateTime? Deadline { get; set; }
+    public bool Hired { get; set; }
+    public int? IdClient { get; set; }
+    public string ClientName { get; set; } = string.Empty;
+    public string ClientContactName { get; set; } = string.Empty;
+    public string ClientContactPhone { get; set; } = string.Empty;
+    public string ClientContactEmail { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..cfa76e79d96580b7b4d98e9b476807ef6f12acb5
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class PositionFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Description { get; set; }
+    public string? StartDate { get; set; }
+    public string? Deadline { get; set; }
+    public string? ClientContact { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Program.cs b/LegacyOutput/src/IRM.SPA/Program.cs
index 00184fc283cd7060825796fd98e55be1c243edd6..2008eaa884f07089ce5823fe41c6a6336a34f709
--- a/LegacyOutput/src/IRM.SPA/Program.cs
+++ b/LegacyOutput/src/IRM.SPA/Program.cs
@@ -10,8 +10,9 @@
     {
         public static void Main(string[] args)
         {
-            var builder = WebApplication.CreateBuilder(args);
-            ConfigurationOptions config = builder.Configuration.Get<ConfigurationOptions>() ?? new ConfigurationOptions();
+            var builder = WebApplication.CreateBuilder(args);
+            AppDomain.CurrentDomain.SetData("DataDirectory", Path.Combine(builder.Environment.ContentRootPath, "App_Data"));
+            ConfigurationOptions config = builder.Configuration.Get<ConfigurationOptions>() ?? new ConfigurationOptions();
             // Add services to the container.
             builder.Services.AddRazorComponents()
                 .AddInteractiveServerComponents();           
diff --git a/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..1c88253e59d707a339e900e3d8c1a8b2d56950d2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
@@ -0,0 +1,268 @@
+using System.Data;
+using IRM.SPA.Models;
+using Microsoft.Data.SqlClient;
+
+namespace IRM.SPA.Services;
+
+public sealed class HiringRepository(IConfiguration configuration) : IHiringRepository
+{
+    private readonly string _connectionString = configuration.GetConnectionString("HiringConnection")
+        ?? throw new InvalidOperationException("ConnectionStrings:HiringConnection is not configured.");
+
+    public async Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Name", filter.Name);
+        AddLike(where, parameters, "Phone", filter.Phone);
+        AddLike(where, parameters, "Email", filter.Email);
+        AddLike(where, parameters, "Website", filter.Website);
+        AddLike(where, parameters, "ContactName", filter.ContactName);
+
+        var sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients";
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var clients = new List<Client>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            clients.Add(ReadClient(reader));
+        }
+
+        return clients;
+    }
+
+    public async Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients WHERE Id = @Id";
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadClient(reader) : null;
+    }
+
+    public async Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Clients (Name, Phone, Email, ContactName, Website)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Phone, @Email, @ContactName, @Website)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Clients
+            SET Name = @Name, Phone = @Phone, Email = @Email, ContactName = @ContactName, Website = @Website
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = client.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    public async Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Positions.Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Positions.Name", filter.Name, "@Name");
+        AddLike(where, parameters, "Positions.Description", filter.Description, "@Description");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.StartDate, 120)", filter.StartDate, "@StartDate");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.Deadline, 120)", filter.Deadline, "@Deadline");
+        AddLike(where, parameters, "Positions.ClientContactName", filter.ClientContact, "@ClientContact");
+
+        var sql = """
+            SELECT Positions.Id, Positions.Name, Positions.Description, Positions.StartDate, Positions.Deadline,
+                   Positions.Hired, Positions.IdClient, Positions.ClientContactName, Positions.ClientContactPhone,
+                   Positions.ClientContactEmail, Clients.Name AS ClientName
+            FROM Positions
+            LEFT JOIN Clients ON Positions.IdClient = Clients.Id
+            """;
+
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Positions.Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var positions = new List<Position>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            positions.Add(ReadPosition(reader, includeClientName: true));
+        }
+
+        return positions;
+    }
+
+    public async Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            SELECT Id, Name, Description, StartDate, Deadline, Hired, IdClient,
+                   ClientContactName, ClientContactPhone, ClientContactEmail
+            FROM Positions
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadPosition(reader, includeClientName: false) : null;
+    }
+
+    public async Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Positions (Name, Description, StartDate, Deadline, Hired, ClientContactName,
+                                   ClientContactPhone, ClientContactEmail, IdClient)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Description, @StartDate, @Deadline, @Hired, @ClientContactName,
+                    @ClientContactPhone, @ClientContactEmail, @IdClient)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Positions
+            SET Name = @Name, Description = @Description, StartDate = @StartDate, Deadline = @Deadline,
+                Hired = @Hired, ClientContactName = @ClientContactName, ClientContactPhone = @ClientContactPhone,
+                ClientContactEmail = @ClientContactEmail, IdClient = @IdClient
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = position.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    private SqlConnection CreateConnection() => new(_connectionString);
+
+    private static void AddClientParameters(SqlCommand command, Client client)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = client.Name;
+        command.Parameters.Add("@Phone", SqlDbType.VarChar).Value = client.Phone;
+        command.Parameters.Add("@Email", SqlDbType.VarChar).Value = client.Email;
+        command.Parameters.Add("@ContactName", SqlDbType.VarChar).Value = client.ContactName;
+        command.Parameters.Add("@Website", SqlDbType.VarChar).Value = client.Website;
+    }
+
+    private static void AddPositionParameters(SqlCommand command, Position position, bool includeClient)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = position.Name;
+        command.Parameters.Add("@Description", SqlDbType.VarChar).Value = position.Description;
+        command.Parameters.Add("@StartDate", SqlDbType.Date).Value = (object?)position.StartDate ?? DBNull.Value;
+        command.Parameters.Add("@Deadline", SqlDbType.Date).Value = (object?)position.Deadline ?? DBNull.Value;
+        command.Parameters.Add("@Hired", SqlDbType.Bit).Value = position.Hired;
+        command.Parameters.Add("@ClientContactName", SqlDbType.VarChar).Value = position.ClientContactName;
+        command.Parameters.Add("@ClientContactPhone", SqlDbType.VarChar).Value = position.ClientContactPhone;
+        command.Parameters.Add("@ClientContactEmail", SqlDbType.VarChar).Value = position.ClientContactEmail;
+        if (includeClient)
+        {
+            command.Parameters.Add("@IdClient", SqlDbType.Int).Value = (object?)position.IdClient ?? DBNull.Value;
+        }
+    }
+
+    private static void AddLike(List<string> where, List<SqlParameter> parameters, string column, string? value, string? parameterName = null)
+    {
+        if (string.IsNullOrWhiteSpace(value))
+        {
+            return;
+        }
+
+        parameterName ??= "@" + column.Replace(".", string.Empty);
+        where.Add($"{column} LIKE {parameterName}");
+        parameters.Add(new SqlParameter(parameterName, SqlDbType.VarChar) { Value = "%" + value.Trim() + "%" });
+    }
+
+    private static Client ReadClient(SqlDataReader reader) => new()
+    {
+        Id = reader.GetInt32(0),
+        Name = GetString(reader, 1),
+        Phone = GetString(reader, 2),
+        Email = GetString(reader, 3),
+        ContactName = GetString(reader, 4),
+        Website = GetString(reader, 5)
+    };
+
+    private static Position ReadPosition(SqlDataReader reader, bool includeClientName)
+    {
+        var position = new Position
+        {
+            Id = reader.GetInt32(0),
+            Name = GetString(reader, 1),
+            Description = GetString(reader, 2),
+            StartDate = reader.IsDBNull(3) ? null : reader.GetDateTime(3),
+            Deadline = reader.IsDBNull(4) ? null : reader.GetDateTime(4),
+            Hired = !reader.IsDBNull(5) && reader.GetBoolean(5),
+            IdClient = reader.IsDBNull(6) ? null : reader.GetInt32(6),
+            ClientContactName = GetString(reader, 7),
+            ClientContactPhone = GetString(reader, 8),
+            ClientContactEmail = GetString(reader, 9)
+        };
+
+        if (includeClientName)
+        {
+            position.ClientName = GetString(reader, 10);
+        }
+
+        return position;
+    }
+
+    private static string GetString(SqlDataReader reader, int ordinal) =>
+        reader.IsDBNull(ordinal) ? string.Empty : reader.GetString(ordinal);
+}
diff --git a/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..468316298ba01ef622db9ffeeb20a3df775fc996
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
@@ -0,0 +1,15 @@
+using IRM.SPA.Models;
+
+namespace IRM.SPA.Services;
+
+public interface IHiringRepository
+{
+    Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default);
+    Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default);
+    Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default);
+    Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default);
+}
diff --git a/LegacyOutput/src/IRM.SPA/wwwroot/app.css b/LegacyOutput/src/IRM.SPA/wwwroot/app.css
index 7ac30e2a8df7ef2e3f233e331d1d58ca449099d8..c4e3f519ac693dd5c0ee569dc7dae70aa51945dc
--- a/LegacyOutput/src/IRM.SPA/wwwroot/app.css
+++ b/LegacyOutput/src/IRM.SPA/wwwroot/app.css
@@ -1,51 +1,247 @@
-html, body {
-    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
-}
-
-a, .btn-link {
-    color: #006bb7;
-}
-
-.btn-primary {
-    color: #fff;
-    background-color: #1b6ec2;
-    border-color: #1861ac;
-}
-
-.btn:focus, .btn:active:focus, .btn-link.nav-link:focus, .form-control:focus, .form-check-input:focus {
-  box-shadow: 0 0 0 0.1rem white, 0 0 0 0.25rem #258cfb;
-}
-
-.content {
-    padding-top: 1.1rem;
-}
-
-h1:focus {
-    outline: none;
-}
-
-.valid.modified:not([type=checkbox]) {
-    outline: 1px solid #26b050;
-}
-
-.invalid {
-    outline: 1px solid #e50000;
-}
-
-.validation-message {
-    color: #e50000;
-}
-
-.blazor-error-boundary {
-    background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNDkiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIG92ZXJmbG93PSJoaWRkZW4iPjxkZWZzPjxjbGlwUGF0aCBpZD0iY2xpcDAiPjxyZWN0IHg9IjIzNSIgeT0iNTEiIHdpZHRoPSI1NiIgaGVpZ2h0PSI0OSIvPjwvY2xpcFBhdGg+PC9kZWZzPjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMCkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yMzUgLTUxKSI+PHBhdGggZD0iTTI2My41MDYgNTFDMjY0LjcxNyA1MSAyNjUuODEzIDUxLjQ4MzcgMjY2LjYwNiA1Mi4yNjU4TDI2Ny4wNTIgNTIuNzk4NyAyNjcuNTM5IDUzLjYyODMgMjkwLjE4NSA5Mi4xODMxIDI5MC41NDUgOTIuNzk1IDI5MC42NTYgOTIuOTk2QzI5MC44NzcgOTMuNTEzIDI5MSA5NC4wODE1IDI5MSA5NC42NzgyIDI5MSA5Ny4wNjUxIDI4OS4wMzggOTkgMjg2LjYxNyA5OUwyNDAuMzgzIDk5QzIzNy45NjMgOTkgMjM2IDk3LjA2NTEgMjM2IDk0LjY3ODIgMjM2IDk0LjM3OTkgMjM2LjAzMSA5NC4wODg2IDIzNi4wODkgOTMuODA3MkwyMzYuMzM4IDkzLjAxNjIgMjM2Ljg1OCA5Mi4xMzE0IDI1OS40NzMgNTMuNjI5NCAyNTkuOTYxIDUyLjc5ODUgMjYwLjQwNyA1Mi4yNjU4QzI2MS4yIDUxLjQ4MzcgMjYyLjI5NiA1MSAyNjMuNTA2IDUxWk0yNjMuNTg2IDY2LjAxODNDMjYwLjczNyA2Ni4wMTgzIDI1OS4zMTMgNjcuMTI0NSAyNTkuMzEzIDY5LjMzNyAyNTkuMzEzIDY5LjYxMDIgMjU5LjMzMiA2OS44NjA4IDI1OS4zNzEgNzAuMDg4N0wyNjEuNzk1IDg0LjAxNjEgMjY1LjM4IDg0LjAxNjEgMjY3LjgyMSA2OS43NDc1QzI2Ny44NiA2OS43MzA5IDI2Ny44NzkgNjkuNTg3NyAyNjcuODc5IDY5LjMxNzkgMjY3Ljg3OSA2Ny4xMTgyIDI2Ni40NDggNjYuMDE4MyAyNjMuNTg2IDY2LjAxODNaTTI2My41NzYgODYuMDU0N0MyNjEuMDQ5IDg2LjA1NDcgMjU5Ljc4NiA4Ny4zMDA1IDI1OS43ODYgODkuNzkyMSAyNTkuNzg2IDkyLjI4MzcgMjYxLjA0OSA5My41Mjk1IDI2My41NzYgOTMuNTI5NSAyNjYuMTE2IDkzLjUyOTUgMjY3LjM4NyA5Mi4yODM3IDI2Ny4zODcgODkuNzkyMSAyNjcuMzg3IDg3LjMwMDUgMjY2LjExNiA4Ni4wNTQ3IDI2My41NzYgODYuMDU0N1oiIGZpbGw9IiNGRkU1MDAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48L3N2Zz4=) no-repeat 1rem/1.8rem, #b32121;
-    padding: 1rem 1rem 1rem 3.7rem;
-    color: white;
-}
-
-    .blazor-error-boundary::after {
-        content: "An error has occurred."
-    }
-
-.darker-border-checkbox.form-check-input {
-    border-color: #929292;
-}
+html,
+body {
+    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
+}
+
+body {
+    padding-top: 50px;
+    padding-bottom: 20px;
+}
+
+.body-content {
+    padding-left: 15px;
+    padding-right: 15px;
+}
+
+.dl-horizontal dt {
+    white-space: normal;
+}
+
+input[type="text"],
+input[type="password"],
+input[type="email"],
+input[type="tel"],
+input[type="select"] {
+    max-width: 280px;
+}
+
+.jumbotron {
+    padding: 30px;
+    margin-bottom: 30px;
+    color: inherit;
+    background-color: #eee;
+    border-radius: 6px;
+}
+
+.jumbotron h1 {
+    font-size: 63px;
+}
+
+.lead {
+    margin-bottom: 20px;
+    font-size: 21px;
+    font-weight: 300;
+    line-height: 1.4;
+}
+
+.navbar-inverse {
+    background-color: #222;
+    border-color: #080808;
+}
+
+.navbar-fixed-top {
+    position: fixed;
+    right: 0;
+    left: 0;
+    z-index: 1030;
+    top: 0;
+    border-width: 0 0 1px;
+}
+
+.navbar {
+    min-height: 50px;
+    margin-bottom: 20px;
+    border: 1px solid transparent;
+}
+
+.navbar-header {
+    float: left;
+}
+
+.navbar-brand {
+    float: left;
+    height: 50px;
+    padding: 15px;
+    font-size: 18px;
+    line-height: 20px;
+}
+
+.navbar-inverse .navbar-brand,
+.navbar-inverse .navbar-nav > li > a {
+    color: #9d9d9d;
+}
+
+.navbar-inverse .navbar-brand:hover,
+.navbar-inverse .navbar-nav > li > a:hover,
+.navbar-inverse .navbar-nav > li > a.active {
+    color: #fff;
+    text-decoration: none;
+}
+
+.navbar-nav {
+    float: left;
+    margin: 0;
+}
+
+.nav > li {
+    position: relative;
+    display: block;
+}
+
+.navbar-nav > li {
+    float: left;
+}
+
+.nav > li > a {
+    position: relative;
+    display: block;
+    padding: 10px 15px;
+}
+
+.navbar-nav > li > a {
+    padding-top: 15px;
+    padding-bottom: 15px;
+    line-height: 20px;
+}
+
+.btn-default {
+    color: #333;
+    background-color: #fff;
+    border-color: #ccc;
+}
+
+.btn {
+    display: inline-block;
+    padding: 6px 12px;
+    margin-bottom: 0;
+    font-size: 14px;
+    font-weight: 400;
+    line-height: 1.42857143;
+    text-align: center;
+    white-space: nowrap;
+    vertical-align: middle;
+    cursor: pointer;
+    border: 1px solid transparent;
+    border-radius: 4px;
+}
+
+.formLabel {
+    display: inline-block;
+    width: 200px;
+}
+
+.legacy-table {
+    margin-top: 20px;
+    margin-bottom: 10px;
+    border-collapse: separate;
+    border-spacing: 2px;
+}
+
+.legacy-table th,
+.legacy-table td {
+    padding: 1px;
+    font-weight: normal;
+    text-align: left;
+    vertical-align: top;
+}
+
+.legacy-table th {
+    font-weight: bold;
+}
+
+.legacy-table input[type="text"] {
+    width: 130px;
+}
+
+.description-input {
+    width: 500px;
+    max-width: 100%;
+    vertical-align: top;
+}
+
+.link-button {
+    padding: 0;
+    color: #337ab7;
+    background: none;
+    border: 0;
+    cursor: pointer;
+    font: inherit;
+}
+
+.link-button:hover {
+    color: #23527c;
+    text-decoration: underline;
+}
+
+.alert {
+    padding: 15px;
+    margin-top: 20px;
+    margin-bottom: 20px;
+    border: 1px solid transparent;
+    border-radius: 4px;
+}
+
+.alert-danger {
+    color: #a94442;
+    background-color: #f2dede;
+    border-color: #ebccd1;
+}
+
+@media screen and (min-width: 768px) {
+    .jumbotron {
+        margin-top: 20px;
+    }
+
+    .body-content {
+        padding: 0;
+    }
+}
+
+@media screen and (max-width: 767px) {
+    .navbar-header,
+    .navbar-nav,
+    .navbar-nav > li {
+        float: none;
+    }
+
+    .navbar-fixed-top {
+        position: static;
+    }
+
+    body {
+        padding-top: 0;
+    }
+
+    .jumbotron h1 {
+        font-size: 42px;
+    }
+}
+
+#blazor-error-ui {
+    background: lightyellow;
+    bottom: 0;
+    box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.2);
+    display: none;
+    left: 0;
+    padding: 0.6rem 1.25rem 0.7rem 1.25rem;
+    position: fixed;
+    width: 100%;
+    z-index: 1000;
+}
+
+#blazor-error-ui .dismiss {
+    cursor: pointer;
+    position: absolute;
+    right: 0.75rem;
+    top: 0.5rem;
+}

exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg "''^@page" Components'"\\Pages\\Audits Components\\Pages\\Controls Components\\Pages\\Dashboard Components\\Pages\\Reports Components\\Pages\\Templates" in D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA
 exited 1 in 386ms:
2026-07-01T14:25:34.704384Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.4 seconds
Output:

diff --git a/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor b/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
index 62e62873d628af7e91de98824e1143460b2db2a0..a9714ae63155375bce0d34f8e2a2cda4c6cfbeeb
--- a/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
@@ -1,23 +1,30 @@
-﻿@inherits LayoutComponentBase
-
-<div class="page">
-    <div class="sidebar">
-        <NavMenu />
-    </div>
-
-    <main>
-        <div class="top-row px-4">
-            <a href="https://learn.microsoft.com/aspnet/core/" target="_blank">About</a>
-        </div>
-
-        <article class="content px-4">
-            @Body
-        </article>
-    </main>
-</div>
-
-<div id="blazor-error-ui">
-    An unhandled error has occurred.
-    <a href="" class="reload">Reload</a>
-    <a class="dismiss">🗙</a>
-</div>
+@inherits LayoutComponentBase
+
+<div class="navbar navbar-inverse navbar-fixed-top">
+    <div class="container">
+        <div class="navbar-header">
+            <a class="navbar-brand" href="/">Hiring Tracker</a>
+        </div>
+        <div class="navbar-collapse collapse">
+            <ul class="nav navbar-nav">
+                <li><NavLink href="/" Match="NavLinkMatch.All">Home</NavLink></li>
+                <li><NavLink href="clients">Clients</NavLink></li>
+                <li><NavLink href="positions">Positions</NavLink></li>
+            </ul>
+        </div>
+    </div>
+</div>
+
+<div class="container body-content">
+    @Body
+    <hr />
+    <footer>
+        <p>&copy; @DateTime.Now.Year - Hiring Tracker</p>
+    </footer>
+</div>
+
+<div id="blazor-error-ui">
+    An unhandled error has occurred.
+    <a href="" class="reload">Reload</a>
+    <a class="dismiss">x</a>
+</div>
diff --git a/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor b/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
index 259e68b4bc97ef9ecc0b3899dc192d7790fd9b4c..c765fe7b74acb5c30b228509af2a8a6e6e1bf3c6
--- a/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
@@ -1,30 +1 @@
-﻿<div class="top-row ps-3 navbar navbar-dark">
-    <div class="container-fluid">
-        <a class="navbar-brand" href="">IRM.SPA</a>
-    </div>
-</div>
-
-<input type="checkbox" title="Navigation menu" class="navbar-toggler" />
-
-<div class="nav-scrollable" onclick="document.querySelector('.navbar-toggler').click()">
-    <nav class="flex-column">
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="" Match="NavLinkMatch.All">
-                <span class="bi bi-house-door-fill-nav-menu" aria-hidden="true"></span> Home
-            </NavLink>
-        </div>
-
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="counter">
-                <span class="bi bi-plus-square-fill-nav-menu" aria-hidden="true"></span> Counter
-            </NavLink>
-        </div>
-
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="weather">
-                <span class="bi bi-list-nested-nav-menu" aria-hidden="true"></span> Weather
-            </NavLink>
-        </div>
-    </nav>
-</div>
-
+@* Navigation is defined in MainLayout to match the legacy Site.Master markup. *@
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor
new file mode 100644
index 0000000000000000000000000000000000000000..1232eae426ef2325a0505f006805d6a05ba6115e
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor
@@ -0,0 +1,104 @@
+@page "/clients/new"
+@page "/clients/{Id:int}"
+@page "/ClientDetails"
+@page "/ClientDetails.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+@inject IJSRuntime JS
+
+<PageTitle>Client Details - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="SaveAsync" @onsubmit:preventDefault>
+    <span class="formLabel">Id:</span>
+    <span>@(client.Id == 0 ? string.Empty : client.Id)</span>
+    <br />
+    <span class="formLabel">Name:</span>
+    <input type="text" @bind="client.Name" />
+    <br />
+    <span class="formLabel">Phone:</span>
+    <input type="text" @bind="client.Phone" />
+    <br />
+    <span class="formLabel">Email:</span>
+    <input type="text" @bind="client.Email" />
+    <br />
+    <span class="formLabel">Contact Name:</span>
+    <input type="text" @bind="client.ContactName" />
+    <br />
+    <span class="formLabel">Website:</span>
+    <input type="text" @bind="client.Website" />
+    <br />
+    @if (isEdit)
+    {
+        <button class="link-button" type="submit">Update</button>
+    }
+    else
+    {
+        <button class="link-button" type="submit">Insert</button>
+    }
+</form>
+
+@code {
+    [Parameter] public int? Id { get; set; }
+
+    private Client client = new();
+    private bool isEdit;
+    private string? errorMessage;
+
+    protected override async Task OnParametersSetAsync()
+    {
+        errorMessage = null;
+        isEdit = false;
+        client = new Client();
+
+        if (Id is not { } id)
+        {
+            return;
+        }
+
+        try
+        {
+            var existing = await Repository.GetClientAsync(id);
+            if (existing is not null)
+            {
+                client = existing;
+                isEdit = true;
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load client. " + ex.Message;
+        }
+    }
+
+    private async Task SaveAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            if (isEdit)
+            {
+                if (await Repository.UpdateClientAsync(client))
+                {
+                    await JS.InvokeVoidAsync("alert", "Client updated successfully");
+                }
+            }
+            else
+            {
+                client.Id = await Repository.InsertClientAsync(client);
+                isEdit = true;
+                await JS.InvokeVoidAsync("alert", "Client added successfully");
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to save client. " + ex.Message;
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor
new file mode 100644
index 0000000000000000000000000000000000000000..774521377b61d400b5e79c84a3304d20b83878b3
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor
@@ -0,0 +1,85 @@
+@page "/clients"
+@page "/ClientsList"
+@page "/ClientsList.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+
+<PageTitle>Clients - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="ApplyFilter" @onsubmit:preventDefault>
+    <table class="legacy-table">
+        <thead>
+            <tr>
+                <th>Id</th>
+                <th>Client Name</th>
+                <th>Phone</th>
+                <th>Email</th>
+                <th>Website</th>
+                <th>Contact Name</th>
+                <th></th>
+            </tr>
+            <tr>
+                <th><input type="text" @bind="filter.Id" /></th>
+                <th><input type="text" @bind="filter.Name" /></th>
+                <th><input type="text" @bind="filter.Phone" /></th>
+                <th><input type="text" @bind="filter.Email" /></th>
+                <th><input type="text" @bind="filter.Website" /></th>
+                <th><input type="text" @bind="filter.ContactName" /></th>
+                <th><button type="submit">Filter</button></th>
+            </tr>
+        </thead>
+        <tbody>
+            @foreach (var client in clients)
+            {
+                <tr>
+                    <td>@client.Id</td>
+                    <td>@client.Name</td>
+                    <td>@client.Phone</td>
+                    <td>@client.Email</td>
+                    <td>@client.Website</td>
+                    <td>@client.ContactName</td>
+                    <td><a href="clients/@client.Id">Details</a></td>
+                </tr>
+            }
+        </tbody>
+    </table>
+</form>
+
+<a href="clients/new">Add new client</a>
+
+@code {
+    private readonly ClientFilter filter = new();
+    private IReadOnlyList<Client> clients = [];
+    private string? errorMessage;
+
+    protected override async Task OnInitializedAsync()
+    {
+        await LoadClientsAsync();
+    }
+
+    private async Task ApplyFilter()
+    {
+        await LoadClientsAsync();
+    }
+
+    private async Task LoadClientsAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            clients = await Repository.GetClientsAsync(filter);
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load clients. " + ex.Message;
+            clients = [];
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
index df0502354fdfbbef85e1673ffcff56d85d2481bf..e4fbd72369d329a04d4cead6939579592e284c3d
--- a/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
@@ -1,7 +1,26 @@
-﻿@page "/"
-
-<PageTitle>Home</PageTitle>
-
-<h1>Hello, world!</h1>
-
-Welcome to your new app.
+@page "/"
+@page "/Default.aspx"
+
+<PageTitle>Home Page - Hiring Tracker</PageTitle>
+
+<div class="jumbotron">
+    <h1>Hiring Tracking</h1>
+    <p class="lead">Track positions and candidates.</p>
+</div>
+
+<div class="row">
+    <div class="col-md-4">
+        <h2>Positions</h2>
+        <p>View open positions or query previous hires.</p>
+        <p>
+            <a class="btn btn-default" href="positions">View</a>
+        </p>
+    </div>
+    <div class="col-md-4">
+        <h2>Clients</h2>
+        <p>Manage contacts requesting the positions.</p>
+        <p>
+            <a class="btn btn-default" href="clients">View</a>
+        </p>
+    </div>
+</div>
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor
new file mode 100644
index 0000000000000000000000000000000000000000..51bb6ec59ec33db24c64c1bb595bdf18d2e087ec
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor
@@ -0,0 +1,139 @@
+@page "/positions/new"
+@page "/positions/{Id:int}"
+@page "/PositionDetails"
+@page "/PositionDetails.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+@inject IJSRuntime JS
+
+<PageTitle>Position Details - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="SaveAsync" @onsubmit:preventDefault>
+    <span class="formLabel">Id:</span>
+    <span>@(position.Id == 0 ? string.Empty : position.Id)</span>
+    <br />
+    <span class="formLabel">Name:</span>
+    <input type="text" @bind="position.Name" />
+    <br />
+    <span class="formLabel">Description:</span>
+    <textarea rows="6" class="description-input" @bind="position.Description"></textarea>
+    <br />
+    <span class="formLabel">Start Date:</span>
+    <input type="date" value="@startDateText" @onchange="e => startDateText = e.Value?.ToString() ?? string.Empty" />
+    <br />
+    <span class="formLabel">Deadline:</span>
+    <input type="date" value="@deadlineText" @onchange="e => deadlineText = e.Value?.ToString() ?? string.Empty" />
+    <br />
+    <span class="formLabel">Hired?:</span>
+    <input type="checkbox" @bind="position.Hired" />
+    <br />
+    <span class="formLabel">Client:</span>
+    <select @bind="position.IdClient">
+        @foreach (var client in clients)
+        {
+            <option value="@client.Id">@client.Name</option>
+        }
+    </select>
+    <br />
+    <span class="formLabel">Client Contact Name:</span>
+    <input type="text" @bind="position.ClientContactName" />
+    <br />
+    <span class="formLabel">Phone:</span>
+    <input type="text" @bind="position.ClientContactPhone" />
+    <br />
+    <span class="formLabel">Email:</span>
+    <input type="text" @bind="position.ClientContactEmail" />
+    <br />
+    @if (isEdit)
+    {
+        <button class="link-button" type="submit">Update</button>
+    }
+    else
+    {
+        <button class="link-button" type="submit">Insert</button>
+    }
+</form>
+
+@code {
+    [Parameter] public int? Id { get; set; }
+
+    private Position position = new();
+    private IReadOnlyList<Client> clients = [];
+    private bool isEdit;
+    private string? errorMessage;
+    private string startDateText = string.Empty;
+    private string deadlineText = string.Empty;
+
+    protected override async Task OnParametersSetAsync()
+    {
+        errorMessage = null;
+        isEdit = false;
+        position = new Position();
+        startDateText = string.Empty;
+        deadlineText = string.Empty;
+
+        try
+        {
+            clients = await Repository.GetClientsAsync(new ClientFilter());
+            position.IdClient = clients.FirstOrDefault()?.Id;
+
+            if (Id is not { } id)
+            {
+                return;
+            }
+
+            var existing = await Repository.GetPositionAsync(id);
+            if (existing is not null)
+            {
+                position = existing;
+                startDateText = ToDateInputValue(position.StartDate);
+                deadlineText = ToDateInputValue(position.Deadline);
+                isEdit = true;
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load position. " + ex.Message;
+        }
+    }
+
+    private async Task SaveAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            position.StartDate = ParseDate(startDateText);
+            position.Deadline = ParseDate(deadlineText);
+
+            if (isEdit)
+            {
+                if (await Repository.UpdatePositionAsync(position))
+                {
+                    await JS.InvokeVoidAsync("alert", "Position updated successfully");
+                }
+            }
+            else
+            {
+                position.Id = await Repository.InsertPositionAsync(position);
+                isEdit = true;
+                await JS.InvokeVoidAsync("alert", "Position added successfully");
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to save position. " + ex.Message;
+        }
+    }
+
+    private static string ToDateInputValue(DateTime? value) => value?.ToString("yyyy-MM-dd") ?? string.Empty;
+
+    private static DateTime? ParseDate(string value) =>
+        DateTime.TryParse(value, out var parsed) ? parsed.Date : null;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor
new file mode 100644
index 0000000000000000000000000000000000000000..efdcec61db320f36ea4b1bad176e604944be65e2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor
@@ -0,0 +1,88 @@
+@page "/positions"
+@page "/PositionsList"
+@page "/PositionsList.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+
+<PageTitle>Positions - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="ApplyFilter" @onsubmit:preventDefault>
+    <table class="legacy-table">
+        <thead>
+            <tr>
+                <th>Id</th>
+                <th>Name</th>
+                <th>Description</th>
+                <th>Start Date</th>
+                <th>Deadline</th>
+                <th>Position Closed</th>
+                <th>Client Contact</th>
+                <th></th>
+            </tr>
+            <tr>
+                <th><input type="text" @bind="filter.Id" /></th>
+                <th><input type="text" @bind="filter.Name" /></th>
+                <th><input type="text" @bind="filter.Description" /></th>
+                <th><input type="text" @bind="filter.StartDate" /></th>
+                <th><input type="text" @bind="filter.Deadline" /></th>
+                <th></th>
+                <th><input type="text" @bind="filter.ClientContact" /></th>
+                <th><button type="submit">Filter</button></th>
+            </tr>
+        </thead>
+        <tbody>
+            @foreach (var position in positions)
+            {
+                <tr>
+                    <td>@position.Id</td>
+                    <td>@position.Name</td>
+                    <td>@position.Description</td>
+                    <td>@position.StartDate</td>
+                    <td>@position.Deadline</td>
+                    <td>@position.Hired</td>
+                    <td>@position.ClientName (@position.ClientContactName)</td>
+                    <td><a href="positions/@position.Id">Details</a></td>
+                </tr>
+            }
+        </tbody>
+    </table>
+</form>
+
+<a href="positions/new">Add new position</a>
+
+@code {
+    private readonly PositionFilter filter = new();
+    private IReadOnlyList<Position> positions = [];
+    private string? errorMessage;
+
+    protected override async Task OnInitializedAsync()
+    {
+        await LoadPositionsAsync();
+    }
+
+    private async Task ApplyFilter()
+    {
+        await LoadPositionsAsync();
+    }
+
+    private async Task LoadPositionsAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            positions = await Repository.GetPositionsAsync(filter);
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load positions. " + ex.Message;
+            positions = [];
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/_Imports.razor b/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
index de2621323fafca41583fecc7d1b4b181a1e49ac1..4ca0297300bf206b5f4f4e3af4a8adffd1865970
--- a/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
@@ -5,6 +5,8 @@
 @using Microsoft.AspNetCore.Components.Web
 @using static Microsoft.AspNetCore.Components.Web.RenderMode
 @using Microsoft.AspNetCore.Components.Web.Virtualization
-@using Microsoft.JSInterop
-@using IRM.SPA
-@using IRM.SPA.Components
+@using Microsoft.JSInterop
+@using IRM.SPA
+@using IRM.SPA.Components
+@using IRM.SPA.Models
+@using IRM.SPA.Services
diff --git a/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs b/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
index 8a7b20c19addfd182712b09a487081eda45d085a..a1e19750167d74ae38221cb933beb102768676d5
--- a/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
+++ b/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
@@ -13,13 +13,14 @@
 {
     public static class DependancyInjector
     {
-        public static void RegisterServices(IServiceCollection services, ConfigurationOptions config)
-        {
-           
-
-            RegisterApiClients(services, config);           
-            RegisterModelValidators(services);
-        }
+        public static void RegisterServices(IServiceCollection services, ConfigurationOptions config)
+        {
+           
+
+            services.AddScoped<IHiringRepository, HiringRepository>();
+            RegisterApiClients(services, config);           
+            RegisterModelValidators(services);
+        }
        
         private static void RegisterModelValidators(IServiceCollection services)
         {
diff --git a/LegacyOutput/src/IRM.SPA/Models/Client.cs b/LegacyOutput/src/IRM.SPA/Models/Client.cs
new file mode 100644
index 0000000000000000000000000000000000000000..46bfecbc332bde56ebed47d21516d9a9c7773d42
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Client.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class Client
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Phone { get; set; } = string.Empty;
+    public string Email { get; set; } = string.Empty;
+    public string ContactName { get; set; } = string.Empty;
+    public string Website { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..d59d0bb30c1802c64fa28e40d6a449e156739081
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class ClientFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Phone { get; set; }
+    public string? Email { get; set; }
+    public string? Website { get; set; }
+    public string? ContactName { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/Position.cs b/LegacyOutput/src/IRM.SPA/Models/Position.cs
new file mode 100644
index 0000000000000000000000000000000000000000..a6f9543eebd29c5626ed28741e6b4065ad3d16cf
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Position.cs
@@ -0,0 +1,16 @@
+namespace IRM.SPA.Models;
+
+public sealed class Position
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Description { get; set; } = string.Empty;
+    public DateTime? StartDate { get; set; }
+    public DateTime? Deadline { get; set; }
+    public bool Hired { get; set; }
+    public int? IdClient { get; set; }
+    public string ClientName { get; set; } = string.Empty;
+    public string ClientContactName { get; set; } = string.Empty;
+    public string ClientContactPhone { get; set; } = string.Empty;
+    public string ClientContactEmail { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..cfa76e79d96580b7b4d98e9b476807ef6f12acb5
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class PositionFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Description { get; set; }
+    public string? StartDate { get; set; }
+    public string? Deadline { get; set; }
+    public string? ClientContact { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Program.cs b/LegacyOutput/src/IRM.SPA/Program.cs
index 00184fc283cd7060825796fd98e55be1c243edd6..2008eaa884f07089ce5823fe41c6a6336a34f709
--- a/LegacyOutput/src/IRM.SPA/Program.cs
+++ b/LegacyOutput/src/IRM.SPA/Program.cs
@@ -10,8 +10,9 @@
     {
         public static void Main(string[] args)
         {
-            var builder = WebApplication.CreateBuilder(args);
-            ConfigurationOptions config = builder.Configuration.Get<ConfigurationOptions>() ?? new ConfigurationOptions();
+            var builder = WebApplication.CreateBuilder(args);
+            AppDomain.CurrentDomain.SetData("DataDirectory", Path.Combine(builder.Environment.ContentRootPath, "App_Data"));
+            ConfigurationOptions config = builder.Configuration.Get<ConfigurationOptions>() ?? new ConfigurationOptions();
             // Add services to the container.
             builder.Services.AddRazorComponents()
                 .AddInteractiveServerComponents();           
diff --git a/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..1c88253e59d707a339e900e3d8c1a8b2d56950d2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
@@ -0,0 +1,268 @@
+using System.Data;
+using IRM.SPA.Models;
+using Microsoft.Data.SqlClient;
+
+namespace IRM.SPA.Services;
+
+public sealed class HiringRepository(IConfiguration configuration) : IHiringRepository
+{
+    private readonly string _connectionString = configuration.GetConnectionString("HiringConnection")
+        ?? throw new InvalidOperationException("ConnectionStrings:HiringConnection is not configured.");
+
+    public async Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Name", filter.Name);
+        AddLike(where, parameters, "Phone", filter.Phone);
+        AddLike(where, parameters, "Email", filter.Email);
+        AddLike(where, parameters, "Website", filter.Website);
+        AddLike(where, parameters, "ContactName", filter.ContactName);
+
+        var sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients";
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var clients = new List<Client>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            clients.Add(ReadClient(reader));
+        }
+
+        return clients;
+    }
+
+    public async Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients WHERE Id = @Id";
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadClient(reader) : null;
+    }
+
+    public async Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Clients (Name, Phone, Email, ContactName, Website)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Phone, @Email, @ContactName, @Website)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Clients
+            SET Name = @Name, Phone = @Phone, Email = @Email, ContactName = @ContactName, Website = @Website
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = client.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    public async Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Positions.Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Positions.Name", filter.Name, "@Name");
+        AddLike(where, parameters, "Positions.Description", filter.Description, "@Description");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.StartDate, 120)", filter.StartDate, "@StartDate");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.Deadline, 120)", filter.Deadline, "@Deadline");
+        AddLike(where, parameters, "Positions.ClientContactName", filter.ClientContact, "@ClientContact");
+
+        var sql = """
+            SELECT Positions.Id, Positions.Name, Positions.Description, Positions.StartDate, Positions.Deadline,
+                   Positions.Hired, Positions.IdClient, Positions.ClientContactName, Positions.ClientContactPhone,
+                   Positions.ClientContactEmail, Clients.Name AS ClientName
+            FROM Positions
+            LEFT JOIN Clients ON Positions.IdClient = Clients.Id
+            """;
+
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Positions.Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var positions = new List<Position>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            positions.Add(ReadPosition(reader, includeClientName: true));
+        }
+
+        return positions;
+    }
+
+    public async Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            SELECT Id, Name, Description, StartDate, Deadline, Hired, IdClient,
+                   ClientContactName, ClientContactPhone, ClientContactEmail
+            FROM Positions
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadPosition(reader, includeClientName: false) : null;
+    }
+
+    public async Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Positions (Name, Description, StartDate, Deadline, Hired, ClientContactName,
+                                   ClientContactPhone, ClientContactEmail, IdClient)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Description, @StartDate, @Deadline, @Hired, @ClientContactName,
+                    @ClientContactPhone, @ClientContactEmail, @IdClient)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Positions
+            SET Name = @Name, Description = @Description, StartDate = @StartDate, Deadline = @Deadline,
+                Hired = @Hired, ClientContactName = @ClientContactName, ClientContactPhone = @ClientContactPhone,
+                ClientContactEmail = @ClientContactEmail, IdClient = @IdClient
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = position.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    private SqlConnection CreateConnection() => new(_connectionString);
+
+    private static void AddClientParameters(SqlCommand command, Client client)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = client.Name;
+        command.Parameters.Add("@Phone", SqlDbType.VarChar).Value = client.Phone;
+        command.Parameters.Add("@Email", SqlDbType.VarChar).Value = client.Email;
+        command.Parameters.Add("@ContactName", SqlDbType.VarChar).Value = client.ContactName;
+        command.Parameters.Add("@Website", SqlDbType.VarChar).Value = client.Website;
+    }
+
+    private static void AddPositionParameters(SqlCommand command, Position position, bool includeClient)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = position.Name;
+        command.Parameters.Add("@Description", SqlDbType.VarChar).Value = position.Description;
+        command.Parameters.Add("@StartDate", SqlDbType.Date).Value = (object?)position.StartDate ?? DBNull.Value;
+        command.Parameters.Add("@Deadline", SqlDbType.Date).Value = (object?)position.Deadline ?? DBNull.Value;
+        command.Parameters.Add("@Hired", SqlDbType.Bit).Value = position.Hired;
+        command.Parameters.Add("@ClientContactName", SqlDbType.VarChar).Value = position.ClientContactName;
+        command.Parameters.Add("@ClientContactPhone", SqlDbType.VarChar).Value = position.ClientContactPhone;
+        command.Parameters.Add("@ClientContactEmail", SqlDbType.VarChar).Value = position.ClientContactEmail;
+        if (includeClient)
+        {
+            command.Parameters.Add("@IdClient", SqlDbType.Int).Value = (object?)position.IdClient ?? DBNull.Value;
+        }
+    }
+
+    private static void AddLike(List<string> where, List<SqlParameter> parameters, string column, string? value, string? parameterName = null)
+    {
+        if (string.IsNullOrWhiteSpace(value))
+        {
+            return;
+        }
+
+        parameterName ??= "@" + column.Replace(".", string.Empty);
+        where.Add($"{column} LIKE {parameterName}");
+        parameters.Add(new SqlParameter(parameterName, SqlDbType.VarChar) { Value = "%" + value.Trim() + "%" });
+    }
+
+    private static Client ReadClient(SqlDataReader reader) => new()
+    {
+        Id = reader.GetInt32(0),
+        Name = GetString(reader, 1),
+        Phone = GetString(reader, 2),
+        Email = GetString(reader, 3),
+        ContactName = GetString(reader, 4),
+        Website = GetString(reader, 5)
+    };
+
+    private static Position ReadPosition(SqlDataReader reader, bool includeClientName)
+    {
+        var position = new Position
+        {
+            Id = reader.GetInt32(0),
+            Name = GetString(reader, 1),
+            Description = GetString(reader, 2),
+            StartDate = reader.IsDBNull(3) ? null : reader.GetDateTime(3),
+            Deadline = reader.IsDBNull(4) ? null : reader.GetDateTime(4),
+            Hired = !reader.IsDBNull(5) && reader.GetBoolean(5),
+            IdClient = reader.IsDBNull(6) ? null : reader.GetInt32(6),
+            ClientContactName = GetString(reader, 7),
+            ClientContactPhone = GetString(reader, 8),
+            ClientContactEmail = GetString(reader, 9)
+        };
+
+        if (includeClientName)
+        {
+            position.ClientName = GetString(reader, 10);
+        }
+
+        return position;
+    }
+
+    private static string GetString(SqlDataReader reader, int ordinal) =>
+        reader.IsDBNull(ordinal) ? string.Empty : reader.GetString(ordinal);
+}
diff --git a/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..468316298ba01ef622db9ffeeb20a3df775fc996
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
@@ -0,0 +1,15 @@
+using IRM.SPA.Models;
+
+namespace IRM.SPA.Services;
+
+public interface IHiringRepository
+{
+    Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default);
+    Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default);
+    Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default);
+    Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default);
+}
diff --git a/LegacyOutput/src/IRM.SPA/wwwroot/app.css b/LegacyOutput/src/IRM.SPA/wwwroot/app.css
index 7ac30e2a8df7ef2e3f233e331d1d58ca449099d8..c4e3f519ac693dd5c0ee569dc7dae70aa51945dc
--- a/LegacyOutput/src/IRM.SPA/wwwroot/app.css
+++ b/LegacyOutput/src/IRM.SPA/wwwroot/app.css
@@ -1,51 +1,247 @@
-html, body {
-    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
-}
-
-a, .btn-link {
-    color: #006bb7;
-}
-
-.btn-primary {
-    color: #fff;
-    background-color: #1b6ec2;
-    border-color: #1861ac;
-}
-
-.btn:focus, .btn:active:focus, .btn-link.nav-link:focus, .form-control:focus, .form-check-input:focus {
-  box-shadow: 0 0 0 0.1rem white, 0 0 0 0.25rem #258cfb;
-}
-
-.content {
-    padding-top: 1.1rem;
-}
-
-h1:focus {
-    outline: none;
-}
-
-.valid.modified:not([type=checkbox]) {
-    outline: 1px solid #26b050;
-}
-
-.invalid {
-    outline: 1px solid #e50000;
-}
-
-.validation-message {
-    color: #e50000;
-}
-
-.blazor-error-boundary {
-    background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNDkiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIG92ZXJmbG93PSJoaWRkZW4iPjxkZWZzPjxjbGlwUGF0aCBpZD0iY2xpcDAiPjxyZWN0IHg9IjIzNSIgeT0iNTEiIHdpZHRoPSI1NiIgaGVpZ2h0PSI0OSIvPjwvY2xpcFBhdGg+PC9kZWZzPjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMCkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yMzUgLTUxKSI+PHBhdGggZD0iTTI2My41MDYgNTFDMjY0LjcxNyA1MSAyNjUuODEzIDUxLjQ4MzcgMjY2LjYwNiA1Mi4yNjU4TDI2Ny4wNTIgNTIuNzk4NyAyNjcuNTM5IDUzLjYyODMgMjkwLjE4NSA5Mi4xODMxIDI5MC41NDUgOTIuNzk1IDI5MC42NTYgOTIuOTk2QzI5MC44NzcgOTMuNTEzIDI5MSA5NC4wODE1IDI5MSA5NC42NzgyIDI5MSA5Ny4wNjUxIDI4OS4wMzggOTkgMjg2LjYxNyA5OUwyNDAuMzgzIDk5QzIzNy45NjMgOTkgMjM2IDk3LjA2NTEgMjM2IDk0LjY3ODIgMjM2IDk0LjM3OTkgMjM2LjAzMSA5NC4wODg2IDIzNi4wODkgOTMuODA3MkwyMzYuMzM4IDkzLjAxNjIgMjM2Ljg1OCA5Mi4xMzE0IDI1OS40NzMgNTMuNjI5NCAyNTkuOTYxIDUyLjc5ODUgMjYwLjQwNyA1Mi4yNjU4QzI2MS4yIDUxLjQ4MzcgMjYyLjI5NiA1MSAyNjMuNTA2IDUxWk0yNjMuNTg2IDY2LjAxODNDMjYwLjczNyA2Ni4wMTgzIDI1OS4zMTMgNjcuMTI0NSAyNTkuMzEzIDY5LjMzNyAyNTkuMzEzIDY5LjYxMDIgMjU5LjMzMiA2OS44NjA4IDI1OS4zNzEgNzAuMDg4N0wyNjEuNzk1IDg0LjAxNjEgMjY1LjM4IDg0LjAxNjEgMjY3LjgyMSA2OS43NDc1QzI2Ny44NiA2OS43MzA5IDI2Ny44NzkgNjkuNTg3NyAyNjcuODc5IDY5LjMxNzkgMjY3Ljg3OSA2Ny4xMTgyIDI2Ni40NDggNjYuMDE4MyAyNjMuNTg2IDY2LjAxODNaTTI2My41NzYgODYuMDU0N0MyNjEuMDQ5IDg2LjA1NDcgMjU5Ljc4NiA4Ny4zMDA1IDI1OS43ODYgODkuNzkyMSAyNTkuNzg2IDkyLjI4MzcgMjYxLjA0OSA5My41Mjk1IDI2My41NzYgOTMuNTI5NSAyNjYuMTE2IDkzLjUyOTUgMjY3LjM4NyA5Mi4yODM3IDI2Ny4zODcgODkuNzkyMSAyNjcuMzg3IDg3LjMwMDUgMjY2LjExNiA4Ni4wNTQ3IDI2My41NzYgODYuMDU0N1oiIGZpbGw9IiNGRkU1MDAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48L3N2Zz4=) no-repeat 1rem/1.8rem, #b32121;
-    padding: 1rem 1rem 1rem 3.7rem;
-    color: white;
-}
-
-    .blazor-error-boundary::after {
-        content: "An error has occurred."
-    }
-
-.darker-border-checkbox.form-check-input {
-    border-color: #929292;
-}
+html,
+body {
+    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
+}
+
+body {
+    padding-top: 50px;
+    padding-bottom: 20px;
+}
+
+.body-content {
+    padding-left: 15px;
+    padding-right: 15px;
+}
+
+.dl-horizontal dt {
+    white-space: normal;
+}
+
+input[type="text"],
+input[type="password"],
+input[type="email"],
+input[type="tel"],
+input[type="select"] {
+    max-width: 280px;
+}
+
+.jumbotron {
+    padding: 30px;
+    margin-bottom: 30px;
+    color: inherit;
+    background-color: #eee;
+    border-radius: 6px;
+}
+
+.jumbotron h1 {
+    font-size: 63px;
+}
+
+.lead {
+    margin-bottom: 20px;
+    font-size: 21px;
+    font-weight: 300;
+    line-height: 1.4;
+}
+
+.navbar-inverse {
+    background-color: #222;
+    border-color: #080808;
+}
+
+.navbar-fixed-top {
+    position: fixed;
+    right: 0;
+    left: 0;
+    z-index: 1030;
+    top: 0;
+    border-width: 0 0 1px;
+}
+
+.navbar {
+    min-height: 50px;
+    margin-bottom: 20px;
+    border: 1px solid transparent;
+}
+
+.navbar-header {
+    float: left;
+}
+
+.navbar-brand {
+    float: left;
+    height: 50px;
+    padding: 15px;
+    font-size: 18px;
+    line-height: 20px;
+}
+
+.navbar-inverse .navbar-brand,
+.navbar-inverse .navbar-nav > li > a {
+    color: #9d9d9d;
+}
+
+.navbar-inverse .navbar-brand:hover,
+.navbar-inverse .navbar-nav > li > a:hover,
+.navbar-inverse .navbar-nav > li > a.active {
+    color: #fff;
+    text-decoration: none;
+}
+
+.navbar-nav {
+    float: left;
+    margin: 0;
+}
+
+.nav > li {
+    position: relative;
+    display: block;
+}
+
+.navbar-nav > li {
+    float: left;
+}
+
+.nav > li > a {
+    position: relative;
+    display: block;
+    padding: 10px 15px;
+}
+
+.navbar-nav > li > a {
+    padding-top: 15px;
+    padding-bottom: 15px;
+    line-height: 20px;
+}
+
+.btn-default {
+    color: #333;
+    background-color: #fff;
+    border-color: #ccc;
+}
+
+.btn {
+    display: inline-block;
+    padding: 6px 12px;
+    margin-bottom: 0;
+    font-size: 14px;
+    font-weight: 400;
+    line-height: 1.42857143;
+    text-align: center;
+    white-space: nowrap;
+    vertical-align: middle;
+    cursor: pointer;
+    border: 1px solid transparent;
+    border-radius: 4px;
+}
+
+.formLabel {
+    display: inline-block;
+    width: 200px;
+}
+
+.legacy-table {
+    margin-top: 20px;
+    margin-bottom: 10px;
+    border-collapse: separate;
+    border-spacing: 2px;
+}
+
+.legacy-table th,
+.legacy-table td {
+    padding: 1px;
+    font-weight: normal;
+    text-align: left;
+    vertical-align: top;
+}
+
+.legacy-table th {
+    font-weight: bold;
+}
+
+.legacy-table input[type="text"] {
+    width: 130px;
+}
+
+.description-input {
+    width: 500px;
+    max-width: 100%;
+    vertical-align: top;
+}
+
+.link-button {
+    padding: 0;
+    color: #337ab7;
+    background: none;
+    border: 0;
+    cursor: pointer;
+    font: inherit;
+}
+
+.link-button:hover {
+    color: #23527c;
+    text-decoration: underline;
+}
+
+.alert {
+    padding: 15px;
+    margin-top: 20px;
+    margin-bottom: 20px;
+    border: 1px solid transparent;
+    border-radius: 4px;
+}
+
+.alert-danger {
+    color: #a94442;
+    background-color: #f2dede;
+    border-color: #ebccd1;
+}
+
+@media screen and (min-width: 768px) {
+    .jumbotron {
+        margin-top: 20px;
+    }
+
+    .body-content {
+        padding: 0;
+    }
+}
+
+@media screen and (max-width: 767px) {
+    .navbar-header,
+    .navbar-nav,
+    .navbar-nav > li {
+        float: none;
+    }
+
+    .navbar-fixed-top {
+        position: static;
+    }
+
+    body {
+        padding-top: 0;
+    }
+
+    .jumbotron h1 {
+        font-size: 42px;
+    }
+}
+
+#blazor-error-ui {
+    background: lightyellow;
+    bottom: 0;
+    box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.2);
+    display: none;
+    left: 0;
+    padding: 0.6rem 1.25rem 0.7rem 1.25rem;
+    position: fixed;
+    width: 100%;
+    z-index: 1000;
+}
+
+#blazor-error-ui .dismiss {
+    cursor: pointer;
+    position: absolute;
+    right: 0.75rem;
+    top: 0.5rem;
+}

codex
`counter` and `weather` were still routeable even though they were no longer linked. I’m removing those starter pages from routing entirely.
apply patch
patch: completed
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Pages\Counter.razor
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Pages\Weather.razor
diff --git a/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor b/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
index 62e62873d628af7e91de98824e1143460b2db2a0..a9714ae63155375bce0d34f8e2a2cda4c6cfbeeb
--- a/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
@@ -1,23 +1,30 @@
-﻿@inherits LayoutComponentBase
-
-<div class="page">
-    <div class="sidebar">
-        <NavMenu />
-    </div>
-
-    <main>
-        <div class="top-row px-4">
-            <a href="https://learn.microsoft.com/aspnet/core/" target="_blank">About</a>
-        </div>
-
-        <article class="content px-4">
-            @Body
-        </article>
-    </main>
-</div>
-
-<div id="blazor-error-ui">
-    An unhandled error has occurred.
-    <a href="" class="reload">Reload</a>
-    <a class="dismiss">🗙</a>
-</div>
+@inherits LayoutComponentBase
+
+<div class="navbar navbar-inverse navbar-fixed-top">
+    <div class="container">
+        <div class="navbar-header">
+            <a class="navbar-brand" href="/">Hiring Tracker</a>
+        </div>
+        <div class="navbar-collapse collapse">
+            <ul class="nav navbar-nav">
+                <li><NavLink href="/" Match="NavLinkMatch.All">Home</NavLink></li>
+                <li><NavLink href="clients">Clients</NavLink></li>
+                <li><NavLink href="positions">Positions</NavLink></li>
+            </ul>
+        </div>
+    </div>
+</div>
+
+<div class="container body-content">
+    @Body
+    <hr />
+    <footer>
+        <p>&copy; @DateTime.Now.Year - Hiring Tracker</p>
+    </footer>
+</div>
+
+<div id="blazor-error-ui">
+    An unhandled error has occurred.
+    <a href="" class="reload">Reload</a>
+    <a class="dismiss">x</a>
+</div>
diff --git a/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor b/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
index 259e68b4bc97ef9ecc0b3899dc192d7790fd9b4c..c765fe7b74acb5c30b228509af2a8a6e6e1bf3c6
--- a/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
@@ -1,30 +1 @@
-﻿<div class="top-row ps-3 navbar navbar-dark">
-    <div class="container-fluid">
-        <a class="navbar-brand" href="">IRM.SPA</a>
-    </div>
-</div>
-
-<input type="checkbox" title="Navigation menu" class="navbar-toggler" />
-
-<div class="nav-scrollable" onclick="document.querySelector('.navbar-toggler').click()">
-    <nav class="flex-column">
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="" Match="NavLinkMatch.All">
-                <span class="bi bi-house-door-fill-nav-menu" aria-hidden="true"></span> Home
-            </NavLink>
-        </div>
-
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="counter">
-                <span class="bi bi-plus-square-fill-nav-menu" aria-hidden="true"></span> Counter
-            </NavLink>
-        </div>
-
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="weather">
-                <span class="bi bi-list-nested-nav-menu" aria-hidden="true"></span> Weather
-            </NavLink>
-        </div>
-    </nav>
-</div>
-
+@* Navigation is defined in MainLayout to match the legacy Site.Master markup. *@
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor
new file mode 100644
index 0000000000000000000000000000000000000000..1232eae426ef2325a0505f006805d6a05ba6115e
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor
@@ -0,0 +1,104 @@
+@page "/clients/new"
+@page "/clients/{Id:int}"
+@page "/ClientDetails"
+@page "/ClientDetails.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+@inject IJSRuntime JS
+
+<PageTitle>Client Details - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="SaveAsync" @onsubmit:preventDefault>
+    <span class="formLabel">Id:</span>
+    <span>@(client.Id == 0 ? string.Empty : client.Id)</span>
+    <br />
+    <span class="formLabel">Name:</span>
+    <input type="text" @bind="client.Name" />
+    <br />
+    <span class="formLabel">Phone:</span>
+    <input type="text" @bind="client.Phone" />
+    <br />
+    <span class="formLabel">Email:</span>
+    <input type="text" @bind="client.Email" />
+    <br />
+    <span class="formLabel">Contact Name:</span>
+    <input type="text" @bind="client.ContactName" />
+    <br />
+    <span class="formLabel">Website:</span>
+    <input type="text" @bind="client.Website" />
+    <br />
+    @if (isEdit)
+    {
+        <button class="link-button" type="submit">Update</button>
+    }
+    else
+    {
+        <button class="link-button" type="submit">Insert</button>
+    }
+</form>
+
+@code {
+    [Parameter] public int? Id { get; set; }
+
+    private Client client = new();
+    private bool isEdit;
+    private string? errorMessage;
+
+    protected override async Task OnParametersSetAsync()
+    {
+        errorMessage = null;
+        isEdit = false;
+        client = new Client();
+
+        if (Id is not { } id)
+        {
+            return;
+        }
+
+        try
+        {
+            var existing = await Repository.GetClientAsync(id);
+            if (existing is not null)
+            {
+                client = existing;
+                isEdit = true;
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load client. " + ex.Message;
+        }
+    }
+
+    private async Task SaveAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            if (isEdit)
+            {
+                if (await Repository.UpdateClientAsync(client))
+                {
+                    await JS.InvokeVoidAsync("alert", "Client updated successfully");
+                }
+            }
+            else
+            {
+                client.Id = await Repository.InsertClientAsync(client);
+                isEdit = true;
+                await JS.InvokeVoidAsync("alert", "Client added successfully");
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to save client. " + ex.Message;
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor
new file mode 100644
index 0000000000000000000000000000000000000000..774521377b61d400b5e79c84a3304d20b83878b3
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor
@@ -0,0 +1,85 @@
+@page "/clients"
+@page "/ClientsList"
+@page "/ClientsList.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+
+<PageTitle>Clients - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="ApplyFilter" @onsubmit:preventDefault>
+    <table class="legacy-table">
+        <thead>
+            <tr>
+                <th>Id</th>
+                <th>Client Name</th>
+                <th>Phone</th>
+                <th>Email</th>
+                <th>Website</th>
+                <th>Contact Name</th>
+                <th></th>
+            </tr>
+            <tr>
+                <th><input type="text" @bind="filter.Id" /></th>
+                <th><input type="text" @bind="filter.Name" /></th>
+                <th><input type="text" @bind="filter.Phone" /></th>
+                <th><input type="text" @bind="filter.Email" /></th>
+                <th><input type="text" @bind="filter.Website" /></th>
+                <th><input type="text" @bind="filter.ContactName" /></th>
+                <th><button type="submit">Filter</button></th>
+            </tr>
+        </thead>
+        <tbody>
+            @foreach (var client in clients)
+            {
+                <tr>
+                    <td>@client.Id</td>
+                    <td>@client.Name</td>
+                    <td>@client.Phone</td>
+                    <td>@client.Email</td>
+                    <td>@client.Website</td>
+                    <td>@client.ContactName</td>
+                    <td><a href="clients/@client.Id">Details</a></td>
+                </tr>
+            }
+        </tbody>
+    </table>
+</form>
+
+<a href="clients/new">Add new client</a>
+
+@code {
+    private readonly ClientFilter filter = new();
+    private IReadOnlyList<Client> clients = [];
+    private string? errorMessage;
+
+    protected override async Task OnInitializedAsync()
+    {
+        await LoadClientsAsync();
+    }
+
+    private async Task ApplyFilter()
+    {
+        await LoadClientsAsync();
+    }
+
+    private async Task LoadClientsAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            clients = await Repository.GetClientsAsync(filter);
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load clients. " + ex.Message;
+            clients = [];
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/Counter.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/Counter.razor
deleted file mode 100644
index ba08d049a6a0d5fb9d3c521c37ab574965d2580a..0000000000000000000000000000000000000000
--- a/LegacyOutput/src/IRM.SPA/Components/Pages/Counter.razor
+++ /dev/null
@@ -1,19 +0,0 @@
-﻿@page "/counter"
-@rendermode InteractiveServer
-
-<PageTitle>Counter</PageTitle>
-
-<h1>Counter</h1>
-
-<p role="status">Current count: @currentCount</p>
-
-<button class="btn btn-primary" @onclick="IncrementCount">Click me</button>
-
-@code {
-    private int currentCount = 0;
-
-    private void IncrementCount()
-    {
-        currentCount++;
-    }
-}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
index df0502354fdfbbef85e1673ffcff56d85d2481bf..e4fbd72369d329a04d4cead6939579592e284c3d
--- a/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
@@ -1,7 +1,26 @@
-﻿@page "/"
-
-<PageTitle>Home</PageTitle>
-
-<h1>Hello, world!</h1>
-
-Welcome to your new app.
+@page "/"
+@page "/Default.aspx"
+
+<PageTitle>Home Page - Hiring Tracker</PageTitle>
+
+<div class="jumbotron">
+    <h1>Hiring Tracking</h1>
+    <p class="lead">Track positions and candidates.</p>
+</div>
+
+<div class="row">
+    <div class="col-md-4">
+        <h2>Positions</h2>
+        <p>View open positions or query previous hires.</p>
+        <p>
+            <a class="btn btn-default" href="positions">View</a>
+        </p>
+    </div>
+    <div class="col-md-4">
+        <h2>Clients</h2>
+        <p>Manage contacts requesting the positions.</p>
+        <p>
+            <a class="btn btn-default" href="clients">View</a>
+        </p>
+    </div>
+</div>
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor
new file mode 100644
index 0000000000000000000000000000000000000000..51bb6ec59ec33db24c64c1bb595bdf18d2e087ec
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor
@@ -0,0 +1,139 @@
+@page "/positions/new"
+@page "/positions/{Id:int}"
+@page "/PositionDetails"
+@page "/PositionDetails.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+@inject IJSRuntime JS
+
+<PageTitle>Position Details - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="SaveAsync" @onsubmit:preventDefault>
+    <span class="formLabel">Id:</span>
+    <span>@(position.Id == 0 ? string.Empty : position.Id)</span>
+    <br />
+    <span class="formLabel">Name:</span>
+    <input type="text" @bind="position.Name" />
+    <br />
+    <span class="formLabel">Description:</span>
+    <textarea rows="6" class="description-input" @bind="position.Description"></textarea>
+    <br />
+    <span class="formLabel">Start Date:</span>
+    <input type="date" value="@startDateText" @onchange="e => startDateText = e.Value?.ToString() ?? string.Empty" />
+    <br />
+    <span class="formLabel">Deadline:</span>
+    <input type="date" value="@deadlineText" @onchange="e => deadlineText = e.Value?.ToString() ?? string.Empty" />
+    <br />
+    <span class="formLabel">Hired?:</span>
+    <input type="checkbox" @bind="position.Hired" />
+    <br />
+    <span class="formLabel">Client:</span>
+    <select @bind="position.IdClient">
+        @foreach (var client in clients)
+        {
+            <option value="@client.Id">@client.Name</option>
+        }
+    </select>
+    <br />
+    <span class="formLabel">Client Contact Name:</span>
+    <input type="text" @bind="position.ClientContactName" />
+    <br />
+    <span class="formLabel">Phone:</span>
+    <input type="text" @bind="position.ClientContactPhone" />
+    <br />
+    <span class="formLabel">Email:</span>
+    <input type="text" @bind="position.ClientContactEmail" />
+    <br />
+    @if (isEdit)
+    {
+        <button class="link-button" type="submit">Update</button>
+    }
+    else
+    {
+        <button class="link-button" type="submit">Insert</button>
+    }
+</form>
+
+@code {
+    [Parameter] public int? Id { get; set; }
+
+    private Position position = new();
+    private IReadOnlyList<Client> clients = [];
+    private bool isEdit;
+    private string? errorMessage;
+    private string startDateText = string.Empty;
+    private string deadlineText = string.Empty;
+
+    protected override async Task OnParametersSetAsync()
+    {
+        errorMessage = null;
+        isEdit = false;
+        position = new Position();
+        startDateText = string.Empty;
+        deadlineText = string.Empty;
+
+        try
+        {
+            clients = await Repository.GetClientsAsync(new ClientFilter());
+            position.IdClient = clients.FirstOrDefault()?.Id;
+
+            if (Id is not { } id)
+            {
+                return;
+            }
+
+            var existing = await Repository.GetPositionAsync(id);
+            if (existing is not null)
+            {
+                position = existing;
+                startDateText = ToDateInputValue(position.StartDate);
+                deadlineText = ToDateInputValue(position.Deadline);
+                isEdit = true;
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load position. " + ex.Message;
+        }
+    }
+
+    private async Task SaveAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            position.StartDate = ParseDate(startDateText);
+            position.Deadline = ParseDate(deadlineText);
+
+            if (isEdit)
+            {
+                if (await Repository.UpdatePositionAsync(position))
+                {
+                    await JS.InvokeVoidAsync("alert", "Position updated successfully");
+                }
+            }
+            else
+            {
+                position.Id = await Repository.InsertPositionAsync(position);
+                isEdit = true;
+                await JS.InvokeVoidAsync("alert", "Position added successfully");
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to save position. " + ex.Message;
+        }
+    }
+
+    private static string ToDateInputValue(DateTime? value) => value?.ToString("yyyy-MM-dd") ?? string.Empty;
+
+    private static DateTime? ParseDate(string value) =>
+        DateTime.TryParse(value, out var parsed) ? parsed.Date : null;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor
new file mode 100644
index 0000000000000000000000000000000000000000..efdcec61db320f36ea4b1bad176e604944be65e2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor
@@ -0,0 +1,88 @@
+@page "/positions"
+@page "/PositionsList"
+@page "/PositionsList.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+
+<PageTitle>Positions - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="ApplyFilter" @onsubmit:preventDefault>
+    <table class="legacy-table">
+        <thead>
+            <tr>
+                <th>Id</th>
+                <th>Name</th>
+                <th>Description</th>
+                <th>Start Date</th>
+                <th>Deadline</th>
+                <th>Position Closed</th>
+                <th>Client Contact</th>
+                <th></th>
+            </tr>
+            <tr>
+                <th><input type="text" @bind="filter.Id" /></th>
+                <th><input type="text" @bind="filter.Name" /></th>
+                <th><input type="text" @bind="filter.Description" /></th>
+                <th><input type="text" @bind="filter.StartDate" /></th>
+                <th><input type="text" @bind="filter.Deadline" /></th>
+                <th></th>
+                <th><input type="text" @bind="filter.ClientContact" /></th>
+                <th><button type="submit">Filter</button></th>
+            </tr>
+        </thead>
+        <tbody>
+            @foreach (var position in positions)
+            {
+                <tr>
+                    <td>@position.Id</td>
+                    <td>@position.Name</td>
+                    <td>@position.Description</td>
+                    <td>@position.StartDate</td>
+                    <td>@position.Deadline</td>
+                    <td>@position.Hired</td>
+                    <td>@position.ClientName (@position.ClientContactName)</td>
+                    <td><a href="positions/@position.Id">Details</a></td>
+                </tr>
+            }
+        </tbody>
+    </table>
+</form>
+
+<a href="positions/new">Add new position</a>
+
+@code {
+    private readonly PositionFilter filter = new();
+    private IReadOnlyList<Position> positions = [];
+    private string? errorMessage;
+
+    protected override async Task OnInitializedAsync()
+    {
+        await LoadPositionsAsync();
+    }
+
+    private async Task ApplyFilter()
+    {
+        await LoadPositionsAsync();
+    }
+
+    private async Task LoadPositionsAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            positions = await Repository.GetPositionsAsync(filter);
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load positions. " + ex.Message;
+            positions = [];
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/Weather.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/Weather.razor
deleted file mode 100644
index 33631ab7afce233f173a24f29b551f45e506ce4a..0000000000000000000000000000000000000000
--- a/LegacyOutput/src/IRM.SPA/Components/Pages/Weather.razor
+++ /dev/null
@@ -1,64 +0,0 @@
-﻿@page "/weather"
-@attribute [StreamRendering]
-
-<PageTitle>Weather</PageTitle>
-
-<h1>Weather</h1>
-
-<p>This component demonstrates showing data.</p>
-
-@if (forecasts == null)
-{
-    <p><em>Loading...</em></p>
-}
-else
-{
-    <table class="table">
-        <thead>
-            <tr>
-                <th>Date</th>
-                <th>Temp. (C)</th>
-                <th>Temp. (F)</th>
-                <th>Summary</th>
-            </tr>
-        </thead>
-        <tbody>
-            @foreach (var forecast in forecasts)
-            {
-                <tr>
-                    <td>@forecast.Date.ToShortDateString()</td>
-                    <td>@forecast.TemperatureC</td>
-                    <td>@forecast.TemperatureF</td>
-                    <td>@forecast.Summary</td>
-                </tr>
-            }
-        </tbody>
-    </table>
-}
-
-@code {
-    private WeatherForecast[]? forecasts;
-
-    protected override async Task OnInitializedAsync()
-    {
-        // Simulate asynchronous loading to demonstrate streaming rendering
-        await Task.Delay(500);
-
-        var startDate = DateOnly.FromDateTime(DateTime.Now);
-        var summaries = new[] { "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching" };
-        forecasts = Enumerable.Range(1, 5).Select(index => new WeatherForecast
-        {
-            Date = startDate.AddDays(index),
-            TemperatureC = Random.Shared.Next(-20, 55),
-            Summary = summaries[Random.Shared.Next(summaries.Length)]
-        }).ToArray();
-    }
-
-    private class WeatherForecast
-    {
-        public DateOnly Date { get; set; }
-        public int TemperatureC { get; set; }
-        public string? Summary { get; set; }
-        public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
-    }
-}
diff --git a/LegacyOutput/src/IRM.SPA/Components/_Imports.razor b/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
index de2621323fafca41583fecc7d1b4b181a1e49ac1..4ca0297300bf206b5f4f4e3af4a8adffd1865970
--- a/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
@@ -5,6 +5,8 @@
 @using Microsoft.AspNetCore.Components.Web
 @using static Microsoft.AspNetCore.Components.Web.RenderMode
 @using Microsoft.AspNetCore.Components.Web.Virtualization
-@using Microsoft.JSInterop
-@using IRM.SPA
-@using IRM.SPA.Components
+@using Microsoft.JSInterop
+@using IRM.SPA
+@using IRM.SPA.Components
+@using IRM.SPA.Models
+@using IRM.SPA.Services
diff --git a/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs b/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
index 8a7b20c19addfd182712b09a487081eda45d085a..a1e19750167d74ae38221cb933beb102768676d5
--- a/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
+++ b/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
@@ -13,13 +13,14 @@
 {
     public static class DependancyInjector
     {
-        public static void RegisterServices(IServiceCollection services, ConfigurationOptions config)
-        {
-           
-
-            RegisterApiClients(services, config);           
-            RegisterModelValidators(services);
-        }
+        public static void RegisterServices(IServiceCollection services, ConfigurationOptions config)
+        {
+           
+
+            services.AddScoped<IHiringRepository, HiringRepository>();
+            RegisterApiClients(services, config);           
+            RegisterModelValidators(services);
+        }
        
         private static void RegisterModelValidators(IServiceCollection services)
         {
diff --git a/LegacyOutput/src/IRM.SPA/Models/Client.cs b/LegacyOutput/src/IRM.SPA/Models/Client.cs
new file mode 100644
index 0000000000000000000000000000000000000000..46bfecbc332bde56ebed47d21516d9a9c7773d42
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Client.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class Client
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Phone { get; set; } = string.Empty;
+    public string Email { get; set; } = string.Empty;
+    public string ContactName { get; set; } = string.Empty;
+    public string Website { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..d59d0bb30c1802c64fa28e40d6a449e156739081
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class ClientFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Phone { get; set; }
+    public string? Email { get; set; }
+    public string? Website { get; set; }
+    public string? ContactName { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/Position.cs b/LegacyOutput/src/IRM.SPA/Models/Position.cs
new file mode 100644
index 0000000000000000000000000000000000000000..a6f9543eebd29c5626ed28741e6b4065ad3d16cf
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Position.cs
@@ -0,0 +1,16 @@
+namespace IRM.SPA.Models;
+
+public sealed class Position
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Description { get; set; } = string.Empty;
+    public DateTime? StartDate { get; set; }
+    public DateTime? Deadline { get; set; }
+    public bool Hired { get; set; }
+    public int? IdClient { get; set; }
+    public string ClientName { get; set; } = string.Empty;
+    public string ClientContactName { get; set; } = string.Empty;
+    public string ClientContactPhone { get; set; } = string.Empty;
+    public string ClientContactEmail { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..cfa76e79d96580b7b4d98e9b476807ef6f12acb5
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class PositionFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Description { get; set; }
+    public string? StartDate { get; set; }
+    public string? Deadline { get; set; }
+    public string? ClientContact { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Program.cs b/LegacyOutput/src/IRM.SPA/Program.cs
index 00184fc283cd7060825796fd98e55be1c243edd6..2008eaa884f07089ce5823fe41c6a6336a34f709
--- a/LegacyOutput/src/IRM.SPA/Program.cs
+++ b/LegacyOutput/src/IRM.SPA/Program.cs
@@ -10,8 +10,9 @@
     {
         public static void Main(string[] args)
         {
-            var builder = WebApplication.CreateBuilder(args);
-            ConfigurationOptions config = builder.Configuration.Get<ConfigurationOptions>() ?? new ConfigurationOptions();
+            var builder = WebApplication.CreateBuilder(args);
+            AppDomain.CurrentDomain.SetData("DataDirectory", Path.Combine(builder.Environment.ContentRootPath, "App_Data"));
+            ConfigurationOptions config = builder.Configuration.Get<ConfigurationOptions>() ?? new ConfigurationOptions();
             // Add services to the container.
             builder.Services.AddRazorComponents()
                 .AddInteractiveServerComponents();           
diff --git a/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..1c88253e59d707a339e900e3d8c1a8b2d56950d2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
@@ -0,0 +1,268 @@
+using System.Data;
+using IRM.SPA.Models;
+using Microsoft.Data.SqlClient;
+
+namespace IRM.SPA.Services;
+
+public sealed class HiringRepository(IConfiguration configuration) : IHiringRepository
+{
+    private readonly string _connectionString = configuration.GetConnectionString("HiringConnection")
+        ?? throw new InvalidOperationException("ConnectionStrings:HiringConnection is not configured.");
+
+    public async Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Name", filter.Name);
+        AddLike(where, parameters, "Phone", filter.Phone);
+        AddLike(where, parameters, "Email", filter.Email);
+        AddLike(where, parameters, "Website", filter.Website);
+        AddLike(where, parameters, "ContactName", filter.ContactName);
+
+        var sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients";
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var clients = new List<Client>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            clients.Add(ReadClient(reader));
+        }
+
+        return clients;
+    }
+
+    public async Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients WHERE Id = @Id";
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadClient(reader) : null;
+    }
+
+    public async Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Clients (Name, Phone, Email, ContactName, Website)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Phone, @Email, @ContactName, @Website)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Clients
+            SET Name = @Name, Phone = @Phone, Email = @Email, ContactName = @ContactName, Website = @Website
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = client.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    public async Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Positions.Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Positions.Name", filter.Name, "@Name");
+        AddLike(where, parameters, "Positions.Description", filter.Description, "@Description");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.StartDate, 120)", filter.StartDate, "@StartDate");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.Deadline, 120)", filter.Deadline, "@Deadline");
+        AddLike(where, parameters, "Positions.ClientContactName", filter.ClientContact, "@ClientContact");
+
+        var sql = """
+            SELECT Positions.Id, Positions.Name, Positions.Description, Positions.StartDate, Positions.Deadline,
+                   Positions.Hired, Positions.IdClient, Positions.ClientContactName, Positions.ClientContactPhone,
+                   Positions.ClientContactEmail, Clients.Name AS ClientName
+            FROM Positions
+            LEFT JOIN Clients ON Positions.IdClient = Clients.Id
+            """;
+
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Positions.Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var positions = new List<Position>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            positions.Add(ReadPosition(reader, includeClientName: true));
+        }
+
+        return positions;
+    }
+
+    public async Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            SELECT Id, Name, Description, StartDate, Deadline, Hired, IdClient,
+                   ClientContactName, ClientContactPhone, ClientContactEmail
+            FROM Positions
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadPosition(reader, includeClientName: false) : null;
+    }
+
+    public async Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Positions (Name, Description, StartDate, Deadline, Hired, ClientContactName,
+                                   ClientContactPhone, ClientContactEmail, IdClient)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Description, @StartDate, @Deadline, @Hired, @ClientContactName,
+                    @ClientContactPhone, @ClientContactEmail, @IdClient)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Positions
+            SET Name = @Name, Description = @Description, StartDate = @StartDate, Deadline = @Deadline,
+                Hired = @Hired, ClientContactName = @ClientContactName, ClientContactPhone = @ClientContactPhone,
+                ClientContactEmail = @ClientContactEmail, IdClient = @IdClient
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = position.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    private SqlConnection CreateConnection() => new(_connectionString);
+
+    private static void AddClientParameters(SqlCommand command, Client client)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = client.Name;
+        command.Parameters.Add("@Phone", SqlDbType.VarChar).Value = client.Phone;
+        command.Parameters.Add("@Email", SqlDbType.VarChar).Value = client.Email;
+        command.Parameters.Add("@ContactName", SqlDbType.VarChar).Value = client.ContactName;
+        command.Parameters.Add("@Website", SqlDbType.VarChar).Value = client.Website;
+    }
+
+    private static void AddPositionParameters(SqlCommand command, Position position, bool includeClient)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = position.Name;
+        command.Parameters.Add("@Description", SqlDbType.VarChar).Value = position.Description;
+        command.Parameters.Add("@StartDate", SqlDbType.Date).Value = (object?)position.StartDate ?? DBNull.Value;
+        command.Parameters.Add("@Deadline", SqlDbType.Date).Value = (object?)position.Deadline ?? DBNull.Value;
+        command.Parameters.Add("@Hired", SqlDbType.Bit).Value = position.Hired;
+        command.Parameters.Add("@ClientContactName", SqlDbType.VarChar).Value = position.ClientContactName;
+        command.Parameters.Add("@ClientContactPhone", SqlDbType.VarChar).Value = position.ClientContactPhone;
+        command.Parameters.Add("@ClientContactEmail", SqlDbType.VarChar).Value = position.ClientContactEmail;
+        if (includeClient)
+        {
+            command.Parameters.Add("@IdClient", SqlDbType.Int).Value = (object?)position.IdClient ?? DBNull.Value;
+        }
+    }
+
+    private static void AddLike(List<string> where, List<SqlParameter> parameters, string column, string? value, string? parameterName = null)
+    {
+        if (string.IsNullOrWhiteSpace(value))
+        {
+            return;
+        }
+
+        parameterName ??= "@" + column.Replace(".", string.Empty);
+        where.Add($"{column} LIKE {parameterName}");
+        parameters.Add(new SqlParameter(parameterName, SqlDbType.VarChar) { Value = "%" + value.Trim() + "%" });
+    }
+
+    private static Client ReadClient(SqlDataReader reader) => new()
+    {
+        Id = reader.GetInt32(0),
+        Name = GetString(reader, 1),
+        Phone = GetString(reader, 2),
+        Email = GetString(reader, 3),
+        ContactName = GetString(reader, 4),
+        Website = GetString(reader, 5)
+    };
+
+    private static Position ReadPosition(SqlDataReader reader, bool includeClientName)
+    {
+        var position = new Position
+        {
+            Id = reader.GetInt32(0),
+            Name = GetString(reader, 1),
+            Description = GetString(reader, 2),
+            StartDate = reader.IsDBNull(3) ? null : reader.GetDateTime(3),
+            Deadline = reader.IsDBNull(4) ? null : reader.GetDateTime(4),
+            Hired = !reader.IsDBNull(5) && reader.GetBoolean(5),
+            IdClient = reader.IsDBNull(6) ? null : reader.GetInt32(6),
+            ClientContactName = GetString(reader, 7),
+            ClientContactPhone = GetString(reader, 8),
+            ClientContactEmail = GetString(reader, 9)
+        };
+
+        if (includeClientName)
+        {
+            position.ClientName = GetString(reader, 10);
+        }
+
+        return position;
+    }
+
+    private static string GetString(SqlDataReader reader, int ordinal) =>
+        reader.IsDBNull(ordinal) ? string.Empty : reader.GetString(ordinal);
+}
diff --git a/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..468316298ba01ef622db9ffeeb20a3df775fc996
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
@@ -0,0 +1,15 @@
+using IRM.SPA.Models;
+
+namespace IRM.SPA.Services;
+
+public interface IHiringRepository
+{
+    Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default);
+    Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default);
+    Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default);
+    Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default);
+}
diff --git a/LegacyOutput/src/IRM.SPA/wwwroot/app.css b/LegacyOutput/src/IRM.SPA/wwwroot/app.css
index 7ac30e2a8df7ef2e3f233e331d1d58ca449099d8..c4e3f519ac693dd5c0ee569dc7dae70aa51945dc
--- a/LegacyOutput/src/IRM.SPA/wwwroot/app.css
+++ b/LegacyOutput/src/IRM.SPA/wwwroot/app.css
@@ -1,51 +1,247 @@
-html, body {
-    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
-}
-
-a, .btn-link {
-    color: #006bb7;
-}
-
-.btn-primary {
-    color: #fff;
-    background-color: #1b6ec2;
-    border-color: #1861ac;
-}
-
-.btn:focus, .btn:active:focus, .btn-link.nav-link:focus, .form-control:focus, .form-check-input:focus {
-  box-shadow: 0 0 0 0.1rem white, 0 0 0 0.25rem #258cfb;
-}
-
-.content {
-    padding-top: 1.1rem;
-}
-
-h1:focus {
-    outline: none;
-}
-
-.valid.modified:not([type=checkbox]) {
-    outline: 1px solid #26b050;
-}
-
-.invalid {
-    outline: 1px solid #e50000;
-}
-
-.validation-message {
-    color: #e50000;
-}
-
-.blazor-error-boundary {
-    background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNDkiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIG92ZXJmbG93PSJoaWRkZW4iPjxkZWZzPjxjbGlwUGF0aCBpZD0iY2xpcDAiPjxyZWN0IHg9IjIzNSIgeT0iNTEiIHdpZHRoPSI1NiIgaGVpZ2h0PSI0OSIvPjwvY2xpcFBhdGg+PC9kZWZzPjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMCkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yMzUgLTUxKSI+PHBhdGggZD0iTTI2My41MDYgNTFDMjY0LjcxNyA1MSAyNjUuODEzIDUxLjQ4MzcgMjY2LjYwNiA1Mi4yNjU4TDI2Ny4wNTIgNTIuNzk4NyAyNjcuNTM5IDUzLjYyODMgMjkwLjE4NSA5Mi4xODMxIDI5MC41NDUgOTIuNzk1IDI5MC42NTYgOTIuOTk2QzI5MC44NzcgOTMuNTEzIDI5MSA5NC4wODE1IDI5MSA5NC42NzgyIDI5MSA5Ny4wNjUxIDI4OS4wMzggOTkgMjg2LjYxNyA5OUwyNDAuMzgzIDk5QzIzNy45NjMgOTkgMjM2IDk3LjA2NTEgMjM2IDk0LjY3ODIgMjM2IDk0LjM3OTkgMjM2LjAzMSA5NC4wODg2IDIzNi4wODkgOTMuODA3MkwyMzYuMzM4IDkzLjAxNjIgMjM2Ljg1OCA5Mi4xMzE0IDI1OS40NzMgNTMuNjI5NCAyNTkuOTYxIDUyLjc5ODUgMjYwLjQwNyA1Mi4yNjU4QzI2MS4yIDUxLjQ4MzcgMjYyLjI5NiA1MSAyNjMuNTA2IDUxWk0yNjMuNTg2IDY2LjAxODNDMjYwLjczNyA2Ni4wMTgzIDI1OS4zMTMgNjcuMTI0NSAyNTkuMzEzIDY5LjMzNyAyNTkuMzEzIDY5LjYxMDIgMjU5LjMzMiA2OS44NjA4IDI1OS4zNzEgNzAuMDg4N0wyNjEuNzk1IDg0LjAxNjEgMjY1LjM4IDg0LjAxNjEgMjY3LjgyMSA2OS43NDc1QzI2Ny44NiA2OS43MzA5IDI2Ny44NzkgNjkuNTg3NyAyNjcuODc5IDY5LjMxNzkgMjY3Ljg3OSA2Ny4xMTgyIDI2Ni40NDggNjYuMDE4MyAyNjMuNTg2IDY2LjAxODNaTTI2My41NzYgODYuMDU0N0MyNjEuMDQ5IDg2LjA1NDcgMjU5Ljc4NiA4Ny4zMDA1IDI1OS43ODYgODkuNzkyMSAyNTkuNzg2IDkyLjI4MzcgMjYxLjA0OSA5My41Mjk1IDI2My41NzYgOTMuNTI5NSAyNjYuMTE2IDkzLjUyOTUgMjY3LjM4NyA5Mi4yODM3IDI2Ny4zODcgODkuNzkyMSAyNjcuMzg3IDg3LjMwMDUgMjY2LjExNiA4Ni4wNTQ3IDI2My41NzYgODYuMDU0N1oiIGZpbGw9IiNGRkU1MDAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48L3N2Zz4=) no-repeat 1rem/1.8rem, #b32121;
-    padding: 1rem 1rem 1rem 3.7rem;
-    color: white;
-}
-
-    .blazor-error-boundary::after {
-        content: "An error has occurred."
-    }
-
-.darker-border-checkbox.form-check-input {
-    border-color: #929292;
-}
+html,
+body {
+    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
+}
+
+body {
+    padding-top: 50px;
+    padding-bottom: 20px;
+}
+
+.body-content {
+    padding-left: 15px;
+    padding-right: 15px;
+}
+
+.dl-horizontal dt {
+    white-space: normal;
+}
+
+input[type="text"],
+input[type="password"],
+input[type="email"],
+input[type="tel"],
+input[type="select"] {
+    max-width: 280px;
+}
+
+.jumbotron {
+    padding: 30px;
+    margin-bottom: 30px;
+    color: inherit;
+    background-color: #eee;
+    border-radius: 6px;
+}
+
+.jumbotron h1 {
+    font-size: 63px;
+}
+
+.lead {
+    margin-bottom: 20px;
+    font-size: 21px;
+    font-weight: 300;
+    line-height: 1.4;
+}
+
+.navbar-inverse {
+    background-color: #222;
+    border-color: #080808;
+}
+
+.navbar-fixed-top {
+    position: fixed;
+    right: 0;
+    left: 0;
+    z-index: 1030;
+    top: 0;
+    border-width: 0 0 1px;
+}
+
+.navbar {
+    min-height: 50px;
+    margin-bottom: 20px;
+    border: 1px solid transparent;
+}
+
+.navbar-header {
+    float: left;
+}
+
+.navbar-brand {
+    float: left;
+    height: 50px;
+    padding: 15px;
+    font-size: 18px;
+    line-height: 20px;
+}
+
+.navbar-inverse .navbar-brand,
+.navbar-inverse .navbar-nav > li > a {
+    color: #9d9d9d;
+}
+
+.navbar-inverse .navbar-brand:hover,
+.navbar-inverse .navbar-nav > li > a:hover,
+.navbar-inverse .navbar-nav > li > a.active {
+    color: #fff;
+    text-decoration: none;
+}
+
+.navbar-nav {
+    float: left;
+    margin: 0;
+}
+
+.nav > li {
+    position: relative;
+    display: block;
+}
+
+.navbar-nav > li {
+    float: left;
+}
+
+.nav > li > a {
+    position: relative;
+    display: block;
+    padding: 10px 15px;
+}
+
+.navbar-nav > li > a {
+    padding-top: 15px;
+    padding-bottom: 15px;
+    line-height: 20px;
+}
+
+.btn-default {
+    color: #333;
+    background-color: #fff;
+    border-color: #ccc;
+}
+
+.btn {
+    display: inline-block;
+    padding: 6px 12px;
+    margin-bottom: 0;
+    font-size: 14px;
+    font-weight: 400;
+    line-height: 1.42857143;
+    text-align: center;
+    white-space: nowrap;
+    vertical-align: middle;
+    cursor: pointer;
+    border: 1px solid transparent;
+    border-radius: 4px;
+}
+
+.formLabel {
+    display: inline-block;
+    width: 200px;
+}
+
+.legacy-table {
+    margin-top: 20px;
+    margin-bottom: 10px;
+    border-collapse: separate;
+    border-spacing: 2px;
+}
+
+.legacy-table th,
+.legacy-table td {
+    padding: 1px;
+    font-weight: normal;
+    text-align: left;
+    vertical-align: top;
+}
+
+.legacy-table th {
+    font-weight: bold;
+}
+
+.legacy-table input[type="text"] {
+    width: 130px;
+}
+
+.description-input {
+    width: 500px;
+    max-width: 100%;
+    vertical-align: top;
+}
+
+.link-button {
+    padding: 0;
+    color: #337ab7;
+    background: none;
+    border: 0;
+    cursor: pointer;
+    font: inherit;
+}
+
+.link-button:hover {
+    color: #23527c;
+    text-decoration: underline;
+}
+
+.alert {
+    padding: 15px;
+    margin-top: 20px;
+    margin-bottom: 20px;
+    border: 1px solid transparent;
+    border-radius: 4px;
+}
+
+.alert-danger {
+    color: #a94442;
+    background-color: #f2dede;
+    border-color: #ebccd1;
+}
+
+@media screen and (min-width: 768px) {
+    .jumbotron {
+        margin-top: 20px;
+    }
+
+    .body-content {
+        padding: 0;
+    }
+}
+
+@media screen and (max-width: 767px) {
+    .navbar-header,
+    .navbar-nav,
+    .navbar-nav > li {
+        float: none;
+    }
+
+    .navbar-fixed-top {
+        position: static;
+    }
+
+    body {
+        padding-top: 0;
+    }
+
+    .jumbotron h1 {
+        font-size: 42px;
+    }
+}
+
+#blazor-error-ui {
+    background: lightyellow;
+    bottom: 0;
+    box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.2);
+    display: none;
+    left: 0;
+    padding: 0.6rem 1.25rem 0.7rem 1.25rem;
+    position: fixed;
+    width: 100%;
+    z-index: 1000;
+}
+
+#blazor-error-ui .dismiss {
+    cursor: pointer;
+    position: absolute;
+    right: 0.75rem;
+    top: 0.5rem;
+}

diff --git a/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor b/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
index 62e62873d628af7e91de98824e1143460b2db2a0..a9714ae63155375bce0d34f8e2a2cda4c6cfbeeb
--- a/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
@@ -1,23 +1,30 @@
-﻿@inherits LayoutComponentBase
-
-<div class="page">
-    <div class="sidebar">
-        <NavMenu />
-    </div>
-
-    <main>
-        <div class="top-row px-4">
-            <a href="https://learn.microsoft.com/aspnet/core/" target="_blank">About</a>
-        </div>
-
-        <article class="content px-4">
-            @Body
-        </article>
-    </main>
-</div>
-
-<div id="blazor-error-ui">
-    An unhandled error has occurred.
-    <a href="" class="reload">Reload</a>
-    <a class="dismiss">🗙</a>
-</div>
+@inherits LayoutComponentBase
+
+<div class="navbar navbar-inverse navbar-fixed-top">
+    <div class="container">
+        <div class="navbar-header">
+            <a class="navbar-brand" href="/">Hiring Tracker</a>
+        </div>
+        <div class="navbar-collapse collapse">
+            <ul class="nav navbar-nav">
+                <li><NavLink href="/" Match="NavLinkMatch.All">Home</NavLink></li>
+                <li><NavLink href="clients">Clients</NavLink></li>
+                <li><NavLink href="positions">Positions</NavLink></li>
+            </ul>
+        </div>
+    </div>
+</div>
+
+<div class="container body-content">
+    @Body
+    <hr />
+    <footer>
+        <p>&copy; @DateTime.Now.Year - Hiring Tracker</p>
+    </footer>
+</div>
+
+<div id="blazor-error-ui">
+    An unhandled error has occurred.
+    <a href="" class="reload">Reload</a>
+    <a class="dismiss">x</a>
+</div>
diff --git a/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor b/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
index 259e68b4bc97ef9ecc0b3899dc192d7790fd9b4c..c765fe7b74acb5c30b228509af2a8a6e6e1bf3c6
--- a/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
@@ -1,30 +1 @@
-﻿<div class="top-row ps-3 navbar navbar-dark">
-    <div class="container-fluid">
-        <a class="navbar-brand" href="">IRM.SPA</a>
-    </div>
-</div>
-
-<input type="checkbox" title="Navigation menu" class="navbar-toggler" />
-
-<div class="nav-scrollable" onclick="document.querySelector('.navbar-toggler').click()">
-    <nav class="flex-column">
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="" Match="NavLinkMatch.All">
-                <span class="bi bi-house-door-fill-nav-menu" aria-hidden="true"></span> Home
-            </NavLink>
-        </div>
-
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="counter">
-                <span class="bi bi-plus-square-fill-nav-menu" aria-hidden="true"></span> Counter
-            </NavLink>
-        </div>
-
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="weather">
-                <span class="bi bi-list-nested-nav-menu" aria-hidden="true"></span> Weather
-            </NavLink>
-        </div>
-    </nav>
-</div>
-
+@* Navigation is defined in MainLayout to match the legacy Site.Master markup. *@
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor
new file mode 100644
index 0000000000000000000000000000000000000000..1232eae426ef2325a0505f006805d6a05ba6115e
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor
@@ -0,0 +1,104 @@
+@page "/clients/new"
+@page "/clients/{Id:int}"
+@page "/ClientDetails"
+@page "/ClientDetails.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+@inject IJSRuntime JS
+
+<PageTitle>Client Details - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="SaveAsync" @onsubmit:preventDefault>
+    <span class="formLabel">Id:</span>
+    <span>@(client.Id == 0 ? string.Empty : client.Id)</span>
+    <br />
+    <span class="formLabel">Name:</span>
+    <input type="text" @bind="client.Name" />
+    <br />
+    <span class="formLabel">Phone:</span>
+    <input type="text" @bind="client.Phone" />
+    <br />
+    <span class="formLabel">Email:</span>
+    <input type="text" @bind="client.Email" />
+    <br />
+    <span class="formLabel">Contact Name:</span>
+    <input type="text" @bind="client.ContactName" />
+    <br />
+    <span class="formLabel">Website:</span>
+    <input type="text" @bind="client.Website" />
+    <br />
+    @if (isEdit)
+    {
+        <button class="link-button" type="submit">Update</button>
+    }
+    else
+    {
+        <button class="link-button" type="submit">Insert</button>
+    }
+</form>
+
+@code {
+    [Parameter] public int? Id { get; set; }
+
+    private Client client = new();
+    private bool isEdit;
+    private string? errorMessage;
+
+    protected override async Task OnParametersSetAsync()
+    {
+        errorMessage = null;
+        isEdit = false;
+        client = new Client();
+
+        if (Id is not { } id)
+        {
+            return;
+        }
+
+        try
+        {
+            var existing = await Repository.GetClientAsync(id);
+            if (existing is not null)
+            {
+                client = existing;
+                isEdit = true;
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load client. " + ex.Message;
+        }
+    }
+
+    private async Task SaveAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            if (isEdit)
+            {
+                if (await Repository.UpdateClientAsync(client))
+                {
+                    await JS.InvokeVoidAsync("alert", "Client updated successfully");
+                }
+            }
+            else
+            {
+                client.Id = await Repository.InsertClientAsync(client);
+                isEdit = true;
+                await JS.InvokeVoidAsync("alert", "Client added successfully");
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to save client. " + ex.Message;
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor
new file mode 100644
index 0000000000000000000000000000000000000000..774521377b61d400b5e79c84a3304d20b83878b3
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor
@@ -0,0 +1,85 @@
+@page "/clients"
+@page "/ClientsList"
+@page "/ClientsList.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+
+<PageTitle>Clients - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="ApplyFilter" @onsubmit:preventDefault>
+    <table class="legacy-table">
+        <thead>
+            <tr>
+                <th>Id</th>
+                <th>Client Name</th>
+                <th>Phone</th>
+                <th>Email</th>
+                <th>Website</th>
+                <th>Contact Name</th>
+                <th></th>
+            </tr>
+            <tr>
+                <th><input type="text" @bind="filter.Id" /></th>
+                <th><input type="text" @bind="filter.Name" /></th>
+                <th><input type="text" @bind="filter.Phone" /></th>
+                <th><input type="text" @bind="filter.Email" /></th>
+                <th><input type="text" @bind="filter.Website" /></th>
+                <th><input type="text" @bind="filter.ContactName" /></th>
+                <th><button type="submit">Filter</button></th>
+            </tr>
+        </thead>
+        <tbody>
+            @foreach (var client in clients)
+            {
+                <tr>
+                    <td>@client.Id</td>
+                    <td>@client.Name</td>
+                    <td>@client.Phone</td>
+                    <td>@client.Email</td>
+                    <td>@client.Website</td>
+                    <td>@client.ContactName</td>
+                    <td><a href="clients/@client.Id">Details</a></td>
+                </tr>
+            }
+        </tbody>
+    </table>
+</form>
+
+<a href="clients/new">Add new client</a>
+
+@code {
+    private readonly ClientFilter filter = new();
+    private IReadOnlyList<Client> clients = [];
+    private string? errorMessage;
+
+    protected override async Task OnInitializedAsync()
+    {
+        await LoadClientsAsync();
+    }
+
+    private async Task ApplyFilter()
+    {
+        await LoadClientsAsync();
+    }
+
+    private async Task LoadClientsAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            clients = await Repository.GetClientsAsync(filter);
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load clients. " + ex.Message;
+            clients = [];
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/Counter.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/Counter.razor
deleted file mode 100644
index ba08d049a6a0d5fb9d3c521c37ab574965d2580a..0000000000000000000000000000000000000000
--- a/LegacyOutput/src/IRM.SPA/Components/Pages/Counter.razor
+++ /dev/null
@@ -1,19 +0,0 @@
-﻿@page "/counter"
-@rendermode InteractiveServer
-
-<PageTitle>Counter</PageTitle>
-
-<h1>Counter</h1>
-
-<p role="status">Current count: @currentCount</p>
-
-<button class="btn btn-primary" @onclick="IncrementCount">Click me</button>
-
-@code {
-    private int currentCount = 0;
-
-    private void IncrementCount()
-    {
-        currentCount++;
-    }
-}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
index df0502354fdfbbef85e1673ffcff56d85d2481bf..e4fbd72369d329a04d4cead6939579592e284c3d
--- a/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
@@ -1,7 +1,26 @@
-﻿@page "/"
-
-<PageTitle>Home</PageTitle>
-
-<h1>Hello, world!</h1>
-
-Welcome to your new app.
+@page "/"
+@page "/Default.aspx"
+
+<PageTitle>Home Page - Hiring Tracker</PageTitle>
+
+<div class="jumbotron">
+    <h1>Hiring Tracking</h1>
+    <p class="lead">Track positions and candidates.</p>
+</div>
+
+<div class="row">
+    <div class="col-md-4">
+        <h2>Positions</h2>
+        <p>View open positions or query previous hires.</p>
+        <p>
+            <a class="btn btn-default" href="positions">View</a>
+        </p>
+    </div>
+    <div class="col-md-4">
+        <h2>Clients</h2>
+        <p>Manage contacts requesting the positions.</p>
+        <p>
+            <a class="btn btn-default" href="clients">View</a>
+        </p>
+    </div>
+</div>
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor
new file mode 100644
index 0000000000000000000000000000000000000000..51bb6ec59ec33db24c64c1bb595bdf18d2e087ec
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor
@@ -0,0 +1,139 @@
+@page "/positions/new"
+@page "/positions/{Id:int}"
+@page "/PositionDetails"
+@page "/PositionDetails.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+@inject IJSRuntime JS
+
+<PageTitle>Position Details - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="SaveAsync" @onsubmit:preventDefault>
+    <span class="formLabel">Id:</span>
+    <span>@(position.Id == 0 ? string.Empty : position.Id)</span>
+    <br />
+    <span class="formLabel">Name:</span>
+    <input type="text" @bind="position.Name" />
+    <br />
+    <span class="formLabel">Description:</span>
+    <textarea rows="6" class="description-input" @bind="position.Description"></textarea>
+    <br />
+    <span class="formLabel">Start Date:</span>
+    <input type="date" value="@startDateText" @onchange="e => startDateText = e.Value?.ToString() ?? string.Empty" />
+    <br />
+    <span class="formLabel">Deadline:</span>
+    <input type="date" value="@deadlineText" @onchange="e => deadlineText = e.Value?.ToString() ?? string.Empty" />
+    <br />
+    <span class="formLabel">Hired?:</span>
+    <input type="checkbox" @bind="position.Hired" />
+    <br />
+    <span class="formLabel">Client:</span>
+    <select @bind="position.IdClient">
+        @foreach (var client in clients)
+        {
+            <option value="@client.Id">@client.Name</option>
+        }
+    </select>
+    <br />
+    <span class="formLabel">Client Contact Name:</span>
+    <input type="text" @bind="position.ClientContactName" />
+    <br />
+    <span class="formLabel">Phone:</span>
+    <input type="text" @bind="position.ClientContactPhone" />
+    <br />
+    <span class="formLabel">Email:</span>
+    <input type="text" @bind="position.ClientContactEmail" />
+    <br />
+    @if (isEdit)
+    {
+        <button class="link-button" type="submit">Update</button>
+    }
+    else
+    {
+        <button class="link-button" type="submit">Insert</button>
+    }
+</form>
+
+@code {
+    [Parameter] public int? Id { get; set; }
+
+    private Position position = new();
+    private IReadOnlyList<Client> clients = [];
+    private bool isEdit;
+    private string? errorMessage;
+    private string startDateText = string.Empty;
+    private string deadlineText = string.Empty;
+
+    protected override async Task OnParametersSetAsync()
+    {
+        errorMessage = null;
+        isEdit = false;
+        position = new Position();
+        startDateText = string.Empty;
+        deadlineText = string.Empty;
+
+        try
+        {
+            clients = await Repository.GetClientsAsync(new ClientFilter());
+            position.IdClient = clients.FirstOrDefault()?.Id;
+
+            if (Id is not { } id)
+            {
+                return;
+            }
+
+            var existing = await Repository.GetPositionAsync(id);
+            if (existing is not null)
+            {
+                position = existing;
+                startDateText = ToDateInputValue(position.StartDate);
+                deadlineText = ToDateInputValue(position.Deadline);
+                isEdit = true;
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load position. " + ex.Message;
+        }
+    }
+
+    private async Task SaveAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            position.StartDate = ParseDate(startDateText);
+            position.Deadline = ParseDate(deadlineText);
+
+            if (isEdit)
+            {
+                if (await Repository.UpdatePositionAsync(position))
+                {
+                    await JS.InvokeVoidAsync("alert", "Position updated successfully");
+                }
+            }
+            else
+            {
+                position.Id = await Repository.InsertPositionAsync(position);
+                isEdit = true;
+                await JS.InvokeVoidAsync("alert", "Position added successfully");
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to save position. " + ex.Message;
+        }
+    }
+
+    private static string ToDateInputValue(DateTime? value) => value?.ToString("yyyy-MM-dd") ?? string.Empty;
+
+    private static DateTime? ParseDate(string value) =>
+        DateTime.TryParse(value, out var parsed) ? parsed.Date : null;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor
new file mode 100644
index 0000000000000000000000000000000000000000..efdcec61db320f36ea4b1bad176e604944be65e2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor
@@ -0,0 +1,88 @@
+@page "/positions"
+@page "/PositionsList"
+@page "/PositionsList.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+
+<PageTitle>Positions - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="ApplyFilter" @onsubmit:preventDefault>
+    <table class="legacy-table">
+        <thead>
+            <tr>
+                <th>Id</th>
+                <th>Name</th>
+                <th>Description</th>
+                <th>Start Date</th>
+                <th>Deadline</th>
+                <th>Position Closed</th>
+                <th>Client Contact</th>
+                <th></th>
+            </tr>
+            <tr>
+                <th><input type="text" @bind="filter.Id" /></th>
+                <th><input type="text" @bind="filter.Name" /></th>
+                <th><input type="text" @bind="filter.Description" /></th>
+                <th><input type="text" @bind="filter.StartDate" /></th>
+                <th><input type="text" @bind="filter.Deadline" /></th>
+                <th></th>
+                <th><input type="text" @bind="filter.ClientContact" /></th>
+                <th><button type="submit">Filter</button></th>
+            </tr>
+        </thead>
+        <tbody>
+            @foreach (var position in positions)
+            {
+                <tr>
+                    <td>@position.Id</td>
+                    <td>@position.Name</td>
+                    <td>@position.Description</td>
+                    <td>@position.StartDate</td>
+                    <td>@position.Deadline</td>
+                    <td>@position.Hired</td>
+                    <td>@position.ClientName (@position.ClientContactName)</td>
+                    <td><a href="positions/@position.Id">Details</a></td>
+                </tr>
+            }
+        </tbody>
+    </table>
+</form>
+
+<a href="positions/new">Add new position</a>
+
+@code {
+    private readonly PositionFilter filter = new();
+    private IReadOnlyList<Position> positions = [];
+    private string? errorMessage;
+
+    protected override async Task OnInitializedAsync()
+    {
+        await LoadPositionsAsync();
+    }
+
+    private async Task ApplyFilter()
+    {
+        await LoadPositionsAsync();
+    }
+
+    private async Task LoadPositionsAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            positions = await Repository.GetPositionsAsync(filter);
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load positions. " + ex.Message;
+            positions = [];
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/Weather.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/Weather.razor
deleted file mode 100644
index 33631ab7afce233f173a24f29b551f45e506ce4a..0000000000000000000000000000000000000000
--- a/LegacyOutput/src/IRM.SPA/Components/Pages/Weather.razor
+++ /dev/null
@@ -1,64 +0,0 @@
-﻿@page "/weather"
-@attribute [StreamRendering]
-
-<PageTitle>Weather</PageTitle>
-
-<h1>Weather</h1>
-
-<p>This component demonstrates showing data.</p>
-
-@if (forecasts == null)
-{
-    <p><em>Loading...</em></p>
-}
-else
-{
-    <table class="table">
-        <thead>
-            <tr>
-                <th>Date</th>
-                <th>Temp. (C)</th>
-                <th>Temp. (F)</th>
-                <th>Summary</th>
-            </tr>
-        </thead>
-        <tbody>
-            @foreach (var forecast in forecasts)
-            {
-                <tr>
-                    <td>@forecast.Date.ToShortDateString()</td>
-                    <td>@forecast.TemperatureC</td>
-                    <td>@forecast.TemperatureF</td>
-                    <td>@forecast.Summary</td>
-                </tr>
-            }
-        </tbody>
-    </table>
-}
-
-@code {
-    private WeatherForecast[]? forecasts;
-
-    protected override async Task OnInitializedAsync()
-    {
-        // Simulate asynchronous loading to demonstrate streaming rendering
-        await Task.Delay(500);
-
-        var startDate = DateOnly.FromDateTime(DateTime.Now);
-        var summaries = new[] { "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching" };
-        forecasts = Enumerable.Range(1, 5).Select(index => new WeatherForecast
-        {
-            Date = startDate.AddDays(index),
-            TemperatureC = Random.Shared.Next(-20, 55),
-            Summary = summaries[Random.Shared.Next(summaries.Length)]
-        }).ToArray();
-    }
-
-    private class WeatherForecast
-    {
-        public DateOnly Date { get; set; }
-        public int TemperatureC { get; set; }
-        public string? Summary { get; set; }
-        public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
-    }
-}
diff --git a/LegacyOutput/src/IRM.SPA/Components/_Imports.razor b/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
index de2621323fafca41583fecc7d1b4b181a1e49ac1..4ca0297300bf206b5f4f4e3af4a8adffd1865970
--- a/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
@@ -5,6 +5,8 @@
 @using Microsoft.AspNetCore.Components.Web
 @using static Microsoft.AspNetCore.Components.Web.RenderMode
 @using Microsoft.AspNetCore.Components.Web.Virtualization
-@using Microsoft.JSInterop
-@using IRM.SPA
-@using IRM.SPA.Components
+@using Microsoft.JSInterop
+@using IRM.SPA
+@using IRM.SPA.Components
+@using IRM.SPA.Models
+@using IRM.SPA.Services
diff --git a/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs b/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
index 8a7b20c19addfd182712b09a487081eda45d085a..a1e19750167d74ae38221cb933beb102768676d5
--- a/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
+++ b/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
@@ -13,13 +13,14 @@
 {
     public static class DependancyInjector
     {
-        public static void RegisterServices(IServiceCollection services, ConfigurationOptions config)
-        {
-           
-
-            RegisterApiClients(services, config);           
-            RegisterModelValidators(services);
-        }
+        public static void RegisterServices(IServiceCollection services, ConfigurationOptions config)
+        {
+           
+
+            services.AddScoped<IHiringRepository, HiringRepository>();
+            RegisterApiClients(services, config);           
+            RegisterModelValidators(services);
+        }
        
         private static void RegisterModelValidators(IServiceCollection services)
         {
diff --git a/LegacyOutput/src/IRM.SPA/Models/Client.cs b/LegacyOutput/src/IRM.SPA/Models/Client.cs
new file mode 100644
index 0000000000000000000000000000000000000000..46bfecbc332bde56ebed47d21516d9a9c7773d42
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Client.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class Client
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Phone { get; set; } = string.Empty;
+    public string Email { get; set; } = string.Empty;
+    public string ContactName { get; set; } = string.Empty;
+    public string Website { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..d59d0bb30c1802c64fa28e40d6a449e156739081
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class ClientFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Phone { get; set; }
+    public string? Email { get; set; }
+    public string? Website { get; set; }
+    public string? ContactName { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/Position.cs b/LegacyOutput/src/IRM.SPA/Models/Position.cs
new file mode 100644
index 0000000000000000000000000000000000000000..a6f9543eebd29c5626ed28741e6b4065ad3d16cf
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Position.cs
@@ -0,0 +1,16 @@
+namespace IRM.SPA.Models;
+
+public sealed class Position
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Description { get; set; } = string.Empty;
+    public DateTime? StartDate { get; set; }
+    public DateTime? Deadline { get; set; }
+    public bool Hired { get; set; }
+    public int? IdClient { get; set; }
+    public string ClientName { get; set; } = string.Empty;
+    public string ClientContactName { get; set; } = string.Empty;
+    public string ClientContactPhone { get; set; } = string.Empty;
+    public string ClientContactEmail { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..cfa76e79d96580b7b4d98e9b476807ef6f12acb5
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class PositionFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Description { get; set; }
+    public string? StartDate { get; set; }
+    public string? Deadline { get; set; }
+    public string? ClientContact { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Program.cs b/LegacyOutput/src/IRM.SPA/Program.cs
index 00184fc283cd7060825796fd98e55be1c243edd6..2008eaa884f07089ce5823fe41c6a6336a34f709
--- a/LegacyOutput/src/IRM.SPA/Program.cs
+++ b/LegacyOutput/src/IRM.SPA/Program.cs
@@ -10,8 +10,9 @@
     {
         public static void Main(string[] args)
         {
-            var builder = WebApplication.CreateBuilder(args);
-            ConfigurationOptions config = builder.Configuration.Get<ConfigurationOptions>() ?? new ConfigurationOptions();
+            var builder = WebApplication.CreateBuilder(args);
+            AppDomain.CurrentDomain.SetData("DataDirectory", Path.Combine(builder.Environment.ContentRootPath, "App_Data"));
+            ConfigurationOptions config = builder.Configuration.Get<ConfigurationOptions>() ?? new ConfigurationOptions();
             // Add services to the container.
             builder.Services.AddRazorComponents()
                 .AddInteractiveServerComponents();           
diff --git a/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..1c88253e59d707a339e900e3d8c1a8b2d56950d2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
@@ -0,0 +1,268 @@
+using System.Data;
+using IRM.SPA.Models;
+using Microsoft.Data.SqlClient;
+
+namespace IRM.SPA.Services;
+
+public sealed class HiringRepository(IConfiguration configuration) : IHiringRepository
+{
+    private readonly string _connectionString = configuration.GetConnectionString("HiringConnection")
+        ?? throw new InvalidOperationException("ConnectionStrings:HiringConnection is not configured.");
+
+    public async Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Name", filter.Name);
+        AddLike(where, parameters, "Phone", filter.Phone);
+        AddLike(where, parameters, "Email", filter.Email);
+        AddLike(where, parameters, "Website", filter.Website);
+        AddLike(where, parameters, "ContactName", filter.ContactName);
+
+        var sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients";
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var clients = new List<Client>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            clients.Add(ReadClient(reader));
+        }
+
+        return clients;
+    }
+
+    public async Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients WHERE Id = @Id";
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadClient(reader) : null;
+    }
+
+    public async Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Clients (Name, Phone, Email, ContactName, Website)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Phone, @Email, @ContactName, @Website)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Clients
+            SET Name = @Name, Phone = @Phone, Email = @Email, ContactName = @ContactName, Website = @Website
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = client.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    public async Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Positions.Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Positions.Name", filter.Name, "@Name");
+        AddLike(where, parameters, "Positions.Description", filter.Description, "@Description");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.StartDate, 120)", filter.StartDate, "@StartDate");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.Deadline, 120)", filter.Deadline, "@Deadline");
+        AddLike(where, parameters, "Positions.ClientContactName", filter.ClientContact, "@ClientContact");
+
+        var sql = """
+            SELECT Positions.Id, Positions.Name, Positions.Description, Positions.StartDate, Positions.Deadline,
+                   Positions.Hired, Positions.IdClient, Positions.ClientContactName, Positions.ClientContactPhone,
+                   Positions.ClientContactEmail, Clients.Name AS ClientName
+            FROM Positions
+            LEFT JOIN Clients ON Positions.IdClient = Clients.Id
+            """;
+
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Positions.Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var positions = new List<Position>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            positions.Add(ReadPosition(reader, includeClientName: true));
+        }
+
+        return positions;
+    }
+
+    public async Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            SELECT Id, Name, Description, StartDate, Deadline, Hired, IdClient,
+                   ClientContactName, ClientContactPhone, ClientContactEmail
+            FROM Positions
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadPosition(reader, includeClientName: false) : null;
+    }
+
+    public async Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Positions (Name, Description, StartDate, Deadline, Hired, ClientContactName,
+                                   ClientContactPhone, ClientContactEmail, IdClient)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Description, @StartDate, @Deadline, @Hired, @ClientContactName,
+                    @ClientContactPhone, @ClientContactEmail, @IdClient)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Positions
+            SET Name = @Name, Description = @Description, StartDate = @StartDate, Deadline = @Deadline,
+                Hired = @Hired, ClientContactName = @ClientContactName, ClientContactPhone = @ClientContactPhone,
+                ClientContactEmail = @ClientContactEmail, IdClient = @IdClient
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = position.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    private SqlConnection CreateConnection() => new(_connectionString);
+
+    private static void AddClientParameters(SqlCommand command, Client client)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = client.Name;
+        command.Parameters.Add("@Phone", SqlDbType.VarChar).Value = client.Phone;
+        command.Parameters.Add("@Email", SqlDbType.VarChar).Value = client.Email;
+        command.Parameters.Add("@ContactName", SqlDbType.VarChar).Value = client.ContactName;
+        command.Parameters.Add("@Website", SqlDbType.VarChar).Value = client.Website;
+    }
+
+    private static void AddPositionParameters(SqlCommand command, Position position, bool includeClient)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = position.Name;
+        command.Parameters.Add("@Description", SqlDbType.VarChar).Value = position.Description;
+        command.Parameters.Add("@StartDate", SqlDbType.Date).Value = (object?)position.StartDate ?? DBNull.Value;
+        command.Parameters.Add("@Deadline", SqlDbType.Date).Value = (object?)position.Deadline ?? DBNull.Value;
+        command.Parameters.Add("@Hired", SqlDbType.Bit).Value = position.Hired;
+        command.Parameters.Add("@ClientContactName", SqlDbType.VarChar).Value = position.ClientContactName;
+        command.Parameters.Add("@ClientContactPhone", SqlDbType.VarChar).Value = position.ClientContactPhone;
+        command.Parameters.Add("@ClientContactEmail", SqlDbType.VarChar).Value = position.ClientContactEmail;
+        if (includeClient)
+        {
+            command.Parameters.Add("@IdClient", SqlDbType.Int).Value = (object?)position.IdClient ?? DBNull.Value;
+        }
+    }
+
+    private static void AddLike(List<string> where, List<SqlParameter> parameters, string column, string? value, string? parameterName = null)
+    {
+        if (string.IsNullOrWhiteSpace(value))
+        {
+            return;
+        }
+
+        parameterName ??= "@" + column.Replace(".", string.Empty);
+        where.Add($"{column} LIKE {parameterName}");
+        parameters.Add(new SqlParameter(parameterName, SqlDbType.VarChar) { Value = "%" + value.Trim() + "%" });
+    }
+
+    private static Client ReadClient(SqlDataReader reader) => new()
+    {
+        Id = reader.GetInt32(0),
+        Name = GetString(reader, 1),
+        Phone = GetString(reader, 2),
+        Email = GetString(reader, 3),
+        ContactName = GetString(reader, 4),
+        Website = GetString(reader, 5)
+    };
+
+    private static Position ReadPosition(SqlDataReader reader, bool includeClientName)
+    {
+        var position = new Position
+        {
+            Id = reader.GetInt32(0),
+            Name = GetString(reader, 1),
+            Description = GetString(reader, 2),
+            StartDate = reader.IsDBNull(3) ? null : reader.GetDateTime(3),
+            Deadline = reader.IsDBNull(4) ? null : reader.GetDateTime(4),
+            Hired = !reader.IsDBNull(5) && reader.GetBoolean(5),
+            IdClient = reader.IsDBNull(6) ? null : reader.GetInt32(6),
+            ClientContactName = GetString(reader, 7),
+            ClientContactPhone = GetString(reader, 8),
+            ClientContactEmail = GetString(reader, 9)
+        };
+
+        if (includeClientName)
+        {
+            position.ClientName = GetString(reader, 10);
+        }
+
+        return position;
+    }
+
+    private static string GetString(SqlDataReader reader, int ordinal) =>
+        reader.IsDBNull(ordinal) ? string.Empty : reader.GetString(ordinal);
+}
diff --git a/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..468316298ba01ef622db9ffeeb20a3df775fc996
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
@@ -0,0 +1,15 @@
+using IRM.SPA.Models;
+
+namespace IRM.SPA.Services;
+
+public interface IHiringRepository
+{
+    Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default);
+    Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default);
+    Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default);
+    Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default);
+}
diff --git a/LegacyOutput/src/IRM.SPA/wwwroot/app.css b/LegacyOutput/src/IRM.SPA/wwwroot/app.css
index 7ac30e2a8df7ef2e3f233e331d1d58ca449099d8..c4e3f519ac693dd5c0ee569dc7dae70aa51945dc
--- a/LegacyOutput/src/IRM.SPA/wwwroot/app.css
+++ b/LegacyOutput/src/IRM.SPA/wwwroot/app.css
@@ -1,51 +1,247 @@
-html, body {
-    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
-}
-
-a, .btn-link {
-    color: #006bb7;
-}
-
-.btn-primary {
-    color: #fff;
-    background-color: #1b6ec2;
-    border-color: #1861ac;
-}
-
-.btn:focus, .btn:active:focus, .btn-link.nav-link:focus, .form-control:focus, .form-check-input:focus {
-  box-shadow: 0 0 0 0.1rem white, 0 0 0 0.25rem #258cfb;
-}
-
-.content {
-    padding-top: 1.1rem;
-}
-
-h1:focus {
-    outline: none;
-}
-
-.valid.modified:not([type=checkbox]) {
-    outline: 1px solid #26b050;
-}
-
-.invalid {
-    outline: 1px solid #e50000;
-}
-
-.validation-message {
-    color: #e50000;
-}
-
-.blazor-error-boundary {
-    background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNDkiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIG92ZXJmbG93PSJoaWRkZW4iPjxkZWZzPjxjbGlwUGF0aCBpZD0iY2xpcDAiPjxyZWN0IHg9IjIzNSIgeT0iNTEiIHdpZHRoPSI1NiIgaGVpZ2h0PSI0OSIvPjwvY2xpcFBhdGg+PC9kZWZzPjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMCkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yMzUgLTUxKSI+PHBhdGggZD0iTTI2My41MDYgNTFDMjY0LjcxNyA1MSAyNjUuODEzIDUxLjQ4MzcgMjY2LjYwNiA1Mi4yNjU4TDI2Ny4wNTIgNTIuNzk4NyAyNjcuNTM5IDUzLjYyODMgMjkwLjE4NSA5Mi4xODMxIDI5MC41NDUgOTIuNzk1IDI5MC42NTYgOTIuOTk2QzI5MC44NzcgOTMuNTEzIDI5MSA5NC4wODE1IDI5MSA5NC42NzgyIDI5MSA5Ny4wNjUxIDI4OS4wMzggOTkgMjg2LjYxNyA5OUwyNDAuMzgzIDk5QzIzNy45NjMgOTkgMjM2IDk3LjA2NTEgMjM2IDk0LjY3ODIgMjM2IDk0LjM3OTkgMjM2LjAzMSA5NC4wODg2IDIzNi4wODkgOTMuODA3MkwyMzYuMzM4IDkzLjAxNjIgMjM2Ljg1OCA5Mi4xMzE0IDI1OS40NzMgNTMuNjI5NCAyNTkuOTYxIDUyLjc5ODUgMjYwLjQwNyA1Mi4yNjU4QzI2MS4yIDUxLjQ4MzcgMjYyLjI5NiA1MSAyNjMuNTA2IDUxWk0yNjMuNTg2IDY2LjAxODNDMjYwLjczNyA2Ni4wMTgzIDI1OS4zMTMgNjcuMTI0NSAyNTkuMzEzIDY5LjMzNyAyNTkuMzEzIDY5LjYxMDIgMjU5LjMzMiA2OS44NjA4IDI1OS4zNzEgNzAuMDg4N0wyNjEuNzk1IDg0LjAxNjEgMjY1LjM4IDg0LjAxNjEgMjY3LjgyMSA2OS43NDc1QzI2Ny44NiA2OS43MzA5IDI2Ny44NzkgNjkuNTg3NyAyNjcuODc5IDY5LjMxNzkgMjY3Ljg3OSA2Ny4xMTgyIDI2Ni40NDggNjYuMDE4MyAyNjMuNTg2IDY2LjAxODNaTTI2My41NzYgODYuMDU0N0MyNjEuMDQ5IDg2LjA1NDcgMjU5Ljc4NiA4Ny4zMDA1IDI1OS43ODYgODkuNzkyMSAyNTkuNzg2IDkyLjI4MzcgMjYxLjA0OSA5My41Mjk1IDI2My41NzYgOTMuNTI5NSAyNjYuMTE2IDkzLjUyOTUgMjY3LjM4NyA5Mi4yODM3IDI2Ny4zODcgODkuNzkyMSAyNjcuMzg3IDg3LjMwMDUgMjY2LjExNiA4Ni4wNTQ3IDI2My41NzYgODYuMDU0N1oiIGZpbGw9IiNGRkU1MDAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48L3N2Zz4=) no-repeat 1rem/1.8rem, #b32121;
-    padding: 1rem 1rem 1rem 3.7rem;
-    color: white;
-}
-
-    .blazor-error-boundary::after {
-        content: "An error has occurred."
-    }
-
-.darker-border-checkbox.form-check-input {
-    border-color: #929292;
-}
+html,
+body {
+    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
+}
+
+body {
+    padding-top: 50px;
+    padding-bottom: 20px;
+}
+
+.body-content {
+    padding-left: 15px;
+    padding-right: 15px;
+}
+
+.dl-horizontal dt {
+    white-space: normal;
+}
+
+input[type="text"],
+input[type="password"],
+input[type="email"],
+input[type="tel"],
+input[type="select"] {
+    max-width: 280px;
+}
+
+.jumbotron {
+    padding: 30px;
+    margin-bottom: 30px;
+    color: inherit;
+    background-color: #eee;
+    border-radius: 6px;
+}
+
+.jumbotron h1 {
+    font-size: 63px;
+}
+
+.lead {
+    margin-bottom: 20px;
+    font-size: 21px;
+    font-weight: 300;
+    line-height: 1.4;
+}
+
+.navbar-inverse {
+    background-color: #222;
+    border-color: #080808;
+}
+
+.navbar-fixed-top {
+    position: fixed;
+    right: 0;
+    left: 0;
+    z-index: 1030;
+    top: 0;
+    border-width: 0 0 1px;
+}
+
+.navbar {
+    min-height: 50px;
+    margin-bottom: 20px;
+    border: 1px solid transparent;
+}
+
+.navbar-header {
+    float: left;
+}
+
+.navbar-brand {
+    float: left;
+    height: 50px;
+    padding: 15px;
+    font-size: 18px;
+    line-height: 20px;
+}
+
+.navbar-inverse .navbar-brand,
+.navbar-inverse .navbar-nav > li > a {
+    color: #9d9d9d;
+}
+
+.navbar-inverse .navbar-brand:hover,
+.navbar-inverse .navbar-nav > li > a:hover,
+.navbar-inverse .navbar-nav > li > a.active {
+    color: #fff;
+    text-decoration: none;
+}
+
+.navbar-nav {
+    float: left;
+    margin: 0;
+}
+
+.nav > li {
+    position: relative;
+    display: block;
+}
+
+.navbar-nav > li {
+    float: left;
+}
+
+.nav > li > a {
+    position: relative;
+    display: block;
+    padding: 10px 15px;
+}
+
+.navbar-nav > li > a {
+    padding-top: 15px;
+    padding-bottom: 15px;
+    line-height: 20px;
+}
+
+.btn-default {
+    color: #333;
+    background-color: #fff;
+    border-color: #ccc;
+}
+
+.btn {
+    display: inline-block;
+    padding: 6px 12px;
+    margin-bottom: 0;
+    font-size: 14px;
+    font-weight: 400;
+    line-height: 1.42857143;
+    text-align: center;
+    white-space: nowrap;
+    vertical-align: middle;
+    cursor: pointer;
+    border: 1px solid transparent;
+    border-radius: 4px;
+}
+
+.formLabel {
+    display: inline-block;
+    width: 200px;
+}
+
+.legacy-table {
+    margin-top: 20px;
+    margin-bottom: 10px;
+    border-collapse: separate;
+    border-spacing: 2px;
+}
+
+.legacy-table th,
+.legacy-table td {
+    padding: 1px;
+    font-weight: normal;
+    text-align: left;
+    vertical-align: top;
+}
+
+.legacy-table th {
+    font-weight: bold;
+}
+
+.legacy-table input[type="text"] {
+    width: 130px;
+}
+
+.description-input {
+    width: 500px;
+    max-width: 100%;
+    vertical-align: top;
+}
+
+.link-button {
+    padding: 0;
+    color: #337ab7;
+    background: none;
+    border: 0;
+    cursor: pointer;
+    font: inherit;
+}
+
+.link-button:hover {
+    color: #23527c;
+    text-decoration: underline;
+}
+
+.alert {
+    padding: 15px;
+    margin-top: 20px;
+    margin-bottom: 20px;
+    border: 1px solid transparent;
+    border-radius: 4px;
+}
+
+.alert-danger {
+    color: #a94442;
+    background-color: #f2dede;
+    border-color: #ebccd1;
+}
+
+@media screen and (min-width: 768px) {
+    .jumbotron {
+        margin-top: 20px;
+    }
+
+    .body-content {
+        padding: 0;
+    }
+}
+
+@media screen and (max-width: 767px) {
+    .navbar-header,
+    .navbar-nav,
+    .navbar-nav > li {
+        float: none;
+    }
+
+    .navbar-fixed-top {
+        position: static;
+    }
+
+    body {
+        padding-top: 0;
+    }
+
+    .jumbotron h1 {
+        font-size: 42px;
+    }
+}
+
+#blazor-error-ui {
+    background: lightyellow;
+    bottom: 0;
+    box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.2);
+    display: none;
+    left: 0;
+    padding: 0.6rem 1.25rem 0.7rem 1.25rem;
+    position: fixed;
+    width: 100%;
+    z-index: 1000;
+}
+
+#blazor-error-ui .dismiss {
+    cursor: pointer;
+    position: absolute;
+    right: 0.75rem;
+    top: 0.5rem;
+}

exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg "''^@page" Components'"\\Pages" in D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --stat -- src/IRM.SPA' in D:\Projects\AI\AiMigration\LegacyOutput
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'dotnet build IRM.SPA.csproj' in D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA
 succeeded in 455ms:
Components\Pages\ClientDetails.razor:@page "/clients/new"
Components\Pages\ClientDetails.razor:@page "/clients/{Id:int}"
Components\Pages\ClientDetails.razor:@page "/ClientDetails"
Components\Pages\ClientDetails.razor:@page "/ClientDetails.aspx"
Components\Pages\ClientsList.razor:@page "/clients"
Components\Pages\ClientsList.razor:@page "/ClientsList"
Components\Pages\ClientsList.razor:@page "/ClientsList.aspx"
Components\Pages\Error.razor:@page "/Error"
Components\Pages\PositionDetails.razor:@page "/positions/new"
Components\Pages\PositionDetails.razor:@page "/positions/{Id:int}"
Components\Pages\PositionDetails.razor:@page "/PositionDetails"
Components\Pages\PositionDetails.razor:@page "/PositionDetails.aspx"
Components\Pages\Home.razor:@page "/"
Components\Pages\Home.razor:@page "/Default.aspx"
Components\Pages\PositionsList.razor:@page "/positions"
Components\Pages\PositionsList.razor:@page "/PositionsList"
Components\Pages\PositionsList.razor:@page "/PositionsList.aspx"

 succeeded in 514ms:
 succeeded in 3200ms:
  Determining projects to restore...
  All projects are up-to-date for restore.
  IRM.SPA -> D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\bin\Debug\net8.0\IRM.SPA.dll

Build succeeded.
    0 Warning(s)
    0 Error(s)

Time Elapsed 00:00:02.30

diff --git a/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor b/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
index 62e62873d628af7e91de98824e1143460b2db2a0..a9714ae63155375bce0d34f8e2a2cda4c6cfbeeb
--- a/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
@@ -1,23 +1,30 @@
-﻿@inherits LayoutComponentBase
-
-<div class="page">
-    <div class="sidebar">
-        <NavMenu />
-    </div>
-
-    <main>
-        <div class="top-row px-4">
-            <a href="https://learn.microsoft.com/aspnet/core/" target="_blank">About</a>
-        </div>
-
-        <article class="content px-4">
-            @Body
-        </article>
-    </main>
-</div>
-
-<div id="blazor-error-ui">
-    An unhandled error has occurred.
-    <a href="" class="reload">Reload</a>
-    <a class="dismiss">🗙</a>
-</div>
+@inherits LayoutComponentBase
+
+<div class="navbar navbar-inverse navbar-fixed-top">
+    <div class="container">
+        <div class="navbar-header">
+            <a class="navbar-brand" href="/">Hiring Tracker</a>
+        </div>
+        <div class="navbar-collapse collapse">
+            <ul class="nav navbar-nav">
+                <li><NavLink href="/" Match="NavLinkMatch.All">Home</NavLink></li>
+                <li><NavLink href="clients">Clients</NavLink></li>
+                <li><NavLink href="positions">Positions</NavLink></li>
+            </ul>
+        </div>
+    </div>
+</div>
+
+<div class="container body-content">
+    @Body
+    <hr />
+    <footer>
+        <p>&copy; @DateTime.Now.Year - Hiring Tracker</p>
+    </footer>
+</div>
+
+<div id="blazor-error-ui">
+    An unhandled error has occurred.
+    <a href="" class="reload">Reload</a>
+    <a class="dismiss">x</a>
+</div>
diff --git a/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor b/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
index 259e68b4bc97ef9ecc0b3899dc192d7790fd9b4c..c765fe7b74acb5c30b228509af2a8a6e6e1bf3c6
--- a/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
@@ -1,30 +1 @@
-﻿<div class="top-row ps-3 navbar navbar-dark">
-    <div class="container-fluid">
-        <a class="navbar-brand" href="">IRM.SPA</a>
-    </div>
-</div>
-
-<input type="checkbox" title="Navigation menu" class="navbar-toggler" />
-
-<div class="nav-scrollable" onclick="document.querySelector('.navbar-toggler').click()">
-    <nav class="flex-column">
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="" Match="NavLinkMatch.All">
-                <span class="bi bi-house-door-fill-nav-menu" aria-hidden="true"></span> Home
-            </NavLink>
-        </div>
-
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="counter">
-                <span class="bi bi-plus-square-fill-nav-menu" aria-hidden="true"></span> Counter
-            </NavLink>
-        </div>
-
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="weather">
-                <span class="bi bi-list-nested-nav-menu" aria-hidden="true"></span> Weather
-            </NavLink>
-        </div>
-    </nav>
-</div>
-
+@* Navigation is defined in MainLayout to match the legacy Site.Master markup. *@
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor
new file mode 100644
index 0000000000000000000000000000000000000000..1232eae426ef2325a0505f006805d6a05ba6115e
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor
@@ -0,0 +1,104 @@
+@page "/clients/new"
+@page "/clients/{Id:int}"
+@page "/ClientDetails"
+@page "/ClientDetails.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+@inject IJSRuntime JS
+
+<PageTitle>Client Details - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="SaveAsync" @onsubmit:preventDefault>
+    <span class="formLabel">Id:</span>
+    <span>@(client.Id == 0 ? string.Empty : client.Id)</span>
+    <br />
+    <span class="formLabel">Name:</span>
+    <input type="text" @bind="client.Name" />
+    <br />
+    <span class="formLabel">Phone:</span>
+    <input type="text" @bind="client.Phone" />
+    <br />
+    <span class="formLabel">Email:</span>
+    <input type="text" @bind="client.Email" />
+    <br />
+    <span class="formLabel">Contact Name:</span>
+    <input type="text" @bind="client.ContactName" />
+    <br />
+    <span class="formLabel">Website:</span>
+    <input type="text" @bind="client.Website" />
+    <br />
+    @if (isEdit)
+    {
+        <button class="link-button" type="submit">Update</button>
+    }
+    else
+    {
+        <button class="link-button" type="submit">Insert</button>
+    }
+</form>
+
+@code {
+    [Parameter] public int? Id { get; set; }
+
+    private Client client = new();
+    private bool isEdit;
+    private string? errorMessage;
+
+    protected override async Task OnParametersSetAsync()
+    {
+        errorMessage = null;
+        isEdit = false;
+        client = new Client();
+
+        if (Id is not { } id)
+        {
+            return;
+        }
+
+        try
+        {
+            var existing = await Repository.GetClientAsync(id);
+            if (existing is not null)
+            {
+                client = existing;
+                isEdit = true;
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load client. " + ex.Message;
+        }
+    }
+
+    private async Task SaveAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            if (isEdit)
+            {
+                if (await Repository.UpdateClientAsync(client))
+                {
+                    await JS.InvokeVoidAsync("alert", "Client updated successfully");
+                }
+            }
+            else
+            {
+                client.Id = await Repository.InsertClientAsync(client);
+                isEdit = true;
+                await JS.InvokeVoidAsync("alert", "Client added successfully");
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to save client. " + ex.Message;
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor
new file mode 100644
index 0000000000000000000000000000000000000000..774521377b61d400b5e79c84a3304d20b83878b3
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor
@@ -0,0 +1,85 @@
+@page "/clients"
+@page "/ClientsList"
+@page "/ClientsList.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+
+<PageTitle>Clients - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="ApplyFilter" @onsubmit:preventDefault>
+    <table class="legacy-table">
+        <thead>
+            <tr>
+                <th>Id</th>
+                <th>Client Name</th>
+                <th>Phone</th>
+                <th>Email</th>
+                <th>Website</th>
+                <th>Contact Name</th>
+                <th></th>
+            </tr>
+            <tr>
+                <th><input type="text" @bind="filter.Id" /></th>
+                <th><input type="text" @bind="filter.Name" /></th>
+                <th><input type="text" @bind="filter.Phone" /></th>
+                <th><input type="text" @bind="filter.Email" /></th>
+                <th><input type="text" @bind="filter.Website" /></th>
+                <th><input type="text" @bind="filter.ContactName" /></th>
+                <th><button type="submit">Filter</button></th>
+            </tr>
+        </thead>
+        <tbody>
+            @foreach (var client in clients)
+            {
+                <tr>
+                    <td>@client.Id</td>
+                    <td>@client.Name</td>
+                    <td>@client.Phone</td>
+                    <td>@client.Email</td>
+                    <td>@client.Website</td>
+                    <td>@client.ContactName</td>
+                    <td><a href="clients/@client.Id">Details</a></td>
+                </tr>
+            }
+        </tbody>
+    </table>
+</form>
+
+<a href="clients/new">Add new client</a>
+
+@code {
+    private readonly ClientFilter filter = new();
+    private IReadOnlyList<Client> clients = [];
+    private string? errorMessage;
+
+    protected override async Task OnInitializedAsync()
+    {
+        await LoadClientsAsync();
+    }
+
+    private async Task ApplyFilter()
+    {
+        await LoadClientsAsync();
+    }
+
+    private async Task LoadClientsAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            clients = await Repository.GetClientsAsync(filter);
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load clients. " + ex.Message;
+            clients = [];
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/Counter.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/Counter.razor
deleted file mode 100644
index ba08d049a6a0d5fb9d3c521c37ab574965d2580a..0000000000000000000000000000000000000000
--- a/LegacyOutput/src/IRM.SPA/Components/Pages/Counter.razor
+++ /dev/null
@@ -1,19 +0,0 @@
-﻿@page "/counter"
-@rendermode InteractiveServer
-
-<PageTitle>Counter</PageTitle>
-
-<h1>Counter</h1>
-
-<p role="status">Current count: @currentCount</p>
-
-<button class="btn btn-primary" @onclick="IncrementCount">Click me</button>
-
-@code {
-    private int currentCount = 0;
-
-    private void IncrementCount()
-    {
-        currentCount++;
-    }
-}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
index df0502354fdfbbef85e1673ffcff56d85d2481bf..e4fbd72369d329a04d4cead6939579592e284c3d
--- a/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
@@ -1,7 +1,26 @@
-﻿@page "/"
-
-<PageTitle>Home</PageTitle>
-
-<h1>Hello, world!</h1>
-
-Welcome to your new app.
+@page "/"
+@page "/Default.aspx"
+
+<PageTitle>Home Page - Hiring Tracker</PageTitle>
+
+<div class="jumbotron">
+    <h1>Hiring Tracking</h1>
+    <p class="lead">Track positions and candidates.</p>
+</div>
+
+<div class="row">
+    <div class="col-md-4">
+        <h2>Positions</h2>
+        <p>View open positions or query previous hires.</p>
+        <p>
+            <a class="btn btn-default" href="positions">View</a>
+        </p>
+    </div>
+    <div class="col-md-4">
+        <h2>Clients</h2>
+        <p>Manage contacts requesting the positions.</p>
+        <p>
+            <a class="btn btn-default" href="clients">View</a>
+        </p>
+    </div>
+</div>
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor
new file mode 100644
index 0000000000000000000000000000000000000000..51bb6ec59ec33db24c64c1bb595bdf18d2e087ec
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor
@@ -0,0 +1,139 @@
+@page "/positions/new"
+@page "/positions/{Id:int}"
+@page "/PositionDetails"
+@page "/PositionDetails.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+@inject IJSRuntime JS
+
+<PageTitle>Position Details - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="SaveAsync" @onsubmit:preventDefault>
+    <span class="formLabel">Id:</span>
+    <span>@(position.Id == 0 ? string.Empty : position.Id)</span>
+    <br />
+    <span class="formLabel">Name:</span>
+    <input type="text" @bind="position.Name" />
+    <br />
+    <span class="formLabel">Description:</span>
+    <textarea rows="6" class="description-input" @bind="position.Description"></textarea>
+    <br />
+    <span class="formLabel">Start Date:</span>
+    <input type="date" value="@startDateText" @onchange="e => startDateText = e.Value?.ToString() ?? string.Empty" />
+    <br />
+    <span class="formLabel">Deadline:</span>
+    <input type="date" value="@deadlineText" @onchange="e => deadlineText = e.Value?.ToString() ?? string.Empty" />
+    <br />
+    <span class="formLabel">Hired?:</span>
+    <input type="checkbox" @bind="position.Hired" />
+    <br />
+    <span class="formLabel">Client:</span>
+    <select @bind="position.IdClient">
+        @foreach (var client in clients)
+        {
+            <option value="@client.Id">@client.Name</option>
+        }
+    </select>
+    <br />
+    <span class="formLabel">Client Contact Name:</span>
+    <input type="text" @bind="position.ClientContactName" />
+    <br />
+    <span class="formLabel">Phone:</span>
+    <input type="text" @bind="position.ClientContactPhone" />
+    <br />
+    <span class="formLabel">Email:</span>
+    <input type="text" @bind="position.ClientContactEmail" />
+    <br />
+    @if (isEdit)
+    {
+        <button class="link-button" type="submit">Update</button>
+    }
+    else
+    {
+        <button class="link-button" type="submit">Insert</button>
+    }
+</form>
+
+@code {
+    [Parameter] public int? Id { get; set; }
+
+    private Position position = new();
+    private IReadOnlyList<Client> clients = [];
+    private bool isEdit;
+    private string? errorMessage;
+    private string startDateText = string.Empty;
+    private string deadlineText = string.Empty;
+
+    protected override async Task OnParametersSetAsync()
+    {
+        errorMessage = null;
+        isEdit = false;
+        position = new Position();
+        startDateText = string.Empty;
+        deadlineText = string.Empty;
+
+        try
+        {
+            clients = await Repository.GetClientsAsync(new ClientFilter());
+            position.IdClient = clients.FirstOrDefault()?.Id;
+
+            if (Id is not { } id)
+            {
+                return;
+            }
+
+            var existing = await Repository.GetPositionAsync(id);
+            if (existing is not null)
+            {
+                position = existing;
+                startDateText = ToDateInputValue(position.StartDate);
+                deadlineText = ToDateInputValue(position.Deadline);
+                isEdit = true;
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load position. " + ex.Message;
+        }
+    }
+
+    private async Task SaveAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            position.StartDate = ParseDate(startDateText);
+            position.Deadline = ParseDate(deadlineText);
+
+            if (isEdit)
+            {
+                if (await Repository.UpdatePositionAsync(position))
+                {
+                    await JS.InvokeVoidAsync("alert", "Position updated successfully");
+                }
+            }
+            else
+            {
+                position.Id = await Repository.InsertPositionAsync(position);
+                isEdit = true;
+                await JS.InvokeVoidAsync("alert", "Position added successfully");
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to save position. " + ex.Message;
+        }
+    }
+
+    private static string ToDateInputValue(DateTime? value) => value?.ToString("yyyy-MM-dd") ?? string.Empty;
+
+    private static DateTime? ParseDate(string value) =>
+        DateTime.TryParse(value, out var parsed) ? parsed.Date : null;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor
new file mode 100644
index 0000000000000000000000000000000000000000..efdcec61db320f36ea4b1bad176e604944be65e2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor
@@ -0,0 +1,88 @@
+@page "/positions"
+@page "/PositionsList"
+@page "/PositionsList.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+
+<PageTitle>Positions - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="ApplyFilter" @onsubmit:preventDefault>
+    <table class="legacy-table">
+        <thead>
+            <tr>
+                <th>Id</th>
+                <th>Name</th>
+                <th>Description</th>
+                <th>Start Date</th>
+                <th>Deadline</th>
+                <th>Position Closed</th>
+                <th>Client Contact</th>
+                <th></th>
+            </tr>
+            <tr>
+                <th><input type="text" @bind="filter.Id" /></th>
+                <th><input type="text" @bind="filter.Name" /></th>
+                <th><input type="text" @bind="filter.Description" /></th>
+                <th><input type="text" @bind="filter.StartDate" /></th>
+                <th><input type="text" @bind="filter.Deadline" /></th>
+                <th></th>
+                <th><input type="text" @bind="filter.ClientContact" /></th>
+                <th><button type="submit">Filter</button></th>
+            </tr>
+        </thead>
+        <tbody>
+            @foreach (var position in positions)
+            {
+                <tr>
+                    <td>@position.Id</td>
+                    <td>@position.Name</td>
+                    <td>@position.Description</td>
+                    <td>@position.StartDate</td>
+                    <td>@position.Deadline</td>
+                    <td>@position.Hired</td>
+                    <td>@position.ClientName (@position.ClientContactName)</td>
+                    <td><a href="positions/@position.Id">Details</a></td>
+                </tr>
+            }
+        </tbody>
+    </table>
+</form>
+
+<a href="positions/new">Add new position</a>
+
+@code {
+    private readonly PositionFilter filter = new();
+    private IReadOnlyList<Position> positions = [];
+    private string? errorMessage;
+
+    protected override async Task OnInitializedAsync()
+    {
+        await LoadPositionsAsync();
+    }
+
+    private async Task ApplyFilter()
+    {
+        await LoadPositionsAsync();
+    }
+
+    private async Task LoadPositionsAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            positions = await Repository.GetPositionsAsync(filter);
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load positions. " + ex.Message;
+            positions = [];
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/Weather.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/Weather.razor
deleted file mode 100644
index 33631ab7afce233f173a24f29b551f45e506ce4a..0000000000000000000000000000000000000000
--- a/LegacyOutput/src/IRM.SPA/Components/Pages/Weather.razor
+++ /dev/null
@@ -1,64 +0,0 @@
-﻿@page "/weather"
-@attribute [StreamRendering]
-
-<PageTitle>Weather</PageTitle>
-
-<h1>Weather</h1>
-
-<p>This component demonstrates showing data.</p>
-
-@if (forecasts == null)
-{
-    <p><em>Loading...</em></p>
-}
-else
-{
-    <table class="table">
-        <thead>
-            <tr>
-                <th>Date</th>
-                <th>Temp. (C)</th>
-                <th>Temp. (F)</th>
-                <th>Summary</th>
-            </tr>
-        </thead>
-        <tbody>
-            @foreach (var forecast in forecasts)
-            {
-                <tr>
-                    <td>@forecast.Date.ToShortDateString()</td>
-                    <td>@forecast.TemperatureC</td>
-                    <td>@forecast.TemperatureF</td>
-                    <td>@forecast.Summary</td>
-                </tr>
-            }
-        </tbody>
-    </table>
-}
-
-@code {
-    private WeatherForecast[]? forecasts;
-
-    protected override async Task OnInitializedAsync()
-    {
-        // Simulate asynchronous loading to demonstrate streaming rendering
-        await Task.Delay(500);
-
-        var startDate = DateOnly.FromDateTime(DateTime.Now);
-        var summaries = new[] { "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching" };
-        forecasts = Enumerable.Range(1, 5).Select(index => new WeatherForecast
-        {
-            Date = startDate.AddDays(index),
-            TemperatureC = Random.Shared.Next(-20, 55),
-            Summary = summaries[Random.Shared.Next(summaries.Length)]
-        }).ToArray();
-    }
-
-    private class WeatherForecast
-    {
-        public DateOnly Date { get; set; }
-        public int TemperatureC { get; set; }
-        public string? Summary { get; set; }
-        public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
-    }
-}
diff --git a/LegacyOutput/src/IRM.SPA/Components/_Imports.razor b/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
index de2621323fafca41583fecc7d1b4b181a1e49ac1..4ca0297300bf206b5f4f4e3af4a8adffd1865970
--- a/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
@@ -5,6 +5,8 @@
 @using Microsoft.AspNetCore.Components.Web
 @using static Microsoft.AspNetCore.Components.Web.RenderMode
 @using Microsoft.AspNetCore.Components.Web.Virtualization
-@using Microsoft.JSInterop
-@using IRM.SPA
-@using IRM.SPA.Components
+@using Microsoft.JSInterop
+@using IRM.SPA
+@using IRM.SPA.Components
+@using IRM.SPA.Models
+@using IRM.SPA.Services
diff --git a/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs b/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
index 8a7b20c19addfd182712b09a487081eda45d085a..a1e19750167d74ae38221cb933beb102768676d5
--- a/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
+++ b/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
@@ -13,13 +13,14 @@
 {
     public static class DependancyInjector
     {
-        public static void RegisterServices(IServiceCollection services, ConfigurationOptions config)
-        {
-           
-
-            RegisterApiClients(services, config);           
-            RegisterModelValidators(services);
-        }
+        public static void RegisterServices(IServiceCollection services, ConfigurationOptions config)
+        {
+           
+
+            services.AddScoped<IHiringRepository, HiringRepository>();
+            RegisterApiClients(services, config);           
+            RegisterModelValidators(services);
+        }
        
         private static void RegisterModelValidators(IServiceCollection services)
         {
diff --git a/LegacyOutput/src/IRM.SPA/Models/Client.cs b/LegacyOutput/src/IRM.SPA/Models/Client.cs
new file mode 100644
index 0000000000000000000000000000000000000000..46bfecbc332bde56ebed47d21516d9a9c7773d42
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Client.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class Client
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Phone { get; set; } = string.Empty;
+    public string Email { get; set; } = string.Empty;
+    public string ContactName { get; set; } = string.Empty;
+    public string Website { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..d59d0bb30c1802c64fa28e40d6a449e156739081
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class ClientFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Phone { get; set; }
+    public string? Email { get; set; }
+    public string? Website { get; set; }
+    public string? ContactName { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/Position.cs b/LegacyOutput/src/IRM.SPA/Models/Position.cs
new file mode 100644
index 0000000000000000000000000000000000000000..a6f9543eebd29c5626ed28741e6b4065ad3d16cf
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Position.cs
@@ -0,0 +1,16 @@
+namespace IRM.SPA.Models;
+
+public sealed class Position
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Description { get; set; } = string.Empty;
+    public DateTime? StartDate { get; set; }
+    public DateTime? Deadline { get; set; }
+    public bool Hired { get; set; }
+    public int? IdClient { get; set; }
+    public string ClientName { get; set; } = string.Empty;
+    public string ClientContactName { get; set; } = string.Empty;
+    public string ClientContactPhone { get; set; } = string.Empty;
+    public string ClientContactEmail { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..cfa76e79d96580b7b4d98e9b476807ef6f12acb5
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class PositionFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Description { get; set; }
+    public string? StartDate { get; set; }
+    public string? Deadline { get; set; }
+    public string? ClientContact { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Program.cs b/LegacyOutput/src/IRM.SPA/Program.cs
index 00184fc283cd7060825796fd98e55be1c243edd6..2008eaa884f07089ce5823fe41c6a6336a34f709
--- a/LegacyOutput/src/IRM.SPA/Program.cs
+++ b/LegacyOutput/src/IRM.SPA/Program.cs
@@ -10,8 +10,9 @@
     {
         public static void Main(string[] args)
         {
-            var builder = WebApplication.CreateBuilder(args);
-            ConfigurationOptions config = builder.Configuration.Get<ConfigurationOptions>() ?? new ConfigurationOptions();
+            var builder = WebApplication.CreateBuilder(args);
+            AppDomain.CurrentDomain.SetData("DataDirectory", Path.Combine(builder.Environment.ContentRootPath, "App_Data"));
+            ConfigurationOptions config = builder.Configuration.Get<ConfigurationOptions>() ?? new ConfigurationOptions();
             // Add services to the container.
             builder.Services.AddRazorComponents()
                 .AddInteractiveServerComponents();           
diff --git a/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..1c88253e59d707a339e900e3d8c1a8b2d56950d2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
@@ -0,0 +1,268 @@
+using System.Data;
+using IRM.SPA.Models;
+using Microsoft.Data.SqlClient;
+
+namespace IRM.SPA.Services;
+
+public sealed class HiringRepository(IConfiguration configuration) : IHiringRepository
+{
+    private readonly string _connectionString = configuration.GetConnectionString("HiringConnection")
+        ?? throw new InvalidOperationException("ConnectionStrings:HiringConnection is not configured.");
+
+    public async Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Name", filter.Name);
+        AddLike(where, parameters, "Phone", filter.Phone);
+        AddLike(where, parameters, "Email", filter.Email);
+        AddLike(where, parameters, "Website", filter.Website);
+        AddLike(where, parameters, "ContactName", filter.ContactName);
+
+        var sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients";
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var clients = new List<Client>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            clients.Add(ReadClient(reader));
+        }
+
+        return clients;
+    }
+
+    public async Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients WHERE Id = @Id";
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadClient(reader) : null;
+    }
+
+    public async Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Clients (Name, Phone, Email, ContactName, Website)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Phone, @Email, @ContactName, @Website)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Clients
+            SET Name = @Name, Phone = @Phone, Email = @Email, ContactName = @ContactName, Website = @Website
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = client.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    public async Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Positions.Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Positions.Name", filter.Name, "@Name");
+        AddLike(where, parameters, "Positions.Description", filter.Description, "@Description");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.StartDate, 120)", filter.StartDate, "@StartDate");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.Deadline, 120)", filter.Deadline, "@Deadline");
+        AddLike(where, parameters, "Positions.ClientContactName", filter.ClientContact, "@ClientContact");
+
+        var sql = """
+            SELECT Positions.Id, Positions.Name, Positions.Description, Positions.StartDate, Positions.Deadline,
+                   Positions.Hired, Positions.IdClient, Positions.ClientContactName, Positions.ClientContactPhone,
+                   Positions.ClientContactEmail, Clients.Name AS ClientName
+            FROM Positions
+            LEFT JOIN Clients ON Positions.IdClient = Clients.Id
+            """;
+
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Positions.Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var positions = new List<Position>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            positions.Add(ReadPosition(reader, includeClientName: true));
+        }
+
+        return positions;
+    }
+
+    public async Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            SELECT Id, Name, Description, StartDate, Deadline, Hired, IdClient,
+                   ClientContactName, ClientContactPhone, ClientContactEmail
+            FROM Positions
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadPosition(reader, includeClientName: false) : null;
+    }
+
+    public async Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Positions (Name, Description, StartDate, Deadline, Hired, ClientContactName,
+                                   ClientContactPhone, ClientContactEmail, IdClient)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Description, @StartDate, @Deadline, @Hired, @ClientContactName,
+                    @ClientContactPhone, @ClientContactEmail, @IdClient)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Positions
+            SET Name = @Name, Description = @Description, StartDate = @StartDate, Deadline = @Deadline,
+                Hired = @Hired, ClientContactName = @ClientContactName, ClientContactPhone = @ClientContactPhone,
+                ClientContactEmail = @ClientContactEmail, IdClient = @IdClient
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = position.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    private SqlConnection CreateConnection() => new(_connectionString);
+
+    private static void AddClientParameters(SqlCommand command, Client client)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = client.Name;
+        command.Parameters.Add("@Phone", SqlDbType.VarChar).Value = client.Phone;
+        command.Parameters.Add("@Email", SqlDbType.VarChar).Value = client.Email;
+        command.Parameters.Add("@ContactName", SqlDbType.VarChar).Value = client.ContactName;
+        command.Parameters.Add("@Website", SqlDbType.VarChar).Value = client.Website;
+    }
+
+    private static void AddPositionParameters(SqlCommand command, Position position, bool includeClient)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = position.Name;
+        command.Parameters.Add("@Description", SqlDbType.VarChar).Value = position.Description;
+        command.Parameters.Add("@StartDate", SqlDbType.Date).Value = (object?)position.StartDate ?? DBNull.Value;
+        command.Parameters.Add("@Deadline", SqlDbType.Date).Value = (object?)position.Deadline ?? DBNull.Value;
+        command.Parameters.Add("@Hired", SqlDbType.Bit).Value = position.Hired;
+        command.Parameters.Add("@ClientContactName", SqlDbType.VarChar).Value = position.ClientContactName;
+        command.Parameters.Add("@ClientContactPhone", SqlDbType.VarChar).Value = position.ClientContactPhone;
+        command.Parameters.Add("@ClientContactEmail", SqlDbType.VarChar).Value = position.ClientContactEmail;
+        if (includeClient)
+        {
+            command.Parameters.Add("@IdClient", SqlDbType.Int).Value = (object?)position.IdClient ?? DBNull.Value;
+        }
+    }
+
+    private static void AddLike(List<string> where, List<SqlParameter> parameters, string column, string? value, string? parameterName = null)
+    {
+        if (string.IsNullOrWhiteSpace(value))
+        {
+            return;
+        }
+
+        parameterName ??= "@" + column.Replace(".", string.Empty);
+        where.Add($"{column} LIKE {parameterName}");
+        parameters.Add(new SqlParameter(parameterName, SqlDbType.VarChar) { Value = "%" + value.Trim() + "%" });
+    }
+
+    private static Client ReadClient(SqlDataReader reader) => new()
+    {
+        Id = reader.GetInt32(0),
+        Name = GetString(reader, 1),
+        Phone = GetString(reader, 2),
+        Email = GetString(reader, 3),
+        ContactName = GetString(reader, 4),
+        Website = GetString(reader, 5)
+    };
+
+    private static Position ReadPosition(SqlDataReader reader, bool includeClientName)
+    {
+        var position = new Position
+        {
+            Id = reader.GetInt32(0),
+            Name = GetString(reader, 1),
+            Description = GetString(reader, 2),
+            StartDate = reader.IsDBNull(3) ? null : reader.GetDateTime(3),
+            Deadline = reader.IsDBNull(4) ? null : reader.GetDateTime(4),
+            Hired = !reader.IsDBNull(5) && reader.GetBoolean(5),
+            IdClient = reader.IsDBNull(6) ? null : reader.GetInt32(6),
+            ClientContactName = GetString(reader, 7),
+            ClientContactPhone = GetString(reader, 8),
+            ClientContactEmail = GetString(reader, 9)
+        };
+
+        if (includeClientName)
+        {
+            position.ClientName = GetString(reader, 10);
+        }
+
+        return position;
+    }
+
+    private static string GetString(SqlDataReader reader, int ordinal) =>
+        reader.IsDBNull(ordinal) ? string.Empty : reader.GetString(ordinal);
+}
diff --git a/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..468316298ba01ef622db9ffeeb20a3df775fc996
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
@@ -0,0 +1,15 @@
+using IRM.SPA.Models;
+
+namespace IRM.SPA.Services;
+
+public interface IHiringRepository
+{
+    Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default);
+    Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default);
+    Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default);
+    Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default);
+}
diff --git a/LegacyOutput/src/IRM.SPA/wwwroot/app.css b/LegacyOutput/src/IRM.SPA/wwwroot/app.css
index 7ac30e2a8df7ef2e3f233e331d1d58ca449099d8..c4e3f519ac693dd5c0ee569dc7dae70aa51945dc
--- a/LegacyOutput/src/IRM.SPA/wwwroot/app.css
+++ b/LegacyOutput/src/IRM.SPA/wwwroot/app.css
@@ -1,51 +1,247 @@
-html, body {
-    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
-}
-
-a, .btn-link {
-    color: #006bb7;
-}
-
-.btn-primary {
-    color: #fff;
-    background-color: #1b6ec2;
-    border-color: #1861ac;
-}
-
-.btn:focus, .btn:active:focus, .btn-link.nav-link:focus, .form-control:focus, .form-check-input:focus {
-  box-shadow: 0 0 0 0.1rem white, 0 0 0 0.25rem #258cfb;
-}
-
-.content {
-    padding-top: 1.1rem;
-}
-
-h1:focus {
-    outline: none;
-}
-
-.valid.modified:not([type=checkbox]) {
-    outline: 1px solid #26b050;
-}
-
-.invalid {
-    outline: 1px solid #e50000;
-}
-
-.validation-message {
-    color: #e50000;
-}
-
-.blazor-error-boundary {
-    background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNDkiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIG92ZXJmbG93PSJoaWRkZW4iPjxkZWZzPjxjbGlwUGF0aCBpZD0iY2xpcDAiPjxyZWN0IHg9IjIzNSIgeT0iNTEiIHdpZHRoPSI1NiIgaGVpZ2h0PSI0OSIvPjwvY2xpcFBhdGg+PC9kZWZzPjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMCkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yMzUgLTUxKSI+PHBhdGggZD0iTTI2My41MDYgNTFDMjY0LjcxNyA1MSAyNjUuODEzIDUxLjQ4MzcgMjY2LjYwNiA1Mi4yNjU4TDI2Ny4wNTIgNTIuNzk4NyAyNjcuNTM5IDUzLjYyODMgMjkwLjE4NSA5Mi4xODMxIDI5MC41NDUgOTIuNzk1IDI5MC42NTYgOTIuOTk2QzI5MC44NzcgOTMuNTEzIDI5MSA5NC4wODE1IDI5MSA5NC42NzgyIDI5MSA5Ny4wNjUxIDI4OS4wMzggOTkgMjg2LjYxNyA5OUwyNDAuMzgzIDk5QzIzNy45NjMgOTkgMjM2IDk3LjA2NTEgMjM2IDk0LjY3ODIgMjM2IDk0LjM3OTkgMjM2LjAzMSA5NC4wODg2IDIzNi4wODkgOTMuODA3MkwyMzYuMzM4IDkzLjAxNjIgMjM2Ljg1OCA5Mi4xMzE0IDI1OS40NzMgNTMuNjI5NCAyNTkuOTYxIDUyLjc5ODUgMjYwLjQwNyA1Mi4yNjU4QzI2MS4yIDUxLjQ4MzcgMjYyLjI5NiA1MSAyNjMuNTA2IDUxWk0yNjMuNTg2IDY2LjAxODNDMjYwLjczNyA2Ni4wMTgzIDI1OS4zMTMgNjcuMTI0NSAyNTkuMzEzIDY5LjMzNyAyNTkuMzEzIDY5LjYxMDIgMjU5LjMzMiA2OS44NjA4IDI1OS4zNzEgNzAuMDg4N0wyNjEuNzk1IDg0LjAxNjEgMjY1LjM4IDg0LjAxNjEgMjY3LjgyMSA2OS43NDc1QzI2Ny44NiA2OS43MzA5IDI2Ny44NzkgNjkuNTg3NyAyNjcuODc5IDY5LjMxNzkgMjY3Ljg3OSA2Ny4xMTgyIDI2Ni40NDggNjYuMDE4MyAyNjMuNTg2IDY2LjAxODNaTTI2My41NzYgODYuMDU0N0MyNjEuMDQ5IDg2LjA1NDcgMjU5Ljc4NiA4Ny4zMDA1IDI1OS43ODYgODkuNzkyMSAyNTkuNzg2IDkyLjI4MzcgMjYxLjA0OSA5My41Mjk1IDI2My41NzYgOTMuNTI5NSAyNjYuMTE2IDkzLjUyOTUgMjY3LjM4NyA5Mi4yODM3IDI2Ny4zODcgODkuNzkyMSAyNjcuMzg3IDg3LjMwMDUgMjY2LjExNiA4Ni4wNTQ3IDI2My41NzYgODYuMDU0N1oiIGZpbGw9IiNGRkU1MDAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48L3N2Zz4=) no-repeat 1rem/1.8rem, #b32121;
-    padding: 1rem 1rem 1rem 3.7rem;
-    color: white;
-}
-
-    .blazor-error-boundary::after {
-        content: "An error has occurred."
-    }
-
-.darker-border-checkbox.form-check-input {
-    border-color: #929292;
-}
+html,
+body {
+    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
+}
+
+body {
+    padding-top: 50px;
+    padding-bottom: 20px;
+}
+
+.body-content {
+    padding-left: 15px;
+    padding-right: 15px;
+}
+
+.dl-horizontal dt {
+    white-space: normal;
+}
+
+input[type="text"],
+input[type="password"],
+input[type="email"],
+input[type="tel"],
+input[type="select"] {
+    max-width: 280px;
+}
+
+.jumbotron {
+    padding: 30px;
+    margin-bottom: 30px;
+    color: inherit;
+    background-color: #eee;
+    border-radius: 6px;
+}
+
+.jumbotron h1 {
+    font-size: 63px;
+}
+
+.lead {
+    margin-bottom: 20px;
+    font-size: 21px;
+    font-weight: 300;
+    line-height: 1.4;
+}
+
+.navbar-inverse {
+    background-color: #222;
+    border-color: #080808;
+}
+
+.navbar-fixed-top {
+    position: fixed;
+    right: 0;
+    left: 0;
+    z-index: 1030;
+    top: 0;
+    border-width: 0 0 1px;
+}
+
+.navbar {
+    min-height: 50px;
+    margin-bottom: 20px;
+    border: 1px solid transparent;
+}
+
+.navbar-header {
+    float: left;
+}
+
+.navbar-brand {
+    float: left;
+    height: 50px;
+    padding: 15px;
+    font-size: 18px;
+    line-height: 20px;
+}
+
+.navbar-inverse .navbar-brand,
+.navbar-inverse .navbar-nav > li > a {
+    color: #9d9d9d;
+}
+
+.navbar-inverse .navbar-brand:hover,
+.navbar-inverse .navbar-nav > li > a:hover,
+.navbar-inverse .navbar-nav > li > a.active {
+    color: #fff;
+    text-decoration: none;
+}
+
+.navbar-nav {
+    float: left;
+    margin: 0;
+}
+
+.nav > li {
+    position: relative;
+    display: block;
+}
+
+.navbar-nav > li {
+    float: left;
+}
+
+.nav > li > a {
+    position: relative;
+    display: block;
+    padding: 10px 15px;
+}
+
+.navbar-nav > li > a {
+    padding-top: 15px;
+    padding-bottom: 15px;
+    line-height: 20px;
+}
+
+.btn-default {
+    color: #333;
+    background-color: #fff;
+    border-color: #ccc;
+}
+
+.btn {
+    display: inline-block;
+    padding: 6px 12px;
+    margin-bottom: 0;
+    font-size: 14px;
+    font-weight: 400;
+    line-height: 1.42857143;
+    text-align: center;
+    white-space: nowrap;
+    vertical-align: middle;
+    cursor: pointer;
+    border: 1px solid transparent;
+    border-radius: 4px;
+}
+
+.formLabel {
+    display: inline-block;
+    width: 200px;
+}
+
+.legacy-table {
+    margin-top: 20px;
+    margin-bottom: 10px;
+    border-collapse: separate;
+    border-spacing: 2px;
+}
+
+.legacy-table th,
+.legacy-table td {
+    padding: 1px;
+    font-weight: normal;
+    text-align: left;
+    vertical-align: top;
+}
+
+.legacy-table th {
+    font-weight: bold;
+}
+
+.legacy-table input[type="text"] {
+    width: 130px;
+}
+
+.description-input {
+    width: 500px;
+    max-width: 100%;
+    vertical-align: top;
+}
+
+.link-button {
+    padding: 0;
+    color: #337ab7;
+    background: none;
+    border: 0;
+    cursor: pointer;
+    font: inherit;
+}
+
+.link-button:hover {
+    color: #23527c;
+    text-decoration: underline;
+}
+
+.alert {
+    padding: 15px;
+    margin-top: 20px;
+    margin-bottom: 20px;
+    border: 1px solid transparent;
+    border-radius: 4px;
+}
+
+.alert-danger {
+    color: #a94442;
+    background-color: #f2dede;
+    border-color: #ebccd1;
+}
+
+@media screen and (min-width: 768px) {
+    .jumbotron {
+        margin-top: 20px;
+    }
+
+    .body-content {
+        padding: 0;
+    }
+}
+
+@media screen and (max-width: 767px) {
+    .navbar-header,
+    .navbar-nav,
+    .navbar-nav > li {
+        float: none;
+    }
+
+    .navbar-fixed-top {
+        position: static;
+    }
+
+    body {
+        padding-top: 0;
+    }
+
+    .jumbotron h1 {
+        font-size: 42px;
+    }
+}
+
+#blazor-error-ui {
+    background: lightyellow;
+    bottom: 0;
+    box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.2);
+    display: none;
+    left: 0;
+    padding: 0.6rem 1.25rem 0.7rem 1.25rem;
+    position: fixed;
+    width: 100%;
+    z-index: 1000;
+}
+
+#blazor-error-ui .dismiss {
+    cursor: pointer;
+    position: absolute;
+    right: 0.75rem;
+    top: 0.5rem;
+}

codex
The final build also passes after removing the starter routes. I’m checking the final file set so the summary is precise.
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git status --short -- src/IRM.SPA' in D:\Projects\AI\AiMigration\LegacyOutput
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Recurse -File Models,Services,Components\\Pages,Components\\Layout,App_Data | Select-Object FullName" in D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -Raw Components\\Pages\\PositionDetails.razor | Select-String -Pattern \"UPDATE|IdClient|Position updated|input type=\\\"date\\\"\"" in D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA
 succeeded in 497ms:
?? src/IRM.SPA/

 succeeded in 632ms:

FullName                                                                                      
--------                                                                                      
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Models\Client.cs                          
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Models\ClientFilter.cs                    
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Models\Position.cs                        
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Models\PositionFilter.cs                  
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Services\HiringRepository.cs              
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Services\IHiringRepository.cs             
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Services\IProductApi.cs                   
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Pages\ClientDetails.razor      
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Pages\ClientsList.razor        
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Pages\Error.razor              
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Pages\Home.razor               
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Pages\PositionDetails.razor    
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Pages\PositionsList.razor      
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Pages\Audits\Audit.razor       
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Pages\Controls\Controls.razor  
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Pages\Dashboard\Dashboard.razor
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Pages\Reports\Report.razor     
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Pages\Templates\Template.razor 
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Layout\MainLayout.razor        
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Layout\MainLayout.razor.css    
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Layout\NavMenu.razor           
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\Components\Layout\NavMenu.razor.css       
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\App_Data\HiringDb.mdf                     
D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\App_Data\HiringDb_log.ldf                 



 exited 1 in 920ms:
Select-String : The string UPDATE|IdClient|Position updated|input type=\ is not a valid regular expression: parsing 
"UPDATE|IdClient|Position updated|input type=\" - Illegal \ at end of pattern.
At line:2 char:59
+ ... ils.razor | Select-String -Pattern "UPDATE|IdClient|Position updated| ...
+                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : InvalidArgument: (:) [Select-String], ArgumentException
    + FullyQualifiedErrorId : InvalidRegex,Microsoft.PowerShell.Commands.SelectStringCommand
 

2026-07-01T14:26:13.946331Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.9 seconds
Output:
Select-String : The string UPDATE|IdClient|Position updated|input type=\ is not a valid regular expression: parsing 
"UPDATE|IdClient|Position updated|input type=\" - Illegal \ at end of pattern.
At line:2 char:59
+ ... ils.razor | Select-String -Pattern "UPDATE|IdClient|Position updated| ...
+                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : InvalidArgument: (:) [Select-String], ArgumentException
    + FullyQualifiedErrorId : InvalidRegex,Microsoft.PowerShell.Commands.SelectStringCommand
 

diff --git a/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor b/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
index 62e62873d628af7e91de98824e1143460b2db2a0..a9714ae63155375bce0d34f8e2a2cda4c6cfbeeb
--- a/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
@@ -1,23 +1,30 @@
-﻿@inherits LayoutComponentBase
-
-<div class="page">
-    <div class="sidebar">
-        <NavMenu />
-    </div>
-
-    <main>
-        <div class="top-row px-4">
-            <a href="https://learn.microsoft.com/aspnet/core/" target="_blank">About</a>
-        </div>
-
-        <article class="content px-4">
-            @Body
-        </article>
-    </main>
-</div>
-
-<div id="blazor-error-ui">
-    An unhandled error has occurred.
-    <a href="" class="reload">Reload</a>
-    <a class="dismiss">🗙</a>
-</div>
+@inherits LayoutComponentBase
+
+<div class="navbar navbar-inverse navbar-fixed-top">
+    <div class="container">
+        <div class="navbar-header">
+            <a class="navbar-brand" href="/">Hiring Tracker</a>
+        </div>
+        <div class="navbar-collapse collapse">
+            <ul class="nav navbar-nav">
+                <li><NavLink href="/" Match="NavLinkMatch.All">Home</NavLink></li>
+                <li><NavLink href="clients">Clients</NavLink></li>
+                <li><NavLink href="positions">Positions</NavLink></li>
+            </ul>
+        </div>
+    </div>
+</div>
+
+<div class="container body-content">
+    @Body
+    <hr />
+    <footer>
+        <p>&copy; @DateTime.Now.Year - Hiring Tracker</p>
+    </footer>
+</div>
+
+<div id="blazor-error-ui">
+    An unhandled error has occurred.
+    <a href="" class="reload">Reload</a>
+    <a class="dismiss">x</a>
+</div>
diff --git a/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor b/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
index 259e68b4bc97ef9ecc0b3899dc192d7790fd9b4c..c765fe7b74acb5c30b228509af2a8a6e6e1bf3c6
--- a/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
@@ -1,30 +1 @@
-﻿<div class="top-row ps-3 navbar navbar-dark">
-    <div class="container-fluid">
-        <a class="navbar-brand" href="">IRM.SPA</a>
-    </div>
-</div>
-
-<input type="checkbox" title="Navigation menu" class="navbar-toggler" />
-
-<div class="nav-scrollable" onclick="document.querySelector('.navbar-toggler').click()">
-    <nav class="flex-column">
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="" Match="NavLinkMatch.All">
-                <span class="bi bi-house-door-fill-nav-menu" aria-hidden="true"></span> Home
-            </NavLink>
-        </div>
-
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="counter">
-                <span class="bi bi-plus-square-fill-nav-menu" aria-hidden="true"></span> Counter
-            </NavLink>
-        </div>
-
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="weather">
-                <span class="bi bi-list-nested-nav-menu" aria-hidden="true"></span> Weather
-            </NavLink>
-        </div>
-    </nav>
-</div>
-
+@* Navigation is defined in MainLayout to match the legacy Site.Master markup. *@
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor
new file mode 100644
index 0000000000000000000000000000000000000000..1232eae426ef2325a0505f006805d6a05ba6115e
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor
@@ -0,0 +1,104 @@
+@page "/clients/new"
+@page "/clients/{Id:int}"
+@page "/ClientDetails"
+@page "/ClientDetails.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+@inject IJSRuntime JS
+
+<PageTitle>Client Details - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="SaveAsync" @onsubmit:preventDefault>
+    <span class="formLabel">Id:</span>
+    <span>@(client.Id == 0 ? string.Empty : client.Id)</span>
+    <br />
+    <span class="formLabel">Name:</span>
+    <input type="text" @bind="client.Name" />
+    <br />
+    <span class="formLabel">Phone:</span>
+    <input type="text" @bind="client.Phone" />
+    <br />
+    <span class="formLabel">Email:</span>
+    <input type="text" @bind="client.Email" />
+    <br />
+    <span class="formLabel">Contact Name:</span>
+    <input type="text" @bind="client.ContactName" />
+    <br />
+    <span class="formLabel">Website:</span>
+    <input type="text" @bind="client.Website" />
+    <br />
+    @if (isEdit)
+    {
+        <button class="link-button" type="submit">Update</button>
+    }
+    else
+    {
+        <button class="link-button" type="submit">Insert</button>
+    }
+</form>
+
+@code {
+    [Parameter] public int? Id { get; set; }
+
+    private Client client = new();
+    private bool isEdit;
+    private string? errorMessage;
+
+    protected override async Task OnParametersSetAsync()
+    {
+        errorMessage = null;
+        isEdit = false;
+        client = new Client();
+
+        if (Id is not { } id)
+        {
+            return;
+        }
+
+        try
+        {
+            var existing = await Repository.GetClientAsync(id);
+            if (existing is not null)
+            {
+                client = existing;
+                isEdit = true;
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load client. " + ex.Message;
+        }
+    }
+
+    private async Task SaveAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            if (isEdit)
+            {
+                if (await Repository.UpdateClientAsync(client))
+                {
+                    await JS.InvokeVoidAsync("alert", "Client updated successfully");
+                }
+            }
+            else
+            {
+                client.Id = await Repository.InsertClientAsync(client);
+                isEdit = true;
+                await JS.InvokeVoidAsync("alert", "Client added successfully");
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to save client. " + ex.Message;
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor
new file mode 100644
index 0000000000000000000000000000000000000000..774521377b61d400b5e79c84a3304d20b83878b3
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor
@@ -0,0 +1,85 @@
+@page "/clients"
+@page "/ClientsList"
+@page "/ClientsList.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+
+<PageTitle>Clients - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="ApplyFilter" @onsubmit:preventDefault>
+    <table class="legacy-table">
+        <thead>
+            <tr>
+                <th>Id</th>
+                <th>Client Name</th>
+                <th>Phone</th>
+                <th>Email</th>
+                <th>Website</th>
+                <th>Contact Name</th>
+                <th></th>
+            </tr>
+            <tr>
+                <th><input type="text" @bind="filter.Id" /></th>
+                <th><input type="text" @bind="filter.Name" /></th>
+                <th><input type="text" @bind="filter.Phone" /></th>
+                <th><input type="text" @bind="filter.Email" /></th>
+                <th><input type="text" @bind="filter.Website" /></th>
+                <th><input type="text" @bind="filter.ContactName" /></th>
+                <th><button type="submit">Filter</button></th>
+            </tr>
+        </thead>
+        <tbody>
+            @foreach (var client in clients)
+            {
+                <tr>
+                    <td>@client.Id</td>
+                    <td>@client.Name</td>
+                    <td>@client.Phone</td>
+                    <td>@client.Email</td>
+                    <td>@client.Website</td>
+                    <td>@client.ContactName</td>
+                    <td><a href="clients/@client.Id">Details</a></td>
+                </tr>
+            }
+        </tbody>
+    </table>
+</form>
+
+<a href="clients/new">Add new client</a>
+
+@code {
+    private readonly ClientFilter filter = new();
+    private IReadOnlyList<Client> clients = [];
+    private string? errorMessage;
+
+    protected override async Task OnInitializedAsync()
+    {
+        await LoadClientsAsync();
+    }
+
+    private async Task ApplyFilter()
+    {
+        await LoadClientsAsync();
+    }
+
+    private async Task LoadClientsAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            clients = await Repository.GetClientsAsync(filter);
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load clients. " + ex.Message;
+            clients = [];
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/Counter.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/Counter.razor
deleted file mode 100644
index ba08d049a6a0d5fb9d3c521c37ab574965d2580a..0000000000000000000000000000000000000000
--- a/LegacyOutput/src/IRM.SPA/Components/Pages/Counter.razor
+++ /dev/null
@@ -1,19 +0,0 @@
-﻿@page "/counter"
-@rendermode InteractiveServer
-
-<PageTitle>Counter</PageTitle>
-
-<h1>Counter</h1>
-
-<p role="status">Current count: @currentCount</p>
-
-<button class="btn btn-primary" @onclick="IncrementCount">Click me</button>
-
-@code {
-    private int currentCount = 0;
-
-    private void IncrementCount()
-    {
-        currentCount++;
-    }
-}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
index df0502354fdfbbef85e1673ffcff56d85d2481bf..e4fbd72369d329a04d4cead6939579592e284c3d
--- a/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
@@ -1,7 +1,26 @@
-﻿@page "/"
-
-<PageTitle>Home</PageTitle>
-
-<h1>Hello, world!</h1>
-
-Welcome to your new app.
+@page "/"
+@page "/Default.aspx"
+
+<PageTitle>Home Page - Hiring Tracker</PageTitle>
+
+<div class="jumbotron">
+    <h1>Hiring Tracking</h1>
+    <p class="lead">Track positions and candidates.</p>
+</div>
+
+<div class="row">
+    <div class="col-md-4">
+        <h2>Positions</h2>
+        <p>View open positions or query previous hires.</p>
+        <p>
+            <a class="btn btn-default" href="positions">View</a>
+        </p>
+    </div>
+    <div class="col-md-4">
+        <h2>Clients</h2>
+        <p>Manage contacts requesting the positions.</p>
+        <p>
+            <a class="btn btn-default" href="clients">View</a>
+        </p>
+    </div>
+</div>
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor
new file mode 100644
index 0000000000000000000000000000000000000000..51bb6ec59ec33db24c64c1bb595bdf18d2e087ec
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor
@@ -0,0 +1,139 @@
+@page "/positions/new"
+@page "/positions/{Id:int}"
+@page "/PositionDetails"
+@page "/PositionDetails.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+@inject IJSRuntime JS
+
+<PageTitle>Position Details - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="SaveAsync" @onsubmit:preventDefault>
+    <span class="formLabel">Id:</span>
+    <span>@(position.Id == 0 ? string.Empty : position.Id)</span>
+    <br />
+    <span class="formLabel">Name:</span>
+    <input type="text" @bind="position.Name" />
+    <br />
+    <span class="formLabel">Description:</span>
+    <textarea rows="6" class="description-input" @bind="position.Description"></textarea>
+    <br />
+    <span class="formLabel">Start Date:</span>
+    <input type="date" value="@startDateText" @onchange="e => startDateText = e.Value?.ToString() ?? string.Empty" />
+    <br />
+    <span class="formLabel">Deadline:</span>
+    <input type="date" value="@deadlineText" @onchange="e => deadlineText = e.Value?.ToString() ?? string.Empty" />
+    <br />
+    <span class="formLabel">Hired?:</span>
+    <input type="checkbox" @bind="position.Hired" />
+    <br />
+    <span class="formLabel">Client:</span>
+    <select @bind="position.IdClient">
+        @foreach (var client in clients)
+        {
+            <option value="@client.Id">@client.Name</option>
+        }
+    </select>
+    <br />
+    <span class="formLabel">Client Contact Name:</span>
+    <input type="text" @bind="position.ClientContactName" />
+    <br />
+    <span class="formLabel">Phone:</span>
+    <input type="text" @bind="position.ClientContactPhone" />
+    <br />
+    <span class="formLabel">Email:</span>
+    <input type="text" @bind="position.ClientContactEmail" />
+    <br />
+    @if (isEdit)
+    {
+        <button class="link-button" type="submit">Update</button>
+    }
+    else
+    {
+        <button class="link-button" type="submit">Insert</button>
+    }
+</form>
+
+@code {
+    [Parameter] public int? Id { get; set; }
+
+    private Position position = new();
+    private IReadOnlyList<Client> clients = [];
+    private bool isEdit;
+    private string? errorMessage;
+    private string startDateText = string.Empty;
+    private string deadlineText = string.Empty;
+
+    protected override async Task OnParametersSetAsync()
+    {
+        errorMessage = null;
+        isEdit = false;
+        position = new Position();
+        startDateText = string.Empty;
+        deadlineText = string.Empty;
+
+        try
+        {
+            clients = await Repository.GetClientsAsync(new ClientFilter());
+            position.IdClient = clients.FirstOrDefault()?.Id;
+
+            if (Id is not { } id)
+            {
+                return;
+            }
+
+            var existing = await Repository.GetPositionAsync(id);
+            if (existing is not null)
+            {
+                position = existing;
+                startDateText = ToDateInputValue(position.StartDate);
+                deadlineText = ToDateInputValue(position.Deadline);
+                isEdit = true;
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load position. " + ex.Message;
+        }
+    }
+
+    private async Task SaveAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            position.StartDate = ParseDate(startDateText);
+            position.Deadline = ParseDate(deadlineText);
+
+            if (isEdit)
+            {
+                if (await Repository.UpdatePositionAsync(position))
+                {
+                    await JS.InvokeVoidAsync("alert", "Position updated successfully");
+                }
+            }
+            else
+            {
+                position.Id = await Repository.InsertPositionAsync(position);
+                isEdit = true;
+                await JS.InvokeVoidAsync("alert", "Position added successfully");
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to save position. " + ex.Message;
+        }
+    }
+
+    private static string ToDateInputValue(DateTime? value) => value?.ToString("yyyy-MM-dd") ?? string.Empty;
+
+    private static DateTime? ParseDate(string value) =>
+        DateTime.TryParse(value, out var parsed) ? parsed.Date : null;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor
new file mode 100644
index 0000000000000000000000000000000000000000..efdcec61db320f36ea4b1bad176e604944be65e2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor
@@ -0,0 +1,88 @@
+@page "/positions"
+@page "/PositionsList"
+@page "/PositionsList.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+
+<PageTitle>Positions - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="ApplyFilter" @onsubmit:preventDefault>
+    <table class="legacy-table">
+        <thead>
+            <tr>
+                <th>Id</th>
+                <th>Name</th>
+                <th>Description</th>
+                <th>Start Date</th>
+                <th>Deadline</th>
+                <th>Position Closed</th>
+                <th>Client Contact</th>
+                <th></th>
+            </tr>
+            <tr>
+                <th><input type="text" @bind="filter.Id" /></th>
+                <th><input type="text" @bind="filter.Name" /></th>
+                <th><input type="text" @bind="filter.Description" /></th>
+                <th><input type="text" @bind="filter.StartDate" /></th>
+                <th><input type="text" @bind="filter.Deadline" /></th>
+                <th></th>
+                <th><input type="text" @bind="filter.ClientContact" /></th>
+                <th><button type="submit">Filter</button></th>
+            </tr>
+        </thead>
+        <tbody>
+            @foreach (var position in positions)
+            {
+                <tr>
+                    <td>@position.Id</td>
+                    <td>@position.Name</td>
+                    <td>@position.Description</td>
+                    <td>@position.StartDate</td>
+                    <td>@position.Deadline</td>
+                    <td>@position.Hired</td>
+                    <td>@position.ClientName (@position.ClientContactName)</td>
+                    <td><a href="positions/@position.Id">Details</a></td>
+                </tr>
+            }
+        </tbody>
+    </table>
+</form>
+
+<a href="positions/new">Add new position</a>
+
+@code {
+    private readonly PositionFilter filter = new();
+    private IReadOnlyList<Position> positions = [];
+    private string? errorMessage;
+
+    protected override async Task OnInitializedAsync()
+    {
+        await LoadPositionsAsync();
+    }
+
+    private async Task ApplyFilter()
+    {
+        await LoadPositionsAsync();
+    }
+
+    private async Task LoadPositionsAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            positions = await Repository.GetPositionsAsync(filter);
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load positions. " + ex.Message;
+            positions = [];
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/Weather.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/Weather.razor
deleted file mode 100644
index 33631ab7afce233f173a24f29b551f45e506ce4a..0000000000000000000000000000000000000000
--- a/LegacyOutput/src/IRM.SPA/Components/Pages/Weather.razor
+++ /dev/null
@@ -1,64 +0,0 @@
-﻿@page "/weather"
-@attribute [StreamRendering]
-
-<PageTitle>Weather</PageTitle>
-
-<h1>Weather</h1>
-
-<p>This component demonstrates showing data.</p>
-
-@if (forecasts == null)
-{
-    <p><em>Loading...</em></p>
-}
-else
-{
-    <table class="table">
-        <thead>
-            <tr>
-                <th>Date</th>
-                <th>Temp. (C)</th>
-                <th>Temp. (F)</th>
-                <th>Summary</th>
-            </tr>
-        </thead>
-        <tbody>
-            @foreach (var forecast in forecasts)
-            {
-                <tr>
-                    <td>@forecast.Date.ToShortDateString()</td>
-                    <td>@forecast.TemperatureC</td>
-                    <td>@forecast.TemperatureF</td>
-                    <td>@forecast.Summary</td>
-                </tr>
-            }
-        </tbody>
-    </table>
-}
-
-@code {
-    private WeatherForecast[]? forecasts;
-
-    protected override async Task OnInitializedAsync()
-    {
-        // Simulate asynchronous loading to demonstrate streaming rendering
-        await Task.Delay(500);
-
-        var startDate = DateOnly.FromDateTime(DateTime.Now);
-        var summaries = new[] { "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching" };
-        forecasts = Enumerable.Range(1, 5).Select(index => new WeatherForecast
-        {
-            Date = startDate.AddDays(index),
-            TemperatureC = Random.Shared.Next(-20, 55),
-            Summary = summaries[Random.Shared.Next(summaries.Length)]
-        }).ToArray();
-    }
-
-    private class WeatherForecast
-    {
-        public DateOnly Date { get; set; }
-        public int TemperatureC { get; set; }
-        public string? Summary { get; set; }
-        public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
-    }
-}
diff --git a/LegacyOutput/src/IRM.SPA/Components/_Imports.razor b/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
index de2621323fafca41583fecc7d1b4b181a1e49ac1..4ca0297300bf206b5f4f4e3af4a8adffd1865970
--- a/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
@@ -5,6 +5,8 @@
 @using Microsoft.AspNetCore.Components.Web
 @using static Microsoft.AspNetCore.Components.Web.RenderMode
 @using Microsoft.AspNetCore.Components.Web.Virtualization
-@using Microsoft.JSInterop
-@using IRM.SPA
-@using IRM.SPA.Components
+@using Microsoft.JSInterop
+@using IRM.SPA
+@using IRM.SPA.Components
+@using IRM.SPA.Models
+@using IRM.SPA.Services
diff --git a/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs b/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
index 8a7b20c19addfd182712b09a487081eda45d085a..a1e19750167d74ae38221cb933beb102768676d5
--- a/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
+++ b/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
@@ -13,13 +13,14 @@
 {
     public static class DependancyInjector
     {
-        public static void RegisterServices(IServiceCollection services, ConfigurationOptions config)
-        {
-           
-
-            RegisterApiClients(services, config);           
-            RegisterModelValidators(services);
-        }
+        public static void RegisterServices(IServiceCollection services, ConfigurationOptions config)
+        {
+           
+
+            services.AddScoped<IHiringRepository, HiringRepository>();
+            RegisterApiClients(services, config);           
+            RegisterModelValidators(services);
+        }
        
         private static void RegisterModelValidators(IServiceCollection services)
         {
diff --git a/LegacyOutput/src/IRM.SPA/Models/Client.cs b/LegacyOutput/src/IRM.SPA/Models/Client.cs
new file mode 100644
index 0000000000000000000000000000000000000000..46bfecbc332bde56ebed47d21516d9a9c7773d42
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Client.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class Client
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Phone { get; set; } = string.Empty;
+    public string Email { get; set; } = string.Empty;
+    public string ContactName { get; set; } = string.Empty;
+    public string Website { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..d59d0bb30c1802c64fa28e40d6a449e156739081
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class ClientFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Phone { get; set; }
+    public string? Email { get; set; }
+    public string? Website { get; set; }
+    public string? ContactName { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/Position.cs b/LegacyOutput/src/IRM.SPA/Models/Position.cs
new file mode 100644
index 0000000000000000000000000000000000000000..a6f9543eebd29c5626ed28741e6b4065ad3d16cf
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Position.cs
@@ -0,0 +1,16 @@
+namespace IRM.SPA.Models;
+
+public sealed class Position
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Description { get; set; } = string.Empty;
+    public DateTime? StartDate { get; set; }
+    public DateTime? Deadline { get; set; }
+    public bool Hired { get; set; }
+    public int? IdClient { get; set; }
+    public string ClientName { get; set; } = string.Empty;
+    public string ClientContactName { get; set; } = string.Empty;
+    public string ClientContactPhone { get; set; } = string.Empty;
+    public string ClientContactEmail { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..cfa76e79d96580b7b4d98e9b476807ef6f12acb5
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class PositionFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Description { get; set; }
+    public string? StartDate { get; set; }
+    public string? Deadline { get; set; }
+    public string? ClientContact { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Program.cs b/LegacyOutput/src/IRM.SPA/Program.cs
index 00184fc283cd7060825796fd98e55be1c243edd6..2008eaa884f07089ce5823fe41c6a6336a34f709
--- a/LegacyOutput/src/IRM.SPA/Program.cs
+++ b/LegacyOutput/src/IRM.SPA/Program.cs
@@ -10,8 +10,9 @@
     {
         public static void Main(string[] args)
         {
-            var builder = WebApplication.CreateBuilder(args);
-            ConfigurationOptions config = builder.Configuration.Get<ConfigurationOptions>() ?? new ConfigurationOptions();
+            var builder = WebApplication.CreateBuilder(args);
+            AppDomain.CurrentDomain.SetData("DataDirectory", Path.Combine(builder.Environment.ContentRootPath, "App_Data"));
+            ConfigurationOptions config = builder.Configuration.Get<ConfigurationOptions>() ?? new ConfigurationOptions();
             // Add services to the container.
             builder.Services.AddRazorComponents()
                 .AddInteractiveServerComponents();           
diff --git a/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..1c88253e59d707a339e900e3d8c1a8b2d56950d2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
@@ -0,0 +1,268 @@
+using System.Data;
+using IRM.SPA.Models;
+using Microsoft.Data.SqlClient;
+
+namespace IRM.SPA.Services;
+
+public sealed class HiringRepository(IConfiguration configuration) : IHiringRepository
+{
+    private readonly string _connectionString = configuration.GetConnectionString("HiringConnection")
+        ?? throw new InvalidOperationException("ConnectionStrings:HiringConnection is not configured.");
+
+    public async Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Name", filter.Name);
+        AddLike(where, parameters, "Phone", filter.Phone);
+        AddLike(where, parameters, "Email", filter.Email);
+        AddLike(where, parameters, "Website", filter.Website);
+        AddLike(where, parameters, "ContactName", filter.ContactName);
+
+        var sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients";
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var clients = new List<Client>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            clients.Add(ReadClient(reader));
+        }
+
+        return clients;
+    }
+
+    public async Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients WHERE Id = @Id";
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadClient(reader) : null;
+    }
+
+    public async Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Clients (Name, Phone, Email, ContactName, Website)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Phone, @Email, @ContactName, @Website)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Clients
+            SET Name = @Name, Phone = @Phone, Email = @Email, ContactName = @ContactName, Website = @Website
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = client.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    public async Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Positions.Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Positions.Name", filter.Name, "@Name");
+        AddLike(where, parameters, "Positions.Description", filter.Description, "@Description");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.StartDate, 120)", filter.StartDate, "@StartDate");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.Deadline, 120)", filter.Deadline, "@Deadline");
+        AddLike(where, parameters, "Positions.ClientContactName", filter.ClientContact, "@ClientContact");
+
+        var sql = """
+            SELECT Positions.Id, Positions.Name, Positions.Description, Positions.StartDate, Positions.Deadline,
+                   Positions.Hired, Positions.IdClient, Positions.ClientContactName, Positions.ClientContactPhone,
+                   Positions.ClientContactEmail, Clients.Name AS ClientName
+            FROM Positions
+            LEFT JOIN Clients ON Positions.IdClient = Clients.Id
+            """;
+
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Positions.Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var positions = new List<Position>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            positions.Add(ReadPosition(reader, includeClientName: true));
+        }
+
+        return positions;
+    }
+
+    public async Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            SELECT Id, Name, Description, StartDate, Deadline, Hired, IdClient,
+                   ClientContactName, ClientContactPhone, ClientContactEmail
+            FROM Positions
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadPosition(reader, includeClientName: false) : null;
+    }
+
+    public async Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Positions (Name, Description, StartDate, Deadline, Hired, ClientContactName,
+                                   ClientContactPhone, ClientContactEmail, IdClient)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Description, @StartDate, @Deadline, @Hired, @ClientContactName,
+                    @ClientContactPhone, @ClientContactEmail, @IdClient)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Positions
+            SET Name = @Name, Description = @Description, StartDate = @StartDate, Deadline = @Deadline,
+                Hired = @Hired, ClientContactName = @ClientContactName, ClientContactPhone = @ClientContactPhone,
+                ClientContactEmail = @ClientContactEmail, IdClient = @IdClient
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = position.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    private SqlConnection CreateConnection() => new(_connectionString);
+
+    private static void AddClientParameters(SqlCommand command, Client client)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = client.Name;
+        command.Parameters.Add("@Phone", SqlDbType.VarChar).Value = client.Phone;
+        command.Parameters.Add("@Email", SqlDbType.VarChar).Value = client.Email;
+        command.Parameters.Add("@ContactName", SqlDbType.VarChar).Value = client.ContactName;
+        command.Parameters.Add("@Website", SqlDbType.VarChar).Value = client.Website;
+    }
+
+    private static void AddPositionParameters(SqlCommand command, Position position, bool includeClient)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = position.Name;
+        command.Parameters.Add("@Description", SqlDbType.VarChar).Value = position.Description;
+        command.Parameters.Add("@StartDate", SqlDbType.Date).Value = (object?)position.StartDate ?? DBNull.Value;
+        command.Parameters.Add("@Deadline", SqlDbType.Date).Value = (object?)position.Deadline ?? DBNull.Value;
+        command.Parameters.Add("@Hired", SqlDbType.Bit).Value = position.Hired;
+        command.Parameters.Add("@ClientContactName", SqlDbType.VarChar).Value = position.ClientContactName;
+        command.Parameters.Add("@ClientContactPhone", SqlDbType.VarChar).Value = position.ClientContactPhone;
+        command.Parameters.Add("@ClientContactEmail", SqlDbType.VarChar).Value = position.ClientContactEmail;
+        if (includeClient)
+        {
+            command.Parameters.Add("@IdClient", SqlDbType.Int).Value = (object?)position.IdClient ?? DBNull.Value;
+        }
+    }
+
+    private static void AddLike(List<string> where, List<SqlParameter> parameters, string column, string? value, string? parameterName = null)
+    {
+        if (string.IsNullOrWhiteSpace(value))
+        {
+            return;
+        }
+
+        parameterName ??= "@" + column.Replace(".", string.Empty);
+        where.Add($"{column} LIKE {parameterName}");
+        parameters.Add(new SqlParameter(parameterName, SqlDbType.VarChar) { Value = "%" + value.Trim() + "%" });
+    }
+
+    private static Client ReadClient(SqlDataReader reader) => new()
+    {
+        Id = reader.GetInt32(0),
+        Name = GetString(reader, 1),
+        Phone = GetString(reader, 2),
+        Email = GetString(reader, 3),
+        ContactName = GetString(reader, 4),
+        Website = GetString(reader, 5)
+    };
+
+    private static Position ReadPosition(SqlDataReader reader, bool includeClientName)
+    {
+        var position = new Position
+        {
+            Id = reader.GetInt32(0),
+            Name = GetString(reader, 1),
+            Description = GetString(reader, 2),
+            StartDate = reader.IsDBNull(3) ? null : reader.GetDateTime(3),
+            Deadline = reader.IsDBNull(4) ? null : reader.GetDateTime(4),
+            Hired = !reader.IsDBNull(5) && reader.GetBoolean(5),
+            IdClient = reader.IsDBNull(6) ? null : reader.GetInt32(6),
+            ClientContactName = GetString(reader, 7),
+            ClientContactPhone = GetString(reader, 8),
+            ClientContactEmail = GetString(reader, 9)
+        };
+
+        if (includeClientName)
+        {
+            position.ClientName = GetString(reader, 10);
+        }
+
+        return position;
+    }
+
+    private static string GetString(SqlDataReader reader, int ordinal) =>
+        reader.IsDBNull(ordinal) ? string.Empty : reader.GetString(ordinal);
+}
diff --git a/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..468316298ba01ef622db9ffeeb20a3df775fc996
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
@@ -0,0 +1,15 @@
+using IRM.SPA.Models;
+
+namespace IRM.SPA.Services;
+
+public interface IHiringRepository
+{
+    Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default);
+    Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default);
+    Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default);
+    Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default);
+}
diff --git a/LegacyOutput/src/IRM.SPA/wwwroot/app.css b/LegacyOutput/src/IRM.SPA/wwwroot/app.css
index 7ac30e2a8df7ef2e3f233e331d1d58ca449099d8..c4e3f519ac693dd5c0ee569dc7dae70aa51945dc
--- a/LegacyOutput/src/IRM.SPA/wwwroot/app.css
+++ b/LegacyOutput/src/IRM.SPA/wwwroot/app.css
@@ -1,51 +1,247 @@
-html, body {
-    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
-}
-
-a, .btn-link {
-    color: #006bb7;
-}
-
-.btn-primary {
-    color: #fff;
-    background-color: #1b6ec2;
-    border-color: #1861ac;
-}
-
-.btn:focus, .btn:active:focus, .btn-link.nav-link:focus, .form-control:focus, .form-check-input:focus {
-  box-shadow: 0 0 0 0.1rem white, 0 0 0 0.25rem #258cfb;
-}
-
-.content {
-    padding-top: 1.1rem;
-}
-
-h1:focus {
-    outline: none;
-}
-
-.valid.modified:not([type=checkbox]) {
-    outline: 1px solid #26b050;
-}
-
-.invalid {
-    outline: 1px solid #e50000;
-}
-
-.validation-message {
-    color: #e50000;
-}
-
-.blazor-error-boundary {
-    background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNDkiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIG92ZXJmbG93PSJoaWRkZW4iPjxkZWZzPjxjbGlwUGF0aCBpZD0iY2xpcDAiPjxyZWN0IHg9IjIzNSIgeT0iNTEiIHdpZHRoPSI1NiIgaGVpZ2h0PSI0OSIvPjwvY2xpcFBhdGg+PC9kZWZzPjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMCkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yMzUgLTUxKSI+PHBhdGggZD0iTTI2My41MDYgNTFDMjY0LjcxNyA1MSAyNjUuODEzIDUxLjQ4MzcgMjY2LjYwNiA1Mi4yNjU4TDI2Ny4wNTIgNTIuNzk4NyAyNjcuNTM5IDUzLjYyODMgMjkwLjE4NSA5Mi4xODMxIDI5MC41NDUgOTIuNzk1IDI5MC42NTYgOTIuOTk2QzI5MC44NzcgOTMuNTEzIDI5MSA5NC4wODE1IDI5MSA5NC42NzgyIDI5MSA5Ny4wNjUxIDI4OS4wMzggOTkgMjg2LjYxNyA5OUwyNDAuMzgzIDk5QzIzNy45NjMgOTkgMjM2IDk3LjA2NTEgMjM2IDk0LjY3ODIgMjM2IDk0LjM3OTkgMjM2LjAzMSA5NC4wODg2IDIzNi4wODkgOTMuODA3MkwyMzYuMzM4IDkzLjAxNjIgMjM2Ljg1OCA5Mi4xMzE0IDI1OS40NzMgNTMuNjI5NCAyNTkuOTYxIDUyLjc5ODUgMjYwLjQwNyA1Mi4yNjU4QzI2MS4yIDUxLjQ4MzcgMjYyLjI5NiA1MSAyNjMuNTA2IDUxWk0yNjMuNTg2IDY2LjAxODNDMjYwLjczNyA2Ni4wMTgzIDI1OS4zMTMgNjcuMTI0NSAyNTkuMzEzIDY5LjMzNyAyNTkuMzEzIDY5LjYxMDIgMjU5LjMzMiA2OS44NjA4IDI1OS4zNzEgNzAuMDg4N0wyNjEuNzk1IDg0LjAxNjEgMjY1LjM4IDg0LjAxNjEgMjY3LjgyMSA2OS43NDc1QzI2Ny44NiA2OS43MzA5IDI2Ny44NzkgNjkuNTg3NyAyNjcuODc5IDY5LjMxNzkgMjY3Ljg3OSA2Ny4xMTgyIDI2Ni40NDggNjYuMDE4MyAyNjMuNTg2IDY2LjAxODNaTTI2My41NzYgODYuMDU0N0MyNjEuMDQ5IDg2LjA1NDcgMjU5Ljc4NiA4Ny4zMDA1IDI1OS43ODYgODkuNzkyMSAyNTkuNzg2IDkyLjI4MzcgMjYxLjA0OSA5My41Mjk1IDI2My41NzYgOTMuNTI5NSAyNjYuMTE2IDkzLjUyOTUgMjY3LjM4NyA5Mi4yODM3IDI2Ny4zODcgODkuNzkyMSAyNjcuMzg3IDg3LjMwMDUgMjY2LjExNiA4Ni4wNTQ3IDI2My41NzYgODYuMDU0N1oiIGZpbGw9IiNGRkU1MDAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48L3N2Zz4=) no-repeat 1rem/1.8rem, #b32121;
-    padding: 1rem 1rem 1rem 3.7rem;
-    color: white;
-}
-
-    .blazor-error-boundary::after {
-        content: "An error has occurred."
-    }
-
-.darker-border-checkbox.form-check-input {
-    border-color: #929292;
-}
+html,
+body {
+    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
+}
+
+body {
+    padding-top: 50px;
+    padding-bottom: 20px;
+}
+
+.body-content {
+    padding-left: 15px;
+    padding-right: 15px;
+}
+
+.dl-horizontal dt {
+    white-space: normal;
+}
+
+input[type="text"],
+input[type="password"],
+input[type="email"],
+input[type="tel"],
+input[type="select"] {
+    max-width: 280px;
+}
+
+.jumbotron {
+    padding: 30px;
+    margin-bottom: 30px;
+    color: inherit;
+    background-color: #eee;
+    border-radius: 6px;
+}
+
+.jumbotron h1 {
+    font-size: 63px;
+}
+
+.lead {
+    margin-bottom: 20px;
+    font-size: 21px;
+    font-weight: 300;
+    line-height: 1.4;
+}
+
+.navbar-inverse {
+    background-color: #222;
+    border-color: #080808;
+}
+
+.navbar-fixed-top {
+    position: fixed;
+    right: 0;
+    left: 0;
+    z-index: 1030;
+    top: 0;
+    border-width: 0 0 1px;
+}
+
+.navbar {
+    min-height: 50px;
+    margin-bottom: 20px;
+    border: 1px solid transparent;
+}
+
+.navbar-header {
+    float: left;
+}
+
+.navbar-brand {
+    float: left;
+    height: 50px;
+    padding: 15px;
+    font-size: 18px;
+    line-height: 20px;
+}
+
+.navbar-inverse .navbar-brand,
+.navbar-inverse .navbar-nav > li > a {
+    color: #9d9d9d;
+}
+
+.navbar-inverse .navbar-brand:hover,
+.navbar-inverse .navbar-nav > li > a:hover,
+.navbar-inverse .navbar-nav > li > a.active {
+    color: #fff;
+    text-decoration: none;
+}
+
+.navbar-nav {
+    float: left;
+    margin: 0;
+}
+
+.nav > li {
+    position: relative;
+    display: block;
+}
+
+.navbar-nav > li {
+    float: left;
+}
+
+.nav > li > a {
+    position: relative;
+    display: block;
+    padding: 10px 15px;
+}
+
+.navbar-nav > li > a {
+    padding-top: 15px;
+    padding-bottom: 15px;
+    line-height: 20px;
+}
+
+.btn-default {
+    color: #333;
+    background-color: #fff;
+    border-color: #ccc;
+}
+
+.btn {
+    display: inline-block;
+    padding: 6px 12px;
+    margin-bottom: 0;
+    font-size: 14px;
+    font-weight: 400;
+    line-height: 1.42857143;
+    text-align: center;
+    white-space: nowrap;
+    vertical-align: middle;
+    cursor: pointer;
+    border: 1px solid transparent;
+    border-radius: 4px;
+}
+
+.formLabel {
+    display: inline-block;
+    width: 200px;
+}
+
+.legacy-table {
+    margin-top: 20px;
+    margin-bottom: 10px;
+    border-collapse: separate;
+    border-spacing: 2px;
+}
+
+.legacy-table th,
+.legacy-table td {
+    padding: 1px;
+    font-weight: normal;
+    text-align: left;
+    vertical-align: top;
+}
+
+.legacy-table th {
+    font-weight: bold;
+}
+
+.legacy-table input[type="text"] {
+    width: 130px;
+}
+
+.description-input {
+    width: 500px;
+    max-width: 100%;
+    vertical-align: top;
+}
+
+.link-button {
+    padding: 0;
+    color: #337ab7;
+    background: none;
+    border: 0;
+    cursor: pointer;
+    font: inherit;
+}
+
+.link-button:hover {
+    color: #23527c;
+    text-decoration: underline;
+}
+
+.alert {
+    padding: 15px;
+    margin-top: 20px;
+    margin-bottom: 20px;
+    border: 1px solid transparent;
+    border-radius: 4px;
+}
+
+.alert-danger {
+    color: #a94442;
+    background-color: #f2dede;
+    border-color: #ebccd1;
+}
+
+@media screen and (min-width: 768px) {
+    .jumbotron {
+        margin-top: 20px;
+    }
+
+    .body-content {
+        padding: 0;
+    }
+}
+
+@media screen and (max-width: 767px) {
+    .navbar-header,
+    .navbar-nav,
+    .navbar-nav > li {
+        float: none;
+    }
+
+    .navbar-fixed-top {
+        position: static;
+    }
+
+    body {
+        padding-top: 0;
+    }
+
+    .jumbotron h1 {
+        font-size: 42px;
+    }
+}
+
+#blazor-error-ui {
+    background: lightyellow;
+    bottom: 0;
+    box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.2);
+    display: none;
+    left: 0;
+    padding: 0.6rem 1.25rem 0.7rem 1.25rem;
+    position: fixed;
+    width: 100%;
+    z-index: 1000;
+}
+
+#blazor-error-ui .dismiss {
+    cursor: pointer;
+    position: absolute;
+    right: 0.75rem;
+    top: 0.5rem;
+}

codex
Implemented the WebForms-to-Blazor SSR migration under `src/IRM.SPA`.

Changed:
- Replaced starter home/nav with the Hiring Tracker UI from `Site.Master` and `Default.aspx`.
- Added migrated pages:
  - [Home.razor](D:/Projects/AI/AiMigration/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor)
  - [ClientsList.razor](D:/Projects/AI/AiMigration/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor)
  - [ClientDetails.razor](D:/Projects/AI/AiMigration/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor)
  - [PositionsList.razor](D:/Projects/AI/AiMigration/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor)
  - [PositionDetails.razor](D:/Projects/AI/AiMigration/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor)
- Added parameterized SQL data access:
  - [HiringRepository.cs](D:/Projects/AI/AiMigration/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs)
  - [IHiringRepository.cs](D:/Projects/AI/AiMigration/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs)
  - model/filter classes under [Models](D:/Projects/AI/AiMigration/LegacyOutput/src/IRM.SPA/Models)
- Registered the repository in DI and set `DataDirectory` for the copied LocalDB files.
- Copied `HiringDb.mdf` and `HiringDb_log.ldf` into [App_Data](D:/Projects/AI/AiMigration/LegacyOutput/src/IRM.SPA/App_Data).
- Removed routeable starter `Counter` and `Weather` pages.

Verification:
- `dotnet build IRM.SPA.csproj` passes with `0` warnings and `0` errors.

Behavior notes:
- Session-based record selection is replaced with routes like `/clients/5`, `/clients/new`, `/positions/5`, `/positions/new`.
- Legacy `.aspx` list/detail routes are preserved as aliases where possible.
- Client filters and all visible position filters now use parameterized SQL.
- Position edit now persists the selected client, matching the visible UI rather than the legacy update bug.
- Success alerts are preserved via browser `alert`, with the legacy typo corrected from `succesfully` to `successfully`.
diff --git a/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor b/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
index 62e62873d628af7e91de98824e1143460b2db2a0..a9714ae63155375bce0d34f8e2a2cda4c6cfbeeb
--- a/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Layout/MainLayout.razor
@@ -1,23 +1,30 @@
-﻿@inherits LayoutComponentBase
-
-<div class="page">
-    <div class="sidebar">
-        <NavMenu />
-    </div>
-
-    <main>
-        <div class="top-row px-4">
-            <a href="https://learn.microsoft.com/aspnet/core/" target="_blank">About</a>
-        </div>
-
-        <article class="content px-4">
-            @Body
-        </article>
-    </main>
-</div>
-
-<div id="blazor-error-ui">
-    An unhandled error has occurred.
-    <a href="" class="reload">Reload</a>
-    <a class="dismiss">🗙</a>
-</div>
+@inherits LayoutComponentBase
+
+<div class="navbar navbar-inverse navbar-fixed-top">
+    <div class="container">
+        <div class="navbar-header">
+            <a class="navbar-brand" href="/">Hiring Tracker</a>
+        </div>
+        <div class="navbar-collapse collapse">
+            <ul class="nav navbar-nav">
+                <li><NavLink href="/" Match="NavLinkMatch.All">Home</NavLink></li>
+                <li><NavLink href="clients">Clients</NavLink></li>
+                <li><NavLink href="positions">Positions</NavLink></li>
+            </ul>
+        </div>
+    </div>
+</div>
+
+<div class="container body-content">
+    @Body
+    <hr />
+    <footer>
+        <p>&copy; @DateTime.Now.Year - Hiring Tracker</p>
+    </footer>
+</div>
+
+<div id="blazor-error-ui">
+    An unhandled error has occurred.
+    <a href="" class="reload">Reload</a>
+    <a class="dismiss">x</a>
+</div>
diff --git a/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor b/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
index 259e68b4bc97ef9ecc0b3899dc192d7790fd9b4c..c765fe7b74acb5c30b228509af2a8a6e6e1bf3c6
--- a/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Layout/NavMenu.razor
@@ -1,30 +1 @@
-﻿<div class="top-row ps-3 navbar navbar-dark">
-    <div class="container-fluid">
-        <a class="navbar-brand" href="">IRM.SPA</a>
-    </div>
-</div>
-
-<input type="checkbox" title="Navigation menu" class="navbar-toggler" />
-
-<div class="nav-scrollable" onclick="document.querySelector('.navbar-toggler').click()">
-    <nav class="flex-column">
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="" Match="NavLinkMatch.All">
-                <span class="bi bi-house-door-fill-nav-menu" aria-hidden="true"></span> Home
-            </NavLink>
-        </div>
-
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="counter">
-                <span class="bi bi-plus-square-fill-nav-menu" aria-hidden="true"></span> Counter
-            </NavLink>
-        </div>
-
-        <div class="nav-item px-3">
-            <NavLink class="nav-link" href="weather">
-                <span class="bi bi-list-nested-nav-menu" aria-hidden="true"></span> Weather
-            </NavLink>
-        </div>
-    </nav>
-</div>
-
+@* Navigation is defined in MainLayout to match the legacy Site.Master markup. *@
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor
new file mode 100644
index 0000000000000000000000000000000000000000..1232eae426ef2325a0505f006805d6a05ba6115e
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor
@@ -0,0 +1,104 @@
+@page "/clients/new"
+@page "/clients/{Id:int}"
+@page "/ClientDetails"
+@page "/ClientDetails.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+@inject IJSRuntime JS
+
+<PageTitle>Client Details - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="SaveAsync" @onsubmit:preventDefault>
+    <span class="formLabel">Id:</span>
+    <span>@(client.Id == 0 ? string.Empty : client.Id)</span>
+    <br />
+    <span class="formLabel">Name:</span>
+    <input type="text" @bind="client.Name" />
+    <br />
+    <span class="formLabel">Phone:</span>
+    <input type="text" @bind="client.Phone" />
+    <br />
+    <span class="formLabel">Email:</span>
+    <input type="text" @bind="client.Email" />
+    <br />
+    <span class="formLabel">Contact Name:</span>
+    <input type="text" @bind="client.ContactName" />
+    <br />
+    <span class="formLabel">Website:</span>
+    <input type="text" @bind="client.Website" />
+    <br />
+    @if (isEdit)
+    {
+        <button class="link-button" type="submit">Update</button>
+    }
+    else
+    {
+        <button class="link-button" type="submit">Insert</button>
+    }
+</form>
+
+@code {
+    [Parameter] public int? Id { get; set; }
+
+    private Client client = new();
+    private bool isEdit;
+    private string? errorMessage;
+
+    protected override async Task OnParametersSetAsync()
+    {
+        errorMessage = null;
+        isEdit = false;
+        client = new Client();
+
+        if (Id is not { } id)
+        {
+            return;
+        }
+
+        try
+        {
+            var existing = await Repository.GetClientAsync(id);
+            if (existing is not null)
+            {
+                client = existing;
+                isEdit = true;
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load client. " + ex.Message;
+        }
+    }
+
+    private async Task SaveAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            if (isEdit)
+            {
+                if (await Repository.UpdateClientAsync(client))
+                {
+                    await JS.InvokeVoidAsync("alert", "Client updated successfully");
+                }
+            }
+            else
+            {
+                client.Id = await Repository.InsertClientAsync(client);
+                isEdit = true;
+                await JS.InvokeVoidAsync("alert", "Client added successfully");
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to save client. " + ex.Message;
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor
new file mode 100644
index 0000000000000000000000000000000000000000..774521377b61d400b5e79c84a3304d20b83878b3
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor
@@ -0,0 +1,85 @@
+@page "/clients"
+@page "/ClientsList"
+@page "/ClientsList.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+
+<PageTitle>Clients - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="ApplyFilter" @onsubmit:preventDefault>
+    <table class="legacy-table">
+        <thead>
+            <tr>
+                <th>Id</th>
+                <th>Client Name</th>
+                <th>Phone</th>
+                <th>Email</th>
+                <th>Website</th>
+                <th>Contact Name</th>
+                <th></th>
+            </tr>
+            <tr>
+                <th><input type="text" @bind="filter.Id" /></th>
+                <th><input type="text" @bind="filter.Name" /></th>
+                <th><input type="text" @bind="filter.Phone" /></th>
+                <th><input type="text" @bind="filter.Email" /></th>
+                <th><input type="text" @bind="filter.Website" /></th>
+                <th><input type="text" @bind="filter.ContactName" /></th>
+                <th><button type="submit">Filter</button></th>
+            </tr>
+        </thead>
+        <tbody>
+            @foreach (var client in clients)
+            {
+                <tr>
+                    <td>@client.Id</td>
+                    <td>@client.Name</td>
+                    <td>@client.Phone</td>
+                    <td>@client.Email</td>
+                    <td>@client.Website</td>
+                    <td>@client.ContactName</td>
+                    <td><a href="clients/@client.Id">Details</a></td>
+                </tr>
+            }
+        </tbody>
+    </table>
+</form>
+
+<a href="clients/new">Add new client</a>
+
+@code {
+    private readonly ClientFilter filter = new();
+    private IReadOnlyList<Client> clients = [];
+    private string? errorMessage;
+
+    protected override async Task OnInitializedAsync()
+    {
+        await LoadClientsAsync();
+    }
+
+    private async Task ApplyFilter()
+    {
+        await LoadClientsAsync();
+    }
+
+    private async Task LoadClientsAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            clients = await Repository.GetClientsAsync(filter);
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load clients. " + ex.Message;
+            clients = [];
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/Counter.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/Counter.razor
deleted file mode 100644
index ba08d049a6a0d5fb9d3c521c37ab574965d2580a..0000000000000000000000000000000000000000
--- a/LegacyOutput/src/IRM.SPA/Components/Pages/Counter.razor
+++ /dev/null
@@ -1,19 +0,0 @@
-﻿@page "/counter"
-@rendermode InteractiveServer
-
-<PageTitle>Counter</PageTitle>
-
-<h1>Counter</h1>
-
-<p role="status">Current count: @currentCount</p>
-
-<button class="btn btn-primary" @onclick="IncrementCount">Click me</button>
-
-@code {
-    private int currentCount = 0;
-
-    private void IncrementCount()
-    {
-        currentCount++;
-    }
-}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
index df0502354fdfbbef85e1673ffcff56d85d2481bf..e4fbd72369d329a04d4cead6939579592e284c3d
--- a/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor
@@ -1,7 +1,26 @@
-﻿@page "/"
-
-<PageTitle>Home</PageTitle>
-
-<h1>Hello, world!</h1>
-
-Welcome to your new app.
+@page "/"
+@page "/Default.aspx"
+
+<PageTitle>Home Page - Hiring Tracker</PageTitle>
+
+<div class="jumbotron">
+    <h1>Hiring Tracking</h1>
+    <p class="lead">Track positions and candidates.</p>
+</div>
+
+<div class="row">
+    <div class="col-md-4">
+        <h2>Positions</h2>
+        <p>View open positions or query previous hires.</p>
+        <p>
+            <a class="btn btn-default" href="positions">View</a>
+        </p>
+    </div>
+    <div class="col-md-4">
+        <h2>Clients</h2>
+        <p>Manage contacts requesting the positions.</p>
+        <p>
+            <a class="btn btn-default" href="clients">View</a>
+        </p>
+    </div>
+</div>
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor
new file mode 100644
index 0000000000000000000000000000000000000000..51bb6ec59ec33db24c64c1bb595bdf18d2e087ec
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor
@@ -0,0 +1,139 @@
+@page "/positions/new"
+@page "/positions/{Id:int}"
+@page "/PositionDetails"
+@page "/PositionDetails.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+@inject IJSRuntime JS
+
+<PageTitle>Position Details - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="SaveAsync" @onsubmit:preventDefault>
+    <span class="formLabel">Id:</span>
+    <span>@(position.Id == 0 ? string.Empty : position.Id)</span>
+    <br />
+    <span class="formLabel">Name:</span>
+    <input type="text" @bind="position.Name" />
+    <br />
+    <span class="formLabel">Description:</span>
+    <textarea rows="6" class="description-input" @bind="position.Description"></textarea>
+    <br />
+    <span class="formLabel">Start Date:</span>
+    <input type="date" value="@startDateText" @onchange="e => startDateText = e.Value?.ToString() ?? string.Empty" />
+    <br />
+    <span class="formLabel">Deadline:</span>
+    <input type="date" value="@deadlineText" @onchange="e => deadlineText = e.Value?.ToString() ?? string.Empty" />
+    <br />
+    <span class="formLabel">Hired?:</span>
+    <input type="checkbox" @bind="position.Hired" />
+    <br />
+    <span class="formLabel">Client:</span>
+    <select @bind="position.IdClient">
+        @foreach (var client in clients)
+        {
+            <option value="@client.Id">@client.Name</option>
+        }
+    </select>
+    <br />
+    <span class="formLabel">Client Contact Name:</span>
+    <input type="text" @bind="position.ClientContactName" />
+    <br />
+    <span class="formLabel">Phone:</span>
+    <input type="text" @bind="position.ClientContactPhone" />
+    <br />
+    <span class="formLabel">Email:</span>
+    <input type="text" @bind="position.ClientContactEmail" />
+    <br />
+    @if (isEdit)
+    {
+        <button class="link-button" type="submit">Update</button>
+    }
+    else
+    {
+        <button class="link-button" type="submit">Insert</button>
+    }
+</form>
+
+@code {
+    [Parameter] public int? Id { get; set; }
+
+    private Position position = new();
+    private IReadOnlyList<Client> clients = [];
+    private bool isEdit;
+    private string? errorMessage;
+    private string startDateText = string.Empty;
+    private string deadlineText = string.Empty;
+
+    protected override async Task OnParametersSetAsync()
+    {
+        errorMessage = null;
+        isEdit = false;
+        position = new Position();
+        startDateText = string.Empty;
+        deadlineText = string.Empty;
+
+        try
+        {
+            clients = await Repository.GetClientsAsync(new ClientFilter());
+            position.IdClient = clients.FirstOrDefault()?.Id;
+
+            if (Id is not { } id)
+            {
+                return;
+            }
+
+            var existing = await Repository.GetPositionAsync(id);
+            if (existing is not null)
+            {
+                position = existing;
+                startDateText = ToDateInputValue(position.StartDate);
+                deadlineText = ToDateInputValue(position.Deadline);
+                isEdit = true;
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load position. " + ex.Message;
+        }
+    }
+
+    private async Task SaveAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            position.StartDate = ParseDate(startDateText);
+            position.Deadline = ParseDate(deadlineText);
+
+            if (isEdit)
+            {
+                if (await Repository.UpdatePositionAsync(position))
+                {
+                    await JS.InvokeVoidAsync("alert", "Position updated successfully");
+                }
+            }
+            else
+            {
+                position.Id = await Repository.InsertPositionAsync(position);
+                isEdit = true;
+                await JS.InvokeVoidAsync("alert", "Position added successfully");
+            }
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to save position. " + ex.Message;
+        }
+    }
+
+    private static string ToDateInputValue(DateTime? value) => value?.ToString("yyyy-MM-dd") ?? string.Empty;
+
+    private static DateTime? ParseDate(string value) =>
+        DateTime.TryParse(value, out var parsed) ? parsed.Date : null;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor
new file mode 100644
index 0000000000000000000000000000000000000000..efdcec61db320f36ea4b1bad176e604944be65e2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor
@@ -0,0 +1,88 @@
+@page "/positions"
+@page "/PositionsList"
+@page "/PositionsList.aspx"
+@rendermode InteractiveServer
+@using IRM.SPA.Models
+@using IRM.SPA.Services
+@inject IHiringRepository Repository
+
+<PageTitle>Positions - Hiring Tracker</PageTitle>
+
+@if (!string.IsNullOrWhiteSpace(errorMessage))
+{
+    <div class="alert alert-danger" role="alert">@errorMessage</div>
+}
+
+<form @onsubmit="ApplyFilter" @onsubmit:preventDefault>
+    <table class="legacy-table">
+        <thead>
+            <tr>
+                <th>Id</th>
+                <th>Name</th>
+                <th>Description</th>
+                <th>Start Date</th>
+                <th>Deadline</th>
+                <th>Position Closed</th>
+                <th>Client Contact</th>
+                <th></th>
+            </tr>
+            <tr>
+                <th><input type="text" @bind="filter.Id" /></th>
+                <th><input type="text" @bind="filter.Name" /></th>
+                <th><input type="text" @bind="filter.Description" /></th>
+                <th><input type="text" @bind="filter.StartDate" /></th>
+                <th><input type="text" @bind="filter.Deadline" /></th>
+                <th></th>
+                <th><input type="text" @bind="filter.ClientContact" /></th>
+                <th><button type="submit">Filter</button></th>
+            </tr>
+        </thead>
+        <tbody>
+            @foreach (var position in positions)
+            {
+                <tr>
+                    <td>@position.Id</td>
+                    <td>@position.Name</td>
+                    <td>@position.Description</td>
+                    <td>@position.StartDate</td>
+                    <td>@position.Deadline</td>
+                    <td>@position.Hired</td>
+                    <td>@position.ClientName (@position.ClientContactName)</td>
+                    <td><a href="positions/@position.Id">Details</a></td>
+                </tr>
+            }
+        </tbody>
+    </table>
+</form>
+
+<a href="positions/new">Add new position</a>
+
+@code {
+    private readonly PositionFilter filter = new();
+    private IReadOnlyList<Position> positions = [];
+    private string? errorMessage;
+
+    protected override async Task OnInitializedAsync()
+    {
+        await LoadPositionsAsync();
+    }
+
+    private async Task ApplyFilter()
+    {
+        await LoadPositionsAsync();
+    }
+
+    private async Task LoadPositionsAsync()
+    {
+        try
+        {
+            errorMessage = null;
+            positions = await Repository.GetPositionsAsync(filter);
+        }
+        catch (Exception ex)
+        {
+            errorMessage = "Unable to load positions. " + ex.Message;
+            positions = [];
+        }
+    }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Components/Pages/Weather.razor b/LegacyOutput/src/IRM.SPA/Components/Pages/Weather.razor
deleted file mode 100644
index 33631ab7afce233f173a24f29b551f45e506ce4a..0000000000000000000000000000000000000000
--- a/LegacyOutput/src/IRM.SPA/Components/Pages/Weather.razor
+++ /dev/null
@@ -1,64 +0,0 @@
-﻿@page "/weather"
-@attribute [StreamRendering]
-
-<PageTitle>Weather</PageTitle>
-
-<h1>Weather</h1>
-
-<p>This component demonstrates showing data.</p>
-
-@if (forecasts == null)
-{
-    <p><em>Loading...</em></p>
-}
-else
-{
-    <table class="table">
-        <thead>
-            <tr>
-                <th>Date</th>
-                <th>Temp. (C)</th>
-                <th>Temp. (F)</th>
-                <th>Summary</th>
-            </tr>
-        </thead>
-        <tbody>
-            @foreach (var forecast in forecasts)
-            {
-                <tr>
-                    <td>@forecast.Date.ToShortDateString()</td>
-                    <td>@forecast.TemperatureC</td>
-                    <td>@forecast.TemperatureF</td>
-                    <td>@forecast.Summary</td>
-                </tr>
-            }
-        </tbody>
-    </table>
-}
-
-@code {
-    private WeatherForecast[]? forecasts;
-
-    protected override async Task OnInitializedAsync()
-    {
-        // Simulate asynchronous loading to demonstrate streaming rendering
-        await Task.Delay(500);
-
-        var startDate = DateOnly.FromDateTime(DateTime.Now);
-        var summaries = new[] { "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching" };
-        forecasts = Enumerable.Range(1, 5).Select(index => new WeatherForecast
-        {
-            Date = startDate.AddDays(index),
-            TemperatureC = Random.Shared.Next(-20, 55),
-            Summary = summaries[Random.Shared.Next(summaries.Length)]
-        }).ToArray();
-    }
-
-    private class WeatherForecast
-    {
-        public DateOnly Date { get; set; }
-        public int TemperatureC { get; set; }
-        public string? Summary { get; set; }
-        public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
-    }
-}
diff --git a/LegacyOutput/src/IRM.SPA/Components/_Imports.razor b/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
index de2621323fafca41583fecc7d1b4b181a1e49ac1..4ca0297300bf206b5f4f4e3af4a8adffd1865970
--- a/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
+++ b/LegacyOutput/src/IRM.SPA/Components/_Imports.razor
@@ -5,6 +5,8 @@
 @using Microsoft.AspNetCore.Components.Web
 @using static Microsoft.AspNetCore.Components.Web.RenderMode
 @using Microsoft.AspNetCore.Components.Web.Virtualization
-@using Microsoft.JSInterop
-@using IRM.SPA
-@using IRM.SPA.Components
+@using Microsoft.JSInterop
+@using IRM.SPA
+@using IRM.SPA.Components
+@using IRM.SPA.Models
+@using IRM.SPA.Services
diff --git a/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs b/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
index 8a7b20c19addfd182712b09a487081eda45d085a..a1e19750167d74ae38221cb933beb102768676d5
--- a/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
+++ b/LegacyOutput/src/IRM.SPA/DI/DependancyInjector.cs
@@ -13,13 +13,14 @@
 {
     public static class DependancyInjector
     {
-        public static void RegisterServices(IServiceCollection services, ConfigurationOptions config)
-        {
-           
-
-            RegisterApiClients(services, config);           
-            RegisterModelValidators(services);
-        }
+        public static void RegisterServices(IServiceCollection services, ConfigurationOptions config)
+        {
+           
+
+            services.AddScoped<IHiringRepository, HiringRepository>();
+            RegisterApiClients(services, config);           
+            RegisterModelValidators(services);
+        }
        
         private static void RegisterModelValidators(IServiceCollection services)
         {
diff --git a/LegacyOutput/src/IRM.SPA/Models/Client.cs b/LegacyOutput/src/IRM.SPA/Models/Client.cs
new file mode 100644
index 0000000000000000000000000000000000000000..46bfecbc332bde56ebed47d21516d9a9c7773d42
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Client.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class Client
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Phone { get; set; } = string.Empty;
+    public string Email { get; set; } = string.Empty;
+    public string ContactName { get; set; } = string.Empty;
+    public string Website { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..d59d0bb30c1802c64fa28e40d6a449e156739081
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/ClientFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class ClientFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Phone { get; set; }
+    public string? Email { get; set; }
+    public string? Website { get; set; }
+    public string? ContactName { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/Position.cs b/LegacyOutput/src/IRM.SPA/Models/Position.cs
new file mode 100644
index 0000000000000000000000000000000000000000..a6f9543eebd29c5626ed28741e6b4065ad3d16cf
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/Position.cs
@@ -0,0 +1,16 @@
+namespace IRM.SPA.Models;
+
+public sealed class Position
+{
+    public int Id { get; set; }
+    public string Name { get; set; } = string.Empty;
+    public string Description { get; set; } = string.Empty;
+    public DateTime? StartDate { get; set; }
+    public DateTime? Deadline { get; set; }
+    public bool Hired { get; set; }
+    public int? IdClient { get; set; }
+    public string ClientName { get; set; } = string.Empty;
+    public string ClientContactName { get; set; } = string.Empty;
+    public string ClientContactPhone { get; set; } = string.Empty;
+    public string ClientContactEmail { get; set; } = string.Empty;
+}
diff --git a/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
new file mode 100644
index 0000000000000000000000000000000000000000..cfa76e79d96580b7b4d98e9b476807ef6f12acb5
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Models/PositionFilter.cs
@@ -0,0 +1,11 @@
+namespace IRM.SPA.Models;
+
+public sealed class PositionFilter
+{
+    public string? Id { get; set; }
+    public string? Name { get; set; }
+    public string? Description { get; set; }
+    public string? StartDate { get; set; }
+    public string? Deadline { get; set; }
+    public string? ClientContact { get; set; }
+}
diff --git a/LegacyOutput/src/IRM.SPA/Program.cs b/LegacyOutput/src/IRM.SPA/Program.cs
index 00184fc283cd7060825796fd98e55be1c243edd6..2008eaa884f07089ce5823fe41c6a6336a34f709
--- a/LegacyOutput/src/IRM.SPA/Program.cs
+++ b/LegacyOutput/src/IRM.SPA/Program.cs
@@ -10,8 +10,9 @@
     {
         public static void Main(string[] args)
         {
-            var builder = WebApplication.CreateBuilder(args);
-            ConfigurationOptions config = builder.Configuration.Get<ConfigurationOptions>() ?? new ConfigurationOptions();
+            var builder = WebApplication.CreateBuilder(args);
+            AppDomain.CurrentDomain.SetData("DataDirectory", Path.Combine(builder.Environment.ContentRootPath, "App_Data"));
+            ConfigurationOptions config = builder.Configuration.Get<ConfigurationOptions>() ?? new ConfigurationOptions();
             // Add services to the container.
             builder.Services.AddRazorComponents()
                 .AddInteractiveServerComponents();           
diff --git a/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..1c88253e59d707a339e900e3d8c1a8b2d56950d2
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs
@@ -0,0 +1,268 @@
+using System.Data;
+using IRM.SPA.Models;
+using Microsoft.Data.SqlClient;
+
+namespace IRM.SPA.Services;
+
+public sealed class HiringRepository(IConfiguration configuration) : IHiringRepository
+{
+    private readonly string _connectionString = configuration.GetConnectionString("HiringConnection")
+        ?? throw new InvalidOperationException("ConnectionStrings:HiringConnection is not configured.");
+
+    public async Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Name", filter.Name);
+        AddLike(where, parameters, "Phone", filter.Phone);
+        AddLike(where, parameters, "Email", filter.Email);
+        AddLike(where, parameters, "Website", filter.Website);
+        AddLike(where, parameters, "ContactName", filter.ContactName);
+
+        var sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients";
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var clients = new List<Client>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            clients.Add(ReadClient(reader));
+        }
+
+        return clients;
+    }
+
+    public async Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = "SELECT Id, Name, Phone, Email, ContactName, Website FROM Clients WHERE Id = @Id";
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadClient(reader) : null;
+    }
+
+    public async Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Clients (Name, Phone, Email, ContactName, Website)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Phone, @Email, @ContactName, @Website)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Clients
+            SET Name = @Name, Phone = @Phone, Email = @Email, ContactName = @ContactName, Website = @Website
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddClientParameters(command, client);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = client.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    public async Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default)
+    {
+        var where = new List<string>();
+        var parameters = new List<SqlParameter>();
+
+        if (int.TryParse(filter.Id, out var id))
+        {
+            where.Add("Positions.Id = @Id");
+            parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
+        }
+
+        AddLike(where, parameters, "Positions.Name", filter.Name, "@Name");
+        AddLike(where, parameters, "Positions.Description", filter.Description, "@Description");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.StartDate, 120)", filter.StartDate, "@StartDate");
+        AddLike(where, parameters, "CONVERT(varchar(10), Positions.Deadline, 120)", filter.Deadline, "@Deadline");
+        AddLike(where, parameters, "Positions.ClientContactName", filter.ClientContact, "@ClientContact");
+
+        var sql = """
+            SELECT Positions.Id, Positions.Name, Positions.Description, Positions.StartDate, Positions.Deadline,
+                   Positions.Hired, Positions.IdClient, Positions.ClientContactName, Positions.ClientContactPhone,
+                   Positions.ClientContactEmail, Clients.Name AS ClientName
+            FROM Positions
+            LEFT JOIN Clients ON Positions.IdClient = Clients.Id
+            """;
+
+        if (where.Count > 0)
+        {
+            sql += " WHERE " + string.Join(" AND ", where);
+        }
+
+        sql += " ORDER BY Positions.Id";
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.AddRange(parameters.ToArray());
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+
+        var positions = new List<Position>();
+        while (await reader.ReadAsync(cancellationToken))
+        {
+            positions.Add(ReadPosition(reader, includeClientName: true));
+        }
+
+        return positions;
+    }
+
+    public async Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            SELECT Id, Name, Description, StartDate, Deadline, Hired, IdClient,
+                   ClientContactName, ClientContactPhone, ClientContactEmail
+            FROM Positions
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
+        await connection.OpenAsync(cancellationToken);
+        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
+        return await reader.ReadAsync(cancellationToken) ? ReadPosition(reader, includeClientName: false) : null;
+    }
+
+    public async Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            INSERT INTO Positions (Name, Description, StartDate, Deadline, Hired, ClientContactName,
+                                   ClientContactPhone, ClientContactEmail, IdClient)
+            OUTPUT INSERTED.ID
+            VALUES (@Name, @Description, @StartDate, @Deadline, @Hired, @ClientContactName,
+                    @ClientContactPhone, @ClientContactEmail, @IdClient)
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        await connection.OpenAsync(cancellationToken);
+        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
+    }
+
+    public async Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default)
+    {
+        const string sql = """
+            UPDATE Positions
+            SET Name = @Name, Description = @Description, StartDate = @StartDate, Deadline = @Deadline,
+                Hired = @Hired, ClientContactName = @ClientContactName, ClientContactPhone = @ClientContactPhone,
+                ClientContactEmail = @ClientContactEmail, IdClient = @IdClient
+            WHERE Id = @Id
+            """;
+
+        await using var connection = CreateConnection();
+        await using var command = new SqlCommand(sql, connection);
+        AddPositionParameters(command, position, includeClient: true);
+        command.Parameters.Add("@Id", SqlDbType.Int).Value = position.Id;
+        await connection.OpenAsync(cancellationToken);
+        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
+    }
+
+    private SqlConnection CreateConnection() => new(_connectionString);
+
+    private static void AddClientParameters(SqlCommand command, Client client)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = client.Name;
+        command.Parameters.Add("@Phone", SqlDbType.VarChar).Value = client.Phone;
+        command.Parameters.Add("@Email", SqlDbType.VarChar).Value = client.Email;
+        command.Parameters.Add("@ContactName", SqlDbType.VarChar).Value = client.ContactName;
+        command.Parameters.Add("@Website", SqlDbType.VarChar).Value = client.Website;
+    }
+
+    private static void AddPositionParameters(SqlCommand command, Position position, bool includeClient)
+    {
+        command.Parameters.Add("@Name", SqlDbType.VarChar).Value = position.Name;
+        command.Parameters.Add("@Description", SqlDbType.VarChar).Value = position.Description;
+        command.Parameters.Add("@StartDate", SqlDbType.Date).Value = (object?)position.StartDate ?? DBNull.Value;
+        command.Parameters.Add("@Deadline", SqlDbType.Date).Value = (object?)position.Deadline ?? DBNull.Value;
+        command.Parameters.Add("@Hired", SqlDbType.Bit).Value = position.Hired;
+        command.Parameters.Add("@ClientContactName", SqlDbType.VarChar).Value = position.ClientContactName;
+        command.Parameters.Add("@ClientContactPhone", SqlDbType.VarChar).Value = position.ClientContactPhone;
+        command.Parameters.Add("@ClientContactEmail", SqlDbType.VarChar).Value = position.ClientContactEmail;
+        if (includeClient)
+        {
+            command.Parameters.Add("@IdClient", SqlDbType.Int).Value = (object?)position.IdClient ?? DBNull.Value;
+        }
+    }
+
+    private static void AddLike(List<string> where, List<SqlParameter> parameters, string column, string? value, string? parameterName = null)
+    {
+        if (string.IsNullOrWhiteSpace(value))
+        {
+            return;
+        }
+
+        parameterName ??= "@" + column.Replace(".", string.Empty);
+        where.Add($"{column} LIKE {parameterName}");
+        parameters.Add(new SqlParameter(parameterName, SqlDbType.VarChar) { Value = "%" + value.Trim() + "%" });
+    }
+
+    private static Client ReadClient(SqlDataReader reader) => new()
+    {
+        Id = reader.GetInt32(0),
+        Name = GetString(reader, 1),
+        Phone = GetString(reader, 2),
+        Email = GetString(reader, 3),
+        ContactName = GetString(reader, 4),
+        Website = GetString(reader, 5)
+    };
+
+    private static Position ReadPosition(SqlDataReader reader, bool includeClientName)
+    {
+        var position = new Position
+        {
+            Id = reader.GetInt32(0),
+            Name = GetString(reader, 1),
+            Description = GetString(reader, 2),
+            StartDate = reader.IsDBNull(3) ? null : reader.GetDateTime(3),
+            Deadline = reader.IsDBNull(4) ? null : reader.GetDateTime(4),
+            Hired = !reader.IsDBNull(5) && reader.GetBoolean(5),
+            IdClient = reader.IsDBNull(6) ? null : reader.GetInt32(6),
+            ClientContactName = GetString(reader, 7),
+            ClientContactPhone = GetString(reader, 8),
+            ClientContactEmail = GetString(reader, 9)
+        };
+
+        if (includeClientName)
+        {
+            position.ClientName = GetString(reader, 10);
+        }
+
+        return position;
+    }
+
+    private static string GetString(SqlDataReader reader, int ordinal) =>
+        reader.IsDBNull(ordinal) ? string.Empty : reader.GetString(ordinal);
+}
diff --git a/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
new file mode 100644
index 0000000000000000000000000000000000000000..468316298ba01ef622db9ffeeb20a3df775fc996
--- /dev/null
+++ b/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs
@@ -0,0 +1,15 @@
+using IRM.SPA.Models;
+
+namespace IRM.SPA.Services;
+
+public interface IHiringRepository
+{
+    Task<IReadOnlyList<Client>> GetClientsAsync(ClientFilter filter, CancellationToken cancellationToken = default);
+    Task<Client?> GetClientAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<bool> UpdateClientAsync(Client client, CancellationToken cancellationToken = default);
+    Task<IReadOnlyList<Position>> GetPositionsAsync(PositionFilter filter, CancellationToken cancellationToken = default);
+    Task<Position?> GetPositionAsync(int id, CancellationToken cancellationToken = default);
+    Task<int> InsertPositionAsync(Position position, CancellationToken cancellationToken = default);
+    Task<bool> UpdatePositionAsync(Position position, CancellationToken cancellationToken = default);
+}
diff --git a/LegacyOutput/src/IRM.SPA/wwwroot/app.css b/LegacyOutput/src/IRM.SPA/wwwroot/app.css
index 7ac30e2a8df7ef2e3f233e331d1d58ca449099d8..c4e3f519ac693dd5c0ee569dc7dae70aa51945dc
--- a/LegacyOutput/src/IRM.SPA/wwwroot/app.css
+++ b/LegacyOutput/src/IRM.SPA/wwwroot/app.css
@@ -1,51 +1,247 @@
-html, body {
-    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
-}
-
-a, .btn-link {
-    color: #006bb7;
-}
-
-.btn-primary {
-    color: #fff;
-    background-color: #1b6ec2;
-    border-color: #1861ac;
-}
-
-.btn:focus, .btn:active:focus, .btn-link.nav-link:focus, .form-control:focus, .form-check-input:focus {
-  box-shadow: 0 0 0 0.1rem white, 0 0 0 0.25rem #258cfb;
-}
-
-.content {
-    padding-top: 1.1rem;
-}
-
-h1:focus {
-    outline: none;
-}
-
-.valid.modified:not([type=checkbox]) {
-    outline: 1px solid #26b050;
-}
-
-.invalid {
-    outline: 1px solid #e50000;
-}
-
-.validation-message {
-    color: #e50000;
-}
-
-.blazor-error-boundary {
-    background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNDkiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIG92ZXJmbG93PSJoaWRkZW4iPjxkZWZzPjxjbGlwUGF0aCBpZD0iY2xpcDAiPjxyZWN0IHg9IjIzNSIgeT0iNTEiIHdpZHRoPSI1NiIgaGVpZ2h0PSI0OSIvPjwvY2xpcFBhdGg+PC9kZWZzPjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMCkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yMzUgLTUxKSI+PHBhdGggZD0iTTI2My41MDYgNTFDMjY0LjcxNyA1MSAyNjUuODEzIDUxLjQ4MzcgMjY2LjYwNiA1Mi4yNjU4TDI2Ny4wNTIgNTIuNzk4NyAyNjcuNTM5IDUzLjYyODMgMjkwLjE4NSA5Mi4xODMxIDI5MC41NDUgOTIuNzk1IDI5MC42NTYgOTIuOTk2QzI5MC44NzcgOTMuNTEzIDI5MSA5NC4wODE1IDI5MSA5NC42NzgyIDI5MSA5Ny4wNjUxIDI4OS4wMzggOTkgMjg2LjYxNyA5OUwyNDAuMzgzIDk5QzIzNy45NjMgOTkgMjM2IDk3LjA2NTEgMjM2IDk0LjY3ODIgMjM2IDk0LjM3OTkgMjM2LjAzMSA5NC4wODg2IDIzNi4wODkgOTMuODA3MkwyMzYuMzM4IDkzLjAxNjIgMjM2Ljg1OCA5Mi4xMzE0IDI1OS40NzMgNTMuNjI5NCAyNTkuOTYxIDUyLjc5ODUgMjYwLjQwNyA1Mi4yNjU4QzI2MS4yIDUxLjQ4MzcgMjYyLjI5NiA1MSAyNjMuNTA2IDUxWk0yNjMuNTg2IDY2LjAxODNDMjYwLjczNyA2Ni4wMTgzIDI1OS4zMTMgNjcuMTI0NSAyNTkuMzEzIDY5LjMzNyAyNTkuMzEzIDY5LjYxMDIgMjU5LjMzMiA2OS44NjA4IDI1OS4zNzEgNzAuMDg4N0wyNjEuNzk1IDg0LjAxNjEgMjY1LjM4IDg0LjAxNjEgMjY3LjgyMSA2OS43NDc1QzI2Ny44NiA2OS43MzA5IDI2Ny44NzkgNjkuNTg3NyAyNjcuODc5IDY5LjMxNzkgMjY3Ljg3OSA2Ny4xMTgyIDI2Ni40NDggNjYuMDE4MyAyNjMuNTg2IDY2LjAxODNaTTI2My41NzYgODYuMDU0N0MyNjEuMDQ5IDg2LjA1NDcgMjU5Ljc4NiA4Ny4zMDA1IDI1OS43ODYgODkuNzkyMSAyNTkuNzg2IDkyLjI4MzcgMjYxLjA0OSA5My41Mjk1IDI2My41NzYgOTMuNTI5NSAyNjYuMTE2IDkzLjUyOTUgMjY3LjM4NyA5Mi4yODM3IDI2Ny4zODcgODkuNzkyMSAyNjcuMzg3IDg3LjMwMDUgMjY2LjExNiA4Ni4wNTQ3IDI2My41NzYgODYuMDU0N1oiIGZpbGw9IiNGRkU1MDAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48L3N2Zz4=) no-repeat 1rem/1.8rem, #b32121;
-    padding: 1rem 1rem 1rem 3.7rem;
-    color: white;
-}
-
-    .blazor-error-boundary::after {
-        content: "An error has occurred."
-    }
-
-.darker-border-checkbox.form-check-input {
-    border-color: #929292;
-}
+html,
+body {
+    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
+}
+
+body {
+    padding-top: 50px;
+    padding-bottom: 20px;
+}
+
+.body-content {
+    padding-left: 15px;
+    padding-right: 15px;
+}
+
+.dl-horizontal dt {
+    white-space: normal;
+}
+
+input[type="text"],
+input[type="password"],
+input[type="email"],
+input[type="tel"],
+input[type="select"] {
+    max-width: 280px;
+}
+
+.jumbotron {
+    padding: 30px;
+    margin-bottom: 30px;
+    color: inherit;
+    background-color: #eee;
+    border-radius: 6px;
+}
+
+.jumbotron h1 {
+    font-size: 63px;
+}
+
+.lead {
+    margin-bottom: 20px;
+    font-size: 21px;
+    font-weight: 300;
+    line-height: 1.4;
+}
+
+.navbar-inverse {
+    background-color: #222;
+    border-color: #080808;
+}
+
+.navbar-fixed-top {
+    position: fixed;
+    right: 0;
+    left: 0;
+    z-index: 1030;
+    top: 0;
+    border-width: 0 0 1px;
+}
+
+.navbar {
+    min-height: 50px;
+    margin-bottom: 20px;
+    border: 1px solid transparent;
+}
+
+.navbar-header {
+    float: left;
+}
+
+.navbar-brand {
+    float: left;
+    height: 50px;
+    padding: 15px;
+    font-size: 18px;
+    line-height: 20px;
+}
+
+.navbar-inverse .navbar-brand,
+.navbar-inverse .navbar-nav > li > a {
+    color: #9d9d9d;
+}
+
+.navbar-inverse .navbar-brand:hover,
+.navbar-inverse .navbar-nav > li > a:hover,
+.navbar-inverse .navbar-nav > li > a.active {
+    color: #fff;
+    text-decoration: none;
+}
+
+.navbar-nav {
+    float: left;
+    margin: 0;
+}
+
+.nav > li {
+    position: relative;
+    display: block;
+}
+
+.navbar-nav > li {
+    float: left;
+}
+
+.nav > li > a {
+    position: relative;
+    display: block;
+    padding: 10px 15px;
+}
+
+.navbar-nav > li > a {
+    padding-top: 15px;
+    padding-bottom: 15px;
+    line-height: 20px;
+}
+
+.btn-default {
+    color: #333;
+    background-color: #fff;
+    border-color: #ccc;
+}
+
+.btn {
+    display: inline-block;
+    padding: 6px 12px;
+    margin-bottom: 0;
+    font-size: 14px;
+    font-weight: 400;
+    line-height: 1.42857143;
+    text-align: center;
+    white-space: nowrap;
+    vertical-align: middle;
+    cursor: pointer;
+    border: 1px solid transparent;
+    border-radius: 4px;
+}
+
+.formLabel {
+    display: inline-block;
+    width: 200px;
+}
+
+.legacy-table {
+    margin-top: 20px;
+    margin-bottom: 10px;
+    border-collapse: separate;
+    border-spacing: 2px;
+}
+
+.legacy-table th,
+.legacy-table td {
+    padding: 1px;
+    font-weight: normal;
+    text-align: left;
+    vertical-align: top;
+}
+
+.legacy-table th {
+    font-weight: bold;
+}
+
+.legacy-table input[type="text"] {
+    width: 130px;
+}
+
+.description-input {
+    width: 500px;
+    max-width: 100%;
+    vertical-align: top;
+}
+
+.link-button {
+    padding: 0;
+    color: #337ab7;
+    background: none;
+    border: 0;
+    cursor: pointer;
+    font: inherit;
+}
+
+.link-button:hover {
+    color: #23527c;
+    text-decoration: underline;
+}
+
+.alert {
+    padding: 15px;
+    margin-top: 20px;
+    margin-bottom: 20px;
+    border: 1px solid transparent;
+    border-radius: 4px;
+}
+
+.alert-danger {
+    color: #a94442;
+    background-color: #f2dede;
+    border-color: #ebccd1;
+}
+
+@media screen and (min-width: 768px) {
+    .jumbotron {
+        margin-top: 20px;
+    }
+
+    .body-content {
+        padding: 0;
+    }
+}
+
+@media screen and (max-width: 767px) {
+    .navbar-header,
+    .navbar-nav,
+    .navbar-nav > li {
+        float: none;
+    }
+
+    .navbar-fixed-top {
+        position: static;
+    }
+
+    body {
+        padding-top: 0;
+    }
+
+    .jumbotron h1 {
+        font-size: 42px;
+    }
+}
+
+#blazor-error-ui {
+    background: lightyellow;
+    bottom: 0;
+    box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.2);
+    display: none;
+    left: 0;
+    padding: 0.6rem 1.25rem 0.7rem 1.25rem;
+    position: fixed;
+    width: 100%;
+    z-index: 1000;
+}
+
+#blazor-error-ui .dismiss {
+    cursor: pointer;
+    position: absolute;
+    right: 0.75rem;
+    top: 0.5rem;
+}

tokens used
53,445
Implemented the WebForms-to-Blazor SSR migration under `src/IRM.SPA`.

Changed:
- Replaced starter home/nav with the Hiring Tracker UI from `Site.Master` and `Default.aspx`.
- Added migrated pages:
  - [Home.razor](D:/Projects/AI/AiMigration/LegacyOutput/src/IRM.SPA/Components/Pages/Home.razor)
  - [ClientsList.razor](D:/Projects/AI/AiMigration/LegacyOutput/src/IRM.SPA/Components/Pages/ClientsList.razor)
  - [ClientDetails.razor](D:/Projects/AI/AiMigration/LegacyOutput/src/IRM.SPA/Components/Pages/ClientDetails.razor)
  - [PositionsList.razor](D:/Projects/AI/AiMigration/LegacyOutput/src/IRM.SPA/Components/Pages/PositionsList.razor)
  - [PositionDetails.razor](D:/Projects/AI/AiMigration/LegacyOutput/src/IRM.SPA/Components/Pages/PositionDetails.razor)
- Added parameterized SQL data access:
  - [HiringRepository.cs](D:/Projects/AI/AiMigration/LegacyOutput/src/IRM.SPA/Services/HiringRepository.cs)
  - [IHiringRepository.cs](D:/Projects/AI/AiMigration/LegacyOutput/src/IRM.SPA/Services/IHiringRepository.cs)
  - model/filter classes under [Models](D:/Projects/AI/AiMigration/LegacyOutput/src/IRM.SPA/Models)
- Registered the repository in DI and set `DataDirectory` for the copied LocalDB files.
- Copied `HiringDb.mdf` and `HiringDb_log.ldf` into [App_Data](D:/Projects/AI/AiMigration/LegacyOutput/src/IRM.SPA/App_Data).
- Removed routeable starter `Counter` and `Weather` pages.

Verification:
- `dotnet build IRM.SPA.csproj` passes with `0` warnings and `0` errors.

Behavior notes:
- Session-based record selection is replaced with routes like `/clients/5`, `/clients/new`, `/positions/5`, `/positions/new`.
- Legacy `.aspx` list/detail routes are preserved as aliases where possible.
- Client filters and all visible position filters now use parameterized SQL.
- Position edit now persists the selected client, matching the visible UI rather than the legacy update bug.
- Success alerts are preserved via browser `alert`, with the legacy typo corrected from `succesfully` to `successfully`.

dotnet restore exit=0
  Determining projects to restore...
  All projects are up-to-date for restore.

dotnet build exit=0
  IRM.SPA -> D:\Projects\AI\AiMigration\LegacyOutput\src\IRM.SPA\bin\Debug\net8.0\IRM.SPA.dll

Build succeeded.
    0 Warning(s)
    0 Error(s)

Time Elapsed 00:00:01.22

```
