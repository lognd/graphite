"""`graphite.service.artifact_index`: the typed index that replaces
WO-G9's deleted hardcoded family list."""

from __future__ import annotations

from pathlib import Path

from graphite.service.artifact_index import load_index


def test_load_index_over_mainboard_fixture(mainboard_mx: Path) -> None:
    rows = load_index(mainboard_mx / "dist")
    families = {r.family for r in rows}
    assert families == {"boards", "harness"}
    assert all(r.content_hash.startswith("sha256:") for r in rows)
    # every row's content hash matches the bytes actually on disk (WO-G1
    # security posture: the hash the frontend fetches by must be real).
    for r in rows:
        assert (mainboard_mx / "dist" / r.relpath).is_file()


def test_load_index_silkscreen_layer_is_gerber_viewer(mainboard_mx: Path) -> None:
    rows = load_index(mainboard_mx / "dist")
    silk = [r for r in rows if "Silkscreen" in r.relpath]
    assert silk, "fixture must ship at least one silkscreen layer"
    assert all(r.viewer == "gerber" for r in silk)


def test_load_index_harness_honest_absence_carried_through(mainboard_mx: Path) -> None:
    rows = load_index(mainboard_mx / "dist")
    signals = next(r for r in rows if r.relpath == "harness/expected_signals.json")
    assert signals.viewer == "json"
    body = (mainboard_mx / "dist" / signals.relpath).read_text()
    assert "no expected-signal record was authored" in body


def test_load_index_over_timber_pavilion_no_boards_no_harness(
    timber_pavilion: Path,
) -> None:
    rows = load_index(timber_pavilion / "dist")
    families = {r.family for r in rows}
    assert "boards" not in families
    assert "harness" not in families
    assert "calc" in families


def test_load_index_falls_back_when_no_index_file(tmp_path: Path) -> None:
    dist = tmp_path / "dist"
    dist.mkdir()
    (dist / "widget.txt").write_text("hello")
    rows = load_index(dist)
    assert len(rows) == 1
    assert rows[0].viewer == "binary"
    assert rows[0].synthesized is True


def test_load_index_empty_dist_is_empty(tmp_path: Path) -> None:
    assert load_index(tmp_path / "dist") == ()


def test_load_index_row_dropped_when_relpath_missing_on_disk(
    mainboard_mx: Path,
) -> None:
    dist = mainboard_mx / "dist"
    (dist / "boards" / "board_status.json").unlink()
    rows = load_index(dist)
    assert not any(r.relpath == "boards/board_status.json" for r in rows)
