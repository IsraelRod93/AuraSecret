import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('panel_session')?.value;

  if (!token || !verifyToken(token)) {
    return NextResponse.redirect(new URL('/panel/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/panel/dashboard/:path*'],
};
