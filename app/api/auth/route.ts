import { NextRequest, NextResponse } from 'next/server';
import { validateTelegramInitData } from '@/lib/telegram';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { initData } = await request.json();

    if (!initData) {
      return NextResponse.json({ error: 'initData required' }, { status: 400 });
    }

    const validated = validateTelegramInitData(initData);
    if (!validated) {
      return NextResponse.json({ error: 'Invalid Telegram data' }, { status: 401 });
    }

    const { user: tgUser } = validated;
    const sql = getDb();

    const [existing] = await sql`
      SELECT * FROM users WHERE telegram_id = ${tgUser.id} LIMIT 1
    `;

    if (existing) {
      await sql`
        UPDATE users SET username = ${tgUser.username || null}, first_name = ${tgUser.first_name}
        WHERE id = ${existing.id}
      `;
      return NextResponse.json({ user: existing });
    }

    const [newUser] = await sql`
      INSERT INTO users (telegram_id, username, first_name)
      VALUES (${tgUser.id}, ${tgUser.username || null}, ${tgUser.first_name})
      RETURNING *
    `;

    return NextResponse.json({ user: newUser });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Auth failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
