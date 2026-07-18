// Encodes an obligation's (claim_name, subject_anchor) pair into ONE URL
// path segment for the claim-detail route. A two-segment path
// (`/claim/:claimName/:subjectAnchor`) breaks whenever `subject_anchor`
// is the empty string (a real, common case -- e.g. the `construction`
// claim) since react-router will not match an empty dynamic segment;
// this keeps the pair as a single opaque, reversible token instead.

import type { AuditRow } from '../api/client';

const DELIMITER = '~~';

// frob:doc docs/guide.md#9-frontend-lib-notes
export function encodeClaimKey(row: Pick<AuditRow, 'claim_name' | 'subject_anchor'>): string {
  return encodeURIComponent(`${row.claim_name}${DELIMITER}${row.subject_anchor}`);
}

// frob:doc docs/guide.md#9-frontend-lib-notes
export interface DecodedClaimKey {
  claimName: string;
  subjectAnchor: string;
}

// frob:doc docs/guide.md#9-frontend-lib-notes
export function decodeClaimKey(key: string): DecodedClaimKey | null {
  const raw = decodeURIComponent(key);
  const idx = raw.indexOf(DELIMITER);
  if (idx === -1) return null;
  return { claimName: raw.slice(0, idx), subjectAnchor: raw.slice(idx + DELIMITER.length) };
}
