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
  mockObligationsSynthetic2k,
  SYNTHETIC_2K_PROJECT,
  MAINBOARD_MX_PROJECT,
  MOCK_ARTIFACT_CONTENT,
  mockArtifactIndexMainboard,
  mockArtifactIndexTimberPavilion,
  mockProjectArtifacts,
  mockProjectConfig,
  mockProjectHealth,
  mockProjects,
  mockRunLog,
  mockRuns,
  mockSettings,
  mockVerdictDiff,
} from '../mocks/fixtures';

export type ProjectInfo = components['schemas']['ProjectInfo'];
export type ArtifactEntry = components['schemas']['ArtifactEntry'];
export type ArtifactIndexRow = components['schemas']['ArtifactIndexRow'];
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

function mockObligationsFor(project: string, query: ObligationsQuery): ObligationsResponse {
  // WO-G8 perf rig: the synthetic 2k-row project exercises the obligation
  // explorer's virtualized path; reachable only by direct URL (it has no
  // fleet/health entry -- it is a perf fixture, not a fake fleet member).
  if (project === SYNTHETIC_2K_PROJECT) return mockObligationsSynthetic2k;
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
    if (USE_MOCKS) return mockObligationsFor(project, query);
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
  /** The typed index (WO-G9 / lithos D244): every route that lists "what
   * families/files does this project have" reads THIS, never a hardcoded
   * family constant (the fix for lithos F145). */
  async getArtifactIndex(project: string): Promise<ArtifactIndexRow[]> {
    if (USE_MOCKS) {
      return project === MAINBOARD_MX_PROJECT
        ? mockArtifactIndexMainboard
        : mockArtifactIndexTimberPavilion;
    }
    return request<ArtifactIndexRow[]>(`/projects/${encodeURIComponent(project)}/artifact-index`);
  },
  async fetchArtifact(project: string, contentHash: string): Promise<Blob> {
    if (USE_MOCKS) {
      // WO-G9: unlike the pre-existing dedicated views (which only ever
      // read listing metadata in mock mode), FileRenderer/BoardGerberView/
      // HarnessView fetch-and-parse real artifact bytes -- so mock mode
      // needs real bytes behind the mock content hashes it hands out.
      const content = MOCK_ARTIFACT_CONTENT[contentHash];
      if (content !== undefined) return new Blob([content]);
      throw new Error(`no mock content registered for ${contentHash}`);
    }
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
  async listRuns(project: string): Promise<RunRecord[]> {
    if (USE_MOCKS) return [...mockRuns];
    return request<RunRecord[]>(`/projects/${encodeURIComponent(project)}/runs`);
  },
  async startRun(project: string, verb: RunVerb, args: string[] = []): Promise<RunRecord> {
    return requestJson<RunRecord>('POST', `/projects/${encodeURIComponent(project)}/runs`, {
      verb,
      args,
    });
  },
  async getRun(runId: string): Promise<RunRecord> {
    if (USE_MOCKS) {
      const record = mockRuns.find((r) => r.run_id === runId);
      if (!record) throw new Error(`graphite api mock: no run ${runId}`);
      return record;
    }
    return request<RunRecord>(`/runs/${encodeURIComponent(runId)}`);
  },
  async getRunLog(runId: string): Promise<string[]> {
    if (USE_MOCKS) return [...mockRunLog];
    return request<string[]>(`/runs/${encodeURIComponent(runId)}/log`);
  },
  async cancelRun(runId: string): Promise<RunRecord> {
    return requestJson<RunRecord>('POST', `/runs/${encodeURIComponent(runId)}/cancel`);
  },
  async getVerdictDiff(runId: string): Promise<VerdictDiff> {
    if (USE_MOCKS) return mockVerdictDiff;
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
