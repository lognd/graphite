"""`scripts/check_bundle_size.py`: the main-bundle budget gate (WO-G8)."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))

import check_bundle_size  # noqa: E402


# frob:tests scripts/check_bundle_size.py::main kind="unit"
def test_main_ok_within_budget(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(check_bundle_size, "STATIC_ASSETS", tmp_path)
    (tmp_path / "index-abc123.js").write_bytes(b"x" * 100)
    (tmp_path / "index-abc123.css").write_bytes(b"x" * 100)
    assert check_bundle_size.main() == 0


def test_main_fails_when_over_budget(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(check_bundle_size, "STATIC_ASSETS", tmp_path)
    monkeypatch.setattr(check_bundle_size, "MAIN_JS_BUDGET_BYTES", 10)
    (tmp_path / "index-abc123.js").write_bytes(b"x" * 100)
    (tmp_path / "index-abc123.css").write_bytes(b"x" * 100)
    assert check_bundle_size.main() == 1


def test_main_fails_when_static_assets_missing(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(check_bundle_size, "STATIC_ASSETS", tmp_path / "missing")
    assert check_bundle_size.main() == 1
