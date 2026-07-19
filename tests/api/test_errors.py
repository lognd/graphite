"""`graphite.server.errors`: the ONE `HTTPException` shape for a
`ServiceError`, status chosen by the closed kind mapping."""

from __future__ import annotations

import pytest
from fastapi import HTTPException

from graphite.server.errors import raise_for_error
from graphite.service.errors import ErrorKind, ServiceError

_KIND_TO_STATUS: dict[ErrorKind, int] = {
    "not_found": 404,
    "invalid_path": 400,
    "invalid_input": 422,
    "parse_error": 502,
    "cli_failed": 502,
    "cli_not_found": 503,
    "io_error": 500,
}


# frob:tests graphite/server/errors.py::raise_for_error kind="unit"
def test_raise_for_error_maps_every_kind_to_its_status() -> None:
    for kind, status in _KIND_TO_STATUS.items():
        error = ServiceError(kind=kind, message="boom")
        with pytest.raises(HTTPException) as exc_info:
            raise_for_error(error)
        assert exc_info.value.status_code == status
        assert exc_info.value.detail == error.model_dump()


def test_raise_for_error_unknown_kind_defaults_to_500() -> None:
    error = ServiceError.model_construct(kind="not_a_real_kind", message="boom")
    with pytest.raises(HTTPException) as exc_info:
        raise_for_error(error)
    assert exc_info.value.status_code == 500
