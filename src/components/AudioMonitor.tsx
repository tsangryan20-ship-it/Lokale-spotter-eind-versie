'use client';
import { useState, useRef } from 'react';

interface AudioResult {
  filename: string;
  transcript: string;
  sentiment_score: number;
  stress_detected: boolean;
  powned_relevance: number;
  summary: string;
  trigger_alert: boolean;
  alert_reason?: string;
  segments: { speaker: string; text: string }[];
  size_mb: string;
}

function SentimentMeter({ score, label, color }: { score: number; label: string; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-[#555] uppercase tracking-wider">{label}</span>
        <span className="text-xs font-bold" style={{ color }}>{score}%</span>
      </div>
      <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
}

export function AudioMonitor() {
  const [result, setResult] = useState<AudioResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const form = new FormData();
    form.append('audio', file);

    try {
      const res = await fetch('/api/audio', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verwerking mislukt');
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="flex-1 max-w-screen-2xl mx-auto w-full px-5 py-6 flex gap-6">
      {/* Upload panel */}
      <div className="w-80 shrink-0 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-[#f0f0f0] mb-1">Audio Monitor</h2>
          <p className="text-[11px] text-[#555] leading-relaxed">
            Upload een audiobestand (interview, raadsvergadering, podcast, TikTok-audio) voor automatische transcriptie, stressdetectie en PowNed-scoring.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          className={`rounded-xl border-2 border-dashed cursor-pointer transition-all p-8 text-center ${
            dragOver ? 'border-[#e2148b] bg-[#e2148b]/8' : 'border-white/10 hover:border-white/20 bg-[#1a1a1a]'
          }`}>
          <div className="text-3xl mb-3">🎙️</div>
          <p className="text-sm font-medium text-[#888]">Sleep audio hier</p>
          <p className="text-[11px] text-[#444] mt-1">of klik om te uploaden</p>
          <p className="text-[10px] text-[#333] mt-2">MP3 · MP4 · WAV · OGG · max 25 MB</p>
        </div>
        <input ref={fileRef} type="file" accept="audio/*,video/mp4,video/webm" className="hidden" onChange={handleFile} />

        {/* Capabilities */}
        <div className="bg-[#1a1a1a] rounded-xl border border-white/6 p-4 space-y-2.5">
          <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-3">Pipeline-functies</p>
          {[
            { icon: '📝', label: 'Whisper transcriptie', status: process.env.NEXT_PUBLIC_HAS_OPENAI !== 'false' ? 'actief' : 'vereist OpenAI key', ok: true },
            { icon: '🎭', label: 'Speaker diarization', status: 'heuristisch', ok: true },
            { icon: '🧠', label: 'Gemini sentiment', status: 'actief', ok: true },
            { icon: '🚨', label: 'Stress-trigger alert', status: 'drempel 70%', ok: true },
          ].map(({ icon, label, status, ok }) => (
            <div key={label} className="flex items-center gap-2">
              <span>{icon}</span>
              <div className="flex-1">
                <p className="text-[11px] text-[#ccc]">{label}</p>
                <p className={`text-[10px] ${ok ? 'text-[#555]' : 'text-yellow-600'}`}>{status}</p>
              </div>
              <div className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-green-500' : 'bg-yellow-500'}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Results panel */}
      <div className="flex-1 min-w-0">
        {loading && (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-12 h-12 rounded-full border-2 border-[#e2148b]/30 border-t-[#e2148b] animate-spin mb-4" />
            <p className="text-sm text-[#555]">Audio wordt verwerkt…</p>
            <p className="text-[11px] text-[#333] mt-1">Transcriptie → Diarization → Sentiment analyse</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/15 border border-red-700/30 rounded-xl p-4">
            <p className="text-sm font-semibold text-red-400 mb-1">Fout bij verwerking</p>
            <p className="text-xs text-red-300/70">{error}</p>
          </div>
        )}

        {!loading && !result && !error && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-4xl mb-3 opacity-30">🎙️</div>
            <p className="text-sm text-[#333]">Upload een audiobestand om te beginnen</p>
            <p className="text-[11px] text-[#2a2a2a] mt-1">Raadsvergaderingen · Interviews · Podcasts · TikTok audio</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Alert banner */}
            {result.trigger_alert && (
              <div className="bg-[#e2148b]/15 border border-[#e2148b]/40 rounded-xl p-4 flex items-center gap-3">
                <span className="text-2xl">🚨</span>
                <div>
                  <p className="text-sm font-bold text-[#e2148b]">PowNed Alert getriggerd!</p>
                  <p className="text-xs text-[#e2148b]/70">{result.alert_reason}</p>
                </div>
              </div>
            )}

            {/* Scores */}
            <div className="bg-[#1a1a1a] rounded-xl border border-white/6 p-4">
              <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-4">Analyse — {result.filename} ({result.size_mb} MB)</p>
              <div className="grid grid-cols-3 gap-6 mb-4">
                <SentimentMeter score={result.sentiment_score} label="Stress/Sentiment" color={result.stress_detected ? '#e2148b' : '#9c2d8f'} />
                <SentimentMeter score={result.powned_relevance} label="PowNed Relevantie" color="#e2148b" />
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[#555] uppercase tracking-wider">Stress Detectie</span>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold mt-1 ${
                    result.stress_detected ? 'bg-[#e2148b]/20 text-[#e2148b]' : 'bg-white/5 text-[#555]'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${result.stress_detected ? 'bg-[#e2148b]' : 'bg-[#444]'}`} />
                    {result.stress_detected ? 'Stress gedetecteerd' : 'Normaal niveau'}
                  </div>
                </div>
              </div>
              {result.summary && (
                <div className="bg-[#e2148b]/8 rounded-lg p-3 border border-[#e2148b]/15">
                  <p className="text-[10px] font-bold text-[#e2148b] uppercase tracking-wider mb-1">AI Samenvatting</p>
                  <p className="text-sm text-[#ddd] leading-relaxed">{result.summary}</p>
                </div>
              )}
            </div>

            {/* Transcript with diarization */}
            <div className="bg-[#1a1a1a] rounded-xl border border-white/6 p-4">
              <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-3">
                Transcriptie met Speaker Diarization
              </p>
              {result.segments.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {result.segments.map((seg, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-[10px] font-bold text-[#e2148b] shrink-0 mt-0.5 w-16">{seg.speaker}</span>
                      <p className="text-xs text-[#888] leading-relaxed">{seg.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#555] whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                  {result.transcript}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
