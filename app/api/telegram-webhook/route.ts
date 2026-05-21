import { NextRequest, NextResponse } from 'next/server';
import { answerPreCheckoutQuery } from '@/lib/telegram-pay';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  const update = await request.json();
  const sql = getDb();

  try {
    if (update.pre_checkout_query) {
      await answerPreCheckoutQuery(update.pre_checkout_query.id, true);
      return NextResponse.json({ ok: true });
    }

    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment;
      const payload = JSON.parse(payment.invoice_payload);

      switch (payload.type) {
        case 'gallery_unlock': {
          if (payload.userId) {
            await sql`
              UPDATE users SET options_unlocked = true WHERE id = ${payload.userId}::uuid
            `;

            const [payer] = await sql`
              SELECT referred_by FROM users WHERE id = ${payload.userId}::uuid LIMIT 1
            `;
            if (payer?.referred_by) {
              await sql`
                UPDATE users SET options_unlocked = true
                WHERE id = ${payer.referred_by} AND options_unlocked = false
              `;
            }
          }
          break;
        }

        case 'subscription': {
          if (payload.userId) {
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            await sql`
              UPDATE users SET subscription_status = 'active', subscription_expires_at = ${expiresAt}
              WHERE id = ${payload.userId}::uuid
            `;
          }
          break;
        }

        case 'vault_purchase': {
          if (payload.userId && payload.vaultItemId) {
            await sql`
              INSERT INTO purchases (user_id, vault_item_id, companion_id, amount, stripe_payment_id, status)
              VALUES (
                ${payload.userId}::uuid,
                ${payload.vaultItemId}::uuid,
                ${payload.companionId || null}::uuid,
                ${payment.total_amount},
                ${payment.telegram_payment_charge_id},
                'completed'
              )
            `;
          }
          break;
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: true });
  }
}
