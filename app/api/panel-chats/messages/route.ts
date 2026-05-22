import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const conversationId = request.nextUrl.searchParams.get('conversationId');
  if (!conversationId) {
    return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
  }

  const sql = getDb();

  try {
    // Verify the conversation belongs to this companion
    const [conv] = await sql`
      SELECT id FROM conversations
      WHERE id = ${conversationId}::uuid AND companion_id = ${session.companionId}::uuid
      LIMIT 1
    `;
    if (!conv) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 403 });
    }

    const messages = await sql`
      SELECT role, content, created_at FROM messages
      WHERE conversation_id = ${conversationId}::uuid
      ORDER BY created_at ASC
    `;

    return NextResponse.json({ messages });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { conversationId, content } = await request.json();
  if (!conversationId || !content) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const sql = getDb();

  try {
    // Verify the conversation belongs to this companion before writing
    const [conv] = await sql`
      SELECT id FROM conversations
      WHERE id = ${conversationId}::uuid AND companion_id = ${session.companionId}::uuid
      LIMIT 1
    `;
    if (!conv) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 403 });
    }

    await sql`
      INSERT INTO messages (conversation_id, role, content)
      VALUES (${conversationId}::uuid, 'companion', ${content})
    `;

    await sql`
      UPDATE conversations SET updated_at = NOW()
      WHERE id = ${conversationId}::uuid
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
