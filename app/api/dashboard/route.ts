import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const companionId = session.companionId;

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

    const dailyRows = await sql`
      SELECT DATE(created_at AT TIME ZONE 'UTC') AS day,
             COALESCE(SUM(amount), 0)::int AS total
      FROM purchases
      WHERE companion_id = ${companionId}::uuid
        AND status = 'completed'
        AND created_at > NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at AT TIME ZONE 'UTC')
      ORDER BY day ASC
    `;

    const dayMap = new Map<string, number>();
    for (const row of dailyRows) {
      const key = String(row.day).slice(0, 10);
      dayMap.set(key, row.total);
    }

    const weekDaily: number[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      weekDaily.push(dayMap.get(key) || 0);
    }

    const earningsLastMonth = await sql`
      SELECT COALESCE(SUM(amount), 0)::int AS total
      FROM purchases
      WHERE companion_id = ${companionId}::uuid
        AND status = 'completed'
        AND created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
        AND created_at < DATE_TRUNC('month', NOW())
    `;

    const earningsThisMonth = await sql`
      SELECT COALESCE(SUM(amount), 0)::int AS total
      FROM purchases
      WHERE companion_id = ${companionId}::uuid
        AND status = 'completed'
        AND created_at >= DATE_TRUNC('month', NOW())
    `;

    const lastMonth = earningsLastMonth[0]?.total || 0;
    const thisMonth = earningsThisMonth[0]?.total || 0;
    const monthGrowth =
      lastMonth > 0
        ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
        : thisMonth > 0
          ? 100
          : 0;

    return NextResponse.json({
      companion,
      stats: {
        totalSales: salesStats.total_sales,
        totalRevenue: salesStats.total_revenue,
        uniqueClients: salesStats.unique_clients,
        totalItems: itemCount.total,
        weekRevenue: earningsThisWeek[0]?.total || 0,
        monthGrowth,
        weekDaily,
      },
      recentSales,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
