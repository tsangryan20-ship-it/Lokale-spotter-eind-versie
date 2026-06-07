import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Article, DashboardStats } from '@/types';

export interface FeedbackRow {
  id: string;
  article_id: string;
  article_title: string;
  article_url: string;
  feedback_type: 'hit' | 'miss';
  reason: string | null;
  score_at_time: number;
  categories: string;
  created_at: string;
}

const DATA_DIR = process.env.DATA_DIR ?? path.join(/*turbopackIgnore: true*/ process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'powned.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      source_name TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT DEFAULT '',
      url TEXT NOT NULL UNIQUE,
      published_at TEXT NOT NULL,
      scraped_at TEXT NOT NULL,
      image_url TEXT,
      powned_score INTEGER DEFAULT 0,
      powned_summary TEXT DEFAULT '',
      powned_angle TEXT DEFAULT '',
      categories TEXT DEFAULT '[]',
      provinces TEXT DEFAULT '[]',
      tags TEXT DEFAULT '[]',
      lat REAL,
      lng REAL,
      city TEXT,
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      status TEXT DEFAULT 'nieuw',
      assigned_to TEXT,
      notes TEXT,
      analyzed INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_articles_score     ON articles(powned_score DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_scraped   ON articles(scraped_at DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_status    ON articles(status);
    CREATE INDEX IF NOT EXISTS idx_articles_analyzed  ON articles(analyzed);
    CREATE INDEX IF NOT EXISTS idx_articles_location  ON articles(lat, lng);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_feedback_loop (
      id TEXT PRIMARY KEY,
      article_id TEXT NOT NULL,
      article_title TEXT NOT NULL,
      article_url TEXT NOT NULL,
      feedback_type TEXT NOT NULL CHECK(feedback_type IN ('hit','miss')),
      reason TEXT,
      score_at_time INTEGER NOT NULL DEFAULT 0,
      categories TEXT DEFAULT '[]',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_feedback_type    ON ai_feedback_loop(feedback_type);
    CREATE INDEX IF NOT EXISTS idx_feedback_created ON ai_feedback_loop(created_at DESC);

    CREATE TABLE IF NOT EXISTS ai_calibration (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      hit_rate REAL DEFAULT 0,
      miss_rate REAL DEFAULT 0,
      category_weights TEXT DEFAULT '{}',
      last_calibrated TEXT,
      total_feedback INTEGER DEFAULT 0
    );
    INSERT OR IGNORE INTO ai_calibration(id) VALUES(1);
  `);

  // Safe column migrations for existing databases
  const cols = (db.prepare("PRAGMA table_info(articles)").all() as { name: string }[]).map(c => c.name);
  const add = (col: string, def: string) => {
    if (!cols.includes(col)) db.exec(`ALTER TABLE articles ADD COLUMN ${col} ${def}`);
  };
  add('lat', 'REAL');
  add('lng', 'REAL');
  add('city', 'TEXT');
  add('views', 'INTEGER DEFAULT 0');
  add('likes', 'INTEGER DEFAULT 0');
}

export function insertArticle(article: Partial<Article> & Pick<Article, 'id' | 'source_id' | 'source_name' | 'title' | 'url' | 'published_at' | 'scraped_at'>): boolean {
  const db = getDb();
  try {
    const result = db.prepare(`
      INSERT OR IGNORE INTO articles
        (id, source_id, source_name, title, summary, url, published_at, scraped_at,
         image_url, powned_score, powned_summary, powned_angle, categories, provinces,
         tags, lat, lng, city, views, likes, status, analyzed)
      VALUES
        (@id, @source_id, @source_name, @title, @summary, @url, @published_at, @scraped_at,
         @image_url, @powned_score, @powned_summary, @powned_angle, @categories, @provinces,
         @tags, @lat, @lng, @city, @views, @likes, @status, @analyzed)
    `).run({
      id: article.id,
      source_id: article.source_id,
      source_name: article.source_name,
      title: article.title,
      summary: article.summary ?? '',
      url: article.url,
      published_at: article.published_at,
      scraped_at: article.scraped_at,
      image_url: article.image_url ?? null,
      powned_score: article.powned_score ?? 0,
      powned_summary: article.powned_summary ?? '',
      powned_angle: article.powned_angle ?? '',
      categories: JSON.stringify(article.categories ?? []),
      provinces: JSON.stringify(article.provinces ?? []),
      tags: JSON.stringify(article.tags ?? []),
      lat: article.lat ?? null,
      lng: article.lng ?? null,
      city: article.city ?? null,
      views: article.views ?? 0,
      likes: article.likes ?? 0,
      status: article.status ?? 'nieuw',
      analyzed: 0,
    });
    return result.changes > 0;
  } catch (err) {
    console.error('insertArticle error:', err);
    return false;
  }
}

export function updateArticleAnalysis(id: string, analysis: {
  powned_score: number;
  powned_summary: string;
  powned_angle: string;
  categories: string[];
  provinces: string[];
  tags: string[];
  lat?: number | null;
  lng?: number | null;
  city?: string | null;
}) {
  getDb().prepare(`
    UPDATE articles SET
      powned_score   = @powned_score,
      powned_summary = @powned_summary,
      powned_angle   = @powned_angle,
      categories     = @categories,
      provinces      = @provinces,
      tags           = @tags,
      lat            = @lat,
      lng            = @lng,
      city           = @city,
      analyzed       = 1
    WHERE id = @id
  `).run({
    ...analysis,
    categories: JSON.stringify(analysis.categories),
    provinces: JSON.stringify(analysis.provinces),
    tags: JSON.stringify(analysis.tags),
    lat: analysis.lat ?? null,
    lng: analysis.lng ?? null,
    city: analysis.city ?? null,
    id,
  });
}

export function updateArticleStatus(id: string, status: string, assignedTo?: string, notes?: string) {
  getDb().prepare(`
    UPDATE articles SET status = @status, assigned_to = @assignedTo, notes = @notes WHERE id = @id
  `).run({ id, status, assignedTo: assignedTo ?? null, notes: notes ?? null });
}

export interface ArticleQuery {
  provinces?: string[];
  categories?: string[];
  sources?: string[];
  minScore?: number;
  status?: string;
  search?: string;
  sortBy?: 'score' | 'date' | 'views_desc' | 'views_asc' | 'likes_desc' | 'likes_asc';
  limit?: number;
  offset?: number;
  withCoords?: boolean;
  todayOnly?: boolean;
  /** Only return articles published within this many days (default: no limit) */
  maxAgeDays?: number;
}

const SORT_CLAUSES: Record<string, string> = {
  score:      'ORDER BY powned_score DESC, scraped_at DESC',
  date:       'ORDER BY published_at DESC',
  views_desc: 'ORDER BY views DESC, powned_score DESC',
  views_asc:  'ORDER BY views ASC, powned_score DESC',
  likes_desc: 'ORDER BY likes DESC, powned_score DESC',
  likes_asc:  'ORDER BY likes ASC, powned_score DESC',
};

export function getArticles(query: ArticleQuery = {}): Article[] {
  const db = getDb();
  let sql = 'SELECT * FROM articles WHERE 1=1';
  const params: Record<string, unknown> = {};

  if (query.minScore !== undefined) {
    sql += ' AND powned_score >= @minScore';
    params.minScore = query.minScore;
  }
  if (query.status && query.status !== 'alle') {
    sql += ' AND status = @status';
    params.status = query.status;
  }
  if (query.search) {
    sql += ' AND (title LIKE @search OR powned_summary LIKE @search OR tags LIKE @search OR city LIKE @search)';
    params.search = `%${query.search}%`;
  }
  if (query.sources?.length) {
    const placeholders = query.sources.map((_, i) => `@src${i}`).join(',');
    query.sources.forEach((s, i) => { params[`src${i}`] = s; });
    sql += ` AND source_id IN (${placeholders})`;
  }
  if (query.withCoords) {
    sql += ' AND lat IS NOT NULL AND lng IS NOT NULL';
  }
  if (query.todayOnly) {
    const today = new Date().toISOString().split('T')[0];
    sql += ` AND (scraped_at >= '${today}' OR published_at >= '${today}')`;
  }
  if (query.maxAgeDays !== undefined) {
    const cutoff = new Date(Date.now() - query.maxAgeDays * 86_400_000).toISOString();
    sql += ` AND published_at >= '${cutoff}'`;
  }

  sql += ' ' + (SORT_CLAUSES[query.sortBy ?? 'score'] ?? SORT_CLAUSES.score);
  sql += ` LIMIT ${query.limit ?? 200} OFFSET ${query.offset ?? 0}`;

  const rows = db.prepare(sql).all(params) as Record<string, unknown>[];

  return rows.map(deserializeArticle).filter(article => {
    if (query.provinces?.length && !article.provinces.some(p => query.provinces!.includes(p))) return false;
    if (query.categories?.length && !article.categories.some(c => query.categories!.includes(c))) return false;
    return true;
  });
}

/**
 * Returns the titles of articles scraped within the last `withinHours` hours.
 * Used by the deduplication service to avoid inserting near-duplicate stories.
 */
export function getRecentTitles(withinHours = 48): string[] {
  const cutoff = new Date(Date.now() - withinHours * 3_600_000).toISOString();
  const rows = getDb()
    .prepare(`SELECT title FROM articles WHERE scraped_at >= ? ORDER BY scraped_at DESC LIMIT 2000`)
    .all(cutoff) as { title: string }[];
  return rows.map(r => r.title);
}

export function getUnanalyzedArticles(limit = 10): Article[] {
  const rows = getDb().prepare(
    'SELECT * FROM articles WHERE analyzed = 0 ORDER BY scraped_at DESC LIMIT ?'
  ).all(limit) as Record<string, unknown>[];
  return rows.map(deserializeArticle);
}

export function getStats(): DashboardStats {
  const db = getDb();
  const total = (db.prepare('SELECT COUNT(*) as c FROM articles').get() as { c: number }).c;
  const analyzed = (db.prepare('SELECT COUNT(*) as c FROM articles WHERE analyzed = 1').get() as { c: number }).c;
  const highScore = (db.prepare('SELECT COUNT(*) as c FROM articles WHERE powned_score >= 70').get() as { c: number }).c;
  const today = new Date().toISOString().split('T')[0];
  const todayCount = (db.prepare(`SELECT COUNT(*) as c FROM articles WHERE scraped_at >= '${today}'`).get() as { c: number }).c;

  const byProvince: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const bySource: Record<string, number> = {};

  const analyzed_rows = db.prepare('SELECT provinces, categories FROM articles WHERE analyzed = 1').all() as { provinces: string; categories: string }[];
  for (const row of analyzed_rows) {
    const provinces: string[] = JSON.parse(row.provinces || '[]');
    const categories: string[] = JSON.parse(row.categories || '[]');
    for (const p of provinces) byProvince[p] = (byProvince[p] || 0) + 1;
    for (const c of categories) byCategory[c] = (byCategory[c] || 0) + 1;
  }

  const source_rows = db.prepare('SELECT source_id FROM articles').all() as { source_id: string }[];
  for (const row of source_rows) {
    bySource[row.source_id] = (bySource[row.source_id] || 0) + 1;
  }

  return { total, analyzed, highScore, todayCount, byProvince, byCategory, bySource };
}

// ── Maintenance ────────────────────────────────────────────────────────────

export function purgeDemoArticles(): number {
  const result = getDb().prepare(`DELETE FROM articles WHERE id LIKE 'demo_%'`).run();
  return result.changes;
}

export function purgeAllArticles(): number {
  const result = getDb().prepare(`DELETE FROM articles`).run();
  return result.changes;
}

// ── Feedback ───────────────────────────────────────────────────────────────

export function insertFeedback(fb: Omit<FeedbackRow, 'created_at'>): void {
  getDb().prepare(`
    INSERT OR REPLACE INTO ai_feedback_loop
      (id, article_id, article_title, article_url, feedback_type, reason, score_at_time, categories, created_at)
    VALUES
      (@id, @article_id, @article_title, @article_url, @feedback_type, @reason, @score_at_time, @categories, @created_at)
  `).run({ ...fb, created_at: new Date().toISOString() });
}

export function getRecentFeedback(limit = 20): FeedbackRow[] {
  return getDb().prepare(
    `SELECT * FROM ai_feedback_loop ORDER BY created_at DESC LIMIT ?`
  ).all(limit) as FeedbackRow[];
}

export function getFeedbackForArticle(articleId: string): FeedbackRow | null {
  return (getDb().prepare(
    `SELECT * FROM ai_feedback_loop WHERE article_id = ? ORDER BY created_at DESC LIMIT 1`
  ).get(articleId) as FeedbackRow | undefined) ?? null;
}

export interface CalibrationData {
  hit_rate: number;
  miss_rate: number;
  category_weights: Record<string, number>;
  last_calibrated: string | null;
  total_feedback: number;
}

export function getCalibration(): CalibrationData {
  const row = getDb().prepare(`SELECT * FROM ai_calibration WHERE id = 1`).get() as {
    hit_rate: number; miss_rate: number; category_weights: string;
    last_calibrated: string | null; total_feedback: number;
  };
  return {
    hit_rate: row.hit_rate,
    miss_rate: row.miss_rate,
    category_weights: JSON.parse(row.category_weights || '{}'),
    last_calibrated: row.last_calibrated,
    total_feedback: row.total_feedback,
  };
}

export function updateCalibration(data: Omit<CalibrationData, 'last_calibrated'>): void {
  getDb().prepare(`
    UPDATE ai_calibration SET
      hit_rate = @hit_rate, miss_rate = @miss_rate,
      category_weights = @category_weights,
      total_feedback = @total_feedback,
      last_calibrated = @last_calibrated
    WHERE id = 1
  `).run({
    ...data,
    category_weights: JSON.stringify(data.category_weights),
    last_calibrated: new Date().toISOString(),
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────

function deserializeArticle(row: Record<string, unknown>): Article {
  return {
    ...row,
    categories: JSON.parse((row.categories as string) || '[]'),
    provinces: JSON.parse((row.provinces as string) || '[]'),
    tags: JSON.parse((row.tags as string) || '[]'),
    lat: row.lat as number | undefined,
    lng: row.lng as number | undefined,
    views: (row.views as number) || 0,
    likes: (row.likes as number) || 0,
  } as Article;
}
