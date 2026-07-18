"""graphite's OWN settings (theme override lives client-side already,
spec 03.2/app/theme.tsx -- this module is the other two: default
project root, run verbosity), persisted at `~/.graphite/settings.json`
(`GRAPHITE_HOME` env var override, default `~/.graphite`, mirroring
`graphite.service.runs.runs_home`'s `GRAPHITE_RUNS_HOME` pattern).

NEVER mixed into `regolith config` (04.1's form floor still applies --
source attribution is trivial here since there is exactly one level,
but reset-to-default and real validation errors still apply)."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError
from typani.result import Err, Ok, Result

from graphite.logging_setup import get_logger
from graphite.service.errors import ServiceError

_log = get_logger(__name__)

RunVerbosity = Literal["quiet", "normal", "verbose"]

DEFAULT_RUN_VERBOSITY: RunVerbosity = "normal"
DEFAULT_PROJECT_ROOT = ""
# WO-G8 (closes WOG5-F3): run records/logs under GRAPHITE_RUNS_HOME used
# to grow without bound; each new run now prunes history down to this
# many newest FINISHED records (0 = keep everything, the old behavior).
DEFAULT_RUN_HISTORY_LIMIT = 200

_SETTINGS_FILENAME = "settings.json"


# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
class GraphiteSettings(BaseModel):
    """graphite's own preferences: a default project root to land on at
    startup, a run verbosity passthrough for driven CLI invocations, and
    the run-history retention bound (WOG5-F3). Never a regolith config
    key (that precedence ladder is a different doctrine, D163/D164 --
    this is graphite-local UI state)."""

    model_config = ConfigDict(frozen=True)

    default_project_root: str = DEFAULT_PROJECT_ROOT
    run_verbosity: RunVerbosity = DEFAULT_RUN_VERBOSITY
    run_history_limit: int = Field(default=DEFAULT_RUN_HISTORY_LIMIT, ge=0)


# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
def settings_home() -> Path:
    """The configured settings directory (`GRAPHITE_HOME`, default
    `~/.graphite`) -- read fresh on every call, mirroring
    `graphite.service.runs.runs_home`, so tests can monkeypatch the env
    var per-case."""
    return Path(os.environ.get("GRAPHITE_HOME", "~/.graphite")).expanduser()


def _settings_path() -> Path:
    return settings_home() / _SETTINGS_FILENAME


# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
def get_settings() -> Result[GraphiteSettings, ServiceError]:
    """The current settings, or the recorded defaults when no settings
    file has been written yet (first run)."""
    path = _settings_path()
    if not path.exists():
        _log.debug("settings: no file at %s, returning defaults", path)
        return Ok(GraphiteSettings())
    try:
        raw = json.loads(path.read_text())
    except (OSError, json.JSONDecodeError) as exc:
        _log.error("settings: cannot read %s: %s", path, exc)
        return Err(
            ServiceError(
                kind="io_error", message=f"cannot read {path}", detail=str(exc)
            )
        )
    try:
        return Ok(GraphiteSettings(**raw))
    except ValidationError as exc:
        _log.error("settings: invalid settings at %s: %s", path, exc)
        return Err(
            ServiceError(
                kind="invalid_input",
                message=f"invalid settings at {path}",
                detail=str(exc),
            )
        )


# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
def set_settings(settings: GraphiteSettings) -> Result[GraphiteSettings, ServiceError]:
    """Overwrite the whole settings file (the settings shape is small
    enough that a whole-document PUT, not per-key PATCH, is the
    honest surface -- no precedence ladder here to preserve, unlike
    regolith config's four levels)."""
    path = _settings_path()
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(settings.model_dump_json(indent=2) + "\n")
    except OSError as exc:
        _log.error("settings: cannot write %s: %s", path, exc)
        return Err(
            ServiceError(
                kind="io_error", message=f"cannot write {path}", detail=str(exc)
            )
        )
    _log.info("settings: wrote %s", path)
    return Ok(settings)


# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
def reset_settings() -> Result[GraphiteSettings, ServiceError]:
    """Reset to the recorded defaults (04.1's "reset to default" floor,
    graphite's own settings side of it)."""
    return set_settings(GraphiteSettings())
