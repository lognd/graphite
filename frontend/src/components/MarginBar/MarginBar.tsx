// The dimension-line bar (spec 03.3): margins/utilizations render as a
// tick-terminated bar with a value label, in the engineering-drawing
// dimension-line convention -- never a rounded progress pill.

import './MarginBar.css';

// frob:doc docs/guide.md#103-marginbar
export interface MarginBarProps {
  /** Current value, in `unit`. */
  value: number;
  /** The limit/allowable, in `unit`. */
  limit: number;
  unit: string;
  label?: string;
  /** Render the label as visible text (default). Pass false where the
   * surrounding context already names the bar (e.g. a table column
   * header); the label still reaches screen readers via aria-label
   * (WO-G8: the visible duplicate overflowed dashboard table cells). */
  labelVisible?: boolean;
}

// frob:doc docs/guide.md#103-marginbar
export function MarginBar({ value, limit, unit, label, labelVisible = true }: MarginBarProps) {
  const ratio = limit === 0 ? (value === 0 ? 0 : Infinity) : value / limit;
  const pct = Math.max(0, Math.min(100, Math.abs(ratio) * 100));
  const overLimit = Math.abs(value) > Math.abs(limit);

  return (
    <div
      className="gr-margin-bar"
      role="img"
      aria-label={`${label ?? 'margin'}: ${value}${unit} of ${limit}${unit} limit`}
    >
      {label && labelVisible ? (
        <span className="gr-micro-label gr-margin-bar__label">{label}</span>
      ) : null}
      <div className="gr-margin-bar__track">
        <span className="gr-margin-bar__tick gr-margin-bar__tick--start" />
        <span
          className={`gr-margin-bar__fill${overLimit ? ' gr-margin-bar__fill--over' : ''}`}
          style={{ width: `${pct}%` }}
        />
        <span className="gr-margin-bar__tick gr-margin-bar__tick--end" />
      </div>
      <span className="gr-margin-bar__value">
        {value}
        {unit} / {limit}
        {unit}
      </span>
    </div>
  );
}
