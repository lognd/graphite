// Generic index-driven family view (WO-G9 deliverable 1/2): the catch-
// all route for any family that does not have a bespoke view (Boards
// and Harness do; calc/drawings/model/bom keep their existing dedicated
// views too). A family graphite has never heard of lands HERE and still
// renders every file through the honest fallback ladder -- this route,
// not a per-family entry, is what makes "no route for an index family"
// structurally impossible.

import { useParams } from 'react-router-dom';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ErrorState } from '../../components/ErrorState/ErrorState';
import { PageTitle } from '../../components/PageTitle/PageTitle';
import { useProjectArtifactIndex } from '../../api/hooks';
import { familyLabel } from './familyIndex';
import { FileRenderer } from './FileRenderer';
import './artifacts.css';

// frob:doc docs/guide.md#3-the-calc-book-walk-show-me-the-artifact
export function FamilyView() {
  const { projectId, family } = useParams<{ projectId: string; family: string }>();
  const index = useProjectArtifactIndex(projectId);

  if (index.isError) {
    return (
      <ErrorState
        title="Could not load the artifact index"
        detail={String(index.error)}
        onRetry={() => index.refetch()}
      />
    );
  }
  if (index.isLoading) return <p role="status">loading artifact index...</p>;

  const rows = (index.data ?? []).filter((r) => r.family === family);
  if (rows.length === 0) {
    return (
      <EmptyState
        title={`No "${family}" artifacts shipped for this project`}
        detail="Named absence -- this family is not in the shipped index, not a rendering gap."
      />
    );
  }

  return (
    <div className="gr-family-view">
      <PageTitle text={familyLabel(family ?? '')} />
      {rows.map((row) => (
        <section key={row.relpath} className="gr-family-view__section">
          <h2 className="gr-section-title">{row.relpath}</h2>
          <FileRenderer projectId={projectId} row={row} />
        </section>
      ))}
    </div>
  );
}
