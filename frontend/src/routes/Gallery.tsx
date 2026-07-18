// Dev-only component gallery (/dev/gallery, WO-G2 deliverable 4): every
// component in every state, both themes. Excluded from the production
// route table (see app/routes.tsx) -- only registered when import.meta.env.DEV.

import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTheme } from '../app/theme';
import { VerdictBadge } from '../components/VerdictBadge/VerdictBadge';
import { MarginBar } from '../components/MarginBar/MarginBar';
import { HashChip } from '../components/HashChip/HashChip';
import { ReasonCell } from '../components/ReasonCell/ReasonCell';
import { TitleBlock } from '../components/TitleBlock/TitleBlock';
import { StatusLine } from '../components/StatusLine/StatusLine';
import { LogPane } from '../components/LogPane/LogPane';
import { ProgressRail } from '../components/ProgressRail/ProgressRail';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { ErrorState } from '../components/ErrorState/ErrorState';
import { DataTable } from '../components/DataTable/DataTable';
import { ConfigField } from '../components/ConfigField/ConfigField';
import './Gallery.css';

const VERDICTS = ['discharged', 'violated', 'deferred', 'accepted-deviation', 'excluded'] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="gr-gallery__section">
      <h2 className="gr-micro-label">{title}</h2>
      <div className="gr-gallery__swatch">{children}</div>
    </section>
  );
}

// frob:doc docs/guide.md#7-dev-tooling
export function Gallery() {
  const { resolved, setPreference } = useTheme();
  const [paused, setPaused] = useState(false);

  return (
    <div className="gr-gallery">
      <header className="gr-gallery__header">
        <span className="gr-micro-label">component gallery -- theme: {resolved}</span>
        <button type="button" onClick={() => setPreference(resolved === 'dark' ? 'light' : 'dark')}>
          toggle theme
        </button>
      </header>

      <Section title="VerdictBadge">
        {VERDICTS.map((v) => (
          <VerdictBadge key={v} verdict={v} />
        ))}
        {VERDICTS.map((v) => (
          <VerdictBadge key={`c-${v}`} verdict={v} compact />
        ))}
      </Section>

      <Section title="MarginBar">
        <MarginBar value={12.4} limit={20} unit="degC" label="thermal, in-margin" />
        <MarginBar value={-3.2} limit={0} unit="mm" label="structural, over-limit" />
      </Section>

      <Section title="HashChip">
        <HashChip full="a3f9c21bc9912aa00face" />
      </Section>

      <Section title="ReasonCell">
        <ReasonCell reason="load case exceeds envelope" fNumber="F118" />
        <ReasonCell reason="awaiting derating study" />
        <ReasonCell reason={null} />
      </Section>

      <Section title="TitleBlock">
        <TitleBlock
          projectName="examples.timber_pavilion"
          designHash="a3f9c21bc9912"
          schemaVersion="v0.1.0"
          reportTimestamp="2026-07-12T18:32:00Z"
          verdict="discharged"
        />
        <TitleBlock
          projectName="fleet (1)"
          designHash={null}
          schemaVersion={null}
          reportTimestamp={null}
          verdict={null}
        />
      </Section>

      <Section title="StatusLine">
        <StatusLine
          projectName="flagship-printer-a"
          serverState="connected"
          lastAction="build ok"
        />
        <StatusLine projectName={null} serverState="disconnected" lastAction={null} />
      </Section>

      <Section title="LogPane">
        <div style={{ height: '12rem', width: '100%' }}>
          <LogPane
            lines={[
              'starting build',
              'compiling hematite',
              'error: E0308 mismatched types',
              'done',
            ]}
          />
        </div>
      </Section>

      <Section title="ProgressRail">
        <ProgressRail
          step="compiling"
          percent={42}
          elapsedSeconds={95}
          onCancel={() => setPaused((p) => !p)}
        />
        <ProgressRail step="waiting for lock" percent={null} elapsedSeconds={3} />
        {paused ? <span className="gr-micro-label">cancel was clicked</span> : null}
      </Section>

      <Section title="EmptyState">
        <EmptyState title="No obligations recorded" detail="Nothing to show for this filter." />
      </Section>

      <Section title="ErrorState">
        <ErrorState
          title="Build failed"
          detail={'error[E0308]: mismatched types\n  --> src/main.rs:4:5'}
          onRetry={() => {}}
        />
      </Section>

      <Section title="DataTable">
        <div style={{ height: '16rem', width: '100%' }}>
          <DataTable
            columns={[
              {
                key: 'name',
                header: 'Name',
                accessor: (r: { name: string; value: number }) => r.name,
              },
              {
                key: 'value',
                header: 'Value',
                unit: 'mm',
                accessor: (r: { name: string; value: number }) => r.value,
              },
            ]}
            rows={[
              { name: 'alpha', value: 1 },
              { name: 'bravo', value: 2 },
            ]}
            rowKey={(r) => r.name}
          />
        </div>
        <div style={{ height: '8rem', width: '100%' }}>
          <DataTable
            columns={[{ key: 'name', header: 'Name', accessor: (r: { name: string }) => r.name }]}
            rows={[]}
            rowKey={(r) => r.name}
          />
        </div>
        <div style={{ height: '8rem', width: '100%' }}>
          <DataTable
            columns={[{ key: 'name', header: 'Name', accessor: (r: { name: string }) => r.name }]}
            rows={[]}
            rowKey={(r) => r.name}
            loading
          />
        </div>
      </Section>

      <Section title="ConfigField">
        <ConfigField
          label="ui.port"
          doc="Bind port for `graphite serve`."
          value="8765"
          source="default"
          isDefault
          onSave={() => Promise.resolve()}
          onReset={() => Promise.resolve()}
        />
        <ConfigField
          label="ui.host"
          doc="Bind host for `graphite serve` (must stay localhost, AD-31)."
          value="0.0.0.0"
          source="project"
          isDefault={false}
          onSave={() => Promise.resolve()}
          onReset={() => Promise.reject(new Error('unknown config key ui.hostx'))}
        />
      </Section>
    </div>
  );
}
