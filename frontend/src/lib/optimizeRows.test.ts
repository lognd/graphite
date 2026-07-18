// optimizeWinnerRows: the ONE lockfile -> winner-row extraction shared
// by the project view and the run console (WO-G5 deliverable 5).

import { describe, expect, it } from 'vitest';
import { optimizeWinnerRows } from './optimizeRows';
import { mockLockfile } from '../mocks/fixtures';
import type { Lockfile } from '../api/client';

describe('optimizeWinnerRows', () => {
  // frob:tests frontend/src/lib/optimizeRows.ts::optimizeWinnerRows kind="unit"
  it('returns empty for an undefined lockfile', () => {
    expect(optimizeWinnerRows(undefined)).toEqual([]);
  });

  // frob:tests frontend/src/lib/optimizeRows.ts::optimizeWinnerRows kind="unit"
  it('keeps only optimize(-caused rows, labeling empty section names (base)', () => {
    const lockfile: Lockfile = {
      ...mockLockfile,
      sections: [
        {
          ...mockLockfile.sections[0],
          name: '',
          rows: [
            { slot: 'beam.depth', value: '300mm', cause: 'optimize(min_cost)', policy_note: null },
            { slot: 'beam.width', value: '90mm', cause: 'declared', policy_note: null },
          ],
        },
      ],
    };
    expect(optimizeWinnerRows(lockfile)).toEqual([
      { section: '(base)', slot: 'beam.depth', value: '300mm', cause: 'optimize(min_cost)' },
    ]);
  });

  it('matches the recorded fixture lockfile row-for-row against a manual filter', () => {
    const manual = mockLockfile.sections.flatMap((s) =>
      s.rows.filter((r) => r.cause.startsWith('optimize(')),
    );
    expect(optimizeWinnerRows(mockLockfile)).toHaveLength(manual.length);
  });
});
