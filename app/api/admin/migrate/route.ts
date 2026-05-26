import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ensureFullSchema } from '@/lib/db-migrate';

export async function POST(request: NextRequest) {
  const adminPassword = request.headers.get('x-admin-password');
  if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const sql = getDb();
  try {
    await ensureFullSchema(sql);
    return NextResponse.json({ ok: true, message: 'Migraciones aplicadas' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Migration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
