# 04 -- Feature doctrine (normative workflow law)

## 1. The companion-feature audit (owner directive, lithos D234)

Every feature -- however small -- lands WITH a companion audit: a
short table in the WO/commit ledger enumerating the adjacent
affordances a professional tool would pair with it, each marked
LANDED / DEFERRED(where) / REJECTED(why). The audit is the
feature's definition of done, not a nicety.

Standing companion checklists (the floor, not the ceiling):

- ANY TABLE: column sort; text filter; copy row/cell; CSV export;
  empty state; loading skeleton; count in the header; sticky
  header on scroll; keyboard row navigation.
- ANY DETAIL VIEW: raw-JSON toggle; copyable content hash;
  permalink (URL state); prev/next sibling navigation; "open in
  files" pointer to the on-disk artifact.
- ANY LONG OPERATION: live progress (D228); cancel; elapsed time;
  a durable record in the run history; failure state with the
  actual stderr tail, not a sad-face illustration.
- ANY LIST OF PROBLEMS (deferrals, violations, waivers): group-by
  (reason/family/part); count badges; link to the governing
  design-log rule (F-number) where one exists; "copy as report"
  (markdown table to clipboard).
- ANY GRAPHIC (3D, drawing, gerber): fit/zoom controls; measure
  or dimension readout where meaningful; export/download of the
  underlying artifact; content-hash caption.
- ANY FORM/CONFIG FIELD: source attribution (which config level
  set it -- the `regolith config` where-doctrine); reset to
  default; validation with the real error message.

## 2. The dedup law

Before ANY new component, hook, endpoint, or utility: search the
codebase for the existing one (frob search / grep). Two
implementations of one concept is a bug (lithos house rule).
Enforcement is structural where possible: the token lint (03.4),
the generated-types drift check (02.2), the component-library
gate (03.5), and a `make check` leg that greps for banned
duplication patterns (hand-written wire types, raw hex colors,
raw fetch calls outside the api layer).

## 3. UX definition of done (every view, every WO)

Empty, loading, error, and partial states designed; keyboard path
exists; dark AND light verified; AA contrast verified; no console
errors; Playwright journey green; strings are engineer-voiced;
the companion audit table is in the ledger.
