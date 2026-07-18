import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashChip } from './HashChip';

describe('HashChip', () => {
  // frob:tests frontend/src/components/HashChip/HashChip.tsx::HashChip
  it('shows the short form by default', () => {
    render(<HashChip full="a3f9c21bc9912" />);
    expect(screen.getByText('a3f9c21')).toBeInTheDocument();
  });

  it('expands to the full hash on click', async () => {
    const user = userEvent.setup();
    render(<HashChip full="a3f9c21bc9912" />);
    await user.click(screen.getByText('a3f9c21'));
    expect(screen.getByText('a3f9c21bc9912')).toBeInTheDocument();
  });

  it('copies the full hash to the clipboard', async () => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<HashChip full="a3f9c21bc9912" />);
    await user.click(screen.getByLabelText('copy hash'));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('a3f9c21bc9912'));
  });
});
