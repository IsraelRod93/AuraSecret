import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = getDb();

  try {
    const [stats] = await sql`
      SELECT 
        c.name,
        c.status,
        (SELECT COUNT(*) FROM users WHERE referred_by_companion = c.id) as total_fans,
        (SELECT COUNT(*) FROM conversations WHERE companion_id = c.id) as active_chats,
        (SELECT COALESCE(SUM(amount), 0) FROM purchases WHERE companion_id = c.id AND status = 'completed') as total_earnings_cents
      FROM companions c
      WHERE c.id = ${session.companionId}::uuid
      LIMIT 1
    `;

    if (!stats) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Recent sales
    const recentSales = await sql`
      SELECT p.amount, p.created_at, u.first_name as user_name
      FROM purchases p
      JOIN users u ON u.id = p.user_id
      WHERE p.companion_id = ${session.companionId}::uuid
      AND p.status = 'completed'
      ORDER BY p.created_at DESC
      LIMIT 10
    `;

    const referralLink = `https://t.me/AuraSecretx_bot?start=crea_${session.companionId}`;

    return NextResponse.json({
      ...stats,
      total_earnings_mxn: stats.total_earnings_cents / 100,
      referralLink,
      recentSales
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch stats';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
