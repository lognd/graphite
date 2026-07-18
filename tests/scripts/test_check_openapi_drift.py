"""`scripts/check_openapi_drift.py`: the committed `openapi.json` must
equal what `gen_openapi.render()` produces right now."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))

import check_openapi_drift  # noqa: E402


# frob:tests scripts/check_openapi_drift.py::main kind="unit"
def test_main_ok_when_committed_matches_render(monkeypatch) -> None:
    committed_path = Path(__file__).resolve().parents[2] / "openapi.json"
    committed = committed_path.read_text()
    monkeypatch.setattr(check_openapi_drift, "render", lambda: committed)
    assert check_openapi_drift.main() == 0


def test_main_fails_when_committed_is_stale(monkeypatch) -> None:
    monkeypatch.setattr(check_openapi_drift, "render", lambda: "not the real schema")
    assert check_openapi_drift.main() == 1
