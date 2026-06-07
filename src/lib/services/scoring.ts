/**
 * Transparent scoring engine for PowNed articles.
 *
 * Every weight and heuristic is documented here.
 * No black-box magic — the score can always be traced back to its components.
 *
 * Final score formula:
 *   composite = freshness * W_FRESHNESS + powned_fit * W_POWNED + source_trust * W_SOURCE + engagement * W_ENGAGE
 *
 * Weights (must sum to 1.0):
 *   W_FRESHNESS  = 0.40  — Recency is king in breaking news
 *   W_POWNED     = 0.35  — AI/heuristic fit score for PowNed audience
 *   W_SOURCE     = 0.15  — Source credibility / editorial standards
 *   W_ENGAGE     = 0.10  — Organic engagement (views + likes)
 */

export const SCORE_WEIGHTS = {
  freshness:    0.40,
  powned_fit:   0.35,
  source_trust: 0.15,
  engagement:   0.10,
} as const;

/**
 * Source trust scores (0–100).
 * Rationale: official broadcasters and newspapers score higher;
 * citizen-based / aggregation sites score lower.
 * These can be overridden via env vars in a later iteration.
 */
export const SOURCE_TRUST: Record<string, { score: number; label: string }> = {
  nos:              { score: 96, label: 'Publieke omroep' },
  politie:          { score: 94, label: 'Officieel' },
  volkskrant:       { score: 90, label: 'Kwaliteitskrant' },
  rtl:              { score: 88, label: 'Publiek omroep' },
  ad:               { score: 86, label: 'Kwaliteitskrant' },
  nunl:             { score: 85, label: 'Digitaal dagblad' },
  telegraaf:        { score: 80, label: 'Nationaal dagblad' },
  nhnieuws:         { score: 80, label: 'Regionale omroep' },
  rijnmond:         { score: 80, label: 'Regionale omroep' },
  omroepbrabant:    { score: 80, label: 'Regionale omroep' },
  rtvnoord:         { score: 80, label: 'Regionale omroep' },
  l1limburg:        { score: 80, label: 'Regionale omroep' },
  hartvannederland: { score: 74, label: 'Commercieel nieuwsmagazine' },
  crimesite:        { score: 70, label: 'Misdaadsite' },
  alarm112:         { score: 68, label: 'Burgerjournalistiek' },
  alarmeringen:     { score: 72, label: 'P2000 meldingen' },
  msn:              { score: 76, label: 'Nieuwsaggregator' },
};

/** Default score for unknown sources */
const DEFAULT_SOURCE_TRUST = 65;

// ── Freshness ────────────────────────────────────────────────────────────────

/**
 * Returns a freshness score (0–100) based on publication age.
 * Heavily front-loaded: very fresh articles score near 100,
 * articles older than 48 hours score close to 0.
 */
export function freshnessScore(publishedAt: string): number {
  const ageMs = Date.now() - new Date(publishedAt).getTime();
  const ageH  = ageMs / 3_600_000;

  if (ageH < 0.5) return 100;
  if (ageH < 1)   return 96;
  if (ageH < 2)   return 90;
  if (ageH < 4)   return 82;
  if (ageH < 8)   return 72;
  if (ageH < 12)  return 60;
  if (ageH < 24)  return 45;
  if (ageH < 48)  return 25;
  if (ageH < 72)  return 12;
  return 4;
}

/** Human-readable age string (Dutch) */
export function ageLabel(publishedAt: string): string {
  const ageMs = Date.now() - new Date(publishedAt).getTime();
  const ageM  = Math.floor(ageMs / 60_000);
  const ageH  = Math.floor(ageMs / 3_600_000);
  const ageD  = Math.floor(ageMs / 86_400_000);

  if (ageM  < 2)  return 'Zojuist';
  if (ageM  < 60) return `${ageM}m geleden`;
  if (ageH  < 24) return `${ageH}u geleden`;
  if (ageD  === 1) return 'Gisteren';
  return `${ageD} dagen geleden`;
}

// ── Engagement ───────────────────────────────────────────────────────────────

/**
 * Normalised engagement score (0–100).
 * Views weight: 60%, likes weight: 40%.
 * Caps: 10_000 views = 100 view score, 500 likes = 100 like score.
 */
export function engagementScore(views: number, likes: number): number {
  const viewsNorm = Math.min(1, views  / 10_000);
  const likesNorm = Math.min(1, likes  / 500);
  return Math.round((viewsNorm * 60 + likesNorm * 40) * 100) / 100;
}

// ── Composite ────────────────────────────────────────────────────────────────

export interface ScoreDimensions {
  freshness:    number;
  powned_fit:   number;
  source_trust: number;
  engagement:   number;
}

export interface CompositeResult extends ScoreDimensions {
  composite: number;
  source_label: string;
}

/**
 * Compute the full composite score for an article.
 *
 * @param pownedAiScore  The Gemini AI score (0–100), or 0 if not yet analyzed
 * @param analyzed       Whether the article has been AI-analyzed
 * @param publishedAt    ISO date string
 * @param sourceId       Source identifier (matches SOURCE_TRUST keys)
 * @param views          Raw view count (0 if unknown)
 * @param likes          Raw like count (0 if unknown)
 */
export function computeCompositeScore(
  pownedAiScore: number,
  analyzed: boolean,
  publishedAt: string,
  sourceId: string,
  views = 0,
  likes = 0,
): CompositeResult {
  const src = SOURCE_TRUST[sourceId];

  const freshness    = freshnessScore(publishedAt);
  // If not analyzed, use a neutral heuristic (40) so freshness drives ranking
  const powned_fit   = analyzed ? pownedAiScore : 40;
  const source_trust = src?.score ?? DEFAULT_SOURCE_TRUST;
  const engagement   = engagementScore(views, likes);

  const composite = Math.round(
    freshness    * SCORE_WEIGHTS.freshness    +
    powned_fit   * SCORE_WEIGHTS.powned_fit   +
    source_trust * SCORE_WEIGHTS.source_trust +
    engagement   * SCORE_WEIGHTS.engagement,
  );

  return {
    freshness,
    powned_fit,
    source_trust,
    engagement,
    source_label: src?.label ?? 'Onbekende bron',
    composite: Math.min(100, Math.max(0, composite)),
  };
}

// ── Score tier ───────────────────────────────────────────────────────────────

export type ScoreTier = 'must-have' | 'sterk' | 'potentieel' | 'laag';

export function scoreTier(score: number): ScoreTier {
  if (score >= 90) return 'must-have';
  if (score >= 70) return 'sterk';
  if (score >= 50) return 'potentieel';
  return 'laag';
}

export const TIER_CONFIG: Record<ScoreTier, { label: string; color: string; bg: string; glow: boolean }> = {
  'must-have':  { label: 'MUST-HAVE',  color: '#e2148b', bg: 'rgba(226,20,139,0.14)', glow: true  },
  'sterk':      { label: 'STERK',      color: '#c0198f', bg: 'rgba(192,25,143,0.10)', glow: false },
  'potentieel': { label: 'POTENTIEEL', color: '#8b3fa8', bg: 'rgba(139,63,168,0.10)', glow: false },
  'laag':       { label: 'LAAG',       color: '#4a3060', bg: 'rgba(74,48,96,0.10)',   glow: false },
};
