from __future__ import annotations

from typing import Any


def generate_report(
    plan: list[dict[str, Any]],
    results: list[dict[str, Any]],
    analysis: dict[str, Any],
    validation: dict[str, Any],
) -> str:
    done = sum(1 for result in results if result["status"] == "done")
    failed = sum(1 for result in results if result["status"] == "failed")
    changed_files = sorted({file for result in results for file in result.get("files", [])})

    return "\n".join(
        [
            "# Migration Report",
            "",
            "## Summary",
            f"- Runtime: {analysis.get('from')} -> {analysis.get('to')}",
            f"- Planned changes: {len(plan)}",
            f"- Changes applied: {done}",
            f"- Failed: {failed}",
            f"- Risk level: {analysis.get('riskLevel')}",
            f"- Confidence: {analysis.get('confidence')}",
            f"- Analysis mode: {analysis.get('analysisMode', 'unknown')}",
            f"- Planning mode: {analysis.get('planningMode', 'unknown')}",
            f"- Validation passed: {validation.get('passed')}",
            *(_format_planning_notes(analysis)),
            "",
            f"## {_dependency_upgrade_section_title(analysis)}",
            *(_format_dependency_upgrades(plan, results, {"ai", "ai-inferred"})),
            "",
            "## Validation Repair Dependency Upgrades",
            *(_format_dependency_upgrades(plan, results, {"ai-validation-repair"})),
            "",
            "## Changes Made",
            *(_format_result(result) for result in results),
            *(["- No changes executed."] if not results else []),
            "",
            "## Files Changed",
            *(f"- {file}" for file in changed_files),
            *(["- None"] if not changed_files else []),
            "",
            "## Findings",
            *(_format_finding(finding) for finding in analysis.get("findings", [])),
            *(["- None"] if not analysis.get("findings") else []),
            "",
            "## What Was Not Changed",
            "- Business logic was not intentionally modified.",
            "- Source code files were not intentionally modified.",
            "- Files were not moved or renamed.",
            "",
            "## Validation Output",
            "```text",
            validation.get("output") or validation.get("errors") or "",
            "```",
            *(_format_rollback_error(validation)),
            "",
        ]
    )


def generate_adapter_hop_report(
    analysis: dict[str, Any],
    hops: list[dict[str, Any]],
    hop_results: list[dict[str, Any]],
    validation: dict[str, Any],
) -> str:
    manifest = analysis.get("manifest", {})
    executed = {f"{result['hop']['fromVersion']} -> {result['hop']['toVersion']}": result for result in hop_results}
    changed_files = sorted({file for result in hop_results for file in result.get("files", [])})
    commands = [
        (result, command)
        for result in hop_results
        for command in result.get("commands", [])
    ]
    optional = [
        step
        for result in hop_results
        for step in result.get("optionalMigrations", [])
    ]

    return "\n".join(
        [
            "# Migration Report",
            "",
            "## Detection Summary",
            f"- Detected runtime: {manifest.get('runtime', 'unknown')}",
            f"- Detected Angular version: {manifest.get('angularVersion', 'unknown')}",
            f"- Target Angular version: {str(analysis.get('to', '')).removeprefix('angular') or 'unknown'}",
            f"- Package manager: {manifest.get('packageManager', 'unknown')}",
            f"- Lockfile: {manifest.get('lockfile') or 'none'}",
            f"- angular.json: {manifest.get('hasAngularJson')}",
            f"- tsconfig.json: {manifest.get('hasTsconfig')}",
            *(_format_angular_cli_safety(manifest)),
            "",
            "## Planned Migration Hops",
            *(f"- Angular {hop['fromVersion']} -> {hop['toVersion']}" for hop in hops),
            "",
            "## Migration Hops",
            *(_format_migration_hops(hops, executed)),
            "",
            "## Dependency Compatibility Issues",
            *(_format_dependency_compatibility_issues(hop_results)),
            "",
            "## Dependency Compatibility Remediations",
            *(_format_dependency_compatibility_remediations(hop_results)),
            "",
            "## Warnings",
            *(_format_dependency_warnings(hop_results)),
            "",
            "## Preflight Dependency Compatibility Analysis",
            *(_format_preflight_dependency_analysis(hops, executed)),
            "",
            "## Execution Log",
            *(_format_hop_result(hop, executed.get(f"{hop['fromVersion']} -> {hop['toVersion']}")) for hop in hops),
            "",
            "## Commands Executed",
            *(_format_hop_command(result, command) for result, command in commands),
            *(["- None"] if not commands else []),
            "",
            "## Dependency Changes",
            "- Managed by Angular CLI update commands where execution occurred.",
            "",
            "## Structural File Changes",
            *(f"- {file}" for file in changed_files),
            *(["- None"] if not changed_files else []),
            "",
            "## Validation Results",
            *(_format_hop_validation(result) for result in hop_results),
            *(["- None"] if not hop_results else []),
            "",
            "## Optional Angular Migrations",
            *(_format_optional_migration(step) for step in optional),
            *(["- None"] if not optional else []),
            "",
            "## Manual Actions Required",
            *(_format_manual_actions(hop_results, validation)),
            "",
            "## Failures / Manual Actions Required",
            *(_format_failure(validation)),
            "",
        ]
    )


def _format_result(result: dict[str, Any]) -> str:
    change = result["change"]
    description = change.get("description", change.get("type", "change"))
    extra = f" ({result.get('error')})" if result.get("error") else ""
    source = f" [{change.get('source')}]" if change.get("source") else ""
    return f"- [{result['status']}] {change.get('type')}{source}: {description}{extra}"


def _format_dependency_upgrades(
    plan: list[dict[str, Any]],
    results: list[dict[str, Any]],
    sources: set[str],
) -> list[str]:
    result_by_key = {
        _dependency_key(result["change"]): result
        for result in results
        if result.get("change", {}).get("type") in {"dependency", "package"}
    }
    ai_dependencies = [
        change
        for change in plan
        if change.get("type") in {"dependency", "package"} and change.get("source") in sources
    ]

    if not ai_dependencies:
        return ["- None"]

    lines = []
    for change in ai_dependencies:
        result = result_by_key.get(_dependency_key(change))
        status = result["status"] if result else "planned"
        files = result.get("files", []) if result else []
        file_summary = f" ({', '.join(files)})" if files else ""
        lines.append(f"- [{status}] {change['name']}: {change['fromVersion']} -> {change['toVersion']}{file_summary}")
    return lines


def _format_ai_package_upgrades(plan: list[dict[str, Any]], results: list[dict[str, Any]]) -> list[str]:
    return _format_dependency_upgrades(plan, results, {"ai", "ai-inferred", "ai-validation-repair"})


def _dependency_key(change: dict[str, Any]) -> tuple[Any, Any, Any]:
    return (change.get("name"), change.get("toVersion"), change.get("sourceFile"))


def _package_key(change: dict[str, Any]) -> tuple[Any, Any]:
    return (change.get("name"), change.get("toVersion"))


def _dependency_upgrade_section_title(analysis: dict[str, Any]) -> str:
    ecosystem = _analysis_ecosystem(analysis)
    manager = _analysis_package_manager(analysis)
    if ecosystem == "dotnet" or manager == "nuget" or str(analysis.get("from", "")).startswith("dotnet"):
        return "AI Suggested Package Upgrades"
    return "AI Suggested Dependency Upgrades"


def _analysis_ecosystem(analysis: dict[str, Any]) -> str:
    for ecosystem in analysis.get("structureClassification", {}).get("ecosystems", []):
        if isinstance(ecosystem, dict) and ecosystem.get("name"):
            return str(ecosystem["name"])
    runtime = analysis.get("manifest", {}).get("runtime")
    return "dotnet" if runtime == "dotnet" else "unknown"


def _analysis_package_manager(analysis: dict[str, Any]) -> str:
    for ecosystem in analysis.get("structureClassification", {}).get("ecosystems", []):
        if isinstance(ecosystem, dict) and ecosystem.get("packageManager"):
            return str(ecosystem["packageManager"])
    return "unknown"


def _format_finding(finding: dict[str, Any]) -> str:
    file_name = finding.get("file", "unknown file")
    description = finding.get("description") or finding.get("reason") or finding.get("type")
    return f"- {file_name}: {description}"


def _format_planning_notes(analysis: dict[str, Any]) -> list[str]:
    notes = analysis.get("planningNotes")
    if not notes:
        return []
    return [f"- Planning notes: {notes}"]


def _format_rollback_error(validation: dict[str, Any]) -> list[str]:
    error = validation.get("rollbackError")
    if not error:
        return []
    return ["", "## Rollback Error", "```text", error, "```"]


def _format_hop_result(hop: dict[str, Any], result: dict[str, Any] | None) -> str:
    label = f"Angular {hop['fromVersion']} -> {hop['toVersion']}"
    if result is None:
        return f"- [pending] {label}"
    snapshot = f"; snapshot: {result.get('snapshotPath')}" if result.get("snapshotPath") else ""
    return f"- [{result['status']}] {label}{snapshot}"


def _format_migration_hops(hops: list[dict[str, Any]], executed: dict[str, dict[str, Any]]) -> list[str]:
    lines = []
    for hop in hops:
        key = f"{hop['fromVersion']} -> {hop['toVersion']}"
        result = executed.get(key)
        status = result.get("status") if result else "pending"
        lines.append(f"- [{status}] Angular {key}")
    return lines


def _format_dependency_compatibility_issues(hop_results: list[dict[str, Any]]) -> list[str]:
    issues = [
        issue
        for result in hop_results
        for issue in result.get("dependencyCompatibilityIssues", result.get("preflightDependencyAnalysis", {}).get("blockers", []))
    ]
    if not issues:
        return ["- None"]
    lines = []
    for issue in issues:
        lines.extend(
            [
                f"- Package: {issue.get('package')}",
                f"- Issue type: {issue.get('issueType', 'Dependency Compatibility Issue')}",
                f"- Incompatible peer: {issue.get('peer')}",
                f"- Required range: {issue.get('requiredRange')}",
                f"- Target Angular version: {issue.get('targetAngularVersion')}",
                f"- Severity: {issue.get('severity')}",
            ]
        )
    return lines


def _format_dependency_compatibility_remediations(hop_results: list[dict[str, Any]]) -> list[str]:
    remediations = [
        remediation
        for result in hop_results
        for remediation in result.get("dependencyCompatibilityRemediations", result.get("preflightDependencyAnalysis", {}).get("remediations", []))
    ]
    if not remediations:
        return ["- None"]
    lines = []
    for remediation in remediations:
        lines.extend(
            [
                f"- Hop: {remediation.get('hop') or 'unknown'}",
                f"- Package: {remediation.get('package')}",
                f"- Original issue: {remediation.get('issue')}",
                f"- Target Angular version: {remediation.get('targetAngularVersion')}",
                f"- Compatible version found: {remediation.get('toVersion')}",
                f"- Command: {' '.join(remediation.get('command', []))}",
                f"- Validation: {remediation.get('validation')}",
                f"- Status: {remediation.get('status')}",
            ]
        )
    return lines


def _format_dependency_warnings(hop_results: list[dict[str, Any]]) -> list[str]:
    warnings = [
        warning
        for result in hop_results
        for warning in result.get("preflightDependencyAnalysis", {}).get("warnings", [])
    ]
    if not warnings:
        return ["- None"]
    return [f"- {warning}" for warning in warnings]


def _format_manual_actions(hop_results: list[dict[str, Any]], validation: dict[str, Any]) -> list[str]:
    manual = []
    for result in hop_results:
        if result.get("status") == "failed":
            blockers = result.get("dependencyCompatibilityIssues", [])
            unresolved = [blocker for blocker in blockers if not blocker.get("suggestedVersion")]
            if unresolved:
                manual.extend(f"- {blocker.get('package')}: no compatible version found for Angular {blocker.get('targetAngularVersion')}." for blocker in unresolved)
            elif result.get("failurePackage"):
                manual.append(f"- {result.get('failurePackage')}: {result.get('failureReason')}.")
    if manual:
        return manual
    if validation.get("passed"):
        return ["- None"]
    return [f"- Review failed hop: {validation.get('failedHop', 'unknown')}"]


def _format_preflight_dependency_analysis(hops: list[dict[str, Any]], executed: dict[str, dict[str, Any]]) -> list[str]:
    lines: list[str] = []
    for hop in hops:
        key = f"{hop['fromVersion']} -> {hop['toVersion']}"
        result = executed.get(key)
        analysis = result.get("preflightDependencyAnalysis") if result else None
        if not analysis:
            lines.append(f"- Hop: Angular {key}")
            lines.append("- Status: not run")
            continue
        blockers = analysis.get("blockers", [])
        status = analysis.get("status", "passed")
        lines.append(f"- Hop: Angular {key}")
        lines.append(f"- Status: {status}")
        if not blockers:
            lines.append("- No dependency peer blockers detected.")
            continue
        for blocker in blockers:
            lines.extend(
                [
                    f"- Package: {blocker.get('package')}",
                    f"- Current version/range: {blocker.get('currentVersionRange')}",
                    f"- Incompatible peer: {blocker.get('peer')}",
                    f"- Required range: {blocker.get('requiredRange')}",
                    f"- Target Angular version: {blocker.get('targetAngularVersion')}",
                    f"- Suggested action: {blocker.get('suggestedAction')}",
                    f"- Suggested command: {blocker.get('suggestedCommand') or 'manual action required'}",
                ]
            )
    return lines


def _format_hop_command(result: dict[str, Any], command: dict[str, Any]) -> str:
    hop = result["hop"]
    status = "passed" if command.get("returncode") == 0 else "failed"
    policy = command.get("angularCliPolicy", {})
    policy_text = ""
    if policy:
        policy_text = (
            f" (command source: {policy.get('commandSource')}; "
            f"Angular CLI source: {policy.get('angularCliSource')}; "
            f"global Angular CLI: {policy.get('globalAngularCli')}; "
            f"global install/update: {policy.get('globalInstallUpdate')})"
        )
    return f"- [{status}] Angular {hop['fromVersion']} -> {hop['toVersion']}: {' '.join(command.get('command', []))}{policy_text}"


def _format_hop_validation(result: dict[str, Any]) -> str:
    hop = result["hop"]
    validation = result.get("validation", {})
    skipped = validation.get("skipped", [])
    skipped_text = ""
    if skipped:
        skipped_text = " Skipped: " + ", ".join(f"{item['description']} ({item['reason']})" for item in skipped)
    return f"- Angular {hop['fromVersion']} -> {hop['toVersion']}: passed={validation.get('passed')}.{skipped_text}"


def _format_optional_migration(step: dict[str, Any]) -> str:
    if not step.get("available"):
        status = "not available"
    else:
        status = "applied" if step.get("applied") else "skipped"
    command = " ".join(step.get("command", []))
    return f"- [{status}] {step.get('name')}: {step.get('reason')} {command}".rstrip()


def _format_angular_cli_safety(manifest: dict[str, Any]) -> list[str]:
    if manifest.get("runtime") != "angular":
        return []
    return [
        "- Global Angular CLI was not modified.",
        "- Angular CLI was invoked through version-pinned npx.",
        "- Command source: npx",
        "- Angular CLI source: version-pinned npx package",
        "- Global Angular CLI: not used",
        "- Global install/update: not performed",
    ]


def _format_failure(validation: dict[str, Any]) -> list[str]:
    if validation.get("passed"):
        return ["- None"]
    lines = [f"- Failed hop: {validation.get('failedHop', 'unknown')}"]
    if validation.get("errors"):
        lines.extend(["", "```text", str(validation["errors"]), "```"])
    lines.extend(_format_rollback_error(validation))
    return lines
