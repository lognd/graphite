# graphite -- Documentation

File index for everything under `docs/` (T-0002, retrofitting the
feldspar DOC001 precedent). Every doc lives under exactly one of the
three subtrees below; each is linked here or from
`docs/workflow/README.md`'s work-order index, so nothing in `docs/`
is unreachable from a root.

## Reading order

1. [User guide](guide.md) -- reading the dashboard, driving runs, the
   calc book walk.
2. `spec/` -- the normative product spec (charter, architecture,
   design system, feature doctrine, strata system model), in reading
   order below.
3. `workflow/` -- process: ground rules + dispatch protocol +
   agent-executable work orders (`workflow/work-orders/WO-Gnn-*.md`).

## Spec index

- [01-charter.md](spec/01-charter.md) -- product charter: what
  graphite is, personas, non-goals.
- [02-architecture.md](spec/02-architecture.md) -- the one-schema
  source chain, service/server/tui layering, the regolith boundary.
- [03-design-system.md](spec/03-design-system.md) -- tokens,
  components, the dedup law.
- [04-feature-doctrine.md](spec/04-feature-doctrine.md) -- companion-
  feature audit table, UX definition-of-done sweep.
- [05-strata-system-model.md](spec/05-strata-system-model.md) --
  `design/graphite.strata` system model (T-0014).

## Workflow index

- [workflow/README.md](workflow/README.md) -- ground rules, dispatch
  protocol, work-order dependency graph, and the work-order index
  (every `workflow/work-orders/WO-Gnn-*.md` linked there).
