# WO-G7 -- TUI refresh on the shared body

Status: done
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

---

## Close-out ledger (branch `wog7-tui-refresh`)

### Acceptance table

| Criterion | Verdict | Evidence |
|---|---|---|
| Port onto `graphite/service/`, delete duplicated code | PASS | `graphite/tui_app.py` (WO-59 monolith: raw `subprocess.run([sys.executable, "-m", "regolith.cli", ...])`, a private `_BUILD_REPORT_RELPATH` JSON read, and its own `regolith.config` calls) DELETED along with `tests/test_tui.py`; every new screen imports only `graphite.service.*`, `graphite.tui.*`, `regolith.progress` (the public D228 parser), `textual`, and stdlib -- grepped in the ledger below |
| Consume `tui/tokens.py` | PASS | `graphite/tui/widgets.py`'s `VerdictBadge`/`TitleBlock`/`StatusLine` read colors from `graphite.tui.tokens.COLOR_DARK` only (no hex literal in any screen module); the token file itself is untouched (still WO-G2-generated) |
| Fleet dashboard (census table) | PASS | `graphite/tui/screens/dashboard.py`: `DataTable` over `graphite.service.discovery.scan_projects` (the SAME discovery module the web fleet route uses); empty scan root renders 0 rows honestly |
| Obligation list, verdict colors + reason grouping | PASS | `graphite/tui/screens/obligations.py`: `read_audit_index` -> summary counts (`balanced()` included) + rows grouped by `detail` reason for `deferred`/`violated` dispositions, `calc_sheet`/`accepted_deviation` listed as-is |
| Run console, per-phase progress bars, ONE parser | PASS | `graphite/tui/screens/run_console.py` imports `regolith.progress.parse_line` directly (in-process, same function the WO-G5 SSE route imports -- no HTTP hop needed since the TUI and service layer share one process); one `ProgressBar` per phase tag; cancel via `cancel_run`; exit summary includes the before/after verdict diff via `compute_verdict_diff` |
| Config view, source attribution | PASS | `graphite/tui/screens/config.py`: config tab (`list_config`/`set_config`, per-key source + registered default via `key_defaults`, CLI error verbatim), doctor tab (`doctor()` found/version/path + re-probe button), settings tab (`GraphiteSettings` get/set/reset) -- G7-GAP-1..7 closed, see table below |
| Keyboard map parity (j/k, ?, ctrl+k) | PASS | j/k bound per list-bearing screen (`action_cursor_down`/`_up` delegating to the focused `DataTable`); `?` opens `ShortcutSheet` (app-level binding, `tests/tui/test_app.py`); `COMMAND_PALETTE_BINDING = "ctrl+k"` (rebound from textual's `ctrl+p` default) with a `NavigationProvider` offering dashboard/run-console/config jumps as first-class commands |
| WO-G6 gap table worked | PASS | See disposition table below -- G7-GAP-1..7 LANDED, G7-GAP-8 stays NOT-A-GAP per WO-G6's own ruling (unchanged) |
| pytest coverage per screen's data path | PASS | `tests/tui/{test_dashboard,test_obligations,test_run_console,test_config,test_app}.py`, 13 tests, textual `Pilot`/`run_test` harness over the real `timber_pavilion` fixture (including a REAL `regolith check` driven end-to-end in `test_run_console.py`) |
| make check green | PASS | Foreground, in order: `backend-check` (ruff/ty/102 pytest incl. the 13 new TUI tests/openapi-check), `frontend-check` (lint/format/typecheck/token-drift/vitest/build), `frontend-api-check` (api.generated.ts drift), `frontend-system-test` (24/24 Playwright, untouched by this WO but re-run for the full gate) |

### G7-GAP disposition table (WO-G6's table, closed here)

| # | Capability | Disposition |
|---|---|---|
| G7-GAP-1 | Config list with source attribution | LANDED -- config tab's `DataTable` carries `key/value/source/default` per row, source column never blank (asserted in `test_config_list_has_source_attribution`) |
| G7-GAP-2 | Config edit through `regolith config set` | LANDED -- `_set_config` calls the SAME `graphite.service.config_cli.set_config` the web app uses (global/local scope selector) |
| G7-GAP-3 | Reset-to-default from the recorded-defaults schema | LANDED -- `_reset_config` reads `key_defaults()` (WOG6-F1's registry read) and re-`set_config`s to the registered default |
| G7-GAP-4 | CLI validation errors rendered verbatim | LANDED -- `_set_config`'s error path renders `result.danger_err.detail or .message`, the CLI's own stderr, never a re-worded message |
| G7-GAP-5 | Doctor table | LANDED -- doctor tab's `DataTable`: tool/found/version/path from `config_cli.doctor()`'s `--json` |
| G7-GAP-6 | Doctor re-probe | LANDED -- re-probe button re-calls `doctor()` (doctor freshly probes on every invocation by its own design, same posture as WO-G6's web re-probe) |
| G7-GAP-7 | graphite settings editor | LANDED -- settings tab: default project root + run verbosity, `get_settings`/`set_settings`/`reset_settings` round-trip (`test_settings_round_trip`) |
| G7-GAP-8 | Theme override | UNCHANGED, NOT A GAP (WO-G6's ruling stands: textual has its own dark/light toggle, per-head presentation state is legitimately per-head; the TUI does not need a browser-local theme override) |

### Dedup grep-proof

```
$ grep -rn "subprocess\|regolith.cli" graphite/tui/          -> none
$ grep -rn "json.load\|\.read_text()\|open(" graphite/tui/   -> none
$ grep -rhn "^from\|^import" graphite/tui/*.py graphite/tui/screens/*.py | sort -u
```
Every import is one of: stdlib (`pathlib`, `typing`, `collections`), `textual.*`,
`regolith.progress` (the public D228 wire-shape module, same one the
WO-G5 SSE route imports), or `graphite.service.*`/`graphite.tui.*`.
Zero raw subprocess spawns, zero raw JSON/file reads, zero re-declared
report/config-parsing regexes anywhere under `graphite/tui/`.

### Notes

- `graphite/tui_app.py` and `tests/test_tui.py` (the WO-59 monolith and
  its tests) are DELETED, not kept alongside the new package -- the
  WO's "delete duplicated code" instruction taken literally, since the
  old app's config/driver/report panes are now strict subsets of the
  new config/run-console/obligations screens.
- `graphite/tui/app.py`'s `GraphiteApp(project_root=...)` is used as
  BOTH the fleet-scan root (dashboard) and, for the app-level
  ctrl+k navigation shortcuts to run-console/config/obligations, the
  "active project" directly -- a single-project-session assumption
  documented in the class docstring. The dashboard's own drill-down
  (`enter` on a row) is the correct multi-project path, opening
  `ObligationsScreen(Path(info.root))` for whichever project was
  selected. A "set active project" affordance for the ctrl+k shortcuts
  in a true multi-project fleet session is follow-up scope (see
  WOG7-F1).
- Progress rails: `ProgressBar.update(total=..., progress=...)` is
  called only when `event.total is not None` (an indeterminate D228
  event renders as a rail with no total, same "indeterminate" honesty
  posture as the web app's WO-G5 rail).

### Escalations

- **WOG7-F1**: the TUI's app-level command-palette shortcuts
  (dashboard/run-console/config) assume a single active project (the
  `project_root` the TUI was launched with); there is no in-TUI "switch
  active project" command distinct from the dashboard's per-row
  drill-down. A `NavigationProvider` command that lists discovered
  projects and sets the active one (mirroring the web app's project
  switcher) would close this for a true multi-project terminal
  session. Not required by this WO's acceptance (dashboard drill-down
  already reaches any project), recorded for a future polish WO.
