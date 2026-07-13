// The ONE place that talks to the server (dedup law 04.2 / spec 02.2). Raw
// fetch() anywhere else in the frontend is an eslint error
// (graphite/no-raw-fetch). All wire shapes are type aliases into the
// GENERATED api.generated.ts (WO-G1's openapi-typescript output) -- never
// hand-written. VITE_USE_MOCKS=1 routes every call to the committed
// fixtures in src/mocks/ instead of a real backend, so the frontend is
// developable and testable with no Python process running (spec 02.5).

import type { components } from './api.generated';
import {
  mockAuditIndex,
  mockBuildReport,
  mockCalcSheets,
  mockManifest,
  mockObligations,
  mockProjectArtifacts,
  mockProjectHealth,
  mockProjects,
} from '../mocks/fixtures';

export type ProjectInfo = components['schemas']['ProjectInfo'];
export type ProjectHealth = components['schemas']['ProjectHealth'];
export type ObligationsResponse = components['schemas']['ObligationsResponse'];
export type AuditRow = components['schemas']['AuditRow'];
export type AuditSummary = components['schemas']['AuditSummary'];
export type AuditIndex = components['schemas']['AuditIndex'];
export type CalcSheet = components['schemas']['CalcSheet'];
export type ArtifactEntry = components['schemas']['ArtifactEntry'];
export type StagedBuildReport = components['schemas']['StagedBuildReport'];
export type ManifestSummary = components['schemas']['ManifestSummary'];

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === '1';

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`);
  if (!res.ok) {
    throw new Error(`graphite api ${path} failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

/** Raw bytes for one content-addressed artifact (WO-G1's ONE fetch path:
 * a hash that must already appear in this project's own listing --
 * artifact_registry.py's security posture). Used for SVG/PDF/GLB/STEP
 * downloads and inline renders alike. */
async function requestBlob(path: string): Promise<Blob> {
  const res = await fetch(`/api${path}`);
  if (!res.ok) {
    throw new Error(`graphite api ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res.blob();
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
  async getCalcSheets(project: string): Promise<CalcSheet[]> {
    if (USE_MOCKS) return mockCalcSheets;
    return request<CalcSheet[]>(`/projects/${encodeURIComponent(project)}/calc/sheets`);
  },
  async getAuditIndex(project: string): Promise<AuditIndex> {
    if (USE_MOCKS) return mockAuditIndex;
    return request<AuditIndex>(`/projects/${encodeURIComponent(project)}/calc/audit`);
  },
  async listArtifacts(project: string): Promise<ArtifactEntry[]> {
    if (USE_MOCKS) return mockProjectArtifacts;
    return request<ArtifactEntry[]>(`/projects/${encodeURIComponent(project)}/artifacts`);
  },
  async fetchArtifact(project: string, contentHash: string): Promise<Blob> {
    return requestBlob(
      `/projects/${encodeURIComponent(project)}/artifacts/${encodeURIComponent(contentHash)}`,
    );
  },
  artifactUrl(project: string, contentHash: string): string {
    return `/api/projects/${encodeURIComponent(project)}/artifacts/${encodeURIComponent(contentHash)}`;
  },
  async getBuildReport(project: string): Promise<StagedBuildReport> {
    if (USE_MOCKS) return mockBuildReport;
    return request<StagedBuildReport>(`/projects/${encodeURIComponent(project)}/build-report`);
  },
  async getManifest(project: string): Promise<ManifestSummary> {
    if (USE_MOCKS) return mockManifest;
    return request<ManifestSummary>(`/projects/${encodeURIComponent(project)}/manifest`);
  },
};
