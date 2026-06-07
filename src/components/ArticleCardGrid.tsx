'use client';
import { useState } from 'react';
import { Article, ArticleStatus } from '@/types';
import { CategoryTag } from './CategoryTag';
import { ageLabel, scoreTier, TIER_CONFIG, SOURCE_TRUST, freshnessScore } from '@/lib/services/scoring';

interface Props {
  article: Article;
  onStatusChange: (id: string, status: ArticleStatus) => void;
  rank?: number;
}

function formatCount(n?: number): string {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${Math.round(n / 1_000)}K`;
  return String(n);
}

export function ArticleCardGrid({ article, onStatusChange, rank }: Props) {
  const [loading, setLoading] = useState(false);

  const isAnalyzed  = article.analyzed === 1;
  const isAfgewezen = article.status === 'afgewezen';
  const isMustHave  = isAnalyzed && article.powned_score >= 90;
  const isFavoriet  = article.status === 'favoriet';

  const age         = ageLabel(article.published_at);
  const freshness   = freshnessScore(article.published_at);
  const score       = isAnalyzed ? article.powned_score : null;
  const tier        = score !== null ? scoreTier(score) : null;
  const tierCfg     = tier ? TIER_CONFIG[tier] : null;
  const sourceTrust = SOURCE_TRUST[article.source_id];

  const description = isAnalyzed && article.powned_summary
    ? article.powned_summary
    : article.summary || null;

  const handleStatus = async (status: ArticleStatus) => {
    setLoading(true);
    try {
      await fetch(`/api/articles/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      onStatusChange(article.id, status);
    } finally { setLoading(false); }
  };

  // Freshness chip class
  const freshChip = freshness >= 80 ? 'fresh-chip--hot' : freshness >= 45 ? 'fresh-chip--today' : 'fresh-chip--old';

  return (
    <article
      className={`newsroom-card flex flex-col overflow-hidden ${
        isAfgewezen ? 'opacity-25' :
        isMustHave  ? 'newsroom-card--accent' : ''
      }`}
    >
      {/* ── Image ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '16/9', background: 'var(--bg-void)' }}>
        {article.image_url ? (
          <img
            src={article.image_url}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            onError={e => {
              const el = e.target as HTMLImageElement;
              el.style.display = 'none';
              el.parentElement!.style.background = 'linear-gradient(135deg, #0a1020 0%, #0d0d20 100%)';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0a0e20, #090d18)' }}>
            <span className="text-4xl opacity-6">📰</span>
          </div>
        )}

        {/* Must-have top accent */}
        {isMustHave && (
          <div className="absolute top-0 inset-x-0 h-[2px]"
            style={{ background: 'linear-gradient(90deg, #e2148b, #9c2d8f 55%, transparent)' }} />
        )}

        {/* Rank badge */}
        {rank !== undefined && (
          <div className="absolute top-2.5 left-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shadow-lg"
              style={rank <= 3
                ? { background: 'var(--powned-gradient)', color: '#fff' }
                : { background: 'rgba(5,8,15,0.75)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.10)' }}>
              #{rank}
            </div>
          </div>
        )}

        {/* Bottom overlay: score OR "Nieuw" + age */}
        <div
          className="absolute bottom-0 inset-x-0 px-3 pb-2.5 pt-8 flex items-end justify-between"
          style={{ background: 'linear-gradient(to top, rgba(5,8,15,0.90) 0%, transparent 100%)' }}
        >
          {/* Score badge */}
          {tierCfg ? (
            <div
              className="score-badge"
              style={{
                background: tierCfg.bg,
                border: `1px solid ${tierCfg.color}55`,
                color: tierCfg.color,
                boxShadow: tierCfg.glow ? `0 0 14px ${tierCfg.color}44` : 'none',
              }}
            >
              {score! >= 90 ? '🔥' : score! >= 70 ? '⭐' : null}
              {' '}{score}%
              <span className="text-[8px] opacity-70 font-bold tracking-wider">{tierCfg.label}</span>
            </div>
          ) : (
            <div className="score-badge"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', color: 'var(--text-muted)' }}>
              <span className="text-[9px]">NIEUW</span>
            </div>
          )}

          {/* Age chip */}
          <span className={`fresh-chip ${freshChip}`}>{age}</span>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 p-4 gap-2.5">

        {/* Source row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="text-[9px] font-black tracking-[0.14em] uppercase truncate"
              style={{ color: isMustHave ? 'var(--powned-magenta)' : 'var(--score-pot)' }}
            >
              {article.source_name}
            </span>
            {sourceTrust && (
              <span
                className="text-[8px] font-medium px-1.5 py-0.5 rounded shrink-0"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.07)' }}
                title={`Bronbetrouwbaarheid: ${sourceTrust.score}/100 — ${sourceTrust.label}`}
              >
                {sourceTrust.score}
              </span>
            )}
          </div>
          {isFavoriet && (
            <span className="text-[10px] shrink-0">⭐</span>
          )}
        </div>

        {/* Title */}
        <h3
          className="font-black leading-snug line-clamp-3"
          style={{
            fontSize: '13.5px',
            letterSpacing: '-0.015em',
            color: isAfgewezen ? 'var(--text-muted)' : 'var(--text-primary)',
            textDecoration: isAfgewezen ? 'line-through' : 'none',
          }}
        >
          {article.title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>
            {description}
          </p>
        )}

        {/* PowNed angle */}
        {isAnalyzed && article.powned_angle && (
          <p className="text-[10.5px] italic leading-relaxed line-clamp-2"
            style={{ color: 'rgba(168,80,200,0.85)' }}>
            💡 {article.powned_angle}
          </p>
        )}

        {/* Categories + location */}
        {(article.city || article.categories.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {article.city && (
              <span className="text-[9.5px] font-medium" style={{ color: 'var(--text-muted)' }}>
                📍 {article.city}
              </span>
            )}
            {article.categories.slice(0, 2).map(c => <CategoryTag key={c} category={c} />)}
          </div>
        )}

        <div className="flex-1" />

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="pt-3 space-y-2.5" style={{ borderTop: '1px solid var(--border-faint)' }}>

          {/* Metrics */}
          {((article.views ?? 0) > 0 || (article.likes ?? 0) > 0) && (
            <div className="flex items-center gap-4">
              {(article.views ?? 0) > 0 && (
                <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  <span>👁</span>
                  <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {formatCount(article.views)}
                  </span>
                </span>
              )}
              {(article.likes ?? 0) > 0 && (
                <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  <span>❤</span>
                  <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {formatCount(article.likes)}
                  </span>
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex-1 py-1.5 text-[11px] font-bold text-center rounded-lg text-white transition-opacity hover:opacity-88"
              style={{ background: 'var(--powned-gradient)' }}
            >
              Bekijk bron →
            </a>
            {!isAfgewezen && (
              <>
                <ActionBtn
                  onClick={() => handleStatus(isFavoriet ? 'nieuw' : 'favoriet')}
                  active={isFavoriet}
                  disabled={loading}
                  title="Favoriet"
                  activeStyle={{ background: 'rgba(251,191,36,0.14)', borderColor: 'rgba(251,191,36,0.40)', color: '#fbbf24' }}
                >
                  ⭐
                </ActionBtn>
                <ActionBtn
                  onClick={() => handleStatus('afgewezen')}
                  disabled={loading}
                  title="Afwijzen"
                  hoverColor="rgba(239,68,68,0.70)"
                >
                  ✕
                </ActionBtn>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/* ── Small action button ──────────────────────────────────────────────────── */
function ActionBtn({
  children, onClick, disabled, title, active, activeStyle, hoverColor,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  active?: boolean;
  activeStyle?: React.CSSProperties;
  hoverColor?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const base: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    color: 'var(--text-muted)',
  };
  const style = active ? { ...base, ...activeStyle }
    : hovered && hoverColor ? { ...base, color: hoverColor }
    : base;

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
      style={style}
    >
      {children}
    </button>
  );
}
