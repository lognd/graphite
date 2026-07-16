# WO-G15 -- read-only waveform/mask view in the Artifacts hub

Status: open
Repo: graphite (consumes lithos public surfaces only -- D234)
Depends: lithos WO-151 (waveform/mask record class + spec, done);
  lithos WO-152 SOFT (this WO can render off the raw record data via
  the D244 index directly; if WO-152's calc-sheet rendering has
  already landed, reuse its chart conventions rather than inventing a
  second set -- coordinate field/label naming, not implementation, per
  WO-152's own out-of-scope note).

## Goal

"Render before author" (D263's deliberate ordering, per the signal-
design recon sec. 4e): before any drawing/editing tool exists in
graphite, a `class = waveform | mask` record is visible and legible
in the Artifacts hub as a real chart -- proving the rendering
substrate before WO-G16 builds a write path on top of it.

## Deliverables

1. A waveform/mask chart component (SVG, per the charter-41-equivalent
   axis discipline this repo's spec 04 companion checklist already
   requires elsewhere: axes, ticks, unit-labeled titles -- "a polyline
   is not a chart" applies here exactly as it does to lithos's own
   renderer): segment plot for `class = waveform`, envelope band for
   `class = mask` (`kind = envelope | tolerance`).
2. Posture badge: any record whose provenance `posture ==
   "authored"` renders with the same `AUTHORED (design intent)` label
   WO-152 puts on lithos's calc sheets -- coordinate the exact label
   text with WO-152 so the same record never reads differently in
   the two views.
3. Provenance panel: tool/author/date, evidence method/trust-tier,
   axis units/quantity -- all visible beside the chart, matching the
   harness view's existing provenance-display convention
   (`HarnessView.tsx`'s pattern for tap-map/expected-signal
   provenance).
4. Wired into the Artifacts hub's existing index-driven rendering
   (WO-G9's pattern -- no new hardcoded family list; the record's
   family/viewer hint from the D244 index selects this component).

## Non-goals (this WO)

- Any write path, editing, or drawing tool -- WO-G16 owns writing;
  this WO is READ-ONLY, proving the substrate.
- Any lithos-repo change.
- Mask-overlay-on-a-claim's-own-chart (WO-152's lithos-side
  deliverable) -- this WO renders the STANDALONE record, not a claim's
  discharge chart with an overlay.

## Acceptance

- A fixture record (e.g. lithos's landed `monotonic_rise(5ms)`
  fixture from WO-151) renders as a real chart with axes/units/title
  in the Artifacts hub: a Playwright journey against a real backend
  fixture asserts the chart renders with the expected axis labels.
- The AUTHORED badge appears on an authored-posture record and does
  NOT appear on a non-authored fixture (if one exists in the test
  corpus): a test asserts both cases.
- The provenance panel shows tool/author/date/evidence fields for the
  fixture record.
- No hardcoded family list is added -- the component is reached
  through the existing index-driven viewer-hint mechanism (WO-G9's
  test that fails when a family has no route continues to pass with
  this family included).
- `make check` green; Playwright system spec covers the rendering
  journey.

### Post-completion feature audit (lithos D260 ruling 2, required)

End this WO with a recorded pass over adjacent affordances -- e.g.
whether the bring-up harness view (WO-G9's existing `harness/` family
view) should link directly to a mask cited by an expected-signal row
now that this chart component exists. Each finding argued in,
deferred with a reopen criterion, or argued out; none folded into
this WO.

## Escalation

If the WO-152 calc-sheet chart conventions have not landed by this
WO's dispatch time, proceed independently from the raw record schema
(WO-151) and name the coordination gap in the close-out for WO-152 (or
a follow-up) to reconcile -- do not block this WO on WO-152's landing.
