import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BoardGerberView } from './BoardGerberView';

describe('BoardGerberView', () => {
  // frob:tests frontend/src/routes/artifacts/BoardGerberView.tsx::BoardGerberView
  it('renders the loading state before the gerber index fetch resolves', () => {
    // No :projectId route param in scope -> the load effect never fires,
    // so `rows` stays null and the loading status is the stable render.
    render(
      <MemoryRouter>
        <BoardGerberView />
      </MemoryRouter>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('loading gerber layers...');
  });
});
