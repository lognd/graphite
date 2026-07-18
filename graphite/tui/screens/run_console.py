"""Run console: start `build`/`ship`/`test`/`optimize`/`check`/`preview`
against a project, watch its stderr stream + per-phase progress, cancel
mid-run, and browse history -- the TUI's side of WO-G5's console.

Progress derivation is the WO-G5 ONE-parser pattern: `regolith.progress.
parse_line` (the public wheel module the SSE route also imports) is the
only place that understands the D228 wire shape; this screen imports
the SAME function directly (in-process, no HTTP hop needed since the
TUI and the service layer share one Python process) rather than
re-implementing the regex."""

from __future__ import annotations

from pathlib import Path
from typing import cast

from regolith.progress import parse_line
from textual import work
from textual.app import ComposeResult
from textual.binding import Binding
from textual.containers import Horizontal, Vertical
from textual.screen import Screen
from textual.widgets import Button, DataTable, Input, Log, ProgressBar, Select, Static

from graphite.logging_setup import get_logger
from graphite.service.runs import (
    RunVerb,
    cancel_run,
    compute_verdict_diff,
    get_run,
    list_runs,
    start_run,
    tail_log_lines,
)
from graphite.tui.widgets import StatusLine, TitleBlock

_log = get_logger(__name__)

_VERBS: tuple[RunVerb, ...] = ("check", "build", "ship", "test", "optimize", "preview")
_POLL_SECONDS = 0.25


# frob:doc docs/guide.md#4-driving-runs
class RunConsoleScreen(Screen[None]):
    """Verb+args form, live log/progress while a run is active, and a
    history table of prior runs for this project (durable records, 04.1
    "ANY LONG OPERATION" floor)."""

    BINDINGS = [
        Binding("j", "cursor_down", "down", show=False),
        Binding("k", "cursor_up", "up", show=False),
        Binding("escape", "app.pop_screen", "back"),
        Binding("c", "cancel_run", "cancel"),
    ]

    def __init__(self, project_root: Path) -> None:
        super().__init__()
        self._project_root = project_root
        self._run_id: str | None = None
        self._seen_lines = 0
        self._phase_bars: dict[str, ProgressBar] = {}

    DEFAULT_CSS = """
    #run-form Select { width: 20; }
    #run-form Input { width: 30; }
    #run-form Button { width: auto; margin: 0 1; }
    """

    def compose(self) -> ComposeResult:
        # frob:doc docs/guide.md#4-driving-runs
        yield TitleBlock()
        with Vertical():
            with Horizontal(id="run-form"):
                yield Select([(v, v) for v in _VERBS], value="check", id="run-verb")
                yield Input(placeholder="extra args", id="run-args")
                yield Button("start", id="run-start", variant="primary")
                yield Button("cancel", id="run-cancel", variant="error")
            yield Vertical(id="phase-rails")
            yield Log(id="run-log", highlight=False)
            yield Static("history", classes="heading")
            yield DataTable(id="run-history", cursor_type="row", zebra_stripes=False)
        yield StatusLine()

    def on_mount(self) -> None:
        # frob:doc docs/guide.md#4-driving-runs
        table = self.query_one("#run-history", DataTable)
        table.add_columns("verb", "status", "started", "exit")
        self.query_one(TitleBlock).set_identity(project=self._project_root.name)
        self._refresh_history()

    def _refresh_history(self) -> None:
        table = self.query_one("#run-history", DataTable)
        table.clear()
        for record in list_runs(self._project_root):
            table.add_row(
                record.verb,
                record.status,
                record.started_at,
                str(record.exit_code) if record.exit_code is not None else "-",
                key=record.run_id,
            )

    def on_button_pressed(self, event: Button.Pressed) -> None:
        # frob:doc docs/guide.md#4-driving-runs
        if event.button.id == "run-start":
            self._start()
        elif event.button.id == "run-cancel":
            self.action_cancel_run()

    def _start(self) -> None:
        # Select is populated from `_VERBS` above, so this narrowing is
        # over a value this module itself constrains, not an unchecked
        # assumption (same posture as `graphite.tui.screens.config`).
        verb = cast(RunVerb, self.query_one("#run-verb", Select).value)
        args = tuple(self.query_one("#run-args", Input).value.split())
        result = start_run(self._project_root, verb, args)
        log = self.query_one("#run-log", Log)
        if result.is_err:
            log.write_line(f"failed to start: {result.danger_err.message}")
            _log.warning("run console: start failed: %s", result.danger_err.message)
            return
        record = result.danger_ok
        self._run_id = record.run_id
        self._seen_lines = 0
        self._phase_bars.clear()
        self.query_one("#phase-rails", Vertical).remove_children()
        log.clear()
        self.query_one(StatusLine).set_status(
            f"running {verb} (run={record.run_id[:8]})"
        )
        self._poll()

    @work(exclusive=True)
    async def _poll(self) -> None:
        """Poll the run's log + status until it leaves `running` --
        one worker per run, cancelled implicitly when a new run starts
        (`exclusive=True`) or the screen is popped."""
        import asyncio

        run_id = self._run_id
        if run_id is None:
            return
        log = self.query_one("#run-log", Log)
        while True:
            lines = list(tail_log_lines(run_id))
            for line in lines[self._seen_lines :]:
                log.write_line(line)
                event = parse_line(line)
                if event is not None:
                    self._update_phase(event)
            self._seen_lines = len(lines)
            record = get_run(run_id)
            if record.is_err or record.danger_ok.status != "running":
                status = record.danger_ok.status if record.is_ok else "unknown"
                self.query_one(StatusLine).set_status(f"run {status}")
                self._refresh_history()
                diff = compute_verdict_diff(run_id)
                if diff.is_ok:
                    d = diff.danger_ok
                    log.write_line(
                        f"-- verdict diff: violated {d.before.violated} -> "
                        f"{d.after.violated}, total {d.before.total_obligations} -> "
                        f"{d.after.total_obligations} --"
                    )
                return
            await asyncio.sleep(_POLL_SECONDS)

    def _update_phase(self, event) -> None:  # noqa: ANN001 - regolith.progress.ProgressEvent
        bar = self._phase_bars.get(event.phase)
        if bar is None:
            bar = ProgressBar(total=event.total, id=f"phase-{event.phase}")
            self._phase_bars[event.phase] = bar
            container = self.query_one("#phase-rails", Vertical)
            container.mount(Static(event.phase), bar)
        if event.total is not None:
            bar.update(total=event.total, progress=event.done or 0)

    def action_cancel_run(self) -> None:
        # frob:doc docs/guide.md#4-driving-runs
        if self._run_id is None:
            return
        result = cancel_run(self._run_id)
        log = self.query_one("#run-log", Log)
        if result.is_err:
            log.write_line(f"cancel failed: {result.danger_err.message}")
        else:
            log.write_line(f"-- cancelled (exit_code={result.danger_ok.exit_code}) --")
            self._refresh_history()

    def action_cursor_down(self) -> None:
        # frob:doc docs/guide.md#4-driving-runs
        self.query_one("#run-history", DataTable).action_cursor_down()

    def action_cursor_up(self) -> None:
        # frob:doc docs/guide.md#4-driving-runs
        self.query_one("#run-history", DataTable).action_cursor_up()
