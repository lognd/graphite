import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HarnessView } from './HarnessView';

vi.mock('../../api/hooks', () => ({
  useProjectArtifactIndex: () => ({ data: undefined, isLoading: true, isError: false }),
}));

describe('HarnessView', () => {
  // frob:tests frontend/src/routes/artifacts/HarnessView.tsx::HarnessView
  it('renders the loading state while the artifact index is in flight', () => {
    render(
      <MemoryRouter>
        <HarnessView />
      </MemoryRouter>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('loading harness artifacts...');
  });
});
