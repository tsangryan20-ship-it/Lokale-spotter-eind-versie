import { NextRequest, NextResponse } from 'next/server';
import { insertFeedback, getRecentFeedback, getFeedbackForArticle } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      articleId: string;
      articleTitle: string;
      articleUrl: string;
      feedbackType: 'hit' | 'miss';
      reason?: string;
      scoreAtTime: number;
      categories?: string[];
    };

    if (!body.articleId || !body.feedbackType || !['hit', 'miss'].includes(body.feedbackType)) {
      return NextResponse.json({ error: 'Ongeldige invoer' }, { status: 400 });
    }

    insertFeedback({
      id: `fb_${body.articleId}_${Date.now()}`,
      article_id: body.articleId,
      article_title: body.articleTitle,
      article_url: body.articleUrl,
      feedback_type: body.feedbackType,
      reason: body.reason ?? null,
      score_at_time: body.scoreAtTime,
      categories: JSON.stringify(body.categories ?? []),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get('articleId');

  if (articleId) {
    const fb = getFeedbackForArticle(articleId);
    return NextResponse.json({ feedback: fb });
  }

  const limit = Number(searchParams.get('limit') ?? 50);
  const items = getRecentFeedback(limit);
  return NextResponse.json({ items, total: items.length });
}
