"""The CLI runner: driving actions (build/ship/test/optimize) spawn the
real `regolith` CLI as a subprocess with `--color never` (spec 02 sec.
3 -- graphite never imports the orchestrator, the CLI is the whole
contract). Every run gets a UUID, a persisted record under
`~/.graphite/runs/<id>.json` (durable run history, 04.1 "ANY LONG
OPERATION" floor), and a growing log file the SSE route tails.

Process model: `start_run` launches the subprocess in the background
(non-blocking) and returns immediately with the run id; the caller
polls `get_run`/`list_runs` or subscribes to `tail_log_lines` for live
output. This module owns NO asyncio/FastAPI concerns -- `graphite.
server.routes.runs` is the only place that wraps this in an SSE
response.

WOG5 decision (the -v toggle, deliverable 3), amended at the WO-G6
merge: every run is spawned with `REGOLITH_LOG=DEBUG` in its env, and
WO-G6's `GraphiteSettings.run_verbosity` ("a run verbosity passthrough
for driven CLI invocations", its own docstring -- WO-G5 is the intended
consumer) maps onto the CLI's OWN global flags, which win over the env
per lithos D163 (explicit flag strongest):

  normal  -> no flag; the env alone yields DEBUG-level stderr, so the
             D228 progress channel flows on a user's FIRST run (the
             original WO-G5 rationale: never a "re-run verbose" lap),
             while WO-107's default presentation (dedup, truncation)
             stays intact.
  verbose -> `-v`: the full verbatim firehose (no dedup/truncation).
  quiet   -> `-q`: WARNING+ only. This KNOWINGLY silences the progress
             channel (DEBUG records) -- the user explicitly traded
             progress for quiet, so the rail stays indeterminate.

There is still no per-run "-v" control in the run-start form (the
setting is app-level, WO-G6's Settings view); a `-v`/`-q` typed into
the free-form args field passes through to the CLI unchanged.
"""

from __future__ import annotations

import os
import signal
import subprocess
import sys
import uuid
from collections.abc import Iterator
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict
from typani.result import Err, Ok, Result

from graphite.logging_setup import get_logger
from graphite.service.errors import ServiceError
from graphite.service.reports import read_audit_index, read_staged_build_report
from graphite.service.settings import (
    DEFAULT_RUN_HISTORY_LIMIT,
    RunVerbosity,
    get_settings,
)

_log = get_logger(__name__)

# run_verbosity -> the regolith CLI's own global flag (D163: an explicit
# flag beats the REGOLITH_LOG env we always set). ONE mapping table.
_VERBOSITY_FLAGS: dict[RunVerbosity, tuple[str, ...]] = {
    "quiet": ("-q",),
    "normal": (),
    "verbose": ("-v",),
}


def runs_home() -> Path:
    """The configured run-record directory (`GRAPHITE_RUNS_HOME`,
    default `~/.graphite/runs`) -- read fresh on every call, mirroring
    `graphite.server.deps.scan_root`, so tests can monkeypatch the env
    var per-case without any module-reload gymnastics."""
    return Path(os.environ.get("GRAPHITE_RUNS_HOME", "~/.graphite/runs")).expanduser()


# In-process liveness table: run_id -> live Popen handle, for THIS
# server process's own lifetime only. A `graphite serve` restart loses
# this (honest limitation documented on `get_run`) -- persisted
# RunRecord status is the cross-restart source of truth.
_LIVE: dict[str, subprocess.Popen[bytes]] = {}

RunVerb = Literal["build", "ship", "test", "optimize", "check", "preview"]
RunStatus = Literal["running", "ok", "failed", "cancelled"]


class HealthSnapshot(BaseModel):
    """A best-effort project-health reading (same two reports
    `graphite.server.routes.health.get_project_health` combines), taken
    once before a run starts and once after it finishes, so the exit
    summary can render a real before -> after verdict diff (deliverable
    1) instead of a client-computed one. `None` fields mean the report
    was not present/parseable at that moment (e.g. no prior build) --
    an honest gap, not a zero."""

    model_config = ConfigDict(frozen=True)

    release_ok: bool | None = None
    violated: int | None = None
    total_obligations: int | None = None


def _capture_health(project_root: Path) -> HealthSnapshot:
    """Read the current build report + audit index, best-effort (a
    missing/unparseable report yields `None` fields, never an
    exception -- this runs opportunistically around a CLI invocation
    that may itself be about to create those very files)."""
    release_ok: bool | None = None
    violated: int | None = None
    total: int | None = None
    build = read_staged_build_report(
        project_root / ".regolith" / "build" / "build_report.json"
    )
    if build.is_ok:
        release_ok = build.danger_ok.final.release_ok
    audit = read_audit_index(project_root / "dist" / "calc" / "audit_index.json")
    if audit.is_ok:
        summary = audit.danger_ok.summary
        violated = summary.violated
        total = summary.obligations
    return HealthSnapshot(
        release_ok=release_ok, violated=violated, total_obligations=total
    )


class VerdictDiff(BaseModel):
    """The before/after health-snapshot pair for one run's exit summary
    (deliverable 1) -- both sides real reports, never a recomputed
    verdict."""

    model_config = ConfigDict(frozen=True)

    before: HealthSnapshot
    after: HealthSnapshot


class RunRecord(BaseModel):
    """One persisted run: identity, the verb driven, its live/final
    status, timestamps, and the project root it ran against. The log
    file and (for `--json` verbs) the stdout JSON blob live alongside
    it as sibling files (`<id>.log`, `<id>.stdout.json`), not inlined
    here -- this record is the cheap-to-list summary row. `before_health`
    is captured at `start_run` time (deliverable 1's diff baseline)."""

    model_config = ConfigDict(frozen=True)

    run_id: str
    verb: RunVerb
    project_root: str
    args: tuple[str, ...]
    status: RunStatus
    started_at: str
    finished_at: str | None = None
    exit_code: int | None = None
    before_health: HealthSnapshot | None = None
    pid: int | None = None


def _record_path(run_id: str) -> Path:
    return runs_home() / f"{run_id}.json"


def _log_path(run_id: str) -> Path:
    return runs_home() / f"{run_id}.log"


def _write_record(record: RunRecord) -> None:
    runs_home().mkdir(parents=True, exist_ok=True)
    _record_path(record.run_id).write_text(record.model_dump_json(indent=2))


def start_run(
    project_root: Path,
    verb: RunVerb,
    extra_args: tuple[str, ...] = (),
    *,
    regolith_argv: tuple[str, ...] | None = None,
) -> Result[RunRecord, ServiceError]:
    """Launch `regolith --color never [-v|-q] <verb> <extra_args>` as a
    detached subprocess (cwd=`project_root`), stdout+stderr redirected
    to the run's log file, and persist a `running` record immediately.
    The `[-v|-q]` comes from WO-G6's `run_verbosity` setting (module
    docstring); a missing/unreadable settings file falls back to
    `normal`, never blocks a run. `regolith_argv` overrides the
    executable invocation for tests (defaults to `[sys.executable,
    "-m", "regolith.cli"]`, the same pattern lithos's own test suite
    uses to invoke the console entry point in-process without requiring
    a `regolith` binary on PATH)."""
    if not project_root.is_dir():
        return Err(
            ServiceError(kind="not_found", message=f"no project root at {project_root}")
        )
    run_id = uuid.uuid4().hex
    runs_home().mkdir(parents=True, exist_ok=True)
    settings = get_settings()
    verbosity: RunVerbosity = (
        settings.danger_ok.run_verbosity if settings.is_ok else "normal"
    )
    if settings.is_err:
        _log.warning(
            "runs: unreadable settings (%s), falling back to normal verbosity",
            settings.danger_err.message,
        )
    # Retention (WOG5-F3): bound the history BEFORE adding this run's
    # record, so the store never exceeds limit+1 files even transiently.
    history_limit = (
        settings.danger_ok.run_history_limit
        if settings.is_ok
        else DEFAULT_RUN_HISTORY_LIMIT
    )
    pruned = prune_run_history(history_limit)
    if pruned:
        _log.info("runs: retention pruned %d old run record(s)", pruned)
    argv = list(regolith_argv or (sys.executable, "-m", "regolith.cli"))
    full_args = [
        *argv,
        "--color",
        "never",
        *_VERBOSITY_FLAGS[verbosity],
        verb,
        *extra_args,
    ]
    _log.debug("runs: verbosity=%s flags=%s", verbosity, _VERBOSITY_FLAGS[verbosity])
    started_at = datetime.now(timezone.utc).isoformat()
    log_path = _log_path(run_id)
    before_health = _capture_health(project_root)
    record = RunRecord(
        run_id=run_id,
        verb=verb,
        project_root=str(project_root.resolve()),
        args=tuple(extra_args),
        status="running",
        started_at=started_at,
        before_health=before_health,
    )
    _write_record(record)
    # WOG5 decision (see module docstring): DEBUG-level stderr via env so
    # the D228 progress channel flows by default; the verbosity FLAG above
    # (if any) wins over this env per lithos D163.
    env = {**os.environ, "REGOLITH_LOG": "DEBUG"}
    try:
        with log_path.open("wb") as log_file:
            process = subprocess.Popen(  # noqa: S603 -- argv is server-constructed, never client string
                full_args,
                cwd=project_root,
                stdout=log_file,
                stderr=subprocess.STDOUT,
                env=env,
            )
    except OSError as exc:
        _log.error("runs: failed to launch %s: %s", full_args, exc)
        failed = record.model_copy(
            update={
                "status": "failed",
                "finished_at": datetime.now(timezone.utc).isoformat(),
                "exit_code": None,
            }
        )
        _write_record(failed)
        return Err(
            ServiceError(
                kind="cli_not_found",
                message="cannot launch regolith CLI",
                detail=str(exc),
            )
        )

    _log.info("runs: started run=%s verb=%s pid=%d", run_id, verb, process.pid)
    _LIVE[run_id] = process
    record = record.model_copy(update={"pid": process.pid})
    _write_record(record)
    _poll_and_finalize(run_id)
    return Ok(_read_record(run_id).danger_ok)


def _poll_and_finalize(run_id: str) -> None:
    """Poll the in-process `Popen` handle (if this server process is the
    one that started the run) and persist a final status the moment it
    exits. Called opportunistically from `start_run` and `get_run` so
    ordinary polling converges on the real status without a dedicated
    reaper thread."""
    process = _LIVE.get(run_id)
    if process is None:
        return
    exit_code = process.poll()
    if exit_code is not None:
        _finalize(run_id, exit_code)
        del _LIVE[run_id]


def _finalize(run_id: str, exit_code: int) -> None:
    record = _read_record(run_id)
    if record.is_err:
        return
    updated = record.danger_ok.model_copy(
        update={
            "status": "ok" if exit_code == 0 else "failed",
            "finished_at": datetime.now(timezone.utc).isoformat(),
            "exit_code": exit_code,
        }
    )
    _write_record(updated)


def _read_record(run_id: str) -> Result[RunRecord, ServiceError]:
    path = _record_path(run_id)
    if not path.is_file():
        return Err(ServiceError(kind="not_found", message=f"no run {run_id}"))
    return Ok(RunRecord.model_validate_json(path.read_text()))


def get_run(run_id: str) -> Result[RunRecord, ServiceError]:
    """The current record for `run_id`, re-polling the OS process table
    when the persisted status is still `running` (a `graphite serve`
    restart loses the in-memory `Popen` handle, so this re-derives
    liveness from the pid where possible; a run that outlived the
    server process without exiting is left `running` -- honest, not
    silently marked failed)."""
    record = _read_record(run_id)
    if record.is_err:
        return record
    if record.danger_ok.status == "running":
        _poll_and_finalize(run_id)
        return _read_record(run_id)
    return record


def mark_finished(run_id: str, exit_code: int) -> None:
    """Test/CLI-runner seam: explicitly finalize a run once its
    subprocess is known to have exited (used by the SSE route after it
    finishes tailing, and directly by tests that need deterministic
    completion without racing `Popen.poll`)."""
    _finalize(run_id, exit_code)


def prune_run_history(limit: int) -> int:
    """Delete the oldest FINISHED run records (and their `.log` /
    `.stdout.json` siblings) beyond `limit`, returning how many were
    pruned (WO-G8, closes WOG5-F3: runs-home grew without bound).
    `limit=0` keeps everything -- the pre-retention behavior. Records
    with status `running` are never pruned: a long-lived run must not
    lose its record mid-flight, whatever its age."""
    if limit <= 0:
        return 0
    keepable = [r for r in list_runs() if r.status != "running"]
    doomed = keepable[limit:]  # list_runs is newest-first
    for record in doomed:
        for path in (
            _record_path(record.run_id),
            _log_path(record.run_id),
            runs_home() / f"{record.run_id}.stdout.json",
        ):
            try:
                path.unlink(missing_ok=True)
            except OSError as exc:
                _log.warning("runs: could not prune %s: %s", path, exc)
        _log.info(
            "runs: pruned run %s (%s, started %s) past run_history_limit=%d",
            record.run_id,
            record.status,
            record.started_at,
            limit,
        )
    return len(doomed)


def list_runs(project_root: Path | None = None) -> tuple[RunRecord, ...]:
    """Every persisted run, newest first; `project_root` filters to one
    project when given."""
    if not runs_home().is_dir():
        return ()
    records: list[RunRecord] = []
    for path in runs_home().glob("*.json"):
        try:
            record = RunRecord.model_validate_json(path.read_text())
        except (OSError, ValueError) as exc:
            _log.warning("runs: skipping unreadable run record %s: %s", path, exc)
            continue
        if project_root is not None and record.project_root != str(
            project_root.resolve()
        ):
            continue
        records.append(record)
    records.sort(key=lambda r: r.started_at, reverse=True)
    return tuple(records)


def tail_log_lines(run_id: str) -> Iterator[str]:
    """Yield every line currently in `run_id`'s log file (the SSE route
    calls this in a loop with a poll interval -- this function itself
    is a single synchronous pass, kept dependency-free of asyncio so
    `graphite.service` stays framework-agnostic per the service-layer
    boundary, spec 02 sec. 4)."""
    path = _log_path(run_id)
    if not path.is_file():
        return
    with path.open("r", errors="replace") as fh:
        for line in fh:
            yield line.rstrip("\n")


def get_full_log(run_id: str) -> tuple[str, ...]:
    """Every captured log line for `run_id`, as a plain tuple -- the
    non-streaming counterpart to `tail_log_lines`, used by run-history
    detail replay (deliverable 2) where there is no SSE subscription,
    just a finished run's full captured stream."""
    return tuple(tail_log_lines(run_id))


def cancel_run(run_id: str) -> Result[RunRecord, ServiceError]:
    """Stop a running run (deliverable 1's cancel affordance -- WOG1-F6:
    no kill route existed before WO-G5). Prefers the in-process `Popen`
    handle (SIGTERM, escalating to SIGKILL after a short grace period);
    falls back to `os.kill` on the persisted `pid` for a run started by
    a since-restarted server process (the same honest cross-restart
    posture as `get_run`). A run that has already finished, or an
    unknown run id, is reported as such rather than silently no-op'd."""
    record_result = _read_record(run_id)
    if record_result.is_err:
        return record_result
    record = record_result.danger_ok
    if record.status != "running":
        return Ok(record)

    process = _LIVE.get(run_id)
    if process is not None:
        process.terminate()
        try:
            exit_code = process.wait(timeout=5.0)
        except subprocess.TimeoutExpired:
            _log.warning("runs: run=%s did not exit on SIGTERM, killing", run_id)
            process.kill()
            exit_code = process.wait(timeout=5.0)
        del _LIVE[run_id]
    elif record.pid is not None:
        try:
            os.kill(record.pid, signal.SIGTERM)
        except ProcessLookupError:
            _log.info("runs: run=%s pid=%d already gone", run_id, record.pid)
        exit_code = None
    else:
        exit_code = None

    _log.info("runs: cancelled run=%s exit_code=%s", run_id, exit_code)
    updated = record.model_copy(
        update={
            "status": "cancelled",
            "finished_at": datetime.now(timezone.utc).isoformat(),
            "exit_code": exit_code,
        }
    )
    _write_record(updated)
    return Ok(updated)


def compute_verdict_diff(run_id: str) -> Result[VerdictDiff, ServiceError]:
    """`before_health` (captured at `start_run`) paired with a fresh
    `_capture_health` read of the project's CURRENT reports -- the exit
    summary's verdict-count diff (deliverable 1). Callable at any time
    (not just after completion); a still-`running` run's "after" simply
    reflects whatever is on disk right now, same honesty posture as the
    rest of this module."""
    record_result = _read_record(run_id)
    if record_result.is_err:
        return Err(record_result.danger_err)
    record = record_result.danger_ok
    before = record.before_health or HealthSnapshot()
    after = _capture_health(Path(record.project_root))
    return Ok(VerdictDiff(before=before, after=after))
