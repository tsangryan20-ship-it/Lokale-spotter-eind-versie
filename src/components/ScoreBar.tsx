'use client';

interface ScoreBarProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ScoreBar({ score, size = 'md', showLabel = true }: ScoreBarProps) {
  const getColor = (s: number) => {
    if (s >= 90) return { bar: 'from-[#e2148b] to-[#ff0080]', text: 'text-[#ff4db3]', label: 'MUST-HAVE' };
    if (s >= 70) return { bar: 'from-[#e2148b] to-[#9c2d8f]', text: 'text-[#e2148b]', label: 'STERK' };
    if (s >= 50) return { bar: 'from-[#ff6b35] to-[#e2148b]', text: 'text-[#ff8c5a]', label: 'POTENTIEEL' };
    if (s >= 30) return { bar: 'from-[#888] to-[#aaa]', text: 'text-[#aaa]', label: 'MARGINAAL' };
    return { bar: 'from-[#444] to-[#666]', text: 'text-[#666]', label: 'NIET RELEVANT' };
  };

  const { bar, text, label } = getColor(score);
  const heights = { sm: 'h-1', md: 'h-1.5', lg: 'h-2' };
  const isHigh = score >= 90;

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 bg-[#2a2a2a] rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`h-full bg-gradient-to-r ${bar} rounded-full transition-all duration-500 ${isHigh ? 'score-high' : ''}`}
          style={{ width: `${score}%` }}
        />
      </div>
      {showLabel && (
        <span className={`font-bold tabular-nums text-xs ${text}`}>
          {score}
          <span className="text-[10px] ml-0.5 opacity-60">%</span>
        </span>
      )}
    </div>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const getStyle = (s: number) => {
    if (s >= 90) return 'bg-[#e2148b]/20 text-[#ff4db3] border border-[#e2148b]/40 score-high';
    if (s >= 70) return 'bg-[#9c2d8f]/20 text-[#c86ad0] border border-[#9c2d8f]/40';
    if (s >= 50) return 'bg-[#ff6b35]/15 text-[#ff9a6a] border border-[#ff6b35]/30';
    if (s >= 30) return 'bg-white/5 text-[#888] border border-white/10';
    return 'bg-white/3 text-[#555] border border-white/5';
  };

  return (
    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${getStyle(score)}`}>
      {score >= 90 ? '🔥' : score >= 70 ? '⭐' : ''}{score}%
    </span>
  );
}
