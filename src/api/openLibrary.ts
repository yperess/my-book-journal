export interface OpenLibraryResult {
  key: string;
  title: string;
  authors: string[];
  coverId: number | null;
  firstPublishYear: number | null;
}

interface SearchDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
}

/** Thrown when Open Library can't be reached or is temporarily unavailable. */
export class OpenLibraryUnavailableError extends Error {
  constructor() {
    super('Couldn’t reach Open Library. Check your connection and try again.');
    this.name = 'OpenLibraryUnavailableError';
  }
}

const RETRY_DELAY_MS = 800;

/** Network failures ("Failed to fetch") and 429/5xx responses are worth one retry. */
function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

async function fetchWithRetry(url: string, signal?: AbortSignal, retries = 1): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    let res: Response | undefined;
    try {
      res = await fetch(url, { signal });
    } catch (e) {
      if (signal?.aborted) throw e;
      if (attempt >= retries) throw new OpenLibraryUnavailableError();
    }
    if (res) {
      if (!isRetryableStatus(res.status)) return res;
      if (attempt >= retries) throw new OpenLibraryUnavailableError();
    }
    await sleep(RETRY_DELAY_MS * (attempt + 1), signal);
  }
}

export async function searchBooks(query: string, signal?: AbortSignal): Promise<OpenLibraryResult[]> {
  const params = new URLSearchParams({
    q: query,
    limit: '20',
    fields: 'key,title,author_name,cover_i,first_publish_year',
  });
  const res = await fetchWithRetry(`https://openlibrary.org/search.json?${params}`, signal);
  if (!res.ok) throw new Error(`Open Library search failed (${res.status})`);
  const data = (await res.json()) as { docs: SearchDoc[] };
  return data.docs.map((d) => ({
    key: d.key,
    title: d.title,
    authors: d.author_name ?? [],
    coverId: d.cover_i ?? null,
    firstPublishYear: d.first_publish_year ?? null,
  }));
}

export function coverUrl(coverId: number | null, size: 'S' | 'M' | 'L' = 'M'): string | undefined {
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg` : undefined;
}

export function workUrl(olKey: string): string | undefined {
  return olKey ? `https://openlibrary.org${olKey}` : undefined;
}
