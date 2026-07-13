# WO-G6 -- Config editor + doctor + settings

Status: open
Spec: 04.1 ANY-FORM checklist; the regolith config where-doctrine
  (lithos D163/WO-59). Gates: WO-G1 + WO-G2.

## Goal

The environment surfaces: what is configured (and WHY -- which
level), and what tools the host actually has.

## Deliverables

1. Config view: the 4-level precedence rendered honestly (every
   key: effective value + source attribution level, the `where`
   doctrine); edit writes through the real `regolith config` CLI
   (never a private file write); reset-to-default; validation
   errors are the CLI's own messages.
2. Doctor view: `regolith doctor --json` rendered -- external
   tools (kicad, verilator, ghdl, feldspar pack, ...) with
   found/missing states, versions, and the honest degradation
   notes; re-probe button.
3. graphite's own settings (theme override, default project
   root, run verbosity): stored in ~/.graphite/, never mixed into
   regolith config; same form checklist.
4. TUI parity notes: whatever this WO ships, record the TUI gap
   table for WO-G7 (charter 2.4 -- a capability in one head and
   not the other is a recorded gap).
5. Playwright: config edit round-trip (set via UI, verify via
   CLI, reset); doctor render on the fixture env.

## Acceptance

Every field carries source attribution; edits round-trip through
the real CLI; 04.1 form checklist ledgered; make check green.
