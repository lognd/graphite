// Copyable content-hash chip (spec 03.5): short-form by default, expandable
// to the full hash, one click to copy. Every artifact/report hash in the
// app renders through this component (dedup law 04.2) rather than ad hoc
// <code> snippets.

import { useState } from 'react';
import './HashChip.css';

export interface HashChipProps {
  full: string;
  shortLength?: number;
}

export function HashChip({ full, shortLength = 7 }: HashChipProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const short = full.slice(0, shortLength);

  async function copy() {
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard API unavailable (e.g. insecure context in tests) --
      // fail silently, the value is still visible/selectable.
    }
  }

  return (
    <span className="gr-hash-chip">
      <button
        type="button"
        className="gr-hash-chip__value"
        onClick={() => setExpanded((e) => !e)}
        title={expanded ? 'collapse' : 'expand'}
      >
        {expanded ? full : short}
      </button>
      <button type="button" className="gr-hash-chip__copy" onClick={copy} aria-label="copy hash">
        {copied ? 'copied' : 'copy'}
      </button>
    </span>
  );
}
