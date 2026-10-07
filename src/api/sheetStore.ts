import type { Book } from '../types';
import { BOOK_COLUMNS, BOOK_LAST_COLUMN, bookToRow, rowToBook, type CellValue } from '../lib/serialize';
import { DEFAULT_TAGS, uniqueTags } from '../lib/tags';
import { googleFetch, type TokenProvider } from './googleApi';

const SHEETS = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE = 'https://www.googleapis.com/drive/v3/files';
const APP_PROPERTY = { key: 'bookJournal', value: 'v1' };
const BOOKS = 'Books';
const TAGS = 'Tags';
const TAG_COLUMNS = ['tag'];
const ID_CACHE_KEY = 'bookJournal.spreadsheetId.';

interface SheetProps {
  sheetId: number;
  title: string;
}

interface SpreadsheetMeta {
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheets: { properties: SheetProps }[];
}

interface ValueRange {
  range: string;
  values?: CellValue[][];
}

const enc = encodeURIComponent;

/**
 * Stores the journal in a Google Sheet in the user's Drive. Only the `drive.file` scope is used,
 * so the app can only see the spreadsheet it created itself.
 *
 * Layout:
 *  - "Books": one row per book, columns as in BOOK_COLUMNS (header in row 1).
 *  - "Tags":  one tag per row in column A (header in row 1).
 */
export class SheetStore {
  private constructor(
    private readonly getToken: TokenProvider,
    readonly spreadsheetId: string,
    readonly url: string,
    private readonly sheetIds: Record<string, number>,
  ) {}

  static async open(getToken: TokenProvider, userEmail: string): Promise<SheetStore> {
    const cacheKey = ID_CACHE_KEY + userEmail;
    let id = safeGet(cacheKey);
    let meta: SpreadsheetMeta | null = null;
    if (id) meta = await getMeta(getToken, id).catch(() => null);
    if (!meta) {
      id = await findSpreadsheet(getToken);
      if (id) meta = await getMeta(getToken, id);
    }
    if (!meta) meta = await createSpreadsheet(getToken);
    meta = await ensureSheets(getToken, meta);
    safeSet(cacheKey, meta.spreadsheetId);
    const sheetIds = Object.fromEntries(meta.sheets.map((s) => [s.properties.title, s.properties.sheetId]));
    return new SheetStore(getToken, meta.spreadsheetId, meta.spreadsheetUrl, sheetIds);
  }

  async loadAll(): Promise<{ books: Book[]; tags: string[] }> {
    const ranges = [`${BOOKS}!A2:${BOOK_LAST_COLUMN}`, `${TAGS}!A2:A`].map((r) => `ranges=${enc(r)}`).join('&');
    const res = await googleFetch<{ valueRanges: ValueRange[] }>(
      this.getToken,
      `${SHEETS}/${this.spreadsheetId}/values:batchGet?${ranges}&valueRenderOption=UNFORMATTED_VALUE`,
    );
    const [bookRange, tagRange] = res.valueRanges;
    const books = (bookRange.values ?? []).map(rowToBook).filter((b): b is Book => b !== null);
    const tags = uniqueTags((tagRange.values ?? []).map((r) => String(r[0] ?? '')));
    return { books, tags };
  }

  async addBook(book: Book): Promise<void> {
    await this.append(BOOKS, [bookToRow(book)]);
  }

  async updateBook(book: Book): Promise<void> {
    const row = await this.findRow(BOOKS, book.id);
    if (row === null) {
      // Row was removed from the sheet by hand; re-add it.
      await this.addBook(book);
      return;
    }
    await googleFetch(
      this.getToken,
      `${SHEETS}/${this.spreadsheetId}/values/${enc(`${BOOKS}!A${row}:${BOOK_LAST_COLUMN}${row}`)}?valueInputOption=RAW`,
      { method: 'PUT', json: { values: [bookToRow(book)] } },
    );
  }

  async deleteBook(id: string): Promise<void> {
    const row = await this.findRow(BOOKS, id);
    if (row !== null) await this.deleteRow(BOOKS, row);
  }

  async addTags(tags: string[]): Promise<void> {
    if (tags.length) await this.append(TAGS, tags.map((t) => [t]));
  }

  async deleteTag(tag: string): Promise<void> {
    const row = await this.findRow(TAGS, tag);
    if (row !== null) await this.deleteRow(TAGS, row);
  }

  private async append(sheet: string, values: (string | number)[][]) {
    await googleFetch(
      this.getToken,
      `${SHEETS}/${this.spreadsheetId}/values/${enc(`${sheet}!A1`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      { method: 'POST', json: { values } },
    );
  }

  /** Returns the 1-based row number whose column A equals `key`, or null. */
  private async findRow(sheet: string, key: string): Promise<number | null> {
    const res = await googleFetch<ValueRange>(
      this.getToken,
      `${SHEETS}/${this.spreadsheetId}/values/${enc(`${sheet}!A:A`)}?valueRenderOption=UNFORMATTED_VALUE`,
    );
    const idx = (res.values ?? []).findIndex((r, i) => i > 0 && String(r[0] ?? '').toLowerCase() === key.toLowerCase());
    return idx === -1 ? null : idx + 1;
  }

  private async deleteRow(sheet: string, row: number) {
    await googleFetch(this.getToken, `${SHEETS}/${this.spreadsheetId}:batchUpdate`, {
      method: 'POST',
      json: {
        requests: [
          {
            deleteDimension: {
              range: { sheetId: this.sheetIds[sheet], dimension: 'ROWS', startIndex: row - 1, endIndex: row },
            },
          },
        ],
      },
    });
  }
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function getMeta(getToken: TokenProvider, id: string): Promise<SpreadsheetMeta> {
  return googleFetch<SpreadsheetMeta>(
    getToken,
    `${SHEETS}/${id}?fields=spreadsheetId,spreadsheetUrl,sheets.properties(sheetId,title)`,
  );
}

async function findSpreadsheet(getToken: TokenProvider): Promise<string | null> {
  const q = `appProperties has { key='${APP_PROPERTY.key}' and value='${APP_PROPERTY.value}' } and trashed=false`;
  const res = await googleFetch<{ files: { id: string }[] }>(
    getToken,
    `${DRIVE}?q=${enc(q)}&spaces=drive&orderBy=createdTime&fields=files(id)`,
  );
  return res.files[0]?.id ?? null;
}

async function createSpreadsheet(getToken: TokenProvider): Promise<SpreadsheetMeta> {
  const file = await googleFetch<{ id: string }>(getToken, `${DRIVE}?fields=id`, {
    method: 'POST',
    json: {
      name: 'My Book Journal',
      mimeType: 'application/vnd.google-apps.spreadsheet',
      appProperties: { [APP_PROPERTY.key]: APP_PROPERTY.value },
    },
  });
  return getMeta(getToken, file.id);
}

/** Makes sure the Books and Tags sheets exist with headers; seeds default tags on creation. */
async function ensureSheets(getToken: TokenProvider, meta: SpreadsheetMeta): Promise<SpreadsheetMeta> {
  const titles = new Set(meta.sheets.map((s) => s.properties.title));
  if (titles.has(BOOKS) && titles.has(TAGS)) return meta;

  const requests: unknown[] = [];
  if (!titles.has(BOOKS)) {
    // A freshly created spreadsheet has a single empty "Sheet1"; reuse it for books.
    const blank = meta.sheets.length === 1 && !titles.has(TAGS) ? meta.sheets[0].properties : null;
    if (blank) {
      requests.push({
        updateSheetProperties: {
          properties: { sheetId: blank.sheetId, title: BOOKS, gridProperties: { frozenRowCount: 1 } },
          fields: 'title,gridProperties.frozenRowCount',
        },
      });
    } else {
      requests.push({ addSheet: { properties: { title: BOOKS, gridProperties: { frozenRowCount: 1 } } } });
    }
  }
  if (!titles.has(TAGS)) {
    requests.push({ addSheet: { properties: { title: TAGS, gridProperties: { frozenRowCount: 1 } } } });
  }
  await googleFetch(getToken, `${SHEETS}/${meta.spreadsheetId}:batchUpdate`, { method: 'POST', json: { requests } });

  const data: { range: string; values: string[][] }[] = [];
  if (!titles.has(BOOKS)) data.push({ range: `${BOOKS}!A1`, values: [[...BOOK_COLUMNS]] });
  if (!titles.has(TAGS)) data.push({ range: `${TAGS}!A1`, values: [TAG_COLUMNS, ...DEFAULT_TAGS.map((t) => [t])] });
  await googleFetch(getToken, `${SHEETS}/${meta.spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    json: { valueInputOption: 'RAW', data },
  });

  const updated = await getMeta(getToken, meta.spreadsheetId);
  // Bold the header rows so the sheet is readable by humans too.
  await googleFetch(getToken, `${SHEETS}/${meta.spreadsheetId}:batchUpdate`, {
    method: 'POST',
    json: {
      requests: updated.sheets
        .filter((s) => s.properties.title === BOOKS || s.properties.title === TAGS)
        .map((s) => ({
          repeatCell: {
            range: { sheetId: s.properties.sheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: { userEnteredFormat: { textFormat: { bold: true } } },
            fields: 'userEnteredFormat.textFormat.bold',
          },
        })),
    },
  });
  return updated;
}
