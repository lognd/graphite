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
  mockConfigEntries,
  mockGateSummary,
  mockLockfile,
  mockManifest,
  mockObligations,
  mockObligationsFiltered,
  mockObligationsGrouped,
  mockProjectArtifacts,
  mockProjectHealth,
  mockProjects,
  mockRuns,
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
export type RunRecord = components['schemas']['RunRecord'];
export type RunVerb = RunRecord['verb'];
export type HealthSnapshot = components['schemas']['HealthSnapshot'];
export type VerdictDiff = components['schemas']['VerdictDiff'];

// The two SSE event kinds `/api/runs/{id}/events` emits (graphite/routes/
// runs.py): `log` is the raw captured stderr+stdout, unconditionally;
// `progress` is the D228 typed event lithos's own regolith.progress.
// parse_line already parsed server-side -- the frontend NEVER re-parses
// the wire-shape text itself (ONE parser, dedup law 04.2).
export interface RunLogEvent {
  kind: 'log';
  line: string;
}

export interface RunProgressEvent {
  kind: 'progress';
  v: number;
  phase: string;
  subject: string;
  done: number | null;
  total: number | null;
  elapsed: number;
}

export interface RunDoneEvent {
  kind: 'done';
  status: RunRecord['status'];
}

export type RunStreamEvent = RunLogEvent | RunProgressEvent | RunDoneEvent;

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
  async listConfig(project: string): Promise<ConfigEntry[]> {
    if (USE_MOCKS) return [...mockConfigEntries];
    return request<ConfigEntry[]>(`/projects/${encodeURIComponent(project)}/config`);
  },
  async listRuns(project: string): Promise<RunRecord[]> {
    if (USE_MOCKS) return [...mockRuns];
    return request<RunRecord[]>(`/projects/${encodeURIComponent(project)}/runs`);
  },
  async startRun(project: string, verb: RunVerb, args: string[] = []): Promise<RunRecord> {
    const res = await fetch(`/api/projects/${encodeURIComponent(project)}/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verb, args }),
    });
    if (!res.ok) {
      throw new Error(`graphite api start run failed: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as RunRecord;
  },
  async getRun(runId: string): Promise<RunRecord> {
    return request<RunRecord>(`/runs/${encodeURIComponent(runId)}`);
  },
  async getRunLog(runId: string): Promise<string[]> {
    return request<string[]>(`/runs/${encodeURIComponent(runId)}/log`);
  },
  async cancelRun(runId: string): Promise<RunRecord> {
    const res = await fetch(`/api/runs/${encodeURIComponent(runId)}/cancel`, { method: 'POST' });
    if (!res.ok) {
      throw new Error(`graphite api cancel run failed: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as RunRecord;
  },
  async getVerdictDiff(runId: string): Promise<VerdictDiff> {
    return request<VerdictDiff>(`/runs/${encodeURIComponent(runId)}/verdict-diff`);
  },
  /** Opens the SSE stream for `runId` (log lines + parsed progress events,
   * closing on a `done` event) -- the ONE place graphite subscribes to a
   * live run, mirroring the fetch/request wrapper's role for the
   * request/response calls above. Returns the raw `EventSource` so the
   * caller can close it early (cancel path). */
  subscribeRunEvents(
    runId: string,
    handlers: {
      onLog?: (e: RunLogEvent) => void;
      onProgress?: (e: RunProgressEvent) => void;
      onDone?: (e: RunDoneEvent) => void;
    },
  ): EventSource {
    const source = new EventSource(`/api/runs/${encodeURIComponent(runId)}/events`);
    if (handlers.onLog) {
      source.addEventListener('log', (evt) => {
        handlers.onLog?.(JSON.parse((evt as MessageEvent).data) as RunLogEvent);
      });
    }
    if (handlers.onProgress) {
      source.addEventListener('progress', (evt) => {
        handlers.onProgress?.(JSON.parse((evt as MessageEvent).data) as RunProgressEvent);
      });
    }
    source.addEventListener('done', (evt) => {
      handlers.onDone?.(JSON.parse((evt as MessageEvent).data) as RunDoneEvent);
      source.close();
    });
    return source;
  },
};
