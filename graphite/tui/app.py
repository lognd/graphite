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


# frob:doc docs/guide.md#6-keyboard-map
class ShortcutSheet(ModalScreen[None]):
    """The `?` shortcut sheet (03 sec. 3.5) -- a modal, dismissed by
    any key, listing the keyboard map above."""

    BINDINGS = [Binding("escape", "dismiss", "close")]

    def compose(self) -> ComposeResult:
        # frob:doc docs/guide.md#6-keyboard-map
        with Vertical(id="shortcut-sheet"):
            yield Static(_SHORTCUTS)

    def on_key(self, event: events.Key) -> None:
        # frob:doc docs/guide.md#6-keyboard-map
        self.dismiss(None)


# frob:doc docs/guide.md#6-keyboard-map
class NavigationProvider(Provider):
    """Command-palette entries for jumping straight to a surface --
    the ctrl+k "first-class citizen" requirement (03 sec. 3.5), not an
    afterthought bolted onto a search box. Also offers a "set active
    project" command per discovered fleet member (WO-G8, closes
    WOG7-F1: the surface shortcuts assumed a single-project session)."""

    async def search(self, query: str) -> Hits:
        # frob:doc docs/guide.md#6-keyboard-map
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
        # Discovered fleet members as first-class palette commands, so the
        # run-console/config/obligations shortcuts work per-project in a
        # multi-project terminal session (mirrors the web app's project
        # selectors). Discovery is the SAME scan the dashboard renders.
        from graphite.service.discovery import scan_projects

        for info in scan_projects(app.scan_root):
            name = f"set active project: {info.name}"
            score = matcher.match(name)
            if score > 0:
                root = Path(info.root)
                yield Hit(
                    score,
                    matcher.highlight(name),
                    lambda root=root: app.set_active_project(root),
                )


# frob:doc docs/spec/02-architecture.md#8-tui-shell-graphitetui
class GraphiteApp(App[None]):
    """graphite's textual TUI: `project_root` is the fleet-scan root
    (dashboard) and the INITIAL active project for the obligations/run/
    config surfaces. The active project changes via the dashboard's
    per-row drill-down or the palette's "set active project" command
    (WOG7-F1), so a multi-project fleet session never needs a
    restart."""

    TITLE = "graphite"
    COMMAND_PALETTE_BINDING = "ctrl+k"
    COMMANDS = App.COMMANDS | {NavigationProvider}

    BINDINGS = [
        Binding("question_mark", "show_help", "help"),
    ]

    def __init__(self, project_root: Path) -> None:
        super().__init__()
        self._scan_root = project_root.resolve()
        self._active_project = self._scan_root

    @property
    def scan_root(self) -> Path:
        """The fleet-scan root the app was launched with (never changes)."""
        # frob:doc docs/spec/02-architecture.md#8-tui-shell-graphitetui
        return self._scan_root

    @property
    def active_project(self) -> Path:
        """The project the surface shortcuts (run console, config,
        obligations) currently target."""
        # frob:doc docs/spec/02-architecture.md#8-tui-shell-graphitetui
        return self._active_project

    def set_active_project(self, root: Path) -> None:
        """Point the surface shortcuts at another discovered project
        (WOG7-F1); the dashboard keeps scanning the launch root."""
        # frob:doc docs/spec/02-architecture.md#8-tui-shell-graphitetui
        self._active_project = root.resolve()
        _log.info("graphite tui: active project -> %s", self._active_project)
        self.notify(f"active project: {self._active_project.name}")

    def on_mount(self) -> None:
        # frob:doc docs/spec/02-architecture.md#8-tui-shell-graphitetui
        _log.info("graphite tui: starting, project=%s", self._scan_root)
        self.push_screen(DashboardScreen(self._scan_root))

    def action_show_help(self) -> None:
        # frob:doc docs/guide.md#6-keyboard-map
        self.push_screen(ShortcutSheet())

    def action_go_dashboard(self) -> None:
        # frob:doc docs/guide.md#1-reading-the-dashboard-is-my-fleet-healthy
        self.push_screen(DashboardScreen(self._scan_root))

    def action_go_run_console(self) -> None:
        # frob:doc docs/guide.md#4-driving-runs
        self.push_screen(RunConsoleScreen(self._active_project))

    def action_go_config(self) -> None:
        # frob:doc docs/guide.md#5-config-doctor-settings
        self.push_screen(ConfigScreen(self._active_project))

    def action_go_obligations(self) -> None:
        # frob:doc docs/guide.md#2-the-obligation-explorer-why-did-this-claim-deferfail
        self.push_screen(ObligationsScreen(self._active_project))
