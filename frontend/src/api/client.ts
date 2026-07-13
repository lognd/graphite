// The ONE place that talks to the server (dedup law 04.2 / spec 02.2). Raw
// fetch() anywhere else in the frontend is an eslint error
// (graphite/no-raw-fetch). All wire shapes are type aliases into the
// GENERATED api.generated.ts (WO-G1's openapi-typescript output) -- never
// hand-written. VITE_USE_MOCKS=1 routes every call to the committed
// fixtures in src/mocks/ instead of a real backend, so the frontend is
// developable and testable with no Python process running (spec 02.5).

import type { components } from './api.generated';
import { mockObligations, mockProjectHealth, mockProjects } from '../mocks/fixtures';

export type ProjectInfo = components['schemas']['ProjectInfo'];
export type ProjectHealth = components['schemas']['ProjectHealth'];
export type ObligationsResponse = components['schemas']['ObligationsResponse'];
export type AuditRow = components['schemas']['AuditRow'];
export type AuditSummary = components['schemas']['AuditSummary'];

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === '1';

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`);
  if (!res.ok) {
    throw new Error(`graphite api ${path} failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export const api = {
  async listProjects(): Promise<ProjectInfo[]> {
    if (USE_MOCKS) return mockProjects;
    return request<ProjectInfo[]>('/projects');
  },
  async getProjectHealth(project: string): Promise<ProjectHealth> {
    if (USE_MOCKS) return mockProjectHealth;
    return request<ProjectHealth>(`/projects/${encodeURIComponent(project)}/health`);
  },
  async getObligations(project: string): Promise<ObligationsResponse> {
    if (USE_MOCKS) return mockObligations;
    return request<ObligationsResponse>(`/projects/${encodeURIComponent(project)}/obligations`);
  },
};
