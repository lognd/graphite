---
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
---
frob.toml sets [gates.docs] include = [] because graphite has no docs/index.md and README.md links only docs/guide.md and docs/screenshots/*.png -- docs/spec/01..04, docs/workflow/README.md, and docs/workflow/work-orders/*.md are all currently unlinked from any root. Either build a real docs/index.md that links every doc (then re-enable include = ["docs/**/*.md"]) or explicitly accept the work-order log as out-of-band and narrow include to the spec/guide subtree only.