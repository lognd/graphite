// `?` opens the shortcut sheet (spec 03.3): a modal listing every keyboard
// path so keyboard-first navigation is discoverable, not tribal knowledge.

import './ShortcutSheet.css';

export interface Shortcut {
  keys: string;
  description: string;
}

export interface ShortcutSheetProps {
  open: boolean;
  onClose: () => void;
  shortcuts: Shortcut[];
}

export function ShortcutSheet({ open, onClose, shortcuts }: ShortcutSheetProps) {
  if (!open) return null;
  return (
    <div className="gr-shortcut-sheet__backdrop" role="presentation" onClick={onClose}>
      <div
        className="gr-shortcut-sheet"
        role="dialog"
        aria-label="keyboard shortcuts"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="gr-micro-label">keyboard shortcuts</span>
        <dl className="gr-shortcut-sheet__list">
          {shortcuts.map((s) => (
            <div className="gr-shortcut-sheet__row" key={s.keys}>
              <dt className="gr-shortcut-sheet__keys">{s.keys}</dt>
              <dd className="gr-shortcut-sheet__desc">{s.description}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
