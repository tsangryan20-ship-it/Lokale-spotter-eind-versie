export type Category =
  | '112-alarm'
  | 'viraal'
  | 'politiek'
  | 'juice-entertainment'
  | 'conflict-ophef'
  | 'algemeen';

export type Province =
  | 'Noord-Holland'
  | 'Zuid-Holland'
  | 'Utrecht'
  | 'Noord-Brabant'
  | 'Gelderland'
  | 'Overijssel'
  | 'Friesland'
  | 'Groningen'
  | 'Drenthe'
  | 'Flevoland'
  | 'Zeeland'
  | 'Limburg'
  | 'Nationaal'
  | 'Onbekend';

export type ArticleStatus = 'nieuw' | 'favoriet' | 'ingepland' | 'doorgestuurd' | 'afgewezen';

export interface Source {
  id: string;
  name: string;
  category: string;
  urls: string[];
  rssUrls?: string[];
  type: 'website' | 'rss' | 'social' | 'zoekwoorden';
}

export interface Article {
  id: string;
  source_id: string;
  source_name: string;
  title: string;
  summary: string;
  url: string;
  published_at: string;
  scraped_at: string;
  image_url?: string;
  // AI enrichment
  powned_score: number;
  powned_summary: string;
  powned_angle: string;
  categories: Category[];
  provinces: Province[];
  tags: string[];
  // Location
  lat?: number;
  lng?: number;
  city?: string;
  // Social metrics
  views?: number;
  likes?: number;
  // Status
  status: ArticleStatus;
  assigned_to?: string;
  notes?: string;
  // Analysis state (0 = pending, 1 = done)
  analyzed?: number;
}

export type SortOption = 'score' | 'date' | 'views_desc' | 'views_asc' | 'likes_desc' | 'likes_asc';

export interface FilterState {
  provinces: Province[];
  categories: Category[];
  sources: string[];
  minScore: number;
  searchQuery: string;
  status: ArticleStatus | 'alle';
  sortBy: SortOption;
}

export interface ScrapedItem {
  source_id: string;
  source_name: string;
  title: string;
  description: string;
  url: string;
  published_at: string;
  image_url?: string;
  views?: number;
  likes?: number;
}

export interface AIAnalysis {
  score: number;
  summary: string;
  angle: string;
  categories: Category[];
  provinces: Province[];
  tags: string[];
  city?: string;
  lat?: number;
  lng?: number;
}

export interface AudioAnalysis {
  transcript: string;
  sentiment_score: number;
  stress_detected: boolean;
  powned_relevance: number;
  summary: string;
  speakers: { id: string; segments: { start: number; end: number; text: string }[] }[];
  trigger_alert: boolean;
  alert_reason?: string;
}

export interface DashboardStats {
  total: number;
  analyzed: number;
  highScore: number;
  todayCount: number;
  byProvince: Record<string, number>;
  byCategory: Record<string, number>;
  bySource: Record<string, number>;
}
