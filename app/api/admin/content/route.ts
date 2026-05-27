import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

function auth(request: NextRequest) {
  const pw = request.headers.get('x-admin-password');
  return pw && pw === process.env.ADMIN_PASSWORD;
}

// GET — list vault items (includes approved flag)
export async function GET(request: NextRequest) {
  if (!auth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const sql = getDb();
  const items = await sql`
    SELECT
      v.id, v.type, v.title, v.price, v.file_url, v.created_at, v.approved,
      c.name AS companion_name, c.id AS companion_id
    FROM vault_items v
    JOIN companions c ON c.id = v.companion_id
    ORDER BY v.approved ASC, v.created_at DESC
    LIMIT 500
  `;

  return NextResponse.json({ items });
}

// PATCH — approve a single item
export async function PATCH(request: NextRequest) {
  if (!auth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { itemId } = await request.json();
  if (!itemId) return NextResponse.json({ error: 'itemId requerido' }, { status: 400 });

  const sql = getDb();
  await sql`UPDATE vault_items SET approved = true WHERE id = ${itemId}::uuid`;

  return NextResponse.json({ ok: true });
}

// POST — bulk approve all existing items (one-time action)
export async function POST(request: NextRequest) {
  if (!auth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const sql = getDb();
  const result = await sql`UPDATE vault_items SET approved = true WHERE approved = false RETURNING id`;

  return NextResponse.json({ ok: true, approved: result.length });
}

// DELETE — remove a single item
export async function DELETE(request: NextRequest) {
  if (!auth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { itemId } = await request.json();
  if (!itemId) return NextResponse.json({ error: 'itemId requerido' }, { status: 400 });

  const sql = getDb();
  await sql`DELETE FROM vault_items WHERE id = ${itemId}::uuid`;

  return NextResponse.json({ ok: true });
}
