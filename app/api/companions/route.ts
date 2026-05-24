import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb } from '@/lib/db';
import { getRequestUserId } from '@/lib/get-user-id';

export async function GET(request: NextRequest) {
  const userId = getRequestUserId(request);
  const filtered = request.nextUrl.searchParams.get('filtered') === 'true';

  try {
    const sql = getDb();

    if (userId) {
      const [user] = await sql`
        SELECT options_unlocked, gallery_views FROM users WHERE id = ${userId}::uuid LIMIT 1
      `;

      const views = (user?.gallery_views || 0) + 1;
      await sql`
        UPDATE users SET gallery_views = ${views} WHERE id = ${userId}::uuid
      `;

      if (views > 1 && !user?.options_unlocked) {
        return NextResponse.json({ batches: [], sessionId: null, paywall: true });
      }
    }

    let companions;

    if (userId && filtered) {
      const [prefs] = await sql`
        SELECT * FROM user_preferences WHERE user_id = ${userId}::uuid LIMIT 1
      `;

      if (prefs) {
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
          AND (${prefs.prefer_type} = 'both' OR c.type = ${prefs.prefer_type})
          AND (c.age IS NULL OR c.age BETWEEN ${prefs.age_min} AND ${prefs.age_max})
          AND (${prefs.personality_type}::text IS NULL OR c.personality_type = ${prefs.personality_type})
          AND (${prefs.location}::text IS NULL OR c.location ILIKE '%' || ${prefs.location} || '%')
          ORDER BY random()
          LIMIT 9
        `;
      }
    }

    if (!companions && userId) {
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
    }

    if (!companions) {
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
