import { describe, expect, it } from 'vitest';
import { parseGerberOutline } from './gerberOutline';

describe('parseGerberOutline', () => {
  it('extracts straight-line draw segments from move/draw pairs', () => {
    const source = [
      '%MOMM*%',
      'G01*',
      'X0Y0D02*',
      'X10000000Y0D01*',
      'X10000000Y10000000D01*',
      'M02*',
    ].join('\n');
    const outline = parseGerberOutline(source);
    expect(outline.unitsMm).toBe(true);
    expect(outline.partial).toBe(false);
    expect(outline.segments).toEqual([
      { x1: 0, y1: 0, x2: 10, y2: 0 },
      { x1: 10, y1: 0, x2: 10, y2: 10 },
    ]);
  });

  it('marks the parse partial when it sees an arc directive', () => {
    const source = ['X0Y0D02*', 'G02*', 'X10000000Y0D01*'].join('\n');
    const outline = parseGerberOutline(source);
    expect(outline.partial).toBe(true);
  });

  it('marks the parse partial on a flash (pad), never rendering it as an edge', () => {
    const source = ['X0Y0D03*'].join('\n');
    const outline = parseGerberOutline(source);
    expect(outline.partial).toBe(true);
    expect(outline.segments).toEqual([]);
  });

  it('returns no segments for an empty/unparseable file (honesty: no fabricated outline)', () => {
    const outline = parseGerberOutline('%MOMM*%\nM02*');
    expect(outline.segments).toEqual([]);
    expect(outline.partial).toBe(false);
  });

  it('reads inches units', () => {
    const outline = parseGerberOutline('%MOIN*%\nX0Y0D02*');
    expect(outline.unitsMm).toBe(false);
  });
});
