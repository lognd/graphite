// Small honest lookups over a project's artifact listing (WO-G4): matching
// a calc sheet id or drawing name to its shipped PDF/SVG/JSON companion by
// relpath, WITHOUT ever fabricating a path -- if no listed artifact
// matches, callers render the named absence (honesty rule) instead of a
// guessed link.

import type { ArtifactEntry } from '../../api/client';

/** The calc PDF filename convention observed in the fixture book
 * (`sheet_id.replace('::', '__') + '.pdf'`, e.g. "deflect::afc15fc09a7f"
 * -> "deflect__afc15fc09a7f.pdf"). Matched against the REAL listing --
 * this only narrows the search, it never invents a hash. */
// frob:doc docs/guide.md#3-the-calc-book-walk-show-me-the-artifact
export function findCalcSheetPdf(
  artifacts: ArtifactEntry[] | undefined,
  sheetId: string,
): ArtifactEntry | null {
  if (!artifacts) return null;
  const expected = `${sheetId.replace(/::/g, '__')}.pdf`;
  const byConvention = artifacts.find(
    (a) => a.relpath.startsWith('calc/') && a.relpath.endsWith(expected),
  );
  if (byConvention) return byConvention;
  // Fallback: the claim name (before "::") appears in a calc/*.pdf relpath.
  const claim = sheetId.split('::')[0];
  return (
    artifacts.find(
      (a) =>
        a.relpath.startsWith('calc/') && a.relpath.endsWith('.pdf') && a.relpath.includes(claim),
    ) ?? null
  );
}

// frob:doc docs/guide.md#3-the-calc-book-walk-show-me-the-artifact
export function findDrawingArtifact(
  artifacts: ArtifactEntry[] | undefined,
  drawingName: string,
  extension: string,
): ArtifactEntry | null {
  if (!artifacts) return null;
  return (
    artifacts.find(
      (a) => a.relpath.includes('drawings/') && a.relpath.endsWith(`${drawingName}.${extension}`),
    ) ?? null
  );
}

/** Every distinct drawing base name shipped (derived from the `.svg`
 * companions actually listed -- a drawing "exists" in this UI only if its
 * SVG or PDF is present, never inferred from an unrelated file). */
// frob:doc docs/guide.md#3-the-calc-book-walk-show-me-the-artifact
export function listDrawingNames(artifacts: ArtifactEntry[] | undefined): string[] {
  if (!artifacts) return [];
  const names = new Set<string>();
  for (const a of artifacts) {
    const m = /drawings\/(?:.*\/)?([^/]+)\.svg$/.exec(a.relpath);
    if (m) names.add(m[1]);
  }
  return [...names].sort();
}
