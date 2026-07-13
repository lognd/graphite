"""graphite: the regolith interaction surface (WO-59, AD-31/D163-D165;
backend API v1 -- WO-G1, spec docs/spec/01..04).

Own distribution over the `regolith` wheel: a FastAPI backend
(`graphite/server/`) over one service layer (`graphite/service/`), a
textual TUI (config editing, `check`/`build`/`optimize` driving with
VERBATIM diagnostics, build-report browsing), and (WO-G2+) a web
frontend -- both renderers share the same service layer and design
tokens (spec 01 sec. 2).

Import boundary (NARROWED from WO-59's original blanket ban, spec 02
sec. 2 -- the one-schema-source chain): `graphite.service.reports`
parses report JSON WITH regolith's own public pydantic model classes
(`regolith.orchestrator.orchestrate.StagedBuildReport`,
`regolith.orchestrator.acceptance`, `regolith.orchestrator.lockfile`,
`regolith.backends.calc`) rather than re-declaring them -- this is the
ONLY sanctioned reach past the CLI-subprocess/disk-artifact channel.
graphite never imports `regolith.harness` (the solve/evidence engine)
or any private (`regolith._*`) module. See `graphite.artifacts` /
`graphite.service.artifact_registry` for disk scanning and
`tests/test_import_boundary.py` for the import-graph assertion.
"""

from __future__ import annotations

__version__ = "0.1.0"
