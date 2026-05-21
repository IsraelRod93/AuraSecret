import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  const sql = getDb();

  try {
    const chats = await sql`
      SELECT
        c.companion_id,
        c.message_count,
        c.updated_at,
        comp.name,
        comp.type,
        comp.photo_url,
        (
          SELECT content FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC LIMIT 1
        ) as last_message,
        (
          SELECT role FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC LIMIT 1
        ) as last_message_role
      FROM conversations c
      JOIN companions comp ON comp.id = c.companion_id
      WHERE c.user_id = ${userId} AND c.message_count > 0
      ORDER BY c.updated_at DESC
    `;

    return NextResponse.json({
      chats: chats.map(c => ({
        companionId: c.companion_id,
        name: c.name,
        type: c.type,
        photo_url: c.photo_url,
        messageCount: c.message_count,
        lastMessage: c.last_message || '',
        lastMessageRole: c.last_message_role || '',
        updatedAt: c.updated_at,
      })),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to load chats';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
