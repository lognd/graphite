"""graphite's import boundary (WO-59 artifact-only channel, AD-24/AD-22,
NARROWED by WO-G1's public-report-model mandate, spec 02 sec. 2 -- the
one-schema-source chain requires parsing report JSON with regolith's
OWN pydantic model classes rather than re-declaring them, which means
`graphite.service.reports` legitimately imports the three READ-ONLY
report-model modules: `regolith.orchestrator.orchestrate`
(BuildReport/StagedBuildReport), `regolith.orchestrator.acceptance`
(AcceptanceOutcome/Deviation), and `regolith.orchestrator.lockfile`
(Lockfile + its `parse`/`render`), plus `regolith.backends.calc`
(CalcBook/AuditIndex/CalcSheet). graphite NEVER imports the actual
solve/evidence engine (`regolith.harness`) or any other
`regolith.orchestrator` submodule (`discharge`, `translate`,
`payload_store`, `cache`, ... -- the execution internals, not the
report shapes) or a private (`regolith._*`) module. This test asserts
the NARROWED boundary, not the original blanket ban."""

from __future__ import annotations

import re
from pathlib import Path

# Forbidden outright: the harness (solve/evidence engine) and any
# private regolith module.
_FORBIDDEN_RE = re.compile(
    r"^\s*(from\s+regolith\.(harness|_\w+)(\.|\s+import)|"
    r"import\s+regolith\.(harness|_\w+)\b)",
    re.MULTILINE,
)

# `regolith.orchestrator.<submodule>` imports are allowed ONLY for the
# three read-only report-model modules; anything else under
# `orchestrator` is an execution internal and stays forbidden.
_ORCHESTRATOR_IMPORT_RE = re.compile(
    r"^\s*(?:from\s+regolith\.orchestrator\.(\w+)(?:\.|\s+import)|"
    r"import\s+regolith\.orchestrator\.(\w+)\b)",
    re.MULTILINE,
)
_ALLOWED_ORCHESTRATOR_SUBMODULES = {"orchestrate", "acceptance", "lockfile"}


def test_no_harness_or_private_imports_anywhere_in_graphite():
    graphite_dir = Path(__file__).resolve().parents[1] / "graphite"
    offenders = []
    for path in graphite_dir.rglob("*.py"):
        if _FORBIDDEN_RE.search(path.read_text()):
            offenders.append(str(path))
    assert offenders == [], (
        f"graphite must never import regolith.harness or a private module: {offenders}"
    )


# frob:ticket T-0009
def test_orchestrator_imports_limited_to_report_models():
    graphite_dir = Path(__file__).resolve().parents[1] / "graphite"
    offenders = []
    for path in graphite_dir.rglob("*.py"):
        text = path.read_text()
        for match in _ORCHESTRATOR_IMPORT_RE.finditer(text):
            submodule = match.group(1) or match.group(2)
            if submodule not in _ALLOWED_ORCHESTRATOR_SUBMODULES:
                offenders.append(f"{path}: regolith.orchestrator.{submodule}")
    # frob:waive PERF004 reason="one sort in an assert message, not per-iteration"
    assert offenders == [], (
        "graphite may only import the read-only report-model submodules of "
        f"regolith.orchestrator ({sorted(_ALLOWED_ORCHESTRATOR_SUBMODULES)}): {offenders}"
    )
