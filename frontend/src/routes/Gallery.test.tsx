import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../app/theme';
import { Gallery } from './Gallery';

describe('Gallery', () => {
  // frob:tests frontend/src/routes/Gallery.tsx::Gallery
  it('renders every component swatch section, dev-only visual QA gallery', () => {
    render(
      <ThemeProvider>
        <Gallery />
      </ThemeProvider>,
    );
    expect(screen.getByText(/component gallery -- theme:/)).toBeInTheDocument();
    expect(screen.getByText('VerdictBadge')).toBeInTheDocument();
    expect(screen.getByText('MarginBar')).toBeInTheDocument();
  });
});
