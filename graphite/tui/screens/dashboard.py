"""Fleet dashboard: the census table (04.1 "is my fleet healthy?" home
surface) -- one row per `magnetite.toml` discovered under the scan
root, via `graphite.service.discovery.scan_projects` (the SAME
discovery module the web app's fleet route uses -- no TUI-local
rglob, dedup law)."""

from __future__ import annotations

from pathlib import Path

from textual.app import ComposeResult
from textual.binding import Binding
from textual.containers import Vertical
from textual.screen import Screen
from textual.widgets import DataTable, Static

from graphite.logging_setup import get_logger
from graphite.service.discovery import ProjectInfo, scan_projects
from graphite.tui.widgets import StatusLine, TitleBlock

_log = get_logger(__name__)

_COLUMNS = ("name", "version", "build report", "lockfile", "dist", "stale")


def _row(info: ProjectInfo) -> tuple[str, ...]:
    def _yn(flag: bool) -> str:
        return "yes" if flag else "no"

    return (
        info.name,
        info.version,
        _yn(info.has_build_report),
        _yn(info.has_lockfile),
        _yn(info.has_dist),
        "STALE" if info.build_report_stale else "-",
    )


class DashboardScreen(Screen[None]):
    """The fleet census: every discovered project, j/k navigable,
    enter drills into that project's obligation list (progressive
    disclosure, charter sec. 2.2)."""

    BINDINGS = [
        Binding("j", "cursor_down", "down", show=False),
        Binding("k", "cursor_up", "up", show=False),
        Binding("r", "refresh", "refresh"),
    ]

    def __init__(self, scan_root: Path) -> None:
        super().__init__()
        self._scan_root = scan_root
        self._projects: tuple[ProjectInfo, ...] = ()

    def compose(self) -> ComposeResult:
        yield TitleBlock()
        with Vertical():
            yield Static("fleet census", classes="heading")
            yield DataTable(id="fleet-table", cursor_type="row", zebra_stripes=False)
        yield StatusLine()

    def on_mount(self) -> None:
        table = self.query_one("#fleet-table", DataTable)
        table.add_columns(*_COLUMNS)
        self.query_one(TitleBlock).set_identity(project=str(self._scan_root))
        self.action_refresh()

    def action_refresh(self) -> None:
        """Re-scan the fleet (empty-state honest: zero projects is a
        state, not an error, per `discovery.scan_projects`)."""
        self._projects = scan_projects(self._scan_root)
        table = self.query_one("#fleet-table", DataTable)
        table.clear()
        for info in self._projects:
            table.add_row(*_row(info), key=info.root)
        status = self.query_one(StatusLine)
        if self._projects:
            status.set_status(f"{len(self._projects)} project(s) under {self._scan_root}")
        else:
            status.set_status(f"no projects found under {self._scan_root}")
        _log.info("dashboard: refreshed, %d project(s)", len(self._projects))

    def action_cursor_down(self) -> None:
        self.query_one("#fleet-table", DataTable).action_cursor_down()

    def action_cursor_up(self) -> None:
        self.query_one("#fleet-table", DataTable).action_cursor_up()

    def _selected_project(self) -> ProjectInfo | None:
        table = self.query_one("#fleet-table", DataTable)
        if table.row_count == 0:
            return None
        row_key, _ = table.coordinate_to_cell_key(table.cursor_coordinate)
        for info in self._projects:
            if info.root == row_key.value:
                return info
        return None

    def action_open_project(self) -> None:
        info = self._selected_project()
        if info is None:
            return
        from graphite.tui.screens.obligations import ObligationsScreen

        self.app.push_screen(ObligationsScreen(Path(info.root)))

    def on_data_table_row_selected(self, event: DataTable.RowSelected) -> None:
        # DataTable's own `enter` binding (`select_cursor`) fires this
        # message -- the drill-down affordance (charter sec. 2.2
        # progressive disclosure) rides it rather than a competing
        # screen-level `enter` binding DataTable would swallow first.
        self.action_open_project()

