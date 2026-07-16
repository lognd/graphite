# WO-G11 -- scan-trace studio substrate: upload, calibration rungs A/B, grid capture

Status: open
Repo: graphite (consumes lithos public surfaces only -- D234)
Depends: lithos WO-146 (ratified `.rgp` spec -- can start against its
  fixtures before lithos WO-147 lands; does not need WO-147/148).

## The directive this closes (lithos D259/D260/D261)

The owner asked for easy profile authoring in graphite: import a scan
of a physical part or drawing, size it via reference points, trace
it, do basic 2D CAD -- feeding the lithos pipeline, with declarative
non-GUI authoring remaining fully supported. lithos's D259 ruling
settles the legal boundary (graphite AUTHORS NEW SOURCE, it never
edits semantics) and D261 adopts the scan-trace design
(`scratch_recon_graphite_cad.md`, read in full before starting). This
WO is the STUDIO SUBSTRATE half: upload, calibration, grid capture.
WO-G12 is the trace-tool/emission half; this WO does not draw
geometry, it makes the underlay and the calibration ready for it.

## Deliverables

1. New Studio route: scan upload endpoint (the `python-multipart`
   dependency is already declared,
   `graphite/server/routes/...` sibling to `settings.py`/`config.py`)
   storing the uploaded image under the project's source tree at
   `traced/scans/<name>.<ext>` and returning its blake3 hash -- the
   scan is pinned source-adjacent data from the first second it
   exists.
2. SVG editing scene with the scan as an underlay image, built on the
   existing `PanZoomFrame` component (no new pan/zoom machinery).
3. Calibration tool, RUNGS A + B only (rung C is WO-G14, v1.1):
   - Rung A (`scale`): 2+ reference points with a known distance ->
     similarity transform (uniform scale + rotation, least-squares
     over 3+ points).
   - Rung B (`homography`): 4+ points on a known planar target ->
     projective homography via DLT (closed-form linear algebra,
     dependency-free -- no external solver library).
   Both rungs report and record mm-per-px (A) or the fitted transform
   (B), plus `residual_rms_mm`/`residual_max_mm` at the object plane
   and a conservative `accuracy_bound_mm >= residual_max_mm`. Export
   is refused until calibration completes.
4. FULL grid-capture UI, recorded at EVERY rung (not just when rung C
   is fitted -- this is what lets a later re-calibration to rung C
   skip re-tracing entirely): user clicks the grid's 4 outer corners,
   enters pitch + count; the tool projects every interior intersection
   through the current fit and overlays the predictions; the user
   drags any mispredicted point and confirms the set. CONFIRMED
   positions are the recorded observations -- machine proposes, human
   confirms (the D250/WO-134B transcription-gate pattern, no CV
   dependency in v1).
5. `pitch_basis` field (`measured | certified | printed`) captured in
   the calibration UI and carried into the emitted provenance -- a
   printed paper grid's pitch error (0.2-0.5%) dominates the accuracy
   budget at this scale and must be declared, not assumed away.
6. Honesty diagnostics surfaced in the UI (mirroring the lowering-side
   checks WO-147 will enforce, so the author sees them BEFORE export,
   not just at build time): `capture_kind = photo` with `model =
   scale` is flagged (an uncorrected perspective image cannot honestly
   claim uniform scale); a declared `accuracy_bound_mm` tighter than
   the fitted residual is flagged.

## Non-goals (this WO)

- Any tracing tool (polyline, arc, fillet, circle, snapping) -- WO-G12.
- Rung C (homography+radial distortion fit) -- WO-G14, v1.1.
- Any `.rgp` file write -- this WO prepares calibration state in the
  studio session; WO-G12 owns the write-source seam and the actual
  file emission.
- Auto edge/corner detection (CV-assisted) -- deferred per the recon,
  a later reopen with its own confirm-gate design.
- Any lithos-repo change.

## Acceptance

- A scan uploads, is stored under `traced/scans/`, and its blake3
  hash is returned and displayed: a Playwright journey covers
  upload -> hash shown.
- Rung A and rung B each produce a fitted transform with residual
  numbers displayed; a synthetic-fixture test (known points, known
  expected transform) asserts the fit is numerically correct for
  both rungs.
- The grid-capture UI: clicking 4 corners + entering pitch/count
  projects interior intersections; dragging a misprediction and
  confirming updates the recorded observation set -- asserted by a
  Playwright journey and a unit test on the projection math.
- Export is blocked (UI-disabled or a clear refusal) until calibration
  is complete: a test asserts the disabled/refused state pre-
  calibration and the enabled state post-calibration.
- The `capture_kind=photo`+`model=scale` and
  `accuracy_bound_mm < residual_max_mm` warnings render visibly in
  the UI for fixtures engineered to trigger them.
- `make check` green (backend + frontend); Playwright system specs
  cover the journeys named above.
- Companion-feature audit table (spec 04.1) and UX definition-of-done
  sweep (04.3) completed per graphite's own WO ground rules.

### Post-completion feature audit (lithos D260 ruling 2, required)

End this WO with a recorded pass (design-log entry, or this repo's
equivalent close-out ledger) over adjacent affordances the landed
studio substrate now makes obvious -- e.g. whether the grid-capture
UI's per-point confirm gate should log a confirm timestamp, whether
rung A/B fit quality should surface a suggested-rung hint. Each
finding argued in, deferred with a reopen criterion, or argued out;
none folded into this WO.

## Escalation

If the DLT homography implementation needs a linear-algebra primitive
(SVD or normal-equations solve) not already available dependency-free
in the frontend toolchain, escalate the library choice to the
coordinator before adding a new dependency -- do not silently pull in
a heavy numerical library for what the recon sizes as ~100 lines of
closed-form math.
