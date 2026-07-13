"""Integration marker (spec 02 sec. 6, the feldspar `regolith-test`
precedent): discovery over the REAL `../lithos` `examples/` fleet, run
only with `pytest --run-integration` and a sibling lithos checkout
present -- the fixture-only suite never depends on this."""

from __future__ import annotations

import pytest

from graphite.service.discovery import scan_projects
from tests.conftest import LITHOS_ROOT


@pytest.mark.integration
def test_scan_real_lithos_examples_fleet() -> None:
    examples_root = LITHOS_ROOT / "examples"
    if not examples_root.is_dir():
        pytest.skip(f"no ../lithos checkout at {LITHOS_ROOT}")
    projects = scan_projects(examples_root)
    assert len(projects) > 0
    names = {p.name for p in projects}
    assert any("timber_pavilion" in n for n in names)
