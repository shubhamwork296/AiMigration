# Q3 Modernization Engine

This separate application is the starting point for migrating a legacy application, such as ASPX/Web Forms, into a target architecture that you provide later.

Current responsibilities:

- Accept a legacy source application path.
- Accept an output directory for modernization artifacts.
- Accept a path to the target architecture reference.
- Discover ASPX/ASCX/master pages, code-behind files, and config files.
- Record basic dependency and risk signals such as session, viewstate, forms auth, and System.Web usage.
- Build a graph-style projection of artifacts, modules, and dependency links for smaller AI planning context.
- Analyze the provided target architecture folder and infer placement hints.
- Segregate the migration plan into two tracks: `Blazor` for UI-facing units and `BusinessLogic` for reusable logic/config/supporting code.
- Produce `inventory.json`, `migration-units.json`, `legacy-graph.json`, `migration-status.json`, `target-architecture.json`, `workspace-plan.json`, `guardrails.txt`, `modernization-report.md`, and `docs/modules/*`.

Current command:

```powershell
dotnet run --project src/LegacyAppConversion/Q3.ModernizationEngine.Cli -- --source C:\LegacyApp --output C:\ModernizationOutput --architecture C:\TargetArchitecture --target-mode blazor-and-api --use-ai --ai-provider codex
```

Generic selection and phased execution:

```powershell
dotnet run --project src/LegacyAppConversion/Q3.ModernizationEngine.Cli -- --source C:\LegacyApp --output C:\ModernizationOutput --architecture C:\TargetArchitecture --list-modules
dotnet run --project src/LegacyAppConversion/Q3.ModernizationEngine.Cli -- --source C:\LegacyApp --output C:\ModernizationOutput --architecture C:\TargetArchitecture --module DCM --phase api --use-ai --ai-provider codex
dotnet run --project src/LegacyAppConversion/Q3.ModernizationEngine.Cli -- --source C:\LegacyApp --output C:\ModernizationOutput --architecture C:\TargetArchitecture --module module_DCM --phase ui
```

Module selection is not hardcoded.
You can pass any discovered:

- module id
- module path
- module name

The engine matches the discovered module dynamically and expands required dependencies automatically.

Target modes:

- `blazor-only`
- `api-only`
- `blazor-and-api`

Execution phases:

- `full`: run the normal API + UI capable flow
- `api`: run API-first generation only
- `ui`: run UI-only generation using the selected module context

Current graphify-style outputs:

- `legacy-graph.json`: artifact nodes, module nodes, and dependency edges.
- `migration-status.json`: lightweight run/progress tracker inspired by phased migration workflows.
- `docs/module-index.md` and `docs/modules/*.md`: module cards for review before conversion.

Next extension points:

- Enrich graph edges with method/class call extraction.
- Add build validation and retry loops per migration unit.
- Add module selection mode so one chosen module can be migrated API-first, then UI.
