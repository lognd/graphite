# graphite user guide

How to read a regolith fleet through graphite, drive builds, and walk
a calc book down to its evidence. Everything shown is what the
pipeline itself emitted -- graphite never recomputes a verdict,
margin, or total (the honesty rule): if a value is absent it renders
as an honest empty state with the reason, never a guess.

## 1. Reading the dashboard ("is my fleet healthy?")

`graphite serve <fleet-root>` scans for every `magnetite.toml` under
the root and answers fleet health in one glance -- one census row per
project:

- **Report**: `fresh` / `STALE` / `missing`. STALE means sources
  changed after the last build report was written -- rebuild before
  trusting the numbers.
- **Obligations / Discharged / Accepted / Deferred / Violated**: the
  audit-index row partition (discharged + accepted + deferred +
  violated always sums to obligations). Every count is a deep link
  into that project's obligation explorer, already filtered -- the
  count you click is exactly the number of rows you land on.
- **Rigor**: a dimension-line bar of (discharged + accepted) over
  obligations -- how much of the design is explained rather than
  deferred.
- **Release gate**: the pipeline's own release verdict, `OK` or
  `BLOCKED`.

Click a project name for its project view: shipped artifact families,
lockfile optimize winners (winner + cause), accepted deviations with
their memo text, and the release gate summary. The "accepted" census
count shows rows, with the number of unique accepted deviations in
parentheses when they differ (several expanded obligation instances
can share one accepted content address).

## 2. The obligation explorer ("why did this claim defer/fail?")

The flagship table: every obligation with its verdict badge, margin
bar (only when the claim itself states a numeric bound), model id,
reason, and subject part.

- **Group by** reason / family / part turns a wall of rows into
  scannable buckets, each with its count. The grouping lives in the
  URL, so a grouped view is shareable.
- **Filter** (the text box) and column sort work everywhere; every
  table exports CSV and copies rows (`c` with a row selected).
- **copy as report** puts the whole view on the clipboard as a
  markdown table -- paste it straight into a review ticket.
- **view** opens the claim detail: full claim source text, verdict,
  margin, inputs with provenance pins, the evidence hash chain, a
  raw-JSON toggle, and prev/next through the project's obligation
  order.

Reasons that cite a design-log rule (e.g. `D195`) show the rule
number highlighted next to the reason text.

## 3. The calc book walk ("show me the artifact")

Artifacts -> pick a project -> Calc book.

1. The **audit index** is the zero-unexplained accounting: every
   obligation and its disposition, with the summary line proving the
   rows sum to the obligation count.
2. **Calc sheets** lists every discharged sheet: claim, model,
   verdict, margin. `open sheet` drills into one.
3. A **calc sheet** is the engineering record: the claim text, the
   model and citation that discharged it, every input with its
   provenance (declared literal, config, record pin), the margin,
   and the evidence hash chain -- each hash copyable. The shipped PDF
   is one click away, and prev/next walks the book in its own order.

The other families work the same way: drawings (SVG sheets with
pan/zoom and the title block read from the shipped `.drawing.json`),
3D (GLB viewer with a STEP download when one is shipped), BOM/cost/
schedule (the staged build report's own rows, verbatim), and boards
(gerber layers with an Edge.Cuts outline preview, firmware/HDL
products). A family a project did not ship renders a named empty
state -- never a fabricated render.

## 4. Driving runs

The Runs view starts real `regolith` invocations (check / build /
ship / test / optimize) with config-aware defaults -- prefilled flags
show which config level set them.

- **Progress** is the pipeline's own typed progress events, one rail
  per phase; indeterminate phases show an indeterminate rail rather
  than a fake percentage.
- **The log pane** is the CLI's verbatim output stream (search,
  follow). Failures show the real stderr tail.
- **Cancel** sends a real SIGTERM (escalating to SIGKILL); the run
  records `cancelled`.
- **Exit summary** diffs the verdict counts before/after the run --
  both sides are real report reads.
- **History** keeps a durable record per run (status, duration, verb)
  with full log replay and re-run. Retention is bounded by the
  `run_history_limit` setting (Settings view; default 200 newest
  finished runs, 0 keeps everything).
- The status line at the bottom shows the active run from any route,
  with cancel.

## 5. Config, doctor, settings

- **Config**: every registered regolith key with its effective value
  and the level that won it (default / global / project / env /
  flag). Edits go through the real `regolith config set`; validation
  errors are the CLI's own messages. Reset writes the registered
  default back.
- **Doctor**: `regolith doctor`'s tool probe -- found/missing, version,
  path, what each tool unlocks, and the install hint for missing
  ones. Re-probe re-runs the real probe.
- **Settings**: graphite's OWN preferences (never regolith config):
  theme override, default project root, run verbosity, run history
  retention.

## 6. Scan-trace studio

The Studio route (`/studio/:projectId`, WO-G11) is the scan-trace
substrate: upload a scan image, calibrate it against a known pitch
(rung A "scale" -- two points and a distance -- or rung B
"homography" -- four+ reference points), then run the grid-capture
UI to confirm observations against the fitted grid. This route only
builds the substrate -- it never draws traced geometry and never
writes a `.rgp`/`.hema` source; the one write is the scan upload
itself. A later rung-C re-calibration pass reuses the observations
recorded here without re-tracing.

## 7. Dev tooling

The component gallery (`/dev/gallery`, dev-only -- excluded from the
production route table) renders every shared component in every
state, both themes, for visual QA while building new views. It is
never registered outside `import.meta.env.DEV`.

## 8. Keyboard map

| Key      | Action                                     |
|----------|--------------------------------------------|
| `?`      | shortcut sheet                             |
| `ctrl+k` | command palette (navigate anywhere)        |
| `j`/`k`  | move down/up in any table or list          |
| `c`      | copy the selected row                      |
| `esc`    | close the open dialog / back (TUI)         |

The TUI (`graphite tui`) carries the same map; its command palette
additionally offers "set active project" to retarget the run-console/
config shortcuts in a multi-project session.

## 9. Frontend lib notes

Small pure-function modules under `frontend/src/lib/` that back the
views above, each doing exactly one honest, non-recomputing thing:

- **`optimizeRows.ts`**: the ONE `optimize()` winner-row extraction
  from a lockfile (dedup law 04.2), shared by the project view and
  the run console's optimize-run surfacing -- filters `Lockfile`
  sections down to rows whose `cause` starts with `optimize(`,
  labeling an empty section name `(base)`.
- **`claimLimit.ts`**: parses a numeric limit + unit out of a calc
  sheet's `claim_text` for `MarginBar`'s `{value, limit, unit}`
  contract. Charter 3.2 forbids graphite from fabricating a number,
  so this reads only the literal trailing `<= <number><unit?>` the
  claim text already states and returns `null` for a non-numeric
  bound (e.g. `<= G1.span / 240`) -- callers fall back to plain text
  rather than inventing a bar.
- **`claimKey.ts`**: encodes/decodes an obligation's
  `(claim_name, subject_anchor)` pair into one opaque, reversible URL
  path segment for the claim-detail route, since a two-segment path
  breaks whenever `subject_anchor` is the empty string (react-router
  will not match an empty dynamic segment).
- **`grid.ts`** and **`calibration.ts`**: the scan-trace studio's
  fitting and grid-projection math -- see section 6 above for the
  Studio route these back. `calibration.ts` fits a similarity/
  homography transform from reference-point clicks; `grid.ts`
  projects and confirms the grid-capture observations against that
  fit.
- **`api/hooks.ts`**: the typed TanStack Query hooks that are the
  ONLY sanctioned way UI code reaches the server (spec 02.2) --
  components call these, never `api/client.ts` directly, so caching/
  invalidation has one home. Each `useXxx` query hook wraps one
  `api.getXxx`/`api.listXxx` call (query key + `enabled: Boolean(id)`
  when the route needs a project/run id that may not exist yet); each
  `useSetXxx`/`useStartRun`/`useCancelRun` mutation hook invalidates
  the query keys its own write affects. `useFleetHealth` is the one
  exception -- it fans a per-project `/health` call out via
  `useQueries` (no fleet-wide health endpoint exists) so the
  dashboard route stays a plain consumer of one hook rather than a
  manual `Promise.all`; `FleetHealthEntry` is its per-project result
  shape.
- **`api/client.ts`**: the ONE place that talks to the server (dedup
  law 04.2 / spec 02.2) -- see spec 02.2 for the generation chain its
  re-exported types alias into. `ApiError`/`ApiErrorBody` carry the
  service layer's real error verbatim (kind/message/detail) so
  callers render the real message instead of a generic failure.
  `ObligationsQuery` is the filter/group query shape `getObligations`
  takes. The `api` object is the single exported surface: one async
  method per endpoint, each routed to the matching `mocks/fixtures.ts`
  value under `VITE_USE_MOCKS=1` and to the real fetch otherwise
  (`request`/`requestJson`/`requestMultipart`/`requestBlob` are its
  four private HTTP primitives, never called directly outside this
  file). `RunLogEvent`/`RunProgressEvent`/`RunDoneEvent`/
  `RunStreamEvent` are the SSE run-event union `subscribeRunEvents`
  parses -- the frontend never re-parses `regolith.progress`'s own
  parsed shape, only relays it.
- **`mocks/fixtures.ts`**: `VITE_USE_MOCKS=1` dev-mode and vitest
  fixture data (spec 02.5), RECORDED from the real
  `tests/fixtures/timber_pavilion` and `tests/fixtures/mainboard_mx`
  build outputs so the mock shapes are real wire shapes and real
  project data, never invented (charter 3.2) -- with one exception
  called out at its own definition (`SYNTHETIC_2K_PROJECT`, a
  synthetic 2000-row obligation set for virtualization testing that
  never contaminates the recorded fixture's row counts). The three
  non-static exports (`mockObligationsFiltered`,
  `mockObligationsGrouped`, `mockScanUpload`) apply a filter/group/
  mock-hash over the recorded `AUDIT_ROWS` rather than returning
  static data.

## 10. Component reference

The frontend's component library (`frontend/src/components/`) and app
shell (`frontend/src/app/`); one home per concept (design-system rule
03.5), never forked. Each subsection below is the doc anchor its
component's `frob:doc` edge points to.

### 10.1 DataTable

The one table component: column sort, text filter, copy row/cell, CSV
export, empty/loading states, count in the header, sticky header on
scroll, j/k keyboard row navigation, and row virtualization past 1k
rows. Every table view composes this instead of hand-rolling markup.

### 10.2 VerdictBadge and verdict vocabulary

`VerdictBadge` is the single home for rendering a verdict; the five
semantic hues (discharged/violated/deferred/accepted-deviation/
excluded) are reserved for it alone. `verdict.ts` holds the `Verdict`
and `Disposition` types plus the one mapping from the wire disposition
enum (`AuditRow["disposition"]`) to the UI vocabulary -- see
`docs/spec/03-design-system.md#2-foundations` for the color values.

### 10.3 MarginBar

The dimension-line bar (spec 03.3): margins/utilizations render as a
tick-terminated bar with a value label, never a rounded progress pill.

### 10.4 HashChip

Copyable content-hash chip: short-form by default, expandable to the
full hash, one click to copy. Every artifact/report hash in the app
renders through this component rather than ad hoc `<code>` snippets.

### 10.5 ReasonCell

A named deferral/violation reason with the governing design-log rule
number highlighted where one exists. The rule number renders as
emphasized text, not a link (no design-log browsing route exists).

### 10.6 TitleBlock

The engineering-drawing title block (spec 03.3): the app's identity
element, present on every major view -- project, design hash, schema
version, report timestamp, verdict summary. Fields the current view
cannot honestly source render as a dim "--" placeholder, never a
fabricated value.

### 10.7 StatusLine

The persistent bottom status bar (spec 03.3, vim/tmux lineage):
current project, server state, last action, live progress, keyboard
hint on the right. Mounted once in `AppShell` so it is visible from
any route.

### 10.8 LogPane

Streaming log viewer: follows the tail by default, ANSI-free (stderr
color escapes are stripped, never re-interpreted), with a search
filter.

### 10.9 ProgressRail

Live progress for long operations: elapsed time, cancel, a durable
percent/step readout. Renders whatever step/percent it is given;
indeterminate phases show an indeterminate rail rather than a fake
percentage.

### 10.10 EmptyState and ErrorState

`EmptyState` (spec 03.5/04.3): every view that can be legitimately
empty gets a specific engineer-voiced message, never a blank pane.
`ErrorState`: shows the real error/stderr tail, never a sad-face
illustration or a vague "something went wrong."

### 10.11 ConfigField

The one config-field row component (04.1's "any form/config field"
floor): source attribution, reset-to-default, and a real validation
error message per field. Both the regolith config editor and
graphite's own settings compose this.

### 10.12 PanZoomFrame

Shared pan/zoom/fit frame for flat 2D graphics (spec 04.1 "any
graphic": fit/zoom controls) -- used by the drawings SVG viewer and the
boards Edge.Cuts outline preview so the interaction lives in one place.

### 10.13 GlbViewer

The GLB viewer, the one 3D renderer graphite ships. Fit + orbit are
the floor; a section-cut toggle is deferred pending a profiled
mesh-clipping pass (WASM doctrine,
`docs/spec/02-architecture.md#7-performance-and-wasm-doctrine-owner-directive-lithos-d235`).

### 10.14 DetailNav

Prev/next sibling navigation for detail views (04.1 "any detail view"
floor) -- ordered traversal through a project's obligation/calc-sheet/
etc. order.

### 10.15 PageTitle

A screen-reader-only `<h1>` for routes whose visible design heading
(TitleBlock, a micro-label span, etc.) is not itself an `<h1>`, so
every route keeps a sane document outline (WCAG 1.3.1/2.4.6).

### 10.16 ShortcutSheet

`?` opens the shortcut sheet: a modal listing every keyboard path so
keyboard-first navigation (spec 03.5) is discoverable, not tribal
knowledge.

### 10.17 CommandPalette

`ctrl+k` command palette (spec 03.3): a first-class navigation
surface, not an afterthought. The single modal elevation exemption to
the no-shadow ban applies here.

### 10.18 App shell

`AppShell`: title block, left nav, routed content, status line,
ctrl+k command palette, `?` shortcut sheet, theme switch -- every
route mounts inside its `<Outlet />`. `Nav`: the left project tree
plus the fixed top-level route list. `routes.tsx` (`router`,
`routeChildren`): the route table every view hangs off, with route
components dynamically imported per the WASM doctrine's lazy-loading
rule.

### 10.19 Theme

OS-following theme by default with a manual override (spec 03.2): the
chosen theme is applied as `data-theme` on `<html>`, which the
generated tokens CSS keys its color variables off of. `ThemeProvider`
supplies the context, `useTheme` reads/sets the `ThemeMode`/
`ThemePreference` pair.

### 10.20 RunContext

App-wide "active run" visibility: the run console publishes the run
it just started here so the StatusLine/AppShell footer can show its
rail from any route, not just while the Runs view itself is mounted.
`RunProvider` supplies the context, `useRunContext` reads/updates the
`ActiveRunState`.
