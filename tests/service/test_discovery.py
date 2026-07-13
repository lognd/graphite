"""`graphite.service.discovery`: project/fleet discovery."""

from __future__ import annotations

from pathlib import Path

from graphite.service.discovery import project_info, scan_projects


def test_project_info_reads_manifest_identity(timber_pavilion: Path) -> None:
    result = project_info(timber_pavilion)
    assert result.is_ok
    info = result.danger_ok
    assert info.name == "examples.timber_pavilion"
    assert info.version == "0.1.0"
    assert info.has_build_report
    assert info.has_lockfile
    assert info.has_dist


def test_project_info_not_found_without_manifest(tmp_path: Path) -> None:
    result = project_info(tmp_path)
    assert result.is_err
    assert result.danger_err.kind == "not_found"


def test_project_info_parse_error_on_malformed_manifest(tmp_path: Path) -> None:
    (tmp_path / "magnetite.toml").write_text("this is [ not toml")
    result = project_info(tmp_path)
    assert result.is_err
    assert result.danger_err.kind == "parse_error"


def test_scan_projects_finds_fixture(fixture_scan_root: Path) -> None:
    projects = scan_projects(fixture_scan_root)
    assert len(projects) == 1
    assert projects[0].name == "examples.timber_pavilion"


def test_scan_projects_empty_for_missing_root(tmp_path: Path) -> None:
    assert scan_projects(tmp_path / "does-not-exist") == ()


def test_scan_projects_skips_bad_neighbor(fixture_scan_root: Path) -> None:
    bad = fixture_scan_root / "bad_project"
    bad.mkdir()
    (bad / "magnetite.toml").write_text("[ not toml at all")
    projects = scan_projects(fixture_scan_root)
    assert len(projects) == 1  # the bad neighbor is skipped, not fatal
