import { describe, expect, it } from 'vitest';
import {
  applyTransform,
  calibrationDiagnostics,
  CalibrationError,
  fitHomography,
  fitSimilarity,
  solveLinearSystem,
  type HomographyTransform,
  type ReferencePoint,
  type SimilarityTransform,
} from './calibration';

describe('solveLinearSystem', () => {
  it('solves a known well-conditioned system', () => {
    // 2x + y = 5; x + 3y = 10 -> x=1, y=3
    const x = solveLinearSystem(
      [
        [2, 1],
        [1, 3],
      ],
      [5, 10],
    );
    expect(x[0]).toBeCloseTo(1);
    expect(x[1]).toBeCloseTo(3);
  });

  it('throws a typed CalibrationError for a singular system', () => {
    expect(() =>
      solveLinearSystem(
        [
          [1, 2],
          [2, 4],
        ],
        [1, 2],
      ),
    ).toThrow(CalibrationError);
  });
});

describe('fitSimilarity (rung A)', () => {
  it('recovers an exact known scale+rotation+translation from synthetic points', () => {
    // Known transform: 45deg rotation, scale 2, translate (10, 20).
    const theta = Math.PI / 4;
    const scale = 2;
    const a = scale * Math.cos(theta);
    const b = scale * Math.sin(theta);
    const tx = 10;
    const ty = 20;
    const knownImagePoints = [
      { u: 0, v: 0 },
      { u: 5, v: 0 },
      { u: 0, v: 5 },
      { u: 3, v: 4 },
    ];
    const points: ReferencePoint[] = knownImagePoints.map((p) => ({
      image: p,
      object: { x: a * p.u - b * p.v + tx, y: b * p.u + a * p.v + ty },
    }));

    const result = fitSimilarity(points);
    const t = result.transform as SimilarityTransform;
    expect(t.a).toBeCloseTo(a, 9);
    expect(t.b).toBeCloseTo(b, 9);
    expect(t.tx).toBeCloseTo(tx, 9);
    expect(t.ty).toBeCloseTo(ty, 9);
    expect(t.mmPerPx).toBeCloseTo(scale, 9);
    expect(result.residuals.rmsMm).toBeCloseTo(0, 6);
    expect(result.residuals.maxMm).toBeCloseTo(0, 6);
    // Even a perfect fit declares a non-zero, honest accuracy bound.
    expect(result.accuracyBoundMm).toBeGreaterThan(0);
  });

  it('reports a non-zero residual for a mispredicted (noisy) point', () => {
    const points: ReferencePoint[] = [
      { image: { u: 0, v: 0 }, object: { x: 0, y: 0 } },
      { image: { u: 10, v: 0 }, object: { x: 20, y: 0 } },
      { image: { u: 0, v: 10 }, object: { x: 0, y: 20 } },
      { image: { u: 10, v: 10 }, object: { x: 20.5, y: 20 } }, // noisy
    ];
    const result = fitSimilarity(points);
    expect(result.residuals.maxMm).toBeGreaterThan(0);
    expect(result.accuracyBoundMm).toBeGreaterThanOrEqual(result.residuals.maxMm);
  });

  it('refuses with too_few_points for a single reference point', () => {
    expect(() => fitSimilarity([{ image: { u: 0, v: 0 }, object: { x: 0, y: 0 } }])).toThrow(
      CalibrationError,
    );
    try {
      fitSimilarity([{ image: { u: 0, v: 0 }, object: { x: 0, y: 0 } }]);
    } catch (e) {
      expect((e as CalibrationError).kind).toBe('too_few_points');
    }
  });

  it('refuses a degenerate configuration (coincident points) rather than returning NaN', () => {
    const points: ReferencePoint[] = [
      { image: { u: 1, v: 1 }, object: { x: 1, y: 1 } },
      { image: { u: 1, v: 1 }, object: { x: 1, y: 1 } },
    ];
    expect(() => fitSimilarity(points)).toThrow(CalibrationError);
  });
});

describe('fitHomography (rung B)', () => {
  it('recovers an exact known perspective-distorted (keystoned) mapping', () => {
    // A genuine projective homography (not affine): includes non-zero
    // h31/h32, i.e. real perspective/keystone -- the case rung A cannot
    // honestly handle.
    const hTrue = [
      [1.2, 0.15, 5],
      [-0.1, 1.05, 8],
      [0.0006, 0.0004, 1],
    ];
    function project(u: number, v: number) {
      const w = hTrue[2][0] * u + hTrue[2][1] * v + hTrue[2][2];
      return {
        x: (hTrue[0][0] * u + hTrue[0][1] * v + hTrue[0][2]) / w,
        y: (hTrue[1][0] * u + hTrue[1][1] * v + hTrue[1][2]) / w,
      };
    }
    const imagePoints = [
      { u: 0, v: 0 },
      { u: 100, v: 0 },
      { u: 100, v: 100 },
      { u: 0, v: 100 },
      { u: 50, v: 50 },
      { u: 20, v: 80 },
    ];
    const points: ReferencePoint[] = imagePoints.map((p) => ({
      image: p,
      object: project(p.u, p.v),
    }));

    const result = fitHomography(points);
    const t = result.transform as HomographyTransform;
    // Verify by re-projecting rather than comparing H entries directly
    // (H is only defined up to scale; entrywise comparison after our
    // own h33=1 normalization is still meaningful here since hTrue is
    // already h33=1-normalized).
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expect(t.h[i][j]).toBeCloseTo(hTrue[i][j], 4);
      }
    }
    expect(result.residuals.rmsMm).toBeCloseTo(0, 4);
    expect(result.residuals.maxMm).toBeCloseTo(0, 4);
  });

  it('applies the fitted homography consistently with applyTransform', () => {
    const hTrue = [
      [1, 0, 0],
      [0, 1, 0],
      [0.001, 0, 1],
    ];
    function project(u: number, v: number) {
      const w = hTrue[2][0] * u + hTrue[2][1] * v + hTrue[2][2];
      return { x: u / w, y: v / w };
    }
    const imagePoints = [
      { u: 0, v: 0 },
      { u: 100, v: 0 },
      { u: 100, v: 100 },
      { u: 0, v: 100 },
    ];
    const points: ReferencePoint[] = imagePoints.map((p) => ({
      image: p,
      object: project(p.u, p.v),
    }));
    const result = fitHomography(points);
    const predicted = applyTransform(result.transform, { u: 50, v: 50 });
    const expected = project(50, 50);
    expect(predicted.x).toBeCloseTo(expected.x, 4);
    expect(predicted.y).toBeCloseTo(expected.y, 4);
  });

  it('refuses with too_few_points for fewer than 4 points', () => {
    const points: ReferencePoint[] = [
      { image: { u: 0, v: 0 }, object: { x: 0, y: 0 } },
      { image: { u: 1, v: 0 }, object: { x: 1, y: 0 } },
      { image: { u: 0, v: 1 }, object: { x: 0, y: 1 } },
    ];
    expect(() => fitHomography(points)).toThrow(CalibrationError);
  });

  it('refuses a degenerate (collinear) point set rather than returning NaN', () => {
    const points: ReferencePoint[] = [
      { image: { u: 0, v: 0 }, object: { x: 0, y: 0 } },
      { image: { u: 1, v: 0 }, object: { x: 1, y: 0 } },
      { image: { u: 2, v: 0 }, object: { x: 2, y: 0 } },
      { image: { u: 3, v: 0 }, object: { x: 3, y: 0 } },
    ];
    expect(() => fitHomography(points)).toThrow(CalibrationError);
  });
});

describe('calibrationDiagnostics', () => {
  it('flags an uncorrected photo claiming uniform scale', () => {
    const diagnostics = calibrationDiagnostics({
      captureKind: 'photo',
      rung: 'scale',
      declaredAccuracyBoundMm: 1,
      residualMaxMm: 0.5,
    });
    expect(diagnostics.map((d) => d.code)).toContain('photo_uncorrected_scale');
  });

  it('does not flag a photo calibrated at rung B (homography)', () => {
    const diagnostics = calibrationDiagnostics({
      captureKind: 'photo',
      rung: 'homography',
      declaredAccuracyBoundMm: 1,
      residualMaxMm: 0.5,
    });
    expect(diagnostics.map((d) => d.code)).not.toContain('photo_uncorrected_scale');
  });

  it('flags a declared accuracy bound tighter than the fitted residual', () => {
    const diagnostics = calibrationDiagnostics({
      captureKind: 'flatbed_scan',
      rung: 'scale',
      declaredAccuracyBoundMm: 0.1,
      residualMaxMm: 0.4,
    });
    expect(diagnostics.map((d) => d.code)).toContain('accuracy_bound_tighter_than_residual');
  });

  it('reports no diagnostics for an honest flatbed rung-A calibration', () => {
    const diagnostics = calibrationDiagnostics({
      captureKind: 'flatbed_scan',
      rung: 'scale',
      declaredAccuracyBoundMm: 0.5,
      residualMaxMm: 0.4,
    });
    expect(diagnostics).toEqual([]);
  });
});
