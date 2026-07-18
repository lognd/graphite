import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { ThemeProvider, useTheme } from './theme';

function Probe() {
  const { preference, resolved, setPreference } = useTheme();
  return (
    <div>
      <span data-testid="preference">{preference}</span>
      <span data-testid="resolved">{resolved}</span>
      <button onClick={() => setPreference('light')}>set light</button>
    </div>
  );
}

describe('ThemeProvider / useTheme', () => {
  // frob:tests frontend/src/app/theme.tsx::ThemeProvider
  // frob:tests frontend/src/app/theme.tsx::useTheme
  it('applies the resolved theme as data-theme on <html> and updates on preference change', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('preference')).toHaveTextContent('system');
    expect(document.documentElement.getAttribute('data-theme')).toBe(screen.getByTestId('resolved').textContent);

    act(() => {
      screen.getByText('set light').click();
    });

    expect(screen.getByTestId('preference')).toHaveTextContent('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('throws when useTheme is called outside a ThemeProvider', () => {
    function Bare() {
      useTheme();
      return null;
    }
    expect(() => render(<Bare />)).toThrow('useTheme must be used within ThemeProvider');
  });
});
