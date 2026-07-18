"""`DashboardScreen`'s data path: the fixture fleet renders its census
row, and drilling into it pushes `ObligationsScreen`."""

from __future__ import annotations

import pytest
from graphite.tui.app import GraphiteApp
from graphite.tui.screens.obligations import ObligationsScreen
from textual.widgets import DataTable


# frob:tests graphite/tui/screens/dashboard.py::DashboardScreen.compose kind="unit"
# frob:tests graphite/tui/screens/dashboard.py::DashboardScreen.on_mount kind="unit"
@pytest.mark.asyncio
async def test_dashboard_lists_fixture_project(fixture_scan_root):
    app = GraphiteApp(project_root=fixture_scan_root)
    async with app.run_test(size=(120, 60)) as pilot:
        await pilot.pause()
        table = app.screen.query_one("#fleet-table", DataTable)
        assert table.row_count == 1
        row = table.get_row_at(0)
        assert row[0] == "examples.timber_pavilion"


# frob:tests graphite/tui/screens/dashboard.py::DashboardScreen.action_refresh kind="unit"
# frob:tests graphite/tui/widgets.py kind="integration"
@pytest.mark.asyncio
async def test_dashboard_empty_scan_root_is_honest(tmp_path):
    empty_root = tmp_path / "nothing-here"
    empty_root.mkdir()
    app = GraphiteApp(project_root=empty_root)
    async with app.run_test(size=(120, 60)) as pilot:
        await pilot.pause()
        table = app.screen.query_one("#fleet-table", DataTable)
        assert table.row_count == 0


# frob:tests graphite/tui/screens/dashboard.py::DashboardScreen.on_data_table_row_selected kind="unit"
# frob:tests graphite/tui/screens/dashboard.py::DashboardScreen.action_open_project kind="unit"
@pytest.mark.asyncio
async def test_dashboard_enter_drills_into_obligations(fixture_scan_root):
    app = GraphiteApp(project_root=fixture_scan_root)
    async with app.run_test(size=(120, 60)) as pilot:
        await pilot.pause()
        await pilot.press("enter")
        await pilot.pause()
        assert isinstance(app.screen, ObligationsScreen)


# frob:tests graphite/tui/screens/dashboard.py::DashboardScreen.action_cursor_down kind="unit"
# frob:tests graphite/tui/screens/dashboard.py::DashboardScreen.action_cursor_up kind="unit"
@pytest.mark.asyncio
async def test_dashboard_jk_bindings_invoke_cursor_actions(fixture_scan_root):
    """`j`/`k` are bound to the cursor-move actions on the census
    table (charter sec. 2.2 -- j/k list navigation everywhere)."""
    app = GraphiteApp(project_root=fixture_scan_root)
    async with app.run_test(size=(120, 60)) as pilot:
        await pilot.pause()
        table = app.screen.query_one("#fleet-table", DataTable)
        await pilot.press("j")
        await pilot.pause()
        await pilot.press("k")
        await pilot.pause()
        assert table.cursor_type == "row"
