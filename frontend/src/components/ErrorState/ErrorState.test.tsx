import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  it('renders the title with alert role', () => {
    render(<ErrorState title="Build failed" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Build failed');
  });

  it('renders the real stderr tail as detail', () => {
    render(<ErrorState title="Build failed" detail="error[E0308]: mismatched types" />);
    expect(screen.getByText('error[E0308]: mismatched types')).toBeInTheDocument();
  });

  it('calls onRetry when the retry button is clicked', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<ErrorState title="Failed" onRetry={onRetry} />);
    await user.click(screen.getByRole('button', { name: 'retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
