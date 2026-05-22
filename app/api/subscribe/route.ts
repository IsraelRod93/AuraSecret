import { NextRequest, NextResponse } from 'next/server';
import { getStripe, PRICES } from '@/lib/stripe';
import { getRequestUserId } from '@/lib/get-user-id';

export async function POST(request: NextRequest) {
  const userId = getRequestUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { plan } = await request.json();
  const stripe = getStripe();

  try {
    const origin = request.headers.get('origin') || 'https://aura-secret.vercel.app';
    const isMonthly = plan === 'monthly';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'mxn',
          product_data: {
            name: isMonthly ? 'AuraSecret Premium Mensual' : 'AuraSecret Premium Semanal',
            description: isMonthly
              ? 'Mensajes ilimitados por 1 mes — ahorra 37%'
              : 'Mensajes ilimitados por 1 semana',
          },
          unit_amount: isMonthly ? PRICES.SUBSCRIPTION_MONTHLY : PRICES.SUBSCRIPTION_WEEKLY,
          recurring: { interval: isMonthly ? 'month' : 'week' },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${origin}/payment-success?type=subscription`,
      cancel_url: `${origin}/gallery`,
      metadata: { userId, type: 'subscription', plan: isMonthly ? 'monthly' : 'weekly' },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Subscription failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
