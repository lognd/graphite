// Single-project detail route skeleton: the title block + obligations
// table for one project (WO-G3/G4 deepen this).

import { useParams } from 'react-router-dom';
import { useObligations, useProjects } from '../api/hooks';
import { DataTable } from '../components/DataTable/DataTable';
import { VerdictBadge } from '../components/VerdictBadge/VerdictBadge';
import { ReasonCell } from '../components/ReasonCell/ReasonCell';
import { MarginBar } from '../components/MarginBar/MarginBar';
import { EmptyState } from '../components/EmptyState/EmptyState';

export function Project() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: projects } = useProjects();
  const { data: obligations, isLoading } = useObligations(projectId);
  const project = projects?.find((p) => p.id === projectId);

  if (!project) {
    return (
      <EmptyState
        title="Project not found"
        detail={`No project with id "${projectId}" in this fleet.`}
      />
    );
  }

  return (
    <DataTable
      columns={[
        { key: 'id', header: 'ID', accessor: (o) => o.id },
        { key: 'family', header: 'Family', accessor: (o) => o.family },
        {
          key: 'verdict',
          header: 'Verdict',
          accessor: (o) => o.verdict,
          render: (o) => <VerdictBadge verdict={o.verdict} />,
        },
        {
          key: 'reason',
          header: 'Reason',
          accessor: (o) => o.reason,
          render: (o) => <ReasonCell reason={o.reason} fNumber={o.fNumber} />,
        },
        {
          key: 'margin',
          header: 'Margin',
          accessor: (o) => o.marginValue,
          render: (o) =>
            o.marginValue !== null && o.marginLimit !== null && o.marginUnit ? (
              <MarginBar value={o.marginValue} limit={o.marginLimit} unit={o.marginUnit} />
            ) : (
              '--'
            ),
        },
      ]}
      rows={obligations ?? []}
      rowKey={(o) => o.id}
      loading={isLoading}
      emptyTitle="No obligations recorded for this project"
    />
  );
}
