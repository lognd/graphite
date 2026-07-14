import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReasonCell } from './ReasonCell';

describe('ReasonCell', () => {
  it('renders a dash placeholder when there is no reason', () => {
    render(<ReasonCell reason={null} />);
    expect(screen.getByText('--')).toBeInTheDocument();
  });

  it('renders the reason text', () => {
    render(<ReasonCell reason="awaiting derating study" />);
    expect(screen.getByText('awaiting derating study')).toBeInTheDocument();
  });

  it('highlights the governing design-log rule as text, never a dead link (WOG3-F4)', () => {
    render(<ReasonCell reason="load case exceeds envelope" fNumber="F118" />);
    expect(screen.getByText('F118')).toBeInTheDocument();
    // No design-log route exists in the app -- a placeholder anchor would
    // be a dead link, so the rule number must not render as one.
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('omits the rule marker when no F-number is given', () => {
    render(<ReasonCell reason="pending review" />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByTitle(/design-log rule/)).not.toBeInTheDocument();
  });
});
