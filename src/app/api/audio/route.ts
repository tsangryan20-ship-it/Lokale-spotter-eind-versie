import { NextRequest, NextResponse } from 'next/server';
import { processAudioFile } from '@/lib/audio/pipeline';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('audio') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Geen audiobestand meegestuurd' }, { status: 400 });
    }

    const allowedTypes = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm', 'video/mp4', 'video/webm'];
    if (!allowedTypes.some(t => file.type.startsWith(t.split('/')[0]))) {
      return NextResponse.json({ error: 'Bestandstype niet ondersteund. Gebruik MP3, MP4, WAV of OGG.' }, { status: 400 });
    }

    const maxSize = 25 * 1024 * 1024; // 25 MB (Whisper limit)
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Bestand te groot (max 25 MB)' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await processAudioFile(buffer, file.name, file.type);

    return NextResponse.json({
      success: true,
      filename: file.name,
      size_mb: (file.size / 1024 / 1024).toFixed(2),
      ...result,
    });
  } catch (err) {
    const apiErr = err as { status?: number };
    if (apiErr.status === 429) {
      return NextResponse.json({ error: 'API quota bereikt', code: 'quota_exceeded' }, { status: 429 });
    }
    console.error('POST /api/audio error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
