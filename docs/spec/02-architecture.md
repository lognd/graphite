# 02 -- Architecture (normative)

## 1. The stack

- BACKEND: FastAPI + uvicorn (pydantic v2 native -- regolith's
  models plug in directly), one ASGI app in `graphite/server/`.
  REST for state, Server-Sent Events for live progress/log
  streams (SSE over localhost; no websocket complexity until a
  bidirectional need is proven).
- FRONTEND: React 18 + TypeScript (strict) + Vite, TanStack Query
  for all server state (no hand-rolled fetch caches), react-router
  for navigation, CSS via vanilla-extract or CSS modules over
  design tokens (03) -- NOT utility-soup; Tailwind is permitted
  only with the token plugin and a linted class allowlist.
- TUI: textual, kept, sharing the service client and tokens.
- TESTS: pytest (backend), vitest + testing-library (frontend
  unit), Playwright (system, against the real served app with a
  fixture project).

## 2. The one-schema-source chain (the dedup law's backbone)

regolith pydantic models (generated from Rust, the single truth)
-> FastAPI response models -> `openapi.json` (committed, drift-
checked) -> `openapi-typescript` generated `api.generated.ts`
(committed, drift-checked) -> typed TanStack Query hooks.

NO hand-written TypeScript interface may duplicate a wire shape;
NO Python dataclass may mirror a regolith model. A shape needed
by the UI but absent from regolith's public surface is a recorded
gap escalated to lithos, never a local re-declaration. Drift
checks live in `make check` on both halves.

## 3. Process model

- `graphite` (no args): starts the server, opens the browser to
  the localhost URL, stays attached with a readable stderr log.
- `graphite tui`: the textual app.
- `graphite serve --port N`: server only (the existing config
  keys `graphite.serve.host/port` keep working; host stays
  localhost per charter sec. 3.1).
- Driving actions spawn the `regolith` CLI as subprocesses with
  `--color never`, parse stdout DATA (JSON where the verb offers
  it), and stream stderr logs + D228 progress events over SSE.
  graphite never imports regolith's orchestrator internals -- the
  CLI and the wheel's public report models are the whole contract.

## 4. Directory layout

```
graphite/            # python package: server/, service/, tui/, cli.py
frontend/            # vite app: src/{app,routes,components,tokens,api}
docs/spec/           # this corpus
docs/workflow/       # dispatch protocol + work orders
tests/               # backend pytest
frontend/src/**/*.test.tsx  # vitest colocated
tests/system/        # playwright
```

The service layer (`graphite/service/`) is the ONE place that
talks to regolith (CLI subprocess + report-file reading + wheel
model parsing); server routes and the TUI both call it. UI code
never shells out.

## 5. Build and packaging

- Dev: `make dev` runs uvicorn + vite dev server (proxied);
  `VITE_USE_MOCKS=1` runs the frontend against recorded fixtures
  (committed under `frontend/src/mocks/`) with no backend.
- Release: `make build` emits the frontend bundle into
  `graphite/server/static/` (self-contained, fonts bundled); the
  wheel ships it. `graphite` serves only from that directory at
  runtime -- the zero-external-request check is a Playwright
  system test that fails on ANY non-localhost request.
- Node is a DEV dependency only; a user installing the wheel
  never needs it.

## 6. Testing doctrine

Every route: a pytest against the service layer with a fixture
project. Every component: vitest with testing-library (no
snapshot-only tests). Every user journey named in a WO: one
Playwright spec. The fixture project is a committed miniature
lithos project (built artifacts included) so tests never need the
sibling repo at runtime; a separate integration marker runs
against the real `../lithos` fleet when present (the feldspar
regolith-test precedent).

## 7. Performance and WASM doctrine (owner directive, lithos D235)

Compute-intensive frontend paths run as Rust compiled to
WebAssembly, not as hot JavaScript:

1. WHAT QUALIFIES: geometry processing for the 3D viewer
   (tessellation transforms, section cuts), gerber/DXF/SVG heavy
   parsing and rendering transforms, content hashing over large
   artifacts, and any profiled inner loop exceeding ~16ms on the
   fixture data. Trivial logic does NOT get WASM-ified -- the
   threshold is a profile, recorded in the ledger of the WO that
   crosses it.
2. ONE TOOLING PATH: a single `wasm/` crate workspace in this
   repo (wasm-pack/wasm-bindgen), bundled locally by Vite --
   never fetched from a CDN (charter 3.1 unchanged); loaded
   lazily per route so the base bundle stays lean (G8's budget).
3. DEDUP SEAM: where the computation already exists in lithos's
   Rust crates (outline/geometry math), prefer proposing a
   wasm32 build of the EXISTING crate to the lithos coordinator
   over re-implementing -- one physics/geometry home (the lithos
   charter-39 boundary rule applied to rendering math). A local
   re-implementation is acceptable only as a marked-provisional
   bridge with the escalation recorded.
4. FALLBACK HONESTY: if WASM fails to load, views degrade to a
   labeled slower path or an honest ErrorState -- never a silent
   hang.
