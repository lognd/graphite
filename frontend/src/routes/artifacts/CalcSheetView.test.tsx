import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CalcSheetView } from './CalcSheetView';

vi.mock('../../api/hooks', () => ({
  useCalcSheets: () => ({ data: undefined, isLoading: true, isError: false }),
  useProjectArtifacts: () => ({ data: undefined, isLoading: true, isError: false }),
}));

describe('CalcSheetView', () => {
  // frob:tests frontend/src/routes/artifacts/CalcSheetView.tsx::CalcSheetView
  it('renders the loading state while the calc sheet is in flight', () => {
    render(
      <MemoryRouter>
        <CalcSheetView />
      </MemoryRouter>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('loading calc sheet...');
  });
});
