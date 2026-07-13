# WO-G4 -- Artifact viewers: calc book, drawings, 3D, BOM, boards

Status: open
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
