# WO-G4 -- Artifact viewers: calc book, drawings, 3D, BOM, boards

Status: done
Spec: 03 (signature elements -- dimension lines, title blocks);
  04.1 ANY-GRAPHIC checklist. Gates: WO-G1 + WO-G2.

## Goal

Every artifact family the toolchain ships is viewable in place --
the "show me the artifact" standing question.

## Deliverables

1. Calc book browser: audit index as the entry (every obligation
   -> disposition, zero unexplained -- render that accounting);
   calc sheet view (the engineering calc sheet: claim, model +
   citation, inputs w/ provenance pins, margin, verdict, evidence
   chain) rendered from the JSON with the PDF one click away;
   acceptance rows link memo text.
2. Drawings: shipped SVG sheets inline (pan/zoom/fit); PDF
   download; per-sheet title-block metadata surfaced.
3. 3D: GLB viewer (the existing offline viewer.html's renderer
   ported INTO the app as a component -- one viewer, not two);
   fit/orbit/section toggle if cheap; STEP download with hash
   caption.
4. BOM/cost/schedule: DataTable renderings with unit-aware
   columns, mass/cost totals row, unsourced-cell honesty
   preserved (empty means the pipeline said empty, with its
   reason), CSV export.
5. Boards: gerber layer list with the honest unrouted label;
   render Edge.Cuts outline preview (SVG from the gerber's own
   data if a cheap parse exists, else the shipped preview
   artifact only -- never a fabricated render); firmware/HDL
   products listed with named absences shown as such.
6. Playwright: open each artifact family from a claim/dashboard
   and assert content renders; zero-external-request holds with
   viewers live.

## Acceptance

Every family in the fixture project viewable; 04.1 graphic
checklist ledgered per viewer; honesty rule verified (nothing
rendered that the package does not contain); make check green.

## Close-out ledger

### Fixture coverage note (read first)

`tests/fixtures/timber_pavilion` is a CIVIL (calcite) project: it
ships a real calc book, drawings, and a staged build report, but
NO GLB/STEP (mech/electrical-only artifact), NO gerbers, and NO
firmware/HDL products. Per the WO's own instruction, families the
fixture lacks are covered by mocks (`src/mocks/fixtures.ts`) +
unit/component tests instead of a live end-to-end fixture path:

- Calc book (audit index + calc sheets): REAL fixture data, full
  Playwright coverage.
- Drawings (SVG/PDF/title block): REAL fixture data, full
  Playwright coverage.
- BOM/cost/schedule: REAL fixture data (`frame_lock_rows` +
  `cost_estimates` from the staged build report) -- no per-part
  mass/cost line-item table exists in this civil fixture (that
  richer shape belongs to a mech/cuprite project this repo does
  not have a fixture for); rendered honestly as what the report
  actually carries.
- 3D (GLB viewer): NO fixture data. `GlbViewer` component is real
  (three.js GLTFLoader + OrbitControls, lazy-imported), verified
  by a unit test on the honest-absence path (`GlbViewer.test.tsx`)
  and a Playwright assertion that the empty state renders for this
  project. The render path itself (an actual GLB parsed and
  rendered to a WebGL canvas) is NOT exercised by any automated
  test in this repo -- jsdom has no WebGL context and no fixture
  GLB exists to drive a real Playwright pixel assertion. Documented
  gap, not a silent skip.
- Boards (gerbers/firmware/HDL): NO fixture data. The Edge.Cuts
  cheap-parse logic (`gerberOutline.ts`) is covered by a standalone
  vitest unit suite with synthetic gerber text (move/draw/arc/flash
  cases); the route itself is verified via Playwright against the
  fixture's honest "unrouted"/"no firmware/HDL" empty states.

### Companion-feature audit (spec 04.1) -- per viewer

**Calc book (ANY TABLE + ANY DETAIL VIEW)**

| Item | Status |
|---|---|
| Column sort/filter/CSV export/count/sticky header/j-k nav | LANDED (via shared `DataTable`) |
| Empty state (no calc book / no discharged sheets) | LANDED |
| Calc sheet raw-JSON toggle | LANDED |
| Copyable content hash (sheet digest, evidence hash, pins) | LANDED (`HashChip`) |
| Permalink (URL state) | LANDED (`/artifacts/:project/calc/:sheetId`) |
| Prev/next sibling navigation | DEFERRED(WO-G5 or later -- no ordering concept over calc sheets is defined yet; would need to be invented, not read off data) |
| "Open in files" pointer | DEFERRED(needs a filesystem-path-revealing endpoint; the security posture (WO-G1) deliberately exposes only content hashes, never paths, so this needs a product decision first) |
| Acceptance rows link memo text | LANDED (`ReasonCell` renders the waiver detail string verbatim; the memo itself is a doc path, not a fetchable artifact in the current registry -- REJECTED as a live link for now, same path-exposure reason as above) |

**Drawings (ANY GRAPHIC)**

| Item | Status |
|---|---|
| Fit/zoom/pan | LANDED (`PanZoomFrame`, shared with Boards) |
| Measure/dimension readout | DEFERRED(the `.drawing.json` dimensions array is not yet surfaced as an overlay -- WOG4-F1 blocks a clean typed read of it) |
| Export/download of underlying artifact | LANDED (PDF download link) |
| Content-hash caption | LANDED |

**3D (ANY GRAPHIC)**

| Item | Status |
|---|---|
| Fit/orbit | LANDED (OrbitControls + fit button) |
| Section-cut toggle | DEFERRED(spec 02.7: not "cheap" without a profiled mesh-clipping pass; profiling that pass is the WASM-doctrine gate, not skippable) |
| STEP download w/ hash caption | LANDED (renders when a `.step` sibling is listed; honest absence otherwise) |
| Content-hash caption | LANDED |

**BOM/cost/schedule (ANY TABLE)**

| Item | Status |
|---|---|
| Column sort/filter/CSV export/count/sticky header/j-k nav | LANDED (via `DataTable`) |
| Unit-aware columns | LANDED where the report carries units (frame lock rows are unitless slot/value/cause) |
| Mass/cost totals row | REJECTED for this fixture -- charter sec. 3.2 forbids graphite computing a total the pipeline itself didn't emit, and the civil build report carries no per-part cost/mass array to sum, only a profile->hash pointer. Would LAND once a report shape carries actual line items. |
| Unsourced-cell honesty | LANDED (empty cost/lock arrays render a named EmptyState with the reason, never a blank table) |

**Boards (ANY GRAPHIC + ANY TABLE)**

| Item | Status |
|---|---|
| Gerber layer list (sort/filter/export/hash) | LANDED (via `DataTable`) |
| Honest "unrouted" label | LANDED (EmptyState names it explicitly) |
| Edge.Cuts outline preview | LANDED (cheap parse, `gerberOutline.ts`) -- explicitly PARTIAL-labeled when arcs/flashes are present, never silently dropped |
| Fit/zoom/pan on the outline | LANDED (`PanZoomFrame`) |
| Firmware/HDL named absences | LANDED |

### Honesty-rule verification

Every view was audited for the specific failure mode "renders
something the package doesn't contain":

- Calc book/sheet/drawings/BOM: sourced ONLY from
  `/api/projects/{p}/calc/*`, `/artifacts`, `/build-report` --
  no client-side synthesis of any value; margins/verdicts/hashes
  render verbatim strings from the wire model.
- Drawings title block: read defensively off the shipped
  `.drawing.json` bytes; a missing/malformed field renders `--`,
  never a guess (see `readTitleBlock`).
- 3D: `GlbViewer` renders `EmptyState` when `glbBytes` is `null`
  -- verified by both a vitest unit test and the Playwright spec
  against the civil fixture (which correctly has no GLB).
- Boards: gerber layers, Edge.Cuts preview, and firmware/HDL are
  ALL derived from the project's own `/artifacts` listing; nothing
  is fabricated when the fixture has none of these (verified by
  Playwright asserting the exact "no gerber layers shipped" /
  "no firmware/HDL products shipped" strings).
- The Edge.Cuts parser explicitly flags `partial` output rather
  than claiming a complete render when it meets an arc/flash it
  does not understand.

### Profiling + WASM doctrine (spec 02.7) decisions

- No JS-side hot loop in this WO's code was profiled above ~16ms
  on the fixture data (calc/drawing/BOM payloads are small JSON;
  the gerber parser is a single-pass regex scan over the fixture's
  scale). Nothing here crosses the WASM threshold today.
- 3D rendering's actual hot path (GPU rasterization inside
  three.js's `WebGLRenderer`) is not JS-side geometry math, so it
  is explicitly OUT of scope for a `wasm/` crate per 02.7 sec. 1.
- `three` (npm, vendored locally, no CDN) is lazy-imported only
  when a route mounts `GlbViewer`; the production build confirms
  this lands in its own chunk (`three.module-*.js`, ~695 kB,
  `GLTFLoader-*.js`, `OrbitControls-*.js`) separate from the main
  bundle -- verified via `npm run build` output.
- Escalation WOG4-F1 (marked-provisional bridge, see
  `DrawingView.tsx`): the drawing sheet schema (title_block,
  dimensions, views) has no OpenAPI-exposed equivalent yet, unlike
  `CalcSheet`. Recommend a `/api/projects/{p}/drawings` route
  mirroring `calc.py`'s pattern so the frontend can drop the
  defensive `unknown`-typed JSON parse for a generated type.
- Escalation WOG4-F2 (see `gerberOutline.ts`): if a future project
  needs full RS-274X (arcs, apertures) for the Boards outline
  preview, that parse should be profiled and, if hot, proposed as
  a wasm32 build of lithos's existing gerber/geometry crate (dedup
  seam, 02.7 sec. 3) rather than hand-rolling more of the format
  here.

### Dedup law

`PanZoomFrame` is the ONE fit/zoom/pan implementation, shared by
Drawings and Boards. `DataTable` (WO-G2) is reused as-is for every
tabular family (calc audit/sheets, BOM, boards/firmware) -- no new
table component was written. `HashChip`/`ReasonCell`/`VerdictBadge`
/`MarginBar`/`EmptyState`/`ErrorState` (all WO-G2) are reused
throughout; no duplicate hash-chip/verdict/reason rendering exists.
`api/client.ts` gained the new endpoints as typed methods; no
component calls `fetch` directly (enforced by
`graphite/no-raw-fetch`, verified green).

### Route-collision note (WO-G3)

This WO's routes live entirely under `/artifacts/...` (a new
`Artifacts` hub plus `/artifacts/:projectId/{calc,drawings,model,
bom,boards}[...]` children) and did not touch `Project.tsx` or
`Obligations.tsx`. `frontend/src/app/routes.tsx` and
`frontend/src/app/Nav.tsx` were NOT touched beyond the pre-existing
single `artifacts` top-level entry (already present from WO-G2);
new routes were added as additive lines in `routes.tsx`'s
`children` array only, per the coordinator's union-at-merge note.

### `make check`

Green: backend (ruff/ty/pytest/openapi-drift), frontend
(lint/format/typecheck/vitest 67 passed/build/token-drift/
api-drift), Playwright system rig (13 passed, including the new
`artifact-viewers.spec.ts` and the re-verified zero-external-
request assertion with every viewer mounted).
