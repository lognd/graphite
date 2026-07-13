// Typed TanStack Query hooks -- the only sanctioned way UI code reaches the
// server (spec 02.2). Components must not call src/api/client.ts directly;
// they consume these hooks so caching/invalidation has one home.

import { useQuery } from '@tanstack/react-query';
import { api } from './client';

export function useProjects() {
  return useQuery({ queryKey: ['projects'], queryFn: api.listProjects });
}

export function useFleetHealth() {
  return useQuery({ queryKey: ['fleet-health'], queryFn: api.getFleetHealth });
}

export function useObligations(projectId: string | undefined) {
  return useQuery({
    queryKey: ['obligations', projectId],
    queryFn: () => api.listObligations(projectId as string),
    enabled: Boolean(projectId),
  });
}
