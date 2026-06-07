import { NextRequest, NextResponse } from 'next/server';
import { updateArticleStatus } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, assignedTo, notes } = body;

    updateArticleStatus(id, status, assignedTo, notes);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH /api/articles/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
