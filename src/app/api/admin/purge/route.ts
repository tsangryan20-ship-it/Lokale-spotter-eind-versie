import { NextRequest, NextResponse } from 'next/server';
import { purgeDemoArticles, purgeAllArticles } from '@/lib/db';

// DELETE /api/admin/purge?type=demo   — removes only demo_ articles
// DELETE /api/admin/purge?type=all    — removes everything (dangerous, requires confirm header)
export async function DELETE(request: NextRequest) {
  const type = new URL(request.url).searchParams.get('type') ?? 'demo';

  if (type === 'all') {
    const confirm = request.headers.get('x-confirm');
    if (confirm !== 'DELETE_ALL_ARTICLES') {
      return NextResponse.json(
        { error: 'Voeg header X-Confirm: DELETE_ALL_ARTICLES toe om alles te wissen' },
        { status: 400 }
      );
    }
    const deleted = purgeAllArticles();
    return NextResponse.json({ success: true, deleted, type: 'all' });
  }

  // Default: remove demo_ articles only
  const deleted = purgeDemoArticles();
  return NextResponse.json({ success: true, deleted, type: 'demo' });
}
