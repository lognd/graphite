import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Nav } from './Nav';

vi.mock('../api/hooks', () => ({
  useProjects: () => ({ data: [{ name: 'demo-project' }] }),
}));

describe('Nav', () => {
  // frob:tests frontend/src/app/Nav.tsx::Nav
  it('renders the fixed top-level route list and the projects tree', () => {
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'obligations' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'demo-project' })).toBeInTheDocument();
  });
});
