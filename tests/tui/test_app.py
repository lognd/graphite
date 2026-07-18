"""`GraphiteApp` root: keyboard map parity checks -- `?` opens the
shortcut sheet, ctrl+k is the command palette binding (rebound from
textual's ctrl+p default to match the web app, spec 03 sec. 3.5)."""

from __future__ import annotations

import pytest
from graphite.tui.app import GraphiteApp, NavigationProvider, ShortcutSheet
from graphite.tui.screens.config import ConfigScreen
from graphite.tui.screens.dashboard import DashboardScreen
from graphite.tui.screens.obligations import ObligationsScreen
from graphite.tui.screens.run_console import RunConsoleScreen


# frob:tests graphite/tui/app.py::GraphiteApp.action_show_help kind="unit"
# frob:tests graphite/tui/app.py::ShortcutSheet.compose kind="unit"
@pytest.mark.asyncio
async def test_question_mark_opens_shortcut_sheet(fixture_scan_root):
    app = GraphiteApp(project_root=fixture_scan_root)
    async with app.run_test(size=(120, 60)) as pilot:
        await pilot.pause()
        await pilot.press("question_mark")
        await pilot.pause()
        assert isinstance(app.screen, ShortcutSheet)


def test_command_palette_bound_to_ctrl_k():
    assert GraphiteApp.COMMAND_PALETTE_BINDING == "ctrl+k"


# frob:tests graphite/tui/app.py::ShortcutSheet.on_key kind="unit"
@pytest.mark.asyncio
async def test_shortcut_sheet_dismissed_by_any_key(fixture_scan_root):
    """`ShortcutSheet.on_key` dismisses the modal on ANY keypress, not
    just escape -- the "any key closes it" contract in its docstring."""
    app = GraphiteApp(project_root=fixture_scan_root)
    async with app.run_test(size=(120, 60)) as pilot:
        await pilot.pause()
        await pilot.press("question_mark")
        await pilot.pause()
        assert isinstance(app.screen, ShortcutSheet)
        await pilot.press("x")
        await pilot.pause()
        assert not isinstance(app.screen, ShortcutSheet)


# frob:tests graphite/tui/app.py::GraphiteApp.on_mount kind="unit"
@pytest.mark.asyncio
async def test_app_on_mount_pushes_dashboard(fixture_scan_root):
    app = GraphiteApp(project_root=fixture_scan_root)
    async with app.run_test(size=(120, 60)) as pilot:
        await pilot.pause()
        assert isinstance(app.screen, DashboardScreen)


# frob:tests graphite/tui/app.py::NavigationProvider.search kind="unit"
@pytest.mark.asyncio
async def test_navigation_provider_search_yields_known_commands(fixture_scan_root):
    """The ctrl+k palette provider matches the fixed surface commands
    plus a "set active project" entry per discovered fleet member."""
    app = GraphiteApp(project_root=fixture_scan_root)
    async with app.run_test(size=(120, 60)) as pilot:
        await pilot.pause()
        provider = NavigationProvider(app.screen)
        hits = [hit async for hit in provider.search("run console")]
        assert any("run console" in str(hit.match_display) for hit in hits)
        hits = [hit async for hit in provider.search("set active project")]
        assert any("set active project" in str(hit.match_display) for hit in hits)


# frob:tests graphite/tui/app.py::GraphiteApp.action_go_dashboard kind="unit"
# frob:tests graphite/tui/app.py::GraphiteApp.action_go_run_console kind="unit"
@pytest.mark.asyncio
async def test_action_go_dashboard_and_run_console_push_screens(fixture_scan_root):
    app = GraphiteApp(project_root=fixture_scan_root)
    async with app.run_test(size=(120, 60)) as pilot:
        await pilot.pause()
        app.action_go_run_console()
        await pilot.pause()
        assert isinstance(app.screen, RunConsoleScreen)
        app.action_go_dashboard()
        await pilot.pause()
        assert isinstance(app.screen, DashboardScreen)


# frob:tests graphite/tui/app.py::GraphiteApp.action_go_config kind="unit"
# frob:tests graphite/tui/app.py::GraphiteApp.action_go_obligations kind="unit"
@pytest.mark.asyncio
async def test_action_go_config_and_obligations_push_screens(fixture_scan_root):
    app = GraphiteApp(project_root=fixture_scan_root)
    async with app.run_test(size=(120, 60)) as pilot:
        await pilot.pause()
        app.action_go_config()
        await pilot.pause()
        assert isinstance(app.screen, ConfigScreen)
        app.action_go_obligations()
        await pilot.pause()
        assert isinstance(app.screen, ObligationsScreen)


# frob:tests graphite/tui/app.py::GraphiteApp.set_active_project kind="unit"
# frob:tests graphite/tui/screens kind="integration"
@pytest.mark.asyncio
async def test_set_active_project_retargets_surface_shortcuts(
    fixture_scan_root, timber_pavilion
):
    """WOG7-F1 (closed at WO-G8): the palette's set-active-project
    command repoints the run-console/config/obligations shortcuts
    without changing the dashboard's scan root."""
    app = GraphiteApp(project_root=fixture_scan_root)
    async with app.run_test(size=(120, 60)) as pilot:
        await pilot.pause()
        assert app.active_project == fixture_scan_root.resolve()
        app.set_active_project(timber_pavilion)
        await pilot.pause()
        assert app.active_project == timber_pavilion.resolve()
        assert app.scan_root == fixture_scan_root.resolve()


# frob:tests graphite/tui/app.py kind="integration"
@pytest.mark.asyncio
async def test_dashboard_drilldown_sets_active_project(
    fixture_scan_root, timber_pavilion
):
    """Entering a dashboard row makes that project the active one, so
    the ctrl+k surface shortcuts follow the user's focus."""
    app = GraphiteApp(project_root=fixture_scan_root)
    async with app.run_test(size=(120, 60)) as pilot:
        await pilot.pause()
        await pilot.press("enter")
        await pilot.pause()
        assert app.active_project == timber_pavilion.resolve()
