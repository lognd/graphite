"""Shared textual widgets over the generated token mirror
(`graphite.tui.tokens`) -- the ONE component-per-concept rule (spec 03
sec. 5) applied to the terminal renderer: `VerdictBadge`, `TitleBlock`,
and `StatusLine` mirror the web app's components in the same charter
sense (03 sec. 2.4 two-heads-one-body), never a private re-styling.

No hex/px literal is written in this module; every color/space value
comes from `graphite.tui.tokens` (03 sec. 4 token law, textual side).
"""

from __future__ import annotations

from textual.app import ComposeResult
from textual.containers import Horizontal
from textual.reactive import reactive
from textual.widgets import Static

from graphite.tui.tokens import COLOR_DARK

# textual styles are set with CSS-like strings; the token hexes are
# threaded through as CSS custom values rather than re-declared, so a
# token change in the generator output is the only edit ever needed.
_VERDICT_COLOR = {
    "discharged": COLOR_DARK["verdict.discharged"],
    "violated": COLOR_DARK["verdict.violated"],
    "deferred": COLOR_DARK["verdict.deferred"],
    "accepted_deviation": COLOR_DARK["verdict.acceptedDeviation"],
    "excluded": COLOR_DARK["verdict.excluded"],
}


class VerdictBadge(Static):
    """One obligation verdict, colored per the shared token mirror --
    the TUI's side of the web `VerdictBadge` component (03 sec. 5:
    a variant is a prop, never a fork)."""

    DEFAULT_CSS = """
    VerdictBadge {
        width: auto;
        padding: 0 1;
        text-style: bold;
    }
    """

    def __init__(self, verdict: str, *, id: str | None = None) -> None:
        super().__init__(verdict, id=id)
        self._verdict = verdict
        color = _VERDICT_COLOR.get(verdict, COLOR_DARK["inkDim"])
        self.styles.color = color


class TitleBlock(Static):
    """The persistent identity element (03 sec. 3.1): project name,
    design-hash short-form, schema version, and report timestamp --
    terminal furniture for the same drawing-title-block idiom the web
    app renders at the top of every view."""

    text: reactive[str] = reactive("")

    def __init__(self) -> None:
        super().__init__()

    def set_identity(
        self,
        *,
        project: str,
        design_hash: str | None = None,
        schema_version: str | None = None,
        timestamp: str | None = None,
    ) -> None:
        parts = [project]
        if design_hash:
            parts.append(f"hash={design_hash[:12]}")
        if schema_version:
            parts.append(f"schema={schema_version}")
        if timestamp:
            parts.append(f"as-of {timestamp}")
        self.update(" | ".join(parts))


class StatusLine(Horizontal):
    """The persistent bottom status bar (03 sec. 3.2, vim/tmux
    lineage): current project, server/run state, last action, and a
    right-aligned keyboard hint."""

    DEFAULT_CSS = """
    StatusLine {
        dock: bottom;
        height: 1;
        background: $panel;
    }
    StatusLine #status-left { width: 1fr; }
    StatusLine #status-right { width: auto; }
    """

    def compose(self) -> ComposeResult:
        yield Static("", id="status-left")
        yield Static("? help  ctrl+k palette  j/k navigate", id="status-right")

    def set_status(self, text: str) -> None:
        self.query_one("#status-left", Static).update(text)
