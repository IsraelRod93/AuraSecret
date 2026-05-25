import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  const sql = getDb();

  try {
    if (!userId) {
      return NextResponse.json({ items: [] });
    }

    const items = await sql`
      SELECT vi.id, vi.type, vi.title, vi.price, vi.thumbnail_url, vi.group_name, vi.companion_id,
             c.name as companion_name, c.photo_url as companion_photo
      FROM vault_items vi
      JOIN companions c ON c.id = vi.companion_id AND c.status = 'active'
      WHERE vi.companion_id IN (
        SELECT DISTINCT p.companion_id FROM purchases p
        WHERE p.user_id = ${userId}::uuid AND p.status = 'completed'
      )
      AND vi.id NOT IN (
        SELECT p.vault_item_id FROM purchases p
        WHERE p.user_id = ${userId}::uuid AND p.status = 'completed'
      )
      ORDER BY vi.created_at DESC
      LIMIT 50
    `;

    return NextResponse.json({
      items: items.map(i => ({ ...i, thumbnail_url: null, purchased: false })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
