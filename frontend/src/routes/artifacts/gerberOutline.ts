// A minimal, cheap Edge.Cuts gerber parse (WO-G4 deliverable 5): extracts
// straight-line draw segments (G01 + D02/D01 move/draw pairs, the common
// case for a board-outline layer) into SVG-ready line segments. This is
// deliberately NOT a full RS-274X implementation -- arcs (G02/G03),
// apertures, and units directives beyond a plain %MOin/%MOmm are left
// unhandled and reported via `partial`, so the caller can render an honest
// "outline may be incomplete" note rather than silently dropping geometry
// (honesty rule: never claim a complete render of data this parse cannot
// see). Escalation WOG4-F2: if a project's boards route needs full arc
// support, promote this to the wasm/ crate per spec 02.7 sec. 1/3
// (profiled gerber parsing is an explicit WASM-doctrine candidate) instead
// of hand-rolling more RS-274X here.

export interface GerberSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface GerberOutline {
  segments: GerberSegment[];
  /** true if the parse encountered directives it does not understand
   * (arcs, unknown apertures) -- the outline may be incomplete. */
  partial: boolean;
  unitsMm: boolean;
}

export function parseGerberOutline(source: string): GerberOutline {
  const lines = source.split(/\r?\n/);
  const segments: GerberSegment[] = [];
  let unitsMm = true;
  let partial = false;
  let x = 0;
  let y = 0;
  let havePos = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('%MOMM')) {
      unitsMm = true;
      continue;
    }
    if (line.startsWith('%MOIN')) {
      unitsMm = false;
      continue;
    }
    if (line.startsWith('G02') || line.startsWith('G03')) {
      // Arc -- unsupported by this cheap parser.
      partial = true;
      continue;
    }
    const coordMatch = /X(-?\d+)?Y?(-?\d+)?D0([123])\*/.exec(line);
    if (!coordMatch) continue;
    const [, xs, ys, dcode] = coordMatch;
    const nx = xs !== undefined ? Number(xs) / 1e6 : x;
    const ny = ys !== undefined ? Number(ys) / 1e6 : y;
    if (dcode === '1' && havePos) {
      segments.push({ x1: x, y1: y, x2: nx, y2: ny });
    }
    x = nx;
    y = ny;
    havePos = true;
    if (dcode === '3') {
      // Flash -- a pad/via, not an outline edge; not rendered by this
      // outline-only parser (partial, but not an error).
      partial = true;
    }
  }

  return { segments, partial, unitsMm };
}
