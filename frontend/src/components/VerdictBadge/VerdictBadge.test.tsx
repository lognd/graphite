import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VerdictBadge } from './VerdictBadge';

describe('VerdictBadge', () => {
  it('renders the full label by default', () => {
    render(<VerdictBadge verdict="discharged" />);
    expect(screen.getByText('DISCHARGED')).toBeInTheDocument();
  });

  it('renders a compact single-letter form', () => {
    render(<VerdictBadge verdict="violated" compact />);
    expect(screen.getByText('V')).toBeInTheDocument();
  });

  it('exposes the verdict as a data attribute for styling/testing', () => {
    render(<VerdictBadge verdict="deferred" />);
    expect(screen.getByText('DEFERRED')).toHaveAttribute('data-verdict', 'deferred');
  });

  it.each(['discharged', 'violated', 'deferred', 'accepted-deviation', 'excluded'] as const)(
    'renders every verdict variant: %s',
    (verdict) => {
      render(<VerdictBadge verdict={verdict} />);
      expect(screen.getByText(new RegExp(verdict.toUpperCase(), 'i'))).toBeInTheDocument();
    },
  );
});
