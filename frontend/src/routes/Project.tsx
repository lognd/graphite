// Single-project detail route skeleton: title-block-grade health summary
// plus the obligations audit rows for one project (WO-G3/G4 deepen this).

import { useParams } from 'react-router-dom';
import { useObligations, useProjectHealth } from '../api/hooks';
import { DataTable } from '../components/DataTable/DataTable';
import { VerdictBadge } from '../components/VerdictBadge/VerdictBadge';
import { dispositionToVerdict } from '../components/VerdictBadge/verdict';
import { ReasonCell } from '../components/ReasonCell/ReasonCell';
import { HashChip } from '../components/HashChip/HashChip';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { ErrorState } from '../components/ErrorState/ErrorState';

export function Project() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: health } = useProjectHealth(projectId);
  const { data: obligations, isLoading, isError, error, refetch } = useObligations(projectId);

  if (isError) {
    return (
      <ErrorState
        title={`Could not load obligations for ${projectId}`}
        detail={String(error)}
        onRetry={() => refetch()}
      />
    );
  }

  const rows = obligations?.rows ?? [];

  if (!isLoading && rows.length === 0) {
    return (
      <EmptyState
        title="No obligations recorded for this project"
        detail="Build the project (regolith build) to produce an audit index."
      />
    );
  }

  return (
    <div>
      {health ? (
        <p className="gr-micro-label">
          release {health.release_ok ? 'OK' : 'BLOCKED'} -- {health.obligation_summary.obligations}{' '}
          obligations: {health.obligation_summary.discharged} discharged,{' '}
          {health.obligation_summary.accepted_deviation} accepted,{' '}
          {health.obligation_summary.deferred} deferred, {health.obligation_summary.violated}{' '}
          violated
        </p>
      ) : null}
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
        loading={isLoading}
        emptyTitle="No obligations recorded for this project"
      />
    </div>
  );
}
