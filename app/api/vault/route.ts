import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getRequestUserId } from '@/lib/get-user-id';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { type, title, price, fileUrl, groupName } = await request.json();
  const companionId = session.companionId;

  if (!fileUrl) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const sql = getDb();

  try {
    const [item] = await sql`
      INSERT INTO vault_items (companion_id, type, title, price, file_url, thumbnail_url, group_name)
      VALUES (${companionId}::uuid, ${type || 'photo'}, ${title || 'Foto exclusiva'}, ${price || 4900}, ${fileUrl}, ${fileUrl}, ${groupName || null})
      RETURNING *
    `;
    return NextResponse.json({ item });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create vault item';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { itemId, price, title, groupName } = await request.json();

  if (!itemId) {
    return NextResponse.json({ error: 'itemId required' }, { status: 400 });
  }

  const sql = getDb();

  try {
    const [item] = await sql`
      UPDATE vault_items SET
        price = COALESCE(${price ?? null}, price),
        title = COALESCE(${title ?? null}, title),
        group_name = ${groupName !== undefined ? groupName : null}
      WHERE id = ${itemId}::uuid AND companion_id = ${session.companionId}::uuid
      RETURNING *
    `;
    if (!item) return NextResponse.json({ error: 'No encontrado o sin permiso' }, { status: 403 });
    return NextResponse.json({ item });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { itemId } = await request.json();

  if (!itemId) {
    return NextResponse.json({ error: 'itemId required' }, { status: 400 });
  }

  const sql = getDb();

  try {
    await sql`
      DELETE FROM vault_items
      WHERE id = ${itemId}::uuid AND companion_id = ${session.companionId}::uuid
    `;
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const companionId = request.nextUrl.searchParams.get('companionId');
  const userId = getRequestUserId(request);

  if (!companionId) {
    return NextResponse.json({ error: 'companionId required' }, { status: 400 });
  }

  const sql = getDb();

  try {
    const items = await sql`
      SELECT id, type, title, price, thumbnail_url, description, file_url, group_name
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
