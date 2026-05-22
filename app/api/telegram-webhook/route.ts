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
              UPDATE users SET options_unlocked = true WHERE id = ${payload.userId}::uuid
            `;

            await sendMessage(chatId, "<b>¡Hechicería completada!</b> ✨\n\nHe abierto las puertas de mi galería secreta para ti. Vuelve a la app y descubre a las diosas que estaban esperando conocerte. No las hagas esperar...");

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
            
            await sendMessage(chatId, "<b>¡Bienvenido al Círculo Íntimo!</b> 🔥\n\nAhora tienes acceso total. Mis amigas y yo estamos ansiosas por hablar contigo sin límites. ¿A quién vas a enviarle el primer mensaje?");
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

            await sendMessage(chatId, "<b>Tesoro desbloqueado...</b> 🔓\n\nLo que acabas de adquirir es solo para tus ojos. Disfrútalo en tu bóveda privada. Es nuestra pequeña e intensa conexión.");
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
