// Drawing detail view (WO-G4 deliverable 2): the shipped SVG sheet inline
// (pan/zoom/fit via PanZoomFrame), PDF download, and per-sheet title-block
// metadata. The `.drawing.json` companion is not (yet) a generated OpenAPI
// schema -- WOG4-F1 escalation below -- so its title block is read
// defensively off the raw shipped bytes rather than asserting a full
// generated type (honesty rule: absent/malformed fields render as "--",
// never a guess).

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useProjectArtifacts } from '../../api/hooks';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ErrorState } from '../../components/ErrorState/ErrorState';
import { HashChip } from '../../components/HashChip/HashChip';
import { PanZoomFrame } from '../../components/PanZoomFrame/PanZoomFrame';
import { findDrawingArtifact } from './artifactLookup';
import './artifacts.css';

interface TitleBlockFields {
  drawing_number?: string;
  revision?: string;
  scale_label?: string;
  subject?: string;
  title?: string;
}

/** WOG4-F1 (marked-provisional bridge, spec 02.7 dedup seam): the drawing
 * sheet schema (title_block, dimensions, views) exists only in regolith's
 * Rust model today, with no OpenAPI-exposed equivalent (unlike CalcSheet,
 * which WO-G1 already generated). Escalate to the coordinator: expose
 * `regolith.backends.drawings`' sheet model the same way calc.py exposes
 * CalcSheet, so this parse can become a generated type instead of a
 * defensive read of `unknown`. */
function readTitleBlock(doc: unknown): TitleBlockFields | null {
  if (typeof doc !== 'object' || doc === null) return null;
  const sheets = (doc as Record<string, unknown>).sheets;
  if (!Array.isArray(sheets) || sheets.length === 0) return null;
  const first = sheets[0];
  if (typeof first !== 'object' || first === null) return null;
  const tb = (first as Record<string, unknown>).title_block;
  if (typeof tb !== 'object' || tb === null) return null;
  return tb as TitleBlockFields;
}

export function DrawingView() {
  const { projectId, name } = useParams<{ projectId: string; name: string }>();
  const artifacts = useProjectArtifacts(projectId);
  const [svgText, setSvgText] = useState<string | null>(null);
  const [svgError, setSvgError] = useState<string | null>(null);
  const [titleBlock, setTitleBlock] = useState<TitleBlockFields | null>(null);

  const svgEntry = findDrawingArtifact(artifacts.data, name ?? '', 'svg');
  const pdfEntry = findDrawingArtifact(artifacts.data, name ?? '', 'pdf');
  const jsonEntry = findDrawingArtifact(artifacts.data, name ?? '', 'drawing.json');

  useEffect(() => {
    if (!projectId || !svgEntry) return;
    let cancelled = false;
    api
      .fetchArtifact(projectId, svgEntry.content_hash)
      .then((blob) => blob.text())
      .then((text) => {
        if (!cancelled) setSvgText(text);
      })
      .catch((err) => {
        if (!cancelled) setSvgError(String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, svgEntry]);

  useEffect(() => {
    if (!projectId || !jsonEntry) return;
    let cancelled = false;
    api
      .fetchArtifact(projectId, jsonEntry.content_hash)
      .then((blob) => blob.text())
      .then((text) => {
        if (!cancelled) setTitleBlock(readTitleBlock(JSON.parse(text)));
      })
      .catch(() => {
        // Title block is a nicety here, not load-bearing for the sheet
        // itself -- a fetch/parse failure just leaves it unrendered.
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, jsonEntry]);

  if (artifacts.isError) {
    return (
      <ErrorState
        title="Could not load this project's artifacts"
        detail={String(artifacts.error)}
        onRetry={() => artifacts.refetch()}
      />
    );
  }
  if (artifacts.isLoading) return <p role="status">loading drawing...</p>;
  if (!svgEntry) {
    return (
      <EmptyState
        title={`No SVG shipped for drawing "${name}"`}
        detail="Only artifacts present in this project's own listing render here (honesty rule)."
      />
    );
  }

  return (
    <article className="gr-drawing-view">
      <table className="gr-title-block-table" aria-label="title block">
        <tbody>
          <tr>
            <th>drawing</th>
            <td>{titleBlock?.drawing_number ?? '--'}</td>
            <th>title</th>
            <td>{titleBlock?.title ?? '--'}</td>
          </tr>
          <tr>
            <th>subject</th>
            <td>{titleBlock?.subject ?? '--'}</td>
            <th>revision</th>
            <td>{titleBlock?.revision ?? '--'}</td>
          </tr>
          <tr>
            <th>scale</th>
            <td>{titleBlock?.scale_label ?? '--'}</td>
            <th>content hash</th>
            <td>
              <HashChip full={svgEntry.content_hash} />
            </td>
          </tr>
        </tbody>
      </table>

      {svgError ? (
        <ErrorState title="Could not load the SVG sheet" detail={svgError} />
      ) : svgText ? (
        <PanZoomFrame ariaLabel={`drawing sheet: ${name}`}>
          {/* Shipped, content-hash-addressed SVG bytes from this project's
              own dist/ -- not user input. */}
          <div dangerouslySetInnerHTML={{ __html: svgText }} />
        </PanZoomFrame>
      ) : (
        <p role="status">loading SVG...</p>
      )}

      <div className="gr-drawing-view__actions">
        {pdfEntry ? (
          <a href={api.artifactUrl(projectId ?? '', pdfEntry.content_hash)} download>
            download PDF ({pdfEntry.relpath})
          </a>
        ) : (
          <span className="gr-reason-cell gr-reason-cell--empty">no PDF shipped</span>
        )}
      </div>
    </article>
  );
}
