import { describe, expect, it } from 'vitest';
import { ALL_VIEWERS, VIEWER_STRATEGY, strategyFor } from './viewerRegistry';

describe('strategyFor', () => {
  // frob:tests frontend/src/routes/artifacts/viewerRegistry.ts::strategyFor
  it('resolves every closed-vocabulary viewer to its registered strategy', () => {
    for (const viewer of ALL_VIEWERS) {
      expect(strategyFor(viewer)).toBe(VIEWER_STRATEGY[viewer]);
    }
  });

  it('falls back to honest-fallback for an unrecognized viewer string', () => {
    expect(strategyFor('some-future-viewer')).toBe('honest-fallback');
  });
});
