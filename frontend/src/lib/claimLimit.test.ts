import { describe, expect, it } from 'vitest';
import { parseClaimLimit } from './claimLimit';

describe('parseClaimLimit', () => {
  // frob:tests frontend/src/lib/claimLimit.ts::parseClaimLimit kind="unit"
  it('parses a numeric limit with a unit', () => {
    expect(parseClaimLimit('mfg.cost(all, profile=construction) <= 60000USD')).toEqual({
      limit: 60000,
      unit: 'USD',
    });
  });

  it('parses a bare numeric limit with no unit', () => {
    expect(
      parseClaimLimit(
        'strength[G1] require civil.utilization(PavilionFrame.members.G1, under=combo) <= 1.0',
      ),
    ).toEqual({ limit: 1.0, unit: '' });
  });

  it('returns null for a non-numeric bound rather than fabricating one', () => {
    expect(
      parseClaimLimit(
        'deflect require mech.deflection(G1, under=std.civil.nds.service)\n <= G1.span / 240',
      ),
    ).toBeNull();
  });
});
