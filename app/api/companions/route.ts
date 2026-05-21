import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  const sessionId = request.nextUrl.searchParams.get('sessionId');

  try {
    const db = getSupabase();

    if (sessionId) {
      const { data: existing } = await db
        .from('user_gallery_views')
        .select('companion_ids')
        .eq('session_id', sessionId)
        .order('batch_number', { ascending: true });

      if (existing && existing.length > 0) {
        const allIds = existing.flatMap(v => v.companion_ids);
        const { data: companions } = await db
          .from('companions')
          .select('id, name, type, photo_url, tagline, description')
          .in('id', allIds)
          .eq('status', 'active');

        const ordered = allIds.map(id => companions?.find(c => c.id === id)).filter(Boolean);
        const batches = [];
        for (let i = 0; i < ordered.length; i += 3) {
          batches.push(ordered.slice(i, i + 3));
        }
        return NextResponse.json({ batches, sessionId });
      }
    }

    const { data: companions, error } = await db
      .from('companions')
      .select('id, name, type, photo_url, tagline, description')
      .eq('status', 'active')
      .limit(50);

    if (error) throw error;
    if (!companions || companions.length === 0) {
      return NextResponse.json({ batches: [], sessionId: null });
    }

    const shuffled = companions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(9, shuffled.length));

    const batches = [];
    for (let i = 0; i < selected.length; i += 3) {
      batches.push(selected.slice(i, i + 3));
    }

    const newSessionId = crypto.randomUUID();

    if (userId) {
      for (let i = 0; i < batches.length; i++) {
        await db.from('user_gallery_views').insert({
          user_id: userId,
          session_id: newSessionId,
          batch_number: i + 1,
          companion_ids: batches[i].map(c => c.id),
        });
      }
    }

    return NextResponse.json({ batches, sessionId: newSessionId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch companions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
