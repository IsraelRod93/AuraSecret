import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  const db = getSupabase();

  try {
    const { data: conversations } = await db
      .from('conversations')
      .select('id, companion_id, message_count, updated_at')
      .eq('user_id', userId)
      .gt('message_count', 0)
      .order('updated_at', { ascending: false });

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ chats: [] });
    }

    const companionIds = conversations.map(c => c.companion_id);
    const { data: companions } = await db
      .from('companions')
      .select('id, name, type, photo_url')
      .in('id', companionIds);

    const { data: lastMessages } = await db
      .from('messages')
      .select('conversation_id, content, role, created_at')
      .in('conversation_id', conversations.map(c => c.id))
      .order('created_at', { ascending: false });

    const lastMsgMap = new Map<string, { content: string; role: string }>();
    for (const msg of lastMessages || []) {
      if (!lastMsgMap.has(msg.conversation_id)) {
        lastMsgMap.set(msg.conversation_id, { content: msg.content, role: msg.role });
      }
    }

    const chats = conversations.map(conv => {
      const companion = companions?.find(c => c.id === conv.companion_id);
      const lastMsg = lastMsgMap.get(conv.id);
      return {
        companionId: conv.companion_id,
        name: companion?.name || 'Desconocida',
        type: companion?.type || 'ai',
        photo_url: companion?.photo_url || '',
        messageCount: conv.message_count,
        lastMessage: lastMsg?.content || '',
        lastMessageRole: lastMsg?.role || '',
        updatedAt: conv.updated_at,
      };
    });

    return NextResponse.json({ chats });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to load chats';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
