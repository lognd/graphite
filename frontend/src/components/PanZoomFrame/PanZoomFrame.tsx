// Shared pan/zoom/fit frame for flat 2D graphics (spec 04.1 "any graphic":
// fit/zoom controls) -- used by the drawings SVG viewer and the boards
// Edge.Cuts outline preview so the interaction lives in ONE place
// (dedup law 04.2) instead of two ad hoc re-implementations.

import { useRef, useState, type ReactNode, type WheelEvent } from 'react';
import './PanZoomFrame.css';

export interface PanZoomFrameProps {
  children: ReactNode;
  ariaLabel: string;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 8;

export function PanZoomFrame({ children, ariaLabel }: PanZoomFrameProps) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef<{ x: number; y: number } | null>(null);

  function onWheel(e: WheelEvent<HTMLDivElement>) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s * delta)));
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    dragging.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    setPan({ x: e.clientX - dragging.current.x, y: e.clientY - dragging.current.y });
  }
  function onPointerUp() {
    dragging.current = null;
  }

  function fit() {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }

  return (
    <div className="gr-pan-zoom">
      <div className="gr-pan-zoom__toolbar">
        <button type="button" onClick={() => setScale((s) => Math.min(MAX_SCALE, s * 1.2))}>
          zoom in
        </button>
        <button type="button" onClick={() => setScale((s) => Math.max(MIN_SCALE, s / 1.2))}>
          zoom out
        </button>
        <button type="button" onClick={fit}>
          fit
        </button>
        <span className="gr-micro-label">{Math.round(scale * 100)}%</span>
      </div>
      <div
        className="gr-pan-zoom__viewport"
        role="img"
        aria-label={ariaLabel}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          className="gr-pan-zoom__content"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
