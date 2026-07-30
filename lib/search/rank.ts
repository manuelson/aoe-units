/** Accent- and case-insensitive, so "elite" matches "élite" and "Jenízaro" matches "jenizaro". */
export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

/** Every string a line can be found by: the line name plus each tier's name. */
export type Searchable = { name: string; units: { name: string }[] };

export const EXACT = 0;
export const PREFIX = 1;
export const WORD_PREFIX = 2;
export const SUBSTRING = 3;
export const SUBSEQUENCE = 4;
export const NO_MATCH = 99;

/** True when every char of `q` appears in `text` in order. Catches "hcan" -> "hand cannoneer". */
function isSubsequence(q: string, text: string): boolean {
  let i = 0;
  for (const ch of text) if (ch === q[i] && ++i === q.length) return true;
  return i === q.length;
}

function scoreOne(q: string, text: string): number {
  if (text === q) return EXACT;
  if (text.startsWith(q)) return PREFIX;
  if (text.split(/[\s-]+/).some((w) => w.startsWith(q))) return WORD_PREFIX;
  if (text.includes(q)) return SUBSTRING;
  if (isSubsequence(q, text)) return SUBSEQUENCE;
  return NO_MATCH;
}

/**
 * Lower is better; NO_MATCH means filter it out. A line scores as its best-matching
 * tier, so typing "paladin" surfaces the Knight line.
 */
export function score(query: string, item: Searchable): number {
  const q = normalize(query);
  if (!q) return EXACT;
  return Math.min(
    scoreOne(q, normalize(item.name)),
    ...item.units.map((u) => scoreOne(q, normalize(u.name)))
  );
}

export function rank<T extends Searchable>(query: string, items: T[]): T[] {
  if (!normalize(query)) return items;
  return items
    .map((item) => ({ item, s: score(query, item) }))
    .filter(({ s }) => s !== NO_MATCH)
    .sort((a, b) => a.s - b.s || a.item.name.localeCompare(b.item.name))
    .map(({ item }) => item);
}
