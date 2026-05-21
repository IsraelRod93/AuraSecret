import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  if (!secret || secret !== process.env.MIGRATION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = getDb();

  try {
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companions' AND column_name = 'email') THEN
          ALTER TABLE companions ADD COLUMN email TEXT UNIQUE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companions' AND column_name = 'password_hash') THEN
          ALTER TABLE companions ADD COLUMN password_hash TEXT;
        END IF;
      END $$;
    `;

    return NextResponse.json({ ok: true, message: 'Migration completed' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Migration failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
