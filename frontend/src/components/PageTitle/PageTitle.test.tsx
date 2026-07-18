import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageTitle } from './PageTitle';

describe('PageTitle', () => {
  // frob:tests frontend/src/components/PageTitle/PageTitle.tsx::PageTitle
  it('renders a real screen-reader-only h1 with the given text', () => {
    render(<PageTitle text="Obligation explorer" />);
    const heading = screen.getByRole('heading', { level: 1, name: 'Obligation explorer' });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass('gr-sr-only');
  });
});
