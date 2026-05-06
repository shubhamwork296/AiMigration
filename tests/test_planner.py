import asyncio

from migration_agent.ai.provider import AiConfig
from migration_agent.core.planner import build_change_plan
from migration_agent.core.planner import build_migration_plan


def test_build_change_plan_ignores_source_code_findings():
    rules = {
        "targetFrameworkChange": {"from": "net6.0", "to": "net8.0"},
        "packageChanges": [{"name": "Example.Package", "fromVersion": "6.*", "toVersion": "8.0.0"}],
    }
    analysis = {
        "findings": [
            {
                "type": "deprecatedApi",
                "file": "Program.cs",
                "old": "OldApi",
                "new": "NewApi",
                "description": "Replace OldApi.",
            }
        ]
    }

    plan = build_change_plan(analysis, rules)

    assert [item["type"] for item in plan] == ["framework", "package"]


def test_build_change_plan_filters_packages_not_in_manifest():
    rules = {
        "targetFrameworkChange": {"from": "net6.0", "to": "net8.0"},
        "packageChanges": [
            {"name": "Present.Package", "fromVersion": "6.*", "toVersion": "8.0.0"},
            {"name": "Missing.Package", "fromVersion": "6.*", "toVersion": "8.0.0"},
        ],
    }
    analysis = {
        "manifest": {
            "projects": [
                {
                    "path": "Sample.csproj",
                    "packages": [{"name": "Present.Package", "version": "6.0.0"}],
                }
            ]
        }
    }

    plan = build_change_plan(analysis, rules)

    assert [item.get("name") for item in plan if item["type"] == "package"] == ["Present.Package"]


def test_build_migration_plan_uses_valid_ai_plan(monkeypatch):
    rules = {
        "targetFrameworkChange": {"from": "net6.0", "to": "net8.0"},
        "packageChanges": [{"name": "Present.Package", "fromVersion": "6.*", "toVersion": "8.0.0"}],
    }
    analysis = {
        "manifest": {
            "projects": [
                {
                    "path": "Sample.csproj",
                    "targetFrameworks": ["net6.0"],
                    "packages": [{"name": "Present.Package", "version": "6.0.0"}],
                }
            ]
        }
    }

    async def fake_ask_codex(config, system, user):
        return {
            "planningSummary": "Framework and package updates are required.",
            "plan": [
                {
                    "type": "framework",
                    "priority": 1,
                    "file": "Sample.csproj",
                    "find": "net6.0",
                    "replace": "net8.0",
                    "description": "Update Sample.csproj to .NET 8.",
                },
                {
                    "type": "package",
                    "priority": 2,
                    "name": "Present.Package",
                    "fromVersion": "6.*",
                    "toVersion": "8.0.0",
                    "action": "upgrade",
                    "description": "Upgrade Present.Package.",
                },
            ],
        }

    monkeypatch.setattr("migration_agent.core.planner.ask_ai", fake_ask_codex)

    plan = asyncio.run(build_migration_plan(analysis, rules, AiConfig(use_ai=True, provider="codex")))

    assert analysis["planningMode"] == "codex"
    assert [item["type"] for item in plan] == ["framework", "package"]
    assert plan[0]["file"] == "Sample.csproj"


def test_build_migration_plan_rejects_unsafe_ai_items(monkeypatch):
    rules = {
        "targetFrameworkChange": {"from": "net6.0", "to": "net8.0"},
        "packageChanges": [{"name": "Present.Package", "fromVersion": "6.*", "toVersion": "8.0.0"}],
    }
    analysis = {
        "manifest": {
            "projects": [
                {
                    "path": "Sample.csproj",
                    "targetFrameworks": ["net6.0"],
                    "packages": [{"name": "Present.Package", "version": "6.0.0"}],
                }
            ]
        }
    }

    async def fake_ask_codex(config, system, user):
        return {
            "planningSummary": "Unsafe items.",
            "plan": [
                {
                    "type": "framework",
                    "priority": 1,
                    "file": "Program.cs",
                    "find": "net6.0",
                    "replace": "net8.0",
                },
                {
                    "type": "package",
                    "priority": 2,
                    "name": "Unexpected.Package",
                    "fromVersion": "6.*",
                    "toVersion": "8.0.0",
                    "action": "upgrade",
                },
            ],
        }

    monkeypatch.setattr("migration_agent.core.planner.ask_ai", fake_ask_codex)

    plan = asyncio.run(build_migration_plan(analysis, rules, AiConfig(use_ai=True, provider="codex")))

    assert analysis["planningMode"] == "rule-based"
    assert [item["type"] for item in plan] == ["framework", "package"]
    assert plan[0]["file"] == "Sample.csproj"
