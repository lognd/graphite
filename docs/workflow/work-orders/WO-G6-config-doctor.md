# WO-G6 -- Config editor + doctor + settings

Status: done
Spec: 04.1 ANY-FORM checklist; the regolith config where-doctrine
  (lithos D163/WO-59). Gates: WO-G1 + WO-G2.

## Goal

The environment surfaces: what is configured (and WHY -- which
level), and what tools the host actually has.

## Deliverables

1. Config view: the 4-level precedence rendered honestly (every
   key: effective value + source attribution level, the `where`
   doctrine); edit writes through the real `regolith config` CLI
   (never a private file write); reset-to-default; validation
   errors are the CLI's own messages.
2. Doctor view: `regolith doctor --json` rendered -- external
   tools (kicad, verilator, ghdl, feldspar pack, ...) with
   found/missing states, versions, and the honest degradation
   notes; re-probe button.
3. graphite's own settings (theme override, default project
   root, run verbosity): stored in ~/.graphite/, never mixed into
   regolith config; same form checklist.
4. TUI parity notes: whatever this WO ships, record the TUI gap
   table for WO-G7 (charter 2.4 -- a capability in one head and
   not the other is a recorded gap).
5. Playwright: config edit round-trip (set via UI, verify via
   CLI, reset); doctor render on the fixture env.

## Acceptance

Every field carries source attribution; edits round-trip through
the real CLI; 04.1 form checklist ledgered; make check green.

---

## Close-out ledger (branch `wog6-config-doctor`)

### Acceptance table

| Criterion | Verdict | Evidence |
|---|---|---|
| Every key: effective value + where-doctrine source attribution | PASS | `routes/Config.tsx` renders `regolith config list` (WO-G1 service) per key through `ConfigField`; the source span is mandatory in the component, never omitted; `test_config_list`, round-trip Playwright spec asserts `default` -> `project` transition |
| Edits write through the real `regolith config` CLI | PASS | UI -> `PUT /api/projects/{p}/config/{key}` -> `config_cli.set_config` -> `regolith config set --global\|--local` subprocess (unchanged WO-G1 path; no new write path added); Playwright verifies via a SEPARATE `regolith config where` subprocess inside the test |
| Reset-to-default | PASS | New global `GET /api/config/schema` exposes the registered default/kind/doc (`config_cli.key_defaults`); reset = set-to-recorded-default per the WO-G1 ledger (no CLI unset verb exists -- verified `regolith config --help`: get/where/list/set only); reset button disabled when source is already `default` |
| Validation errors are the CLI's own messages | PASS | `ApiError` carries the `ServiceError.detail` (the CLI's stderr) verbatim to `ConfigField`'s role=alert; Playwright: setting `optimize.seed=not-an-int` renders regolith's own "not an int" message |
| Doctor: found/missing, versions, degradation notes | PASS | `routes/Doctor.tsx` renders `regolith doctor --json` verbatim through the shared DataTable: status, version, path, capability ("unlocks"), install hint for missing tools |
| Doctor: re-probe | PASS | Refetch button (regolith doctor freshly probes on every invocation -- `toolenv.resolve()` is called with a fresh probe by doctor's design, so re-probe == re-invoke through the service layer); Playwright clicks it and re-asserts the table |
| graphite settings in ~/.graphite/, never in regolith config | PASS | `graphite/service/settings.py` -> `~/.graphite/settings.json` (`GRAPHITE_HOME` override, mirrors `GRAPHITE_RUNS_HOME`); own `/api/settings` GET/PUT/reset routes; zero contact with `regolith.config` or `config_cli` |
| Settings: same 04.1 form checklist | PASS | Settings view composes the SAME `ConfigField` component: source span (fixed `graphite` level -- one level is the honest attribution), reset-to-default (dedicated `/api/settings/reset`), pydantic 422 for a bad verbosity (`test_settings_invalid_verbosity_is_a_real_validation_error`) |
| Playwright: config round-trip + doctor render | PASS | `tests/system/config-doctor-round-trip.spec.ts`, 3 journeys on a REAL backend (throwaway fixture copy under /tmp + `graphite serve` + un-mocked vite dev server -- new webServer pair in playwright.config.ts) |
| make check green | PASS | Foreground run at close-out: backend (ruff/ty/pytest 77 passed/openapi-drift) + frontend (eslint/prettier/tsc/token-drift/vitest 75 passed/build) + api-drift + Playwright 19/19 |

### Companion-audit table (04.1, per surface)

| Floor | Landed / Deferred / Rejected |
|---|---|
| ANY FORM/CONFIG FIELD (config editor): source attribution | LANDED -- `ConfigField` renders the where-doctrine level per key; the component has no source-less mode |
| ANY FORM/CONFIG FIELD (config editor): reset to default | LANDED -- via `/api/config/schema` recorded defaults; disabled at source=default (nothing to reset) |
| ANY FORM/CONFIG FIELD (config editor): real validation error | LANDED -- CLI stderr verbatim in role=alert (`ApiError.body.detail`) |
| ANY FORM/CONFIG FIELD (settings): all three | LANDED -- same component; source is the fixed `graphite` level; reset via dedicated endpoint; pydantic message on 422 |
| ANY FORM/CONFIG FIELD (settings theme row): all three | LANDED(partial) -- source attribution reads `graphite (browser-local)` honestly; select cannot produce an invalid value; reset = choosing `system` (the default option, in the same select). No separate reset button: REJECTED(one-of-three select where the default is a visible option -- a reset button would duplicate the `system` option) |
| ANY TABLE (doctor view) | LANDED -- composes the WO-G2 DataTable (sort/filter/copy/CSV/empty/loading/count/sticky/j-k built in) |
| ANY LIST OF PROBLEMS (doctor missing rows) | LANDED(partial) -- install-hint teaching text per missing row (regolith's own guidance verbatim); group-by/count badges DEFERRED(WO-G8 polish -- the catalog is 6 rows, grouping adds nothing at this size); no F-number links exist for tool absence (not a design-log-governed problem class), REJECTED |
| ANY DETAIL VIEW / ANY GRAPHIC / ANY LONG OPERATION | REJECTED(not present) -- no detail view, graphic, or long operation ships in this WO (doctor's probe is a short synchronous CLI call; the re-probe button shows its in-flight state) |
| Empty/loading/error/keyboard/dark+light/AA (04.3 per view) | LANDED -- all three views: loading + no-projects empty states, ErrorState with retry on failed reads, native form controls + Enter-to-save keyboard path, both themes token-driven, gallery axe checks pass with the new ConfigField section (dark + light) |

### TUI parity gap table (for WO-G7, charter 2.4)

Web capabilities shipped by this WO that the TUI does not have yet:

| # | Capability (web, WO-G6) | TUI status |
|---|---|---|
| G7-GAP-1 | Config list with per-key where-doctrine source attribution | GAP -- TUI has no config surface |
| G7-GAP-2 | Config edit through `regolith config set` (global/local scope) | GAP |
| G7-GAP-3 | Reset-to-default from the recorded-defaults schema (`/api/config/schema` / `config_cli.key_defaults`) | GAP |
| G7-GAP-4 | CLI validation errors rendered verbatim per field | GAP |
| G7-GAP-5 | Doctor table (found/missing, version, path, capability, install hint) | GAP -- TUI has no doctor surface |
| G7-GAP-6 | Doctor re-probe | GAP |
| G7-GAP-7 | graphite settings editor (default project root, run verbosity) | GAP |
| G7-GAP-8 | Theme override | NOT A GAP -- web theme is browser-local (localStorage); textual has its own dark/light toggle; per-head presentation state is legitimately per-head |

### Escalations (WOG6-Fn placeholders, for the lithos coordinator)

- **WOG6-F1**: `config_cli.key_defaults()` imports
  `regolith.config.registered_keys()` directly instead of shelling
  out -- the ONE non-subprocess read in the module, because neither
  `config list` nor `where` (nor any `--json` flag, see WOG1-F5)
  exposes a key's default/kind/doc. Read-only introspection of a
  compiled-in constant table, never a write, so the
  "edits through the real CLI" doctrine is intact; a
  `regolith config list --json` carrying defaults would let graphite
  drop the import and go through the CLI uniformly.

### Notes

- Shared-file changes (routes.tsx, Nav.tsx, AppShell.tsx palette)
  kept to additive single-line entries per the WO-G5 parallel note.
- The doctor wire shape (`DoctorEntry` in client.ts) is hand-typed:
  the backend route is `response_model=list[object]` (WO-G1),
  so api.generated.ts says `unknown[]` -- there is no generated
  shape to alias. Recorded in the type's comment; typing the route
  with a real pydantic model would need a regolith-side doctor
  model first (adjacent to WOG1-F5's `--json` inconsistency).
- Playwright's real-backend rig copies `tests/fixtures/` to
  /tmp/graphite-pw-fixture before serving so `config set` journeys
  never dirty the committed fixture tree.
