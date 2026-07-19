"""`regolith config`/`doctor` subprocess wrappers (spec 01 sec. 5: the
CLI's public stdout is the whole contract). Neither command offers
`--json` (verified against `regolith config --help`/`config list
--help`), so this module parses `config`'s ONE stable stdout line
format (`key=value (source=level)`, one line per key) and hands
`doctor --json` (which DOES support `--json`) straight to
`json.loads`.

WOG1-F5 (escalation, placeholder): `regolith config list/where` has no
`--json` flag while `doctor` does -- an inconsistency graphite has to
paper over with a small regex parser instead of a JSON round-trip.
Recorded for the lithos coordinator (a `--json` flag on `config`
mirroring `doctor`'s would remove this module's only text-parsing
code).

`key_defaults()` (WO-G6) is the one read that does NOT shell out --
see `ConfigKeyDefault`'s docstring for why.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict
from typani.result import Err, Ok, Result

from graphite.logging_setup import get_logger
from graphite.service.errors import ServiceError

_log = get_logger(__name__)

_CONFIG_LINE = re.compile(r"^(?P<key>\S+)=(?P<value>.*) \(source=(?P<source>\w+)\)$")


# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
class ConfigEntry(BaseModel):
    """One `regolith config` key: its effective value and the
    where-attribution level that won it (04.1 "ANY FORM/CONFIG FIELD"
    floor: source attribution is mandatory, never omitted)."""

    model_config = ConfigDict(frozen=True)

    key: str
    value: str
    source: str


# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
class ConfigKeyDefault(BaseModel):
    """One registered key's declared default + doc, for the "reset to
    default" affordance (04.1). Neither `regolith config list` nor
    `where` prints the default -- only the CURRENT winning value and
    its source (WOG1-F5's `--json` gap compounds this: there is no
    stable stdout line to parse for "the default" either).

    WOG6-F1 (escalation, placeholder): this reads `regolith.config.
    registered_keys()` directly (a Python import of the installed
    `regolith` wheel), not a CLI subprocess -- the ONE exception to
    this module's "always shell out" rule. It is a read of static,
    compiled-in registry metadata (key/kind/default/doc), never
    project state and never a write, so it does not violate "edits
    write through the real CLI" (that doctrine governs mutation, not
    read-only introspection of a constant table). Recorded for the
    lithos coordinator: a `regolith config list --json` (or a
    `--show-default` flag) would let this module drop the import and
    go through the CLI uniformly like every other read here.
    """

    model_config = ConfigDict(frozen=True)

    key: str
    kind: str
    default: str | int | float | bool
    doc: str


# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
def key_defaults() -> tuple[ConfigKeyDefault, ...]:
    """Every registered key's default/kind/doc (WOG6-F1: read directly
    off `regolith.config.registered_keys()`, see `ConfigKeyDefault`)."""
    from regolith.config import registered_keys

    return tuple(
        ConfigKeyDefault(key=s.key, kind=s.kind, default=s.default, doc=s.doc)
        for s in registered_keys()
    )


def _run(argv: list[str], cwd: Path) -> Result[str, ServiceError]:
    full = [sys.executable, "-m", "regolith.cli", "--color", "never", *argv]
    try:
        completed = subprocess.run(  # noqa: S603
            full, cwd=cwd, capture_output=True, text=True, timeout=30, check=False
        )
    except OSError as exc:
        _log.error("config_cli: cannot launch regolith: %s", exc)
        return Err(
            ServiceError(
                kind="cli_not_found",
                message="cannot launch regolith CLI",
                detail=str(exc),
            )
        )
    if completed.returncode != 0:
        _log.warning(
            "config_cli: %s exited %d: %s", full, completed.returncode, completed.stderr
        )
        return Err(
            ServiceError(
                kind="cli_failed",
                message=f"regolith {' '.join(argv)} exited {completed.returncode}",
                detail=completed.stderr.strip(),
            )
        )
    return Ok(completed.stdout)


# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
def list_config(project_root: Path) -> Result[tuple[ConfigEntry, ...], ServiceError]:
    """Every registered config key (`regolith config list`)."""
    stdout = _run(["config", "list", "--project", str(project_root)], project_root)
    if stdout.is_err:
        return Err(stdout.danger_err)
    entries: list[ConfigEntry] = []
    for line in stdout.danger_ok.splitlines():
        match = _CONFIG_LINE.match(line.strip())
        if match is None:
            continue
        entries.append(ConfigEntry(**match.groupdict()))
    return Ok(tuple(entries))


# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
def get_config(project_root: Path, key: str) -> Result[ConfigEntry, ServiceError]:
    """One key's effective value + winning source (`regolith config where`)."""
    stdout = _run(
        ["config", "where", key, "--project", str(project_root)], project_root
    )
    if stdout.is_err:
        return Err(stdout.danger_err)
    match = _CONFIG_LINE.match(stdout.danger_ok.strip())
    if match is None:
        return Err(
            ServiceError(
                kind="parse_error",
                message=f"cannot parse config where output for {key}",
            )
        )
    return Ok(ConfigEntry(**match.groupdict()))


# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
def set_config(
    project_root: Path, key: str, value: str, level: Literal["global", "local"]
) -> Result[ConfigEntry, ServiceError]:
    """Write one key through the real CLI (`regolith config set`) --
    never a raw file poke, mirroring the CLI's own doctrine."""
    flag = "--global" if level == "global" else "--local"
    stdout = _run(
        ["config", "set", key, value, flag, "--project", str(project_root)],
        project_root,
    )
    if stdout.is_err:
        return Err(stdout.danger_err)
    return get_config(project_root, key)


# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
# frob:waive TEST005 reason="55.6% branch cov as of 2026-07-18; T-0020 backfill"
def doctor(project_root: Path) -> Result[list[object], ServiceError]:
    """`regolith doctor --json` parsed straight as JSON (the one
    regolith surface that already speaks structured data natively)."""
    stdout = _run(["doctor", "--json"], project_root)
    if stdout.is_err:
        return Err(stdout.danger_err)
    try:
        return Ok(json.loads(stdout.danger_ok))
    except json.JSONDecodeError as exc:
        _log.warning("config_cli: cannot parse doctor --json: %s", exc)
        return Err(
            ServiceError(
                kind="parse_error",
                message="cannot parse doctor --json",
                detail=str(exc),
            )
        )
