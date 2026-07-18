import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { RunProvider, useRunContext } from './RunContext';
import type { ActiveRunState } from './RunContext';

const RUN: ActiveRunState = {
  runId: 'r1',
  project: 'demo',
  verb: 'build',
  phase: 'compiling',
  done: 1,
  total: 4,
  elapsedSeconds: 12,
  status: 'running',
};

function Probe() {
  const { activeRun, setActiveRun, updateActiveRun } = useRunContext();
  return (
    <div>
      <span data-testid="phase">{activeRun?.phase ?? 'none'}</span>
      <button onClick={() => setActiveRun(RUN)}>start</button>
      <button onClick={() => updateActiveRun({ phase: 'linking' })}>advance</button>
    </div>
  );
}

describe('RunProvider / useRunContext', () => {
  // frob:tests frontend/src/app/RunContext.tsx::RunProvider
  // frob:tests frontend/src/app/RunContext.tsx::useRunContext
  it('publishes and patches the active run so any consumer sees it', () => {
    render(
      <RunProvider>
        <Probe />
      </RunProvider>,
    );
    expect(screen.getByTestId('phase')).toHaveTextContent('none');

    act(() => screen.getByText('start').click());
    expect(screen.getByTestId('phase')).toHaveTextContent('compiling');

    act(() => screen.getByText('advance').click());
    expect(screen.getByTestId('phase')).toHaveTextContent('linking');
  });

  it('throws when useRunContext is called outside a RunProvider', () => {
    function Bare() {
      useRunContext();
      return null;
    }
    expect(() => render(<Bare />)).toThrow('useRunContext must be used within a RunProvider');
  });
});
