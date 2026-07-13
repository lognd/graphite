// Live progress for long operations (spec 04.1: elapsed time, cancel, a
// durable percent/step readout). WO-G5 wires the real SSE progress-event
// feed (D228); this component renders whatever step/percent it is given.

import './ProgressRail.css';

export interface ProgressRailProps {
  step: string;
  percent: number | null;
  elapsedSeconds: number;
  onCancel?: () => void;
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function ProgressRail({ step, percent, elapsedSeconds, onCancel }: ProgressRailProps) {
  return (
    <div className="gr-progress-rail">
      <div
        className="gr-progress-rail__track"
        role="progressbar"
        aria-valuenow={percent ?? undefined}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={step}
      >
        <span
          className="gr-progress-rail__fill"
          style={{ width: percent === null ? '100%' : `${percent}%` }}
          data-indeterminate={percent === null}
        />
      </div>
      <span className="gr-progress-rail__step">{step}</span>
      <span className="gr-progress-rail__elapsed">{formatElapsed(elapsedSeconds)}</span>
      {onCancel ? (
        <button type="button" className="gr-progress-rail__cancel" onClick={onCancel}>
          cancel
        </button>
      ) : null}
    </div>
  );
}
