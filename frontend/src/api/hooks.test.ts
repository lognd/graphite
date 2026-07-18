import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './client';
import {
  useAcceptanceLedger,
  useAuditIndex,
  useBuildReport,
  useCalcSheets,
  useCancelRun,
  useConfigSchema,
  useDoctor,
  useFleetHealth,
  useGateSummary,
  useLockfile,
  useManifest,
  useObligations,
  useProjectArtifactIndex,
  useProjectArtifacts,
  useProjectConfig,
  useProjectHealth,
  useProjects,
  useResetSettings,
  useRunDetail,
  useRunLog,
  useRuns,
  useSetProjectConfig,
  useSetSettings,
  useSettings,
  useStartRun,
  useVerdictDiff,
} from './hooks';

// A fresh, retry-free QueryClient per render so a failing queryFn settles
// to `isError` immediately instead of TanStack Query's default backoff
// retries timing the test out.
function wrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    queryClient,
    Wrapper: ({ children }: { children: ReactNode }) =>
      QueryClientProvider({ client: queryClient, children }),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useProjects', () => {
  // frob:tests frontend/src/api/hooks.ts::useProjects kind="unit"
  it('resolves the project list from api.listProjects', async () => {
    const spy = vi.spyOn(api, 'listProjects').mockResolvedValue([]);
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useProjects(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledOnce();
    expect(result.current.data).toEqual([]);
  });
});

describe('useProjectHealth', () => {
  // frob:tests frontend/src/api/hooks.ts::useProjectHealth kind="unit"
  it('stays disabled until a project id is provided', async () => {
    const spy = vi.spyOn(api, 'getProjectHealth');
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useProjectHealth(undefined), { wrapper: Wrapper });
    expect(result.current.fetchStatus).toBe('idle');
    expect(spy).not.toHaveBeenCalled();
  });

  it('fetches health for the given project once enabled', async () => {
    spyResolve('getProjectHealth', {
      release_ok: true,
      obligation_summary: {
        accepted_deviation: 0,
        accepted_rows: 0,
        deferred: 0,
        discharged: 0,
        obligations: 0,
        violated: 0,
      },
    });
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useProjectHealth('p1'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.getProjectHealth).toHaveBeenCalledWith('p1');
  });
});

function spyResolve<K extends keyof typeof api>(method: K, value: unknown) {
  return vi.spyOn(api, method).mockResolvedValue(value as never);
}

describe('useObligations', () => {
  // frob:tests frontend/src/api/hooks.ts::useObligations kind="unit"
  it('passes the project and query through to api.getObligations', async () => {
    const spy = spyResolve('getObligations', { summary: null, groups: null, rows: [] });
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useObligations('p1', { filter: 'violated' }), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith('p1', { filter: 'violated' });
  });
});

describe('useCalcSheets', () => {
  // frob:tests frontend/src/api/hooks.ts::useCalcSheets kind="unit"
  it('resolves calc sheets for the given project', async () => {
    const spy = spyResolve('getCalcSheets', []);
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useCalcSheets('p1'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith('p1');
  });
});

describe('useAuditIndex', () => {
  // frob:tests frontend/src/api/hooks.ts::useAuditIndex kind="unit"
  it('resolves the audit index for the given project', async () => {
    const spy = spyResolve('getAuditIndex', { summary: null, rows: [] });
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useAuditIndex('p1'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith('p1');
  });
});

describe('useProjectArtifacts', () => {
  // frob:tests frontend/src/api/hooks.ts::useProjectArtifacts kind="unit"
  it('resolves the artifact list for the given project', async () => {
    const spy = spyResolve('listArtifacts', []);
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useProjectArtifacts('p1'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith('p1');
  });
});

describe('useProjectArtifactIndex', () => {
  // frob:tests frontend/src/api/hooks.ts::useProjectArtifactIndex kind="unit"
  it('resolves the typed artifact index for the given project', async () => {
    const spy = spyResolve('getArtifactIndex', []);
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useProjectArtifactIndex('p1'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith('p1');
  });
});

describe('useBuildReport', () => {
  // frob:tests frontend/src/api/hooks.ts::useBuildReport kind="unit"
  it('resolves the staged build report for the given project', async () => {
    const spy = spyResolve('getBuildReport', {});
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useBuildReport('p1'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith('p1');
  });
});

describe('useLockfile', () => {
  // frob:tests frontend/src/api/hooks.ts::useLockfile kind="unit"
  it('resolves the lockfile for the given project', async () => {
    const spy = spyResolve('getLockfile', { sections: [] });
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useLockfile('p1'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith('p1');
  });
});

describe('useGateSummary', () => {
  // frob:tests frontend/src/api/hooks.ts::useGateSummary kind="unit"
  it('resolves the gate summary for the given project', async () => {
    const spy = spyResolve('getGateSummary', {});
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useGateSummary('p1'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith('p1');
  });
});

describe('useAcceptanceLedger', () => {
  // frob:tests frontend/src/api/hooks.ts::useAcceptanceLedger kind="unit"
  it('resolves the acceptance ledger for the given project', async () => {
    const spy = spyResolve('getAcceptanceLedger', {});
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useAcceptanceLedger('p1'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith('p1');
  });
});

describe('useManifest', () => {
  // frob:tests frontend/src/api/hooks.ts::useManifest kind="unit"
  it('resolves the manifest for the given project', async () => {
    const spy = spyResolve('getManifest', {});
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useManifest('p1'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith('p1');
  });
});

describe('useConfigSchema', () => {
  // frob:tests frontend/src/api/hooks.ts::useConfigSchema kind="unit"
  it('resolves the config schema with no project id needed', async () => {
    const spy = vi.spyOn(api, 'getConfigSchema').mockResolvedValue([]);
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useConfigSchema(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledOnce();
  });
});

describe('useProjectConfig', () => {
  // frob:tests frontend/src/api/hooks.ts::useProjectConfig kind="unit"
  it('resolves the project config list for the given project', async () => {
    const spy = spyResolve('listProjectConfig', []);
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useProjectConfig('p1'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith('p1');
  });
});

describe('useSetProjectConfig', () => {
  // frob:tests frontend/src/api/hooks.ts::useSetProjectConfig kind="unit"
  it('writes through api.setProjectConfig and invalidates the project-config query', async () => {
    const spy = spyResolve('setProjectConfig', {
      key: 'k',
      value: 'v',
      level: 'local',
      source: 'local',
    });
    const { Wrapper, queryClient } = wrapper();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useSetProjectConfig('p1'), { wrapper: Wrapper });
    result.current.mutate({ key: 'k', value: 'v', level: 'local' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith('p1', 'k', 'v', 'local');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['project-config', 'p1'] });
  });
});

describe('useDoctor', () => {
  // frob:tests frontend/src/api/hooks.ts::useDoctor kind="unit"
  it('resolves the doctor probe rows for the given project', async () => {
    const spy = spyResolve('getDoctor', []);
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useDoctor('p1'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith('p1');
  });
});

describe('useRuns', () => {
  // frob:tests frontend/src/api/hooks.ts::useRuns kind="unit"
  it('resolves the run history for the given project', async () => {
    const spy = spyResolve('listRuns', []);
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useRuns('p1'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith('p1');
  });
});

describe('useRunDetail', () => {
  // frob:tests frontend/src/api/hooks.ts::useRunDetail kind="unit"
  it('resolves a single run by id', async () => {
    const spy = spyResolve('getRun', { run_id: 'r1' });
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useRunDetail('r1'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith('r1');
  });
});

describe('useRunLog', () => {
  // frob:tests frontend/src/api/hooks.ts::useRunLog kind="unit"
  it('resolves the log lines for a run id', async () => {
    const spy = spyResolve('getRunLog', ['line 1']);
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useRunLog('r1'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith('r1');
  });
});

describe('useVerdictDiff', () => {
  // frob:tests frontend/src/api/hooks.ts::useVerdictDiff kind="unit"
  it('resolves the verdict diff for a run id', async () => {
    const spy = spyResolve('getVerdictDiff', {});
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useVerdictDiff('r1'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith('r1');
  });
});

describe('useStartRun', () => {
  // frob:tests frontend/src/api/hooks.ts::useStartRun kind="unit"
  it('starts a run and invalidates that project\'s run list', async () => {
    const spy = spyResolve('startRun', { run_id: 'r1' });
    const { Wrapper, queryClient } = wrapper();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useStartRun(), { wrapper: Wrapper });
    result.current.mutate({ project: 'p1', verb: 'build', args: [] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith('p1', 'build', []);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['runs', 'p1'] });
  });
});

describe('useCancelRun', () => {
  // frob:tests frontend/src/api/hooks.ts::useCancelRun kind="unit"
  it('cancels a run and invalidates that run\'s detail query', async () => {
    const spy = spyResolve('cancelRun', { run_id: 'r1', status: 'cancelled' });
    const { Wrapper, queryClient } = wrapper();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCancelRun(), { wrapper: Wrapper });
    result.current.mutate('r1');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith('r1');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['run', 'r1'] });
  });
});

describe('useSettings', () => {
  // frob:tests frontend/src/api/hooks.ts::useSettings kind="unit"
  it('resolves the current settings with no project id needed', async () => {
    const spy = vi.spyOn(api, 'getSettings').mockResolvedValue({} as never);
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useSettings(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledOnce();
  });
});

describe('useSetSettings', () => {
  // frob:tests frontend/src/api/hooks.ts::useSetSettings kind="unit"
  it('writes settings and invalidates the settings query', async () => {
    const settings = { run_verbosity: 'normal' } as never;
    const spy = spyResolve('setSettings', settings);
    const { Wrapper, queryClient } = wrapper();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useSetSettings(), { wrapper: Wrapper });
    result.current.mutate(settings);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith(settings);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['settings'] });
  });
});

describe('useResetSettings', () => {
  // frob:tests frontend/src/api/hooks.ts::useResetSettings kind="unit"
  it('resets settings and invalidates the settings query', async () => {
    const spy = spyResolve('resetSettings', {});
    const { Wrapper, queryClient } = wrapper();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useResetSettings(), { wrapper: Wrapper });
    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledOnce();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['settings'] });
  });
});

describe('useFleetHealth', () => {
  // frob:tests frontend/src/api/hooks.ts::useFleetHealth kind="unit"
  it('fans out one health call per project and reports per-project loading/error', async () => {
    const spy = vi.spyOn(api, 'getProjectHealth').mockImplementation((name) =>
      name === 'bad'
        ? Promise.reject(new Error('boom'))
        : Promise.resolve({
            release_ok: true,
            obligation_summary: {
              accepted_deviation: 0,
              accepted_rows: 0,
              deferred: 0,
              discharged: 0,
              obligations: 0,
              violated: 0,
            },
          }),
    );
    const projects = [
      { name: 'good', version: '1', root: '.', manifest_path: 'm.toml' } as never,
      { name: 'bad', version: '1', root: '.', manifest_path: 'm.toml' } as never,
    ];
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useFleetHealth(projects), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(spy).toHaveBeenCalledTimes(2);
    expect(result.current.entries).toHaveLength(2);
    expect(result.current.entries[0].health?.release_ok).toBe(true);
    expect(result.current.entries[1].isError).toBe(true);
  });

  it('returns an empty entry list for an undefined project list', () => {
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useFleetHealth(undefined), { wrapper: Wrapper });
    expect(result.current.entries).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
