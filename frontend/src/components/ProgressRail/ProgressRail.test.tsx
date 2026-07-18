import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgressRail } from './ProgressRail';

describe('ProgressRail', () => {
  // frob:tests frontend/src/components/ProgressRail/ProgressRail.tsx::ProgressRail
  it('renders the current step and elapsed time', () => {
    render(<ProgressRail step="compiling hematite" percent={42} elapsedSeconds={95} />);
    expect(screen.getByText('compiling hematite')).toBeInTheDocument();
    expect(screen.getByText('1:35')).toBeInTheDocument();
  });

  it('exposes percent via the progressbar role', () => {
    render(<ProgressRail step="linking" percent={70} elapsedSeconds={5} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '70');
  });

  it('marks indeterminate progress when percent is null', () => {
    const { container } = render(<ProgressRail step="waiting" percent={null} elapsedSeconds={0} />);
    expect(container.querySelector('[data-indeterminate="true"]')).not.toBeNull();
  });

  it('calls onCancel when the cancel button is pressed', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<ProgressRail step="running" percent={10} elapsedSeconds={1} onCancel={onCancel} />);
    await user.click(screen.getByRole('button', { name: 'cancel' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
