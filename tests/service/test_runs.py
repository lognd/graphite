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
    # Isolate graphite settings too: start_run reads run_verbosity
    # (WO-G6 merge), and a dev machine's real ~/.graphite/settings.json
    # must never steer a test's spawn flags.
    monkeypatch.setenv("GRAPHITE_HOME", str(tmp_path / "graphite-home"))
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


def test_start_run_captures_before_health(timber_pavilion: Path) -> None:
    started = runs_module.start_run(
        timber_pavilion,
        "check",
        ("program.calx",),
        regolith_argv=(sys.executable, "-m", "regolith.cli"),
    ).danger_ok
    assert started.before_health is not None


def test_get_full_log_matches_tail(timber_pavilion: Path) -> None:
    started = runs_module.start_run(
        timber_pavilion,
        "check",
        ("program.calx",),
        regolith_argv=(sys.executable, "-m", "regolith.cli"),
    ).danger_ok
    _wait_until_finished(started.run_id)
    assert runs_module.get_full_log(started.run_id) == tuple(
        runs_module.tail_log_lines(started.run_id)
    )


def test_compute_verdict_diff_reads_before_and_after(timber_pavilion: Path) -> None:
    started = runs_module.start_run(
        timber_pavilion,
        "check",
        ("program.calx",),
        regolith_argv=(sys.executable, "-m", "regolith.cli"),
    ).danger_ok
    _wait_until_finished(started.run_id)
    diff = runs_module.compute_verdict_diff(started.run_id)
    assert diff.is_ok
    assert diff.danger_ok.before is not None
    assert diff.danger_ok.after is not None


def test_compute_verdict_diff_unknown_run(timber_pavilion: Path) -> None:
    result = runs_module.compute_verdict_diff("no-such-run-id")
    assert result.is_err
    assert result.danger_err.kind == "not_found"


def test_cancel_run_kills_a_live_process(timber_pavilion: Path) -> None:
    started = runs_module.start_run(
        timber_pavilion,
        "check",
        ("program.calx",),
        regolith_argv=(sys.executable, "-c", "import time; time.sleep(30)"),
    ).danger_ok
    assert started.status == "running"
    cancelled = runs_module.cancel_run(started.run_id)
    assert cancelled.is_ok
    assert cancelled.danger_ok.status == "cancelled"
    assert cancelled.danger_ok.finished_at is not None


def test_cancel_run_already_finished_is_a_noop(timber_pavilion: Path) -> None:
    started = runs_module.start_run(
        timber_pavilion,
        "check",
        ("program.calx",),
        regolith_argv=(sys.executable, "-m", "regolith.cli"),
    ).danger_ok
    finished = _wait_until_finished(started.run_id)
    result = runs_module.cancel_run(started.run_id)
    assert result.is_ok
    assert result.danger_ok.status == finished.status


def test_cancel_run_unknown_id() -> None:
    result = runs_module.cancel_run("no-such-run-id")
    assert result.is_err
    assert result.danger_err.kind == "not_found"


# -- run_verbosity passthrough (WO-G6 merge) ----------------------------

_ECHO_ARGV = (sys.executable, "-c", "import sys; print(' '.join(sys.argv[1:]))")


def _spawn_and_read_argv(timber_pavilion: Path) -> str:
    started = runs_module.start_run(
        timber_pavilion, "check", regolith_argv=_ECHO_ARGV
    ).danger_ok
    _wait_until_finished(started.run_id)
    return "\n".join(runs_module.tail_log_lines(started.run_id))


def test_run_verbosity_normal_spawns_no_flag(timber_pavilion: Path) -> None:
    argv_line = _spawn_and_read_argv(timber_pavilion)
    assert "--color never check" in argv_line
    assert "-q" not in argv_line and "-v" not in argv_line


def test_run_verbosity_quiet_spawns_dash_q(timber_pavilion: Path) -> None:
    from graphite.service.settings import GraphiteSettings, set_settings

    assert set_settings(GraphiteSettings(run_verbosity="quiet")).is_ok
    argv_line = _spawn_and_read_argv(timber_pavilion)
    assert "--color never -q check" in argv_line


def test_run_verbosity_verbose_spawns_dash_v(timber_pavilion: Path) -> None:
    from graphite.service.settings import GraphiteSettings, set_settings

    assert set_settings(GraphiteSettings(run_verbosity="verbose")).is_ok
    argv_line = _spawn_and_read_argv(timber_pavilion)
    assert "--color never -v check" in argv_line
