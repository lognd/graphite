"""`/api/projects/{project}/runs`: start a driving action, list run
history, fetch one run's detail/full log, stream its log+progress as
SSE, cancel it mid-run, and diff its before/after verdict.

The SSE stream carries two event kinds: `log` (`{"kind": "log", "line":
...}`, the raw captured stderr+stdout, unconditionally) and `progress`
(`{"kind": "progress", ...ProgressEvent fields}`) for every line that
parses as a D228 typed progress record. Parsing is done with
`regolith.progress.parse_line` -- the ONE parser (dedup law): this
route never re-implements the wire-shape regex, it imports lithos's
own (WO-119 landed the producer; that module's docstring is the wire-
shape stability contract WO-G5/WO-120 both read). The frontend
therefore never parses progress text itself -- it only ever consumes
this route's typed JSON."""

from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncIterator

from fastapi import APIRouter, Body
from regolith.progress import parse_line
from sse_starlette.sse import EventSourceResponse

from graphite.server.deps import project_root_path
from graphite.server.errors import raise_for_error
from graphite.service.runs import (
    RunRecord,
    RunVerb,
    VerdictDiff,
    cancel_run,
    compute_verdict_diff,
    get_full_log,
    get_run,
    list_runs,
    start_run,
    tail_log_lines,
)

router = APIRouter(tags=["runs"])

_POLL_SECONDS = 0.25


# frob:doc docs/spec/02-architecture.md#12-api-routes
@router.post("/api/projects/{project}/runs", response_model=RunRecord)
def start_project_run(
    project: str,
    verb: RunVerb = Body(embed=True),
    args: tuple[str, ...] = Body(default=(), embed=True),
) -> RunRecord:
    """Start `regolith <verb> <args>` against `project`'s root; returns
    immediately with a `running` record (04.1 "ANY LONG OPERATION"
    floor: a durable record + elapsed time via `started_at` for the
    frontend to compute)."""
    root = project_root_path(project)
    result = start_run(root, verb, args)
    if result.is_err:
        raise_for_error(result.danger_err)
    return result.danger_ok


# frob:doc docs/spec/02-architecture.md#12-api-routes
@router.get("/api/projects/{project}/runs", response_model=tuple[RunRecord, ...])
def list_project_runs(project: str) -> tuple[RunRecord, ...]:
    """This project's run history, newest first."""
    root = project_root_path(project)
    return list_runs(root)


# frob:doc docs/spec/02-architecture.md#12-api-routes
@router.get("/api/runs/{run_id}", response_model=RunRecord)
def get_run_detail(run_id: str) -> RunRecord:
    """One run's current record (re-polls liveness when still `running`,
    see `graphite.service.runs.get_run`)."""
    result = get_run(run_id)
    if result.is_err:
        raise_for_error(result.danger_err)
    return result.danger_ok


# frob:doc docs/spec/02-architecture.md#12-api-routes
@router.get("/api/runs/{run_id}/log", response_model=tuple[str, ...])
def get_run_log(run_id: str) -> tuple[str, ...]:
    """The full captured log for `run_id` as a plain array -- run-
    history detail replay (deliverable 2), no SSE subscription needed
    for a run that has already finished (or is still running; this
    still returns whatever has been captured so far)."""
    return get_full_log(run_id)


# frob:doc docs/spec/02-architecture.md#12-api-routes
@router.post("/api/runs/{run_id}/cancel", response_model=RunRecord)
def cancel_project_run(run_id: str) -> RunRecord:
    """Stop a running run (deliverable 1's cancel affordance; WOG1-F6
    closed -- no kill route existed before WO-G5)."""
    result = cancel_run(run_id)
    if result.is_err:
        raise_for_error(result.danger_err)
    return result.danger_ok


# frob:doc docs/spec/02-architecture.md#12-api-routes
@router.get("/api/runs/{run_id}/verdict-diff", response_model=VerdictDiff)
def get_run_verdict_diff(run_id: str) -> VerdictDiff:
    """The before/after health-snapshot pair for `run_id`'s exit summary
    (deliverable 1) -- both real report reads, never a recomputed
    verdict (charter sec. 3.2)."""
    result = compute_verdict_diff(run_id)
    if result.is_err:
        raise_for_error(result.danger_err)
    return result.danger_ok


def _progress_event_payload(line: str) -> dict[str, object] | None:
    """`line` -> the JSON-safe `progress` SSE payload, or `None` when
    the line carries no progress record (the overwhelming majority)."""
    event = parse_line(line)
    if event is None:
        return None
    return {
        "kind": "progress",
        "v": event.v,
        "phase": event.phase,
        "subject": event.subject,
        "done": event.done,
        "total": event.total,
        "elapsed": event.elapsed,
    }


async def _log_event_stream(run_id: str) -> AsyncIterator[dict[str, str]]:
    """Yield every log line for `run_id` as an SSE `log` event (plus a
    `progress` event alongside any line that parses as one), then keep
    polling for new lines until the run's record leaves `running` --
    an honest close (04.1: "failure state with the actual stderr tail,
    not a sad-face illustration")."""
    seen = 0
    while True:
        lines = list(tail_log_lines(run_id))
        for line in lines[seen:]:
            yield {"event": "log", "data": json.dumps({"kind": "log", "line": line})}
            progress = _progress_event_payload(line)
            if progress is not None:
                yield {"event": "progress", "data": json.dumps(progress)}
        seen = len(lines)
        record = get_run(run_id)
        if record.is_err or record.danger_ok.status != "running":
            status = record.danger_ok.status if record.is_ok else "failed"
            yield {
                "event": "done",
                "data": json.dumps({"kind": "done", "status": status}),
            }
            return
        await asyncio.sleep(_POLL_SECONDS)


# frob:doc docs/spec/02-architecture.md#12-api-routes
@router.get("/api/runs/{run_id}/events")
async def run_events(run_id: str) -> EventSourceResponse:
    """SSE stream of `run_id`'s log lines + parsed progress events,
    closing with a `done` event once the run finishes."""
    return EventSourceResponse(_log_event_stream(run_id))
