"""`/api/projects/{project}/artifacts`: list + content-hash fetch.
Security posture (WO-G1 hard rule): fetch takes ONLY a content hash
that must already appear in this project's own listing -- never a
client-supplied filesystem path (`graphite.service.artifact_registry`
enforces this structurally, there is no path parameter to sanitize)."""

from __future__ import annotations

from fastapi import APIRouter, Response

from graphite.server.deps import project_root_path
from graphite.server.errors import raise_for_error
from graphite.service.artifact_registry import (
    ArtifactEntry,
    fetch_by_hash,
    list_artifacts,
)

router = APIRouter(prefix="/api/projects", tags=["artifacts"])


@router.get("/{project}/artifacts", response_model=tuple[ArtifactEntry, ...])
def list_project_artifacts(project: str) -> tuple[ArtifactEntry, ...]:
    """Every artifact under the project's `dist/` (GLB/SVG/PDF/STEP/
    JSON alike), each entry naming its content hash -- the only valid
    fetch key (04.1 "ANY GRAPHIC" floor: content-hash caption)."""
    root = project_root_path(project)
    return list_artifacts(root / "dist")


@router.get("/{project}/artifacts/{content_hash}")
def fetch_project_artifact(project: str, content_hash: str) -> Response:
    """Raw bytes for one artifact, looked up by content hash ONLY --
    `content_hash` must equal an entry this project's own listing
    produced; anything else is a 404, never a filesystem read of an
    arbitrary path."""
    root = project_root_path(project)
    result = fetch_by_hash(root / "dist", content_hash)
    if result.is_err:
        raise_for_error(result.danger_err)
    body, content_type = result.danger_ok
    return Response(content=body, media_type=content_type)
