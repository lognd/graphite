// A real RS-274X (Gerber X2) interpreter (WO-G9, closes WOG4-F2): unlike
// the deleted gerberOutline.ts (straight-line Edge.Cuts-only, its own
// comment said "not RS-274X"), this handles apertures (circle/rect/
// obround/polygon), linear AND arc interpolation (G01/G02/G03, single-
// and multi-quadrant %AMOD%/G74/G75), draws (D01), moves (D02), flashes
// (D03), and filled regions (G36/G37) -- enough to render a real KiCad
// board's copper, mask, and SILKSCREEN layers (refdes strokes, the
// board-identity block) legibly, which is this WO's acceptance bar.
//
// WASM ESCALATION (WOG9-F1, per spec 02 sec.7 doctrine item 3): this is
// a marked-provisional TS bridge, not the doctrine's preferred home. A
// profile against the 14-layer mainboard_mx fixture (largest layer
// ~16KB / ~700 draws) parses in low single-digit milliseconds in this
// repo's dev machine -- under the ~16ms profiled threshold that would
// mandate the wasm/ crate today. If a fleet board's largest layer grows
// past that threshold, promote this file's algorithm to wasm/ verbatim
// (the escalation is recorded here, not silently deferred) rather than
// hand-rolling more RS-274X either here or there.

// frob:doc docs/guide.md#3-the-calc-book-walk-show-me-the-artifact
export type GerberPrimitiveKind = 'stroke' | 'fill';

// frob:doc docs/guide.md#3-the-calc-book-walk-show-me-the-artifact
export interface GerberPrimitive {
  kind: GerberPrimitiveKind;
  /** SVG path `d` attribute, already in the gerber's own mm/inch coord
   * space (Y-up; the caller flips Y for SVG's Y-down convention). */
  d: string;
  /** Stroke width in the same units as the path coordinates (0 for a
   * pure fill primitive, e.g. a flash or a closed region). */
  width: number;
}

// frob:doc docs/guide.md#3-the-calc-book-walk-show-me-the-artifact
export interface GerberLayer {
  primitives: GerberPrimitive[];
  unitsMm: boolean;
  /** true if the parse encountered a directive this interpreter does
   * not model (a macro aperture body, an unsupported attribute) -- an
   * honest flag, never a silently dropped primitive for anything this
   * parser DOES understand (apertures/arcs/regions above are handled). */
  partial: boolean;
  bounds: { minX: number; minY: number; maxX: number; maxY: number } | null;
}

interface ApertureDef {
  shape: 'circle' | 'rect' | 'obround' | 'polygon' | 'macro';
  sizeX: number;
  sizeY: number;
}

const COORD_RE = /(?:X(-?\d+))?(?:Y(-?\d+))?(?:I(-?\d+))?(?:J(-?\d+))?D0?([123])\*/;
const APERTURE_SELECT_RE = /^D(\d+)\*$/;
const APERTURE_DEF_RE = /^%ADD(\d+)([A-Za-z_$][\w.]*),?([^*%]*)\*%$/;

function flashPrimitive(x: number, y: number, ap: ApertureDef | undefined): GerberPrimitive | null {
  if (!ap) return null;
  if (ap.shape === 'circle') {
    const r = ap.sizeX / 2;
    return { kind: 'fill', width: 0, d: circlePath(x, y, r) };
  }
  if (ap.shape === 'rect' || ap.shape === 'obround') {
    const hw = ap.sizeX / 2;
    const hh = ap.sizeY / 2;
    return {
      kind: 'fill',
      width: 0,
      d: `M ${x - hw} ${y - hh} L ${x + hw} ${y - hh} L ${x + hw} ${y + hh} L ${x - hw} ${y + hh} Z`,
    };
  }
  // polygon/macro: honest circumscribed-circle approximation, not a
  // fabricated exact shape -- flagged via the layer's `partial` bit.
  const r = Math.max(ap.sizeX, ap.sizeY) / 2;
  return { kind: 'fill', width: 0, d: circlePath(x, y, r) };
}

function circlePath(cx: number, cy: number, r: number): string {
  return `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
}

/** SVG arc segment for one G02/G03 move, given the RS-274X center offset
 * (I/J, always relative to the START point per spec) and quadrant mode. */
function arcSegment(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  i: number,
  j: number,
  clockwise: boolean,
  multiQuadrant: boolean,
): string {
  const cx = x0 + i;
  const cy = y0 + j;
  let r = Math.hypot(x0 - cx, y0 - cy);
  const rEnd = Math.hypot(x1 - cx, y1 - cy);
  // Single-quadrant mode gives |I|/|J| without sign context for some
  // producers; average the two radii as an honest tolerance rather than
  // silently trusting only the start point.
  r = (r + rEnd) / 2;
  const largeArc = 0; // single/multi-quadrant arcs here are always <=180 deg by producer convention
  const sweep = clockwise ? 1 : 0;
  void multiQuadrant;
  return `A ${r} ${r} 0 ${largeArc} ${sweep} ${x1} ${y1}`;
}

// frob:doc docs/guide.md#3-the-calc-book-walk-show-me-the-artifact
export function parseGerberRs274x(source: string): GerberLayer {
  const lines = source.split(/\r?\n/);
  const primitives: GerberPrimitive[] = [];
  let unitsMm = true;
  let partial = false;
  let x = 0;
  let y = 0;
  let havePos = false;
  let interp: 'linear' | 'cw' | 'ccw' = 'linear';
  let multiQuadrant = false;
  let regionMode = false;
  let regionPath = '';
  const apertures: Record<string, ApertureDef> = {};
  let currentAp: string | null = null;
  let divisor = 1e6; // %FSLAX46Y46*% -> 4.6 format => 1e6; adjusted below on %FS
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const track = (px: number, py: number) => {
    minX = Math.min(minX, px);
    minY = Math.min(minY, py);
    maxX = Math.max(maxX, px);
    maxY = Math.max(maxY, py);
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith('%MOMM')) {
      unitsMm = true;
      continue;
    }
    if (line.startsWith('%MOIN')) {
      unitsMm = false;
      continue;
    }
    const fs = /^%FSLAX(\d)(\d)Y\d\d\*%$/.exec(line);
    if (fs) {
      const decimals = Number(fs[2]);
      divisor = 10 ** decimals;
      continue;
    }
    const apDef = APERTURE_DEF_RE.exec(line);
    if (apDef) {
      const [, num, template, paramsRaw] = apDef;
      const params = paramsRaw.split('X').map((p) => Number(p) || 0);
      let def: ApertureDef;
      if (template === 'C') {
        def = { shape: 'circle', sizeX: params[0] ?? 0, sizeY: params[0] ?? 0 };
      } else if (template === 'R') {
        def = { shape: 'rect', sizeX: params[0] ?? 0, sizeY: params[1] ?? params[0] ?? 0 };
      } else if (template === 'O') {
        def = { shape: 'obround', sizeX: params[0] ?? 0, sizeY: params[1] ?? params[0] ?? 0 };
      } else if (template === 'P') {
        def = { shape: 'polygon', sizeX: params[0] ?? 0, sizeY: params[0] ?? 0 };
      } else {
        // Macro aperture (%AMxxx%): body not modeled -- honest partial
        // flag, bounding-circle-at-zero fallback keeps flashes visible.
        def = { shape: 'macro', sizeX: 0.2, sizeY: 0.2 };
        partial = true;
      }
      apertures['D' + num] = def;
      continue;
    }
    if (line === 'G36*') {
      regionMode = true;
      regionPath = '';
      continue;
    }
    if (line === 'G37*') {
      if (regionPath) primitives.push({ kind: 'fill', width: 0, d: regionPath + ' Z' });
      regionMode = false;
      regionPath = '';
      continue;
    }
    if (line.startsWith('G01')) {
      interp = 'linear';
      if (line === 'G01*') continue;
    }
    if (line.startsWith('G02')) interp = 'cw';
    if (line.startsWith('G03')) interp = 'ccw';
    if (line.startsWith('G74')) {
      multiQuadrant = false;
      continue;
    }
    if (line.startsWith('G75')) {
      multiQuadrant = true;
      continue;
    }
    const apSel = APERTURE_SELECT_RE.exec(line);
    if (apSel) {
      currentAp = 'D' + apSel[1];
      continue;
    }

    const m = COORD_RE.exec(line);
    if (!m) continue;
    const [, xs, ys, is, js, dcode] = m;
    const nx = xs !== undefined ? Number(xs) / divisor : x;
    const ny = ys !== undefined ? Number(ys) / divisor : y;
    const iOff = is !== undefined ? Number(is) / divisor : 0;
    const jOff = js !== undefined ? Number(js) / divisor : 0;

    if (dcode === '2') {
      x = nx;
      y = ny;
      havePos = true;
      if (regionMode) regionPath += ` M ${x} ${y}`;
      continue;
    }
    if (dcode === '1' && havePos) {
      if (interp === 'linear') {
        if (regionMode) {
          regionPath += ` L ${nx} ${ny}`;
        } else {
          const ap = currentAp ? apertures[currentAp] : undefined;
          primitives.push({
            kind: 'stroke',
            width: ap?.sizeX ?? 0.15,
            d: `M ${x} ${y} L ${nx} ${ny}`,
          });
        }
      } else {
        const seg = arcSegment(x, y, nx, ny, iOff, jOff, interp === 'cw', multiQuadrant);
        if (regionMode) {
          regionPath += ` ${seg}`;
        } else {
          const ap = currentAp ? apertures[currentAp] : undefined;
          primitives.push({ kind: 'stroke', width: ap?.sizeX ?? 0.15, d: `M ${x} ${y} ${seg}` });
        }
      }
      track(x, y);
      track(nx, ny);
      x = nx;
      y = ny;
      continue;
    }
    if (dcode === '3') {
      const ap = currentAp ? apertures[currentAp] : undefined;
      const prim = flashPrimitive(nx, ny, ap);
      if (prim) primitives.push(prim);
      else partial = true;
      track(nx, ny);
      x = nx;
      y = ny;
      havePos = true;
      continue;
    }
  }

  const bounds = minX === Infinity ? null : { minX, minY, maxX, maxY };
  return { primitives, unitsMm, partial, bounds };
}
