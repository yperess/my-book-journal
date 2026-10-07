import type { Book } from '../types';
import { uniqueTags } from './tags';

/** Column order of the "Books" sheet. Changing this requires a data migration. */
export const BOOK_COLUMNS = [
  'id',
  'title',
  'authors',
  'olKey',
  'coverId',
  'firstPublishYear',
  'rating',
  'review',
  'tags',
  'dateRead',
  'createdAt',
  'updatedAt',
] as const;

export type CellValue = string | number | boolean | null | undefined;

const str = (v: CellValue): string => (v === null || v === undefined ? '' : String(v));

const numOrNull = (v: CellValue): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export function clampRating(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(10, Math.max(0, Math.round(n * 2) / 2));
}

const splitList = (v: CellValue, sep: string): string[] =>
  str(v)
    .split(sep)
    .map((s) => s.trim())
    .filter(Boolean);

export function bookToRow(book: Book): (string | number)[] {
  return [
    book.id,
    book.title,
    book.authors.join('; '),
    book.olKey,
    book.coverId ?? '',
    book.firstPublishYear ?? '',
    book.rating,
    book.review,
    book.tags.join(', '),
    book.dateRead,
    book.createdAt,
    book.updatedAt,
  ];
}

export function rowToBook(row: CellValue[]): Book | null {
  const id = str(row[0]);
  if (!id) return null;
  return {
    id,
    title: str(row[1]),
    authors: splitList(row[2], ';'),
    olKey: str(row[3]),
    coverId: numOrNull(row[4]),
    firstPublishYear: numOrNull(row[5]),
    rating: clampRating(numOrNull(row[6]) ?? 0),
    review: str(row[7]),
    tags: uniqueTags(splitList(row[8], ',')),
    dateRead: str(row[9]),
    createdAt: str(row[10]),
    updatedAt: str(row[11]),
  };
}

/** Converts a 1-based column count into an A1 column letter (1 -> A, 27 -> AA). */
export function columnLetter(n: number): string {
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export const BOOK_LAST_COLUMN = columnLetter(BOOK_COLUMNS.length);
