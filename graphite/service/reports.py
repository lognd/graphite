"""The ONE regolith-report-reading module: build report, lockfile, calc
book, audit index, and acceptance ledger, all parsed WITH regolith's
own wheel model classes (never re-declared -- 04.2 dedup law / WO-G1
hard rule). Every reader returns `Result[Model, ServiceError]`.

Import paths used here (all public, no leading underscore -- verified
against `tools/health/fleet.py`'s own posture, which never imports
regolith's schema models but treats `--json` stdout as a raw dict;
graphite goes one step further and validates with the real model
classes since they ARE public):

  regolith.orchestrator.orchestrate.StagedBuildReport / BuildReport
  regolith.orchestrator.acceptance.AcceptanceOutcome
  regolith.orchestrator.lockfile.Lockfile / parse()
  regolith.backends.calc.CalcBook / AuditIndex

On-disk shapes read (relative to a project root):
  .regolith/build/build_report.json   -> StagedBuildReport (a `build
                                          --release` writes this; a bare
                                          BuildReport is also accepted
                                          for a `build` without staging)
  .regolith/build/regolith.lock       -> Lockfile (text format, WOG1
                                          uses regolith's own `parse`)
  dist/calc/calc_book.json            -> CalcBook
  dist/calc/audit_index.json          -> AuditIndex
  dist/acceptance_ledger.json         -> AcceptanceOutcome
  dist/manifest.json                  -> raw dict (ship package
                                          manifest; WOG1-F2 below)

WOG1-F2 (escalation, placeholder): the ship package `manifest.json` has
no dedicated regolith pydantic model in the public surface (it is
assembled ad hoc in the ship backend) -- read here as a validated-shape
`ManifestSummary` (graphite-local, marked provisional) rather than a
raw untyped dict, pending a real model from lithos.
"""

from __future__ import annotations

import json
from pathlib import Path

from pydantic import BaseModel, ConfigDict, ValidationError
from regolith.backends.calc import AuditIndex, CalcBook
from regolith.orchestrator.lockfile import Lockfile
from regolith.orchestrator.lockfile import parse as parse_lockfile
from regolith.orchestrator.orchestrate import BuildReport, StagedBuildReport
from typani.result import Err, Ok, Result

from graphite.logging_setup import get_logger
from graphite.service.errors import ServiceError

_log = get_logger(__name__)


def _read_text(path: Path) -> Result[str, ServiceError]:
    if not path.is_file():
        return Err(ServiceError(kind="not_found", message=f"no file at {path}"))
    try:
        return Ok(path.read_text())
    except OSError as exc:
        _log.warning("reports: cannot read %s: %s", path, exc)
        return Err(
            ServiceError(
                kind="io_error", message=f"cannot read {path}", detail=str(exc)
            )
        )


def read_staged_build_report(path: Path) -> Result[StagedBuildReport, ServiceError]:
    """`.regolith/build/build_report.json` as a `StagedBuildReport`. A
    plain (non-staged) `BuildReport` JSON is wrapped so callers always
    see the staged shape (`iterations=1`, no realized inputs) -- one
    return type for both `build` and `build --release` outputs."""
    text = _read_text(path)
    if text.is_err:
        return Err(text.danger_err)
    raw = text.danger_ok
    try:
        return Ok(StagedBuildReport.model_validate_json(raw))
    except ValidationError:
        pass
    try:
        final = BuildReport.model_validate_json(raw)
    except ValidationError as exc:
        _log.warning("reports: cannot parse build report %s: %s", path, exc)
        return Err(
            ServiceError(
                kind="parse_error",
                message=f"cannot parse build report {path}",
                detail=str(exc),
            )
        )
    return Ok(StagedBuildReport(final=final, iterations=1))


def read_lockfile(path: Path) -> Result[Lockfile, ServiceError]:
    """`.regolith/build/regolith.lock` via regolith's own text parser
    (`regolith.orchestrator.lockfile.parse`) -- never a local re-parse
    of the lockfile grammar."""
    text = _read_text(path)
    if text.is_err:
        return Err(text.danger_err)
    result = parse_lockfile(text.danger_ok)
    if result.is_err:
        _log.warning("reports: cannot parse lockfile %s: %s", path, result.danger_err)
        return Err(
            ServiceError(
                kind="parse_error",
                message=f"cannot parse lockfile {path}",
                detail=str(result.danger_err),
            )
        )
    return Ok(result.danger_ok)


def read_calc_book(path: Path) -> Result[CalcBook, ServiceError]:
    """`dist/calc/calc_book.json` -> `CalcBook` (sheets + audit index)."""
    text = _read_text(path)
    if text.is_err:
        return Err(text.danger_err)
    try:
        return Ok(CalcBook.model_validate_json(text.danger_ok))
    except ValidationError as exc:
        _log.warning("reports: cannot parse calc book %s: %s", path, exc)
        return Err(
            ServiceError(
                kind="parse_error",
                message=f"cannot parse calc book {path}",
                detail=str(exc),
            )
        )


def read_audit_index(path: Path) -> Result[AuditIndex, ServiceError]:
    """`dist/calc/audit_index.json` -> `AuditIndex` directly (cheaper
    than loading the full calc book when only the summary/rows are
    needed -- the audit-index API route)."""
    text = _read_text(path)
    if text.is_err:
        return Err(text.danger_err)
    try:
        return Ok(AuditIndex.model_validate_json(text.danger_ok))
    except ValidationError as exc:
        _log.warning("reports: cannot parse audit index %s: %s", path, exc)
        return Err(
            ServiceError(
                kind="parse_error",
                message=f"cannot parse audit index {path}",
                detail=str(exc),
            )
        )


class AcceptedDeviation(BaseModel):
    """One row of `dist/acceptance_ledger.json`'s `accepted_deviations`
    array (WOG1-F3 below) -- field-for-field what
    `regolith.orchestrator.acceptance.acceptance_ledger_bytes` writes."""

    model_config = ConfigDict(frozen=True)

    target: str
    scope: str | None = None
    basis: str
    evidence: str | None = None
    evidence_digest: str | None = None
    kind: str
    accepted: list[str] = []
    match_set: list[str] = []
    expires: str | None = None


class AcceptanceLedgerSummary(BaseModel):
    """WOG1-F3 marked-provisional bridge: the ON-DISK
    `acceptance_ledger.json` (written by
    `acceptance.acceptance_ledger_bytes`) is a DIFFERENT shape than the
    in-memory `regolith.orchestrator.acceptance.AcceptanceOutcome`
    model it is rendered from (no `accepted_hashes` field on disk, and
    `accepted_deviations` replaces `deviations`) -- there is no
    regolith model that round-trips this file directly, so
    `AcceptanceOutcome.model_validate_json` fails against it. This is a
    graphite-local shape mirroring exactly what ships to disk, escalated
    to the lithos coordinator as a gap (a `LedgerDocument` model in
    `regolith.orchestrator.acceptance` would close it)."""

    model_config = ConfigDict(frozen=True)

    accepted_deviations: tuple[AcceptedDeviation, ...] = ()
    cli_accepts_used: tuple[str, ...] = ()
    refusals: tuple[str, ...] = ()
    errors: tuple[str, ...] = ()


def read_acceptance_ledger(path: Path) -> Result[AcceptanceLedgerSummary, ServiceError]:
    """`dist/acceptance_ledger.json` -> `AcceptanceLedgerSummary` (WOG1-F3:
    the on-disk shape has no matching regolith model to validate
    against directly, see the docstring above)."""
    text = _read_text(path)
    if text.is_err:
        return Err(text.danger_err)
    try:
        return Ok(AcceptanceLedgerSummary.model_validate_json(text.danger_ok))
    except ValidationError as exc:
        _log.warning("reports: cannot parse acceptance ledger %s: %s", path, exc)
        return Err(
            ServiceError(
                kind="parse_error",
                message=f"cannot parse acceptance ledger {path}",
                detail=str(exc),
            )
        )


class ManifestSummary(BaseModel):
    """WOG1-F2 marked-provisional bridge: the ship package
    `manifest.json` shape trimmed to what the UI needs, pending a real
    regolith model (no dedicated one exists in the public surface --
    the ship backend assembles this dict ad hoc). Extra keys in the
    real file are read but not exposed here; `raw` carries the full
    parsed dict for a UI "raw JSON toggle" (04.1 detail-view floor)."""

    model_config = ConfigDict(frozen=True)

    signed: bool
    raw: dict[str, object]


def read_manifest(path: Path) -> Result[ManifestSummary, ServiceError]:
    """`dist/manifest.json` -> `ManifestSummary` (WOG1-F2)."""
    text = _read_text(path)
    if text.is_err:
        return Err(text.danger_err)
    try:
        raw = json.loads(text.danger_ok)
    except json.JSONDecodeError as exc:
        _log.warning("reports: cannot parse manifest %s: %s", path, exc)
        return Err(
            ServiceError(
                kind="parse_error",
                message=f"cannot parse manifest {path}",
                detail=str(exc),
            )
        )
    signed = bool(raw.get("signature")) if isinstance(raw, dict) else False
    return Ok(ManifestSummary(signed=signed, raw=raw if isinstance(raw, dict) else {}))
