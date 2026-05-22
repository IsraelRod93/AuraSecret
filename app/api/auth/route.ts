import { NextRequest, NextResponse } from 'next/server';
import { validateTelegramInitData } from '@/lib/telegram';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { initData, referralCode } = await request.json();

    if (!initData) {
      return NextResponse.json({ error: 'initData required' }, { status: 400 });
    }

    const validated = validateTelegramInitData(initData);
    if (!validated) {
      return NextResponse.json({ error: 'Invalid Telegram data' }, { status: 401 });
    }

    const { user: tgUser, start_param } = validated;
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

    const refCode = referralCode || start_param || null;
    let referrerId = null;
    let referredByCompanionId = null;

    if (refCode && typeof refCode === 'string') {
      if (refCode.startsWith('ref_')) {
        const refTelegramId = refCode.replace('ref_', '');
        const [referrer] = await sql`
          SELECT id FROM users WHERE telegram_id = ${Number(refTelegramId)} LIMIT 1
        `;
        if (referrer) referrerId = referrer.id;
      } else if (refCode.startsWith('crea_')) {
        const companionId = refCode.replace('crea_', '');
        const [companion] = await sql`
          SELECT id FROM companions WHERE id = ${companionId}::uuid LIMIT 1
        `;
        if (companion) referredByCompanionId = companion.id;
      }
    }

    const [newUser] = await sql`
      INSERT INTO users (telegram_id, username, first_name, referred_by, referred_by_companion)
      VALUES (${tgUser.id}, ${tgUser.username || null}, ${tgUser.first_name}, ${referrerId}, ${referredByCompanionId})
      RETURNING *
    `;

    if (referrerId) {
      await sql`
        UPDATE users SET referral_count = COALESCE(referral_count, 0) + 1
        WHERE id = ${referrerId}
      `;
    }

    return NextResponse.json({ user: newUser });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Auth failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
