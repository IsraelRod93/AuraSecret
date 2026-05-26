import { NextRequest, NextResponse } from 'next/server';
import { createInvoiceLink, STAR_PRICES } from '@/lib/telegram-pay';
import { getDb } from '@/lib/db';
import { getRequestUserId } from '@/lib/get-user-id';

export async function POST(request: NextRequest) {
  const userId = getRequestUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { type, vaultItemId, companionId, plan } = await request.json();

  try {
    let invoiceUrl: string;

    switch (type) {
      case 'gallery_unlock':
      case 'subscription': {
        invoiceUrl = await createInvoiceLink({
          title: 'AuraSecret Premium',
          description: 'Mensajes ilimitados + perfiles ilimitados por 30 dias (~$30 MXN)',
          payload: `s:${userId}:m`,
          prices: [{ label: 'Premium mensual', amount: STAR_PRICES.SUBSCRIPTION }],
        });
        break;
      }

      case 'vault_purchase': {
        if (!vaultItemId) {
          return NextResponse.json({ error: 'vaultItemId required' }, { status: 400 });
        }

        const sql = getDb();
        const [item] = await sql`
          SELECT vi.*, c.name as companion_name
          FROM vault_items vi
          JOIN companions c ON c.id = vi.companion_id
          WHERE vi.id = ${vaultItemId}::uuid
          LIMIT 1
        `;

        if (!item) {
          return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        // item.price is stored as Stars * 100 (e.g. 5000 = 50 Stars)
        const starPrice = Math.max(1, Math.round(item.price / 100));

        invoiceUrl = await createInvoiceLink({
          title: item.title || 'Contenido exclusivo',
          description: `De ${item.companion_name || 'Aura'}`,
          payload: `v:${userId}:${vaultItemId}:${item.companion_id}`,
          prices: [{ label: item.title || 'Contenido', amount: starPrice }],
        });
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 });
    }

    return NextResponse.json({ invoiceUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
