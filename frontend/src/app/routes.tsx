// Route table (WO-G2 deliverable 3): the skeleton for every WO-G3..G6
// surface, plus the dev-only gallery. Route components are dynamically
// imported so the WASM doctrine's lazy-per-route loading (spec 02.7)
// applies uniformly once heavier views land.

import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './AppShell';
import { Dashboard } from '../routes/Dashboard';
import { Project } from '../routes/Project';
import { Obligations } from '../routes/Obligations';
import { Artifacts } from '../routes/Artifacts';
import { Runs } from '../routes/Runs';
import { Config } from '../routes/Config';

const children = [
  { index: true, element: <Dashboard /> },
  { path: 'project/:projectId', element: <Project /> },
  { path: 'obligations', element: <Obligations /> },
  { path: 'artifacts', element: <Artifacts /> },
  { path: 'runs', element: <Runs /> },
  { path: 'config', element: <Config /> },
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
