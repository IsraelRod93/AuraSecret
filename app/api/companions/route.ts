import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  const sessionId = request.nextUrl.searchParams.get('sessionId');

  try {
    const db = getSupabase();

    if (sessionId) {
      const { data: allCompanions } = await db.rpc('get_active_companions');
      if (allCompanions) {
        const { data: existing } = await db
          .from('user_gallery_views')
          .select('companion_ids')
          .eq('session_id', sessionId)
          .order('batch_number', { ascending: true });

        if (existing && existing.length > 0) {
          const allIds = existing.flatMap(v => v.companion_ids);
          const ordered = allIds
            .map(id => allCompanions.find((c: any) => c.id === id))
            .filter(Boolean)
            .map((c: any) => ({ id: c.id, name: c.name, type: c.type, photo_url: c.photo_url, tagline: c.tagline, description: c.description }));
          const batches = [];
          for (let i = 0; i < ordered.length; i += 3) {
            batches.push(ordered.slice(i, i + 3));
          }
          return NextResponse.json({ batches, sessionId });
        }
      }
    }

    const { data: companions, error } = await db.rpc('get_active_companions');
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

    // gallery view tracking skipped - will add via rpc

    return NextResponse.json({ batches, sessionId: newSessionId });
  } catch (error) {
    return NextResponse.json({ error: JSON.stringify(error) }, { status: 500 });
  }
}
