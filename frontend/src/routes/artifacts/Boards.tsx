// Boards family view (WO-G9 rewrite, closes WOG4-F2): full RS-274X
// gerber stack (BoardGerberView) instead of the deleted Edge.Cuts-only
// cheap parser, plus the family's non-gerber files (BOM, kicad_pcb,
// job file, positions) sourced through the typed index -- not a
// bespoke listing (deliverable 5).

import { useParams } from 'react-router-dom';
import { useProjectArtifactIndex } from '../../api/hooks';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ErrorState } from '../../components/ErrorState/ErrorState';
import { PageTitle } from '../../components/PageTitle/PageTitle';
import { BoardGerberView } from './BoardGerberView';
import { FileRenderer } from './FileRenderer';
import './artifacts.css';

export function Boards() {
  const { projectId } = useParams<{ projectId: string }>();
  const index = useProjectArtifactIndex(projectId);

  if (index.isError) {
    return (
      <ErrorState
        title="Could not load this project's artifact index"
        detail={String(index.error)}
        onRetry={() => index.refetch()}
      />
    );
  }
  if (index.isLoading) return <p role="status">loading board artifacts...</p>;

  const boardRows = (index.data ?? []).filter((r) => r.family === 'boards');
  const nonGerber = boardRows.filter(
    (r) => !r.kind.startsWith('gerber_layer.') && !r.kind.startsWith('drill.'),
  );
  // `firmware` is its own top-level family in the typed index (lithos's
  // family_of convention), not nested under `boards` -- shown here too
  // (rather than only via the generic family route) since board bring-up
  // and firmware are the same physical product to an engineer browsing.
  const firmwareRows = (index.data ?? []).filter((r) => r.family === 'firmware');

  return (
    <div className="gr-boards">
      <PageTitle text="Boards" />
      <h2 className="gr-section-title">Gerber layer stack</h2>
      {boardRows.length === 0 ? (
        <EmptyState
          title="No gerber layers shipped for this project (unrouted)"
          detail="This project has no board target, or its board was never routed to gerbers."
        />
      ) : (
        <BoardGerberView />
      )}

      {nonGerber.length > 0 ? (
        <>
          <h2 className="gr-section-title">Board files</h2>
          {nonGerber.map((row) => (
            <section key={row.relpath} className="gr-family-view__section">
              <h3 className="gr-micro-label">{row.relpath}</h3>
              <FileRenderer projectId={projectId} row={row} />
            </section>
          ))}
        </>
      ) : null}

      <h2 className="gr-section-title">Firmware / HDL products</h2>
      {firmwareRows.length === 0 ? (
        <EmptyState
          title="No firmware/HDL products shipped"
          detail="This project has no firmware or HDL target -- named absence, not an omission."
        />
      ) : (
        firmwareRows.map((row) => (
          <section key={row.relpath} className="gr-family-view__section">
            <h3 className="gr-micro-label">{row.relpath}</h3>
            <FileRenderer projectId={projectId} row={row} />
          </section>
        ))
      )}
    </div>
  );
}
