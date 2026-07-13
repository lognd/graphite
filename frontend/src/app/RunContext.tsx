// App-wide "active run" visibility (WO-G5 deliverable 4): the run
// console (Runs.tsx) publishes the run it just started here so the
// StatusLine/AppShell footer can show its rail from ANY route, not just
// while the Runs view itself is mounted -- a long build should stay
// visible while a user wanders off to check obligations. Completion is
// an in-app notice only (04.1: no OS notifications without an explicit
// setting, which does not exist yet -- there is nothing to gate).

import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { RunRecord, RunVerb } from '../api/client';

export interface ActiveRunState {
  runId: string;
  project: string;
  verb: RunVerb;
  phase: string | null;
  done: number | null;
  total: number | null;
  elapsedSeconds: number;
  status: RunRecord['status'];
}

interface RunContextValue {
  activeRun: ActiveRunState | null;
  setActiveRun: (run: ActiveRunState | null) => void;
  updateActiveRun: (patch: Partial<ActiveRunState>) => void;
}

const RunContext = createContext<RunContextValue | null>(null);

export function RunProvider({ children }: { children: ReactNode }) {
  const [activeRun, setActiveRun] = useState<ActiveRunState | null>(null);

  const value = useMemo<RunContextValue>(
    () => ({
      activeRun,
      setActiveRun,
      updateActiveRun: (patch) => setActiveRun((prev) => (prev ? { ...prev, ...patch } : prev)),
    }),
    [activeRun],
  );

  return <RunContext.Provider value={value}>{children}</RunContext.Provider>;
}

export function useRunContext(): RunContextValue {
  const ctx = useContext(RunContext);
  if (!ctx) {
    throw new Error('useRunContext must be used within a RunProvider');
  }
  return ctx;
}
