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

## 6. Keyboard map

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
