"""Obligation list: one project's `dist/calc/audit_index.json` rows
(via `graphite.service.reports.read_audit_index` -- the ONE report
reader, never a local JSON poke), verdict-colored, grouped by reason
for the deferred/violated rows (04.1 "ANY LIST OF PROBLEMS" floor:
group-by/count so a wall of red is scannable)."""

from __future__ import annotations

from collections import defaultdict
from pathlib import Path

from textual.app import ComposeResult
from textual.binding import Binding
from textual.containers import Vertical
from textual.screen import Screen
from textual.widgets import DataTable, Static

from graphite.logging_setup import get_logger
from graphite.service.reports import read_audit_index
from graphite.tui.widgets import StatusLine, TitleBlock

_log = get_logger(__name__)

# regolith's `Disposition` -> the shared verdict-badge vocabulary
# (03 sec. 4 token names) -- calc_sheet is the "clean discharge" case.
_VERDICT_NAME = {
    "calc_sheet": "discharged",
    "accepted_deviation": "accepted_deviation",
    "deferred": "deferred",
    "violated": "violated",
}


# frob:doc docs/guide.md#2-the-obligation-explorer-why-did-this-claim-deferfail
class ObligationsScreen(Screen[None]):
    """One project's obligations: summary counts, then rows grouped by
    disposition and (for deferred/violated) by reason text."""

    BINDINGS = [
        Binding("j", "cursor_down", "down", show=False),
        Binding("k", "cursor_up", "up", show=False),
        Binding("escape", "app.pop_screen", "back"),
        Binding("r", "refresh", "refresh"),
    ]

    def __init__(self, project_root: Path) -> None:
        super().__init__()
        self._project_root = project_root

    def compose(self) -> ComposeResult:
        # frob:doc docs/guide.md#2-the-obligation-explorer-why-did-this-claim-deferfail
        yield TitleBlock()
        with Vertical():
            yield Static("", id="obligations-summary")
            yield DataTable(
                id="obligations-table", cursor_type="row", zebra_stripes=False
            )
        yield StatusLine()

    def on_mount(self) -> None:
        # frob:doc docs/guide.md#2-the-obligation-explorer-why-did-this-claim-deferfail
        table = self.query_one("#obligations-table", DataTable)
        table.add_columns("verdict", "claim", "subject", "reason / detail")
        self.query_one(TitleBlock).set_identity(project=self._project_root.name)
        self.action_refresh()

    def action_refresh(self) -> None:
        # frob:doc docs/guide.md#2-the-obligation-explorer-why-did-this-claim-deferfail
        path = self._project_root / "dist" / "calc" / "audit_index.json"
        result = read_audit_index(path)
        table = self.query_one("#obligations-table", DataTable)
        table.clear()
        summary = self.query_one("#obligations-summary", Static)
        status = self.query_one(StatusLine)
        if result.is_err:
            summary.update(f"no audit index: {result.danger_err.message}")
            status.set_status("empty: run a build to produce an audit index")
            _log.info("obligations: %s", result.danger_err.message)
            return

        index = result.danger_ok
        s = index.summary
        # Both D221.2 denominators, each under its own exact name
        # (accepted_rows is the count the row table below actually lists)
        # -- WO-G8 coherence sweep: a summary count must agree with its
        # drill-down.
        summary.update(
            f"obligations={s.obligations}  discharged={s.discharged}  "
            f"accepted_rows={s.accepted_rows}  "
            f"accepted_deviation={s.accepted_deviation}  deferred={s.deferred}  "
            f"violated={s.violated}  balanced={s.balanced()}"
        )

        # Group by reason for deferred/violated so a wall of red is
        # scannable (04.1 "ANY LIST OF PROBLEMS" floor); calc_sheet and
        # accepted_deviation rows are listed as-is (their detail is the
        # evidence pointer, not a shared reason to group by).
        grouped: dict[str, list] = defaultdict(list)
        ungrouped = []
        for row in index.rows:
            if row.disposition in ("deferred", "violated"):
                grouped[row.detail].append(row)
            else:
                ungrouped.append(row)

        for row in ungrouped:
            table.add_row(
                _VERDICT_NAME.get(row.disposition, row.disposition),
                row.claim_name,
                row.subject_anchor,
                row.detail,
            )
        for reason, rows in sorted(grouped.items(), key=lambda kv: -len(kv[1])):
            table.add_row(f"-- {len(rows)}x --", "", "", reason, key=f"group:{reason}")
            for row in rows:
                table.add_row(
                    _VERDICT_NAME.get(row.disposition, row.disposition),
                    row.claim_name,
                    row.subject_anchor,
                    row.detail,
                )
        status.set_status(
            f"{len(index.rows)} obligation row(s) -- {self._project_root}"
        )

    def action_cursor_down(self) -> None:
        # frob:doc docs/guide.md#2-the-obligation-explorer-why-did-this-claim-deferfail
        self.query_one("#obligations-table", DataTable).action_cursor_down()

    def action_cursor_up(self) -> None:
        # frob:doc docs/guide.md#2-the-obligation-explorer-why-did-this-claim-deferfail
        self.query_one("#obligations-table", DataTable).action_cursor_up()
