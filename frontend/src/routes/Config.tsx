// Config editor (WO-G6 deliverable 1): the regolith config where-doctrine
// rendered honestly -- every registered key's effective value plus the
// level that won it -- with edits round-tripping through the real
// `regolith config set` CLI (never a private file write) and a real
// reset-to-default (WO-G1 ledger: no dedicated CLI reset verb, so
// "reset" is "set to the recorded default value").

import { useState } from 'react';
import { ConfigField } from '../components/ConfigField/ConfigField';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { ErrorState } from '../components/ErrorState/ErrorState';
import { useConfigSchema, useProjectConfig, useProjects, useSetProjectConfig } from '../api/hooks';
import { PageTitle } from '../components/PageTitle/PageTitle';
import './Config.css';

// `regolith config set` requires an explicit scope (`--global`/`--local`,
// config_cli.py); a key already at a non-default source keeps writing to
// that SAME scope on reset -- a key at "default" gets written to the
// project's local `magnetite.toml` (the least-surprising landing spot).
const NON_LOCAL_SCOPES = new Set(['global', 'env', 'flag']);

function scopeFor(source: string): 'global' | 'local' {
  return source === 'global' ? 'global' : 'local';
}

export function Config() {
  const { data: projects, isLoading: projectsLoading, isError: projectsError } = useProjects();
  const [selected, setSelected] = useState<string | undefined>(undefined);
  const project = selected ?? projects?.[0]?.name;

  const {
    data: entries,
    isLoading: entriesLoading,
    isError: entriesError,
    error: entriesErrorObj,
  } = useProjectConfig(project);
  const { data: schema } = useConfigSchema();
  const setConfig = useSetProjectConfig(project);

  if (projectsLoading) {
    return <EmptyState title="Loading projects..." />;
  }
  if (projectsError || !projects || projects.length === 0) {
    return (
      <EmptyState
        title="No projects to configure"
        detail="No project with a magnetite.toml was found under the configured scan root."
      />
    );
  }

  return (
    <div className="gr-config-view">
      <PageTitle text="Config" />
      <div className="gr-config-view__toolbar">
        <label htmlFor="config-project-select">project</label>
        <select
          id="config-project-select"
          value={project}
          onChange={(e) => setSelected(e.target.value)}
        >
          {projects.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {entriesLoading ? <EmptyState title="Loading config..." /> : null}
      {entriesError ? (
        <ErrorState
          title="Could not read config"
          detail={entriesErrorObj instanceof Error ? entriesErrorObj.message : undefined}
        />
      ) : null}
      {entries && entries.length === 0 ? <EmptyState title="No registered config keys" /> : null}

      {entries ? (
        <div className="gr-config-view__fields">
          {entries.map((entry) => {
            const spec = schema?.find((s) => s.key === entry.key);
            const defaultStr = spec !== undefined ? String(spec.default) : undefined;
            const isDefault = entry.source === 'default';
            return (
              <ConfigField
                key={entry.key}
                label={entry.key}
                doc={spec?.doc}
                value={entry.value}
                source={entry.source}
                isDefault={isDefault}
                onSave={(value) =>
                  setConfig.mutateAsync({
                    key: entry.key,
                    value,
                    level: scopeFor(entry.source),
                  })
                }
                onReset={() => {
                  if (defaultStr === undefined) {
                    return Promise.reject(new Error('no recorded default for this key'));
                  }
                  return setConfig.mutateAsync({
                    key: entry.key,
                    value: defaultStr,
                    level: NON_LOCAL_SCOPES.has(entry.source) ? scopeFor(entry.source) : 'local',
                  });
                }}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
