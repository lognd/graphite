# graphite workflow -- ground rules + dispatch protocol

This mirrors the lithos workflow (its docs/workflow/README.md is
the parent doctrine); deltas only:

## Ground rules

1. Normative order: docs/spec/01..04 here, then lithos's
   architecture where inherited (AD-31 localhost doctrine, house
   engineering rules). Charter conflicts escalate to the
   coordinator.
2. Every WO lands with: `make check` green (backend lint/type/
   tests + frontend lint/typecheck/vitest + drift checks),
   Playwright system specs for the journeys it names, the
   companion-feature audit table (spec 04.1), and the UX
   definition-of-done sweep (04.3).
3. Status vocabulary: the lithos enumerated set (todo/open,
   in-progress, honest-partial/partial, phase, done, cut).
4. ASCII only; conventional commits; no Co-Authored-By lines.
5. Design tokens/components/types follow the dedup law (04.2) --
   reviewers reject duplication on sight.

## Dispatch protocol (every agent, every WO)

Read, in order, BEFORE any code: this file; docs/spec/01..04; the
WO file; the named references in the WO. Produce a full
hierarchical plan as a checklist covering every acceptance
criterion BEFORE implementing any leaf; drive it to zero; stay
strictly inside the WO's scope; ambiguities are escalated to the
coordinator with placeholder labels (WOGn-F1, ...), never
invented. Agents work only in their assigned worktree, commit
incrementally, never push, never spawn subagents, never stash,
and run all checks in the foreground.

## Work-order dependency graph

WO-G1 (backend API + schema chain) and WO-G2 (frontend
foundation) are parallel roots. WO-G3..G6 need both. WO-G7 (TUI)
needs G1 + the token generator from G2. WO-G8 (system polish)
is last. lithos WO-119 (progress producer) gates the LIVE half of
WO-G5; its static run-history half is un-gated. WO-G9 (render any
family) closed cycle 36.

Cycle 37, second batch (authoring surfaces, lithos D261/D263;
WO-G10 stays retired -- cancelled before dispatch, D253.5):

lithos WO-146 (ratified `.rgp` spec)
  -> WO-G11 (studio substrate: upload, calibration rungs A/B, grid
     capture) -- can start against WO-146's fixtures; does not need
     lithos WO-147/148
     -> WO-G12 (trace tools + `.rgp` emission + THE write-source
        seam -- built ONCE here, WO-G16 is its second consumer)
        -> WO-G13 (round-trip + pipeline UX; needs lithos WO-148 for
           the artifact-index rendering half)
     -> WO-G14 (calibration rung C distortion fit, v1.1; independent
        of G13)

lithos WO-151 (waveform/mask record class)
  -> WO-G15 (read-only waveform/mask view -- render before author)
     -> WO-G16 (the signal-design editor; consumes WO-G12's write-
        source seam, extended to the `records/` path)

## Work order index

- [WO-G1](work-orders/WO-G1-backend-api.md) -- Backend API v1 +
  the one-schema-source chain
- [WO-G2](work-orders/WO-G2-frontend-foundation.md) -- Frontend
  foundation: tokens, shell, component library
- [WO-G3](work-orders/WO-G3-dashboard-and-explorer.md) -- Fleet
  dashboard + obligation explorer
- [WO-G4](work-orders/WO-G4-artifact-viewers.md) -- Artifact
  viewers: calc book, drawings, 3D, BOM, boards
- [WO-G5](work-orders/WO-G5-run-console.md) -- Run console: drive
  builds with live progress
- [WO-G6](work-orders/WO-G6-config-doctor.md) -- Config editor +
  doctor + settings
- [WO-G7](work-orders/WO-G7-tui-refresh.md) -- TUI refresh on the
  shared body
- [WO-G8](work-orders/WO-G8-system-polish.md) -- System polish:
  a11y, performance, docs, release
- [WO-G9](work-orders/WO-G9-render-any-family.md) -- Render ANY
  artifact family, via lithos's typed artifact index
- [WO-G11](work-orders/WO-G11-scan-trace-studio.md) -- scan-trace
  studio substrate: upload, calibration rungs A/B, grid capture
- [WO-G12](work-orders/WO-G12-trace-tools-and-write-seam.md) --
  trace tools + `.rgp` emission + the write-source seam
- [WO-G13](work-orders/WO-G13-trace-roundtrip-ux.md) -- round-trip
  + pipeline UX for traced profiles
- [WO-G14](work-orders/WO-G14-calibration-rung-c-distortion-fit.md)
  -- calibration rung C: radial (+tangential) distortion fit (v1.1)
- [WO-G15](work-orders/WO-G15-waveform-view.md) -- read-only
  waveform/mask view in the Artifacts hub
- [WO-G16](work-orders/WO-G16-waveform-editor.md) -- the signal-
  design editor: PWL/step + envelope/tolerance authoring
