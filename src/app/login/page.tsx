'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, rememberMe }),
      });
      if (res.ok) {
        const from = searchParams.get('from') || '/';
        router.replace(from);
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error || 'Login mislukt');
      }
    } catch {
      setError('Verbindingsfout — probeer opnieuw');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #e2148b, #9c2d8f)' }}>
            <span className="text-white font-black text-3xl leading-none">P</span>
          </div>
          <h1 className="text-lg font-black tracking-widest gradient-text">POWNED</h1>
          <p className="text-[11px] text-[#444] tracking-[0.2em] mt-0.5">REDACTIE AGENT</p>
        </div>

        {/* Card */}
        <div className="bg-[#141414] border border-white/8 rounded-2xl p-7 shadow-2xl">
          <h2 className="text-sm font-bold text-[#888] mb-5">Toegang redactie</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-[#444] uppercase tracking-[0.15em] mb-1.5">
                Wachtwoord
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoFocus
                className="w-full bg-[#0d0d0d] text-sm text-[#f0f0f0] border border-white/8 rounded-xl px-4 py-3 focus:outline-none focus:border-[#e2148b]/50 transition-colors placeholder-[#2a2a2a]"
              />
            </div>

            {error && (
              <p className="text-[11px] text-red-400 bg-red-900/20 border border-red-900/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                  rememberMe ? 'bg-[#e2148b] border-[#e2148b]' : 'border-white/20 bg-transparent'
                }`}>
                {rememberMe && <span className="text-white text-[10px] leading-none font-bold">✓</span>}
              </div>
              <span className="text-[12px] text-[#555] group-hover:text-[#888] transition-colors select-none">
                Onthoud mij (30 dagen)
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: loading ? '#333' : 'linear-gradient(135deg, #e2148b, #9c2d8f)' }}>
              {loading ? 'Inloggen…' : 'Inloggen →'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="w-3.5 h-3.5 rounded flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #FF4D00, #FE3D25)' }}>
            <span className="text-white font-black text-[7px] leading-none">N</span>
          </div>
          <span className="text-[10px]" style={{ color: '#FF4D00' }}>Note It Agency</span>
          <span className="text-[10px] text-[#2a2a2a]">— AI Machine Status: Gekalibreerd</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
