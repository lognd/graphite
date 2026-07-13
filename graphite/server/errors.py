"""Typed error responses at the API edge (CLAUDE.md house rule: errors
are values in the service layer, typed errors at the boundary). Every
route converts a `Result.Err(ServiceError)` through `raise_for_error`
into an `HTTPException` carrying the SAME `ServiceError` JSON body --
one error shape for the whole API, never a bare FastAPI default-500
string."""

from __future__ import annotations

from typing import NoReturn

from fastapi import HTTPException

from graphite.service.errors import ErrorKind, ServiceError

_STATUS_BY_KIND: dict[ErrorKind, int] = {
    "not_found": 404,
    "invalid_path": 400,
    "invalid_input": 422,
    "parse_error": 502,  # regolith produced data graphite could not parse
    "cli_failed": 502,
    "cli_not_found": 503,
    "io_error": 500,
}


def raise_for_error(error: ServiceError) -> NoReturn:
    """Raise the one `HTTPException` shape for a `ServiceError`, status
    chosen by `error.kind` (the closed mapping above -- add a kind
    there, never inline a status code at a call site)."""
    status = _STATUS_BY_KIND.get(error.kind, 500)
    raise HTTPException(status_code=status, detail=error.model_dump())
