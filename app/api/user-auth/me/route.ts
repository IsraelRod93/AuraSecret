import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/user-auth';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = getUserSession(request);
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const sql = getDb();

  try {
    const [user] = await sql`
      SELECT id, first_name, email, age, looking_for, subscription_status, subscription_expires_at, options_unlocked
      FROM users WHERE id = ${session.userId}::uuid LIMIT 1
    `;

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
