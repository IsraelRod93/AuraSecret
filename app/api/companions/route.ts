import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');

  try {
    const sql = getDb();

    const companions = await sql`
      SELECT id, name, type, photo_url, tagline, description
      FROM companions
      WHERE status = 'active'
      ORDER BY random()
      LIMIT 9
    `;

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
