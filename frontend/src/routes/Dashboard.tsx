// Dashboard route: answers "is my fleet healthy?" in one interaction
// (charter 2.1). WO-G3 fills in the real fleet view; this is the route
// skeleton + designed empty/loading states this WO owns.

import { useProjects } from '../api/hooks';
import { DataTable } from '../components/DataTable/DataTable';
import { VerdictBadge } from '../components/VerdictBadge/VerdictBadge';
import { HashChip } from '../components/HashChip/HashChip';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { ErrorState } from '../components/ErrorState/ErrorState';

export function Dashboard() {
  const { data, isLoading, isError, error, refetch } = useProjects();

  if (isError) {
    return (
      <ErrorState
        title="Could not load the fleet"
        detail={String(error)}
        onRetry={() => refetch()}
      />
    );
  }

  if (!isLoading && (data ?? []).length === 0) {
    return (
      <EmptyState
        title="No projects in this fleet yet"
        detail="Run graphite from a directory containing a magnetite.toml, or add a project to the fleet config."
      />
    );
  }

  return (
    <DataTable
      columns={[
        { key: 'name', header: 'Project', accessor: (p) => p.name },
        {
          key: 'hash',
          header: 'Design hash',
          accessor: (p) => p.designHashShort,
          render: (p) => <HashChip full={p.designHashShort} />,
        },
        { key: 'schema', header: 'Schema', accessor: (p) => p.schemaVersion },
        { key: 'lastReport', header: 'Last report', accessor: (p) => p.lastReportAt },
        {
          key: 'verdict',
          header: 'Verdict',
          accessor: (p) => p.verdict,
          render: (p) => <VerdictBadge verdict={p.verdict} />,
        },
      ]}
      rows={data ?? []}
      rowKey={(p) => p.id}
      loading={isLoading}
      emptyTitle="No projects in this fleet yet"
    />
  );
}
