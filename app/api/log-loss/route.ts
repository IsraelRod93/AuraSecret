import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  const { userId, lastAiMessage, lastUserMessage, currentPhase } = await request.json();

  try {
    const sql = getDb();
    await sql`
      INSERT INTO loss_logs (user_id, last_ai_message, last_user_message, current_phase)
      VALUES (${userId}, ${lastAiMessage}, ${lastUserMessage}, ${currentPhase})
    `;
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Log failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
