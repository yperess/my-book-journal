import type { Book, BookFilter } from '../types';

export const DEFAULT_FILTER: BookFilter = {
  text: '',
  minRating: 0,
  maxRating: 10,
  tags: [],
  tagMode: 'any',
  sort: 'recent',
};

export function isFilterActive(f: BookFilter): boolean {
  return f.text.trim() !== '' || f.minRating > 0 || f.maxRating < 10 || f.tags.length > 0;
}

function matchesText(book: Book, terms: string[]): boolean {
  if (terms.length === 0) return true;
  const haystack = [book.title, book.authors.join(' '), book.review, book.tags.join(' ')]
    .join(' ')
    .toLowerCase();
  return terms.every((t) => haystack.includes(t));
}

function matchesTags(book: Book, tags: string[], mode: 'any' | 'all'): boolean {
  if (tags.length === 0) return true;
  return mode === 'all' ? tags.every((t) => book.tags.includes(t)) : tags.some((t) => book.tags.includes(t));
}

const byString = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' });

export function filterBooks(books: Book[], f: BookFilter): Book[] {
  const terms = f.text.toLowerCase().split(/\s+/).filter(Boolean);
  const result = books.filter(
    (b) =>
      b.rating >= f.minRating &&
      b.rating <= f.maxRating &&
      matchesTags(b, f.tags, f.tagMode) &&
      matchesText(b, terms),
  );
  const recent = (a: Book, b: Book) => byString(b.createdAt, a.createdAt);
  switch (f.sort) {
    case 'ratingDesc':
      return result.sort((a, b) => b.rating - a.rating || recent(a, b));
    case 'ratingAsc':
      return result.sort((a, b) => a.rating - b.rating || recent(a, b));
    case 'title':
      return result.sort((a, b) => byString(a.title, b.title));
    case 'dateRead':
      // Books without a read date go last.
      return result.sort((a, b) => {
        if (!a.dateRead !== !b.dateRead) return a.dateRead ? -1 : 1;
        return byString(b.dateRead, a.dateRead) || recent(a, b);
      });
    case 'recent':
    default:
      return result.sort(recent);
  }
}

/** Counts how many books use each tag. */
export function tagCounts(books: Book[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const b of books) for (const t of b.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return counts;
}
