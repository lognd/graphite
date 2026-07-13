// Run console (WO-G5): verb + project + flags form, live LogPane +
// per-phase ProgressRail over the D228 typed-progress SSE stream, cancel,
// exit-summary verdict diff, and run history with detail replay + re-run.
//
// The frontend NEVER parses the progress wire-shape text itself -- the
// server (`graphite.server.routes.runs`) already parsed it with
// `regolith.progress.parse_line` (the ONE parser, dedup law 04.2) and
// emits typed `progress` SSE events; this view only ever consumes JSON.

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  useCancelRun,
  useProjectConfig,
  useProjects,
  useRunLog,
  useRuns,
  useStartRun,
  useVerdictDiff,
} from '../api/hooks';
import { api } from '../api/client';
import type { HealthSnapshot, RunProgressEvent, RunRecord, RunVerb } from '../api/client';
import { useRunContext } from '../app/RunContext';
import { DataTable } from '../components/DataTable/DataTable';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { ErrorState } from '../components/ErrorState/ErrorState';
import { LogPane } from '../components/LogPane/LogPane';
import { ProgressRail } from '../components/ProgressRail/ProgressRail';

const VERBS: RunVerb[] = ['check', 'build', 'ship', 'test', 'optimize', 'preview'];

// Which config key (if any) supplies a verb's default flags, and how its
// value maps to a flag string -- the "config-aware defaults with
// where-attribution" deliverable. Kept as ONE small table rather than
// scattered per-verb conditionals (dedup law).
const VERB_DEFAULT_CONFIG_KEY: Partial<Record<RunVerb, string>> = {
  build: 'build.release',
};

function defaultArgsFor(
  verb: RunVerb,
  configEntries: { key: string; value: string; source: string }[] | undefined,
) {
  const key = VERB_DEFAULT_CONFIG_KEY[verb];
  if (!key || !configEntries) return { args: '', attribution: null as string | null };
  const entry = configEntries.find((e) => e.key === key);
  if (!entry) return { args: '', attribution: null as string | null };
  if (key === 'build.release' && entry.value === 'true') {
    return { args: '--release', attribution: `${key}=${entry.value} (source: ${entry.source})` };
  }
  return { args: '', attribution: `${key}=${entry.value} (source: ${entry.source})` };
}

interface PhaseProgress {
  phase: string;
  done: number | null;
  total: number | null;
  elapsed: number;
}

function verdictLine(before: HealthSnapshot | null | undefined, after: HealthSnapshot | undefined) {
  if (!after) return null;
  const b = before ?? {};
  return `release_ok: ${b.release_ok ?? '?'} -> ${after.release_ok ?? '?'} -- violated: ${b.violated ?? '?'} -> ${after.violated ?? '?'} / ${b.total_obligations ?? '?'} -> ${after.total_obligations ?? '?'} total`;
}

function durationOf(record: RunRecord): string {
  if (!record.finished_at) return 'running';
  const ms = new Date(record.finished_at).getTime() - new Date(record.started_at).getTime();
  return `${(ms / 1000).toFixed(1)}s`;
}

export function Runs() {
  const { data: projects } = useProjects();
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [verb, setVerb] = useState<RunVerb>('check');
  const [argsText, setArgsText] = useState('');
  const [runId, setRunId] = useState<string | null>(null);
  const [status, setStatus] = useState<RunRecord['status']>('running');
  const [logLines, setLogLines] = useState<string[]>([]);
  const [phases, setPhases] = useState<Record<string, PhaseProgress>>({});
  const [historyDetailId, setHistoryDetailId] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const startedAtRef = useRef<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const effectiveProject = selectedProject || projects?.[0]?.name || '';
  const config = useProjectConfig(effectiveProject || undefined);
  const runs = useRuns(effectiveProject || undefined);
  const startRun = useStartRun();
  const cancelRun = useCancelRun();
  const verdictDiff = useVerdictDiff(status !== 'running' ? (runId ?? undefined) : undefined);
  const { setActiveRun, updateActiveRun } = useRunContext();

  const historyLog = useRunLog(historyDetailId ?? undefined);
  const historyDiff = useVerdictDiff(historyDetailId ?? undefined);
  const historyRecord = runs.data?.find((r) => r.run_id === historyDetailId);

  function onVerbChange(nextVerb: RunVerb) {
    setVerb(nextVerb);
    setArgsText(defaultArgsFor(nextVerb, config.data).args);
  }

  useEffect(() => {
    if (status !== 'running') return undefined;
    const id = window.setInterval(() => {
      const secs = Math.floor((Date.now() - startedAtRef.current) / 1000);
      setElapsedSeconds(secs);
      updateActiveRun({ elapsedSeconds: secs });
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  const { attribution } = defaultArgsFor(verb, config.data);

  function startTheRun() {
    if (!effectiveProject) return;
    const args = argsText.split(/\s+/).filter(Boolean);
    startRun.mutate(
      { project: effectiveProject, verb, args },
      {
        onSuccess: (record) => {
          setRunId(record.run_id);
          setStatus('running');
          setLogLines([]);
          setPhases({});
          setElapsedSeconds(0);
          startedAtRef.current = Date.now();
          setActiveRun({
            runId: record.run_id,
            project: effectiveProject,
            verb,
            phase: null,
            done: null,
            total: null,
            elapsedSeconds: 0,
            status: 'running',
          });
          eventSourceRef.current?.close();
          eventSourceRef.current = api.subscribeRunEvents(record.run_id, {
            onLog: (e) => setLogLines((prev) => [...prev, e.line]),
            onProgress: (e: RunProgressEvent) => {
              setPhases((prev) => ({
                ...prev,
                [e.phase]: { phase: e.phase, done: e.done, total: e.total, elapsed: e.elapsed },
              }));
              updateActiveRun({ phase: e.phase, done: e.done, total: e.total });
            },
            onDone: (e) => {
              setStatus(e.status);
              updateActiveRun({ status: e.status });
              void runs.refetch();
            },
          });
        },
      },
    );
  }

  function cancelTheRun() {
    if (!runId) return;
    cancelRun.mutate(runId, {
      onSuccess: (record) => {
        setStatus(record.status);
        updateActiveRun({ status: record.status });
      },
    });
  }

  const columns = useMemo(
    () => [
      {
        key: 'status',
        header: 'Status',
        accessor: (r: RunRecord) => r.status,
      },
      { key: 'verb', header: 'Verb', accessor: (r: RunRecord) => r.verb },
      {
        key: 'duration',
        header: 'Duration',
        accessor: (r: RunRecord) => durationOf(r),
      },
      { key: 'started_at', header: 'Started', accessor: (r: RunRecord) => r.started_at },
      {
        key: 'actions',
        header: 'Actions',
        accessor: () => '',
        render: (r: RunRecord) => (
          <>
            <button type="button" onClick={() => setHistoryDetailId(r.run_id)}>
              detail
            </button>{' '}
            <button
              type="button"
              onClick={() =>
                startRun.mutate({ project: effectiveProject, verb: r.verb, args: [...r.args] })
              }
            >
              re-run
            </button>
          </>
        ),
      },
    ],
    [startRun, effectiveProject],
  );

  if (!projects || projects.length === 0) {
    return (
      <EmptyState
        title="No runs recorded yet"
        detail="No project is discoverable under this server's scan root -- there is nothing to run."
      />
    );
  }

  return (
    <div className="gr-runs">
      <section aria-label="run form">
        <h2 className="gr-micro-label">start a run</h2>
        <label>
          project
          <select
            aria-label="project"
            value={effectiveProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            {projects.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </label>{' '}
        <label>
          verb
          <select
            aria-label="verb"
            value={verb}
            onChange={(e) => onVerbChange(e.target.value as RunVerb)}
          >
            {VERBS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>{' '}
        <label>
          flags
          <input
            aria-label="flags"
            type="text"
            value={argsText}
            onChange={(e) => setArgsText(e.target.value)}
          />
        </label>{' '}
        <button
          type="button"
          onClick={startTheRun}
          disabled={startRun.isPending || status === 'running'}
        >
          start
        </button>
        {attribution ? <p className="gr-micro-label">default flags from {attribution}</p> : null}
        {startRun.isError ? (
          <ErrorState title="Could not start run" detail={String(startRun.error)} />
        ) : null}
      </section>

      {runId ? (
        <section aria-label="active run">
          <h2 className="gr-micro-label">
            run {runId.slice(0, 8)} -- {status}
          </h2>
          {Object.values(phases).map((p) => (
            <ProgressRail
              key={p.phase}
              step={p.phase}
              percent={
                p.done !== null && p.total !== null && p.total > 0
                  ? Math.round((p.done / p.total) * 100)
                  : null
              }
              elapsedSeconds={elapsedSeconds}
              onCancel={status === 'running' ? cancelTheRun : undefined}
            />
          ))}
          {Object.keys(phases).length === 0 ? (
            <ProgressRail
              step={status === 'running' ? 'starting...' : status}
              percent={null}
              elapsedSeconds={elapsedSeconds}
              onCancel={status === 'running' ? cancelTheRun : undefined}
            />
          ) : null}
          <LogPane lines={logLines} />
          {status !== 'running' ? (
            <div aria-label="exit summary" data-testid="exit-summary">
              <h3 className="gr-micro-label">exit summary: {status}</h3>
              {verdictDiff.data ? (
                <p>{verdictLine(verdictDiff.data.before, verdictDiff.data.after)}</p>
              ) : (
                <p role="status">loading verdict diff...</p>
              )}
            </div>
          ) : null}
        </section>
      ) : null}

      <section aria-label="run history">
        <h2 className="gr-micro-label">run history</h2>
        <DataTable
          columns={columns}
          rows={[...(runs.data ?? [])]}
          rowKey={(r) => r.run_id}
          loading={runs.isLoading}
          emptyTitle="No runs recorded for this project yet"
        />
      </section>

      {historyDetailId ? (
        <section aria-label="run detail replay">
          <h2 className="gr-micro-label">run {historyDetailId.slice(0, 8)} replay</h2>
          {historyRecord ? (
            <p>
              {historyRecord.verb} {historyRecord.args.join(' ')} -- {historyRecord.status} (
              {durationOf(historyRecord)})
            </p>
          ) : null}
          <LogPane lines={historyLog.data ?? []} />
          {historyDiff.data ? (
            <p>{verdictLine(historyDiff.data.before, historyDiff.data.after)}</p>
          ) : null}
          <button type="button" onClick={() => setHistoryDetailId(null)}>
            close
          </button>
        </section>
      ) : null}
    </div>
  );
}
