'use client';
import { Article, ArticleStatus } from '@/types';
import { ScoreBadge, ScoreBar } from './ScoreBar';
import { CategoryTag, ProvinceTag } from './CategoryTag';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useState } from 'react';

interface Props { article: Article; onStatusChange: (id: string, status: ArticleStatus) => void; }

const STATUS_COLORS: Record<ArticleStatus, string> = {
  nieuw: 'text-[#555]', favoriet: 'text-yellow-400', ingepland: 'text-blue-400',
  doorgestuurd: 'text-green-400', afgewezen: 'text-red-500/50',
};
const STATUS_LABELS: Record<ArticleStatus, string> = {
  nieuw: 'Nieuw', favoriet: '⭐ Favoriet', ingepland: '📅 Ingepland',
  doorgestuurd: '📤 Doorgestuurd', afgewezen: '✗ Afgewezen',
};

function formatViews(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return String(n);
}

type FeedbackState = 'none' | 'hit' | 'miss' | 'sending';

export function ArticleCard({ article, onStatusChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>('none');
  const [showMissReason, setShowMissReason] = useState(false);
  const [missReason, setMissReason] = useState('');

  const timeAgo = formatDistanceToNow(new Date(article.published_at), { addSuffix: true, locale: nl });
  const isAnalyzed = article.analyzed === 1;
  const isHigh = isAnalyzed && article.powned_score >= 90;
  const isAfgewezen = article.status === 'afgewezen';

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

  const submitFeedback = async (type: 'hit' | 'miss') => {
    setFeedback('sending');
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: article.id,
          articleTitle: article.title,
          articleUrl: article.url,
          feedbackType: type,
          reason: type === 'miss' ? missReason || null : null,
          scoreAtTime: article.powned_score,
          categories: article.categories,
        }),
      });
      setFeedback(type);
      setShowMissReason(false);
    } catch {
      setFeedback('none');
    }
  };

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className={`article-card rounded-xl border overflow-hidden cursor-pointer transition-all duration-200 ${
        isAfgewezen ? 'opacity-35 border-white/4 bg-[#131313]' :
        !isAnalyzed ? 'border-white/5 bg-[#161616] hover:border-white/10 hover:bg-[#1a1a1a]' :
        isHigh ? 'border-[#e2148b]/45 bg-[#1a1a1a] hover:border-[#e2148b]/75 hover:bg-[#1e1414]' :
        'border-white/6 bg-[#1a1a1a] hover:border-white/12 hover:bg-[#1d1d1d]'
      }`}
    >
      {/* Score accent line — only for analyzed articles */}
      {isAnalyzed && !isAfgewezen && article.powned_score >= 40 && (
        <div className="h-0.5" style={{ background: `linear-gradient(90deg, #e2148b ${article.powned_score}%, transparent)` }} />
      )}
      {/* Pending analysis accent line */}
      {!isAnalyzed && !isAfgewezen && (
        <div className="h-0.5 bg-white/4" />
      )}

      <div className="flex gap-0">
        {/* Thumbnail */}
        {article.image_url && (
          <div className="shrink-0 w-28 h-auto overflow-hidden bg-[#111]" style={{ minHeight: '80px' }}>
            <img
              src={article.image_url}
              alt=""
              className="w-full h-full object-cover"
              style={{ minHeight: '80px', maxHeight: '120px' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 p-3">
          <div className="flex items-start gap-2">
            {isAnalyzed ? (
              <ScoreBadge score={article.powned_score} />
            ) : (
              <div className="shrink-0 w-8 h-8 rounded-lg bg-white/4 border border-white/6 flex items-center justify-center">
                <span className="text-[13px]">⏳</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className={`font-semibold text-sm leading-snug ${isAfgewezen ? 'line-through text-[#444]' : !isAnalyzed ? 'text-[#aaa]' : 'text-[#f0f0f0]'}`}>
                  {article.title}
                </h3>
                <span className={`shrink-0 text-[11px] font-medium ${STATUS_COLORS[article.status]}`}>
                  {STATUS_LABELS[article.status]}
                </span>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
                <span className={`text-[11px] font-medium ${isAnalyzed ? 'text-[#e2148b]' : 'text-[#555]'}`}>{article.source_name}</span>
                <span className="text-[11px] text-[#444]">{timeAgo}</span>
                {article.city && <span className="text-[11px] text-[#555]">📍 {article.city}</span>}
                {(article.views ?? 0) > 0 && (
                  <span className="text-[11px] text-[#555]">👁 {formatViews(article.views!)}</span>
                )}
                {(article.likes ?? 0) > 0 && (
                  <span className="text-[11px] text-[#555]">❤ {formatViews(article.likes!)}</span>
                )}
                {article.categories.slice(0, 2).map(c => <CategoryTag key={c} category={c} />)}
                {article.provinces.slice(0, 1).map(p => <ProvinceTag key={p} province={p} />)}
                {!isAnalyzed && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-white/4 text-[#444] rounded border border-white/5">Wacht op analyse</span>
                )}
              </div>

              {isAnalyzed && !isAfgewezen && (
                <div className="mt-2">
                  <ScoreBar score={article.powned_score} size="sm" showLabel={false} />
                </div>
              )}
            </div>
            <span className="shrink-0 text-[#333] text-xs">{expanded ? '▲' : '▼'}</span>
          </div>
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-white/5 p-4 space-y-3" onClick={e => e.stopPropagation()}>
          {article.powned_summary && (
            <div className="bg-[#e2148b]/8 border border-[#e2148b]/18 rounded-lg p-3">
              <p className="text-[10px] font-bold text-[#e2148b] uppercase tracking-wider mb-1">PowNed Samenvatting</p>
              <p className="text-sm text-[#ddd] leading-relaxed">{article.powned_summary}</p>
            </div>
          )}
          {article.powned_angle && (
            <div className="bg-[#9c2d8f]/8 border border-[#9c2d8f]/18 rounded-lg p-3">
              <p className="text-[10px] font-bold text-[#c86ad0] uppercase tracking-wider mb-1">💡 De PowNed-Insteek</p>
              <p className="text-sm text-[#ccc] leading-relaxed">{article.powned_angle}</p>
            </div>
          )}
          {!article.powned_summary && article.summary && (
            <p className="text-sm text-[#777] leading-relaxed">{article.summary.slice(0, 400)}{article.summary.length > 400 ? '...' : ''}</p>
          )}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {article.tags.map(t => (
                <span key={t} className="text-[10px] px-2 py-0.5 bg-white/5 text-[#666] rounded-full border border-white/6">#{t}</span>
              ))}
            </div>
          )}

          {/* Workflow actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            <a href={article.url} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="px-3 py-1.5 text-xs bg-[#e2148b] text-white rounded-lg font-medium hover:bg-[#c01078] transition-colors">
              🔗 Bekijk artikel
            </a>
            {(['favoriet', 'ingepland', 'doorgestuurd'] as ArticleStatus[]).map(s => (
              <button key={s} disabled={loading} onClick={() => handleStatus(s)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  article.status === s ? 'bg-white/12 text-white border-white/20' : 'bg-white/4 text-[#777] border-white/8 hover:text-[#ccc] hover:bg-white/8'
                }`}>
                {STATUS_LABELS[s]}
              </button>
            ))}
            <button disabled={loading} onClick={() => handleStatus('afgewezen')}
              className="px-3 py-1.5 text-xs bg-white/4 text-[#555] rounded-lg border border-white/6 hover:bg-red-900/20 hover:text-red-400 transition-colors">
              ✗ Afwijzen
            </button>
          </div>

          {/* AI Feedback loop — only for analyzed articles */}
          {!isAnalyzed && (
            <div className="border-t border-white/5 pt-3">
              <p className="text-[11px] text-[#444] flex items-center gap-1.5">
                <span>⏳</span> Wacht op AI-analyse — score en samenvatting worden binnenkort bepaald
              </p>
            </div>
          )}
          {isAnalyzed && <div className="border-t border-white/5 pt-3">
            <p className="text-[9px] font-bold text-[#333] uppercase tracking-[0.15em] mb-2">AI Kalibratie</p>
            {feedback === 'hit' && (
              <p className="text-[11px] text-green-400 flex items-center gap-1.5">
                <span>🎯</span> Gemarkeerd als correct — AI leert hiervan
              </p>
            )}
            {feedback === 'miss' && (
              <p className="text-[11px] text-red-400 flex items-center gap-1.5">
                <span>❌</span> Gemarkeerd als incorrecte inschatting — AI wordt bijgesteld
              </p>
            )}
            {(feedback === 'none' || feedback === 'sending') && !showMissReason && (
              <div className="flex gap-2">
                <button
                  disabled={feedback === 'sending'}
                  onClick={() => submitFeedback('hit')}
                  className="flex-1 py-1.5 text-[11px] rounded-lg border border-green-500/25 text-green-400 bg-green-900/8 hover:bg-green-900/18 transition-colors font-medium disabled:opacity-40">
                  🎯 Schot in de roos
                </button>
                <button
                  disabled={feedback === 'sending'}
                  onClick={() => setShowMissReason(true)}
                  className="flex-1 py-1.5 text-[11px] rounded-lg border border-red-500/25 text-red-400 bg-red-900/8 hover:bg-red-900/18 transition-colors font-medium disabled:opacity-40">
                  ❌ Plank misgeslagen
                </button>
              </div>
            )}
            {showMissReason && (
              <div className="space-y-2">
                <textarea
                  value={missReason}
                  onChange={e => setMissReason(e.target.value)}
                  placeholder="Waarom was deze inschatting onjuist? (optioneel)"
                  className="w-full bg-[#111] text-[11px] text-[#ccc] border border-white/8 rounded-lg px-2.5 py-2 focus:outline-none focus:border-red-500/30 resize-none placeholder-[#333]"
                  rows={2}
                  onClick={e => e.stopPropagation()}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => submitFeedback('miss')}
                    className="px-3 py-1.5 text-[11px] rounded-lg bg-red-900/20 text-red-400 border border-red-500/25 hover:bg-red-900/30 transition-colors font-medium">
                    Bevestigen
                  </button>
                  <button
                    onClick={() => { setShowMissReason(false); setMissReason(''); }}
                    className="px-3 py-1.5 text-[11px] rounded-lg bg-white/4 text-[#555] border border-white/6 hover:text-[#888] transition-colors">
                    Annuleren
                  </button>
                </div>
              </div>
            )}
          </div>}
        </div>
      )}
    </div>
  );
}
