import { afterEach, describe, expect, it, vi } from 'vitest';
import { OpenLibraryUnavailableError, searchBooks } from './openLibrary';

const ok = () =>
  new Response(JSON.stringify({ docs: [{ key: '/works/OL1W', title: 'Dune', author_name: ['Frank Herbert'] }] }), {
    status: 200,
  });

afterEach(() => vi.unstubAllGlobals());

describe('searchBooks', () => {
  it('retries once after a network error', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce(ok());
    vi.stubGlobal('fetch', fetchMock);
    const results = await searchBooks('dune');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(results[0].title).toBe('Dune');
  });

  it('retries once after a 503', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response('', { status: 503 })).mockResolvedValueOnce(ok());
    vi.stubGlobal('fetch', fetchMock);
    await expect(searchBooks('dune')).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('gives a friendly error when both attempts fail', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);
    await expect(searchBooks('dune')).rejects.toBeInstanceOf(OpenLibraryUnavailableError);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry client errors', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 400 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(searchBooks('dune')).rejects.toThrow('Open Library search failed (400)');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not retry when aborted', async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn().mockImplementation(() => {
      controller.abort();
      return Promise.reject(new DOMException('Aborted', 'AbortError'));
    });
    vi.stubGlobal('fetch', fetchMock);
    await expect(searchBooks('dune', controller.signal)).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
