// The closed viewer vocabulary (lithos AD-41) mapped to a renderer kind
// this repo knows how to draw. `ALL_VIEWERS` is the completeness check:
// `viewerRegistry.test.ts` asserts every one of these has an entry --
// delete one and that test fails (the "no route" lesson applied to
// viewers, not just families; the family-level version lives in
// familyIndex.test.ts/router integration).

export const ALL_VIEWERS = [
  'svg',
  'raster',
  'gerber',
  'glb',
  'table',
  'markdown',
  'json',
  'text',
  'binary',
] as const;

export type ViewerKind = (typeof ALL_VIEWERS)[number];

export type RenderStrategy =
  | 'inline-svg'
  | 'inline-img'
  | 'gerber-stack'
  | 'glb-embed'
  | 'csv-table'
  | 'markdown'
  | 'pretty-json'
  | 'plain-text'
  | 'honest-fallback';

/** Every closed-vocabulary viewer resolves to SOME strategy -- `binary`,
 * and anything this map does not otherwise cover, resolves to
 * `honest-fallback` (name/family/size/hash + reason), never a blank
 * pane (deliverable 2). */
export const VIEWER_STRATEGY: Record<ViewerKind, RenderStrategy> = {
  svg: 'inline-svg',
  raster: 'inline-img',
  gerber: 'gerber-stack',
  glb: 'glb-embed',
  table: 'csv-table',
  markdown: 'markdown',
  json: 'pretty-json',
  text: 'plain-text',
  binary: 'honest-fallback',
};

/** The strategy for a viewer string that may NOT be in the closed
 * vocabulary (a future lithos viewer graphite has not been taught) --
 * falls back honestly rather than throwing. */
export function strategyFor(viewer: string): RenderStrategy {
  return (VIEWER_STRATEGY as Record<string, RenderStrategy>)[viewer] ?? 'honest-fallback';
}
