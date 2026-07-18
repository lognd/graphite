// A named deferral/violation reason with the governing design-log rule
// number highlighted where one exists (spec 03.5 / 04.1's "any list of
// problems" checklist). The rule number renders as emphasized TEXT, not
// a link: no design-log browsing route exists in the app and no shipped
// artifact bundles a design-log index, so the previous
// `#/design-log/<n>` placeholder anchor was a dead link -- worse than
// honest text (WO-G8 close of WOG3-F4; a live link returns if a
// design-log route ever lands, re-recorded in the WO-G8 ledger).

import './ReasonCell.css';

// frob:doc docs/guide.md#105-reasoncell
export interface ReasonCellProps {
  reason: string | null;
  fNumber?: string | null;
}

// frob:doc docs/guide.md#105-reasoncell
export function ReasonCell({ reason, fNumber }: ReasonCellProps) {
  if (!reason) {
    return <span className="gr-reason-cell gr-reason-cell--empty">--</span>;
  }
  return (
    <span className="gr-reason-cell">
      <span className="gr-reason-cell__text">{reason}</span>
      {fNumber ? (
        <span className="gr-reason-cell__f" title="design-log rule cited by this reason">
          {fNumber}
        </span>
      ) : null}
    </span>
  );
}
