import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const { price, stripeAccountId } = await request.json();
  const stripe = getStripe();

  try {
    const checkoutOptions: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'mxn',
          product_data: {
            name: 'Revelacion Mistica - Aura',
            description: 'Acceso a contenido exclusivo',
          },
          unit_amount: price * 100,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/`,
    };

    if (stripeAccountId && stripeAccountId !== 'primary') {
      checkoutOptions.payment_intent_data = {
        application_fee_amount: Math.round(price * 0.20 * 100),
        transfer_data: {
          destination: stripeAccountId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(checkoutOptions);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
