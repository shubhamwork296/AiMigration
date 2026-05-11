import pytest

from migration_agent.adapters import find_adapter


class ExplodingDetectAdapter:
    runtime = "custom"

    def detect(self, project_path):
        raise AssertionError("adapter selection must not inspect project files")


def test_find_adapter_uses_selected_runtime_without_detection(monkeypatch):
    adapter = ExplodingDetectAdapter()
    monkeypatch.setattr("migration_agent.adapters.ADAPTERS", [adapter])

    assert find_adapter("custom", project_path="unused") is adapter


def test_find_adapter_rejects_unregistered_runtime(monkeypatch):
    monkeypatch.setattr("migration_agent.adapters.ADAPTERS", [ExplodingDetectAdapter()])

    with pytest.raises(ValueError, match="No adapter registered for runtime 'java'"):
        find_adapter("java", project_path="unused")
