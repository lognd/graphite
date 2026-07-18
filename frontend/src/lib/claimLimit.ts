// Parses a numeric limit + unit out of a CalcSheet's `claim_text` (the
// real inequality regolith rendered, e.g. "... <= 60000USD" or
// "... <= 1.0") for the MarginBar's {value, limit, unit} contract.
// Charter 3.2 forbids graphite from fabricating a number: this reads
// the literal trailing "<= <number><unit?>" that the claim text
// ALREADY states, never derives one. Expressions with a non-numeric
// bound (e.g. "<= G1.span / 240") do not match -- callers must fall
// back to plain text, not invent a bar for them.

const LIMIT_PATTERN = /<=\s*([0-9]+(?:\.[0-9]+)?)\s*([A-Za-z%]*)\s*$/;

// frob:doc docs/guide.md#9-frontend-lib-notes
export interface ParsedLimit {
  limit: number;
  unit: string;
}

// frob:doc docs/guide.md#9-frontend-lib-notes
export function parseClaimLimit(claimText: string): ParsedLimit | null {
  const lastLine = claimText.trim().split('\n').at(-1) ?? '';
  const match = LIMIT_PATTERN.exec(lastLine.trim());
  if (!match) return null;
  const limit = Number(match[1]);
  if (!Number.isFinite(limit)) return null;
  return { limit, unit: match[2] ?? '' };
}
