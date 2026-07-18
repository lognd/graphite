// Claim detail (WO-G3 deliverable 4): answers "why did this claim
// defer/fail?" down to the evidence (charter 2.1). Claim source text,
// verdict + margin, inputs with provenance pins, the evidence hash
// chain (HashChips), a raw-JSON toggle, and prev/next through the
// project's obligation order. "Open calc sheet" links straight into
// WO-G4's calc-sheet viewer route (/artifacts/:projectId/calc/:sheetId,
// cross-wired at the WO-G3/WO-G4 merge); artifact bytes stay behind the
// content-hash endpoint (charter 3.2/04.1 detail-view floor).

import { Fragment, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCalcSheets, useObligations } from '../api/hooks';
import { DetailNav } from '../components/DetailNav/DetailNav';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { ErrorState } from '../components/ErrorState/ErrorState';
import { HashChip } from '../components/HashChip/HashChip';
import { MarginBar } from '../components/MarginBar/MarginBar';
import { ReasonCell } from '../components/ReasonCell/ReasonCell';
import { VerdictBadge } from '../components/VerdictBadge/VerdictBadge';
import { dispositionToVerdict } from '../components/VerdictBadge/verdict';
import { decodeClaimKey, encodeClaimKey } from '../lib/claimKey';
import { parseClaimLimit } from '../lib/claimLimit';

// frob:doc docs/guide.md#2-the-obligation-explorer-why-did-this-claim-deferfail
export function ClaimDetail() {
  const { projectId, claimKey } = useParams<{ projectId: string; claimKey: string }>();
  const [showRaw, setShowRaw] = useState(false);
  const obligations = useObligations(projectId);
  const sheets = useCalcSheets(projectId);

  const decoded = claimKey ? decodeClaimKey(claimKey) : null;

  const rows = obligations.data?.rows ?? [];
  const index = decoded
    ? rows.findIndex(
        (r) => r.claim_name === decoded.claimName && r.subject_anchor === decoded.subjectAnchor,
      )
    : -1;
  const row = index >= 0 ? rows[index] : undefined;
  const prev = index > 0 ? rows[index - 1] : undefined;
  const next = index >= 0 && index < rows.length - 1 ? rows[index + 1] : undefined;

  const sheet = useMemo(() => {
    if (!decoded) return undefined;
    return (sheets.data ?? []).find(
      (s) => s.sheet_id === `${decoded.claimName}::${decoded.subjectAnchor}`,
    );
  }, [sheets.data, decoded]);

  if (obligations.isError) {
    return (
      <ErrorState
        title={`Could not load claims for ${projectId}`}
        detail={String(obligations.error)}
        onRetry={() => obligations.refetch()}
      />
    );
  }

  if (!decoded || (!obligations.isLoading && !row)) {
    return (
      <EmptyState
        title="No such claim"
        detail="This claim key does not match any obligation in the project's current audit index."
      />
    );
  }

  if (!row) {
    return <p role="status">loading claim...</p>;
  }

  const limit = sheet ? parseClaimLimit(sheet.claim_text) : null;

  return (
    <div className="gr-claim-detail">
      <DetailNav
        prevTo={
          prev
            ? `/project/${encodeURIComponent(projectId ?? '')}/claim/${encodeClaimKey(prev)}`
            : null
        }
        nextTo={
          next
            ? `/project/${encodeURIComponent(projectId ?? '')}/claim/${encodeClaimKey(next)}`
            : null
        }
        index={index}
        total={rows.length}
      />

      <h1>{row.claim_name}</h1>
      <VerdictBadge verdict={dispositionToVerdict(row.disposition)} />
      <ReasonCell reason={row.detail || null} />

      {sheet ? (
        <>
          <section aria-label="claim source">
            <h2 className="gr-micro-label">claim</h2>
            <pre>{sheet.claim_text}</pre>
          </section>

          <section aria-label="margin">
            <h2 className="gr-micro-label">margin</h2>
            {limit ? (
              <MarginBar
                value={Number(sheet.value)}
                limit={limit.limit}
                unit={limit.unit}
                label="margin"
              />
            ) : (
              <p>
                value {sheet.value} / margin {sheet.margin} (limit not a bare literal in the claim
                text)
              </p>
            )}
          </section>

          <section aria-label="inputs">
            <h2 className="gr-micro-label">inputs</h2>
            {sheet.inputs.length === 0 ? (
              <EmptyState
                title="No declared inputs"
                detail="This claim's model took no named inputs."
              />
            ) : (
              <table className="gr-data-table__table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Value</th>
                    <th>Provenance</th>
                    <th>Source</th>
                    <th>Pin</th>
                  </tr>
                </thead>
                <tbody>
                  {sheet.inputs.map((input) => (
                    <tr key={input.name}>
                      <td>{input.name}</td>
                      <td>{input.value}</td>
                      <td>{input.provenance}</td>
                      <td>{input.source}</td>
                      <td>{input.pin ? <HashChip full={input.pin} /> : '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section aria-label="evidence hash chain">
            <h2 className="gr-micro-label">evidence chain</h2>
            <dl className="gr-claim-detail__chain">
              <dt>evidence hash</dt>
              <dd>
                <HashChip full={sheet.chain.evidence_hash} />
              </dd>
              <dt>sheet digest</dt>
              <dd>
                <HashChip full={sheet.chain.sheet_digest} />
              </dd>
              {sheet.chain.record_pins.map(([key, pin]) => (
                <Fragment key={key}>
                  <dt>{key}</dt>
                  <dd>
                    <HashChip full={pin} />
                  </dd>
                </Fragment>
              ))}
            </dl>
          </section>

          <section aria-label="model">
            <h2 className="gr-micro-label">model</h2>
            <p>
              {sheet.model_id} v{sheet.model_version} via {sheet.solver} ({sheet.tier},{' '}
              {sheet.attestation})
            </p>
          </section>

          <p>
            <Link
              to={`/artifacts/${encodeURIComponent(projectId ?? '')}/calc/${encodeURIComponent(
                sheet.sheet_id,
              )}`}
            >
              open calc sheet
            </Link>
          </p>
        </>
      ) : (
        <EmptyState
          title="No calc sheet for this claim"
          detail="This obligation was discharged by waiver/acceptance, not a calc sheet -- see the reason above."
        />
      )}

      <button type="button" onClick={() => setShowRaw((v) => !v)}>
        {showRaw ? 'hide raw JSON' : 'show raw JSON'}
      </button>
      {showRaw ? <pre>{JSON.stringify({ row, sheet }, null, 2)}</pre> : null}
    </div>
  );
}
