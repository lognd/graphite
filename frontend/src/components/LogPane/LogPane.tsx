// Streaming log viewer (spec 03.5): follows the tail by default, ANSI-free
// (stderr text is rendered as plain text -- color escapes are stripped,
// never re-interpreted, per charter 3.1's stdout-is-data / stderr-is-logs
// split), with a search filter.

import { useEffect, useMemo, useRef, useState } from 'react';
import './LogPane.css';

// frob:doc docs/guide.md#108-logpane
export interface LogPaneProps {
  lines: string[];
}

// Strips ANSI escape sequences defensively in case an upstream CLI ignores
// --color never; the pane never renders raw escape bytes.
function stripAnsi(line: string): string {
  // eslint-disable-next-line no-control-regex
  return line.replace(/\x1b\[[0-9;]*m/g, '');
}

// frob:doc docs/guide.md#108-logpane
export function LogPane({ lines }: LogPaneProps) {
  const [query, setQuery] = useState('');
  const [follow, setFollow] = useState(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const clean = lines.map(stripAnsi);
    if (!query) return clean;
    return clean.filter((l) => l.toLowerCase().includes(query.toLowerCase()));
  }, [lines, query]);

  useEffect(() => {
    if (follow && typeof bottomRef.current?.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ block: 'end' });
    }
  }, [filtered, follow]);

  return (
    <div className="gr-log-pane">
      <div className="gr-log-pane__toolbar">
        <input
          className="gr-log-pane__search"
          type="search"
          placeholder="search log"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="search log"
        />
        <label className="gr-log-pane__follow">
          <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} />
          follow
        </label>
      </div>
      <div className="gr-log-pane__body" data-testid="log-pane-body">
        {filtered.length === 0 ? (
          <div className="gr-log-pane__empty">no log lines match</div>
        ) : (
          filtered.map((line, i) => (
            <div className="gr-log-pane__line" key={i}>
              {line}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
