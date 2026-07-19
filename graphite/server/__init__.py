"""The ONE ASGI app package (spec 02 sec. 1/4): FastAPI over
`graphite/service/`. Server routes never talk to regolith directly --
every handler calls into `graphite.service`."""

from __future__ import annotations

from graphite.server.app import create_app
from graphite.server.deps import (
    list_all_projects,
    project_root_path,
    resolve_project,
    scan_root,
)
from graphite.server.errors import raise_for_error

__all__ = [
    "create_app",
    "list_all_projects",
    "project_root_path",
    "raise_for_error",
    "resolve_project",
    "scan_root",
]
