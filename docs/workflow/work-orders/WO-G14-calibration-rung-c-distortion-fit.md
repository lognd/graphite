# WO-G14 -- calibration rung C: radial (+tangential) distortion fit (v1.1)

Status: open
Repo: graphite (consumes lithos public surfaces only -- D234)
Depends: graphite WO-G11 (grid-capture UI -- this WO fits against
  observations WO-G11 already records at every rung; no new capture
  UI needed); lithos WO-147 (the `.rgp` applier already accepts
  `model = homography+radial` params from day one -- this WO only
  needs to EMIT that model, the consumer side is already built).

## Goal

The full Zhang-style planar-target camera calibration: homography
plus non-linear radial (k1/k2, tangential p1/p2 only if the residual
demands it) lens distortion, back-calculated from the grid
observations WO-G11 already captures -- so a trace made at rung B can
be RE-CALIBRATED to rung C later with zero re-tracing (rewrite only
the `[calibration]` block; the mm geometry re-derives at the next
build from the already-stored image-space points).

## Why this is v1.1, not v1 (validation-first, stated honestly)

The parameter vector is small (8 homography DOF + k1/k2) and the DLT
result from rung B is an excellent initial guess, so convergence is
not the risk. The real cost is VALIDATION: a solver that decides real
part dimensions needs synthetic-grid fixtures with KNOWN injected
distortion and residual assertions before it is trustworthy -- an
unvalidated distortion fit silently bending a real gasket's dimensions
is exactly the "correctly-computed, lethally-wrong" failure the
project's honesty doctrine forbids. That validation burden is why
this is its own WO with its own acceptance bar, not a rider on WO-G11.

## Deliverables

1. Hand-rolled Gauss-Newton (or Levenberg-Marquardt) fit in
   TypeScript: parameter vector = homography (8 DOF) + k1, k2 (+
   p1, p2 only if a fixture's residual demands it), DLT-seeded,
   analytic Jacobian over the planar-grid reprojection residual.
   `ml-levenberg-marquardt` (MIT-licensed, GPL-compatible) is the
   SANCTIONED FALLBACK if the hand-rolled solver's validation budget
   runs long -- coordinator's call at implementation time, name which
   was used in the close-out.
2. Synthetic-grid validation fixtures: known injected distortion
   parameters, synthetic observations generated from them, asserting
   the fit RECOVERS the known parameters within a stated tolerance
   and the reported residual matches the synthetic noise floor. This
   fixture set IS the acceptance bar, not a nice-to-have.
3. "Re-calibrate an existing trace" flow: reopen an already-emitted
   `.rgp` (any rung), re-fit using its stored grid observations to
   rung C, and rewrite ONLY the `[calibration]` block -- the geometry
   sections of the file are untouched, proving no re-tracing is
   needed.
4. Emits `model = homography+radial` (with p1/p2 included only when
   used) into the `[calibration]` block, matching WO-147's already-
   built applier exactly (no new fields the applier does not expect --
   confirm against WO-147's landed schema before finalizing field
   names).

## Non-goals (this WO)

- Any new tracing or capture UI -- reuses WO-G11's grid-capture
  observations as-is.
- Any lithos-repo change -- WO-147 already accepts this rung; this WO
  only needs to emit it correctly.
- Auto edge/corner detection.

## Acceptance

- Synthetic-grid fixtures with known injected k1/k2 (and p1/p2 where
  exercised) recover the injected parameters within the WO's stated
  tolerance: a test suite asserts this for at least 3 distinct
  synthetic distortion profiles (mild, moderate, and a near-zero
  control case proving the fit does not "invent" distortion where
  none exists).
- The reported `residual_rms_mm`/`residual_max_mm` after a rung-C fit
  are lower than (or, for the zero-distortion control, statistically
  indistinguishable from) the rung-B fit on the same observations: a
  test asserts this ordering.
- Re-calibrating an existing `.rgp` from rung B to rung C rewrites
  ONLY the `[calibration]` block: a test diffs the file before/after
  and asserts the geometry/holes/datums/provenance-other-than-
  calibration sections are byte-identical.
- The emitted `model = homography+radial` params match the field
  names/shape WO-147's Rust applier expects: a shared fixture (or a
  cross-repo schema check the coordinator arranges) confirms this.
- `make check` green; the validation fixture suite is part of the
  gate, not a manual/optional check.

### Post-completion feature audit (lithos D260 ruling 2, required)

End this WO with a recorded pass over adjacent affordances -- e.g.
whether the re-calibrate flow should surface a "did this actually
improve things" comparison view to the user, whether the demo story
(WO-G13 sec. 7e) benefits from a rung-B-to-rung-C live comparison
beat. Each finding argued in, deferred with a reopen criterion, or
argued out.

## Escalation

If the hand-rolled solver's convergence proves unreliable on real
(non-synthetic) fixtures within the validation budget, escalate the
`ml-levenberg-marquardt` fallback decision to the coordinator rather
than shipping a solver that passes synthetic fixtures but is
untrustworthy on real grids -- the validation bar in deliverable 2 is
the actual gate, synthetic-fixture passing is necessary but the
close-out must also state real-fixture behavior honestly.
