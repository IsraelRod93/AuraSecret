import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const companionId = request.nextUrl.searchParams.get('companionId');
  const userId = request.nextUrl.searchParams.get('userId');

  if (!companionId) {
    return NextResponse.json({ error: 'companionId required' }, { status: 400 });
  }

  const db = getSupabase();

  try {
    const { data: items, error } = await db
      .from('vault_items')
      .select('id, type, title, price, thumbnail_url, description, file_url')
      .eq('companion_id', companionId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    let purchasedIds: string[] = [];
    if (userId) {
      const { data: purchases } = await db
        .from('purchases')
        .select('vault_item_id')
        .eq('user_id', userId)
        .eq('status', 'completed');

      purchasedIds = (purchases || []).map(p => p.vault_item_id);
    }

    const enriched = (items || []).map(item => ({
      ...item,
      purchased: purchasedIds.includes(item.id),
      file_url: purchasedIds.includes(item.id) ? item.file_url : null,
    }));

    return NextResponse.json({ items: enriched });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch vault';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
