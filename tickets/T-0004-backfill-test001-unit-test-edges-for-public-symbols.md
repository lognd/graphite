---
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
---
frob adoption baseline: 670 TEST001 findings (public functions/methods with no frob:tests unit edge) across the legacy Python and TypeScript surface. Severity is warn per the legacy-adoption dial in frob.toml; this ticket tracks driving it down and eventually flipping TEST001 back to error.