// The ONE config-field row component (spec 04.1's "ANY FORM/CONFIG
// FIELD" floor, dedup law 04.2): source attribution, reset-to-default,
// and a real validation error message per field. Both the regolith
// config editor (source = a where-doctrine level) and graphite's own
// settings (source = "graphite", one level only) compose this, rather
// than hand-rolling two form-row implementations.

import { useState } from 'react';
import type { ReactNode } from 'react';
import './ConfigField.css';

export interface ConfigFieldProps {
  label: string;
  doc?: string;
  /** The current effective value, as a plain string (the wire shape
   * every config value round-trips as -- coercion is the CLI's job). */
  value: string;
  /** Source-attribution badge text (04.1: mandatory, never omitted).
   * `regolith config where`'s level (default/global/project/env/flag)
   * for config fields, or a fixed "graphite" for settings fields. */
  source: string;
  /** Whether the current value already equals the default -- reset is
   * disabled/hidden once true (nothing to reset). */
  isDefault: boolean;
  onSave: (value: string) => Promise<unknown>;
  onReset: () => Promise<unknown>;
  /** Optional constrained input (e.g. a verbosity <select>); a plain
   * text input is used when omitted. */
  renderInput?: (props: {
    value: string;
    onChange: (v: string) => void;
    disabled: boolean;
  }) => ReactNode;
}

export function ConfigField({
  label,
  doc,
  value,
  source,
  isDefault,
  onSave,
  onReset,
  renderInput,
}: ConfigFieldProps) {
  const [draft, setDraft] = useState(value);
  // "Adjust state during render" (react.dev): when the server-confirmed
  // value changes underneath us (a save/reset elsewhere re-fetched it),
  // snap the draft back to it rather than syncing via a useEffect
  // (which would cascade an extra render for no benefit here).
  const [priorValue, setPriorValue] = useState(value);
  if (value !== priorValue) {
    setPriorValue(value);
    setDraft(value);
  }
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const dirty = draft !== value;

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await onSave(draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    setBusy(true);
    setError(null);
    try {
      await onReset();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const inputProps = { value: draft, onChange: setDraft, disabled: busy };

  return (
    <div className="gr-config-field">
      <div className="gr-config-field__head">
        <span className="gr-config-field__label">{label}</span>
        <span className="gr-config-field__source" title="which level set this value">
          {source}
        </span>
      </div>
      {doc ? <p className="gr-config-field__doc">{doc}</p> : null}
      <div className="gr-config-field__row">
        {renderInput ? (
          renderInput(inputProps)
        ) : (
          <input
            className="gr-config-field__input"
            type="text"
            aria-label={label}
            value={draft}
            disabled={busy}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void save();
            }}
          />
        )}
        <button
          type="button"
          className="gr-config-field__save"
          disabled={busy || !dirty}
          onClick={() => void save()}
        >
          save
        </button>
        <button
          type="button"
          className="gr-config-field__reset"
          disabled={busy || isDefault}
          onClick={() => void reset()}
          title="reset to default"
        >
          reset to default
        </button>
      </div>
      {error ? (
        <p className="gr-config-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
