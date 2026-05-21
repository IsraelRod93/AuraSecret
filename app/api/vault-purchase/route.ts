import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getStripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  const { userId, vaultItemId } = await request.json();
  const sql = getDb();
  const stripe = getStripe();

  try {
    const [item] = await sql`
      SELECT vi.*, c.name as companion_name, c.stripe_account_id
      FROM vault_items vi
      JOIN companions c ON c.id = vi.companion_id
      WHERE vi.id = ${vaultItemId}
      LIMIT 1
    `;

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const origin = request.headers.get('origin') || '';

    const checkoutOptions: any = {
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'mxn',
          product_data: {
            name: item.title || 'Contenido exclusivo',
            description: `De ${item.companion_name || 'Aura'}`,
          },
          unit_amount: item.price,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/payment-success?type=vault`,
      cancel_url: `${origin}/vault/${item.companion_id}`,
      metadata: { userId, vaultItemId, companionId: item.companion_id, type: 'vault_purchase' },
    };

    if (item.stripe_account_id) {
      checkoutOptions.payment_intent_data = {
        application_fee_amount: Math.round(item.price * 0.20),
        transfer_data: { destination: item.stripe_account_id },
      };
    }

    const session = await stripe.checkout.sessions.create(checkoutOptions);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Purchase failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
