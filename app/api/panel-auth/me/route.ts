import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'No autenticada' }, { status: 401 });
  }

  const sql = getDb();

  try {
    const [companion] = await sql`
      SELECT id, name, photo_url, status, email, age, location, personality_type, tagline, description, stripe_account_id
      FROM companions WHERE id = ${session.companionId}::uuid LIMIT 1
    `;

    if (!companion) {
      return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
    }

    return NextResponse.json({ companion });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
