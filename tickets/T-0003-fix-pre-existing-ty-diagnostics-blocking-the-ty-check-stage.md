---
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
---
frob.toml sets [check] skip = ["ty"] because 2 pre-existing ty diagnostics predate frob adoption: tests/service/test_config_cli.py:49 relies on a # type: ignore[arg-type] comment written for mypy (which ty does not honor) and narrows nothing, and tests/service/test_runs.py:230 passes a plain str where a Literal status is expected. Fix both (or annotate correctly) and remove ty from [check] skip.