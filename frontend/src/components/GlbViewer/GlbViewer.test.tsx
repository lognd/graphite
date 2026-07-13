// Component test for the honesty-rule path only: the timber_pavilion
// fixture (civil) ships no GLB, so the "no bytes" EmptyState is the path
// this WO's own fixture project actually exercises end-to-end (see
// Playwright system test). The three.js-backed render path is exercised
// manually/visually (three.js requires a WebGL context jsdom does not
// provide) -- documented as a coverage gap in the WO ledger rather than
// silently skipped.

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlbViewer } from './GlbViewer';

describe('GlbViewer', () => {
  it('renders a named-absence empty state when no GLB bytes are supplied', () => {
    render(
      <GlbViewer
        glbBytes={null}
        contentHash={null}
        stepDownloadHref={null}
        stepContentHash={null}
      />,
    );
    expect(screen.getByText(/No GLB shipped for this project/)).toBeInTheDocument();
  });
});
