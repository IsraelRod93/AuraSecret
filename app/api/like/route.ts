import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  const { userId, companionId } = await request.json();

  if (!userId || !companionId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const sql = getDb();

  try {
    await sql`
      INSERT INTO user_likes (user_id, companion_id)
      VALUES (${userId}::uuid, ${companionId}::uuid)
      ON CONFLICT (user_id, companion_id) DO UPDATE SET created_at = NOW()
    `;
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
