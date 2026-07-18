"""`graphite.service.artifact_registry`: content-hash serving, the
security posture at the heart of WO-G1 (never serve by client path)."""

from __future__ import annotations

from pathlib import Path

from graphite.service.artifact_registry import fetch_by_hash, list_artifacts


# frob:tests graphite/service/artifact_registry.py::build_registry kind="unit"
def test_list_artifacts_over_fixture_dist(timber_pavilion: Path) -> None:
    entries = list_artifacts(timber_pavilion / "dist")
    assert len(entries) > 0
    assert all(e.content_hash.startswith("sha256:") for e in entries)
    # every relpath is a display string, never used to look anything up
    assert any(e.relpath.endswith(".svg") for e in entries)


def test_list_artifacts_empty_for_missing_dist(tmp_path: Path) -> None:
    assert list_artifacts(tmp_path / "dist") == ()


def test_fetch_by_hash_round_trips(timber_pavilion: Path) -> None:
    dist = timber_pavilion / "dist"
    entries = list_artifacts(dist)
    target = next(e for e in entries if e.relpath.endswith(".svg"))
    result = fetch_by_hash(dist, target.content_hash)
    assert result.is_ok
    body, content_type = result.danger_ok
    assert body == (dist / target.relpath).read_bytes()
    assert "svg" in content_type


def test_fetch_by_hash_refuses_unknown_hash(timber_pavilion: Path) -> None:
    result = fetch_by_hash(timber_pavilion / "dist", "sha256:not-a-real-hash")
    assert result.is_err
    assert result.danger_err.kind == "not_found"


def test_fetch_by_hash_cannot_smuggle_a_path(timber_pavilion: Path) -> None:
    """The one security-critical negative test: passing something that
    LOOKS like a path instead of a hash must never read a file (there
    is no path parameter to sanitize -- the lookup table itself is the
    only route to bytes)."""
    result = fetch_by_hash(timber_pavilion / "dist", "../../../../etc/passwd")
    assert result.is_err
    assert result.danger_err.kind == "not_found"
