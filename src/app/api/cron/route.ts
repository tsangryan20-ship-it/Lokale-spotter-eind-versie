/**
 * /api/cron — External cron trigger endpoint.
 *
 * Railway (or any scheduler) can call this via:
 *   GET/POST https://your-app.railway.app/api/cron?secret=<CRON_SECRET>
 *   or with header: x-cron-secret: <CRON_SECRET>
 *
 * Set CRON_SECRET in Railway env vars to secure this endpoint.
 * If CRON_SECRET is not set, the endpoint is only callable from localhost.
 */
import { NextRequest, NextResponse } from 'next/server';
import { runFullPipeline } from '@/lib/pipeline';

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;

  // If no secret configured, only allow from localhost / Railway internal network
  if (!secret) {
    const host = req.headers.get('host') ?? '';
    return host.includes('localhost') || host.includes('127.0.0.1') || host.includes('::1');
  }

  const headerSecret = req.headers.get('x-cron-secret');
  const querySecret = req.nextUrl.searchParams.get('secret');
  return headerSecret === secret || querySecret === secret;
}

async function handleCron(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runFullPipeline();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('[/api/cron] Pipeline error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export const GET = handleCron;
export const POST = handleCron;

// Tell Next.js this route is always dynamic (never cached)
export const dynamic = 'force-dynamic';
