// The app shell (WO-G2 deliverable 3): title block, left nav, routed
// content, status line, ctrl+k command palette, ? shortcut sheet, theme
// switch. Every WO-G3..G6 route mounts inside <Outlet />.

import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Nav } from './Nav';
import { useTheme } from './theme';
import { useRunContext } from './RunContext';
import { useCancelRun, useProjects } from '../api/hooks';
import { TitleBlock } from '../components/TitleBlock/TitleBlock';
import { StatusLine } from '../components/StatusLine/StatusLine';
import { ProgressRail } from '../components/ProgressRail/ProgressRail';
import { CommandPalette } from '../components/CommandPalette/CommandPalette';
import type { Command } from '../components/CommandPalette/CommandPalette';
import { ShortcutSheet } from '../components/ShortcutSheet/ShortcutSheet';
import './AppShell.css';

const SHORTCUTS = [
  { keys: 'ctrl+k', description: 'open the command palette' },
  { keys: '?', description: 'open this shortcut sheet' },
  { keys: 'j / k', description: 'move down / up a list or table row' },
  { keys: 'esc', description: 'close the open dialog' },
];

export function AppShell() {
  const navigate = useNavigate();
  const { preference, resolved, setPreference } = useTheme();
  const { data: projects, isError: projectsError } = useProjects();
  const { activeRun } = useRunContext();
  const cancelRun = useCancelRun();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing = target && ['INPUT', 'TEXTAREA'].includes(target.tagName);
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      } else if (e.key === '?' && !typing) {
        setShortcutsOpen(true);
      } else if (e.key === 'Escape') {
        setPaletteOpen(false);
        setShortcutsOpen(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const commands: Command[] = [
    { id: 'dashboard', label: 'go to dashboard', run: () => navigate('/') },
    { id: 'obligations', label: 'go to obligations', run: () => navigate('/obligations') },
    { id: 'artifacts', label: 'go to artifacts', run: () => navigate('/artifacts') },
    { id: 'runs', label: 'go to runs', run: () => navigate('/runs') },
    { id: 'config', label: 'go to config', run: () => navigate('/config') },
    {
      id: 'theme',
      label: `switch to ${resolved === 'dark' ? 'light' : 'dark'} theme`,
      run: () => setPreference(resolved === 'dark' ? 'light' : 'dark'),
    },
    {
      id: 'theme-system',
      label: 'follow OS theme',
      run: () => setPreference('system'),
    },
  ];

  return (
    <div className="gr-app-shell">
      <header className="gr-app-shell__header">
        {/* Fleet-level view: per-report fields (design hash, schema,
            timestamp, verdict) belong to a single project's report and
            render as honest placeholders here; project routes (WO-G3/G4)
            source them from /api/projects/{p}/health + build-report. */}
        <TitleBlock
          projectName={
            projects && projects.length > 0 ? `fleet (${projects.length})` : 'no projects'
          }
          designHash={null}
          schemaVersion={null}
          reportTimestamp={null}
          verdict={null}
        />
      </header>
      <div className="gr-app-shell__body">
        <Nav />
        <main className="gr-app-shell__content">
          <Outlet />
        </main>
      </div>
      <footer className="gr-app-shell__footer">
        {activeRun && activeRun.status === 'running' ? (
          <ProgressRail
            step={`${activeRun.verb} ${activeRun.project} -- ${activeRun.phase ?? 'starting'}`}
            percent={
              activeRun.done !== null && activeRun.total !== null && activeRun.total > 0
                ? Math.round((activeRun.done / activeRun.total) * 100)
                : null
            }
            elapsedSeconds={activeRun.elapsedSeconds}
            onCancel={() => cancelRun.mutate(activeRun.runId)}
          />
        ) : null}
        <StatusLine
          projectName={projects && projects.length > 0 ? `fleet (${projects.length})` : null}
          serverState={projectsError ? 'disconnected' : projects ? 'connected' : 'connecting'}
          lastAction={
            activeRun ? `${activeRun.verb} (${activeRun.status}) on ${activeRun.project}` : null
          }
          keyboardHint={`theme: ${preference} | ? for shortcuts`}
        />
      </footer>
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={commands}
      />
      <ShortcutSheet
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        shortcuts={SHORTCUTS}
      />
    </div>
  );
}
