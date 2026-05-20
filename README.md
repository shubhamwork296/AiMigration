# Q3 Migration Agent

Technology-independent migration tooling for framework/runtime upgrades. The current .NET port preserves the original Python tool's guarded migration model: project copies, rule-based planning, Angular sequential hops, AI CLI integration, rollback snapshots, command logging, timing summaries, and markdown reports.

## Architecture

- `Q3.MigrationAgent.Cli`: command-line entry point.
- `Q3.MigrationAgent.Api`: thin HTTP wrapper.
- `Q3.MigrationAgent.Business`: config loading and composition root.
- `Q3.MigrationAgent.Core`: orchestration, analysis, planning, execution, validation, reporting, rollback, commands, logs, timing, and progress.
- `Q3.MigrationAgent.Adapters`: runtime adapters for `.NET` and Angular plus package classification.
- `Q3.MigrationAgent.AI`: Codex and Claude CLI providers.
- `Q3.MigrationAgent.Rules`: JSON migration rules copied to output.
- `Q3.MigrationAgent.Shared`: config and DTO models.
- `Q3.MigrationAgent.Tests`: xUnit tests.

## Safety Model

- The source project is never modified directly.
- Migration output is written to `outputPath`.
- Generated folders such as `bin`, `obj`, `node_modules`, `dist`, and logs are excluded from copies.
- Rollback snapshots are created before execution.
- AI output is never executed directly; planner validators enforce structural files, allowed change types, rule/evidence-backed dependency changes, and downgrade/removal rejection.
- Source-code and business-logic changes are rejected except the existing narrowly recognized Angular Moment timezone import compatibility remediation path.

## Supported Migrations

- `.NET 6` to `.NET 8`: updates `TargetFramework` and selected Microsoft package references from rules.
- Angular 14 to 18: expands to sequential major-version hops and uses version-pinned `npx` Angular CLI commands.

## Commands

Restore and build:

```powershell
dotnet restore
dotnet build
```

Run tests:

```powershell
dotnet test
```

Run CLI:

```powershell
dotnet run --project src/Q3.MigrationAgent.Cli -- --config migrate.config.json
dotnet run --project src/Q3.MigrationAgent.Cli -- migrate --config migrate.config.json
```

Run API:

```powershell
dotnet run --project src/Q3.MigrationAgent.Api
```

API endpoint:

```http
POST /api/migration/run
Content-Type: application/json

{
  "configPath": "D:\\Projects\\AI\\AiMigration\\migrate.config.json"
}
```

Publish CLI:

```powershell
dotnet publish src/Q3.MigrationAgent.Cli -c Release -o publish/migration-agent
publish/migration-agent/Q3.MigrationAgent.Cli.exe --config migrate.config.json
```

## Config

Use `migrate.config.example.json` as a reference. The runtime config itself should be a single migration object, for example the `dotnetExample` or `angularExample` object from that file copied into `migrate.config.json`.

Important fields:

- `projectPath`
- `from.runtime`, `from.version`
- `to.runtime`, `to.version`
- `outputPath`
- `dryRun`
- `autoApprove`
- `useAi`, `aiCli`, `aiProvider`, `aiMode`, `aiCliCommand`
- `rollbackMode`
- `verbosity`
- Angular dependency/remediation options

Legacy `runtime`, `currentVersion`, and `targetVersion` fields are still supported.

## AI Usage

AI support is CLI-based and supports:

- Codex CLI
- Claude CLI

`aiCli: "auto"` prefers Codex when available, then Claude. `aiCli: "none"` disables AI. Missing AI CLIs cause deterministic fallback during provider resolution.

## Adding a Runtime Adapter

1. Implement `IMigrationAdapter`.
2. Keep runtime-specific logic inside `Q3.MigrationAgent.Adapters/<Runtime>`.
3. Add the adapter to `MigrationAgentServices.Create`.
4. Add rules under `Q3.MigrationAgent.Rules/<runtime>/<from>-to-<to>.json`.
5. Add tests for detection, manifest parsing, planning, execution, validation, and reports.

## Known Limitations

- Angular parity is ported structurally, but the Python adapter's very large remediation surface was condensed into a maintainable .NET implementation and should be expanded with more behavioral tests before production use.
- Direct API-key AI providers are intentionally not implemented; current behavior is CLI-only.
- Full solution restore may need NuGet network access for xUnit packages.

