# WO-G3 -- Fleet dashboard + obligation explorer

Status: open
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
