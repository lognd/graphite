// Boards family view (WO-G4 deliverable 5): gerber layer list with the
// honest "unrouted" label, an Edge.Cuts outline preview from a cheap
// gerber parse (never a fabricated render), and firmware/HDL products
// with named absences. timber_pavilion is civil and ships none of this --
// rendered here as designed EmptyStates, with the gerber parser covered
// by a standalone unit test (gerberOutline.test.ts) since no fixture
// project carries real gerbers (documented in the WO ledger).

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useProjectArtifacts } from '../../api/hooks';
import { DataTable } from '../../components/DataTable/DataTable';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ErrorState } from '../../components/ErrorState/ErrorState';
import { HashChip } from '../../components/HashChip/HashChip';
import { PanZoomFrame } from '../../components/PanZoomFrame/PanZoomFrame';
import { PageTitle } from '../../components/PageTitle/PageTitle';
import { parseGerberOutline, type GerberOutline } from './gerberOutline';
import './artifacts.css';

const GERBER_EXTENSIONS = ['.gbr', '.gtl', '.gbl', '.gts', '.gbs', '.gto', '.gbo', '.gko', '.drl'];
const HDL_EXTENSIONS = ['.v', '.sv', '.vhd', '.bin', '.hex', '.elf'];

export function Boards() {
  const { projectId } = useParams<{ projectId: string }>();
  const artifacts = useProjectArtifacts(projectId);
  const [outline, setOutline] = useState<GerberOutline | null>(null);
  const [outlineError, setOutlineError] = useState<string | null>(null);

  const gerberLayers = (artifacts.data ?? []).filter((a) =>
    GERBER_EXTENSIONS.some((ext) => a.relpath.toLowerCase().endsWith(ext)),
  );
  const edgeCuts = gerberLayers.find((a) => /edge[._-]?cuts/i.test(a.relpath));
  const firmwareHdl = (artifacts.data ?? []).filter((a) =>
    HDL_EXTENSIONS.some((ext) => a.relpath.toLowerCase().endsWith(ext)),
  );

  useEffect(() => {
    if (!projectId || !edgeCuts) {
      return;
    }
    let cancelled = false;
    api
      .fetchArtifact(projectId, edgeCuts.content_hash)
      .then((blob) => blob.text())
      .then((text) => {
        if (!cancelled) setOutline(parseGerberOutline(text));
      })
      .catch((err) => {
        if (!cancelled) setOutlineError(String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, edgeCuts]);

  if (artifacts.isError) {
    return (
      <ErrorState
        title="Could not load this project's artifacts"
        detail={String(artifacts.error)}
        onRetry={() => artifacts.refetch()}
      />
    );
  }
  if (artifacts.isLoading) return <p role="status">loading board artifacts...</p>;

  return (
    <div className="gr-boards">
      <PageTitle text="Boards" />
      <h2 className="gr-section-title">Gerber layers</h2>
      {gerberLayers.length === 0 ? (
        <EmptyState
          title="No gerber layers shipped for this project (unrouted)"
          detail="This project has no board target, or its board was never routed to gerbers."
        />
      ) : (
        <DataTable
          columns={[
            { key: 'layer', header: 'Layer', accessor: (a) => a.relpath },
            { key: 'type', header: 'Content type', accessor: (a) => a.content_type },
            { key: 'size', header: 'Size', unit: 'bytes', accessor: (a) => a.size },
            {
              key: 'hash',
              header: 'Content hash',
              accessor: (a) => a.content_hash,
              render: (a) => <HashChip full={a.content_hash} />,
            },
          ]}
          rows={gerberLayers}
          rowKey={(a) => a.content_hash}
          emptyTitle="No gerber layers"
        />
      )}

      <h2 className="gr-section-title">Edge.Cuts outline preview</h2>
      {!edgeCuts ? (
        <EmptyState
          title="No Edge.Cuts layer shipped"
          detail="No outline to preview -- this is the pipeline's own gap, not a rendering omission."
        />
      ) : outlineError ? (
        <ErrorState title="Could not parse Edge.Cuts" detail={outlineError} />
      ) : outline ? (
        <>
          <PanZoomFrame ariaLabel="Edge.Cuts board outline">
            <svg width={400} height={400} viewBox="-50 -50 100 100">
              <g stroke="currentColor" fill="none" strokeWidth={0.2}>
                {outline.segments.map((s, i) => (
                  <line key={i} x1={s.x1} y1={-s.y1} x2={s.x2} y2={-s.y2} />
                ))}
              </g>
            </svg>
          </PanZoomFrame>
          {outline.partial ? (
            <p className="gr-reason-cell">
              partial parse -- this cheap parser skips arcs/flashes; the outline above may be
              incomplete (see the shipped gerber for the full geometry)
            </p>
          ) : null}
        </>
      ) : (
        <p role="status">parsing Edge.Cuts...</p>
      )}

      <h2 className="gr-section-title">Firmware / HDL products</h2>
      {firmwareHdl.length === 0 ? (
        <EmptyState
          title="No firmware/HDL products shipped"
          detail="This project has no firmware or HDL target -- named absence, not an omission."
        />
      ) : (
        <DataTable
          columns={[
            { key: 'product', header: 'Product', accessor: (a) => a.relpath },
            { key: 'type', header: 'Content type', accessor: (a) => a.content_type },
            {
              key: 'hash',
              header: 'Content hash',
              accessor: (a) => a.content_hash,
              render: (a) => <HashChip full={a.content_hash} />,
            },
          ]}
          rows={firmwareHdl}
          rowKey={(a) => a.content_hash}
          emptyTitle="No firmware/HDL products"
        />
      )}
    </div>
  );
}
