# WO-G5 -- Run console: drive builds with live progress

Status: done
Spec: 02 sec. 3 (process model -- CLI subprocess only); 04.1
  ANY-LONG-OPERATION checklist; lithos D228 (the progress
  channel). Gates: WO-G1 + WO-G2; the LIVE progress half also
  gates on lithos WO-119 (the producer) -- land the console with
  log-derived coarse progress first, upgrade when 119 merges.

## Goal

build / ship / test / optimize / health runnable from the UI with
live streamed feedback -- the watching half of the mission.

## Deliverables

1. Run console view: verb + project + flags form (config-aware
   defaults with where-attribution); start -> live LogPane (stderr
   stream, search, follow, -v toggle re-runs verbose) + ProgressRail
   per phase (SSE); cancel; elapsed; exit summary with the verdict
   counts diff (before -> after this run).
2. Run history: durable records (WO-G1's store) listed with
   status, duration, verb, project; detail replays the captured
   stream; "re-run" affordance.
3. Progress derivation: v1 parses the D217 structured log stream
   for phase boundaries (coarse but honest); the D228 typed-event
   upgrade path is a single adapter swap, designed now, cited in
   code.
4. StatusLine integration: active run visible app-wide with its
   rail; completion notifies in-app only (no OS notifications
   without an explicit setting).
5. Optimize runs: surface trace/resume artifacts (winner rows,
   iteration count, the pinned-STEP link when one ships).
6. Playwright: start a real fixture build, watch it complete,
   assert history record + verdict diff rendering; cancel path.

## Acceptance

A real `regolith build --release` on the fixture is watchable
end-to-end with phase progress and an honest failure rendering
(kill it mid-run in a test); 04.1 long-op checklist ledgered;
make check green.

## Close-out ledger

Branch `wog5-run-console`, commits `d69c817` (backend: D228
progress parsing, cancel route, verdict diff, full-log replay) +
the frontend/live-rig commits following it. `make check` green
(backend lint/type/78 tests, openapi + api.generated.ts drift,
frontend lint/format/typecheck/tokens/70 vitest/build, 18/18
mocked Playwright). The WO-G5 live rig
(`make frontend-system-test-live`, playwright.live.config.ts:
a real `graphite serve`-equivalent uvicorn over a scratch copy of
the fixture + the real regolith CLI) 3/3 green: a real
`build --release` watched end-to-end with the real `discharge`
phase rail, a real mid-run SIGTERM cancel (exit_code=-15
recorded), and an honest failure whose log pane carries the CLI's
verbatim error text. The live rig is a separate foreground target
(same posture as pytest `--run-integration`: needs uv + the
`../lithos` wheel), not part of `make check`.

### Superseding note (gate updated mid-flight)

lithos WO-119 MERGED before this WO started, so the "land
log-derived coarse progress first" fallback in the Spec header was
skipped: the console consumes the REAL D228 typed wire shape v1
from day one. WO-G1's `ProgressEventProvisional` (WOG1-F4) is
deleted -- superseded by `regolith.progress.ProgressEvent`.

### The ONE-parser decision (dedup law 04.2)

`graphite.server.routes.runs` imports `regolith.progress.
parse_line` (public wheel module; its docstring is the wire-shape
stability contract) and re-emits each parsed event as a typed
`progress` SSE event next to the raw `log` event. Graphite
contains NO wire-shape regex of its own, and the frontend only
ever consumes the server's JSON -- one parser, owned by the
producer's own package.

### The -v decision (deliverable 3)

Every run spawns with `REGOLITH_LOG=DEBUG` ALWAYS ON (module
docstring, `graphite/service/runs.py`): the D228 channel is
DEBUG-level stderr, and progress must flow on a user's FIRST run,
not a "re-run verbose" second lap. The captured log is the full
DEBUG stream (stderr is data; LogPane search/follow finds the
signal); there is no client "-v" toggle -- a `-v` typed into the
free-form flags field still passes through to the CLI unchanged.

### Deliverable acceptance

| Deliverable | Status |
|---|---|
| run form: verb+project+flags, config-aware defaults w/ where-attribution | LANDED (`VERB_DEFAULT_CONFIG_KEY` table over the real /config API; `build.release` -> `--release` with `key=value (source: level)` attribution line) |
| live LogPane (stream/search/follow) | LANDED (existing LogPane over the SSE `log` events) |
| ProgressRail per phase from REAL D228 events | LANDED (one rail per phase tag; done/total -> percent, indeterminate `-` -> indeterminate rail; live-verified on a real build --release) |
| cancel (backend route added -- WOG1-F6 closed) | LANDED (`POST /api/runs/{id}/cancel`: SIGTERM -> SIGKILL escalation on the live Popen, `os.kill` fallback on the persisted pid across a server restart; `cancelled` is a first-class RunStatus) |
| elapsed | LANDED (rail + 1s ticker; service records started/finished timestamps) |
| exit summary w/ verdict-count diff | LANDED (`HealthSnapshot` captured at start_run + `GET /api/runs/{id}/verdict-diff` re-reads the reports; both sides real report reads, never client-computed) |
| run history (status/duration/verb/project) + detail replay + re-run | LANDED (DataTable over /runs; `GET /api/runs/{id}/log` full-stream replay + verdict diff; re-run re-mutates with the recorded verb/args) |
| StatusLine integration (app-wide rail, in-app-only completion) | LANDED (RunContext + AppShell footer rail w/ cancel; completion is a StatusLine lastAction change only, no OS notification exists) |
| optimize surfacing (winner rows + pinned-STEP link) | LANDED (shared `optimizeWinnerRows` lib -- extracted from Project.tsx, ONE home -- over the existing lockfile API; `.step` artifacts from the existing listing link via the content-hash fetch route; fixture ships no optimize() slot or STEP, so the live path renders the honest empty states -- see WOG5-F1) |
| Playwright: real build watched + cancel + honest failure | LANDED (tests/system-live, 3/3 foreground green; plus 2 mocked specs in the make-check rig for the form/history/replay render) |

### Companion audit (04.1 ANY-LONG-OPERATION, per view)

Run console (active run):
| Affordance | Status |
|---|---|
| live progress | LANDED (typed D228 rails + raw log stream) |
| cancel | LANDED (rail button -> real SIGTERM) |
| elapsed | LANDED |
| durable record | LANDED (persisted RunRecord survives the view/server) |
| honest failure w/ real stderr tail | LANDED (log pane IS the captured stream; live spec asserts the CLI's verbatim error text) |

Run history / detail replay:
| Affordance | Status |
|---|---|
| durable record listed (status/duration/verb) | LANDED (DataTable: sort/filter/CSV/count/j-k for free) |
| replay of captured stream | LANDED |
| verdict diff on detail | LANDED |
| re-run affordance | LANDED |
| empty state | LANDED ("No runs recorded for this project yet") |

StatusLine (app-wide):
| Affordance | Status |
|---|---|
| active run visible from any route | LANDED (footer rail + lastAction) |
| cancel from anywhere | LANDED (rail button) |
| in-app-only completion | LANDED (no OS notification path exists at all) |

### UX definition-of-done (04.3)

Empty (no projects; no runs; no optimize winners; no STEP),
loading (verdict diff, history), and error (start-run failure via
ErrorState with the real message) states designed. Keyboard: the
form is plain labeled controls; history inherits DataTable's
j/k/sort/filter. No new raw design values (lint-enforced).

### Escalations

- WOG5-F1: the committed `timber_pavilion` fixture has no
  `optimize()` slot and ships no STEP, so the optimize-surfacing
  path is unit-tested (shared lib) and empty-state-verified live,
  but never live-verified against a real winner row + pinned STEP.
  A fixture with an optimize slot (or a recorded lockfile from the
  lithos optimizer flagships) would close this.
- WOG5-F2: `regolith config` still has no `--json` (WOG1-F5
  standing); the run form's config-aware defaults ride the same
  parsed-text bridge.
- WOG5-F3: run records/logs under `GRAPHITE_RUNS_HOME` grow
  without bound -- no retention/pruning policy exists in any spec;
  needs a coordinator decision (suggest WO-G8 system polish).
- WOG5-F4: `graphite serve` restarts orphan a `running` record's
  SSE stream consumer-side reconnect story (the EventSource
  auto-reconnects, but the frontend does not resubscribe to a
  still-running run found in history after a reload) -- a
  "reattach to running run" affordance is follow-up scope.
