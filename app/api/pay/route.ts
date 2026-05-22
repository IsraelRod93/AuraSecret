import { NextRequest, NextResponse } from 'next/server';
import { createInvoiceLink, STAR_PRICES } from '@/lib/telegram-pay';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  const { type, userId, vaultItemId, companionId, plan } = await request.json();

  try {
    let invoiceUrl: string;

    switch (type) {
      case 'gallery_unlock': {
        invoiceUrl = await createInvoiceLink({
          title: 'Desbloquear Galeria',
          description: 'Descubre mas conexiones especiales en Aura',
          payload: `g:${userId}`,
          prices: [{ label: 'Mas opciones', amount: STAR_PRICES.GALLERY_UNLOCK }],
        });
        break;
      }

      case 'subscription': {
        const isMonthly = plan === 'monthly';
        invoiceUrl = await createInvoiceLink({
          title: isMonthly ? 'AuraSecret Premium Mensual' : 'AuraSecret Premium Semanal',
          description: isMonthly
            ? 'Mensajes ilimitados por 1 mes — ahorra 37%'
            : 'Mensajes ilimitados por 1 semana',
          payload: `s:${userId}:${isMonthly ? 'm' : 'w'}`,
          prices: [{ label: isMonthly ? 'Premium mensual' : 'Premium semanal', amount: isMonthly ? STAR_PRICES.SUBSCRIPTION_MONTHLY : STAR_PRICES.SUBSCRIPTION_WEEKLY }],
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

        // item.price is in cents (e.g. 10000 = $100 MXN)
        // We want to charge roughly 2.5 Stars per $1 MXN to cover fees and match value.
        // Formula: (price_in_cents / 100) * 2.5
        const starPrice = Math.max(50, Math.round((item.price / 100) * 2.5));

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
