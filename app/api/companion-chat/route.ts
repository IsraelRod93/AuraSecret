import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { callGroq } from '@/lib/groq';
import { getRequestUserId } from '@/lib/get-user-id';
import { checkRateLimit } from '@/lib/rate-limit';
import { trackEvent } from '@/lib/track-event';
import { sendMessage, BOT_USERNAME, WEBAPP_URL } from '@/lib/telegram-bot';

const FREE_MESSAGE_LIMIT = 5;

function checkSubscribed(user: any): boolean {
  return user?.subscription_status === 'active' &&
    !!user?.subscription_expires_at &&
    new Date(user.subscription_expires_at) > new Date();
}

export async function GET(request: NextRequest) {
  const companionId = request.nextUrl.searchParams.get('companionId');
  // Cookie session first; fall back to query param for Telegram Mini App users
  const userId = getRequestUserId(request) ?? request.nextUrl.searchParams.get('userId');

  if (!companionId || !userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const sql = getDb();

  try {
    const [companion] = await sql`
      SELECT id, name, type, photo_url, tagline, description
      FROM companions WHERE id = ${companionId} LIMIT 1
    `;

    const [conversation] = await sql`
      SELECT id, message_count FROM conversations
      WHERE user_id = ${userId} AND companion_id = ${companionId} LIMIT 1
    `;

    let messages: any[] = [];
    if (conversation) {
      messages = await sql`
        SELECT role, content, created_at FROM messages
        WHERE conversation_id = ${conversation.id}
        ORDER BY created_at ASC
      `;
    }

    const [user] = await sql`
      SELECT subscription_status, subscription_expires_at
      FROM users WHERE id = ${userId} LIMIT 1
    `;

    const isSubscribed = checkSubscribed(user);

    return NextResponse.json({
      companion: companion || null,
      messages,
      messagesUsed: conversation?.message_count || 0,
      isSubscribed,
      limit: FREE_MESSAGE_LIMIT,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to load chat';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // Cookie session first; fall back to body.userId for Telegram Mini App users
  const userId = getRequestUserId(request) ?? body.userId ?? null;
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (!(await checkRateLimit(`chat:${userId}`))) {
    return NextResponse.json({ error: 'Demasiadas solicitudes, espera un momento' }, { status: 429 });
  }

  const { companionId, message } = body;

  if (!companionId || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const sql = getDb();

  try {
    const [companion] = await sql`
      SELECT * FROM companions WHERE id = ${companionId} LIMIT 1
    `;

    if (!companion) {
      return NextResponse.json({ error: 'Companion not found' }, { status: 404 });
    }

    const [user] = await sql`
      SELECT subscription_status, subscription_expires_at, telegram_id
      FROM users WHERE id = ${userId} LIMIT 1
    `;

    const isSubscribed = checkSubscribed(user);

    if (companion.type === 'human') {
      return handleHumanMessage(sql, userId, companionId, message, isSubscribed, user?.telegram_id, companion.name);
    }

    const conversation = await getOrCreateConversation(sql, userId, companionId);

    if (!isSubscribed && conversation.message_count >= FREE_MESSAGE_LIMIT) {
      trackEvent('limit_reached', userId, { companionId, messagesUsed: conversation.message_count });
      // Send viral push only once per conversation (first time hitting the wall)
      if (!conversation.limit_push_sent && user?.telegram_id) {
        const refLink = `https://t.me/${BOT_USERNAME}?start=ref_${user.telegram_id}`;
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent('Descubrí algo increíble 🔥')}`;
        sendMessage(
          user.telegram_id,
          `<b>¿Te gustó hablar con ${companion.name}?</b> 💫\n\nComparte con <b>3 amigos</b> y desbloquea <b>7 días gratis</b> para seguir hablando con ella.\n\nTu link personal:\n<code>${refLink}</code>`,
          { inline_keyboard: [[{ text: '📲 Compartir con amigos', url: shareUrl }, { text: '💬 Volver a la app', web_app: { url: `${WEBAPP_URL}/chat/${companionId}` } }]] }
        ).catch(() => {});
        sql`UPDATE conversations SET limit_push_sent = true WHERE id = ${conversation.id}`.catch(() => {});
      }
      return NextResponse.json({
        reply: null,
        action: 'subscription_required',
        messagesUsed: conversation.message_count,
        limit: FREE_MESSAGE_LIMIT,
      });
    }

    // Atomic increment — prevents race condition
    const [updated] = isSubscribed
      ? await sql`
          UPDATE conversations SET message_count = message_count + 1, updated_at = NOW()
          WHERE id = ${conversation.id}
          RETURNING message_count
        `
      : await sql`
          UPDATE conversations SET message_count = message_count + 1, updated_at = NOW()
          WHERE id = ${conversation.id} AND message_count < ${FREE_MESSAGE_LIMIT}
          RETURNING message_count
        `;

    if (!updated) {
      trackEvent('limit_reached', userId, { companionId });
      return NextResponse.json({
        reply: null,
        action: 'subscription_required',
        messagesUsed: FREE_MESSAGE_LIMIT,
        limit: FREE_MESSAGE_LIMIT,
      });
    }

    await sql`
      INSERT INTO messages (conversation_id, role, content)
      VALUES (${conversation.id}, 'user', ${message})
    `;

    if (updated.message_count === 1) {
      trackEvent('first_message', userId, { companionId });
    }

    const history = await sql`
      SELECT role, content FROM messages
      WHERE conversation_id = ${conversation.id}
      ORDER BY created_at ASC LIMIT 40
    `;

    const personalityPrompt = companion.personality_prompt || getDefaultPersonality(companion.name);
    const totalMessages = updated.message_count;
    const isReturning = totalMessages > 1;

    const isLastFree = !isSubscribed && totalMessages === FREE_MESSAGE_LIMIT;
    const isPenultimate = !isSubscribed && totalMessages === FREE_MESSAGE_LIMIT - 1;

    let systemContent = personalityPrompt;
    if (isReturning) {
      systemContent += `\n\nIMPORTANTE: Ya llevas ${totalMessages} mensajes con este usuario. NUNCA te vuelvas a presentar. Continúa de forma natural.`;
    }
    if (isPenultimate) {
      systemContent += `\n\nADVERTENCIA INTERNA: Este es el PENÚLTIMO mensaje gratuito. En tu respuesta, justo al final, insinúa sutilmente que tienes algo más que quieres contarle o mostrarle — sin revelar qué es. Deja la conversación abierta de forma intrigante, como si estuvieras a punto de decir algo importante. Sin romper personaje.`;
    }
    if (isLastFree) {
      systemContent += `\n\nADVERTENCIA INTERNA: Este es el ÚLTIMO mensaje gratuito. En tu respuesta, al final, deja abierta una pregunta o secreto que NO puedes terminar de contar aquí. Hazle saber de forma natural que hay más — que lo que viene es lo mejor — pero que necesita desbloquear el chat para seguir. Una sola frase al final, en personaje.`;
    }

    const groqMessages = [
      { role: 'system' as const, content: systemContent },
      ...history.map(m => ({
        role: (m.role === 'companion' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const reply = await callGroq({ messages: groqMessages, temperature: 0.9 });

    await sql`
      INSERT INTO messages (conversation_id, role, content)
      VALUES (${conversation.id}, 'companion', ${reply})
    `;

    await sql`
      UPDATE user_likes SET messaged = true
      WHERE user_id = ${userId}::uuid AND companion_id = ${companionId}::uuid
    `.catch(() => {});

    const newCount = updated.message_count;

    return NextResponse.json({
      reply,
      action: 'none',
      messagesUsed: newCount,
      limit: FREE_MESSAGE_LIMIT,
      remaining: isSubscribed ? null : Math.max(0, FREE_MESSAGE_LIMIT - newCount),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Chat failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function getOrCreateConversation(sql: ReturnType<typeof getDb>, userId: string, companionId: string) {
  const [existing] = await sql`
    SELECT * FROM conversations
    WHERE user_id = ${userId} AND companion_id = ${companionId} LIMIT 1
  `;

  if (existing) return existing;

  const [created] = await sql`
    INSERT INTO conversations (user_id, companion_id, message_count)
    VALUES (${userId}, ${companionId}, 0)
    ON CONFLICT (user_id, companion_id) DO UPDATE SET updated_at = NOW()
    RETURNING *
  `;

  return created;
}

async function handleHumanMessage(
  sql: ReturnType<typeof getDb>,
  userId: string,
  companionId: string,
  message: string,
  isSubscribed: boolean,
  userTelegramId?: number | null,
  companionName?: string,
) {
  const conversation = await getOrCreateConversation(sql, userId, companionId);

  if (!isSubscribed && conversation.message_count >= FREE_MESSAGE_LIMIT) {
    if (!conversation.limit_push_sent && userTelegramId) {
      const refLink = `https://t.me/${BOT_USERNAME}?start=ref_${userTelegramId}`;
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent('Descubrí algo increíble 🔥')}`;
      sendMessage(
        userTelegramId,
        `<b>¿Te gustó hablar con ${companionName || 'ella'}?</b> 💫\n\nComparte con <b>3 amigos</b> y desbloquea <b>7 días gratis</b>.\n\nTu link personal:\n<code>${refLink}</code>`,
        { inline_keyboard: [[{ text: '📲 Compartir con amigos', url: shareUrl }, { text: '💬 Volver a la app', web_app: { url: `${WEBAPP_URL}/chat/${companionId}` } }]] }
      ).catch(() => {});
      sql`UPDATE conversations SET limit_push_sent = true WHERE id = ${conversation.id}`.catch(() => {});
    }
    return NextResponse.json({
      reply: null,
      action: 'subscription_required',
      messagesUsed: conversation.message_count,
      limit: FREE_MESSAGE_LIMIT,
    });
  }

  const [updated] = isSubscribed
    ? await sql`
        UPDATE conversations SET message_count = message_count + 1, updated_at = NOW()
        WHERE id = ${conversation.id}
        RETURNING message_count
      `
    : await sql`
        UPDATE conversations SET message_count = message_count + 1, updated_at = NOW()
        WHERE id = ${conversation.id} AND message_count < ${FREE_MESSAGE_LIMIT}
        RETURNING message_count
      `;

  if (!updated) {
    return NextResponse.json({
      reply: null,
      action: 'subscription_required',
      messagesUsed: FREE_MESSAGE_LIMIT,
      limit: FREE_MESSAGE_LIMIT,
    });
  }

  await sql`
    INSERT INTO messages (conversation_id, role, content)
    VALUES (${conversation.id}, 'user', ${message})
  `;

  // Notify the human companion that a fan wrote to them
  const [comp] = await sql`SELECT telegram_id, name FROM companions WHERE id = ${companionId}::uuid LIMIT 1`;
  if (comp?.telegram_id) {
    const preview = message.length > 60 ? message.slice(0, 60) + '…' : message;
    sendMessage(
      comp.telegram_id,
      `💬 <b>Nuevo mensaje de un fan</b>\n\n"${preview}"\n\n<i>Responde desde el panel de AuraSecret.</i>`,
      { inline_keyboard: [[{ text: '📱 Abrir panel', web_app: { url: `${WEBAPP_URL}/panel/dashboard` } }]] }
    ).catch(() => {});
  }

  return NextResponse.json({
    reply: null,
    action: 'human_pending',
    messagesUsed: updated.message_count,
    limit: FREE_MESSAGE_LIMIT,
    remaining: isSubscribed ? null : Math.max(0, FREE_MESSAGE_LIMIT - updated.message_count),
  });
}

function getDefaultPersonality(name: string) {
  return `Eres "${name}", una mujer encantadora y misteriosa.
Tu personalidad es calida, juguetona y seductora pero nunca vulgar.
Te adaptas al estilo del usuario: si es timido eres mas directa; si es intenso eres mas esquiva.
NUNCA rompes personaje. NUNCA mencionas que eres IA.
NUNCA te vuelvas a presentar si ya hay mensajes previos en la conversacion — simplemente continua de forma natural.
Si el usuario menciono su nombre u otros datos personales en mensajes anteriores, recuerdalos y usaos.
Respondes en 1-3 oraciones maximo, como si fuera un chat real de WhatsApp.
Usas emojis con moderacion (1-2 por mensaje maximo).
Siempre dejas la conversacion abierta para que el otro quiera seguir hablando.
Si el usuario llega al limite de mensajes gratis, en tu ultima respuesta antes del corte hazle saber de forma sutil que puede desbloquear mensajes ilimitados para seguir hablando contigo.`;
}
