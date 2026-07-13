"""`graphite.service.runs`: the CLI runner + persisted run records."""

from __future__ import annotations

import sys
import time
from pathlib import Path

import pytest

from graphite.service import runs as runs_module


@pytest.fixture(autouse=True)
def _runs_home(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    home = tmp_path / "graphite-runs-home"
    monkeypatch.setenv("GRAPHITE_RUNS_HOME", str(home))
    return home


def _wait_until_finished(run_id: str, timeout: float = 20.0) -> runs_module.RunRecord:
    deadline = time.time() + timeout
    while time.time() < deadline:
        record = runs_module.get_run(run_id).danger_ok
        if record.status != "running":
            return record
        time.sleep(0.2)
    raise TimeoutError(f"run {run_id} did not finish within {timeout}s")


def test_start_run_persists_a_running_record(timber_pavilion: Path) -> None:
    result = runs_module.start_run(
        timber_pavilion,
        "check",
        ("program.calx",),
        regolith_argv=(sys.executable, "-m", "regolith.cli"),
    )
    assert result.is_ok
    record = result.danger_ok
    assert record.verb == "check"
    assert record.status in ("running", "ok")


def test_start_run_and_get_run_converge_on_ok(timber_pavilion: Path) -> None:
    started = runs_module.start_run(
        timber_pavilion,
        "check",
        ("program.calx",),
        regolith_argv=(sys.executable, "-m", "regolith.cli"),
    ).danger_ok
    finished = _wait_until_finished(started.run_id)
    assert finished.status == "ok"
    assert finished.exit_code == 0
    assert finished.finished_at is not None


def test_log_lines_are_tailable(timber_pavilion: Path) -> None:
    started = runs_module.start_run(
        timber_pavilion,
        "check",
        ("program.calx",),
        regolith_argv=(sys.executable, "-m", "regolith.cli"),
    ).danger_ok
    _wait_until_finished(started.run_id)
    lines = list(runs_module.tail_log_lines(started.run_id))
    assert any("check" in line for line in lines)


def test_start_run_missing_project_root(tmp_path: Path) -> None:
    result = runs_module.start_run(tmp_path / "does-not-exist", "check")
    assert result.is_err
    assert result.danger_err.kind == "not_found"


def test_start_run_cli_not_found(timber_pavilion: Path) -> None:
    result = runs_module.start_run(
        timber_pavilion, "check", regolith_argv=("/no/such/binary-xyz",)
    )
    assert result.is_err
    assert result.danger_err.kind == "cli_not_found"


def test_get_run_unknown_id() -> None:
    result = runs_module.get_run("no-such-run-id")
    assert result.is_err
    assert result.danger_err.kind == "not_found"


def test_list_runs_filters_by_project(timber_pavilion: Path, tmp_path: Path) -> None:
    runs_module.start_run(
        timber_pavilion,
        "check",
        ("program.calx",),
        regolith_argv=(sys.executable, "-m", "regolith.cli"),
    )
    other_root = tmp_path / "other"
    other_root.mkdir()
    all_for_project = runs_module.list_runs(timber_pavilion)
    all_for_other = runs_module.list_runs(other_root)
    assert len(all_for_project) == 1
    assert len(all_for_other) == 0
