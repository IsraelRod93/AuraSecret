import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  const { name, photo_url, price } = await request.json();

  if (!name || !photo_url) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const sql = getDb();

  try {
    const [companion] = await sql`
      INSERT INTO companions (name, type, photo_url, status, description, tagline)
      VALUES (${name}, 'human', ${photo_url}, 'pending', ${'Modelo ' + name}, 'Nueva en Aura')
      RETURNING *
    `;

    return NextResponse.json({ companion });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Registration failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { companionId, stripe_account_id } = await request.json();

  if (!companionId || !stripe_account_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const sql = getDb();

  try {
    await sql`
      UPDATE companions SET stripe_account_id = ${stripe_account_id}, status = 'active'
      WHERE id = ${companionId}::uuid
    `;
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Update failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
