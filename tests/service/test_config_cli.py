"""`graphite.service.config_cli`: `regolith config`/`doctor` subprocess
wrappers, against the fixture project."""

from __future__ import annotations

from pathlib import Path
from unittest.mock import patch

import pytest
from typani.result import Ok

from graphite.service.config_cli import (
    doctor,
    get_config,
    key_defaults,
    list_config,
    set_config,
)


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


def test_set_config_then_reset_to_default(timber_pavilion: Path) -> None:
    set_result = set_config(timber_pavilion, "ui.port", "9999", "local")
    assert set_result.is_ok
    assert set_result.danger_ok.value == "9999"
    assert set_result.danger_ok.source == "project"

    default_value = next(d.default for d in key_defaults() if d.key == "ui.port")
    reset_result = set_config(timber_pavilion, "ui.port", str(default_value), "local")
    assert reset_result.is_ok
    assert reset_result.danger_ok.value == str(default_value)


def test_set_config_unknown_key_is_a_cli_error(timber_pavilion: Path) -> None:
    result = set_config(timber_pavilion, "does.not.exist", "1", "local")
    assert result.is_err
    assert result.danger_err.kind == "cli_failed"
    assert "does.not.exist" in result.danger_err.detail


def test_key_defaults_covers_registered_keys() -> None:
    defaults = key_defaults()
    keys = {d.key for d in defaults}
    assert "ui.port" in keys
    port_default = next(d for d in defaults if d.key == "ui.port")
    assert port_default.default == 8765
    assert port_default.kind == "int"


def test_doctor_returns_a_list(timber_pavilion: Path) -> None:
    result = doctor(timber_pavilion)
    assert result.is_ok
    assert isinstance(result.danger_ok, list)


# frob:tests graphite/service/config_cli.py::doctor
# frob:ticket T-0020
def test_doctor_parse_error_on_bad_json(timber_pavilion: Path) -> None:
    # `doctor` hands `regolith doctor --json`'s stdout straight to
    # json.loads (module docstring) -- exercises the JSONDecodeError
    # branch without depending on the real CLI ever emitting bad JSON.
    with patch("graphite.service.config_cli._run", return_value=Ok("not json at all")):
        result = doctor(timber_pavilion)
    assert result.is_err
    assert result.danger_err.kind == "parse_error"


# frob:tests graphite/service/config_cli.py::doctor
# frob:ticket T-0016
def test_doctor_refuses_when_no_exec_engaged(
    timber_pavilion: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("GRAPHITE_NO_EXEC", "1")
    result = doctor(timber_pavilion)
    assert result.is_err
    assert result.danger_err.kind == "capability_disabled"


# frob:tests graphite/service/config_cli.py::_run
# frob:ticket T-0016
def test_list_config_refuses_when_no_exec_engaged(
    timber_pavilion: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("GRAPHITE_NO_EXEC", "1")
    result = list_config(timber_pavilion)
    assert result.is_err
    assert result.danger_err.kind == "capability_disabled"


# frob:tests graphite/service/config_cli.py::_run
# frob:ticket T-0016
def test_list_config_normal_path_when_no_exec_unset(
    timber_pavilion: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.delenv("GRAPHITE_NO_EXEC", raising=False)
    result = list_config(timber_pavilion)
    assert result.is_ok
