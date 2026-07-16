# WO-G12 -- trace tools + `.rgp` emission + THE write-source seam

Status: open
Repo: graphite (consumes lithos public surfaces only -- D234)
Depends: lithos WO-146 (ratified `.rgp` spec); graphite WO-G11
  (studio substrate + calibration -- this WO draws geometry over the
  underlay WO-G11 built and consumes its recorded calibration).

## The seam this WO owns (cross-surface prerequisite, D259/D260/D263)

graphite has NO source-file write endpoint today -- the only existing
writes are app settings, project config, and run start/cancel; none
of them write into the project's source tree
(`scratch_recon_graphite_cad.md` sec. 1; `scratch_recon_signal_design.md`
sec. 5). Two authoring surfaces need one this cycle: this one (scan
trace) and the signal-design editor (lithos-side WO-151/152,
graphite-side WO-G16). Per D263's ruling, the seam is built ONCE,
here, by whichever surface is implemented first -- this WO -- and
WO-G16 is its SECOND consumer, not a re-implementer. Build it as a
general-purpose, purpose-allowlisted endpoint, not a `.rgp`-only one.

The seam's contract (D259 sec. 5, restated as the enforceable rule
this WO's tests must prove):

1. Writes strictly INSIDE the project source tree; the endpoint
   refuses any path outside it (path-allowlisted by purpose --
   `traced/` for this surface, `records/` reserved for WO-G16).
2. New-file or reopen-OWN-emitted-file only: the endpoint refuses to
   overwrite a file it did not itself emit (checked by a marker or by
   requiring the incoming save to match the shape of a prior emission
   from this same endpoint family) -- it never silently clobbers a
   hand-authored file.
3. Every write to an EXISTING file shows a diff-before-write in the
   UI; saving does not trigger a compile (D259 sec. 5.2 -- the user
   reviews, then builds separately through the existing run console).
4. The endpoint touches nothing the D244 artifact index does not
   already describe as belonging to the project.

## Deliverables

1. THE write-source seam: one server endpoint, purpose-allowlisted,
   implementing the four contract points above. Its own spec text
   lands in graphite's `docs/spec/02-architecture.md` (the charter
   sec. 3.2 authoring-carve-out amendment named in the recon:
   "graphite may author NEW source; it still never recomputes or
   overrides derived truth").
2. Trace tools over the WO-G11 underlay: polyline (line segments at
   any angle), arc, fillet (arc between adjacent segments), circle
   tool (for round holes), snapping (angle snap at 0/15/30/45/90 in
   the profile frame, point-merge snap, tangent-arc snap) -- every
   snap shows the residual it absorbed (e.g. "snapped 0.3mm -- within
   the accuracy bound").
3. Hole loops (ONE nesting level, matching the language's own rule)
   and named exported datum points/axes, drawn the same way as the
   outer outline.
4. The `.rgp` writer: emits `traced/<name>.rgp` (geometry in image
   space + the WO-G11 calibration block + the full mandatory
   provenance record) through the write-source seam, plus offers the
   one-line `.hema` snippet (`profile <Name>:
   extern("traced/<name>.rgp", rgp)`) via clipboard and an optional
   new-file save (`traced/<name>_profile.hema`) -- never editing an
   existing hand-authored file.
5. Live source pane: the exact `.rgp` TOML text that will be written
   is visible beside the trace canvas at all times (the D260 ruling 1
   discipline -- the canvas is an input method, the text is the
   artifact).

## Non-goals (this WO)

- Round-trip (reopening an emitted `.rgp` with its underlay) --
  WO-G13.
- Rung C calibration -- WO-G14.
- Any 3D modeling, constraint solving, or assemblies -- permanently
  out of studio scope per the recon sec. 7b.
- Auto edge-detection -- deferred.
- Records/waveform write support through this seam -- reserved for
  WO-G16 as the seam's second consumer; this WO builds the mechanism
  generally but does not implement the records/ path.

## Acceptance

- The write-source seam refuses a path outside the project source
  tree: a test posts a traversal-style path and asserts refusal.
- The write-source seam refuses to overwrite a file it did not emit:
  a test creates a hand-authored file at the target path, attempts a
  save, and asserts refusal (or a diff-confirm gate that a human must
  explicitly accept, per the coordinator's implementation choice --
  name which in the close-out).
- A diff-before-write is shown for any save to an existing file: a
  Playwright journey asserts the diff UI appears before the write
  commits.
- Tracing a closed outline with at least one hole loop and one datum,
  exporting, produces a valid `.rgp` file matching WO-146's schema:
  parse it with the same schema validation WO-147 will use (a shared
  fixture or a hand-checked schema match) and assert it validates.
- The `.hema` snippet is offered via clipboard and optional file save,
  and matches the exact syntax `profile <Name>:
  extern("traced/<name>.rgp", rgp)`.
- The live source pane updates in real time as the trace changes: a
  Playwright journey draws a segment and asserts the pane's text
  changes to match.
- `make check` green; Playwright system specs cover the full
  trace-to-export journey.

### Post-completion feature audit (lithos D260 ruling 2, required)

End this WO with a recorded pass over adjacent affordances -- e.g.
whether the snap-residual display should also warn when residuals
approach the calibration's accuracy bound, whether the write-source
seam's purpose-allowlist mechanism is generalized enough for WO-G16
to consume without modification (name any gap found for WO-G16 to
carry, do not fix it here). Each finding argued in, deferred, or
argued out.

## Escalation

If the write-source seam's generality (built here, consumed by
WO-G16) turns out to require a design choice WO-G16's own recon
(`scratch_recon_signal_design.md` sec. 5) did not anticipate, escalate
to the coordinator before narrowing the seam to `.rgp`-only -- the
whole point of building it once is that WO-G16 does not re-implement
it.
