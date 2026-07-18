"""Shared FastAPI dependencies: resolving a `{project}` path segment to
a project root directory under the server's configured scan root.
`GRAPHITE_SCAN_ROOT` (env var, defaulting to the current working
directory) is the ONE place a graphite server instance is told where
its fleet lives -- `graphite serve --project ROOT` (cli.py) sets it."""

from __future__ import annotations

import os
from pathlib import Path

from fastapi import HTTPException

from graphite.logging_setup import get_logger
from graphite.service.discovery import ProjectInfo, scan_projects

_log = get_logger(__name__)


# frob:doc docs/spec/02-architecture.md#11-server-app-dependencies-and-error-mapping
def scan_root() -> Path:
    """The configured fleet scan root (`GRAPHITE_SCAN_ROOT`, default
    cwd) -- read fresh on every call so tests can monkeypatch the env
    var per-case without app-startup coupling."""
    return Path(os.environ.get("GRAPHITE_SCAN_ROOT", ".")).resolve()


# frob:doc docs/spec/02-architecture.md#11-server-app-dependencies-and-error-mapping
def list_all_projects() -> tuple[ProjectInfo, ...]:
    """Every project under the configured scan root."""
    return scan_projects(scan_root())


# frob:doc docs/spec/02-architecture.md#11-server-app-dependencies-and-error-mapping
def resolve_project(project: str) -> ProjectInfo:
    """`{project}` path segment -> its `ProjectInfo`, 404 when the name
    is not among the scan root's discovered projects (never accepts an
    arbitrary filesystem path here -- the artifact-serving security
    posture applies to project resolution too, not just file fetch)."""
    for info in list_all_projects():
        if info.name == project:
            return info
    _log.warning("deps: unknown project %r under scan root %s", project, scan_root())
    raise HTTPException(
        status_code=404,
        detail={"kind": "not_found", "message": f"unknown project {project!r}"},
    )


# frob:doc docs/spec/02-architecture.md#11-server-app-dependencies-and-error-mapping
def project_root_path(project: str) -> Path:
    """Convenience: `{project}` -> its root `Path` (re-derives via
    `project_info` on the resolved root so a caller does not need two
    separate lookups)."""
    info = resolve_project(project)
    return Path(info.root)
