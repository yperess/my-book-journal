import { describe, expect, it } from 'vitest';
import type { Book } from '../types';
import { BOOK_COLUMNS, BOOK_LAST_COLUMN, bookToRow, clampRating, columnLetter, rowToBook } from './serialize';
import { normalizeTag, uniqueTags } from './tags';

const sample: Book = {
  id: 'abc',
  title: 'Good Omens',
  authors: ['Terry Pratchett', 'Neil Gaiman'],
  olKey: '/works/OL452189W',
  coverId: 12345,
  firstPublishYear: 1990,
  rating: 8.5,
  review: '=SUM(A1) is not a formula, line\nbreak',
  tags: ['funny', 'thought-provoking'],
  dateRead: '2024-02-03',
  createdAt: '2024-02-03T10:00:00.000Z',
  updatedAt: '2024-02-04T10:00:00.000Z',
};

describe('row serialization', () => {
  it('round-trips a book', () => {
    const row = bookToRow(sample);
    expect(row).toHaveLength(BOOK_COLUMNS.length);
    expect(rowToBook(row)).toEqual(sample);
  });

  it('handles sparse rows returned by the Sheets API', () => {
    expect(rowToBook(['id1', 'Only title'])).toMatchObject({
      id: 'id1',
      title: 'Only title',
      authors: [],
      coverId: null,
      rating: 0,
      tags: [],
    });
  });

  it('skips rows without an id', () => {
    expect(rowToBook([])).toBeNull();
    expect(rowToBook(['', 'title'])).toBeNull();
  });

  it('parses numbers stored as strings and clamps ratings', () => {
    const b = rowToBook(['x', 't', '', '', '42', '2001', '11', '', ' Funny ,SAD,funny', '', '', ''])!;
    expect(b.coverId).toBe(42);
    expect(b.firstPublishYear).toBe(2001);
    expect(b.rating).toBe(10);
    expect(b.tags).toEqual(['funny', 'sad']);
  });

  it('rounds ratings to half points', () => {
    expect(clampRating(7.3)).toBe(7.5);
    expect(clampRating(-1)).toBe(0);
    expect(clampRating(NaN)).toBe(0);
  });
});

describe('helpers', () => {
  it('computes column letters', () => {
    expect(columnLetter(1)).toBe('A');
    expect(columnLetter(26)).toBe('Z');
    expect(columnLetter(27)).toBe('AA');
    expect(BOOK_LAST_COLUMN).toBe('L');
  });

  it('normalizes tags', () => {
    expect(normalizeTag('  Laugh,  Out   Loud ')).toBe('laugh out loud');
    expect(uniqueTags(['A', 'a', ' ', 'b'])).toEqual(['a', 'b']);
  });
});
