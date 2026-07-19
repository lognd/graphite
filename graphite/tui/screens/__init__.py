"""graphite TUI screens: one module per surface (dashboard, obligations,
run console, config), each a thin `Screen` over `graphite.service`."""

from __future__ import annotations

from graphite.tui.screens.config import ConfigScreen
from graphite.tui.screens.dashboard import DashboardScreen
from graphite.tui.screens.obligations import ObligationsScreen
from graphite.tui.screens.run_console import RunConsoleScreen

__all__ = [
    "ConfigScreen",
    "DashboardScreen",
    "ObligationsScreen",
    "RunConsoleScreen",
]
