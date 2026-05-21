import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getStripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  const { userId, vaultItemId } = await request.json();
  const db = getSupabase();
  const stripe = getStripe();

  try {
    const { data: item } = await db
      .from('vault_items')
      .select('*, companions!inner(name, stripe_account_id)')
      .eq('id', vaultItemId)
      .single();

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const origin = request.headers.get('origin') || '';
    const companionStripeId = (item as any).companions?.stripe_account_id;

    const checkoutOptions: any = {
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'mxn',
          product_data: {
            name: item.title || 'Contenido exclusivo',
            description: `De ${(item as any).companions?.name || 'Aura'}`,
          },
          unit_amount: item.price,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/vault/${item.companion_id}?purchased=${vaultItemId}`,
      cancel_url: `${origin}/vault/${item.companion_id}`,
      metadata: { userId, vaultItemId, type: 'vault_purchase' },
    };

    if (companionStripeId) {
      checkoutOptions.payment_intent_data = {
        application_fee_amount: Math.round(item.price * 0.20),
        transfer_data: { destination: companionStripeId },
      };
    }

    const session = await stripe.checkout.sessions.create(checkoutOptions);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Purchase failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
