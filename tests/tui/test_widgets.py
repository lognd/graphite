"""`TitleBlock`/`StatusLine` shared widgets (`graphite/tui/widgets.py`):
the persistent identity line and docked status bar every screen
composes (03 sec. 3.1/3.2) -- the chrome shared across the whole TUI,
never a per-screen re-styling."""

from __future__ import annotations

import pytest
from graphite.tui.widgets import StatusLine, TitleBlock
from textual.app import App, ComposeResult
from textual.widgets import Static


class _Harness(App[None]):
    def compose(self) -> ComposeResult:
        yield TitleBlock()
        yield StatusLine()


# frob:tests graphite/tui/widgets.py::TitleBlock.set_identity kind="unit"
@pytest.mark.asyncio
async def test_title_block_set_identity_formats_parts():
    app = _Harness()
    async with app.run_test() as pilot:
        await pilot.pause()
        block = app.query_one(TitleBlock)
        block.set_identity(
            project="timber_pavilion",
            design_hash="abcdef1234567890",
            schema_version="1.2",
            timestamp="2026-07-17",
        )
        await pilot.pause()
        text = str(block.render())
        assert "timber_pavilion" in text
        assert "hash=abcdef123456" in text
        assert "schema=1.2" in text
        assert "as-of 2026-07-17" in text


# frob:tests graphite/tui/widgets.py::StatusLine.compose kind="unit"
# frob:tests graphite/tui/widgets.py::StatusLine.set_status kind="unit"
@pytest.mark.asyncio
async def test_status_line_compose_and_set_status():
    app = _Harness()
    async with app.run_test() as pilot:
        await pilot.pause()
        status = app.query_one(StatusLine)
        left = status.query_one("#status-left", Static)
        right = status.query_one("#status-right", Static)
        assert "palette" in str(right.render())
        status.set_status("3 project(s)")
        await pilot.pause()
        assert "3 project(s)" in str(left.render())
