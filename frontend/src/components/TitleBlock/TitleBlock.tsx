// The engineering-drawing title block (spec 03.3): the app's identity
// element, present on every major view -- project, design hash, schema
// version, report timestamp, verdict summary.

import type { Verdict } from '../../api/api.generated';
import { HashChip } from '../HashChip/HashChip';
import { VerdictBadge } from '../VerdictBadge/VerdictBadge';
import './TitleBlock.css';

export interface TitleBlockProps {
  projectName: string;
  designHash: string;
  schemaVersion: number;
  reportTimestamp: string;
  verdict: Verdict;
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
        <HashChip full={designHash} />
      </div>
      <div className="gr-title-block__cell">
        <span className="gr-micro-label">schema</span>
        <span className="gr-title-block__value">v{schemaVersion}</span>
      </div>
      <div className="gr-title-block__cell">
        <span className="gr-micro-label">report</span>
        <span className="gr-title-block__value">{reportTimestamp}</span>
      </div>
      <div className="gr-title-block__cell gr-title-block__cell--verdict">
        <span className="gr-micro-label">verdict</span>
        <VerdictBadge verdict={verdict} />
      </div>
    </div>
  );
}
