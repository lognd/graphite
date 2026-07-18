import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import { ThemeProvider } from './theme';
import { RunProvider } from './RunContext';

vi.mock('../api/hooks', () => ({
  useProjects: () => ({ data: [{ name: 'demo' }], isError: false }),
  useCancelRun: () => ({ mutate: vi.fn() }),
}));

function renderShell() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <ThemeProvider>
        <RunProvider>
          <Routes>
            <Route path="/" element={<AppShell />}>
              <Route index element={<div>dashboard content</div>} />
            </Route>
          </Routes>
        </RunProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
}

describe('AppShell', () => {
  // frob:tests frontend/src/app/AppShell.tsx::AppShell
  it('renders the title block, nav, routed content, and status line', () => {
    renderShell();
    expect(screen.getAllByText('fleet (1)').length).toBeGreaterThan(0);
    expect(screen.getByRole('navigation', { name: 'primary' })).toBeInTheDocument();
    expect(screen.getByText('dashboard content')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('opens the command palette on ctrl+k', async () => {
    renderShell();
    const evt = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
    window.dispatchEvent(evt);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
