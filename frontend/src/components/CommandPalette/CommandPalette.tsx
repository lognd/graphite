// ctrl+k command palette (spec 03.3): a first-class navigation surface, not
// an afterthought. The single modal elevation exemption to the no-shadow
// ban (spec 03.1.4) applies here.

import { useMemo, useState } from 'react';
import './CommandPalette.css';

// frob:doc docs/guide.md#1017-commandpalette
export interface Command {
  id: string;
  label: string;
  run: () => void;
}

// frob:doc docs/guide.md#1017-commandpalette
export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: Command[];
}

// frob:doc docs/guide.md#1017-commandpalette
export function CommandPalette({ open, onClose, commands }: CommandPaletteProps) {
  // Mounted only while open, so a fresh instance (and fresh query state)
  // is created every time the palette opens -- no reset-on-close effect
  // needed.
  if (!open) return null;
  return <CommandPaletteBody onClose={onClose} commands={commands} />;
}

function CommandPaletteBody({ onClose, commands }: { onClose: () => void; commands: Command[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query) return commands;
    const needle = query.toLowerCase();
    return commands.filter((c) => c.label.toLowerCase().includes(needle));
  }, [commands, query]);

  return (
    <div className="gr-command-palette__backdrop" role="presentation" onClick={onClose}>
      <div
        className="gr-command-palette"
        role="dialog"
        aria-label="command palette"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          className="gr-command-palette__input"
          autoFocus
          placeholder="type a command..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="command palette search"
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter' && filtered[0]) {
              filtered[0].run();
              onClose();
            }
          }}
        />
        <ul className="gr-command-palette__list">
          {filtered.length === 0 ? (
            <li className="gr-command-palette__empty">no matching commands</li>
          ) : (
            filtered.map((cmd) => (
              <li key={cmd.id}>
                <button
                  type="button"
                  className="gr-command-palette__item"
                  onClick={() => {
                    cmd.run();
                    onClose();
                  }}
                >
                  {cmd.label}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
