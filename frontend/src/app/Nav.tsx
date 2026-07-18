// Left project nav (spec 03/WO-G2 deliverable 3): the projects tree plus
// the fixed top-level route list every WO-G3..G6 surface hangs off.

import { NavLink } from 'react-router-dom';
import { useProjects } from '../api/hooks';
import './Nav.css';

const ROUTES = [
  { path: '/', label: 'dashboard' },
  { path: '/obligations', label: 'obligations' },
  { path: '/artifacts', label: 'artifacts' },
  { path: '/runs', label: 'runs' },
  { path: '/config', label: 'config' },
  { path: '/doctor', label: 'doctor' },
  { path: '/settings', label: 'settings' },
];

// frob:doc docs/guide.md#1018-app-shell
export function Nav() {
  const { data: projects } = useProjects();

  return (
    <nav className="gr-nav" aria-label="primary">
      <div className="gr-nav__section">
        <span className="gr-micro-label">views</span>
        <ul className="gr-nav__list">
          {ROUTES.map((r) => (
            <li key={r.path}>
              <NavLink
                to={r.path}
                className={({ isActive }) =>
                  `gr-nav__link${isActive ? ' gr-nav__link--active' : ''}`
                }
                end={r.path === '/'}
              >
                {r.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
      <div className="gr-nav__section">
        <span className="gr-micro-label">projects</span>
        <ul className="gr-nav__list">
          {(projects ?? []).map((p) => (
            <li key={p.name}>
              <NavLink
                to={`/project/${encodeURIComponent(p.name)}`}
                className={({ isActive }) =>
                  `gr-nav__link${isActive ? ' gr-nav__link--active' : ''}`
                }
              >
                {p.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
