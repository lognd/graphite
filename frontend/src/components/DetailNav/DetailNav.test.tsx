import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DetailNav } from './DetailNav';

function renderNav(props: Partial<React.ComponentProps<typeof DetailNav>> = {}) {
  return render(
    <MemoryRouter>
      <DetailNav prevTo="/prev" nextTo="/next" index={1} total={5} {...props} />
    </MemoryRouter>,
  );
}

describe('DetailNav', () => {
  // frob:tests frontend/src/components/DetailNav/DetailNav.tsx::DetailNav
  it('renders the 1-based index out of total', () => {
    renderNav();
    expect(screen.getByText('2 / 5')).toBeInTheDocument();
  });

  it('renders prev/next as disabled placeholders at the ends of the order', () => {
    renderNav({ prevTo: null, nextTo: null });
    const prev = screen.getByText('< prev');
    const next = screen.getByText('next >');
    expect(prev).toHaveAttribute('aria-disabled', 'true');
    expect(next).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders prev/next as real links when siblings exist', () => {
    renderNav();
    expect(screen.getByText('< prev').closest('a')).toHaveAttribute('href', '/prev');
    expect(screen.getByText('next >').closest('a')).toHaveAttribute('href', '/next');
  });
});
