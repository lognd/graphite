"""Shared pytest fixtures: the committed miniature fixture project
(`tests/fixtures/timber_pavilion`, generated once from
`examples/flagships/timber_pavilion` via the real regolith CLI, per
spec 02.6) and a `--run-integration` marker for tests that need the
real `../lithos` checkout instead."""

from __future__ import annotations

import shutil
from pathlib import Path

import pytest

FIXTURES_DIR = Path(__file__).parent / "fixtures"
TIMBER_PAVILION = FIXTURES_DIR / "timber_pavilion"
#: WO-G9: an electrical/board fixture (real KiCad-generated RS-274X
#: gerbers copied from lithos's demo11_board_gerbers, plus a hand-built
#: `harness/` family) -- timber_pavilion is civil and ships neither
#: `boards` nor `harness`, so WO-G9's silkscreen/gerber-stack and
#: bring-up views need a fixture project that actually carries them.
MAINBOARD_MX = FIXTURES_DIR / "mainboard_mx"


def _find_lithos_root() -> Path:
    """The sibling `../lithos` checkout, from EITHER the main repo root
    or a `.worktrees/<name>` dispatch worktree (whose `../lithos` needs
    the dev-only symlink noted in the WO-G1 dispatch prompt -- this
    walks a short candidate list rather than hard-coding one depth, so
    both layouts resolve). `GRAPHITE_LITHOS_ROOT` overrides outright."""
    import os

    override = os.environ.get("GRAPHITE_LITHOS_ROOT")
    if override:
        return Path(override).resolve()
    here = Path(__file__).resolve()
    for ancestor in here.parents:
        candidate = ancestor / "lithos"
        if (candidate / "examples").is_dir():
            return candidate
    return here.parents[1] / "lithos"  # best-effort fallback, may not exist


LITHOS_ROOT = _find_lithos_root()


def pytest_addoption(parser: pytest.Parser) -> None:
    parser.addoption(
        "--run-integration",
        action="store_true",
        default=False,
        help="Run tests marked `integration` (require a sibling ../lithos checkout).",
    )


def pytest_configure(config: pytest.Config) -> None:
    config.addinivalue_line(
        "markers",
        "integration: requires the real ../lithos checkout, skipped by default",
    )


def pytest_collection_modifyitems(
    config: pytest.Config, items: list[pytest.Item]
) -> None:
    if config.getoption("--run-integration"):
        return
    skip_integration = pytest.mark.skip(
        reason="need --run-integration (and a ../lithos checkout)"
    )
    for item in items:
        if "integration" in item.keywords:
            item.add_marker(skip_integration)


@pytest.fixture
def timber_pavilion(tmp_path: Path) -> Path:
    """A fresh COPY of the committed fixture project under a tmp dir --
    tests that start CLI runs must not mutate the checked-in fixture."""
    dest = tmp_path / "timber_pavilion"
    shutil.copytree(TIMBER_PAVILION, dest)
    return dest


@pytest.fixture
def fixture_scan_root(tmp_path: Path, timber_pavilion: Path) -> Path:
    """A scan root (parent dir) holding one copy of the fixture project
    -- what `GRAPHITE_SCAN_ROOT` / `discovery.scan_projects` expects."""
    return timber_pavilion.parent


@pytest.fixture
def mainboard_mx(tmp_path: Path) -> Path:
    """A fresh COPY of the committed `mainboard_mx` board+harness fixture
    (see `MAINBOARD_MX` docstring)."""
    dest = tmp_path / "mainboard_mx"
    shutil.copytree(MAINBOARD_MX, dest)
    return dest
