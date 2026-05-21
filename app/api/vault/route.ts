import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const companionId = request.nextUrl.searchParams.get('companionId');
  const userId = request.nextUrl.searchParams.get('userId');

  if (!companionId) {
    return NextResponse.json({ error: 'companionId required' }, { status: 400 });
  }

  const sql = getDb();

  try {
    const items = await sql`
      SELECT id, type, title, price, thumbnail_url, description, file_url
      FROM vault_items
      WHERE companion_id = ${companionId}
      ORDER BY created_at DESC
    `;

    let purchasedIds: string[] = [];
    if (userId) {
      const purchases = await sql`
        SELECT vault_item_id FROM purchases
        WHERE user_id = ${userId} AND status = 'completed'
      `;
      purchasedIds = purchases.map(p => p.vault_item_id);
    }

    const enriched = items.map(item => ({
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
