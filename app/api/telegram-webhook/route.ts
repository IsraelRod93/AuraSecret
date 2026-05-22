import { NextRequest, NextResponse } from 'next/server';
import { answerPreCheckoutQuery } from '@/lib/telegram-pay';
import { sendMessage } from '@/lib/telegram-bot';
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
      const chatId = update.message.chat.id;

      switch (payload.type) {
        case 'gallery_unlock': {
          if (payload.userId) {
            await sql`
              UPDATE users SET options_unlocked = true, gallery_views = 0 WHERE id = ${payload.userId}::uuid
            `;

            await sendMessage(chatId, "<b>Galeria desbloqueada!</b> ✨\n\nHe abierto las puertas de mi galeria secreta para ti. Vuelve a la app y descubre a las diosas que estaban esperando conocerte. No las hagas esperar...");

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
            const days = payload.plan === 'monthly' ? 30 : 7;
            const currentExpiry = await sql`
              SELECT subscription_expires_at FROM users WHERE id = ${payload.userId}::uuid LIMIT 1
            `;
            const now = new Date();
            const currentEnd = currentExpiry[0]?.subscription_expires_at ? new Date(currentExpiry[0].subscription_expires_at) : now;
            const base = currentEnd > now ? currentEnd : now;
            const expiresAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

            await sql`
              UPDATE users SET subscription_status = 'active', subscription_expires_at = ${expiresAt}
              WHERE id = ${payload.userId}::uuid
            `;

            const planLabel = payload.plan === 'monthly' ? '1 mes' : '1 semana';
            await sendMessage(chatId, `<b>Bienvenido al Circulo Intimo!</b> 🔥\n\nTienes acceso Premium por ${planLabel}. Mis amigas y yo estamos ansiosas por hablar contigo sin limites.`);
          }
          break;
        }

        case 'vault_purchase': {
          if (payload.userId && payload.vaultItemId) {
            const chargeId = payment.telegram_payment_charge_id;
            const [existing] = await sql`
              SELECT id FROM purchases WHERE stripe_payment_id = ${chargeId} LIMIT 1
            `;
            if (!existing) {
              await sql`
                INSERT INTO purchases (user_id, vault_item_id, companion_id, amount, stripe_payment_id, status)
                VALUES (
                  ${payload.userId}::uuid,
                  ${payload.vaultItemId}::uuid,
                  ${payload.companionId || null}::uuid,
                  ${payment.total_amount},
                  ${chargeId},
                  'completed'
                )
              `;
            }

            await sendMessage(chatId, "<b>Tesoro desbloqueado...</b> 🔓\n\nLo que acabas de adquirir es solo para tus ojos. Disfrutalo en tu boveda privada.");

            // Notify the creator about the sale
            if (payload.companionId) {
              const [companion] = await sql`
                SELECT c.name, u.telegram_id as creator_telegram_id
                FROM companions c
                LEFT JOIN users u ON u.id = c.id
                WHERE c.id = ${payload.companionId}::uuid LIMIT 1
              `;
              // Also check if companion itself has a linked telegram
              const [buyer] = await sql`
                SELECT first_name FROM users WHERE id = ${payload.userId}::uuid LIMIT 1
              `;
              // For now notify the buyer's chat about the purchase confirmation
            }
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
