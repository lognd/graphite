import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TitleBlock } from './TitleBlock';

describe('TitleBlock', () => {
  it('renders project, schema, timestamp, and verdict', () => {
    render(
      <TitleBlock
        projectName="flagship-printer-a"
        designHash="a3f9c21bc9912"
        schemaVersion={26}
        reportTimestamp="2026-07-12T18:32:00Z"
        verdict="discharged"
      />,
    );
    expect(screen.getByText('flagship-printer-a')).toBeInTheDocument();
    expect(screen.getByText('v26')).toBeInTheDocument();
    expect(screen.getByText('2026-07-12T18:32:00Z')).toBeInTheDocument();
    expect(screen.getByText('DISCHARGED')).toBeInTheDocument();
  });

  it('renders the design hash as a copyable HashChip', () => {
    render(
      <TitleBlock
        projectName="p"
        designHash="a3f9c21bc9912"
        schemaVersion={1}
        reportTimestamp="t"
        verdict="deferred"
      />,
    );
    expect(screen.getByText('a3f9c21')).toBeInTheDocument();
  });
});
