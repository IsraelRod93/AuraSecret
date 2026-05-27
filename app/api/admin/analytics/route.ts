import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const adminPassword = request.headers.get('x-admin-password');
  if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const sql = getDb();

  try {
    // Funnel from user_events (table may not exist yet → return zeros)
    let funnelMap: Record<string, number> = {};
    try {
      const rows = await sql`SELECT event_name, COUNT(*)::int AS total FROM user_events GROUP BY event_name`;
      for (const r of rows) funnelMap[r.event_name] = r.total;
    } catch {}

    // User KPIs
    const [userStats] = await sql`
      SELECT
        COUNT(*)::int                                                                         AS total_users,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int                  AS users_this_week,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 day')::int                   AS users_today
      FROM users
    `;

    // Companion KPIs
    const [compStats] = await sql`
      SELECT
        COUNT(*)::int                                              AS total_companions,
        COUNT(*) FILTER (WHERE status = 'active')::int            AS active_companions
      FROM companions
    `;

    // Revenue + sales KPIs (from purchases)
    const [rev] = await sql`
      SELECT
        COALESCE(SUM(amount), 0)::int                                                              AS total_stars,
        COALESCE(SUM(amount) FILTER (WHERE created_at > NOW() - INTERVAL '7 days'), 0)::int        AS stars_this_week,
        COUNT(*)::int                                                                               AS total_sales,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int                        AS sales_this_week
      FROM purchases WHERE status = 'completed'
    `;

    // Companion-level stats from conversations (most visited) + purchases (most revenue)
    const topCompanions = await sql`
      SELECT
        c.name, c.photo_url,
        COALESCE(SUM(p.amount), 0)::int          AS revenue_stars,
        COUNT(DISTINCT p.user_id)::int            AS sales_count,
        COUNT(DISTINCT conv.user_id)::int         AS chat_users
      FROM companions c
      LEFT JOIN purchases     p    ON p.companion_id    = c.id AND p.status = 'completed'
      LEFT JOIN conversations conv ON conv.companion_id = c.id
      WHERE c.status = 'active'
      GROUP BY c.id, c.name, c.photo_url
      HAVING COUNT(DISTINCT conv.user_id) > 0 OR COALESCE(SUM(p.amount), 0) > 0
      ORDER BY chat_users DESC, revenue_stars DESC
      LIMIT 8
    `;

    // Daily revenue last 7 days (UTC–6 approx Mexico City)
    const dailyRevenue = await sql`
      SELECT
        (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City')::date AS day,
        COALESCE(SUM(amount), 0)::int  AS stars,
        COUNT(*)::int                  AS sales
      FROM purchases
      WHERE status = 'completed'
        AND created_at > NOW() - INTERVAL '8 days'
      GROUP BY day
      ORDER BY day
    `;

    // Subscription breakdown
    const [subStats] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE subscription_status = 'active')::int  AS paid_users,
        COUNT(*) FILTER (WHERE subscription_status = 'free')::int     AS free_users
      FROM users
    `;

    return NextResponse.json({
      // Funnel
      bot_start:          funnelMap['bot_start']          || 0,
      first_message:      funnelMap['first_message']      || 0,
      limit_reached:      funnelMap['limit_reached']      || 0,
      payment_completed:  funnelMap['payment_completed']  || 0,
      referral_join:      funnelMap['referral_join']       || 0,
      // Users
      total_users:        userStats?.total_users       || 0,
      users_this_week:    userStats?.users_this_week   || 0,
      users_today:        userStats?.users_today       || 0,
      paid_users:         subStats?.paid_users         || 0,
      free_users:         subStats?.free_users         || 0,
      // Companions
      total_companions:   compStats?.total_companions  || 0,
      active_companions:  compStats?.active_companions || 0,
      // Revenue
      total_stars:        rev?.total_stars      || 0,
      stars_this_week:    rev?.stars_this_week  || 0,
      total_sales:        rev?.total_sales      || 0,
      sales_this_week:    rev?.sales_this_week  || 0,
      // Top companions
      top_companions: topCompanions,
      // Daily chart
      daily_revenue: dailyRevenue,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
