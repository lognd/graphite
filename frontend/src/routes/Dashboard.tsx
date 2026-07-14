// Fleet dashboard: answers "is my fleet healthy?" in one interaction
// (charter 2.1). Per-project census rows (obligations/discharged/
// accepted/deferred/violated) as a hairline DataTable with a MarginBar
// rigor ratio (discharged+accepted over obligations -- no fleet health
// endpoint exists, WOG2-F1, so this fans out one /health call per
// project via useFleetHealth); stale-report detection surfaces as a
// flagged column (sourced from ProjectInfo.build_report_stale, never
// recomputed here); every count and the project name link through to
// its filtered obligation explorer / project view (04.1 "ANY TABLE"
// deep-through floor).

import { Link } from 'react-router-dom';
import { useFleetHealth, useProjects } from '../api/hooks';
import type { FleetHealthEntry } from '../api/hooks';
import { DataTable } from '../components/DataTable/DataTable';
import type { DataTableColumn } from '../components/DataTable/DataTable';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { ErrorState } from '../components/ErrorState/ErrorState';
import { MarginBar } from '../components/MarginBar/MarginBar';
import { PageTitle } from '../components/PageTitle/PageTitle';

function obligationLink(project: string, filter?: string): string {
  const base = `/project/${encodeURIComponent(project)}/obligations`;
  return filter ? `${base}?filter=${encodeURIComponent(filter)}` : base;
}

function countCell(entry: FleetHealthEntry, filter: string | undefined, count: number | undefined) {
  if (count === undefined) return entry.isError ? '--' : 'loading';
  return <Link to={obligationLink(entry.project.name, filter)}>{count}</Link>;
}

const COLUMNS: DataTableColumn<FleetHealthEntry>[] = [
  {
    key: 'name',
    header: 'Project',
    accessor: (e) => e.project.name,
    render: (e) => (
      <Link to={`/project/${encodeURIComponent(e.project.name)}`}>{e.project.name}</Link>
    ),
  },
  {
    key: 'stale',
    header: 'Report',
    accessor: (e) =>
      !e.project.has_build_report ? 'missing' : e.project.build_report_stale ? 'STALE' : 'fresh',
  },
  {
    key: 'obligations',
    header: 'Obligations',
    accessor: (e) => e.health?.obligation_summary.obligations ?? null,
    render: (e) => countCell(e, undefined, e.health?.obligation_summary.obligations),
  },
  {
    key: 'discharged',
    header: 'Discharged',
    accessor: (e) => e.health?.obligation_summary.discharged ?? null,
    render: (e) => countCell(e, 'calc_sheet', e.health?.obligation_summary.discharged),
  },
  {
    key: 'accepted',
    header: 'Accepted',
    // accepted_rows, not accepted_deviation: the deep link filters the
    // explorer BY ROW, and forall-expanded obligation instances share one
    // accepted content address (D221.2's two denominators) -- the count a
    // header shows must be the count its drill-down lists (WO-G8
    // coherence sweep). The unique-deviation census count stays visible
    // on the project view and calc book.
    accessor: (e) => e.health?.obligation_summary.accepted_rows ?? null,
    render: (e) => countCell(e, 'accepted_deviation', e.health?.obligation_summary.accepted_rows),
  },
  {
    key: 'deferred',
    header: 'Deferred',
    accessor: (e) => e.health?.obligation_summary.deferred ?? null,
    render: (e) => countCell(e, 'deferred', e.health?.obligation_summary.deferred),
  },
  {
    key: 'violated',
    header: 'Violated',
    accessor: (e) => e.health?.obligation_summary.violated ?? null,
    render: (e) => countCell(e, 'violated', e.health?.obligation_summary.violated),
  },
  {
    key: 'rigor',
    header: 'Rigor',
    sortable: false,
    accessor: (e) => {
      const s = e.health?.obligation_summary;
      if (!s || s.obligations === 0) return null;
      return s.discharged + s.accepted_rows;
    },
    render: (e) => {
      const s = e.health?.obligation_summary;
      if (!s || s.obligations === 0) return e.isError ? '--' : 'loading';
      return (
        <MarginBar
          // Row partition (D221.2): discharged + accepted_rows + deferred
          // + violated == obligations, so this ratio's numerator and
          // denominator share one shape (WO-G8 coherence sweep).
          value={s.discharged + s.accepted_rows}
          limit={s.obligations}
          unit=""
          label="discharged+accepted / obligations"
          labelVisible={false}
        />
      );
    },
  },
  {
    key: 'release',
    header: 'Release gate',
    accessor: (e) => (e.health ? (e.health.release_ok ? 'OK' : 'BLOCKED') : null),
  },
];

export function Dashboard() {
  const { data: projects, isLoading, isError, error, refetch } = useProjects();
  const { entries } = useFleetHealth(projects);

  if (isError) {
    return (
      <ErrorState
        title="Could not load the fleet"
        detail={String(error)}
        onRetry={() => refetch()}
      />
    );
  }

  if (!isLoading && (projects ?? []).length === 0) {
    return (
      <EmptyState
        title="No projects in this fleet yet"
        detail="Run graphite from a directory containing a magnetite.toml, or point the server's scan root at one."
      />
    );
  }

  return (
    <>
      <PageTitle text="Fleet dashboard" />
      <DataTable
        columns={COLUMNS}
        rows={entries}
        rowKey={(e) => e.project.name}
        loading={isLoading}
        emptyTitle="No projects in this fleet yet"
      />
    </>
  );
}
