'use client';
import { Article, FilterState, ArticleStatus, DashboardStats, SortOption } from '@/types';
import { ArticleCardGrid } from './ArticleCardGrid';
import { FilterSidebar } from './FilterSidebar';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'date',       label: '🕐 Nieuwste eerst' },
  { value: 'score',      label: '🔥 PowNed score' },
  { value: 'views_desc', label: '👁 Meest bekeken' },
  { value: 'views_asc',  label: '👁 Minst bekeken' },
  { value: 'likes_desc', label: '❤ Meest geliket' },
  { value: 'likes_asc',  label: '❤ Minst geliket' },
];

const FRESHNESS_OPTIONS = [
  { value: 1,  label: 'Vandaag' },
  { value: 3,  label: '3 dagen' },
  { value: 7,  label: '7 dagen' },
  { value: 14, label: '14 dagen' },
  { value: 30, label: '30 dagen' },
  { value: 0,  label: 'Alles' },
];

const DEFAULT_FILTERS: FilterState = {
  provinces: [], categories: [], sources: [], minScore: 0,
  searchQuery: '', status: 'alle', sortBy: 'date',
};

interface Props {
  articles: Article[];
  filters: FilterState;
  maxAgeDays: number;
  stats: DashboardStats;
  loading: boolean;
  onFiltersChange: (f: FilterState) => void;
  onMaxAgeDaysChange: (n: number) => void;
  onStatusChange: (id: string, status: ArticleStatus) => void;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function Dashboard({
  articles, filters, maxAgeDays, stats, loading,
  onFiltersChange, onMaxAgeDaysChange, onStatusChange,
}: Props) {
  const mustHave   = articles.filter(a => a.analyzed === 1 && a.powned_score >= 90 && a.status !== 'afgewezen');
  const analyzed   = articles.filter(a => a.analyzed === 1 && !(a.powned_score >= 90 && a.status !== 'afgewezen'));
  const unanalyzed = articles.filter(a => a.analyzed !== 1);
  const hasFilters = filters.provinces.length || filters.categories.length || filters.sources.length
    || filters.minScore > 0 || filters.searchQuery;

  return (
    <div className="flex-1 max-w-screen-2xl mx-auto w-full px-5 py-4 flex gap-5">
      <FilterSidebar filters={filters} onChange={onFiltersChange} stats={stats} />

      <main className="flex-1 min-w-0">

        {/* ── Toolbar ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">

          {/* Left: title + counts */}
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-xs font-bold shrink-0" style={{ color: 'var(--text-secondary)' }}>
              Nieuwsfeed
              {articles.length > 0 && (
                <span className="font-normal ml-1 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  ({articles.length})
                </span>
              )}
            </h2>
            {!loading && articles.length > 0 && (
              <span className="text-[10px] hidden sm:block truncate" style={{ color: 'var(--text-xmuted)' }}>
                {mustHave.length > 0 && `${mustHave.length} must-have · `}
                {analyzed.filter(a => a.status !== 'afgewezen').length} geanalyseerd
                {unanalyzed.length > 0 && ` · ${unanalyzed.length} nieuw`}
              </span>
            )}
            {hasFilters && (
              <button
                onClick={() => onFiltersChange(DEFAULT_FILTERS)}
                className="text-[10px] hover:underline shrink-0 transition-colors"
                style={{ color: 'var(--powned-magenta)' }}
              >
                × Wis filters
              </button>
            )}
          </div>

          {/* Right: freshness + sort */}
          <div className="flex items-center gap-2 shrink-0">
            <Select
              value={String(maxAgeDays)}
              onChange={v => onMaxAgeDaysChange(Number(v))}
              options={FRESHNESS_OPTIONS.map(o => ({ value: String(o.value), label: o.label }))}
              title="Periode"
            />
            <Select
              value={filters.sortBy}
              onChange={v => onFiltersChange({ ...filters, sortBy: v as SortOption })}
              options={SORT_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
              title="Sorteren"
            />
          </div>
        </div>

        {/* ── Content ──────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl shimmer" style={{ height: '400px' }} />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <EmptyState />
        ) : (
          <div>
            {/* Must-have */}
            {mustHave.length > 0 && (
              <section className="mb-8">
                <SectionDivider label={`🔥 Must-have (${mustHave.length})`} accent />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                  {mustHave.map(a => (
                    <ArticleCardGrid key={a.id} article={a} onStatusChange={onStatusChange} />
                  ))}
                </div>
              </section>
            )}

            {/* Analyzed non-must-have */}
            {analyzed.filter(a => a.status !== 'afgewezen').length > 0 && (
              <section className="mb-8">
                {mustHave.length > 0 && (
                  <SectionDivider label={`Geanalyseerd (${analyzed.filter(a => a.status !== 'afgewezen').length})`} />
                )}
                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${mustHave.length > 0 ? 'mt-4' : ''}`}>
                  {analyzed.filter(a => a.status !== 'afgewezen').map(a => (
                    <ArticleCardGrid key={a.id} article={a} onStatusChange={onStatusChange} />
                  ))}
                </div>
              </section>
            )}

            {/* Unanalyzed */}
            {unanalyzed.length > 0 && (
              <section className="mb-8">
                <SectionDivider label={`Binnengehaald · wacht op AI (${unanalyzed.length})`} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                  {unanalyzed.map(a => (
                    <ArticleCardGrid key={a.id} article={a} onStatusChange={onStatusChange} />
                  ))}
                </div>
              </section>
            )}

            {/* Afgewezen */}
            {analyzed.filter(a => a.status === 'afgewezen').length > 0 && (
              <section className="mb-6">
                <SectionDivider label={`Afgewezen (${analyzed.filter(a => a.status === 'afgewezen').length})`} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4 opacity-25">
                  {analyzed.filter(a => a.status === 'afgewezen').map(a => (
                    <ArticleCardGrid key={a.id} article={a} onStatusChange={onStatusChange} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function SectionDivider({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-px flex-1"
        style={{ background: accent ? 'linear-gradient(90deg, rgba(226,20,139,0.40), transparent)' : 'var(--border-faint)' }} />
      <span
        className="text-[8.5px] font-bold uppercase tracking-[0.18em] whitespace-nowrap"
        style={{ color: accent ? 'var(--powned-magenta)' : 'var(--text-xmuted)' }}
      >
        {label}
      </span>
      <div className="h-px flex-1"
        style={{ background: accent ? 'linear-gradient(270deg, rgba(226,20,139,0.40), transparent)' : 'var(--border-faint)' }} />
    </div>
  );
}

function Select({
  value, onChange, options, title,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  title?: string;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      title={title}
      className="text-[11px] rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer transition-colors"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        color: 'var(--text-secondary)',
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="w-14 h-14 rounded-2xl mb-4 flex items-center justify-center"
        style={{ background: 'rgba(226,20,139,0.10)', border: '1px solid rgba(226,20,139,0.18)' }}
      >
        <span className="text-2xl">📰</span>
      </div>
      <h3 className="text-sm font-bold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
        Geen artikelen gevonden
      </h3>
      <p className="text-[11.5px] max-w-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        Pas de tijdsperiode of filters aan. De dagelijkse pipeline draait automatisch om{' '}
        <strong style={{ color: 'var(--text-secondary)' }}>08:30</strong>.
      </p>
    </div>
  );
}
