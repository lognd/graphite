"""`RunConsoleScreen`'s data path: a real `regolith check` driven
against the fixture, watched to completion through the SAME
`graphite.service.runs` module the web app's SSE route uses, then
listed in history -- no TUI-local subprocess/parsing code (dedup law:
this screen never shells out itself, it calls `start_run`/
`tail_log_lines`/`get_run` directly)."""

from __future__ import annotations

from pathlib import Path

import pytest
from graphite.tui.screens.run_console import RunConsoleScreen
from textual.app import App
from textual.widgets import DataTable, Input, Log, Select


class _Harness(App[None]):
    def __init__(self, project_root: Path) -> None:
        super().__init__()
        self._project_root = project_root

    def on_mount(self) -> None:
        self.push_screen(RunConsoleScreen(self._project_root))


@pytest.fixture(autouse=True)
def _isolate_graphite_home(tmp_path, monkeypatch):
    monkeypatch.setenv("GRAPHITE_RUNS_HOME", str(tmp_path / "runs-home"))
    monkeypatch.setenv("GRAPHITE_HOME", str(tmp_path / "graphite-home"))


@pytest.mark.asyncio
async def test_run_console_starts_and_completes_a_real_check(timber_pavilion):
    app = _Harness(timber_pavilion)
    async with app.run_test(size=(200, 60)) as pilot:
        await pilot.pause()
        app.screen.query_one("#run-verb", Select).value = "check"
        app.screen.query_one("#run-args", Input).value = "program.calx"
        await pilot.pause()
        await pilot.click("#run-start")
        await pilot.pause()
        await app.workers.wait_for_complete()

        log = app.screen.query_one("#run-log", Log)
        assert log.line_count > 0

        history = app.screen.query_one("#run-history", DataTable)
        assert history.row_count >= 1
        row = history.get_row_at(0)
        assert row[0] == "check"
        assert row[1] in ("ok", "failed")


@pytest.mark.asyncio
async def test_run_console_start_failure_is_honest(tmp_path):
    missing_project = tmp_path / "does-not-exist"
    app = _Harness(missing_project)
    async with app.run_test(size=(200, 60)) as pilot:
        await pilot.pause()
        await pilot.click("#run-start")
        await pilot.pause()
        log = app.screen.query_one("#run-log", Log)
        assert log.line_count >= 1
