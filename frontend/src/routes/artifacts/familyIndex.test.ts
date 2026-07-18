import { describe, expect, it } from 'vitest';
import type { ArtifactIndexRow } from '../../api/client';
import { familiesFromIndex, familyLabel } from './familyIndex';

function row(family: string, viewer: ArtifactIndexRow['viewer']): ArtifactIndexRow {
  return {
    family,
    kind: 'file',
    relpath: `${family}/x`,
    content_hash: 'sha256:deadbeef',
    bytes: 1,
    media_type: 'application/octet-stream',
    viewer,
    source_refs: [],
    synthesized: false,
  };
}

describe('familiesFromIndex (WO-G9 deliverable 1: no hardcoded family list)', () => {
  // frob:tests frontend/src/routes/artifacts/familyIndex.ts::familiesFromIndex
  it('surfaces a family that was never in the old hardcoded FAMILIES constant', () => {
    // The old Artifacts.tsx hardcoded exactly: calc, drawings, model,
    // bom, boards. "harness" and a hypothetical brand-new
    // "mystery_future_family" were NEVER in that list -- if familyIndex
    // ever regresses to a hardcoded lookup, this assertion fails.
    const rows = [row('harness', 'markdown'), row('mystery_future_family', 'binary')];
    const families = familiesFromIndex(rows).map((f) => f.family);
    expect(families).toEqual(['harness', 'mystery_future_family']);
  });

  it('counts and dedupes viewers per family', () => {
    const rows = [row('boards', 'gerber'), row('boards', 'gerber'), row('boards', 'json')];
    const [group] = familiesFromIndex(rows);
    expect(group).toEqual({ family: 'boards', count: 3, viewers: ['gerber', 'json'] });
  });

  it('empty index -> no families (not a crash)', () => {
    expect(familiesFromIndex([])).toEqual([]);
  });
});

describe('familyLabel', () => {
  // frob:tests frontend/src/routes/artifacts/familyIndex.ts::familyLabel
  it('title-cases without a lookup table', () => {
    expect(familyLabel('mystery_future_family')).toBe('Mystery Future Family');
    expect(familyLabel('3d')).toBe('3d');
  });
});
