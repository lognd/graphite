"""`graphite.service.reports`: report readers parsed with regolith's
own model classes, against the committed fixture project."""

from __future__ import annotations

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


def test_read_audit_index(timber_pavilion: Path) -> None:
    result = read_audit_index(timber_pavilion / "dist" / "calc" / "audit_index.json")
    assert result.is_ok
    summary = result.danger_ok.summary
    assert summary.obligations == 10
    assert summary.balanced()


def test_read_acceptance_ledger(timber_pavilion: Path) -> None:
    result = read_acceptance_ledger(timber_pavilion / "dist" / "acceptance_ledger.json")
    assert result.is_ok
    assert len(result.danger_ok.accepted_deviations) == 3


def test_read_manifest(timber_pavilion: Path) -> None:
    result = read_manifest(timber_pavilion / "dist" / "manifest.json")
    assert result.is_ok
    assert result.danger_ok.signed is False
    assert "index" in result.danger_ok.raw or result.danger_ok.raw


# frob:tests graphite/service/reports.py::read_gate_summary
def test_read_gate_summary(timber_pavilion: Path) -> None:
    result = read_gate_summary(timber_pavilion / "dist" / "gate_summary.json")
    assert result.is_ok
    summary = result.danger_ok
    assert summary.tier == "RELEASE"
    assert summary.release_ok is True
    assert summary.counts.accepted_deviation == 4
