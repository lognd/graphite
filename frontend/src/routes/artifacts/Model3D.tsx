// 3D family route (WO-G4 deliverable 3): finds a shipped `.glb` (and its
// `.step` sibling if present) in this project's OWN artifact listing and
// hands the bytes to <GlbViewer/>. The timber_pavilion fixture is civil
// and ships none (no mech/electrical target) -- this renders the honest
// absence rather than a fabricated model; GlbViewer itself is covered by
// a component-level unit test with a synthetic GLB (see ledger).

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useProjectArtifacts } from '../../api/hooks';
import { ErrorState } from '../../components/ErrorState/ErrorState';
import { GlbViewer } from '../../components/GlbViewer/GlbViewer';
import { PageTitle } from '../../components/PageTitle/PageTitle';

export function Model3D() {
  const { projectId } = useParams<{ projectId: string }>();
  const artifacts = useProjectArtifacts(projectId);
  const [glbBytes, setGlbBytes] = useState<ArrayBuffer | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const glbEntry = artifacts.data?.find((a) => a.relpath.endsWith('.glb'));
  const stepEntry = artifacts.data?.find((a) => a.relpath.endsWith('.step'));

  useEffect(() => {
    if (!projectId || !glbEntry) {
      return;
    }
    let cancelled = false;
    api
      .fetchArtifact(projectId, glbEntry.content_hash)
      .then((blob) => blob.arrayBuffer())
      .then((buf) => {
        if (!cancelled) setGlbBytes(buf);
      })
      .catch((err) => {
        if (!cancelled) setFetchError(String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, glbEntry]);

  if (artifacts.isError) {
    return (
      <ErrorState
        title="Could not load this project's artifacts"
        detail={String(artifacts.error)}
        onRetry={() => artifacts.refetch()}
      />
    );
  }
  if (fetchError) {
    return <ErrorState title="Could not fetch the GLB" detail={fetchError} />;
  }

  return (
    <>
      <PageTitle text="3D model" />
      <GlbViewer
        glbBytes={glbBytes}
        contentHash={glbEntry?.content_hash ?? null}
        stepDownloadHref={
          projectId && stepEntry ? api.artifactUrl(projectId, stepEntry.content_hash) : null
        }
        stepContentHash={stepEntry?.content_hash ?? null}
      />
    </>
  );
}
