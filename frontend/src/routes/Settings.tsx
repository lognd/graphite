// graphite's own settings (WO-G6 deliverable 3): theme override (already
// lives client-side, app/theme.tsx) plus default project root and run
// verbosity, persisted server-side under ~/.graphite/settings.json
// (graphite.service.settings) -- NEVER mixed into regolith config
// (a different precedence doctrine, D163/D164). Same 04.1 form
// checklist: source attribution (trivial -- one level, "graphite"),
// reset-to-default, real validation errors.

import { ConfigField } from '../components/ConfigField/ConfigField';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { ErrorState } from '../components/ErrorState/ErrorState';
import { useResetSettings, useSetSettings, useSettings } from '../api/hooks';
import type { RunVerbosity } from '../api/client';
import { useTheme } from '../app/theme';
import type { ThemePreference } from '../app/theme';
import { PageTitle } from '../components/PageTitle/PageTitle';
import './Settings.css';

const DEFAULT_PROJECT_ROOT = '';
const DEFAULT_RUN_VERBOSITY: RunVerbosity = 'normal';
const DEFAULT_RUN_HISTORY_LIMIT = 200;
const VERBOSITY_OPTIONS: RunVerbosity[] = ['quiet', 'normal', 'verbose'];

// frob:doc docs/guide.md#5-config-doctor-settings
export function Settings() {
  const { preference, setPreference } = useTheme();
  const { data: settings, isLoading, isError, error, refetch } = useSettings();
  const setSettings = useSetSettings();
  const resetSettings = useResetSettings();

  if (isLoading) {
    return <EmptyState title="Loading settings..." />;
  }
  if (isError || !settings) {
    return (
      <ErrorState
        title="Could not read graphite settings"
        detail={error instanceof Error ? error.message : undefined}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="gr-settings-view">
      <PageTitle text="Settings" />
      <div className="gr-config-field">
        <div className="gr-config-field__head">
          <span className="gr-config-field__label">theme</span>
          <span className="gr-config-field__source">graphite (browser-local)</span>
        </div>
        <p className="gr-config-field__doc">
          Follows the OS by default; override here. Stored client-side only (localStorage), not in
          ~/.graphite/settings.json.
        </p>
        <div className="gr-config-field__row">
          <select
            aria-label="theme"
            value={preference}
            onChange={(e) => setPreference(e.target.value as ThemePreference)}
          >
            <option value="system">system</option>
            <option value="dark">dark</option>
            <option value="light">light</option>
          </select>
        </div>
      </div>

      <ConfigField
        label="default_project_root"
        doc="The project graphite lands on at startup when more than one project is under the scan root."
        value={settings.default_project_root}
        source="graphite"
        isDefault={settings.default_project_root === DEFAULT_PROJECT_ROOT}
        onSave={(value) => setSettings.mutateAsync({ ...settings, default_project_root: value })}
        onReset={() => resetSettings.mutateAsync()}
      />

      <ConfigField
        label="run_verbosity"
        doc="Passthrough verbosity for driven regolith CLI invocations (build/ship/test/optimize)."
        value={settings.run_verbosity}
        source="graphite"
        isDefault={settings.run_verbosity === DEFAULT_RUN_VERBOSITY}
        onSave={(value) =>
          setSettings.mutateAsync({ ...settings, run_verbosity: value as RunVerbosity })
        }
        onReset={() => resetSettings.mutateAsync()}
        renderInput={({ value, onChange, disabled }) => (
          <select
            className="gr-config-field__input"
            aria-label="run_verbosity"
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
          >
            {VERBOSITY_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        )}
      />

      <ConfigField
        label="run_history_limit"
        doc="Newest finished run records kept under the runs home; older records and their logs are pruned when a new run starts. 0 keeps everything. (WO-G8, closes WOG5-F3.)"
        value={String(settings.run_history_limit)}
        source="graphite"
        isDefault={settings.run_history_limit === DEFAULT_RUN_HISTORY_LIMIT}
        onSave={(value) =>
          setSettings.mutateAsync({ ...settings, run_history_limit: Number(value) })
        }
        onReset={() => resetSettings.mutateAsync()}
      />
    </div>
  );
}
