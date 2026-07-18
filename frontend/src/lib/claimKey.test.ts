import { describe, expect, it } from 'vitest';
import { decodeClaimKey, encodeClaimKey } from './claimKey';

describe('encodeClaimKey / decodeClaimKey', () => {
  // frob:tests frontend/src/lib/claimKey.ts::encodeClaimKey kind="unit"
  it('round-trips a normal claim_name/subject_anchor pair', () => {
    const row = { claim_name: 'strength[G1]', subject_anchor: 'PavilionFrame.members.G1' };
    const key = encodeClaimKey(row);
    expect(decodeClaimKey(key)).toEqual({
      claimName: 'strength[G1]',
      subjectAnchor: 'PavilionFrame.members.G1',
    });
  });

  // frob:tests frontend/src/lib/claimKey.ts::decodeClaimKey kind="unit"
  it('round-trips an empty subject_anchor without collapsing the segment', () => {
    const row = { claim_name: 'construction', subject_anchor: '' };
    const key = encodeClaimKey(row);
    expect(key.length).toBeGreaterThan(0);
    expect(decodeClaimKey(key)).toEqual({ claimName: 'construction', subjectAnchor: '' });
  });

  it('returns null for a key with no delimiter', () => {
    expect(decodeClaimKey(encodeURIComponent('not-a-valid-key'))).toBeNull();
  });
});
