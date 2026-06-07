import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PREFIXES = ['/login', '/api/auth'];
const ASSET_PATTERN = /^\/((_next|icons|favicon|manifest\.json|sw\.js|apple-touch-icon)[./]|favicon\.ico)/;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (ASSET_PATTERN.test(pathname) || PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get('powned_token')?.value;
  if (!token || !(await verifyToken(token))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

async function verifyToken(token: string): Promise<boolean> {
  try {
    const dot = token.lastIndexOf('.');
    if (dot < 0) return false;
    const payloadB64 = token.slice(0, dot);
    const sigB64 = token.slice(dot + 1);

    const secret = process.env.AUTH_SECRET || 'change-this-secret-in-production';
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBytes = Uint8Array.from(
      atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    );

    const valid = await crypto.subtle.verify(
      'HMAC', key, sigBytes, new TextEncoder().encode(payloadB64)
    );
    if (!valid) return false;

    const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson) as { exp: number };
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
