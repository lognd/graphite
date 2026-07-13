// Typed TanStack Query hooks -- the only sanctioned way UI code reaches the
// server (spec 02.2). Components must not call src/api/client.ts directly;
// they consume these hooks so caching/invalidation has one home.

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { ObligationsQuery, ProjectHealth, ProjectInfo, RunVerb } from './client';

export function useProjects() {
  return useQuery({ queryKey: ['projects'], queryFn: api.listProjects });
}

export function useProjectHealth(project: string | undefined) {
  return useQuery({
    queryKey: ['project-health', project],
    queryFn: () => api.getProjectHealth(project as string),
    enabled: Boolean(project),
  });
}

export function useObligations(project: string | undefined, query: ObligationsQuery = {}) {
  return useQuery({
    queryKey: ['obligations', project, query.filter ?? null, query.group ?? null],
    queryFn: () => api.getObligations(project as string, query),
    enabled: Boolean(project),
  });
}

export function useCalcSheets(project: string | undefined) {
  return useQuery({
    queryKey: ['calc-sheets', project],
    queryFn: () => api.getCalcSheets(project as string),
    enabled: Boolean(project),
  });
}

export function useAuditIndex(project: string | undefined) {
  return useQuery({
    queryKey: ['calc-audit', project],
    queryFn: () => api.getAuditIndex(project as string),
    enabled: Boolean(project),
  });
}

export function useProjectArtifacts(project: string | undefined) {
  return useQuery({
    queryKey: ['artifacts', project],
    queryFn: () => api.listArtifacts(project as string),
    enabled: Boolean(project),
  });
}

export function useBuildReport(project: string | undefined) {
  return useQuery({
    queryKey: ['build-report', project],
    queryFn: () => api.getBuildReport(project as string),
    enabled: Boolean(project),
  });
}

export function useLockfile(project: string | undefined) {
  return useQuery({
    queryKey: ['lockfile', project],
    queryFn: () => api.getLockfile(project as string),
    enabled: Boolean(project),
  });
}

export function useGateSummary(project: string | undefined) {
  return useQuery({
    queryKey: ['gate-summary', project],
    queryFn: () => api.getGateSummary(project as string),
    enabled: Boolean(project),
  });
}

export function useAcceptanceLedger(project: string | undefined) {
  return useQuery({
    queryKey: ['acceptance-ledger', project],
    queryFn: () => api.getAcceptanceLedger(project as string),
    enabled: Boolean(project),
  });
}

export function useManifest(project: string | undefined) {
  return useQuery({
    queryKey: ['manifest', project],
    queryFn: () => api.getManifest(project as string),
    enabled: Boolean(project),
  });
}

export function useProjectConfig(project: string | undefined) {
  return useQuery({
    queryKey: ['config', project],
    queryFn: () => api.listConfig(project as string),
    enabled: Boolean(project),
  });
}

export function useRuns(project: string | undefined) {
  return useQuery({
    queryKey: ['runs', project],
    queryFn: () => api.listRuns(project as string),
    enabled: Boolean(project),
  });
}

export function useRunDetail(runId: string | undefined) {
  return useQuery({
    queryKey: ['run', runId],
    queryFn: () => api.getRun(runId as string),
    enabled: Boolean(runId),
  });
}

export function useRunLog(runId: string | undefined) {
  return useQuery({
    queryKey: ['run-log', runId],
    queryFn: () => api.getRunLog(runId as string),
    enabled: Boolean(runId),
  });
}

export function useVerdictDiff(runId: string | undefined) {
  return useQuery({
    queryKey: ['run-verdict-diff', runId],
    queryFn: () => api.getVerdictDiff(runId as string),
    enabled: Boolean(runId),
  });
}

export function useStartRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ project, verb, args }: { project: string; verb: RunVerb; args: string[] }) =>
      api.startRun(project, verb, args),
    onSuccess: (_record, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['runs', variables.project] });
    },
  });
}

export function useCancelRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) => api.cancelRun(runId),
    onSuccess: (record) => {
      void queryClient.invalidateQueries({ queryKey: ['run', record.run_id] });
    },
  });
}

// The fleet dashboard's "is my fleet healthy?" answer needs one /health
// call per project (WOG2-F1's finding: health is per-project, no fleet
// endpoint exists) -- fanned out here via useQueries so the Dashboard
// route stays a plain consumer of one hook, not a manual Promise.all.
export interface FleetHealthEntry {
  project: ProjectInfo;
  health: ProjectHealth | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function useFleetHealth(projects: ProjectInfo[] | undefined): {
  entries: FleetHealthEntry[];
  isLoading: boolean;
} {
  const list = projects ?? [];
  const results = useQueries({
    queries: list.map((p) => ({
      queryKey: ['project-health', p.name],
      queryFn: () => api.getProjectHealth(p.name),
    })),
  });
  const entries: FleetHealthEntry[] = list.map((p, i) => ({
    project: p,
    health: results[i]?.data,
    isLoading: results[i]?.isLoading ?? false,
    isError: results[i]?.isError ?? false,
  }));
  return { entries, isLoading: results.some((r) => r.isLoading) };
}
