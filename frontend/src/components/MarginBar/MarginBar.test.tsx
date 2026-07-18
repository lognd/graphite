import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarginBar } from './MarginBar';

describe('MarginBar', () => {
  // frob:tests frontend/src/components/MarginBar/MarginBar.tsx::MarginBar
  it('renders the value and limit as text', () => {
    render(<MarginBar value={12.4} limit={20} unit="degC" label="thermal" />);
    expect(screen.getByText('12.4degC / 20degC')).toBeInTheDocument();
  });

  it('exposes an accessible label describing the dimension', () => {
    render(<MarginBar value={5} limit={10} unit="mm" label="structural" />);
    expect(screen.getByRole('img', { name: /structural: 5mm of 10mm limit/i })).toBeInTheDocument();
  });

  it('flags an over-limit value visually via a modifier class', () => {
    const { container } = render(<MarginBar value={-3.2} limit={0} unit="mm" />);
    expect(container.querySelector('.gr-margin-bar__fill--over')).not.toBeNull();
  });
});
