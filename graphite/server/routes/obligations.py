"""`/api/projects/{project}/obligations`: the audit index's per-
obligation rows (`regolith.backends.calc.AuditRow`, disposition +
claim + subject), with `filter`/`group` query params over that SAME
regolith model -- no re-declared "obligation" shape (04.2)."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Query
from pydantic import BaseModel, ConfigDict

# frob:waive FI-BACKENDS reason="regolith.backends.calc (AuditIndex/AuditRow/AuditSummary) is not yet in regolith.surface's sanctioned set (WO-159 non-goals); out of WO-159/T-0021 scope, escalated as a facade-addition follow-up rather than silently exempted"
from regolith.backends.calc import AuditIndex, AuditRow, AuditSummary

from graphite.server.deps import project_root_path
from graphite.server.errors import raise_for_error

router = APIRouter(prefix="/api/projects", tags=["obligations"])


# frob:doc docs/spec/02-architecture.md#12-api-routes
class ObligationGroup(BaseModel):
    """One `group=` bucket: the key value (a disposition or a family)
    plus its member rows, in source order."""

    model_config = ConfigDict(frozen=True)

    key: str
    rows: tuple[AuditRow, ...]


# frob:doc docs/spec/02-architecture.md#12-api-routes
class ObligationsResponse(BaseModel):
    """The obligations listing: the real `AuditSummary` (unmodified)
    plus either a flat `rows` array or, when `group` is given,
    `groups` -- never both, so a client always knows which shape to
    render."""

    model_config = ConfigDict(frozen=True)

    summary: AuditSummary
    rows: tuple[AuditRow, ...] | None = None
    groups: tuple[ObligationGroup, ...] | None = None


def _family(claim_name: str) -> str:
    """The family a claim name belongs to: the text before a `[` (e.g.
    `strength[G1]` -> `strength`), or the whole name when there is no
    bracket (e.g. `construction`, `bearing`, `deflect`) -- the same
    convention `04.1`'s "ANY LIST OF PROBLEMS" companion audit expects
    (group-by-family)."""
    return claim_name.split("[", 1)[0]


def _load_index(project_root: Path) -> AuditIndex:
    from graphite.service.reports import read_audit_index

    result = read_audit_index(project_root / "dist" / "calc" / "audit_index.json")
    if result.is_err:
        raise_for_error(result.danger_err)
    return result.danger_ok


# frob:doc docs/spec/02-architecture.md#12-api-routes
@router.get("/{project}/obligations", response_model=ObligationsResponse)
def get_obligations(
    project: str,
    filter: str | None = Query(
        default=None, description="disposition to keep, e.g. 'violated'"
    ),
    group: str | None = Query(default=None, description="'disposition' or 'family'"),
) -> ObligationsResponse:
    """The project's obligation rows, optionally filtered by disposition
    and/or grouped by disposition or claim family."""
    index = _load_index(project_root_path(project))
    rows = index.rows
    if filter is not None:
        rows = tuple(r for r in rows if r.disposition == filter)
    if group is None:
        return ObligationsResponse(summary=index.summary, rows=rows)

    def key_fn(row: AuditRow) -> str:
        return _family(row.claim_name) if group == "family" else row.disposition

    buckets: dict[str, list[AuditRow]] = {}
    for row in rows:
        buckets.setdefault(key_fn(row), []).append(row)
    groups = tuple(
        ObligationGroup(key=key, rows=tuple(bucket_rows))
        for key, bucket_rows in sorted(buckets.items())
    )
    return ObligationsResponse(summary=index.summary, groups=groups)
