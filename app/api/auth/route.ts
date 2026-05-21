import { NextRequest, NextResponse } from 'next/server';
import { validateTelegramInitData } from '@/lib/telegram';
import { getSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { initData } = await request.json();

    if (!initData) {
      return NextResponse.json({ error: 'initData required' }, { status: 400 });
    }

    const validated = validateTelegramInitData(initData);
    if (!validated) {
      return NextResponse.json({ error: 'Invalid Telegram data' }, { status: 401 });
    }

    const { user: tgUser } = validated;
    const db = getSupabase();

    const { data: existing } = await db
      .from('users')
      .select('*')
      .eq('telegram_id', tgUser.id)
      .single();

    if (existing) {
      await db
        .from('users')
        .update({
          username: tgUser.username || null,
          first_name: tgUser.first_name,
        })
        .eq('id', existing.id);

      return NextResponse.json({ user: existing });
    }

    const { data: newUser, error } = await db
      .from('users')
      .insert([{
        telegram_id: tgUser.id,
        username: tgUser.username || null,
        first_name: tgUser.first_name,
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ user: newUser });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Auth failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
