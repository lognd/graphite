# WO-G1 -- Backend API v1 + the one-schema-source chain

Status: open
Spec: 02 (architecture -- the stack, schema chain, process model,
  service layer, testing doctrine); 01 sec. 3 (constraints).

## Goal

A FastAPI app over a single service layer exposes everything the
UI needs from a lithos checkout, with `openapi.json` committed and
drift-checked -- the trunk both frontends grow from.

## Deliverables

1. `graphite/service/`: the ONE regolith boundary -- project/fleet
   discovery (magnetite.toml scan from a root), report readers
   (build_report, census, calc book, audit index, acceptance
   ledger, lockfile rows, health report) parsed WITH regolith's
   own wheel models (never re-declared), dist/ artifact
   enumeration + safe file serving, CLI runner (subprocess,
   --color never, typed Result errors, run records persisted
   under ~/.graphite/runs/).
2. REST v1 under /api: projects; project detail; obligations
   (filter/group query params); calc sheets + audit index; BOM/
   cost/schedule data; artifacts (list + typed fetch incl. GLB/
   SVG/PDF/STEP download); runs (start build/ship/test/optimize,
   list history, detail); config (read + where-attribution, set);
   doctor; health summary. SSE: /api/runs/{id}/events streaming
   log lines now, D228 progress events when lithos WO-119 lands
   (the event shape is designed NOW, marked provisional, one
   place).
3. `openapi.json` committed + drift check (make target);
   `frontend/src/api/api.generated.ts` generation wired (script +
   drift check) even before WO-G2 consumes it.
4. Fixture project committed (miniature built lithos project per
   02.6) + pytest coverage per route; integration marker against
   ../lithos when present.
5. Security posture: bind localhost only; path-traversal-safe
   artifact serving (serve by content-hash lookup, never by
   client-supplied path); no directory listings outside the
   project's dist/.

## Acceptance

make check green (incl. both drift checks); every route
pytest-covered; fixture-only tests pass without ../lithos;
`graphite serve` + curl walkthrough documented in the ledger.
