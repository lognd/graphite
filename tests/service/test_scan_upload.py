"""`graphite.service.scan_upload`: scan storage + blake3 pinning
(WO-G11 deliverable 1)."""

from __future__ import annotations

import blake3

from graphite.service.scan_upload import save_scan


def test_save_scan_writes_under_traced_scans_and_hashes(tmp_path):
    data = b"some-scan-bytes"
    result = save_scan(tmp_path, "part_a", ".png", data)
    assert result.is_ok
    entry = result.danger_ok
    assert entry.relpath == "traced/scans/part_a.png"
    assert (tmp_path / "traced" / "scans" / "part_a.png").read_bytes() == data
    assert entry.content_hash == f"blake3:{blake3.blake3(data).hexdigest()}"
    assert entry.size == len(data)


def test_save_scan_normalizes_extension_without_dot(tmp_path):
    result = save_scan(tmp_path, "part_b", "jpg", b"x")
    assert result.is_ok
    assert result.danger_ok.relpath == "traced/scans/part_b.jpg"


def test_save_scan_refuses_disallowed_extension(tmp_path):
    result = save_scan(tmp_path, "part_c", ".exe", b"x")
    assert result.is_err
    assert result.danger_err.kind == "invalid_input"


def test_save_scan_refuses_unsafe_name(tmp_path):
    result = save_scan(tmp_path, "../escape", ".png", b"x")
    assert result.is_err
    assert result.danger_err.kind == "invalid_input"


def test_save_scan_refuses_empty_bytes(tmp_path):
    result = save_scan(tmp_path, "part_d", ".png", b"")
    assert result.is_err
    assert result.danger_err.kind == "invalid_input"
