import { NextResponse } from 'next/server';
import { runAnalyzeAll } from '@/lib/pipeline';

export async function POST() {
  try {
    const { analyzed } = await runAnalyzeAll(10);

    if (analyzed === 0) {
      return NextResponse.json({ message: 'Geen artikelen te analyseren', analyzed: 0 });
    }

    return NextResponse.json({ success: true, analyzed });
  } catch (err) {
    const apiErr = err as { status?: number };
    if (apiErr.status === 429) {
      return NextResponse.json(
        { error: 'Google AI quota bereikt. Probeer morgen opnieuw of upgrade via aistudio.google.com.', code: 'quota_exceeded' },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
