"""`graphite.service.reports`: report readers parsed with regolith's
own model classes, against the committed fixture project."""

from __future__ import annotations

import json
from pathlib import Path

from graphite.service.reports import (
    read_acceptance_ledger,
    read_audit_index,
    read_calc_book,
    read_gate_summary,
    read_lockfile,
    read_manifest,
    read_staged_build_report,
)


def test_read_staged_build_report(timber_pavilion: Path) -> None:
    result = read_staged_build_report(
        timber_pavilion / ".regolith" / "build" / "build_report.json"
    )
    assert result.is_ok
    report = result.danger_ok
    assert report.final.ok is True
    assert report.final.release_ok is True


def test_read_staged_build_report_not_found(tmp_path: Path) -> None:
    result = read_staged_build_report(tmp_path / "missing.json")
    assert result.is_err
    assert result.danger_err.kind == "not_found"


# frob:tests graphite/service/reports.py::read_staged_build_report
# frob:ticket T-0020
def test_read_staged_build_report_wraps_a_plain_build_report(
    timber_pavilion: Path, tmp_path: Path
) -> None:
    # The "final" sub-object of the fixture's staged report is itself a
    # valid plain BuildReport -- exercises the StagedBuildReport-fails/
    # BuildReport-succeeds fallback branch (module docstring).
    staged = json.loads(
        (timber_pavilion / ".regolith" / "build" / "build_report.json").read_text()
    )
    plain_path = tmp_path / "plain_build_report.json"
    plain_path.write_text(json.dumps(staged["final"]))
    result = read_staged_build_report(plain_path)
    assert result.is_ok
    assert result.danger_ok.iterations == 1
    assert result.danger_ok.final.ok is True


# frob:tests graphite/service/reports.py::read_staged_build_report
# frob:ticket T-0020
def test_read_staged_build_report_parse_error(tmp_path: Path) -> None:
    bad = tmp_path / "build_report.json"
    bad.write_text('{"not": "a build report"}')
    result = read_staged_build_report(bad)
    assert result.is_err
    assert result.danger_err.kind == "parse_error"


def test_read_lockfile(timber_pavilion: Path) -> None:
    result = read_lockfile(timber_pavilion / ".regolith" / "build" / "regolith.lock")
    assert result.is_ok
    assert len(result.danger_ok.sections) == 2


def test_read_lockfile_parse_error(tmp_path: Path) -> None:
    bad = tmp_path / "regolith.lock"
    bad.write_text("not a lockfile at all\n")
    result = read_lockfile(bad)
    assert result.is_err
    assert result.danger_err.kind == "parse_error"


def test_read_calc_book(timber_pavilion: Path) -> None:
    result = read_calc_book(timber_pavilion / "dist" / "calc" / "calc_book.json")
    assert result.is_ok
    assert len(result.danger_ok.sheets) == 6


# frob:tests graphite/service/reports.py::read_calc_book
# frob:ticket T-0020
def test_read_calc_book_not_found(tmp_path: Path) -> None:
    result = read_calc_book(tmp_path / "missing.json")
    assert result.is_err
    assert result.danger_err.kind == "not_found"


# frob:tests graphite/service/reports.py::read_calc_book
# frob:ticket T-0020
def test_read_calc_book_parse_error(tmp_path: Path) -> None:
    bad = tmp_path / "calc_book.json"
    bad.write_text("not json at all")
    result = read_calc_book(bad)
    assert result.is_err
    assert result.danger_err.kind == "parse_error"


def test_read_audit_index(timber_pavilion: Path) -> None:
    result = read_audit_index(timber_pavilion / "dist" / "calc" / "audit_index.json")
    assert result.is_ok
    summary = result.danger_ok.summary
    assert summary.obligations == 10
    assert summary.balanced()


# frob:tests graphite/service/reports.py::read_audit_index
# frob:ticket T-0020
def test_read_audit_index_not_found(tmp_path: Path) -> None:
    result = read_audit_index(tmp_path / "missing.json")
    assert result.is_err
    assert result.danger_err.kind == "not_found"


# frob:tests graphite/service/reports.py::read_audit_index
# frob:ticket T-0020
def test_read_audit_index_parse_error(tmp_path: Path) -> None:
    bad = tmp_path / "audit_index.json"
    bad.write_text("not json at all")
    result = read_audit_index(bad)
    assert result.is_err
    assert result.danger_err.kind == "parse_error"


def test_read_acceptance_ledger(timber_pavilion: Path) -> None:
    result = read_acceptance_ledger(timber_pavilion / "dist" / "acceptance_ledger.json")
    assert result.is_ok
    assert len(result.danger_ok.accepted_deviations) == 3


# frob:tests graphite/service/reports.py::read_acceptance_ledger
# frob:ticket T-0020
def test_read_acceptance_ledger_not_found(tmp_path: Path) -> None:
    result = read_acceptance_ledger(tmp_path / "missing.json")
    assert result.is_err
    assert result.danger_err.kind == "not_found"


# frob:tests graphite/service/reports.py::read_acceptance_ledger
# frob:ticket T-0020
def test_read_acceptance_ledger_parse_error(tmp_path: Path) -> None:
    bad = tmp_path / "acceptance_ledger.json"
    bad.write_text("not json at all")
    result = read_acceptance_ledger(bad)
    assert result.is_err
    assert result.danger_err.kind == "parse_error"


def test_read_manifest(timber_pavilion: Path) -> None:
    result = read_manifest(timber_pavilion / "dist" / "manifest.json")
    assert result.is_ok
    assert result.danger_ok.signed is False
    assert "index" in result.danger_ok.raw or result.danger_ok.raw


# frob:tests graphite/service/reports.py::read_manifest
# frob:ticket T-0020
def test_read_manifest_not_found(tmp_path: Path) -> None:
    result = read_manifest(tmp_path / "missing.json")
    assert result.is_err
    assert result.danger_err.kind == "not_found"


# frob:tests graphite/service/reports.py::read_manifest
# frob:ticket T-0020
def test_read_manifest_parse_error(tmp_path: Path) -> None:
    bad = tmp_path / "manifest.json"
    bad.write_text("not json at all")
    result = read_manifest(bad)
    assert result.is_err
    assert result.danger_err.kind == "parse_error"


# frob:tests graphite/service/reports.py::read_manifest
# frob:ticket T-0020
def test_read_manifest_non_dict_json_is_honest_empty(tmp_path: Path) -> None:
    # Valid JSON that is not an object: exercises the isinstance(raw, dict)
    # False branches (signed/design_hash/raw all fall back honestly).
    odd = tmp_path / "manifest.json"
    odd.write_text("[1, 2, 3]")
    result = read_manifest(odd)
    assert result.is_ok
    assert result.danger_ok.signed is False
    assert result.danger_ok.design_hash is None
    assert result.danger_ok.raw == {}


# frob:tests graphite/service/reports.py::read_gate_summary
def test_read_gate_summary(timber_pavilion: Path) -> None:
    result = read_gate_summary(timber_pavilion / "dist" / "gate_summary.json")
    assert result.is_ok
    summary = result.danger_ok
    assert summary.tier == "RELEASE"
    assert summary.release_ok is True
    assert summary.counts.accepted_deviation == 4


# frob:tests graphite/service/reports.py::read_gate_summary
# frob:ticket T-0020
def test_read_gate_summary_not_found(tmp_path: Path) -> None:
    result = read_gate_summary(tmp_path / "missing.json")
    assert result.is_err
    assert result.danger_err.kind == "not_found"


# frob:tests graphite/service/reports.py::read_gate_summary
# frob:ticket T-0020
def test_read_gate_summary_parse_error(tmp_path: Path) -> None:
    bad = tmp_path / "gate_summary.json"
    bad.write_text("not json at all")
    result = read_gate_summary(bad)
    assert result.is_err
    assert result.danger_err.kind == "parse_error"
