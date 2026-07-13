import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';

interface Row {
  id: string;
  name: string;
  value: number;
}

const rows: Row[] = [
  { id: 'a', name: 'bravo', value: 2 },
  { id: 'b', name: 'alpha', value: 1 },
  { id: 'c', name: 'charlie', value: 3 },
];

const columns: DataTableColumn<Row>[] = [
  { key: 'name', header: 'Name', accessor: (r) => r.name },
  { key: 'value', header: 'Value', unit: 'mm', accessor: (r) => r.value },
];

describe('DataTable', () => {
  it('shows the row count in the header', () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />);
    expect(screen.getByText('3 rows')).toBeInTheDocument();
  });

  it('renders an empty state when there are no rows', () => {
    render(
      <DataTable columns={columns} rows={[]} rowKey={(r) => r.id} emptyTitle="No rows recorded" />,
    );
    expect(screen.getByText('No rows recorded')).toBeInTheDocument();
  });

  it('renders a loading state', () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} loading />);
    expect(screen.getByRole('status')).toHaveTextContent('loading');
  });

  it('filters rows via the text filter', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />);
    await user.type(screen.getByLabelText('filter table'), 'alpha');
    expect(screen.getByText('1 rows')).toBeInTheDocument();
    expect(screen.getByText('alpha')).toBeInTheDocument();
  });

  it('sorts rows when a sortable header is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />);
    await user.click(screen.getByRole('button', { name: /^Name/ }));
    // after ascending sort by name: alpha, bravo, charlie
    const dataRows = container.querySelectorAll('.gr-data-table__tr');
    expect(dataRows[0]).toHaveTextContent('alpha');
    expect(dataRows[2]).toHaveTextContent('charlie');
  });

  it('shows the unit in the column header', () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />);
    expect(screen.getByText('(mm)')).toBeInTheDocument();
  });

  it('exports CSV via a download trigger without throwing', async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn().mockReturnValue('blob:mock');
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />);
    await user.click(screen.getByRole('button', { name: 'export csv' }));
    expect(createObjectURL).toHaveBeenCalledOnce();
  });

  it('supports j/k keyboard row navigation', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />);
    const grid = screen.getByLabelText('results');
    grid.focus();
    await user.keyboard('j');
    await user.keyboard('j');
    const activeRows = grid.querySelectorAll('.gr-data-table__tr--active');
    expect(activeRows.length).toBe(1);
  });
});
