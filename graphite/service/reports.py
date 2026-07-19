"""The ONE regolith-report-reading module: build report, lockfile, calc
book, audit index, and acceptance ledger, all parsed WITH regolith's
own wheel model classes (never re-declared -- 04.2 dedup law / WO-G1
hard rule). Every reader returns `Result[Model, ServiceError]`.

Import paths used here (WO-159 companion, T-0021, AD-44):
`StagedBuildReport`, `BuildReport`, and `Lockfile`/`parse()` now come
from `regolith.surface` -- the ONE sanctioned import surface for
external UIs (lithos charter
`docs/spec/toolchain/44-boundary-charter.md` sec. 4) -- never a direct
`regolith.orchestrator.*` import. `regolith.backends.calc.CalcBook`/
`AuditIndex` are NOT yet in the facade's sanctioned set (WO-159
non-goals: no new read capability was added by that WO), so they
remain a direct import here pending a reviewed facade-addition
ticket -- named explicitly (`frob:waive FI-BACKENDS` below, with
reason) rather than silently routed around the new forbidden-import
policy.

  regolith.surface.StagedBuildReport / BuildReport
  regolith.surface.Lockfile / parse_lockfile
  regolith.backends.calc.CalcBook / AuditIndex (not yet in surface)

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

from regolith.surface import AuditIndex, CalcBook
from regolith.surface import BuildReport, Lockfile, StagedBuildReport
from regolith.surface import parse_lockfile as parse_lockfile
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


# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
# frob:waive TEST005 reason="46.7% branch cov as of 2026-07-18; T-0020 backfill"
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


# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
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


# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
# frob:waive TEST005 reason="55.6% branch cov as of 2026-07-18; T-0020 backfill"
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


# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
# frob:waive TEST005 reason="measured 40.0% branch on 2026-07-19 after the surface-facade migration touched this file; backfill T-0020"
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


# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
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


# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
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


# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
# frob:waive TEST005 reason="55.6% branch cov as of 2026-07-18; T-0020 backfill"
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


# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
class ManifestSummary(BaseModel):
    """WOG1-F2 marked-provisional bridge: the ship package
    `manifest.json` shape trimmed to what the UI needs, pending a real
    regolith model (no dedicated one exists in the public surface --
    the ship backend assembles this dict ad hoc). Extra keys in the
    real file are read but not exposed here; `raw` carries the full
    parsed dict for a UI "raw JSON toggle" (04.1 detail-view floor)."""

    model_config = ConfigDict(frozen=True)

    signed: bool
    design_hash: str | None = None
    raw: dict[str, object]


# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
# frob:waive TEST005 reason="measured 57.1% branch on 2026-07-19 after the surface-facade migration touched this file; backfill T-0020"
def read_manifest(path: Path) -> Result[ManifestSummary, ServiceError]:
    """`dist/manifest.json` -> `ManifestSummary` (WOG1-F2). `design_hash`
    is lifted out of `raw` for the TitleBlock's identity element (03
    sec. 3.1) -- still read verbatim, never recomputed."""
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
    design_hash = raw.get("design_hash") if isinstance(raw, dict) else None
    return Ok(
        ManifestSummary(
            signed=signed,
            design_hash=design_hash if isinstance(design_hash, str) else None,
            raw=raw if isinstance(raw, dict) else {},
        )
    )


# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
class GateCounts(BaseModel):
    """`dist/gate_summary.json`'s `counts` object verbatim (WOG3-F1
    marked-provisional bridge, same posture as `ManifestSummary`/
    `AcceptanceLedgerSummary`: no dedicated regolith model for this
    on-disk shape exists yet in the public surface)."""

    model_config = ConfigDict(frozen=True)

    violated: int
    indeterminate: int
    below_trust_floor: int
    accepted_deviation: int
    ledger_blocked: bool


# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
class GateSummary(BaseModel):
    """`dist/gate_summary.json` -> the release-gate summary panel (04.1
    project-view release-gate deliverable): tier + ok + release_ok +
    per-kind counts, read verbatim, never recomputed (charter 3.2)."""

    model_config = ConfigDict(frozen=True)

    tier: str
    ok: bool
    release_ok: bool
    counts: GateCounts


# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
# frob:waive TEST005 reason="55.6% branch cov as of 2026-07-18; T-0020 backfill"
def read_gate_summary(path: Path) -> Result[GateSummary, ServiceError]:
    """`dist/gate_summary.json` -> `GateSummary` (WOG3-F1)."""
    text = _read_text(path)
    if text.is_err:
        return Err(text.danger_err)
    try:
        return Ok(GateSummary.model_validate_json(text.danger_ok))
    except ValidationError as exc:
        _log.warning("reports: cannot parse gate summary %s: %s", path, exc)
        return Err(
            ServiceError(
                kind="parse_error",
                message=f"cannot parse gate summary {path}",
                detail=str(exc),
            )
        )
