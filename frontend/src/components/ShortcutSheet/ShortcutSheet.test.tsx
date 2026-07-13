import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShortcutSheet } from './ShortcutSheet';

const shortcuts = [
  { keys: 'ctrl+k', description: 'open the command palette' },
  { keys: 'j / k', description: 'move down / up a row' },
];

describe('ShortcutSheet', () => {
  it('renders nothing when closed', () => {
    render(<ShortcutSheet open={false} onClose={() => {}} shortcuts={shortcuts} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('lists every shortcut when open', () => {
    render(<ShortcutSheet open onClose={() => {}} shortcuts={shortcuts} />);
    expect(screen.getByText('ctrl+k')).toBeInTheDocument();
    expect(screen.getByText('open the command palette')).toBeInTheDocument();
    expect(screen.getByText('j / k')).toBeInTheDocument();
  });
});
