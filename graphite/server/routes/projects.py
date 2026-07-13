"""`/api/projects`: fleet listing + one project's detail."""

from __future__ import annotations

from fastapi import APIRouter

from graphite.server.deps import list_all_projects, resolve_project
from graphite.service.discovery import ProjectInfo

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("", response_model=tuple[ProjectInfo, ...])
def list_projects() -> tuple[ProjectInfo, ...]:
    """Every project under the server's configured scan root
    (04.1 "ANY TABLE" floor: the frontend adds sort/filter/count over
    this listing -- the route itself stays a plain array, no
    server-side pagination needed at fleet scale)."""
    return list_all_projects()


@router.get("/{project}", response_model=ProjectInfo)
def get_project(project: str) -> ProjectInfo:
    """One project's manifest identity + artifact presence flags."""
    return resolve_project(project)
