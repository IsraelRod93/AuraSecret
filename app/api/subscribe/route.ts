import { NextRequest, NextResponse } from 'next/server';
import { getStripe, PRICES } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  const { userId } = await request.json();
  const stripe = getStripe();

  try {
    const origin = request.headers.get('origin') || 'https://aura-secret.vercel.app';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'mxn',
          product_data: {
            name: 'AuraSecret Premium',
            description: 'Mensajes ilimitados con todas tus conexiones',
          },
          unit_amount: PRICES.SUBSCRIPTION_WEEKLY,
          recurring: { interval: 'week' },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${origin}/payment-success?type=subscription`,
      cancel_url: `${origin}/gallery`,
      metadata: { userId, type: 'subscription' },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Subscription failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
