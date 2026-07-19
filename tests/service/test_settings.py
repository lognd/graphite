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
    settings_home,
)


@pytest.fixture(autouse=True)
def _graphite_home(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("GRAPHITE_HOME", str(tmp_path / "graphite-home"))


def test_get_settings_defaults_when_no_file_yet() -> None:
    result = get_settings()
    assert result.is_ok
    assert result.danger_ok == GraphiteSettings()


# frob:tests graphite/service/settings.py::settings_home kind="unit"
def test_settings_home_reads_env_var(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("GRAPHITE_HOME", str(tmp_path / "custom-home"))
    assert settings_home() == tmp_path / "custom-home"


# frob:tests graphite/service/settings.py::set_settings kind="unit"
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
    set_settings(
        GraphiteSettings(default_project_root="/tmp/proj", run_verbosity="quiet")
    )
    reset_result = reset_settings()
    assert reset_result.is_ok
    assert reset_result.danger_ok == GraphiteSettings()
    assert get_settings().danger_ok == GraphiteSettings()


# frob:tests graphite/service/settings.py::get_settings kind="unit"
def test_get_settings_malformed_json_is_a_service_error() -> None:
    path = settings_home() / "settings.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("{not valid json")

    result = get_settings()
    assert result.is_err
    assert result.danger_err.kind == "io_error"
    assert "cannot read" in result.danger_err.message


# frob:tests graphite/service/settings.py::get_settings kind="unit"
def test_get_settings_invalid_shape_is_a_service_error() -> None:
    path = settings_home() / "settings.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text('{"run_verbosity": "way-too-loud"}')

    result = get_settings()
    assert result.is_err
    assert result.danger_err.kind == "invalid_input"
    assert "invalid settings" in result.danger_err.message


# frob:tests graphite/service/settings.py::get_settings kind="unit"
def test_get_settings_unreadable_file_is_an_io_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    path = settings_home() / "settings.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("{}")

    def _boom(self: Path) -> str:
        raise OSError("permission denied")

    monkeypatch.setattr(Path, "read_text", _boom)

    result = get_settings()
    assert result.is_err
    assert result.danger_err.kind == "io_error"


# frob:tests graphite/service/settings.py::set_settings kind="unit"
def test_set_settings_write_failure_is_an_io_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def _boom(self: Path, *args: object, **kwargs: object) -> int:
        raise OSError("disk full")

    monkeypatch.setattr(Path, "write_text", _boom)

    result = set_settings(GraphiteSettings(default_project_root="/tmp/x"))
    assert result.is_err
    assert result.danger_err.kind == "io_error"
    assert "cannot write" in result.danger_err.message
