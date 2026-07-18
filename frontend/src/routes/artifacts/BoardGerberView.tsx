// The real gerber stack view (WO-G9, closes WOG4-F2): every `boards`
// family gerber_layer.* row (not just Edge.Cuts) is fetched, parsed with
// the real RS-274X interpreter (gerberRs274x.ts), and rendered as a
// toggleable, correctly z-ordered stack -- so the SILKSCREEN (refdes,
// polarity, board-identity block) is visible and legible at 1:1
// (the acceptance bar this WO closes).

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { ArtifactIndexRow } from '../../api/client';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { PanZoomFrame } from '../../components/PanZoomFrame/PanZoomFrame';
import { parseGerberRs274x, type GerberLayer } from './gerberRs274x';
import './artifacts.css';

// Standard fab stack order, back to front (bottom copper up through top
// silkscreen) -- Edge.Cuts always drawn last (board outline on top of
// everything, the conventional viewer convention).
const LAYER_ORDER = [
  'B_Cu',
  'B_Mask',
  'B_Silkscreen',
  'B_Paste',
  'B_Fab',
  'B_Courtyard',
  'F_Cu',
  'F_Mask',
  'F_Paste',
  'F_Fab',
  'F_Courtyard',
  'F_Silkscreen',
  'Margin',
  'Edge_Cuts',
];

// Resolves to src/tokens/tokens.ts's `gerberLayer` token group (spec
// 03.4: no raw hex in component code) -- both themes covered via the
// CSS custom properties `build-tokens.ts` emits per `data-theme`.
const LAYER_COLOR_VAR: Record<string, string> = {
  B_Cu: 'var(--graphite-color-gerber-layer-b-cu)',
  F_Cu: 'var(--graphite-color-gerber-layer-f-cu)',
  B_Mask: 'var(--graphite-color-gerber-layer-b-mask)',
  F_Mask: 'var(--graphite-color-gerber-layer-f-mask)',
  B_Paste: 'var(--graphite-color-gerber-layer-b-paste)',
  F_Paste: 'var(--graphite-color-gerber-layer-f-paste)',
  B_Silkscreen: 'var(--graphite-color-gerber-layer-b-silkscreen)',
  F_Silkscreen: 'var(--graphite-color-gerber-layer-f-silkscreen)',
  B_Fab: 'var(--graphite-color-gerber-layer-b-fab)',
  F_Fab: 'var(--graphite-color-gerber-layer-f-fab)',
  B_Courtyard: 'var(--graphite-color-gerber-layer-b-courtyard)',
  F_Courtyard: 'var(--graphite-color-gerber-layer-f-courtyard)',
  Margin: 'var(--graphite-color-gerber-layer-margin)',
  Edge_Cuts: 'var(--graphite-color-gerber-layer-edge-cuts)',
};
const UNKNOWN_LAYER_COLOR_VAR = 'var(--graphite-color-gerber-layer-unknown)';

function layerNameOf(kind: string): string | null {
  const m = /^gerber_layer\.(.+)$/.exec(kind);
  return m ? m[1] : null;
}

interface LoadedLayer {
  name: string;
  row: ArtifactIndexRow;
  layer: GerberLayer | null;
  error: string | null;
}

// frob:doc docs/guide.md#3-the-calc-book-walk-show-me-the-artifact
export function BoardGerberView() {
  const { projectId } = useParams<{ projectId: string }>();
  const [rows, setRows] = useState<ArtifactIndexRow[] | null>(null);
  const [loaded, setLoaded] = useState<Record<string, LoadedLayer>>({});
  const [visible, setVisible] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    api.getArtifactIndex(projectId).then((all) => {
      if (cancelled) return;
      const gerbers = all.filter((r) => r.family === 'boards' && layerNameOf(r.kind));
      setRows(gerbers);
      // default: show Edge.Cuts + both silkscreens (the acceptance-bar
      // layers) so the board identity is visible on first load.
      setVisible(
        new Set(
          gerbers
            .map((r) => layerNameOf(r.kind) as string)
            .filter((n) => n === 'Edge_Cuts' || n.endsWith('Silkscreen')),
        ),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !rows) return;
    let cancelled = false;
    for (const row of rows) {
      const name = layerNameOf(row.kind);
      if (!name || loaded[name]) continue;
      api
        .fetchArtifact(projectId, row.content_hash)
        .then((blob) => blob.text())
        .then((text) => {
          if (cancelled) return;
          setLoaded((prev) => ({
            ...prev,
            [name]: { name, row, layer: parseGerberRs274x(text), error: null },
          }));
        })
        .catch((err) => {
          if (cancelled) return;
          setLoaded((prev) => ({
            ...prev,
            [name]: { name, row, layer: null, error: String(err) },
          }));
        });
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `loaded` intentionally excluded (self-referential fetch trigger)
  }, [projectId, rows]);

  const orderedNames = useMemo(() => {
    const present = new Set(Object.keys(loaded));
    const known = LAYER_ORDER.filter((n) => present.has(n));
    const unknown = [...present].filter((n) => !LAYER_ORDER.includes(n)).sort();
    return [...known, ...unknown];
  }, [loaded]);

  const bounds = useMemo(() => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const name of visible) {
      const b = loaded[name]?.layer?.bounds;
      if (!b) continue;
      minX = Math.min(minX, b.minX);
      minY = Math.min(minY, b.minY);
      maxX = Math.max(maxX, b.maxX);
      maxY = Math.max(maxY, b.maxY);
    }
    if (minX === Infinity) return { minX: -10, minY: -10, w: 20, h: 20 };
    const pad = Math.max(maxX - minX, maxY - minY) * 0.05 || 1;
    return {
      minX: minX - pad,
      minY: minY - pad,
      w: maxX - minX + 2 * pad,
      h: maxY - minY + 2 * pad,
    };
  }, [visible, loaded]);

  if (rows === null) return <p role="status">loading gerber layers...</p>;
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No gerber layers shipped for this project (unrouted)"
        detail="This project has no board target, or its board was never routed to gerbers."
      />
    );
  }

  return (
    <div className="gr-board-gerber-view">
      <fieldset className="gr-board-gerber-view__layers">
        <legend className="gr-micro-label">layers (toggle to stack)</legend>
        {orderedNames.map((name) => {
          const l = loaded[name];
          return (
            <label key={name} className="gr-board-gerber-view__layer-row">
              <input
                type="checkbox"
                checked={visible.has(name)}
                onChange={(e) => {
                  setVisible((prev) => {
                    const next = new Set(prev);
                    if (e.target.checked) next.add(name);
                    else next.delete(name);
                    return next;
                  });
                }}
              />
              <span style={{ color: LAYER_COLOR_VAR[name] ?? UNKNOWN_LAYER_COLOR_VAR }}>
                {name.replace('_', '.')}
              </span>
              {l?.error ? <span className="gr-reason-cell"> (parse error: {l.error})</span> : null}
              {l?.layer?.partial ? (
                <span className="gr-reason-cell">
                  {' '}
                  (partial: unmodeled macro/directive present)
                </span>
              ) : null}
              {!l ? <span className="gr-reason-cell"> loading...</span> : null}
            </label>
          );
        })}
      </fieldset>

      <PanZoomFrame ariaLabel="Board gerber layer stack, 1:1">
        <svg
          width={600}
          height={600}
          viewBox={`${bounds.minX} ${-(bounds.minY + bounds.h)} ${bounds.w} ${bounds.h}`}
        >
          {orderedNames
            .filter((name) => visible.has(name) && loaded[name]?.layer)
            .map((name) => (
              <g
                key={name}
                transform="scale(1,-1)"
                fill={LAYER_COLOR_VAR[name] ?? UNKNOWN_LAYER_COLOR_VAR}
              >
                {loaded[name]!.layer!.primitives.map((p, i) =>
                  p.kind === 'stroke' ? (
                    <path
                      key={i}
                      d={p.d}
                      fill="none"
                      stroke={LAYER_COLOR_VAR[name] ?? UNKNOWN_LAYER_COLOR_VAR}
                      strokeWidth={p.width || 0.15}
                      strokeLinecap="round"
                    />
                  ) : (
                    <path
                      key={i}
                      d={p.d}
                      fill={LAYER_COLOR_VAR[name] ?? UNKNOWN_LAYER_COLOR_VAR}
                      stroke="none"
                    />
                  ),
                )}
              </g>
            ))}
        </svg>
      </PanZoomFrame>
      <p className="gr-reason-cell">
        rendered at 1:1 via the real RS-274X interpreter (apertures, arcs, regions) -- WOG9-F1
        tracks promoting this parse to the wasm/ crate per spec 02 sec.7 once a profiled layer
        crosses the ~16ms threshold.
      </p>
    </div>
  );
}
