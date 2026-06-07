'use client';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { Article, FilterState, ArticleStatus, DashboardStats, SortOption } from '@/types';

const NewsMap = dynamic(() => import('@/components/NewsMap').then(m => m.NewsMap), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#e2148b]/30 border-t-[#e2148b] animate-spin mx-auto mb-3" />
        <p className="text-sm text-[#444]">Kaart laden…</p>
      </div>
    </div>
  ),
});

type Tab = 'dashboard' | 'map';

const DEFAULT_FILTERS: FilterState = {
  provinces: [], categories: [], sources: [], minScore: 0,
  searchQuery: '', status: 'alle', sortBy: 'date',
};

const DEFAULT_STATS: DashboardStats = {
  total: 0, analyzed: 0, highScore: 0, todayCount: 0,
  byProvince: {}, byCategory: {}, bySource: {},
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // ── Shared article state (single source of truth) ─────────────────────────
  const [articles, setArticles] = useState<Article[]>([]);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [maxAgeDays, setMaxAgeDays] = useState<number>(14);
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const notify = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4500);
  }, []);

  // ── Fetch articles ─────────────────────────────────────────────────────────
  const fetchArticles = useCallback(async () => {
    const params = new URLSearchParams();
    if (filters.provinces.length)  params.set('provinces',  filters.provinces.join(','));
    if (filters.categories.length) params.set('categories', filters.categories.join(','));
    if (filters.sources.length)    params.set('sources',    filters.sources.join(','));
    if (filters.minScore > 0)      params.set('minScore',   String(filters.minScore));
    if (filters.status !== 'alle') params.set('status',     filters.status);
    if (filters.searchQuery)       params.set('search',     filters.searchQuery);
    if (maxAgeDays > 0)            params.set('maxAgeDays', String(maxAgeDays));
    params.set('sortBy', filters.sortBy);
    params.set('limit',  '500');

    try {
      const res  = await fetch(`/api/articles?${params}`);
      const data = await res.json();
      setArticles(data.articles || []);
      setLastUpdated(new Date());
    } catch { notify('Fout bij laden van artikelen', 'error'); }
    finally  { setLoading(false); }
  }, [filters, maxAgeDays, notify]);

  // ── Fetch stats ────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/articles?stats=true');
      setStats(await res.json());
    } catch { /* silent */ }
  }, []);

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, 30_000);
    return () => clearInterval(id);
  }, [fetchStats]);

  // Re-sync on pipeline refresh event
  useEffect(() => {
    const handler = async () => { await fetchArticles(); await fetchStats(); };
    window.addEventListener('powned:refresh', handler);
    return () => window.removeEventListener('powned:refresh', handler);
  }, [fetchArticles, fetchStats]);

  // ── Status change handler (shared with both tabs) ─────────────────────────
  const handleStatusChange = useCallback((id: string, status: ArticleStatus) => {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }, []);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        lastUpdated={lastUpdated}
        stats={{ total: stats.total, todayCount: stats.todayCount }}
      />

      {/* Toast */}
      {notification && (
        <div className={`fixed top-14 right-4 z-50 px-4 py-2.5 rounded-xl text-[12px] font-medium shadow-xl border transition-all animate-pulse ${
          notification.type === 'success' ? 'bg-green-900/80 text-green-300 border-green-700/40' :
          notification.type === 'error'   ? 'bg-red-900/80 text-red-300 border-red-700/40' :
          'bg-[#1a1a1a] text-[#ccc] border-white/8'
        }`} style={{ animationIterationCount: 1 }}>
          {notification.msg}
        </div>
      )}

      {/* Tab content */}
      <div className="flex-1 flex flex-col">
        <div className={activeTab === 'dashboard' ? 'flex-1 flex flex-col' : 'hidden'}>
          <Dashboard
            articles={articles}
            filters={filters}
            maxAgeDays={maxAgeDays}
            stats={stats}
            loading={loading}
            onFiltersChange={setFilters}
            onMaxAgeDaysChange={setMaxAgeDays}
            onStatusChange={handleStatusChange}
            notify={notify}
          />
        </div>
        {activeTab === 'map' && <NewsMap articles={articles} />}
      </div>

      {/* Footer */}
      <footer className="py-2.5 px-6 flex items-center justify-between"
        style={{ borderTop: '1px solid var(--border-faint)' }}>
        <div className="flex items-center gap-3">
          <span className="text-[10px]" style={{ color: 'var(--text-xmuted)' }}>PowNed Redactie Agent</span>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full live-dot" style={{ background: 'rgba(226,20,139,0.5)' }} />
            <span className="text-[9px]" style={{ color: 'var(--text-xmuted)' }}>Live</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#222]">Engineered & Crafted by</span>
          <div className="flex items-center gap-1.5 group">
            <div className="w-4 h-4 rounded flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ background: 'linear-gradient(135deg, #FF4D00, #FE3D25)' }}>
              <span className="text-white font-black text-[8px] leading-none">N</span>
            </div>
            <span className="text-[10px] font-bold" style={{ color: '#FF4D00' }}>Note It Agency</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
