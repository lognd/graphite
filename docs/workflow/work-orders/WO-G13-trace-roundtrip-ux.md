# WO-G13 -- round-trip + pipeline UX for traced profiles

Status: open
Repo: graphite (consumes lithos public surfaces only -- D234)
Depends: graphite WO-G12 (trace tools + `.rgp` emission + write
  seam); lithos WO-148 (Python realizer/artifact-index consumption --
  needed for the artifact-index rendering deliverable below; the
  round-trip deliverable does not need it).

## Goal

Closing the demo loop: a user can reopen a trace they (or a
teammate) already emitted with its scan underlay intact, hand off to
a real build through the existing run console, and see the traced
part render inside its family in the Artifacts hub -- all without
leaving graphite.

## Deliverables

1. Round-trip: reopening an emitted `.rgp` file restores the FULL
   editing session -- geometry, holes, datums, provenance, the scan
   reference (hash + relpath), and the calibration block -- so the
   underlay reappears exactly as it was. This is a REQUIREMENT (D259/
   D260: round-trip is not a feature, every authoring surface must
   satisfy it), not an optional convenience.
2. "Review and build" hand-off: from the studio, deep-link into the
   existing run console (the same subprocess `regolith build`
   mechanism every other graphite build uses -- no new build path) to
   drive a build of the package containing the freshly-saved trace.
   Saving a trace never itself triggers a compile (D259 sec. 5.2,
   unchanged from WO-G12).
3. Render the `traced` family from the D244 artifact index (WO-148's
   lithos-side row makes this possible): the post-build view shows the
   traced profile INSIDE its consuming part's drawing/STEP view, not
   as an isolated file -- closing the demo loop end to end.
4. Demo polish: the espresso-machine group-gasket journey
   (`scratch_recon_graphite_cad.md` sec. 7e) runs cleanly start to
   finish -- upload scan on a 10mm grid, calibrate, trace outer ring +
   bore + two locating notches, export, git-diff-narrate, build from
   the console, see the gasket seated in the artifact hub against
   `group_head.hema`'s existing `gasket_seat`.

## Non-goals (this WO)

- Rung C calibration -- WO-G14.
- Any new tracing tool or snap behavior -- WO-G12 owns the tool set;
  this WO only reopens and re-renders what WO-G12 can already emit.
- Any lithos-repo change (this WO consumes WO-148's landed
  artifact-index row as given).

## Acceptance

- Reopening an emitted `.rgp` restores every field of the editing
  session: a Playwright journey exports a trace, reloads the studio
  route with that file, and asserts the geometry/holes/datums/
  underlay/calibration all match the pre-export state exactly.
- Re-saving a reopened, UNCHANGED trace produces a byte-identical (or
  canonically-equivalent, coordinator's call recorded in close-out)
  `.rgp` file -- a test diffs the two files.
- The run-console hand-off starts a real build from the studio view: a
  Playwright journey (against the real backend, not the mocked rig)
  drives this end to end.
- The `traced` family renders inside the Artifacts hub, positioned
  with its consuming part (not as an orphaned file): a Playwright
  journey against a real fixture build asserts this.
- The full espresso-gasket demo journey runs green end to end as one
  Playwright system spec.
- `make check` green.

### Post-completion feature audit (lithos D260 ruling 2, required)

End this WO with a recorded pass over adjacent affordances the
closed loop now makes obvious -- e.g. whether a "re-trace this part"
shortcut from the artifact hub view back into the studio is worth a
future WO, whether the demo journey surfaced any rough edge in the
run-console hand-off worth a follow-up. Each finding argued in,
deferred with a reopen criterion, or argued out; none folded into
this WO.

## Escalation

If round-trip reveals that WO-G12's emitted `.rgp` shape is missing a
field needed to fully restore the editing session (discovered only by
trying to reopen it), escalate to the coordinator rather than
silently widening WO-146's ratified schema -- a schema change is a
cross-repo, spec-first decision.
