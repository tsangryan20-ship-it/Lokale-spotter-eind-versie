'use client';
import { useState } from 'react';
import { FilterState, Province, Category, ArticleStatus } from '@/types';
import { ScoreInfoModal } from './ScoreInfoModal';
import sourcesRaw from '../../data/sources.json';

// Alphabetically sorted
const PROVINCES: Province[] = [
  'Drenthe', 'Flevoland', 'Friesland', 'Gelderland', 'Groningen',
  'Limburg', 'Nationaal', 'Noord-Brabant', 'Noord-Holland',
  'Overijssel', 'Utrecht', 'Zeeland', 'Zuid-Holland',
];

const CATEGORIES: { value: Category; label: string; emoji: string }[] = [
  { value: '112-alarm',           label: '112 Alarm',             emoji: '🚨' },
  { value: 'algemeen',            label: 'Algemeen',              emoji: '📰' },
  { value: 'conflict-ophef',      label: 'Conflict / Ophef',      emoji: '⚡' },
  { value: 'juice-entertainment', label: 'Juice / Entertainment', emoji: '🍵' },
  { value: 'politiek',            label: 'Politiek',              emoji: '🏛️' },
  { value: 'viraal',              label: 'Viraal',                emoji: '📱' },
];

const STATUSES: { value: ArticleStatus | 'alle'; label: string }[] = [
  { value: 'alle',     label: 'Alle items' },
  { value: 'favoriet', label: '⭐ Favorieten' },
  { value: 'nieuw',    label: 'Nieuw' },
  { value: 'afgewezen', label: '✕ Afgewezen' },
];

// All sources from sources.json, sorted alphabetically by name
const ALL_SOURCES = (sourcesRaw as { id: string; name: string }[])
  .slice()
  .sort((a, b) => a.name.localeCompare(b.name, 'nl'));

interface Props {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  stats: {
    total: number;
    analyzed: number;
    highScore: number;
    todayCount: number;
    byProvince: Record<string, number>;
    byCategory: Record<string, number>;
    bySource: Record<string, number>;
  };
}

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
}

export function FilterSidebar({ filters, onChange, stats }: Props) {
  const [showScoreModal, setShowScoreModal] = useState(false);

  return (
    <>
      <aside className="w-52 shrink-0 space-y-2.5">

        {/* ── Live stats ──────────────────────────────────────────────── */}
        <div className="sidebar-panel">
          <p className="text-[8px] font-bold uppercase tracking-[0.18em] mb-3"
            style={{ color: 'var(--text-muted)' }}>Redactie Monitor</p>
          <div className="grid grid-cols-2 gap-2">
            <MiniStat label="Vandaag"      value={stats.todayCount} accent />
            <MiniStat label="Totaal"       value={stats.total} />
            <MiniStat label="Geanalyseerd" value={stats.analyzed} />
            <MiniStat label="Must-have"    value={stats.highScore} accent />
          </div>
        </div>

        {/* ── Search ──────────────────────────────────────────────────── */}
        <div className="sidebar-panel">
          <input
            type="text"
            placeholder="Zoeken in feed…"
            value={filters.searchQuery}
            onChange={e => onChange({ ...filters, searchQuery: e.target.value })}
            className="w-full text-[11.5px] rounded-lg px-2.5 py-1.5 focus:outline-none transition-colors"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* ── Min score ───────────────────────────────────────────────── */}
        <div className="sidebar-panel">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[8px] font-bold uppercase tracking-[0.18em]"
              style={{ color: 'var(--text-muted)' }}>Min Score</p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--powned-magenta)' }}>
                {filters.minScore}%
              </span>
              <button
                onClick={() => setShowScoreModal(true)}
                title="Uitleg PowNed Score"
                className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold transition-colors"
                style={{
                  background: 'rgba(226,20,139,0.15)',
                  color: 'var(--powned-magenta)',
                  border: '1px solid rgba(226,20,139,0.25)',
                }}
                aria-label="Uitleg over de PowNed score"
              >
                ?
              </button>
            </div>
          </div>
          <input
            type="range" min={0} max={90} step={10}
            value={filters.minScore}
            onChange={e => onChange({ ...filters, minScore: Number(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-[9px] mt-1" style={{ color: 'var(--text-muted)' }}>
            <span>Alles</span><span>90+</span>
          </div>
        </div>

        {/* ── Status ──────────────────────────────────────────────────── */}
        <div className="sidebar-panel">
          <p className="text-[8px] font-bold uppercase tracking-[0.18em] mb-2"
            style={{ color: 'var(--text-muted)' }}>Status</p>
          <div className="space-y-0.5">
            {STATUSES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onChange({ ...filters, status: value })}
                className="w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition-colors"
                style={filters.status === value ? {
                  background: 'rgba(226,20,139,0.14)',
                  color: 'var(--powned-magenta)',
                  fontWeight: 600,
                } : {
                  color: 'var(--text-muted)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Sources ─────────────────────────────────────────────────── */}
        <div className="sidebar-panel">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[8px] font-bold uppercase tracking-[0.18em]"
              style={{ color: 'var(--text-muted)' }}>Bronnen</p>
            {filters.sources.length > 0 && (
              <button
                onClick={() => onChange({ ...filters, sources: [] })}
                className="text-[9px] hover:underline"
                style={{ color: 'var(--powned-magenta)' }}
              >
                × Alles
              </button>
            )}
          </div>
          <div className="space-y-0.5 max-h-48 overflow-y-auto pr-0.5">
            {ALL_SOURCES.map(src => {
              const count  = stats.bySource[src.id] || 0;
              const active = filters.sources.includes(src.id);
              return (
                <label key={src.id} className="flex items-center gap-2 cursor-pointer py-0.5 rounded-lg px-1">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => onChange({ ...filters, sources: toggle(filters.sources, src.id) })}
                    className="rounded shrink-0"
                  />
                  <span className="text-[11px] flex-1 truncate transition-colors"
                    style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {src.name}
                  </span>
                  {count > 0 && (
                    <span className="text-[9px] tabular-nums shrink-0" style={{ color: 'var(--text-xmuted)' }}>
                      {count}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* ── Categories ──────────────────────────────────────────────── */}
        <div className="sidebar-panel">
          <p className="text-[8px] font-bold uppercase tracking-[0.18em] mb-2"
            style={{ color: 'var(--text-muted)' }}>Categorie</p>
          <div className="space-y-0.5">
            {CATEGORIES.map(({ value, label, emoji }) => {
              const count = stats.byCategory[value] || 0;
              const active = filters.categories.includes(value);
              return (
                <label key={value} className="flex items-center gap-2 cursor-pointer py-0.5 rounded-lg px-1">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => onChange({ ...filters, categories: toggle(filters.categories, value) })}
                    className="rounded shrink-0"
                  />
                  <span className="text-[11px] flex-1 transition-colors"
                    style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {emoji} {label}
                  </span>
                  {count > 0 && (
                    <span className="text-[9px] tabular-nums" style={{ color: 'var(--text-xmuted)' }}>
                      {count}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* ── Provinces ───────────────────────────────────────────────── */}
        <div className="sidebar-panel">
          <p className="text-[8px] font-bold uppercase tracking-[0.18em] mb-2"
            style={{ color: 'var(--text-muted)' }}>Regio</p>
          <div className="space-y-0.5 max-h-52 overflow-y-auto pr-0.5">
            {PROVINCES.map(p => {
              const count  = stats.byProvince[p] || 0;
              const active = filters.provinces.includes(p);
              return (
                <label key={p} className="flex items-center gap-2 cursor-pointer py-0.5 rounded-lg px-1">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => onChange({ ...filters, provinces: toggle(filters.provinces, p) })}
                    className="rounded shrink-0"
                  />
                  <span className="text-[11px] flex-1 transition-colors"
                    style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {p}
                  </span>
                  {count > 0 && (
                    <span className="text-[9px] tabular-nums" style={{ color: 'var(--text-xmuted)' }}>
                      {count}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

      </aside>

      {showScoreModal && <ScoreInfoModal onClose={() => setShowScoreModal(false)} />}
    </>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-faint)' }}>
      <p className="text-base font-bold tabular-nums leading-none"
        style={{ color: accent ? 'var(--powned-magenta)' : 'var(--text-secondary)' }}>
        {value.toLocaleString('nl-NL')}
      </p>
      <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  );
}
