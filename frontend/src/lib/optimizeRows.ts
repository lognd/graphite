// The ONE extraction of optimize() winner rows from a lockfile (dedup
// law 04.2): both the project view (WO-G3) and the run console's
// optimize-run surfacing (WO-G5 deliverable 5) render these same rows,
// so the filter lives here, not inline in either route. Values come
// verbatim from the real regolith.lock -- graphite never recomputes a
// winner (charter 3.2).

import type { Lockfile } from '../api/client';

// frob:doc docs/guide.md#9-frontend-lib-notes
export interface OptimizeWinnerRow {
  section: string;
  slot: string;
  value: string;
  cause: string;
}

// frob:doc docs/guide.md#9-frontend-lib-notes
export function optimizeWinnerRows(lockfile: Lockfile | undefined): OptimizeWinnerRow[] {
  return (lockfile?.sections ?? []).flatMap((section) =>
    section.rows
      .filter((row) => row.cause.startsWith('optimize('))
      .map((row) => ({
        section: section.name || '(base)',
        slot: row.slot,
        value: row.value,
        cause: row.cause,
      })),
  );
}
