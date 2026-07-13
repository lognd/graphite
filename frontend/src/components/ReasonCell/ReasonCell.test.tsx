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

  it('links to the governing design-log rule when an F-number is present', () => {
    render(<ReasonCell reason="load case exceeds envelope" fNumber="F118" />);
    const link = screen.getByRole('link', { name: 'F118' });
    expect(link).toHaveAttribute('href', '#/design-log/F118');
  });

  it('omits the link when no F-number is given', () => {
    render(<ReasonCell reason="pending review" />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
