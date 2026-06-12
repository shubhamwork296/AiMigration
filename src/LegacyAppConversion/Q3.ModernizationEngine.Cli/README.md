# Q3 Modernization Engine

This separate application is the starting point for migrating a legacy application, such as ASPX/Web Forms, into a target architecture that you provide later.

Current responsibilities:

- Accept a legacy source application path.
- Accept an output directory for modernization artifacts.
- Accept a path to the target architecture reference.
- Discover ASPX/ASCX/master pages, code-behind files, and config files.
- Record basic dependency and risk signals such as session, viewstate, forms auth, and System.Web usage.
- Analyze the provided target architecture folder and infer placement hints.
- Segregate the migration plan into two tracks: `Blazor` for UI-facing units and `BusinessLogic` for reusable logic/config/supporting code.
- Produce `inventory.json`, `migration-units.json`, `target-architecture.json`, `workspace-plan.json`, `guardrails.txt`, and `modernization-report.md`.

Current command:

```powershell
dotnet run --project src/LegacyAppConversion/Q3.ModernizationEngine.Cli -- --source C:\LegacyApp --output C:\ModernizationOutput --architecture C:\TargetArchitecture --target-mode blazor-and-api --use-ai --ai-provider codex
```

Target modes:

- `blazor-only`
- `api-only`
- `blazor-and-api`

Next extension points:

- Add method/class dependency graphing.
- Add build validation and retry loops per migration unit.
- Add automatic generation into each planned workspace folder.
