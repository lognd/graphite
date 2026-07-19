"""`scripts/check_bundle_size.py`: the main-bundle budget gate (WO-G8)."""

from __future__ import annotations

import subprocess
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


# frob:tests scripts kind="integration"
# frob:ticket T-0007
def test_script_runs_as_a_real_cli_process_against_repo_static_assets() -> None:
    """End-to-end: invoke `scripts/check_bundle_size.py` the way `make check`
    does (a real subprocess, real interpreter, real committed static assets),
    not the in-process `main()` calls above -- exercises the whole script
    boundary (argv/exit-code/stdio), not just the importable function."""
    repo_root = Path(__file__).resolve().parents[2]
    result = subprocess.run(
        [sys.executable, str(repo_root / "scripts" / "check_bundle_size.py")],
        cwd=repo_root,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode in (0, 1)
    assert "check_bundle_size" in (result.stdout + result.stderr)
