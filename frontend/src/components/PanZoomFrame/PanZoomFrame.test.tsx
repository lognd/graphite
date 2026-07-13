import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PanZoomFrame } from './PanZoomFrame';

describe('PanZoomFrame', () => {
  it('renders its children inside the pan/zoom viewport', () => {
    render(
      <PanZoomFrame ariaLabel="test graphic">
        <svg data-testid="child" />
      </PanZoomFrame>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'test graphic' })).toBeInTheDocument();
  });

  it('has zoom in / zoom out / fit controls (04.1 any-graphic floor)', async () => {
    const user = userEvent.setup();
    render(
      <PanZoomFrame ariaLabel="test graphic">
        <svg />
      </PanZoomFrame>,
    );
    await user.click(screen.getByText('zoom in'));
    await user.click(screen.getByText('zoom out'));
    await user.click(screen.getByText('fit'));
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});
