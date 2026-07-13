# WO-G2 -- Frontend foundation: tokens, shell, component library

Status: open
Spec: 03 (design system -- NORMATIVE, read twice; the anti-vibe
  rules are hard acceptance criteria); 02 (stack); 04 (doctrine).

## Goal

The Vite+React+TS app exists with the full design-token system,
the app shell (title block, navigation, status line, command
palette, theming), and the component library -- everything later
WOs compose, nothing they fork.

## Deliverables

1. Scaffold: Vite + React 18 + TS strict + react-router +
   TanStack Query + vitest/testing-library + Playwright + eslint/
   prettier; `VITE_USE_MOCKS` fixture mode (02.5); fonts bundled
   (JetBrains Mono + Inter, self-hosted, subset).
2. Tokens (03.4): `tokens.ts` -> CSS variables build + the
   generated `graphite/tui/tokens.py` mirror (one generator +
   drift check); the no-raw-hex/px lint live in eslint config.
3. App shell: TitleBlock, left nav (projects tree), StatusLine,
   command palette (ctrl+k), shortcut sheet (?), dark/light theme
   switch (OS-following + override), route skeleton for every
   WO-G3..G6 surface with designed EmptyStates.
4. Component library v1 (03.5): DataTable (sort/filter/copy/CSV/
   sticky header/keyboard nav -- the 04.1 table checklist IS its
   spec), VerdictBadge, MarginBar (dimension-line rendering),
   HashChip, ReasonCell, LogPane (ANSI-free, follows tail,
   search), ProgressRail, ErrorState, EmptyState -- each with
   vitest coverage and a gallery route (/dev/gallery, dev-only)
   rendering every component in every state, both themes.
5. Typed API layer: generated types consumed via a single
   `api/client.ts` (TanStack Query hooks; raw fetch outside it is
   a lint error); mocks recorded from the WO-G1 fixture.
6. Playwright rig: zero-external-request assertion spec (fails on
   any non-localhost request, 02.5), shell navigation journey,
   theme + a11y smoke (axe) on the gallery.

## Acceptance

Gallery renders the whole library in both themes with AA contrast
verified; anti-vibe audit of the gallery ledgered (every 03.1 ban
checked); make check green incl. token/type drift checks;
companion audit tables in the ledger for shell + each component.
