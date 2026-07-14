"""`GraphiteApp` root: keyboard map parity checks -- `?` opens the
shortcut sheet, ctrl+k is the command palette binding (rebound from
textual's ctrl+p default to match the web app, spec 03 sec. 3.5)."""

from __future__ import annotations

import pytest
from graphite.tui.app import GraphiteApp, ShortcutSheet


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
