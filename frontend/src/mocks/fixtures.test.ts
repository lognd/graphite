import { describe, expect, it } from 'vitest';
import {
  mockObligations,
  mockObligationsFiltered,
  mockObligationsGrouped,
  mockScanUpload,
} from './fixtures';

describe('mockObligationsFiltered', () => {
  // frob:tests frontend/src/mocks/fixtures.ts::mockObligationsFiltered kind="unit"
  it('returns only rows matching the given disposition', () => {
    const filtered = mockObligationsFiltered('accepted_deviation');
    expect(filtered.rows).not.toBeNull();
    expect(filtered.rows!.length).toBeGreaterThan(0);
    expect(filtered.rows!.every((r) => r.disposition === 'accepted_deviation')).toBe(true);
    expect(filtered.rows!.length).toBeLessThan(mockObligations.rows!.length);
  });

  it('returns an empty row set for a disposition with no matches', () => {
    const filtered = mockObligationsFiltered('not-a-real-disposition');
    expect(filtered.rows).toEqual([]);
  });
});

describe('mockObligationsGrouped', () => {
  // frob:tests frontend/src/mocks/fixtures.ts::mockObligationsGrouped kind="unit"
  it('groups by disposition into sorted, non-overlapping buckets', () => {
    const grouped = mockObligationsGrouped('disposition');
    expect(grouped.rows).toBeNull();
    expect(grouped.groups).not.toBeNull();
    const keys = grouped.groups!.map((g) => g.key);
    expect(keys).toEqual([...keys].sort());
    const total = grouped.groups!.reduce((sum, g) => sum + g.rows.length, 0);
    expect(total).toBe(mockObligations.rows!.length);
  });

  it('groups by family, splitting the claim_name on its bracket', () => {
    const grouped = mockObligationsGrouped('family');
    const total = grouped.groups!.reduce((sum, g) => sum + g.rows.length, 0);
    expect(total).toBe(mockObligations.rows!.length);
    for (const group of grouped.groups!) {
      expect(group.key).not.toContain('[');
    }
  });
});

describe('mockScanUpload', () => {
  // frob:tests frontend/src/mocks/fixtures.ts::mockScanUpload kind="unit"
  it('resolves a deterministic content_hash and relpath preserving the extension', async () => {
    const file = new File(['data'], 'my-scan.png', { type: 'image/png' });
    const entry = await mockScanUpload('My Scan!', file);
    expect(entry.relpath).toBe('traced/scans/My Scan!.png');
    expect(entry.content_hash.startsWith('blake3:mock0myscan')).toBe(true);
    expect(entry.size).toBe(file.size);
  });

  it('is deterministic for the same name', async () => {
    const file = new File(['x'], 'a.rgp');
    const first = await mockScanUpload('same-name', file);
    const second = await mockScanUpload('same-name', file);
    expect(first.content_hash).toBe(second.content_hash);
  });
});
