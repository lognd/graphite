"""`design/graphite.strata`: the system-topology model frob sys audits
against the real code (T-0014). This is the interface's one integration
test -- it exercises the whole design -> frob sys audit path end to end,
the same way `make check` does, rather than asserting anything about the
strata grammar in isolation."""

from __future__ import annotations

import subprocess
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[1]
_STRATA_FILE = _REPO_ROOT / "design" / "graphite.strata"


# frob:tests design kind="integration"
# frob:ticket T-0007
def test_strata_file_parses_without_sys004() -> None:
    """`frob sys audit` on the committed strata file never reports SYS004
    (a grammar parse failure) -- if it did, every other sys-audit rule in
    this design would be silently unreachable (docs/strata/surface.md)."""
    assert _STRATA_FILE.is_file(), "design/graphite.strata must exist"
    result = subprocess.run(
        ["frob", "sys", "audit", str(_STRATA_FILE)],
        cwd=_REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    combined = result.stdout + result.stderr
    assert "SYS004" not in combined, combined
