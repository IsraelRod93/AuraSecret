import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'panel_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  return secret;
}

function base64url(input: string | Buffer) {
  const str = typeof input === 'string' ? Buffer.from(input).toString('base64') : input.toString('base64');
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function signToken(payload: { companionId: string }): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + MAX_AGE }));
  const signature = base64url(
    crypto.createHmac('sha256', getSecret()).update(`${header}.${body}`).digest()
  );
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): { companionId: string } | null {
  try {
    const [header, body, signature] = token.split('.');
    if (!header || !body || !signature) return null;

    const expected = base64url(
      crypto.createHmac('sha256', getSecret()).update(`${header}.${body}`).digest()
    );
    if (signature !== expected) return null;

    const payload = JSON.parse(Buffer.from(body, 'base64').toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return { companionId: payload.companionId };
  } catch {
    return null;
  }
}

export function getSession(request: NextRequest): { companionId: string } | null {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
