import { describe, expect, it } from 'vitest';
import type { Book } from '../types';
import { DEFAULT_FILTER, filterBooks, isFilterActive, tagCounts } from './filter';

const book = (over: Partial<Book>): Book => ({
  id: over.title ?? 'x',
  title: 'Untitled',
  authors: [],
  olKey: '',
  coverId: null,
  firstPublishYear: null,
  rating: 5,
  review: '',
  tags: [],
  dateRead: '',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...over,
});

const books = [
  book({ title: 'Dune', authors: ['Frank Herbert'], rating: 9, tags: ['epic', 'slow'], createdAt: '2024-01-02', dateRead: '2023-05-01' }),
  book({ title: 'Good Omens', authors: ['Terry Pratchett', 'Neil Gaiman'], rating: 8.5, tags: ['funny'], review: 'Hilarious apocalypse', createdAt: '2024-01-03' }),
  book({ title: 'Twilight', authors: ['Stephenie Meyer'], rating: 3, tags: ['romantic', 'funny'], createdAt: '2024-01-01', dateRead: '2010-01-01' }),
];

const titles = (bs: Book[]) => bs.map((b) => b.title);

describe('filterBooks', () => {
  it('returns all books sorted by most recently added by default', () => {
    expect(titles(filterBooks(books, DEFAULT_FILTER))).toEqual(['Good Omens', 'Dune', 'Twilight']);
  });

  it('matches every search term against title, author, review and tags', () => {
    expect(titles(filterBooks(books, { ...DEFAULT_FILTER, text: 'gaiman' }))).toEqual(['Good Omens']);
    expect(titles(filterBooks(books, { ...DEFAULT_FILTER, text: 'apocalypse' }))).toEqual(['Good Omens']);
    expect(titles(filterBooks(books, { ...DEFAULT_FILTER, text: 'romantic' }))).toEqual(['Twilight']);
    expect(titles(filterBooks(books, { ...DEFAULT_FILTER, text: 'funny meyer' }))).toEqual(['Twilight']);
  });

  it('filters by inclusive rating range', () => {
    expect(titles(filterBooks(books, { ...DEFAULT_FILTER, minRating: 8.5, sort: 'ratingDesc' }))).toEqual(['Dune', 'Good Omens']);
    expect(titles(filterBooks(books, { ...DEFAULT_FILTER, maxRating: 3 }))).toEqual(['Twilight']);
  });

  it('supports any/all tag matching', () => {
    const f = { ...DEFAULT_FILTER, tags: ['funny', 'romantic'], sort: 'title' as const };
    expect(titles(filterBooks(books, { ...f, tagMode: 'any' }))).toEqual(['Good Omens', 'Twilight']);
    expect(titles(filterBooks(books, { ...f, tagMode: 'all' }))).toEqual(['Twilight']);
  });

  it('sorts by date read with undated books last', () => {
    expect(titles(filterBooks(books, { ...DEFAULT_FILTER, sort: 'dateRead' }))).toEqual(['Dune', 'Twilight', 'Good Omens']);
  });

  it('does not mutate the input', () => {
    const copy = [...books];
    filterBooks(books, { ...DEFAULT_FILTER, sort: 'title' });
    expect(books).toEqual(copy);
  });
});

describe('isFilterActive / tagCounts', () => {
  it('ignores sort when deciding if a filter is active', () => {
    expect(isFilterActive({ ...DEFAULT_FILTER, sort: 'title' })).toBe(false);
    expect(isFilterActive({ ...DEFAULT_FILTER, minRating: 1 })).toBe(true);
  });

  it('counts tag usage', () => {
    expect(Object.fromEntries(tagCounts(books))).toEqual({ epic: 1, slow: 1, funny: 2, romantic: 1 });
  });
});
