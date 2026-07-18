"""Content-hash artifact serving (WO-G1 security posture): a project's
`dist/` tree is indexed by sha256 of file bytes, and the ONLY way to
fetch a file back is by that hash -- never a client-supplied path. This
is what makes path traversal structurally impossible: there is no
"path" parameter anywhere in the public surface, just a hash lookup
into a registry built from an `os.walk` graphite itself performed.

Builds on `graphite.artifacts` (the existing generic disk-scanning
module from WO-59) rather than re-implementing directory walking --
04.2 dedup law.
"""

from __future__ import annotations

import hashlib
import mimetypes
from pathlib import Path

from pydantic import BaseModel, ConfigDict
from typani.result import Err, Ok, Result

from graphite.logging_setup import get_logger
from graphite.service.errors import ServiceError

_log = get_logger(__name__)


# frob:doc docs/spec/02-architecture.md#10-artifact-registry-and-schema-index
class ArtifactEntry(BaseModel):
    """One indexed file under a project's `dist/`: its content hash,
    a UI-facing relative path (display only, never used to serve),
    size, and guessed MIME type."""

    model_config = ConfigDict(frozen=True)

    content_hash: str  # "sha256:<hex>"
    relpath: str
    size: int
    content_type: str


def _hash_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            digest.update(chunk)
    return f"sha256:{digest.hexdigest()}"


# frob:doc docs/spec/02-architecture.md#10-artifact-registry-and-schema-index
def build_registry(dist_root: Path) -> dict[str, Path]:
    """Every file under `dist_root`, keyed by its `sha256:<hex>` content
    hash (last-write-wins on a hash collision -- collisions of sha256
    over distinct bytes are not a case this registry needs to defend
    against). Empty dict for a missing/non-directory root (fresh
    project, not an error)."""
    if not dist_root.is_dir():
        return {}
    registry: dict[str, Path] = {}
    for path in sorted(dist_root.rglob("*")):
        if path.is_file():
            registry[_hash_file(path)] = path
    _log.info(
        "artifact_registry: indexed %d file(s) under %s", len(registry), dist_root
    )
    return registry


# frob:doc docs/spec/02-architecture.md#10-artifact-registry-and-schema-index
def list_artifacts(dist_root: Path) -> tuple[ArtifactEntry, ...]:
    """Every artifact under `dist_root` as a listing entry (relpath
    display-only; the content hash is the only fetch key)."""
    entries: list[ArtifactEntry] = []
    for content_hash, path in sorted(
        build_registry(dist_root).items(), key=lambda kv: str(kv[1])
    ):
        content_type, _ = mimetypes.guess_type(str(path))
        entries.append(
            ArtifactEntry(
                content_hash=content_hash,
                relpath=str(path.relative_to(dist_root)),
                size=path.stat().st_size,
                content_type=content_type or "application/octet-stream",
            )
        )
    return tuple(entries)


# frob:doc docs/spec/02-architecture.md#10-artifact-registry-and-schema-index
def fetch_by_hash(
    dist_root: Path, content_hash: str
) -> Result[tuple[bytes, str], ServiceError]:
    """The raw bytes + content type for one `content_hash`, or
    `not_found` if it is absent from `dist_root`'s current registry --
    a client can never supply a filesystem path, only a hash that must
    already be present in a listing this same project produced."""
    registry = build_registry(dist_root)
    path = registry.get(content_hash)
    if path is None:
        _log.warning(
            "artifact_registry: refused unknown hash %r under %s",
            content_hash,
            dist_root,
        )
        return Err(
            ServiceError(
                kind="not_found", message=f"no artifact with hash {content_hash}"
            )
        )
    content_type, _ = mimetypes.guess_type(str(path))
    return Ok((path.read_bytes(), content_type or "application/octet-stream"))
