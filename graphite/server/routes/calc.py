"""`/api/projects/{project}/calc`: calc sheets + the audit index, both
`regolith.backends.calc` models unmodified."""

from __future__ import annotations

from fastapi import APIRouter
from regolith.backends.calc import AuditIndex, CalcSheet

from graphite.server.deps import project_root_path
from graphite.server.errors import raise_for_error
from graphite.service.reports import (
    AcceptanceLedgerSummary,
    read_acceptance_ledger,
    read_audit_index,
    read_calc_book,
)

router = APIRouter(prefix="/api/projects", tags=["calc"])


@router.get("/{project}/calc/sheets", response_model=tuple[CalcSheet, ...])
def list_calc_sheets(project: str) -> tuple[CalcSheet, ...]:
    """Every calc sheet in the project's shipped calc book (04.1 "ANY
    TABLE" floor: sort/filter/CSV-export are frontend concerns over
    this same array, not a server-side feature)."""
    root = project_root_path(project)
    result = read_calc_book(root / "dist" / "calc" / "calc_book.json")
    if result.is_err:
        raise_for_error(result.danger_err)
    return result.danger_ok.sheets


@router.get("/{project}/calc/audit", response_model=AuditIndex)
def get_audit_index(project: str) -> AuditIndex:
    """The project's audit index (summary + rows) -- the same model
    `/obligations` filters/groups, exposed here unfiltered for a raw
    view (04.1 "ANY DETAIL VIEW" floor: raw-JSON toggle)."""
    root = project_root_path(project)
    result = read_audit_index(root / "dist" / "calc" / "audit_index.json")
    if result.is_err:
        raise_for_error(result.danger_err)
    return result.danger_ok


@router.get(
    "/{project}/acceptance-ledger", response_model=AcceptanceLedgerSummary
)
def get_acceptance_ledger(project: str) -> AcceptanceLedgerSummary:
    """The accepted-deviation ledger (waiver/memo panel, project-view
    deliverable 2): every accepted deviation with its memo evidence
    digest and basis text, read verbatim (WOG1-F3 provisional bridge)."""
    root = project_root_path(project)
    result = read_acceptance_ledger(root / "dist" / "acceptance_ledger.json")
    if result.is_err:
        raise_for_error(result.danger_err)
    return result.danger_ok
