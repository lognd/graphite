// Drawings family list (WO-G4 deliverable 2): every shipped drawing sheet,
// derived ONLY from the project's own artifact listing (honesty rule --
// a drawing "exists" here iff its SVG is actually listed).

import { Link, useParams } from 'react-router-dom';
import { useProjectArtifacts } from '../../api/hooks';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ErrorState } from '../../components/ErrorState/ErrorState';
import { listDrawingNames } from './artifactLookup';
import { PageTitle } from '../../components/PageTitle/PageTitle';
import './artifacts.css';

// frob:doc docs/guide.md#3-the-calc-book-walk-show-me-the-artifact
export function Drawings() {
  const { projectId } = useParams<{ projectId: string }>();
  const artifacts = useProjectArtifacts(projectId);

  if (artifacts.isError) {
    return (
      <ErrorState
        title="Could not load this project's artifacts"
        detail={String(artifacts.error)}
        onRetry={() => artifacts.refetch()}
      />
    );
  }
  if (artifacts.isLoading) return <p role="status">loading drawings...</p>;

  const names = listDrawingNames(artifacts.data);
  if (names.length === 0) {
    return (
      <EmptyState
        title="No drawings shipped for this project"
        detail="Run `regolith build` with a drawings target to produce dist/drawings/."
      />
    );
  }

  return (
    <>
      <PageTitle text="Drawings" />
      <ul className="gr-drawing-list">
        {names.map((name) => (
          <li key={name}>
            <Link
              to={`/artifacts/${encodeURIComponent(projectId ?? '')}/drawings/${encodeURIComponent(name)}`}
            >
              {name}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
