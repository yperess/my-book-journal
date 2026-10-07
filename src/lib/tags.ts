export const DEFAULT_TAGS = [
  'funny',
  'romantic',
  'vulgar',
  'sad',
  'heartwarming',
  'inspiring',
  'thought-provoking',
  'suspenseful',
  'scary',
  'dark',
  'cozy',
  'slow',
  'page-turner',
  'confusing',
];

/** Tags are stored comma-separated in the sheet, so commas are not allowed in a tag. */
export function normalizeTag(raw: string): string {
  return raw.replace(/,/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

export function uniqueTags(tags: Iterable<string>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tags) {
    const n = normalizeTag(t);
    if (n && !seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out;
}
