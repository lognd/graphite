# Contributing to graphite

graphite is a spec-first codebase. Before any change, read, in order:

1. `docs/workflow/README.md` -- the ground rules and the dispatch
   protocol (mirrors the lithos parent doctrine). Every work order is
   executed by that protocol: read the spec + WO first, write a full
   hierarchical plan as a checklist, drive it to zero, stay strictly
   inside scope, escalate ambiguities with a placeholder label
   (`WOGn-Fm`) instead of inventing answers.
2. `docs/spec/01..04` -- charter, architecture, design system,
   feature doctrine. These are normative; conflicts escalate to the
   coordinator, they are not resolved ad hoc in code.

## The dedup law (spec 04.2)

Before ANY new component, hook, endpoint, or utility: search for the
existing one. Two implementations of one concept is a bug. This is
enforced structurally where possible:

- All design values live in `frontend/src/tokens/tokens.ts` (one
  generator emits the CSS variables and the TUI's `tokens.py` mirror;
  a raw hex/px literal in component code fails lint).
- All wire types are generated (`openapi.json` ->
  `api.generated.ts`); a hand-written wire shape fails the drift
  check.
- All server calls go through `frontend/src/api/client.ts` (a raw
  `fetch` elsewhere fails lint).
- One component per concept (spec 03.5); a variant is a prop, never a
  copy. A genuinely new component needs its documented gap recorded
  in the WO ledger.
- `graphite/service/` is the ONE regolith boundary; nothing else
  imports regolith internals (an import-graph test enforces it).

## Definition of done

`make check` green (backend lint/type/pytest + openapi drift +
frontend lint/format/typecheck/token drift/vitest/build + generated-
types drift + bundle budget + the full Playwright system suite), and
the WO's companion-feature audit table (spec 04.1) plus the UX
definition-of-done sweep (04.3) recorded in its ledger.

Conventional commits, ASCII only, no `Co-Authored-By` lines.
