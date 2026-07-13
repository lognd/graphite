import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="No obligations recorded yet" />);
    expect(screen.getByText('No obligations recorded yet')).toBeInTheDocument();
  });

  it('renders optional detail and action', () => {
    render(
      <EmptyState
        title="No projects found"
        detail="Run graphite from a directory containing a magnetite.toml."
        action={<button type="button">refresh</button>}
      />,
    );
    expect(screen.getByText(/magnetite.toml/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'refresh' })).toBeInTheDocument();
  });

  it('uses a status role so assistive tech announces it', () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
