// The pure function the Artifacts hub renders from (WO-G9 deliverable 1:
// DELETE the hardcoded family list). Any family present in the index
// appears -- a family graphite has never heard of is not a special case,
// it just falls out of grouping the rows that exist. The no-route test
// (familyIndex.test.ts) feeds this a family absent from the OLD
// hardcoded FAMILIES constant and asserts it still shows up: reintroduce
// a hardcoded list here and that test fails.

import type { ArtifactIndexRow } from '../../api/client';

export interface FamilyGroup {
  family: string;
  count: number;
  viewers: string[];
}

export function familiesFromIndex(rows: ArtifactIndexRow[]): FamilyGroup[] {
  const byFamily = new Map<string, ArtifactIndexRow[]>();
  for (const row of rows) {
    const list = byFamily.get(row.family) ?? [];
    list.push(row);
    byFamily.set(row.family, list);
  }
  return [...byFamily.entries()]
    .map(([family, group]) => ({
      family,
      count: group.length,
      viewers: [...new Set(group.map((r) => r.viewer))].sort(),
    }))
    .sort((a, b) => a.family.localeCompare(b.family));
}

/** Human label for a family the hub has never been taught about --
 * title-cased from the raw family string, not a lookup table (a lookup
 * table is exactly the hardcoded-list failure mode this WO removes). */
export function familyLabel(family: string): string {
  return family
    .split(/[_-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
