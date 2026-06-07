import { GoogleGenAI } from '@google/genai';
import { AIAnalysis, Article, AudioAnalysis } from '@/types';
import { POWNED_SYSTEM_PROMPT, AUDIO_SYSTEM_PROMPT, buildAnalysisPrompt, buildAnalysisPromptWithFewShot, buildAudioPrompt, FeedbackExample } from './prompts';
import { geocodeText } from '@/lib/geocoder';

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_API_KEY is not set in environment variables');
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

const MODEL = process.env.GOOGLE_MODEL || 'gemini-2.0-flash';

async function generateJSON(systemPrompt: string, userContent: string): Promise<Record<string, unknown>> {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.3,
      maxOutputTokens: 600,
      systemInstruction: systemPrompt,
    },
    contents: userContent,
  });
  const text = response.text;
  if (!text) throw new Error('Empty response from Google AI');
  return JSON.parse(text);
}

export async function analyzeArticle(
  article: Pick<Article, 'title' | 'summary' | 'url'>,
  feedbackExamples: FeedbackExample[] = []
): Promise<AIAnalysis> {
  const userContent = feedbackExamples.length > 0
    ? buildAnalysisPromptWithFewShot(article.title, article.summary, article.url, feedbackExamples)
    : buildAnalysisPrompt(article.title, article.summary, article.url);
  const parsed = await generateJSON(POWNED_SYSTEM_PROMPT, userContent);

  const provinces = Array.isArray(parsed.provinces) ? parsed.provinces as string[] : ['Onbekend'];

  // Determine coordinates: trust AI if it gave them, otherwise geocode from text
  let lat = typeof parsed.lat === 'number' ? parsed.lat : null;
  let lng = typeof parsed.lng === 'number' ? parsed.lng : null;
  let city = typeof parsed.city === 'string' ? parsed.city : null;

  if (!lat || !lng) {
    const geo = geocodeText(`${article.title} ${article.summary} ${String(parsed.city || '')}`, provinces);
    if (geo) { lat = geo.lat; lng = geo.lng; city = city || geo.city; }
  }

  return {
    score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
    summary: String(parsed.summary || ''),
    angle: String(parsed.angle || ''),
    categories: Array.isArray(parsed.categories) ? parsed.categories as AIAnalysis['categories'] : ['algemeen'],
    provinces: provinces as AIAnalysis['provinces'],
    tags: Array.isArray(parsed.tags) ? (parsed.tags as string[]).slice(0, 8) : [],
    city: city || undefined,
    lat: lat || undefined,
    lng: lng || undefined,
  };
}

export async function analyzeAudio(transcript: string): Promise<AudioAnalysis> {
  const parsed = await generateJSON(AUDIO_SYSTEM_PROMPT, buildAudioPrompt(transcript));
  return {
    transcript,
    sentiment_score: Math.max(0, Math.min(100, Number(parsed.sentiment_score) || 0)),
    stress_detected: Boolean(parsed.stress_detected),
    powned_relevance: Math.max(0, Math.min(100, Number(parsed.powned_relevance) || 0)),
    summary: String(parsed.summary || ''),
    speakers: [],
    trigger_alert: Boolean(parsed.trigger_alert),
    alert_reason: typeof parsed.alert_reason === 'string' ? parsed.alert_reason : undefined,
  };
}

export async function analyzeBatch(
  articles: Pick<Article, 'id' | 'title' | 'summary' | 'url'>[],
  feedbackExamples: FeedbackExample[] = []
): Promise<Map<string, AIAnalysis>> {
  const results = new Map<string, AIAnalysis>();
  for (const article of articles) {
    try {
      const analysis = await analyzeArticle(article, feedbackExamples);
      results.set(article.id, analysis);
      await new Promise(r => setTimeout(r, 400));
    } catch (err) {
      const apiErr = err as { status?: number };
      if (apiErr.status === 429) throw err;
      console.error(`Failed to analyze article ${article.id}:`, err);
    }
  }
  return results;
}
