# WO-G16 -- the signal-design editor: PWL/step + envelope/tolerance authoring

Status: open
Repo: graphite (consumes lithos public surfaces only -- D234)
Depends: lithos WO-151 (waveform/mask record class + spec, done);
  graphite WO-G15 (read-only view, done -- this WO reuses its chart
  component rather than building a second one); graphite WO-G12 (THE
  write-source seam -- WO-G16 is its SECOND consumer, per D263's
  ruling that the seam is built once by whichever authoring surface
  lands first; this WO does NOT re-implement the seam's path-
  allowlist/diff-before-write/new-or-own-file contract, it EXTENDS the
  allowlist to cover `records/` and consumes the existing endpoint).

## Goal

A user draws a piecewise-linear/step waveform or an envelope/
tolerance mask directly in graphite, sees the exact TOML that will be
written in a live source pane, saves it through the WO-G12 write
seam, and can reopen its own emitted record byte-stably -- with the
tool structurally unable to emit any evidence posture other than
`authored`.

## Deliverables

1. PWL/step waveform editor (`class = "waveform"`, `kind =
   "nominal"`): click to add a breakpoint, drag to move, sidebar
   table mirroring the canvas 1:1, `interp = linear | hold` toggle,
   axis unit + quantity picked ONCE at creation and shown permanently
   on the canvas axes (never silently changeable -- a unit re-declare
   is an explicit action with a before/after confirm, since
   rescaling data silently is exactly the ambiguity the project's
   naming/units doctrine forbids).
2. Envelope/tolerance tool (`class = "mask"`): draw a nominal, drag a
   band width (uniform or per-segment) for `kind = envelope`
   (`{t, lo, hi}`) or `kind = tolerance` (`{t, value}` + `tol`, with
   the FIXED derivation rule lo/hi = value -/+ tol, per WO-151's
   spec -- do not invent a second derivation convention). The source
   pane shows which kind will be emitted.
3. Live source pane: the exact TOML record beside the canvas at all
   times, matching the `.rgp` studio's own live-pane convention
   (WO-G12) -- one house pattern for "canvas is input, text is
   artifact" across both authoring surfaces.
4. Save through the WO-G12 write-source seam, extended to allow the
   `records/` path (the seam's purpose-allowlist mechanism, not a new
   endpoint) -- diff-before-write for existing files, new-or-own-file-
   only, never triggering a compile.
5. Round-trip: reopening an emitted waveform/mask record rebuilds the
   breakpoints/band exactly; a hand-edited record that still validates
   opens identically to a graphite-emitted one (the same
   indistinguishability proof D259 requires of the profile-trace
   surface); one that does NOT validate is REFUSED with the real
   lithos diagnostic text surfaced in the UI, never silently
   normalized. Byte-stable re-save on an unchanged reopen: canonical
   key order + fixed float format.
6. Posture unreachability, enforced at the UI/API layer as well as
   the record-model layer (WO-151 already enforces it at the
   constructor; this WO must not expose any UI path that could ask
   for a different posture): the ONLY posture this editor's save path
   can produce is `authored` -- no menu, config, or hidden field
   offers `measured` or `model_derived`.

## Non-goals (this WO)

- Any modification to the write-source seam's core contract (path-
  allowlist enforcement, diff-before-write, refuse-overwrite-of-
  non-own-files) -- WO-G12 built it; this WO only widens the
  allowlist.
- Clocks, digital bus patterns, stimulus/expectation pairs, trigger
  markers, freehand/spline drawing, in-GUI claim editing, `from_fn`
  parameterized families -- all CUT per the signal-design recon's
  census (sec. 4a), several permanently (in-GUI claim editing has NO
  reopen criterion, ever -- D246/D253/D259). Do not implement any of
  them.
- Any lithos-repo change.
- The measured-trace importer -- deferred, yoked to charter 40 sec.
  6's live-capture reopen trigger; not this WO.

## Acceptance

- Drawing a 5-breakpoint waveform and saving produces a valid record
  matching WO-151's schema: parse/validate it against the same models
  WO-151 landed (shared fixture or cross-repo schema check).
- The live source pane updates in real time as breakpoints are
  added/moved: a Playwright journey asserts this.
- A byte-stable round-trip: draw -> save -> reopen -> re-save without
  changes produces an identical file (the required Playwright journey
  named in the signal-design recon sec. 4e, deliverable WO-G11 there
  -- this WO under its D263 renumbering).
- Opening a hand-crafted, INVALID record shows the real lithos
  diagnostic text in the UI and refuses to load it into the editor as
  if it were valid: a test asserts this.
- No UI path can produce a `measured` or `model_derived` posture
  record: a code-level test (or an exhaustive UI-surface test)
  confirms the save payload's posture field is hardcoded/unreachable-
  otherwise.
- Unit re-declaration requires an explicit confirm showing before/
  after meaning; accidental unit changes are not silently applied: a
  Playwright journey asserts the confirm gate appears.
- `make check` green; Playwright journeys cover draw -> save ->
  reopen -> re-save, and the refusal-to-open-invalid-record path.

### Post-completion feature audit (lithos D260 ruling 2, required)

End this WO with a recorded pass over adjacent affordances -- e.g.
whether the envelope tool's per-segment band width should get a
"copy width to all segments" convenience, whether the demo beat
(signal-design recon sec. 4f: draw the soft-start envelope, save,
watch the existing `stays_within` claim cite real data) surfaced any
UX rough edge worth a follow-up WO. Each finding argued in, deferred
with a reopen criterion, or argued out; none folded into this WO.

## Escalation

If the write-source seam's `records/` allowlist extension surfaces a
contract question WO-G12's own design did not anticipate (e.g. two
different authoring surfaces both wanting to reopen-and-rewrite the
same record file), escalate to the coordinator rather than deciding a
shared-seam policy unilaterally inside this WO.
