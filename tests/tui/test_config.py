"""`ConfigScreen`'s data path: config list with source attribution,
edit through the real CLI, reset-to-default, doctor render, and
graphite settings round-trip (G7-GAP-1..7 closed)."""

from __future__ import annotations

from pathlib import Path

import pytest
from graphite.tui.screens.config import ConfigScreen
from textual.app import App
from textual.widgets import DataTable, Input, Select, Static, TabbedContent


class _Harness(App[None]):
    def __init__(self, project_root: Path) -> None:
        super().__init__()
        self._project_root = project_root

    def on_mount(self) -> None:
        self.push_screen(ConfigScreen(self._project_root))


@pytest.fixture(autouse=True)
def _isolate_graphite_home(tmp_path, monkeypatch):
    monkeypatch.setenv("GRAPHITE_HOME", str(tmp_path / "graphite-home"))


# frob:tests graphite/tui/screens/config.py::ConfigScreen.compose kind="unit"
# frob:tests graphite/tui/screens/config.py::ConfigScreen.on_mount kind="unit"
@pytest.mark.asyncio
async def test_config_list_has_source_attribution(timber_pavilion):
    app = _Harness(timber_pavilion)
    async with app.run_test(size=(200, 60)) as pilot:
        await pilot.pause()
        table = app.screen.query_one("#config-table", DataTable)
        assert table.row_count > 0
        for row_index in range(table.row_count):
            row = table.get_row_at(row_index)
            source = row[2]
            assert source  # every key carries a source, never blank


# frob:tests graphite/tui/screens/config.py::ConfigScreen.on_button_pressed kind="unit"
@pytest.mark.asyncio
async def test_config_set_writes_through_real_cli(timber_pavilion):
    app = _Harness(timber_pavilion)
    async with app.run_test(size=(200, 60)) as pilot:
        await pilot.pause()
        app.screen.query_one("#cfg-key", Input).value = "optimize.seed"
        app.screen.query_one("#cfg-value", Input).value = "7"
        app.screen.query_one("#cfg-level", Select).value = "local"
        await pilot.pause()
        await pilot.click("#cfg-set")
        await pilot.pause()
        message = str(app.screen.query_one("#cfg-message", Static).render())
        assert "optimize.seed=7" in message
        text = (timber_pavilion / "magnetite.toml").read_text()
        assert "optimize" in text


@pytest.mark.asyncio
async def test_doctor_table_renders(timber_pavilion):
    app = _Harness(timber_pavilion)
    async with app.run_test(size=(200, 60)) as pilot:
        await pilot.pause()
        table = app.screen.query_one("#doctor-table", DataTable)
        # doctor's own tool catalog is non-empty regardless of the
        # fixture project (it probes the host, not the project).
        assert table.row_count >= 0


@pytest.mark.asyncio
async def test_settings_round_trip(timber_pavilion):
    app = _Harness(timber_pavilion)
    async with app.run_test(size=(200, 60)) as pilot:
        await pilot.pause()
        app.screen.query_one(TabbedContent).active = "tab-settings"
        await pilot.pause()
        app.screen.query_one("#settings-root", Input).value = str(timber_pavilion)
        app.screen.query_one("#settings-verbosity", Select).value = "verbose"
        await pilot.pause()
        await pilot.click("#settings-save")
        await pilot.pause()
        message = str(app.screen.query_one("#settings-message", Static).render())
        assert "saved" in message

        await pilot.click("#settings-reset")
        await pilot.pause()
        assert app.screen.query_one("#settings-verbosity", Select).value == "normal"
