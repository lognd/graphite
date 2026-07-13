# WO-G8 -- System polish: a11y, performance, docs, release

Status: open
Spec: 01 sec. 4 (the professionalism bar); 04.3 (definition of
  done); 03 (both themes). Gates: WO-G3..G7 merged. LAST.

## Goal

The whole product passes the bar as a system, not per-view: one
coherent app an outside engineer can install, learn from its own
docs, and trust.

## Deliverables

1. Full a11y pass (axe on every route, keyboard-only walkthrough
   of every journey, focus management audit, AA re-verified both
   themes).
2. Performance: obligation explorer virtualized past 1k rows;
   cold start < 2s to dashboard on the fixture; bundle budget
   recorded with a size check in make check.
3. Anti-vibe audit of the FULL app against 03.1 (every ban,
   every route, both themes), ledgered.
4. Cross-view coherence sweep: shared shortcuts identical
   everywhere, terminology matches the lithos glossary (verdict
   names, family names), every count in a header agrees with its
   drill-down.
5. Docs: README (install, quickstart, screenshots), docs/guide
   for users (reading the dashboard, driving runs, the calc book
   walk), CONTRIBUTING (the dispatch protocol pointer + dedup
   law).
6. Release: wheel build with bundled static assets verified from
   a clean venv on a machine without node; version 0.2.0 tagged.

## Acceptance

Playwright suite green including the zero-external-request and
a11y specs; clean-venv wheel install serves the full app; the
companion-audit ledgers from G2..G7 re-verified as landed or
honestly re-deferred; make check green.
