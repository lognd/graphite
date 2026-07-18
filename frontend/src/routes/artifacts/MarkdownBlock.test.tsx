import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownBlock } from './MarkdownBlock';

describe('MarkdownBlock', () => {
  // frob:tests frontend/src/routes/artifacts/MarkdownBlock.tsx::MarkdownBlock
  it('renders the given markdown text content', () => {
    render(<MarkdownBlock text="# hello world" />);
    expect(screen.getByText(/hello world/)).toBeInTheDocument();
  });
});
