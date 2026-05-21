import { NextRequest, NextResponse } from 'next/server';
import { createInvoiceLink, STAR_PRICES } from '@/lib/telegram-pay';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  const { type, userId, vaultItemId, companionId } = await request.json();

  try {
    let invoiceUrl: string;

    switch (type) {
      case 'gallery_unlock': {
        invoiceUrl = await createInvoiceLink({
          title: 'Desbloquear Galeria',
          description: 'Descubre mas conexiones especiales en Aura',
          payload: JSON.stringify({ type: 'gallery_unlock', userId }),
          prices: [{ label: 'Mas opciones', amount: STAR_PRICES.GALLERY_UNLOCK }],
        });
        break;
      }

      case 'subscription': {
        invoiceUrl = await createInvoiceLink({
          title: 'AuraSecret Premium',
          description: 'Mensajes ilimitados con todas tus conexiones por 1 semana',
          payload: JSON.stringify({ type: 'subscription', userId }),
          prices: [{ label: 'Premium semanal', amount: STAR_PRICES.SUBSCRIPTION_WEEKLY }],
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

        const starPrice = Math.max(1, Math.round(item.price / 100 * 3));

        invoiceUrl = await createInvoiceLink({
          title: item.title || 'Contenido exclusivo',
          description: `De ${item.companion_name || 'Aura'}`,
          payload: JSON.stringify({ type: 'vault_purchase', userId, vaultItemId, companionId: item.companion_id }),
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
