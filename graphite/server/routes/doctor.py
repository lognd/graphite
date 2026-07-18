"""`/api/projects/{project}/doctor`: `regolith doctor --json` verbatim."""

from __future__ import annotations

from fastapi import APIRouter

from graphite.server.deps import project_root_path
from graphite.server.errors import raise_for_error
from graphite.service.config_cli import doctor

router = APIRouter(prefix="/api/projects", tags=["doctor"])


# frob:doc docs/spec/02-architecture.md#12-api-routes
@router.get("/{project}/doctor", response_model=list[object])
def get_doctor(project: str) -> list[object]:
    """Every registered optional external tool's found/missing status
    (regolith's own report -- graphite renders it verbatim, per the
    read-mostly honesty posture)."""
    result = doctor(project_root_path(project))
    if result.is_err:
        raise_for_error(result.danger_err)
    return result.danger_ok
