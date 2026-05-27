import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

function auth(req: NextRequest) {
  const pwd = req.headers.get('x-admin-password');
  return pwd && pwd === process.env.ADMIN_PASSWORD;
}

// GET — list all companions with profile completeness info
export async function GET(request: NextRequest) {
  if (!auth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const sql = getDb();

  const companions = await sql`
    SELECT
      c.id, c.name, c.type, c.status, c.verified,
      c.tagline, c.description, c.age, c.location, c.photo_url,
      c.created_at,
      COUNT(v.id)::int AS vault_items
    FROM companions c
    LEFT JOIN vault_items v ON v.companion_id = c.id
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `;

  return NextResponse.json({ companions });
}

// PATCH — update status or verified for a companion
export async function PATCH(request: NextRequest) {
  if (!auth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { companionId, status, verified } = await request.json();
  if (!companionId) return NextResponse.json({ error: 'companionId requerido' }, { status: 400 });

  const sql = getDb();

  if (typeof verified === 'boolean') {
    await sql`UPDATE companions SET verified = ${verified} WHERE id = ${companionId}::uuid`;
  }
  if (status) {
    await sql`UPDATE companions SET status = ${status} WHERE id = ${companionId}::uuid`;
  }

  return NextResponse.json({ ok: true });
}

// POST — run one-time cleanup: add verified column + mark garbage profiles as pending
export async function POST(request: NextRequest) {
  if (!auth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const sql = getDb();

  // Add verified column if it doesn't exist
  await sql`
    ALTER TABLE companions
    ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT FALSE
  `;

  // Mark obvious test/garbage profiles as pending
  const result = await sql`
    UPDATE companions
    SET status = 'pending'
    WHERE status = 'active'
    AND (
      tagline ILIKE 'Nose'
      OR tagline ILIKE 'no se'
      OR description ILIKE 'Nose'
      OR description ILIKE 'no se'
      OR tagline IS NULL
      OR tagline = ''
      OR description IS NULL
      OR description = ''
    )
    RETURNING id, name, tagline, description
  `;

  return NextResponse.json({ migrated: true, deactivated: result.length, profiles: result });
}
