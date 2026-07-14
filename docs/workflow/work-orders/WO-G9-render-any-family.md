# WO-G9 -- Render ANY artifact family, via lithos's typed artifact index

Status: open
Repo: graphite (consumes lithos public surfaces only -- D234)
Depends: lithos WO-130 (MERGED on lithos master): the typed artifact
  index + closed viewer vocabulary + `regolith artifacts [--json]`.

## The finding this closes (lithos F145)

graphite carries a HARDCODED family list. It renders 5 of 8 artifact
families, and previews only the `Edge.Cuts` layer of what is now a
14-layer fab set. Concretely, today:

- the board-identity SILKSCREEN block (name, rev, design short-hash),
  which lithos's owner visually accepted at the WO-124 gate, is
  INVISIBLE in graphite -- `Boards.tsx` lists layers in a table and
  previews only the outline, through a deliberately minimal parser
  (its own comment: no arcs, no apertures, not RS-274X -- the WOG4-F2
  residual);
- the entire `harness/` bring-up family (tap map, expected signals,
  `bringup.md`, sigrok capture configs) has NO viewer at all -- not
  even a family entry;
- the `mech` family shipped for cycles without ever being registered.

lithos grew two families and twelve board layers in one cycle and the
consumer had no way to know. A viewer that must be TAUGHT each new
family will always lag, and the lag is invisible until someone looks.

## The fix (lithos D244/AD-41 gives us the surface)

Every lithos package now ships `artifact_index.json`: per file --
`family`, `kind`, `relpath`, `content_hash`, `bytes`, `media_type`, a
`viewer` hint from a CLOSED vocabulary (`svg` | `raster` | `gerber` |
`glb` | `table` | `markdown` | `json` | `text` | `binary`), and
`source_refs`. `regolith artifacts <package> [--json]` publishes it
without re-running a build.

## Deliverables

1. DELETE the hardcoded family list. Drive the Artifacts hub from the
   index: families and their files come from the package, not from a
   TypeScript constant. A family graphite has never heard of appears,
   is navigable, and renders through its viewer hint.
2. One renderer per viewer hint, with an HONEST FALLBACK LADDER
   (`table`/`json`/`text`/`binary`): a file graphite cannot richly
   render still shows its name, family, size, hash, and WHY it has no
   rich view. A blank pane is a bug; "here is the truth I have" is the
   product.
3. FULL GERBER RENDERING (closes WOG4-F2): real RS-274X -- apertures,
   arcs (G02/G03), polygons -- with all 14 layers selectable/toggleable
   and correctly stacked, so the SILKSCREEN (refdes, polarity, the
   board-identity block) is visible and legible at 1:1. Per graphite's
   own architecture (spec 02 sec. 7, the WASM doctrine), profiled
   gerber parsing is an explicit WASM candidate -- put it there rather
   than hand-rolling more RS-274X in TS.
4. The `harness/` bring-up family gets a real view: the tap map as a
   table (channel -> kind -> target -> connector pin), the expected
   signals WITH their provenance refs and honest absences shown AS
   absences with their reasons, `bringup.md` rendered, capture configs
   downloadable.
5. The calc book, drawings (SVG), 3D (GLB), BOM/cost keep working --
   but now sourced through the index like everything else, not through
   bespoke lookups.
6. A test that FAILS if a family in the index has no route: the
   consumer must never silently drop a family again. That test is the
   whole point of this WO -- it is the machine-checked version of the
   lesson.

## Non-goals (D253 -- the owner's ruling, and it is load-bearing)

graphite is READ-ONLY for engineering content. It does NOT edit
placements, poses, dimensions, choice points, or selects; it does NOT
write lithos's override ledger (that channel is PARKED on lithos's
`experimental/injection-channel` branch and its GUI exposure is
cancelled). The ONLY write surface graphite will ever have is the
AESTHETIC layer (diagram/BDF block layout, sheet annotation anchors,
theme, view state) -- and that is a separate, later WO with its own
charter. Do not build any part of it here.

## Acceptance

- A fleet package's every artifact is reachable and rendered or
  honestly explained -- zero blank panes, zero dropped families.
- The silkscreen board-identity block is VISIBLE and legible in the
  board view at 1:1 (the thing that was invisible when this was
  written).
- The harness family is browsable end to end.
- The "no route for an index family" test fails when a route is
  removed (prove it bites).
- graphite's own `make check` green; the real-backend Playwright rig
  covers the new views.


## Close-out (done)

Landed on branch `wog9` (4 commits, merged): index-driven Artifacts hub
(the hardcoded family list is gone), real RS-274X gerber rendering
(apertures, arcs, regions, flashes; unmodeled macros set an honest
`partial` flag rather than fabricating a shape), the `harness/` family
view, and a no-route-for-family test that reds when the catch-all route
is removed. The board-identity silkscreen block reads
`MainboardMcu 878fb7b92bd2 / REV: N/A` at 1:1 -- the block that was
invisible when this WO was written.

### Findings

- WOG9-F1: RS-274X parsing is in TypeScript, marked provisional. The
  largest fixture layer parses in low single-digit ms, under the
  profiled threshold that would MANDATE the `wasm/` crate (spec 02
  sec. 7). Promote verbatim when a real fleet board crosses it.
- WOG9-F2: WITHDRAWN BY THE COORDINATOR. The dispatch reported that
  graphite's gate "could not have been green before this branch"
  (mock fixtures missing a required `unit` field). It does not
  reproduce: `tsc -b` exits 0 at the v0.2.0 tag (6ac1b5a). The `unit`
  field is one this branch itself introduced while mirroring lithos's
  calc schema, so the branch fixed its OWN breakage. Recorded because
  a false "it was already broken" claim is worse than the breakage --
  it launders a self-inflicted red into an inherited one, and the next
  person reads it as history.
- WOG9-F3: the mocked Playwright rig serves a 3-layer subset of the
  14-layer fab set; the real-backend route serves all 14 (asserted by
  a backend test). Cosmetic, recorded.
