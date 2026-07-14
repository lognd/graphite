# WO-G8 -- System polish: a11y, performance, docs, release

Status: done
Spec: 01 sec. 4 (the professionalism bar); 04.3 (definition of
  done); 03 (both themes). Gates: WO-G3..G7 merged. LAST.

## Goal

The whole product passes the bar as a system, not per-view: one
coherent app an outside engineer can install, learn from its own
docs, and trust.

## Deliverables

1. Full a11y pass (axe on every route, keyboard-only walkthrough
   of every journey, focus management audit, AA re-verified both
   themes).
2. Performance: obligation explorer virtualized past 1k rows;
   cold start < 2s to dashboard on the fixture; bundle budget
   recorded with a size check in make check.
3. Anti-vibe audit of the FULL app against 03.1 (every ban,
   every route, both themes), ledgered.
4. Cross-view coherence sweep: shared shortcuts identical
   everywhere, terminology matches the lithos glossary (verdict
   names, family names), every count in a header agrees with its
   drill-down.
5. Docs: README (install, quickstart, screenshots), docs/guide
   for users (reading the dashboard, driving runs, the calc book
   walk), CONTRIBUTING (the dispatch protocol pointer + dedup
   law).
6. Release: wheel build with bundled static assets verified from
   a clean venv on a machine without node; version 0.2.0 tagged.

## Acceptance

Playwright suite green including the zero-external-request and
a11y specs; clean-venv wheel install serves the full app; the
companion-audit ledgers from G2..G7 re-verified as landed or
honestly re-deferred; make check green.

---

## Close-out ledger (branch `wog8-system-polish`)

### Acceptance table

| Criterion | Verdict | Evidence |
|---|---|---|
| axe on EVERY route, both themes | PASS | `tests/system/full-app-a11y.spec.ts`: 16 tests -- all 7 static routes + project view + filtered explorer + claim detail + all 5 artifact family views + calc sheet detail, each axe-scanned in dark AND light (theme set via the real localStorage key the shipped Settings select writes). Found and fixed 2 real violations (below) |
| keyboard-only walkthrough of every journey | PASS | `tests/system/keyboard-journeys.spec.ts`: fleet -> project -> filtered explorer -> claim detail with NO pointer input (Tab/Enter, bounded tab-order search); palette-only navigation to all six top-level routes; j/k/c on the explorer table |
| focus management audit | PASS | same spec: palette takes focus on open, Escape closes both dialogs, focus never lands on a detached node; `:focus-visible` outline is global (WO-G2) |
| AA re-verified both themes | PASS | axe (wcag2a/wcag2aa rulesets) green on every route in both themes; the WOG2-F2 ratified light-theme hues unchanged |
| explorer virtualized past 1k rows | PASS | DataTable windows its tbody past 1000 rows (fixed 32px rows, pad rows preserve scroll geometry; threshold/height documented as paired constants). Synthetic 2k mock project (`examples.synthetic_2k`, direct-URL only) exercises it in vitest (3 tests) and Playwright (`performance.spec.ts`: data-virtualized=true, 2000 reported, <300 mounted, deep-scroll swaps the window). Under 1k rows nothing changes (asserted) |
| cold start < 2s to dashboard, measured + recorded | PASS | REAL wheel-served app over the real fixture backend, headless chromium, 3 runs: 110/121/122 ms (budget 2000). The mocked preview path asserts <2s in `performance.spec.ts` on every `make check` |
| bundle budget recorded + size check in make check | PASS | `scripts/check_bundle_size.py` (a `make check` leg): main js 399470 B <= 460000, main css 63596 B <= 75000 (~15% headroom over the recorded 2026-07-13 sizes; three.js chunks exempt by design -- lazy per-route, spec 02.7) |
| anti-vibe audit, full app, 03.1, ledgered | PASS | table below |
| cross-view coherence sweep | PASS | counts: fixed the accepted header/drill-down mismatch (below), pinned by `count-coherence.spec.ts`; shortcuts: `?`/`ctrl+k`/`j-k`/`esc` app-level in web (AppShell) and TUI (WO-G7 bindings) -- identical; terminology: wire-shape enum names everywhere (disposition `calc_sheet/accepted_deviation/deferred/violated`, verdicts incl. `accepted-deviation`/`excluded`); "waiver" retained only where the pipeline's own reason strings carry it |
| deferral queue worked item by item | PASS | disposition table below |
| README + guide + CONTRIBUTING + real screenshots | PASS | README rewritten (was pre-WO-G1 stale); docs/guide.md; CONTRIBUTING.md; 5 committed Playwright captures in docs/screenshots/ (`make screenshots` regenerates; capture spec self-skips in normal runs) |
| wheel with bundled assets, clean-venv verified without node | PASS | proof below |
| version 0.2.0 tagged | PASS | pyproject + `graphite.__version__` = 0.2.0; annotated local tag `v0.2.0` (coordinator pushes tags) |
| make check green incl. new legs | PASS | foreground close-out run recorded below |

### A11y: real violations found and fixed

1. DataTable rendered an EMPTY sort `<button>` for header-less action
   columns (calc book's "open sheet" column) -- axe `button-name` +
   `empty-table-header`, critical. Action-only columns now render a
   screen-reader-only column label, no interactive control.
2. Almost no route had an `<h1>` (document outline started at h2/h3
   or nothing) -- every route now carries exactly one real h1
   (sr-only `PageTitle` where the visual design's own heading is not
   an h1; CalcSheetView's claim heading promoted to h1 with its
   subsections demoted to keep the outline contiguous).

### Anti-vibe audit (03.1, full app, both themes)

Verified by grep over `frontend/src` plus the per-route axe/theme
matrix; tokens are the ONLY color/space source (lint-enforced), so
palette-level bans hold everywhere by construction.

| Ban | Verdict | Evidence |
|---|---|---|
| 1. gradients | PASS | zero `gradient` occurrences |
| 2. glassmorphism/backdrop-blur/translucency | PASS | zero `backdrop-filter`/`blur(`; the only alpha values are the two modal scrims (rgba dim behind command palette / shortcut sheet -- an elevation companion, no blur, not a glass surface) and a disabled-button `opacity: 0.6` |
| 3. rounded cards / radius > 2px | PASS | only `--graphite-radius-none` (0) and `--graphite-radius-sm` (2px) exist |
| 4. drop shadows beyond ONE modal elevation | PASS | exactly one shadow value, shared by the two modal dialogs |
| 5. purple/indigo accent | PASS | accent is phosphor amber; the reserved `accepted-deviation` hue (#7A8CE0) is the spec's own semantic value, never decorative |
| 6. emoji / non-ASCII in UI | PASS | zero non-ASCII bytes in src/; iconography is the 1.5px-stroke local `icons.svg` set |
| 7. decorative animation | PASS | ONE transition (ProgressRail width, `--graphite-motion-ack` 150ms, functional); global prefers-reduced-motion kill switch |
| 8. marketing voice | PASS | grep for the usual suspects (powerful/insights/seamless/effortless/...) empty; strings are engineer sentences ("No gerber layers shipped for this project (unrouted)") |

### Coherence sweep: the count bug

The dashboard's Accepted column and the project census header showed
`accepted_deviation` (unique accepted content addresses, 3 on the
fixture) while deep-linking to `?filter=accepted_deviation`, which
lists accepted ROWS (4) -- D221.2's two denominators, confused.
Fixed: linked counts are now `accepted_rows` (what the click
reveals), the project header appends "(N unique)" when the
denominators differ, the rigor bar's numerator moved to the same row
partition as its denominator, and the TUI summary prints both counts
under their exact wire-shape names. `count-coherence.spec.ts` pins
header==drill-down for every census count.

### Deferral-queue disposition table (every G2..G7 ledger row)

| Source | Item | Disposition at WO-G8 |
|---|---|---|
| WO-G2 / WOG3-F4 | ReasonCell F-number `#/design-log/` placeholder anchor | LANDED (as removal): the rule number renders as emphasized text with a title -- the placeholder was a DEAD LINK (no design-log route exists, no artifact bundles an index). Live linking re-recorded as WOG8-F1 |
| WO-G2 | HashChip permalink/deep-link to a hash detail view | REJECTED(subsumed): no hash-detail route concept exists or is needed; hashes appear inside detail views that are themselves permalinked (calc sheet, claim detail) |
| WO-G4 | calc-sheet prev/next (no ordering concept) | LANDED: prev/next over the calc book's OWN emission order (read off data, not invented); shared DetailNav component extracted (dedup law -- ClaimDetail was about to be copied; documented 03.5 gap). Playwright-pinned |
| WO-G4 | "open in files" pointer | RE-DEFERRED (WOG8-F2): still blocked on the path-exposure product decision -- WO-G1's security posture exposes content hashes, never filesystem paths; needs the coordinator |
| WO-G4 / WOG4-F1 | drawings measure/dimension overlay | RE-DEFERRED (WOG8-F3): still blocked on a lithos-side typed drawing-sheet schema (WOG4-F1 standing) |
| WO-G4 | 3D section-cut toggle | RE-DEFERRED (WOG8-F4): still gated on the spec 02.7 WASM-doctrine profiling pass for mesh clipping; not run in this WO (polish, not new engine work) |
| WO-G4 | BOM mass/cost totals row | REJECTED stands (charter 3.2: graphite never computes a total the pipeline did not emit) |
| WO-G4 | GLB real-render e2e coverage | RE-DEFERRED (with WOG8-F5): no fixture GLB exists in this repo; the component-level synthetic-GLB unit test remains the coverage |
| WOG5-F1 | optimize surfacing never live-verified (fixture has no optimize slot/STEP) | RE-DEFERRED (WOG8-F5): needs a lithos-side fixture with an optimize() slot -- out of graphite's hands |
| WOG5-F2 / WOG1-F5 / WOG6-F1 | `regolith config --json` missing; key_defaults registry import | RE-DEFERRED (lithos-side, standing): graphite's parsed-text bridge + the ONE read-only registry import remain until the CLI grows `--json` |
| WOG5-F3 | runs-home unbounded growth | LANDED: `run_history_limit` setting (default 200, 0 = keep all); start_run prunes oldest FINISHED records + log/stdout siblings; `running` never pruned; both heads' settings UIs expose it; 4 service tests |
| WOG5-F4 | reattach to a still-running run after reload | RE-DEFERRED (WOG8-F6): needs an SSE resubscribe affordance design; not in the collected queue's named items and not schedulable as polish |
| WO-G6 | doctor group-by / count badges | REJECTED(size): a 6-row catalog gains nothing from grouping; DataTable's filter covers it (flipping the WO-G6 DEFERRED honestly rather than leaving it parked) |
| WOG7-F1 | TUI active-project switcher | LANDED: palette "set active project: <name>" per discovered fleet member + dashboard drill-down retargets the active project; scan root unchanged; 2 TUI tests |
| WOG3-F3 | stale-report flag in the TitleBlock | REJECTED stands (WO-G3's ruling: the app-shell TitleBlock is fleet-scoped, no single report to key on; the per-row column is the surface) |
| WOG3-F1/F2, WOG1-F1..F3 | lithos-side provisional bridges (gate summary shapes, registry hashes, fleet lib, BOM shapes) | RE-DEFERRED (lithos-side, standing) |

### Extra polish found by the sweep itself

- MarginBar's visible label overflowed the dashboard Rigor cell into
  the Release-gate column (caught by the first real screenshot):
  new `labelVisible` prop (aria-label keeps the name) + 64px track
  min-width so the bar cannot collapse in table cells.
- The obligation explorer's flat mode now bounds its scroll viewport
  (`--flat` layout class): without it the scroll container grew to
  its content and virtualization had no viewport to window against
  (found by a Playwright probe: scrollTop pinned at 0 over 64k px).

### Release / clean-venv proof (recorded 2026-07-13)

- `make build`: vite bundle -> `graphite/server/static/` (77 files)
  -> `uv build --wheel` -> `dist/graphite-0.2.0-py3-none-any.whl`
  with all 77 static files inside (pyproject `artifacts` forces the
  gitignored bundle in -- hatchling respects VCS ignores, without it
  the wheel silently shipped no frontend).
- Fresh `uv venv` (python 3.12, no Node on the runtime path),
  pip-installed the graphite wheel + a freshly built regolith wheel;
  `graphite serve` over a fixture copy served `/api/ping`,
  `/api/projects` (real fixture data), `/` (index.html), the SPA
  fallback for a deep client route (200 text/html), the main js
  asset (399470 bytes), and unknown `/api/*` stayed a JSON 404.
- Cold start to a visible dashboard table (headless chromium against
  that server): 110/121/122 ms over 3 runs.
- NOTE: the prebuilt regolith wheel in `../lithos/target/wheels/`
  (2026-07-11) was STALE (no `regolith.backends.calc`) and had to be
  rebuilt (`maturin build --release`, writes only lithos target/)
  before the proof passed -- see WOG8-F7.

### make check (foreground, close-out)

Recorded after the final commit: backend (ruff/ty/pytest/openapi
drift), frontend (eslint/prettier/tsc/token drift/vitest/build),
api.generated.ts drift, bundle budget (new leg), Playwright system
suite including the new full-app a11y, keyboard-journeys,
performance, and count-coherence specs. See the Status line -- the
run is repeated verbatim before flipping it.

### Escalations (WOG8-Fn, for the coordinator)

- **WOG8-F1**: design-log rule linking needs a real target: either a
  lithos-side bundled design-log index artifact (shippable, content-
  addressed) or a decision that rule numbers stay text. The dead
  placeholder anchor is gone either way.
- **WOG8-F2**: "open in files" needs a product decision on exposing
  filesystem paths (WO-G1's posture: hashes only). Standing since
  WO-G4.
- **WOG8-F3**: typed drawing-sheet schema (WOG4-F1) still lithos-side;
  the dimension-overlay deferral rides on it.
- **WOG8-F4**: 3D section-cut stays behind the 02.7 profiling gate;
  nobody has profiled the mesh-clipping pass yet.
- **WOG8-F5**: a fixture (or recorded artifact set) with an optimize()
  winner, a pinned STEP, and a GLB would close the three remaining
  live-verification gaps in one stroke -- lithos-side.
- **WOG8-F6**: "reattach to running run" after a page reload (WOG5-F4)
  remains undesigned; the EventSource reconnects but the frontend
  does not resubscribe to a running run found in history.
- **WOG8-F7**: `../lithos/target/wheels/` accumulates stale regolith
  wheels that import-fail against current graphite (missing modules);
  the clean-venv release proof only passed after a fresh
  `maturin build --release`. A lithos-side `make wheel` freshness
  check (or dating the wheel in CI) would prevent the next silent
  staleness.
