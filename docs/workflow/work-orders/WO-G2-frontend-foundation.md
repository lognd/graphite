# WO-G2 -- Frontend foundation: tokens, shell, component library

Status: done
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

## Close-out ledger

Branch: `wog2-frontend-foundation` (worktree at
`.worktrees/wog2`). `make check` green (backend pytest/ruff/ty legs
unchanged + `frontend-check`: eslint, prettier --check, tsc -b,
token/tui-mirror drift check, vitest x51, vite build; +
`frontend-system-test`: Playwright x6 -- zero-external-request,
shell navigation, gallery a11y in both themes).

### Escalations recorded

- WOG2-F1: `frontend/src/api/api.generated.ts` is a hand-written,
  clearly-marked PROVISIONAL stand-in for the real
  regolith -> FastAPI -> openapi.json -> openapi-typescript chain
  (WO-G1, parallel root per docs/workflow/README.md's dependency
  graph). Covers only `ProjectSummary`, `FleetHealthSummary`,
  `ObligationRow` -- the shapes the shell/dashboard/project routes
  need. Delete wholesale and replace with the generated file at
  integration; `src/mocks/fixtures.ts` (VITE_USE_MOCKS=1 data) is
  representative, not copied from a real WO-G1 fixture since none
  existed yet.
- WOG2-F2: dark-theme accent/verdict hues match spec 03.2's raw
  hex values as given. Three LIGHT-theme hues from spec 03.2 fail
  WCAG AA at small text size on the drawing-paper background
  (#F4F2EC) and were darkened in `tokens.ts` (documented inline):
  accent `#9C6A1E` (4.17:1) -> `#8A5A16` (5.28:1); verdict.deferred
  `#9C7A1A` (3.60:1) -> `#7D5F14` (5.33:1); verdict.excluded
  `#6B7076` (4.46:1) -> `#5A5F67` (5.74:1). Caught by the
  Playwright axe smoke on the gallery; flagged for the design
  system spec owner to reconcile 03.2's stated light-theme values
  with this WO's contrast fix.

### Anti-vibe audit (spec 03.1, verified via the gallery + source read)

| Ban | Status | How verified |
|---|---|---|
| 1. No gradients | PASS | grep for `gradient` across `frontend/src` -- zero hits; every fill in tokens.css/component CSS is a flat `var(--graphite-color-*)`. |
| 2. No glassmorphism/backdrop-blur/translucency | PASS | grep for `blur`/`backdrop-filter` -- zero hits. Command palette/shortcut-sheet backdrop is a flat `rgba(0,0,0,0.5)` scrim, not a blur. |
| 3. No floating rounded cards; radius 0/2px only | PASS | `radius` token only has `none`(0px)/`sm`(2px); every panel/table/chip uses hairline borders (`--graphite-border-width-hairline`) for structure, not shadow-floated cards. |
| 4. No drop shadows except one modal elevation | PASS | grep for `box-shadow` -- only in CommandPalette.css and ShortcutSheet.css (the two modal surfaces); no shadow anywhere else. |
| 5. No stock purple/indigo, no blue-to-purple | PASS | Full palette audit of tokens.ts: paper/raised/ink grays, phosphor amber accent, and the five verdict hues (green/red/amber/blue-violet-for-accepted-deviation is intentionally desaturated per spec 03.2, not a decorative purple, and reserved for verdict badges only) -- no decorative purple usage anywhere else. |
| 6. No emoji; small custom line-glyph icon set; text labels first | PASS | grep for common emoji ranges across `frontend/src` -- zero hits (repo-wide ASCII-only rule enforces this transitively); no icon set introduced yet in this WO (text labels only) -- deferred to whichever later WO first needs a glyph, not invented speculatively here. |
| 7. No decorative animation; functional only, <=150ms, prefers-reduced-motion honored | PASS | Only transitions: ProgressRail fill width (`--graphite-motion-ack` = 150ms, a state-change acknowledgment) and CommandPalette/ShortcutSheet have none; `global.css` sets near-zero durations under `prefers-reduced-motion: reduce`. |
| 8. No placeholder marketing voice | PASS | Every EmptyState/ErrorState string read back is an engineer's sentence (e.g. "Run graphite from a directory containing a magnetite.toml", "error[E0308]: mismatched types") -- no "powerful insights" phrasing anywhere. |

### Companion-feature audit (spec 04.1) -- app shell

| Standing checklist | Status |
|---|---|
| Keyboard-complete navigation | LANDED -- j/k in DataTable, ctrl+k palette, ? shortcut sheet, Escape to close either. |
| Empty/loading/error states designed | LANDED -- EmptyState/ErrorState components; every route skeleton uses EmptyState with a specific message. |
| Dark/light theme, OS-following + override | LANDED -- `app/theme.tsx`, persisted in localStorage, verified via Playwright in both themes. |
| Progressive disclosure (raw JSON always available) | DEFERRED(WO-G3/G4) -- no detail views exist yet in this WO to disclose from. |
| Copy-paste-quotable hashes/reasons | LANDED -- HashChip (copy+expand), ReasonCell (F-number link). |

### Companion-feature audit (spec 04.1) -- DataTable ("any table" checklist)

| Item | Status |
|---|---|
| Column sort | LANDED |
| Text filter | LANDED |
| Copy row/cell | LANDED (`c` key copies the active row; tab-separated) |
| CSV export | LANDED |
| Empty state | LANDED (composes EmptyState) |
| Loading skeleton | LANDED (text state; a richer skeleton is a REJECTED scope-creep for this WO -- no real loading-shape data exists yet to skeleton against) |
| Count in header | LANDED |
| Sticky header on scroll | LANDED |
| Keyboard row navigation (j/k) | LANDED |

### Companion-feature audit -- other components (abbreviated; each is a single-concept component per spec 03.5, no "any table/detail/long-op" checklist applies beyond what's noted)

| Component | Notes |
|---|---|
| VerdictBadge | Full-label and compact variants; verdict color is the ONLY place semantic verdict hues are used (enforced by review, not lint). |
| MarginBar | Dimension-line tick-terminated bar per spec 03.3; over-limit state uses the violated verdict hue. |
| HashChip | Copy (LANDED) + expand (LANDED); permalink/deep-link to a hash detail view is DEFERRED(WO-G5, artifact detail views). |
| ReasonCell | F-number link is a `#/design-log/<F>` placeholder route -- DEFERRED(WO-G8 or wherever a real design-log viewer lands) since no such route exists yet. |
| LogPane | Follow-tail (LANDED), search/filter (LANDED), ANSI-strip (LANDED). Cancel/elapsed-time belong to ProgressRail, not LogPane, per the one-component-per-concept rule. |
| ProgressRail | Elapsed time, cancel, indeterminate state all LANDED; durable run-history record is DEFERRED(WO-G5, real run history). |
| EmptyState / ErrorState | Composed by every route skeleton and DataTable; retry callback on ErrorState LANDED. |

### Token law + dedup law enforcement (verified)

- `frontend/eslint-rules/no-raw-design-values.js`: local eslint
  rule banning hex-color and bare-px string/template literals
  outside `tokens.ts`/generator scripts -- wired into
  `eslint.config.js`, verified passing (`npm run lint` green with
  zero raw-value errors across all components).
- `frontend/eslint-rules/no-raw-fetch.js`: bans `fetch(...)`
  outside `src/api/client.ts` -- verified passing.
- `frontend/scripts/build-tokens.ts` / `check-tokens-drift.ts`:
  the one generator + drift check for both
  `frontend/src/tokens/tokens.css` and `graphite/tui/tokens.py`;
  wired into `make frontend-check`, verified passing.
