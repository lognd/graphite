import { describe, expect, it } from 'vitest';
import { dispositionToVerdict } from './verdict';

describe('dispositionToVerdict', () => {
  // frob:tests frontend/src/components/VerdictBadge/verdict.ts::dispositionToVerdict
  it('maps every wire disposition to its UI verdict', () => {
    expect(dispositionToVerdict('calc_sheet')).toBe('discharged');
    expect(dispositionToVerdict('accepted_deviation')).toBe('accepted-deviation');
    expect(dispositionToVerdict('deferred')).toBe('deferred');
    expect(dispositionToVerdict('violated')).toBe('violated');
  });
});
