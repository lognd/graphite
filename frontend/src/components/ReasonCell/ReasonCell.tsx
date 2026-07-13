// A named deferral/violation reason with an F-number link to the governing
// design-log rule where one exists (spec 03.5 / 04.1's "any list of
// problems" checklist).

import './ReasonCell.css';

export interface ReasonCellProps {
  reason: string | null;
  fNumber?: string | null;
}

export function ReasonCell({ reason, fNumber }: ReasonCellProps) {
  if (!reason) {
    return <span className="gr-reason-cell gr-reason-cell--empty">--</span>;
  }
  return (
    <span className="gr-reason-cell">
      <span className="gr-reason-cell__text">{reason}</span>
      {fNumber ? (
        <a className="gr-reason-cell__f" href={`#/design-log/${fNumber}`}>
          {fNumber}
        </a>
      ) : null}
    </span>
  );
}
