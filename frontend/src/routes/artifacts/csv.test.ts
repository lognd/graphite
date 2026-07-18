import { describe, expect, it } from 'vitest';
import { parseCsv } from './csv';

describe('parseCsv', () => {
  // frob:tests frontend/src/routes/artifacts/csv.ts::parseCsv
  it('splits headers and rows on a simple unquoted CSV', () => {
    const { headers, rows } = parseCsv('a,b,c\n1,2,3\n4,5,6');
    expect(headers).toEqual(['a', 'b', 'c']);
    expect(rows).toEqual([
      ['1', '2', '3'],
      ['4', '5', '6'],
    ]);
  });

  it('handles quoted fields with embedded commas and escaped quotes', () => {
    const { headers, rows } = parseCsv('name,note\n"Smith, J.","said ""hi"""');
    expect(headers).toEqual(['name', 'note']);
    expect(rows).toEqual([['Smith, J.', 'said "hi"']]);
  });

  it('returns empty headers/rows for empty text', () => {
    expect(parseCsv('')).toEqual({ headers: [], rows: [] });
  });

  it('ignores blank lines', () => {
    const { headers, rows } = parseCsv('a,b\n\n1,2\n');
    expect(headers).toEqual(['a', 'b']);
    expect(rows).toEqual([['1', '2']]);
  });
});
