"""`/api/projects/{project}/health`: a one-shot summary combining the
build report's release gate with the audit index's obligation
accounting -- the title-block verdict line (design system 03 sec. 3).
Graphite-local aggregation shape (no regolith model represents
"gate + census in one row"); every field inside it is read verbatim
from regolith reports, never recomputed (charter sec. 3.2)."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict
from regolith.backends.calc import AuditSummary

from graphite.server.deps import project_root_path
from graphite.server.errors import raise_for_error
from graphite.service.reports import read_audit_index, read_staged_build_report

router = APIRouter(prefix="/api/projects", tags=["health"])


# frob:doc docs/spec/02-architecture.md#12-api-routes
class ProjectHealth(BaseModel):
    """The title-block verdict summary for one project."""

    model_config = ConfigDict(frozen=True)

    release_ok: bool
    obligation_summary: AuditSummary


# frob:doc docs/spec/02-architecture.md#12-api-routes
@router.get("/{project}/health", response_model=ProjectHealth)
def get_project_health(project: str) -> ProjectHealth:
    """`release_ok` from the build report + the audit index's obligation
    accounting -- both read verbatim, never recomputed."""
    root = project_root_path(project)
    build = read_staged_build_report(root / ".regolith" / "build" / "build_report.json")
    if build.is_err:
        raise_for_error(build.danger_err)
    audit = read_audit_index(root / "dist" / "calc" / "audit_index.json")
    if audit.is_err:
        raise_for_error(audit.danger_err)
    return ProjectHealth(
        release_ok=build.danger_ok.final.release_ok,
        obligation_summary=audit.danger_ok.summary,
    )
