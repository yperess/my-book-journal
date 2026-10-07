import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { SheetStore } from '../api/sheetStore';
import { AuthError } from '../lib/google';
import { normalizeTag, uniqueTags } from '../lib/tags';
import type { Book, BookDraft } from '../types';
import { useAuth } from './AuthContext';

type Status = 'idle' | 'loading' | 'ready' | 'error';

interface JournalState {
  status: Status;
  error: string | null;
  books: Book[];
  tags: string[];
  spreadsheetUrl: string | null;
  /** True while showing data from the local cache before the sheet has loaded. */
  fromCache: boolean;
  reload: () => void;
  saveBook: (draft: BookDraft, id?: string) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  addTags: (tags: string[]) => Promise<void>;
  deleteTag: (tag: string) => Promise<void>;
}

const JournalContext = createContext<JournalState | null>(null);
const CACHE_KEY = 'bookJournal.cache.';

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function readCache(email: string): { books: Book[]; tags: string[] } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY + email);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(email: string, books: Book[], tags: string[]) {
  try {
    localStorage.setItem(CACHE_KEY + email, JSON.stringify({ books, tags }));
  } catch {
    // ignore quota / private mode errors
  }
}

export function JournalProvider({ children }: { children: ReactNode }) {
  const { user, expired, getToken, markExpired } = useAuth();
  const email = user?.email ?? '';
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);
  const storeRef = useRef<SheetStore | null>(null);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(null);

  // Show cached data immediately for the signed-in user (also works offline).
  useEffect(() => {
    if (!email) {
      setBooks([]);
      setTags([]);
      storeRef.current = null;
      setStatus('idle');
      return;
    }
    const cached = readCache(email);
    if (cached) {
      setBooks(cached.books);
      setTags(cached.tags);
      setFromCache(true);
    }
  }, [email]);

  useEffect(() => {
    if (!email || expired) return;
    let cancelled = false;
    setStatus('loading');
    setError(null);
    (async () => {
      try {
        const store = storeRef.current ?? (await SheetStore.open(getToken, email));
        storeRef.current = store;
        const data = await store.loadAll();
        if (cancelled) return;
        setSpreadsheetUrl(store.url);
        setBooks(data.books);
        setTags(data.tags);
        setFromCache(false);
        setStatus('ready');
      } catch (e) {
        if (cancelled) return;
        if (e instanceof AuthError) markExpired();
        setError(e instanceof Error ? e.message : String(e));
        setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [email, expired, getToken, markExpired, reloadCount]);

  useEffect(() => {
    if (email && status === 'ready') writeCache(email, books, tags);
  }, [email, status, books, tags]);

  /** Runs a store mutation; turns auth failures into the "expired" state. */
  const run = useCallback(
    async <T,>(fn: (store: SheetStore) => Promise<T>): Promise<T> => {
      const store = storeRef.current;
      if (!store) throw new Error('Your journal is still loading. Try again in a moment.');
      try {
        return await fn(store);
      } catch (e) {
        if (e instanceof AuthError) markExpired();
        throw e;
      }
    },
    [markExpired],
  );

  const addTags = useCallback(
    async (newTags: string[]) => {
      const missing = uniqueTags(newTags).filter((t) => !tags.includes(t));
      if (!missing.length) return;
      await run((s) => s.addTags(missing));
      setTags((prev) => uniqueTags([...prev, ...missing]));
    },
    [run, tags],
  );

  const saveBook = useCallback(
    async (draft: BookDraft, id?: string) => {
      const now = new Date().toISOString();
      const cleanTags = uniqueTags(draft.tags);
      const existing = id ? books.find((b) => b.id === id) : undefined;
      const book: Book = {
        ...draft,
        title: draft.title.trim(),
        tags: cleanTags,
        id: existing?.id ?? newId(),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      // Any brand new tags typed in the editor become account tags.
      await addTags(cleanTags);
      if (existing) {
        await run((s) => s.updateBook(book));
        setBooks((prev) => prev.map((b) => (b.id === book.id ? book : b)));
      } else {
        await run((s) => s.addBook(book));
        setBooks((prev) => [...prev, book]);
      }
    },
    [addTags, books, run],
  );

  const deleteBook = useCallback(
    async (id: string) => {
      await run((s) => s.deleteBook(id));
      setBooks((prev) => prev.filter((b) => b.id !== id));
    },
    [run],
  );

  const deleteTag = useCallback(
    async (tag: string) => {
      const t = normalizeTag(tag);
      await run((s) => s.deleteTag(t));
      setTags((prev) => prev.filter((x) => x !== t));
    },
    [run],
  );

  const reload = useCallback(() => setReloadCount((n) => n + 1), []);

  const value = useMemo<JournalState>(
    () => ({ status, error, books, tags, spreadsheetUrl, fromCache, reload, saveBook, deleteBook, addTags, deleteTag }),
    [status, error, books, tags, spreadsheetUrl, fromCache, reload, saveBook, deleteBook, addTags, deleteTag],
  );
  return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>;
}

export function useJournal(): JournalState {
  const ctx = useContext(JournalContext);
  if (!ctx) throw new Error('useJournal must be used inside JournalProvider');
  return ctx;
}
