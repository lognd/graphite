// Route table (WO-G2 deliverable 3): the skeleton for every WO-G3..G6
// surface, plus the dev-only gallery. Route components are dynamically
// imported so the WASM doctrine's lazy-per-route loading (spec 02.7)
// applies uniformly once heavier views land.

import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './AppShell';
import { Dashboard } from '../routes/Dashboard';
import { Project } from '../routes/Project';
import { Obligations } from '../routes/Obligations';
import { ObligationExplorer } from '../routes/ObligationExplorer';
import { ClaimDetail } from '../routes/ClaimDetail';
import { Artifacts } from '../routes/Artifacts';
import { CalcBook } from '../routes/artifacts/CalcBook';
import { CalcSheetView } from '../routes/artifacts/CalcSheetView';
import { Drawings } from '../routes/artifacts/Drawings';
import { DrawingView } from '../routes/artifacts/DrawingView';
import { Model3D } from '../routes/artifacts/Model3D';
import { Bom } from '../routes/artifacts/Bom';
import { Boards } from '../routes/artifacts/Boards';
import { Runs } from '../routes/Runs';
import { Config } from '../routes/Config';
import { Doctor } from '../routes/Doctor';
import { Settings } from '../routes/Settings';

const children = [
  { index: true, element: <Dashboard /> },
  { path: 'project/:projectId', element: <Project /> },
  { path: 'project/:projectId/obligations', element: <ObligationExplorer /> },
  { path: 'project/:projectId/claim/:claimKey', element: <ClaimDetail /> },
  { path: 'obligations', element: <Obligations /> },
  { path: 'artifacts', element: <Artifacts /> },
  { path: 'artifacts/:projectId/calc', element: <CalcBook /> },
  { path: 'artifacts/:projectId/calc/:sheetId', element: <CalcSheetView /> },
  { path: 'artifacts/:projectId/drawings', element: <Drawings /> },
  { path: 'artifacts/:projectId/drawings/:name', element: <DrawingView /> },
  { path: 'artifacts/:projectId/model', element: <Model3D /> },
  { path: 'artifacts/:projectId/bom', element: <Bom /> },
  { path: 'artifacts/:projectId/boards', element: <Boards /> },
  { path: 'runs', element: <Runs /> },
  { path: 'config', element: <Config /> },
  { path: 'doctor', element: <Doctor /> },
  { path: 'settings', element: <Settings /> },
];

// The gallery is dev-only: never part of the shipped production route
// table (charter 3.1's zero-external-request rig has no reason to ship a
// component playground to end users).
if (import.meta.env.DEV) {
  const { Gallery } = await import('../routes/Gallery');
  children.push({ path: 'dev/gallery', element: <Gallery /> });
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children,
  },
]);
