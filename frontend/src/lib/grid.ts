// Grid-capture projection math (WO-G11 deliverable 4, lithos D261 sec.
// 7a): given the grid's 4 clicked outer corners plus a pitch + count,
// project every interior intersection through the CURRENT calibration
// fit so the studio can overlay predictions for the user to confirm or
// drag-correct (the D250/WO-134B transcription-gate pattern -- machine
// proposes, human confirms). Recorded at every rung (not just when a
// future rung C is fitted), per the WO: this is what lets a later
// re-calibration skip re-tracing entirely.

import type { FittedTransform, ImagePoint } from './calibration';
import { applyTransform, CalibrationError } from './calibration';

export interface GridCorners {
  topLeft: ImagePoint;
  topRight: ImagePoint;
  bottomLeft: ImagePoint;
  bottomRight: ImagePoint;
}

export interface GridSpec {
  corners: GridCorners;
  /** Interior + edge intersection COUNTS along each axis (a count of 2
   * means just the two corners on that axis -- i.e. count is the
   * number of grid LINES, not cells). Minimum 2x2 (the 4 corners
   * alone). */
  countU: number;
  countV: number;
}

export interface GridObservation {
  /** Which grid line intersection this is, [i, j] with i in
   * [0, countU), j in [0, countV) -- (0,0) is topLeft, (countU-1,0) is
   * topRight, etc. `null` grid_index is reserved for the `.rgp`
   * provenance shape's non-grid observations; every point this module
   * produces carries a real index. */
  gridIndex: [number, number];
  /** The machine-PROPOSED image-space position (bilinear interpolation
   * of the 4 corners in the grid's own (i,j) parameter space -- this
   * is a placement prediction, not a calibration re-projection, so it
   * works identically at every rung including rung A). */
  predicted: ImagePoint;
  /** The human-CONFIRMED position -- starts equal to `predicted`;
   * `dragObservation` updates it. This is the field the `.rgp`
   * provenance `observations[].image_px` records; predicted-but-
   * unconfirmed points are proposals, never data. */
  confirmed: ImagePoint;
  isConfirmed: boolean;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Bilinear interpolation of the 4 corners at parametric (s, t) in
 * [0, 1] each -- s along the top/bottom edge (u axis), t along the
 * left/right edge (v axis). This is a purely geometric placement
 * prediction over the CLICKED corners, independent of the fitted
 * calibration transform (a grid drawn straight in the image is
 * expected to have straight-ish rows even under perspective, and
 * bilinear interpolation of 4 known corners is the standard
 * assumption for a planar grid photographed under projective
 * distortion up to the same order DLT itself assumes). */
function bilinear(corners: GridCorners, s: number, t: number): ImagePoint {
  const top = {
    u: lerp(corners.topLeft.u, corners.topRight.u, s),
    v: lerp(corners.topLeft.v, corners.topRight.v, s),
  };
  const bottom = {
    u: lerp(corners.bottomLeft.u, corners.bottomRight.u, s),
    v: lerp(corners.bottomLeft.v, corners.bottomRight.v, s),
  };
  return { u: lerp(top.u, bottom.u, t), v: lerp(top.v, bottom.v, t) };
}

/** Project every interior grid-line intersection from the 4 clicked
 * corners + counts. Degenerate specs (fewer than 2 lines per axis)
 * refuse with a typed error rather than returning an empty/garbage
 * set. */
export function projectGrid(spec: GridSpec): GridObservation[] {
  if (spec.countU < 2 || spec.countV < 2) {
    throw new CalibrationError(
      'too_few_points',
      `grid needs at least a 2x2 corner set, got ${spec.countU}x${spec.countV}`,
    );
  }
  const observations: GridObservation[] = [];
  for (let j = 0; j < spec.countV; j++) {
    const t = j / (spec.countV - 1);
    for (let i = 0; i < spec.countU; i++) {
      const s = i / (spec.countU - 1);
      const predicted = bilinear(spec.corners, s, t);
      observations.push({
        gridIndex: [i, j],
        predicted,
        confirmed: { ...predicted },
        isConfirmed: false,
      });
    }
  }
  return observations;
}

/** Apply a user's drag-correction to one observation's confirmed
 * position, marking it confirmed. Pure function over the observation
 * array (immutable update) so the caller (Studio.tsx) can drive it
 * from React state. */
export function confirmObservation(
  observations: readonly GridObservation[],
  gridIndex: [number, number],
  confirmedPosition: ImagePoint,
): GridObservation[] {
  return observations.map((obs) =>
    obs.gridIndex[0] === gridIndex[0] && obs.gridIndex[1] === gridIndex[1]
      ? { ...obs, confirmed: confirmedPosition, isConfirmed: true }
      : obs,
  );
}

/** Confirm every remaining observation in place (accept all
 * predictions) -- the "confirm the set" action once no mispredictions
 * need dragging. */
export function confirmAll(observations: readonly GridObservation[]): GridObservation[] {
  return observations.map((obs) => ({ ...obs, isConfirmed: true }));
}

export interface GridObjectPitch {
  pitchMm: number;
}

/** Reprojection residual of the CONFIRMED grid observations against
 * the current calibration fit, at the known pitch -- lets the studio
 * show whether the grid itself is consistent with the fitted
 * transform (a diagnostic distinct from the reference-point fit
 * residual, since the grid is typically the SOURCE of rung B's own
 * points but can also be a held-out check set). Object-plane
 * positions are derived from grid_index * pitch, anchored at (0,0). */
export function gridResidualsMm(
  observations: readonly GridObservation[],
  transform: FittedTransform,
  pitch: GridObjectPitch,
): { rmsMm: number; maxMm: number } {
  const confirmed = observations.filter((o) => o.isConfirmed);
  if (confirmed.length === 0) {
    return { rmsMm: 0, maxMm: 0 };
  }
  let sumSq = 0;
  let maxMm = 0;
  for (const obs of confirmed) {
    const predicted = applyTransform(transform, obs.confirmed);
    const expectedX = obs.gridIndex[0] * pitch.pitchMm;
    const expectedY = obs.gridIndex[1] * pitch.pitchMm;
    const errMm = Math.hypot(predicted.x - expectedX, predicted.y - expectedY);
    sumSq += errMm * errMm;
    maxMm = Math.max(maxMm, errMm);
  }
  return { rmsMm: Math.sqrt(sumSq / confirmed.length), maxMm };
}
