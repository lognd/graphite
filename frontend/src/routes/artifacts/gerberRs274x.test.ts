// `?raw` (vite/client's built-in raw-text loader) reads these straight
// from the committed fixture -- real KiCad RS-274X output, not hand-
// written test data -- without needing Node's fs types wired into the
// app tsconfig project (spec 02.6's "committed fixture project" via a
// path vitest/vite can both resolve).
import fSilkscreenGerber from '../../../../tests/fixtures/mainboard_mx/dist/boards/gerbers/board-F_Silkscreen.gto?raw';
import edgeCutsGerber from '../../../../tests/fixtures/mainboard_mx/dist/boards/gerbers/board-Edge_Cuts.gm1?raw';
import fCuGerber from '../../../../tests/fixtures/mainboard_mx/dist/boards/gerbers/board-F_Cu.gtl?raw';
import { describe, expect, it } from 'vitest';
import { parseGerberRs274x } from './gerberRs274x';

describe('parseGerberRs274x (WO-G9, closes WOG4-F2)', () => {
  // frob:tests frontend/src/routes/artifacts/gerberRs274x.ts::parseGerberRs274x
  it('parses the real F_Silkscreen layer (KiCad stroke text, circle apertures) into visible strokes', () => {
    const layer = parseGerberRs274x(fSilkscreenGerber);
    expect(layer.primitives.length).toBeGreaterThan(50);
    expect(layer.primitives.every((p) => p.kind === 'stroke')).toBe(true);
    expect(layer.bounds).not.toBeNull();
    expect(layer.unitsMm).toBe(true);
    // this fixture's silkscreen has only circular apertures/lines -- no
    // macros or unmodeled directives, so the parse must be complete.
    expect(layer.partial).toBe(false);
  });

  it('parses Edge.Cuts into a closed-ish outline', () => {
    const layer = parseGerberRs274x(edgeCutsGerber);
    expect(layer.primitives.length).toBeGreaterThan(0);
    expect(layer.bounds).not.toBeNull();
  });

  it('parses F_Cu (copper, empty on this fixture board) without throwing', () => {
    // This fixture's copper layer has no features (aperture list is
    // empty in the file itself) -- an honestly empty parse, not a bug.
    const layer = parseGerberRs274x(fCuGerber);
    expect(layer.primitives).toHaveLength(0);
    expect(layer.partial).toBe(false);
  });

  it('handles a synthetic circular arc (G03, single-quadrant)', () => {
    const src = [
      '%FSLAX46Y46*%',
      '%MOMM*%',
      '%ADD10C,0.200000*%',
      'D10*',
      'G01*',
      'X0Y0D02*',
      'G03*',
      'X1000000Y0I500000J0D01*',
      'M02*',
    ].join('\n');
    const layer = parseGerberRs274x(src);
    expect(layer.primitives).toHaveLength(1);
    expect(layer.primitives[0].d).toMatch(/^M 0 0 A /);
    expect(layer.partial).toBe(false);
  });

  it('fills a G36/G37 region as one closed primitive', () => {
    const src = [
      '%FSLAX46Y46*%',
      '%MOMM*%',
      'G01*',
      'G36*',
      'X0Y0D02*',
      'X1000000Y0D01*',
      'X1000000Y1000000D01*',
      'X0Y1000000D01*',
      'X0Y0D01*',
      'G37*',
      'M02*',
    ].join('\n');
    const layer = parseGerberRs274x(src);
    expect(layer.primitives).toHaveLength(1);
    expect(layer.primitives[0].kind).toBe('fill');
    expect(layer.primitives[0].d.trim().endsWith('Z')).toBe(true);
  });

  it('flashes a circle aperture as a fill primitive', () => {
    const src = ['%FSLAX46Y46*%', '%MOMM*%', '%ADD11C,0.500000*%', 'D11*', 'X0Y0D03*', 'M02*'].join(
      '\n',
    );
    const layer = parseGerberRs274x(src);
    expect(layer.primitives).toHaveLength(1);
    expect(layer.primitives[0].kind).toBe('fill');
  });

  it('flags a macro aperture flash as partial (honest, not a fabricated shape)', () => {
    const src = [
      '%FSLAX46Y46*%',
      '%MOMM*%',
      '%AMcustom*',
      '1,1,0.5,0,0*',
      '%',
      '%ADD12custom*%',
      'D12*',
      'X0Y0D03*',
      'M02*',
    ].join('\n');
    const layer = parseGerberRs274x(src);
    expect(layer.partial).toBe(true);
  });
});
