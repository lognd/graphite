// The engineering-drawing title block (spec 03.3): the app's identity
// element, present on every major view -- project, design hash, schema
// version, report timestamp, verdict summary. Fields the current view
// cannot honestly source yet render as a dim "--" placeholder rather than
// a fabricated value (charter 3.2: graphite never invents a number).

import type { Verdict } from '../VerdictBadge/verdict';
import { HashChip } from '../HashChip/HashChip';
import { VerdictBadge } from '../VerdictBadge/VerdictBadge';
import './TitleBlock.css';

export interface TitleBlockProps {
  projectName: string;
  designHash: string | null;
  schemaVersion: string | null;
  reportTimestamp: string | null;
  verdict: Verdict | null;
}

export function TitleBlock({
  projectName,
  designHash,
  schemaVersion,
  reportTimestamp,
  verdict,
}: TitleBlockProps) {
  return (
    <div className="gr-title-block">
      <div className="gr-title-block__cell">
        <span className="gr-micro-label">project</span>
        <span className="gr-title-block__value">{projectName}</span>
      </div>
      <div className="gr-title-block__cell">
        <span className="gr-micro-label">design hash</span>
        {designHash ? (
          <HashChip full={designHash} />
        ) : (
          <span className="gr-title-block__value">--</span>
        )}
      </div>
      <div className="gr-title-block__cell">
        <span className="gr-micro-label">schema</span>
        <span className="gr-title-block__value">{schemaVersion ?? '--'}</span>
      </div>
      <div className="gr-title-block__cell">
        <span className="gr-micro-label">report</span>
        <span className="gr-title-block__value">{reportTimestamp ?? '--'}</span>
      </div>
      <div className="gr-title-block__cell gr-title-block__cell--verdict">
        <span className="gr-micro-label">verdict</span>
        {verdict ? (
          <VerdictBadge verdict={verdict} />
        ) : (
          <span className="gr-title-block__value">--</span>
        )}
      </div>
    </div>
  );
}
