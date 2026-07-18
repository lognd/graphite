// Typed TanStack Query hooks -- the only sanctioned way UI code reaches the
// server (spec 02.2). Components must not call src/api/client.ts directly;
// they consume these hooks so caching/invalidation has one home.

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type {
  GraphiteSettings,
  ObligationsQuery,
  ProjectHealth,
  ProjectInfo,
  RunVerb,
} from './client';

// frob:doc docs/guide.md#9-frontend-lib-notes
export function useProjects() {
  return useQuery({ queryKey: ['projects'], queryFn: api.listProjects });
}

// frob:doc docs/guide.md#9-frontend-lib-notes
export function useProjectHealth(project: string | undefined) {
  return useQuery({
    queryKey: ['project-health', project],
    queryFn: () => api.getProjectHealth(project as string),
    enabled: Boolean(project),
  });
}

// frob:doc docs/guide.md#9-frontend-lib-notes
export function useObligations(project: string | undefined, query: ObligationsQuery = {}) {
  return useQuery({
    queryKey: ['obligations', project, query.filter ?? null, query.group ?? null],
    queryFn: () => api.getObligations(project as string, query),
    enabled: Boolean(project),
  });
}

// frob:doc docs/guide.md#9-frontend-lib-notes
export function useCalcSheets(project: string | undefined) {
  return useQuery({
    queryKey: ['calc-sheets', project],
    queryFn: () => api.getCalcSheets(project as string),
    enabled: Boolean(project),
  });
}

// frob:doc docs/guide.md#9-frontend-lib-notes
export function useAuditIndex(project: string | undefined) {
  return useQuery({
    queryKey: ['calc-audit', project],
    queryFn: () => api.getAuditIndex(project as string),
    enabled: Boolean(project),
  });
}

// frob:doc docs/guide.md#9-frontend-lib-notes
export function useProjectArtifacts(project: string | undefined) {
  return useQuery({
    queryKey: ['artifacts', project],
    queryFn: () => api.listArtifacts(project as string),
    enabled: Boolean(project),
  });
}

/** WO-G9: the typed index -- families, per-file viewer hints, source
 * refs. The Artifacts hub and every family view read this instead of a
 * hardcoded family list (the fix for lithos F145). */
// frob:doc docs/guide.md#9-frontend-lib-notes
export function useProjectArtifactIndex(project: string | undefined) {
  return useQuery({
    queryKey: ['artifact-index', project],
    queryFn: () => api.getArtifactIndex(project as string),
    enabled: Boolean(project),
  });
}

// frob:doc docs/guide.md#9-frontend-lib-notes
export function useBuildReport(project: string | undefined) {
  return useQuery({
    queryKey: ['build-report', project],
    queryFn: () => api.getBuildReport(project as string),
    enabled: Boolean(project),
  });
}

// frob:doc docs/guide.md#9-frontend-lib-notes
export function useLockfile(project: string | undefined) {
  return useQuery({
    queryKey: ['lockfile', project],
    queryFn: () => api.getLockfile(project as string),
    enabled: Boolean(project),
  });
}

// frob:doc docs/guide.md#9-frontend-lib-notes
export function useGateSummary(project: string | undefined) {
  return useQuery({
    queryKey: ['gate-summary', project],
    queryFn: () => api.getGateSummary(project as string),
    enabled: Boolean(project),
  });
}

// frob:doc docs/guide.md#9-frontend-lib-notes
export function useAcceptanceLedger(project: string | undefined) {
  return useQuery({
    queryKey: ['acceptance-ledger', project],
    queryFn: () => api.getAcceptanceLedger(project as string),
    enabled: Boolean(project),
  });
}

// frob:doc docs/guide.md#9-frontend-lib-notes
export function useManifest(project: string | undefined) {
  return useQuery({
    queryKey: ['manifest', project],
    queryFn: () => api.getManifest(project as string),
    enabled: Boolean(project),
  });
}

// frob:doc docs/guide.md#9-frontend-lib-notes
export function useConfigSchema() {
  return useQuery({ queryKey: ['config-schema'], queryFn: api.getConfigSchema });
}

// The ONE project-config listing hook (WO-G5/WO-G6 merge: both WOs
// declared one; WO-G6's -- keyed 'project-config' over listProjectConfig
// -- survived, and the run console consumes it for its config-aware
// default flags).
// frob:doc docs/guide.md#9-frontend-lib-notes
export function useProjectConfig(project: string | undefined) {
  return useQuery({
    queryKey: ['project-config', project],
    queryFn: () => api.listProjectConfig(project as string),
    enabled: Boolean(project),
  });
}

// frob:doc docs/guide.md#9-frontend-lib-notes
export function useSetProjectConfig(project: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      key,
      value,
      level,
    }: {
      key: string;
      value: string;
      level: 'global' | 'local';
    }) => api.setProjectConfig(project as string, key, value, level),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-config', project] }),
  });
}

// frob:doc docs/guide.md#9-frontend-lib-notes
export function useDoctor(project: string | undefined) {
  return useQuery({
    queryKey: ['doctor', project],
    queryFn: () => api.getDoctor(project as string),
    enabled: Boolean(project),
  });
}

// frob:doc docs/guide.md#9-frontend-lib-notes
export function useRuns(project: string | undefined) {
  return useQuery({
    queryKey: ['runs', project],
    queryFn: () => api.listRuns(project as string),
    enabled: Boolean(project),
  });
}

// frob:doc docs/guide.md#9-frontend-lib-notes
export function useRunDetail(runId: string | undefined) {
  return useQuery({
    queryKey: ['run', runId],
    queryFn: () => api.getRun(runId as string),
    enabled: Boolean(runId),
  });
}

// frob:doc docs/guide.md#9-frontend-lib-notes
export function useRunLog(runId: string | undefined) {
  return useQuery({
    queryKey: ['run-log', runId],
    queryFn: () => api.getRunLog(runId as string),
    enabled: Boolean(runId),
  });
}

// frob:doc docs/guide.md#9-frontend-lib-notes
export function useVerdictDiff(runId: string | undefined) {
  return useQuery({
    queryKey: ['run-verdict-diff', runId],
    queryFn: () => api.getVerdictDiff(runId as string),
    enabled: Boolean(runId),
  });
}

// frob:doc docs/guide.md#9-frontend-lib-notes
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

// frob:doc docs/guide.md#9-frontend-lib-notes
export function useCancelRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) => api.cancelRun(runId),
    onSuccess: (record) => {
      void queryClient.invalidateQueries({ queryKey: ['run', record.run_id] });
    },
  });
}

// frob:doc docs/guide.md#9-frontend-lib-notes
export function useSettings() {
  return useQuery({ queryKey: ['settings'], queryFn: api.getSettings });
}

// frob:doc docs/guide.md#9-frontend-lib-notes
export function useSetSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: GraphiteSettings) => api.setSettings(settings),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });
}

// frob:doc docs/guide.md#9-frontend-lib-notes
export function useResetSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.resetSettings(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });
}

// The fleet dashboard's "is my fleet healthy?" answer needs one /health
// call per project (WOG2-F1's finding: health is per-project, no fleet
// endpoint exists) -- fanned out here via useQueries so the Dashboard
// route stays a plain consumer of one hook, not a manual Promise.all.
// frob:doc docs/guide.md#9-frontend-lib-notes
export interface FleetHealthEntry {
  project: ProjectInfo;
  health: ProjectHealth | undefined;
  isLoading: boolean;
  isError: boolean;
}

// frob:doc docs/guide.md#9-frontend-lib-notes
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
