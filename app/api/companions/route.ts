import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');

  try {
    const sql = getDb();

    let companions;

    if (userId) {
      companions = await sql`
        SELECT c.id, c.name, c.type, c.photo_url, c.tagline, c.description
        FROM companions c
        WHERE c.status = 'active'
        AND c.id NOT IN (
          SELECT ul.companion_id FROM user_likes ul
          WHERE ul.user_id = ${userId}::uuid
          AND ul.messaged = false
          AND ul.created_at > NOW() - INTERVAL '2 days'
        )
        ORDER BY random()
        LIMIT 9
      `;
    } else {
      companions = await sql`
        SELECT id, name, type, photo_url, tagline, description
        FROM companions
        WHERE status = 'active'
        ORDER BY random()
        LIMIT 9
      `;
    }

    if (!companions || companions.length === 0) {
      return NextResponse.json({ batches: [], sessionId: null });
    }

    const batches = [];
    for (let i = 0; i < companions.length; i += 3) {
      batches.push(companions.slice(i, i + 3));
    }

    const sessionId = crypto.randomUUID();

    return NextResponse.json({ batches, sessionId });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
