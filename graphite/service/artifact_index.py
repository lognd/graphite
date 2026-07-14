"""The typed artifact index (WO-G9 / lithos D244/AD-41): reads a shipped
project's own `dist/artifact_index.json` -- family, kind, relpath,
declared content hash, size, media type, a closed-vocabulary `viewer`
hint, and source refs -- and re-keys each row to graphite's OWN content
hash (`artifact_registry.build_registry`, WO-G1 security posture) so the
listing stays the single source of truth the fetch-by-hash endpoint
already enforces.

This is the fix for lithos F145 (graphite carried a hardcoded family
list): every route in this repo that lists "what families/files exist
for a project" reads THIS index, never a TypeScript/Python constant.
A project shipped without `artifact_index.json` (pre-WO-130 lithos, or
a non-lithos scan root) still gets a listing -- `synthesize_index`
builds one from the raw `dist/` walk with an honest `viewer=binary` on
every row, so the fallback ladder (frontend) always has something to
render instead of a blank family list.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict

from graphite.logging_setup import get_logger
from graphite.service.artifact_registry import list_artifacts

_log = get_logger(__name__)

#: The closed viewer vocabulary lithos's index publishes (AD-41). Any
#: value graphite has never heard of still round-trips as a string --
#: the frontend fallback ladder's job, not this module's, to refuse it.
Viewer = Literal[
    "svg", "raster", "gerber", "glb", "table", "markdown", "json", "text", "binary"
]

_INDEX_FILENAME = "artifact_index.json"


class ArtifactIndexRow(BaseModel):
    """One file from a project's shipped index, with `content_hash`
    REPLACED by graphite's own sha256 over the same bytes (the only
    hash the fetch-by-hash route accepts -- WO-G1). `declared_hash`
    keeps lithos's own hash for cross-checking/debugging; a mismatch
    is logged, never fatal (the file on disk is what gets served)."""

    model_config = ConfigDict(frozen=True)

    family: str
    kind: str
    relpath: str
    content_hash: str
    declared_hash: str | None = None
    bytes: int
    media_type: str
    viewer: str
    source_refs: tuple[str, ...] = ()
    synthesized: bool = False


def _normalize_declared_hash(raw: str) -> str:
    """lithos ships a bare hex digest; graphite's registry keys on
    `sha256:<hex>` (WO-G1 wire shape) -- normalize so the two compare
    directly instead of desyncing on a prefix."""
    return raw if raw.startswith("sha256:") else f"sha256:{raw}"


def _synthesize_index(dist_root: Path) -> tuple[ArtifactIndexRow, ...]:
    """A best-effort index for a project with no `artifact_index.json`
    (pre-index lithos build, or a non-lithos dist tree): family is the
    top-level directory segment (mirrors lithos's own `family_of`
    convention so a later real index would agree), viewer is always
    `binary` -- an honest floor, not a guess at richness this module
    cannot verify."""
    rows: list[ArtifactIndexRow] = []
    for entry in list_artifacts(dist_root):
        parts = entry.relpath.split("/", 1)
        family = parts[0] if len(parts) > 1 else "root"
        rows.append(
            ArtifactIndexRow(
                family=family,
                kind="file",
                relpath=entry.relpath,
                content_hash=entry.content_hash,
                declared_hash=None,
                bytes=entry.size,
                media_type=entry.content_type,
                viewer="binary",
                source_refs=(),
                synthesized=True,
            )
        )
    _log.info(
        "artifact_index: synthesized %d row(s) for %s (no artifact_index.json)",
        len(rows),
        dist_root,
    )
    return tuple(rows)


def _hash_relpath(dist_root: Path, relpath: str) -> str | None:
    """`sha256:<hex>` for `dist_root/relpath`, or `None` if it is not a
    file under `dist_root` -- hashed per-row (not via a whole-tree
    content-hash registry) so two distinct relpaths with byte-identical
    contents (e.g. a symmetric top/bottom courtyard layer) never collide
    each other out of the listing the way a hash-keyed dict would."""
    candidate = (dist_root / relpath).resolve()
    try:
        candidate.relative_to(dist_root.resolve())
    except ValueError:
        return None
    if not candidate.is_file():
        return None
    digest = hashlib.sha256()
    with candidate.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            digest.update(chunk)
    return f"sha256:{digest.hexdigest()}"


def load_index(dist_root: Path) -> tuple[ArtifactIndexRow, ...]:
    """The project's typed artifact index, relpath-sorted. Reads the
    shipped `artifact_index.json` when present and re-keys every row to
    graphite's own content hash, computed per-relpath (never through a
    hash-collision-prone whole-tree registry, `_hash_relpath`); falls
    back to `_synthesize_index` when the file is absent, unparsable, or
    a row's relpath is not actually on disk (never raises -- a listing
    is best-effort by design, per this module's docstring)."""
    index_path = dist_root / _INDEX_FILENAME
    if not index_path.is_file():
        _log.info("artifact_index: no %s under %s", _INDEX_FILENAME, dist_root)
        return _synthesize_index(dist_root)

    try:
        raw = json.loads(index_path.read_text())
    except (OSError, json.JSONDecodeError) as exc:
        _log.warning("artifact_index: unreadable %s: %s -- falling back", index_path, exc)
        return _synthesize_index(dist_root)

    rows: list[ArtifactIndexRow] = []
    for raw_row in raw.get("rows", []):
        relpath = raw_row.get("relpath")
        real_hash = _hash_relpath(dist_root, relpath) if relpath else None
        if real_hash is None:
            _log.warning(
                "artifact_index: %s lists %r but it is not under %s -- dropped",
                index_path,
                relpath,
                dist_root,
            )
            continue
        declared = raw_row.get("content_hash")
        normalized_declared = _normalize_declared_hash(declared) if declared else None
        if normalized_declared is not None and normalized_declared != real_hash:
            _log.warning(
                "artifact_index: declared hash for %r does not match bytes on disk "
                "(declared %s, actual %s) -- serving actual bytes, hash is informational",
                relpath,
                normalized_declared,
                real_hash,
            )
        rows.append(
            ArtifactIndexRow(
                family=raw_row.get("family", "unknown"),
                kind=raw_row.get("kind", "unknown"),
                relpath=relpath,
                content_hash=real_hash,
                declared_hash=normalized_declared,
                bytes=raw_row.get("bytes", 0),
                media_type=raw_row.get("media_type", "application/octet-stream"),
                viewer=raw_row.get("viewer", "binary"),
                source_refs=tuple(raw_row.get("source_refs") or ()),
                synthesized=False,
            )
        )
    rows.sort(key=lambda r: r.relpath)
    _log.info("artifact_index: loaded %d row(s) from %s", len(rows), index_path)
    return tuple(rows)
