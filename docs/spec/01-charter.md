# 01 -- graphite charter (normative)

graphite is the interaction surface for the lithos toolchain: the
place a human WATCHES, DRIVES, and READS an engineering build.
Extracted from lithos (lithos D233) as a sibling product, the
feldspar posture: graphite consumes ONLY regolith's public
surfaces and can never reach into its internals.

## 1. Mission

One sentence: make the rigor legible -- every obligation, verdict,
margin, artifact, and audit trail the toolchain produces should be
browsable, watchable, and understandable by an engineer in
seconds, with zero setup beyond `graphite`.

## 2. Product doctrine

1. TASK-FIRST, not feature-first: the home surfaces answer the
   three standing questions -- "is my fleet healthy?", "why did
   this claim defer/fail?", "show me the artifact" -- in one or
   two interactions each.
2. USER-FRIENDLY means: zero-config launch (`graphite` finds the
   project/fleet from cwd), progressive disclosure (summary ->
   drill-down -> raw JSON always available), keyboard-complete
   navigation, empty/loading/error states designed for every
   view, copy-paste-quotable everything (hashes, reasons, paths).
3. THE READER IS AN ENGINEER: never dumb down numbers; show
   units, margins, and provenance pins; link every verdict to its
   calc sheet and every artifact to its content hash.
4. TWO HEADS, ONE BODY: the web GUI and the textual TUI are two
   renderers over the SAME client/service layer and the SAME
   design tokens; a capability existing in one and not the other
   is a recorded gap, not an accident.

## 3. Hard constraints (inherited, non-negotiable)

1. LOCALHOST ONLY, ZERO EXTERNAL REQUESTS at runtime (lithos
   AD-31): the server binds localhost; the built frontend bundle
   is fully self-contained (fonts, icons, scripts inlined or
   bundled -- no CDN, no telemetry, no analytics, ever).
2. Read-mostly honesty: graphite renders what regolith reports;
   it never recomputes verdicts, never re-derives margins, never
   fabricates a number (the lithos AD-7/D220 posture applied to
   presentation). Driving actions (build/ship/test/optimize) are
   subprocess invocations of the real CLI.
3. stdout is data, logs to stderr, in every CLI entry point.
4. ASCII only in every repo file.
5. Errors are values (typani Result) in the Python service layer;
   typed errors at the API boundary; exceptions only for bugs.

## 4. The professionalism bar

Typed end to end (one schema source, sec. 02), tested at three
levels (unit, integration, system/browser), accessible (WCAG AA),
themable (dark + light, both designed), and documented. "Works on
my machine" UI, untyped fetch blobs, and hand-maintained duplicate
type definitions are all refused by construction.

## 5. Relationship to lithos work orders

lithos WO-119 (D228) provides the progress-event PRODUCER inside
regolith; graphite consumes it (WO-G5). lithos WO-120 (VS Code)
consumes the same channel -- graphite and the editor never invent
private protocols. The census/calc/audit JSON shapes come from
regolith's generated schema models -- graphite depends on the
regolith wheel and re-exports nothing.
