"""`/api/projects/{project}/config`: read (list/one key) + set, always
with where-attribution (04.1 "ANY FORM/CONFIG FIELD" floor). Plus the
one global, non-project-scoped route: `/api/config/schema` (the
registered-key default/kind/doc table, for "reset to default")."""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Body

from graphite.server.deps import project_root_path
from graphite.server.errors import raise_for_error
from graphite.service.config_cli import (
    ConfigEntry,
    ConfigKeyDefault,
    get_config,
    key_defaults,
    list_config,
    set_config,
)

router = APIRouter(prefix="/api/projects", tags=["config"])
schema_router = APIRouter(tags=["config"])


@schema_router.get("/api/config/schema", response_model=tuple[ConfigKeyDefault, ...])
def get_config_schema() -> tuple[ConfigKeyDefault, ...]:
    """Every registered key's default/kind/doc, global and static (not
    per-project) -- the "reset to default" affordance's data source
    since neither `config list` nor `where` prints a default."""
    return key_defaults()


@router.get("/{project}/config", response_model=tuple[ConfigEntry, ...])
def list_project_config(project: str) -> tuple[ConfigEntry, ...]:
    """Every registered config key with its effective value + source."""
    result = list_config(project_root_path(project))
    if result.is_err:
        raise_for_error(result.danger_err)
    return result.danger_ok


@router.get("/{project}/config/{key}", response_model=ConfigEntry)
def get_project_config(project: str, key: str) -> ConfigEntry:
    """One key's effective value + winning source."""
    result = get_config(project_root_path(project), key)
    if result.is_err:
        raise_for_error(result.danger_err)
    return result.danger_ok


@router.put("/{project}/config/{key}", response_model=ConfigEntry)
def set_project_config(
    project: str,
    key: str,
    value: str = Body(embed=True),
    level: Literal["global", "local"] = Body(embed=True),
) -> ConfigEntry:
    """Write one key through the real `regolith config set` (never a
    raw file poke)."""
    result = set_config(project_root_path(project), key, value, level)
    if result.is_err:
        raise_for_error(result.danger_err)
    return result.danger_ok
