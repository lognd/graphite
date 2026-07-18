// The persistent bottom status bar (spec 03.3, vim/tmux lineage): current
// project, server state, last action, live progress, keyboard hint.

import './StatusLine.css';

// frob:doc docs/guide.md#107-statusline
export interface StatusLineProps {
  projectName: string | null;
  serverState: 'connected' | 'connecting' | 'disconnected';
  lastAction: string | null;
  keyboardHint?: string;
}

const SERVER_LABEL: Record<StatusLineProps['serverState'], string> = {
  connected: 'CONNECTED',
  connecting: 'CONNECTING',
  disconnected: 'DISCONNECTED',
};

// frob:doc docs/guide.md#107-statusline
export function StatusLine({
  projectName,
  serverState,
  lastAction,
  keyboardHint = '? for shortcuts',
}: StatusLineProps) {
  return (
    <div className="gr-status-line" role="status">
      <span className="gr-status-line__project">{projectName ?? 'no project'}</span>
      <span className={`gr-status-line__server gr-status-line__server--${serverState}`}>
        {SERVER_LABEL[serverState]}
      </span>
      <span className="gr-status-line__action">{lastAction ?? 'idle'}</span>
      <span className="gr-status-line__hint">{keyboardHint}</span>
    </div>
  );
}
