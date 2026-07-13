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
"""

from __future__ import annotations

import os
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

_log = get_logger(__name__)


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
RunStatus = Literal["running", "ok", "failed"]


class RunRecord(BaseModel):
    """One persisted run: identity, the verb driven, its live/final
    status, timestamps, and the project root it ran against. The log
    file and (for `--json` verbs) the stdout JSON blob live alongside
    it as sibling files (`<id>.log`, `<id>.stdout.json`), not inlined
    here -- this record is the cheap-to-list summary row."""

    model_config = ConfigDict(frozen=True)

    run_id: str
    verb: RunVerb
    project_root: str
    args: tuple[str, ...]
    status: RunStatus
    started_at: str
    finished_at: str | None = None
    exit_code: int | None = None


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
    """Launch `regolith --color never <verb> <extra_args>` as a
    detached subprocess (cwd=`project_root`), stdout+stderr redirected
    to the run's log file, and persist a `running` record immediately.
    `regolith_argv` overrides the executable invocation for tests
    (defaults to `[sys.executable, "-m", "regolith.cli"]`, the same
    pattern lithos's own test suite uses to invoke the console entry
    point in-process without requiring a `regolith` binary on PATH)."""
    if not project_root.is_dir():
        return Err(
            ServiceError(kind="not_found", message=f"no project root at {project_root}")
        )
    run_id = uuid.uuid4().hex
    runs_home().mkdir(parents=True, exist_ok=True)
    argv = list(regolith_argv or (sys.executable, "-m", "regolith.cli"))
    full_args = [*argv, "--color", "never", verb, *extra_args]
    started_at = datetime.now(timezone.utc).isoformat()
    log_path = _log_path(run_id)
    record = RunRecord(
        run_id=run_id,
        verb=verb,
        project_root=str(project_root.resolve()),
        args=tuple(extra_args),
        status="running",
        started_at=started_at,
    )
    _write_record(record)
    try:
        with log_path.open("wb") as log_file:
            process = subprocess.Popen(  # noqa: S603 -- argv is server-constructed, never client string
                full_args,
                cwd=project_root,
                stdout=log_file,
                stderr=subprocess.STDOUT,
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
    _poll_and_finalize(run_id)
    return Ok(record)


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


# -- D228 progress-event shape (provisional; lithos WO-119 gate) --------
#
# WOG1-F4 (escalation, placeholder): lithos WO-119 has not landed the
# progress-event PRODUCER yet (spec 01 sec. 5 / WO-G1 deliverable 2).
# The shape below is graphite's own forward-declared consumer contract
# for that channel -- ONE place, marked provisional -- so `runs.py`'s
# SSE route can upgrade from plain log lines to typed progress events
# the moment WO-119 lands without a second design pass. Do not
# construct one of these from graphite today; it exists only as the
# documented target shape.
class ProgressEventProvisional(BaseModel):
    """PROVISIONAL (WOG1-F4): the D228 progress-event shape graphite
    will consume once lithos WO-119 lands. Not emitted by anything in
    this codebase yet -- log-line streaming is the whole SSE payload
    until then."""

    model_config = ConfigDict(frozen=True)

    kind: Literal["progress"] = "progress"
    phase: str
    fraction_done: float | None = None
    message: str
