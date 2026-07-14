// Renders ONE artifact-index row per its viewer hint, with the honest
// fallback ladder (WO-G9 deliverable 2): svg/raster/table/markdown/json/
// text render richly; `binary` (and anything unrecognized) still shows
// name/family/size/hash and WHY there is no rich view -- never a blank
// pane.

import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { ArtifactIndexRow } from '../../api/client';
import { DataTable } from '../../components/DataTable/DataTable';
import { HashChip } from '../../components/HashChip/HashChip';
import { parseCsv } from './csv';
import { MarkdownBlock } from './MarkdownBlock';
import { strategyFor } from './viewerRegistry';

function useTextContent(projectId: string | undefined, row: ArtifactIndexRow, want: boolean) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!projectId || !want) return;
    let cancelled = false;
    api
      .fetchArtifact(projectId, row.content_hash)
      .then((blob) => blob.text())
      .then((t) => {
        if (!cancelled) setText(t);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, row.content_hash, want]);
  return { text, error };
}

export function FileRenderer({
  projectId,
  row,
}: {
  projectId: string | undefined;
  row: ArtifactIndexRow;
}) {
  const strategy = strategyFor(row.viewer);
  const needsText =
    strategy === 'csv-table' ||
    strategy === 'markdown' ||
    strategy === 'pretty-json' ||
    strategy === 'plain-text' ||
    strategy === 'inline-svg';
  const { text, error } = useTextContent(projectId, row, needsText);

  const downloadUrl = projectId ? api.artifactUrl(projectId, row.content_hash) : undefined;

  if (error) {
    return (
      <p className="gr-reason-cell">
        could not fetch {row.relpath}: {error}
      </p>
    );
  }

  if (strategy === 'inline-svg') {
    if (text === null) return <p role="status">loading {row.relpath}...</p>;
    return (
      <div
        className="gr-file-renderer__svg"
        dangerouslySetInnerHTML={{ __html: sanitizeSvg(text) }}
      />
    );
  }
  if (strategy === 'inline-img' && downloadUrl) {
    return <img src={downloadUrl} alt={row.relpath} style={{ maxWidth: '100%' }} />;
  }
  if (strategy === 'csv-table') {
    if (text === null) return <p role="status">loading {row.relpath}...</p>;
    const { headers, rows } = parseCsv(text);
    return (
      <DataTable
        columns={headers.map((h, i) => ({
          key: h || `col${i}`,
          header: h,
          accessor: (r: string[]) => r[i] ?? '',
        }))}
        rows={rows}
        rowKey={(r) => r.join('|')}
        emptyTitle={`No rows in ${row.relpath}`}
      />
    );
  }
  if (strategy === 'markdown') {
    if (text === null) return <p role="status">loading {row.relpath}...</p>;
    return <MarkdownBlock text={text} />;
  }
  if (strategy === 'pretty-json') {
    if (text === null) return <p role="status">loading {row.relpath}...</p>;
    let pretty = text;
    try {
      pretty = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      // not valid JSON despite the hint -- show raw text honestly.
    }
    return <pre className="gr-file-renderer__pre">{pretty}</pre>;
  }
  if (strategy === 'plain-text') {
    if (text === null) return <p role="status">loading {row.relpath}...</p>;
    return <pre className="gr-file-renderer__pre">{text}</pre>;
  }
  if (strategy === 'glb-embed') {
    return (
      <p className="gr-reason-cell">
        3D model ({row.media_type}, {row.bytes} bytes) -- open via the dedicated 3D family view for
        the interactive viewer.{' '}
        {downloadUrl ? (
          <a href={downloadUrl} download>
            download
          </a>
        ) : null}
      </p>
    );
  }
  if (strategy === 'gerber-stack') {
    return (
      <p className="gr-reason-cell">
        gerber layer ({row.kind}) -- open via the Boards family view for the stacked layer render.{' '}
        {downloadUrl ? (
          <a href={downloadUrl} download>
            download raw
          </a>
        ) : null}
      </p>
    );
  }

  // honest-fallback: binary, or a viewer hint graphite has never heard
  // of (a future lithos vocabulary addition) -- name/family/size/hash +
  // WHY, never a blank pane.
  return (
    <div className="gr-file-renderer__fallback">
      <p>
        <strong>{row.relpath}</strong> ({row.family}/{row.kind})
      </p>
      <p className="gr-reason-cell">
        {row.bytes} bytes, {row.media_type} -- no rich viewer for hint {'"'}
        {row.viewer}
        {'"'} in this build of graphite (
        {row.viewer === 'binary' ? 'lithos itself marks this binary' : 'unrecognized viewer hint'}).
      </p>
      <HashChip full={row.content_hash} />
      {downloadUrl ? (
        <p>
          <a href={downloadUrl} download>
            download
          </a>
        </p>
      ) : null}
    </div>
  );
}

/** Strip <script>/event-handler attributes before inline-rendering a
 * shipped SVG (charter 3.1 ANTI-VIBE: no arbitrary script execution from
 * artifact content, even trusted-pipeline content). */
function sanitizeSvg(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');
}
