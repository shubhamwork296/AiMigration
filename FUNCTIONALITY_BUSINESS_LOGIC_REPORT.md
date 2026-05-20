# AI Migration Agent - Functionality and Business Logic Report

Generated on: 2026-05-18

## 1. Executive Summary

This repository contains an adapter-based migration automation tool named `ai-migration-agent`. Its purpose is to migrate projects between supported framework/runtime versions while limiting changes to project structure, dependency manifests, build manifests, and framework migration commands. The tool is intentionally conservative: its default safety model avoids arbitrary source-code and business-logic edits.

The application currently supports two main runtime families:

- `.NET`, with rule-based support for `.NET 6` to `.NET 8`.
- Angular, with adapter-native sequential upgrade hops from Angular 14 through Angular 18.

The migration flow is driven by a JSON config file. The tool selects an adapter based on the configured runtime, analyzes the project manifest, builds or executes a migration plan, copies the source project to an output folder, applies changes to the copy, validates the migrated copy, creates reports, and preserves or restores rollback snapshots depending on configuration.

There are two distinct execution models:

- Rule-plan execution for structural migrations, mainly used by `.NET`.
- Adapter-native hop execution for Angular, where each major version upgrade is executed as a separate controlled hop using package manifest updates, install commands, Angular CLI migrate-only commands, validation, compatibility checks, and optional remediation.

## 2. Main Business Goal

The business goal is to reduce manual effort and risk during framework/runtime migration by automating predictable structural upgrade work while keeping application behavior intact.

The tool is designed around these business rules:

- Source projects should not be modified directly.
- Migration output should be written to a separate `outputPath`.
- Generated and dependency folders should not be copied into migration output or rollback snapshots.
- The tool should prefer deterministic rule-based changes when AI is unavailable or unsafe.
- AI may assist with analysis, classification, planning, dependency classification, and selected remediation, but AI output is validated before execution.
- Business logic should not be changed unless a narrowly defined safe remediation path is explicitly recognized.
- Build/install validation determines whether a migration result can be considered successful.

## 3. Configuration Functionality

Configuration is loaded by `migration_agent/cli/args.py`.

### 3.1 Supported Config Inputs

The config file supports:

- `projectPath`: source project directory.
- `from`: source runtime and version.
- `to`: target runtime and version.
- `outputPath`: migration output directory.
- `dryRun`: whether to only report planned actions.
- `autoApprove`: whether to skip interactive confirmation.
- `maxRetries`: retry count for validation repair attempts in rule-plan migrations.
- `useAi`, `aiCli`, `aiProvider`, `aiMode`, `aiCliCommand`, and `ai` section values.
- Angular dependency compatibility and remediation controls.
- Command timeout controls.
- Rollback behavior.
- Verbosity settings.

### 3.2 Defaulting Logic

The config parser supports both newer nested runtime specs and older flat-style keys:

- `from.runtime` and `from.version` are preferred.
- `to.runtime` and `to.version` are preferred.
- Legacy `runtime`, `currentVersion`, and `targetVersion` are still partially supported.
- If `outputPath` is missing, it defaults to `./output` relative to the config file.
- `dryRun` defaults to `false`.
- `autoApprove` defaults to `false`.
- `maxRetries` defaults to `1`.
- `verbosity` defaults to `default`.
- AI CLI defaults to `auto`.

### 3.3 Validation Logic

Configuration validation enforces:

- `projectPath` must exist.
- `projectPath` must be a directory.
- `outputPath` must differ from `projectPath`.
- Cross-runtime migrations are not supported.
- Retry counts must be zero or greater.
- Dependency compatibility policies must be in known allowed sets.
- Rollback mode must be `manual` or `auto`.
- AI provider must be `codex` or `claude` when specified.
- AI mode must be `auto` or `cli`.
- `aiCliCommand` must be a string or array of strings.

## 4. CLI Entry Point

The executable entry point is `migration_agent/__main__.py`.

Business logic:

- Load configuration with `load_config()`.
- Run the async migration orchestration with `run_migration(config)`.
- Return process code `0` on success.
- Return `130` on keyboard interruption.
- Return `1` on unhandled migration failure.

The package also exposes the console command:

```text
migration-agent
```

through `pyproject.toml`.

## 5. Adapter Architecture

Adapters implement runtime-specific migration behavior. The abstract contract is defined in `migration_agent/adapters/base.py`.

### 5.1 Adapter Contract

Each adapter must implement:

- `detect(project_path)`: determine whether a project can be handled.
- `parse_manifest(project_path)`: return structured project metadata.
- `upgrade_package(project_path, change)`: apply a dependency/package upgrade.
- `run_build(project_path)`: validate the migrated project.

Adapters may also implement:

- `collect_project_files(project_path)`: collect structural files for analysis.
- `expand_migration_hops(from_version, to_version)`: split migration into runtime-native hops.
- `execute_migration_hop(...)`: execute one adapter-native migration step.

### 5.2 Adapter Selection

Adapter selection happens in `migration_agent/adapters/__init__.py`.

Registered adapters:

- `DotnetAdapter`
- `AngularAdapter`

Business logic:

- The configured runtime chooses the adapter.
- The current `find_adapter()` implementation does not call `detect()` before returning a matching runtime adapter.
- Unknown runtimes are rejected.

## 6. Main Orchestration Flow

The main workflow is implemented in `migration_agent/core/agent.py`.

### 6.1 High-Level Flow

`run_migration(config)` performs:

1. Create a progress reporter.
2. Create a run log file under `outputPath`.
3. Resolve AI CLI if needed.
4. Select adapter by runtime.
5. Detect source version from manifest if config version is blank.
6. Ask adapter whether migration should be expanded into native hops.
7. If hops exist, delegate to Angular-style hop migration.
8. If no hops exist, load rules for `runtime/from-to`.
9. Parse manifest.
10. Analyze project.
11. Build migration plan.
12. Print plan summary.
13. If `dryRun`, write report only.
14. If not `autoApprove`, ask for confirmation.
15. Create rollback snapshot.
16. Execute changes on a copied project.
17. Validate migrated output.
18. Attempt dependency conflict repairs where supported.
19. Roll back automatically only when configured.
20. Write final markdown report.

### 6.2 Rule-Plan Business Logic

For non-hop migrations, changes are represented as plan items. Supported executable plan item types are:

- `framework`
- `runtime`
- `dependency`
- `package` for backward compatibility

The executor applies only those types. Other types are ignored by absence of handling.

### 6.3 Dry Run Logic

When `dryRun` is true:

- No project copy is executed.
- No package update is applied.
- No build is run.
- `outputPath` is created if necessary.
- `migration-report.md` is written with validation set to `passed: None` and output `Dry run only.`

## 7. .NET Migration Functionality

The `.NET` adapter is implemented in `migration_agent/adapters/dotnet.py`.

### 7.1 Detection

The adapter identifies a `.NET` project if the project tree contains:

- Any `*.csproj`
- Any `*.sln`

### 7.2 Manifest Parsing

The adapter scans all `*.csproj` files and returns:

- Runtime name.
- Project paths.
- Target frameworks from `TargetFramework` or `TargetFrameworks`.
- Package references from `PackageReference Include` or `PackageReference Update`.
- Package versions from either a `Version` attribute or nested `<Version>` element.

Malformed project XML is captured with:

- `parseError: true`
- raw file text

### 7.3 Structural File Collection

The adapter collects only structural/configuration files:

- `*.sln`
- `*.csproj`
- `Directory.Build.props`
- `Directory.Build.targets`
- `global.json`
- `NuGet.config`
- `appsettings*.json`

It skips `bin`, `obj`, and `.git` folders.

### 7.4 Package Upgrade Logic

Package upgrades:

- Search every `*.csproj`.
- Match `PackageReference` entries by package name.
- Replace versions in both attribute and nested element form.
- Normalize target versions ending in `.*` to `.0`.
- Return touched files.

### 7.5 Validation Logic

Validation runs:

```text
dotnet build <project_path> --disable-build-servers
```

If the .NET CLI is missing, validation fails with a clear message. After build execution, the adapter attempts:

```text
dotnet build-server shutdown
```

### 7.6 .NET 6 to .NET 8 Rules

The `.NET` rules are stored in `migration_agent/rules/dotnet/6-to-8.json`.

Executable rules:

- Change target framework from `net6.0` to `net8.0`.
- Upgrade selected Microsoft packages to `8.0.0`.

Current package rules include:

- `Microsoft.EntityFrameworkCore`
- `Microsoft.EntityFrameworkCore.SqlServer`
- `Microsoft.EntityFrameworkCore.Relational`
- `Microsoft.AspNetCore.Authentication.JwtBearer`
- `Microsoft.Extensions.Http`
- `Microsoft.Extensions.Hosting`
- `Microsoft.Extensions.Logging`

Informational rules:

- Deprecated API notes.
- Config change notes.

Those informational sections are not directly executed by the current planner/executor.

## 8. Angular Migration Functionality

The Angular adapter is implemented in `migration_agent/adapters/angular.py`.

It contains the most extensive business logic in the repository.

### 8.1 Angular Detection

The adapter identifies Angular projects by reading `package.json` and checking all dependencies for:

- `@angular/core`
- `@angular/cli`

### 8.2 Angular Manifest Parsing

The parsed manifest includes:

- Runtime.
- Angular major version.
- `@angular/core` version.
- `@angular/cli` version.
- Package manager.
- Lockfile.
- npm scripts.
- Whether `angular.json` exists.
- Whether `tsconfig.json` exists.
- Builder information.
- Dependency list.
- Project package metadata.

### 8.3 Package Manager Detection

The adapter detects package manager from lockfiles:

- `package-lock.json` means npm.
- `yarn.lock` means Yarn.
- `pnpm-lock.yaml` means pnpm.

The install command is selected from the detected package manager.

### 8.4 Sequential Hop Planning

Angular migration is split into one-major-version hops.

Example:

```text
14 -> 18
```

expands to:

```text
14 -> 15
15 -> 16
16 -> 17
17 -> 18
```

Business reason: Angular upgrades are intended to move through major versions sequentially rather than jumping directly.

### 8.5 Angular Rule Files

Angular rules are stored in:

- `migration_agent/rules/angular/14-to-15.json`
- `migration_agent/rules/angular/15-to-16.json`
- `migration_agent/rules/angular/16-to-17.json`
- `migration_agent/rules/angular/17-to-18.json`

Each rule declares:

- Source major.
- Target major.
- Preferred operation as Angular CLI update.
- Required package changes for `@angular/core` and `@angular/cli`.
- Validation command types.
- Known structural files.
- Optional migrations.

Angular 17 to 18 has an optional `use-application-builder` migration that is disabled by default.

### 8.6 Angular Hop Execution

Each hop executes roughly this process:

1. Parse manifest before the hop.
2. Capture structural file contents before changes.
3. Run preflight peer dependency compatibility analysis unless skipped.
4. Record peer blockers as advisory warnings in many cases.
5. Plan framework-critical updates such as TypeScript target compatibility.
6. Update Angular-related package entries in `package.json`.
7. Check compatibility for Node, TypeScript, and RxJS.
8. Resolve a stable target Angular CLI version.
9. Run package install.
10. Run Angular CLI migrate-only commands for relevant framework packages.
11. Run optional migrations if enabled.
12. Run validation commands.
13. Attempt targeted remediation for dependency or safe build issues where supported.
14. Return a structured hop result.

### 8.7 Angular Compatibility Model

The adapter has hardcoded compatibility metadata for Angular 15 through 18:

- Supported Node minimums.
- TypeScript minimum and maximum ranges.
- RxJS acceptable ranges.

Blocking compatibility checks include:

- Node version that does not satisfy the target Angular major.
- TypeScript version outside the allowed range.
- RxJS version outside the allowed range.

### 8.8 Angular Package Update Logic

Angular package updates are conservative:

- Official Angular framework packages are aligned to the target Angular version.
- Angular CLI and build tooling are handled separately.
- TypeScript is treated as framework-critical tooling and may be updated to a known compatible version.
- Third-party Angular libraries are treated as advisory unless install/build failures prove a concrete blocker.
- The adapter avoids unconstrained `latest` recommendations for framework-coupled packages.

### 8.9 Angular CLI Invocation Safety

Angular commands are intentionally version-pinned and avoid global CLI mutation.

The report states:

- Global Angular CLI is not modified.
- Angular CLI is invoked through version-pinned `npx`.
- Global install/update is not performed.

The adapter includes logic to:

- Add `--yes` to `npx` commands.
- Reject or correct malformed direct `npx @angular/cli@... ng update` invocation forms.
- Detect temporary Angular CLI version escape where Angular installs a temporary CLI major above the target.
- Skip migrate-only commands and proceed to validation in specific version-escape cases after install succeeded.

### 8.10 Preflight Dependency Compatibility

Preflight dependency compatibility examines dependency peer metadata from npm.

Business logic:

- Unknown compatibility does not stop migration.
- Third-party peer dependency warnings are advisory by default.
- Framework-owned Angular packages are not treated as manual third-party blockers.
- Package metadata lookup results are cached.
- Full patch-version scans are avoided where configured.
- Direct dependency-only checks are preferred by default.
- Timeouts produce warnings and allow migration to continue through advisory mode.

### 8.11 Dependency Classification

Dependency classification is implemented in `migration_agent/adapters/package_classifier.py`.

Packages are assigned roles such as:

- `framework-core`
- `framework-cli`
- `framework-compiler`
- `framework-extension`
- `framework-coupled-tooling`
- `third-party-framework-library`
- `runtime-critical`
- `build-tooling`
- `test-tooling`
- `unrelated-third-party`
- `unknown`

Recommended actions include:

- Upgrade with framework target.
- Upgrade with target major.
- Suggest compatible upgrade.
- Keep current.
- Warn only.
- Defer until failure.
- Investigate after install/build failure.

Safety rules:

- Unknown compatibility is not a blocker.
- Third-party framework package warnings are not blockers by default.
- Removal recommendations are downgraded to warnings unless explicitly confirmed.
- In suggest mode, AI cannot force third-party package mutation.
- Business logic changes are disabled by default.

### 8.12 Angular Remediation

The Angular adapter supports several remediation paths:

- Framework-critical package updates before Angular CLI execution.
- Peer dependency remediation after CLI or install failures.
- Optional fallback to npm `--legacy-peer-deps` mode.
- AI-assisted remediation after validation failure, subject to strict safety validation.

The narrow source-file remediation currently recognized is a Moment timezone import compatibility case:

- Triggered only during build validation failure.
- Looks for `Property 'tz' does not exist on type 'Moment'`.
- Updates TypeScript imports from `moment` to `moment-timezone` when `.tz(...)` is already used.
- Records changed lines and marks business/application source files for review.

This is an exception to the broader no-business-logic-edit policy. The implementation treats it as an import compatibility change with functional impact expected to be none.

### 8.13 Angular Validation

Validation commands are derived from package manager and scripts:

- Install command runs for the package manager.
- Build command runs when available.
- Test command is skipped if no test script is present.

Skipped validations are reported rather than treated as failures.

## 9. Analysis Functionality

Project analysis is implemented in `migration_agent/core/analyser.py`.

### 9.1 Structural Analysis

The analyzer collects structural files using the adapter when available. It builds a prompt for AI that explicitly forbids:

- Business logic modifications.
- Source-code edits.
- API replacements.
- Method changes.
- Class refactoring.
- Logic updates.

Allowed analysis categories:

- Runtime/framework upgrades.
- Dependency/package version upgrades.
- Project configuration updates.
- Build configuration changes.

### 9.2 Rule-Based Fallback

When AI is disabled or returns no result, `_rule_based_analysis()`:

- Reads target framework rules.
- Compares manifest target frameworks.
- Emits findings for projects that match the old framework.
- Sets risk to `low`.
- Sets confidence to `80`.
- Marks analysis mode as `rule-based`.

### 9.3 Normalization

Analysis normalization ensures the report always has:

- `from`
- `to`
- `findings`
- `riskLevel`
- `confidence`

## 10. Planning Functionality

Planning is implemented in `migration_agent/core/planner.py`.

### 10.1 Deterministic Plan Generation

`build_change_plan()`:

- Normalizes `packageChanges` into `dependencyChanges`.
- Classifies project structure.
- Finds structural files allowed for framework changes.
- Adds framework replacement changes where allowed.
- Adds dependency upgrades listed by rules when present in the manifest.
- Filters dependency changes if the package is not present.
- Sorts by priority and type.

### 10.2 AI Structure Classification

The planner can ask AI to classify project files by role. The deterministic validator then normalizes and constrains that result.

Accepted structural roles include:

- `project_manifest`
- `dependency_manifest`
- `build_manifest`
- `solution_manifest`
- `lock_file`

Blocked roles include:

- `source_code`
- `business_logic`
- `configuration`
- `generated_file`
- `unknown`

Lock files can only be targeted for `regenerate_lock_file`, not direct framework or dependency replacements.

### 10.3 AI Planning Guardrails

AI plans are validated before execution.

Framework changes must:

- Match `targetFrameworkChange` exactly.
- Target an allowed structural file.

Runtime changes must:

- Match `targetRuntimeChange` exactly.
- Target an allowed structural file.

Dependency changes must:

- Target a manifest dependency.
- Use action `upgrade`.
- Have a safe concrete target version.
- Avoid obvious downgrades or no-op changes unless validation proves necessity.
- Have acceptable evidence.
- Target an allowed structural file.

The planner rejects:

- Invalid plan shapes.
- Source-code edits.
- Business-logic edits.
- Package removals without explicit rule support.
- Package downgrades.
- Packages absent from the manifest.
- Unsafe target versions such as wildcard or blank versions.

### 10.4 AI-Inferred Dependency Upgrades

The planner can accept AI-inferred dependency upgrades when they are:

- Already installed in the manifest.
- Supported by evidence such as manifest, dependency-family, target-framework, validation, restore/build error, or NU1605.
- Not an obvious downgrade.
- In an allowed structural file.

This supports related package-family upgrades without allowing arbitrary new dependencies.

### 10.5 Validation Repair Planning

The planner can parse `.NET` NU1605 package downgrade errors and produce safe dependency repair items when:

- AI confirms a safe repair plan.
- The package is present.
- The upgrade is concrete and evidence-backed.
- The target does not violate safety constraints.

## 11. Execution Functionality

Execution is implemented in `migration_agent/core/executor.py`.

### 11.1 Project Copy

Before applying plan changes, the executor copies the source project to the output directory. If the output directory exists, it is removed first.

Ignored copy patterns:

- `bin`
- `obj`
- `.git`
- `.vs`
- `node_modules`
- `.angular`
- `dist`
- `build`
- `coverage`
- `.cache`
- `.nx`
- `tmp`
- `temp`
- `*.log`

### 11.2 Framework and Runtime Changes

For `framework` and `runtime` plan items:

- The executor finds files by the planned pattern.
- Reads UTF-8 text files.
- Replaces all occurrences of `find` with `replace`.
- Skips binary or undecodable files.
- Returns touched file paths.

### 11.3 Dependency and Package Changes

For `dependency` and `package` plan items:

- Execution delegates to the selected adapter's `upgrade_package()`.

### 11.4 Result Model

Each change returns:

- `done` if files were touched.
- `skipped` if no files changed.
- `failed` with error text if an exception occurred.

## 12. Validation Functionality

Validation is implemented in `migration_agent/core/validator.py`.

Business logic:

- Call `adapter.run_build(output_path)`.
- If build fails, return `passed: false`, build output under `errors`, and a suggestion to review output and add explicit transform rules for required source changes.
- If build succeeds, return `passed: true` and validation output.

Validation is adapter-specific:

- `.NET` uses `dotnet build`.
- Angular runs install/build/test-if-present behavior through its adapter.

## 13. Rollback Functionality

Rollback is implemented in `migration_agent/core/rollback.py`.

### 13.1 Snapshot Creation

Before non-dry-run execution:

- A snapshot is created under a sibling `rollback` folder.
- Snapshot folder name is the current Unix timestamp.
- Generated/dependency folders are ignored with the same copy ignore rules.

### 13.2 Restore Logic

Restore behavior:

- Remove the target output path with retry handling.
- Copy the snapshot back to the target path with retry handling.
- Retry logic is designed to handle common Windows file-lock behavior.

### 13.3 Rollback Mode

If validation fails:

- `rollbackMode: auto` attempts to restore output from snapshot.
- `rollbackMode: manual` preserves output for inspection and prints snapshot details.

## 14. Reporting Functionality

Reporting is implemented in `migration_agent/core/reporter.py`.

### 14.1 Standard Migration Report

For rule-plan migrations, `migration-report.md` includes:

- Runtime summary.
- Planned change count.
- Applied change count.
- Failed change count.
- Risk level.
- Confidence.
- Analysis mode.
- Planning mode.
- Validation result.
- Planning notes.
- AI suggested dependency/package upgrades.
- Validation repair dependency upgrades.
- Changes made.
- Files changed.
- Findings.
- What was not changed.
- Validation output.
- Rollback errors when present.

### 14.2 Angular Hop Report

For adapter-hop migrations, the report includes:

- Detection summary.
- Planned migration hops.
- Hop statuses.
- Dependency compatibility issues.
- Dependency compatibility remediations.
- AI remediation changes.
- Manual correction requirements.
- Warnings.
- Angular CLI migrate-only status.
- Preflight dependency compatibility analysis.
- Execution log.
- Commands executed.
- Dependency changes.
- Structural file changes.
- Validation results.
- Optional Angular migrations.
- Manual actions required.
- Failures and manual action details.

## 15. AI Functionality

AI integration is implemented in `migration_agent/ai/provider.py`.

### 15.1 Supported Providers

Supported providers:

- Codex
- Claude

Supported modes:

- `cli`
- `auto`

There is no API-key provider implementation in the current code path.

### 15.2 CLI Resolution

AI CLI resolution:

- Detects `codex` and `claude`.
- On Windows, prefers `.cmd` command shims.
- Auto mode prefers Codex if available, then Claude.
- `aiCli: none` disables AI.
- Missing AI CLI causes deterministic fallback rather than failure during resolution.
- Installed CLI versions are compared against latest npm package versions when possible.
- Older CLI versions create warnings, not hard failures.

### 15.3 AI Invocation

AI calls:

- Build a prompt from system and user sections.
- Demand JSON-only output.
- Execute the provider CLI with prompt through stdin.
- Parse the first JSON object or array found in stdout/stderr.
- Convert JSON arrays to `{"items": ...}`.
- Raise an error if the CLI command fails during direct AI invocation.

### 15.4 AI Safety Boundaries

AI does not directly edit files in the general migration planner. AI output is passed through validators that:

- Enforce file-role constraints.
- Enforce allowed change types.
- Enforce explicit rules or evidence-backed dependency upgrades.
- Reject source-code and business-logic changes.
- Reject unsafe dependency actions.

## 16. Command Execution Functionality

Command execution is implemented in `migration_agent/core/commands.py`.

### 16.1 Windows Command Resolution

On Windows, executable resolution prefers:

- `.cmd`
- `.exe`
- `.bat`
- extensionless fallback

This is important for npm shims such as `npx` and `npm`.

### 16.2 Process Handling

The runner:

- Uses `subprocess.Popen`.
- Captures stdout and stderr concurrently on background threads.
- Supports stdin input.
- Supports timeout.
- Writes commands, resolved commands, output, errors, and elapsed time to the run log.
- Streams output only in verbose mode.
- Prints heartbeat messages for long-running commands.

### 16.3 Return Codes

Special handling:

- Missing executable returns `127`.
- Timeout returns `124`.
- Normal process return codes are preserved.

## 17. Logging and Timing

### 17.1 Run Log

`migration_agent/core/run_log.py` creates timestamped logs under `outputPath`:

```text
migration-run-YYYYMMDD-HHMMSS.log
```

Commands and outputs are appended throughout execution.

### 17.2 Timing Summary

`migration_agent/core/timing.py` records measured stages for adapter-hop migration and writes:

- `migration-timing-summary.json`
- `migration-timing-summary.md`

The timing summary includes total seconds and per-stage durations.

## 18. Progress Output

Progress reporting is implemented in `migration_agent/core/progress.py`.

Modes:

- `default`: stage messages and details are printed.
- `verbose`: command output streams live.
- `quiet`: suppresses non-error progress but still prints final report path and errors.

## 19. Test Coverage Summary

The test suite covers the main business rules and safety constraints.

Major tested areas:

- Adapter selection by runtime.
- Angular project detection.
- Package manager detection.
- Angular hop expansion.
- Version-pinned Angular CLI command generation.
- Avoidance of global Angular CLI and global npm mutation.
- Angular migrate-only command forms.
- Optional migration behavior.
- Angular structural file collection.
- Missing test script skip behavior.
- Peer dependency preflight behavior.
- Third-party Angular dependency warnings.
- NPM metadata caching.
- Timeout handling.
- Skipped preflight behavior.
- Unknown package compatibility handling.
- Dependency remediation after install failures.
- AI remediation safety and manual correction behavior.
- Angular CLI version escape handling.
- Quiet and verbose command output behavior.
- Windows command shim resolution.
- Config defaults.
- AI CLI detection and fallback.
- Project copy ignore rules.
- Planner rejection of source-code and business-logic changes.
- Planner acceptance of safe AI-inferred dependency upgrades.
- Planner rejection of package removals, downgrades, missing packages, and invalid plan shapes.
- NU1605 dependency repair parsing.
- Report formatting for AI package upgrades.
- Package classifier role/action safety.

## 20. Generated and Non-Source Artifacts

The workspace currently contains generated or runtime artifacts:

- `Output`
- `rollback`
- `Output/node_modules`
- `Output/dist`
- migration run logs
- generated migrated Angular app files

These are not core application source files. The business logic is in `migration_agent`, `migration_agent/rules`, config files, and tests.

## 21. Important Current Limitations

### 21.1 Adapter Selection Does Not Use Detection

The configured runtime directly selects the adapter. The adapter's `detect()` method is available and tested independently, but `find_adapter()` currently returns the first adapter matching runtime without validating that the project actually matches.

### 21.2 General Source-Code Migration Is Out of Scope

The general planner intentionally does not transform application source code. This means migrations that require code-level API replacement, class refactoring, or domain logic changes will not be fully completed automatically.

### 21.3 Some Rule Sections Are Informational

For `.NET`, `deprecatedApis` and `configChanges` are currently informational. They do not become executable plan items.

### 21.4 AI Is CLI-Based Only

The current AI integration shells out to local Codex or Claude CLIs. There is no direct OpenAI/Anthropic API client implementation in this repository.

### 21.5 Angular Logic Is Much Richer Than Generic Planning

Angular has a custom adapter-native migration engine. Other runtimes do not yet have comparable multi-hop command orchestration.

### 21.6 Rollback Snapshots Use Timestamp Seconds

Snapshots are named with `int(time.time())`. Two snapshot operations in the same second under the same rollback root may collide, although existing paths are removed before copy.

## 22. Business Logic by Module

| Module | Business Responsibility |
| --- | --- |
| `migration_agent/__main__.py` | CLI entry point and top-level process return behavior. |
| `migration_agent/cli/args.py` | Config parsing, defaults, validation, AI config creation. |
| `migration_agent/core/agent.py` | Main orchestration for analysis, planning, execution, validation, reporting, rollback, and Angular hops. |
| `migration_agent/adapters/base.py` | Runtime adapter contract. |
| `migration_agent/adapters/__init__.py` | Runtime adapter registry and lookup. |
| `migration_agent/adapters/dotnet.py` | .NET manifest parsing, package updates, structural collection, build validation. |
| `migration_agent/adapters/angular.py` | Angular detection, manifest parsing, hop migration, compatibility checks, CLI command generation, remediation, validation. |
| `migration_agent/adapters/package_classifier.py` | Dependency role classification and safe action validation. |
| `migration_agent/core/analyser.py` | Structural project analysis with AI and deterministic fallback. |
| `migration_agent/core/planner.py` | Safe executable plan generation, AI plan validation, dependency repair planning. |
| `migration_agent/core/executor.py` | Copy project and apply framework/runtime/dependency changes. |
| `migration_agent/core/validator.py` | Adapter build validation wrapper. |
| `migration_agent/core/rollback.py` | Snapshot creation and restore logic. |
| `migration_agent/core/reporter.py` | Markdown report generation. |
| `migration_agent/core/commands.py` | Safe command resolution, process execution, logging, timeout, verbosity behavior. |
| `migration_agent/core/copy_ignore.py` | Shared generated-artifact exclusion rules. |
| `migration_agent/core/run_log.py` | Run log creation and append behavior. |
| `migration_agent/core/timing.py` | Timing summary recording and output. |
| `migration_agent/core/progress.py` | User-facing progress and verbosity behavior. |
| `migration_agent/ai/provider.py` | AI CLI detection, invocation, version warning, JSON parsing. |
| `migration_agent/ai/codex.py` | Backward-compatible Codex wrapper. |
| `migration_agent/rules/*` | Declarative migration rules for supported runtime version transitions. |

## 23. End-to-End Business Scenarios

### 23.1 .NET 6 to .NET 8 Migration

1. User configures runtime `dotnet`, source version `6`, target version `8`.
2. Tool selects `DotnetAdapter`.
3. Tool loads `rules/dotnet/6-to-8.json`.
4. Adapter parses `.csproj` files.
5. Analyzer identifies projects targeting `net6.0`.
6. Planner creates framework changes and package upgrades for packages present in the manifest.
7. Executor copies the project to `outputPath`.
8. Executor changes `net6.0` to `net8.0` in allowed project files.
9. Executor updates matching package references.
10. Validator runs `dotnet build`.
11. If validation fails, safe dependency repair may be attempted.
12. Report is written.
13. Rollback behavior depends on `rollbackMode`.

### 23.2 Angular 14 to Angular 18 Migration

1. User configures runtime `angular`, source version `14`, target version `18`.
2. Tool selects `AngularAdapter`.
3. Adapter expands migration into four hops.
4. Tool loads one rule file per hop.
5. Tool copies the project to `outputPath`.
6. For each hop, adapter checks dependency compatibility.
7. Adapter updates `package.json` framework dependencies.
8. Adapter runs install.
9. Adapter runs version-pinned Angular CLI migrate-only commands.
10. Adapter optionally runs configured optional migrations if enabled.
11. Adapter validates install/build/test-if-present.
12. Adapter attempts safe remediation for recognized dependency/build failures.
13. If a hop fails, later hops are not executed.
14. Report includes executed commands, warnings, blockers, remediations, changed structural files, snapshots, and manual actions.

### 23.3 AI-Assisted Planning

1. Tool resolves a local Codex or Claude CLI.
2. Analyzer asks AI for structural findings only.
3. Planner asks AI to classify file roles.
4. Planner asks AI for a plan.
5. Planner validates every AI plan item.
6. Unsafe AI output is discarded.
7. Deterministic plan is used as fallback.
8. Report records analysis and planning mode.

## 24. Safety Model Summary

The migration agent's safety model is the most important business logic in the repository.

Core safeguards:

- The source project is not edited.
- The output project is a copy.
- Generated/dependency artifacts are skipped.
- Rollback snapshots are created.
- Planner allows only structural files.
- Source-code and business-logic file roles are blocked.
- AI output is never trusted directly for executable plans.
- Dependency changes require rules or evidence.
- Package removals and downgrades are rejected.
- Angular CLI commands are version-pinned.
- Global Angular CLI and global npm install/update are avoided.
- Validation output drives success/failure.
- Manual rollback mode preserves failed output for review.

## 25. Practical Interpretation

This is not a general AI refactoring tool. It is a guarded migration orchestrator.

For `.NET`, it mostly performs deterministic structural upgrades:

- Target framework replacement.
- Known package version upgrades.
- Build validation.

For Angular, it performs a more complete framework migration workflow:

- Sequential major-version hops.
- Dependency compatibility analysis.
- Package manifest updates.
- Install and Angular CLI migration commands.
- Validation and selected remediation.

The tool's business logic is intentionally built around preserving application behavior while automating high-confidence migration mechanics.
