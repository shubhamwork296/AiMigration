import asyncio

from migration_agent.ai.provider import AiConfig
from migration_agent.core.planner import build_change_plan
from migration_agent.core.planner import build_migration_plan
from migration_agent.core.planner import classify_project_structure_with_ai
from migration_agent.core.planner import normalize_dependency_rules
from migration_agent.core.planner import _manifest_dependency_versions
from migration_agent.core.planner import repair_dependency_conflicts_from_validation
from migration_agent.core.planner import _is_allowed_structural_target
from migration_agent.core.planner import _parse_nu1605_downgrades
from migration_agent.core.planner import repair_package_downgrades_from_validation
from migration_agent.core.reporter import generate_report


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

    assert [item["type"] for item in plan] == ["dependency"]


def test_build_change_plan_uses_classified_project_manifest_for_framework():
    rules = {
        "targetFrameworkChange": {"from": "net6.0", "to": "net8.0"},
        "packageChanges": [],
    }
    analysis = {
        "manifest": {
            "projects": [
                {
                    "path": "Sample.csproj",
                    "targetFrameworks": ["net6.0"],
                    "packages": [],
                }
            ]
        }
    }

    plan = build_change_plan(analysis, rules)

    assert plan == [
        {
            "type": "framework",
            "priority": 1,
            "source": "rule",
            "file": "Sample.csproj",
            "find": "net6.0",
            "replace": "net8.0",
            "description": "Update target framework net6.0 to net8.0.",
        }
    ]


def test_structural_authorization_supports_representative_manifest_roles():
    cases = [
        ("App.csproj", "framework"),
        ("pom.xml", "dependency"),
        ("build.gradle", "build_setting"),
        ("package.json", "script"),
        ("pyproject.toml", "dependency"),
        ("go.mod", "runtime"),
        ("Gemfile", "package"),
    ]

    for file_name, change_type in cases:
        analysis = {"projectFiles": {file_name: ""}}
        assert _is_allowed_structural_target(file_name, analysis, change_type)


def test_structural_authorization_rejects_source_config_unknown_and_lock_direct_edits():
    analysis = {
        "structureClassification": {
            "ecosystems": [
                {
                    "name": "unknown",
                    "languages": ["unknown"],
                    "packageManager": "unknown",
                    "confidence": 1.0,
                    "files": [
                        {
                            "path": "Program.cs",
                            "role": "source_code",
                            "allowedChangeTypes": ["framework"],
                            "reason": "source",
                            "confidence": 1.0,
                        },
                        {
                            "path": "appsettings.json",
                            "role": "configuration",
                            "allowedChangeTypes": ["runtime"],
                            "reason": "config",
                            "confidence": 1.0,
                        },
                        {
                            "path": "mystery.file",
                            "role": "unknown",
                            "allowedChangeTypes": ["dependency"],
                            "reason": "unknown",
                            "confidence": 1.0,
                        },
                        {
                            "path": "package-lock.json",
                            "role": "lock_file",
                            "allowedChangeTypes": ["dependency", "regenerate_lock_file"],
                            "reason": "lock",
                            "confidence": 1.0,
                        },
                    ],
                }
            ]
        }
    }

    assert not _is_allowed_structural_target("Program.cs", analysis, "framework")
    assert not _is_allowed_structural_target("appsettings.json", analysis, "runtime")
    assert not _is_allowed_structural_target("mystery.file", analysis, "dependency")
    assert not _is_allowed_structural_target("package-lock.json", analysis, "dependency")
    assert _is_allowed_structural_target("package-lock.json", analysis, "regenerate_lock_file")


def test_classify_project_structure_with_ai_returns_strict_normalized_roles(monkeypatch):
    analysis = {"projectFiles": {"pom.xml": "", "src/main/java/App.java": ""}}
    rules = {"targetFrameworkChange": {"from": "17", "to": "21"}}

    async def fake_ask_codex(config, system, user):
        return {
            "ecosystems": [
                {
                    "name": "maven",
                    "languages": ["java"],
                    "packageManager": "maven",
                    "confidence": 0.9,
                    "files": [
                        {
                            "path": "pom.xml",
                            "role": "project_manifest",
                            "allowedChangeTypes": ["framework", "runtime", "dependency", "unsafe"],
                            "reason": "Maven project manifest.",
                            "confidence": 0.9,
                        },
                        {
                            "path": "src/main/java/App.java",
                            "role": "source_code",
                            "allowedChangeTypes": ["framework"],
                            "reason": "Java source.",
                            "confidence": 0.9,
                        },
                    ],
                }
            ],
            "summary": "Maven project.",
        }

    monkeypatch.setattr("migration_agent.core.planner.ask_ai", fake_ask_codex)

    structure = asyncio.run(classify_project_structure_with_ai(analysis, rules, AiConfig(use_ai=True, provider="codex")))

    files = structure["ecosystems"][0]["files"]
    by_path = {file_info["path"]: file_info for file_info in files}
    assert by_path["pom.xml"]["allowedChangeTypes"] == ["framework", "runtime", "dependency"]
    assert by_path["src/main/java/App.java"]["allowedChangeTypes"] == []


def test_build_change_plan_filters_packages_not_in_manifest():
    rules = {
        "targetFrameworkChange": {"from": "net6.0", "to": "net8.0"},
        "packageChanges": [
            {"name": "Present.Package", "fromVersion": "6.*", "toVersion": "8.0.0"},
            {"name": "Missing.Package", "fromVersion": "6.*", "toVersion": "8.0.0"},
        ],
    }
    analysis = {
        "from": "dotnet6",
        "to": "dotnet8",
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

    assert [item.get("name") for item in plan if item["type"] == "dependency"] == ["Present.Package"]


def test_normalize_dependency_rules_preserves_package_changes_for_compatibility():
    rules = {
        "packageChanges": [{"name": "Present.Package", "fromVersion": "6.*", "toVersion": "8.0.0"}],
    }

    normalized = normalize_dependency_rules(rules)

    assert normalized["packageChanges"] == rules["packageChanges"]
    assert normalized["dependencyChanges"] == [
        {
            "type": "dependency",
            "name": "Present.Package",
            "fromVersion": "6.*",
            "toVersion": "8.0.0",
            "source": "rule",
            "action": "upgrade",
            "manager": "unknown",
            "ecosystem": "unknown",
        }
    ]


def test_manifest_dependency_versions_supports_generic_dependency_shapes():
    analysis = {
        "manifest": {
            "dependencies": [
                {
                    "name": "requests",
                    "version": "2.32.0",
                    "manager": "pip",
                    "ecosystem": "python",
                    "sourceFile": "requirements.txt",
                }
            ]
        },
        "ecosystems": [
            {
                "name": "node",
                "packageManager": "npm",
                "dependencies": [
                    {
                        "name": "express",
                        "version": "4.18.0",
                        "sourceFile": "package.json",
                    }
                ],
            }
        ],
    }

    versions = _manifest_dependency_versions(analysis)

    assert versions["requests"]["manager"] == "pip"
    assert versions["requests"]["sourceFile"] == "requirements.txt"
    assert versions["express"]["ecosystem"] == "node"
    assert versions["express"]["manager"] == "npm"


def test_build_migration_plan_uses_valid_ai_plan(monkeypatch):
    rules = {
        "targetFrameworkChange": {"from": "net6.0", "to": "net8.0"},
        "packageChanges": [{"name": "Present.Package", "fromVersion": "6.*", "toVersion": "8.0.0"}],
    }
    analysis = {
        "from": "dotnet6",
        "to": "dotnet8",
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
    assert [item["type"] for item in plan] == ["framework", "dependency"]
    assert plan[0]["file"] == "Sample.csproj"
    assert plan[1]["source"] == "ai"


def test_build_migration_plan_rejects_unsafe_ai_items(monkeypatch):
    rules = {
        "targetFrameworkChange": {"from": "net6.0", "to": "net8.0"},
        "packageChanges": [{"name": "Present.Package", "fromVersion": "6.*", "toVersion": "8.0.0"}],
    }
    analysis = {
        "from": "dotnet6",
        "to": "dotnet8",
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
    assert [item["type"] for item in plan] == ["framework", "dependency"]
    assert plan[0]["file"] == "Sample.csproj"
    assert plan[1]["source"] == "rule"


def test_build_migration_plan_accepts_ai_inferred_manifest_package(monkeypatch):
    rules = {
        "targetFrameworkChange": {"from": "net6.0", "to": "net8.0"},
        "packageChanges": [],
    }
    analysis = {
        "from": "dotnet6",
        "to": "dotnet8",
        "manifest": {
            "projects": [
                {
                    "path": "Sample.csproj",
                    "targetFrameworks": ["net6.0"],
                    "packages": [{"name": "Microsoft.Extensions.Logging", "version": "6.0.0"}],
                }
            ]
        }
    }

    async def fake_ask_codex(config, system, user):
        return {
            "planningSummary": "Update framework-related logging package.",
            "plan": [
                {
                    "type": "package",
                    "priority": 2,
                    "name": "Microsoft.Extensions.Logging",
                    "fromVersion": "6.0.0",
                    "toVersion": "8.0.0",
                    "action": "upgrade",
                    "reason": "Logging package aligns with the target framework.",
                    "evidence": "target-framework",
                }
            ],
        }

    monkeypatch.setattr("migration_agent.core.planner.ask_ai", fake_ask_codex)

    plan = asyncio.run(build_migration_plan(analysis, rules, AiConfig(use_ai=True, provider="codex")))

    dependency_changes = [item for item in plan if item["type"] == "dependency"]
    assert dependency_changes == [
        {
            "type": "dependency",
            "priority": 2,
            "name": "Microsoft.Extensions.Logging",
            "fromVersion": "6.0.0",
            "toVersion": "8.0.0",
                "action": "upgrade",
                "manager": "unknown",
                "ecosystem": "unknown",
                "sourceFile": "Sample.csproj",
                "source": "ai",
                "reason": "Logging package aligns with the target framework.",
                "evidence": "target-framework",
                "description": "Upgrade Microsoft.Extensions.Logging for compatibility with the target framework.",
            }
        ]


def test_build_migration_plan_accepts_ai_inferred_entity_framework_package(monkeypatch):
    rules = {
        "targetFrameworkChange": {"from": "net6.0", "to": "net8.0"},
        "packageChanges": [],
    }
    analysis = {
        "from": "dotnet6",
        "to": "dotnet8",
        "manifest": {
            "projects": [
                {
                    "path": "Sample.csproj",
                    "targetFrameworks": ["net6.0"],
                    "packages": [{"name": "Microsoft.EntityFrameworkCore", "Version": "6.0.0"}],
                }
            ]
        }
    }

    async def fake_ask_codex(config, system, user):
        return {
            "plan": [
                {
                    "type": "package",
                    "name": "Microsoft.EntityFrameworkCore",
                    "fromVersion": "6.0.0",
                    "toVersion": "8.0.0",
                    "action": "upgrade",
                    "description": "Upgrade EF Core.",
                    "reason": "EF Core package aligns with the target framework.",
                    "evidence": "target-framework",
                }
            ],
        }

    monkeypatch.setattr("migration_agent.core.planner.ask_ai", fake_ask_codex)

    plan = asyncio.run(build_migration_plan(analysis, rules, AiConfig(use_ai=True, provider="codex")))

    dependency_changes = [item for item in plan if item["type"] == "dependency"]
    assert dependency_changes[0]["name"] == "Microsoft.EntityFrameworkCore"
    assert dependency_changes[0]["fromVersion"] == "6.0.0"
    assert dependency_changes[0]["toVersion"] == "8.0.0"
    assert dependency_changes[0]["source"] == "ai"


def test_build_migration_plan_rejects_ai_inferred_domain_package(monkeypatch):
    rules = {
        "targetFrameworkChange": {"from": "net6.0", "to": "net8.0"},
        "packageChanges": [],
    }
    analysis = {
        "from": "dotnet6",
        "to": "dotnet8",
        "manifest": {
            "projects": [
                {
                    "path": "Sample.csproj",
                    "targetFrameworks": ["net6.0"],
                    "packages": [{"name": "MyCompany.Business.Payment", "version": "6.0.0"}],
                }
            ]
        }
    }

    async def fake_ask_codex(config, system, user):
        return {
            "plan": [
                {
                    "type": "package",
                    "name": "MyCompany.Business.Payment",
                    "toVersion": "8.0.0",
                    "action": "upgrade",
                }
            ],
        }

    monkeypatch.setattr("migration_agent.core.planner.ask_ai", fake_ask_codex)

    plan = asyncio.run(build_migration_plan(analysis, rules, AiConfig(use_ai=True, provider="codex")))

    assert analysis["planningMode"] == "rule-based"
    assert [item["type"] for item in plan] == ["framework"]


def test_build_migration_plan_rejects_ai_package_not_in_manifest(monkeypatch):
    rules = {
        "targetFrameworkChange": {"from": "net6.0", "to": "net8.0"},
        "packageChanges": [],
    }
    analysis = {
        "manifest": {
            "projects": [
                {
                    "path": "Sample.csproj",
                    "targetFrameworks": ["net6.0"],
                    "packages": [{"name": "Microsoft.Extensions.Logging", "version": "6.0.0"}],
                }
            ]
        }
    }

    async def fake_ask_codex(config, system, user):
        return {
            "plan": [
                {
                    "type": "package",
                    "name": "Microsoft.AspNetCore.Authentication.JwtBearer",
                    "toVersion": "8.0.0",
                    "action": "upgrade",
                }
            ],
        }

    monkeypatch.setattr("migration_agent.core.planner.ask_ai", fake_ask_codex)

    plan = asyncio.run(build_migration_plan(analysis, rules, AiConfig(use_ai=True, provider="codex")))

    assert analysis["planningMode"] == "rule-based"
    assert [item["type"] for item in plan] == ["framework"]


def test_build_migration_plan_rejects_ai_package_removal(monkeypatch):
    rules = {
        "targetFrameworkChange": {"from": "net6.0", "to": "net8.0"},
        "packageChanges": [],
    }
    analysis = {
        "manifest": {
            "projects": [
                {
                    "path": "Sample.csproj",
                    "targetFrameworks": ["net6.0"],
                    "packages": [{"name": "Microsoft.Extensions.Logging", "version": "6.0.0"}],
                }
            ]
        }
    }

    async def fake_ask_codex(config, system, user):
        return {
            "plan": [
                {
                    "type": "package",
                    "name": "Microsoft.Extensions.Logging",
                    "toVersion": "8.0.0",
                    "action": "remove",
                }
            ],
        }

    monkeypatch.setattr("migration_agent.core.planner.ask_ai", fake_ask_codex)

    plan = asyncio.run(build_migration_plan(analysis, rules, AiConfig(use_ai=True, provider="codex")))

    assert analysis["planningMode"] == "rule-based"
    assert [item["type"] for item in plan] == ["framework"]


def test_build_migration_plan_rejects_ai_package_downgrade(monkeypatch):
    rules = {
        "targetFrameworkChange": {"from": "net6.0", "to": "net8.0"},
        "packageChanges": [],
    }
    analysis = {
        "manifest": {
            "projects": [
                {
                    "path": "Sample.csproj",
                    "targetFrameworks": ["net6.0"],
                    "packages": [{"name": "Microsoft.Extensions.Logging", "version": "8.0.0"}],
                }
            ]
        }
    }

    async def fake_ask_codex(config, system, user):
        return {
            "plan": [
                {
                    "type": "package",
                    "name": "Microsoft.Extensions.Logging",
                    "toVersion": "6.0.0",
                    "action": "upgrade",
                }
            ],
        }

    monkeypatch.setattr("migration_agent.core.planner.ask_ai", fake_ask_codex)

    plan = asyncio.run(build_migration_plan(analysis, rules, AiConfig(use_ai=True, provider="codex")))

    assert analysis["planningMode"] == "rule-based"
    assert [item["type"] for item in plan] == ["framework"]


def test_build_migration_plan_rejects_invalid_ai_plan_shape(monkeypatch):
    rules = {
        "targetFrameworkChange": {"from": "net6.0", "to": "net8.0"},
        "packageChanges": [],
    }
    analysis = {
        "manifest": {
            "projects": [
                {
                    "path": "Sample.csproj",
                    "targetFrameworks": ["net6.0"],
                    "packages": [{"name": "Microsoft.Extensions.Logging", "version": "6.0.0"}],
                }
            ]
        }
    }

    async def fake_ask_codex(config, system, user):
        return {"plan": {"type": "package", "name": "Microsoft.Extensions.Logging"}}

    monkeypatch.setattr("migration_agent.core.planner.ask_ai", fake_ask_codex)

    plan = asyncio.run(build_migration_plan(analysis, rules, AiConfig(use_ai=True, provider="codex")))

    assert analysis["planningMode"] == "rule-based"
    assert [item["type"] for item in plan] == ["framework"]


def test_build_migration_plan_expands_related_ai_package_families(monkeypatch):
    rules = {
        "targetFrameworkChange": {"from": "net6.0", "to": "net8.0"},
        "packageChanges": [],
    }
    analysis = {
        "from": "dotnet6",
        "to": "dotnet8",
        "manifest": {
            "projects": [
                {
                    "path": "Sample.csproj",
                    "targetFrameworks": ["net6.0"],
                    "packages": [
                        {"name": "Microsoft.EntityFrameworkCore", "version": "6.0.0"},
                        {"name": "Microsoft.EntityFrameworkCore.SqlServer", "version": "6.0.0"},
                        {"name": "Microsoft.EntityFrameworkCore.Relational", "version": "6.0.0"},
                        {"name": "Microsoft.Extensions.Http", "version": "6.0.0"},
                        {"name": "Microsoft.Extensions.Logging", "version": "6.0.0"},
                        {"name": "Microsoft.Extensions.Hosting", "version": "6.0.0"},
                        {"name": "MyCompany.Business.Payment", "version": "6.0.0"},
                    ],
                }
            ]
        }
    }

    async def fake_ask_codex(config, system, user):
        if "packageUpgrades" in user:
            return {
                "summary": "Related installed packages need the same target version.",
                "packageUpgrades": [
                    {
                        "type": "package",
                        "name": "Microsoft.EntityFrameworkCore",
                        "fromVersion": "6.0.0",
                        "toVersion": "8.0.0",
                        "action": "upgrade",
                        "reason": "Direct EF Core reference should align with upgraded EF package dependency.",
                        "evidence": "dependency-family",
                    },
                    {
                        "type": "package",
                        "name": "Microsoft.EntityFrameworkCore.SqlServer",
                        "fromVersion": "6.0.0",
                        "toVersion": "8.0.0",
                        "action": "upgrade",
                        "reason": "SQL Server provider should align with upgraded EF package dependency.",
                        "evidence": "dependency-family",
                    },
                    {
                        "type": "package",
                        "name": "Microsoft.Extensions.Logging",
                        "fromVersion": "6.0.0",
                        "toVersion": "8.0.0",
                        "action": "upgrade",
                        "reason": "Logging direct reference should align with upgraded Extensions dependency.",
                        "evidence": "dependency-family",
                    },
                ],
            }
        return {
            "plan": [
                {
                    "type": "package",
                    "name": "Microsoft.EntityFrameworkCore.Relational",
                    "fromVersion": "6.0.0",
                    "toVersion": "8.0.0",
                    "action": "upgrade",
                    "reason": "Relational package aligns with target framework.",
                    "evidence": "target-framework",
                },
                {
                    "type": "package",
                    "name": "Microsoft.Extensions.Http",
                    "fromVersion": "6.0.0",
                    "toVersion": "8.0.0",
                    "action": "upgrade",
                    "reason": "HTTP package aligns with target framework.",
                    "evidence": "target-framework",
                },
                {
                    "type": "package",
                    "name": "Microsoft.Extensions.Hosting",
                    "fromVersion": "6.0.0",
                    "toVersion": "8.0.0",
                    "action": "upgrade",
                    "reason": "Hosting package aligns with target framework.",
                    "evidence": "target-framework",
                },
            ],
        }

    monkeypatch.setattr("migration_agent.core.planner.ask_ai", fake_ask_codex)

    plan = asyncio.run(build_migration_plan(analysis, rules, AiConfig(use_ai=True, provider="codex")))
    packages = {item["name"]: item for item in plan if item["type"] == "dependency"}

    assert set(packages) == {
        "Microsoft.EntityFrameworkCore",
        "Microsoft.EntityFrameworkCore.SqlServer",
        "Microsoft.EntityFrameworkCore.Relational",
        "Microsoft.Extensions.Http",
        "Microsoft.Extensions.Logging",
        "Microsoft.Extensions.Hosting",
    }
    assert packages["Microsoft.EntityFrameworkCore.Relational"]["source"] == "ai"
    assert packages["Microsoft.EntityFrameworkCore"]["source"] == "ai-inferred"
    assert packages["Microsoft.Extensions.Logging"]["source"] == "ai-inferred"


def test_parse_nu1605_downgrades():
    output = """
    error NU1605: Warning As Error: Detected package downgrade: Microsoft.Extensions.Logging from 8.0.0 to 6.0.0.
     Sample -> Microsoft.Extensions.Http 8.0.0 -> Microsoft.Extensions.Logging (>= 8.0.0)
     Sample -> Microsoft.Extensions.Logging (>= 6.0.0)
    """

    assert _parse_nu1605_downgrades(output) == [
        {
            "name": "Microsoft.Extensions.Logging",
            "requiredVersion": "8.0.0",
            "currentVersion": "6.0.0",
        }
    ]


def test_repair_package_downgrades_from_validation_creates_safe_package_change():
    analysis = {
        "to": "dotnet8",
        "manifest": {
            "projects": [
                {
                    "path": "Sample.csproj",
                    "packages": [
                        {"name": "Microsoft.Extensions.Http", "version": "6.0.0"},
                        {"name": "Microsoft.Extensions.Logging", "version": "6.0.0"},
                    ],
                }
            ]
        },
    }
    plan = [
        {
            "type": "package",
            "priority": 2,
            "name": "Microsoft.Extensions.Http",
            "fromVersion": "6.0.0",
            "toVersion": "8.0.0",
            "action": "upgrade",
            "source": "ai",
        }
    ]
    validation = {
        "passed": False,
        "errors": "NU1605: Detected package downgrade: Microsoft.Extensions.Logging from 8.0.0 to 6.0.0.",
    }

    async def fake_ask_codex(config, system, user):
        return {
            "summary": "Repair package downgrade.",
            "packageUpgrades": [
                {
                    "type": "package",
                    "name": "Microsoft.Extensions.Logging",
                    "fromVersion": "6.0.0",
                    "toVersion": "8.0.0",
                    "action": "upgrade",
                    "reason": "NU1605 requires Microsoft.Extensions.Logging 8.0.0.",
                    "evidence": "NU1605",
                }
            ],
        }

    from pytest import MonkeyPatch

    monkeypatch = MonkeyPatch()
    monkeypatch.setattr("migration_agent.core.planner.ask_ai", fake_ask_codex)
    repairs = asyncio.run(repair_package_downgrades_from_validation(validation, analysis, plan, {}, AiConfig(use_ai=True, provider="codex")))
    monkeypatch.undo()

    assert repairs == [
        {
            "type": "dependency",
            "priority": 2,
            "name": "Microsoft.Extensions.Logging",
            "fromVersion": "6.0.0",
            "toVersion": "8.0.0",
            "action": "upgrade",
            "manager": "unknown",
            "ecosystem": "unknown",
            "sourceFile": "Sample.csproj",
            "source": "ai-validation-repair",
            "reason": "NU1605 requires Microsoft.Extensions.Logging 8.0.0.",
            "evidence": "NU1605",
            "description": "Upgrade Microsoft.Extensions.Logging for compatibility with the target framework.",
        }
    ]


def test_repair_package_downgrades_rejects_domain_package():
    analysis = {
        "to": "dotnet8",
        "manifest": {
            "projects": [
                {
                    "path": "Sample.csproj",
                    "packages": [{"name": "MyCompany.Business.Payment", "version": "6.0.0"}],
                }
            ]
        },
    }
    validation = {
        "passed": False,
        "errors": "NU1605: Detected package downgrade: MyCompany.Business.Payment from 8.0.0 to 6.0.0.",
    }

    assert asyncio.run(repair_package_downgrades_from_validation(validation, analysis, [], {}, AiConfig())) == []


def test_repair_dependency_conflicts_wrapper_rejects_without_safe_ai():
    analysis = {
        "manifest": {
            "projects": [
                {
                    "path": "Sample.csproj",
                    "packages": [{"name": "Microsoft.Extensions.Logging", "version": "6.0.0"}],
                }
            ]
        },
    }
    validation = {
        "passed": False,
        "errors": "NU1605: Detected package downgrade: Microsoft.Extensions.Logging from 8.0.0 to 6.0.0.",
    }

    assert asyncio.run(repair_dependency_conflicts_from_validation(validation, analysis, [], {}, AiConfig())) == []


def test_report_lists_ai_suggested_package_upgrades():
    plan = [
        {
            "type": "dependency",
            "priority": 2,
            "source": "ai",
            "name": "Present.Package",
            "fromVersion": "6.*",
            "toVersion": "8.0.0",
            "action": "upgrade",
            "description": "Upgrade Present.Package.",
        }
    ]
    results = [
        {
            "change": plan[0],
            "status": "done",
            "files": ["Sample.csproj"],
        }
    ]

    report = generate_report(
        plan,
        results,
        {
            "from": "dotnet6",
            "to": "dotnet8",
            "riskLevel": "low",
            "confidence": 80,
            "analysisMode": "codex",
            "planningMode": "codex",
            "findings": [],
        },
        {"passed": True, "output": "Build succeeded."},
    )

    assert "## AI Suggested Package Upgrades" in report
    assert "- [done] Present.Package: 6.* -> 8.0.0 (Sample.csproj)" in report


def test_report_lists_ai_inferred_packages_without_labeling_them_as_framework_changes():
    plan = [
        {
            "type": "framework",
            "priority": 1,
            "source": "ai",
            "file": "Sample.csproj",
            "find": "net6.0",
            "replace": "net8.0",
            "description": "Update target framework.",
        },
        {
            "type": "dependency",
            "priority": 2,
            "source": "ai-inferred",
            "name": "Microsoft.Extensions.Logging",
            "fromVersion": "6.0.0",
            "toVersion": "8.0.0",
            "action": "upgrade",
            "description": "Repair NU1605 package downgrade.",
        },
    ]
    results = [
        {"change": plan[0], "status": "done", "files": ["Sample.csproj"]},
        {"change": plan[1], "status": "done", "files": ["Sample.csproj"]},
    ]

    report = generate_report(
        plan,
        results,
        {
            "from": "dotnet6",
            "to": "dotnet8",
            "riskLevel": "low",
            "confidence": 80,
            "analysisMode": "codex",
            "planningMode": "codex",
            "findings": [],
        },
        {"passed": True, "output": "Build succeeded."},
    )

    assert "- [done] Microsoft.Extensions.Logging: 6.0.0 -> 8.0.0 (Sample.csproj)" in report
    assert "- [done] framework [ai]: Update target framework." in report
    assert "- [done] dependency [ai-inferred]: Repair NU1605 package downgrade." in report
