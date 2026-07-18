import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Model3D } from './Model3D';

vi.mock('../../api/hooks', () => ({
  useProjectArtifacts: () => ({ data: undefined, isLoading: true, isError: false }),
}));

describe('Model3D', () => {
  // frob:tests frontend/src/routes/artifacts/Model3D.tsx::Model3D
  it('renders the honest empty state when no GLB is shipped', () => {
    render(
      <MemoryRouter>
        <Model3D />
      </MemoryRouter>,
    );
    expect(screen.getByText(/No GLB shipped for this project/)).toBeInTheDocument();
  });
});
