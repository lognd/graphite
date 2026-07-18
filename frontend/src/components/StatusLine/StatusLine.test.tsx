import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusLine } from './StatusLine';

describe('StatusLine', () => {
  // frob:tests frontend/src/components/StatusLine/StatusLine.tsx::StatusLine
  it('renders the project name and server state', () => {
    render(
      <StatusLine projectName="flagship-printer-a" serverState="connected" lastAction="build ok" />,
    );
    expect(screen.getByText('flagship-printer-a')).toBeInTheDocument();
    expect(screen.getByText('CONNECTED')).toBeInTheDocument();
    expect(screen.getByText('build ok')).toBeInTheDocument();
  });

  it('falls back to placeholders when idle with no project', () => {
    render(<StatusLine projectName={null} serverState="disconnected" lastAction={null} />);
    expect(screen.getByText('no project')).toBeInTheDocument();
    expect(screen.getByText('idle')).toBeInTheDocument();
  });

  it('shows the keyboard hint', () => {
    render(<StatusLine projectName="p" serverState="connected" lastAction={null} />);
    expect(screen.getByText('? for shortcuts')).toBeInTheDocument();
  });
});
