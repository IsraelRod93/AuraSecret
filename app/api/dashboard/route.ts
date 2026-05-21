import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const companionId = request.nextUrl.searchParams.get('companionId');

  if (!companionId) {
    return NextResponse.json({ error: 'companionId required' }, { status: 400 });
  }

  const sql = getDb();

  try {
    const [companion] = await sql`
      SELECT id, name, photo_url, status, stripe_account_id
      FROM companions WHERE id = ${companionId}::uuid LIMIT 1
    `;

    if (!companion) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const [salesStats] = await sql`
      SELECT
        COUNT(*)::int AS total_sales,
        COALESCE(SUM(amount), 0)::int AS total_revenue,
        COUNT(DISTINCT user_id)::int AS unique_clients
      FROM purchases
      WHERE companion_id = ${companionId}::uuid AND status = 'completed'
    `;

    const recentSales = await sql`
      SELECT p.amount, p.created_at, vi.title, u.first_name, u.username
      FROM purchases p
      LEFT JOIN vault_items vi ON p.vault_item_id = vi.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.companion_id = ${companionId}::uuid AND p.status = 'completed'
      ORDER BY p.created_at DESC
      LIMIT 20
    `;

    const [itemCount] = await sql`
      SELECT COUNT(*)::int AS total FROM vault_items WHERE companion_id = ${companionId}::uuid
    `;

    const earningsThisWeek = await sql`
      SELECT COALESCE(SUM(amount), 0)::int AS total
      FROM purchases
      WHERE companion_id = ${companionId}::uuid
      AND status = 'completed'
      AND created_at > NOW() - INTERVAL '7 days'
    `;

    return NextResponse.json({
      companion,
      stats: {
        totalSales: salesStats.total_sales,
        totalRevenue: salesStats.total_revenue,
        uniqueClients: salesStats.unique_clients,
        totalItems: itemCount.total,
        weekRevenue: earningsThisWeek[0]?.total || 0,
      },
      recentSales,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
