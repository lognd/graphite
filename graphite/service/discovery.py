"""Project/fleet discovery: every `magnetite.toml` under a scan root is
one graphite-visible project (mirrors `tools/health/fleet.py`'s
`discover_fleet` in lithos -- a plain `rglob`, no regolith library
call exists for this, WOG1-F1 below).

`ProjectInfo` is a graphite-local shape -- NOT a regolith wire model.
It describes a manifest file (name/version parsed from TOML) plus
which report artifacts are present on disk; regolith has no public
model for "a project on this filesystem", so this is not a dedup-law
violation (04.2: a shape absent from regolith's public surface is a
recorded gap, never a re-declaration of one that exists).

WOG1-F1 (escalation, placeholder): there is no regolith library
function for fleet/project discovery -- both lithos's own
`tools/health/fleet.py` and this module independently `rglob` for
`magnetite.toml`. A shared `regolith.magnetite.discovery` helper
would remove this duplication; recorded for the lithos coordinator,
not fixed here (out of WO-G1 scope, which owns graphite only).
"""

from __future__ import annotations

import tomllib
from pathlib import Path

from pydantic import BaseModel, ConfigDict
from typani.result import Err, Ok, Result

from graphite.logging_setup import get_logger
from graphite.service.errors import ServiceError

_log = get_logger(__name__)

# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
MANIFEST_NAME = "magnetite.toml"
# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
BUILD_REPORT_REL = Path(".regolith") / "build" / "build_report.json"
# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
LOCKFILE_REL = Path(".regolith") / "build" / "regolith.lock"
# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
DIST_REL = Path("dist")


# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
class ProjectInfo(BaseModel):
    """One discovered project: its manifest identity plus which report
    artifacts already exist on disk (a fresh project has none of
    them -- that is not an error, just an empty-state signal for the
    UI's companion-audit empty state, 04.1)."""

    model_config = ConfigDict(frozen=True)

    name: str
    version: str
    root: str  # absolute path, string (JSON-safe, stable across platforms)
    manifest_path: str
    has_build_report: bool
    has_lockfile: bool
    has_dist: bool
    build_report_stale: bool = False  # true when a source file is newer
    # than the build report (WOG3 fleet-dashboard "stale-report
    # detection" deliverable) -- False (not "unknown") whenever there
    # is no build report to compare against, since the TitleBlock's
    # honest signal in that case is "missing", not "stale".


def _read_manifest_identity(
    manifest_path: Path,
) -> Result[tuple[str, str], ServiceError]:
    """`[package] name/version` out of one `magnetite.toml` -- the only
    fields graphite needs for a project listing. A malformed manifest is
    a recoverable parse error, never a crash (a fleet scan must survive
    one bad neighbor project)."""
    try:
        data = tomllib.loads(manifest_path.read_text())
    except (OSError, tomllib.TOMLDecodeError) as exc:
        _log.warning("discovery: cannot parse manifest %s: %s", manifest_path, exc)
        return Err(
            ServiceError(
                kind="parse_error",
                message=f"cannot parse manifest {manifest_path}",
                detail=str(exc),
            )
        )
    package = data.get("package", {})
    name = str(package.get("name", manifest_path.parent.name))
    version = str(package.get("version", "0.0.0"))
    return Ok((name, version))


# Directories a build report's own OUTPUT lives under (or that never
# hold design sources): excluded from the "is a source newer than the
# report" scan so a build's own artifacts never mark themselves stale.
# Extension strings are deliberately NOT enumerated here (CLAUDE.md
# tripwire: those live in exactly one place, lithos's
# `crates/regolith-syntax` registry) -- this scan is extension-agnostic
# by design, comparing mtimes over every file outside the known output
# dirs instead of naming `.hema`/`.cupr`/`.fluo`/`.calx` here.
_EXCLUDED_DIR_NAMES = frozenset(
    {".regolith", "dist", ".git", "node_modules", ".venv", "__pycache__"}
)


def _newest_source_mtime(root: Path) -> float | None:
    """The newest mtime among files under `root` that are NOT build
    output (dist/.regolith) or VCS/tooling noise -- None if the project
    has no source files at all (an empty scaffold, not an error)."""
    newest: float | None = None
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if any(part in _EXCLUDED_DIR_NAMES for part in path.relative_to(root).parts):
            continue
        mtime = path.stat().st_mtime
        if newest is None or mtime > newest:
            newest = mtime
    return newest


def _is_build_report_stale(root: Path, build_report_path: Path) -> bool:
    """True when a source file's mtime is newer than the build report's
    own mtime -- the TitleBlock's stale-report flag (WOG3 fleet-
    dashboard deliverable 1). False (never "unknown") when there is no
    build report, since `has_build_report` already carries that signal."""
    if not build_report_path.is_file():
        return False
    report_mtime = build_report_path.stat().st_mtime
    newest_source = _newest_source_mtime(root)
    if newest_source is None:
        return False
    return newest_source > report_mtime


# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
def project_info(root: Path) -> Result[ProjectInfo, ServiceError]:
    """One project's `ProjectInfo`, `root` being the project directory
    (the one holding `magnetite.toml`, NOT the manifest file itself)."""
    manifest_path = root / MANIFEST_NAME
    if not manifest_path.is_file():
        _log.info("discovery: no manifest at %s", manifest_path)
        return Err(
            ServiceError(
                kind="not_found",
                message=f"no {MANIFEST_NAME} at {root}",
            )
        )
    identity = _read_manifest_identity(manifest_path)
    if identity.is_err:
        return Err(identity.danger_err)
    name, version = identity.danger_ok
    resolved_root = root.resolve()
    return Ok(
        ProjectInfo(
            name=name,
            version=version,
            root=str(resolved_root),
            manifest_path=str(manifest_path.resolve()),
            has_build_report=(root / BUILD_REPORT_REL).is_file(),
            has_lockfile=(root / LOCKFILE_REL).is_file(),
            has_dist=(root / DIST_REL).is_dir(),
            build_report_stale=_is_build_report_stale(root, root / BUILD_REPORT_REL),
        )
    )


# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
# frob:ticket T-0009
def scan_projects(scan_root: Path) -> tuple[ProjectInfo, ...]:
    """Every project under `scan_root` (name-sorted for determinism) --
    a manifest that fails to parse is logged and skipped, never fatal
    to the whole scan."""
    if not scan_root.is_dir():
        _log.info("discovery: scan root does not exist: %s", scan_root)
        return ()
    infos: list[ProjectInfo] = []
    for manifest in sorted(scan_root.rglob(MANIFEST_NAME)):
        result = project_info(manifest.parent)
        if result.is_ok:
            infos.append(result.danger_ok)
        else:
            _log.warning(
                "discovery: skipping %s: %s", manifest, result.danger_err.message
            )
    # frob:waive PERF004 reason="one sort after the loop, not per-iteration"
    infos.sort(key=lambda p: p.name)
    _log.info("discovery: found %d project(s) under %s", len(infos), scan_root)
    return tuple(infos)
