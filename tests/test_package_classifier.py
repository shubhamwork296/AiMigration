import pytest

from migration_agent.adapters.package_classifier import ClassificationSafety
from migration_agent.adapters.package_classifier import classify_packages
from migration_agent.adapters.package_classifier import package_by_name
from migration_agent.adapters.package_classifier import validate_package_classification
from migration_agent.ai.provider import AiConfig


def test_fallback_classifies_framework_package_for_target_alignment():
    result = classify_packages(
        ai_config=AiConfig(),
        runtime="angular",
        current_version=14,
        target_version=15,
        dependencies=[{"name": "@angular/core", "version": "14.2.0", "section": "dependencies"}],
        dev_dependencies=[],
        npm_metadata={"@angular/core": {"peerDependencies": {}}},
    )

    package = package_by_name(result)["@angular/core"]
    assert package["role"] == "framework-core"
    assert package["recommendedAction"] == "upgrade-with-framework-target"


def test_invalid_ai_package_entry_is_rejected_safely():
    result = validate_package_classification(
        {"packages": ["bad"], "blockers": []},
        direct_package_names={"left-pad"},
    )

    assert result["packages"] == []
    assert result["warnings"]


def test_unknown_package_is_warning_defer_not_blocker():
    result = validate_package_classification(
        {
            "packages": [
                {
                    "name": "mystery",
                    "role": "unknown",
                    "recommendedAction": "keep-current",
                    "blocking": True,
                }
            ],
            "blockers": [{"package": "mystery", "reason": "unknown"}],
        },
        direct_package_names={"mystery"},
    )

    package = result["packages"][0]
    assert package["role"] == "unknown"
    assert package["blocking"] is False
    assert result["blockers"] == []


def test_third_party_peer_warning_cannot_be_blocker_in_preflight():
    result = validate_package_classification(
        {
            "packages": [
                {
                    "name": "ngx-widget",
                    "role": "third-party-framework-library",
                    "recommendedAction": "warn-only",
                    "blocking": True,
                }
            ],
            "blockers": [{"package": "ngx-widget", "reason": "old peer"}],
        },
        direct_package_names={"ngx-widget"},
        safety=ClassificationSafety(preflight_remediation_mode="suggest"),
    )

    assert result["packages"][0]["blocking"] is False
    assert result["blockers"] == []


def test_framework_coupled_package_uses_target_major_action_not_latest():
    result = validate_package_classification(
        {
            "packages": [
                {
                    "name": "@framework/ui",
                    "role": "framework-coupled-ui",
                    "recommendedAction": "upgrade-with-target-major",
                    "blocking": False,
                }
            ]
        },
        direct_package_names={"@framework/ui"},
    )

    assert result["packages"][0]["recommendedAction"] == "upgrade-with-target-major"


def test_angular_devkit_build_angular_is_framework_coupled_tooling():
    result = classify_packages(
        ai_config=AiConfig(),
        runtime="angular",
        current_version=14,
        target_version=15,
        dependencies=[],
        dev_dependencies=[{"name": "@angular-devkit/build-angular", "version": "14.2.0", "section": "devDependencies"}],
        npm_metadata={"@angular-devkit/build-angular": {"peerDependencies": {}}},
    )

    package = package_by_name(result)["@angular-devkit/build-angular"]
    assert package["role"] == "framework-coupled-tooling"
    assert package["recommendedAction"] == "upgrade-with-target-major"


def test_angular_compiler_cli_is_framework_compiler():
    result = classify_packages(
        ai_config=AiConfig(),
        runtime="angular",
        current_version=14,
        target_version=15,
        dependencies=[],
        dev_dependencies=[{"name": "@angular/compiler-cli", "version": "14.2.0", "section": "devDependencies"}],
        npm_metadata={"@angular/compiler-cli": {"peerDependencies": {}}},
    )

    package = package_by_name(result)["@angular/compiler-cli"]
    assert package["role"] == "framework-compiler"
    assert package["recommendedAction"] == "upgrade-with-framework-target"


def test_ai_cannot_request_preflight_third_party_mutation_in_suggest_mode():
    result = validate_package_classification(
        {
            "packages": [
                {
                    "name": "third-party-widget",
                    "role": "third-party-framework-library",
                    "recommendedAction": "upgrade-with-framework-target",
                    "blocking": False,
                }
            ]
        },
        direct_package_names={"third-party-widget"},
        safety=ClassificationSafety(preflight_remediation_mode="suggest"),
    )

    assert result["packages"][0]["recommendedAction"] == "warn-only"


def test_business_logic_safety_defaults_to_false():
    safety = ClassificationSafety()

    assert safety.allow_business_logic_changes is False
