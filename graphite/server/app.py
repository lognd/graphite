"""`create_app()`: the one ASGI app, all `/api` routers mounted. Import
this module to generate `openapi.json` (`scripts/gen_openapi.py`) --
importing it must never require a running server or a real lithos
project on disk (route handlers only touch disk when actually called)."""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException
from starlette.types import Scope
from starlette.responses import Response

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
    scans,
    settings,
)

_log = get_logger(__name__)

# frob:doc docs/spec/02-architecture.md#11-server-app-dependencies-and-error-mapping
API_TITLE = "graphite backend API"
# frob:doc docs/spec/02-architecture.md#11-server-app-dependencies-and-error-mapping
API_VERSION = "1.0.0"

# The vite build output (frontend/vite.config.ts outDir) bundled into the
# wheel (pyproject [tool.hatch.build.targets.wheel] artifacts) -- WO-G8
# deliverable 6: `graphite serve` serves the full app, no Node required
# at runtime (spec 02.5).
_STATIC_DIR = Path(__file__).parent / "static"


class _SpaStaticFiles(StaticFiles):
    """Static file app with the SPA fallback: any non-API path that does
    not match a real bundled file serves index.html so client-side routes
    (/project/..., /runs, ...) deep-link correctly on a hard reload."""

    async def get_response(self, path: str, scope: Scope) -> Response:
        # frob:doc docs/spec/02-architecture.md#11-server-app-dependencies-and-error-mapping
        try:
            response = await super().get_response(path, scope)
        except HTTPException as exc:
            # starlette's StaticFiles RAISES 404 for missing paths (it
            # does not return a 404 response), so the fallback must catch.
            if exc.status_code == 404 and not path.startswith("api/"):
                _log.debug("static: SPA fallback to index.html for %r", path)
                return await super().get_response("index.html", scope)
            raise
        if response.status_code == 404 and not path.startswith("api/"):
            _log.debug("static: SPA fallback to index.html for %r", path)
            return await super().get_response("index.html", scope)
        return response


# frob:ticket T-0009
def _mount_static_or_note_api_only(app: FastAPI) -> None:
    """Mount the bundled frontend if present, else log API-only mode
    (T-0009: extracted from `create_app` to clear its long-function
    advisory finding -- pure side effect, no behavior change). Mounted
    LAST so every /api route (and /api 404s -- the guard in
    `_SpaStaticFiles` keeps them JSON, never index.html) wins first."""
    if _STATIC_DIR.is_dir():
        app.mount("/", _SpaStaticFiles(directory=_STATIC_DIR, html=True), name="static")
        _log.info("server: serving bundled frontend from %s", _STATIC_DIR)
    else:
        _log.info(
            "server: no bundled frontend at %s (API-only mode -- run "
            "`make build` or install the wheel for the full app)",
            _STATIC_DIR,
        )


# frob:doc docs/spec/02-architecture.md#11-server-app-dependencies-and-error-mapping
# frob:boundary b_server_validate
# frob:ticket T-0009
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
        scans.router,
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

    _mount_static_or_note_api_only(app)

    _log.info("server: app assembled, %d route(s)", len(app.routes))
    return app
