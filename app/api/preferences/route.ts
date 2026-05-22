import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getRequestUserId } from '@/lib/get-user-id';

export async function GET(request: NextRequest) {
  const userId = getRequestUserId(request);
  if (!userId) return NextResponse.json({ preferences: null });

  const sql = getDb();
  const [prefs] = await sql`
    SELECT * FROM user_preferences WHERE user_id = ${userId}::uuid LIMIT 1
  `;
  return NextResponse.json({ preferences: prefs || null });
}

export async function POST(request: NextRequest) {
  const userId = getRequestUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { prefer_type, age_min, age_max, personality_type, location } = await request.json();

  const sql = getDb();

  try {
    const [saved] = await sql`
      INSERT INTO user_preferences (user_id, prefer_type, age_min, age_max, personality_type, location, updated_at)
      VALUES (${userId}::uuid, ${prefer_type || 'both'}, ${age_min || 18}, ${age_max || 35}, ${personality_type || null}, ${location || null}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        prefer_type = ${prefer_type || 'both'},
        age_min = ${age_min || 18},
        age_max = ${age_max || 35},
        personality_type = ${personality_type || null},
        location = ${location || null},
        updated_at = NOW()
      RETURNING *
    `;
    return NextResponse.json({ preferences: saved });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
