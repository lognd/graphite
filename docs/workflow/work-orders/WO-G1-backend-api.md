# WO-G1 -- Backend API v1 + the one-schema-source chain

Status: done
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

## Close-out ledger (WO-G1)

Branch: `wog1-backend-api` (worktree `.worktrees/wog1`, based on
`main` 9f4a1b0). Commits land in this branch in a small stack (see
`git log`); this WO does not push.

`make check` is green: `ruff check`, `ty check graphite`, the full
pytest suite (63 collected, 62 pass + 1 fixture-only `integration`
skip), the `openapi.json` drift check, and the frontend
`api.generated.ts` drift check (Node dev-only, `npm run
check:api-drift`). `make backend-check` is the self-contained
Node-free leg WO-G2+ can depend on before a frontend exists.

### Acceptance table (deliverable by deliverable)

| # | Deliverable | Status | Notes |
|---|---|---|---|
| 1 | `graphite/service/`: discovery, report readers, artifact registry, CLI runner | DONE | `discovery.py`, `reports.py`, `artifact_registry.py`, `runs.py`, `config_cli.py`, `errors.py` |
| 2a | REST: projects + detail | DONE | `GET /api/projects`, `GET /api/projects/{project}` |
| 2b | REST: obligations filter/group | DONE | `GET /api/projects/{project}/obligations?filter=&group=` over the real `AuditIndex`/`AuditRow` |
| 2c | REST: calc sheets + audit index | DONE | `GET .../calc/sheets`, `GET .../calc/audit` |
| 2d | REST: BOM/cost/schedule | PARTIAL | `GET .../build-report` exposes `cost_profile`/`cost_record_pins`/`cost_estimates`/`frame_lock_rows` verbatim (no local recompute, charter 3.2); there is no dedicated regolith BOM/schedule model to expose beyond that -- WOG1-F2/F3 below name the two provisional bridges this rests on |
| 2e | REST: artifacts list + typed fetch | DONE | content-hash-only fetch, GLB/SVG/PDF/STEP/JSON all served by MIME sniff |
| 2f | REST: runs start/list/detail | DONE | `POST .../runs`, `GET .../runs`, `GET /api/runs/{id}` |
| 2g | REST: config read/where/set, doctor, health | DONE | `GET/PUT .../config[/{key}]`, `GET .../doctor`, `GET .../health` |
| 2h | SSE `/api/runs/{id}/events` | DONE (log lines) | `ProgressEventProvisional` in `runs.py` is the ONE documented D228 upgrade shape (WOG1-F4), not emitted yet (lithos WO-119 ungated) |
| 3 | `openapi.json` + drift check | DONE | `scripts/gen_openapi.py` / `scripts/check_openapi_drift.py`, `make openapi` / `make openapi-check` |
| 3b | `api.generated.ts` + drift check | DONE | `frontend/package.json` (dev-only), `frontend/check-api-drift.mjs`, `make frontend-api-gen` / `make frontend-api-check` |
| 4 | Fixture project + pytest + integration marker | DONE | `tests/fixtures/timber_pavilion` (generated once from `examples/flagships/timber_pavilion` via the real CLI, `build --release` + `ship --build`); `pytest.mark.integration` gated behind `--run-integration`, scans the real `../lithos/examples` fleet when present |
| 5 | Security posture | DONE | `graphite serve` refuses non-localhost hosts; `artifact_registry.fetch_by_hash` has no path parameter anywhere in its signature, only a content hash that must already be in a listing this project produced (negative test: `test_fetch_by_hash_cannot_smuggle_a_path`) |

### curl walkthrough

```
$ GRAPHITE_SCAN_ROOT=tests/fixtures graphite serve tests/fixtures --port 8811
graphite serve: http://127.0.0.1:8811/api/ping

$ curl -s http://127.0.0.1:8811/api/ping
{"status":"ok"}

$ curl -s http://127.0.0.1:8811/api/projects
[{"name":"examples.timber_pavilion","version":"0.1.0", ...
  "has_build_report":true,"has_lockfile":true,"has_dist":true}]

$ curl -s http://127.0.0.1:8811/api/projects/examples.timber_pavilion/health
{"release_ok":true,"obligation_summary":
  {"obligations":10,"discharged":6,"accepted_deviation":3,
   "accepted_rows":4,"deferred":0,"violated":0}}

$ curl -s http://127.0.0.1:8811/api/projects/examples.timber_pavilion/artifacts \
  | python3 -c "import json,sys;d=json.load(sys.stdin);print(len(d), d[0])"
23 {'content_hash': 'sha256:a5f3d7029009...', 'relpath': 'acceptance_ledger.json', ...}

$ curl -s -X POST http://127.0.0.1:8811/api/projects/examples.timber_pavilion/runs \
  -H 'Content-Type: application/json' -d '{"verb":"check","args":["program.calx"]}'
{"run_id":"f0269ac3...","verb":"check","status":"running", ...}
```

(Full session log captured during close-out; SSE `.../runs/{id}/events`
verified separately via `TestClient.stream` in
`tests/api/test_routes.py::test_run_events_streams_and_closes`.)

### Companion-audit table (spec 04.1 applied to API affordances)

| Floor | Landed / Deferred / Rejected |
|---|---|
| ANY TABLE: sort/filter/copy/CSV/empty/loading/count/sticky-header/keyboard | DEFERRED(WO-G2) -- these are frontend-rendering concerns over the plain-array routes this WO ships (`/projects`, `/calc/sheets`, `/artifacts`); the obligations route additionally offers server-side `filter`/`group` since that needs the real model, not just a client-side re-sort |
| ANY DETAIL VIEW: raw-JSON toggle/content-hash/permalink/prev-next/open-in-files | LANDED(partial) -- every detail route returns the full regolith model (raw-JSON-able as-is); content hash is the artifact fetch key itself; permalink/prev-next/open-in-files are frontend concerns, DEFERRED(WO-G2) |
| ANY LONG OPERATION: live progress/cancel/elapsed/durable record/failure-state | LANDED(partial) -- durable `RunRecord` (`started_at`->elapsed, `status`, `exit_code`), SSE log tail incl. full stderr on failure; progress (D228) DEFERRED(lithos WO-119, WOG1-F4); cancel DEFERRED(WO-G2, no kill endpoint in this WO -- recorded as WOG1-F6) |
| ANY LIST OF PROBLEMS: group-by/count-badges/F-number-link/copy-as-report | LANDED(partial) -- `/obligations?group=family\|disposition` plus `AuditSummary` counts; F-number/design-log linking and "copy as report" are frontend rendering, DEFERRED(WO-G2) |
| ANY GRAPHIC: fit/zoom/measure/export/content-hash-caption | LANDED(partial) -- artifact fetch is content-hash-addressed and typed by MIME (SVG/PDF/DXF/JSON all present in the fixture); fit/zoom/measure are frontend/WASM-viewer concerns (spec 02 sec. 7), DEFERRED(WO-G3/G2) |
| ANY FORM/CONFIG FIELD: source-attribution/reset-to-default/real-error | LANDED -- every `ConfigEntry` carries `source`; `set` goes through the real CLI (real error message on failure); "reset to default" DEFERRED(WO-G2, no dedicated endpoint -- `set` to the recorded default value covers it today) |

### Escalations (WOG1-Fn placeholders, for the lithos coordinator)

- **WOG1-F1**: no regolith library function for fleet/project
  discovery -- both `tools/health/fleet.py` and
  `graphite.service.discovery` independently `rglob` for
  `magnetite.toml`. A shared `regolith.magnetite.discovery` helper
  would remove the duplication.
- **WOG1-F2**: the ship package `manifest.json` has no dedicated
  regolith pydantic model (assembled ad hoc in the ship backend);
  bridged as `reports.ManifestSummary` (provisional).
- **WOG1-F3**: `dist/acceptance_ledger.json` (written by
  `acceptance.acceptance_ledger_bytes`) is a DIFFERENT shape than the
  in-memory `AcceptanceOutcome` model it renders from (no
  `accepted_hashes` field on disk; `accepted_deviations` replaces
  `deviations`) -- `AcceptanceOutcome.model_validate_json` cannot
  parse the file `regolith ship` actually writes. Bridged as
  `reports.AcceptanceLedgerSummary` (provisional); a real
  `LedgerDocument` model in `regolith.orchestrator.acceptance` would
  close this.
- **WOG1-F4**: lithos WO-119 (D228 typed progress events) has not
  landed; `runs.ProgressEventProvisional` is the forward-declared
  consumer shape, unused until WO-119 ships. SSE streams plain log
  lines only today.
- **WOG1-F5**: `regolith config list`/`where` have no `--json` flag
  while `doctor` does -- `config_cli.py` parses one stable text line
  format instead of a JSON round-trip. A `--json` flag mirroring
  `doctor`'s would remove this module's only text-parsing code.
- **WOG1-F6**: no run-cancel endpoint in this WO (the CLI subprocess
  has no cooperative-cancel protocol to drive) -- left for WO-G2/G5
  once a kill-and-mark-failed policy is decided.

### Import-boundary note

WO-59's original blanket ban on `regolith.orchestrator`/
`regolith.harness` imports is NARROWED, not lifted: `graphite.service.
reports` imports the three READ-ONLY report-model submodules
(`orchestrate`, `acceptance`, `lockfile`) plus `regolith.backends.calc`,
all public, per this WO's hard rule (parse with regolith's own model
classes, never re-declare). `regolith.harness` and any private
(`regolith._*`) module stay forbidden; `tests/test_import_boundary.py`
asserts the narrowed boundary structurally (two tests: no
harness/private imports anywhere, and `regolith.orchestrator.*` imports
limited to the three allowed submodules).
