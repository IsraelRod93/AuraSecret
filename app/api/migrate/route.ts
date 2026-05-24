import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  if (!secret || secret !== process.env.MIGRATION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = getDb();

  try {
    await sql`ALTER TABLE companions ADD COLUMN IF NOT EXISTS email TEXT UNIQUE`;
    await sql`ALTER TABLE companions ADD COLUMN IF NOT EXISTS password_hash TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS gallery_views INTEGER DEFAULT 0`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS looking_for TEXT`;
    await sql`ALTER TABLE users ALTER COLUMN telegram_id DROP NOT NULL`;

    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_payment_id
      ON purchases (stripe_payment_id)
      WHERE stripe_payment_id IS NOT NULL;
    `;

    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_user_companion
      ON conversations (user_id, companion_id);
    `;

    return NextResponse.json({ ok: true, message: 'Migration completed' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Migration failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
