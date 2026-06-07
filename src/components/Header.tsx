'use client';
import { useRouter } from 'next/navigation';

interface Props {
  activeTab: 'dashboard' | 'map';
  onTabChange: (tab: 'dashboard' | 'map') => void;
  lastUpdated: Date | null;
  stats: { total: number; todayCount: number };
}

export function Header({ activeTab, onTabChange, lastUpdated, stats }: Props) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  };

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: 'linear-gradient(180deg, #080d17 0%, rgba(8,13,23,0.97) 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="max-w-screen-2xl mx-auto px-5 h-12 flex items-center gap-0">

        {/* ── Logo ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5 pr-5 mr-1 shrink-0"
          style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #e2148b, #9c2d8f)' }}>
            <span className="text-white font-black text-xs leading-none">P</span>
          </div>
          <div className="leading-none">
            <div className="text-[11px] font-black tracking-[0.18em] gradient-text">POWNED</div>
            <div className="text-[8px] tracking-[0.22em] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              REDACTIE
            </div>
          </div>
          <div className="flex items-center gap-1 ml-1">
            <div className="w-1.5 h-1.5 rounded-full live-dot" style={{ background: 'var(--powned-magenta)' }} />
            <span className="text-[8px] font-bold tracking-widest" style={{ color: '#3a4e63' }}>LIVE</span>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <nav className="flex items-stretch gap-0 px-3 h-full">
          {([
            { id: 'dashboard', label: 'Dashboard', icon: '▦' },
            { id: 'map',       label: 'Kaart NL',  icon: '◉' },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex items-center gap-1.5 px-4 text-[11px] font-semibold border-b-2 transition-all h-full tracking-wide"
              style={activeTab === tab.id ? {
                borderBottomColor: 'var(--powned-magenta)',
                color: 'var(--powned-magenta)',
              } : {
                borderBottomColor: 'transparent',
                color: 'var(--text-muted)',
              }}
            >
              <span className="text-[10px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex-1" />

        {/* ── Live stats ────────────────────────────────────────────────── */}
        <div
          className="hidden lg:flex items-center gap-4 px-4 mr-3 h-7 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <Stat label="Vandaag" value={stats.todayCount} hot />
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.06)' }} />
          <Stat label="Totaal" value={stats.total} />
          {lastUpdated && (
            <>
              <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.06)' }} />
              <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                ↺&thinsp;{lastUpdated.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </>
          )}
        </div>

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <button
          onClick={handleLogout}
          title="Uitloggen"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] transition-colors"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            color: 'var(--text-muted)',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          ⏻
        </button>
      </div>
    </header>
  );
}

function Stat({ label, value, hot }: { label: string; value: number; hot?: boolean }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-sm font-bold tabular-nums leading-none"
        style={{ color: hot ? 'var(--powned-magenta)' : 'var(--text-secondary)' }}>
        {value.toLocaleString('nl-NL')}
      </span>
      <span className="text-[9px] font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}
