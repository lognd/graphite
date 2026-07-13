"""`/api/projects/{project}/runs`: start a driving action, list run
history, fetch one run's detail, and stream its log as SSE.

The SSE event shape is plain log lines TODAY (`{"kind": "log", "line":
...}`); `graphite.service.runs.ProgressEventProvisional` documents,
in ONE place, the D228 typed-progress shape this stream upgrades to
once lithos WO-119 lands (WOG1-F4) -- this route does not construct
that shape yet."""

from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncIterator

from fastapi import APIRouter, Body
from sse_starlette.sse import EventSourceResponse

from graphite.server.deps import project_root_path
from graphite.server.errors import raise_for_error
from graphite.service.runs import (
    RunRecord,
    RunVerb,
    get_run,
    list_runs,
    start_run,
    tail_log_lines,
)

router = APIRouter(tags=["runs"])

_POLL_SECONDS = 0.25


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


@router.get("/api/projects/{project}/runs", response_model=tuple[RunRecord, ...])
def list_project_runs(project: str) -> tuple[RunRecord, ...]:
    """This project's run history, newest first."""
    root = project_root_path(project)
    return list_runs(root)


@router.get("/api/runs/{run_id}", response_model=RunRecord)
def get_run_detail(run_id: str) -> RunRecord:
    """One run's current record (re-polls liveness when still `running`,
    see `graphite.service.runs.get_run`)."""
    result = get_run(run_id)
    if result.is_err:
        raise_for_error(result.danger_err)
    return result.danger_ok


async def _log_event_stream(run_id: str) -> AsyncIterator[dict[str, str]]:
    """Yield every log line for `run_id` as an SSE event, then keep
    polling for new lines until the run's record leaves `running` --
    an honest close (04.1: "failure state with the actual stderr tail,
    not a sad-face illustration")."""
    seen = 0
    while True:
        lines = list(tail_log_lines(run_id))
        for line in lines[seen:]:
            yield {"event": "log", "data": json.dumps({"kind": "log", "line": line})}
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


@router.get("/api/runs/{run_id}/events")
async def run_events(run_id: str) -> EventSourceResponse:
    """SSE stream of `run_id`'s log lines, closing with a `done` event
    once the run finishes."""
    return EventSourceResponse(_log_event_stream(run_id))
