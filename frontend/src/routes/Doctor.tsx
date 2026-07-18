// Doctor view (WO-G6 deliverable 2): `regolith doctor --json` rendered
// verbatim -- every optional external tool's found/missing state,
// version, and (for missing tools) the honest install-guidance note.
// `regolith doctor` always freshly probes (toolenv.py's resolve_all_
// tools has no cache doctor opts out of), so "re-probe" is a plain
// refetch, not a separate mutation.

import { useState } from 'react';
import { DataTable } from '../components/DataTable/DataTable';
import type { DataTableColumn } from '../components/DataTable/DataTable';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { ErrorState } from '../components/ErrorState/ErrorState';
import { useDoctor, useProjects } from '../api/hooks';
import type { DoctorEntry } from '../api/client';
import { PageTitle } from '../components/PageTitle/PageTitle';
import './Doctor.css';

const COLUMNS: DataTableColumn<DoctorEntry>[] = [
  {
    key: 'name',
    header: 'tool',
    accessor: (row) => row.name,
    sortable: true,
  },
  {
    key: 'found',
    header: 'status',
    accessor: (row) => (row.found ? 'found' : 'missing'),
    sortable: true,
    render: (row) => (
      <span className={`gr-doctor-status gr-doctor-status--${row.found ? 'found' : 'missing'}`}>
        {row.found ? 'found' : 'MISSING'}
      </span>
    ),
  },
  {
    key: 'version',
    header: 'version',
    accessor: (row) => row.version,
  },
  {
    key: 'path',
    header: 'path',
    accessor: (row) => row.path,
  },
  {
    key: 'capability',
    header: 'unlocks',
    accessor: (row) => row.capability,
  },
  {
    key: 'install_hint',
    header: 'install',
    accessor: (row) => row.install_hint,
  },
];

// frob:doc docs/guide.md#5-config-doctor-settings
export function Doctor() {
  const { data: projects, isLoading: projectsLoading, isError: projectsError } = useProjects();
  const [selected, setSelected] = useState<string | undefined>(undefined);
  const project = selected ?? projects?.[0]?.name;

  const { data: entries, isLoading, isError, error, refetch, isFetching } = useDoctor(project);

  if (projectsLoading) {
    return <EmptyState title="Loading projects..." />;
  }
  if (projectsError || !projects || projects.length === 0) {
    return (
      <EmptyState
        title="No projects to probe"
        detail="No project with a magnetite.toml was found under the configured scan root."
      />
    );
  }

  return (
    <div className="gr-doctor-view">
      <PageTitle text="Doctor" />
      <div className="gr-doctor-view__toolbar">
        <label htmlFor="doctor-project-select">project</label>
        <select
          id="doctor-project-select"
          value={project}
          onChange={(e) => setSelected(e.target.value)}
        >
          {projects.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => void refetch()} disabled={isFetching}>
          {isFetching ? 're-probing...' : 're-probe'}
        </button>
      </div>

      {isError ? (
        <ErrorState
          title="Could not run regolith doctor"
          detail={error instanceof Error ? error.message : undefined}
          onRetry={() => void refetch()}
        />
      ) : (
        <DataTable
          columns={COLUMNS}
          rows={entries ?? []}
          rowKey={(row) => row.name}
          loading={isLoading}
          emptyTitle="No tools registered"
        />
      )}
    </div>
  );
}
