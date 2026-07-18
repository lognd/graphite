import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Bom } from './Bom';

vi.mock('../../api/hooks', () => ({
  useBuildReport: () => ({ data: undefined, isLoading: true, isError: false }),
}));

describe('Bom', () => {
  // frob:tests frontend/src/routes/artifacts/Bom.tsx::Bom
  it('renders the loading state while the build report is in flight', () => {
    render(
      <MemoryRouter>
        <Bom />
      </MemoryRouter>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('loading BOM/cost/schedule...');
  });
});
