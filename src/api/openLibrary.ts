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

export async function searchBooks(query: string, signal?: AbortSignal): Promise<OpenLibraryResult[]> {
  const params = new URLSearchParams({
    q: query,
    limit: '20',
    fields: 'key,title,author_name,cover_i,first_publish_year',
  });
  const res = await fetch(`https://openlibrary.org/search.json?${params}`, { signal });
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
