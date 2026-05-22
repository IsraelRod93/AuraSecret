import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const companionId = request.nextUrl.searchParams.get('companionId');
  if (!companionId) {
    return NextResponse.json({ error: 'Missing companionId' }, { status: 400 });
  }

  const sql = getDb();

  try {
    const chats = await sql`
      SELECT
        c.id as conversation_id,
        c.user_id,
        c.message_count,
        c.updated_at,
        u.first_name,
        u.username,
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
      JOIN users u ON u.id = c.user_id
      WHERE c.companion_id = ${companionId}::uuid AND c.message_count > 0
      ORDER BY c.updated_at DESC
    `;

    return NextResponse.json({ chats });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
