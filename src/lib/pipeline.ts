/**
 * Shared scrape + analyze pipeline.
 * Called directly by instrumentation (cron) and by the API route handlers.
 * No HTTP round-trips: all logic lives here.
 */
import { scrapeRssFeed, scrapeWebPage } from '@/lib/scraper';
import { generateArticleId } from '@/lib/scraper';
import {
  insertArticle,
  getUnanalyzedArticles,
  updateArticleAnalysis,
  getRecentFeedback,
  getRecentTitles,
} from '@/lib/db';
import { deduplicateItems } from '@/lib/services/deduplication';
import { analyzeBatch } from '@/lib/ai/analyzer';
import type { FeedbackExample } from '@/lib/ai/prompts';
import type { ScrapedItem } from '@/types';
import sourcesRaw from '../../data/sources.json';

interface SourceConfig {
  id: string;
  name: string;
  type?: string;
  urls?: string[];
  rssUrls?: string[];
}

const SOURCES = sourcesRaw as SourceConfig[];

// ── Scrape ────────────────────────────────────────────────────────────────────

export async function runScrapeAll(sourceId?: string): Promise<{
  totalNew: number;
  results: { source: string; new: number; total: number }[];
}> {
  const sources = sourceId ? SOURCES.filter(s => s.id === sourceId) : SOURCES;
  let totalNew = 0;
  const results: { source: string; new: number; total: number }[] = [];

  // Load recent titles once for deduplication across the entire run
  const existingTitles = getRecentTitles(48);

  for (const source of sources) {
    let sourceNew = 0;
    let sourceTotal = 0;

    // Collect raw items: RSS-first, fall back to web scraping
    const rawItemsBatches: ScrapedItem[][] = [];

    if (source.rssUrls?.length) {
      for (const feedUrl of source.rssUrls) {
        rawItemsBatches.push(await scrapeRssFeed(source.id, source.name, feedUrl));
      }
    } else if (source.urls?.length) {
      // Web scraping for sources without RSS (e.g. MSN NL)
      for (const pageUrl of source.urls.slice(0, 2)) { // max 2 pages per source
        rawItemsBatches.push(await scrapeWebPage(source.id, source.name, pageUrl));
      }
    } else {
      continue; // no URLs at all — skip
    }

    for (const rawItems of rawItemsBatches) {
      // Deduplicate against already-known titles (48h window) + items scraped this run
      const items = deduplicateItems(rawItems, existingTitles);
      sourceTotal += items.length;

      for (const item of items) {
        const id = generateArticleId(item.url);
        const inserted = insertArticle({
          id,
          source_id: item.source_id,
          source_name: item.source_name,
          title: item.title,
          summary: item.description,
          url: item.url,
          published_at: item.published_at,
          scraped_at: new Date().toISOString(),
          image_url: item.image_url,
          views: item.views ?? 0,
          likes: item.likes ?? 0,
        });
        if (inserted) {
          sourceNew++;
          existingTitles.push(item.title); // keep dedup window current mid-run
        }
      }
    }

    totalNew += sourceNew;
    results.push({ source: source.name, new: sourceNew, total: sourceTotal });
  }

  return { totalNew, results };
}

// ── Analyze ───────────────────────────────────────────────────────────────────

export async function runAnalyzeAll(batchSize = 10): Promise<{ analyzed: number }> {
  const articles = getUnanalyzedArticles(batchSize);
  if (articles.length === 0) return { analyzed: 0 };

  const rawFeedback = getRecentFeedback(20);
  const feedbackExamples: FeedbackExample[] = rawFeedback.map(f => ({
    article_title: f.article_title,
    feedback_type: f.feedback_type,
    reason: f.reason,
    score_at_time: f.score_at_time,
  }));

  const analyses = await analyzeBatch(
    articles.map(a => ({ id: a.id, title: a.title, summary: a.summary ?? '', url: a.url })),
    feedbackExamples
  );

  let analyzed = 0;
  for (const [id, analysis] of analyses) {
    updateArticleAnalysis(id, {
      powned_score: analysis.score,
      powned_summary: analysis.summary,
      powned_angle: analysis.angle,
      categories: analysis.categories as string[],
      provinces: analysis.provinces as string[],
      tags: analysis.tags,
      lat: analysis.lat ?? null,
      lng: analysis.lng ?? null,
      city: analysis.city ?? null,
    });
    analyzed++;
  }

  return { analyzed };
}

// ── Full pipeline (scrape → analyze) ─────────────────────────────────────────

export async function runFullPipeline(): Promise<{
  totalNew: number;
  analyzed: number;
  timestamp: string;
}> {
  const timestamp = new Date().toISOString();
  console.log(`[pipeline] Starting full run at ${timestamp}`);

  const { totalNew } = await runScrapeAll();
  console.log(`[pipeline] Scraped ${totalNew} new articles`);

  // Analyze in batches until all unanalyzed articles are processed (max 50 per run to stay within quota)
  let analyzed = 0;
  const maxBatches = 5;
  for (let i = 0; i < maxBatches; i++) {
    const { analyzed: batchAnalyzed } = await runAnalyzeAll(10);
    analyzed += batchAnalyzed;
    if (batchAnalyzed === 0) break;
    // Small pause between batches to respect rate limits
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`[pipeline] Analyzed ${analyzed} articles. Run complete.`);
  return { totalNew, analyzed, timestamp };
}

// ── Scheduler (called from instrumentation.ts) ────────────────────────────────

let lastRun: Date | null = null;
const MIN_INTERVAL_MS = 60 * 60 * 1000; // guard: skip if ran less than 1 hour ago

/** Returns milliseconds until the next occurrence of HH:MM (local server time). */
function msUntilNextScheduled(hour: number, minute: number): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1); // already past today — aim for tomorrow
  }
  return next.getTime() - now.getTime();
}

export function schedulePipeline() {
  const DAILY_HOUR   = 8;  // 08:30 every day
  const DAILY_MINUTE = 30;
  const DAY_MS       = 24 * 60 * 60 * 1000;

  async function run() {
    const now = new Date();
    if (lastRun && now.getTime() - lastRun.getTime() < MIN_INTERVAL_MS) {
      console.log('[pipeline] Skipping scheduled run — ran too recently');
      return;
    }
    lastRun = now;
    try {
      await runFullPipeline();
    } catch (err) {
      console.error('[pipeline] Scheduled run failed:', err);
    }
  }

  // Daily run at exactly 08:30
  const msToFirstRun = msUntilNextScheduled(DAILY_HOUR, DAILY_MINUTE);
  setTimeout(() => {
    run();
    setInterval(run, DAY_MS); // repeat every 24 h from first fire
  }, msToFirstRun);

  const hh = String(DAILY_HOUR).padStart(2, '0');
  const mm = String(DAILY_MINUTE).padStart(2, '0');
  const firstAt = new Date(Date.now() + msToFirstRun);
  console.log(
    `[pipeline] Scheduler registered — daily at ${hh}:${mm}` +
    ` (first run at ${firstAt.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}` +
    `, in ${Math.round(msToFirstRun / 60000)} min)`
  );
}
