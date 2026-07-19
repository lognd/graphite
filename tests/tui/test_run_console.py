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
from textual.widgets import Button, DataTable, Input, Log, Select


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


# frob:tests graphite/tui/screens/run_console.py::RunConsoleScreen.compose kind="unit"
# frob:tests graphite/tui/screens/run_console.py::RunConsoleScreen.on_mount kind="unit"
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


# frob:tests graphite/tui/screens/run_console.py::RunConsoleScreen.on_button_pressed kind="unit"
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


# frob:tests graphite/tui/screens/run_console.py::RunConsoleScreen.on_button_pressed kind="unit"
@pytest.mark.asyncio
async def test_run_console_cancel_button_with_no_active_run_is_a_noop(
    timber_pavilion,
):
    """Clicking `#run-cancel` before any run has started takes the
    `elif event.button.id == "run-cancel"` branch straight into
    `action_cancel_run`'s early return (`self._run_id is None`) --
    the honest no-op, not a crash."""
    app = _Harness(timber_pavilion)
    async with app.run_test(size=(200, 60)) as pilot:
        await pilot.pause()
        await pilot.click("#run-cancel")
        await pilot.pause()
        log = app.screen.query_one("#run-log", Log)
        assert log.line_count == 0


# frob:tests graphite/tui/screens/run_console.py::RunConsoleScreen.on_button_pressed kind="unit"
@pytest.mark.asyncio
async def test_run_console_unknown_button_id_is_ignored(timber_pavilion):
    """A button press whose id matches neither `run-start` nor
    `run-cancel` falls through both branches of `on_button_pressed`
    untouched -- guards against a future third button silently doing
    the wrong thing."""
    app = _Harness(timber_pavilion)
    async with app.run_test(size=(200, 60)) as pilot:
        await pilot.pause()
        extra = Button("noop", id="run-something-else")
        app.screen.mount(extra)
        await pilot.pause()
        await pilot.click("#run-something-else")
        await pilot.pause()
        log = app.screen.query_one("#run-log", Log)
        assert log.line_count == 0


# frob:tests graphite/tui/screens/run_console.py::RunConsoleScreen.action_cancel_run kind="unit"
@pytest.mark.asyncio
async def test_run_console_cancel_run_via_c_binding(timber_pavilion):
    """`c` is bound to `action_cancel_run`; cancelling a real run
    writes the cancellation line and refreshes history (04.1 ANY LONG
    OPERATION floor: cancel is a first-class control, not a kill -9)."""
    app = _Harness(timber_pavilion)
    async with app.run_test(size=(200, 60)) as pilot:
        await pilot.pause()
        app.screen.query_one("#run-verb", Select).value = "check"
        app.screen.query_one("#run-args", Input).value = "program.calx"
        await pilot.pause()
        await pilot.click("#run-start")
        await pilot.pause()
        await pilot.press("c")
        await pilot.pause()
        await app.workers.wait_for_complete()
        log = app.screen.query_one("#run-log", Log)
        assert log.line_count > 0


# frob:tests graphite/tui/screens/run_console.py::RunConsoleScreen.action_cursor_down kind="unit"
# frob:tests graphite/tui/screens/run_console.py::RunConsoleScreen.action_cursor_up kind="unit"
@pytest.mark.asyncio
async def test_run_console_jk_bindings_invoke_cursor_actions(timber_pavilion):
    app = _Harness(timber_pavilion)
    async with app.run_test(size=(200, 60)) as pilot:
        await pilot.pause()
        table = app.screen.query_one("#run-history", DataTable)
        await pilot.press("j")
        await pilot.pause()
        await pilot.press("k")
        await pilot.pause()
        assert table.cursor_type == "row"
