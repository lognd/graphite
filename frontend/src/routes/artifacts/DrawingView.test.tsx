import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DrawingView } from './DrawingView';

vi.mock('../../api/hooks', () => ({
  useProjectArtifacts: () => ({ data: undefined, isLoading: true, isError: false }),
}));

describe('DrawingView', () => {
  // frob:tests frontend/src/routes/artifacts/DrawingView.tsx::DrawingView
  it('renders the loading state while the project artifact listing is in flight', () => {
    render(
      <MemoryRouter>
        <DrawingView />
      </MemoryRouter>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('loading drawing...');
  });
});
