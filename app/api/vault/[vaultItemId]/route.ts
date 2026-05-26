import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getRequestUserId } from '@/lib/get-user-id';

export async function GET(
  request: NextRequest,
  { params }: { params: { vaultItemId: string } },
) {
  const userId = getRequestUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const itemId = params.vaultItemId;
  if (!itemId) {
    return NextResponse.json({ error: 'vaultItemId required' }, { status: 400 });
  }

  const sql = getDb();

  try {
    const [item] = await sql`
      SELECT file_url FROM vault_items
      WHERE id = ${itemId}::uuid
    `;

    if (!item || !item.file_url) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }

    const [purchase] = await sql`
      SELECT 1 FROM purchases
      WHERE user_id = ${userId}::uuid AND vault_item_id = ${itemId}::uuid AND status = 'completed'
      LIMIT 1
    `;

    if (!purchase) {
      return NextResponse.json({ error: 'No tienes acceso a este contenido' }, { status: 403 });
    }

    const assetResponse = await fetch(item.file_url);
    if (!assetResponse.ok) {
      return NextResponse.json({ error: 'No se pudo obtener el archivo' }, { status: 502 });
    }

    const headers = new Headers(assetResponse.headers);
    headers.set('cache-control', 'private, max-age=0, no-store');
    return new NextResponse(assetResponse.body, {
      status: assetResponse.status,
      headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener el archivo';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
