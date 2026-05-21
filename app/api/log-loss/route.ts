import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const { userId, lastAiMessage, lastUserMessage, currentPhase } = await request.json();

  try {
    const { error } = await getSupabase().from('loss_logs').insert([{
      user_id: userId,
      last_ai_message: lastAiMessage,
      last_user_message: lastUserMessage,
      current_phase: currentPhase,
    }]);

    if (error) throw error;
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Log failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
