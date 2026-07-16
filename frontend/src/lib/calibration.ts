// Scan-trace studio calibration math (WO-G11 deliverable 3, lithos
// D259/D261 sec. 7a): the calibration LADDER, rungs A + B only (rung C
// -- homography + radial distortion -- is WO-G14, v1.1, out of scope
// here). Both rungs are closed-form linear algebra, dependency-free
// (the recon sizes this at ~100 lines; no SVD library, no external
// numerical package) -- Gaussian elimination with partial pivoting
// over a normal-equations system is the "small linear-algebra kernel"
// the recon names.
//
// Every fit reports mm-per-px (rung A) or the fitted 3x3 homography
// (rung B), plus the RMS/MAX reprojection residual IN MM AT THE OBJECT
// PLANE, and a conservative `accuracyBoundMm >= residualMaxMm` -- the
// UI (Studio.tsx) refuses export until a fit exists (acceptance
// criterion: "Export is blocked ... until calibration is complete").
//
// A "reference point" pairs an image-space pixel click with its known
// object-plane position in mm. Rung A additionally accepts points that
// only carry a known PAIRWISE distance (the two-point minimum case);
// callers that already have mm positions (e.g. grid corners of known
// pitch) go straight through the point-pair path.

export interface ImagePoint {
  u: number;
  v: number;
}

export interface ObjectPoint {
  x: number;
  y: number;
}

export interface ReferencePoint {
  image: ImagePoint;
  object: ObjectPoint;
}

export type CalibrationRung = 'scale' | 'homography';

/** A degenerate configuration (too few points, collinear points, a
 * singular normal-equations matrix) refuses with a TYPED error --
 * never NaN, never a silently-wrong transform (WO-G11 quality bar). */
export class CalibrationError extends Error {
  readonly kind: 'too_few_points' | 'degenerate_points' | 'singular_system';

  constructor(kind: CalibrationError['kind'], message: string) {
    super(message);
    this.name = 'CalibrationError';
    this.kind = kind;
  }
}

export interface SimilarityTransform {
  rung: 'scale';
  // object = R(theta) * scale * image + t, i.e. a uniform-scale
  // similarity: [a -b; b a] in 2x2 form (a = scale*cos, b = scale*sin).
  a: number;
  b: number;
  tx: number;
  ty: number;
  mmPerPx: number;
}

export interface HomographyTransform {
  rung: 'homography';
  // Row-major 3x3, normalized so H[2][2] = 1.
  h: number[][];
}

export type FittedTransform = SimilarityTransform | HomographyTransform;

export interface Residuals {
  rmsMm: number;
  maxMm: number;
}

export interface CalibrationResult {
  transform: FittedTransform;
  residuals: Residuals;
  /** A conservative declared bound: max(residuals.maxMm, tiny floor)
   * so a perfect synthetic fit (residual 0) still declares a
   * non-zero, honest accuracy bound rather than claiming infinite
   * precision. */
  accuracyBoundMm: number;
}

const MIN_ACCURACY_BOUND_MM = 0.01;

function applySimilarity(t: SimilarityTransform, p: ImagePoint): ObjectPoint {
  return {
    x: t.a * p.u - t.b * p.v + t.tx,
    y: t.b * p.u + t.a * p.v + t.ty,
  };
}

function applyHomography(h: number[][], p: ImagePoint): ObjectPoint {
  const w = h[2][0] * p.u + h[2][1] * p.v + h[2][2];
  if (Math.abs(w) < 1e-12) {
    throw new CalibrationError(
      'singular_system',
      'homography projected a point to infinity (w ~= 0)',
    );
  }
  return {
    x: (h[0][0] * p.u + h[0][1] * p.v + h[0][2]) / w,
    y: (h[1][0] * p.u + h[1][1] * p.v + h[1][2]) / w,
  };
}

/** Apply a fitted transform to an image-space point, returning its
 * predicted object-plane (mm) position -- the same application used
 * both to compute fit residuals and to project grid predictions. */
export function applyTransform(t: FittedTransform, p: ImagePoint): ObjectPoint {
  return t.rung === 'scale' ? applySimilarity(t, p) : applyHomography(t.h, p);
}

function residualsFor(transform: FittedTransform, points: readonly ReferencePoint[]): Residuals {
  let sumSq = 0;
  let maxMm = 0;
  for (const p of points) {
    const predicted = applyTransform(transform, p.image);
    const dx = predicted.x - p.object.x;
    const dy = predicted.y - p.object.y;
    const errMm = Math.hypot(dx, dy);
    sumSq += errMm * errMm;
    maxMm = Math.max(maxMm, errMm);
  }
  const rmsMm = Math.sqrt(sumSq / points.length);
  return { rmsMm, maxMm };
}

function accuracyBoundFor(residuals: Residuals): number {
  return Math.max(residuals.maxMm, MIN_ACCURACY_BOUND_MM);
}

/** Solve the dense linear system `Ax = b` (A is n x n) via Gaussian
 * elimination with partial pivoting -- the "small normal-equations
 * kernel" the WO's escalation note names, in place of pulling in a
 * general SVD/linear-algebra dependency. Throws `CalibrationError`
 * (`singular_system`) rather than returning NaN when the system is
 * singular/near-singular. */
export function solveLinearSystem(aIn: number[][], bIn: number[]): number[] {
  const n = bIn.length;
  const a = aIn.map((row) => [...row]);
  const b = [...bIn];

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    let pivotVal = Math.abs(a[col][col]);
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(a[row][col]) > pivotVal) {
        pivotRow = row;
        pivotVal = Math.abs(a[row][col]);
      }
    }
    if (pivotVal < 1e-10) {
      throw new CalibrationError(
        'singular_system',
        'calibration system is singular or near-singular -- points may be collinear/degenerate',
      );
    }
    if (pivotRow !== col) {
      [a[col], a[pivotRow]] = [a[pivotRow], a[col]];
      [b[col], b[pivotRow]] = [b[pivotRow], b[col]];
    }
    for (let row = col + 1; row < n; row++) {
      const factor = a[row][col] / a[col][col];
      if (factor === 0) continue;
      for (let k = col; k < n; k++) a[row][k] -= factor * a[col][k];
      b[row] -= factor * b[col];
    }
  }

  const x = new Array<number>(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    let sum = b[row];
    for (let k = row + 1; k < n; k++) sum -= a[row][k] * x[k];
    x[row] = sum / a[row][row];
  }
  return x;
}

/** Solve the normal equations `(A^T A) x = A^T b` for a possibly
 * over-determined system -- the least-squares path used by rung A's
 * 3+ point fit. */
function solveNormalEquations(a: number[][], b: number[]): number[] {
  const n = a[0].length;
  const ata: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const atb = new Array<number>(n).fill(0);
  for (let row = 0; row < a.length; row++) {
    for (let i = 0; i < n; i++) {
      atb[i] += a[row][i] * b[row];
      for (let j = 0; j < n; j++) ata[i][j] += a[row][i] * a[row][j];
    }
  }
  return solveLinearSystem(ata, atb);
}

/** Rung A: uniform scale + rotation similarity transform, fit by
 * least squares over 2+ reference points (a solvable minimum: 2 point
 * pairs already fully determine a, b, tx, ty; 3+ points make the fit
 * over-determined and is when residuals become meaningful). */
export function fitSimilarity(points: readonly ReferencePoint[]): CalibrationResult {
  if (points.length < 2) {
    throw new CalibrationError(
      'too_few_points',
      `rung A (scale) needs 2+ reference points, got ${points.length}`,
    );
  }
  // Unknowns: [a, b, tx, ty]. Each point contributes two rows:
  //   x = a*u - b*v + tx
  //   y = b*u + a*v + ty
  const rows: number[][] = [];
  const rhs: number[] = [];
  for (const p of points) {
    rows.push([p.image.u, -p.image.v, 1, 0]);
    rhs.push(p.object.x);
    rows.push([p.image.v, p.image.u, 0, 1]);
    rhs.push(p.object.y);
  }
  const [a, b, tx, ty] = solveNormalEquations(rows, rhs);
  const mmPerPx = Math.hypot(a, b);
  if (!Number.isFinite(mmPerPx) || mmPerPx < 1e-9) {
    throw new CalibrationError(
      'degenerate_points',
      'rung A fit produced a degenerate (near-zero) scale -- points may coincide',
    );
  }
  const transform: SimilarityTransform = { rung: 'scale', a, b, tx, ty, mmPerPx };
  const residuals = residualsFor(transform, points);
  return { transform, residuals, accuracyBoundMm: accuracyBoundFor(residuals) };
}

/** Rung B: projective homography via the Direct Linear Transform
 * (DLT), fit by least squares (normal equations) over 4+ points on a
 * known planar target -- corrects perspective/keystone. Dependency-
 * free closed-form linear algebra per the WO's escalation note. */
export function fitHomography(points: readonly ReferencePoint[]): CalibrationResult {
  if (points.length < 4) {
    throw new CalibrationError(
      'too_few_points',
      `rung B (homography) needs 4+ reference points, got ${points.length}`,
    );
  }
  // Standard DLT: for each correspondence (u,v) -> (x,y), with H
  // normalized so h33 = 1, two equations per point in the 8 unknowns
  // [h11..h32]:
  //   u*h11 + v*h12 + h13 - x*u*h31 - x*v*h32 = x
  //   u*h21 + v*h22 + h23 - y*u*h31 - y*v*h32 = y
  const rows: number[][] = [];
  const rhs: number[] = [];
  for (const p of points) {
    const { u, v } = p.image;
    const { x, y } = p.object;
    rows.push([u, v, 1, 0, 0, 0, -x * u, -x * v]);
    rhs.push(x);
    rows.push([0, 0, 0, u, v, 1, -y * u, -y * v]);
    rhs.push(y);
  }
  const sol = solveNormalEquations(rows, rhs);
  const h = [
    [sol[0], sol[1], sol[2]],
    [sol[3], sol[4], sol[5]],
    [sol[6], sol[7], 1],
  ];
  const transform: HomographyTransform = { rung: 'homography', h };
  const residuals = residualsFor(transform, points);
  return { transform, residuals, accuracyBoundMm: accuracyBoundFor(residuals) };
}

export function fitCalibration(
  rung: CalibrationRung,
  points: readonly ReferencePoint[],
): CalibrationResult {
  return rung === 'scale' ? fitSimilarity(points) : fitHomography(points);
}

// --- Honesty diagnostics (WO-G11 deliverable 6) -----------------------

export type CaptureKind = 'flatbed_scan' | 'photo' | 'drawing_scan';
export type PitchBasis = 'measured' | 'certified' | 'printed';

export interface CalibrationDiagnostic {
  code: 'photo_uncorrected_scale' | 'accuracy_bound_tighter_than_residual';
  message: string;
}

/** The two honesty checks the WO names, run client-side so the author
 * sees them BEFORE export (mirrors the lowering-side checks WO-147
 * will enforce -- same rule, earlier surface). */
export function calibrationDiagnostics(params: {
  captureKind: CaptureKind;
  rung: CalibrationRung;
  declaredAccuracyBoundMm: number;
  residualMaxMm: number;
}): CalibrationDiagnostic[] {
  const diagnostics: CalibrationDiagnostic[] = [];
  if (params.captureKind === 'photo' && params.rung === 'scale') {
    diagnostics.push({
      code: 'photo_uncorrected_scale',
      message:
        'capture_kind=photo with model=scale: an uncorrected perspective ' +
        'image cannot honestly claim a uniform scale -- fit rung B ' +
        '(homography) or re-capture as a flatbed scan.',
    });
  }
  if (params.declaredAccuracyBoundMm < params.residualMaxMm) {
    diagnostics.push({
      code: 'accuracy_bound_tighter_than_residual',
      message:
        `declared accuracy_bound_mm (${params.declaredAccuracyBoundMm}) is ` +
        `tighter than the fitted residual_max_mm (${params.residualMaxMm}) -- ` +
        "a declared bound tighter than the calibration's own error is dishonest.",
    });
  }
  return diagnostics;
}
