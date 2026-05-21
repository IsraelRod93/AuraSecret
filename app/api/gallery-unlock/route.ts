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
            name: 'Mas opciones - Aura',
            description: 'Desbloquea mas conexiones especiales',
          },
          unit_amount: PRICES.GALLERY_UNLOCK,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/payment-success?type=gallery`,
      cancel_url: `${origin}/gallery`,
      metadata: { userId, type: 'gallery_unlock' },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
