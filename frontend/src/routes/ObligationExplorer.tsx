// The flagship obligation table (WO-G3 deliverable 3): answers "why did
// this claim defer/fail?" (charter 2.1). Every obligation with its
// verdict (VerdictBadge), margin (MarginBar where the claim text states
// a numeric bound -- charter 3.2 forbids fabricating one otherwise),
// model id, deferral ReasonCell, and subject part; group-by
// reason/family/part kept in URL state so every dashboard count deep-
// links straight into a filtered/grouped view; the full 04.1 "any list
// of problems" checklist including copy-as-report.

import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';
import { useCalcSheets, useObligations } from '../api/hooks';
import type { AuditRow, CalcSheet } from '../api/client';
import { DataTable } from '../components/DataTable/DataTable';
import type { DataTableColumn } from '../components/DataTable/DataTable';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { ErrorState } from '../components/ErrorState/ErrorState';
import { MarginBar } from '../components/MarginBar/MarginBar';
import { ReasonCell } from '../components/ReasonCell/ReasonCell';
import { VerdictBadge } from '../components/VerdictBadge/VerdictBadge';
import { dispositionToVerdict } from '../components/VerdictBadge/verdict';
import { parseClaimLimit } from '../lib/claimLimit';
import { encodeClaimKey } from '../lib/claimKey';
import { PageTitle } from '../components/PageTitle/PageTitle';
import './ObligationExplorer.css';

type GroupBy = 'none' | 'reason' | 'family' | 'part';

interface Enriched {
  row: AuditRow;
  sheet: CalcSheet | undefined;
}

function family(claimName: string): string {
  return claimName.split('[', 1)[0];
}

// A design-log rule reference embedded in a free-text reason, e.g.
// "...D195.3..." or "...WO-74...". Only the D-number form links today
// (the ledger's own citation convention); absent when not present, per
// ReasonCell's contract -- never invented.
const RULE_PATTERN = /\bD\d+(?:\.\d+)?\b/;

function ruleNumber(detail: string): string | null {
  const match = RULE_PATTERN.exec(detail);
  return match ? match[0] : null;
}

function groupKey(mode: GroupBy, e: Enriched): string {
  switch (mode) {
    case 'reason':
      return e.row.disposition;
    case 'family':
      return family(e.row.claim_name);
    case 'part':
      return e.row.subject_anchor || '(none)';
    default:
      return '';
  }
}

function marginCell(sheet: CalcSheet | undefined) {
  if (!sheet) return '--';
  const parsed = parseClaimLimit(sheet.claim_text);
  if (!parsed) return `${sheet.value} / ${sheet.margin}`;
  return (
    <MarginBar value={Number(sheet.value)} limit={parsed.limit} unit={parsed.unit} label="margin" />
  );
}

function toReportMarkdown(rows: Enriched[]): string {
  const header = '| Claim | Disposition | Subject | Model | Reason |\n|---|---|---|---|---|';
  const body = rows
    .map(
      (e) =>
        `| ${e.row.claim_name} | ${e.row.disposition} | ${e.row.subject_anchor || '--'} | ${
          e.sheet?.model_id ?? '--'
        } | ${e.row.detail.replace(/\|/g, '\\|')} |`,
    )
    .join('\n');
  return `${header}\n${body}`;
}

// frob:doc docs/guide.md#2-the-obligation-explorer-why-did-this-claim-deferfail
export function ObligationExplorer() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get('filter') ?? undefined;
  const group = (searchParams.get('group') as GroupBy | null) ?? 'none';

  const obligations = useObligations(projectId, filter ? { filter } : {});
  const sheets = useCalcSheets(projectId);

  const enriched: Enriched[] = useMemo(() => {
    const bySheetId = new Map((sheets.data ?? []).map((s) => [s.sheet_id, s]));
    return (obligations.data?.rows ?? []).map((row) => ({
      row,
      sheet: bySheetId.get(`${row.claim_name}::${row.subject_anchor}`),
    }));
  }, [obligations.data, sheets.data]);

  const grouped = useMemo(() => {
    if (group === 'none') return null;
    const buckets = new Map<string, Enriched[]>();
    for (const e of enriched) {
      const key = groupKey(group, e);
      const bucket = buckets.get(key) ?? [];
      bucket.push(e);
      buckets.set(key, bucket);
    }
    return [...buckets.entries()].sort(([a], [b]) => (a < b ? -1 : 1));
  }, [enriched, group]);

  if (obligations.isError) {
    return (
      <ErrorState
        title={`Could not load obligations for ${projectId}`}
        detail={String(obligations.error)}
        onRetry={() => obligations.refetch()}
      />
    );
  }

  if (!obligations.isLoading && enriched.length === 0) {
    return (
      <EmptyState
        title="No obligations match this view"
        detail={
          filter
            ? `No rows have disposition "${filter}". Clear the filter to see every obligation.`
            : 'Build the project (regolith build) to produce an audit index.'
        }
        action={
          filter ? (
            <button
              type="button"
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.delete('filter');
                setSearchParams(next);
              }}
            >
              clear filter
            </button>
          ) : undefined
        }
      />
    );
  }

  const columns: DataTableColumn<Enriched>[] = [
    { key: 'claim', header: 'Claim', accessor: (e) => e.row.claim_name },
    {
      key: 'verdict',
      header: 'Verdict',
      accessor: (e) => e.row.disposition,
      render: (e) => <VerdictBadge verdict={dispositionToVerdict(e.row.disposition)} />,
    },
    {
      key: 'margin',
      header: 'Margin',
      sortable: false,
      accessor: (e) => (e.sheet ? e.sheet.margin : null),
      render: (e) => marginCell(e.sheet),
    },
    {
      key: 'model',
      header: 'Model',
      accessor: (e) => e.sheet?.model_id ?? null,
    },
    {
      key: 'reason',
      header: 'Reason',
      accessor: (e) => e.row.detail,
      render: (e) => (
        <ReasonCell reason={e.row.detail || null} fNumber={ruleNumber(e.row.detail)} />
      ),
    },
    { key: 'part', header: 'Subject part', accessor: (e) => e.row.subject_anchor || null },
    {
      key: 'detail',
      header: 'Claim detail',
      sortable: false,
      accessor: () => null,
      render: (e) => (
        <Link to={`/project/${encodeURIComponent(projectId ?? '')}/claim/${encodeClaimKey(e.row)}`}>
          view
        </Link>
      ),
    },
  ];

  function setGroup(mode: GroupBy) {
    const next = new URLSearchParams(searchParams);
    if (mode === 'none') next.delete('group');
    else next.set('group', mode);
    setSearchParams(next);
  }

  async function copyAsReport(rows: Enriched[]) {
    await navigator.clipboard?.writeText(toReportMarkdown(rows));
  }

  return (
    <div className={`gr-obligation-explorer${grouped ? '' : ' gr-obligation-explorer--flat'}`}>
      <PageTitle text="Obligation explorer" />
      <div className="gr-obligation-explorer__toolbar">
        <span className="gr-micro-label">group by</span>
        {(['none', 'reason', 'family', 'part'] as GroupBy[]).map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={group === mode}
            onClick={() => setGroup(mode)}
          >
            {mode}
          </button>
        ))}
        {filter ? (
          <span className="gr-micro-label">
            filter: {filter}{' '}
            <button
              type="button"
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.delete('filter');
                setSearchParams(next);
              }}
            >
              clear
            </button>
          </span>
        ) : null}
        <button type="button" onClick={() => copyAsReport(enriched)}>
          copy as report
        </button>
      </div>

      {grouped ? (
        grouped.map(([key, rows]) => (
          <section key={key} aria-label={`group ${key}`}>
            <h2 className="gr-micro-label">
              {key} <span>({rows.length})</span>
              <button type="button" onClick={() => copyAsReport(rows)}>
                copy group as report
              </button>
            </h2>
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(e) => `${e.row.claim_name}:${e.row.content_hash}:${e.row.subject_anchor}`}
              loading={obligations.isLoading}
              emptyTitle="No obligations in this group"
            />
          </section>
        ))
      ) : (
        <DataTable
          columns={columns}
          rows={enriched}
          rowKey={(e) => `${e.row.claim_name}:${e.row.content_hash}:${e.row.subject_anchor}`}
          loading={obligations.isLoading}
          emptyTitle="No obligations recorded for this project"
        />
      )}
    </div>
  );
}
