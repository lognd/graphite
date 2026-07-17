---
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
---
frob adoption baseline: 1159 COV001 findings (public symbols with no frob:doc edge) across the legacy surface. Severity is warn per the legacy-adoption dial in frob.toml; this ticket tracks annotating public API with frob:doc anchors and eventually flipping COV001 back to error.