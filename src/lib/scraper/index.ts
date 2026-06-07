import RSSParser from 'rss-parser';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapedItem } from '@/types';

const parser = new RSSParser({
  timeout: 12000,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PowNedBot/1.0; +https://powned.tv)' },
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: false }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
      ['enclosure', 'enclosure', { keepArray: false }],
    ],
  },
});

const AXIOS_CONFIG = {
  timeout: 12000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.7',
    'Cache-Control': 'no-cache',
  },
};

export async function scrapeRssFeed(sourceId: string, sourceName: string, feedUrl: string): Promise<ScrapedItem[]> {
  try {
    const feed = await parser.parseURL(feedUrl);
    const items: ScrapedItem[] = [];

    for (const item of feed.items.slice(0, 50)) {
      if (!item.title || !item.link || !isValidArticleUrl(item.link)) continue;

      const rawItem = item as unknown as RSSParser.Item & Record<string, unknown>;
      const description = cleanText(
        item.contentSnippet || item.content || item.summary || ''
      );
      const pubDate = item.pubDate || item.isoDate || new Date().toISOString();
      const image = extractBestImage(rawItem);

      items.push({
        source_id: sourceId,
        source_name: sourceName,
        title: cleanText(item.title),
        description,
        url: item.link,
        published_at: new Date(pubDate).toISOString(),
        image_url: image,
      });
    }

    return items;
  } catch (err) {
    console.warn(`RSS scrape failed [${sourceId}] ${feedUrl}: ${(err as Error).message}`);
    return [];
  }
}

export async function scrapeWebPage(sourceId: string, sourceName: string, pageUrl: string): Promise<ScrapedItem[]> {
  try {
    const response = await axios.get(pageUrl, AXIOS_CONFIG);
    const $ = cheerio.load(response.data);
    const items: ScrapedItem[] = [];
    const seen = new Set<string>();

    const selectors = [
      'article a[href]', '.article a[href]', '[class*="article"] a[href]',
      '[class*="news"] a[href]', 'h2 a[href]', 'h3 a[href]',
      '.headline a[href]', '[class*="title"] a[href]',
    ];

    for (const selector of selectors) {
      $(selector).each((_, el) => {
        const $el = $(el);
        const href = $el.attr('href');
        const text = $el.text().trim();
        if (!href || !text || text.length < 20) return;

        const fullUrl = href.startsWith('http') ? href : (() => {
          try { return new URL(href, pageUrl).href; } catch { return null; }
        })();
        if (!fullUrl || seen.has(fullUrl) || !isValidArticleUrl(fullUrl)) return;
        seen.add(fullUrl);

        // Extract nearby image
        const $parent = $el.closest('article, [class*="item"], [class*="card"]');
        const imgSrc = $parent.find('img').first().attr('src') || undefined;
        const image = imgSrc?.startsWith('http') ? imgSrc :
          imgSrc ? (() => { try { return new URL(imgSrc, pageUrl).href; } catch { return undefined; } })() :
          undefined;

        items.push({
          source_id: sourceId,
          source_name: sourceName,
          title: cleanText(text),
          description: cleanText($parent.find('p').first().text()),
          url: fullUrl,
          published_at: new Date().toISOString(),
          image_url: image,
        });

        if (items.length >= 40) return false;
      });
      if (items.length >= 30) break;
    }

    return items;
  } catch (err) {
    console.warn(`Web scrape failed [${sourceId}] ${pageUrl}: ${(err as Error).message}`);
    return [];
  }
}

// Try to fetch full article content; fall back to archive.org if blocked
export async function fetchArticleContent(url: string): Promise<string> {
  try {
    const response = await axios.get(url, { ...AXIOS_CONFIG, timeout: 8000 });
    if (response.status === 200) {
      const $ = cheerio.load(response.data);

      // Remove noise
      $('script, style, nav, header, footer, aside, [class*="ad"], [id*="ad"]').remove();

      // Try article-specific selectors
      const selectors = ['article', '[class*="article-body"]', '[class*="article__body"]', 'main', '.content'];
      for (const sel of selectors) {
        const text = $(sel).text().trim();
        if (text.length > 200) return cleanText(text).slice(0, 3000);
      }

      return cleanText($('body').text()).slice(0, 3000);
    }
  } catch { /* try fallback */ }

  // Archive.org fallback
  try {
    const archiveUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`;
    const archiveResponse = await axios.get(archiveUrl, { timeout: 5000 });
    const closestUrl = archiveResponse.data?.archived_snapshots?.closest?.url;
    if (closestUrl) {
      const archived = await axios.get(closestUrl, { ...AXIOS_CONFIG, timeout: 8000 });
      const $ = cheerio.load(archived.data);
      $('script, style, nav, header, footer, aside').remove();
      return cleanText($('article, main, body').first().text()).slice(0, 3000);
    }
  } catch { /* silent */ }

  return '';
}

export function generateArticleId(url: string): string {
  const hash = Buffer.from(url).toString('base64').slice(0, 18).replace(/[/+=]/g, 'x');
  return `art_${hash}`;
}

// Returns true for well-formed https/http article URLs
export function isValidArticleUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    if (!parsed.hostname.includes('.')) return false;
    // Reject obvious non-article paths
    if (/\.(rss|xml|json|css|js|ico|png|jpg|jpeg|gif|webp|svg|pdf)$/i.test(parsed.pathname)) return false;
    return true;
  } catch {
    return false;
  }
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractBestImage(item: RSSParser.Item & Record<string, unknown>): string | undefined {
  // Check various RSS image fields
  const mc = item.mediaContent as { $?: { url?: string } } | undefined;
  if (mc?.$?.url) return mc.$.url;

  const mt = item.mediaThumbnail as { $?: { url?: string } } | undefined;
  if (mt?.$?.url) return mt.$.url;

  const enc = item.enclosure as { url?: string } | undefined;
  if (enc?.url && /\.(jpg|jpeg|png|webp|gif)/i.test(enc.url)) return enc.url;

  // Try to find image in content
  const content = item.content || item['content:encoded'] as string | undefined || '';
  if (content) {
    const match = content.match(/src=["']([^"']+\.(?:jpg|jpeg|png|webp))[^"']*/i);
    if (match) return match[1];
  }

  return undefined;
}
