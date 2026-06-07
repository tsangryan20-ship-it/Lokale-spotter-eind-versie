'use client';
import { Category } from '@/types';

const CATEGORY_CONFIG: Record<Category, { label: string; color: string; emoji: string }> = {
  '112-alarm': { label: '112 Alarm', color: 'bg-red-900/40 text-red-300 border-red-700/40', emoji: '🚨' },
  'viraal': { label: 'Viraal', color: 'bg-blue-900/40 text-blue-300 border-blue-700/40', emoji: '📱' },
  'politiek': { label: 'Politiek', color: 'bg-purple-900/40 text-purple-300 border-purple-700/40', emoji: '🏛️' },
  'juice-entertainment': { label: 'Juice', color: 'bg-pink-900/40 text-pink-300 border-pink-700/40', emoji: '🍵' },
  'conflict-ophef': { label: 'Ophef', color: 'bg-orange-900/40 text-orange-300 border-orange-700/40', emoji: '⚡' },
  'algemeen': { label: 'Algemeen', color: 'bg-gray-800/60 text-gray-400 border-gray-700/40', emoji: '📰' },
};

export function CategoryTag({ category }: { category: Category }) {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG['algemeen'];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wide ${config.color}`}>
      <span>{config.emoji}</span>
      {config.label}
    </span>
  );
}

export function ProvinceTag({ province }: { province: string }) {
  const isNational = province === 'Nationaal';
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
      isNational
        ? 'bg-[#e2148b]/10 text-[#e2148b]/80 border-[#e2148b]/20'
        : 'bg-white/5 text-[#888] border-white/10'
    }`}>
      📍 {province}
    </span>
  );
}
