# WO-G7 -- TUI refresh on the shared body

Status: open
Spec: 01 sec. 2.4 (two heads, one body); 03.4 (token mirror);
  lithos D228. Gates: WO-G1 (service layer) + WO-G2 (token
  generator).

## Goal

The textual TUI becomes the second renderer over the SAME service
layer and tokens -- config, dashboard, and run-watching parity
for terminal-only sessions.

## Deliverables

1. Port the TUI onto `graphite/service/` (delete any duplicated
   report-reading/subprocess code the old TUI carried -- the
   dedup law applied retroactively).
2. Consume the generated `tui/tokens.py` (semantic names ->
   textual styles); the status line + title block idioms
   translated to terminal furniture.
3. Surfaces: fleet dashboard (census table), obligation list with
   verdict colors + reason grouping, run console with per-phase
   progress bars (the D228/log-derived channel shared with
   WO-G5's adapter -- ONE parser), config view with source
   attribution.
4. Keyboard map consistent with the web app's (j/k, ?, ctrl+k
   palette where textual permits).
5. The WO-G6 gap table worked: parity or recorded honest gaps.

## Acceptance

TUI runs against the fixture with zero duplicated service code
(grep-proven in the ledger); token drift check covers the mirror;
pytest coverage for every screen's data path; make check green.
