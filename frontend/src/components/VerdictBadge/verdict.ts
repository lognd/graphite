// The design system's verdict vocabulary (spec 03.2: the five semantic
// hues) and its ONE mapping from the wire disposition enum (the generated
// AuditRow["disposition"]). This is UI vocabulary, not a wire shape -- the
// wire truth stays in api.generated.ts (dedup law 02.2); this file only
// names the design-token buckets those values color to.

import type { components } from '../../api/api.generated';

export type Verdict = 'discharged' | 'violated' | 'deferred' | 'accepted-deviation' | 'excluded';

export type Disposition = components['schemas']['AuditRow']['disposition'];

// calc_sheet means the obligation was discharged with evidence (a calc
// sheet); the other three map one-to-one.
const DISPOSITION_TO_VERDICT: Record<Disposition, Verdict> = {
  calc_sheet: 'discharged',
  accepted_deviation: 'accepted-deviation',
  deferred: 'deferred',
  violated: 'violated',
};

export function dispositionToVerdict(disposition: Disposition): Verdict {
  return DISPOSITION_TO_VERDICT[disposition];
}
