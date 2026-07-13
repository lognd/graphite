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
  mockAuditIndex,
  mockBuildReport,
  mockCalcSheets,
  mockConfigSchema,
  mockDoctor,
  mockGateSummary,
  mockLockfile,
  mockManifest,
  mockObligations,
  mockObligationsFiltered,
  mockObligationsGrouped,
  mockProjectArtifacts,
  mockProjectConfig,
  mockProjectHealth,
  mockProjects,
  mockSettings,
} from '../mocks/fixtures';

export type ProjectInfo = components['schemas']['ProjectInfo'];
export type ArtifactEntry = components['schemas']['ArtifactEntry'];
export type ProjectHealth = components['schemas']['ProjectHealth'];
export type ObligationsResponse = components['schemas']['ObligationsResponse'];
export type ObligationGroup = components['schemas']['ObligationGroup'];
export type AuditRow = components['schemas']['AuditRow'];
export type AuditSummary = components['schemas']['AuditSummary'];
export type AuditIndex = components['schemas']['AuditIndex'];
export type CalcSheet = components['schemas']['CalcSheet'];
export type StagedBuildReport = components['schemas']['StagedBuildReport'];
export type Lockfile = components['schemas']['Lockfile'];
export type LockSection = components['schemas']['LockSection'];
export type LockRow = components['schemas']['LockRow'];
export type GateSummary = components['schemas']['GateSummary'];
export type ManifestSummary = components['schemas']['ManifestSummary'];
export type AcceptanceLedgerSummary = components['schemas']['AcceptanceLedgerSummary'];
export type AcceptedDeviation = components['schemas']['AcceptedDeviation'];
export type ConfigEntry = components['schemas']['ConfigEntry'];
export type ConfigKeyDefault = components['schemas']['ConfigKeyDefault'];
export type GraphiteSettings = components['schemas']['GraphiteSettings'];
export type RunVerbosity = GraphiteSettings['run_verbosity'];

// `regolith doctor --json`'s hand-written shape (regolith/cli/app.py's
// `doctor` command, toolenv.py's ToolSpec/ToolStatus): the ONE type in
// this file that is NOT a generated alias, because the backend route
// itself is untyped (`response_model=list[object]`, api.generated.ts
// says `unknown[]`) -- there is no generated shape to duplicate here,
// so this is not a dedup-law (04.2) violation, just the one honest gap.
export interface DoctorEntry {
  name: string;
  found: boolean;
  path: string | null;
  version: string | null;
  capability: string;
  install_hint: string | null;
}

export interface ObligationsQuery {
  filter?: string;
  group?: 'disposition' | 'family';
}

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === '1';

/** The service-layer `ServiceError` shape (graphite.service.errors),
 * carried verbatim so callers can render the real CLI/validation
 * message (04.1's "real validation errors" floor) instead of a
 * generic "request failed". */
export interface ApiErrorBody {
  kind: string;
  message: string;
  detail?: string | null;
}

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody | null;

  constructor(status: number, body: ApiErrorBody | null) {
    super(body?.detail || body?.message || `request failed: ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function parseErrorBody(res: Response): Promise<ApiErrorBody | null> {
  try {
    const json = (await res.json()) as { detail?: ApiErrorBody };
    return json.detail ?? null;
  } catch {
    return null;
  }
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`);
  if (!res.ok) {
    throw new ApiError(res.status, await parseErrorBody(res));
  }
  return (await res.json()) as T;
}

/** POST/PUT with a JSON body -- every write in the app (config set,
 * settings save/reset) goes through this ONE function, never a raw
 * `fetch` at the call site (dedup law 04.2 / graphite/no-raw-fetch). */
async function requestJson<T>(method: 'POST' | 'PUT', path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new ApiError(res.status, await parseErrorBody(res));
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
  async getConfigSchema(): Promise<ConfigKeyDefault[]> {
    if (USE_MOCKS) return mockConfigSchema;
    return request<ConfigKeyDefault[]>('/config/schema');
  },
  async listProjectConfig(project: string): Promise<ConfigEntry[]> {
    if (USE_MOCKS) return mockProjectConfig;
    return request<ConfigEntry[]>(`/projects/${encodeURIComponent(project)}/config`);
  },
  async setProjectConfig(
    project: string,
    key: string,
    value: string,
    level: 'global' | 'local',
  ): Promise<ConfigEntry> {
    return requestJson<ConfigEntry>(
      'PUT',
      `/projects/${encodeURIComponent(project)}/config/${encodeURIComponent(key)}`,
      { value, level },
    );
  },
  async getDoctor(project: string): Promise<DoctorEntry[]> {
    if (USE_MOCKS) return mockDoctor;
    return request<DoctorEntry[]>(`/projects/${encodeURIComponent(project)}/doctor`);
  },
  async getSettings(): Promise<GraphiteSettings> {
    if (USE_MOCKS) return mockSettings;
    return request<GraphiteSettings>('/settings');
  },
  async setSettings(settings: GraphiteSettings): Promise<GraphiteSettings> {
    return requestJson<GraphiteSettings>('PUT', '/settings', settings);
  },
  async resetSettings(): Promise<GraphiteSettings> {
    return requestJson<GraphiteSettings>('POST', '/settings/reset');
  },
};
