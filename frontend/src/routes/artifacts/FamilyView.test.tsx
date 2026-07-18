import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FamilyView } from './FamilyView';

vi.mock('../../api/hooks', () => ({
  useProjectArtifactIndex: () => ({ data: undefined, isLoading: true, isError: false }),
}));

describe('FamilyView', () => {
  // frob:tests frontend/src/routes/artifacts/FamilyView.tsx::FamilyView
  it('renders the loading state while the artifact index is in flight', () => {
    render(
      <MemoryRouter>
        <FamilyView />
      </MemoryRouter>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('loading artifact index...');
  });
});
