"""Bundle budget check (WO-G8 deliverable 2): fails when the MAIN frontend
bundle outgrows its recorded budget.

The budget covers the main entry chunk only -- three.js (and its loaders/
controls) are deliberately lazy-loaded per-route (spec 02.7's WASM/heavy-
asset doctrine) and land in their own chunks, so they are exempt by
design: growing the eagerly-downloaded main chunk is what would slow every
user's cold start.

Recorded at budget-setting time (2026-07-13, vite 7/rolldown, WO-G8):
  main chunk (index-*.js)  399.5 kB minified / 121.0 kB gzip
  css        (index-*.css)  63.6 kB minified /  25.0 kB gzip
Budgets leave ~15% headroom over those measurements; raising a budget is
a reviewed decision (this file), never an incidental drift.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

from graphite.logging_setup import get_logger

_log = get_logger(__name__)

STATIC_ASSETS = Path(__file__).parent.parent / "graphite" / "server" / "static" / "assets"

MAIN_JS_BUDGET_BYTES = 460_000
MAIN_CSS_BUDGET_BYTES = 75_000

_MAIN_JS = re.compile(r"^index-.*\.js$")
_MAIN_CSS = re.compile(r"^index-.*\.css$")


def _find_one(pattern: re.Pattern[str]) -> Path | None:
    """The single main chunk matching `pattern`, or None when absent."""
    matches = [p for p in STATIC_ASSETS.iterdir() if pattern.match(p.name)]
    if len(matches) != 1:
        _log.error("check_bundle_size: expected 1 match for %s, got %r", pattern.pattern, matches)
        return None
    return matches[0]


def main() -> int:
    """Exit 0 iff both main-bundle budgets hold."""
    if not STATIC_ASSETS.is_dir():
        print(
            f"check_bundle_size: {STATIC_ASSETS} missing -- run the frontend build first",
            file=sys.stderr,
        )
        return 1

    failures: list[str] = []
    for label, pattern, budget in (
        ("main js", _MAIN_JS, MAIN_JS_BUDGET_BYTES),
        ("main css", _MAIN_CSS, MAIN_CSS_BUDGET_BYTES),
    ):
        path = _find_one(pattern)
        if path is None:
            failures.append(f"{label}: no unique chunk found under {STATIC_ASSETS}")
            continue
        size = path.stat().st_size
        verdict = "OK" if size <= budget else "OVER BUDGET"
        print(f"check_bundle_size: {label} {path.name}: {size} bytes (budget {budget}) {verdict}")
        if size > budget:
            failures.append(f"{label}: {size} > {budget} bytes ({path.name})")

    for failure in failures:
        print(f"check_bundle_size: FAIL {failure}", file=sys.stderr)
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
