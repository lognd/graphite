// Calc book browser (WO-G4 deliverable 1): the audit index rendered as the
// zero-unexplained accounting (every obligation -> disposition, D221.2's
// balanced() property made visible) with the calc sheet list underneath.
// Both come off the SAME calc book the CLI ships (spec charter 2.1's
// "show me the artifact" standing question, applied to the calc family).

import { Link, useParams } from 'react-router-dom';
import { useAuditIndex, useCalcSheets } from '../../api/hooks';
import { DataTable } from '../../components/DataTable/DataTable';
import { VerdictBadge } from '../../components/VerdictBadge/VerdictBadge';
import { dispositionToVerdict } from '../../components/VerdictBadge/verdict';
import { ReasonCell } from '../../components/ReasonCell/ReasonCell';
import { HashChip } from '../../components/HashChip/HashChip';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ErrorState } from '../../components/ErrorState/ErrorState';
import './artifacts.css';

export function CalcBook() {
  const { projectId } = useParams<{ projectId: string }>();
  const audit = useAuditIndex(projectId);
  const sheets = useCalcSheets(projectId);

  if (audit.isError) {
    return (
      <ErrorState
        title={`Could not load the calc audit index for ${projectId}`}
        detail={String(audit.error)}
        onRetry={() => audit.refetch()}
      />
    );
  }

  const rows = audit.data?.rows ?? [];
  const summary = audit.data?.summary;
  const sheetRows = sheets.data ?? [];

  if (!audit.isLoading && rows.length === 0) {
    return (
      <EmptyState
        title="No calc book shipped for this project"
        detail="Run `regolith build` (release tier) to produce dist/calc/audit_index.json + calc_book.json."
      />
    );
  }

  return (
    <div className="gr-calc-book">
      {summary ? (
        <p className="gr-micro-label" data-testid="audit-summary">
          {summary.obligations} obligations -- {summary.discharged} discharged,{' '}
          {summary.accepted_rows} accepted ({summary.accepted_deviation} unique deviations),{' '}
          {summary.deferred} deferred, {summary.violated} violated (zero unexplained: rows sum to
          obligations)
        </p>
      ) : null}
      <h2 className="gr-section-title">Audit index</h2>
      <DataTable
        columns={[
          { key: 'claim', header: 'Claim', accessor: (o) => o.claim_name },
          {
            key: 'disposition',
            header: 'Disposition',
            accessor: (o) => o.disposition,
            render: (o) => <VerdictBadge verdict={dispositionToVerdict(o.disposition)} />,
          },
          {
            key: 'detail',
            header: 'Detail',
            accessor: (o) => o.detail,
            render: (o) => <ReasonCell reason={o.detail || null} />,
          },
          { key: 'anchor', header: 'Subject anchor', accessor: (o) => o.subject_anchor || null },
          {
            key: 'hash',
            header: 'Content hash',
            accessor: (o) => o.content_hash,
            render: (o) => <HashChip full={o.content_hash} />,
          },
        ]}
        rows={rows}
        rowKey={(o) => `${o.claim_name}:${o.content_hash}:${o.subject_anchor}`}
        loading={audit.isLoading}
        emptyTitle="No obligations recorded for this project"
      />
      <h2 className="gr-section-title">Calc sheets</h2>
      {sheets.isLoading ? (
        <p role="status">loading calc sheets...</p>
      ) : sheetRows.length === 0 ? (
        <EmptyState
          title="No discharged calc sheets shipped"
          detail="Every obligation here was deferred or waived rather than discharged with a calc sheet."
        />
      ) : (
        <DataTable
          columns={[
            { key: 'sheet', header: 'Sheet', accessor: (s) => s.sheet_id },
            { key: 'claim', header: 'Claim', accessor: (s) => s.claim_text },
            { key: 'model', header: 'Model', accessor: (s) => `${s.model_id} v${s.model_version}` },
            {
              key: 'verdict',
              header: 'Verdict',
              accessor: (s) => s.verdict,
              render: (s) => (
                <VerdictBadge
                  verdict={(s.verdict as 'discharged' | 'violated' | 'deferred') ?? 'deferred'}
                  compact
                />
              ),
            },
            { key: 'margin', header: 'Margin', accessor: (s) => s.margin },
            {
              key: 'open',
              header: '',
              accessor: () => null,
              render: (s) => (
                <Link
                  to={`/artifacts/${encodeURIComponent(projectId ?? '')}/calc/${encodeURIComponent(s.sheet_id)}`}
                >
                  open sheet
                </Link>
              ),
            },
          ]}
          rows={sheetRows}
          rowKey={(s) => s.sheet_id}
          emptyTitle="No calc sheets"
        />
      )}
    </div>
  );
}
