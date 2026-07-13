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
WO-G5; its static run-history half is un-gated.
