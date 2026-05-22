import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { callGroq } from '@/lib/groq';

const FREE_MESSAGE_LIMIT = 12;

function checkSubscribed(user: any): boolean {
  return user?.subscription_status === 'active' &&
    !!user?.subscription_expires_at &&
    new Date(user.subscription_expires_at) > new Date();
}

export async function GET(request: NextRequest) {
  const companionId = request.nextUrl.searchParams.get('companionId');
  const userId = request.nextUrl.searchParams.get('userId');

  if (!companionId || !userId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
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
  const { companionId, message, userId } = await request.json();

  if (!companionId || !message || !userId) {
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
      SELECT subscription_status, subscription_expires_at
      FROM users WHERE id = ${userId} LIMIT 1
    `;

    const isSubscribed = checkSubscribed(user);

    if (companion.type === 'human') {
      return handleHumanMessage(sql, userId, companionId, message, isSubscribed);
    }

    const conversation = await getOrCreateConversation(sql, userId, companionId);

    if (!isSubscribed && conversation.message_count >= FREE_MESSAGE_LIMIT) {
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

    const history = await sql`
      SELECT role, content FROM messages
      WHERE conversation_id = ${conversation.id}
      ORDER BY created_at ASC LIMIT 20
    `;

    const personalityPrompt = companion.personality_prompt || getDefaultPersonality(companion.name);

    const groqMessages = [
      { role: 'system' as const, content: personalityPrompt },
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

async function handleHumanMessage(sql: ReturnType<typeof getDb>, userId: string, companionId: string, message: string, isSubscribed: boolean) {
  const conversation = await getOrCreateConversation(sql, userId, companionId);

  if (!isSubscribed && conversation.message_count >= FREE_MESSAGE_LIMIT) {
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
Respondes en 1-3 oraciones maximo, como si fuera un chat real de WhatsApp.
Usas emojis con moderacion (1-2 por mensaje maximo).
Siempre dejas la conversacion abierta para que el otro quiera seguir hablando.
Si el usuario llega al limite de mensajes gratis, en tu ultima respuesta antes del corte hazle saber de forma sutil que puede desbloquear mensajes ilimitados para seguir hablando contigo.`;
}
