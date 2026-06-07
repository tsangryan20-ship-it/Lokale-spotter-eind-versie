import { NextRequest, NextResponse } from 'next/server';
import { runScrapeAll } from '@/lib/pipeline';
import sourcesData from '../../../../data/sources.json';

interface SourceConfig { id: string; name: string; rssUrls?: string[] }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as { sourceId?: string };
    const { totalNew, results } = await runScrapeAll(body.sourceId);
    return NextResponse.json({ success: true, totalNew, results });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    sources: (sourcesData as SourceConfig[]).map(s => ({
      id: s.id,
      name: s.name,
      hasRss: (s.rssUrls?.length ?? 0) > 0,
    })),
  });
}
