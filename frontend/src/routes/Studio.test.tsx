import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Studio } from './Studio';

describe('Studio', () => {
  // frob:tests frontend/src/routes/Studio.tsx::Studio
  it('renders the honest empty state when no project is selected', () => {
    render(
      <MemoryRouter>
        <Studio />
      </MemoryRouter>,
    );
    expect(screen.getByText('no project selected')).toBeInTheDocument();
  });
});
