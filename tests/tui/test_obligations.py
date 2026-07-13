"""`ObligationsScreen`'s data path: the fixture's real
`dist/calc/audit_index.json` renders its summary counts and rows,
verdict-colored, with reason grouping for deferred/violated rows."""

from __future__ import annotations

import pytest
from graphite.tui.screens.obligations import ObligationsScreen
from textual.app import App
from textual.widgets import DataTable, Static


class _Harness(App[None]):
    def __init__(self, project_root):
        super().__init__()
        self._project_root = project_root

    def on_mount(self) -> None:
        self.push_screen(ObligationsScreen(self._project_root))


@pytest.mark.asyncio
async def test_obligations_renders_fixture_summary(timber_pavilion):
    app = _Harness(timber_pavilion)
    async with app.run_test(size=(120, 60)) as pilot:
        await pilot.pause()
        summary = str(app.screen.query_one("#obligations-summary", Static).render())
        assert "obligations=" in summary
        assert "balanced=" in summary
        table = app.screen.query_one("#obligations-table", DataTable)
        assert table.row_count > 0


@pytest.mark.asyncio
async def test_obligations_missing_audit_index_is_honest_empty_state(tmp_path):
    empty_project = tmp_path / "fresh"
    empty_project.mkdir()
    app = _Harness(empty_project)
    async with app.run_test(size=(120, 60)) as pilot:
        await pilot.pause()
        summary = str(app.screen.query_one("#obligations-summary", Static).render())
        assert "no audit index" in summary
        table = app.screen.query_one("#obligations-table", DataTable)
        assert table.row_count == 0
