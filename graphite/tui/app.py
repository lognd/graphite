"""The `graphite tui` root app: fleet dashboard, obligations,
run console, and config -- the second renderer over the SAME
`graphite.service` layer and token mirror the web app uses (spec 01
sec. 2.4 two-heads-one-body).

Keyboard map, matched to the web app (spec 03 sec. 3.5 KEYBOARD-FIRST):
j/k list navigation (per-screen), `?` the shortcut sheet, ctrl+k the
command palette (textual's own, rebound from its ctrl+p default so
both heads agree on the chord)."""

from __future__ import annotations

from pathlib import Path

from textual import events
from textual.app import App, ComposeResult
from textual.binding import Binding
from textual.command import Hit, Hits, Provider
from textual.containers import Vertical
from textual.screen import ModalScreen
from textual.widgets import Static

from graphite.logging_setup import get_logger
from graphite.tui.screens.config import ConfigScreen
from graphite.tui.screens.dashboard import DashboardScreen
from graphite.tui.screens.obligations import ObligationsScreen
from graphite.tui.screens.run_console import RunConsoleScreen

_log = get_logger(__name__)

_SHORTCUTS = """\
Keyboard shortcuts

  j / k        move down / up in a list or table
  enter        drill into the selected row
  escape       back to the previous screen
  ?            this sheet
  ctrl+k       command palette
  r            refresh the current view
  c            cancel the active run (run console)
"""


class ShortcutSheet(ModalScreen[None]):
    """The `?` shortcut sheet (03 sec. 3.5) -- a modal, dismissed by
    any key, listing the keyboard map above."""

    BINDINGS = [Binding("escape", "dismiss", "close")]

    def compose(self) -> ComposeResult:
        with Vertical(id="shortcut-sheet"):
            yield Static(_SHORTCUTS)

    def on_key(self, event: events.Key) -> None:
        self.dismiss(None)


class NavigationProvider(Provider):
    """Command-palette entries for jumping straight to a surface --
    the ctrl+k "first-class citizen" requirement (03 sec. 3.5), not an
    afterthought bolted onto a search box."""

    async def search(self, query: str) -> Hits:
        matcher = self.matcher(query)
        app = self.app
        assert isinstance(app, GraphiteApp)
        commands = [
            ("fleet dashboard", app.action_go_dashboard),
            ("run console", app.action_go_run_console),
            ("config / doctor / settings", app.action_go_config),
        ]
        for name, callback in commands:
            score = matcher.match(name)
            if score > 0:
                yield Hit(score, matcher.highlight(name), callback)


class GraphiteApp(App[None]):
    """graphite's textual TUI: `project_root` is both the default
    fleet-scan root (dashboard) and the active project for the
    obligations/run/config surfaces (a single-project session; the
    dashboard's drill-down is how a multi-project fleet session picks
    a different active project)."""

    TITLE = "graphite"
    COMMAND_PALETTE_BINDING = "ctrl+k"
    COMMANDS = App.COMMANDS | {NavigationProvider}

    BINDINGS = [
        Binding("question_mark", "show_help", "help"),
    ]

    def __init__(self, project_root: Path) -> None:
        super().__init__()
        self._project_root = project_root.resolve()

    def on_mount(self) -> None:
        _log.info("graphite tui: starting, project=%s", self._project_root)
        self.push_screen(DashboardScreen(self._project_root))

    def action_show_help(self) -> None:
        self.push_screen(ShortcutSheet())

    def action_go_dashboard(self) -> None:
        self.push_screen(DashboardScreen(self._project_root))

    def action_go_run_console(self) -> None:
        self.push_screen(RunConsoleScreen(self._project_root))

    def action_go_config(self) -> None:
        self.push_screen(ConfigScreen(self._project_root))

    def action_go_obligations(self) -> None:
        self.push_screen(ObligationsScreen(self._project_root))
