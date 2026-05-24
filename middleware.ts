import { NextRequest, NextResponse } from 'next/server';

// Verifica tokens HMAC en runtime Edge (subtle crypto)
async function verifyTokenEdge(token: string): Promise<any | null> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    const [header, body, signature] = token.split('.');
    if (!header || !body || !signature) return null;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${header}.${body}`));
    const expected = btoa(String.fromCharCode(...new Uint8Array(sig)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    if (signature !== expected) return null;

    const payload = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas del panel (creadores)
  if (pathname.startsWith('/panel')) {
    const token = request.cookies.get('panel_session')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/panel/login', request.url));
    }
    const payload = await verifyTokenEdge(token);
    if (!payload?.companionId) {
      const res = NextResponse.redirect(new URL('/panel/login', request.url));
      res.cookies.set('panel_session', '', { path: '/', maxAge: 0 });
      return res;
    }
    return NextResponse.next();
  }

  // Rutas de usuario (clientes)
  if (
    pathname.startsWith('/chat') ||
    pathname.startsWith('/chats') ||
    pathname.startsWith('/explore') ||
    pathname.startsWith('/vault')
  ) {
    const token = request.cookies.get('user_session')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/welcome', request.url));
    }
    const payload = await verifyTokenEdge(token);
    if (!payload?.userId) {
      const res = NextResponse.redirect(new URL('/welcome', request.url));
      res.cookies.set('user_session', '', { path: '/', maxAge: 0 });
      return res;
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/panel/:path*', '/chat/:path*', '/chats/:path*', '/explore/:path*', '/vault/:path*'],
};
