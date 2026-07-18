import { describe, expect, it } from 'vitest';
import type { ArtifactEntry } from '../../api/client';
import { findCalcSheetPdf, findDrawingArtifact, listDrawingNames } from './artifactLookup';

function entry(relpath: string): ArtifactEntry {
  return {
    content_hash: `sha256:${relpath}`,
    relpath,
    size: 1,
    content_type: 'application/octet-stream',
  };
}

describe('findCalcSheetPdf', () => {
  const artifacts = [
    entry('calc/construction__.pdf'),
    entry('calc/deflect__afc15fc09a7f.pdf'),
    entry('calc/calc_book.json'),
  ];

  // frob:tests frontend/src/routes/artifacts/artifactLookup.ts::findCalcSheetPdf
  it('matches the sheet_id::anchor -> anchor__.pdf naming convention', () => {
    expect(findCalcSheetPdf(artifacts, 'deflect::afc15fc09a7f')?.relpath).toBe(
      'calc/deflect__afc15fc09a7f.pdf',
    );
  });

  it('matches an empty-anchor sheet id', () => {
    expect(findCalcSheetPdf(artifacts, 'construction::')?.relpath).toBe('calc/construction__.pdf');
  });

  it('returns null (never fabricates a link) when nothing matches', () => {
    expect(findCalcSheetPdf(artifacts, 'strength[G1]::afc15fc09a7f')).toBeNull();
  });

  it('returns null for an undefined listing', () => {
    expect(findCalcSheetPdf(undefined, 'construction::')).toBeNull();
  });
});

describe('findDrawingArtifact / listDrawingNames', () => {
  const artifacts = [
    entry('drawings/drawings/PavilionFrame.svg'),
    entry('drawings/drawings/PavilionFrame.pdf'),
    entry('drawings/drawings/PavilionFrame.drawing.json'),
    entry('drawings/drawings/contract_graph.svg'),
  ];

  // frob:tests frontend/src/routes/artifacts/artifactLookup.ts::findDrawingArtifact
  it('finds the svg/pdf/drawing.json companions by name', () => {
    expect(findDrawingArtifact(artifacts, 'PavilionFrame', 'svg')?.relpath).toBe(
      'drawings/drawings/PavilionFrame.svg',
    );
    expect(findDrawingArtifact(artifacts, 'PavilionFrame', 'pdf')?.relpath).toBe(
      'drawings/drawings/PavilionFrame.pdf',
    );
    expect(findDrawingArtifact(artifacts, 'PavilionFrame', 'drawing.json')?.relpath).toBe(
      'drawings/drawings/PavilionFrame.drawing.json',
    );
  });

  // frob:tests frontend/src/routes/artifacts/artifactLookup.ts::listDrawingNames
  it('lists every distinct drawing name derived from shipped .svg files', () => {
    expect(listDrawingNames(artifacts)).toEqual(['PavilionFrame', 'contract_graph']);
  });

  it('lists nothing for an empty/undefined listing', () => {
    expect(listDrawingNames(undefined)).toEqual([]);
    expect(listDrawingNames([])).toEqual([]);
  });
});
