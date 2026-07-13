// Obligations route skeleton (WO-G4 fills in the real per-project view);
// answers "why did this claim defer/fail?" (charter 2.1).

import { EmptyState } from '../components/EmptyState/EmptyState';

export function Obligations() {
  return (
    <EmptyState
      title="Select a project to see its obligations"
      detail="Obligation detail (verdicts, margins, deferral reasons) lands with WO-G4."
    />
  );
}
