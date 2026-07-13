// Typed TanStack Query hooks -- the only sanctioned way UI code reaches the
// server (spec 02.2). Components must not call src/api/client.ts directly;
// they consume these hooks so caching/invalidation has one home.

import { useQuery } from '@tanstack/react-query';
import { api } from './client';

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

export function useObligations(project: string | undefined) {
  return useQuery({
    queryKey: ['obligations', project],
    queryFn: () => api.getObligations(project as string),
    enabled: Boolean(project),
  });
}
