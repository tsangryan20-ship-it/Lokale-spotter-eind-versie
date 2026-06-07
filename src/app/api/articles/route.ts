import { NextRequest, NextResponse } from 'next/server';
import { getArticles, getStats, ArticleQuery } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const provinces = searchParams.get('provinces')?.split(',').filter(Boolean);
    const categories = searchParams.get('categories')?.split(',').filter(Boolean);
    const sources = searchParams.get('sources')?.split(',').filter(Boolean);
    const minScore = searchParams.get('minScore') ? parseInt(searchParams.get('minScore')!) : undefined;
    const status = searchParams.get('status') || 'alle';
    const search = searchParams.get('search') || undefined;
    const sortBy = (searchParams.get('sortBy') as ArticleQuery['sortBy']) || 'score';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;
    const statsOnly = searchParams.get('stats') === 'true';

    if (statsOnly) {
      return NextResponse.json(getStats());
    }

    const todayOnly  = searchParams.get('todayOnly') === 'true';
    const maxAgeDays = searchParams.get('maxAgeDays') ? parseInt(searchParams.get('maxAgeDays')!) : undefined;
    const articles = getArticles({ provinces, categories, sources, minScore, status, search, sortBy, limit, offset, todayOnly, maxAgeDays });
    return NextResponse.json({ articles, total: articles.length });
  } catch (err) {
    console.error('GET /api/articles error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
