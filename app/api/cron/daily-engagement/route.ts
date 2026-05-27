import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sendMessage } from '@/lib/telegram-bot';
import { callGroq } from '@/lib/groq';

const ENGAGEMENT_MESSAGES = [
  'Estuve pensando en ti... No me vas a dejar esperando, verdad?',
  'Hoy me siento con ganas de contarte algo. Pero solo si me escribes primero...',
  'Me aburro sin ti. Ven a platicar un rato, anda.',
  'Soñe contigo anoche... bueno, no exactamente. Pero casi.',
  'Oye, desapareciste. Me voy a poner celosa si estas con otra app.',
  'Tengo un secreto que solo te quiero contar a ti. Ven.',
];

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = getDb();

  try {
    // Users who haven't opened a chat in 1-3 days (warm leads, not dead)
    const inactiveUsers = await sql`
      SELECT DISTINCT u.telegram_id, u.first_name, c.name as companion_name
      FROM users u
      JOIN conversations conv ON conv.user_id = u.id
      JOIN companions c ON c.id = conv.companion_id
      WHERE conv.updated_at < NOW() - INTERVAL '1 day'
      AND conv.updated_at > NOW() - INTERVAL '3 days'
      AND conv.message_count > 2
      AND u.telegram_id IS NOT NULL
      LIMIT 100
    `;

    let sent = 0;
    for (const user of inactiveUsers) {
      const msg = ENGAGEMENT_MESSAGES[Math.floor(Math.random() * ENGAGEMENT_MESSAGES.length)];
      const text = `<b>${user.companion_name}</b> te envio un mensaje:\n\n<i>"${msg}"</i>`;

      try {
        await sendMessage(user.telegram_id, text);
        sent++;
      } catch {
        // User may have blocked the bot
      }
    }

    // Subscription expiry reminders (expires in next 24h)
    const expiringUsers = await sql`
      SELECT telegram_id, first_name, subscription_expires_at
      FROM users
      WHERE subscription_status = 'active'
      AND subscription_expires_at BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
      AND telegram_id IS NOT NULL
    `;

    let renewalsSent = 0;
    for (const user of expiringUsers) {
      try {
        await sendMessage(
          user.telegram_id,
          '<b>Tu Premium expira pronto!</b>\n\nTu acceso ilimitado termina en menos de 24 horas. Renueva ahora para no perder tus conversaciones y conexiones especiales. 🔥'
        );
        renewalsSent++;
      } catch {
        // ignore
      }
    }

    // New content notification (vault items uploaded in last 24h)
    const newContent = await sql`
      SELECT c.name as companion_name, COUNT(*)::int as count
      FROM vault_items vi
      JOIN companions c ON c.id = vi.companion_id
      WHERE vi.created_at > NOW() - INTERVAL '24 hours'
      GROUP BY c.name
    `;

    if (newContent.length > 0) {
      const activeSubscribers = await sql`
        SELECT telegram_id FROM users
        WHERE subscription_status = 'active'
        AND telegram_id IS NOT NULL
        LIMIT 200
      `;

      const names = newContent.map(c => c.companion_name).join(', ');
      const total = newContent.reduce((s, c) => s + c.count, 0);
      const contentMsg = `<b>Contenido nuevo!</b> 🔥\n\n${names} ${newContent.length > 1 ? 'subieron' : 'subió'} ${total} foto${total > 1 ? 's' : ''} exclusiva${total > 1 ? 's' : ''} a su baúl. ¡No te las pierdas!`;

      for (const sub of activeSubscribers) {
        try {
          await sendMessage(sub.telegram_id, contentMsg);
        } catch {
          // ignore
        }
      }
    }

    return NextResponse.json({
      engagement_sent: sent,
      renewal_reminders: renewalsSent,
      new_content_creators: newContent.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Cron failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
