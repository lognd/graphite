import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ArtifactIndexRow } from '../../api/client';
import { FileRenderer } from './FileRenderer';

function row(overrides: Partial<ArtifactIndexRow> = {}): ArtifactIndexRow {
  return {
    family: 'boards',
    kind: 'firmware',
    relpath: 'boards/firmware.bin',
    content_hash: 'sha256:deadbeef',
    bytes: 42,
    media_type: 'application/octet-stream',
    viewer: 'binary',
    source_refs: [],
    synthesized: false,
    ...overrides,
  };
}

describe('FileRenderer', () => {
  // frob:tests frontend/src/routes/artifacts/FileRenderer.tsx::FileRenderer
  it('renders the honest fallback (name/family/size/hash + reason) for a binary viewer hint', () => {
    render(<FileRenderer projectId="p1" row={row()} />);
    expect(screen.getByText('boards/firmware.bin')).toBeInTheDocument();
    expect(screen.getByText(/42 bytes/)).toBeInTheDocument();
    expect(screen.getByText(/lithos itself marks this binary/)).toBeInTheDocument();
  });
});
