// Artifacts hub (WO-G4): pick a project, then a family (calc book,
// drawings, 3D, BOM/cost/schedule, boards) -- answers "show me the
// artifact" (charter 2.1). Kept as its own route tree (not folded into
// WO-G3's /project/:projectId route) per the WO-G4/WO-G3 route-collision
// note: the two land in parallel on separate branches.

import { Link, useSearchParams } from 'react-router-dom';
import { useProjects } from '../api/hooks';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { ErrorState } from '../components/ErrorState/ErrorState';
import './artifacts/artifacts.css';

const FAMILIES = [
  { path: 'calc', label: 'Calc book', detail: 'Audit index + calc sheets' },
  { path: 'drawings', label: 'Drawings', detail: 'SVG sheets, PDF, title blocks' },
  { path: 'model', label: '3D model', detail: 'GLB viewer, STEP download' },
  { path: 'bom', label: 'BOM / cost / schedule', detail: 'Cost estimates, lock rows' },
  { path: 'boards', label: 'Boards', detail: 'Gerber layers, firmware/HDL' },
];

export function Artifacts() {
  const [params, setParams] = useSearchParams();
  const projects = useProjects();
  const selected = params.get('project') ?? undefined;

  if (projects.isError) {
    return (
      <ErrorState
        title="Could not load the project list"
        detail={String(projects.error)}
        onRetry={() => projects.refetch()}
      />
    );
  }
  if (!projects.isLoading && (projects.data ?? []).length === 0) {
    return (
      <EmptyState
        title="No projects found"
        detail="Point the server at a scan root with at least one magnetite.toml project."
      />
    );
  }

  return (
    <div className="gr-artifacts-hub">
      <label className="gr-micro-label" htmlFor="artifacts-project-select">
        project
      </label>
      <select
        id="artifacts-project-select"
        value={selected ?? ''}
        onChange={(e) => setParams(e.target.value ? { project: e.target.value } : {})}
      >
        <option value="">select a project...</option>
        {(projects.data ?? []).map((p) => (
          <option key={p.name} value={p.name}>
            {p.name}
          </option>
        ))}
      </select>

      {!selected ? (
        <EmptyState
          title="Select a project to browse its artifacts"
          detail="Every family below sources data from that project's own dist/ and build report."
        />
      ) : (
        <div className="gr-artifacts-hub__families">
          {FAMILIES.map((f) => (
            <Link
              key={f.path}
              className="gr-artifacts-hub__family"
              to={`/artifacts/${encodeURIComponent(selected)}/${f.path}`}
            >
              <strong>{f.label}</strong>
              <p className="gr-micro-label">{f.detail}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
