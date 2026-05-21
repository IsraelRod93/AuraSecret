import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { callGroq } from '@/lib/groq';

const FREE_MESSAGE_LIMIT = 7;

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

    const isSubscribed = user?.subscription_status === 'active' &&
      user?.subscription_expires_at &&
      new Date(user.subscription_expires_at) > new Date();

    return NextResponse.json({
      companion: companion || null,
      messages,
      messagesUsed: conversation?.message_count || 0,
      isSubscribed,
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

    if (companion.type === 'human') {
      return handleHumanMessage(sql, userId, companionId, message);
    }

    const [user] = await sql`
      SELECT subscription_status, subscription_expires_at
      FROM users WHERE id = ${userId} LIMIT 1
    `;

    const isSubscribed = user?.subscription_status === 'active' &&
      user?.subscription_expires_at &&
      new Date(user.subscription_expires_at) > new Date();

    const conversation = await getOrCreateConversation(sql, userId, companionId);

    if (!isSubscribed && conversation.message_count >= FREE_MESSAGE_LIMIT) {
      return NextResponse.json({
        reply: null,
        action: 'subscription_required',
        messagesUsed: conversation.message_count,
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

    const newCount = conversation.message_count + 1;
    await sql`
      UPDATE conversations SET message_count = ${newCount}, updated_at = NOW()
      WHERE id = ${conversation.id}
    `;

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
    RETURNING *
  `;

  return created;
}

async function handleHumanMessage(sql: ReturnType<typeof getDb>, userId: string, companionId: string, message: string) {
  const conversation = await getOrCreateConversation(sql, userId, companionId);

  await sql`
    INSERT INTO messages (conversation_id, role, content)
    VALUES (${conversation.id}, 'user', ${message})
  `;

  const newCount = conversation.message_count + 1;
  await sql`
    UPDATE conversations SET message_count = ${newCount}, updated_at = NOW()
    WHERE id = ${conversation.id}
  `;

  return NextResponse.json({
    reply: null,
    action: 'human_pending',
    messagesUsed: newCount,
  });
}

function getDefaultPersonality(name: string) {
  return `Eres "${name}", una mujer encantadora y misteriosa.
Tu personalidad es calida, juguetona y seductora pero nunca vulgar.
Te adaptas al estilo del usuario: si es timido eres mas directa; si es intenso eres mas esquiva.
NUNCA rompes personaje. NUNCA mencionas que eres IA.
Respondes en 1-3 oraciones maximo, como si fuera un chat real de WhatsApp.
Usas emojis con moderacion (1-2 por mensaje maximo).
Siempre dejas la conversacion abierta para que el otro quiera seguir hablando.`;
}
