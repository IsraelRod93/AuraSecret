import { NextRequest } from 'next/server';
import { getUserSession } from './user-auth';

export function getRequestUserId(request: NextRequest): string | null {
  return getUserSession(request)?.userId ?? null;
}
