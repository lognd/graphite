"""The ONE service-layer error shape (typani `Result` Err payload,
CLAUDE.md house rule: recoverable errors are values). Every
`graphite.service` function that can fail returns
`Result[T, ServiceError]` -- never a bare exception for a
recoverable/user-facing condition (a missing project, a malformed
report, a subprocess that exits non-zero). The FastAPI edge
(`graphite/server/routes/*`) converts `Err(ServiceError)` into a typed
JSON error response (`graphite.server.errors.error_response`);
exceptions here mean a programmer bug, not a recoverable state.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict

# The closed set of error kinds the API edge maps to HTTP status codes
# (`graphite.server.errors._STATUS_BY_KIND`). Keep this the ONE place
# new kinds are added -- never invent a kind string inline elsewhere.
ErrorKind = Literal[
    "not_found",
    "invalid_path",
    "invalid_input",
    "parse_error",
    "cli_failed",
    "cli_not_found",
    "io_error",
]


# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
class ServiceError(BaseModel):
    """A recoverable, JSON-safe error from the service layer."""

    model_config = ConfigDict(frozen=True)

    kind: ErrorKind
    message: str
    detail: str | None = None
