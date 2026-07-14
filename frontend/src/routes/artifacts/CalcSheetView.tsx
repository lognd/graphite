// Calc sheet detail view (WO-G4 deliverable 1): the engineering calc sheet
// -- claim, model + citation, inputs with provenance pins, margin
// (MarginBar), verdict, evidence chain (HashChips) -- rendered from the
// SAME JSON the CLI ships, with the PDF one click away (04.1 "any detail
// view": raw-JSON toggle, copyable hash, permalink via the URL param
// already, "open in files" pointer).

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useCalcSheets, useProjectArtifacts } from '../../api/hooks';
import { DetailNav } from '../../components/DetailNav/DetailNav';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ErrorState } from '../../components/ErrorState/ErrorState';
import { HashChip } from '../../components/HashChip/HashChip';
import { MarginBar } from '../../components/MarginBar/MarginBar';
import { VerdictBadge } from '../../components/VerdictBadge/VerdictBadge';
import type { Verdict } from '../../components/VerdictBadge/verdict';
import { findCalcSheetPdf } from './artifactLookup';
import './artifacts.css';

function asVerdict(v: string): Verdict {
  return v === 'discharged' || v === 'violated' || v === 'deferred' || v === 'accepted-deviation'
    ? v
    : 'excluded';
}

/** Split a compound margin string ("value/limit unit") the calc backend
 * emits as free text into a numeric bar where possible; otherwise the raw
 * text renders verbatim (never a guessed number -- honesty rule). */
function parseMargin(margin: string): { value: number; limit: number } | null {
  const n = Number(margin);
  if (Number.isFinite(n)) return { value: n, limit: n === 0 ? 1 : Math.abs(n) };
  return null;
}

export function CalcSheetView() {
  const { projectId, sheetId } = useParams<{ projectId: string; sheetId: string }>();
  const sheets = useCalcSheets(projectId);
  const artifacts = useProjectArtifacts(projectId);
  const [showRaw, setShowRaw] = useState(false);

  if (sheets.isError) {
    return (
      <ErrorState
        title="Could not load the calc book"
        detail={String(sheets.error)}
        onRetry={() => sheets.refetch()}
      />
    );
  }
  if (sheets.isLoading) return <p role="status">loading calc sheet...</p>;

  const sheetRows = sheets.data ?? [];
  const sheetIndex = sheetRows.findIndex((s) => s.sheet_id === sheetId);
  const sheet = sheetIndex >= 0 ? sheetRows[sheetIndex] : undefined;
  // Prev/next over the calc book's OWN sheet order (the order the
  // pipeline emitted into calc_book.json, the same order the CalcBook
  // table lists) -- closing WO-G4's deferred detail-view row at WO-G8:
  // the ordering is read off data, not invented.
  const prevSheet = sheetIndex > 0 ? sheetRows[sheetIndex - 1] : undefined;
  const nextSheet =
    sheetIndex >= 0 && sheetIndex < sheetRows.length - 1 ? sheetRows[sheetIndex + 1] : undefined;
  const sheetHref = (s: { sheet_id: string }) =>
    `/artifacts/${encodeURIComponent(projectId ?? '')}/calc/${encodeURIComponent(s.sheet_id)}`;
  if (!sheet) {
    return (
      <EmptyState
        title={`Calc sheet "${sheetId}" not found`}
        detail="It may have been renamed, or this project's calc book was rebuilt since the link was made."
      />
    );
  }

  const pdf = findCalcSheetPdf(artifacts.data, sheet.sheet_id);
  const marginNum = parseMargin(sheet.margin);

  return (
    <article className="gr-calc-sheet">
      <DetailNav
        prevTo={prevSheet ? sheetHref(prevSheet) : null}
        nextTo={nextSheet ? sheetHref(nextSheet) : null}
        index={sheetIndex}
        total={sheetRows.length}
      />
      <header className="gr-calc-sheet__header">
        <h1>{sheet.claim_text}</h1>
        <VerdictBadge verdict={asVerdict(sheet.verdict)} />
      </header>

      <dl className="gr-calc-sheet__meta">
        <div>
          <dt className="gr-micro-label">model</dt>
          <dd>
            {sheet.model_id} v{sheet.model_version} ({sheet.solver})
          </dd>
        </div>
        <div>
          <dt className="gr-micro-label">citation</dt>
          <dd>{sheet.citation || '--'}</dd>
        </div>
        <div>
          <dt className="gr-micro-label">tier</dt>
          <dd>{sheet.tier}</dd>
        </div>
        <div>
          <dt className="gr-micro-label">attestation</dt>
          <dd>{sheet.attestation}</dd>
        </div>
      </dl>

      {marginNum ? (
        <MarginBar value={marginNum.value} limit={marginNum.limit} unit="" label="margin" />
      ) : (
        <p>
          <span className="gr-micro-label">margin</span> {sheet.margin}
        </p>
      )}

      <h2 className="gr-section-title">Inputs</h2>
      <table className="gr-calc-sheet__inputs">
        <thead>
          <tr>
            <th>name</th>
            <th>value</th>
            <th>provenance</th>
            <th>source</th>
            <th>pin</th>
          </tr>
        </thead>
        <tbody>
          {sheet.inputs.map((input) => (
            <tr key={input.name}>
              <td>{input.name}</td>
              <td>{input.value}</td>
              <td>{input.provenance}</td>
              <td>{input.source || '--'}</td>
              <td>{input.pin ? <HashChip full={input.pin} /> : '--'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="gr-section-title">Evidence chain</h2>
      <ul className="gr-calc-sheet__chain">
        <li>
          sheet digest <HashChip full={sheet.chain.sheet_digest} />
        </li>
        <li>
          evidence hash <HashChip full={sheet.chain.evidence_hash} />
        </li>
        {sheet.chain.subject_ref ? (
          <li>
            subject ref <HashChip full={sheet.chain.subject_ref} />
          </li>
        ) : null}
        {sheet.chain.record_pins.map((pin) => (
          <li key={pin}>
            record pin <HashChip full={pin} />
          </li>
        ))}
        {sheet.chain.payload_refs.map((ref) => (
          <li key={ref}>
            payload ref <HashChip full={ref} />
          </li>
        ))}
      </ul>

      <div className="gr-calc-sheet__actions">
        {pdf ? (
          <a
            href={api.artifactUrl(projectId ?? '', pdf.content_hash)}
            download
            className="gr-calc-sheet__pdf-link"
          >
            download PDF ({pdf.relpath})
          </a>
        ) : (
          <span className="gr-reason-cell gr-reason-cell--empty">
            no PDF shipped for this sheet
          </span>
        )}
        <button type="button" onClick={() => setShowRaw((v) => !v)}>
          {showRaw ? 'hide raw JSON' : 'show raw JSON'}
        </button>
      </div>
      {showRaw ? <pre className="gr-calc-sheet__raw">{JSON.stringify(sheet, null, 2)}</pre> : null}
    </article>
  );
}
