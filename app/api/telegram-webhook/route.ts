import { NextRequest, NextResponse } from 'next/server';
import { answerPreCheckoutQuery } from '@/lib/telegram-pay';
import { sendMessage, sendPhoto, WEBAPP_URL, BOT_USERNAME } from '@/lib/telegram-bot';
import { getDb } from '@/lib/db';
import { trackEvent } from '@/lib/track-event';
import { creditCreatorEarnings } from '@/lib/payout';

function parsePayload(raw: string): { type: string; userId?: string; vaultItemId?: string; companionId?: string; plan?: string } {
  // New compact format: "g:userId", "s:userId:w", "v:userId:vaultItemId:companionId"
  if (raw.startsWith('g:')) {
    return { type: 'gallery_unlock', userId: raw.slice(2) };
  }
  if (raw.startsWith('s:')) {
    const parts = raw.split(':');
    return { type: 'subscription', userId: parts[1], plan: parts[2] === 'm' ? 'monthly' : 'weekly' };
  }
  if (raw.startsWith('v:')) {
    const parts = raw.split(':');
    return { type: 'vault_purchase', userId: parts[1], vaultItemId: parts[2], companionId: parts[3] };
  }
  // Legacy JSON format
  try { return JSON.parse(raw); } catch { return { type: 'unknown' }; }
}

export async function POST(request: NextRequest) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret || request.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await request.json();
  const sql = getDb();

  try {
    if (update.pre_checkout_query) {
      await answerPreCheckoutQuery(update.pre_checkout_query.id, true);
      return NextResponse.json({ ok: true });
    }

    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment;
      const payload = parsePayload(payment.invoice_payload);
      const chatId = update.message.chat.id;

      switch (payload.type) {
        case 'gallery_unlock': {
          if (payload.userId) {
            const chargeId = payment.telegram_payment_charge_id;
            const [dup] = await sql`
              SELECT id FROM purchases WHERE stripe_payment_id = ${chargeId} LIMIT 1
            `;
            if (dup) break;
            await sql`
              INSERT INTO purchases (user_id, amount, stripe_payment_id, status)
              VALUES (${payload.userId}::uuid, ${payment.total_amount}, ${chargeId}, 'completed')
            `;

            const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            await sql`
              UPDATE users SET gallery_expires_at = ${expiresAt}, gallery_views = 0 WHERE id = ${payload.userId}::uuid
            `;

            await sendMessage(chatId, "<b>Suscripción de Galería activa!</b> ✨\n\nTienes acceso ilimitado para descubrir nuevas conexiones durante los próximos 30 días. ¡Vuelve a la app y encuentra a tu match!");

            const [payer] = await sql`
              SELECT referred_by FROM users WHERE id = ${payload.userId}::uuid LIMIT 1
            `;
            if (payer?.referred_by) {
              await sql`
                UPDATE users SET gallery_expires_at = ${expiresAt}
                WHERE id = ${payer.referred_by} AND (gallery_expires_at IS NULL OR gallery_expires_at < NOW())
              `;
            }
          }
          break;
        }

        case 'subscription': {
          if (payload.userId) {
            const chargeId = payment.telegram_payment_charge_id;
            const [dup] = await sql`
              SELECT id FROM purchases WHERE stripe_payment_id = ${chargeId} LIMIT 1
            `;
            if (dup) break;
            await sql`
              INSERT INTO purchases (user_id, amount, stripe_payment_id, status)
              VALUES (${payload.userId}::uuid, ${payment.total_amount}, ${chargeId}, 'completed')
            `;

            const days = payload.plan === 'monthly' ? 30 : 7;
            const currentExpiry = await sql`
              SELECT subscription_expires_at FROM users WHERE id = ${payload.userId}::uuid LIMIT 1
            `;
            const now = new Date();
            const currentEnd = currentExpiry[0]?.subscription_expires_at ? new Date(currentExpiry[0].subscription_expires_at) : now;
            const base = currentEnd > now ? currentEnd : now;
            const expiresAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

            await sql`
              UPDATE users
              SET subscription_status = 'active',
                  subscription_expires_at = ${expiresAt},
                  gallery_expires_at = ${expiresAt},
                  gallery_views = 0
              WHERE id = ${payload.userId}::uuid
            `;

            await sendMessage(chatId, `<b>Bienvenido al Círculo Íntimo!</b> 🔥\n\nTienes acceso Premium por 30 días. Mensajes ilimitados y perfiles ilimitados desbloqueados. Mis amigas y yo estamos ansiosas por hablar contigo.`);

            // Bonus: 7 extra days for whoever referred this user
            const [payer] = await sql`
              SELECT referred_by FROM users WHERE id = ${payload.userId}::uuid LIMIT 1
            `;
            if (payer?.referred_by) {
              await sql`
                UPDATE users SET
                  subscription_expires_at = CASE
                    WHEN subscription_status = 'active' AND subscription_expires_at > NOW()
                      THEN subscription_expires_at + INTERVAL '7 days'
                    ELSE NOW() + INTERVAL '7 days'
                  END,
                  subscription_status = 'active'
                WHERE id = ${payer.referred_by}
              `;
              const [referrer] = await sql`
                SELECT telegram_id FROM users WHERE id = ${payer.referred_by} LIMIT 1
              `;
              if (referrer?.telegram_id) {
                await sendMessage(
                  referrer.telegram_id,
                  '<b>Tu amigo acaba de suscribirse!</b> 🎁\n\nComo gracias por traerlo, te regalamos 7 dias extra de Premium. Sigue invitando!'
                ).catch(() => {});
              }
            }

            trackEvent('payment_completed', payload.userId, { type: 'subscription', plan: payload.plan, amount: payment.total_amount });
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

            if (payload.companionId) {
              await creditCreatorEarnings(sql, payload.companionId, payment.total_amount, chargeId);
            }

            await sendMessage(chatId, "<b>Tesoro desbloqueado...</b> 🔓\n\nLo que acabas de adquirir es solo para tus ojos. Disfrútalo en tu bóveda privada.");
            trackEvent('payment_completed', payload.userId, { type: 'vault_purchase', vaultItemId: payload.vaultItemId, amount: payment.total_amount });
          }
          break;
        }
      }
    }

    if (update.callback_query) {
      const cbData = update.callback_query.data;
      const cbChatId = update.callback_query.message?.chat?.id;
      const cbFirstName = update.callback_query.from?.first_name || '';
      const cbTelegramId = update.callback_query.from?.id;

      if (cbData === 'referral_info' && cbChatId && cbTelegramId) {
        const refLink = `https://t.me/${BOT_USERNAME}?start=ref_${cbTelegramId}`;
        await sendMessage(
          cbChatId,
          `<b>Invita y gana</b> 🎁\n\nComparte tu link con amigos:\n\n<code>${refLink}</code>\n\nCuando 3 amigos se unan, desbloqueas la galeria completa GRATIS.\n\nPegalo en tus grupos de WhatsApp, Instagram Stories o donde quieras.`,
        );
      }

      const token = process.env.TELEGRAM_BOT_TOKEN;
      if (token) {
        await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callback_query_id: update.callback_query.id }),
        });
      }
    }

    if (update.message?.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text.trim();
      const firstName = update.message.from?.first_name || '';

      if (text.startsWith('/start')) {
        const param = text.split(' ')[1] || '';
        await handleStart(sql, chatId, firstName, param, update.message.from?.id);
      } else {
        await handleDirectMessage(sql, chatId, firstName, text);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: true });
  }
}

async function handleStart(sql: ReturnType<typeof getDb>, chatId: number, firstName: string, param: string, telegramId?: number) {
  trackEvent('bot_start', null, { chatId, param: param || null, telegramId });
  if (param.startsWith('crea_')) {
    const companionId = param.replace('crea_', '');
    const [companion] = await sql`
      SELECT name, photo_url, tagline FROM companions
      WHERE id = ${companionId}::uuid AND status = 'active' LIMIT 1
    `;

    if (companion) {
      const webappUrl = `${WEBAPP_URL}/chat/${companionId}`;
      await sendPhoto(
        chatId,
        companion.photo_url,
        `<b>${companion.name}</b> te esta esperando...\n\n<i>"${companion.tagline || 'Descubre mi mundo secreto'}"</i>\n\nToca el boton para empezar a hablar con ella.`,
        {
          inline_keyboard: [[
            { text: `Chatear con ${companion.name}`, web_app: { url: webappUrl } },
          ]],
        }
      );
      return;
    }
  }

  const gallery = await sql`
    SELECT name, photo_url FROM companions WHERE status = 'active' ORDER BY random() LIMIT 3
  `;
  const names = gallery.map(c => c.name).join(', ');

  await sendMessage(
    chatId,
    `<b>Bienvenido a AuraSecret</b>, ${firstName} ✨\n\nAquí encontrarás conexiones exclusivas con mujeres reales y fascinantes.\n\n🔥 <b>${names}</b> y más te están esperando.\n\n12 mensajes gratis para que conozcas a quien quieras. Después, tú decides si quieres más.`,
    {
      inline_keyboard: [
        [{ text: '💫 Descubrir conexiones', web_app: { url: WEBAPP_URL } }],
        [{ text: '👥 Invita amigos y gana acceso gratis', callback_data: 'referral_info' }],
      ],
    }
  );
}

const FLIRT_RESPONSES = [
  'Mmm, me encanta que me escribas aqui... pero mis secretos estan dentro de la app 😏',
  'Eres curioso, eso me gusta. Pero lo mejor de mi esta en un lugar mas privado...',
  'No seas timido, entra a la app y ahi hablamos como se debe 🔥',
  'Aqui no puedo ser tan... expresiva. Entra a la app y te muestro 😉',
  'Shhh, no aqui. Lo que tengo para ti es demasiado especial para este chat.',
];

async function handleDirectMessage(sql: ReturnType<typeof getDb>, chatId: number, firstName: string, text: string) {
  if (text === '/help') {
    await sendMessage(
      chatId,
      `<b>AuraSecret</b> — Conexiones exclusivas\n\nComandos:\n/start — Abrir la app\n/help — Ver esta ayuda\n\nEscribeme cualquier cosa y te respondo 😉`,
      {
        inline_keyboard: [[
          { text: '💫 Abrir AuraSecret', web_app: { url: WEBAPP_URL } },
        ]],
      }
    );
    return;
  }

  const response = FLIRT_RESPONSES[Math.floor(Math.random() * FLIRT_RESPONSES.length)];

  await sendMessage(
    chatId,
    `${response}\n\n<i>"${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"</i> — me lo guardas para alla dentro, ${firstName}.`,
    {
      inline_keyboard: [[
        { text: '💬 Entrar a la app', web_app: { url: WEBAPP_URL } },
      ]],
    }
  );
}
