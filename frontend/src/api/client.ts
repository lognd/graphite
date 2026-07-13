// The ONE place that talks to the server (dedup law 04.2 / spec 02.2). Raw
// fetch() anywhere else in the frontend is an eslint error
// (graphite/no-raw-fetch). VITE_USE_MOCKS=1 routes every call to the
// committed fixtures in src/mocks/ instead of a real backend, so the
// frontend is developable and testable with no Python process running
// (spec 02.5).

import type { FleetHealthSummary, ObligationRow, ProjectSummary } from './api.generated';
import { mockFleetHealth, mockObligations, mockProjects } from '../mocks/fixtures';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === '1';

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`);
  if (!res.ok) {
    throw new Error(`graphite api ${path} failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export const api = {
  async listProjects(): Promise<ProjectSummary[]> {
    if (USE_MOCKS) return mockProjects;
    return request<ProjectSummary[]>('/projects');
  },
  async getFleetHealth(): Promise<FleetHealthSummary> {
    if (USE_MOCKS) return mockFleetHealth;
    return request<FleetHealthSummary>('/health');
  },
  async listObligations(projectId: string): Promise<ObligationRow[]> {
    if (USE_MOCKS) return mockObligations;
    return request<ObligationRow[]>(`/projects/${projectId}/obligations`);
  },
};
