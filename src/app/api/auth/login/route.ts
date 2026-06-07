import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { password, rememberMe } = await request.json() as { password: string; rememberMe?: boolean };

    const correctPassword = process.env.AUTH_PASSWORD || 'powned2025';
    if (!password || password !== correctPassword) {
      // Short delay to slow brute-force attempts
      await new Promise(r => setTimeout(r, 400));
      return NextResponse.json({ error: 'Ongeldig wachtwoord' }, { status: 401 });
    }

    const secret = process.env.AUTH_SECRET || 'change-this-secret-in-production';
    const duration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000;
    const payload = Buffer.from(JSON.stringify({ exp: Date.now() + duration, v: 1 }))
      .toString('base64url');
    const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    const token = `${payload}.${sig}`;

    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 8 * 60 * 60;
    const response = NextResponse.json({ success: true });
    response.cookies.set('powned_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/',
    });
    return response;
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
