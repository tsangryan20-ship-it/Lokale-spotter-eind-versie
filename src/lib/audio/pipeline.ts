import { AudioAnalysis } from '@/types';
import { analyzeAudio } from '@/lib/ai/analyzer';

export interface TranscriptionResult {
  text: string;
  duration?: number;
  language?: string;
}

// Transcribe audio using OpenAI Whisper API
export async function transcribeAudio(audioBuffer: Buffer, filename: string, mimeType: string): Promise<TranscriptionResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.includes('your-openai')) {
    // Fallback: return a placeholder when no Whisper key available
    return {
      text: '[Transcriptie niet beschikbaar — stel OPENAI_API_KEY in voor Whisper]',
      duration: 0,
    };
  }

  const formData = new FormData();
  const blob = new Blob([audioBuffer.buffer as ArrayBuffer], { type: mimeType });
  formData.append('file', blob, filename);
  formData.append('model', 'whisper-1');
  formData.append('language', 'nl');
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'segment');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Whisper API error ${response.status}: ${err}`);
  }

  const data = await response.json() as { text: string; duration?: number; language?: string };
  return {
    text: data.text,
    duration: data.duration,
    language: data.language,
  };
}

// Basic speaker diarization: split transcript into segments based on pause patterns
// (True diarization requires pyannote.audio; this is a lightweight heuristic version)
export function diarizeTranscript(transcript: string): { speaker: string; text: string }[] {
  const sentences = transcript
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 5);

  const segments: { speaker: string; text: string }[] = [];
  let currentSpeaker = 'Spreker 1';
  let buffer = '';
  let sentenceCount = 0;

  for (const sentence of sentences) {
    buffer += (buffer ? ' ' : '') + sentence;
    sentenceCount++;

    // Simple heuristic: switch speaker every 3-5 sentences or on question marks
    if (sentenceCount >= 3 || sentence.includes('?')) {
      segments.push({ speaker: currentSpeaker, text: buffer });
      buffer = '';
      sentenceCount = 0;
      currentSpeaker = currentSpeaker === 'Spreker 1' ? 'Spreker 2' : 'Spreker 1';
    }
  }

  if (buffer) segments.push({ speaker: currentSpeaker, text: buffer });
  return segments;
}

export async function processAudioFile(audioBuffer: Buffer, filename: string, mimeType: string): Promise<AudioAnalysis & { segments: { speaker: string; text: string }[] }> {
  const transcription = await transcribeAudio(audioBuffer, filename, mimeType);
  const segments = diarizeTranscript(transcription.text);
  const analysis = await analyzeAudio(transcription.text);

  return {
    ...analysis,
    transcript: transcription.text,
    segments,
    speakers: segments.reduce((acc, seg) => {
      const existing = acc.find(s => s.id === seg.speaker);
      if (existing) {
        existing.segments.push({ start: 0, end: 0, text: seg.text });
      } else {
        acc.push({ id: seg.speaker, segments: [{ start: 0, end: 0, text: seg.text }] });
      }
      return acc;
    }, [] as AudioAnalysis['speakers']),
  };
}
