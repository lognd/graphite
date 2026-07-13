# 03 -- Design system (normative)

The visual identity: a professional engineering workstation.
"Computer nerd" executed with print-grade discipline -- the
reference points are terminal UIs, engineering drawings, and
phototypeset manuals, NOT contemporary SaaS. It must read as
deliberately designed, timeless, and unmistakably graphite.

## 1. The anti-vibe rules (hard bans)

These are the tells of generic generated UI; every one is banned:

1. NO gradients (background, text, border -- none).
2. NO glassmorphism, backdrop blur, or translucency effects.
3. NO floating rounded-corner cards in seas of whitespace; radius
   tokens are 0 or 2px, structure comes from RULES (1px lines),
   not shadows.
4. NO drop shadows except a single elevation for modals/menus.
5. NO stock purple/indigo accent, no blue-to-purple anything.
6. NO emoji anywhere in the UI; iconography is a small custom set
   of 1.5px-stroke line glyphs, used sparingly -- text labels
   first.
7. NO decorative animation; motion is functional only (state
   change acknowledgment, <=150ms, honors prefers-reduced-motion).
8. NO placeholder marketing voice ("Powerful insights at a
   glance"); every string is an engineer's sentence.

## 2. Foundations

- TYPE: monospace-forward. UI chrome and data both set in a
  bundled programmer's face (JetBrains Mono; text sizes 11/12/13/
  14/16/20, line-height on a 4px baseline grid); long-form prose
  (docs panes) in a bundled humanist sans (Inter) -- two families
  total, both self-hosted. Tabular numerals EVERYWHERE numbers
  align. All-caps micro-labels (11px, +0.08em tracking) for
  section headers, the engineering-drawing convention.
- GRID: 4px base unit; 8px component rhythm; data-dense by
  default (comfortable != airy); max content width unconstrained
  -- engineers have wide monitors; tables may fill them.
- COLOR, dark theme (primary): graphite paper `#111417`, raised
  plane `#171B1F`, ink `#D7DEE4`, dim ink `#8A949D`, hairline
  `#2A3138`; ACCENT: phosphor amber `#E8A33D` (interactive,
  focus, selection). Semantic verdict hues are RESERVED and never
  decorative: discharged `#4CAF6E`, violated `#E05252`,
  deferred `#D9B23D`, accepted-deviation `#7A8CE0`, excluded
  `#8A949D`.
- COLOR, light theme: drawing-paper `#F4F2EC`, ink `#1A1D20`,
  hairline `#C9C4B8`, same accent family re-tuned for contrast;
  the light theme reads as an engineering DRAWING (title-block
  aesthetic), not a bleached dark theme.
- Both themes ship WCAG AA; theme follows OS with a manual
  override.

## 3. Signature elements (what makes it unmistakably graphite)

1. THE TITLE BLOCK: every major view carries an engineering-
   drawing title block (project, design hash short-form, schema
   version, timestamp of the report being viewed, verdict
   summary) -- the app's identity element.
2. THE STATUS LINE: a persistent bottom status bar (vim/tmux
   lineage): current project, server state, last action, live
   progress; keyboard hint on the right.
3. DIMENSION-LINE DETAILS: margins/utilizations render as
   dimension-line bars (tick-terminated, value labeled) rather
   than rounded progress pills.
4. HAIRLINE TABLES: data tables with 1px row rules, no zebra
   striping, fixed-width numeric columns, units in the header not
   the cells.
5. KEYBOARD-FIRST: `?` opens the shortcut sheet; every list is
   j/k navigable; the command palette (ctrl+k) is a first-class
   citizen, not an afterthought.

## 4. Token law (dedup enforcement)

ALL color/space/type values live in ONE token source
(`frontend/src/tokens/tokens.ts`, exported to CSS variables and
mirrored by a generated `graphite/tui/tokens.py` for textual --
one generator, drift-checked). A hex literal or px literal in
component code is a lint error. The TUI uses the same semantic
names (accent, ink, verdict.discharged, ...) mapped to its
palette.

## 5. Component library rules

One component per concept, composed, never forked: `DataTable`,
`VerdictBadge`, `MarginBar` (the dimension-line bar), `HashChip`
(short hash + copy + expand), `ReasonCell` (named deferral with
F-number link), `TitleBlock`, `StatusLine`, `LogPane`,
`ProgressRail`, `EmptyState`, `ErrorState`. A new component
requires a documented gap in this list (04's audit); a variant
requires a prop, not a copy.
