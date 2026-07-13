// Runs route skeleton (WO-G5 static run-history half + live half gated on
// lithos WO-119's progress producer).

import { EmptyState } from '../components/EmptyState/EmptyState';

export function Runs() {
  return (
    <EmptyState
      title="No runs recorded yet"
      detail="Run history (build/ship/test/optimize invocations, live progress) lands with WO-G5."
    />
  );
}
