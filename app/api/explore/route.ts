import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  const sql = getDb();

  try {
    const items = await sql`
      SELECT vi.id, vi.type, vi.title, vi.price, vi.thumbnail_url, vi.companion_id,
             c.name as companion_name, c.photo_url as companion_photo
      FROM vault_items vi
      JOIN companions c ON c.id = vi.companion_id AND c.status = 'active'
      ORDER BY vi.created_at DESC
      LIMIT 50
    `;

    let purchasedIds: string[] = [];
    if (userId) {
      const purchases = await sql`
        SELECT vault_item_id FROM purchases
        WHERE user_id = ${userId}::uuid AND status = 'completed'
      `;
      purchasedIds = purchases.map(p => p.vault_item_id);
    }

    const enriched = items.map(item => ({
      ...item,
      purchased: purchasedIds.includes(item.id),
    }));

    return NextResponse.json({ items: enriched });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
