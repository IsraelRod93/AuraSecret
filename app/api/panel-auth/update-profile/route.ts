import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function PATCH(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'No autenticada' }, { status: 401 });
  }

  const { name, age, location, personality_type, tagline, description, photo_url } = await request.json();
  const sql = getDb();

  try {
    const [companion] = await sql`
      UPDATE companions SET
        name = COALESCE(${name || null}, name),
        age = COALESCE(${age ? Number(age) : null}, age),
        location = COALESCE(${location || null}, location),
        personality_type = COALESCE(${personality_type || null}, personality_type),
        tagline = COALESCE(${tagline || null}, tagline),
        description = COALESCE(${description || null}, description),
        photo_url = COALESCE(${photo_url || null}, photo_url)
      WHERE id = ${session.companionId}::uuid
      RETURNING id, name, photo_url, status, email, age, location, personality_type, tagline, description
    `;

    return NextResponse.json({ companion });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error al actualizar';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
