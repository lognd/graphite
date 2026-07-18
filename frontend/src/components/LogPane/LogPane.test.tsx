import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogPane } from './LogPane';

describe('LogPane', () => {
  // frob:tests frontend/src/components/LogPane/LogPane.tsx::LogPane
  it('renders every log line', () => {
    render(<LogPane lines={['starting build', 'linking...', 'done']} />);
    expect(screen.getByText('starting build')).toBeInTheDocument();
    expect(screen.getByText('done')).toBeInTheDocument();
  });

  it('strips ANSI escape sequences', () => {
    render(<LogPane lines={['[32mok[0m']} />);
    expect(screen.getByText('ok')).toBeInTheDocument();
  });

  it('filters lines via the search box', async () => {
    const user = userEvent.setup();
    render(<LogPane lines={['error: bad thing', 'info: fine']} />);
    await user.type(screen.getByLabelText('search log'), 'error');
    expect(screen.getByText('error: bad thing')).toBeInTheDocument();
    expect(screen.queryByText('info: fine')).not.toBeInTheDocument();
  });

  it('shows an empty message when the filter matches nothing', async () => {
    const user = userEvent.setup();
    render(<LogPane lines={['hello']} />);
    await user.type(screen.getByLabelText('search log'), 'zzz');
    expect(screen.getByText('no log lines match')).toBeInTheDocument();
  });
});
