# WO-G3 -- Fleet dashboard + obligation explorer

Status: done
Spec: 01 sec. 2 (the three standing questions); 03 signature
  elements; 04 checklists. Gates: WO-G1 + WO-G2.

## Goal

The two core reading surfaces: "is my fleet healthy?" and "why
did this claim defer/fail?" -- answered in one or two
interactions.

## Deliverables

1. Fleet dashboard (/): per-project census rows (obligations /
   discharged / accepted-by-class / deferred / violated) as
   hairline tables with MarginBar rigor ratios; health-leg
   summary when a health report exists; stale-report detection
   (report older than sources -> flagged in the TitleBlock);
   drill-through everywhere.
2. Project view: census header + family presence (which artifact
   families shipped), lockfile optimize rows (winner + cause),
   waiver/memo panel (accepted deviations with memo links and
   basis text), release gate summary.
3. Obligation explorer: THE flagship table -- every obligation
   with verdict, margin (MarginBar), model id, deferral
   ReasonCell (F-number links to a bundled design-log index),
   subject part; group-by reason/family/part; the 04.1
   problem-list checklist in full ("copy as report" included);
   deep link from every dashboard count to its filtered view.
4. Claim detail: claim source text, verdict + margin, inputs with
   provenance pins, evidence hash chain (HashChips), link to calc
   sheet (WO-G4 route) and artifacts; raw JSON toggle; prev/next.
5. Playwright journeys: fleet -> project -> filtered explorer ->
   claim detail; a deferral group-by walk.

## Acceptance

Both standing questions demonstrably answered on the fixture (and
on ../lithos when present); companion audits ledgered per view;
UX definition-of-done sweep (04.3) recorded; make check green.

## Close-out ledger

Branch `wog3-dashboard-explorer`, commits `9c46b7b` (backend:
gate-summary/acceptance-ledger routes, stale-report flag),
`e61085a` (frontend: the four views + Playwright). `make check`
green (backend lint/type/test, both openapi/api.generated.ts
drift checks, frontend lint/format/typecheck/tokens/vitest/build,
9/9 Playwright specs). Backend also verified against the real
`../lithos` fleet (`scan_projects` over 162 discovered projects,
no crash, `build_report_stale` computed) -- the browser journeys
still run on the committed `timber_pavilion` fixture only, per
spec 02.6's testing doctrine (a separate integration marker would
be needed to drive Playwright against `../lithos` itself, out of
this WO's scope).

### Standing questions, interaction paths

- "Is my fleet healthy?": `/` fans one `/health` call per project
  (`useFleetHealth`) into a census table (obligations/discharged/
  accepted/deferred/violated, a MarginBar rigor ratio, the report-
  freshness column, and the release-gate verdict) -- one view, one
  glance.
- "Why did this claim defer/fail?": any dashboard/project count
  deep-links (`?filter=...`) into `/project/:id/obligations`
  (VerdictBadge + MarginBar + ReasonCell + model id), and its
  "view" link opens `/project/:id/claim/:key` for the full source
  text, inputs, and evidence chain -- two interactions from the
  fleet root, one from the project view.

### Companion-feature audits (04.1)

Fleet dashboard (ANY TABLE):
| Affordance | Status |
|---|---|
| column sort / text filter / copy row/cell / CSV export | LANDED (DataTable) |
| count in header / sticky header / j-k row nav | LANDED (DataTable) |
| empty / loading state | LANDED |
| stale-report flag | LANDED (per-row column; NOT folded into the app-shell TitleBlock, which is fleet-scoped and has no single project's report to key on -- escalated as WOG3-F3) |

Project view (ANY TABLE x2 + ANY FORM-adjacent panels):
| Affordance | Status |
|---|---|
| lockfile optimize table (sort/filter/export/empty) | LANDED |
| waiver/memo table (sort/filter/export/empty) | LANDED |
| release gate summary | LANDED (GateSummary route, WOG3-F1) |
| family presence | LANDED (derived from the existing artifact listing, read-only chip list, not a WO-G5 viewer) |

Obligation explorer (ANY LIST OF PROBLEMS, the full floor):
| Affordance | Status |
|---|---|
| group-by reason/family/part | LANDED (client-side, URL state) |
| count badges | LANDED (per-group heading count) |
| F-number/rule link | PARTIAL: links a bare `D<digits>` design-log citation when the reason text carries one (real ledger convention); no claim in the fixture carries a bundled-index F-number today, so the link target itself is a placeholder anchor (`#/design-log/...`) pending WO-G4/G6's actual design-log browsing route -- escalated as WOG3-F4 |
| copy as report (markdown) | LANDED, both whole-table and per-group |
| deep link from dashboard counts | LANDED |

Claim detail (ANY DETAIL VIEW):
| Affordance | Status |
|---|---|
| raw-JSON toggle | LANDED |
| copyable content hash | LANDED (HashChip on evidence hash, sheet digest, record pins) |
| permalink (URL state) | LANDED (`claimKey` is fully derived from the URL) |
| prev/next sibling nav | LANDED (within the project's current obligation order) |
| "open in files" pointer | LANDED at the WO-G4 merge: "open calc sheet" links into WO-G4's real viewer route (/artifacts/:projectId/calc/:sheetId), and the project view's family chips link into the WO-G4 viewers (calc/drawings) or the artifacts hub -- the pre-merge disabled affordance is gone |

### UX definition-of-done (04.3)

Empty/loading/error states designed for every new view (health
load failure, no obligations, no lockfile/ledger/gate-summary yet,
empty group). Keyboard path: DataTable's existing j/k/sort/filter
carries through unchanged; group-by/filter controls are plain
buttons/links, fully tab-reachable. Dark/light and AA are
inherited from the existing token-only component set (no new hex/
px literals -- `check:tokens` and eslint both pass). No console
errors observed in the Playwright run. Strings are engineer-voiced
(no marketing copy introduced). Playwright: `fleet-journey.spec.ts`
(the full walk + copy-as-report) and `deferral-groupby.spec.ts`
(the group-by walk, including a hard reload to prove the group
lives in the URL) both green alongside the pre-existing WO-G2
specs.

### Escalations (placeholders, never invented further)

- WOG3-F1: `GateSummary`/`AcceptanceLedgerSummary` additions
  follow the WOG1-F2/F3 provisional-bridge posture (no dedicated
  regolith model for either on-disk shape yet) -- same lithos
  coordinator gap as WOG1-F2/F3, not fixed here.
- WOG3-F2: the artifact registry's content hashes are computed
  live per file; the mock fixtures use placeholder hash strings
  for family-presence chips only (never used as a fetch key in
  mock mode) -- recorded so a future mock-data audit does not
  mistake them for real hashes.
- WOG3-F3: stale-report detection lives on the fleet dashboard's
  per-project row, not the app-shell TitleBlock (which is
  fleet-scoped, not single-project) -- if a future WO wants it in
  the TitleBlock too, that needs a per-project TitleBlock context
  the shell does not have today.
- WOG3-F4: the obligation explorer's F-number linking only fires
  on a bare `D<digits>` citation already present in the free-text
  reason; no bundled design-log index route exists yet for the
  link target itself (WO-G4/G6 territory) -- the anchor is a
  placeholder (`#/design-log/<id>`), never a fabricated absolute
  path.
