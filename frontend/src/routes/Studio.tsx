// Scan-trace studio substrate (WO-G11, lithos D259/D261): upload a
// scan, calibrate it (rung A "scale" or rung B "homography"), then run
// the full grid-capture UI so every trace -- even one fitted only to
// rung B -- carries the observations a later rung-C re-calibration
// (WO-G14, v1.1) can reuse without re-tracing. This route builds ONLY
// the substrate: it does not draw traced geometry and it writes no
// `.rgp`/`.hema` source (WO-G12's seam) -- the one write here is the
// scan upload itself (D253/D259: brand-new bytes, never an edit).

import { useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { ScanEntry } from '../api/client';
import {
  calibrationDiagnostics,
  fitCalibration,
  type CalibrationResult,
  type CalibrationRung,
  type CaptureKind,
  type ImagePoint,
  type PitchBasis,
  type ReferencePoint,
  CalibrationError,
} from '../lib/calibration';
import { confirmObservation, projectGrid, type GridObservation, type GridSpec } from '../lib/grid';
import { PanZoomFrame } from '../components/PanZoomFrame/PanZoomFrame';
import { PageTitle } from '../components/PageTitle/PageTitle';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { HashChip } from '../components/HashChip/HashChip';
import './Studio.css';

type Step = 'upload' | 'calibrate-points' | 'grid-capture' | 'ready';

interface DraftPoint {
  image: ImagePoint;
  distanceMm: string;
  x: string;
  y: string;
}

function emptyPoint(): DraftPoint {
  return { image: { u: 0, v: 0 }, distanceMm: '', x: '', y: '' };
}

export function Studio() {
  const { projectId } = useParams<{ projectId: string }>();
  const [scan, setScan] = useState<ScanEntry | null>(null);
  const [scanUrl, setScanUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [captureKind, setCaptureKind] = useState<CaptureKind>('flatbed_scan');
  const [pitchBasis, setPitchBasis] = useState<PitchBasis | null>(null);

  const [rung, setRung] = useState<CalibrationRung>('scale');
  const [points, setPoints] = useState<DraftPoint[]>([emptyPoint(), emptyPoint()]);
  const [calibration, setCalibration] = useState<CalibrationResult | null>(null);
  const [calibrationError, setCalibrationError] = useState<string | null>(null);
  const [declaredAccuracyMm, setDeclaredAccuracyMm] = useState<string>('');

  const [gridCorners, setGridCorners] = useState<ImagePoint[]>([]);
  const [pitchMm, setPitchMm] = useState<string>('');
  const [countU, setCountU] = useState<string>('2');
  const [countV, setCountV] = useState<string>('2');
  const [observations, setObservations] = useState<GridObservation[]>([]);
  const [dragTarget, setDragTarget] = useState<[number, number] | null>(null);

  const step: Step = !scan
    ? 'upload'
    : !calibration
      ? 'calibrate-points'
      : observations.length === 0
        ? 'grid-capture'
        : 'ready';

  async function onUpload(file: File) {
    setUploadError(null);
    if (!projectId) return;
    try {
      const name = file.name.replace(/\.[^.]+$/, '').replace(/[^A-Za-z0-9_-]/g, '_');
      const entry = await api.uploadScan(projectId, name, file);
      setScan(entry);
      setScanUrl(URL.createObjectURL(file));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'upload failed');
    }
  }

  function updatePoint(i: number, patch: Partial<DraftPoint>) {
    setPoints((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  function addPoint() {
    setPoints((prev) => [...prev, emptyPoint()]);
  }

  function placeAt(i: number, e: ReactMouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const u = e.clientX - rect.left;
    const v = e.clientY - rect.top;
    updatePoint(i, { image: { u, v } });
  }

  function referencePoints(): ReferencePoint[] | null {
    const refs: ReferencePoint[] = [];
    for (const p of points) {
      const x = Number(p.x);
      const y = Number(p.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      refs.push({ image: p.image, object: { x, y } });
    }
    return refs;
  }

  function runCalibration() {
    setCalibrationError(null);
    const refs = referencePoints();
    if (!refs) {
      setCalibrationError('every reference point needs a numeric object-plane x and y (mm)');
      return;
    }
    try {
      const result = fitCalibration(rung, refs);
      setCalibration(result);
      setDeclaredAccuracyMm(String(result.accuracyBoundMm));
    } catch (err) {
      if (err instanceof CalibrationError) {
        setCalibrationError(`${err.kind}: ${err.message}`);
      } else {
        setCalibrationError(err instanceof Error ? err.message : 'calibration failed');
      }
    }
  }

  function placeCorner(e: ReactMouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = { u: e.clientX - rect.left, v: e.clientY - rect.top };
    // Armed drag-confirm takes priority: a double-click on a
    // mispredicted grid point arms it (setDragTarget), and the next
    // click anywhere on the underlay is the human's confirmed
    // correction -- the D250/WO-134B drag-and-confirm gesture.
    if (dragTarget) {
      setObservations((prev) => confirmObservation(prev, dragTarget, pos));
      setDragTarget(null);
      return;
    }
    if (gridCorners.length >= 4) return;
    setGridCorners((prev) => [...prev, pos]);
  }

  function buildGrid() {
    if (gridCorners.length !== 4) return;
    const n = Number(countU);
    const m = Number(countV);
    if (!Number.isInteger(n) || !Number.isInteger(m) || n < 2 || m < 2) return;
    const spec: GridSpec = {
      corners: {
        topLeft: gridCorners[0],
        topRight: gridCorners[1],
        bottomRight: gridCorners[2],
        bottomLeft: gridCorners[3],
      },
      countU: n,
      countV: m,
    };
    setObservations(projectGrid(spec));
  }

  function confirmInPlace(i: number, j: number) {
    setObservations((prev) =>
      prev.map((o) =>
        o.gridIndex[0] === i && o.gridIndex[1] === j ? { ...o, isConfirmed: true } : o,
      ),
    );
  }

  const diagnostics = useMemo(() => {
    if (!calibration) return [];
    const declared = Number(declaredAccuracyMm);
    if (!Number.isFinite(declared)) return [];
    return calibrationDiagnostics({
      captureKind,
      rung,
      declaredAccuracyBoundMm: declared,
      residualMaxMm: calibration.residuals.maxMm,
    });
  }, [calibration, captureKind, rung, declaredAccuracyMm]);

  const allConfirmed = observations.length > 0 && observations.every((o) => o.isConfirmed);
  const exportReady = Boolean(calibration) && Boolean(pitchBasis) && diagnostics.length === 0;

  if (!projectId) {
    return <EmptyState title="no project selected" />;
  }

  return (
    <div className="gr-studio">
      <PageTitle text="scan-trace studio" />
      <h2 className="gr-studio__title">scan-trace studio -- {projectId}</h2>
      <p className="gr-micro-label" data-testid="studio-step">
        step: {step}
      </p>

      <section aria-label="scan upload" className="gr-studio__section">
        <h3>1. import a scan</h3>
        {!scan ? (
          <>
            <label>
              capture kind
              <select
                value={captureKind}
                onChange={(e) => setCaptureKind(e.target.value as CaptureKind)}
              >
                <option value="flatbed_scan">flatbed scan</option>
                <option value="photo">photo</option>
                <option value="drawing_scan">drawing scan</option>
              </select>
            </label>
            <input
              type="file"
              accept="image/png,image/jpeg"
              aria-label="upload scan image"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onUpload(file);
              }}
            />
            {uploadError ? <p role="alert">{uploadError}</p> : null}
          </>
        ) : (
          <p data-testid="scan-hash">
            uploaded: {scan.relpath} -- <HashChip full={scan.content_hash} />
          </p>
        )}
      </section>

      {scan ? (
        <section aria-label="calibration" className="gr-studio__section">
          <h3>2. calibrate (rung A/B)</h3>
          <label>
            rung
            <select value={rung} onChange={(e) => setRung(e.target.value as CalibrationRung)}>
              <option value="scale">A -- scale (2+ points, similarity)</option>
              <option value="homography">B -- homography (4+ points, planar target)</option>
            </select>
          </label>
          <label>
            pitch basis
            <select
              value={pitchBasis ?? ''}
              onChange={(e) => setPitchBasis((e.target.value || null) as PitchBasis | null)}
            >
              <option value="">-- declare how the pitch/scale is known --</option>
              <option value="measured">measured</option>
              <option value="certified">certified</option>
              <option value="printed">printed</option>
            </select>
          </label>

          <PanZoomFrame ariaLabel="scan underlay for calibration">
            <svg
              role="img"
              aria-label="calibration point placement surface"
              width={640}
              height={480}
              className="gr-studio__underlay"
              style={scanUrl ? { backgroundImage: `url(${scanUrl})` } : undefined}
            >
              {points.map((p, i) => (
                <circle key={i} cx={p.image.u} cy={p.image.v} r={4} fill="orange" />
              ))}
            </svg>
          </PanZoomFrame>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>image (u, v)</th>
                <th>place</th>
                <th>object x (mm)</th>
                <th>object y (mm)</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>
                    {p.image.u.toFixed(1)}, {p.image.v.toFixed(1)}
                  </td>
                  <td>
                    <svg
                      width={24}
                      height={24}
                      role="button"
                      aria-label={`place reference point ${i + 1}`}
                      onClick={(e) => placeAt(i, e)}
                      className="gr-studio__place-target"
                    />
                  </td>
                  <td>
                    <input
                      aria-label={`object x for point ${i + 1}`}
                      value={p.x}
                      onChange={(e) => updatePoint(i, { x: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      aria-label={`object y for point ${i + 1}`}
                      value={p.y}
                      onChange={(e) => updatePoint(i, { y: e.target.value })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={addPoint}>
            add reference point
          </button>
          <button type="button" onClick={runCalibration}>
            fit calibration
          </button>
          {calibrationError ? <p role="alert">{calibrationError}</p> : null}

          {calibration ? (
            <div data-testid="calibration-result">
              <p>rung: {calibration.transform.rung}</p>
              {calibration.transform.rung === 'scale' ? (
                <p>mm/px: {calibration.transform.mmPerPx.toFixed(4)}</p>
              ) : null}
              <p data-testid="residual-rms">
                residual rms: {calibration.residuals.rmsMm.toFixed(4)} mm
              </p>
              <p data-testid="residual-max">
                residual max: {calibration.residuals.maxMm.toFixed(4)} mm
              </p>
              <label>
                declared accuracy_bound_mm
                <input
                  aria-label="declared accuracy bound mm"
                  value={declaredAccuracyMm}
                  onChange={(e) => setDeclaredAccuracyMm(e.target.value)}
                />
              </label>
              {diagnostics.map((d) => (
                <p key={d.code} role="alert" data-testid={`diagnostic-${d.code}`}>
                  {d.message}
                </p>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {calibration ? (
        <section aria-label="grid capture" className="gr-studio__section">
          <h3>3. grid capture (recorded at every rung)</h3>
          <p>
            click the grid's 4 outer corners in order: top-left, top-right, bottom-right,
            bottom-left.
          </p>
          <PanZoomFrame ariaLabel="scan underlay for grid capture">
            <svg
              role="img"
              aria-label="grid corner placement surface"
              width={640}
              height={480}
              onClick={placeCorner}
              className="gr-studio__underlay"
              style={scanUrl ? { backgroundImage: `url(${scanUrl})` } : undefined}
            >
              {gridCorners.map((c, i) => (
                <circle key={i} cx={c.u} cy={c.v} r={4} fill="lime" />
              ))}
              {observations.map((o) => (
                <circle
                  key={`${o.gridIndex[0]}-${o.gridIndex[1]}`}
                  data-testid={`grid-point-${o.gridIndex[0]}-${o.gridIndex[1]}`}
                  cx={o.confirmed.u}
                  cy={o.confirmed.v}
                  r={3}
                  fill={o.isConfirmed ? 'cyan' : 'yellow'}
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmInPlace(o.gridIndex[0], o.gridIndex[1]);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setDragTarget(o.gridIndex);
                  }}
                />
              ))}
            </svg>
          </PanZoomFrame>
          <label>
            pitch (mm)
            <input
              aria-label="grid pitch mm"
              value={pitchMm}
              onChange={(e) => setPitchMm(e.target.value)}
            />
          </label>
          <label>
            count U
            <input
              aria-label="grid count u"
              value={countU}
              onChange={(e) => setCountU(e.target.value)}
            />
          </label>
          <label>
            count V
            <input
              aria-label="grid count v"
              value={countV}
              onChange={(e) => setCountV(e.target.value)}
            />
          </label>
          <button type="button" onClick={buildGrid} disabled={gridCorners.length !== 4}>
            project grid intersections
          </button>
          <p data-testid="grid-confirm-state">
            {observations.length === 0
              ? 'no grid projected yet'
              : allConfirmed
                ? 'all grid points confirmed'
                : `${observations.filter((o) => o.isConfirmed).length}/${observations.length} confirmed`}
          </p>
        </section>
      ) : null}

      <section aria-label="export" className="gr-studio__section">
        <h3>4. export</h3>
        <button type="button" data-testid="export-button" disabled={!exportReady}>
          {exportReady
            ? 'export .rgp + .hema snippet (WO-G12)'
            : 'export disabled -- calibration incomplete'}
        </button>
        {!exportReady ? (
          <p data-testid="export-refused-reason">
            export refused: complete calibration, declare pitch_basis, and resolve any honesty
            diagnostics before export.
          </p>
        ) : null}
      </section>
    </div>
  );
}
