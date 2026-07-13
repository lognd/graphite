"""The ONE ASGI app package (spec 02 sec. 1/4): FastAPI over
`graphite/service/`. Server routes never talk to regolith directly --
every handler calls into `graphite.service`."""

from __future__ import annotations

from graphite.server.app import create_app

__all__ = ["create_app"]
