"""`create_app()`: the one ASGI app, all `/api` routers mounted. Import
this module to generate `openapi.json` (`scripts/gen_openapi.py`) --
importing it must never require a running server or a real lithos
project on disk (route handlers only touch disk when actually called)."""

from __future__ import annotations

from fastapi import FastAPI

from graphite.logging_setup import get_logger
from graphite.server.routes import (
    artifacts,
    build,
    calc,
    config,
    doctor,
    health,
    obligations,
    projects,
    runs,
    settings,
)

_log = get_logger(__name__)

API_TITLE = "graphite backend API"
API_VERSION = "1.0.0"


def create_app() -> FastAPI:
    """Build the FastAPI app: every router under `/api`, CORS left OFF
    (localhost-only, single-origin -- charter sec. 3.1, no cross-origin
    caller is ever legitimate)."""
    app = FastAPI(title=API_TITLE, version=API_VERSION)
    for router in (
        projects.router,
        obligations.router,
        calc.router,
        build.router,
        artifacts.router,
        runs.router,
        config.router,
        config.schema_router,
        doctor.router,
        health.router,
        settings.router,
    ):
        app.include_router(router)

    @app.get("/api/ping", tags=["meta"])
    def ping() -> dict[str, str]:
        """Liveness probe (not a lithos health report -- see
        `/api/projects/{project}/health` for that)."""
        return {"status": "ok"}

    _log.info("server: app assembled, %d route(s)", len(app.routes))
    return app
