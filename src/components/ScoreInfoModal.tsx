'use client';
import { useEffect, useCallback } from 'react';
import { SCORE_WEIGHTS, TIER_CONFIG } from '@/lib/services/scoring';

interface Props {
  onClose: () => void;
}

export function ScoreInfoModal({ onClose }: Props) {
  // Close on ESC
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  const tiers = [
    { range: '90 – 100', tier: 'must-have'  as const, description: 'Breek dit direct — uniek, urgent, perfect voor PowNed.' },
    { range: '70 – 89',  tier: 'sterk'      as const, description: 'Sterk PowNed-item, hoge redactionele prioriteit.' },
    { range: '50 – 69',  tier: 'potentieel' as const, description: 'Interessant maar vereist eigen invalshoek.' },
    { range: '0 – 49',   tier: 'laag'       as const, description: 'Weinig relevant voor het PowNed-publiek.' },
  ];

  const weights = [
    {
      name: 'Versheid',
      key: 'freshness',
      pct: Math.round(SCORE_WEIGHTS.freshness * 100),
      desc: 'Hoe recent is het artikel? Onder 2 uur = maximale score. Na 48 uur bijna nul.',
      icon: '⏱',
    },
    {
      name: 'PowNed-fit',
      key: 'powned_fit',
      pct: Math.round(SCORE_WEIGHTS.powned_fit * 100),
      desc: 'AI-analyse op conflict, viraliteit, ophef, 112-nieuws en PowNed-doelgroep. Zonder AI: neutrale standaardscore.',
      icon: '🧠',
    },
    {
      name: 'Bronbetrouwbaarheid',
      key: 'source_trust',
      pct: Math.round(SCORE_WEIGHTS.source_trust * 100),
      desc: 'Elke bron heeft een vaste betrouwbaarheidsscore: NOS/Politie.nl scoren het hoogst, burgerjournalistiek lager.',
      icon: '🏛',
    },
    {
      name: 'Engagement',
      key: 'engagement',
      pct: Math.round(SCORE_WEIGHTS.engagement * 100),
      desc: 'Organische signalen: views en likes van het bronartikel. Genormaliseerd op 10K views / 500 likes = 100.',
      icon: '📈',
    },
  ];

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(4,6,14,0.88)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="score-modal-title"
    >
      {/* Panel */}
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{
          background: 'linear-gradient(160deg, #0d1422 0%, #101828 100%)',
          border: '1px solid rgba(226,20,139,0.25)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-white/6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #e2148b, #9c2d8f)' }}>
                <span className="text-white font-black text-[9px]">P</span>
              </div>
              <h2 id="score-modal-title" className="text-sm font-black text-white tracking-wide">
                PowNed Score — Uitleg
              </h2>
            </div>
            <p className="text-[11px] text-[#6b7a8d]">
              Hoe bepaalt het systeem de relevantie van een nieuwsartikel?
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Sluiten"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#4a5568] hover:text-[#8899aa] hover:bg-white/6 transition-colors ml-4 shrink-0 text-sm"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* What is it */}
          <div>
            <p className="text-[12px] text-[#8899aa] leading-relaxed">
              De <span className="text-white font-semibold">PowNed Score</span> (0–100) geeft aan hoe goed een
              nieuwsartikel past bij de PowNed-redactie — rekening houdend met versheid, AI-relevantie,
              bronkwaliteit en organisch bereik. Een hoge score betekent: <em className="text-[#e2148b]">pak dit nú op</em>.
            </p>
          </div>

          {/* Score tiers */}
          <div>
            <p className="text-[9px] font-bold text-[#4a5568] uppercase tracking-widest mb-3">Score niveaus</p>
            <div className="space-y-2">
              {tiers.map(({ range, tier, description }) => {
                const cfg = TIER_CONFIG[tier];
                return (
                  <div key={tier} className="flex items-start gap-3 rounded-xl p-3"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.color}22` }}>
                    <div className="shrink-0 mt-0.5 px-2 py-0.5 rounded text-[9px] font-black tracking-wider"
                      style={{ color: cfg.color, background: `${cfg.color}18`, border: `1px solid ${cfg.color}44` }}>
                      {cfg.label}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold mb-0.5" style={{ color: cfg.color }}>{range}%</p>
                      <p className="text-[11px] text-[#6b7a8d] leading-relaxed">{description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weight breakdown */}
          <div>
            <p className="text-[9px] font-bold text-[#4a5568] uppercase tracking-widest mb-3">Hoe de score wordt opgebouwd</p>
            <div className="space-y-3">
              {weights.map(w => (
                <div key={w.key} className="flex gap-3">
                  <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                    style={{ background: 'rgba(226,20,139,0.10)', border: '1px solid rgba(226,20,139,0.15)' }}>
                    {w.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[12px] font-semibold text-[#ccd6e0]">{w.name}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(226,20,139,0.15)', color: '#e2148b' }}>
                        {w.pct}%
                      </span>
                    </div>
                    {/* Weight bar */}
                    <div className="w-full h-1 rounded-full mb-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full"
                        style={{ width: `${w.pct}%`, background: 'linear-gradient(90deg, #e2148b, #9c2d8f)' }} />
                    </div>
                    <p className="text-[11px] text-[#6b7a8d] leading-relaxed">{w.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI analysis note */}
          <div className="rounded-xl p-3.5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] font-bold text-[#4a5568] uppercase tracking-wider mb-1.5">Wanneer is de AI actief?</p>
            <p className="text-[11px] text-[#6b7a8d] leading-relaxed">
              Artikelen zonder AI-analyse krijgen een neutrale PowNed-fit van 40% — de versheid en bronkwaliteit
              bepalen dan de ranking. Na AI-analyse vervangt de werkelijke score (0–100) de neutrale waarde.
              De dagelijkse pipeline draait automatisch om <strong className="text-[#8899aa]">08:30</strong>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-[12px] font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #e2148b, #9c2d8f)' }}
          >
            Begrepen
          </button>
        </div>
      </div>
    </div>
  );
}
