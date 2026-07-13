// The one table component (spec 03.5); the 04.1 "any table" checklist IS
// its spec: column sort, text filter, copy row/cell, CSV export, empty/
// loading states, count in the header, sticky header on scroll, j/k
// keyboard row navigation. Every table view in the app composes this
// instead of hand-rolling <table> markup (dedup law 04.2).

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { EmptyState } from '../EmptyState/EmptyState';
import './DataTable.css';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  unit?: string;
  accessor: (row: T) => string | number | null;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDetail?: string;
}

type SortDir = 'asc' | 'desc';

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  emptyTitle = 'No rows to display',
  emptyDetail,
}: DataTableProps<T>) {
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [activeRow, setActiveRow] = useState(0);

  const filtered = useMemo(() => {
    if (!filter) return rows;
    const needle = filter.toLowerCase();
    return rows.filter((row) =>
      columns.some((col) =>
        String(col.accessor(row) ?? '')
          .toLowerCase()
          .includes(needle),
      ),
    );
  }, [rows, filter, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = col.accessor(a);
      const bv = col.accessor(b);
      if (av === bv) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      const cmp = av < bv ? -1 : 1;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir, columns]);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function copyRow(row: T) {
    const text = columns.map((c) => String(c.accessor(row) ?? '')).join('\t');
    void navigator.clipboard?.writeText(text);
  }

  function exportCsv() {
    const header = columns.map((c) => c.header).join(',');
    const body = sorted
      .map((row) => columns.map((c) => JSON.stringify(String(c.accessor(row) ?? ''))).join(','))
      .join('\n');
    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graphite-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'j') {
      setActiveRow((i) => Math.min(i + 1, sorted.length - 1));
    } else if (e.key === 'k') {
      setActiveRow((i) => Math.max(i - 1, 0));
    } else if (e.key === 'c') {
      const row = sorted[activeRow];
      if (row) copyRow(row);
    }
  }

  return (
    <div className="gr-data-table">
      <div className="gr-data-table__toolbar">
        <span className="gr-micro-label gr-data-table__count">{sorted.length} rows</span>
        <input
          className="gr-data-table__filter"
          type="search"
          placeholder="filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="filter table"
        />
        <button type="button" className="gr-data-table__export" onClick={exportCsv}>
          export csv
        </button>
      </div>
      {loading ? (
        <div className="gr-data-table__loading" role="status">
          loading...
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState title={emptyTitle} detail={emptyDetail} />
      ) : (
        <div
          className="gr-data-table__scroll"
          tabIndex={0}
          onKeyDown={onKeyDown}
          aria-label="results"
          data-row-count={sorted.length}
        >
          <table className="gr-data-table__table">
            <thead className="gr-data-table__thead">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="gr-data-table__th"
                    aria-sort={
                      sortKey === col.key
                        ? sortDir === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    {col.header ? (
                      <button
                        type="button"
                        className="gr-data-table__sort-btn"
                        onClick={() => col.sortable !== false && toggleSort(col.key)}
                      >
                        {col.header}
                        {col.unit ? (
                          <span className="gr-data-table__unit"> ({col.unit})</span>
                        ) : null}
                        {sortKey === col.key ? (sortDir === 'asc' ? ' ^' : ' v') : ''}
                      </button>
                    ) : (
                      // Action-only columns (no header text, e.g. "open sheet"
                      // links) are never sortable -- a plain, screen-reader-only
                      // label keeps every <th> discernible without rendering an
                      // empty interactive control (axe: empty-table-header /
                      // button-name).
                      <span className="gr-sr-only">{col.key}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => (
                <tr
                  key={rowKey(row)}
                  className={`gr-data-table__tr${i === activeRow ? ' gr-data-table__tr--active' : ''}`}
                  aria-rowindex={i + 1}
                  onClick={() => setActiveRow(i)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="gr-data-table__td">
                      {col.render ? col.render(row) : col.accessor(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
