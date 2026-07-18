import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ObligationExplorer } from './ObligationExplorer';

vi.mock('../api/hooks', () => ({
  useObligations: () => ({ data: undefined, isLoading: false, isError: false }),
  useCalcSheets: () => ({ data: undefined, isLoading: false, isError: false }),
}));

describe('ObligationExplorer', () => {
  // frob:tests frontend/src/routes/ObligationExplorer.tsx::ObligationExplorer
  it('renders the honest empty state when the audit index has no rows', () => {
    render(
      <MemoryRouter>
        <ObligationExplorer />
      </MemoryRouter>,
    );
    expect(screen.getByText('No obligations match this view')).toBeInTheDocument();
  });
});
