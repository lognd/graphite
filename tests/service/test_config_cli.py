"""`graphite.service.config_cli`: `regolith config`/`doctor` subprocess
wrappers, against the fixture project."""

from __future__ import annotations

from pathlib import Path

from graphite.service.config_cli import doctor, get_config, list_config


def test_list_config_over_fixture(timber_pavilion: Path) -> None:
    result = list_config(timber_pavilion)
    assert result.is_ok
    keys = {e.key for e in result.danger_ok}
    assert "ui.port" in keys
    assert all(e.source for e in result.danger_ok)


def test_get_config_one_key(timber_pavilion: Path) -> None:
    result = get_config(timber_pavilion, "ui.port")
    assert result.is_ok
    entry = result.danger_ok
    assert entry.key == "ui.port"
    assert entry.source == "default"


def test_doctor_returns_a_list(timber_pavilion: Path) -> None:
    result = doctor(timber_pavilion)
    assert result.is_ok
    assert isinstance(result.danger_ok, list)
