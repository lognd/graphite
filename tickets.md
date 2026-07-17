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
```
frob adoption baseline: 670 TEST001 findings (public functions/methods with no frob:tests unit edge) across the legacy Python and TypeScript surface. Severity is warn per the legacy-adoption dial in frob.toml; this ticket tracks driving it down and eventually flipping TEST001 back to error.
