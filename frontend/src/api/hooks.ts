// Typed TanStack Query hooks -- the only sanctioned way UI code reaches the
// server (spec 02.2). Components must not call src/api/client.ts directly;
// they consume these hooks so caching/invalidation has one home.

import { useQueries, useQuery } from '@tanstack/react-query';
import { api } from './client';
import type { ObligationsQuery, ProjectHealth, ProjectInfo } from './client';

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

export function useArtifacts(project: string | undefined) {
  return useQuery({
    queryKey: ['artifacts', project],
    queryFn: () => api.getArtifacts(project as string),
    enabled: Boolean(project),
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
