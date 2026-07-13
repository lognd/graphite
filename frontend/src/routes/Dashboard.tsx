// Dashboard route: answers "is my fleet healthy?" in one interaction
// (charter 2.1). WO-G3 fills in the real fleet view (per-project health
// verdicts need N /health calls or a fleet endpoint -- WO-G3's call);
// this WO owns the route skeleton, the projects listing, and designed
// empty/loading/error states.

import { Link } from 'react-router-dom';
import { useProjects } from '../api/hooks';
import { DataTable } from '../components/DataTable/DataTable';
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
        detail="Run graphite from a directory containing a magnetite.toml, or point the server's scan root at one."
      />
    );
  }

  return (
    <DataTable
      columns={[
        {
          key: 'name',
          header: 'Project',
          accessor: (p) => p.name,
          render: (p) => <Link to={`/project/${encodeURIComponent(p.name)}`}>{p.name}</Link>,
        },
        { key: 'version', header: 'Version', accessor: (p) => p.version },
        { key: 'root', header: 'Root', accessor: (p) => p.root },
        {
          key: 'build_report',
          header: 'Build report',
          accessor: (p) => (p.has_build_report ? 'present' : 'missing'),
        },
        {
          key: 'lockfile',
          header: 'Lockfile',
          accessor: (p) => (p.has_lockfile ? 'present' : 'missing'),
        },
        { key: 'dist', header: 'dist/', accessor: (p) => (p.has_dist ? 'present' : 'missing') },
      ]}
      rows={data ?? []}
      rowKey={(p) => p.name}
      loading={isLoading}
      emptyTitle="No projects in this fleet yet"
    />
  );
}
