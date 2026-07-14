// The harness/bring-up family view (WO-G9 deliverable 4): had NO viewer
// at all before this WO -- not even a family entry (lithos F145). Tap
// map as a table (channel -> kind -> target -> connector pin), expected
// signals WITH provenance refs, honest absences shown AS absences (not
// hidden), bringup.md rendered, capture configs downloadable.

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { ArtifactIndexRow } from '../../api/client';
import { DataTable } from '../../components/DataTable/DataTable';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ErrorState } from '../../components/ErrorState/ErrorState';
import { PageTitle } from '../../components/PageTitle/PageTitle';
import { useProjectArtifactIndex } from '../../api/hooks';
import { parseCsv } from './csv';
import { MarkdownBlock } from './MarkdownBlock';
import './artifacts.css';

interface ExpectedSignal {
  channel: string;
  expect: string | null;
  source_ref?: string | null;
  reason?: string;
}

function useJson<T>(projectId: string | undefined, row: ArtifactIndexRow | undefined) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!projectId || !row) return;
    let cancelled = false;
    api
      .fetchArtifact(projectId, row.content_hash)
      .then((b) => b.text())
      .then((t) => {
        if (!cancelled) setData(JSON.parse(t) as T);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, row]);
  return { data, error };
}

function useText(projectId: string | undefined, row: ArtifactIndexRow | undefined) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    if (!projectId || !row) return;
    let cancelled = false;
    api
      .fetchArtifact(projectId, row.content_hash)
      .then((b) => b.text())
      .then((t) => {
        if (!cancelled) setText(t);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, row]);
  return text;
}

export function HarnessView() {
  const { projectId } = useParams<{ projectId: string }>();
  const index = useProjectArtifactIndex(projectId);

  const rows = index.data ?? [];
  const tapMapRow = rows.find((r) => r.relpath.endsWith('tap_map.csv'));
  const signalsRow = rows.find((r) => r.kind === 'json' && r.family === 'harness');
  const bringupRow = rows.find((r) => r.relpath.endsWith('bringup.md'));
  const captureRows = rows.filter((r) => r.kind === 'capture_config');

  const tapMapText = useText(projectId, tapMapRow);
  const { data: signals, error: signalsError } = useJson<{ signals: ExpectedSignal[] }>(
    projectId,
    signalsRow,
  );
  const bringupText = useText(projectId, bringupRow);

  if (index.isError) {
    return (
      <ErrorState
        title="Could not load the artifact index"
        detail={String(index.error)}
        onRetry={() => index.refetch()}
      />
    );
  }
  if (index.isLoading) return <p role="status">loading harness artifacts...</p>;
  if (rows.filter((r) => r.family === 'harness').length === 0) {
    return (
      <EmptyState
        title="No harness/bring-up artifacts shipped for this project"
        detail="Named absence -- this project has no bring-up harness target."
      />
    );
  }

  const tapMap = tapMapText ? parseCsv(tapMapText) : null;

  return (
    <div className="gr-harness-view">
      <PageTitle text="Harness / bring-up" />

      <h2 className="gr-section-title">Tap map</h2>
      {!tapMapRow ? (
        <EmptyState
          title="No tap map shipped"
          detail="Named absence -- no tap_map.csv in this harness family."
        />
      ) : !tapMap ? (
        <p role="status">loading tap map...</p>
      ) : (
        <DataTable
          columns={tapMap.headers.map((h, i) => ({
            key: h,
            header: h,
            accessor: (r: string[]) => r[i] ?? '',
          }))}
          rows={tapMap.rows}
          rowKey={(r) => r.join('|')}
          emptyTitle="No tap rows"
        />
      )}

      <h2 className="gr-section-title">Expected signals</h2>
      {!signalsRow ? (
        <EmptyState
          title="No expected-signals record shipped"
          detail="Named absence, not an omission."
        />
      ) : signalsError ? (
        <ErrorState title="Could not parse expected_signals.json" detail={signalsError} />
      ) : !signals ? (
        <p role="status">loading expected signals...</p>
      ) : (
        <DataTable
          columns={[
            { key: 'channel', header: 'Channel', accessor: (s: ExpectedSignal) => s.channel },
            {
              key: 'expect',
              header: 'Expected',
              accessor: (s: ExpectedSignal) => s.expect ?? '(none)',
            },
            {
              key: 'source',
              header: 'Provenance / absence reason',
              accessor: (s: ExpectedSignal) =>
                s.source_ref ??
                s.reason ??
                (s.expect === null
                  ? 'no reason recorded'
                  : '(reference-only, no source assertion)'),
            },
          ]}
          rows={signals.signals}
          rowKey={(s) => s.channel}
          emptyTitle="No expected signals recorded"
        />
      )}

      <h2 className="gr-section-title">Bring-up procedure</h2>
      {!bringupRow ? (
        <EmptyState title="No bringup.md shipped" detail="Named absence." />
      ) : bringupText === null ? (
        <p role="status">loading bringup.md...</p>
      ) : (
        <MarkdownBlock text={bringupText} />
      )}

      <h2 className="gr-section-title">Capture configs</h2>
      {captureRows.length === 0 ? (
        <EmptyState
          title="No capture configs shipped"
          detail="Named absence -- no sigrok-cli config in this harness family."
        />
      ) : (
        <ul className="gr-drawing-list">
          {captureRows.map((r) => (
            <li key={r.relpath}>
              <a href={projectId ? api.artifactUrl(projectId, r.content_hash) : '#'} download>
                {r.relpath}
              </a>{' '}
              ({r.bytes} bytes)
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
