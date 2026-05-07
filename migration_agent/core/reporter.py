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
            "## AI Suggested Package Upgrades",
            *(_format_ai_package_upgrades(plan, results)),
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


def _format_result(result: dict[str, Any]) -> str:
    change = result["change"]
    description = change.get("description", change.get("type", "change"))
    extra = f" ({result.get('error')})" if result.get("error") else ""
    source = f" [{change.get('source')}]" if change.get("source") else ""
    return f"- [{result['status']}] {change.get('type')}{source}: {description}{extra}"


def _format_ai_package_upgrades(plan: list[dict[str, Any]], results: list[dict[str, Any]]) -> list[str]:
    result_by_key = {
        _package_key(result["change"]): result
        for result in results
        if result.get("change", {}).get("type") == "package"
    }
    ai_packages = [
        change
        for change in plan
        if change.get("type") == "package" and change.get("source") in {"ai", "ai-inferred", "ai-validation-repair"}
    ]

    if not ai_packages:
        return ["- None"]

    lines = []
    for change in ai_packages:
        result = result_by_key.get(_package_key(change))
        status = result["status"] if result else "planned"
        files = result.get("files", []) if result else []
        file_summary = f" ({', '.join(files)})" if files else ""
        lines.append(f"- [{status}] {change['name']}: {change['fromVersion']} -> {change['toVersion']}{file_summary}")
    return lines


def _package_key(change: dict[str, Any]) -> tuple[Any, Any]:
    return (change.get("name"), change.get("toVersion"))


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
