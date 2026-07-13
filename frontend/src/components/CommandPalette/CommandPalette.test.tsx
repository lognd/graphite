import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommandPalette } from './CommandPalette';

describe('CommandPalette', () => {
  it('renders nothing when closed', () => {
    render(<CommandPalette open={false} onClose={vi.fn()} commands={[]} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('lists commands when open', () => {
    render(
      <CommandPalette
        open
        onClose={vi.fn()}
        commands={[{ id: 'a', label: 'go to dashboard', run: vi.fn() }]}
      />,
    );
    expect(screen.getByText('go to dashboard')).toBeInTheDocument();
  });

  it('filters commands by query', async () => {
    const user = userEvent.setup();
    render(
      <CommandPalette
        open
        onClose={vi.fn()}
        commands={[
          { id: 'a', label: 'go to dashboard', run: vi.fn() },
          { id: 'b', label: 'go to obligations', run: vi.fn() },
        ]}
      />,
    );
    await user.type(screen.getByLabelText('command palette search'), 'obligations');
    expect(screen.getByText('go to obligations')).toBeInTheDocument();
    expect(screen.queryByText('go to dashboard')).not.toBeInTheDocument();
  });

  it('runs and closes on click', async () => {
    const user = userEvent.setup();
    const run = vi.fn();
    const onClose = vi.fn();
    render(
      <CommandPalette open onClose={onClose} commands={[{ id: 'a', label: 'do thing', run }]} />,
    );
    await user.click(screen.getByText('do thing'));
    expect(run).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
