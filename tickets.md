# Tickets

Central ledger managed by `frob ticket` -- one section per ticket.

<!-- ticket:T-0001 -->
```yaml
id: T-0001
title: Backfill COV001 doc edges for public symbols
state: queued
kind: docs
origin: human
created: '2026-07-17'
blocked_by: []
parent: null
scope: []
evidence: []
attachments: []
acceptance: []
threat: null
```
frob adoption baseline: 1159 COV001 findings (public symbols with no frob:doc edge) across the legacy surface. Severity is warn per the legacy-adoption dial in frob.toml; this ticket tracks annotating public API with frob:doc anchors and eventually flipping COV001 back to error.

<!-- ticket:T-0002 -->
```yaml
id: T-0002
title: Decide DOC001 docs-index posture for docs/
state: queued
kind: docs
origin: human
created: '2026-07-17'
blocked_by: []
parent: null
scope: []
evidence: []
attachments: []
acceptance: []
threat: null
```
frob.toml sets [gates.docs] include = [] because graphite has no docs/index.md and README.md links only docs/guide.md and docs/screenshots/*.png -- docs/spec/01..04, docs/workflow/README.md, and docs/workflow/work-orders/*.md are all currently unlinked from any root. Either build a real docs/index.md that links every doc (then re-enable include = ["docs/**/*.md"]) or explicitly accept the work-order log as out-of-band and narrow include to the spec/guide subtree only.

<!-- ticket:T-0003 -->
```yaml
id: T-0003
title: Fix pre-existing ty diagnostics blocking the ty check stage
state: queued
kind: bug
origin: human
created: '2026-07-17'
blocked_by: []
parent: null
scope:
- tests/service/test_config_cli.py,tests/service/test_runs.py
evidence: []
attachments: []
acceptance: []
threat: null
```
frob.toml sets [check] skip = ["ty"] because 2 pre-existing ty diagnostics predate frob adoption: tests/service/test_config_cli.py:49 relies on a # type: ignore[arg-type] comment written for mypy (which ty does not honor) and narrows nothing, and tests/service/test_runs.py:230 passes a plain str where a Literal status is expected. Fix both (or annotate correctly) and remove ty from [check] skip.

<!-- ticket:T-0004 -->
```yaml
id: T-0004
title: Backfill TEST001 unit-test edges for public symbols
state: queued
kind: feature
origin: human
created: '2026-07-17'
blocked_by: []
parent: null
scope: []
evidence: []
attachments: []
acceptance: []
threat: null
```
frob adoption baseline: 670 TEST001 findings (public functions/methods with no frob:tests unit edge) across the legacy Python and TypeScript surface. Severity is warn per the legacy-adoption dial in frob.toml; this ticket tracks driving it down and eventually flipping TEST001 back to error.

<!-- ticket:T-0005 -->
```yaml
id: T-0005
title: 'frob compliance: zero warnings'
state: done
kind: feature
origin: agent
created: '2026-07-17'
blocked_by: []
parent: null
scope:
- graphite/,tests/,scripts/
evidence:
- ruff format graphite/server/routes/scans.py graphite/service/artifact_index.py graphite/service/scan_upload.py
  tests/service/test_artifact_index.py
attachments: []
acceptance: []
threat: null
```
## Done report

Changed: ruff-format applied to 4 files (no semantic changes).
Evidence: `ruff format --diff .` now reports "0 files would be reformatted".
Filed: T-0006 (COV001 doc edges, 386), T-0007 (TEST001/003/006 bindings, 198),
T-0008 (missing __init__.py exports, ~196), T-0009 (arch/perf findings, 40),
T-0010 (tui import cycle), T-0011 (test_routes.py dup block).
Gates: tail of 604 warnings far exceeds one-mission budget; scoped this
ticket to the genuine fix completed (ruff-format) and ticketed the rest by
category per playbook rule 5.

<!-- ticket:T-0006 -->
```yaml
id: T-0006
title: 'frob compliance: add frob:doc edges for COV001 (386 findings)'
state: queued
kind: bug
origin: agent
created: '2026-07-17'
blocked_by: []
parent: null
scope:
- graphite/,scripts/
evidence: []
attachments: []
acceptance: []
threat: null
```

<!-- ticket:T-0007 -->
```yaml
id: T-0007
title: 'frob compliance: bind frob:tests for TEST001/TEST003/TEST006 (198 findings)'
state: queued
kind: bug
origin: agent
created: '2026-07-17'
blocked_by: []
parent: null
scope:
- graphite/,tests/
evidence: []
attachments: []
acceptance: []
threat: null
```

<!-- ticket:T-0008 -->
```yaml
id: T-0008
title: 'frob compliance: add missing __init__.py exports across graphite+tests packages
  (~196 findings)'
state: queued
kind: bug
origin: agent
created: '2026-07-17'
blocked_by: []
parent: null
scope:
- graphite/__init__.py,graphite/server/__init__.py,graphite/server/routes/__init__.py,graphite/tui/__init__.py,graphite/tui/screens/__init__.py,tests/__init__.py,tests/api/__init__.py,tests/service/__init__.py,tests/tui/__init__.py
evidence: []
attachments: []
acceptance: []
threat: null
```

<!-- ticket:T-0009 -->
```yaml
id: T-0009
title: 'frob compliance: fix frob-arch findings (long-function/large-file/abstraction,
  20) and PERF001/003/004 (20)'
state: queued
kind: bug
origin: agent
created: '2026-07-17'
blocked_by: []
parent: null
scope:
- graphite/
evidence: []
attachments: []
acceptance: []
threat: null
```

<!-- ticket:T-0010 -->
```yaml
id: T-0010
title: 'frob compliance: break tui/app.py <-> tui/screens/dashboard.py import cycle'
state: queued
kind: bug
origin: agent
created: '2026-07-17'
blocked_by: []
parent: null
scope:
- graphite/tui/app.py,graphite/tui/screens/dashboard.py
evidence: []
attachments: []
acceptance: []
threat: null
```

<!-- ticket:T-0011 -->
```yaml
id: T-0011
title: 'frob compliance: dedupe renamed 7-line block in tests/api/test_routes.py'
state: queued
kind: bug
origin: agent
created: '2026-07-17'
blocked_by: []
parent: null
scope:
- tests/api/test_routes.py
evidence: []
attachments: []
acceptance: []
threat: null
```
