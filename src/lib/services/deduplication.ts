/**
 * Smart deduplication for scraped news articles.
 *
 * Strategy (in order):
 *  1. URL exact match — handled by SQLite UNIQUE constraint in `insertArticle`
 *  2. Normalised-title Jaccard similarity — catches same story from different sources
 *
 * Threshold: ≥ 0.65 Jaccard similarity → considered duplicate.
 * This is conservative enough to allow genuinely different stories that share
 * a few keywords (e.g. "Amsterdam politie") while filtering clear copy-cats.
 */

// Dutch stopwords to strip before comparing
const STOPWORDS = new Set([
  'de', 'het', 'een', 'van', 'in', 'is', 'op', 'te', 'dat', 'die', 'en',
  'voor', 'met', 'zijn', 'er', 'om', 'maar', 'bij', 'ook', 'aan', 'nog',
  'niet', 'wordt', 'kan', 'heeft', 'was', 'ze', 'hij', 'we', 'na', 'al',
  'naar', 'door', 'over', 'nu', 'als', 'zo', 'dan', 'dit', 'tot', 'uit',
  'bij', 'ook', 'worden', 'worden', 'zijn', 'hebben', 'moet', 'naar',
]);

/** Lowercase, strip punctuation, remove short/stopword tokens */
export function tokenise(title: string): Set<string> {
  const tokens = title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));
  return new Set(tokens);
}

/** Jaccard similarity between two token sets */
export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  const intersection = [...a].filter(t => b.has(t)).length;
  const union = new Set([...a, ...b]).size;
  return intersection / union;
}

/** Returns true if `newTitle` is likely the same story as any title in `existingTitles` */
export function isDuplicate(
  newTitle: string,
  existingTitles: string[],
  threshold = 0.65,
): boolean {
  const newTokens = tokenise(newTitle);
  return existingTitles.some(t => jaccard(newTokens, tokenise(t)) >= threshold);
}

/**
 * Filter a list of incoming items against a set of already-known titles.
 * Returns only items that are not duplicates of each other *or* of existing titles.
 * Processes items in order — the first occurrence wins.
 */
export function deduplicateItems<T extends { title: string }>(
  incoming: T[],
  existingTitles: string[],
  threshold = 0.65,
): T[] {
  const accepted: T[] = [];
  const seenTitles = [...existingTitles];

  for (const item of incoming) {
    if (!isDuplicate(item.title, seenTitles, threshold)) {
      accepted.push(item);
      seenTitles.push(item.title);
    }
  }

  return accepted;
}
