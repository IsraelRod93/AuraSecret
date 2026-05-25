import { NextRequest, NextResponse } from 'next/server';
import { validateTelegramInitData } from '@/lib/telegram';
import { getDb } from '@/lib/db';
import { signUserToken, setUserSessionCookie } from '@/lib/user-auth';
import { sendMessage, WEBAPP_URL } from '@/lib/telegram-bot';
import { trackEvent } from '@/lib/track-event';

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
      const token = signUserToken({ userId: existing.id });
      const response = NextResponse.json({ user: existing });
      setUserSessionCookie(response, token);
      return response;
    }

    const refCode = referralCode || start_param || null;
    let referrerId = null;
    let referredByCompanionId = null;

    if (refCode && typeof refCode === 'string') {
      if (refCode.startsWith('ref_')) {
        const refTelegramId = refCode.replace('ref_', '');
        if (Number(refTelegramId) === tgUser.id) {
          // Self-referral blocked
        } else {
          const [referrer] = await sql`
            SELECT id FROM users WHERE telegram_id = ${Number(refTelegramId)} LIMIT 1
          `;
          if (referrer) referrerId = referrer.id;
        }
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
      const [updatedReferrer] = await sql`
        UPDATE users
        SET
          referral_count = COALESCE(referral_count, 0) + 1,
          options_unlocked = true
        WHERE id = ${referrerId}
        RETURNING referral_count, telegram_id
      `;

      // Notify referrer on their first successful referral
      if (updatedReferrer?.referral_count === 1 && updatedReferrer.telegram_id) {
        sendMessage(
          updatedReferrer.telegram_id,
          '<b>Galeria desbloqueada!</b> 🎉\n\nTu amigo acaba de unirse con tu enlace. La galeria completa es tuya! Vuelve a la app y descubre sin limites.',
          {
            inline_keyboard: [[
              { text: '💫 Abrir galeria', web_app: { url: WEBAPP_URL } }
            ]]
          }
        ).catch(() => {});
      }

      trackEvent('referral_join', newUser.id, { referrerId });
    }

    const token = signUserToken({ userId: newUser.id });
    const response = NextResponse.json({ user: newUser });
    setUserSessionCookie(response, token);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Auth failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
