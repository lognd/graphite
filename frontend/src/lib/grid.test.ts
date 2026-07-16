import { describe, expect, it } from 'vitest';
import { fitSimilarity, type ReferencePoint } from './calibration';
import {
  confirmAll,
  confirmObservation,
  gridResidualsMm,
  projectGrid,
  type GridSpec,
} from './grid';

const RECT_SPEC: GridSpec = {
  corners: {
    topLeft: { u: 0, v: 0 },
    topRight: { u: 90, v: 0 },
    bottomLeft: { u: 0, v: 60 },
    bottomRight: { u: 90, v: 60 },
  },
  countU: 4,
  countV: 3,
};

describe('projectGrid', () => {
  it('produces countU * countV observations with corners at the exact clicks', () => {
    const observations = projectGrid(RECT_SPEC);
    expect(observations).toHaveLength(4 * 3);
    const topLeft = observations.find((o) => o.gridIndex[0] === 0 && o.gridIndex[1] === 0);
    const bottomRight = observations.find((o) => o.gridIndex[0] === 3 && o.gridIndex[1] === 2);
    expect(topLeft?.predicted).toEqual({ u: 0, v: 0 });
    expect(bottomRight?.predicted).toEqual({ u: 90, v: 60 });
    expect(observations.every((o) => !o.isConfirmed)).toBe(true);
  });

  it('interpolates interior points evenly for an axis-aligned rectangle', () => {
    const observations = projectGrid(RECT_SPEC);
    const midTop = observations.find((o) => o.gridIndex[0] === 1 && o.gridIndex[1] === 0);
    // countU=4 -> 3 intervals over width 90 -> spacing 30.
    expect(midTop?.predicted.u).toBeCloseTo(30);
    expect(midTop?.predicted.v).toBeCloseTo(0);
  });

  it('refuses a degenerate 1xN grid', () => {
    expect(() => projectGrid({ ...RECT_SPEC, countU: 1 })).toThrow();
  });
});

describe('confirmObservation / confirmAll', () => {
  it('updates only the targeted observation and marks it confirmed', () => {
    const observations = projectGrid(RECT_SPEC);
    const updated = confirmObservation(observations, [1, 1], { u: 31, v: 20.5 });
    const target = updated.find((o) => o.gridIndex[0] === 1 && o.gridIndex[1] === 1);
    expect(target?.confirmed).toEqual({ u: 31, v: 20.5 });
    expect(target?.isConfirmed).toBe(true);
    const untouched = updated.find((o) => o.gridIndex[0] === 0 && o.gridIndex[1] === 0);
    expect(untouched?.isConfirmed).toBe(false);
  });

  it('confirmAll marks every observation confirmed without moving them', () => {
    const observations = projectGrid(RECT_SPEC);
    const confirmed = confirmAll(observations);
    expect(confirmed.every((o) => o.isConfirmed)).toBe(true);
    confirmed.forEach((o, i) => expect(o.predicted).toEqual(observations[i].predicted));
  });
});

describe('gridResidualsMm', () => {
  it('is zero for a grid whose confirmed points exactly match pitch under an identity-like fit', () => {
    // A rung-A fit that maps image px 1:1 to object mm (a=1,b=0,t=0).
    const points: ReferencePoint[] = [
      { image: { u: 0, v: 0 }, object: { x: 0, y: 0 } },
      { image: { u: 10, v: 0 }, object: { x: 10, y: 0 } },
      { image: { u: 0, v: 10 }, object: { x: 0, y: 10 } },
    ];
    const fit = fitSimilarity(points);
    const pitchMm = 30;
    const spec: GridSpec = {
      corners: {
        topLeft: { u: 0, v: 0 },
        topRight: { u: 3 * pitchMm, v: 0 },
        bottomLeft: { u: 0, v: 2 * pitchMm },
        bottomRight: { u: 3 * pitchMm, v: 2 * pitchMm },
      },
      countU: 4,
      countV: 3,
    };
    const observations = confirmAll(projectGrid(spec));
    const residuals = gridResidualsMm(observations, fit.transform, { pitchMm });
    expect(residuals.rmsMm).toBeCloseTo(0, 6);
    expect(residuals.maxMm).toBeCloseTo(0, 6);
  });

  it('is zero when there are no confirmed observations yet', () => {
    const points: ReferencePoint[] = [
      { image: { u: 0, v: 0 }, object: { x: 0, y: 0 } },
      { image: { u: 10, v: 0 }, object: { x: 10, y: 0 } },
      { image: { u: 0, v: 10 }, object: { x: 0, y: 10 } },
    ];
    const fit = fitSimilarity(points);
    const observations = projectGrid(RECT_SPEC);
    const residuals = gridResidualsMm(observations, fit.transform, { pitchMm: 30 });
    expect(residuals).toEqual({ rmsMm: 0, maxMm: 0 });
  });

  it('reflects a dragged mis-prediction as a non-zero residual', () => {
    const points: ReferencePoint[] = [
      { image: { u: 0, v: 0 }, object: { x: 0, y: 0 } },
      { image: { u: 10, v: 0 }, object: { x: 10, y: 0 } },
      { image: { u: 0, v: 10 }, object: { x: 0, y: 10 } },
    ];
    const fit = fitSimilarity(points);
    const pitchMm = 30;
    const spec: GridSpec = {
      corners: {
        topLeft: { u: 0, v: 0 },
        topRight: { u: 3 * pitchMm, v: 0 },
        bottomLeft: { u: 0, v: 2 * pitchMm },
        bottomRight: { u: 3 * pitchMm, v: 2 * pitchMm },
      },
      countU: 4,
      countV: 3,
    };
    let observations = confirmAll(projectGrid(spec));
    // Drag point (1,1) 5px off in u -- should show up as a ~5mm error
    // under this 1:1 identity-like fit.
    observations = confirmObservation(observations, [1, 1], { u: pitchMm + 5, v: pitchMm });
    const residuals = gridResidualsMm(observations, fit.transform, { pitchMm });
    expect(residuals.maxMm).toBeCloseTo(5, 6);
  });
});
