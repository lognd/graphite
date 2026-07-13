# WO-G5 -- Run console: drive builds with live progress

Status: open
Spec: 02 sec. 3 (process model -- CLI subprocess only); 04.1
  ANY-LONG-OPERATION checklist; lithos D228 (the progress
  channel). Gates: WO-G1 + WO-G2; the LIVE progress half also
  gates on lithos WO-119 (the producer) -- land the console with
  log-derived coarse progress first, upgrade when 119 merges.

## Goal

build / ship / test / optimize / health runnable from the UI with
live streamed feedback -- the watching half of the mission.

## Deliverables

1. Run console view: verb + project + flags form (config-aware
   defaults with where-attribution); start -> live LogPane (stderr
   stream, search, follow, -v toggle re-runs verbose) + ProgressRail
   per phase (SSE); cancel; elapsed; exit summary with the verdict
   counts diff (before -> after this run).
2. Run history: durable records (WO-G1's store) listed with
   status, duration, verb, project; detail replays the captured
   stream; "re-run" affordance.
3. Progress derivation: v1 parses the D217 structured log stream
   for phase boundaries (coarse but honest); the D228 typed-event
   upgrade path is a single adapter swap, designed now, cited in
   code.
4. StatusLine integration: active run visible app-wide with its
   rail; completion notifies in-app only (no OS notifications
   without an explicit setting).
5. Optimize runs: surface trace/resume artifacts (winner rows,
   iteration count, the pinned-STEP link when one ships).
6. Playwright: start a real fixture build, watch it complete,
   assert history record + verdict diff rendering; cancel path.

## Acceptance

A real `regolith build --release` on the fixture is watchable
end-to-end with phase progress and an honest failure rendering
(kill it mid-run in a test); 04.1 long-op checklist ledgered;
make check green.
