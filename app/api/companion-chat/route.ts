import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { callGroq } from '@/lib/groq';

const FREE_MESSAGE_LIMIT = 7;

export async function GET(request: NextRequest) {
  const companionId = request.nextUrl.searchParams.get('companionId');
  const userId = request.nextUrl.searchParams.get('userId');

  if (!companionId || !userId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const db = getSupabase();

  try {
    const { data: companion } = await db
      .from('companions')
      .select('id, name, type, photo_url, tagline, description')
      .eq('id', companionId)
      .single();

    const { data: conversation } = await db
      .from('conversations')
      .select('id, message_count')
      .eq('user_id', userId)
      .eq('companion_id', companionId)
      .single();

    let messages: { role: string; content: string; created_at: string }[] = [];
    if (conversation) {
      const { data } = await db
        .from('messages')
        .select('role, content, created_at')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });
      messages = data || [];
    }

    const { data: user } = await db
      .from('users')
      .select('subscription_status, subscription_expires_at')
      .eq('id', userId)
      .single();

    const isSubscribed = user?.subscription_status === 'active' &&
      user?.subscription_expires_at &&
      new Date(user.subscription_expires_at) > new Date();

    return NextResponse.json({
      companion,
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

  const db = getSupabase();

  try {
    const { data: companion } = await db
      .from('companions')
      .select('*')
      .eq('id', companionId)
      .single();

    if (!companion) {
      return NextResponse.json({ error: 'Companion not found' }, { status: 404 });
    }

    if (companion.type === 'human') {
      return handleHumanMessage(db, userId, companionId, message);
    }

    const { data: user } = await db
      .from('users')
      .select('subscription_status, subscription_expires_at')
      .eq('id', userId)
      .single();

    const isSubscribed = user?.subscription_status === 'active' &&
      user?.subscription_expires_at &&
      new Date(user.subscription_expires_at) > new Date();

    let conversation = await getOrCreateConversation(db, userId, companionId);

    if (!isSubscribed && conversation.message_count >= FREE_MESSAGE_LIMIT) {
      return NextResponse.json({
        reply: null,
        action: 'subscription_required',
        messagesUsed: conversation.message_count,
        limit: FREE_MESSAGE_LIMIT,
      });
    }

    await db.from('messages').insert({
      conversation_id: conversation.id,
      role: 'user',
      content: message,
    });

    const { data: history } = await db
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(20);

    const personalityPrompt = companion.personality_prompt || getDefaultPersonality(companion.name);

    const groqMessages = [
      { role: 'system' as const, content: personalityPrompt },
      ...(history || []).map(m => ({
        role: (m.role === 'companion' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const reply = await callGroq({ messages: groqMessages, temperature: 0.9 });

    await db.from('messages').insert({
      conversation_id: conversation.id,
      role: 'companion',
      content: reply,
    });

    const newCount = conversation.message_count + 1;
    await db
      .from('conversations')
      .update({ message_count: newCount, updated_at: new Date().toISOString() })
      .eq('id', conversation.id);

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

async function getOrCreateConversation(db: ReturnType<typeof getSupabase>, userId: string, companionId: string) {
  const { data: existing } = await db
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('companion_id', companionId)
    .single();

  if (existing) return existing;

  const { data: created, error } = await db
    .from('conversations')
    .insert({ user_id: userId, companion_id: companionId, message_count: 0 })
    .select()
    .single();

  if (error) throw error;
  return created;
}

async function handleHumanMessage(db: ReturnType<typeof getSupabase>, userId: string, companionId: string, message: string) {
  const conversation = await getOrCreateConversation(db, userId, companionId);

  await db.from('messages').insert({
    conversation_id: conversation.id,
    role: 'user',
    content: message,
  });

  await db
    .from('conversations')
    .update({ message_count: conversation.message_count + 1, updated_at: new Date().toISOString() })
    .eq('id', conversation.id);

  return NextResponse.json({
    reply: null,
    action: 'human_pending',
    messagesUsed: conversation.message_count + 1,
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
