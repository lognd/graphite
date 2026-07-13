// Single home for rendering a verdict (spec 03.5). Semantic verdict colors
// are reserved for this component ONLY -- never reused decoratively
// elsewhere (spec 03.2).

import type { Verdict } from '../../api/api.generated';
import './VerdictBadge.css';

const LABEL: Record<Verdict, string> = {
  discharged: 'DISCHARGED',
  violated: 'VIOLATED',
  deferred: 'DEFERRED',
  'accepted-deviation': 'ACCEPTED-DEVIATION',
  excluded: 'EXCLUDED',
};

export interface VerdictBadgeProps {
  verdict: Verdict;
  compact?: boolean;
}

export function VerdictBadge({ verdict, compact = false }: VerdictBadgeProps) {
  return (
    <span
      className={`gr-verdict-badge gr-verdict-badge--${verdict}${compact ? ' gr-verdict-badge--compact' : ''}`}
      data-verdict={verdict}
    >
      {compact ? LABEL[verdict].slice(0, 1) : LABEL[verdict]}
    </span>
  );
}
