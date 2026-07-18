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

## 8. TUI shell (`graphite/tui/`)

The textual head is a second renderer over the SAME service layer
and token mirror the web app uses (sec 2.4 two-heads-one-body), not
a fork with its own logic:

- `graphite/tui/app.py`'s `GraphiteApp` is the process root: it owns
  the fleet-scan root (fixed at launch) and the ACTIVE project
  (retargeted by the dashboard's drill-down or the command
  palette's "set active project" command, WOG7-F1), and pushes the
  four top-level screens (dashboard/run-console/config/
  obligations) as `Screen` instances. `NavigationProvider` wires
  those surfaces plus per-project "set active project" entries into
  textual's own command palette (rebound to `ctrl+k`, matching the
  web app's chord, sec 3.5 of 03); `ShortcutSheet` is the `?`-bound
  modal listing the keyboard map (same map as sec 6 above).
- `graphite/tui/widgets.py` holds the chrome shared by every
  screen: `TitleBlock` (the persistent identity line -- project,
  design hash, schema version, timestamp) and `StatusLine` (the
  docked bottom bar -- current status text plus the keyboard hint),
  both driven only by `graphite.tui.tokens` colors (03 sec 4 token
  law) so a token regeneration is the only edit a palette change
  ever needs.
- Each screen under `graphite/tui/screens/` (`dashboard.py`,
  `obligations.py`, `run_console.py`, `config.py`) composes
  `TitleBlock`/`StatusLine` plus a `DataTable` or form driven
  through `graphite.service.*` exactly as its web counterpart is
  (guide.md sections 1, 2, 4, 5 respectively) -- no TUI-local
  re-implementation of discovery, report reading, or the run
  lifecycle.

## 9. Logging

`graphite/logging_setup.py` is the one dictConfig entry point
(house rule: stdout is data, all logs go to stderr). `configure()`
applies the config exactly once per process (idempotent across
repeated imports); `get_logger(name)` is the only sanctioned way
any graphite module obtains a `logging.Logger` -- it calls
`configure()` first so callers never need to order their imports
around setup. `_LevelPrefixFormatter` keeps INFO/DEBUG output as a
bare message and prefixes WARNING+ with the level name, so casual
stderr output stays readable while errors stand out.

## 10. Artifact registry and schema index

`graphite/artifacts.py` and `graphite/service/artifact_registry.py`
/ `graphite/service/artifact_index.py` are the one place that
resolves a regolith report's declared artifact paths into files on
disk and keeps a content-addressed index of what's been produced
per project/run. `graphite/service/scan_upload.py` is the
counterpart entry point for user-uploaded scan artifacts entering
that same index. No other module reads artifact paths off a report
directly -- this keeps the "what files exist for this run"
question answerable in one place instead of re-derived ad hoc at
each call site.

## 11. Server app, dependencies, and error mapping

`graphite/server/app.py` builds and configures the one FastAPI
`create_app()` ASGI application (route registration, static
frontend mount, startup wiring) described in sec. 1. `graphite/
server/deps.py` holds the FastAPI dependency-injection providers
(project resolution, service-layer handles) that every route
function pulls in via `Depends(...)` instead of constructing
service objects inline. `graphite/server/errors.py` maps
service-layer and regolith-side failures onto the one JSON error
envelope (`{"detail": {"kind": ..., ...}}`) every route returns, so
error shape never has to be reinvented per route.

## 12. API routes

One `APIRouter` per resource family under `graphite/server/
routes/`, each calling only into `graphite.service` (sec. 4) --
no report parsing, no subprocess calls, no filesystem globbing in
route handlers themselves.

- `routes/projects.py`: project discovery/listing, backed by
  `graphite/service/discovery.py`.
- `routes/runs.py`: driving and inspecting regolith runs (start,
  status, log streaming) via `graphite/service/runs.py`.
- `routes/reports.py` / obligation-bearing endpoints in
  `routes/obligations.py`: obligation explorer data, backed by
  `graphite/service/reports.py`.
- `routes/build.py`: triggering and tracking builds.
- `routes/calc.py`: the calc-book artifact walk (guide sec. 3).
- `routes/config.py` / `routes/settings.py`: reading and writing
  project/user config, backed by `graphite/service/config_cli.py`
  and `graphite/service/settings.py`.
- `routes/artifacts.py`: serving artifact files resolved through
  sec. 10's registry.
- `routes/scans.py`: accepting uploaded scan artifacts, backed by
  `graphite/service/scan_upload.py`.
- `routes/doctor.py`: environment/config diagnostics.
- `routes/health.py`: the `/api/ping` liveness endpoint.

## 13. Build and CI scripts

`scripts/check_bundle_size.py`, `scripts/check_openapi_drift.py`,
and `scripts/gen_openapi.py` are `make check`/`make build` gates
(sec. 5, sec. 2): bundle-size regression, OpenAPI schema drift
between the committed `openapi.json` and the live FastAPI app, and
regenerating that committed spec, respectively. They run outside
the ASGI process, importing `graphite.server.app` only to build the
schema or measure the shipped bundle.

## 14. Service layer modules

The service layer (sec. 4) is the ONE place that talks to
regolith; each module below owns one slice of that surface and is
the only thing its matching route file (sec. 12) is allowed to
call into:

- `graphite/service/runs.py`: the run lifecycle -- starting a
  regolith subprocess run (`start_run`), polling/recording its
  status (`RunRecord`, `mark_finished`, `get_run`), tailing its
  stderr log (`tail_log_lines`, `get_full_log`), cancelling
  (`cancel_run`), pruning old runs (`prune_run_history`,
  `runs_home`), health snapshots (`HealthSnapshot`), and diffing
  two runs' obligation verdicts (`VerdictDiff`,
  `compute_verdict_diff`) for the run console (guide sec. 4).
- `graphite/service/reports.py`: reading and shaping a completed
  run's regolith report (obligations, groups, summaries) for the
  obligation explorer (guide sec. 2).
- `graphite/service/config_cli.py`: reading and writing project
  config through the regolith CLI's own config verbs -- no direct
  TOML mutation outside that CLI contract (sec. 3).
- `graphite/service/settings.py`: user-level graphite settings
  (distinct from per-project regolith config), backing
  `routes/settings.py` and guide sec. 5.
- `graphite/service/discovery.py`: fleet/project discovery under
  the scan root (`GRAPHITE_SCAN_ROOT`, sec. 3), backing
  `routes/projects.py` and the dashboard (guide sec. 1).
- `graphite/service/errors.py`: the service-layer exception/result
  vocabulary that `graphite/server/errors.py` (sec. 11) maps onto
  the wire error envelope -- routes never construct HTTP errors
  from raw exceptions directly.
