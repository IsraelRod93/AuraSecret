import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const adminPassword = request.headers.get('x-admin-password');
  if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const sql = getDb();

  try {
    const counts = await sql`
      SELECT event_name, COUNT(*)::int AS total
      FROM user_events
      GROUP BY event_name
    `;

    const map: Record<string, number> = {};
    for (const row of counts) {
      map[row.event_name] = row.total;
    }

    return NextResponse.json({
      bot_start: map['bot_start'] || 0,
      first_message: map['first_message'] || 0,
      limit_reached: map['limit_reached'] || 0,
      payment_completed: map['payment_completed'] || 0,
      referral_join: map['referral_join'] || 0,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
