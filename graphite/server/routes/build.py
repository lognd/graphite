"""`/api/projects/{project}/build-report|lockfile|manifest`: the
staged build report (BOM/cost/schedule data lives inside it --
`cost_profile`/`cost_record_pins`/`cost_estimates`/`frame_lock_rows`,
read-mostly per charter sec. 3.2: graphite renders these reference
pins/hashes verbatim, it never recomputes a cost total itself), the
resolved lockfile, and the ship package manifest summary."""

from __future__ import annotations

from fastapi import APIRouter
from regolith.orchestrator.lockfile import Lockfile
from regolith.orchestrator.orchestrate import StagedBuildReport

from graphite.server.deps import project_root_path
from graphite.server.errors import raise_for_error
from graphite.service.reports import (
    GateSummary,
    ManifestSummary,
    read_gate_summary,
    read_lockfile,
    read_manifest,
    read_staged_build_report,
)

router = APIRouter(prefix="/api/projects", tags=["build"])


# frob:doc docs/spec/02-architecture.md#12-api-routes
@router.get("/{project}/build-report", response_model=StagedBuildReport)
def get_build_report(project: str) -> StagedBuildReport:
    """The full staged build report, including the BOM/cost/schedule
    fields (`cost_profile`, `cost_record_pins`, `cost_estimates`,
    `frame_lock_rows`) verbatim from regolith -- no local recomputation
    (charter sec. 3.2)."""
    root = project_root_path(project)
    result = read_staged_build_report(
        root / ".regolith" / "build" / "build_report.json"
    )
    if result.is_err:
        raise_for_error(result.danger_err)
    return result.danger_ok


# frob:doc docs/spec/02-architecture.md#12-api-routes
@router.get("/{project}/lockfile", response_model=Lockfile)
def get_lockfile(project: str) -> Lockfile:
    """The resolved `regolith.lock` (every pinned slot + its cause)."""
    root = project_root_path(project)
    result = read_lockfile(root / ".regolith" / "build" / "regolith.lock")
    if result.is_err:
        raise_for_error(result.danger_err)
    return result.danger_ok


# frob:doc docs/spec/02-architecture.md#12-api-routes
@router.get("/{project}/manifest", response_model=ManifestSummary)
def get_manifest(project: str) -> ManifestSummary:
    """The ship package manifest summary (WOG1-F2, provisional bridge)."""
    root = project_root_path(project)
    result = read_manifest(root / "dist" / "manifest.json")
    if result.is_err:
        raise_for_error(result.danger_err)
    return result.danger_ok


# frob:doc docs/spec/02-architecture.md#12-api-routes
@router.get("/{project}/gate-summary", response_model=GateSummary)
def get_gate_summary(project: str) -> GateSummary:
    """The release-gate summary panel (WOG3-F1, provisional bridge --
    project-view deliverable 2)."""
    root = project_root_path(project)
    result = read_gate_summary(root / "dist" / "gate_summary.json")
    if result.is_err:
        raise_for_error(result.danger_err)
    return result.danger_ok
