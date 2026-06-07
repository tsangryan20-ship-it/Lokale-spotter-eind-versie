'use client';
import { useState, useEffect, useCallback } from 'react';
import { Article, ArticleStatus } from '@/types';
import { ArticleCardGrid } from './ArticleCardGrid';

type RankMode = 'composite' | 'views' | 'likes' | 'score' | 'date';

// Composite score requires AI analysis; falls back to organic for unanalyzed
function compositeScore(a: Article, maxViews: number, maxLikes: number): number {
  const viewsNorm = maxViews > 0 ? (a.views ?? 0) / maxViews : 0;
  const likesNorm = maxLikes > 0 ? (a.likes ?? 0) / maxLikes : 0;
  if (a.analyzed === 1) {
    return a.powned_score * 0.7 + viewsNorm * 100 * 0.2 + likesNorm * 100 * 0.1;
  }
  // No AI score: rank purely by organic signals
  return viewsNorm * 100 * 0.6 + likesNorm * 100 * 0.4;
}

function sortArticles(list: Article[], mode: RankMode): Article[] {
  const copy = [...list];
  const maxViews = Math.max(...copy.map(a => a.views ?? 0), 1);
  const maxLikes = Math.max(...copy.map(a => a.likes ?? 0), 1);
  switch (mode) {
    case 'composite': return copy.sort((a, b) => compositeScore(b, maxViews, maxLikes) - compositeScore(a, maxViews, maxLikes));
    case 'views':     return copy.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
    case 'likes':     return copy.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
    case 'score':     return copy.sort((a, b) => b.powned_score - a.powned_score);
    case 'date':      return copy.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
    default:          return copy;
  }
}

const RANK_MODES: { value: RankMode; label: string }[] = [
  { value: 'composite', label: '🏆 Composite (AI + organisch)' },
  { value: 'views',     label: '👁 Meest bekeken (organisch)' },
  { value: 'likes',     label: '❤ Meest geliket (organisch)' },
  { value: 'score',     label: '🔥 PowNed AI-score' },
  { value: 'date',      label: '🕐 Nieuwste eerst' },
];

interface Props {
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onScrape: () => void;
  onAnalyze: () => void;
  scraping: boolean;
  analyzing: boolean;
}

export function TopNewsToday({ notify, onScrape, onAnalyze, scraping, analyzing }: Props) {
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [rankMode, setRankMode] = useState<RankMode>('views');
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchTopToday = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch ALL today's articles — no AI filter
      const res = await fetch('/api/articles?todayOnly=true&sortBy=views_desc&limit=200');
      const data = await res.json();
      setAllArticles(data.articles || []);
      setLastRefresh(new Date());
    } catch { notify('Fout bij laden top nieuws', 'error'); }
    finally { setLoading(false); }
  }, [notify]);

  useEffect(() => { fetchTopToday(); }, [fetchTopToday]);

  const handleStatusChange = (id: string, status: ArticleStatus) => {
    setAllArticles(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  // Top 10 — organic (all articles, sorted by chosen mode)
  const top10 = sortArticles(allArticles, rankMode).slice(0, 10);
  // Top 20 for the extended grid (positions 11+)
  const rest  = sortArticles(allArticles, rankMode).slice(10, 30);

  const todayLabel   = new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
  const analyzedCount = allArticles.filter(a => a.analyzed === 1).length;

  return (
    <div className="flex-1 max-w-screen-2xl mx-auto w-full px-5 py-4">

      {/* ── Section header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-base font-black gradient-text tracking-wide">Top nieuws van vandaag</h2>
          <p className="text-[11px] text-[#444] mt-0.5 capitalize">
            {todayLabel}
            {lastRefresh && (
              <span className="ml-2 text-[#333]">
                · bijgewerkt {lastRefresh.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {allArticles.length > 0 && (
              <span className="ml-2 text-[#333]">
                · {allArticles.length} artikelen ({analyzedCount} AI-gescoord)
              </span>
            )}
          </p>
        </div>

        {/* Right: rank mode + action buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#333] hidden sm:block">Rangschikken:</span>
            <select
              value={rankMode}
              onChange={e => setRankMode(e.target.value as RankMode)}
              className="bg-[#1a1a1a] text-[11px] text-[#ccc] border border-white/10 rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#e2148b]/40 cursor-pointer transition-colors hover:border-white/20"
            >
              {RANK_MODES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="w-px h-5 bg-white/6 hidden sm:block" />
          <button onClick={fetchTopToday} disabled={loading}
            className="px-3 py-1.5 text-[11px] rounded-xl border border-white/8 bg-[#1a1a1a] text-[#666] hover:text-[#aaa] transition-colors">
            {loading ? '⏳' : '↻'} Vernieuwen
          </button>
          <button onClick={onScrape} disabled={scraping}
            className={`px-3 py-1.5 text-[11px] rounded-xl border font-medium transition-colors ${
              scraping ? 'bg-[#1a1a1a] text-[#444] border-white/5 cursor-wait' :
              'bg-[#1a1a1a] text-[#9c2d8f] border-[#9c2d8f]/25 hover:bg-[#9c2d8f]/12'}`}>
            {scraping ? '⏳' : '🔍'} Scrapen
          </button>
          <button onClick={onAnalyze} disabled={analyzing}
            className={`px-3 py-1.5 text-[11px] rounded-xl border font-medium transition-colors ${
              analyzing ? 'bg-[#1a1a1a] text-[#444] border-white/5 cursor-wait' :
              'text-[#e2148b] border-[#e2148b]/30 hover:bg-[#e2148b]/12'}`}
            style={analyzing ? {} : { background: 'linear-gradient(135deg, rgba(226,20,139,0.12), rgba(156,45,143,0.12))' }}>
            {analyzing ? '🧠 Analyseren…' : '🧠 AI Analyse'}
          </button>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-2xl shimmer" style={{ height: '420px' }} />
          ))}
        </div>
      ) : top10.length === 0 ? (
        <EmptyToday onScrape={onScrape} onAnalyze={onAnalyze} scraping={scraping} analyzing={analyzing} />
      ) : (
        <>
          {/* Organic top 3 podium */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1"
              style={{ background: 'linear-gradient(90deg, #e2148b40, transparent)' }} />
            <span className="text-[9px] font-bold text-[#e2148b] uppercase tracking-[0.15em]">
              🏆 Top 10 vandaag
            </span>
            <div className="h-px flex-1"
              style={{ background: 'linear-gradient(270deg, #e2148b40, transparent)' }} />
          </div>

          {top10.length >= 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
              {top10.slice(0, 3).map((article, idx) => (
                <div key={article.id} className={idx === 0 ? 'sm:order-2' : idx === 1 ? 'sm:order-1' : 'sm:order-3'}>
                  <div className="text-center mb-2">
                    <span className="text-xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                    {idx === 0 && (
                      <span className="text-[9px] font-bold text-[#e2148b] uppercase tracking-widest ml-1.5">#1 Vandaag</span>
                    )}
                  </div>
                  <ArticleCardGrid article={article} onStatusChange={handleStatusChange} rank={idx + 1} />
                </div>
              ))}
            </div>
          )}

          {/* Positions 4–10 */}
          {top10.length > 3 && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-white/4" />
                <span className="text-[9px] text-[#2a2a2a] uppercase tracking-[0.15em]">
                  Positie 4 – {top10.length}
                </span>
                <div className="h-px flex-1 bg-white/4" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8">
                {top10.slice(3).map((article, idx) => (
                  <ArticleCardGrid
                    key={article.id}
                    article={article}
                    onStatusChange={handleStatusChange}
                    rank={idx + 4}
                  />
                ))}
              </div>
            </>
          )}

          {/* Extended feed positions 11-30 */}
          {rest.length > 0 && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-white/4" />
                <span className="text-[9px] text-[#222] uppercase tracking-[0.15em]">
                  Overig nieuws vandaag ({rest.length})
                </span>
                <div className="h-px flex-1 bg-white/4" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {rest.map((article, idx) => (
                  <ArticleCardGrid
                    key={article.id}
                    article={article}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function EmptyToday({ onScrape, onAnalyze, scraping, analyzing }: {
  onScrape: () => void; onAnalyze: () => void; scraping: boolean; analyzing: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl mb-5 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #e2148b15, #9c2d8f15)', border: '1px solid #e2148b20' }}>
        <span className="text-2xl">📅</span>
      </div>
      <h3 className="text-base font-bold text-[#444] mb-1">Nog geen nieuws vandaag</h3>
      <p className="text-[12px] text-[#333] max-w-xs mb-6">
        Scrape de bronnen om direct het nieuws van vandaag te zien — AI-analyse is optioneel.
      </p>
      <div className="flex gap-3">
        <button onClick={onScrape} disabled={scraping}
          className="px-4 py-2 text-[12px] rounded-xl border font-medium transition-colors bg-[#1a1a1a] text-[#9c2d8f] border-[#9c2d8f]/25 hover:bg-[#9c2d8f]/12">
          {scraping ? '⏳ Bezig…' : '🔍 Scrape bronnen'}
        </button>
        <button onClick={onAnalyze} disabled={analyzing}
          className="px-4 py-2 text-[12px] rounded-xl font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #e2148b, #9c2d8f)' }}>
          {analyzing ? '🧠 Analyseren…' : '🧠 AI Analyse (optioneel)'}
        </button>
      </div>
    </div>
  );
}
