import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TitleBlock } from './TitleBlock';

describe('TitleBlock', () => {
  it('renders project, schema, timestamp, and verdict', () => {
    render(
      <TitleBlock
        projectName="examples.timber_pavilion"
        designHash="a3f9c21bc9912"
        schemaVersion="v0.1.0"
        reportTimestamp="2026-07-12T18:32:00Z"
        verdict="discharged"
      />,
    );
    expect(screen.getByText('examples.timber_pavilion')).toBeInTheDocument();
    expect(screen.getByText('v0.1.0')).toBeInTheDocument();
    expect(screen.getByText('2026-07-12T18:32:00Z')).toBeInTheDocument();
    expect(screen.getByText('DISCHARGED')).toBeInTheDocument();
  });

  it('renders the design hash as a copyable HashChip', () => {
    render(
      <TitleBlock
        projectName="p"
        designHash="a3f9c21bc9912"
        schemaVersion="v1"
        reportTimestamp="t"
        verdict="deferred"
      />,
    );
    expect(screen.getByText('a3f9c21')).toBeInTheDocument();
  });

  it('renders honest -- placeholders when fields are not sourced yet', () => {
    render(
      <TitleBlock
        projectName="fleet"
        designHash={null}
        schemaVersion={null}
        reportTimestamp={null}
        verdict={null}
      />,
    );
    // design hash, schema, report, verdict all placeholder
    expect(screen.getAllByText('--')).toHaveLength(4);
  });
});
