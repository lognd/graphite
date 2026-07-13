// Artifacts route skeleton (WO-G5 fills in artifact browsing/preview);
// answers "show me the artifact" (charter 2.1).

import { EmptyState } from '../components/EmptyState/EmptyState';

export function Artifacts() {
  return (
    <EmptyState
      title="No artifacts to show yet"
      detail="Artifact browsing (3D viewer, gerber/DXF preview, BOM) lands with WO-G5."
    />
  );
}
