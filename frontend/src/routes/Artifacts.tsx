// Artifacts hub (WO-G9 rewrite: DELETE the hardcoded family list, lithos
// F145). Families now come from the project's own typed artifact index
// (`familiesFromIndex`) -- a family graphite has never heard of appears
// here automatically. A handful of families keep a bespoke, richer route
// (calc/drawings/model/bom/boards/harness); every other family routes to
// the generic index-driven FamilyView (the fallback ladder), so no
// family can ever again be silently dropped (deliverable 6).

import { Link, useSearchParams } from 'react-router-dom';
import { useProjectArtifactIndex, useProjects } from '../api/hooks';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { ErrorState } from '../components/ErrorState/ErrorState';
import { PageTitle } from '../components/PageTitle/PageTitle';
import { familiesFromIndex, familyLabel } from './artifacts/familyIndex';
import './artifacts/artifacts.css';

// Bespoke, richer routes for families this repo has purpose-built views
// for (app/routes.tsx registers all of these AND the generic catch-all
// `artifacts/:projectId/family/:family` -- see that file's comment for
// why both exist). Any family NOT in this map still gets a hub tile,
// routed to the generic view.
const DEDICATED_ROUTE: Record<string, string> = {
  calc: 'calc',
  drawings: 'drawings',
  '3d': 'model',
  bom: 'bom',
  boards: 'boards',
  harness: 'harness',
};

// These six always get a hub tile, even with zero shipped files -- their
// dedicated views render an honest, specific empty state (e.g. "no GLB
// shipped"), and that empty state must stay reachable by clicking
// through the hub, not just by knowing the URL. Every OTHER family is
// index-driven only (deliverable 1): it appears exactly when the
// project's index says it exists, never before, never hardcoded.
const ALWAYS_SHOWN_FAMILIES = ['calc', 'drawings', '3d', 'bom', 'boards', 'harness'];

// frob:doc docs/guide.md#3-the-calc-book-walk-show-me-the-artifact
export function Artifacts() {
  const [params, setParams] = useSearchParams();
  const projects = useProjects();
  const selected = params.get('project') ?? undefined;
  const index = useProjectArtifactIndex(selected);

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

  const indexFamilies = familiesFromIndex(index.data ?? []);
  const present = new Set(indexFamilies.map((f) => f.family));
  const families = [
    ...indexFamilies,
    ...ALWAYS_SHOWN_FAMILIES.filter((f) => !present.has(f)).map((family) => ({
      family,
      count: 0,
      viewers: [] as string[],
    })),
  ].sort((a, b) => a.family.localeCompare(b.family));

  return (
    <div className="gr-artifacts-hub">
      <PageTitle text="Artifacts" />
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
          detail="Every family below sources data from that project's own shipped artifact index."
        />
      ) : index.isLoading ? (
        <p role="status">loading artifact index...</p>
      ) : index.isError ? (
        <ErrorState
          title="Could not load this project's artifact index"
          detail={String(index.error)}
          onRetry={() => index.refetch()}
        />
      ) : (
        <div className="gr-artifacts-hub__families">
          {families.map((f) => {
            const path = DEDICATED_ROUTE[f.family] ?? `family/${encodeURIComponent(f.family)}`;
            return (
              <Link
                key={f.family}
                className="gr-artifacts-hub__family"
                to={`/artifacts/${encodeURIComponent(selected)}/${path}`}
              >
                <strong>{familyLabel(f.family)}</strong>
                <p className="gr-micro-label">
                  {f.count === 0
                    ? 'no files shipped'
                    : `${f.count} file${f.count === 1 ? '' : 's'} -- ${f.viewers.join(', ')}`}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
