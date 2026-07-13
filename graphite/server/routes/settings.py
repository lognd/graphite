"""`/api/settings`: graphite's own settings (default project root, run
verbosity) -- NEVER mixed into `/api/projects/{project}/config`
(regolith config is a different precedence doctrine, D163/D164)."""

from __future__ import annotations

from fastapi import APIRouter

from graphite.server.errors import raise_for_error
from graphite.service.settings import (
    GraphiteSettings,
    get_settings,
    reset_settings,
    set_settings,
)

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=GraphiteSettings)
def read_settings() -> GraphiteSettings:
    """The current graphite settings (recorded defaults on first run)."""
    result = get_settings()
    if result.is_err:
        raise_for_error(result.danger_err)
    return result.danger_ok


@router.put("", response_model=GraphiteSettings)
def write_settings(settings: GraphiteSettings) -> GraphiteSettings:
    """Overwrite the whole settings document."""
    result = set_settings(settings)
    if result.is_err:
        raise_for_error(result.danger_err)
    return result.danger_ok


@router.post("/reset", response_model=GraphiteSettings)
def reset_settings_route() -> GraphiteSettings:
    """Reset graphite's own settings to their recorded defaults."""
    result = reset_settings()
    if result.is_err:
        raise_for_error(result.danger_err)
    return result.danger_ok
