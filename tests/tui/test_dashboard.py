"""`DashboardScreen`'s data path: the fixture fleet renders its census
row, and drilling into it pushes `ObligationsScreen`."""

from __future__ import annotations

import pytest
from graphite.tui.app import GraphiteApp
from graphite.tui.screens.obligations import ObligationsScreen
from textual.widgets import DataTable


@pytest.mark.asyncio
async def test_dashboard_lists_fixture_project(fixture_scan_root):
    app = GraphiteApp(project_root=fixture_scan_root)
    async with app.run_test(size=(120, 60)) as pilot:
        await pilot.pause()
        table = app.screen.query_one("#fleet-table", DataTable)
        assert table.row_count == 1
        row = table.get_row_at(0)
        assert row[0] == "examples.timber_pavilion"


@pytest.mark.asyncio
async def test_dashboard_empty_scan_root_is_honest(tmp_path):
    empty_root = tmp_path / "nothing-here"
    empty_root.mkdir()
    app = GraphiteApp(project_root=empty_root)
    async with app.run_test(size=(120, 60)) as pilot:
        await pilot.pause()
        table = app.screen.query_one("#fleet-table", DataTable)
        assert table.row_count == 0


@pytest.mark.asyncio
async def test_dashboard_enter_drills_into_obligations(fixture_scan_root):
    app = GraphiteApp(project_root=fixture_scan_root)
    async with app.run_test(size=(120, 60)) as pilot:
        await pilot.pause()
        await pilot.press("enter")
        await pilot.pause()
        assert isinstance(app.screen, ObligationsScreen)
