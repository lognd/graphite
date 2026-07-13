"""`graphite.service.settings`: graphite's own settings, stored under
`GRAPHITE_HOME` (never mixed into regolith config)."""

from __future__ import annotations

from pathlib import Path

import pytest

from graphite.service.settings import (
    GraphiteSettings,
    get_settings,
    reset_settings,
    set_settings,
)


@pytest.fixture(autouse=True)
def _graphite_home(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("GRAPHITE_HOME", str(tmp_path / "graphite-home"))


def test_get_settings_defaults_when_no_file_yet() -> None:
    result = get_settings()
    assert result.is_ok
    assert result.danger_ok == GraphiteSettings()


def test_set_then_get_round_trip() -> None:
    written = set_settings(
        GraphiteSettings(default_project_root="/tmp/proj", run_verbosity="verbose")
    )
    assert written.is_ok

    read_back = get_settings()
    assert read_back.is_ok
    assert read_back.danger_ok.default_project_root == "/tmp/proj"
    assert read_back.danger_ok.run_verbosity == "verbose"


def test_reset_settings_restores_defaults() -> None:
    set_settings(GraphiteSettings(default_project_root="/tmp/proj", run_verbosity="quiet"))
    reset_result = reset_settings()
    assert reset_result.is_ok
    assert reset_result.danger_ok == GraphiteSettings()
    assert get_settings().danger_ok == GraphiteSettings()
