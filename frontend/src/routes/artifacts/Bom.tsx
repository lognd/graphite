// BOM/cost/schedule view (WO-G4 deliverable 4): renders the staged build
// report's cost/frame fields VERBATIM (charter sec. 3.2 -- graphite never
// recomputes a cost total itself). The timber_pavilion fixture is civil:
// it carries `frame_lock_rows` (section picks) and `cost_estimates`
// (profile -> evidence hash pairs) but no per-part mass/cost line-item
// table -- that richer BOM shape belongs to a mech/cuprite fixture this
// project does not have (documented honestly rather than fabricated).

import { useParams } from 'react-router-dom';
import { useBuildReport } from '../../api/hooks';
import { DataTable } from '../../components/DataTable/DataTable';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ErrorState } from '../../components/ErrorState/ErrorState';
import { HashChip } from '../../components/HashChip/HashChip';
import { ReasonCell } from '../../components/ReasonCell/ReasonCell';
import { PageTitle } from '../../components/PageTitle/PageTitle';
import './artifacts.css';

// frob:doc docs/guide.md#3-the-calc-book-walk-show-me-the-artifact
export function Bom() {
  const { projectId } = useParams<{ projectId: string }>();
  const report = useBuildReport(projectId);

  if (report.isError) {
    return (
      <ErrorState
        title="Could not load the build report"
        detail={String(report.error)}
        onRetry={() => report.refetch()}
      />
    );
  }
  if (report.isLoading) return <p role="status">loading BOM/cost/schedule...</p>;

  const final = report.data?.final;
  if (!final) {
    return (
      <EmptyState
        title="No build report shipped for this project"
        detail="Run `regolith build` to produce .regolith/build/build_report.json."
      />
    );
  }

  const lockRows = final.frame_lock_rows;
  const costEstimates = final.cost_estimates;

  return (
    <div className="gr-bom">
      <PageTitle text="BOM / cost / schedule" />
      <p className="gr-micro-label">
        cost profile: {final.cost_profile ?? '--'} -- {costEstimates.length} cost estimate(s)
      </p>

      <h2 className="gr-section-title">Cost estimates (profile -&gt; evidence hash)</h2>
      {costEstimates.length === 0 ? (
        <EmptyState
          title="No cost estimates in this build report"
          detail="This pipeline stage produced none -- not a rendering omission."
        />
      ) : (
        <DataTable
          columns={[
            { key: 'profile', header: 'Profile', accessor: ([p]) => p },
            {
              key: 'hash',
              header: 'Evidence hash',
              accessor: ([, h]) => h,
              render: ([, h]) => <HashChip full={h} />,
            },
          ]}
          rows={costEstimates}
          rowKey={([p, h]) => `${p}:${h}`}
          emptyTitle="No cost estimates"
        />
      )}

      <h2 className="gr-section-title">Frame/section lock rows (schedule)</h2>
      {lockRows.length === 0 ? (
        <EmptyState
          title="No frame lock rows in this build report"
          detail="This project's realized domains produced none -- not a rendering omission."
        />
      ) : (
        <DataTable
          columns={[
            { key: 'slot', header: 'Slot', accessor: (r) => r.slot },
            { key: 'value', header: 'Value', accessor: (r) => r.value },
            {
              key: 'cause',
              header: 'Cause',
              accessor: (r) => r.cause,
              render: (r) => <ReasonCell reason={r.cause || null} />,
            },
            {
              key: 'policy',
              header: 'Policy note',
              accessor: (r) => r.policy_note ?? null,
              render: (r) => <ReasonCell reason={r.policy_note ?? null} />,
            },
          ]}
          rows={lockRows}
          rowKey={(r) => r.slot}
          emptyTitle="No lock rows"
        />
      )}
    </div>
  );
}
