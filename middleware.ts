import { NextRequest, NextResponse } from 'next/server';

async function verifyTokenEdge(token: string): Promise<boolean> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return false;

    const [header, body, signature] = token.split('.');
    if (!header || !body || !signature) return false;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${header}.${body}`));
    const expected = btoa(String.fromCharCode(...new Uint8Array(sig)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    if (signature !== expected) return false;

    const payload = JSON.parse(atob(body));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return false;

    return !!payload.companionId;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('panel_session')?.value;

  if (!token || !(await verifyTokenEdge(token))) {
    return NextResponse.redirect(new URL('/panel/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/panel/dashboard/:path*'],
};
