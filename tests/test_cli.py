"""`graphite.cli`: the `graphite tui`/`graphite serve` console script
(spec 02 sec. 3, process model)."""

from __future__ import annotations

from unittest.mock import patch

from typer.testing import CliRunner

from graphite.cli import app

runner = CliRunner()


# frob:tests graphite/cli.py::serve
def test_serve_rejects_non_localhost_host():
    result = runner.invoke(app, ["serve", ".", "--host", "0.0.0.0"])
    assert result.exit_code != 0


# frob:tests graphite/cli.py::serve
def test_serve_binds_localhost(tmp_path):
    with patch("uvicorn.run") as mock_run:
        result = runner.invoke(app, ["serve", str(tmp_path), "--host", "127.0.0.1"])
        assert result.exit_code == 0
        mock_run.assert_called_once()


# frob:tests graphite/cli.py::serve
# frob:tests graphite/service/kill_switch.py kind="integration"
# frob:ticket T-0016
def test_serve_refuses_when_offline_engaged(tmp_path, monkeypatch):
    monkeypatch.setenv("GRAPHITE_OFFLINE", "1")
    with patch("uvicorn.run") as mock_run:
        result = runner.invoke(app, ["serve", str(tmp_path), "--host", "127.0.0.1"])
        assert result.exit_code != 0
        mock_run.assert_not_called()


# frob:tests graphite/cli.py::serve
# frob:ticket T-0016
def test_serve_binds_when_offline_unset(tmp_path, monkeypatch):
    monkeypatch.delenv("GRAPHITE_OFFLINE", raising=False)
    with patch("uvicorn.run") as mock_run:
        result = runner.invoke(app, ["serve", str(tmp_path), "--host", "127.0.0.1"])
        assert result.exit_code == 0
        mock_run.assert_called_once()


# frob:tests graphite/cli.py::tui
def test_tui_launches_app(tmp_path):
    with patch("graphite.tui.app.GraphiteApp") as mock_app:
        result = runner.invoke(app, ["tui", str(tmp_path)])
        assert result.exit_code == 0
        mock_app.assert_called_once()
        mock_app.return_value.run.assert_called_once()
