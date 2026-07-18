"""Config view: `regolith config` entries with where-doctrine source
attribution (closing G7-GAP-1..4), doctor's found/missing tool table
(G7-GAP-5..6), and graphite's own settings (G7-GAP-7) -- all through
`graphite.service.config_cli`/`settings`, never a private file poke or
a re-parse of the CLI's own text (dedup law)."""

from __future__ import annotations

from pathlib import Path
from typing import Literal, cast

from pydantic import ValidationError
from textual.app import ComposeResult
from textual.binding import Binding
from textual.containers import Horizontal, Vertical
from textual.screen import Screen
from textual.widgets import (
    Button,
    DataTable,
    Input,
    Select,
    Static,
    TabbedContent,
    TabPane,
)

from graphite.logging_setup import get_logger
from graphite.service.config_cli import doctor, key_defaults, list_config, set_config
from graphite.service.settings import (
    GraphiteSettings,
    get_settings,
    reset_settings,
    set_settings,
)
from graphite.tui.widgets import StatusLine, TitleBlock

# `Select.value` types as `str` (textual has no way to type it to our
# closed literal set); both scope levels and run-verbosity values are
# constrained to the fixed options this screen itself populates the
# `Select` widgets with, so a `cast` here is a narrowing of a value
# this module controls end-to-end, not an unchecked assumption.
_ConfigLevel = Literal["global", "local"]
_RunVerbosity = Literal["quiet", "normal", "verbose"]

_log = get_logger(__name__)


# frob:doc docs/guide.md#5-config-doctor-settings
class ConfigScreen(Screen[None]):
    """Config / doctor / settings tabs -- the TUI's parity surface for
    the WO-G6 gap table (G7-GAP-1..7)."""

    BINDINGS = [
        Binding("escape", "app.pop_screen", "back"),
    ]

    def __init__(self, project_root: Path) -> None:
        super().__init__()
        self._project_root = project_root
        self._defaults = {d.key: d for d in key_defaults()}

    DEFAULT_CSS = """
    #tab-config Input { width: 20; }
    #tab-config Select { width: 14; }
    #tab-config Button { width: auto; margin: 0 1; }
    #tab-settings Input { width: 40; }
    #tab-settings Select { width: 14; }
    #tab-settings Button { width: auto; margin: 0 1; }
    """

    def compose(self) -> ComposeResult:
        # frob:doc docs/guide.md#5-config-doctor-settings
        yield TitleBlock()
        with TabbedContent():
            with TabPane("config", id="tab-config"):
                with Vertical():
                    yield DataTable(
                        id="config-table", cursor_type="row", zebra_stripes=False
                    )
                    with Horizontal():
                        yield Input(placeholder="key", id="cfg-key")
                        yield Input(placeholder="value", id="cfg-value")
                        yield Select(
                            [("global", "global"), ("local", "local")],
                            value="local",
                            id="cfg-level",
                        )
                        yield Button("set", id="cfg-set")
                        yield Button("reset to default", id="cfg-reset")
                    yield Static("", id="cfg-message")
            with TabPane("doctor", id="tab-doctor"):
                with Vertical():
                    yield DataTable(
                        id="doctor-table", cursor_type="row", zebra_stripes=False
                    )
                    yield Button("re-probe", id="doctor-reprobe")
            with TabPane("settings", id="tab-settings"):
                with Vertical():
                    yield Static("default project root:")
                    yield Input(id="settings-root")
                    yield Static("run verbosity:")
                    yield Select(
                        [
                            ("quiet", "quiet"),
                            ("normal", "normal"),
                            ("verbose", "verbose"),
                        ],
                        id="settings-verbosity",
                    )
                    yield Static("run history limit (0 = keep everything):")
                    yield Input(id="settings-history-limit")
                    with Horizontal():
                        yield Button("save", id="settings-save")
                        yield Button("reset", id="settings-reset")
                    yield Static("", id="settings-message")
        yield StatusLine()

    def on_mount(self) -> None:
        # frob:doc docs/guide.md#5-config-doctor-settings
        self.query_one(TitleBlock).set_identity(project=self._project_root.name)
        self.query_one("#config-table", DataTable).add_columns(
            "key", "value", "source", "default"
        )
        self.query_one("#doctor-table", DataTable).add_columns(
            "tool", "found", "version", "path"
        )
        self._refresh_config()
        self._refresh_doctor()
        self._refresh_settings()

    def _refresh_config(self) -> None:
        table = self.query_one("#config-table", DataTable)
        table.clear()
        result = list_config(self._project_root)
        message = self.query_one("#cfg-message", Static)
        if result.is_err:
            message.update(result.danger_err.message)
            return
        for entry in result.danger_ok:
            default = self._defaults.get(entry.key)
            table.add_row(
                entry.key,
                entry.value,
                entry.source,
                str(default.default) if default is not None else "-",
                key=entry.key,
            )

    def _refresh_doctor(self) -> None:
        table = self.query_one("#doctor-table", DataTable)
        table.clear()
        result = doctor(self._project_root)
        if result.is_err:
            _log.info(
                "config screen: doctor unavailable: %s", result.danger_err.message
            )
            return
        for entry in result.danger_ok:
            if not isinstance(entry, dict):
                continue
            table.add_row(
                str(entry.get("name", "?")),
                "yes" if entry.get("found") else "no",
                str(entry.get("version", "-")),
                str(entry.get("path", "-")),
            )

    def _refresh_settings(self) -> None:
        result = get_settings()
        settings = result.danger_ok if result.is_ok else GraphiteSettings()
        self.query_one("#settings-root", Input).value = settings.default_project_root
        self.query_one("#settings-verbosity", Select).value = settings.run_verbosity
        self.query_one("#settings-history-limit", Input).value = str(
            settings.run_history_limit
        )

    def on_button_pressed(self, event: Button.Pressed) -> None:
        # frob:doc docs/guide.md#5-config-doctor-settings
        button_id = event.button.id
        if button_id == "cfg-set":
            self._set_config()
        elif button_id == "cfg-reset":
            self._reset_config()
        elif button_id == "doctor-reprobe":
            self._refresh_doctor()
        elif button_id == "settings-save":
            self._save_settings()
        elif button_id == "settings-reset":
            self._reset_settings()

    def _set_config(self) -> None:
        key = self.query_one("#cfg-key", Input).value.strip()
        value = self.query_one("#cfg-value", Input).value.strip()
        level = cast(_ConfigLevel, self.query_one("#cfg-level", Select).value)
        message = self.query_one("#cfg-message", Static)
        if not key:
            message.update("enter a key first")
            return
        result = set_config(self._project_root, key, value, level)
        if result.is_err:
            # CLI's own message, verbatim (charter 3.2 / 04.1 validation floor).
            message.update(result.danger_err.detail or result.danger_err.message)
        else:
            message.update(
                f"set {key}={result.danger_ok.value} (source={result.danger_ok.source})"
            )
            self._refresh_config()

    def _reset_config(self) -> None:
        key = self.query_one("#cfg-key", Input).value.strip()
        message = self.query_one("#cfg-message", Static)
        default = self._defaults.get(key)
        if default is None:
            message.update(f"no registered default for {key!r}")
            return
        level = cast(_ConfigLevel, self.query_one("#cfg-level", Select).value)
        result = set_config(self._project_root, key, str(default.default), level)
        if result.is_err:
            message.update(result.danger_err.detail or result.danger_err.message)
        else:
            message.update(f"reset {key} to {default.default}")
            self._refresh_config()

    def _save_settings(self) -> None:
        root = self.query_one("#settings-root", Input).value.strip()
        verbosity = cast(
            _RunVerbosity, self.query_one("#settings-verbosity", Select).value
        )
        limit_text = self.query_one("#settings-history-limit", Input).value.strip()
        message = self.query_one("#settings-message", Static)
        try:
            settings = GraphiteSettings(
                default_project_root=root,
                run_verbosity=verbosity,
                run_history_limit=int(limit_text or "0"),
            )
        except (ValueError, ValidationError) as exc:
            # The model's own message, verbatim (04.1 validation floor).
            message.update(str(exc))
            return
        result = set_settings(settings)
        if result.is_err:
            message.update(result.danger_err.message)
        else:
            message.update("saved")

    def _reset_settings(self) -> None:
        reset_settings()
        self._refresh_settings()
        self.query_one("#settings-message", Static).update("reset to defaults")
