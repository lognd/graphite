// Project view (WO-G3 deliverable 2): census header, shipped family
// presence, lockfile optimize rows (winner + cause), the waiver/memo
// panel (accepted deviations with memo links + basis text), and the
// release gate summary. The flagship obligation table lives at its own
// route (ObligationExplorer, deliverable 3) -- this view links to it
// rather than duplicating it (dedup law 04.2).

import { Link, useParams } from 'react-router-dom';
import {
  useAcceptanceLedger,
  useGateSummary,
  useLockfile,
  useManifest,
  useProjectArtifacts,
  useProjectHealth,
} from '../api/hooks';
import { DataTable } from '../components/DataTable/DataTable';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { ErrorState } from '../components/ErrorState/ErrorState';
import { HashChip } from '../components/HashChip/HashChip';
import { PageTitle } from '../components/PageTitle/PageTitle';
import { TitleBlock } from '../components/TitleBlock/TitleBlock';
import { VerdictBadge } from '../components/VerdictBadge/VerdictBadge';
import { optimizeWinnerRows } from '../lib/optimizeRows';

function familyOf(relpath: string): string {
  const slash = relpath.indexOf('/');
  return slash === -1 ? '(root)' : relpath.slice(0, slash);
}

// dist/ family directory -> its WO-G4 viewer route segment, where one
// exists (calc book, drawings); other families (root files, future
// dirs) fall through to the artifacts hub, which lists every viewer.
const FAMILY_VIEWER_SEGMENT: Record<string, string> = {
  calc: 'calc',
  drawings: 'drawings',
};

function familyLink(projectId: string, fam: string): string {
  const segment = FAMILY_VIEWER_SEGMENT[fam];
  return segment
    ? `/artifacts/${encodeURIComponent(projectId)}/${segment}`
    : `/artifacts?project=${encodeURIComponent(projectId)}`;
}

// frob:doc docs/guide.md#1-reading-the-dashboard-is-my-fleet-healthy
export function Project() {
  const { projectId } = useParams<{ projectId: string }>();
  const health = useProjectHealth(projectId);
  const manifest = useManifest(projectId);
  const artifacts = useProjectArtifacts(projectId);
  const lockfile = useLockfile(projectId);
  const ledger = useAcceptanceLedger(projectId);
  const gate = useGateSummary(projectId);

  if (!projectId) {
    return <EmptyState title="No project selected" />;
  }

  if (health.isError) {
    return (
      <ErrorState
        title={`Could not load ${projectId}`}
        detail={String(health.error)}
        onRetry={() => health.refetch()}
      />
    );
  }

  const summary = health.data?.obligation_summary;
  const verdict = health.data ? (health.data.release_ok ? 'discharged' : 'violated') : null;

  const families = new Map<string, number>();
  for (const entry of artifacts.data ?? []) {
    const fam = familyOf(entry.relpath);
    families.set(fam, (families.get(fam) ?? 0) + 1);
  }

  const optimizeRows = optimizeWinnerRows(lockfile.data);

  return (
    <div className="gr-project">
      <PageTitle text={`Project: ${projectId}`} />
      <TitleBlock
        projectName={projectId}
        designHash={manifest.data?.design_hash ?? null}
        schemaVersion={null}
        reportTimestamp={null}
        verdict={verdict}
      />

      <p>
        <Link to={`/project/${encodeURIComponent(projectId)}/studio`}>scan-trace studio</Link>
      </p>

      {health.isLoading ? (
        <p role="status">loading census...</p>
      ) : summary ? (
        <p className="gr-micro-label">
          release {health.data?.release_ok ? 'OK' : 'BLOCKED'} -- {summary.obligations} obligations:{' '}
          <Link to={`/project/${encodeURIComponent(projectId)}/obligations?filter=calc_sheet`}>
            {summary.discharged} discharged
          </Link>
          ,{' '}
          <Link
            to={`/project/${encodeURIComponent(projectId)}/obligations?filter=accepted_deviation`}
          >
            {/* accepted_rows: the linked drill-down lists ROWS (D221.2 row
                partition); the unique-deviation census count rides along so
                neither denominator is ever confused. */}
            {summary.accepted_rows} accepted
          </Link>
          {summary.accepted_rows !== summary.accepted_deviation
            ? ` (${summary.accepted_deviation} unique)`
            : ''}
          ,{' '}
          <Link to={`/project/${encodeURIComponent(projectId)}/obligations?filter=deferred`}>
            {summary.deferred} deferred
          </Link>
          ,{' '}
          <Link to={`/project/${encodeURIComponent(projectId)}/obligations?filter=violated`}>
            {summary.violated} violated
          </Link>
          .{' '}
          <Link to={`/project/${encodeURIComponent(projectId)}/obligations`}>
            Open the obligation explorer.
          </Link>
        </p>
      ) : (
        <EmptyState
          title="No obligations recorded for this project"
          detail="Build the project (regolith build) to produce an audit index."
        />
      )}

      <section aria-label="shipped families">
        <h2 className="gr-micro-label">shipped families</h2>
        {artifacts.isLoading ? (
          <p role="status">loading artifacts...</p>
        ) : families.size === 0 ? (
          <EmptyState
            title="No shipped artifacts yet"
            detail="Run regolith ship to populate dist/."
          />
        ) : (
          <ul className="gr-family-list">
            {[...families.entries()].sort().map(([fam, count]) => (
              <li key={fam}>
                <Link to={familyLink(projectId, fam)}>{fam}</Link>{' '}
                <span className="gr-micro-label">({count})</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="lockfile optimize rows">
        <h2 className="gr-micro-label">optimize winners</h2>
        {lockfile.isError ? (
          <EmptyState
            title="No lockfile yet"
            detail="A build with an optimize() slot writes regolith.lock."
          />
        ) : (
          <DataTable
            columns={[
              { key: 'section', header: 'Section', accessor: (r) => r.section },
              { key: 'slot', header: 'Slot', accessor: (r) => r.slot },
              { key: 'winner', header: 'Winner', accessor: (r) => r.value },
              { key: 'cause', header: 'Cause', accessor: (r) => r.cause },
            ]}
            rows={optimizeRows}
            rowKey={(r) => `${r.section}:${r.slot}`}
            loading={lockfile.isLoading}
            emptyTitle="No optimize() slots in this lockfile"
          />
        )}
      </section>

      <section aria-label="waiver and memo panel">
        <h2 className="gr-micro-label">accepted deviations</h2>
        {ledger.isError ? (
          <EmptyState
            title="No acceptance ledger yet"
            detail="A release build with an accepted deviation writes acceptance_ledger.json."
          />
        ) : (
          <DataTable
            columns={[
              { key: 'target', header: 'Target', accessor: (d) => d.target },
              { key: 'basis', header: 'Basis', accessor: (d) => d.basis },
              {
                key: 'memo',
                header: 'Memo',
                accessor: (d) => d.evidence,
                render: (d) => (
                  <>
                    {d.evidence ?? '--'}
                    {d.evidence_digest ? <HashChip full={d.evidence_digest} /> : null}
                  </>
                ),
              },
              { key: 'expires', header: 'Expires', accessor: (d) => d.expires },
            ]}
            rows={[...(ledger.data?.accepted_deviations ?? [])]}
            rowKey={(d) => `${d.target}:${d.evidence_digest ?? ''}`}
            loading={ledger.isLoading}
            emptyTitle="No accepted deviations for this project"
          />
        )}
      </section>

      <section aria-label="release gate summary">
        <h2 className="gr-micro-label">release gate</h2>
        {gate.isError ? (
          <EmptyState
            title="No gate summary yet"
            detail="A release build writes gate_summary.json."
          />
        ) : gate.isLoading ? (
          <p role="status">loading gate summary...</p>
        ) : gate.data ? (
          <p>
            tier {gate.data.tier} --{' '}
            <VerdictBadge verdict={gate.data.release_ok ? 'discharged' : 'violated'} />
            {' -- '}
            violated {gate.data.counts.violated}, indeterminate {gate.data.counts.indeterminate},
            below trust floor {gate.data.counts.below_trust_floor}, accepted deviation{' '}
            {gate.data.counts.accepted_deviation}
            {gate.data.counts.ledger_blocked ? ', LEDGER BLOCKED' : ''}
          </p>
        ) : null}
      </section>
    </div>
  );
}
