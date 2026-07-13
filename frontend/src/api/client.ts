// The ONE place that talks to the server (dedup law 04.2 / spec 02.2). Raw
// fetch() anywhere else in the frontend is an eslint error
// (graphite/no-raw-fetch). All wire shapes are type aliases into the
// GENERATED api.generated.ts (WO-G1's openapi-typescript output) -- never
// hand-written. VITE_USE_MOCKS=1 routes every call to the committed
// fixtures in src/mocks/ instead of a real backend, so the frontend is
// developable and testable with no Python process running (spec 02.5).

import type { components } from './api.generated';
import {
  mockAcceptanceLedger,
  mockArtifacts,
  mockCalcSheets,
  mockGateSummary,
  mockLockfile,
  mockManifest,
  mockObligations,
  mockObligationsFiltered,
  mockObligationsGrouped,
  mockProjectHealth,
  mockProjects,
} from '../mocks/fixtures';

export type ProjectInfo = components['schemas']['ProjectInfo'];
export type ArtifactEntry = components['schemas']['ArtifactEntry'];
export type ProjectHealth = components['schemas']['ProjectHealth'];
export type ObligationsResponse = components['schemas']['ObligationsResponse'];
export type ObligationGroup = components['schemas']['ObligationGroup'];
export type AuditRow = components['schemas']['AuditRow'];
export type AuditSummary = components['schemas']['AuditSummary'];
export type CalcSheet = components['schemas']['CalcSheet'];
export type Lockfile = components['schemas']['Lockfile'];
export type LockSection = components['schemas']['LockSection'];
export type LockRow = components['schemas']['LockRow'];
export type GateSummary = components['schemas']['GateSummary'];
export type ManifestSummary = components['schemas']['ManifestSummary'];
export type AcceptanceLedgerSummary = components['schemas']['AcceptanceLedgerSummary'];
export type AcceptedDeviation = components['schemas']['AcceptedDeviation'];

export interface ObligationsQuery {
  filter?: string;
  group?: 'disposition' | 'family';
}

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === '1';

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`);
  if (!res.ok) {
    throw new Error(`graphite api ${path} failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

function mockObligationsFor(query: ObligationsQuery): ObligationsResponse {
  if (query.group) return mockObligationsGrouped(query.group);
  if (query.filter) return mockObligationsFiltered(query.filter);
  return mockObligations;
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
  async getObligations(
    project: string,
    query: ObligationsQuery = {},
  ): Promise<ObligationsResponse> {
    if (USE_MOCKS) return mockObligationsFor(query);
    const params = new URLSearchParams();
    if (query.filter) params.set('filter', query.filter);
    if (query.group) params.set('group', query.group);
    const qs = params.toString();
    return request<ObligationsResponse>(
      `/projects/${encodeURIComponent(project)}/obligations${qs ? `?${qs}` : ''}`,
    );
  },
  async getCalcSheets(project: string): Promise<CalcSheet[]> {
    if (USE_MOCKS) return mockCalcSheets;
    return request<CalcSheet[]>(`/projects/${encodeURIComponent(project)}/calc/sheets`);
  },
  async getLockfile(project: string): Promise<Lockfile> {
    if (USE_MOCKS) return mockLockfile;
    return request<Lockfile>(`/projects/${encodeURIComponent(project)}/lockfile`);
  },
  async getGateSummary(project: string): Promise<GateSummary> {
    if (USE_MOCKS) return mockGateSummary;
    return request<GateSummary>(`/projects/${encodeURIComponent(project)}/gate-summary`);
  },
  async getAcceptanceLedger(project: string): Promise<AcceptanceLedgerSummary> {
    if (USE_MOCKS) return mockAcceptanceLedger;
    return request<AcceptanceLedgerSummary>(
      `/projects/${encodeURIComponent(project)}/acceptance-ledger`,
    );
  },
  async getManifest(project: string): Promise<ManifestSummary> {
    if (USE_MOCKS) return mockManifest;
    return request<ManifestSummary>(`/projects/${encodeURIComponent(project)}/manifest`);
  },
  // Family-presence only (which top-level dist/ groups shipped) --
  // NOT artifact browsing/preview, which stays WO-G5's scope; this
  // just reads the same listing WO-G5's viewer will also consume.
  async getArtifacts(project: string): Promise<ArtifactEntry[]> {
    if (USE_MOCKS) return mockArtifacts;
    return request<ArtifactEntry[]>(`/projects/${encodeURIComponent(project)}/artifacts`);
  },
};
