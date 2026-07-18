import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ClaimDetail } from './ClaimDetail';

vi.mock('../api/hooks', () => ({
  useObligations: () => ({ data: undefined, isLoading: false, isError: false }),
  useCalcSheets: () => ({ data: undefined, isLoading: false, isError: false }),
}));

describe('ClaimDetail', () => {
  // frob:tests frontend/src/routes/ClaimDetail.tsx::ClaimDetail
  it('renders "no such claim" when no claim key is present in the route', () => {
    render(
      <MemoryRouter>
        <ClaimDetail />
      </MemoryRouter>,
    );
    expect(screen.getByText('No such claim')).toBeInTheDocument();
  });
});
