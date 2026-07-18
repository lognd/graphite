# 05 strata system model

## What this is

`design/graphite.strata` is graphite's own topology written in strata
(frob's provable system-design language) and checked by `frob sys
audit`. It models the REAL components and data paths only -- every
node's `code` glob, every flow, and every capability (`may`) below was
verified by reading the source it points at, not copied from the spec's
aspirations. Where the spec and the code disagree, this model follows
the code and the discrepancy gets a ticket.

The model is enforced truth: `frob sys audit` gates on the declared
capability surface matching what the scanners actually find in each
node's code glob, and on every claim (`assert`, `assume`, `boundary`)
holding against the flow closure. See T-0014 for the pilot ticket.

## Topology summary

Six code-bearing nodes (browser SPA, server, service layer, TUI, core
CLI, build scripts), one external tool node (the `regolith` CLI), and
one on-disk store (the fleet artifact tree). The service layer is the
single sanctioned crossing to regolith -- both UIs sit strictly above
it, exactly as `docs/spec/02-architecture.md` section 4 prescribes.

## Known gaps not gamed away

Findings the audit reports that trace to frob-side limitations are
documented here and in the pilot wiring report rather than silenced
with false declarations:

- TS/JS capability scanning may not cover `frontend/src/**` (frob
  T-0169 in flight); the browser node's `may` set is derived from a
  direct grep of the frontend source, so it is honest even if the
  scanner cannot yet confirm it.
- The `regolith_cli` node has no `code` glob (it is an external wheel
  and CLI, not source in this repo); frob has no managed/config-only
  node marker yet (frob T-0172).
- There is no waiver channel for sys-audit findings yet (frob T-0174),
  so any residual finding stays visible in `frob sys audit` output and
  is tracked by ticket instead.

## Audit end state

As of the pilot commit, `frob sys audit` evaluates 9 claims -- 5
proved, 4 assumed (the capability-obligation discharges above), 0
refuted -- and reports 11 residual named gaps, all traceable to
frob-side limitations rather than to this model or this code:

- 6x THREAT002: the quality views' sink taxonomy has no entry for the
  `client_storage` and `html_render` capability kinds (both are real
  registry kinds the browser node must honestly declare).
- 3x SYS101 on `browser`: `fetch_url`, `client_storage`, `html_render`
  declared but never observed -- the capability scanner does not yet
  cover TypeScript under `frontend/src/**` (frob T-0169).
- 2x SYS101 on `core`: `fs` (artifacts.py uses `Path.read_text`, a
  read-side call the scanner has no needle for) and `net` (cli.py's
  `uvicorn.run` socket bind, also un-needled) declared but never
  observed. Both capabilities are real; under-declaring to force a
  green audit would be gaming the model.
