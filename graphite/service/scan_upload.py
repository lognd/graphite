"""Scan-trace studio substrate (WO-G11 deliverable 1, lithos D259/D261):
store an uploaded scan image under the project's OWN source tree at
`traced/scans/<name>.<ext>` and return its blake3 hash -- the scan is
pinned source-adjacent data from the first second it exists, matching
the blake3-content-addressing convention `regolith.backends.ship`
already uses (D259's "the compiler cannot tell whether a file was
written by graphite, by hand, or by a vendor" structural test: a
scan pinned by content hash is exactly that kind of ordinary source
file).

This module ONLY writes the scan bytes. It does not write any `.rgp`
file, `.hema` snippet, or trigger a build -- the write seam for the
traced-profile source artifact itself is WO-G12's (D253: graphite is
a source EMITTER for NEW files, never a runtime overrider; the scan
upload is the one write this WO owns, and it writes brand-new,
never-before-existing bytes under a fixed subtree)."""

from __future__ import annotations

import re
from pathlib import Path

import blake3
from pydantic import BaseModel, ConfigDict
from typani.result import Err, Ok, Result

from graphite.logging_setup import get_logger
from graphite.service.errors import ServiceError

_log = get_logger(__name__)

# Flatbed scans and photos only -- the two capture kinds the recon names
# (sec. 7c `capture_kind`); anything else is refused rather than silently
# accepted as an unknown image format the studio cannot honestly render.
_ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".tif", ".tiff"}

# A conservative safe-name pattern: the uploaded scan's display name
# becomes part of a filesystem path, so it is validated the same way
# `project_root_path` refuses arbitrary paths elsewhere in this
# codebase -- no `..`, no separators, no leading dot.
_SAFE_NAME = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]*$")


class ScanEntry(BaseModel):
    """One stored scan: its blake3 content hash (the pinned identity a
    later `.rgp`'s `[provenance] scan` block cites), its path relative
    to the project root, and its byte size."""

    model_config = ConfigDict(frozen=True)

    content_hash: str  # "blake3:<hex>"
    relpath: str
    size: int


def _hash_bytes(data: bytes) -> str:
    return f"blake3:{blake3.blake3(data).hexdigest()}"


def save_scan(
    project_root: Path, name: str, extension: str, data: bytes
) -> Result[ScanEntry, ServiceError]:
    """Write `data` to `traced/scans/<name><extension>` under
    `project_root`, creating the directory if needed, and return the
    stored entry with its blake3 hash. Refuses: an unsafe name, a
    disallowed extension, or empty bytes -- each a `invalid_input`
    `ServiceError`, never a silent write of garbage."""
    if not _SAFE_NAME.match(name):
        _log.warning("scan_upload: refused unsafe scan name %r", name)
        return Err(
            ServiceError(
                kind="invalid_input",
                message=f"scan name {name!r} must be alphanumeric/-/_ only",
            )
        )
    ext = extension.lower()
    if not ext.startswith("."):
        ext = f".{ext}"
    if ext not in _ALLOWED_EXTENSIONS:
        _log.warning("scan_upload: refused extension %r for scan %r", ext, name)
        return Err(
            ServiceError(
                kind="invalid_input",
                message=f"scan extension {ext!r} is not one of {sorted(_ALLOWED_EXTENSIONS)}",
            )
        )
    if len(data) == 0:
        _log.warning("scan_upload: refused empty upload for scan %r", name)
        return Err(
            ServiceError(kind="invalid_input", message="uploaded scan is empty")
        )

    scans_dir = project_root / "traced" / "scans"
    scans_dir.mkdir(parents=True, exist_ok=True)
    dest = scans_dir / f"{name}{ext}"
    dest.write_bytes(data)

    content_hash = _hash_bytes(data)
    entry = ScanEntry(
        content_hash=content_hash,
        relpath=str(dest.relative_to(project_root)),
        size=len(data),
    )
    _log.info(
        "scan_upload: stored scan %s (%d bytes, %s)",
        entry.relpath,
        entry.size,
        entry.content_hash,
    )
    return Ok(entry)
